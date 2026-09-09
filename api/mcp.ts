// Serveur MCP (Model Context Protocol) de Keskom — permet à un assistant IA externe
// compatible MCP (Claude, ChatGPT...) de consulter les données d'un compte en lecture
// seule : planning, recettes, liste de courses, profil famille (allergies/appétit).
//
// Auth : token personnel généré depuis "Mon compte" (voir src/components/account.tsx,
// table public.mcp_tokens) — jamais un mot de passe ni le token anon Supabase. Le
// serveur tourne côté Vercel (fonction serverless Node, /api/mcp) avec la clé
// service_role (SUPABASE_SERVICE_ROLE_KEY, à définir dans les variables d'environnement
// Vercel — jamais exposée au client) : elle contourne la RLS, donc chaque requête est
// explicitement filtrée ici par family_id/profile_id résolus depuis le token, exactement
// comme le ferait la RLS pour un compte normal.
//
// Mode stateless (sessionIdGenerator: undefined) : une instance de McpServer/transport
// par requête HTTP, adapté aux fonctions serverless (pas d'état en mémoire entre appels).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wdctmgcfinspgwvkwaii.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AuthContext = { profileId: string; familyId: string; userName: string };

const jsonText = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Résout le token Bearer vers un profil + sa famille active. `null` = non authentifié
// (token absent/inconnu/révoqué) ou aucune famille active — dans les deux cas on refuse.
async function authenticate(req: VercelRequest, sb: SupabaseClient): Promise<AuthContext | null> {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const { data: tokenRow } = await sb.from("mcp_tokens").select("id, profile_id").eq("token_hash", tokenHash).maybeSingle();
  if (!tokenRow) return null;

  // Best-effort : ne bloque jamais l'authentification si cette écriture échoue.
  sb.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenRow.id).then(() => {});

  const { data: profile } = await sb
    .from("profiles").select("profile_id, name, active_family_id")
    .eq("profile_id", tokenRow.profile_id).maybeSingle();
  if (!profile?.active_family_id) return null;

  return { profileId: profile.profile_id, familyId: profile.active_family_id, userName: profile.name };
}

