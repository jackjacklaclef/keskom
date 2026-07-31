import { useState, useEffect, useMemo } from "react";

import { GlobalStyle } from "./theme";
import { APPETITE_LEVELS, STORAGE_KEYS } from "./constants";
import type { AppUser } from "./types";

import { Icon, useToast, Toast } from "./components/ui";
import { Sidebar } from "./components/layout";
import { CalendarView, QuickPlanModal } from "./components/calendar";
import { RecipesView } from "./components/recipes";
import { ShoppingListView } from "./components/shopping";
import { PrivacyView } from "./components/privacy";
import { FamilySetupView, LoginView, RegisterView, ForgotPasswordView } from "./components/auth";
import { AccountView, NotificationsView } from "./components/account";
import { FamilyView } from "./components/family";
import { IngredientsView } from "./components/ingredients";
import { TemplatesView } from "./components/templates";
import { OnboardingTour } from "./components/onboarding";

import { getSupabase } from "./lib/supabaseClient";
import {
  loadFromStorage, saveToStorage, DEMO_FAMILY, generateInviteCode,
  initialRecipes, initialMealPlans, initialShoppingList, initialIngredients,
} from "./lib/storage";
import { AuthService } from "./lib/authService";
import {
  fetchIngredients, fetchRecipeCategoryMap, fetchIngredientCategoryMap, fetchUserPreferences,
  saveFoodRestrictions, saveDiets, fetchRecipesForUser, saveRecipeIngredients, saveRecipeSteps,
  fetchMealPlansForFamily, upsertMealSlot, fetchShoppingListForFamily, fetchWeekTemplatesForFamily,
  fetchFamiliesForUser, fetchFamilyAllergies,
} from "./lib/dataLayer";
import { todayStr, getMondayOf, dateOfSlot } from "./lib/dateUtils";

// ============================================================
// APP SHELL
// ============================================================


