import type { AppUser } from "../types";
import { getSupabase } from "./supabaseClient";

// ============================================================
// DONNÉES — ingrédients, recettes, repas, courses, semaines types
// ============================================================
// Chargées depuis Supabase pour les comptes réels ; le compte démo garde son
// jeu de données local (aucune ligne ne lui correspond en base).

// ---- Ingrédients (catalogue global, lecture publique) ----
export const fetchIngredients = async (): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("ingredients").select("id, name, ingredient_categories(short_name)");
  if (error || !data) return [];
  return data.map((i: any) => ({ id: String(i.id), name: i.name, category: i.ingredient_categories?.short_name }));
};

// ---- Catégories de recettes (mapping short_name -> id, mis en cache) ----
let _recipeCategoryMap: Record<string, number> | null = null;
export const fetchRecipeCategoryMap = async (): Promise<Record<string, number>> => {
  if (_recipeCategoryMap) return _recipeCategoryMap;
  const sb = await getSupabase();
  if (!sb) return {};
  const { data, error } = await sb.from("recipe_categories").select("id, short_name");
  if (error || !data) return {};
  _recipeCategoryMap = Object.fromEntries(data.map((c: any) => [c.short_name, c.id]));
  return _recipeCategoryMap;
};

// ---- Catégories d'ingrédients (mapping short_name -> id, mis en cache) ----
let _ingredientCategoryMap: Record<string, number> | null = null;
export const fetchIngredientCategoryMap = async (): Promise<Record<string, number>> => {
  if (_ingredientCategoryMap) return _ingredientCategoryMap;
  const sb = await getSupabase();
  if (!sb) return {};
  const { data, error } = await sb.from("ingredient_categories").select("id, short_name");
  if (error || !data) return {};
  _ingredientCategoryMap = Object.fromEntries(data.map((c: any) => [c.short_name, c.id]));
  return _ingredientCategoryMap;
};

// ---- Régimes alimentaires (mapping short_name -> id, mis en cache) ----
let _dietMap: Record<string, number> | null = null;
export const fetchDietMap = async (): Promise<Record<string, number>> => {
  if (_dietMap) return _dietMap;
  const sb = await getSupabase();
  if (!sb) return {};
  const { data, error } = await sb.from("diets").select("id, short_name");
  if (error || !data) return {};
  _dietMap = Object.fromEntries(data.map((d: any) => [d.short_name, d.id]));
  return _dietMap;
};

// ---- Préférences perso (régimes, allergies, aliments non appréciés) ----
export const fetchUserPreferences = async (profileId: string): Promise<{ diets: string[]; allergies: any[]; dislikes: any[] }> => {
  const sb = await getSupabase();
  if (!sb) return { diets: [], allergies: [], dislikes: [] };
  const [{ data: dietRows }, { data: restrictionRows }] = await Promise.all([
    sb.from("profile_diets").select("diets(short_name)").eq("profile_id", profileId),
    sb.from("profile_food_restrictions")
      .select("restriction_type, item_type, ingredient_id, ingredient_categories(short_name)")
      .eq("profile_id", profileId),
  ]);

  const diets = (dietRows || []).map((d: any) => d.diets?.short_name).filter(Boolean);
  const allergies: any[] = [];
  const dislikes: any[] = [];
  (restrictionRows || []).forEach((r: any) => {
    const item = r.item_type === "ingredient"
      ? { type: "ingredient", id: String(r.ingredient_id) }
      : { type: "category", id: r.ingredient_categories?.short_name };
    if (!item.id) return;
    (r.restriction_type === "allergy" ? allergies : dislikes).push(item);
  });
  return { diets, allergies, dislikes };
};

// Allergies de tous les membres d'une famille (pour le contrôle ingrédients×allergies
// sur la carte de repas). RLS sur profile_food_restrictions est self-only : passe par
// le RPC SECURITY DEFINER get_family_allergies plutôt qu'une requête directe.
// Retourne { [memberId]: [{type, id}, ...] } — même forme que allergies/dislikes ci-dessus.
export const fetchFamilyAllergies = async (familyId: string): Promise<Record<string, any[]>> => {
  const sb = await getSupabase();
  if (!sb) return {};
  const { data, error } = await sb.rpc("get_family_allergies", { p_family_id: familyId });
  if (error || !data) return {};
  const byMember: Record<string, any[]> = {};
  data.forEach((r: any) => {
    const item = r.item_type === "ingredient"
      ? { type: "ingredient", id: String(r.ingredient_id) }
      : { type: "category", id: r.category_short_name };
    if (!item.id) return;
    (byMember[r.member_id] ||= []).push(item);
  });
  return byMember;
};

