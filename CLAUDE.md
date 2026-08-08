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
    App.tsx                    1269  composant App racine (state, handlers, routing)
    main.tsx                      9  point d'entrée Vite
    theme.tsx                   641  design tokens + GlobalStyle
    constants.ts                165  constantes métier (catégories, régimes, etc.)
    types.ts                     22  AppUser, AuthResult, AuthChangeCallback
    lib/
      supabaseClient.ts          47  client Supabase (getSupabase())
      authService.ts            272  AuthService
      dataLayer.ts              378  fetch*/save* Supabase (14 fonctions)
      storage.ts                656  localStorage + démo + jeu de données mock
      dateUtils.ts               23  todayStr/getMondayOf/dateOfSlot
    components/
      ui.tsx                    416  primitives UI génériques
      layout.tsx                216  Sidebar/MobileDrawer/FamilySelector
      auth.tsx                  370  écrans de connexion/inscription
      privacy.tsx                55  politique de confidentialité
      account.tsx               701  compte + profil (régime/allergies/aliments non appréciés) + proposition post-inscription
      family.tsx                289  gestion de la famille
      shopping.tsx              297  liste de courses
      templates.tsx             369  semaines types + écran dédié « Modèles »
      ingredients.tsx            86  catalogue d'ingrédients (écran « Ingrédients »)
      onboarding.tsx            141  visite guidée (OnboardingTour)
      recipeSelection.tsx       207  sélecteur de recette pour un créneau
      recipes.tsx               915  CRUD recettes, mode cuisine
      calendar.tsx             1633  planning (jour/semaine/mois)
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
  jour-là, avec `status`, `restaurant_name`, `restaurant_url`) → `meal_plan_meal_recipes`
  (recettes du repas) + `meal_plan_meal_attendees` (membres présents à ce repas —
  `member_id`, remplacement complet à chaque sauvegarde). Un nouveau créneau sans
  `attendeeIds` explicite est peuplé par défaut avec **tous** les membres de la famille
  active. La liste de courses pondère chaque repas par la somme des multiplicateurs
  d'appétit des présents plutôt qu'un simple headcount. `restaurant_name`/`restaurant_url`
  (texte libre + lien, typiquement Google Maps) ne sont renseignés que pour le statut
  `restaurant` — voir « Lieu du restaurant » dans Fonctionnalités ajoutées après la
  migration.
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
13. **`familyAllergies` figé à `{}` pour tout compte réel** (`src/App.tsx`) — repéré en
    travaillant sur le bouton d'alerte allergie : le `useMemo` qui expose
    `familyAllergies` n'avait pas `realFamilyAllergies` dans son tableau de
    dépendances, donc React ne recalculait jamais la valeur après la résolution du
    fetch initial (`fetchFamilyAllergies`/RPC `get_family_allergies`, qui fonctionnait
    correctement). Conséquence : l'alerte allergie sur la carte de repas (triangle,
    puis bouton) ne s'est **jamais affichée pour un compte réel** depuis son
    introduction, alors que les données étaient correctes en base — seul le compte
    démo (chemin de calcul différent, direct depuis `currentUser.allergies`)
    fonctionnait, ce qui a masqué le problème jusqu'ici. Dépendance ajoutée, corrigé.
14. **Vue Mois : dates décalées d'un jour pour tout fuseau en avance sur UTC**
    (`calendarWeeks` dans `src/components/calendar.tsx`) — repéré en vérifiant
    l'affichage du bloc d'alertes dans `DayPanel` : le repas plannifié sur un jour
    donné (confirmé présent en base et visible en vue Semaine) apparaissait comme
    vide en vue Mois pour ce même jour. Cause : `anchor = new Date(year, month, 1)`
    est construit à minuit local (00:00:00, aucune heure précisée) ; sa conversion
    `.toISOString().split("T")[0]` bascule alors sur la veille pour tout fuseau en
    avance sur UTC (Europe, Asie, Australie...), décalant silencieusement toutes les
    `dateStr` dérivées de cet ancrage — donc tout le mois affiché. Le reste du code
    évitait déjà ce piège en ancrant explicitement à midi (`customDays`,
    `getMondayOf`, `dateOfSlot` dans `src/lib/dateUtils.ts`, ce dernier avec le
    commentaire « immunisé contre tout décalage timezone ») — seule `calendarWeeks`
    l'avait raté, et seulement pour sa branche `viewMode === "month"` (la branche
    semaine/perso restait accidentellement correcte : elle réutilise l'heure courante
    de `currentDate`, hors de la fenêtre à risque sauf tout près de minuit local).
    Corrigé en ancrant les deux branches à midi (`new Date(..., 12)`), plutôt que de
    ne patcher que la branche mois — évite de laisser la branche semaine/perso
    « correcte par chance » selon l'heure de la journée.
15. **Glisser-déposer d'un repas : convives non transférés vers une case vide, puis
    correction du diagnostic initial** (`handleMoveMeal`, `src/App.tsx`) — repéré en
    creusant le signalement « les convives ne sont pas transférés » sur un glisser
    vers une case vide (pas un échange).
    - **Premier correctif (incomplet)** : `destData` (contenu à réécrire sur la case
      source une fois son ancien contenu déplacé vers la destination) posait
      `attendeeIds: undefined` pour une case de destination vide, or `undefined` a une
      signification précise dans `upsertMealSlot` (« ne pas toucher la sélection
      existante ») — sur une case source qui existe déjà, ça laissait donc les anciens
      `meal_plan_meal_attendees` en place au lieu de les vider. Corrigé dans un premier
      temps en remplaçant `undefined` par `[]`, ce qui avait pour effet de faire
      **suivre/échanger les convives avec la recette déplacée** (comme les recettes et
      le statut) — testé et confirmé fonctionnel à l'époque.
    - **Retour utilisateur sur ce premier correctif** : ce n'est pas le comportement
      voulu. Les convives présents sont une propriété du **créneau** (qui est là ce
      jour/repas-là), pas du plat qui y est servi — glisser une recette d'une case à
      une autre ne doit jamais changer qui est présent sur les cases source et
      destination. **Corrigé une seconde fois** : `sourceData`/`destData` ne portent
      plus `attendeeIds` du tout (seulement `recipeIds`/`status`/`restaurantName`/
      `restaurantUrl`) ; les deux appels à `upsertMealSlot` passent explicitement
      `undefined` pour `attendeeIds`, qui laisse chaque créneau existant avec ses
      propres convives inchangés (ni transférés, ni échangés) — sauf pour un nouveau
      créneau de destination qui n'existait pas avant le glisser, où il n'y a rien à
      « ne pas toucher » : il reçoit alors le même défaut que `handleAddMeal`, toute la
      famille, pas les convives de la source.
    - **Piège de vérification rencontré en testant ce second correctif** : une première
      passe de test (compte `rls-test-a`, glisser réel via `page.mouse`) a semblé
      montrer que le second `upsertMealSlot` (écriture sur la case source) ne
      s'exécutait jamais — logs de diagnostic ajoutés temporairement dans
      `handleMoveMeal`, confirmant que l'exécution s'arrêtait bien après le premier
      appel sans lever d'erreur. Cause réelle : un délai d'attente de 2,5 s après le
      glisser dans le script de test, insuffisant pour laisser le temps aux deux appels
      Supabase séquentiels de se terminer (latence réseau du projet de test) — porté à
      12 s, les deux appels et le refetch se terminent normalement. Pas un bug
      applicatif, mais un faux négatif de la méthode de vérification — à garder en tête
      pour la prochaine fois qu'un enchaînement de plusieurs appels Supabase awaités
      semble "ne pas se terminer" dans un test Puppeteer jetable.
    - **Revérifié après le second correctif** avec des convives volontairement
      différents des deux côtés (pour bien distinguer un transfert erroné d'un maintien
      correct) : déplacement vers une case vide → recette déplacée, case source vidée
      de sa recette mais garde ses convives d'origine, case destination reçoit la
      recette avec le défaut "toute la famille" (pas les convives de la source) ;
      échange entre deux cases pleines à convives différents → recettes échangées,
      convives de chaque case inchangés des deux côtés (jamais échangés).
