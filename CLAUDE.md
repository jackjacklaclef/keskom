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
      onboarding.tsx            141  visite guidée (OnboardingTour)
      recipeSelection.tsx       188  sélecteur de recette pour un créneau
      recipes.tsx               915  CRUD recettes, mode cuisine
      calendar.tsx             1144  planning (jour/semaine/mois)
    assets/
      onboarding/                 7  captures d'écran utilisées par la visite guidée
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
  lecture publique. `ingredients` a des policies INSERT/DELETE censées être ouvertes à
  tout authentifié (catalogue partagé, pas de notion de propriétaire — comme avant la
  migration, en local) — **mais l'INSERT est en réalité bloqué en pratique, voir bug
  connu ci-dessous : le GRANT SQL sur la table semble manquant, indépendamment de la
  policy RLS.**
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
11. **Boutons Restaurant / Pas de repas inopérants dans l'éditeur de modèle** —
    `WeekTemplateEditor` (`src/components/templates.tsx`) n'appelait `RecipeSelectionModal`
    qu'avec `onSave`, jamais `onSaveStatus` (requis dès que le statut choisi n'est pas
    `"normal"`, voir `handleSave` dans `recipeSelection.tsx`) : cliquer Restaurant/Pas de
    repas puis Valider appelait une prop `undefined`, sans effet. Les slots de modèle
    n'avaient d'ailleurs aucune place pour un statut (`{day, type, recipeIds}` seulement).
    Corrigé : slots étendus à `{day, type, recipeIds, status}`, `onSaveStatus` câblé,
    `TemplateGrid` et l'aperçu de `ApplyTemplateModal` affichent le statut, et
    `handleApplyTemplate` propage `slot.status` (au lieu de `"normal"` en dur) lors de
    l'application à une semaine réelle.
