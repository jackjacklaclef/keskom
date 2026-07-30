# Keskom — historique de projet

Application de planification de repas familiale (React + Vite, tout dans `src/App.tsx`),
backend Supabase (projet `wdctmgcfinspgwvkwaii`). Ce fichier retrace les décisions et
l'état du projet accumulés au fil des sessions Claude, pour éviter de re-découvrir les
mêmes pièges.

## Architecture générale

- Tout le front-end vit dans un seul fichier `src/App.tsx` (~7500 lignes).
- Client Supabase : **pas** le package npm installé dans `src/lib/supabaseClient.ts`
  (mort, jamais importé). App.tsx charge son propre client via un `<script>` CDN
  (`getSupabase()`, cache la *promesse* elle-même — voir bugs ci-dessous).
- Compte **démo** (`demo@carnet.app` / `demo1234`) : reste 100% local (localStorage),
  aucune ligne ne lui correspond en base. Tous les handlers de données branchent sur
  `isDemo` pour choisir le chemin local vs Supabase.
- Version affichée dans le footer de la sidebar = sha git court, injecté au build via
  `vite.config.ts` (`__APP_VERSION__`).

## Schéma Supabase (tables clés)

- `profiles` — un par compte auth. `active_family_id` = famille actuellement sélectionnée.
  **`family_id` sur profiles n'est jamais utilisé/rempli** : un profil peut appartenir à
  plusieurs familles, l'appartenance vit uniquement dans `family_members`.
- `families` / `family_members` — un profil peut appartenir à plusieurs familles.
  `family_members.profile_id` peut être `null` (membre sans compte app, juste un nom).
- `recipes` / `recipe_ingredients` / `recipe_steps` / `recipe_variants` /
  `recipe_family_shares` — recettes globales (catalogue partagé) ou privées/familiales.
  `scope` ∈ `global|private|family`. Partage vers une famille *supplémentaire* (au-delà
  de la famille "propriétaire") via `recipe_family_shares`.
- `ingredients` / `ingredient_categories` / `recipe_categories` / `units` — référentiels,
  lecture publique. `ingredients` a des policies INSERT/DELETE ouvertes à tout
  authentifié (catalogue partagé, pas de notion de propriétaire — comme avant la
  migration, en local).
- `meal_plans` (un par famille+date) → `meal_plan_meals` (un par type de repas ce
  jour-là, avec `status`) → `meal_plan_meal_recipes` (recettes du repas).
- `shopping_list_items`, `week_templates` — créées pendant la migration, n'existaient
  pas avant (pas d'équivalent local-storage).
- `diets` (référentiel, 9 régimes) / `profile_diets` (many-to-many) /
  `profile_food_restrictions` (allergies **et** aliments non appréciés dans la même
  table, distingués par `restriction_type`, chaque ligne référence soit un ingrédient
  soit une catégorie entière via `item_type`).

Toutes les tables perso (recipes privées, meal_plans, shopping_list_items,
week_templates, profile_diets, profile_food_restrictions) suivent le même pattern
d'écriture : **remplacement complet** (delete puis insert) plutôt que diff/patch —
plus simple et plus sûr à maintenir que des upserts fins.

## Bugs découverts et corrigés (par ordre chronologique)

1. **`meal_plans` RLS tautologique** — le `with_check` comparait `fm.family_id =
   fm.family_id` (toujours vrai) au lieu de `meal_plans.family_id` : n'importe quel
   membre pouvait écrire des repas dans une famille arbitraire. Corrigé.
2. **`ingredients` sans policy INSERT/DELETE** — RLS activé mais aucune policy pour ces
   commandes = rejet silencieux pour tout le monde. Ajouté (ouvert à `authenticated`).
3. **Récursion infinie RLS sur `recipes`** — `recipes` vérifiait `recipe_family_shares`,
   qui vérifiait `recipes` en retour → boucle infinie, **toutes** les requêtes sur
   `recipes` échouaient depuis la migration du partage. Corrigé avec des fonctions
   `SECURITY DEFINER` (`is_recipe_shared_with_my_families`, `owns_recipe`) qui
   contournent RLS en interne pour casser le cycle — même schéma que `is_family_member`.
4. **Race condition sur `getSupabase()`** — chaque appel voyant le script CDN pas
   encore chargé écrasait le handler `onload` du précédent, qui restait bloqué *pour
   toujours*. Devenu quasi systématique une fois plusieurs `useEffect` ajoutés qui
   appellent tous `getSupabase()` au montage. Corrigé en cachant la **promesse**
   elle-même (`_supabasePromise`), pas seulement le client résolu.
5. **`needsFamilySetup` mal gaté** — basé sur `currentUser.activeFamilyId` (jamais
   remis à jour de façon fiable) au lieu de l'appartenance réelle (`userFamilies.length
   === 0`). Un membre avec `active_family_id` nul/périmé se voyait forcé vers l'écran
   créer/rejoindre. Corrigé + ajout d'un flag `familiesLoaded` pour éviter un flash de
   l'écran pendant le court instant de chargement initial.
6. **`handleJoinFamily` jamais migré** — tournait encore sur l'ancienne logique
   localStorage (ne pouvait littéralement pas trouver une famille que l'utilisateur ne
   possédait pas déjà). Même problème que l'ajout de membre par email : lire une
   famille par code exige de contourner RLS (on n'est pas encore membre). Corrigé avec
   un RPC `join_family_by_code` (SECURITY DEFINER).
7. **`handleLeaveFamily` sans policy** — seul le propriétaire pouvait gérer
   `family_members` ; aucun membre normal ne pouvait supprimer sa propre ligne pour
   quitter. Ajouté policy `family_members_leave_self`.
8. **Sidebar non fixe** — `.mp-shell` (flex, `min-height:100vh`) laissait la sidebar
   défiler avec le contenu principal sur les pages longues, cachant badge profil et
   déconnexion. Corrigé avec `position: sticky; top:0; height:100vh` sur le `<nav>`.
9. **Favicon 404 + meta iOS dépréciée** — `favicon.ico` manquant (généré via `sips`),
   `apple-mobile-web-app-capable` sans l'équivalent standard `mobile-web-app-capable`.

## Fonctionnalités ajoutées pendant la migration

- Famille : ajout de membre par email (RPC `add_family_member_by_email`), ajout de
  membre sans compte (juste un nom), retrait de membre, rejoindre par code.
  **Non fait** : promotion admin (`handlePromoteMember`) reste locale-only — pas de
  colonne `role` en base, admin = propriétaire uniquement. Le bouton fonctionne
  visuellement mais l'effet disparaît au rechargement.
- Recettes : CRUD complet, variantes, partage multi-famille, **étapes de recette**
  (v1 : titre+texte+ordre, pas de timer/photo) avec un "Mode cuisine" pas-à-pas.
- Régime alimentaire / allergies / aliments non appréciés : persistés en base
  (auparavant hardcodés à `[]` au chargement, silencieusement ignorés à l'écriture).
  Limite connue : un refresh de token Supabase en tâche de fond pourrait réinitialiser
  ces champs localement le temps d'un rechargement (cas limite rare).

## Notes diverses

- Repo : `github.com/jackjacklaclef/keskom`, déployé sur Vercel depuis `main`.
- Les migrations Supabase sont appliquées directement en prod via `apply_migration`
  (pas d'environnement de dev séparé) — toujours vérifier via `execute_sql` en
  simulant le rôle `authenticated` + `request.jwt.claims` avant de considérer un
  correctif RLS comme acquis.
- `recipe_steps` existe en base depuis le début du projet mais n'avait aucune UI avant
  cette session — pas une régression, juste jamais construit.
