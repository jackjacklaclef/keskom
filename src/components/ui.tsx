import React, { useState, useEffect } from "react";

import { space } from "../theme";
import { MEAL_TYPES, MEAL_BADGE_CLASS } from "../constants";

// Tiny inline icon set (outline strokes, no external deps/emoji)
export const Icon = ({ name, size = 16 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5Z" /><path d="M20 19H6.5A2.5 2.5 0 0 0 4 21.5" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    sliders: <><path d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" /><circle cx="12" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 4.5a3.2 3.2 0 0 1 0 6.3M19 20a5.2 5.2 0 0 0-3.5-5.4" /></>,
    bell: <><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" /><path d="M9.5 17a2.5 2.5 0 0 0 5 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 6l6 6-6 6" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    check: <path d="M5 12l4 4 10-10" />,
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.5-4.5" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" /></>,
    download: <><path d="M12 4v11M7.5 11.5L12 16l4.5-4.5" /><path d="M5 19h14" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 6 8 7 8-7" /></>,
    // Carotte stylisée — ingrédients
    carrot: <><path d="M9.5 21C6 21 3 18 3 14.5c0-4 3.5-9 6.5-9s6.5 5 6.5 9c0 3.5-3 6.5-6.5 6.5Z" /><path d="M13 6c1-1.5 1-3 3-3M15 8c1.2-.8 1.3-2.2 3-2" /></>,
    // Grille 3×3 — modèles/semaines types
    grid: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="9.5" y="3" width="6" height="6" rx="1" /><rect x="16" y="3" width="5" height="6" rx="1" /><rect x="3" y="9.5" width="6" height="6" rx="1" /><rect x="9.5" y="9.5" width="6" height="6" rx="1" /><rect x="16" y="9.5" width="5" height="6" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="9.5" y="16" width="6" height="5" rx="1" /><rect x="16" y="16" width="5" height="5" rx="1" /></>,
    // Triangle d'alerte — conflit allergène
    "alert-triangle": <><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 9.5v5" /><path d="M12 18h.01" /></>,
    // Couvert stylisé — restaurant
    restaurant: <><path d="M7 3v5.5a2.5 2.5 0 0 0 5 0V3"/><line x1="9.5" y1="3" x2="9.5" y2="9"/><line x1="7" y1="6" x2="12" y2="6"/><line x1="9.5" y1="11" x2="9.5" y2="21"/><path d="M16 3c0 0 4 2 4 7s-4 7-4 7"/><line x1="16" y1="10" x2="20" y2="10"/><line x1="16" y1="17" x2="16" y2="21"/></>,
    // Cercle barré — pas de repas
    skip: <><circle cx="12" cy="12" r="9"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    // Dé à 6 faces
    dice: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none"/></>,
    // ---- Catégories de recettes ----
    // Soleil levant — petit-déjeuner (réutilise sunrise)
    "cat-breakfast": <><path d="M12 2v3M4.22 6.22l2.12 2.12M2 14h3M19 14h3M17.66 8.34l2.12-2.12"/><path d="M5.5 17a6.5 6.5 0 0 1 13 0"/><line x1="2" y1="21" x2="22" y2="21"/></>,
    // Feuille stylisée — entrée/salade
    "cat-starter": <><path d="M12 22V12"/><path d="M5 12C5 7.03 8.13 3 12 3s7 4.03 7 9"/><path d="M5 12c3-2 5-2 7 0s4 2 7 0"/></>,
    // Assiette avec dôme cloche — plat principal
    "cat-main": <><path d="M2 17h20"/><path d="M4 17C4 12.03 7.58 8 12 8s8 4.03 8 9"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><line x1="12" y1="2" x2="12" y2="4"/></>,
    // Bol avec vapeur — soupe
    "cat-soup": <><path d="M4 19h16"/><path d="M5 19C5 14.03 8.13 10 12 10s7 4.03 7 9"/><path d="M8 6c0-1.1.9-2 2-2"/><path d="M8 6c1 0 2 .9 2 2"/><path d="M12 4c0-1.1.9-2 2-2"/><path d="M12 4c1 0 2 .9 2 2"/></>,
    // Crackers / biscuit — en-cas
    "cat-snack": <><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M3 12h18"/><path d="M12 8V4"/><path d="M8 8V5"/><path d="M16 8V5"/></>,
    // Coupe dessert — dessert
    "cat-dessert": <><path d="M7 22h10"/><path d="M12 22V17"/><path d="M5 7l7 10 7-10"/><path d="M3 7h18"/></>,
    // Pot / bocal — sauce
    "cat-sauce": <><path d="M8 3h8l1 4H7L8 3z"/><path d="M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M9 11h6"/><path d="M9 15h4"/></>,
    // Étoile à 4 branches — autre
    "cat-other": <><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><path d="M5.64 5.64l2.83 2.83M15.53 15.53l2.83 2.83M5.64 18.36l2.83-2.83M15.53 8.47l2.83-2.83"/></>,

    // ---- Régimes alimentaires ----
    // Feuille — végétarien
    "diet-vegetarian": <><path d="M12 22C6.5 22 2 17.5 2 12 2 6.5 6.5 2 12 2c3.5 0 6.5 1.5 8.5 4"/><path d="M2 12c4-6 12-6 16 0"/><path d="M12 22c4-6 4-14 0-20"/></>,
    // Graine germée — vegan
    "diet-vegan": <><path d="M12 22V12"/><circle cx="12" cy="8" r="4"/><path d="M8 12c-3 0-5-2-5-5 0 4 3 7 5 7"/><path d="M16 12c3 0 5-2 5-5 0 4-3 7-5 7"/></>,
    // Poisson stylisé — pescétarien
    "diet-pescatarian": <><path d="M2 12c2-4 6-7 10-7s8 3 10 7c-2 4-6 7-10 7S4 16 2 12z"/><circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/><path d="M20 7l2-3M20 17l2 3"/></>,
    // Épi de blé barré — sans gluten
    "diet-gluten": <><path d="M12 2v12"/><path d="M9 5c0 0-4 1-4 4"/><path d="M15 5c0 0 4 1 4 4"/><path d="M9 9c0 0-3 1-3 3"/><path d="M15 9c0 0 3 1 3 3"/><line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/></>,
    // Goutte barrée — sans lactose
    "diet-lactose": <><path d="M12 2c0 0-7 8-7 14a7 7 0 0 0 14 0C19 10 12 2 12 2z"/><line x1="7" y1="19" x2="17" y2="9" strokeWidth="2"/></>,
    // Croissant de lune (halal — symbolique et neutre)
    "diet-halal": <><path d="M20 12a8 8 0 1 1-8-8 6 6 0 0 0 8 8z"/></>,
    // Étoile de David simplifiée (deux triangles) — casher
    "diet-kosher": <><polygon points="12,3 21,18 3,18"/><polygon points="12,21 3,6 21,6" fill="none"/></>,
    // Cube de sucre barré — faible en sucre
    "diet-sugar": <><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M8 12h8"/><path d="M12 8v8"/><line x1="3" y1="3" x2="21" y2="21" strokeWidth="2"/></>,
    // Salière barrée — faible en sel
    "diet-salt": <><path d="M12 3v12"/><path d="M8 7c0 0-4 2-4 6v5h16v-5c0-4-4-6-4-6"/><line x1="3" y1="21" x2="21" y2="3" strokeWidth="2"/></>,

    // ---- Icônes générales suite ----
    sunrise: <><path d="M12 2v3M4.22 6.22l2.12 2.12M2 14h3M19 14h3M17.66 8.34l2.12-2.12"/><path d="M5.5 17a6.5 6.5 0 0 1 13 0"/><line x1="2" y1="21" x2="22" y2="21"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></>,
  };
  return (
    <svg {...common} aria-hidden="true" style={{ flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

// Icône de catégorie recette / régime — SVG inline avec couleur
export const CategoryIcon = ({ icon, size = 18, color = "currentColor" }) => (
  <Icon name={icon} size={size} color={color} />
);

export const Modal = ({ onClose, width, children }) => (
  <div className="mp-modal-backdrop" onClick={onClose}>
    <div className="mp-modal" style={width ? { width } : undefined} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export const ModalHeader = ({ title, onClose }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
    <h2 className="mp-h2">{title}</h2>
    <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
      <Icon name="x" />
    </button>
  </div>
);

export const Field = ({ label, children }) => (
  <div className="mp-field">
    <span className="mp-label">{label}</span>
    {children}
  </div>
);

export const EmptyState = ({ title, hint }) => (
  <div className="mp-empty">
    <p className="mp-h3" style={{ marginBottom: hint ? "0.35rem" : 0 }}>{title}</p>
    {hint && <p className="mp-small mp-text-soft">{hint}</p>}
  </div>
);

export const MealBadge = ({ typeId, children, onClick, muted }) => {
  const type = MEAL_TYPES.find((t) => t.id === typeId) || MEAL_TYPES[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mp-badge ${MEAL_BADGE_CLASS[type.color]}`}
      style={{
        width: "100%",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        opacity: muted ? 0.55 : 1,
        border: "none",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
};

// ---- Toast ----
// useToast retourne { toast, showToast } où toast = { message, variant, leaving } | null
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timerRef = React.useRef(null);

  const showToast = (message, variant = "default") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, variant, leaving: false });
    // Début de l'animation de sortie 3.6 s après l'apparition
    timerRef.current = setTimeout(() => {
      setToast((t) => t ? { ...t, leaving: true } : null);
      // Retirer du DOM après la fin de l'animation (300 ms)
      timerRef.current = setTimeout(() => setToast(null), 300);
    }, 3600);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { toast, showToast };
};

export const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`mp-toast${toast.variant !== "default" ? ` mp-toast-${toast.variant}` : ""}${toast.leaving ? " leaving" : ""}`}>
      <Icon name={toast.variant === "berry" ? "x" : "check"} size={14} />
      {toast.message}
    </div>
  );
};

export const CategoryDot = ({ hex }) => (
  <span style={{ width: 7, height: 7, borderRadius: "50%", background: hex, display: "inline-block", flexShrink: 0 }} />
);

// Saisie de tags type "Entrée pour ajouter" : input texte + Entrée crée une puce,
// chaque puce a une croix pour la retirer. Utilisé pour préférences/allergies.
export const TagInput = ({ values, onChange, placeholder, badgeVariant }) => {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeAt = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.4rem" }}>
          {values.map((val, idx) => (
            <span key={val} className={`mp-badge mp-badge-${badgeVariant}`} style={{ gap: "0.3rem" }}>
              {val}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={`Retirer ${val}`}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "inherit", padding: 0 }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="mp-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={placeholder}
      />
    </div>
  );
};

export const NavButton = ({ item, active, onClick, size = "md" }) => (
  <button
    type="button"
    onClick={() => onClick(item.id)}
    className="mp-btn"
    style={{
      justifyContent: "flex-start",
      background: active ? "var(--clay-wash)" : "transparent",
      color: active ? "var(--clay)" : "var(--ink-soft)",
      border: "none",
      fontWeight: active ? 600 : 500,
      padding: size === "sm" ? "0.4rem 0.6rem" : "0.55rem 0.6rem",
      fontSize: size === "sm" ? "0.82rem" : undefined,
    }}
  >
    <Icon name={item.icon} size={size === "sm" ? 14 : 16} />
    {item.label}
  </button>
);

export const LogoMark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 215" width="36" height="26">
    <defs><filter id="lm-shadow"><feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#3D5C2E" floodOpacity="0.2"/></filter></defs>
    <g filter="url(#lm-shadow)">
      <circle cx="150" cy="107" r="72" fill="#6B8C5A"/>
      <circle cx="150" cy="107" r="54" fill="#F5F0E8"/>
    </g>
    <path d="M140 97 Q140 79 150 77 Q161 77 163 87 Q165 97 156 105 Q151 110 151 123" fill="none" stroke="#6B8C5A" strokeWidth="8" strokeLinecap="round"/>
    <circle cx="151" cy="135" r="5.5" fill="#6B8C5A"/>
    <g transform="translate(38,107)">
      <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
      <rect x="-4" y="-22" width="8" height="38" rx="2" fill="#6B8C5A"/>
      <rect x="-10" y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
      <rect x="-3" y="-62" width="4" height="42" rx="2" fill="#6B8C5A"/>
      <rect x="4" y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
    </g>
    <g transform="translate(262,107)">
      <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
      <rect x="-4" y="-62" width="8" height="78" rx="2" fill="#6B8C5A"/>
      <path d="M4 -62 Q14 -46 14 -26 Q14 -10 4 -2 L4 -62 Z" fill="#6B8C5A" fillOpacity="0.65"/>
    </g>
  </svg>
);

export const Stepper = ({ steps, current }) => (
  <div className="mp-stepper">
    {steps.map((label, i) => {
      const state = i < current ? "done" : i === current ? "active" : "pending";
      return (
        <React.Fragment key={i}>
          <div className="mp-step">
            <div className={`mp-step-dot ${state}`}>
              {state === "done" ? "✓" : i + 1}
            </div>
            <span className={`mp-step-label ${state === "active" ? "active" : ""}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className="mp-step-connector" />}
        </React.Fragment>
      );
    })}
  </div>
);

// Logo SVG Keskon'm — assiette + couverts + point d'interrogation
export const KeskомLogo = ({ size = "md" }) => {
  const scale = size === "sm" ? 0.38 : size === "md" ? 0.55 : 0.8;
  const w = Math.round(300 * scale);
  const h = Math.round(260 * scale);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 215" width={w} height={h}>
        <defs>
          <filter id="kshadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#3D5C2E" floodOpacity="0.18"/>
          </filter>
        </defs>

        {/* Assiette — bord vert */}
        <g filter="url(#kshadow)">
          <circle cx="150" cy="107" r="72" fill="#6B8C5A"/>
          <path d="M95 81 A72 72 0 0 1 150 35 A72 72 0 0 1 188 49 A60 60 0 0 0 105 79 Z"
                fill="white" fillOpacity="0.13"/>
          <circle cx="150" cy="107" r="54" fill="#F5F0E8"/>
          <circle cx="150" cy="107" r="54" fill="none" stroke="#6B8C5A" strokeWidth="2" strokeOpacity="0.25"/>
          <circle cx="150" cy="107" r="48" fill="none" stroke="#6B8C5A" strokeWidth="1" strokeOpacity="0.12"/>
        </g>

        {/* Point d'interrogation */}
        <path d="M140 97 Q140 79 150 77 Q161 77 163 87 Q165 97 156 105 Q151 110 151 123"
              fill="none" stroke="#6B8C5A" strokeWidth="8" strokeLinecap="round"/>
        <circle cx="151" cy="135" r="5.5" fill="#6B8C5A"/>

        {/* Fourchette gauche */}
        <g transform="translate(38, 107)">
          <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
          <rect x="-4" y="-22" width="8" height="38" rx="2" fill="#6B8C5A"/>
          <rect x="-10" y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
          <rect x="-3"  y="-62" width="4" height="42" rx="2" fill="#6B8C5A"/>
          <rect x="4"   y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
        </g>

        {/* Couteau droit */}
        <g transform="translate(262, 107)">
          <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
          <rect x="-4" y="-62" width="8" height="78" rx="2" fill="#6B8C5A"/>
          <path d="M4 -62 Q14 -46 14 -26 Q14 -10 4 -2 L4 -62 Z" fill="#6B8C5A" fillOpacity="0.65"/>
        </g>
      </svg>

      {/* Nom + tagline */}
      <div style={{ textAlign: "center", lineHeight: 1.1 }}>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 700,
          fontSize: size === "sm" ? "1.1rem" : size === "md" ? "1.5rem" : "2rem",
          color: "var(--sage)",
          letterSpacing: size === "sm" ? "0.12em" : "0.18em",
          textTransform: "uppercase",
        }}>Keskon'm</div>
        {size !== "sm" && (
          <p className="mp-micro mp-text-faint" style={{ letterSpacing: "0.08em", marginTop: "0.15rem" }}>
            qu'est-ce qu'on mange ?
          </p>
        )}
      </div>
    </div>
  );
};

// Alias pour les écrans d'auth
export const AuthLogo = () => (
  <div className="mp-auth-logo">
    <KeskомLogo size="md" />
  </div>
);

export const PasswordInput = ({ label, value, onChange, placeholder = "••••••••" }) => {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <input
          className="mp-input"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ paddingRight: "2.5rem" }}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{
            position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)",
            display: "flex", padding: "0.2rem",
          }}
          aria-label={show ? "Masquer" : "Afficher"}
        >
          <Icon name={show ? "x" : "search"} size={14} />
        </button>
      </div>
    </Field>
  );
};
