import type { AppUser } from "../types";

// ============================================================
// STORAGE — couche de persistance locale
// ============================================================

export const loadFromStorage = (key: string, fallback: any) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota ou mode privé — ignoré */ }
};

// ============================================================
// COMPTE DE DÉMONSTRATION
// ============================================================

export const DEMO_USER: AppUser = {
  id: "demo",
  name: "Famille Demo",
  email: "demo@carnet.app",
  activeFamilyId: "demo-family",
  preferences: [],
  allergies: [],
  dislikes: [],
  diets: [],
  rules: [],
};

// Mot de passe demo exposé uniquement dans LoginView
export const DEMO_PASSWORD = "demo1234";

export const DEMO_FAMILY = {
  id: "demo-family",
  name: "Famille Demo",
  inviteCode: "DEMO01",
  ownerId: "demo",
  members: [{ memberId: "demo", userId: "demo", userName: "Famille Demo", userEmail: "demo@carnet.app", role: "admin", appetite: "medium" }],
};

export const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// ============================================================
// MOCK DATA — jeu de données local pour le compte démo
// ============================================================

export const initialRecipes = [
  // ---- Plats principaux ----
  {
    id: "1", name: "Pâtes carbonara", category: "main", portions: 4,
    description: "Pâtes crémeuses à la sauce carbonara maison",
    ingredients: [
      { ingredientId: "24", ingredientName: "Pâtes", quantity: "400g" },
      { ingredientId: "6",  ingredientName: "Saumon", quantity: "200g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "100ml" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "2 c. à soupe" },
      { ingredientId: "41", ingredientName: "Sel", quantity: "au goût" },
    ],
    tags: ["Italien", "Rapide", "Famille"],
  },
  {
    id: "3", name: "Riz cantonais", category: "main", portions: 4,
    description: "Riz sauté aux légumes",
    ingredients: [
      { ingredientId: "25", ingredientName: "Riz", quantity: "300g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "1" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "20g" },
      { ingredientId: "40", ingredientName: "Sauce tomate", quantity: "2 c. à soupe" },
    ],
    tags: ["Asiatique", "Rapide"],
  },
  {
    id: "4", name: "Poulet rôti aux herbes", category: "main", portions: 4,
    description: "Poulet entier rôti au four avec herbes et ail",
    ingredients: [
      { ingredientId: "1",  ingredientName: "Poulet", quantity: "1.5kg" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "4" },
      { ingredientId: "43", ingredientName: "Persil", quantity: "1 bouquet" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "3 c. à soupe" },
    ],
    tags: ["Classique", "Dimanche", "Famille"],
  },
  {
    id: "5", name: "Bœuf bourguignon", category: "main", portions: 6,
    description: "Mijotée de bœuf aux carottes et oignons",
    ingredients: [
      { ingredientId: "2",  ingredientName: "Bœuf haché", quantity: "800g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "3" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "2" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "3" },
    ],
    tags: ["Mijoté", "Hiver", "Dimanche"],
  },
  {
    id: "6", name: "Saumon en papillote", category: "main", portions: 4,
    description: "Saumon cuit en papillote avec citron et herbes",
    ingredients: [
      { ingredientId: "6",  ingredientName: "Saumon", quantity: "600g" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "2" },
      { ingredientId: "43", ingredientName: "Persil", quantity: "quelques branches" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "2 c. à soupe" },
    ],
    tags: ["Poisson", "Léger", "Rapide"],
  },
  {
    id: "7", name: "Hachis parmentier", category: "main", portions: 4,
    description: "Gratin de purée de pommes de terre sur viande hachée",
    ingredients: [
      { ingredientId: "2",  ingredientName: "Bœuf haché", quantity: "500g" },
      { ingredientId: "27", ingredientName: "Pomme de terre", quantity: "800g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "150ml" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "40g" },
    ],
    tags: ["Gratin", "Hiver", "Famille"],
  },
  {
    id: "8", name: "Quiche lorraine", category: "main", portions: 6,
    description: "Tarte salée aux lardons et crème",
    ingredients: [
      { ingredientId: "4",  ingredientName: "Jambon", quantity: "150g" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "200ml" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "80g" },
    ],
    tags: ["Tarte", "Classique"],
  },
  {
    id: "9", name: "Curry de poulet", category: "main", portions: 4,
    description: "Poulet mijoté dans une sauce curry crémeuse",
    ingredients: [
      { ingredientId: "1",  ingredientName: "Poulet", quantity: "600g" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "200ml" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
      { ingredientId: "45", ingredientName: "Curry", quantity: "2 c. à soupe" },
      { ingredientId: "25", ingredientName: "Riz", quantity: "300g" },
    ],
    tags: ["Indien", "Épicé", "Facile"],
  },
  {
    id: "10", name: "Lasagnes bolognaise", category: "main", portions: 6,
    description: "Lasagnes maison à la sauce bolognaise",
    ingredients: [
      { ingredientId: "2",  ingredientName: "Bœuf haché", quantity: "500g" },
      { ingredientId: "40", ingredientName: "Sauce tomate", quantity: "400g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "500ml" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "100g" },
    ],
    tags: ["Italien", "Gratin", "Famille"],
  },
  {
    id: "11", name: "Poêlée saucisses lentilles", category: "main", portions: 4,
    description: "Saucisses mijotées avec lentilles et carottes",
    ingredients: [
      { ingredientId: "5",  ingredientName: "Saucisse", quantity: "4" },
      { ingredientId: "29", ingredientName: "Lentilles", quantity: "300g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "2" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
    ],
    tags: ["Mijoté", "Hiver", "Économique"],
  },
  {
    id: "12", name: "Crevettes sautées à l'ail", category: "main", portions: 2,
    description: "Crevettes poêlées avec ail, persil et citron",
    ingredients: [
      { ingredientId: "8",  ingredientName: "Crevettes", quantity: "300g" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "3" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "1" },
      { ingredientId: "43", ingredientName: "Persil", quantity: "1 bouquet" },
    ],
    tags: ["Poisson", "Rapide", "Méditerranéen"],
  },
  {
    id: "13", name: "Gratin dauphinois", category: "main", portions: 4,
    description: "Gratin de pommes de terre à la crème",
    ingredients: [
      { ingredientId: "27", ingredientName: "Pomme de terre", quantity: "1kg" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "300ml" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "80g" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "2" },
    ],
    tags: ["Gratin", "Hiver", "Comfort food"],
  },
  {
    id: "14", name: "Steak haché maison", category: "main", portions: 4,
    description: "Steaks hachés façonnés à la main avec salade",
    ingredients: [
      { ingredientId: "3",  ingredientName: "Steak", quantity: "600g" },
      { ingredientId: "20", ingredientName: "Salade", quantity: "1" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "2" },
      { ingredientId: "37", ingredientName: "Moutarde", quantity: "2 c. à soupe" },
    ],
    tags: ["Rapide", "Classique", "Famille"],
  },
  {
    id: "15", name: "Quinoa aux légumes rôtis", category: "main", portions: 4,
    description: "Quinoa avec légumes de saison rôtis au four",
    ingredients: [
      { ingredientId: "28", ingredientName: "Quinoa", quantity: "300g" },
      { ingredientId: "21", ingredientName: "Courgette", quantity: "2" },
      { ingredientId: "22", ingredientName: "Poivron", quantity: "2" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "3 c. à soupe" },
    ],
    tags: ["Végétarien", "Léger", "Équilibré"],
  },
  {
    id: "39", name: "Risotto aux champignons", category: "main", portions: 4,
    description: "Risotto crémeux aux champignons et parmesan",
    ingredients: [
      { ingredientId: "25", ingredientName: "Riz", quantity: "300g" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "40g" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "80g" },
    ],
    tags: ["Italien", "Crémeux", "Végétarien"],
  },
  {
    id: "41", name: "Poke bowl saumon", category: "main", portions: 2,
    description: "Bol japonais avec saumon mariné, riz et légumes",
    ingredients: [
      { ingredientId: "6",  ingredientName: "Saumon", quantity: "300g" },
      { ingredientId: "25", ingredientName: "Riz", quantity: "200g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "1" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "1" },
    ],
    tags: ["Japonais", "Frais", "Healthy"],
  },
  // ---- Entrées ----
  {
    id: "2", name: "Salade César", category: "starter", portions: 2,
    description: "Salade fraîche avec poulet grillé et sauce César",
    ingredients: [
      { ingredientId: "1",  ingredientName: "Poulet", quantity: "200g" },
      { ingredientId: "20", ingredientName: "Salade", quantity: "1" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "2" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "50g" },
    ],
    tags: ["Salade", "Léger"],
  },
  {
    id: "18", name: "Taboulé", category: "starter", portions: 4,
    description: "Salade de semoule fraîche aux tomates et herbes",
    ingredients: [
      { ingredientId: "28", ingredientName: "Quinoa", quantity: "200g" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "3" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "2" },
      { ingredientId: "43", ingredientName: "Persil", quantity: "1 bouquet" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "4 c. à soupe" },
    ],
    tags: ["Oriental", "Frais", "Été"],
  },
  {
    id: "20", name: "Bruschetta tomates basilic", category: "starter", portions: 4,
    description: "Pain grillé aux tomates fraîches et basilic",
    ingredients: [
      { ingredientId: "26", ingredientName: "Pain", quantity: "8 tranches" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "4" },
      { ingredientId: "44", ingredientName: "Basilic", quantity: "1 bouquet" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "2" },
    ],
    tags: ["Italien", "Apéritif", "Été"],
  },
  {
    id: "21", name: "Salade de lentilles", category: "starter", portions: 4,
    description: "Lentilles vinaigrette avec carottes et herbes",
    ingredients: [
      { ingredientId: "29", ingredientName: "Lentilles", quantity: "250g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "2" },
      { ingredientId: "36", ingredientName: "Vinaigre", quantity: "2 c. à soupe" },
      { ingredientId: "37", ingredientName: "Moutarde", quantity: "1 c. à café" },
    ],
    tags: ["Protéiné", "Végétarien", "Léger"],
  },
  // ---- Soupes ----
  {
    id: "16", name: "Soupe à l'oignon", category: "soup", portions: 4,
    description: "Soupe gratinée à l'oignon et fromage fondant",
    ingredients: [
      { ingredientId: "18", ingredientName: "Oignon", quantity: "6" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "40g" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "100g" },
      { ingredientId: "26", ingredientName: "Pain", quantity: "4 tranches" },
    ],
    tags: ["Soupe", "Hiver", "Classique"],
  },
  {
    id: "17", name: "Velouté de courgettes", category: "soup", portions: 4,
    description: "Soupe crémeuse de courgettes et crème fraîche",
    ingredients: [
      { ingredientId: "21", ingredientName: "Courgette", quantity: "4" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "100ml" },
    ],
    tags: ["Soupe", "Léger", "Été"],
  },
  {
    id: "19", name: "Soupe carottes gingembre", category: "soup", portions: 4,
    description: "Soupe veloutée de carottes légèrement épicée",
    ingredients: [
      { ingredientId: "16", ingredientName: "Carotte", quantity: "600g" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "100ml" },
      { ingredientId: "45", ingredientName: "Curry", quantity: "1 c. à café" },
    ],
    tags: ["Soupe", "Hiver", "Épicé"],
  },
  {
    id: "40", name: "Minestrone", category: "soup", portions: 4,
    description: "Soupe italienne de légumes et pâtes",
    ingredients: [
      { ingredientId: "16", ingredientName: "Carotte", quantity: "2" },
      { ingredientId: "21", ingredientName: "Courgette", quantity: "1" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "3" },
      { ingredientId: "24", ingredientName: "Pâtes", quantity: "100g" },
    ],
    tags: ["Italien", "Hiver", "Léger"],
  },
  // ---- Petit-déjeuner ----
  {
    id: "22", name: "Pancakes moelleux", category: "breakfast", portions: 4,
    description: "Pancakes épais et légers pour le brunch",
    ingredients: [
      { ingredientId: "30", ingredientName: "Lait", quantity: "200ml" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "30g" },
      { ingredientId: "34", ingredientName: "Yaourt", quantity: "1" },
    ],
    tags: ["Brunch", "Enfants", "Week-end"],
  },
  {
    id: "23", name: "Granola maison", category: "breakfast", portions: 8,
    description: "Granola croustillant au miel et fruits secs",
    ingredients: [
      { ingredientId: "32", ingredientName: "Beurre", quantity: "30g" },
      { ingredientId: "34", ingredientName: "Yaourt", quantity: "1" },
    ],
    tags: ["Healthy", "Batch cooking"],
  },
  {
    id: "24", name: "Œufs brouillés au saumon", category: "breakfast", portions: 2,
    description: "Œufs brouillés onctueux avec saumon fumé",
    ingredients: [
      { ingredientId: "6",  ingredientName: "Saumon", quantity: "100g" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "20g" },
      { ingredientId: "43", ingredientName: "Persil", quantity: "quelques feuilles" },
    ],
    tags: ["Protéiné", "Rapide"],
  },
  {
    id: "25", name: "Pain perdu", category: "breakfast", portions: 4,
    description: "Pain rassis trempé dans l'œuf et lait, doré à la poêle",
    ingredients: [
      { ingredientId: "26", ingredientName: "Pain", quantity: "8 tranches" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "200ml" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "30g" },
    ],
    tags: ["Sucré", "Enfants", "Anti-gaspillage"],
  },
  // ---- Desserts ----
  {
    id: "26", name: "Tarte aux pommes", category: "dessert", portions: 6,
    description: "Tarte classique aux pommes dorées",
    ingredients: [
      { ingredientId: "9",  ingredientName: "Pomme", quantity: "6" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "40g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "50ml" },
    ],
    tags: ["Classique", "Automne", "Enfants"],
  },
  {
    id: "27", name: "Mousse au chocolat", category: "dessert", portions: 4,
    description: "Mousse au chocolat noir légère et aérienne",
    ingredients: [
      { ingredientId: "32", ingredientName: "Beurre", quantity: "50g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "30ml" },
    ],
    tags: ["Chocolat", "Classique", "Facile"],
  },
  {
    id: "28", name: "Crème brûlée", category: "dessert", portions: 4,
    description: "Crème vanille avec croûte caramélisée",
    ingredients: [
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "400ml" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "100ml" },
    ],
    tags: ["Classique", "Élaboré", "Fête"],
  },
  {
    id: "29", name: "Compote pommes poires", category: "dessert", portions: 6,
    description: "Compote maison de pommes et poires légèrement sucrée",
    ingredients: [
      { ingredientId: "9",  ingredientName: "Pomme", quantity: "4" },
      { ingredientId: "12", ingredientName: "Poire", quantity: "3" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "1" },
    ],
    tags: ["Léger", "Enfants", "Anti-gaspillage"],
  },
  {
    id: "30", name: "Yaourt maison vanille", category: "dessert", portions: 6,
    description: "Yaourts fermes faits maison à la vanille",
    ingredients: [
      { ingredientId: "30", ingredientName: "Lait", quantity: "1L" },
      { ingredientId: "34", ingredientName: "Yaourt", quantity: "1" },
    ],
    tags: ["Maison", "Sain", "Batch cooking"],
  },
  // ---- En-cas ----
  {
    id: "31", name: "Houmous maison", category: "snack", portions: 6,
    description: "Houmous onctueux à la crème de sésame",
    ingredients: [
      { ingredientId: "29", ingredientName: "Lentilles", quantity: "400g" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "2" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "1" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "3 c. à soupe" },
    ],
    tags: ["Oriental", "Végétarien", "Apéritif"],
  },
  {
    id: "32", name: "Guacamole", category: "snack", portions: 4,
    description: "Guacamole frais avec tomates et oignon",
    ingredients: [
      { ingredientId: "17", ingredientName: "Tomate", quantity: "2" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1/2" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "2" },
    ],
    tags: ["Mexicain", "Frais", "Apéritif"],
  },
  {
    id: "33", name: "Muffins jambon fromage", category: "snack", portions: 6,
    description: "Muffins moelleux jambon et fromage",
    ingredients: [
      { ingredientId: "4",  ingredientName: "Jambon", quantity: "100g" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "80g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "150ml" },
    ],
    tags: ["Enfants", "Goûter", "Batch cooking"],
  },
  // ---- Sauces & bases ----
  {
    id: "34", name: "Sauce tomate maison", category: "sauce", portions: 8,
    description: "Sauce tomate mijotée à l'italienne, à congeler",
    ingredients: [
      { ingredientId: "17", ingredientName: "Tomate", quantity: "1kg" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "2" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "4" },
      { ingredientId: "44", ingredientName: "Basilic", quantity: "1 bouquet" },
    ],
    tags: ["Base", "Batch cooking", "Italien"],
  },
  {
    id: "35", name: "Vinaigrette moutarde", category: "sauce", portions: 8,
    description: "Vinaigrette classique moutarde-vinaigre",
    ingredients: [
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "6 c. à soupe" },
      { ingredientId: "36", ingredientName: "Vinaigre", quantity: "2 c. à soupe" },
      { ingredientId: "37", ingredientName: "Moutarde", quantity: "1 c. à café" },
    ],
    tags: ["Base", "Rapide", "Classique"],
  },
  // ---- Autres ----
  {
    id: "37", name: "Pizza margherita", category: "other", portions: 4,
    description: "Pizza classique tomate mozzarella basilic",
    ingredients: [
      { ingredientId: "40", ingredientName: "Sauce tomate", quantity: "200g" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "150g" },
      { ingredientId: "44", ingredientName: "Basilic", quantity: "quelques feuilles" },
    ],
    tags: ["Italien", "Vendredi soir", "Famille"],
  },
  {
    id: "38", name: "Wrap poulet avocat", category: "other", portions: 2,
    description: "Wrap avec poulet grillé, salade et tomate",
    ingredients: [
      { ingredientId: "1",  ingredientName: "Poulet", quantity: "200g" },
      { ingredientId: "20", ingredientName: "Salade", quantity: "quelques feuilles" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "1" },
    ],
    tags: ["Lunch box", "Rapide", "Frais"],
  },
  {
    id: "42", name: "Tarte flambée", category: "other", portions: 4,
    description: "Flammekueche alsacienne crème, oignon, lardons",
    ingredients: [
      { ingredientId: "4",  ingredientName: "Jambon", quantity: "150g" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "200g" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "2" },
    ],
    tags: ["Alsacien", "Vendredi soir", "Convivial"],
  },
  {
    id: "43", name: "Cabillaud au four", category: "main", portions: 4,
    description: "Filets de cabillaud au four avec tomates et herbes",
    ingredients: [
      { ingredientId: "7",  ingredientName: "Cabillaud", quantity: "600g" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "3" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "2" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "3 c. à soupe" },
    ],
    tags: ["Poisson", "Léger", "Four"],
  },
  {
    id: "44", name: "Ratatouille", category: "main", portions: 4,
    description: "Légumes du soleil mijotés à la provençale",
    ingredients: [
      { ingredientId: "21", ingredientName: "Courgette", quantity: "3" },
      { ingredientId: "22", ingredientName: "Poivron", quantity: "2" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "4" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "2" },
      { ingredientId: "19", ingredientName: "Ail", quantity: "3" },
    ],
    tags: ["Végétarien", "Provençal", "Été"],
  },
  {
    id: "45", name: "Salade niçoise", category: "starter", portions: 4,
    description: "Salade complète avec thon, œufs et légumes",
    ingredients: [
      { ingredientId: "20", ingredientName: "Salade", quantity: "1" },
      { ingredientId: "17", ingredientName: "Tomate", quantity: "3" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "2" },
      { ingredientId: "35", ingredientName: "Huile d'olive", quantity: "3 c. à soupe" },
    ],
    tags: ["Salade", "Méditerranéen", "Été"],
  },
  {
    id: "46", name: "Soupe poireaux pommes de terre", category: "soup", portions: 4,
    description: "Soupe classique et réconfortante",
    ingredients: [
      { ingredientId: "27", ingredientName: "Pomme de terre", quantity: "4" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "1" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "30g" },
      { ingredientId: "33", ingredientName: "Crème fraîche", quantity: "100ml" },
    ],
    tags: ["Soupe", "Hiver", "Classique"],
  },
  {
    id: "47", name: "Tajine d'agneau", category: "main", portions: 4,
    description: "Agneau mijoté aux épices avec légumes",
    ingredients: [
      { ingredientId: "5",  ingredientName: "Saucisse", quantity: "600g" },
      { ingredientId: "16", ingredientName: "Carotte", quantity: "3" },
      { ingredientId: "18", ingredientName: "Oignon", quantity: "2" },
      { ingredientId: "46", ingredientName: "Paprika", quantity: "2 c. à café" },
    ],
    tags: ["Oriental", "Mijoté", "Épicé"],
  },
  {
    id: "48", name: "Salade de fruits frais", category: "dessert", portions: 4,
    description: "Salade de fruits de saison au sirop léger",
    ingredients: [
      { ingredientId: "9",  ingredientName: "Pomme", quantity: "2" },
      { ingredientId: "13", ingredientName: "Fraise", quantity: "200g" },
      { ingredientId: "14", ingredientName: "Raisin", quantity: "150g" },
      { ingredientId: "15", ingredientName: "Citron", quantity: "1" },
    ],
    tags: ["Léger", "Été", "Enfants"],
  },
  {
    id: "49", name: "Gnocchis sauce tomate", category: "main", portions: 4,
    description: "Gnocchis poêlés avec sauce tomate et basilic",
    ingredients: [
      { ingredientId: "40", ingredientName: "Sauce tomate", quantity: "300g" },
      { ingredientId: "31", ingredientName: "Fromage râpé", quantity: "60g" },
      { ingredientId: "44", ingredientName: "Basilic", quantity: "quelques feuilles" },
    ],
    tags: ["Italien", "Rapide", "Végétarien"],
  },
  {
    id: "50", name: "Banana bread", category: "snack", portions: 8,
    description: "Cake moelleux aux bananes bien mûres",
    ingredients: [
      { ingredientId: "10", ingredientName: "Banane", quantity: "3" },
      { ingredientId: "32", ingredientName: "Beurre", quantity: "80g" },
      { ingredientId: "30", ingredientName: "Lait", quantity: "50ml" },
    ],
    tags: ["Anti-gaspillage", "Goûter", "Enfants"],
  },
];

export const initialMealPlans = [
  { id: "1", date: new Date().toISOString().split("T")[0], recipeIds: ["1"], type: "lunch" },
  { id: "2", date: new Date().toISOString().split("T")[0], recipeIds: ["2"], type: "dinner" },
];

export const initialShoppingList = [
  { id: "1", name: "Pâtes", quantity: "400g", completed: false },
  { id: "2", name: "Poulet", quantity: "200g", completed: false },
  { id: "3", name: "Tomates", quantity: "4", completed: true },
];

// Non utilisé actuellement (aucun composant ne s'appuie sur ce seed) — conservé tel quel.
export const initialFamilyMembers = [
  {
    id: "1",
    name: "Camille",
    email: "camille@example.com",
    preferences: ["Végétarien le lundi"],
    allergies: ["Arachides"],
  },
];

export const initialIngredients = [
  { id: "1", name: "Poulet", category: "viande" },
  { id: "2", name: "Bœuf haché", category: "viande" },
  { id: "3", name: "Steak", category: "viande" },
  { id: "4", name: "Jambon", category: "viande" },
  { id: "5", name: "Saucisse", category: "viande" },
  { id: "6", name: "Saumon", category: "viande" },
  { id: "7", name: "Cabillaud", category: "viande" },
  { id: "8", name: "Crevettes", category: "viande" },
  { id: "9", name: "Pomme", category: "fruits" },
  { id: "10", name: "Banane", category: "fruits" },
  { id: "11", name: "Orange", category: "fruits" },
  { id: "12", name: "Poire", category: "fruits" },
  { id: "13", name: "Fraise", category: "fruits" },
  { id: "14", name: "Raisin", category: "fruits" },
  { id: "15", name: "Citron", category: "fruits" },
  { id: "16", name: "Carotte", category: "legumes" },
  { id: "17", name: "Tomate", category: "legumes" },
  { id: "18", name: "Oignon", category: "legumes" },
  { id: "19", name: "Ail", category: "legumes" },
  { id: "20", name: "Salade", category: "legumes" },
  { id: "21", name: "Courgette", category: "legumes" },
  { id: "22", name: "Poivron", category: "legumes" },
  { id: "23", name: "Brocoli", category: "legumes" },
  { id: "24", name: "Pâtes", category: "feculents" },
  { id: "25", name: "Riz", category: "feculents" },
  { id: "26", name: "Pain", category: "feculents" },
  { id: "27", name: "Pomme de terre", category: "feculents" },
  { id: "28", name: "Quinoa", category: "feculents" },
  { id: "29", name: "Lentilles", category: "feculents" },
  { id: "30", name: "Lait", category: "produits_laitiers" },
  { id: "31", name: "Fromage râpé", category: "produits_laitiers" },
  { id: "32", name: "Beurre", category: "produits_laitiers" },
  { id: "33", name: "Crème fraîche", category: "produits_laitiers" },
  { id: "34", name: "Yaourt", category: "produits_laitiers" },
  { id: "35", name: "Huile d'olive", category: "sauces" },
  { id: "36", name: "Vinaigre", category: "sauces" },
  { id: "37", name: "Moutarde", category: "sauces" },
  { id: "38", name: "Ketchup", category: "sauces" },
  { id: "39", name: "Mayonnaise", category: "sauces" },
  { id: "40", name: "Sauce tomate", category: "sauces" },
  { id: "41", name: "Sel", category: "epices" },
  { id: "42", name: "Poivre", category: "epices" },
  { id: "43", name: "Persil", category: "epices" },
  { id: "44", name: "Basilic", category: "epices" },
  { id: "45", name: "Curry", category: "epices" },
  { id: "46", name: "Paprika", category: "epices" },
];
