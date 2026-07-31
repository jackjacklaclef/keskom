import { useState } from "react";

import { space, radius } from "../theme";
import { Icon } from "./ui";

import calendarImg from "../assets/onboarding/calendar.png";
import recipesImg from "../assets/onboarding/recipes.png";
import shoppingImg from "../assets/onboarding/shopping.png";
import ingredientsImg from "../assets/onboarding/ingredients.png";
import templatesImg from "../assets/onboarding/templates.png";
import familyImg from "../assets/onboarding/family.png";
import accountImg from "../assets/onboarding/account.png";

const STEPS = [
  {
    id: "intro",
    eyebrow: "Bienvenue",
    title: "Salut, et bienvenue dans la famille !",
    text: "Content de t'accueillir sur Keskon'm. On te fait faire le tour du propriétaire en quelques écrans — promis, ça prend deux minutes.",
    image: null,
  },
  {
    id: "calendar",
    eyebrow: "Le coeur de la maison",
    title: "Le Calendrier",
    text: "Tu poses les repas de la semaine, tu dis qui sera là ce soir-là, et toute la famille voit le menu d'un coup d'oeil.",
    image: calendarImg,
  },
  {
    id: "recipes",
    eyebrow: "Le tiroir à idées",
    title: "Les Recettes",
    text: "Toutes vos recettes rangées au même endroit, plus une bonne cinquantaine de classiques déjà prêts si l'inspiration manque.",
    image: recipesImg,
  },
  {
    id: "shopping",
    eyebrow: "Le sac de courses",
    title: "Les Courses",
    text: "La liste se construit toute seule à partir du planning de la semaine. Plus besoin de fouiller le placard avant de partir.",
    image: shoppingImg,
  },
  {
    id: "ingredients",
    eyebrow: "Le garde-manger",
    title: "Les Ingrédients",
    text: "Le petit répertoire de tout ce qui peut finir dans une recette, rangé par catégorie pour s'y retrouver facilement.",
    image: ingredientsImg,
  },
  {
    id: "templates",
    eyebrow: "Vos habitudes",
    title: "Les Modèles",
    text: "Une semaine type qui marche toujours bien chez vous ? Enregistre-la une fois, ré-applique-la en un clic les fois suivantes.",
    image: templatesImg,
  },
  {
    id: "family",
    eyebrow: "Tout le monde à table",
    title: "La Famille",
    text: "Invite les tiens par code ou par email, choisis un avatar pour chacun, et note qui est plutôt Moineau ou plutôt Vorace.",
    image: familyImg,
  },
  {
    id: "account",
    eyebrow: "Chez toi",
    title: "Mon compte",
    text: "Régime, allergies, petits plats que tu n'aimes pas : tout ce qui te concerne se règle ici, une bonne fois pour toutes.",
    image: accountImg,
  },
];

export const OnboardingTour = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal" style={{ width: "560px", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.6rem 0.6rem 0" }}>
          <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>

        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          {current.image ? (
            <div style={{
              borderRadius: radius.md, overflow: "hidden", border: "1px solid var(--line)",
              marginBottom: space.lg, boxShadow: "0 8px 20px rgba(20, 18, 14, 0.1)",
            }}>
              <img src={current.image} alt={current.title} style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "140px", marginBottom: space.lg, borderRadius: radius.md,
              background: "var(--clay-wash)",
            }}>
              <span style={{ fontSize: "2.4rem" }}>
                <Icon name="restaurant" size={48} />
              </span>
            </div>
          )}

          <p className="mp-micro" style={{ fontWeight: 700, color: "var(--clay)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
            {current.eyebrow}
          </p>
          <h2 className="mp-h2" style={{ marginBottom: "0.6rem" }}>{current.title}</h2>
          <p className="mp-small mp-text-soft" style={{ lineHeight: 1.6 }}>{current.text}</p>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem", margin: `${space.lg} 0` }}>
            {STEPS.map((s, i) => (
              <span key={s.id} style={{
                width: i === step ? "1.3rem" : "0.4rem", height: "0.4rem", borderRadius: radius.pill,
                background: i === step ? "var(--clay)" : "var(--line)", transition: "all 150ms",
              }} />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
            {!isFirst ? (
              <button type="button" className="mp-btn mp-btn-secondary" onClick={() => setStep((s) => s - 1)}>
                Précédent
              </button>
            ) : (
              <button type="button" className="mp-btn mp-btn-ghost" onClick={onClose}>
                Passer
              </button>
            )}
            <button type="button" className="mp-btn mp-btn-primary" onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}>
              {isLast ? "C'est parti !" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