const App = () => {
  const [currentView, setCurrentView] = useState("calendar");
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.darkMode, false));

  // ── Auth — initialisé depuis AuthService, mis à jour via onAuthChange ──
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => AuthService.getSession());
  const [authScreen, setAuthScreen] = useState("login");

  useEffect(() => {
    // Abonnement aux changements d'auth (Supabase: remplacer par supabase.auth.onAuthStateChange)
    const unsubscribe = AuthService.onAuthChange((user) => {
      setCurrentUser(user);
      if (!user) setAuthScreen("login");
    });
    return unsubscribe;
  }, []);
  const [families, setFamilies] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.families, null);
    return stored || [DEMO_FAMILY];
  });
  // Évite d'afficher à tort l'écran « créer/rejoindre une famille » pendant le
  // court instant où les familles réelles sont encore en cours de chargement.
  const [familiesLoaded, setFamiliesLoaded] = useState(false);
  // Comptes réels : données chargées depuis Supabase via useEffect ci-dessous.
  // Compte démo : jeu de données local, comme avant.
  const isDemo = currentUser?.id === "demo";
  const [recipes, setRecipes] = useState<any[]>(() => isDemo ? initialRecipes : []);
  const [mealPlans, setMealPlans] = useState<any[]>(() => isDemo ? initialMealPlans : []);
  const [shoppingList, setShoppingList] = useState<any[]>(() => isDemo ? initialShoppingList : []);
  const [ingredients, setIngredients] = useState<any[]>(() => isDemo ? initialIngredients : []);
  const [weekTemplates, setWeekTemplates] = useState<any[]>(() => []);
  // Allergies de tous les membres de la famille active, { [memberId]: [{type, id}] } —
  // sert au contrôle ingrédients×allergies sur la carte de repas du planning.
  const [realFamilyAllergies, setRealFamilyAllergies] = useState<Record<string, any[]>>({});
  const [showFab, setShowFab] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Familles dont l'utilisateur est membre uniquement
  const userFamilies = useMemo(() =>
    families.filter((f) => f.members.some((m) => m.userId === currentUser?.id)),
  [families, currentUser]);

  // Famille active (parmi les familles de l'utilisateur uniquement)
  const activeFamily = useMemo(() =>
    userFamilies.find((f) => f.id === currentUser?.activeFamilyId) || userFamilies[0],
  [userFamilies, currentUser]);

  // Données filtrées par famille active
  const familyMealPlans = useMemo(() =>
    mealPlans.filter((mp) => mp.familyId === activeFamily?.id || !mp.familyId),
  [mealPlans, activeFamily]);
  const familyShoppingList = useMemo(() =>
    shoppingList.filter((i) => i.familyId === activeFamily?.id || !i.familyId),
  [shoppingList, activeFamily]);
  // Recettes visibles : globales + créées par l'user + partagées dans la famille active
  const familyRecipes = useMemo(() =>
    recipes.filter((r) => {
      if (r.scope === "global") return true;
      if (r.createdBy === currentUser?.id) return true;
      if (activeFamily && (r.sharedWith || []).includes(activeFamily.id)) return true;
      // Compat ancienne structure
      if (r.familyId === activeFamily?.id) return true;
      return false;
    }),
  [recipes, activeFamily, currentUser]);
  const familyWeekTemplates = useMemo(() =>
    weekTemplates.filter((t) => t.familyId === activeFamily?.id || t.userId === currentUser?.id || !t.familyId),
  [weekTemplates, activeFamily, currentUser]);

  const recentRecipeIds = useMemo(() => {
    const sorted = [...familyMealPlans].sort((a, b) => b.date.localeCompare(a.date));
    const seen = new Set();
    for (const mp of sorted) {
      for (const id of (mp.recipeIds || [])) {
        seen.add(id);
        if (seen.size >= 5) break;
      }
      if (seen.size >= 5) break;
    }
    return Array.from(seen);
  }, [familyMealPlans]);

  const { toast, showToast } = useToast();

  // Compte démo uniquement : ces données restent locales, donc persistées en localStorage.
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.recipes, recipes); }, [recipes, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.mealPlans, mealPlans); }, [mealPlans, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.shoppingList, shoppingList); }, [shoppingList, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.ingredients, ingredients); }, [ingredients, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.weekTemplates, weekTemplates); }, [weekTemplates, isDemo]);
  useEffect(() => saveToStorage(STORAGE_KEYS.darkMode, darkMode), [darkMode]);
  // Note: currentUser est persisté par AuthService, pas ici
  useEffect(() => saveToStorage(STORAGE_KEYS.families, families), [families]);

  // ── Chargement des familles réelles depuis Supabase (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || currentUser.id === "demo") return;
    let cancelled = false;
    setFamiliesLoaded(false);
    (async () => {
      const loaded = await fetchFamiliesForUser(currentUser);
      if (cancelled) return;
      if (loaded.length > 0) {
        const loadedIds = new Set(loaded.map((f) => f.id));
        setFamilies((prev) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
      }
      setFamiliesLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des ingrédients (catalogue global, comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => { const loaded = await fetchIngredients(); if (!cancelled) setIngredients(loaded); })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des préférences perso (régimes, allergies, aliments non appréciés) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => {
      const prefs = await fetchUserPreferences(currentUser.id);
      if (!cancelled) setCurrentUser((u) => u && { ...u, ...prefs });
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des recettes visibles par l'utilisateur (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => { const loaded = await fetchRecipesForUser(); if (!cancelled) setRecipes(loaded); })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Synchronisation temps réel des recettes (Realtime) — comptes non-démo ──
  // Une recette créée/modifiée/partagée par un autre membre de la famille apparaît
  // sans recharger. Pas de family_id unique sur "recipes" (global/privé/familial/
  // partagé), donc abonnement non filtré : RLS restreint déjà ce que ce client reçoit,
  // comme pour meal_plan_meals/meal_plan_meal_recipes.
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    let channel: any = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const loaded = await fetchRecipesForUser();
        if (!cancelled) setRecipes(loaded);
      }, 300);
    };

    (async () => {
      const sb = await getSupabase();
      if (!sb || cancelled) return;
      channel = sb
        .channel(`recipes-${currentUser.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipes" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_ingredients" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_steps" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_family_shares" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_variants" }, refetch)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) channel.unsubscribe();
    };
  }, [currentUser?.id, isDemo]);

  // ── Chargement des repas / courses / semaines types de la famille active (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo || !activeFamily?.id) return;
    let cancelled = false;
    (async () => {
      const [meals, shopping, templates] = await Promise.all([
        fetchMealPlansForFamily(activeFamily.id),
        fetchShoppingListForFamily(activeFamily.id),
        fetchWeekTemplatesForFamily(currentUser.id, activeFamily.id),
      ]);
      if (cancelled) return;
      setMealPlans(meals);
      setShoppingList(shopping);
      setWeekTemplates(templates);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id, isDemo, activeFamily?.id]);

  // ── Chargement des allergies de toute la famille active (comptes non-démo) ──
  // Passe par le RPC get_family_allergies (RLS self-only sur profile_food_restrictions).
  useEffect(() => {
    if (!currentUser || isDemo || !activeFamily?.id) return;
    let cancelled = false;
    (async () => {
      const allergies = await fetchFamilyAllergies(activeFamily.id);
      if (!cancelled) setRealFamilyAllergies(allergies);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id, isDemo, activeFamily?.id]);

  // Compte démo : famille locale à un seul membre, ses allergies sont déjà sur currentUser.
  const familyAllergies = useMemo(() => {
    if (!isDemo) return realFamilyAllergies;
    const selfMember = activeFamily?.members.find((m: any) => m.userId === currentUser?.id);
    if (!selfMember || !currentUser?.allergies?.length) return {};
    return { [selfMember.memberId]: currentUser.allergies };
  }, [isDemo, activeFamily, currentUser]);

  // ── Synchronisation temps réel du planning (Realtime) — comptes non-démo ──
  // Si un autre membre de la famille modifie le planning, on le voit sans recharger.
  // Refetch complet plutôt qu'un patch fin : plus simple et fiable, le volume de
  // données d'un planning familial est trop faible pour que ça coûte quoi que ce soit.
  useEffect(() => {
    if (!currentUser || isDemo || !activeFamily?.id) return;
    let cancelled = false;
    let channel: any = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const meals = await fetchMealPlansForFamily(activeFamily.id);
        if (!cancelled) setMealPlans(meals);
      }, 300);
    };

    (async () => {
      const sb = await getSupabase();
      if (!sb || cancelled) return;
      channel = sb
        .channel(`meal-plans-${activeFamily.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plans", filter: `family_id=eq.${activeFamily.id}` }, refetch)
        // meal_plan_meals / meal_plan_meal_recipes n'ont pas de family_id direct (via
        // meal_plan_id / meal_plan_meal_id) : pas de filtre possible côté Realtime,
        // mais RLS restreint déjà ce que ce client reçoit à sa propre famille.
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plan_meals" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plan_meal_recipes" }, refetch)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) channel.unsubscribe();
    };
  }, [currentUser?.id, isDemo, activeFamily?.id]);

  // ── Auth — délègue à AuthService (swappable Supabase) ──
  const handleLogin = async (email: string, password: string) => {
    const { user, error } = await AuthService.signIn(email, password);
    if (error) throw new Error(error);
    setCurrentUser(user);
  };

  const handleRegister = async (
    name: string, email: string, password: string,
    consents: { consentGeneral: boolean; consentSensitive: boolean; consentDate: string }
  ) => {
    const { user, error } = await AuthService.signUp(name, email, password, consents);
    if (error) throw new Error(error);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setCurrentUser(null);
    setAuthScreen("login");
  };

  // ---- Famille ----
  const handleCreateFamily = async (name: string) => {
    if (currentUser.id === "demo") {
      const newFamily = {
        id: Date.now().toString(),
        name,
        inviteCode: generateInviteCode(),
        ownerId: currentUser.id,
        members: [{ memberId: currentUser.id, userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "admin" }],
      };
      setFamilies((prev: any[]) => [...prev, newFamily]);
      AuthService.updateProfile(currentUser.id, { activeFamilyId: newFamily.id });
      showToast(`Famille « ${name} » créée`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data: familyRow, error: familyError } = await sb
      .from("families")
      .insert({ owner_profile_id: currentUser.id, name, invite_code: generateInviteCode() })
      .select("*")
      .single();
    if (familyError) throw new Error(familyError.message);

    const { data: memberRow, error: memberError } = await sb
      .from("family_members")
      .insert({ family_id: familyRow.family_id, profile_id: currentUser.id, name: currentUser.name })
      .select("*")
      .single();
    if (memberError) throw new Error(memberError.message);

    const { error: profileError } = await sb
      .from("profiles")
      .update({ active_family_id: familyRow.family_id })
      .eq("profile_id", currentUser.id);
    if (profileError) throw new Error(profileError.message);

    const newFamily = {
      id: familyRow.family_id,
      name: familyRow.name,
      inviteCode: familyRow.invite_code,
      ownerId: familyRow.owner_profile_id,
      members: [{ memberId: memberRow.member_id, userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "admin" }],
    };
    setFamilies((prev: any[]) => [...prev.filter((f) => f.id !== newFamily.id), newFamily]);
    setCurrentUser((u: any) => u && { ...u, activeFamilyId: newFamily.id });
    showToast(`Famille « ${name} » créée`, "sage");
  };

  const handleAddFamilyMemberByEmail = async (familyId: string, email: string) => {
    if (currentUser.id === "demo") throw new Error("Ajout par email indisponible pour le compte démo.");

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await sb.rpc("add_family_member_by_email", { p_family_id: familyId, p_email: normalizedEmail });
    if (error) {
      const messages: Record<string, string> = {
        not_authorized: "Seul le créateur de la famille peut ajouter des membres.",
        user_not_found: "Aucun utilisateur trouvé avec cet email.",
        already_member: "Cette personne est déjà membre de la famille.",
      };
      throw new Error(messages[error.message] || error.message);
    }

    setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
      ...f,
      members: [...f.members, {
        memberId: data.member_id,
        userId: data.profile_id,
        userName: data.name,
        userEmail: normalizedEmail,
        role: "member",
      }],
    }));
    showToast(`${data.name} a été ajouté(e) à la famille`, "sage");
  };

  const handleAddLocalFamilyMember = async (familyId: string, name: string) => {
    const trimmedName = name.trim();
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: [...f.members, { memberId: `local-${Date.now()}`, userId: null, userName: trimmedName, userEmail: "", role: "member" }],
      }));
      showToast(`${trimmedName} ajouté(e) à la famille`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data, error } = await sb
      .from("family_members")
      .insert({ family_id: familyId, name: trimmedName })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
      ...f,
      members: [...f.members, { memberId: data.member_id, userId: null, userName: data.name, userEmail: "", role: "member" }],
    }));
    showToast(`${trimmedName} ajouté(e) à la famille`, "sage");
  };

  // Un membre choisit son propre avatar — appliqué à toutes ses familles (RPC
  // SECURITY DEFINER : un membre normal n'a pas le droit de modifier sa ligne
  // family_members via RLS classique, seul le propriétaire de la famille l'a).
  const handleSetMyAvatar = async (emoji: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => ({
        ...f,
        members: f.members.map((m: any) => m.userId === currentUser.id ? { ...m, avatarEmoji: emoji } : m),
      })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("set_my_avatar", { p_avatar_emoji: emoji });
      if (error) throw error;
      const loaded = await fetchFamiliesForUser(currentUser);
      const loadedIds = new Set(loaded.map((f) => f.id));
      setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
    } catch { showToast("Erreur lors de la mise à jour de l'avatar", "clay"); }
  };

  // L'admin choisit l'avatar d'un membre sans compte (couvert par la policy existante
  // "gestion des membres par le propriétaire").
  const handleSetMemberAvatar = async (familyId: string, memberId: string, emoji: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => (m.memberId || m.userId) === memberId ? { ...m, avatarEmoji: emoji } : m),
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("family_members").update({ avatar_emoji: emoji }).eq("member_id", memberId);
      if (error) throw error;
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => m.memberId === memberId ? { ...m, avatarEmoji: emoji } : m),
      }));
    } catch { showToast("Erreur lors de la mise à jour de l'avatar", "clay"); }
  };

  // Un membre choisit son propre appétit (RPC set_my_appetite, comme set_my_avatar).
  const handleSetMyAppetite = async (appetite: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => ({
        ...f,
        members: f.members.map((m: any) => m.userId === currentUser.id ? { ...m, appetite } : m),
      })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("set_my_appetite", { p_appetite: appetite });
      if (error) throw error;
      const loaded = await fetchFamiliesForUser(currentUser);
      const loadedIds = new Set(loaded.map((f) => f.id));
      setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
    } catch { showToast("Erreur lors de la mise à jour de l'appétit", "clay"); }
  };

  // Assignation par un tiers : l'admin peut le faire pour un membre sans compte ;
  // n'importe quel membre peut le faire pour un membre AVEC compte tant que celui-ci
  // ne l'a pas déjà renseigné lui-même (verrouillage géré côté RPC).
  const handleAssignMemberAppetite = async (familyId: string, memberId: string, appetite: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => (m.memberId || m.userId) === memberId ? { ...m, appetite } : m),
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("assign_member_appetite", { p_member_id: memberId, p_appetite: appetite });
      if (error) {
        const messages: Record<string, string> = {
          already_set: "Ce membre a déjà renseigné son appétit — seul lui peut le modifier.",
          not_authorized: "Vous n'avez pas le droit de modifier l'appétit de ce membre.",
        };
        throw new Error(messages[error.message] || error.message);
      }
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => m.memberId === memberId ? { ...m, appetite } : m),
      }));
    } catch (err: any) { showToast(err.message || "Erreur lors de la mise à jour de l'appétit", "clay"); }
  };

  const handleJoinFamily = async (code: string) => {
    if (currentUser.id === "demo") {
      const allFamilies: any[] = loadFromStorage(STORAGE_KEYS.families, [DEMO_FAMILY]);
      const allUnique = [...allFamilies];
      if (!allUnique.some((f) => f.id === DEMO_FAMILY.id)) allUnique.push(DEMO_FAMILY);
      const target = allUnique.find((f) => f.inviteCode === code);
      if (!target) throw new Error("Code invalide ou famille introuvable.");
      if (target.members.some((m: any) => m.userId === currentUser.id)) throw new Error("Vous êtes déjà membre de cette famille.");
      const updated = { ...target, members: [...target.members, { userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "member" }] };
      setFamilies((prev: any[]) => prev.some((f) => f.id === target.id) ? prev.map((f) => f.id === target.id ? updated : f) : [...prev, updated]);
      AuthService.updateProfile(currentUser.id, { activeFamilyId: target.id });
      showToast(`Vous avez rejoint « ${target.name} »`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data, error } = await sb.rpc("join_family_by_code", { p_invite_code: code });
    if (error) {
      const messages: Record<string, string> = {
        invalid_code: "Code invalide ou famille introuvable.",
        already_member: "Vous êtes déjà membre de cette famille.",
      };
      throw new Error(messages[error.message] || error.message);
    }
    const joined = data?.[0];

    const loaded = await fetchFamiliesForUser(currentUser);
    const loadedIds = new Set(loaded.map((f) => f.id));
    setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);

    await sb.from("profiles").update({ active_family_id: joined?.family_id }).eq("profile_id", currentUser.id);
    setCurrentUser((u: any) => u && { ...u, activeFamilyId: joined?.family_id });
    showToast(`Vous avez rejoint « ${joined?.name} »`, "sage");
  };

  const handleSetActiveFamily = (familyId: string) => {
    AuthService.updateProfile(currentUser.id, { activeFamilyId: familyId });
  };

  const handleLeaveFamily = async (familyId) => {
    if (currentUser.id !== "demo") {
      const sb = await getSupabase();
      if (!sb) { showToast("Connexion à la base indisponible", "clay"); return; }
      const { error } = await sb.from("family_members").delete().eq("family_id", familyId).eq("profile_id", currentUser.id);
      if (error) { showToast("Erreur lors du départ de la famille", "clay"); return; }
    }
    setFamilies((prev) => {
      const updated = prev.map((f) => f.id === familyId
        ? { ...f, members: f.members.filter((m) => m.userId !== currentUser.id) }
        : f
      );
      // Recalculer la famille active depuis l'état mis à jour
      const remaining = updated.filter((f) => f.id !== familyId && f.members.some((m) => m.userId === currentUser.id));
      const newActive = remaining[0]?.id || null;
      setCurrentUser((u) => ({ ...u, activeFamilyId: newActive }));
      return updated;
    });
    showToast("Vous avez quitté la famille", "sage");
  };

  // Seul le propriétaire peut promouvoir (policy "gestion des membres par le
  // propriétaire", ALL sur family_members) — un co-admin promu obtient le badge et
  // partage l'admin visuellement, mais n'hérite pas des droits de gestion des membres.
  const handlePromoteMember = async (familyId, userId) => {
    if (currentUser.id === "demo") {
      setFamilies((prev) => prev.map((f) => f.id !== familyId ? f : {
        ...f, members: f.members.map((m) => ({ ...m, role: m.userId === userId ? "admin" : m.role }))
      }));
      showToast("Membre promu admin", "sage");
      return;
    }
    try {
      const family = families.find((f) => f.id === familyId);
      const member = family?.members.find((m) => m.userId === userId);
      if (!member?.memberId) throw new Error("no_member_row");
      const sb = await getSupabase();
      const { error } = await sb.from("family_members").update({ role: "admin" }).eq("member_id", member.memberId);
      if (error) throw error;
      setFamilies((prev) => prev.map((f) => f.id !== familyId ? f : {
        ...f, members: f.members.map((m) => m.userId === userId ? { ...m, role: "admin" } : m)
      }));
      showToast("Membre promu admin", "sage");
    } catch { showToast("Erreur lors de la promotion", "clay"); }
  };

  const handleRemoveMember = async (familyId, memberId) => {
    if (currentUser.id !== "demo") {
      const sb = await getSupabase();
      if (!sb) { showToast("Connexion à la base indisponible", "clay"); return; }
      const { error } = await sb.from("family_members").delete().eq("member_id", memberId);
      if (error) { showToast("Erreur lors de la suppression du membre", "clay"); return; }
    }
    setFamilies((prev) => prev.map((f) => {
      if (f.id !== familyId) return f;
      const remaining = f.members.filter((m) => (m.memberId || m.userId) !== memberId);
      // Si plus d'admin, promouvoir le premier membre
      const hasAdmin = remaining.some((m) => m.role === "admin");
      return { ...f, members: hasAdmin ? remaining : remaining.map((m, i) => i === 0 ? { ...m, role: "admin" } : m) };
    }));
    showToast("Membre retiré", "sage");
  };

  const handleRegenerateCode = (familyId) => {
    setFamilies((prev) => prev.map((f) => f.id === familyId ? { ...f, inviteCode: generateInviteCode() } : f));
    showToast("Nouveau code généré", "sage");
  };

  // ---- Recettes ----
  const handleAddRecipe = async (recipe) => {
    if (isDemo) {
      setRecipes((prev) => [...prev, {
        ...recipe, id: recipe.id || Date.now().toString(), createdBy: currentUser?.id,
        scope: "shared", sharedWith: activeFamily ? [activeFamily.id] : [],
        parentId: recipe.parentId || null, rootId: recipe.rootId || null, variantName: recipe.variantName || null,
      }]);
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { data: newRow, error } = await sb.from("recipes").insert({
        name: recipe.name, description: recipe.description || null, portions: recipe.portions || 4, tags: recipe.tags || [],
        scope: activeFamily ? "family" : "private", owner_profile_id: currentUser.id, family_id: activeFamily?.id || null,
        recipe_category_id: categoryMap[recipe.category] || null, created_by: currentUser.id, variant_name: recipe.variantName || null,
      }).select("id").single();
      if (error) throw error;
      await saveRecipeIngredients(sb, newRow.id, recipe.ingredients || []);
      await saveRecipeSteps(sb, newRow.id, recipe.steps || []);
      if (recipe.parentId) {
        await sb.from("recipe_variants").insert({
          variant_recipe_id: newRow.id, parent_recipe_id: Number(recipe.parentId),
          master_recipe_id: Number(recipe.rootId || recipe.parentId), created_by: currentUser.id,
        });
      }
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors de l'enregistrement de la recette", "clay"); }
  };

  const handleEditRecipe = async (updated) => {
    if (isDemo) {
      setRecipes((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { error } = await sb.from("recipes").update({
        name: updated.name, description: updated.description || null, portions: updated.portions || 4,
        tags: updated.tags || [], recipe_category_id: categoryMap[updated.category] || null, variant_name: updated.variantName || null,
      }).eq("id", Number(updated.id));
      if (error) throw error;
      await saveRecipeIngredients(sb, Number(updated.id), updated.ingredients || []);
      await saveRecipeSteps(sb, Number(updated.id), updated.steps || []);
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors de la modification de la recette", "clay"); }
  };

  const handleDeleteRecipe = async (id) => {
    if (isDemo) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setMealPlans((prev) => prev.map((mp) => ({ ...mp, recipeIds: (mp.recipeIds || []).filter((rid) => rid !== id) })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("recipes").delete().eq("id", Number(id));
      if (error) throw error;
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (activeFamily?.id) setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la suppression de la recette", "clay"); }
  };

  const handleImportRecipe = async (recipe) => {
    if (isDemo) {
      setRecipes((prev) => [...prev, {
        ...recipe, id: Date.now().toString(), createdBy: currentUser?.id, scope: "shared",
        sharedWith: activeFamily ? [activeFamily.id] : [], parentId: null, rootId: null, variantName: null,
      }]);
      showToast(`« ${recipe.name} » ajoutée à ${activeFamily?.name}`, "sage");
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { data: newRow, error } = await sb.from("recipes").insert({
        name: recipe.name, description: recipe.description || null, portions: recipe.portions || 4, tags: recipe.tags || [],
        scope: activeFamily ? "family" : "private", owner_profile_id: currentUser.id, family_id: activeFamily?.id || null,
        recipe_category_id: categoryMap[recipe.category] || null, created_by: currentUser.id,
      }).select("id").single();
      if (error) throw error;
      await saveRecipeIngredients(sb, newRow.id, recipe.ingredients || []);
      await saveRecipeSteps(sb, newRow.id, recipe.steps || []);
      setRecipes(await fetchRecipesForUser());
      showToast(`« ${recipe.name} » ajoutée à ${activeFamily?.name}`, "sage");
    } catch { showToast("Erreur lors de l'import de la recette", "clay"); }
  };

  const handleCreateVariant = (originalRecipe) => {
    const rootId = originalRecipe.rootId || originalRecipe.id;
    return {
      ...originalRecipe,
      id: Date.now().toString(),
      parentId: originalRecipe.id,
      rootId,
      createdBy: currentUser?.id,
      scope: "shared",
      sharedWith: activeFamily ? [activeFamily.id] : [],
      variantName: `Variante de ${originalRecipe.name}`,
    };
  };

  const handleShareRecipe = async (recipeId, familyId) => {
    if (isDemo) {
      setRecipes((prev) => prev.map((r) => {
        if (r.id !== recipeId) return r;
        const already = (r.sharedWith || []).includes(familyId);
        return {
          ...r,
          scope: already ? (r.sharedWith.length <= 1 ? "private" : "shared") : "shared",
          sharedWith: already ? (r.sharedWith || []).filter((id) => id !== familyId) : [...(r.sharedWith || []), familyId],
        };
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { data: existing } = await sb.from("recipe_family_shares").select("recipe_id").eq("recipe_id", Number(recipeId)).eq("family_id", familyId).maybeSingle();
      if (existing) {
        await sb.from("recipe_family_shares").delete().eq("recipe_id", Number(recipeId)).eq("family_id", familyId);
      } else {
        await sb.from("recipe_family_shares").insert({ recipe_id: Number(recipeId), family_id: familyId });
      }
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors du partage de la recette", "clay"); }
  };

  // ---- Repas ----
  const handleAddMeal = async (mealData) => {
    const date = mealData?.date || todayStr();
    const type = mealData?.type || "lunch";
    const recipeIds = mealData?.recipeIds || [];
    const status = mealData?.status || "normal";
    const attendeeIds = mealData?.attendeeIds;
    if (isDemo) {
      const resolvedAttendeeIds = attendeeIds ?? (activeFamily?.members || []).map((m: any) => m.memberId || m.userId).filter(Boolean);
      setMealPlans((prev) => [...prev, { id: Date.now().toString(), date, recipeIds, type, status, attendeeIds: resolvedAttendeeIds, familyId: activeFamily?.id }]);
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, date, type, recipeIds, status, attendeeIds);
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la planification du repas", "clay"); }
  };

  const handleUpdateMeal = async (mealId, recipeIds, status = "normal", attendeeIds?: string[]) => {
    if (isDemo) {
      setMealPlans((prev) => prev.map((mp) => mp.id === mealId ? { ...mp, recipeIds, status, ...(attendeeIds !== undefined ? { attendeeIds } : {}) } : mp));
      return;
    }
    const existing = mealPlans.find((mp) => mp.id === mealId);
    if (!existing || !activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, existing.date, existing.type, recipeIds, status, attendeeIds);
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la mise à jour du repas", "clay"); }
  };

  // ---- Déplacer / échanger un créneau (drag and drop) ----
  const handleMoveMeal = async (sourceDateStr, sourceType, destDateStr, destType) => {
    if (sourceDateStr === destDateStr && sourceType === destType) return;
    const isSlotEmpty = (mp) => !mp || (mp.status === "normal" && (mp.recipeIds || []).length === 0);
    const sourceMeal = familyMealPlans.find((mp) => mp.date === sourceDateStr && mp.type === sourceType);
    if (isSlotEmpty(sourceMeal)) return;
    const destMeal = familyMealPlans.find((mp) => mp.date === destDateStr && mp.type === destType);

    const sourceData = { recipeIds: sourceMeal.recipeIds || [], status: sourceMeal.status || "normal", attendeeIds: sourceMeal.attendeeIds };
    const destData = isSlotEmpty(destMeal)
      ? { recipeIds: [], status: "normal", attendeeIds: undefined }
      : { recipeIds: destMeal.recipeIds || [], status: destMeal.status || "normal", attendeeIds: destMeal.attendeeIds };

    if (isDemo) {
      setMealPlans((prev) => {
        let next = prev.map((mp) => {
          if (mp.id === sourceMeal.id) return { ...mp, recipeIds: destData.recipeIds, status: destData.status, ...(destData.attendeeIds !== undefined ? { attendeeIds: destData.attendeeIds } : {}) };
          if (destMeal && mp.id === destMeal.id) return { ...mp, recipeIds: sourceData.recipeIds, status: sourceData.status, ...(sourceData.attendeeIds !== undefined ? { attendeeIds: sourceData.attendeeIds } : {}) };
          return mp;
        });
        if (!destMeal) {
          const resolvedAttendeeIds = sourceData.attendeeIds ?? (activeFamily?.members || []).map((m: any) => m.memberId || m.userId).filter(Boolean);
          next = [...next, { id: `mv-${Date.now()}`, date: destDateStr, type: destType, recipeIds: sourceData.recipeIds, status: sourceData.status, attendeeIds: resolvedAttendeeIds, familyId: activeFamily?.id }];
        }
        return next;
      });
      return;
    }

    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, destDateStr, destType, sourceData.recipeIds, sourceData.status, sourceData.attendeeIds);
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, sourceDateStr, sourceType, destData.recipeIds, destData.status, destData.attendeeIds);
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors du déplacement du repas", "clay"); }
  };

  // ---- Courses ----
  const handleAddShoppingItem = async (item) => {
    if (isDemo) {
      setShoppingList((prev) => [...prev, { id: Date.now().toString(), name: item.name, quantity: item.quantity, completed: false, familyId: activeFamily?.id }]);
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("shopping_list_items")
        .insert({ family_id: activeFamily.id, name: item.name, quantity: item.quantity, created_by: currentUser.id })
        .select("*").single();
      if (error) throw error;
      setShoppingList((prev) => [...prev, { id: String(data.id), name: data.name, quantity: data.quantity, completed: data.completed, familyId: activeFamily.id }]);
    } catch { showToast("Erreur lors de l'ajout à la liste de courses", "clay"); }
  };

  const handleToggleShoppingItem = async (id) => {
    if (isDemo) {
      setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
      return;
    }
    const current = shoppingList.find((i) => i.id === id);
    if (!current) return;
    setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").update({ completed: !current.completed }).eq("id", Number(id));
      if (error) throw error;
    } catch {
      showToast("Erreur lors de la mise à jour", "clay");
      setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: current.completed } : item));
    }
  };

  const handleDeleteShoppingItem = async (id) => {
    if (isDemo) { setShoppingList((prev) => prev.filter((item) => item.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").delete().eq("id", Number(id));
      if (error) throw error;
      setShoppingList((prev) => prev.filter((item) => item.id !== id));
    } catch { showToast("Erreur lors de la suppression", "clay"); }
  };

  const handleGenerateShoppingList = async (from, to) => {
    const startStr = from || todayStr();
    const endDate = new Date((to || startStr) + "T12:00:00");
    endDate.setDate(endDate.getDate() + 1);
    const endStr = endDate.toISOString().split("T")[0];
    const upcomingMeals = familyMealPlans.filter((mp) => mp.date >= startStr && mp.date < endStr);
    if (upcomingMeals.length === 0) {
      showToast(`Aucune recette planifiée sur cette période`, "berry"); return;
    }
    const parseQty = (str) => { const m = str.match(/^([\d.,/]+)\s*(.*)/); if (!m) return null; const num = parseFloat(m[1].replace(",",".")); return isNaN(num) ? null : { num, unit: m[2].trim() }; };
    const addQty = (a, b) => { const pa = parseQty(a), pb = parseQty(b); if (pa && pb && pa.unit === pb.unit) { const sum = Math.round((pa.num+pb.num)*10)/10; const noSpace = /^(g|kg|ml|L|cl|dl)$/.test(pa.unit); return `${Number.isInteger(sum)?sum:sum}${noSpace?"":pa.unit?" ":""}${pa.unit}`.trim(); } return `${a} + ${b}`; };
    const memberById = new Map((activeFamily?.members || []).map((m) => [m.memberId || m.userId, m]));
    const appetiteMultiplierOf = (m) => APPETITE_LEVELS.find((l) => l.id === m?.appetite)?.multiplier ?? 1;
    const aggregated = new Map(); let recipeCount = 0;
    upcomingMeals.forEach((meal) => {
      (meal.recipeIds || []).forEach((recipeId) => {
        const recipe = familyRecipes.find((r) => r.id === recipeId); if (!recipe) return;
        recipeCount++;
        const attendeeIds = meal.attendeeIds?.length ? meal.attendeeIds : (activeFamily?.members || []).map((m) => m.memberId || m.userId);
        // Portions pondérées par appétit (Vorace ×1.3 / Normal ×1 / Moineaux ×0.8) plutôt qu'un simple headcount.
        const weightedParts = attendeeIds.reduce((sum, id) => sum + appetiteMultiplierOf(memberById.get(id)), 0);
        const multiplier = Math.max(1, weightedParts) / (recipe.portions || 4);
        recipe.ingredients.forEach((ing) => {
          const key = ing.ingredientName;
          const parsed = parseQty(ing.quantity);
          let qty = ing.quantity;
          if (parsed && Math.abs(multiplier - 1) > 0.01) { const adj = Math.round(parsed.num * multiplier * 10)/10; qty = `${Number.isInteger(adj)?adj:adj}${parsed.unit?" "+parsed.unit:""}`.trim(); }
          aggregated.set(key, aggregated.has(key) ? addQty(aggregated.get(key), qty) : qty);
        });
      });
    });
    if (isDemo) {
      let addedCount = 0;
      setShoppingList((prev) => {
        const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
        const additions = []; aggregated.forEach((quantity, name) => { if (existingNames.has(name.toLowerCase())) return; additions.push({ id: `${Date.now()}-${name}`, name, quantity, completed: false, familyId: activeFamily?.id }); });
        addedCount = additions.length; return [...prev, ...additions];
      });
      setTimeout(() => { addedCount === 0 ? showToast("Tous les ingrédients sont déjà dans la liste","sage") : showToast(`${addedCount} article${addedCount>1?"s":""} ajouté${addedCount>1?"s":""} depuis ${recipeCount} recette${recipeCount>1?"s":""}`, "sage"); }, 0);
      return;
    }
    if (!activeFamily?.id) return;
    const existingNames = new Set(shoppingList.map((i) => i.name.toLowerCase()));
    const additions = [];
    aggregated.forEach((quantity, name) => { if (!existingNames.has(name.toLowerCase())) additions.push({ family_id: activeFamily.id, name, quantity, created_by: currentUser.id }); });
    if (additions.length === 0) { showToast("Tous les ingrédients sont déjà dans la liste", "sage"); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").insert(additions);
      if (error) throw error;
      setShoppingList(await fetchShoppingListForFamily(activeFamily.id));
      showToast(`${additions.length} article${additions.length>1?"s":""} ajouté${additions.length>1?"s":""} depuis ${recipeCount} recette${recipeCount>1?"s":""}`, "sage");
    } catch { showToast("Erreur lors de la génération de la liste", "clay"); }
  };

  // ---- Ingrédients ----
  const handleAddIngredient = async (ing) => {
    if (isDemo) { setIngredients((prev) => [...prev, ing]); return; }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchIngredientCategoryMap();
      const { data, error } = await sb.from("ingredients").insert({ name: ing.name, ingredient_category_id: categoryMap[ing.category] }).select("id").single();
      if (error) throw error;
      setIngredients((prev) => [...prev, { id: String(data.id), name: ing.name, category: ing.category }]);
    } catch { showToast("Erreur lors de l'ajout de l'ingrédient", "clay"); }
  };

  const handleDeleteIngredient = async (id) => {
    if (familyRecipes.some((r) => r.ingredients?.some((i) => i.ingredientId === id))) {
      alert("Cet ingrédient est utilisé dans une recette."); return;
    }
    if (isDemo) { setIngredients((prev) => prev.filter((i) => i.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("ingredients").delete().eq("id", Number(id));
      if (error) throw error;
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch { alert("Cet ingrédient est utilisé dans une recette."); }
  };

  // ---- Semaines types ----
  const handleSaveTemplate = async (tpl) => {
    if (isDemo) {
      setWeekTemplates((prev) => {
        const base = { ...tpl, familyId: tpl.scope === "family" ? activeFamily?.id : undefined, userId: tpl.scope === "user" ? currentUser?.id : undefined };
        const idx = prev.findIndex((t) => t.id === base.id);
        return idx >= 0 ? prev.map((t) => t.id === base.id ? base : t) : [...prev, base];
      });
      return;
    }
    const isExisting = weekTemplates.some((t) => t.id === tpl.id);
    try {
      const sb = await getSupabase();
      const payload = {
        name: tpl.name, scope: tpl.scope,
        family_id: tpl.scope === "family" ? activeFamily?.id : null,
        profile_id: tpl.scope === "user" ? currentUser.id : null,
        slots: tpl.slots, created_by: currentUser.id,
      };
      if (isExisting) {
        const { error } = await sb.from("week_templates").update(payload).eq("id", Number(tpl.id));
        if (error) throw error;
      } else {
        const { error } = await sb.from("week_templates").insert(payload);
        if (error) throw error;
      }
      setWeekTemplates(await fetchWeekTemplatesForFamily(currentUser.id, activeFamily?.id || null));
    } catch { showToast("Erreur lors de l'enregistrement du modèle", "clay"); }
  };

  const handleDeleteTemplate = async (id) => {
    if (isDemo) { setWeekTemplates((prev) => prev.filter((t) => t.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("week_templates").delete().eq("id", Number(id));
      if (error) throw error;
      setWeekTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { showToast("Erreur lors de la suppression du modèle", "clay"); }
  };

  const handleApplyTemplate = async (template, weekStart, mode) => {
    const monday = getMondayOf(new Date(weekStart + "T12:00:00"));
    const slotsToApply = template.slots.filter((slot) => {
      if (mode === "merge") {
        const date = dateOfSlot(monday, slot.day);
        return !mealPlans.some((mp) => mp.date === date && mp.type === slot.type && (mp.recipeIds || []).length > 0);
      }
      return true;
    });
    if (isDemo) {
      setMealPlans((prev) => {
        let base = prev;
        if (mode === "overwrite") {
          const affected = new Set(template.slots.map((s) => dateOfSlot(monday, s.day)));
          base = prev.filter((mp) => !affected.has(mp.date) || !template.slots.some((s) => s.type === mp.type && dateOfSlot(monday, s.day) === mp.date));
        }
        const additions = slotsToApply.map((slot) => ({ id: `tpl-${Date.now()}-${slot.day}-${slot.type}`, date: dateOfSlot(monday, slot.day), type: slot.type, recipeIds: slot.recipeIds, status: slot.status || "normal", familyId: activeFamily?.id }));
        return [...base, ...additions];
      });
      showToast(`${slotsToApply.length} créneau${slotsToApply.length>1?"x":""} appliqué${slotsToApply.length>1?"s":""}`, "sage");
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      for (const slot of slotsToApply) {
        await upsertMealSlot(sb, activeFamily.id, currentUser.id, dateOfSlot(monday, slot.day), slot.type, slot.recipeIds, slot.status || "normal");
      }
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${slotsToApply.length} créneau${slotsToApply.length>1?"x":""} appliqué${slotsToApply.length>1?"s":""}`, "sage");
    } catch { showToast("Erreur lors de l'application du modèle", "clay"); }
  };

  // ---- Duplication / vidage semaine ----
  const handleDuplicateWeek = async (srcDateStr, targetMondayStr) => {
    const monday = getMondayOf(new Date(srcDateStr + "T12:00:00"));
    const targetMonday = new Date(targetMondayStr + "T12:00:00");
    const weekMeals = familyMealPlans.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === monday.toISOString().split("T")[0]);
    if (weekMeals.length === 0) { showToast("Aucun repas à dupliquer", "berry"); return; }

    const targets = weekMeals.map((mp) => {
      const offset = Math.round((new Date(mp.date + "T12:00:00") - monday) / 86400000);
      const newDate = new Date(targetMonday); newDate.setDate(targetMonday.getDate() + offset);
      return { newDateStr: newDate.toISOString().split("T")[0], type: mp.type, recipeIds: [...(mp.recipeIds || [])], status: mp.status || "normal", attendeeIds: mp.attendeeIds };
    });

    if (isDemo) {
      const base = Date.now();
      setMealPlans((prev) => {
        const additions = targets.map((t, idx) => {
          if (prev.some((p) => p.date === t.newDateStr && p.type === t.type && (p.recipeIds || []).length > 0)) return null;
          return { id: `dup-${base}-${idx}`, date: t.newDateStr, type: t.type, recipeIds: t.recipeIds, status: t.status, attendeeIds: t.attendeeIds, familyId: activeFamily?.id };
        }).filter(Boolean);
        return [...prev, ...additions];
      });
      showToast(`${weekMeals.length} repas dupliqué${weekMeals.length > 1 ? "s" : ""}`, "sage");
      return;
    }

    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      for (const t of targets) {
        if (mealPlans.some((p) => p.date === t.newDateStr && p.type === t.type && (p.recipeIds || []).length > 0)) continue;
        await upsertMealSlot(sb, activeFamily.id, currentUser.id, t.newDateStr, t.type, t.recipeIds, t.status, t.attendeeIds);
      }
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${weekMeals.length} repas dupliqué${weekMeals.length > 1 ? "s" : ""}`, "sage");
    } catch { showToast("Erreur lors de la duplication de la semaine", "clay"); }
  };

  const handleClearWeek = async (dateStr) => {
    const mondayDate = getMondayOf(new Date(dateStr + "T12:00:00"));
    const mondayStr = mondayDate.toISOString().split("T")[0];
    const sundayDate = new Date(mondayDate); sundayDate.setDate(mondayDate.getDate() + 6);
    const sundayStr = sundayDate.toISOString().split("T")[0];

    if (isDemo) {
      setMealPlans((prev) => {
        const removed = prev.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId));
        showToast(`${removed.length} repas supprimé${removed.length>1?"s":""}`, "berry");
        return prev.filter((mp) => !(getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId)));
      });
      return;
    }

    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      const removedCount = mealPlans.filter((mp) => mp.date >= mondayStr && mp.date <= sundayStr).length;
      const { error } = await sb.from("meal_plans").delete().eq("family_id", activeFamily.id).gte("date", mondayStr).lte("date", sundayStr);
      if (error) throw error;
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${removedCount} repas supprimé${removedCount>1?"s":""}`, "berry");
    } catch { showToast("Erreur lors de la suppression de la semaine", "clay"); }
  };

  const handleUpdateUserProfile = async (updates: Partial<AppUser>) => {
    if (!currentUser) return;
    const { diets, allergies, dislikes, ...profileUpdates } = updates as any;

    if (isDemo) {
      AuthService.updateProfile(currentUser.id, updates);
      return;
    }

    try {
      const sb = await getSupabase();
      if (sb && diets !== undefined) {
        await saveDiets(sb, currentUser.id, diets);
        setCurrentUser((u) => u && { ...u, diets });
      }
      if (sb && allergies !== undefined) {
        await saveFoodRestrictions(sb, currentUser.id, "allergy", allergies);
        setCurrentUser((u) => u && { ...u, allergies });
      }
      if (sb && dislikes !== undefined) {
        await saveFoodRestrictions(sb, currentUser.id, "dislike", dislikes);
        setCurrentUser((u) => u && { ...u, dislikes });
      }
    } catch { showToast("Erreur lors de la mise à jour des préférences", "clay"); }

    if (Object.keys(profileUpdates).length > 0) {
      AuthService.updateProfile(currentUser.id, profileUpdates);
      // setCurrentUser mis à jour automatiquement via onAuthChange pour ces champs
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    // Supprimer les données liées
    setRecipes((prev) => prev.filter((r: any) => r.createdBy !== currentUser.id));
    setMealPlans((prev) => prev.filter((mp: any) => mp.familyId !== activeFamily?.id));
    setFamilies((prev) => prev
      .map((f: any) => ({ ...f, members: f.members.filter((m: any) => m.userId !== currentUser.id) }))
      .filter((f: any) => f.members.length > 0)
    );
    AuthService.deleteAccount(currentUser.id);
  };

  const viewProps = {
    calendar: { mealPlans: familyMealPlans, recipes: familyRecipes, onAddMeal: handleAddMeal, onUpdateMeal: handleUpdateMeal, onMoveMeal: handleMoveMeal, recentRecipeIds, weekTemplates: familyWeekTemplates, onApplyTemplate: handleApplyTemplate, onDuplicateWeek: handleDuplicateWeek, onClearWeek: handleClearWeek, onNavigate: setCurrentView, familyMembers: activeFamily?.members || [], ingredients, familyAllergies },
    recipes: { recipes: familyRecipes, allRecipes: recipes, globalRecipes: isDemo ? initialRecipes : recipes.filter((r) => r.scope === "global"), ingredients, currentUser, userFamilies, activeFamily, onAddRecipe: handleAddRecipe, onEditRecipe: handleEditRecipe, onDeleteRecipe: handleDeleteRecipe, onImportRecipe: handleImportRecipe, onCreateVariant: handleCreateVariant, onShareRecipe: handleShareRecipe, activeFamilyId: activeFamily?.id },
    shopping: { shoppingList: familyShoppingList, ingredients, onAddItem: handleAddShoppingItem, onToggleItem: handleToggleShoppingItem, onDeleteItem: handleDeleteShoppingItem, onGenerate: handleGenerateShoppingList },
    ingredients: { ingredients, onAddIngredient: handleAddIngredient, onDeleteIngredient: handleDeleteIngredient },
    templates: { weekTemplates: familyWeekTemplates, recipes: familyRecipes, recentRecipeIds, activeFamily, onSaveTemplate: handleSaveTemplate, onDeleteTemplate: handleDeleteTemplate, onApplyTemplate: handleApplyTemplate },
    family: { families: userFamilies, currentUser, ingredients, onCreateFamily: handleCreateFamily, onJoinFamily: handleJoinFamily, onLeaveFamily: handleLeaveFamily, onSetActiveFamily: handleSetActiveFamily, onPromoteMember: handlePromoteMember, onRemoveMember: handleRemoveMember, onRegenerateCode: handleRegenerateCode, onAddMemberByEmail: handleAddFamilyMemberByEmail, onAddLocalMember: handleAddLocalFamilyMember, onSetMyAvatar: handleSetMyAvatar, onSetMemberAvatar: handleSetMemberAvatar, onSetMyAppetite: handleSetMyAppetite, onAssignMemberAppetite: handleAssignMemberAppetite },
    account: { currentUser, activeFamily, ingredients, onLogout: handleLogout, onDeleteAccount: handleDeleteAccount, onUpdateUserProfile: handleUpdateUserProfile, onSetMyAvatar: handleSetMyAvatar, onReplayOnboarding: () => setShowOnboarding(true) },
  };

  const renderView = () => {
    switch (currentView) {
      case "calendar": return <CalendarView {...viewProps.calendar} />;
      case "recipes": return <RecipesView {...viewProps.recipes} />;
      case "shopping": return <ShoppingListView {...viewProps.shopping} />;
      case "ingredients": return <IngredientsView {...viewProps.ingredients} />;
      case "templates": return <TemplatesView {...viewProps.templates} />;
      case "family": return <FamilyView {...viewProps.family} />;
      case "notifications": return <NotificationsView />;
      case "privacy": return <PrivacyView onBack={() => setCurrentView("account")} />;
      case "account": return <AccountView {...viewProps.account} />;
      default: return <CalendarView {...viewProps.calendar} />;
    }
  };

  // Chargement en cours des familles réelles : on ne sait pas encore si l'utilisateur en a une.
  const familiesLoading = currentUser && currentUser.id !== "demo" && !familiesLoaded;

  // L'utilisateur est connecté mais n'est membre d'aucune famille → FamilySetupView obligatoire
  // (basé sur l'appartenance réelle via userFamilies, pas sur activeFamilyId qui peut être
  // absent/périmé même quand l'utilisateur a bien une famille)
  const needsFamilySetup = currentUser && currentUser.id !== "demo" && familiesLoaded && userFamilies.length === 0;
  const mainAppVisible = currentUser && !needsFamilySetup && !familiesLoading;

  // Visite guidée : une fois par utilisateur (par navigateur), à la première arrivée sur l'app principale.
  // Exception — le compte démo la réaffiche à chaque connexion : il sert de vitrine à des
  // visiteurs différents à chaque essai, pas à un utilisateur récurrent.
  useEffect(() => {
    if (!mainAppVisible || !currentUser) return;
    if (currentUser.id === "demo") { setShowOnboarding(true); return; }
    const seen = loadFromStorage(STORAGE_KEYS.onboardingSeen, []);
    if (!seen.includes(currentUser.id)) setShowOnboarding(true);
  }, [mainAppVisible, currentUser?.id]);

  const handleFinishOnboarding = () => {
    if (currentUser && currentUser.id !== "demo") {
      const seen = loadFromStorage(STORAGE_KEYS.onboardingSeen, []);
      if (!seen.includes(currentUser.id)) saveToStorage(STORAGE_KEYS.onboardingSeen, [...seen, currentUser.id]);
    }
    setShowOnboarding(false);
  };

  return (
    <div className={`mp-root${darkMode ? " dark" : ""}`}>
      <GlobalStyle />

      {/* Auth */}
      {!currentUser && authScreen === "login" && <LoginView onLogin={handleLogin} onGoRegister={() => setAuthScreen("register")} onGoForgot={() => setAuthScreen("forgot")} />}
      {!currentUser && authScreen === "register" && <RegisterView onRegister={handleRegister} onGoLogin={() => setAuthScreen("login")} />}
      {!currentUser && authScreen === "forgot" && <ForgotPasswordView onGoLogin={() => setAuthScreen("login")} />}

      {/* Chargement des familles réelles (bref instant après connexion) */}
      {familiesLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <p className="mp-small mp-text-faint">Chargement…</p>
        </div>
      )}

      {/* Setup famille obligatoire */}
      {needsFamilySetup && <FamilySetupView currentUser={currentUser} onCreateFamily={handleCreateFamily} onJoinFamily={handleJoinFamily} />}

      {/* App principale */}
      {currentUser && !needsFamilySetup && !familiesLoading && (
        <>
          <div className="mp-shell">
            <Sidebar currentView={currentView} onNavigate={setCurrentView} darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} currentUser={currentUser} onLogout={handleLogout} families={userFamilies} activeFamily={activeFamily} onSetActiveFamily={handleSetActiveFamily} />
            <main className="mp-main">{renderView()}</main>
          </div>

          <button type="button" className="mp-fab mp-hide-desktop" onClick={() => setShowFab(true)} aria-label="Planifier un repas">
            <Icon name="plus" size={22} />
          </button>

          {showFab && (
            <QuickPlanModal recipes={familyRecipes} recentRecipeIds={recentRecipeIds} familyMembers={activeFamily?.members || []} onClose={() => setShowFab(false)}
              onSave={(mealData) => { handleAddMeal(mealData); setShowFab(false); showToast(`Repas planifié le ${mealData.date}`); }} />
          )}

          <Toast toast={toast} />

          {showOnboarding && <OnboardingTour onClose={handleFinishOnboarding} />}
        </>
      )}
    </div>
  );
};

export default App;