// Remplace entièrement les allergies OU les aliments non appréciés d'un profil.
export const saveFoodRestrictions = async (sb: any, profileId: string, restrictionType: "allergy" | "dislike", items: any[]) => {
  await sb.from("profile_food_restrictions").delete().eq("profile_id", profileId).eq("restriction_type", restrictionType);
  if (items.length === 0) return;
  const categoryMap = await fetchIngredientCategoryMap();
  const rows = items
    .map((item: any) => ({
      profile_id: profileId,
      restriction_type: restrictionType,
      item_type: item.type,
      ingredient_id: item.type === "ingredient" ? Number(item.id) : null,
      ingredient_category_id: item.type === "category" ? (categoryMap[item.id] ?? null) : null,
    }))
    .filter((row: any) => row.ingredient_id || row.ingredient_category_id);
  if (rows.length > 0) await sb.from("profile_food_restrictions").insert(rows);
};

// Remplace entièrement les régimes alimentaires d'un profil.
export const saveDiets = async (sb: any, profileId: string, diets: string[]) => {
  await sb.from("profile_diets").delete().eq("profile_id", profileId);
  if (diets.length === 0) return;
  const dietMap = await fetchDietMap();
  const rows = diets.map((d: string) => ({ profile_id: profileId, diet_id: dietMap[d] })).filter((r: any) => r.diet_id);
  if (rows.length > 0) await sb.from("profile_diets").insert(rows);
};

// ---- Recettes (globales + privées + familiales + partagées, filtrées par RLS) ----
export const fetchRecipesForUser = async (): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data: rows, error } = await sb
    .from("recipes")
    .select(`
      id, name, description, portions, tags, scope, owner_profile_id, family_id, variant_name,
      origin_country, prep_minutes, cook_minutes, photo_url, photo_attribution,
      recipe_categories(short_name),
      recipe_ingredients(ingredient_id, quantity_label, order_index, ingredients(name)),
      recipe_family_shares(family_id),
      recipe_steps(id, order_index, title, body, timer_seconds, media_url)
    `)
    .order("name");
  if (error || !rows) return [];

  const ids = rows.map((r: any) => r.id);
  const { data: variantRows } = ids.length
    ? await sb.from("recipe_variants").select("variant_recipe_id, parent_recipe_id, master_recipe_id").in("variant_recipe_id", ids)
    : { data: [] };
  const variantById = Object.fromEntries((variantRows || []).map((v: any) => [v.variant_recipe_id, v]));

  return rows.map((r: any) => {
    const variant = variantById[r.id];
    const sharedWith = [r.family_id, ...(r.recipe_family_shares || []).map((s: any) => s.family_id)].filter(Boolean).map(String);
    return {
      id: String(r.id),
      name: r.name,
      description: r.description || "",
      portions: r.portions,
      originCountry: r.origin_country || null,
      prepMinutes: r.prep_minutes ?? null,
      cookMinutes: r.cook_minutes ?? null,
      photoUrl: r.photo_url || null,
      photoAttribution: r.photo_attribution || null,
      tags: r.tags || [],
      category: r.recipe_categories?.short_name,
      scope: r.scope,
      createdBy: r.owner_profile_id,
      familyId: r.family_id ? String(r.family_id) : null,
      sharedWith,
      parentId: variant ? String(variant.parent_recipe_id) : null,
      rootId: variant ? String(variant.master_recipe_id) : null,
      variantName: r.variant_name || null,
      ingredients: (r.recipe_ingredients || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ri: any) => ({ ingredientId: String(ri.ingredient_id), ingredientName: ri.ingredients?.name, quantity: ri.quantity_label })),
      steps: (r.recipe_steps || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => ({ id: String(s.id), title: s.title || "", body: s.body, timerSeconds: s.timer_seconds || null, mediaUrl: s.media_url || null })),
    };
  });
};