12. **Sélecteur de catégorie de `RecipeModal` sans icône** (`src/components/recipes.tsx`,
    section « Catégorie » de la modale de création/édition d'une recette) — affichait
    `<span>{cat.icon}</span>`, c'est-à-dire la chaîne brute `"cat-main"`/`"cat-soup"`/...
    en texte, au lieu de l'icône SVG correspondante. Toutes les autres apparitions de
    `RECIPE_CATEGORIES` dans ce même fichier (liste des recettes, filtres, fiche détail...)
    utilisaient déjà correctement `<CategoryIcon icon={cat.icon} size={N} color={cat.hex} />`
    — seul ce sélecteur avait été oublié. Corrigé par simple remplacement, même pattern.

## Bugs connus, non corrigés

- **`ForgotPasswordView` — `ReferenceError` si `resetPassword` échoue** (repéré lors du
  découpage de `App.tsx`, étape 4, dans `src/components/auth.tsx`) — la fonction
  appelle `setError(error)` mais aucun état `error` n'est déclaré dans ce composant
  (seuls `email`/`sent`/`loading` le sont). Confirmé pré-existant (même erreur
  TypeScript `TS2304` avant l'extraction, à l'ancien emplacement). Pas corrigé
  volontairement pour garder le refactor à logique strictement inchangée — à corriger
  dans une session dédiée (ajouter `const [error, setError] = useState("")` et
  afficher le message, sur le modèle des autres écrans d'auth).
- **Allergies des autres membres de la famille invisibles dans `FamilyView` pour un
  compte réel** (repéré en creusant une demande de contrôle ingrédients×allergies sur
  la carte de repas du planning) — `FamilyView` (`src/components/family.tsx`,
  ~L.219-239) lit les allergies d'un membre autre que soi-même via
  `localStorage.getItem("mealPlanner_registeredUsers")`, un reliquat de l'ancienne
  simulation multi-utilisateurs 100% locale d'avant la migration Supabase. Pour un
  compte réel cette clé n'est jamais peuplée : la branche ne retourne donc jamais rien
  pour un membre ≠ soi (`Aucune allergie renseignée` par défaut, même si le membre en a
  déclaré). Ne fonctionne "par accident" que sur le compte démo. **Toujours pas
  corrigé dans `FamilyView` lui-même** — mais le blocage RLS sous-jacent a depuis été
  résolu (voir RPC `get_family_allergies` plus bas) : brancher `FamilyView` sur
  `fetchFamilyAllergies` au lieu de la clé localStorage morte est maintenant trivial,
  juste pas fait faute de demande explicite sur cet écran précis.
- **`suggestForDates` (bouton « Suggérer », `src/components/calendar.tsx`) ignore
  réellement les allergies/dislikes malgré son commentaire** — lit `m.allergies`/
  `m.dislikes` directement sur les objets `familyMembers`, des champs qui n'ont jamais
  été peuplés sur ces objets (ni pour un compte réel, ni en démo : la fonction de
  mapping de `fetchFamiliesForUser` ne recopie que memberId/userId/userName/
  userEmail/avatarEmoji/appetite/role). Les deux `Set` d'ingrédients à éviter sont donc
  toujours vides et la suggestion aléatoire ne filtre jamais rien en pratique. Même
  famille de bug que le point précédent, pas corrigé ici (hors scope : la demande
  portait sur l'affichage carte de repas, pas sur l'algorithme de suggestion) — à
  reprendre avec `familyAllergies` (voir plus bas) le jour où quelqu'un veut que
  « Suggérer » respecte vraiment les allergies ; le volet dislikes resterait lui à
  faire (pas d'équivalent `get_family_dislikes` pour l'instant).
- **INSERT sur `ingredients` refusé pour un utilisateur authentifié normal**, malgré la
  policy censée l'autoriser (voir section Schéma Supabase ci-dessus) — repéré en testant
  l'accès en écriture avant un chantier de refonte du catalogue de recettes. Erreur
  exacte : `permission denied for table ingredients`, avec le hint Postgres
  `GRANT INSERT ON public.ingredients TO authenticated`. Ça ressemble à un GRANT SQL
  manquant sur la table elle-même (indépendant de la policy RLS — en RLS+Postgres il
  faut les deux : le GRANT au niveau table ET une policy qui laisse passer la ligne).
  Concrètement, `handleAddIngredient` (`src/App.tsx`, écran Ingrédients) échoue pour
  n'importe quel compte réel aujourd'hui. Pas corrigé — nécessite une migration
  (`GRANT INSERT ON public.ingredients TO authenticated;`), donc un accès DB en
  écriture (MCP Supabase ou clé service-role), non disponible au moment du repérage.

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
- **Visite guidée (`OnboardingTour`, `src/components/onboarding.tsx`)** — carrousel de
  8 étapes (accueil + un pas par module : Calendrier, Recettes, Courses, Ingrédients,
  Modèles, Famille, Mon compte), chaque étape module montrant une vraie capture d'écran
  de l'app (compte démo) plutôt qu'une maquette. Déclenchée automatiquement à la
  première arrivée sur l'app principale pour un utilisateur donné ; un flag local
  (`STORAGE_KEYS.onboardingSeen`, tableau d'`userId` dans `localStorage`, pas de colonne
  Supabase) évite qu'elle ne se réaffiche — choix délibéré pour rester cohérent avec le
  reste des préférences purement locales (`darkMode`) et éviter une migration de schéma
  pour une donnée non critique (revers : le flag est par navigateur, pas par compte —
  un même utilisateur sur un nouvel appareil la reverra une fois).
  **Exception explicite pour le compte démo** : `currentUser.id === "demo"` contourne le
  flag et réaffiche la visite à *chaque* connexion (jamais écrite dans
  `onboardingSeen`) — le compte démo sert de vitrine à des visiteurs différents à chaque
  essai, pas à un utilisateur récurrent qu'on ennuierait en répétant le tour.
  Rejouable à tout moment via un bouton « Revoir la visite guidée » dans Mon compte
  (`onReplayOnboarding` dans `viewProps.account`), qui contourne le flag sans le modifier.
  **Ton volontairement décontracté (tutoiement)**, tranchant avec le reste de l'app qui
  vouvoie partout ailleurs — demande explicite pour ce moment d'accueil précis, à ne
  pas généraliser au reste des textes ni "corriger" par cohérence.
  Les 7 captures dans `src/assets/onboarding/` ont été générées une fois via un script
  Puppeteer (`puppeteer-core` piloté sur le Chrome déjà installé sur la machine, en
  dehors du repo — aucune dépendance ajoutée à `package.json`) contre le serveur `npm
  run dev` avec le compte démo, puis réduites via `sips`. Pas de pipeline automatisé :
  si l'UI change significativement, les captures sont à régénérer à la main de la même
  façon.
- **Contrôle ingrédients×allergies sur la carte de repas du planning** — un petit
  triangle d'alerte (`AllergyWarningBadge`, icône `alert-triangle`, détail au survol
  via `title` natif) apparaît sur une carte de repas dès qu'un présent a déclaré une
  allergie correspondant à un ingrédient d'une des recettes assignées. Scope
  volontairement restreint à la demande initiale : allergies uniquement (pas les
  aliments non appréciés), et affichage uniquement dans le planning (Jour/Semaine/Perso
  — pas dans les pastilles compactes de la vue Mois, ni ailleurs dans l'app pour
  l'instant).
  - **DB** : fonction `get_family_allergies(p_family_id)` — `SECURITY DEFINER`, même
    schéma que `is_family_member` (contourne le self-only RLS de
    `profile_food_restrictions`, filtre `restriction_type = 'allergy'`). `EXECUTE`
    explicitement restreint à `authenticated` (revoke `public`/`anon` — repéré via
    l'advisor de sécurité juste après la création : `CREATE FUNCTION` accorde `EXECUTE`
    à `PUBLIC` par défaut si on ne le révoque pas, contrairement aux autres fonctions
    `SECURITY DEFINER` du projet qui ne l'accordent pas à `anon`). Suite `test:rls`
    étendue à 17 checks (+3 : lecture par un membre, isolation cross-famille).
  - **Front** : `fetchFamilyAllergies` (`src/lib/dataLayer.ts`) appelle le RPC et
    retourne `{ [memberId]: [{type, id}] }` (même forme que `allergies`/`dislikes` de
    `fetchUserPreferences`). Chargé dans `App.tsx` par effet pour un compte réel (comme
    repas/courses/modèles), calculé par `useMemo` pour le compte démo (famille à un
    seul membre : reprend directement `currentUser.allergies`). `getMealAllergyConflicts`
    (pure, dans `calendar.tsx`) recoupe `meal.recipeIds` × `meal.attendeeIds` ×
    `familyAllergies` × le catalogue `ingredients`, réutilisé dans les 3 rendus de carte
    (`DayPanel`, vue Semaine, vue Perso).
- **Drag and drop d'un créneau vers un autre (vues Semaine et Perso)** — glisser une
  case de repas non vide vers une autre case (n'importe quel jour × type de repas)
  déplace son contenu ; si la case de destination n'est pas vide, échange les deux
  contenus plutôt que d'écraser. Seules les cases non vides ont une poignée de glisser ;
  n'importe quelle case (vide ou non) est une cible de drop valide ; les jours passés de
  la vue Perso restent sans poignée/non-cible, cohérent avec leur traitement
  lecture-seule existant. Vue Mois non concernée (un seul jour visible à la fois dans
  `DayPanel`, pas de destination inter-jour pertinente).
  - **Handler** : `handleMoveMeal(sourceDateStr, sourceType, destDateStr, destType)`
    dans `App.tsx`, à côté de `handleAddMeal`/`handleUpdateMeal`, branché sur
    `viewProps.calendar.onMoveMeal`. Lit le contenu des deux créneaux, écrit celui de la
    source dans la destination puis l'ancien contenu de la destination dans la source
    (échange si la destination avait du contenu, sinon la source se retrouve simplement
    vidée). Suit le même pattern demo/réel que les handlers voisins : `isDemo` → mise à
    jour synchrone du state local ; compte réel → deux `upsertMealSlot` séquentiels
    (jamais en parallèle, pour éviter une course entre les deux refetch complets qui
    suivent chaque écriture) puis un seul refetch final — même idiome que
    `handleApplyTemplate`/`handleDuplicateWeek`. **Inchangé depuis sa création** —
    seule l'interaction de détection du glisser a changé (voir point suivant), pas la
    logique métier d'échange/déplacement.
  - **Interaction — Pointer Events, pas de DnD HTML5 natif** (`src/components/
    calendar.tsx`, Week + Custom views, structure de grille identique) : la première
    version (même session) utilisait `draggable`/`onDragStart`/`onDragOver`/`onDrop`
    HTML5, qui **ne se déclenche pas du tout au toucher** sur mobile Safari/Chrome —
    corrigé avant la fin de la session, remplacé par une implémentation Pointer Events
    unifiée souris+tactile (`onPointerDown`/`onPointerMove`/`onPointerUp`/
    `onPointerCancel`), seule façon de couvrir les deux à la fois sans dupliquer la
    logique. Le glisser part uniquement d'une poignée dédiée (`DragHandle`, icône
    `grip`, coin haut-droit de la carte) plutôt que de la carte entière — contrainte
    technique : `touch-action` se fixe pour toute la durée du geste dès le
    `pointerdown`, donc le mettre sur la carte entière aurait bloqué le scroll tactile
    de la page dès qu'un créneau est rempli (quasi toute la grille dès qu'une semaine
    est planifiée) ; le scoper à la poignée (~2rem) préserve le scroll partout ailleurs.
    Décision validée avec l'utilisateur (impliquait de changer aussi le comportement
    desktop, qui permettait avant de glisser depuis n'importe où sur la carte).
    Mécanique : seuil de 6px avant de committer le glisser (absorbe le tremblement,
    laisse un tap simple ouvrir la modale), détection de la case survolée via
    `document.elementFromPoint` + attribut `data-cell-key` posé sur chaque bouton de
    créneau (plus fiable qu'une déduction depuis la structure DOM), chip flottant
    (`dragPreview`, `position: fixed`, `pointerEvents: "none"` — indispensable, sinon
    `elementFromPoint` toucherait le chip au lieu de la case en dessous) qui suit le
    doigt/curseur pendant le geste. `onClick={(e) => e.stopPropagation()}` sur la
    poignée est nécessaire en plus du `stopPropagation()` sur `pointerdown` : ce dernier
    n'empêche pas l'événement `click` de bulle séparément jusqu'au bouton parent, un tap
    rapide sur la poignée ouvrirait sinon quand même la modale.
  - **Vérifié en conditions réelles** (compte démo, scripts Puppeteer jetables hors
    repo — même méthode que pour les captures d'onboarding) : `page.mouse` pour le
    glisser souris (`pointerType: "mouse"`), `page.touchscreen`/CDP `Input.
    dispatchTouchEvent` pour un vrai glisser tactile (`pointerType: "touch"`, plus
    fidèle que l'émulation "device toolbar" de DevTools) — échange de deux créneaux
    remplis, déplacement d'un créneau rempli vers un créneau vide, tap rapide sur la
    poignée sans effet (pas d'ouverture accidentelle de la modale), et confirmation que
    le scroll tactile démarré depuis le corps de la carte (hors poignée) fonctionne
    toujours normalement.
- **Polish visuel de la carte de repas** — remplace le point coloré (7×7px) par une
  icône `Icon` distincte par type de repas (`sunrise` petit-déjeuner, `cat-main`
  déjeuner, `moon` dîner — ce dernier réutilise l'icône du mode sombre, contexte
  différent donc pas de conflit), différenciation renforcée par la couleur
  (ambre/argile/sauge) en plus de la forme. Ajoute une barre d'accent à gauche
  (`borderLeft` 3px, couleur du type de repas si la case est remplie) pour un repérage
  visuel de la colonne sans lire le texte — implémentée avec `borderTop`/`borderRight`/
  `borderBottom`/`borderLeft` explicites plutôt que le raccourci `border` + une
  surcharge `borderLeft`, React avertissant (dev warning) sur le mélange des deux pour
  la même case. Espacements repris sur les tokens `space.xs`/`space.sm` existants
  (`src/theme.tsx`). Seule nouvelle icône ajoutée à `src/components/ui.tsx` : `grip`
  (poignée de glisser, six points pleins, même convention d'auteurage que `dice`).
  Scope volontairement limité aux vues Semaine et Perso (mêmes axes que le point
  précédent) — pas de photo de recette sur la carte (aucun champ photo au niveau
  recette en base, seulement `recipe_steps.media_url` par étape).
- **Icône de catégorie devant chaque nom de plat sur la carte de repas** (tour suivant,
  demande explicite) — contrairement au point précédent (icône de *type de repas*,
  Semaine/Perso uniquement), ceci ajoute l'icône de *catégorie de recette* (entrée/plat/
  soupe/dessert...) devant chaque nom, et couvre cette fois **les trois rendus** de carte
  (`DayPanel` vue Mois inclus, pas seulement Semaine/Perso — pas de raison de le limiter,
  demande formulée sans restriction de vue). Nouveau composant local `RecipeNamesList`
  (`src/components/calendar.tsx`, à côté de `AllergyWarningBadge`/`AttendeeAvatarStack`)
  mutualisé entre les 3 sites plutôt que de dupliquer la logique une 3ᵉ fois — prend
  `recipeIds`+`recipes`, résout chaque recette et sa `RECIPE_CATEGORIES` correspondante,
  rend `<CategoryIcon icon={cat.icon} size={12} />` avant chaque nom, séparés par `, `.
  Contourne la même limitation que `CategoryIcon`/`Icon` ne prenant pas réellement en
  compte leur prop `color` (ignorée en silence par `Icon`, voir remarque plus haut sur
  les icônes de type de repas) : la couleur par catégorie (`cat.hex`) est appliquée via
  un `<span style={{color: cat.hex}}>` englobant plutôt que la prop, pour que
  `currentColor` hérite correctement — même technique que pour l'icône de type de repas.
- **Icônes de catégorie manquantes dans la modale de recette** — voir bug corrigé n°12
  ci-dessus (repéré en creusant la demande précédente : le sélecteur de `RecipeModal`
  affichait le nom brut de l'icône en texte plutôt que l'icône elle-même).

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