function buildServer(sb: SupabaseClient, ctx: AuthContext): McpServer {
  const server = new McpServer({ name: "keskom", version: "1.0.0" });

  server.registerTool("get_meal_plan", {
    title: "Planning des repas",
    description: "Repas planifiés pour la famille sur une période donnée : recettes, statut (normal/restaurant/pas de repas), lieu du restaurant et convives présents.",
    inputSchema: {
      start_date: z.string().describe("Date de début, format YYYY-MM-DD"),
      end_date: z.string().describe("Date de fin (incluse), format YYYY-MM-DD"),
    },
  }, async ({ start_date, end_date }) => {
    const { data, error } = await sb
      .from("meal_plans")
      .select(`
        date,
        meal_plan_meals(
          meal_type, status, restaurant_name, restaurant_url,
          meal_plan_meal_recipes(order_index, recipes(name)),
          meal_plan_meal_attendees(family_members(name))
        )
      `)
      .eq("family_id", ctx.familyId).gte("date", start_date).lte("date", end_date).order("date");
    if (error) return jsonText({ error: error.message });

    const meals = (data || []).flatMap((plan: any) =>
      (plan.meal_plan_meals || []).map((meal: any) => ({
        date: plan.date,
        type: meal.meal_type,
        status: meal.status,
        restaurant: meal.restaurant_name ? { name: meal.restaurant_name, url: meal.restaurant_url } : null,
        recipes: (meal.meal_plan_meal_recipes || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((r: any) => r.recipes?.name).filter(Boolean),
        attendees: (meal.meal_plan_meal_attendees || []).map((a: any) => a.family_members?.name).filter(Boolean),
      }))
    );
    return jsonText(meals);
  });

  server.registerTool("search_recipes", {
    title: "Rechercher des recettes",
    description: "Cherche dans le catalogue de recettes accessible à la famille (globales + recettes privées de la famille) par nom.",
    inputSchema: {
      query: z.string().optional().describe("Texte recherché dans le nom de la recette"),
      limit: z.number().int().min(1).max(50).optional().describe("Nombre maximum de résultats (défaut 20)"),
    },
  }, async ({ query, limit }) => {
    let q = sb
      .from("recipes")
      .select("id, name, description, portions, prep_minutes, cook_minutes, origin_country, tags, dish_type, recipe_categories(short_name)")
      .or(`scope.eq.global,family_id.eq.${ctx.familyId}`)
      .order("name")
      .limit(limit || 20);
    if (query) q = q.ilike("name", `%${query}%`);
    const { data, error } = await q;
    if (error) return jsonText({ error: error.message });

    return jsonText((data || []).map((r: any) => ({
      id: r.id, name: r.name, description: r.description || null, portions: r.portions,
      prepMinutes: r.prep_minutes, cookMinutes: r.cook_minutes, originCountry: r.origin_country,
      tags: r.tags || [], category: r.recipe_categories?.short_name || null, dishType: r.dish_type,
    })));
  });

  server.registerTool("get_recipe_detail", {
    title: "Détail d'une recette",
    description: "Ingrédients (avec quantités) et étapes de préparation d'une recette, à partir de son id (voir search_recipes).",
    inputSchema: { recipe_id: z.number().int().describe("Id de la recette, renvoyé par search_recipes") },
  }, async ({ recipe_id }) => {
    const { data, error } = await sb
      .from("recipes")
      .select("id, name, portions, recipe_ingredients(order_index, quantity_label, ingredients(name)), recipe_steps(order_index, title, body, phase)")
      .eq("id", recipe_id)
      .or(`scope.eq.global,family_id.eq.${ctx.familyId}`)
      .maybeSingle();
    if (error) return jsonText({ error: error.message });
    if (!data) return jsonText({ error: "Recette introuvable, ou non accessible à cette famille." });

    return jsonText({
      id: data.id, name: data.name, portions: data.portions,
      ingredients: (data.recipe_ingredients || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((i: any) => [i.quantity_label, i.ingredients?.name].filter(Boolean).join(" ")),
      steps: (data.recipe_steps || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => ({ title: s.title || null, body: s.body, phase: s.phase })),
    });
  });

  server.registerTool("get_shopping_list", {
    title: "Liste de courses",
    description: "Articles actuels de la liste de courses de la famille (cochés et non cochés).",
    inputSchema: {},
  }, async () => {
    const { data, error } = await sb
      .from("shopping_list_items").select("name, quantity, completed")
      .eq("family_id", ctx.familyId).order("created_at");
    if (error) return jsonText({ error: error.message });
    return jsonText(data || []);
  });

  server.registerTool("get_family_profile", {
    title: "Profil de la famille",
    description: "Membres de la famille avec, pour chacun, son appétit et ses allergies/aliments non appréciés déclarés — utile pour proposer des repas adaptés.",
    inputSchema: {},
  }, async () => {
    const { data: members, error } = await sb
      .from("family_members").select("name, profile_id, appetite, role")
      .eq("family_id", ctx.familyId);
    if (error) return jsonText({ error: error.message });

    const profileIds = (members || []).map((m: any) => m.profile_id).filter(Boolean);
    const { data: restrictions } = profileIds.length
      ? await sb.from("profile_food_restrictions")
          .select("profile_id, restriction_type, ingredients(name), ingredient_categories(short_name)")
          .in("profile_id", profileIds)
      : { data: [] as any[] };

    const itemLabel = (r: any) => r.ingredients?.name || r.ingredient_categories?.short_name;
    return jsonText((members || []).map((m: any) => ({
      name: m.name, appetite: m.appetite || null, role: m.role,
      allergies: (restrictions || [])
        .filter((r: any) => r.profile_id === m.profile_id && r.restriction_type === "allergy")
        .map(itemLabel).filter(Boolean),
      dislikes: (restrictions || [])
        .filter((r: any) => r.profile_id === m.profile_id && r.restriction_type === "dislike")
        .map(itemLabel).filter(Boolean),
    })));
  });

  return server;
}

const methodNotAllowed = (res: VercelResponse) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { methodNotAllowed(res); return; }

  if (!SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Serveur MCP mal configuré : SUPABASE_SERVICE_ROLE_KEY absente des variables d'environnement Vercel." });
    return;
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const ctx = await authenticate(req, sb);
  if (!ctx) {
    res.status(401).json({ error: "Token invalide, révoqué, ou aucune famille active sur ce compte." });
    return;
  }

  const server = buildServer(sb, ctx);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