// Remplace entièrement les recipe_ingredients d'une recette (l'éditeur envoie toujours la liste complète).
export const saveRecipeIngredients = async (sb: any, recipeId: number, ingredients: any[]) => {
  await sb.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  if (ingredients.length === 0) return;
  const { data: allIngredients } = await sb.from("ingredients").select("id, name");
  const idByName = Object.fromEntries((allIngredients || []).map((i: any) => [i.name, i.id]));
  const rows = ingredients
    .map((ing: any, idx: number) => ({
      recipe_id: recipeId,
      ingredient_id: Number(ing.ingredientId) || idByName[ing.ingredientName],
      quantity_label: ing.quantity,
      order_index: idx,
    }))
    .filter((row) => row.ingredient_id);
  if (rows.length > 0) await sb.from("recipe_ingredients").insert(rows);
};

// Remplace entièrement les étapes d'une recette (même principe que les ingrédients).
export const saveRecipeSteps = async (sb: any, recipeId: number, steps: any[]) => {
  await sb.from("recipe_steps").delete().eq("recipe_id", recipeId);
  if (steps.length === 0) return;
  const rows = steps
    .filter((s: any) => s.body?.trim())
    .map((s: any, idx: number) => ({
      recipe_id: recipeId,
      order_index: idx,
      title: s.title?.trim() || null,
      body: s.body.trim(),
      timer_seconds: s.timerSeconds || null,
      media_url: s.mediaUrl || null,
    }));
  if (rows.length > 0) await sb.from("recipe_steps").insert(rows);
};

// ---- Repas planifiés (à plat : un élément par créneau date+type) ----
export const fetchMealPlansForFamily = async (familyId: string): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("meal_plans")
    .select("id, date, meal_plan_meals(id, meal_type, status, meal_plan_meal_attendees(member_id), meal_plan_meal_recipes(recipe_id, order_index))")
    .eq("family_id", familyId);
  if (error || !data) return [];

  const flat: any[] = [];
  data.forEach((mp: any) => {
    (mp.meal_plan_meals || []).forEach((meal: any) => {
      flat.push({
        id: String(meal.id),
        date: mp.date,
        type: meal.meal_type,
        status: meal.status,
        attendeeIds: (meal.meal_plan_meal_attendees || []).map((a: any) => String(a.member_id)),
        recipeIds: (meal.meal_plan_meal_recipes || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((r: any) => String(r.recipe_id)),
        familyId,
      });
    });
  });
  return flat;
};

// Crée/à jour le créneau (date, type) d'une famille avec sa liste de recettes.
// attendeeIds: member_id des convives réellement présents (undefined = ne pas toucher
// la sélection existante en mise à jour ; sur un nouveau créneau, toute la famille par défaut).
export const upsertMealSlot = async (
  sb: any, familyId: string, userId: string,
  date: string, type: string, recipeIds: string[], status: string, attendeeIds?: string[]
) => {
  let { data: mp } = await sb.from("meal_plans").select("id").eq("family_id", familyId).eq("date", date).maybeSingle();
  if (!mp) {
    const { data: newMp, error } = await sb.from("meal_plans").insert({ family_id: familyId, date, created_by: userId }).select("id").single();
    if (error) throw new Error(error.message);
    mp = newMp;
  }

  let { data: meal } = await sb.from("meal_plan_meals").select("id").eq("meal_plan_id", mp.id).eq("meal_type", type).maybeSingle();
  const isNewMeal = !meal;
  if (!meal) {
    const { data: newMeal, error } = await sb
      .from("meal_plan_meals").insert({ meal_plan_id: mp.id, meal_type: type, status, updated_by: userId }).select("id").single();
    if (error) throw new Error(error.message);
    meal = newMeal;
  } else {
    await sb.from("meal_plan_meals").update({ status, updated_by: userId }).eq("id", meal.id);
  }

  if (attendeeIds !== undefined) {
    await sb.from("meal_plan_meal_attendees").delete().eq("meal_plan_meal_id", meal.id);
    if (attendeeIds.length > 0) {
      await sb.from("meal_plan_meal_attendees").insert(attendeeIds.map((memberId) => ({ meal_plan_meal_id: meal.id, member_id: memberId })));
    }
  } else if (isNewMeal) {
    // Nouveau créneau sans sélection explicite (ex: application d'un modèle) : toute la famille par défaut.
    const { data: members } = await sb.from("family_members").select("member_id").eq("family_id", familyId);
    if (members?.length) {
      await sb.from("meal_plan_meal_attendees").insert(members.map((m: any) => ({ meal_plan_meal_id: meal.id, member_id: m.member_id })));
    }
  }

  await sb.from("meal_plan_meal_recipes").delete().eq("meal_plan_meal_id", meal.id);
  if (recipeIds.length > 0) {
    await sb.from("meal_plan_meal_recipes").insert(
      recipeIds.map((rid, idx) => ({ meal_plan_meal_id: meal.id, recipe_id: Number(rid), order_index: idx }))
    );
  }
  return meal.id;
};

