import type { AppUser, AuthResult, AuthChangeCallback } from "../types";
import { STORAGE_KEYS } from "../constants";
import { getSupabase } from "./supabaseClient";
import { loadFromStorage, saveToStorage, DEMO_USER, DEMO_PASSWORD } from "./storage";

// ============================================================
// AUTH SERVICE — swappable localStorage ↔ Supabase
// ============================================================
//
// Interface publique :
//   AuthService.signIn(email, password)  → Promise<AuthResult>
//   AuthService.signUp(name, email, password, consents) → Promise<AuthResult>
//   AuthService.signOut()                → void
//   AuthService.getSession()             → AppUser | null
//   AuthService.onAuthChange(cb)         → () => void (unsubscribe)
//
// Pour migrer vers Supabase : remplacer le corps de chaque méthode.
// L'interface reste identique — App ne change pas d'une ligne.
// ============================================================

// ============================================================
// AUTH SERVICE — Supabase
// ============================================================

// Convertit un profil Supabase en AppUser front
const profileToAppUser = (session: any, profile: any): AppUser => ({
  id: session.user.id,
  name: profile?.name || session.user.email?.split("@")[0] || "",
  email: session.user.email || "",
  activeFamilyId: profile?.active_family_id || profile?.family_id || null,
  consentGeneral:  profile?.consent_general  || false,
  consentSensitive: profile?.consent_sensitive || false,
  consentDate:     profile?.consent_date      || null,
  preferences: [],
  allergies:   [],
  dislikes:    [],
  diets:       [],
  rules:       [],
});