16. **Convives non éditables pour un repas Restaurant/Pas de repas**
    (`RecipeSelectionModal`, `src/components/recipeSelection.tsx`) — le bloc
    « Convives présents » avait `opacity`/`pointerEvents: none` dès que
    `status !== "normal"`, alors que ces deux statuts concernent quand même des
    personnes (ex. qui va au restaurant). Seul le bloc de sélection des recettes
    (`RecipeRow`) doit rester désactivé pour ces statuts (choisir un plat n'a pas
    de sens hors "normal") — la désactivation du bloc convives a été retirée sans
    toucher à celle des recettes.
17. **Connexion démo qui se déconnecte toute seule ~1s après "Essayer" (et après tout
    rechargement de page)** (`src/lib/authService.ts`, `initSupabaseListener`) —
    découvert en essayant de scripter une connexion démo pour régénérer les captures
    d'écran de la visite guidée. `AuthService.onAuthChange` initialise
    inconditionnellement un abonnement à `sb.auth.onAuthStateChange`, y compris pour un
    visiteur qui va se connecter en démo — ce listener Supabase notifie une fois, de
    façon asynchrone, avec `session = null` dès l'abonnement (comportement standard de
    supabase-js). Cette notification arrivait *après* une connexion démo déjà réussie
    (ou déjà restaurée depuis le `localStorage` au chargement) et appelait
    `notify(null)`, ramenant silencieusement l'utilisateur à l'écran de connexion
    quelques centaines de ms plus tard — reproductible à 100% en observant l'état de la
    page à intervalles de 400ms après le clic sur "Essayer". Corrigé en ignorant cette
    notification "pas de session" précise quand `localStorage["mealPlanner_
    currentUser"].id === "demo"` (seule source de vérité qui reste valide même juste
    après un rechargement, avant que ce module n'ait lui-même revu la moindre
    notification) — le compte démo n'a jamais de session Supabase, cet événement ne le
    concerne donc jamais.
18. **Calendrier/courses/ingrédients du compte démo vides malgré une connexion réussie**
    (`src/App.tsx`) — découvert juste après avoir corrigé le bug précédent : la
    connexion démo restait stable, mais `recipes`/`mealPlans`/`shoppingList`/
    `ingredients` (initialisés via `useState(() => isDemo ? initialX : [])`) restaient
    bloqués à `[]` pour toute la session. Cause : ces initialisateurs ne s'exécutent
    qu'au tout premier rendu du composant, où `currentUser` (donc `isDemo`) vaut encore
    `null`/`false` pour quiconque n'était pas déjà connecté avant ce chargement de page
    — le cas normal d'une connexion via le bouton "Essayer" sur l'écran de connexion.
    Corrigé par un effet dédié qui (re)seed ces quatre tableaux dès que `currentUser?.id`
    devient `"demo"`, quel que soit l'état des initialisateurs `useState`. Combiné à un
    second bug de schéma (point suivant), c'est ce qui faisait que **toutes** les
    captures d'écran précédentes de la visite guidée montraient des écrans vides — pas
    un défaut de mise en scène, le compte démo ne pouvait littéralement pas afficher son
    propre jeu de données.
