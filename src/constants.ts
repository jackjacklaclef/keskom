import { colors } from "./theme";

export const MEAL_TYPES = [
  { id: "breakfast", label: "Petit-déjeuner", short: "PDJ", color: "amber" },
  { id: "lunch", label: "Déjeuner", short: "DEJ", color: "clay" },
  { id: "dinner", label: "Dîner", short: "DIN", color: "sage" },
];

export const NAV_ITEMS = [
  { id: "calendar",      label: "Calendrier",    icon: "calendar", primary: true  },
  { id: "recipes",       label: "Recettes",      icon: "book",     primary: true  },
  { id: "shopping",      label: "Courses",       icon: "list",     primary: true  },
  { id: "ingredients",   label: "Ingrédients",   icon: "carrot",   primary: false },
  { id: "templates",     label: "Modèles",       icon: "grid",     primary: false },
  { id: "family",        label: "Famille",       icon: "users",    primary: false },
  { id: "notifications", label: "Notifications", icon: "bell",     primary: false },
  { id: "account",       label: "Mon compte",    icon: "mail",     primary: false },
];

export const NAV_PRIMARY   = NAV_ITEMS.filter((i) => i.primary);
export const NAV_SECONDARY = NAV_ITEMS.filter((i) => !i.primary);

export const MEAL_BADGE_CLASS = {
  amber: "mp-badge-amber",
  clay: "mp-badge-clay",
  sage: "mp-badge-sage",
};

export const QUANTITY_UNITS = ["g", "kg", "L", "ml", "c. à soupe", "c. à café", "pièce", "autre"];

export const RECIPE_CATEGORIES = [
  { id: "breakfast",  label: "Petit-déjeuner", icon: "cat-breakfast", color: "amber",   hex: colors.amber },
  { id: "starter",    label: "Entrée",          icon: "cat-starter",   color: "sage",    hex: colors.sage },
  { id: "main",       label: "Plat principal",  icon: "cat-main",      color: "clay",    hex: colors.clay },
  { id: "soup",       label: "Soupe",           icon: "cat-soup",      color: "berry",   hex: colors.berry },
  { id: "snack",      label: "En-cas",          icon: "cat-snack",     color: "amber",   hex: "#B07A1A" },
  { id: "dessert",    label: "Dessert",         icon: "cat-dessert",   color: "berry",   hex: "#9C3B4F" },
  { id: "sauce",      label: "Sauce / base",    icon: "cat-sauce",     color: "sage",    hex: "#4A6340" },
  { id: "other",      label: "Autre",           icon: "cat-other",     color: "neutral", hex: colors.inkSoft },
];

export const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export const DIET_OPTIONS = [
  { id: "vegetarian",   label: "Végétarien",       icon: "diet-vegetarian" },
  { id: "vegan",        label: "Vegan",             icon: "diet-vegan" },
  { id: "pescatarian",  label: "Pescétarien",       icon: "diet-pescatarian" },
  { id: "gluten_free",  label: "Sans gluten",       icon: "diet-gluten" },
  { id: "lactose_free", label: "Sans lactose",      icon: "diet-lactose" },
  { id: "halal",        label: "Halal",             icon: "diet-halal" },
  { id: "kosher",       label: "Casher",            icon: "diet-kosher" },
  { id: "low_sugar",    label: "Faible en sucre",   icon: "diet-sugar" },
  { id: "low_salt",     label: "Faible en sel",     icon: "diet-salt" },
];

export const PRIVACY_CONTENT = {
  lastUpdate: "Juillet 2026",
  sections: [
    {
      title: "Qui sommes-nous ?",
      content: `Keskon'm est une application de planification familiale des repas. Pour toute question concernant vos données, contactez-nous à : privacy@keskonm.app`,
    },
    {
      title: "Données collectées",
      content: `Nous collectons les données suivantes pour faire fonctionner l'application :
• Identité : prénom/nom et adresse email (inscription)
• Données alimentaires : allergies, intolérances, préférences de régime
• Planning : repas planifiés, recettes créées, liste de courses
• Données familiales : nom de la famille, membres invités

Les allergies et préférences alimentaires peuvent constituer des données de santé ou révéler des convictions religieuses. Leur collecte repose sur votre consentement explicite.`,
    },
    {
      title: "Pourquoi collectons-nous ces données ?",
      content: `• Fonctionnement de l'application (planification, suggestions de repas)
• Prise en compte des restrictions alimentaires dans les suggestions
• Partage du planning au sein de votre famille

Aucune donnée n'est utilisée à des fins publicitaires ou commerciales.`,
    },
    {
      title: "Durée de conservation",
      content: `Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, toutes vos données personnelles sont effacées sous 30 jours. Les données partagées dans une famille (recettes, planning) peuvent subsister si d'autres membres y ont contribué.`,
    },
    {
      title: "Partage des données",
      content: `Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales. Elles peuvent être partagées avec :
• Les membres de votre famille dans l'application (planning, recettes)
• Notre hébergeur technique (Supabase) qui agit comme sous-traitant`,
    },
    {
      title: "Cookies et stockage local",
      content: `Keskon'm utilise le stockage local (localStorage) de votre navigateur pour mémoriser vos préférences et données de session. Il ne s'agit pas de cookies publicitaires ou de traçage. Aucun outil d'analyse tiers (Google Analytics, etc.) n'est utilisé.`,
    },
    {
      title: "Vos droits",
      content: `Conformément au RGPD, vous disposez des droits suivants :
• Accès : consulter les données que nous détenons sur vous
• Rectification : corriger vos données depuis les Préférences
• Suppression : supprimer votre compte et toutes vos données
• Portabilité : exporter vos données (à venir)
• Opposition : vous opposer au traitement de vos données

Pour exercer ces droits : privacy@keskonm.app`,
    },
    {
      title: "Données des mineurs",
      content: `Keskon'm peut être utilisé pour planifier les repas d'enfants au sein d'une famille. Les données des enfants (allergies, préférences) sont saisies par un adulte responsable et restent sous sa responsabilité.`,
    },
  ],
};

