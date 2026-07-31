// ============================================================
// CLIENT SUPABASE
// ============================================================
// Chargé depuis CDN — pas de npm nécessaire pour le fichier unique
// À remplacer par import { createClient } from '@supabase/supabase-js' lors du split

// ============================================================
// CLIENT SUPABASE — initialisation robuste
// ============================================================

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL || "https://wdctmgcfinspgwvkwaii.supabase.co") as string;
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3RtZ2NmaW5zcGd3dmt3YWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTUyNTcsImV4cCI6MjA5Nzc3MTI1N30._38LzpOx59YtmZudZ7ly7oSwJ83Uh9sNfLirqdef_t0") as string;

let _supabase: any = null;
let _supabasePromise: Promise<any> | null = null;

// Charge le SDK CDN et retourne le client — idempotent.
// Met en cache la PROMESSE (pas seulement le client résolu) pour que les appels
// concurrents (plusieurs useEffect au montage) attendent tous la même résolution
// au lieu de s'écraser mutuellement le handler onload du <script> et de bloquer
// indéfiniment les appelants perdants.
export const getSupabase = (): Promise<any> => {
  if (_supabase) return Promise.resolve(_supabase);
  if (_supabasePromise) return _supabasePromise;
  _supabasePromise = new Promise((resolve) => {
    // Si déjà disponible dans window (chargement précédent)
    if (typeof window !== "undefined" && (window as any).supabase?.createClient) {
      _supabase = (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      resolve(_supabase);
      return;
    }
    // Injecter le script (ou réutiliser celui déjà présent) et attendre son chargement
    const existing = document.getElementById("supabase-cdn") as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    if (!existing) {
      script.id = "supabase-cdn";
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => {
      _supabase = (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      resolve(_supabase);
    });
    script.addEventListener("error", () => resolve(null));
  });
  return _supabasePromise;
};
