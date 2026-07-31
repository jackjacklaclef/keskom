# Keskom — historique de projet

Application de planification de repas familiale (React + Vite, front-end découpé en
modules sous `src/` — voir Architecture générale), backend Supabase (projet
`wdctmgcfinspgwvkwaii`). Ce fichier retrace les décisions et l'état du projet
accumulés au fil des sessions Claude, pour éviter de re-découvrir les mêmes pièges.

## Architecture générale

- Le front-end, initialement un unique fichier `src/App.tsx` (~8200 lignes), a été
  découpé en modules sur 9 étapes (une par tour de conversation, chacune commitée
  séparément) — plan dans `/Users/jacquesmolette/.claude/plans/giggly-inventing-frog.md`.
  **Terminé.** Refactor pur à chaque étape : zéro logique modifiée, vérifié par
  `npm run build` + `npm run typecheck` (parité stricte : mêmes 1863 erreurs
  pré-existantes tout du long, jamais de régression) + `npm run test:rls` pour les
  étapes touchant la couche data/auth. `App.tsx` fait maintenant 1137 lignes : plus
  qu'un seul composant top-level, `App`, qui porte le state racine, ses ~62 handlers,
  les effets (dont les abonnements Realtime) et le routing entre vues.

  Arborescence actuelle (lignes de code) :

  ```
  src/
    App.tsx                    1141  composant App racine (state, handlers, routing)
    main.tsx                      9  point d'entrée Vite
    theme.tsx                   641  design tokens + GlobalStyle
    constants.ts                163  constantes métier (catégories, régimes, etc.)
    types.ts                     22  AppUser, AuthResult, AuthChangeCallback
    lib/
      supabaseClient.ts          47  client Supabase (getSupabase())
      authService.ts            272  AuthService
      dataLayer.ts              345  fetch*/save* Supabase (14 fonctions)
      storage.ts                656  localStorage + démo + jeu de données mock
      dateUtils.ts               23  todayStr/getMondayOf/dateOfSlot
    components/
      ui.tsx                    413  primitives UI génériques
      layout.tsx                216  Sidebar/MobileDrawer/FamilySelector
      auth.tsx                  370  écrans de connexion/inscription
      privacy.tsx                55  politique de confidentialité
      account.tsx               575  compte + profil (régime/allergies/aliments non appréciés)
      family.tsx                289  gestion de la famille
      shopping.tsx              297  liste de courses
      templates.tsx             369  semaines types + écran dédié « Modèles »
      ingredients.tsx            86  catalogue d'ingrédients (écran « Ingrédients »)
      recipeSelection.tsx       188  sélecteur de recette pour un créneau
      recipes.tsx               915  CRUD recettes, mode cuisine
      calendar.tsx             1144  planning (jour/semaine/mois)
  ```

  **Écrans de paramétrage (réorganisés)** : avant, « Mon compte » et « Préférences »
  affichaient tous les deux le nom/email (doublon) et il fallait naviguer entre les
  deux pour éditer son profil alimentaire. Réorganisé en trois écrans sans
  chevauchement : **Mon compte** (`AccountView`) porte tout le profil personnel —
  identité, régime alimentaire, allergies, aliments non appréciés, règles
  personnalisées (placeholder) — en plus de la gestion du compte (déconnexion,
  suppression, RGPD) ; **Modèles** (`TemplatesView`, nouveau, dans `templates.tsx`)
  est l'écran dédié aux semaines types, avant enterré en bas de Préférences ;
  **Ingrédients** (`IngredientsView`, nouveau fichier `ingredients.tsx`) reprend
  l'ancien écran Préférences recentré sur le seul catalogue d'ingrédients (décision :
  renommer plutôt que fusionner dans Recettes, pour ne pas alourdir un fichier déjà
  volumineux). `PreferencesView` a disparu, son contenu s'est réparti entre ces trois
  écrans.

  Table de correspondance (contenu déplacé → fichier, avec le contexte de chaque
  décision) :

  | Contenu | Destination |
  |---|---|
  | `colors`/`dark`/`space`/`radius`/`GlobalStyle` | `src/theme.tsx` |
  | Toutes les constantes (`MEAL_TYPES`, `RECIPE_CATEGORIES`, `DIET_OPTIONS`, `AVATAR_EMOJI_GROUPS`, `APPETITE_LEVELS`, `STORAGE_KEYS`, `ingredientCategories`, etc.) | `src/constants.ts` |
  | `AppUser`/`AuthResult`/`AuthChangeCallback` | `src/types.ts` |
  | Primitives UI génériques (`Icon`, `Modal`, `ModalHeader`, `Field`, `Toast`, `TagInput`, `NavButton`, `LogoMark`, `Stepper`, `AuthLogo`, `PasswordInput`...) | `src/components/ui.tsx` (un seul fichier, volontairement, pour limiter les allers-retours d'imports) |
  | `Sidebar`/`MobileDrawer`/`FamilySelector` | `src/components/layout.tsx` |
  | `getSupabase()` | `src/lib/supabaseClient.ts` (**n'est plus le fichier mort** — voir bug historique plus bas) |
  | `loadFromStorage`/`saveToStorage`/constantes démo/jeu de données mock | `src/lib/storage.ts` |
  | `AuthService` | `src/lib/authService.ts` |
  | Les 14 fonctions `fetch*`/`save*` Supabase | `src/lib/dataLayer.ts` |
  | `todayStr`/`getMondayOf`/`dateOfSlot` | `src/lib/dateUtils.ts` |
  | `FamilySetupView`/`LoginView`/`RegisterView`/`ForgotPasswordView` | `src/components/auth.tsx` |
  | `PrivacyModal`/`PrivacyView`/`PrivacyLink` | `src/components/privacy.tsx` |
  | `AccountView`/`UserAvatar`/`EmojiAvatarPicker`/`NotificationsView`/allergies-picker/`MemberModal` (mort) | `src/components/account.tsx` |
  | `FamilyView` | `src/components/family.tsx` |
  | `ShoppingListView` et sous-composants | `src/components/shopping.tsx` |
  | `TemplateGrid`/`WeekTemplateEditor`/`ApplyTemplateModal`/`TemplatesView` | `src/components/templates.tsx` |
  | `IngredientsView` | `src/components/ingredients.tsx` |
  | `RecipeSelectionModal` | `src/components/recipeSelection.tsx` |
  | `RecipeModal`/`RecipeDetailModal`/`CookModeModal`/`StepTimer`/`RecipesView` | `src/components/recipes.tsx` |
  | `ClearWeekModal`/`ApplyTemplateModeModal`/`DuplicateWeekModal`/`AttendeeAvatarStack`/`DayPanel`/`CalendarView`/`QuickPlanModal` | `src/components/calendar.tsx` |

  Deux écarts par rapport au plan initial, tous deux volontaires : (1) plusieurs
  fichiers ont été tirés **en avance** sur leur étape prévue pour casser une
  dépendance circulaire ou débloquer une chaîne — `privacy.tsx` (étape 4, car
  `RegisterView` et `AccountView` en dépendent tous les deux et ne peuvent pas
  s'importer mutuellement) et `dateUtils.ts`/`recipeSelection.tsx` (étape 6, car
  `WeekTemplateEditor` a besoin de `RecipeSelectionModal`) ; effet en cascade
  bénéfique, `PreferencesView` (bloquée par cette même chaîne) a pu être intégrée dès
  l'étape 6 plutôt qu'attendre. (2) `layout.tsx` figurait dans l'arborescence cible du
  plan mais n'était assigné à aucune étape numérotée précise — extrait en clôture du
  chantier (étape 9) une fois le reste stabilisé. `MemberModal` est mort depuis avant
  cette session (jamais rendu nulle part) ; conservé tel quel, pas supprimé, pour ne
  rien changer au comportement pendant le refactor.
- Client Supabase : **`src/lib/supabaseClient.ts` est désormais le vrai fichier utilisé**
  (`getSupabase()`, cache la *promesse* elle-même — voir bugs ci-dessous). Il
  remplace l'ancien fichier mort du même nom qui installait le package npm
  `@supabase/supabase-js` mais n'était jamais importé — supprimé lors de l'étape 3
  du découpage plutôt que de coexister avec deux clients Supabase différents.
- Compte **démo** (`demo@carnet.app` / `demo1234`) : reste 100% local (localStorage),
  aucune ligne ne lui correspond en base. Tous les handlers de données branchent sur
  `isDemo` pour choisir le chemin local vs Supabase.
- Version affichée dans le footer de la sidebar = sha git court, injecté au build via
  `vite.config.ts` (`__APP_VERSION__`).
- PWA (`vite-plugin-pwa`) : manifest + service worker générés au build (`generateSW`).
- Synchronisation temps réel via **Supabase Realtime** (`postgres_changes`) sur les
  recettes (`recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_family_shares`,
  `recipe_variants`) et sur le planning (`meal_plans` filtré par famille active,
  `meal_plan_meals`, `meal_plan_meal_recipes`). **Non couvert par Realtime** :
  `family_members` (avatar, appétit, rôle) — un changement fait par un autre membre
  n'apparaît qu'au rechargement.

## Schéma Supabase (tables clés)

- `profiles` — un par compte auth. `active_family_id` = famille actuellement sélectionnée.
  **`family_id` sur profiles n'est jamais utilisé/rempli** : un profil peut appartenir à
  plusieurs familles, l'appartenance vit uniquement dans `family_members`.
- `families` / `family_members` — un profil peut appartenir à plusieurs familles.
  `family_members.profile_id` peut être `null` (membre sans compte app, juste un nom).
  Colonnes personnelles-mais-visibles-en-famille stockées ici (pas sur `profiles`, dont
  la RLS est self-only et bloquerait la lecture par les autres membres) :
  - `avatar_emoji` — avatar emoji (voir « Fonctionnalités ajoutées après la migration »).
  - `appetite` ∈ `small|medium|large` (Moineaux ×0.8 / Normal ×1 / Vorace ×1.3),
    posé par `set_my_appetite` (soi-même) ou `assign_member_appetite` (pour un tiers,
    verrouillé dès qu'il est renseigné par le titulaire du compte — voir plus bas).
  - `role` ∈ `admin|member` — co-admin **réellement persisté** (colonne réelle, plus
    de simulation locale). Seul le propriétaire de la famille (comparaison avec
    `families.owner_profile_id`, jamais la colonne `role`) peut gérer les membres
    (promouvoir, retirer, régénérer le code, ajouter) : un co-admin promu obtient le
    badge « Admin » mais **n'hérite pas** de ces droits — choix de scope délibéré pour
    ne pas avoir à refondre le modèle de permissions RLS (owner-only) à cette occasion.
- `recipes` / `recipe_ingredients` / `recipe_steps` / `recipe_variants` /
  `recipe_family_shares` — recettes globales (catalogue partagé) ou privées/familiales.
  `scope` ∈ `global|private|family`. Partage vers une famille *supplémentaire* (au-delà
  de la famille "propriétaire") via `recipe_family_shares`.
  - `recipe_steps.timer_seconds` / `.media_url` — minuteur et photo par étape (existaient
    en base depuis le début, jamais exploités avant d'être câblés côté UI). La photo est
    hébergée dans le bucket Storage `recipe-step-photos` (public en lecture directe par
    URL ; écriture réservée aux utilisateurs authentifiés). Pas de policy `SELECT`
    explicite sur `storage.objects` pour ce bucket : un bucket `public=true` sert déjà
    les objets par URL sans passer par RLS, une policy `SELECT` n'aurait fait qu'exposer
    le *listing* complet du bucket (repéré et supprimé via l'advisor de sécurité).
- `ingredients` / `ingredient_categories` / `recipe_categories` / `units` — référentiels,
  lecture publique. `ingredients` a des policies INSERT/DELETE ouvertes à tout
  authentifié (catalogue partagé, pas de notion de propriétaire — comme avant la
  migration, en local).
- `meal_plans` (un par famille+date) → `meal_plan_meals` (un par type de repas ce
  jour-là, avec `status`) → `meal_plan_meal_recipes` (recettes du repas) +
  `meal_plan_meal_attendees` (membres présents à ce repas — `member_id`, remplacement
  complet à chaque sauvegarde). Un nouveau créneau sans `attendeeIds` explicite est
  peuplé par défaut avec **tous** les membres de la famille active. La liste de courses
  pondère chaque repas par la somme des multiplicateurs d'appétit des présents plutôt
  qu'un simple headcount.
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
10. **Bucket Storage avec policy `SELECT` trop permissive** — la policy publique posée
    sur `recipe-step-photos` autorisait le *listing* complet du bucket (`storage.objects`
    list), repérée par l'advisor de sécurité Supabase. Un bucket `public=true` sert déjà
    les objets par URL directe sans RLS ; la policy ne servait donc qu'à exposer le
    listing, jamais utilisé côté app. Supprimée.

## Bugs connus, non corrigés

- **`ForgotPasswordView` — `ReferenceError` si `resetPassword` échoue** (repéré lors du
  découpage de `App.tsx`, étape 4, dans `src/components/auth.tsx`) — la fonction
  appelle `setError(error)` mais aucun état `error` n'est déclaré dans ce composant
  (seuls `email`/`sent`/`loading` le sont). Confirmé pré-existant (même erreur
  TypeScript `TS2304` avant l'extraction, à l'ancien emplacement). Pas corrigé
  volontairement pour garder le refactor à logique strictement inchangée — à corriger
  dans une session dédiée (ajouter `const [error, setError] = useState("")` et
  afficher le message, sur le modèle des autres écrans d'auth).

## Fonctionnalités ajoutées pendant la migration

- Famille : ajout de membre par email (RPC `add_family_member_by_email`), ajout de
  membre sans compte (juste un nom), retrait de membre, rejoindre par code.
- Recettes : CRUD complet, variantes, partage multi-famille, étapes de recette avec un
  "Mode cuisine" pas-à-pas.
- Régime alimentaire / allergies / aliments non appréciés : persistés en base
  (auparavant hardcodés à `[]` au chargement, silencieusement ignorés à l'écriture).
  Limite connue : un refresh de token Supabase en tâche de fond pourrait réinitialiser
  ces champs localement le temps d'un rechargement (cas limite rare).

## Fonctionnalités ajoutées après la migration

- **Présence par repas** — chaque créneau de repas a une liste de présents
  (`meal_plan_meal_attendees`), choisis dans la modale via des tags multi-sélection ;
  un tag « Tout le monde » remplace l'affichage individuel quand tous sont présents et
  c'est la sélection par défaut sur un nouveau créneau.
- **Avatars emoji** — 43 emojis (nourriture, groupés par famille : fruits, légumes,
  plats & snacks, sucré & boissons) remplacent l'initiale par défaut. Choix personnel
  (`set_my_avatar`, RPC `SECURITY DEFINER`) ou posé par l'admin pour un membre sans
  compte (`family_members.avatar_emoji` en écriture directe, déjà couvert par la policy
  owner-only existante). Sélecteur présent dans la fiche Famille et dans le Compte.
- **Appétit par membre** — Moineaux / Normal / Vorace (×0.8 / ×1 / ×1.3), posé par
  soi-même ou par un tiers avec verrouillage dès que le titulaire du compte l'a
  renseigné (décision produit explicite : éviter qu'un membre écrase le choix d'un
  autre). Pondère les quantités de la liste de courses générée.
- **Co-admin persistant** — voir `family_members.role` ci-dessus. Le bouton
  "Promouvoir admin" écrit réellement en base désormais (avant : simulation locale
  perdue au rechargement).
- **Étapes de recette : minuteur + photo** — champ minutes → `timer_seconds`,
  upload photo → bucket `recipe-step-photos` → `media_url`. Le "Mode cuisine" affiche
  un vrai décompte (démarrer/pause/réinitialiser, remonté à chaque étape via `key`) et
  la photo de l'étape.
- **Supabase Realtime** — voir section Architecture générale.
- **Suite de tests RLS automatisée + hooks Claude Code** — voir section Outillage.
- **Recettes globales chinoises (seed)** — 6 recettes (Poulet Kung Pao, Brocolis à
  l'ail, Pommes de terre sautées à l'aigre-piquant, Tofu braisé aux oignons verts, Porc
  braisé façon Bazi Rou, Wok sec ailes de poulet et crevettes) insérées en `scope
  global` par SQL direct (contourne la policy INSERT `owner_profile_id =
  current_profile_id()`, comme tout le contenu de seed). Traduites/adaptées depuis des
  recettes réelles de xiachufang.com (quantités vagues type « à volonté » converties en
  quantités concrètes). A enrichi le référentiel `ingredients` d'une trentaine de
  produits de cuisine chinoise (sauces, épices, tofu...).

## Outillage — hooks Claude Code

Configurés dans `.claude/settings.local.json` (non versionné) :

- **`PostToolUse` sur `mcp__claude_ai_Supabase__apply_migration`** →
  `scripts/rls-hook.sh` : relance la suite de régression RLS (`scripts/test-rls.mjs`,
  `npm run test:rls`) après **chaque** migration appliquée, et bloque (`decision:
  "block"`) avec le détail des échecs si une policy casse quelque chose (récursion,
  `with_check` tautologique, policy manquante...). Suite pilotée par deux comptes de
  test jetables (`rls-test-a@keskom-test.local` / `rls-test-b@keskom-test.local`,
  insérés directement dans `auth.users`), credentials dans `.env.test.local` (gitignore).
- **`Stop` → `scripts/auto-sync.sh`** : à la fin de chaque réponse, commit puis push
  automatique vers `origin/main` si des changements sont présents — mais seulement si
  `npm run build` passe (sinon commit local seul, push annulé pour ne pas casser le
  déploiement Vercel).
- **`Stop` → `scripts/doc-sync-hook.sh`** : à la fin de chaque réponse, invite Claude à
  vérifier si ce tour a introduit une fonctionnalité ou une décision notable et, si
  oui, à mettre à jour ce fichier (et le README si ça concerne l'usage). Utilise
  `stop_hook_active` pour ne bloquer qu'une fois par tour et éviter une boucle infinie.
  **Ce fichier doit donc rester à jour en continu** : si tu le lis et qu'il semble
  décalé par rapport au code, c'est que le hook n'a pas été respecté sur un tour donné
  — corrige-le à l'occasion plutôt que de laisser la dérive s'accumuler.

## Notes diverses

- Repo : `github.com/jackjacklaclef/keskom`, déployé sur Vercel depuis `main`.
- Les migrations Supabase sont appliquées directement en prod via `apply_migration`
  (pas d'environnement de dev séparé) — toujours vérifier via `execute_sql` en
  simulant le rôle `authenticated` + `request.jwt.claims` avant de considérer un
  correctif RLS comme acquis.
- `recipe_steps` existe en base depuis le début du projet ; le minuteur et la photo par
  étape ont été câblés après coup (colonnes déjà présentes, jamais exploitées avant).