19. **`initialRecipes` (jeu de données du compte démo, `src/lib/storage.ts`) sans champ
    `scope`** — repéré en constatant qu'un repas du planning démo avec un `recipeIds`
    non vide affichait quand même "+ Ajouter" au lieu du nom de la recette (confirmé par
    inspection directe du DOM : la case portait bien la bordure d'accent et la poignée
    de glisser d'un créneau rempli, seul le nom du plat manquait). Cause : `familyRecipes`
    (`src/App.tsx`, filtre introduit pour le partage de recettes multi-famille) exige
    `scope === "global"` ou `createdBy`/`sharedWith`/`familyId` correspondant à
    l'utilisateur — champs qu'`initialRecipes` n'a jamais eus. Toutes les recettes démo
    étaient donc invisibles partout où `familyRecipes` est utilisé (cartes du planning,
    génération de la liste de courses...), sans erreur ni écran vide évident — seul
    "Base commune" (`RecipesView`, alimenté par la prop distincte `globalRecipes`, non
    filtrée) fonctionnait, ce qui a longtemps masqué le problème. Corrigé en taguant
    `initialRecipes` avec `scope: "global"` à l'export (`rawInitialRecipes.map(r => ({
    ...r, scope: "global" }))`) — cohérent avec la façon dont ces recettes sont déjà
    traitées ailleurs (prop `globalRecipes: isDemo ? initialRecipes : ...`).
20. **Mise à jour du profil démo qui efface les champs précédemment renseignés de
    l'écran** (`AuthService.updateProfile`, `src/lib/authService.ts`) — repéré en
    enchaînant régime → allergies → aliments non appréciés depuis "Mon compte" du
    compte démo pour peupler les captures d'écran : chaque étape faisait disparaître la
    précédente de l'écran (le régime coché disparaissait après avoir renseigné une
    allergie, l'allergie disparaissait après avoir renseigné un aliment non apprécié...).
    Cause : la branche démo notifiait les abonnés avec `{ ...DEMO_USER, ...updates }`
    (le profil démo *par défaut*, vierge) au lieu de `{ ...current, ...updates }` (le
    profil réellement affiché jusque-là) — seul le `localStorage` accumulait
    correctement les champs (via une ligne distincte, déjà correcte), ce qui rendait le
    bug invisible après un rechargement complet et a retardé le diagnostic. Corrigé en
    alignant `notify(...)` sur la même base fusionnée que la ligne `saveToStorage`.

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
- **Refonte éditoriale du catalogue de recettes globales** (demande explicite : « une
  vraie source d'inspiration », avec étapes/durées, en gardant les recettes accessibles
  au plus grand nombre) — **scope volontairement limité aux 55 recettes `scope=global`**,
  décision validée avec l'utilisateur : les 12 recettes `family` et les 2 `private`
  appartiennent à de vrais comptes et n'ont pas été touchées. État constaté avant
  correction : les 49 recettes non-chinoises (id 5-53, présentes depuis avant la
  migration Supabase) n'avaient **aucune étape** en base et des listes d'ingrédients
  très pauvres (4-5 items, souvent sans sel/poivre), avec plusieurs erreurs de fond —
  ex. carbonara au saumon+lait sans œuf ni lardon, houmous aux lentilles au lieu de
  pois chiches, guacamole sans avocat, riz cantonais à la sauce tomate, tajine
  d'agneau à la saucisse, quiche lorraine sans œuf. Les 6 recettes chinoises (id 68-73,
  seedées lors d'une session précédente) avaient déjà des étapes détaillées et n'ont eu
  besoin que des nouveaux champs.
  - **Schéma** : 3 colonnes ajoutées sur `recipes` — `origin_country` (text, libre, pas
    de référentiel dédié), `prep_minutes`/`cook_minutes` (integer). Décision : durées
    séparées prépa/cuisson plutôt qu'un total unique, pour affichage plus précis dans la
    fiche recette.
  - **Contenu** : chaque recette corrigée/complétée individuellement (ingrédients
    corrigés ou ajoutés, étapes réécrites avec `timer_seconds`/`temperature_c` quand
    pertinent, pays d'origine, durées) puis appliquée en base par lots de SQL direct
    (comme le seed chinois précédent) — généré via un script Node jetable
    (`scratchpad/generate_sql.mjs` + `recipes_data.mjs`, hors repo) qui mappe les noms
    d'ingrédients vers leurs IDs et échoue fort si un nom n'existe pas encore, plutôt que
    d'insérer une ligne cassée. **34 nouveaux ingrédients** ajoutés au catalogue partagé
    pour permettre ces corrections (farine, levure chimique, œuf déjà présent, avocat,
    pois chiches, tahini, lardons, pâte brisée, pâte à pizza, bouillons, vin blanc/rouge,
    agneau, thon, poireau, aubergine, épices courantes...), toutes en ingrédients du
    quotidien (pas de produit de niche) pour respecter la contrainte d'accessibilité.
  - **Front** : `fetchRecipesForUser` (`src/lib/dataLayer.ts`) lit et mappe les 3
    nouveaux champs (`originCountry`/`prepMinutes`/`cookMinutes`) ; les 3 points
    d'écriture recette (`handleAddRecipe`/`handleEditRecipe`/`handleImportRecipe` dans
    `src/App.tsx`) les persistent. `RecipeModal` (`src/components/recipes.tsx`) gagne
    trois champs (pays d'origine en texte libre, prépa/cuisson en minutes) à côté des
    portions. `RecipeDetailModal` affiche un badge durée totale (icône `clock`, format
    compact `"1h05"`/`"35 min"` via l'helper `formatDuration`) et un badge pays (icône
    `globe`, nouvelle icône ajoutée à `src/components/ui.tsx`) à côté du badge portions.
    `RecipesView` affiche la même info en discret (`mp-micro`) sous les tags, en vue
    grille et en vue compacte. Le compte démo (jeu de données local dans
    `src/lib/storage.ts`) n'a pas été touché — champs absents, badges ne s'affichent
    simplement pas pour ce compte, pas d'erreur.
  - **Vérifié** : `npm run build`, `npm run typecheck` (aucune régression au-delà du
    style `any` implicite déjà omniprésent dans ces fichiers, cohérent avec le reste du
    codebase), `npm run test:rls` (18 checks, tous verts — migration purement additive,
    aucune policy touchée), advisors sécurité Supabase revérifiés après migration (mêmes
    warnings pré-existants, rien de nouveau introduit).
  - **Photo de plat — échantillon sur 5 recettes** (tour suivant, demande explicite) :
    2 colonnes ajoutées, `photo_url` et `photo_attribution` (text) sur `recipes`.
    **Décision notable** : la première tentative visait à héberger les photos dans un
    nouveau bucket Storage `recipe-photos`, ce qui aurait nécessité une policy
    d'upload temporaire ouverte au rôle `anon` (aucune clé service-role disponible
    dans cette session pour bypasser RLS à l'upload) — **bloquée par le
    classificateur de sécurité d'auto mode** (à raison : c'est exactement le genre de
    policy `WITH CHECK (true)` déjà repéré comme trop permissif par l'advisor sur
    `ingredients`). Confirmé avec l'utilisateur : plutôt que de forcer cette
    permission, **`photo_url` pointe directement vers Wikimedia Commons** (images
    sous licence Creative Commons, CDN stable) — aucun bucket, aucune policy Storage
    à toucher. `photo_attribution` conserve la mention légale (auteur + licence)
    exigée par les licences CC BY/BY-SA, affichée sous la photo.
    Recettes choisies pour la diversité des cuisines : Pâtes carbonara (5), Bœuf
    bourguignon (8), Tarte aux pommes (33), Guacamole (39), Poulet Kung Pao (73).
    Affichage : `RecipeDetailModal` (bandeau photo en haut, marge négative sur le
    padding du modal pour un rendu bord-à-bord, attribution en légende), grille de
    `RecipesView` (vignette en haut de chaque `mp-recipe-card`, même technique de
    marge négative sur `.mp-card`), vue compacte (miniature 1.8rem carrée à la place
    de l'icône de catégorie quand une photo existe). Aucune UI d'upload ajoutée
    (hors scope de l'échantillon) — `handleAddRecipe`/`handleEditRecipe` ne
    persistent pas encore `photoUrl`/`photoAttribution`, mais comme Supabase
    `.update()` ne touche que les colonnes passées explicitement, éditer une de ces
    5 recettes ne fait pas disparaître sa photo. À reprendre si l'échantillon est
    validé : soit étendre aux 50 autres recettes globales, soit ajouter un vrai champ
    d'upload dans `RecipeModal` (auquel cas le bucket Storage + policy authenticated
    deviendra pertinent, sur le même modèle que `recipe-step-photos`).
  - **Photo de plat étendue aux cartes du planning** (tour suivant, demande explicite
    après confirmation que l'échantillon fonctionnait) — `RecipeNamesList`
    (`src/components/calendar.tsx`, seul composant partagé entre `DayPanel`, la vue
    Semaine et la vue Perso) affiche désormais une miniature ronde (0.9rem, bordure de
    la couleur de catégorie) à la place de l'icône de catégorie quand
    `recipe.photoUrl` existe, juste avant le nom du plat. Un seul point de code
    modifié suffit à couvrir les 3 vues grâce à ce composant déjà mutualisé.
  - **Diagnostic « je ne vois pas les photos »** — repéré après coup que le premier
    signalement de l'utilisateur venait d'un cache navigateur/PWA (service worker
    `registerType: 'autoUpdate'`, onglet resté ouvert sur l'ancien bundle) : un hard
    refresh a suffi, aucune régression réelle. Bon réflexe pour la prochaine fois
    qu'un changement front semble ne pas s'appliquer en prod malgré un déploiement
    confirmé (`git log`/`origin/main` à jour).
  - **Méthode de vérification** : re-confirmé à chaque étape avec un vrai compte
    (`rls-test-a@keskom-test.local`, scripts Puppeteer jetables hors repo, même
    méthode que pour les captures d'onboarding) plutôt que de se fier au seul
    `npm run build` — a permis de repérer que le premier script de test échouait
    silencieusement sur le sélecteur de recette (une `<label>`+checkbox, pas un
    `<button>`) avant de conclure à tort à un bug. Créneau de test ajouté puis retiré
    proprement pour ne pas polluer les fixtures RLS.
- **Consulter le contenu d'une recette depuis une carte de repas** (tour suivant,
  demande explicite : garder la modification de la composition du créneau, mais
  ajouter la consultation du contenu de chaque recette) — dans `RecipeNamesList`
  (`src/components/calendar.tsx`, composant unique partagé par `DayPanel`, vue
  Semaine et vue Perso), le nom de chaque recette est désormais cliquable
  (`stopPropagation` indispensable : sans lui, le clic remonte au bouton parent qui
  ouvre l'éditeur de composition) et ouvre `RecipeDetailModal` en lecture seule.
  Cliquer ailleurs sur la case garde le comportement existant (éditeur de
  composition du créneau, choix des recettes/statut/convives).
  - **`RecipeDetailModal` gagne un prop `readOnly`** (`src/components/recipes.tsx`,
    défaut `false`) plutôt que de dupliquer le composant : masque la barre d'onglets
    Variantes/Partager et le bouton « Modifier » en bas de modale, garde tout le
    reste (photo, portions/durée/origine, ingrédients, étapes, bouton **Mode
    cuisine** — volontairement conservé, très utile consulté depuis le planning).
    Décision : ne pas câbler `onEdit`/`onCreateVariant`/`onShareRecipe` depuis le
    calendrier plutôt que de dupliquer toute la chaîne de handlers recette
    (`handleEditRecipe`, `handleCreateVariant`, `handleShareRecipe`) jusque-là —
    hors scope de la demande (« consulter », pas « éditer la recette » depuis cet
    écran), et sans le prop `readOnly` un bouton « Créer ma variante » sans
    `onCreateVariant` aurait planté au clic.
  - `DayPanel` et `CalendarView` gèrent chacun leur propre état
    `detailRecipe`/`setDetailRecipe` (instances indépendantes, pas de state
    partagé) ; seul `ingredients` (déjà présent dans les deux) est nécessaire pour
    le mode lecture seule — pas besoin de faire remonter `currentUser`/
    `userFamilies`/`activeFamily` jusqu'au calendrier pour cette fonctionnalité.
  - Vérifié avec le même compte de test réel + scripts Puppeteer jetables : clic sur
    le nom → fiche sans bouton Modifier ni onglet Variantes ; clic ailleurs sur la
    case → éditeur de composition inchangé ; créneau de test nettoyé après coup.
- **Plan de préparation (parallélisation des repas à plusieurs recettes)** (tour
  suivant, demande explicite : garder l'édition de la composition du repas, mais
  guider la parallélisation des préparations quand plusieurs plats sont prévus au
  même créneau). Décisions validées avec l'utilisateur avant implémentation (3
  questions posées) : tag de phase explicite par étape plutôt qu'une heuristique par
  mots-clés (plus fiable, mais chantier de contenu presque aussi long que la refonte
  du catalogue) ; déclenchement uniquement sur les repas à **≥ 2 recettes** (c'est là
  que la parallélisation a un intérêt) ; nouveau bouton dédié sur la carte de repas
  plutôt qu'une extension du Mode cuisine existant.
  - **Schéma** : colonne `phase` sur `recipe_steps` (`text not null default 'cook'`,
    `check (phase in ('prep','cook'))`). Règle de tag utilisée pour les 55 recettes
    globales (~273 étapes retaguées une par une, pas d'heuristique) : `prep` = tout ce
    qui ne demande pas de feu (découpe, sauces froides, pâtes/appareils crus,
    marinade, préchauffage du four — volontairement classé `prep` : ça se lance en
    parallèle du reste de la mise en place) ; `cook` = dès que le feu/four est utilisé,
    ou qu'une étape dépend d'un résultat déjà cuit (y compris assemblage final et
    service). Script de génération jetable (`scratchpad/generate_phase_sql.mjs` +
    `phases_data.mjs`, hors repo), avec une passe de validation (compte des étapes
    par recette vs longueur du tableau de phases) avant application en base — a évité
    d'insérer des phases mal alignées sur le mauvais `order_index`.
  - **Éditeur de recette** (`RecipeModal`, `src/components/recipes.tsx`) : bascule
    Préparation/Cuisson ajoutée au formulaire d'ajout d'étape (`stepPhaseInput`,
    défaut `"cook"` pour matcher le défaut SQL) et badge cliquable sur chaque étape
    déjà ajoutée (`toggleStepPhase`) — nécessaire pour que les recettes créées par de
    vrais utilisateurs profitent aussi du plan de préparation, pas seulement les 55
    recettes globales retaguées manuellement.
  - **Front** : `fetchRecipesForUser`/`saveRecipeSteps` (`src/lib/dataLayer.ts`)
    lisent/écrivent `phase` (défaut `"cook"` si absent, jamais `null`/`undefined` côté
    app). Nouveau composant `MealPrepPlanModal` (`src/components/calendar.tsx`,
    local au fichier, pas exporté) : regroupe les étapes de **toutes** les recettes
    d'un même créneau par phase, puis par recette dans chaque phase (pas de fusion à
    plat entre recettes — on ne connaît pas leurs dépendances, mélanger l'ordre
    aurait été trompeur). Bouton d'ouverture (icône `list`, déjà existante) affiché
    dans `RecipeNamesList` uniquement si `(meal.recipeIds||[]).length >= 2`, avec
    `stopPropagation` (même contrainte que le clic sur le nom d'une recette : sans
    ça, remonte au bouton parent qui ouvre l'éditeur de composition). `DayPanel` et
    `CalendarView` gèrent chacun leur propre state `prepPlanMeal` (même pattern que
    `detailRecipe`, instances indépendantes).
  - Vérifié avec le compte de test réel : 2 recettes planifiées sur un même créneau
    (Pâtes carbonara + Bœuf bourguignon), plan de préparation ouvert et contrôlé
    visuellement — carbonara apparaît dans les deux phases (a une étape sans feu),
    bourguignon uniquement en Cuisson (aucune étape `prep` taguée pour cette
    recette, cohérent avec son contenu). Créneau de test nettoyé après coup.
  - **Bouton rendu plus explicite** (retour utilisateur : le déclencheur — une icône
    nue — passait inaperçu) — remplacé par `PrepPlanButton`
    (`src/components/calendar.tsx`), une pastille avec icône **et** libellé
    (« Plan de prépa »), sur sa propre ligne sous les noms de recettes plutôt qu'en
    ligne à côté (variante `compact` pour les cellules plus étroites de Semaine/Perso).
    Étape « Le Calendrier » de la visite guidée (`src/components/onboarding.tsx`,
    `STEPS[1].text`) mise à jour pour mentionner explicitement ce bouton — capture
    d'écran non régénérée (le pipeline est manuel, une simple modification de texte
    ne le justifiait pas).
  - **Photo étendue aux 55 recettes globales** (tour suivant, demande explicite —
    l'échantillon de 5 est validé) : mêmes principes que l'échantillon (URL externe
    CC, pas de bucket Storage), recherches faites via l'API Openverse (agrège
    Wikimedia Commons et Flickr, filtrées `license_type=commercial`). Attribution
    enrichie pour préciser la source réelle de l'image (« Flickr » vs « Wikimedia
    Commons », déduit du domaine de l'URL) plutôt que de l'indiquer en dur comme
    pour l'échantillon initial (qui ne venait que de Wikimedia).
    **Contrôle qualité nécessaire** : les premiers résultats de recherche par mots-clés
    anglais contenaient plusieurs faux amis repérés et corrigés avant application en
    base — ex. « Slow-cooker venison neck roast » (chevreuil) proposé pour le quinoa
    aux légumes rôtis, « Maine Lobster... on Tostones » pour le cabillaud au four,
    une photo de romanesco sans lien pour les brocolis à l'ail, un plat mixte
    mentionnant juste au passage « Braised Tofu » parmi 4 autres composants pour le
    tofu braisé — 8 recherches ont dû être refaites avec des termes plus précis.
    Script de sélection en 2 passes jetable (hors repo,
    `scratchpad/photos2/`) : recherche large puis vérification manuelle des titres
    avant de committer les URLs, plutôt qu'auto-sélectionner le premier résultat —
    la leçon du bug carbonara-au-saumon (contenu généré sans vérification) s'applique
    aussi bien aux photos qu'au texte. Les 50 URLs testées une à une (curl, 200 OK)
    avant écriture en base.
    Vérifié avec le compte de test réel : les 55 cartes de la Base commune chargent
    bien leur image (0 lien cassé), capture pleine page de la grille contrôlée
    visuellement.
- **Alerte allergie transformée en bouton explicite avec modale de détail** (tour
  suivant, demande explicite : même esprit que le bouton Plan de prépa, mais pour
  l'alerte allergie — un plat/ingrédient/personnes concernées plutôt qu'un simple
  survol). `AllergyWarningBadge` (`src/components/calendar.tsx`) n'est plus un
  `<span>` passif avec `title` natif : c'est désormais un vrai bouton pastille berry
  (« ⚠ Allergie(s) », variante `compact`), qui ouvre `AllergyAlertModal` — les
  conflits (déjà calculés par `getMealAllergyConflicts`, inchangé) sont regroupés par
  recette puis par ingrédient, avec la liste des personnes concernées par ingrédient
  (dédupliquée). Câblé dans les 3 vues (`DayPanel`/Semaine/Perso) avec le même state
  `allergyAlert` par instance de composant (même pattern que `detailRecipe`/
  `prepPlanMeal`) et le même `stopPropagation()` nécessaire pour ne pas rouvrir
  l'éditeur de composition du créneau.
  - **Bug pré-existant découvert et corrigé en testant** (indépendant de ce chantier,
    présent depuis l'ajout de la fonctionnalité allergie elle-même) : `familyAllergies`
    (`src/App.tsx`) restait figé à `{}` après le chargement initial pour **tout compte
    réel** — le `useMemo` qui le calcule n'avait pas `realFamilyAllergies` dans son
    tableau de dépendances, donc React ne recalculait jamais la valeur après la
    résolution du fetch (`fetchFamilyAllergies`/RPC `get_family_allergies`), qui lui
    fonctionnait très bien. Résultat concret : le triangle d'alerte allergie sur la
    carte de repas ne s'est **jamais affiché pour un compte réel** depuis son
    introduction, malgré des données correctes en base — seul le compte démo (qui ne
    passe pas par ce `useMemo`, `familyAllergies` recalculé directement depuis
    `currentUser.allergies`) fonctionnait, ce qui a longtemps masqué le problème.
    Dépendance ajoutée, comportement confirmé avec le compte de test réel (allergie
    fixture au poulet + recette « Poulet rôti aux herbes » + convive présent → badge
    et modale corrects).
  - Repéré via un `console.log` temporaire (retiré après diagnostic, pas laissé dans
    le code) plutôt qu'en devinant — les valeurs de `recipeIds`/`attendeeIds`/
    ingrédients étaient toutes correctes, seul `familyAllergies` arrivait vide dans
    `getMealAllergyConflicts`, ce qui a permis de remonter jusqu'au `useMemo` en
    quelques minutes plutôt que de suspecter à tort la RLS ou le RPC.
- **Regroupement des boutons Allergie / Plan de prépa** (tour suivant, demande
  explicite : même bloc, en ligne sur web, en colonne sur mobile) — nouvelle classe
  CSS globale `.mp-meal-alerts` (`src/theme.tsx`, avec les autres règles responsive
  de la vue semaine, même breakpoint 768px) : `flex-direction: row` par défaut,
  `column` en dessous de 768px. Les deux boutons (`AllergyWarningBadge`,
  `PrepPlanButton`) perdent leurs `alignSelf`/`marginTop` individuels (pensés à
  l'origine pour des blocs séparés) au profit du conteneur commun, qui n'est rendu
  que si au moins un des deux a quelque chose à montrer. Câblé dans les 3 vues.
  Vérifié aux deux tailles (desktop 1280px et mobile 390px, viewport iPhone) avec le
  compte de test réel : bouton en ligne sur desktop, empilés en colonne sur mobile,
  dans `DayPanel` et la vue Semaine.
  - **Vérification mobile plus large demandée** (« vérifie la disposition de
    l'affichage du planning sur mobile ») : les 3 vues (Semaine/Mois/Perso) contrôlées
    à 390×844 — rien de cassé, seul un détail préexistant mineur repéré (le nom d'une
    recette peut se couper avant la virgule séparant deux plats dans
    `RecipeNamesList`), non corrigé car hors scope de la demande.
- **Lieu du restaurant (nom + lien Google Maps)** — demande explicite, groupée avec
  deux corrections sur le même écran (voir bugs 15/16 ci-dessus : convives non
  transférés au glisser-déposer, convives non éditables pour Restaurant/Pas de repas).
  Quand le statut d'un créneau est « Restaurant », deux champs texte optionnels
  apparaissent dans `RecipeSelectionModal` (`src/components/recipeSelection.tsx`) :
  nom du restaurant et lien (typiquement Google Maps, mais n'importe quelle URL est
  acceptée — pas de validation de domaine, cohérent avec le reste de l'app qui ne
  valide pas non plus les URLs de recettes importées). Persistés dans deux nouvelles
  colonnes `meal_plan_meals.restaurant_name`/`restaurant_url` (migration
  `add_restaurant_fields_to_meal_plan_meals`), toujours écrites (pas de sémantique
  `undefined` = « ne pas toucher » comme pour `attendeeIds` : si le statut repasse à
  normal/skip, les deux sont explicitement remises à `null`). Affiché sur la carte de
  repas dans les 3 vues (`DayPanel`/Semaine/Perso) à la place du texte statique
  « Restaurant » — nom du restaurant si renseigné (sinon fallback « Restaurant »), et
  une icône `map-pin` cliquable (nouvelle icône dans `src/components/ui.tsx`, même
  convention que les icônes de catégorie) ouvrant le lien dans un nouvel onglet quand
  il est renseigné, avec `stopPropagation` pour ne pas rouvrir l'éditeur du créneau.
  `handleMoveMeal`/`handleAddMeal`/`handleUpdateMeal` (`src/App.tsx`) et
  `upsertMealSlot` (`src/lib/dataLayer.ts`) propagent ces deux champs comme le reste
  du contenu-plat d'un créneau (recettes/statut), y compris lors d'un glisser-déposer
  — mais **pas** comme les convives, qui suivent une règle différente depuis la
  correction du bug 15 (voir ci-dessus : ils restent attachés au créneau, jamais
  transférés/échangés avec le contenu déplacé).
  - **Bug latent découvert et corrigé en cours de route** : `QuickPlanModal`
    (accessible depuis le bouton flottant « + », `src/components/calendar.tsx`) ne
    passait jamais de prop `onSaveStatus` à `RecipeSelectionModal` — choisir
    Restaurant ou Pas de repas puis valider depuis ce point d'entrée précis aurait
    appelé une fonction `undefined` (`TypeError`, crash silencieux de la modale).
    Jamais remarqué car ce chemin spécifique n'avait apparemment jamais été testé
    avec un statut non-normal. Corrigé en câblant `onSaveStatus` comme les 3 autres
    points d'entrée (`DayPanel`, vue Semaine, vue Perso).
  - **Vérifié avec le compte de test réel** (`rls-test-a`, famille A) : passage au
    statut Restaurant → bloc convives redevient cliquable (`pointerEvents: auto`,
    `opacity: 1`, vérifié par lecture du style calculé) et un convive retiré via
    clic est bien répercuté en base ; nom + lien saisis (« Chez Mario » +
    URL Maps) → persistés en base et affichés sur la carte avec l'icône lien
    cliquable. Fixture temporaire (second membre de famille « Membre Test 2 »,
    nécessaire pour distinguer un sous-ensemble de convives de « tout le monde »)
    supprimée après vérification, famille A revenue à son état d'origine
    (un seul membre réel, `RLS Test A`).
- **Proposition d'initialiser le profil alimentaire** (demande explicite : « Lors de la
  création d'un compte propose à l'utilisateur d'initialiser ses préférences
  alimentaires ») — nouveau composant `DietSetupView` (`src/components/account.tsx`,
  section dédiée juste avant `AccountView` puisqu'il réutilise ses mêmes briques :
  toggles `DIET_OPTIONS`, `IngredientRestrictionPicker`, `AllergyBadge`,
  `IngredientRestrictionBadge`). Rendu en `Modal` (pas en écran plein cadre) par-dessus
  l'app principale, à la suite immédiate de la visite guidée (`OnboardingTour`) — même
  position dans l'arbre JSX, même détection "une fois par utilisateur (par navigateur)"
  via un flag `localStorage` dédié (`STORAGE_KEYS.dietSetupSeen`, tableau d'`userId`,
  même pattern que `onboardingSeen`). Skippable : les toggles/pickers enregistrent
  immédiatement via `onUpdateUserProfile` (aucun brouillon local, même logique que dans
  `AccountView`) — les boutons "Passer" et "Continuer" font donc tous deux la même
  chose (fermer la modale et marquer le flag), gardés distincts uniquement pour que le
  texte affiché reste honnête si l'utilisateur n'a rien renseigné.
  - **Décision de design (revirement en cours de tâche)** : la première implémentation
    déclenchait l'écran sur le *succès* de `handleRegister` (un flag `justRegistered`),
    directement "à la création du compte" au sens littéral. **Abandonnée après test
    empirique** : ce projet Supabase a la confirmation par email activée pour les
    inscriptions (confirmé en testant une vraie inscription via l'UI — Supabase a
    d'abord rejeté deux domaines `.local`/`example.com` comme invalides, puis, avec un
    domaine valide, a tenté d'envoyer un email de confirmation et cogné le rate-limit
    SMTP par défaut de Supabase). Concrètement, `AuthService.signUp` n'obtient
    quasiment jamais de session immédiate pour un compte réel : `handleRegister`
    retourne une erreur ("email de confirmation envoyé") *avant* d'atteindre
    `setCurrentUser`, donc un flag posé uniquement dans `handleRegister` ne se
    déclencherait quasiment jamais en pratique — l'utilisateur confirme son email puis
    se connecte séparément via `handleLogin`, un chemin différent. D'où le choix final
    de se caler sur "première arrivée réelle sur l'app principale"
    (`mainAppVisible`), exactement le même critère que la visite guidée déjà en place,
    qui couvre le cas réel indépendamment du chemin d'authentification emprunté.
  - **Séquencement** : l'effet qui gère l'affichage (`App.tsx`, juste après le calcul de
    `mainAppVisible`) vérifie d'abord `onboardingSeen` (affiche la visite guidée si pas
    vue) puis, seulement si la visite guidée est déjà vue, vérifie `dietSetupSeen`. Pour
    un compte flambant neuf qui voit les deux pour la première fois, `handleFinishOnboarding`
    enchaîne directement sur `setShowDietSetup(true)` à la fermeture de la visite guidée
    plutôt que d'attendre un second passage de l'effet — évite un flash de l'app nue
    entre les deux. Compte démo exclu des deux (comme la visite guidée existante).
  - **Bug pré-existant révélé (mais pas causé) par les tests répétés de cette
    fonctionnalité** : `currentUser.allergies`/`diets`/`dislikes` peuvent occasionnellement
    apparaître vides juste après un rechargement/navigation, alors que les données sont
    bien présentes en base (vérifié directement en SQL) — déjà documenté comme limite
    connue plus haut ("Fonctionnalités ajoutées pendant la migration" : *"un refresh de
    token Supabase en tâche de fond pourrait réinitialiser ces champs localement"*),
    causé par `AuthService.onAuthChange` qui appelle `setCurrentUser(user)` sans
    fusionner les préférences déjà chargées à chaque événement d'auth (y compris un
    refresh de token silencieux). Reproduit à l'identique sur `AccountView` (code
    existant, non modifié) pendant l'investigation — confirme qu'il ne s'agit pas d'un
    effet de bord de `DietSetupView`. Pas corrigé ici (hors scope, cas limite déjà
    connu) ; la vérification finale a donc été faite avec un enchaînement rapide
    (toggle régime → Continuer, en dessous de la fenêtre de course) plutôt qu'en
    espaçant les étapes.
  - **Vérifié avec le compte de test réel** (`rls-test-a`) : modale affichée juste après
    la visite guidée, montre correctement les données déjà en base (allergie fixture
    "Poulet" visible en badge) ; toggle d'un régime (Végétarien) + "Continuer" → persisté
    en base (`profile_diets`) ; rechargement de la page (même session navigateur) → ni
    la visite guidée ni la modale préférences ne réapparaissent (flags `localStorage`
    bien posés). Données de test (régime Végétarien ajouté pour l'essai) nettoyées après
    coup, allergie fixture d'origine ("Poulet", `ingredient_id=9`) non touchée.
  - **Suivi (tour suivant)** : « Confirm email » désactivé côté utilisateur dans le
    dashboard Supabase (Authentication → Providers → Email) — décision produit prise
    en direct pendant la session pour lever le blocage rate-limit SMTP rencontré plus
    haut. Conséquence : `AuthService.signUp` obtient désormais une session immédiate
    pour un vrai compte, donc `handleRegister` peut à nouveau réussir sans email de
    confirmation — mais le déclenchement de `DietSetupView` reste volontairement basé
    sur `mainAppVisible` (pas ramené à `handleRegister`) : ce critère fonctionne dans
    les deux configurations (confirmation activée ou non), pas de raison de revenir en
    arrière. Compromis à connaître si ce réglage doit être documenté ailleurs : sans
    confirmation, n'importe quelle adresse email (même invalide/usurpée) peut créer un
    compte — acceptable pour une app familiale à usage restreint, à reconsidérer si
    l'inscription s'ouvre plus largement (config SMTP personnalisée type Resend en
    remplacement, plutôt que de réactiver la confirmation par défaut).
  - **Faux négatif de méthode de vérification rencontré en re-testant après ce
    changement** : un utilisateur réel a signalé que la modale préférences
    n'apparaissait pas après la visite guidée. Plusieurs scripts Puppeteer jetables
    utilisant `document.body.innerText.includes(...)` juste après la fermeture de la
    visite guidée ont semblé confirmer le bug (texte absent), alors que des logs de
    diagnostic temporaires montraient `showOnboarding`/`showDietSetup` corrects à
    chaque rendu. Cause : `innerText` dépend d'une passe de layout et peut renvoyer un
    résultat incomplet juste après une mutation DOM rapide en Chrome headless,
    contrairement à une requête DOM directe (`querySelector`) ou une capture d'écran.
    Une fois les vérifications basculées sur `document.querySelectorAll(".mp-modal-backdrop")`
    /`querySelector("h2")` plutôt que sur le texte affiché, le flux complet (inscription
    → famille → visite guidée cliquée jusqu'au bout **ou** passée via "Passer" dès la
    première étape) s'est confirmé fonctionnel à chaque run. Hypothèse retenue pour le
    signalement initial : un double-clic (ou clic très rapproché) sur le bouton de
    fermeture de la visite guidée, atterrissant sur le fond de la modale préférences
    qui apparaît au même endroit juste après, la refermant instantanément — pas un bug
    de logique, mais à garder en tête si un signalement similaire revient. Même leçon
    que le faux négatif "délai d'attente insuffisant" rencontré plus haut (bug 15) :
    pour ce genre de vérification Puppeteer sur `DietSetupView`/`OnboardingTour`,
    préférer une requête DOM directe à une lecture de texte affiché.
- **Recherche de recette élargie aux tags** (demande explicite) — le champ de recherche
  de `RecipesView` (`src/components/recipes.tsx`) ne filtrait que sur `r.name`. Étendu
  pour matcher aussi `r.tags` (chaque tag comparé en `includes`, insensible à la casse) :
  une recette apparaît désormais si le texte recherché correspond à son nom **ou** à
  l'un de ses tags. Un seul point de filtrage (`filtered`), déjà partagé par les vues
  grille et compacte — un seul changement couvre les deux. Vérifié avec le compte démo :
  recherche du tag "Rapide" (absent de tout nom de plat) → les 9 recettes portant ce
  tag remontent correctement.
- **50 nouvelles recettes chinoises depuis xiachufang.com, uniquement notées >8,5**
  (demande explicite, à la suite de la recherche par tags ci-dessus) — porte le
  catalogue global de 55 à 105 recettes, dont 57 chinoises (les 7 déjà présentes +
  50 nouvelles). Contrainte stricte de l'utilisateur : n'inclure que des recettes dont
  la note affichée sur xiachufang est **strictement supérieure à 8,5** (échelle sur 10),
  jamais estimée.
  - **Sourcing en 4 agents parallèles** (un par famille de plats : viandes, légumes/tofu,
    soupes/nouilles/riz, en-cas/desserts, chacun ciblant 12-15 recettes pour couvrir la
    perte due aux doublons/rejets) — nécessaire car `www.xiachufang.com` bloque les
    fetchs automatisés par un CAPTCHA anti-bot ; seul le sous-domaine mobile
    `m.xiachufang.com/recipe/<id>/` reste accessible. Chaque agent a dû résoudre
    indépendamment le même problème : la note n'est pas toujours extractible en texte
    brut du rendu HTML d'une fiche recette individuelle (parfois un widget graphique/JS).
    Méthodes de contournement trouvées par les agents, à retenir si le sujet revient :
    lire les pages de **catégorie/liste** (`m.xiachufang.com/category/<id>/`, qui
    affichent la note en texte brut pour chaque recette listée) plutôt que les fiches
    individuelles ; ou parser le blob `window.__NUXT__` embarqué dans le HTML de la page
    (contient le champ `score` exact) ; ou chercher directement le JSON-LD
    `aggregateRating` via `curl` + regex plutôt que le rendu Markdown de l'outil de fetch,
    qui s'est avéré peu fiable pour les notes (a « halluciné » des valeurs à plusieurs
    reprises — confirmé en recoupant avec le HTML brut). Tout candidat dont la note
    n'était pas confirmable par une de ces méthodes a été écarté, même si un résultat de
    recherche suggérait une note élevée.
  - **Consolidation** : 52 recettes récoltées au total, dédupliquées à 50 — un doublon
    exact (même `source_url`, 韭菜盒子/chaussons à la ciboule chinoise repéré par deux
    agents différents) et un quasi-doublon retiré par choix éditorial (deux versions de
    riz frit aux œufs proposées par le même agent ; conservé seulement la version
    « technique du chef », plus différenciée). Les noms d'ingrédients `NOUVEAU: ...`
    proposés indépendamment par les 4 agents ont dû être unifiés avant insertion (ex.
    « Sucre candi » et « Sucre candi chinois » → un seul ingrédient ; trois variantes de
    « filet de porc » → une seule) pour éviter des doublons dans le catalogue partagé.
  - **79 nouveaux ingrédients** ajoutés au catalogue partagé `ingredients` (ids 118-196)
    pour couvrir des produits de cuisine chinoise absents jusqu'ici malgré le seed
    précédent — notamment l'huile de sésame (surprenant qu'elle manquait encore),
    plusieurs champignons séchés chinois, épices à braisage (badiane/cannelle de Chine
    déjà là, mais cardamome/réglisse/galanga/écorce de mandarine séchée manquantes),
    nouilles/pâtes chinoises, farine de riz gluant, saindoux, œufs de cent ans, etc.
    Catégorisation alignée sur les conventions déjà en place pour les ingrédients
    existants (vérifié par requête avant assignation : ex. les bouillons sont classés
    "autres" et non "sauces", les fruits secs/graines sous "fruits", les fruits de mer
    sous "viande" — mêmes règles réappliquées ici pour cohérence).
  - **Génération et application du SQL** : script Node jetable (hors dépôt,
    `scratchpad/xcf/`) qui résout chaque nom d'ingrédient vers son id (catalogue existant
    + nouveaux) et échoue fort au moindre nom non résolu, plutôt que d'insérer une ligne
    cassée — même précaution que pour les seeds précédents. SQL généré avec des CTE
    chaînées (`with r as (insert ... returning id), ri as (insert recipe_ingredients
    select r.id, ...), rs as (insert recipe_steps select r.id, ...)`) pour insérer
    recette + ingrédients + étapes en une seule requête atomique par recette, appliqué en
    5 lots de 10 via `execute_sql`. Étapes taguées `phase` (prep/cook) recette par
    recette selon la même règle que le seed initial (pas de feu = prep, y compris
    assemblage final si aucune cuisson n'est impliquée).
  - **Contrôle qualité** : aucune photo ajoutée pour ce lot (hors scope de la demande,
    contrairement au chantier photo précédent) — uniquement nom, catégorie, portions,
    temps prépa/cuisson, ingrédients avec quantités (`quantity_label` texte libre, même
    convention que le seed chinois initial : `amount`/`unit` structurés laissés `null`),
    étapes numérotées avec phase. Vérifié après application : 0 recette sans ingrédients,
    0 recette sans étapes, 620 lignes `recipe_ingredients` et 386 lignes `recipe_steps`
    au total sur les 57 recettes chinoises. `npm run build`, `npm run test:rls` (17/17)
    et les advisors de sécurité Supabase revérifiés après coup (aucune régression, mêmes
    avertissements pré-existants). Vérifié en direct avec le compte de test réel : onglet
    "Base commune" affiche bien 105 recettes (55 + 50), recherche fonctionnelle sur les
    nouvelles recettes.
- **Captures d'écran de la visite guidée rafraîchies + texte du Calendrier plus précis**
  (demande explicite : « mets à jour la présentation initiale avec des captures d'écran
  mises à jour, il faut qu'il y ait une présentation plus précise du planning ») — les 7
  captures dans `src/assets/onboarding/` dataient du 31 juillet et montraient des écrans
  quasi vides (calendrier sans repas, courses/modèles vides, aucune allergie/régime) alors
  que l'app avait beaucoup évolué depuis (glisser-déposer, alerte allergie, plan de prépa,
  lieu du restaurant, photos de recette, régime/aliments non appréciés...). Regénérées via
  compte démo + scripts jetables hors repo (même convention que d'habitude), avec cette
  fois un jeu de données démo volontairement enrichi avant capture (allergie Poulet,
  aliment non apprécié Poivron, régime Faible en sucre, un second membre de famille sans
  compte, une semaine avec un repas simple, un repas à 2 recettes pour montrer le bouton
  Plan de prépa, un repas Restaurant avec nom de lieu, et un repas contenant l'allergène
  pour montrer le bouton Allergie) plutôt que de re-capturer les mêmes écrans vides.
  `onboarding.tsx` : texte de l'étape "Le Calendrier" réécrit pour couvrir ces
  fonctionnalités (alerte allergie, plan de prépa, lieu du restaurant, glisser-déposer),
  et l'étape "Les Recettes" corrigée (« une bonne cinquantaine » → « plus d'une centaine »,
  desormais exact pour un compte réel — 105 recettes globales).
  - **Quatre bugs réels, jusque-là inaperçus, découverts et corrigés en essayant de
    peupler le compte démo pour ces captures** (aucun rapport avec Supabase/RLS — tous
    dans le chemin 100% local du compte démo, `src/lib/authService.ts`/`src/lib/
    storage.ts`/`src/App.tsx`) — voir le détail dans "Bugs découverts et corrigés"
    ci-dessus (points 17-20). En résumé : la connexion démo se déconnectait toute seule
    ~1s après "Essayer" (et aussi après un simple rechargement de page) ; le calendrier/
    les courses/les ingrédients du compte démo restaient vides malgré une connexion
    réussie ; les recettes démo ne s'affichaient nulle part dans le planning (nom de
    plat manquant malgré un créneau non vide) ; et chaque modification de profil démo
    (régime, puis allergies, puis aliments non appréciés) effaçait les précédentes de
    l'écran. Les quatre combinés expliquent pourquoi les captures précédentes montraient
    des écrans vides : ce n'était
    pas qu'un manque de mise en scène, le compte démo ne pouvait tout simplement pas
    afficher son propre jeu de données de démonstration.
  - Vérifié : `npm run build`, `npm run typecheck` (parité, aucune régression au-delà
    du style pré-existant), `npm run test:rls` (aucune table concernée, resté vert),
    tour rejouée en conditions réelles (compte démo, scripts jetables) avec les 7
    nouvelles images et le nouveau texte.

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