// Avatars gourmands — groupés par famille d'aliments, mêmes emojis validés dans la maquette.
export const AVATAR_EMOJI_GROUPS = [
  { label: "Fruits", emojis: [
    ["🍓", "Fraise"], ["🥑", "Avocat"], ["🍋", "Citron"], ["🍉", "Pastèque"], ["🍎", "Pomme"], ["🍊", "Orange"],
    ["🍌", "Banane"], ["🍇", "Raisin"], ["🍑", "Pêche"], ["🍒", "Cerise"], ["🍍", "Ananas"], ["🥭", "Mangue"],
  ]},
  { label: "Légumes", emojis: [
    ["🍅", "Tomate"], ["🥕", "Carotte"], ["🌽", "Maïs"], ["🍄", "Champignon"], ["🌶️", "Piment"], ["🥦", "Brocoli"],
    ["🧄", "Ail"], ["🧅", "Oignon"], ["🥔", "Patate"], ["🥒", "Concombre"], ["🫑", "Poivron"],
  ]},
  { label: "Plats & snacks", emojis: [
    ["🍳", "Œuf"], ["🧀", "Fromage"], ["🥐", "Croissant"], ["🍕", "Pizza"], ["🌮", "Taco"], ["🍔", "Burger"],
    ["🌭", "Hot-dog"], ["🍝", "Pâtes"], ["🍣", "Sushi"], ["🥗", "Salade"], ["🥞", "Pancakes"], ["🥨", "Bretzel"], ["🧇", "Gaufre"],
  ]},
  { label: "Sucré & boissons", emojis: [
    ["🍩", "Donut"], ["☕", "Café"], ["🍯", "Miel"], ["🍰", "Gâteau"], ["🍦", "Glace"], ["🍷", "Vin"], ["🧃", "Jus"],
  ]},
];

export const APPETITE_LEVELS = [
  { id: "small", label: "Moineaux", multiplier: 0.8 },
  { id: "medium", label: "Normal", multiplier: 1 },
  { id: "large", label: "Vorace", multiplier: 1.3 },
];

export const NEW_MEMBER_SENTINEL = "__new__";

export const STORAGE_KEYS = {
  recipes:         "mealPlanner_recipes",
  mealPlans:       "mealPlanner_mealPlans",
  shoppingList:    "mealPlanner_shoppingList",
  ingredients:     "mealPlanner_ingredients",
  darkMode:        "mealPlanner_darkMode",
  weekTemplates:   "mealPlanner_weekTemplates",
  currentUser:     "mealPlanner_currentUser",
  registeredUsers: "mealPlanner_registeredUsers",
  families:        "mealPlanner_families",
  onboardingSeen:  "mealPlanner_onboardingSeen",
};

export const ingredientCategories = [
  { id: "viande", label: "Viandes & poissons", color: "berry", hex: colors.berry },
  { id: "fruits", label: "Fruits", color: "amber", hex: colors.amber },
  { id: "legumes", label: "Légumes", color: "sage", hex: colors.sage },
  { id: "feculents", label: "Féculents", color: "clay", hex: colors.clay },
  { id: "produits_laitiers", label: "Produits laitiers", color: "amber", hex: "#B08D3E" },
  { id: "sauces", label: "Sauces & condiments", color: "berry", hex: "#A14B5C" },
  { id: "epices", label: "Épices & herbes", color: "sage", hex: "#6B7F4F" },
  { id: "boissons", label: "Boissons", color: "clay", hex: "#C66B3E" },
  { id: "autres", label: "Autres", color: "neutral", hex: colors.inkSoft },
];
