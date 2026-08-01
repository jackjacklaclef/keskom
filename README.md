# Keskom

Application de planification de repas familiale : organiser le planning de la semaine,
gérer un livre de recettes partagé, générer la liste de courses, et coordonner tout ça
à plusieurs (famille, colocation...).

React + Vite (TypeScript), backend [Supabase](https://supabase.com) (base Postgres,
authentification, Realtime, Storage). Progressive Web App (installable sur mobile).

## Fonctionnalités

- **Planning** — calendrier semaine/jour, un ou plusieurs repas par créneau, statut
  (prévu / à faire / fait), duplication d'une semaine sur une autre. Glisser-déposer
  pour déplacer un repas d'un jour/créneau à un autre (échange automatique si la case
  de destination n'est pas vide). Miniature de la recette affichée à côté de son nom
  quand une photo existe ; cliquer sur le nom d'une recette ouvre sa fiche
  (ingrédients, étapes, mode cuisine) sans quitter le planning, cliquer ailleurs sur
  la case reste dédié à la modification du repas. Pour un repas à plusieurs recettes,
  un bouton dédié ouvre un **plan de préparation** qui regroupe les étapes de tous les
  plats en deux phases (préparation sans feu, puis cuisson) pour aider à tout
  préparer/cuisiner en parallèle.
- **Présence par repas** — choisir qui participe à chaque repas (tags, avec un raccourci
  « Tout le monde ») ; sert au calcul des quantités de la liste de courses. Une alerte
  s'affiche sur la carte de repas si un présent est allergique à un ingrédient d'une
  recette assignée.
- **Recettes** — catalogue partagé (recettes globales) + recettes privées ou partagées
  au sein d'une famille, variantes d'une recette existante, étapes numérotées avec
  minuteur et photo, mode « Cuisine » pas-à-pas. Pays d'origine et temps de
  préparation/cuisson affichés sur chaque recette, photo du plat sur un premier
  échantillon de recettes du catalogue partagé.
- **Liste de courses** — générée automatiquement à partir du planning sur une période
  donnée, en tenant compte du nombre de portions de chaque recette et de l'appétit de
  chaque convive.
- **Famille** — plusieurs familles possibles par compte, invitation par code ou par
  email, membres sans compte (juste un nom), avatar emoji, appétit (Moineaux / Normal /
  Vorace), co-administration.
- **Profil** — régime alimentaire, allergies et aliments non appréciés, pris en compte
  dans les recettes et la liste de courses.
- **Visite guidée** — petit tour du propriétaire à la première connexion, un écran par
  module ; rejouable à tout moment depuis Mon compte.
- **Compte démo** — utilisable sans backend, entièrement en local (voir plus bas).

## Démarrer en local

```bash
npm install
npm run dev
```

L'application est servie sur `http://localhost:5173`. Elle se connecte par défaut au
projet Supabase de production (voir [Configuration](#configuration)) — pour explorer
l'app sans toucher aux données réelles, utiliser le **compte démo** :

- Email : `demo@carnet.app`
- Mot de passe : `demo1234`

Le compte démo fonctionne entièrement en `localStorage`, sans aucun appel réseau vers
Supabase : aucune donnée créée avec ce compte n'est partagée ni persistée ailleurs que
dans le navigateur utilisé.

## Scripts disponibles

| Commande               | Description                                              |
|-------------------------|-----------------------------------------------------------|
| `npm run dev`           | Serveur de développement avec rechargement à chaud        |
| `npm run build`         | Build de production dans `dist/`                          |
| `npm run preview`       | Sert le build de production en local                      |
| `npm run typecheck`     | Vérification des types TypeScript (`tsc -b`)               |
| `npm run lint`          | Lint (`oxlint`)                                            |
| `npm run test:rls`      | Suite de tests de non-régression des policies RLS Supabase |

## Configuration

Le client Supabase pointe par défaut vers le projet de production. Pour utiliser un
autre projet Supabase (par exemple pour du développement isolé), définir dans un
fichier `.env.local` :

```
VITE_SUPABASE_URL=https://<projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon publique du projet>
```

La clé « anon » est une clé publique (protégée par les policies RLS côté base), pas un
secret à garder confidentiel.

Pour lancer la suite `npm run test:rls`, un fichier `.env.test.local` (non versionné)
doit fournir `SUPABASE_URL`, `SUPABASE_ANON_KEY` et les mots de passe de deux comptes de
test dédiés (`rls-test-a@keskom-test.local` / `rls-test-b@keskom-test.local`).

## Déploiement

Déployé automatiquement par Vercel à chaque push sur `main`.

## Documentation technique

Les décisions d'architecture, le schéma Supabase détaillé et l'historique des bugs
corrigés sont documentés dans [`CLAUDE.md`](./CLAUDE.md) — pensé pour permettre à un
assistant (ou une nouvelle personne) de reprendre le projet sans re-découvrir les mêmes
pièges.