// ---- Liste de courses (par famille) ----
export const fetchShoppingListForFamily = async (familyId: string): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("shopping_list_items").select("*").eq("family_id", familyId).order("created_at");
  if (error || !data) return [];
  return data.map((i: any) => ({ id: String(i.id), name: i.name, quantity: i.quantity, completed: i.completed, familyId }));
};

// ---- Semaines types (par famille ou par utilisateur) ----
export const fetchWeekTemplatesForFamily = async (userId: string, familyId: string | null): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  const orParts = [`profile_id.eq.${userId}`];
  if (familyId) orParts.push(`family_id.eq.${familyId}`);
  const { data, error } = await sb.from("week_templates").select("*").or(orParts.join(","));
  if (error || !data) return [];
  return data.map((t: any) => ({
    id: String(t.id),
    name: t.name,
    scope: t.scope,
    familyId: t.family_id ? String(t.family_id) : undefined,
    userId: t.profile_id ? String(t.profile_id) : undefined,
    slots: t.slots || [],
  }));
};

// Charge toutes les familles dont le profil est membre (public.families + public.family_members).
// Un profil peut appartenir à plusieurs familles : l'appartenance vit uniquement dans
// family_members, pas dans profiles.family_id (qui reste toujours null).
export const fetchFamiliesForUser = async (user: AppUser): Promise<any[]> => {
  const sb = await getSupabase();
  if (!sb) return [];
  try {
    const { data: memberOf } = await sb.from("family_members").select("family_id").eq("profile_id", user.id);
    const { data: owned } = await sb.from("families").select("family_id").eq("owner_profile_id", user.id);

    const familyIds = Array.from(new Set([
      ...((memberOf || []).map((m: any) => m.family_id)),
      ...((owned || []).map((f: any) => f.family_id)),
    ]));
    if (familyIds.length === 0) return [];

    const { data: familyRows } = await sb.from("families").select("*").in("family_id", familyIds);
    const { data: allMemberRows } = await sb.from("family_members").select("*").in("family_id", familyIds);

    return (familyRows || []).map((familyRow: any) => {
      const members = (allMemberRows || [])
        .filter((m: any) => m.family_id === familyRow.family_id)
        .map((m: any) => ({
          memberId: m.member_id,
          userId: m.profile_id,
          userName: m.name,
          userEmail: m.profile_id === user.id ? user.email : "",
          avatarEmoji: m.avatar_emoji,
          appetite: m.appetite,
          role: m.profile_id === familyRow.owner_profile_id ? "admin" : m.role,
        }));
      // Garantit que l'utilisateur courant apparaît, même sans ligne family_members dédiée.
      if (!members.some((m) => m.userId === user.id)) {
        members.push({
          memberId: null,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          avatarEmoji: null,
          appetite: null,
          role: user.id === familyRow.owner_profile_id ? "admin" : "member",
        });
      }
      return {
        id: familyRow.family_id,
        name: familyRow.name,
        inviteCode: familyRow.invite_code,
        ownerId: familyRow.owner_profile_id,
        members,
      };
    });
  } catch {
    return [];
  }
};