// Charge le profil depuis public.profiles
const fetchProfile = async (userId: string) => {
  const sb = await getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("profile_id", userId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

// Crée ou récupère un profil Supabase si la table est accessible.
const ensureProfile = async (sb: any, userId: string, fallbackName: string, fallbackEmail: string) => {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  try {
    const payload = {
      profile_id: userId,
      name: fallbackName || fallbackEmail?.split("@")[0] || "",
      active_family_id: null,
      consent_general: false,
      consent_sensitive: false,
      consent_date: null,
    };

    const { data, error } = await sb
      .from("profiles")
      .upsert(payload, { onConflict: "profile_id" })
      .select("*")
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const AuthService = (() => {
  const listeners: AuthChangeCallback[] = [];
  const notify = (user: AppUser | null) => listeners.forEach((cb) => cb(user));

  // Abonnement interne au changement de session Supabase
  let _unsubSupabase: (() => void) | null = null;
  let _listenerInitialized = false;
  const initSupabaseListener = async () => {
    if (_listenerInitialized || _unsubSupabase) return;
    const sb = await getSupabase();
    if (!sb || _unsubSupabase) return;
    _listenerInitialized = true;
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (!session) {
          // Le compte démo n'a jamais de session Supabase : l'événement initial
          // "pas de session" de ce listener (déclenché à l'abonnement, en tâche de
          // fond dès le montage de l'app, y compris après un simple rechargement de
          // page) arrive de façon asynchrone et peut donc survenir *après* qu'une
          // session démo a déjà été établie (au login) ou restaurée (au rechargement,
          // via getSession() → localStorage) — sans cette garde, il écrase la session
          // démo en cours quelques centaines de ms plus tard (repéré en vérifiant les
          // captures d'écran de la visite guidée : le compte démo revenait
          // systématiquement à l'écran de connexion peu après "Essayer", et aussi
          // après un simple rechargement). On vérifie le localStorage plutôt qu'un
          // état interne : c'est la seule source de vérité pour "suis-je le compte
          // démo ?" qui reste valide même juste après un rechargement de page (avant
          // que ce module n'ait lui-même revu passer la moindre notification).
          if (loadFromStorage(STORAGE_KEYS.currentUser, null)?.id === "demo") return;
          notify(null);
          return;
        }
        try {
          const profile = await ensureProfile(sb, session.user.id, session.user.user_metadata?.name || session.user.email?.split("@")[0] || "", session.user.email || "");
          notify(profileToAppUser(session, profile));
        } catch {
          notify(profileToAppUser(session, null));
        }
      }
    );
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        const profile = await ensureProfile(sb, session.user.id, session.user.user_metadata?.name || session.user.email?.split("@")[0] || "", session.user.email || "");
        notify(profileToAppUser(session, profile));
      }
    } catch {
      // ignore and rely on the listener
    }
    _unsubSupabase = () => subscription.unsubscribe();
  };

  return {
    // ── Connexion ──────────────────────────────────────────
    signIn: async (email: string, password: string): Promise<AuthResult> => {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const normalizedPassword = (password || "").trim();

      // Compte démo réservé pour la démo locale uniquement.
      if (normalizedEmail === DEMO_USER.email && normalizedPassword === DEMO_PASSWORD) {
        const demoUser = { ...DEMO_USER };
        saveToStorage(STORAGE_KEYS.currentUser, demoUser);
        notify(demoUser);
        return { user: demoUser, error: null };
      }

      void initSupabaseListener();
      const sb = await getSupabase();
      if (!sb) return { user: null, error: "Client Supabase non initialisé." };
      const { data, error } = await sb.auth.signInWithPassword({ email: normalizedEmail, password: normalizedPassword });
      if (error) return { user: null, error: error.message };
      const profile = await ensureProfile(sb, data.user.id, data.user.user_metadata?.name || data.user.email?.split("@")[0] || "", data.user.email || "");
      const user = profileToAppUser(data.session, profile);
      saveToStorage(STORAGE_KEYS.currentUser, user);
      notify(user);
      return { user, error: null };
    },

    // ── Inscription ────────────────────────────────────────
    signUp: async (
      name: string,
      email: string,
      password: string,
      consents: { consentGeneral: boolean; consentSensitive: boolean; consentDate: string }
    ): Promise<AuthResult> => {
      void initSupabaseListener();
      const sb = await getSupabase();
      if (!sb) return { user: null, error: "Client Supabase non initialisé." };
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            consent_general:   consents.consentGeneral,
            consent_sensitive: consents.consentSensitive,
            consent_date:      consents.consentDate,
          },
        },
      });
      if (error) return { user: null, error: error.message };
      if (!data.session) {
        // Supabase a envoyé un email de confirmation
        return { user: null, error: "Un email de confirmation a été envoyé. Vérifiez votre boîte mail." };
      }
      const profile = await ensureProfile(sb, data.user.id, name, email);
      const user = profileToAppUser(data.session, profile);
      saveToStorage(STORAGE_KEYS.currentUser, user);
      notify(user);
      return { user, error: null };
    },

    // ── Déconnexion ────────────────────────────────────────
    signOut: async () => {
      // Démo — nettoyage localStorage
      saveToStorage(STORAGE_KEYS.currentUser, null);
      const sb = await getSupabase();
      if (sb) await sb.auth.signOut();
      notify(null);
    },

    // ── Session courante (synchrone au démarrage) ──────────
    getSession: (): AppUser | null => {
      // Au 1er rendu, on tente de récupérer la session Supabase de manière synchrone
      // depuis le localStorage natif de Supabase (clé `sb-*-auth-token`)
      try {
        const sbKey = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (sbKey) {
          const raw = JSON.parse(localStorage.getItem(sbKey) || "null");
          if (raw?.user) {
            return {
              id: raw.user.id,
              name: raw.user.user_metadata?.name || raw.user.email?.split("@")[0] || "",
              email: raw.user.email || "",
              activeFamilyId: null, // sera mis à jour par onAuthChange
              preferences: [], allergies: [], dislikes: [], diets: [], rules: [],
            };
          }
        }
      } catch {}
      // Fallback compte démo
      return loadFromStorage(STORAGE_KEYS.currentUser, null);
    },

    // ── Mise à jour du profil ─────────────────────────────
    updateProfile: async (userId: string, updates: Partial<AppUser>) => {
      // Mise à jour démo en localStorage
      if (userId === "demo") {
        const current = loadFromStorage(STORAGE_KEYS.currentUser, null) || DEMO_USER;
        const merged = { ...current, ...updates };
        saveToStorage(STORAGE_KEYS.currentUser, merged);
        // Fusionner sur `current` (pas sur `DEMO_USER`) : sinon chaque mise à jour de
        // profil démo (régime, puis allergies, puis aliments non appréciés...) réinitialise
        // silencieusement dans l'état React affiché tous les autres champs déjà renseignés
        // lors d'un appel précédent — repéré en enchaînant régime → allergies → aliments non
        // appréciés depuis Mon compte : chaque étape faisait disparaître la précédente de
        // l'écran (mais restait correcte en localStorage, donc invisible après un simple
        // rechargement, ce qui a retardé le diagnostic).
        notify(merged);
        return;
      }
      const sb = await getSupabase();
      if (!sb) return;
      // Mapper AppUser → colonnes Supabase
      const dbUpdates: any = {};
      if (updates.activeFamilyId !== undefined) dbUpdates.active_family_id = updates.activeFamilyId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (Object.keys(dbUpdates).length > 0) {
        await sb.from("profiles").update(dbUpdates).eq("profile_id", userId);
      }
      // Mettre à jour l'état local via onAuthChange (déclenché automatiquement)
      const session = await sb.auth.getSession();
      if (session?.data?.session) {
        const profile = await fetchProfile(userId);
        notify(profileToAppUser(session.data.session, { ...profile, ...dbUpdates }));
      }
    },

    // ── Suppression de compte ─────────────────────────────
    deleteAccount: async (userId: string) => {
      saveToStorage(STORAGE_KEYS.currentUser, null);
      const sb = await getSupabase();
      if (sb) {
        // Supprimer le profil (cascade RLS)
        await sb.from("profiles").delete().eq("profile_id", userId);
        await sb.auth.signOut();
      }
      notify(null);
    },

    // ── Mot de passe oublié ───────────────────────────────
    resetPassword: async (email: string): Promise<{ error: string | null }> => {
      const sb = await getSupabase();
      if (!sb) return { error: "Client Supabase non initialisé." };
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?reset=true`,
      });
      return { error: error?.message || null };
    },

    // ── Abonnement aux changements d'auth ─────────────────
    onAuthChange: (cb: AuthChangeCallback): (() => void) => {
      listeners.push(cb);
      // Initialiser l'écouteur Supabase au premier abonnement
      initSupabaseListener();
      return () => {
        const idx = listeners.indexOf(cb);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },
  };
})();
