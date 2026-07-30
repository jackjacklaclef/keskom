// Regression tests for Supabase Row Level Security policies.
//
// Uses two dedicated throwaway accounts (rls-test-a / rls-test-b, separate families)
// to catch the two bug classes this project has actually hit in production:
//   1. Cross-tenant leakage (family A can read/write family B's data)
//   2. RLS policy misconfiguration that breaks queries outright (infinite recursion,
//      tautological with_check clauses, etc.)
//
// Run: npm run test:rls  (loads credentials from .env.test.local)

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const A_EMAIL = "rls-test-a@keskom-test.local";
const A_PASSWORD = process.env.RLS_TEST_A_PASSWORD;
const B_EMAIL = "rls-test-b@keskom-test.local";
const B_PASSWORD = process.env.RLS_TEST_B_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !A_PASSWORD || !B_PASSWORD) {
  console.error("Missing env vars. Expected SUPABASE_URL, SUPABASE_ANON_KEY, RLS_TEST_A_PASSWORD, RLS_TEST_B_PASSWORD (see .env.test.local).");
  process.exit(1);
}

const failures = [];
const check = (label, condition) => {
  if (condition) console.log(`  ok   - ${label}`);
  else { console.log(`  FAIL - ${label}`); failures.push(label); }
};

const signIn = async (email, password) => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
};

async function main() {
  console.log("RLS regression tests\n");

  const a = await signIn(A_EMAIL, A_PASSWORD);
  const b = await signIn(B_EMAIL, B_PASSWORD);

  console.log("recipes");
  {
    const { data, error } = await a.from("recipes").select(`
      id, name, scope,
      recipe_categories(short_name),
      recipe_ingredients(ingredient_id, quantity_label, ingredients(name)),
      recipe_family_shares(family_id)
    `);
    check("A can query recipes with the app's full nested shape (no infinite recursion)", !error);
    check("A sees own private recipe", (data || []).some((r) => r.name === "RLS Test A - recette privée"));
    check("A does not see B's private recipe", !(data || []).some((r) => r.name === "RLS Test B - recette privée"));
  }
  {
    const { data, error } = await b.from("recipes").select("id, name, scope");
    check("B can query recipes without error", !error);
    check("B does not see A's private recipe", !(data || []).some((r) => r.name === "RLS Test A - recette privée"));
    check("B does not see A's family recipe", !(data || []).some((r) => r.name === "RLS Test A - recette familiale"));
  }

  console.log("families / family_members");
  const { data: famA } = await a.from("families").select("family_id, name").eq("name", "RLS Test Family A").maybeSingle();
  const { data: famB } = await b.from("families").select("family_id, name").eq("name", "RLS Test Family B").maybeSingle();
  check("A can read own family", !!famA);
  check("B can read own family", !!famB);
  {
    const { data: famBAsA } = await a.from("families").select("family_id").eq("name", "RLS Test Family B").maybeSingle();
    check("A cannot read B's family", !famBAsA);
  }

  console.log("meal_plans (regression: with_check tautology bug)");
  if (famA && famB) {
    const { error } = await a.from("meal_plans").insert({ family_id: famB.family_id, date: "2099-01-01", created_by: null });
    check("A cannot insert a meal_plan into B's family", !!error);
    if (!error) await a.from("meal_plans").delete().eq("family_id", famB.family_id).eq("date", "2099-01-01");
  }

  console.log("shopping_list_items / week_templates");
  {
    const { data } = await b.from("shopping_list_items").select("id").eq("name", "RLS Test A - item");
    check("B cannot see A's shopping list item", (data || []).length === 0);
    const { data: tpl } = await b.from("week_templates").select("id").eq("name", "RLS Test A - modèle");
    check("B cannot see A's personal week template", (tpl || []).length === 0);
  }

  console.log("RPCs (join / invite chicken-and-egg regressions)");
  {
    const { error } = await a.rpc("join_family_by_code", { p_invite_code: "NOPE99" });
    check("join_family_by_code rejects an invalid code", error?.message === "invalid_code");
  }
  if (famA) {
    const { error } = await b.rpc("add_family_member_by_email", { p_family_id: famA.family_id, p_email: A_EMAIL });
    check("add_family_member_by_email rejects a non-owner caller", error?.message === "not_authorized");
  }

  await a.auth.signOut();
  await b.auth.signOut();

  console.log("");
  if (failures.length === 0) {
    console.log("All RLS checks passed.");
    process.exit(0);
  } else {
    console.log(`${failures.length} check(s) FAILED:`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("RLS test script crashed:", err);
  process.exit(1);
});
