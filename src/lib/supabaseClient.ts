// ============================================================
// CLIENT SUPABASE
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL || "https://wdctmgcfinspgwvkwaii.supabase.co") as string;
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY3RtZ2NmaW5zcGd3dmt3YWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTUyNTcsImV4cCI6MjA5Nzc3MTI1N30._38LzpOx59YtmZudZ7ly7oSwJ83Uh9sNfLirqdef_t0") as string;

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Signature restée async pour ne pas toucher les ~50 appelants existants
// (`await getSupabase()`) — historiquement nécessaire le temps que le SDK soit
// chargé depuis un <script> CDN, désormais un simple import npm résolu de façon
// synchrone au chargement du module. Pas de cache de promesse à gérer : la race
// condition qui touchait les appels concurrents au chargement du <script> CDN ne
// peut plus se produire, `createClient` n'est plus asynchrone.
export const getSupabase = (): Promise<any> => Promise.resolve(_supabase);
