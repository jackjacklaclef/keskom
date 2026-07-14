import React, { useState, useEffect, useMemo } from "react";

// ============================================================
// DESIGN TOKENS — "Carnet de cuisine"
// Palette inspirée des carnets de recettes de famille : papier
// kraft, encre, tampon terracotta. Une seule police d'accent
// (Fraunces) pour les titres, Inter pour tout le reste.
// ============================================================

const colors = {
  paper: "#F6F1E4",
  paperRaised: "#FFFFFF",
  paperSunken: "#EEE6D3",
  ink: "#2B2A28",
  inkSoft: "#6B6459",
  inkFaint: "#A39A8A",
  line: "#DCD2BA",
  lineStrong: "#C7BA98",
  clay: "#C1502E",
  claySoft: "#E7C3B4",
  clayWash: "#F3E0D6",
  sage: "#5E7350",
  sageSoft: "#CBD6BE",
  sageWash: "#E7EDDD",
  amber: "#C98A2C",
  amberWash: "#F5E5C6",
  berry: "#9C3B4F",
  berryWash: "#EDD7DB",
  white: "#FFFFFF",
};

const dark = {
  paper: "#211F1B",
  paperRaised: "#2B2925",
  paperSunken: "#191816",
  ink: "#F3EDE0",
  inkSoft: "#B8AE9B",
  inkFaint: "#796F5E",
  line: "#42392D",
  lineStrong: "#544835",
  clay: "#E08054",
  claySoft: "#5C3A2C",
  clayWash: "#3A2A22",
  sage: "#93AC81",
  sageSoft: "#3D4734",
  sageWash: "#2B3326",
  amber: "#E0AC52",
  amberWash: "#3D3220",
  berry: "#D17C8F",
  berryWash: "#3B2229",
  white: "#FFFFFF",
};

const space = {
  xs: "0.375rem",
  sm: "0.625rem",
  md: "0.9rem",
  lg: "1.35rem",
  xl: "1.85rem",
  "2xl": "2.5rem",
  "3xl": "3.25rem",
};

const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  pill: "999px",
};

const MEAL_TYPES = [
  { id: "breakfast", label: "Petit-déjeuner", short: "PDJ", color: "amber" },
  { id: "lunch", label: "Déjeuner", short: "DEJ", color: "clay" },
  { id: "dinner", label: "Dîner", short: "DIN", color: "sage" },
];

const NAV_ITEMS = [
  { id: "calendar",      label: "Calendrier",    icon: "calendar", primary: true  },
  { id: "recipes",       label: "Recettes",      icon: "book",     primary: true  },
  { id: "shopping",      label: "Courses",       icon: "list",     primary: true  },
  { id: "preferences",   label: "Préférences",   icon: "sliders",  primary: false },
  { id: "family",        label: "Famille",       icon: "users",    primary: false },
  { id: "notifications", label: "Notifications", icon: "bell",     primary: false },
  { id: "account",       label: "Mon compte",    icon: "mail",     primary: false },
];

const NAV_PRIMARY   = NAV_ITEMS.filter((i) => i.primary);
const NAV_SECONDARY = NAV_ITEMS.filter((i) => !i.primary);

// ============================================================
// GLOBAL STYLE — real CSS with media queries instead of a JS
// isMobile() ternary sprinkled through every component.
// ============================================================

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

    .mp-root, .mp-root * {
      box-sizing: border-box;
    }
    .mp-root {
      --paper: ${colors.paper};
      --paper-raised: ${colors.paperRaised};
      --paper-sunken: ${colors.paperSunken};
      --ink: ${colors.ink};
      --ink-soft: ${colors.inkSoft};
      --ink-faint: ${colors.inkFaint};
      --line: ${colors.line};
      --line-strong: ${colors.lineStrong};
      --clay: ${colors.clay};
      --clay-soft: ${colors.claySoft};
      --clay-wash: ${colors.clayWash};
      --sage: ${colors.sage};
      --sage-soft: ${colors.sageSoft};
      --sage-wash: ${colors.sageWash};
      --amber: ${colors.amber};
      --amber-wash: ${colors.amberWash};
      --berry: ${colors.berry};
      --berry-wash: ${colors.berryWash};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--paper);
      color: var(--ink);
      min-height: 100vh;
    }
    .mp-root.dark {
      --paper: ${dark.paper};
      --paper-raised: ${dark.paperRaised};
      --paper-sunken: ${dark.paperSunken};
      --ink: ${dark.ink};
      --ink-soft: ${dark.inkSoft};
      --ink-faint: ${dark.inkFaint};
      --line: ${dark.line};
      --line-strong: ${dark.lineStrong};
      --clay: ${dark.clay};
      --clay-soft: ${dark.claySoft};
      --clay-wash: ${dark.clayWash};
      --sage: ${dark.sage};
      --sage-soft: ${dark.sageSoft};
      --sage-wash: ${dark.sageWash};
      --amber: ${dark.amber};
      --amber-wash: ${dark.amberWash};
      --berry: ${dark.berry};
      --berry-wash: ${dark.berryWash};
    }
    .mp-root h1, .mp-root h2, .mp-root h3, .mp-serif {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 500;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .mp-h1 { font-size: 1.7rem; line-height: 1.2; }
    .mp-h2 { font-size: 1.3rem; line-height: 1.25; }
    .mp-h3 { font-size: 1.05rem; line-height: 1.3; }
    .mp-body { font-size: 0.95rem; line-height: 1.55; }
    .mp-small { font-size: 0.8rem; line-height: 1.45; }
    .mp-micro { font-size: 0.7rem; line-height: 1.3; letter-spacing: 0.03em; }
    .mp-text-soft { color: var(--ink-soft); }
    .mp-text-faint { color: var(--ink-faint); }

    .mp-btn {
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: ${radius.sm};
      padding: 0.5rem 0.85rem;
      cursor: pointer;
      transition: background-color 120ms ease, border-color 120ms ease, opacity 120ms ease, transform 80ms ease;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      white-space: nowrap;
      line-height: 1.2;
    }
    .mp-btn:active { transform: scale(0.97); }
    .mp-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .mp-btn-primary {
      background: var(--clay);
      color: ${colors.white};
      border-color: var(--clay);
    }
    .mp-btn-primary:hover:not(:disabled) { background: var(--berry); border-color: var(--berry); }
    .mp-btn-secondary {
      background: transparent;
      color: var(--ink);
      border-color: var(--line-strong);
    }
    .mp-btn-secondary:hover:not(:disabled) { background: var(--paper-sunken); }
    .mp-btn-ghost {
      background: transparent;
      color: var(--ink-soft);
      border-color: transparent;
      padding: 0.35rem 0.5rem;
    }
    .mp-btn-ghost:hover:not(:disabled) { background: var(--paper-sunken); color: var(--ink); }
    .mp-btn-danger {
      background: transparent;
      color: var(--berry);
      border-color: transparent;
      padding: 0.35rem 0.5rem;
    }
    .mp-btn-danger:hover:not(:disabled) { background: var(--berry-wash); }
    .mp-btn-icon { padding: 0.4rem; min-width: 2rem; }
    .mp-btn-sm { font-size: 0.75rem; padding: 0.35rem 0.6rem; }

    .mp-input, .mp-select, .mp-textarea {
      font-family: inherit;
      font-size: 0.9rem;
      width: 100%;
      padding: 0.5rem 0.7rem;
      border-radius: ${radius.sm};
      border: 1px solid var(--line);
      background: var(--paper-raised);
      color: var(--ink);
      transition: border-color 120ms ease;
    }
    .mp-input:focus, .mp-select:focus, .mp-textarea:focus {
      outline: none;
      border-color: var(--clay);
    }
    .mp-textarea { resize: vertical; min-height: 4.5rem; }
    .mp-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ink-soft);
      margin-bottom: 0.3rem;
    }
    .mp-field { margin-bottom: 0.9rem; }
    @media (max-width: 768px) {
      .mp-field { margin-bottom: 0.65rem; }
      .mp-textarea { min-height: 3rem; }
    }

    .mp-card {
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: ${radius.lg};
      padding: 1.1rem;
    }

    .mp-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      padding: 0.18rem 0.5rem;
      border-radius: ${radius.pill};
      line-height: 1.5;
    }
    .mp-badge-clay { background: var(--clay-wash); color: var(--clay); }
    .mp-badge-sage { background: var(--sage-wash); color: var(--sage); }
    .mp-badge-amber { background: var(--amber-wash); color: var(--amber); }
    .mp-badge-berry { background: var(--berry-wash); color: var(--berry); }
    .mp-badge-neutral { background: var(--paper-sunken); color: var(--ink-soft); }

    .mp-checkbox { accent-color: var(--clay); width: 1.05rem; height: 1.05rem; cursor: pointer; }

    .mp-empty {
      text-align: center;
      padding: 2.75rem 1.5rem;
      border: 1px dashed var(--line-strong);
      border-radius: ${radius.lg};
      color: var(--ink-soft);
    }

    .mp-divider { border: none; border-top: 1px solid var(--line); margin: 0; }

    .mp-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 18, 14, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }
    .mp-modal {
      background: var(--paper-raised);
      border-radius: ${radius.lg};
      padding: 1.5rem;
      width: 460px;
      max-width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(20, 18, 14, 0.25);
    }
    @media (max-width: 768px) {
      .mp-modal-backdrop {
        align-items: flex-end;
        padding: 0;
      }
      .mp-modal {
        width: 100%;
        max-width: 100%;
        max-height: 92dvh;
        border-radius: ${radius.lg} ${radius.lg} 0 0;
        padding: 1.25rem 1rem 2rem;
      }
    }

    /* ---- App shell / responsive layout ---- */
    .mp-shell {
      display: flex;
      min-height: 100vh;
    }
    .mp-main {
      flex: 1;
      min-width: 0;
      padding: 1.5rem 1.75rem 2.5rem;
    }
    .mp-view-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.9rem;
      margin-bottom: 1.75rem;
    }
    .mp-grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .mp-shell { flex-direction: column; }
      .mp-main { padding: 1rem 1rem 5.5rem; padding-top: calc(52px + 1rem); }
      .mp-h1 { font-size: 1.35rem; }
      .mp-h2 { font-size: 1.1rem; }
      .mp-grid-cards { grid-template-columns: 1fr; }
      .mp-hide-mobile { display: none !important; }
    }
    @media (min-width: 769px) {
      .mp-hide-desktop { display: none !important; }
    }

    .mp-icon-btn-tap {
      width: 1.6rem;
      height: 1.6rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* ---- Toast ---- */
    @keyframes mp-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes mp-toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to   { opacity: 0; transform: translateX(-50%) translateY(6px); }
    }
    .mp-toast {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1200;
      background: var(--ink);
      color: var(--paper);
      padding: 0.65rem 1rem;
      border-radius: ${radius.md};
      font-size: 0.82rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 6px 24px rgba(0,0,0,0.22);
      white-space: nowrap;
      max-width: calc(100vw - 2rem);
      animation: mp-toast-in 180ms ease forwards;
      pointer-events: none;
    }
    .mp-toast.leaving {
      animation: mp-toast-out 300ms ease forwards;
    }
    .mp-toast-sage { background: var(--sage); }
    .mp-toast-berry { background: var(--berry); }

    /* ---- FAB (mobile only) ---- */
    .mp-fab {
      position: fixed;
      bottom: 4.5rem;
      right: 1rem;
      z-index: 800;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: var(--clay);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.22);
      transition: transform 120ms ease, background 120ms ease;
    }
    .mp-fab:active { transform: scale(0.92); }
    .mp-fab:hover { background: var(--berry); }

    /* ---- Recipe list separator ---- */
    .mp-recipe-sep {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-faint);
      padding: 0.5rem 0.6rem 0.2rem;
    }

    /* ---- Mobile drawer ---- */
    .mp-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 18, 14, 0.35);
      z-index: 850;
      animation: mp-fade-in 150ms ease forwards;
    }
    .mp-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--paper-raised);
      border-radius: ${radius.lg} ${radius.lg} 0 0;
      border-top: 1px solid var(--line);
      padding: 0.5rem 1rem 2rem;
      z-index: 860;
      animation: mp-slide-up 200ms ease forwards;
    }
    @keyframes mp-fade-in {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes mp-slide-up {
      from { transform: translateY(100%); } to { transform: translateY(0); }
    }
    .mp-drawer-handle {
      width: 2.5rem;
      height: 3px;
      background: var(--line-strong);
      border-radius: 2px;
      margin: 0.5rem auto 1rem;
    }

    /* ---- Nav secondary badge (desktop) ---- */
    .mp-nav-section-label {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-faint);
      padding: 0.6rem 0.6rem 0.2rem;
    }

    /* ---- Slot flash (confirmation de modification) ---- */
    @keyframes mp-slot-flash {
      0%   { transform: scale(1);    box-shadow: none; }
      30%  { transform: scale(1.03); box-shadow: 0 0 0 3px var(--clay); }
      70%  { transform: scale(1.01); box-shadow: 0 0 0 2px var(--clay-soft); }
      100% { transform: scale(1);    box-shadow: none; }
    }
    .mp-slot-flash {
      animation: mp-slot-flash 600ms ease forwards;
    }
    /* ---- Auth screens ---- */
    .mp-auth-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--paper);
    }
    .mp-auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: ${radius.lg};
      padding: 2.25rem 2rem 2rem;
      box-shadow: 0 8px 32px rgba(20,18,14,0.08);
    }
    .mp-auth-logo {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .mp-auth-error {
      background: var(--berry-wash);
      border: 1px solid var(--berry);
      color: var(--berry);
      border-radius: ${radius.sm};
      padding: 0.55rem 0.75rem;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
    .mp-auth-success {
      background: var(--sage-wash);
      border: 1px solid var(--sage);
      color: var(--sage);
      border-radius: ${radius.sm};
      padding: 0.55rem 0.75rem;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
    .mp-auth-link {
      background: none;
      border: none;
      color: var(--clay);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .mp-auth-link:hover { color: var(--berry); }
    .mp-auth-divider {
      text-align: center;
      margin: 1.25rem 0 0;
      color: var(--ink-soft);
      font-size: 0.82rem;
    }
    /* ---- Vue semaine responsive ---- */
    .mp-week-grid {
      display: grid;
      grid-template-columns: 6rem repeat(3, 1fr);
      gap: 0.4rem;
    }
    @media (max-width: 768px) {
      .mp-week-grid {
        grid-template-columns: 2.75rem repeat(3, 1fr);
        gap: 0.25rem;
      }
    }
    .mp-week-day-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mp-week-day-num {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
      margin-top: 0.15rem;
      font-family: 'Fraunces', Georgia, serif;
    }
    @media (max-width: 768px) {
      .mp-week-day-label { display: none; }
      .mp-week-day-num { font-size: 0.95rem; margin-top: 0; }
      .mp-week-meal-label-full { display: none; }
      .mp-week-meal-label-short { display: inline; }
    }
    @media (min-width: 769px) {
      .mp-week-meal-label-full { display: inline; }
      .mp-week-meal-label-short { display: none; }
    }
    /* ---- Stepper recette ---- */
    .mp-stepper {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 1.5rem;
    }
    .mp-step {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex: 1;
      min-width: 0;
    }
    .mp-step-dot {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
      transition: background 200ms, color 200ms;
    }
    .mp-step-dot.active  { background: var(--clay); color: #fff; }
    .mp-step-dot.done    { background: var(--sage); color: #fff; }
    .mp-step-dot.pending { background: var(--paper-sunken); color: var(--ink-faint); border: 1px solid var(--line); }
    .mp-step-label {
      font-size: 0.75rem; font-weight: 500; color: var(--ink-soft);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .mp-step-label.active { color: var(--clay); font-weight: 600; }
    .mp-step-connector { flex: 1; height: 1px; background: var(--line); margin: 0 0.3rem; min-width: 0.5rem; }
    @media (max-width: 768px) {
      .mp-step-label { display: none; }
      .mp-step { flex: 0; }
      .mp-stepper { gap: 0.5rem; justify-content: center; margin-bottom: 1.1rem; }
      .mp-step-connector { flex: 1; max-width: 2rem; }
    }

    /* ---- Catégorie recette — pills compactes ---- */
    .mp-recipe-cat-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .mp-recipe-cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.65rem;
      border-radius: ${radius.pill};
      border: 1.5px solid var(--line);
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ink-soft);
      transition: border-color 100ms, background 100ms, color 100ms;
      white-space: nowrap;
    }
    .mp-recipe-cat-pill:hover { border-color: var(--line-strong); color: var(--ink); }
    .mp-recipe-cat-pill.selected {
      border-color: var(--clay);
      background: var(--clay-wash);
      color: var(--clay);
      font-weight: 600;
    }
    /* ---- Carte recette — actions en surimpression ---- */
    .mp-recipe-card {
      position: relative;
      cursor: pointer;
      transition: box-shadow 120ms, transform 80ms;
    }
    .mp-recipe-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .mp-recipe-card:active { transform: scale(0.99); }
    .mp-recipe-card-actions {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      display: flex;
      gap: 0.15rem;
      opacity: 0;
      transition: opacity 120ms;
    }
    .mp-recipe-card:hover .mp-recipe-card-actions { opacity: 1; }
    @media (max-width: 768px) {
      .mp-recipe-card-actions { opacity: 1; }
    }
  `}</style>
);

// Tiny inline icon set (outline strokes, no external deps/emoji)
const Icon = ({ name, size = 16 }) => {
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
  };
  return (
    <svg {...common} aria-hidden="true" style={{ flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

// Icône de catégorie recette / régime — SVG inline avec couleur
const CategoryIcon = ({ icon, size = 18, color = "currentColor" }) => (
  <Icon name={icon} size={size} color={color} />
);

const MEAL_BADGE_CLASS = {
  amber: "mp-badge-amber",
  clay: "mp-badge-clay",
  sage: "mp-badge-sage",
};

// ============================================================
// MOCK DATA
// ============================================================

const initialRecipes = [
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

const initialMealPlans = [
  { id: "1", date: new Date().toISOString().split("T")[0], recipeIds: ["1"], type: "lunch" },
  { id: "2", date: new Date().toISOString().split("T")[0], recipeIds: ["2"], type: "dinner" },
];

const initialShoppingList = [
  { id: "1", name: "Pâtes", quantity: "400g", completed: false },
  { id: "2", name: "Poulet", quantity: "200g", completed: false },
  { id: "3", name: "Tomates", quantity: "4", completed: true },
];

const initialFamilyMembers = [
  {
    id: "1",
    name: "Camille",
    email: "camille@example.com",
    preferences: ["Végétarien le lundi"],
    allergies: ["Arachides"],
  },
];

const ingredientCategories = [
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

const initialIngredients = [
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

const QUANTITY_UNITS = ["g", "kg", "L", "ml", "c. à soupe", "c. à café", "pièce", "autre"];

const RECIPE_CATEGORIES = [
  { id: "breakfast",  label: "Petit-déjeuner", icon: "cat-breakfast", color: "amber",   hex: colors.amber },
  { id: "starter",    label: "Entrée",          icon: "cat-starter",   color: "sage",    hex: colors.sage },
  { id: "main",       label: "Plat principal",  icon: "cat-main",      color: "clay",    hex: colors.clay },
  { id: "soup",       label: "Soupe",           icon: "cat-soup",      color: "berry",   hex: colors.berry },
  { id: "snack",      label: "En-cas",          icon: "cat-snack",     color: "amber",   hex: "#B07A1A" },
  { id: "dessert",    label: "Dessert",         icon: "cat-dessert",   color: "berry",   hex: "#9C3B4F" },
  { id: "sauce",      label: "Sauce / base",    icon: "cat-sauce",     color: "sage",    hex: "#4A6340" },
  { id: "other",      label: "Autre",           icon: "cat-other",     color: "neutral", hex: colors.inkSoft },
];

// ============================================================
// SHARED UI PRIMITIVES
// ============================================================

const Modal = ({ onClose, width, children }) => (
  <div className="mp-modal-backdrop" onClick={onClose}>
    <div className="mp-modal" style={width ? { width } : undefined} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
    <h2 className="mp-h2">{title}</h2>
    <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
      <Icon name="x" />
    </button>
  </div>
);

const Field = ({ label, children }) => (
  <div className="mp-field">
    <span className="mp-label">{label}</span>
    {children}
  </div>
);

const EmptyState = ({ title, hint }) => (
  <div className="mp-empty">
    <p className="mp-h3" style={{ marginBottom: hint ? "0.35rem" : 0 }}>{title}</p>
    {hint && <p className="mp-small mp-text-soft">{hint}</p>}
  </div>
);

const MealBadge = ({ typeId, children, onClick, muted }) => {
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
const useToast = () => {
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

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`mp-toast${toast.variant !== "default" ? ` mp-toast-${toast.variant}` : ""}${toast.leaving ? " leaving" : ""}`}>
      <Icon name={toast.variant === "berry" ? "x" : "check"} size={14} />
      {toast.message}
    </div>
  );
};

const CategoryDot = ({ hex }) => (
  <span style={{ width: 7, height: 7, borderRadius: "50%", background: hex, display: "inline-block", flexShrink: 0 }} />
);

// Saisie de tags type "Entrée pour ajouter" : input texte + Entrée crée une puce,
// chaque puce a une croix pour la retirer. Utilisé pour préférences/allergies.
const TagInput = ({ values, onChange, placeholder, badgeVariant }) => {
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

const MemberModal = ({ member, onClose, onSave }) => {
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [preferences, setPreferences] = useState(member?.preferences || []);
  const [allergies, setAllergies] = useState(member?.allergies || []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ ...member, name: name.trim(), email: email.trim(), preferences, allergies });
  };

  return (
    <Modal onClose={onClose} width="420px">
      <ModalHeader title={member?.id === NEW_MEMBER_SENTINEL ? "Nouveau membre" : "Modifier le membre"} onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <Field label="Nom *">
          <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Camille" required />
        </Field>
        <Field label="Email">
          <input className="mp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="camille@example.com" />
        </Field>
        <Field label="Préférences">
          <TagInput values={preferences} onChange={setPreferences} placeholder="Ajouter une préférence, puis Entrée" badgeVariant="sage" />
        </Field>
        <Field label="Allergies">
          <TagInput values={allergies} onChange={setAllergies} placeholder="Ajouter une allergie, puis Entrée" badgeVariant="berry" />
        </Field>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
          <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="mp-btn mp-btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// SIDEBAR / NAVIGATION
// ============================================================

const NavButton = ({ item, active, onClick, size = "md" }) => (
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

const MobileDrawer = ({ currentView, onNavigate, darkMode, onToggleDark, currentUser, onLogout, onClose }) => (
  <>
    <div className="mp-drawer-backdrop" onClick={onClose} />
    <div className="mp-drawer">
      <div className="mp-drawer-handle" />

      {/* Items secondaires */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: "0.5rem" }}>
        {NAV_SECONDARY.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={(id) => { onNavigate(id); onClose(); }}
          />
        ))}
      </div>

      <hr className="mp-divider" style={{ margin: "0.4rem 0" }} />

      {/* Mode clair/sombre */}
      <button
        type="button"
        onClick={() => { onToggleDark(); onClose(); }}
        className="mp-btn"
        style={{ justifyContent: "flex-start", background: "transparent", color: "var(--ink-soft)", border: "none", width: "100%", marginTop: "0.2rem" }}
      >
        <Icon name={darkMode ? "sun" : "moon"} />
        {darkMode ? "Mode clair" : "Mode sombre"}
      </button>

      {/* Déconnexion */}
      {currentUser && (
        <>
          <hr className="mp-divider" style={{ margin: "0.4rem 0" }} />
          <div style={{ padding: "0.35rem 0.6rem 0.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "1.5rem", height: "1.5rem", borderRadius: "50%",
              background: "var(--clay-wash)", border: "1px solid var(--clay-soft)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--clay)" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="mp-small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mp-btn"
            style={{ justifyContent: "flex-start", background: "transparent", color: "var(--berry)", border: "none", width: "100%", marginTop: "0.1rem" }}
            onClick={() => { onLogout(); onClose(); }}
          >
            <Icon name="x" size={14} /> Se déconnecter
          </button>
        </>
      )}
    </div>
  </>
);

const Sidebar = ({ currentView, onNavigate, darkMode, onToggleDark, currentUser, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const secondaryActive = NAV_SECONDARY.some((i) => i.id === currentView);

  return (
    <>
      {/* ══════════════════════════════════════════ */}
      {/* Desktop sidebar                           */}
      {/* ══════════════════════════════════════════ */}
      <nav className="mp-hide-mobile" style={{
        width: "210px", flexShrink: 0,
        borderRight: "1px solid var(--line)",
        display: "flex", flexDirection: "column",
        background: "var(--paper-raised)",
      }}>
        {/* Logo — haut gauche */}
        <div style={{
          padding: "1.25rem 1rem 1rem",
          borderBottom: "1px solid var(--line)",
          cursor: "pointer",
        }} onClick={() => onNavigate("calendar")}>
          <KeskомLogo size="sm" />
        </div>

        {/* Navigation principale */}
        <div style={{ padding: "0.75rem 0.75rem 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {NAV_PRIMARY.map((item) => (
              <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} />
            ))}
          </div>

          {/* Séparateur Paramètres */}
          <div style={{ marginTop: "1.25rem" }}>
            <p className="mp-micro mp-text-faint" style={{
              textTransform: "uppercase", letterSpacing: "0.08em",
              fontWeight: 700, padding: "0 0.5rem", marginBottom: "0.35rem",
            }}>Paramètres</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              {NAV_SECONDARY.map((item) => (
                <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} size="sm" />
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} />
        </div>

        {/* Bas de sidebar — dark mode + utilisateur */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--line)" }}>
          <button type="button" onClick={onToggleDark}
            className="mp-btn mp-btn-ghost"
            style={{ justifyContent: "flex-start", width: "100%", marginBottom: "0.5rem" }}>
            <Icon name={darkMode ? "sun" : "moon"} size={15} />
            {darkMode ? "Mode clair" : "Mode sombre"}
          </button>

          {currentUser && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.6rem" }}>
              {/* Bloc utilisateur cliquable → AccountView */}
              <button type="button" onClick={() => onNavigate("account")}
                style={{
                  display: "flex", alignItems: "center", gap: "0.55rem",
                  width: "100%", background: currentView === "account" ? "var(--clay-wash)" : "transparent",
                  border: "none", borderRadius: radius.sm, padding: "0.45rem 0.5rem",
                  cursor: "pointer", textAlign: "left", transition: "background 100ms",
                }}>
                {/* Avatar initiale */}
                <div style={{
                  width: "1.8rem", height: "1.8rem", borderRadius: "50%",
                  background: "var(--clay-wash)", border: "1.5px solid var(--clay-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clay)" }}>
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="mp-small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.name}
                  </p>
                  <p className="mp-micro mp-text-faint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.email}
                  </p>
                </div>
              </button>

              <button type="button" className="mp-btn mp-btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", color: "var(--berry)", marginTop: "0.15rem" }}
                onClick={onLogout}>
                <Icon name="x" size={13} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════ */}
      {/* Mobile — topbar + bottom nav              */}
      {/* ══════════════════════════════════════════ */}

      {/* Topbar mobile */}
      <header className="mp-hide-desktop" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "52px",
        background: "var(--paper-raised)", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1rem", zIndex: 900,
      }}>
        {/* Logo à gauche */}
        <div onClick={() => onNavigate("calendar")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* SVG miniature inline */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 215" width="32" height="23">
            <defs>
              <filter id="kshadow-m">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#3D5C2E" floodOpacity="0.2"/>
              </filter>
            </defs>
            <g filter="url(#kshadow-m)">
              <circle cx="150" cy="107" r="72" fill="#6B8C5A"/>
              <circle cx="150" cy="107" r="54" fill="#F5F0E8"/>
            </g>
            <path d="M140 97 Q140 79 150 77 Q161 77 163 87 Q165 97 156 105 Q151 110 151 123"
                  fill="none" stroke="#6B8C5A" strokeWidth="8" strokeLinecap="round"/>
            <circle cx="151" cy="135" r="5.5" fill="#6B8C5A"/>
            <g transform="translate(38, 107)">
              <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
              <rect x="-4" y="-22" width="8" height="38" rx="2" fill="#6B8C5A"/>
              <rect x="-10" y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
              <rect x="-3" y="-62" width="4" height="42" rx="2" fill="#6B8C5A"/>
              <rect x="4" y="-58" width="4" height="38" rx="2" fill="#6B8C5A"/>
            </g>
            <g transform="translate(262, 107)">
              <rect x="-4" y="14" width="8" height="52" rx="4" fill="#6B8C5A"/>
              <rect x="-4" y="-62" width="8" height="78" rx="2" fill="#6B8C5A"/>
              <path d="M4 -62 Q14 -46 14 -26 Q14 -10 4 -2 L4 -62 Z" fill="#6B8C5A" fillOpacity="0.65"/>
            </g>
          </svg>
          <span style={{
            fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700,
            fontSize: "1rem", color: "var(--sage)", letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>Keskon'm</span>
        </div>

        {/* Avatar + bouton "…" à droite */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button type="button" onClick={() => setDrawerOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", display: "flex", alignItems: "center", padding: "0.2rem" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {currentUser && (
            <button type="button" onClick={() => onNavigate("account")}
              style={{
                width: "2rem", height: "2rem", borderRadius: "50%",
                background: currentView === "account" ? "var(--clay)" : "var(--clay-wash)",
                border: "1.5px solid var(--clay-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: currentView === "account" ? "#fff" : "var(--clay)" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Bottom nav mobile */}
      <nav className="mp-hide-desktop" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--paper-raised)", borderTop: "1px solid var(--line)",
        display: "flex", zIndex: 900, padding: "0.2rem 0",
      }}>
        {NAV_PRIMARY.map((item) => {
          const active = currentView === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                padding: "0.45rem 0.1rem", background: "transparent", border: "none",
                color: active ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer", transition: "color 100ms",
              }}>
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400, letterSpacing: "0.01em" }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Bouton "…" → drawer */}
        <button type="button" onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            padding: "0.45rem 0.1rem", background: "transparent", border: "none",
            color: secondaryActive ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer", transition: "color 100ms",
          }} aria-label="Plus">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
          <span style={{ fontSize: "0.65rem", fontWeight: secondaryActive ? 600 : 400 }}>Plus</span>
        </button>
      </nav>

      {/* Drawer mobile */}
      {drawerOpen && (
        <MobileDrawer currentView={currentView} onNavigate={onNavigate}
          darkMode={darkMode} onToggleDark={onToggleDark}
          currentUser={currentUser} onLogout={onLogout}
          onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
};

// ============================================================
// CALENDAR VIEW
// ============================================================

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const todayStr = () => new Date().toISOString().split("T")[0];

// Modale de confirmation pour vider une semaine
const ClearWeekModal = ({ dateStr, mealPlans, onClose, onClear }) => {
  const monday = getMondayOf(new Date(dateStr + "T12:00:00"));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weekMeals = mealPlans.filter((mp) => {
    const m = getMondayOf(new Date(mp.date + "T12:00:00"));
    return m.toISOString().split("T")[0] === monday.toISOString().split("T")[0];
  });

  return (
    <Modal onClose={onClose} width="380px">
      <ModalHeader title="Vider la semaine" onClose={onClose} />
      <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
        Semaine du {monday.toISOString().split("T")[0]} au {sunday.toISOString().split("T")[0]}
      </p>
      <div style={{ background: "var(--berry-wash)", border: "1px solid var(--berry)", borderRadius: radius.sm, padding: "0.65rem 0.8rem", marginBottom: space.lg }}>
        <p className="mp-small" style={{ color: "var(--berry)", fontWeight: 600 }}>
          {weekMeals.length} repas planifié{weekMeals.length > 1 ? "s" : ""} seront supprimés.
        </p>
        <p className="mp-small" style={{ color: "var(--berry)", marginTop: "0.2rem" }}>Cette action est irréversible.</p>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="mp-btn"
          style={{ background: "var(--berry)", color: "#fff", border: "none" }}
          disabled={weekMeals.length === 0}
          onClick={onClear}
        >
          <Icon name="trash" size={14} /> Vider
        </button>
      </div>
    </Modal>
  );
};

// Modale de choix du mode d'application d'un template
const ApplyTemplateModeModal = ({ template, dateStr, onClose, onApply }) => {
  const [mode, setMode] = useState("merge");
  const monday = getMondayOf(new Date(dateStr + "T12:00:00"));
  const mondayStr = monday.toISOString().split("T")[0];

  return (
    <Modal onClose={onClose} width="380px">
      <ModalHeader title={`Appliquer « ${template.name} »`} onClose={onClose} />
      <p className="mp-small mp-text-soft" style={{ marginBottom: space.lg }}>
        Semaine du {mondayStr} — {template.slots.length} créneau{template.slots.length > 1 ? "x" : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: space.lg }}>
        {[
          { value: "merge", label: "Compléter", desc: "Ajoute uniquement les créneaux vides, conserve l'existant." },
          { value: "overwrite", label: "Écraser", desc: "Remplace tous les créneaux de la semaine par le modèle." },
        ].map((opt) => (
          <label
            key={opt.value}
            style={{
              display: "flex", alignItems: "flex-start", gap: "0.65rem",
              padding: "0.65rem 0.75rem", borderRadius: radius.sm, cursor: "pointer",
              border: `1px solid ${mode === opt.value ? "var(--clay)" : "var(--line)"}`,
              background: mode === opt.value ? "var(--clay-wash)" : "var(--paper-sunken)",
              transition: "background 100ms, border-color 100ms",
            }}
          >
            <input
              type="radio"
              name="apply-mode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={() => setMode(opt.value)}
              style={{ accentColor: "var(--clay)", marginTop: "0.15rem", flexShrink: 0 }}
            />
            <div>
              <p className="mp-small" style={{ fontWeight: 600 }}>{opt.label}</p>
              <p className="mp-small mp-text-soft">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button type="button" className="mp-btn mp-btn-primary" onClick={() => onApply(mode)}>
          Appliquer
        </button>
      </div>
    </Modal>
  );
};

// Modale de duplication — choisir la semaine cible
const DuplicateWeekModal = ({ dateStr, mealPlans, onClose, onDuplicate }) => {
  const srcMonday = getMondayOf(new Date(dateStr + "T12:00:00"));
  const nextMonday = new Date(srcMonday);
  nextMonday.setDate(srcMonday.getDate() + 7);
  const [targetWeek, setTargetWeek] = useState(nextMonday.toISOString().split("T")[0]);

  const srcMeals = mealPlans.filter((mp) => {
    const m = getMondayOf(new Date(mp.date + "T12:00:00"));
    return m.toISOString().split("T")[0] === srcMonday.toISOString().split("T")[0];
  });

  const targetMonday = getMondayOf(new Date(targetWeek + "T12:00:00"));
  const conflictCount = srcMeals.filter((mp) => {
    const offset = Math.round((new Date(mp.date + "T12:00:00") - srcMonday) / 86400000);
    const newDate = new Date(targetMonday);
    newDate.setDate(targetMonday.getDate() + offset);
    const newDateStr = newDate.toISOString().split("T")[0];
    return mealPlans.some((p) => p.date === newDateStr && p.type === mp.type && (p.recipeIds||[]).length > 0);
  }).length;

  return (
    <Modal onClose={onClose} width="380px">
      <ModalHeader title="Dupliquer la semaine" onClose={onClose} />
      <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
        {srcMeals.length} repas planifié{srcMeals.length > 1 ? "s" : ""} — semaine du {srcMonday.toISOString().split("T")[0]}
      </p>
      <Field label="Semaine cible (choisir n'importe quel jour)">
        <input
          className="mp-input"
          type="date"
          value={targetWeek}
          onChange={(e) => setTargetWeek(e.target.value)}
        />
        <p className="mp-micro mp-text-faint" style={{ marginTop: "0.3rem" }}>
          → Sera appliqué à la semaine du {targetMonday.toISOString().split("T")[0]}
        </p>
      </Field>
      {conflictCount > 0 && (
        <p className="mp-small" style={{ color: "var(--amber)", marginBottom: space.md }}>
          ⚠ {conflictCount} créneau{conflictCount > 1 ? "x" : ""} déjà planifié{conflictCount > 1 ? "s" : ""} — ils seront conservés.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="mp-btn mp-btn-primary"
          disabled={srcMeals.length === 0}
          onClick={() => { onDuplicate(dateStr, targetMonday.toISOString().split("T")[0]); onClose(); }}
        >
          Dupliquer
        </button>
      </div>
    </Modal>
  );
};

// Panneau de détail d'une journée — s'insère sous la ligne de semaine
const DayPanel = ({
  date, dateStr, mealPlans, recipes, recentRecipeIds,
  weekTemplates, onAddMeal, onUpdateMeal, onClose,
  onDuplicateWeek, onApplyTemplate, showBreakfast = false, familyMembers = [], onSuggest,
}) => {
  const [editingSlot, setEditingSlot] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [flashedSlot, setFlashedSlot] = useState(null);

  const visibleTypes = MEAL_TYPES.filter((t) => t.id !== "breakfast" || showBreakfast);
  const getMeal = (type) => mealPlans.find((mp) => mp.date === dateStr && mp.type === type);
  const getNames = (meal) => {
    if (!meal || meal.status !== "normal") return [];
    return (meal.recipeIds || []).map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean);
  };

  const handleSaveSlot = (recipeIds) => {
    const type = editingSlot.type;
    const meal = getMeal(type);
    if (meal) onUpdateMeal(meal.id, recipeIds, "normal");
    else onAddMeal({ date: dateStr, type, recipeIds, status: "normal" });
    setEditingSlot(null);
    setFlashedSlot(type); setTimeout(() => setFlashedSlot(null), 650);
  };

  const handleSaveStatus = (status, recipeIds) => {
    const type = editingSlot.type;
    const meal = getMeal(type);
    if (meal) onUpdateMeal(meal.id, recipeIds, status);
    else onAddMeal({ date: dateStr, type, recipeIds, status });
    setEditingSlot(null);
    setFlashedSlot(type); setTimeout(() => setFlashedSlot(null), 650);
  };

  const handleClearSlot = (type) => {
    const meal = getMeal(type);
    if (!meal) return;
    onUpdateMeal(meal.id, [], "normal");
    setFlashedSlot(type); setTimeout(() => setFlashedSlot(null), 650);
  };

  // Algo suggestion aléatoire — respecte allergies et dislikes des membres
  const dayLabel = `${DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;

  return (
    <div style={{
      gridColumn: "1 / -1", background: "var(--paper-raised)",
      border: "1.5px solid var(--clay)", borderRadius: radius.md,
      padding: "1rem 1.1rem", marginBottom: "2px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 className="mp-h3" style={{ color: "var(--clay)" }}>{dayLabel}</h3>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {/* Bouton Suggérer */}
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => onSuggest?.(dateStr)}
            title="Attribuer aléatoirement des plats sur les créneaux vides">
            <Icon name="dice" size={13} /> Suggérer
          </button>
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowDuplicate(true)}>
            <Icon name="copy" size={13} /> Dupliquer
          </button>

          {/* Appliquer un template */}
          {weekTemplates.length > 0 && (
            <div style={{ position: "relative" }}>
              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowTemplates((v) => !v)}>
                <Icon name="calendar" size={13} /> Modèle
              </button>
              {showTemplates && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, minWidth: "200px", overflow: "hidden" }}>
                  {weekTemplates.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => { const monday = getMondayOf(new Date(dateStr + "T12:00:00")); onApplyTemplate(tpl, monday.toISOString().split("T")[0], "merge"); setShowTemplates(false); }}
                      style={{ display: "block", width: "100%", padding: "0.55rem 0.85rem", background: "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: "0.85rem", color: "var(--ink)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
            <Icon name="x" size={15} />
          </button>
        </div>
      </div>

      {/* Créneaux */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${visibleTypes.length}, 1fr)`, gap: "0.5rem" }}>
        {visibleTypes.map((type) => {
          const meal = getMeal(type.id);
          const status = meal?.status || "normal";
          const names = getNames(meal);
          const dotColor = type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)";
          const washColor = type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)";
          const isFlashing = flashedSlot === type.id;

          const bgColor = status === "restaurant" ? "var(--amber-wash)"
            : status === "skip" ? "var(--paper-sunken)"
            : names.length > 0 ? washColor : "var(--paper-sunken)";
          const borderColor = status === "restaurant" ? "var(--amber)"
            : status === "skip" ? "var(--line)"
            : names.length > 0 ? dotColor : "var(--line)";

          return (
            <div key={type.id} style={{ position: "relative" }}>
              <button type="button"
                onClick={() => setEditingSlot({ type: type.id, mealId: meal?.id || null })}
                className={isFlashing ? "mp-slot-flash" : ""}
                style={{ width: "100%", background: bgColor, border: `1px solid ${borderColor}`, borderRadius: radius.sm, padding: "0.6rem 0.7rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 100ms", minHeight: "3.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span className="mp-micro" style={{ fontWeight: 700, color: dotColor, textTransform: "uppercase" }}>{type.label}</span>
                </div>
                {status === "restaurant" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--amber)" }}>
                    <Icon name="restaurant" size={12} />
                    <span className="mp-small" style={{ fontWeight: 600 }}>Restaurant</span>
                  </div>
                )}
                {status === "skip" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--ink-faint)" }}>
                    <Icon name="skip" size={12} />
                    <span className="mp-small">Pas de repas</span>
                  </div>
                )}
                {status === "normal" && (
                  names.length === 0
                    ? <span className="mp-small mp-text-faint">+ Ajouter</span>
                    : <span className="mp-small" style={{ color: "var(--ink)", lineHeight: 1.4, paddingRight: "1.4rem" }}>{names.join(", ")}</span>
                )}
              </button>

              {/* Bouton vider — visible si créneau planifié */}
              {(names.length > 0 || status !== "normal") && (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleClearSlot(type.id); }}
                  aria-label={`Vider ${type.label}`}
                  style={{ position: "absolute", top: "0.35rem", right: "0.35rem", width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "var(--paper-raised)", border: "1px solid var(--line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)", transition: "background 100ms, color 100ms" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--berry-wash)"; e.currentTarget.style.color = "var(--berry)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper-raised)"; e.currentTarget.style.color = "var(--ink-faint)"; }}>
                  <Icon name="x" size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editingSlot && (
        <RecipeSelectionModal
          recipes={recipes}
          meal={editingSlot.mealId ? mealPlans.find((mp) => mp.id === editingSlot.mealId) : null}
          mealType={editingSlot.type}
          date={dateStr}
          recentRecipeIds={recentRecipeIds}
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveSlot}
          onSaveStatus={handleSaveStatus}
        />
      )}

      {showDuplicate && (
        <DuplicateWeekModal dateStr={dateStr} mealPlans={mealPlans} onClose={() => setShowDuplicate(false)}
          onDuplicate={(srcDateStr, targetMondayStr) => { onDuplicateWeek(srcDateStr, targetMondayStr); setShowDuplicate(false); }} />
      )}
    </div>
  );
};

const CalendarView = ({ mealPlans, recipes, onAddMeal, onUpdateMeal, recentRecipeIds = [], weekTemplates = [], onApplyTemplate, onDuplicateWeek, onClearWeek, onNavigate, familyMembers = [] }) => {
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekEditingSlot, setWeekEditingSlot] = useState(null);
  const [weekActionType, setWeekActionType] = useState(null);
  const [weekActionDate, setWeekActionDate] = useState(null);
  const [weekActionTemplate, setWeekActionTemplate] = useState(null);
  const [showWeekTemplates, setShowWeekTemplates] = useState(false);
  const [showBreakfast, setShowBreakfast] = useState(() => {
    try { return localStorage.getItem("mealPlanner_showBreakfast") === "true"; } catch { return false; }
  });

  const toggleBreakfast = () => {
    const next = !showBreakfast;
    setShowBreakfast(next);
    try { localStorage.setItem("mealPlanner_showBreakfast", String(next)); } catch {}
  };

  // Filtrer les MEAL_TYPES selon showBreakfast
  const visibleMealTypes = MEAL_TYPES.filter((t) => t.id !== "breakfast" || showBreakfast);

  // Algo suggestion — peut s'appliquer sur un ensemble de dates
  const suggestForDates = (dates) => {
    // Recettes déjà utilisées cette semaine
    const usedIds = new Set(
      mealPlans.filter((mp) => dates.includes(mp.date)).flatMap((mp) => mp.recipeIds || [])
    );

    const allergyIngredientIds = new Set();
    const dislikeIngredientIds = new Set();
    familyMembers.forEach((m) => {
      (m.allergies || []).forEach((a) => { if (a.type === "ingredient") allergyIngredientIds.add(a.id); });
      (m.dislikes || []).forEach((d) => { if (d.type === "ingredient") dislikeIngredientIds.add(d.id); });
    });

    const categoryMap = {
      breakfast: ["breakfast"],
      lunch: ["main", "soup", "starter", "other"],
      dinner: ["main", "soup", "starter", "other"],
    };

    let added = 0;
    dates.forEach((dateStr) => {
      visibleMealTypes.forEach((type) => {
        const meal = getMeal(dateStr, type.id);
        const isEmpty = !meal || (meal.status === "normal" && (meal.recipeIds || []).length === 0);
        if (!isEmpty) return;

        const candidates = recipes.filter((r) => {
          if (usedIds.has(r.id)) return false;
          if (!categoryMap[type.id]?.includes(r.category)) return false;
          return !(r.ingredients || []).some((ing) =>
            allergyIngredientIds.has(ing.ingredientId) || dislikeIngredientIds.has(ing.ingredientId)
          );
        });

        if (candidates.length === 0) return;
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        usedIds.add(picked.id);

        if (meal) onUpdateMeal(meal.id, [picked.id], "normal");
        else onAddMeal({ date: dateStr, type: type.id, recipeIds: [picked.id], status: "normal" });
        added++;
      });
    });

    return added;
  };

  const goToPrevious = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    setSelectedDate(null);
  };
  const goToNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    setSelectedDate(null);
  };
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(null); };

  // Génère les dates du calendrier groupées par semaine
  const calendarWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const weeksToShow = viewMode === "month" ? 6 : 1;
    const anchor = viewMode === "month" ? new Date(year, month, 1) : new Date(currentDate);
    const dow = anchor.getDay();
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - dow + (dow === 0 ? -6 : 1));

    const weeks = [];
    for (let w = 0; w < weeksToShow; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        week.push(day);
      }
      weeks.push(week);
    }
    return weeks;
  }, [currentDate, viewMode]);

  const getMeal = (dateStr, type) => mealPlans.find((mp) => mp.date === dateStr && mp.type === type);

  return (
    <div>
      {/* ── Ligne 1 : navigation temporelle + sélecteur de vue ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {/* Flèches + titre */}
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-icon" onClick={goToPrevious} aria-label="Précédent">
          <Icon name="chevronLeft" size={15} />
        </button>
        <h2 className="mp-h2" style={{ minWidth: "10rem", textAlign: "center" }}>
          {viewMode === "month"
            ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : `Semaine du ${calendarWeeks[0][0].getDate()} ${MONTHS[calendarWeeks[0][0].getMonth()].slice(0, 3)}`}
        </h2>
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-icon" onClick={goToNext} aria-label="Suivant">
          <Icon name="chevronRight" size={15} />
        </button>
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={goToToday}>
          Aujourd'hui
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Toggle vue — Semaine / Mois */}
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: radius.sm, overflow: "hidden" }}>
          {[["week","Semaine"], ["month","Mois"]].map(([v, label]) => (
            <button key={v} type="button"
              onClick={() => setViewMode(v)}
              style={{
                padding: "0.3rem 0.75rem", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.82rem", fontWeight: viewMode === v ? 700 : 400,
                background: viewMode === v ? "var(--clay)" : "transparent",
                color: viewMode === v ? "#fff" : "var(--ink-soft)",
                transition: "all 100ms",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== VUE SEMAINE ========== */}
      {viewMode === "week" && calendarWeeks[0] && (() => {
        const week = calendarWeeks[0];
        const weekDateStr = week[0].toISOString().split("T")[0];

        return (
          <div>
            {/* ── Ligne 2 : actions semaine ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              marginBottom: "0.85rem", overflowX: "auto", paddingBottom: "2px",
            }}>
              {/* Filtre — toggle PDJ */}
              <button
                type="button"
                className={`mp-btn mp-btn-sm ${showBreakfast ? "mp-btn-primary" : "mp-btn-secondary"}`}
                onClick={toggleBreakfast}
                title={showBreakfast ? "Masquer le petit-déjeuner" : "Afficher le petit-déjeuner"}
                style={{ flexShrink: 0 }}
              >
                <Icon name="sunrise" size={13} /> PDJ
              </button>

              {/* Séparateur vertical */}
              <div style={{ width: "1px", height: "1.5rem", background: "var(--line)", flexShrink: 0, margin: "0 0.1rem" }} />

              {/* Actions */}
              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                onClick={() => suggestForDates(week.map((d) => d.toISOString().split("T")[0]))}
                title="Attribuer aléatoirement des plats sur les créneaux vides">
                <Icon name="dice" size={13} /> Suggérer
              </button>

              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                onClick={() => { setWeekActionDate(weekDateStr); setWeekActionType("duplicate"); }}>
                <Icon name="copy" size={13} /> Dupliquer
              </button>

              {/* Appliquer un modèle */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm"
                  onClick={() => setShowWeekTemplates((v) => !v)}>
                  <Icon name="calendar" size={13} /> Modèle
                </button>
                {showWeekTemplates && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    background: "var(--paper-raised)", border: "1px solid var(--line)",
                    borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 200, minWidth: "200px", overflow: "hidden",
                  }}>
                    {weekTemplates.length === 0 && (
                      <p className="mp-small mp-text-faint" style={{ padding: "0.6rem 0.85rem" }}>Aucun modèle enregistré.</p>
                    )}
                    {weekTemplates.map((tpl) => (
                      <button key={tpl.id} type="button"
                        onClick={() => { setWeekActionDate(weekDateStr); setWeekActionType("apply-template"); setWeekActionTemplate(tpl); setShowWeekTemplates(false); }}
                        style={{ display: "block", width: "100%", padding: "0.55rem 0.85rem", background: "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: "0.85rem", color: "var(--ink)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        {tpl.name}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => { setShowWeekTemplates(false); onNavigate("preferences"); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", padding: "0.55rem 0.85rem", background: "var(--paper-sunken)", border: "none", borderTop: weekTemplates.length > 0 ? "1px solid var(--line)" : "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--clay)", fontWeight: 600 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--paper-sunken)"}>
                      <Icon name="plus" size={13} /> Créer un modèle
                    </button>
                  </div>
                )}
              </div>

              {/* Séparateur avant Vider */}
              <div style={{ flex: 1 }} />

              <button type="button" className="mp-btn mp-btn-sm" style={{ flexShrink: 0, color: "var(--berry)", border: "1px solid var(--berry-wash)", background: "transparent" }}
                onClick={() => { setWeekActionDate(weekDateStr); setWeekActionType("clear"); }}>
                <Icon name="trash" size={13} /> Vider
              </button>
            </div>

            {/* Grille : jours en lignes, repas en colonnes */}
            <div className="mp-week-grid" style={{ gridTemplateColumns: `2.75rem repeat(${visibleMealTypes.length}, 1fr)` }}>
              {/* En-têtes des repas visibles */}
              <div /> {/* coin haut gauche */}
              {visibleMealTypes.map((type) => {
                const dotColor = type.color === "amber" ? "var(--amber)"
                  : type.color === "clay" ? "var(--clay)" : "var(--sage)";
                return (
                  <div key={type.id} style={{
                    textAlign: "center", padding: "0.4rem 0.3rem", borderRadius: radius.sm,
                    background: "var(--paper-sunken)", border: "1px solid var(--line)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span className="mp-week-meal-label-full mp-micro" style={{ fontWeight: 700, color: dotColor, textTransform: "uppercase" }}>
                      {type.label}
                    </span>
                    <span className="mp-week-meal-label-short mp-micro" style={{ fontWeight: 700, color: dotColor, textTransform: "uppercase" }}>
                      {type.short}
                    </span>
                  </div>
                );
              })}

              {/* Lignes — une par jour */}
              {week.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const isToday = dateStr === todayStr();
                const dow = date.getDay();
                const dayLabel = DAYS_OF_WEEK[dow === 0 ? 6 : dow - 1];

                return (
                  <React.Fragment key={dateStr}>
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      padding: "0.4rem 0.3rem", borderRadius: radius.sm,
                      background: isToday ? "var(--clay)" : "var(--paper-sunken)",
                      border: `1px solid ${isToday ? "var(--clay)" : "var(--line)"}`,
                      minHeight: "4rem",
                    }}>
                      <span className="mp-week-day-label" style={{ color: isToday ? "rgba(255,255,255,0.75)" : "var(--ink-faint)" }}>
                        {dayLabel}
                      </span>
                      <span className="mp-week-day-num" style={{ color: isToday ? "#fff" : "var(--ink)" }}>
                        {date.getDate()}
                      </span>
                    </div>

                    {visibleMealTypes.map((type) => {
                      const meal = getMeal(dateStr, type.id);
                      const status = meal?.status || "normal";
                      const names = status === "normal" ? (meal?.recipeIds || []).map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean) : [];
                      const dotColor = type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)";
                      const washColor = type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)";

                      const bgColor = status === "restaurant" ? "var(--amber-wash)"
                        : status === "skip" ? "var(--paper-sunken)"
                        : names.length > 0 ? washColor : "var(--paper-raised)";
                      const borderColor = status === "restaurant" ? "var(--amber)"
                        : status === "skip" ? "var(--line)"
                        : names.length > 0 ? dotColor : "var(--line)";

                      return (
                        <button key={type.id} type="button"
                          onClick={() => setWeekEditingSlot({ dateStr, type: type.id, mealId: meal?.id || null })}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            background: bgColor, border: `1px solid ${borderColor}`,
                            borderRadius: radius.sm, padding: "0.55rem 0.65rem",
                            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                            transition: "background 100ms, border-color 100ms", minHeight: "4rem",
                          }}>
                          {status === "restaurant" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--amber)" }}>
                              <Icon name="restaurant" size={13} />
                              <span className="mp-small" style={{ fontWeight: 600 }}>Restaurant</span>
                            </div>
                          )}
                          {status === "skip" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--ink-faint)" }}>
                              <Icon name="skip" size={13} />
                              <span className="mp-small">Pas de repas</span>
                            </div>
                          )}
                          {status === "normal" && (
                            names.length === 0
                              ? <span className="mp-small mp-text-faint">+ Ajouter</span>
                              : <span className="mp-small" style={{ color: "var(--ink)", lineHeight: 1.4 }}>{names.join(", ")}</span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modales d'action semaine */}
            {weekActionType === "duplicate" && weekActionDate && (
              <DuplicateWeekModal
                dateStr={weekActionDate}
                mealPlans={mealPlans}
                onClose={() => { setWeekActionType(null); setWeekActionDate(null); }}
                onDuplicate={(src, target) => {
                  onDuplicateWeek(src, target);
                  setWeekActionType(null); setWeekActionDate(null);
                }}
              />
            )}

            {weekActionType === "clear" && weekActionDate && (
              <ClearWeekModal
                dateStr={weekActionDate}
                mealPlans={mealPlans}
                onClose={() => { setWeekActionType(null); setWeekActionDate(null); }}
                onClear={() => {
                  onClearWeek(weekActionDate);
                  setWeekActionType(null); setWeekActionDate(null);
                }}
              />
            )}

            {weekActionType === "apply-template" && weekActionDate && weekActionTemplate && (
              <ApplyTemplateModeModal
                template={weekActionTemplate}
                dateStr={weekActionDate}
                onClose={() => { setWeekActionType(null); setWeekActionDate(null); setWeekActionTemplate(null); }}
                onApply={(mode) => {
                  const monday = getMondayOf(new Date(weekActionDate + "T12:00:00"));
                  onApplyTemplate(weekActionTemplate, monday.toISOString().split("T")[0], mode);
                  setWeekActionType(null); setWeekActionDate(null); setWeekActionTemplate(null);
                }}
              />
            )}

            {weekEditingSlot && (
              <RecipeSelectionModal
                recipes={recipes}
                meal={weekEditingSlot.mealId ? mealPlans.find((mp) => mp.id === weekEditingSlot.mealId) : null}
                mealType={weekEditingSlot.type}
                date={weekEditingSlot.dateStr}
                recentRecipeIds={recentRecipeIds}
                onClose={() => setWeekEditingSlot(null)}
                onSave={(recipeIds) => {
                  const meal = mealPlans.find((mp) => mp.date === weekEditingSlot.dateStr && mp.type === weekEditingSlot.type);
                  if (meal) onUpdateMeal(meal.id, recipeIds, "normal");
                  else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status: "normal" });
                  setWeekEditingSlot(null);
                }}
                onSaveStatus={(status, recipeIds) => {
                  const meal = mealPlans.find((mp) => mp.date === weekEditingSlot.dateStr && mp.type === weekEditingSlot.type);
                  if (meal) onUpdateMeal(meal.id, recipeIds, status);
                  else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status });
                  setWeekEditingSlot(null);
                }}
              />
            )}
          </div>
        );
      })()}

      {/* ========== VUE MOIS (inchangée) ========== */}
      {viewMode === "month" && (
        <>
          {/* En-têtes jours */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={day} className="mp-micro" style={{
                textAlign: "center", padding: "0.3rem 0", fontWeight: 600, textTransform: "uppercase",
                color: i >= 5 ? "var(--clay)" : "var(--ink-soft)",
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grille par semaines avec DayPanel intercalé */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {calendarWeeks.map((week, weekIdx) => {
              const weekDateStrs = week.map((d) => d.toISOString().split("T")[0]);
              const selectedInWeek = selectedDate && weekDateStrs.includes(selectedDate);
              const selectedDayObj = selectedInWeek ? week[weekDateStrs.indexOf(selectedDate)] : null;

              return (
                <React.Fragment key={weekIdx}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                    {week.map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const isOtherMonth = date.getMonth() !== currentDate.getMonth();
                      const isToday = dateStr === todayStr();
                      const isSelected = selectedDate === dateStr;

                      const filledCount = MEAL_TYPES.filter((type) => {
                        const meal = getMeal(dateStr, type.id);
                        return meal && (meal.recipeIds || []).length > 0;
                      }).length;
                      const fillRatio = filledCount / MEAL_TYPES.length;

                      const cellBg = isOtherMonth ? "var(--paper-sunken)"
                        : isSelected ? "var(--clay-wash)"
                        : fillRatio === 0 ? "var(--paper-raised)"
                        : fillRatio < 0.5 ? "color-mix(in srgb, var(--clay-wash) 35%, var(--paper-raised))"
                        : fillRatio < 1 ? "color-mix(in srgb, var(--clay-wash) 65%, var(--paper-raised))"
                        : "var(--clay-wash)";

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            display: "flex", flexDirection: "column", justifyContent: "space-between",
                            minHeight: "4.2rem", padding: "0.4rem 0.45rem 0.35rem",
                            borderRadius: radius.sm, background: cellBg,
                            border: isSelected ? "1.5px solid var(--clay)"
                              : isToday ? "1.5px solid var(--clay)"
                              : fillRatio === 1 ? "1px solid var(--clay-soft)"
                              : "1px solid var(--line)",
                            opacity: isOtherMonth ? 0.4 : 1,
                            cursor: "pointer",
                            transition: "background 150ms ease, border-color 150ms ease",
                            fontFamily: "inherit",
                          }}
                        >
                          <span style={{
                            display: "block", textAlign: "right",
                            fontWeight: isToday || isSelected ? 700 : 500,
                            fontSize: "0.82rem", lineHeight: 1,
                            color: isToday || isSelected ? "var(--clay)" : "var(--ink-soft)",
                          }}>
                            {date.getDate()}
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "0.3rem", width: "100%" }}>
                            {MEAL_TYPES.map((type) => {
                              const meal = getMeal(dateStr, type.id);
                              const filled = meal && (meal.recipeIds || []).length > 0;
                              const activeColor = type.color === "amber" ? "var(--amber)"
                                : type.color === "clay" ? "var(--clay)" : "var(--sage)";
                              return (
                                <span key={type.id} style={{
                                  display: "block", width: "100%", height: "5px", borderRadius: "3px",
                                  background: filled ? activeColor : "var(--line-strong)",
                                  flexShrink: 0, opacity: filled ? 1 : 0.45,
                                  transition: "background 150ms",
                                }} />
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedInWeek && selectedDayObj && (
                    <DayPanel
                      date={selectedDayObj}
                      dateStr={selectedDate}
                      mealPlans={mealPlans}
                      recipes={recipes}
                      recentRecipeIds={recentRecipeIds}
                      weekTemplates={weekTemplates}
                      onAddMeal={onAddMeal}
                      onUpdateMeal={onUpdateMeal}
                      onClose={() => setSelectedDate(null)}
                      onDuplicateWeek={onDuplicateWeek}
                      onApplyTemplate={onApplyTemplate}
                      showBreakfast={showBreakfast}
                      familyMembers={familyMembers}
                      onSuggest={(dateStr) => suggestForDates([dateStr])}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const RecipeSelectionModal = ({ recipes, meal, mealType, date, onClose, onSave, onSaveStatus, recentRecipeIds = [] }) => {
  const [selected, setSelected] = useState(meal?.recipeIds || []);
  const [status, setStatus] = useState(meal?.status || "normal");
  const [filterCat, setFilterCat] = useState(null);
  const [search, setSearch] = useState("");
  const typeLabel = MEAL_TYPES.find((t) => t.id === mealType)?.label || mealType;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSave = () => {
    if (status !== "normal") {
      onSaveStatus(status, []);
    } else {
      onSave(selected);
    }
  };

  const matches = (r) => {
    if (filterCat && r.category !== filterCat) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const recent = recentRecipeIds.map((id) => recipes.find((r) => r.id === id)).filter(Boolean).filter(matches);
  const recentIds = new Set(recentRecipeIds);
  const others = recipes.filter((r) => !recentIds.has(r.id)).filter(matches);
  const presentCats = RECIPE_CATEGORIES.filter((c) => recipes.some((r) => r.category === c.id));

  const RecipeRow = ({ recipe }) => {
    const isSelected = selected.includes(recipe.id);
    const cat = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);
    return (
      <label style={{
        display: "flex", alignItems: "center", gap: "0.55rem",
        padding: "0.45rem 0.6rem", borderRadius: radius.sm, cursor: "pointer",
        background: isSelected ? "var(--clay-wash)" : "transparent",
        transition: "background 100ms",
        opacity: status !== "normal" ? 0.4 : 1,
        pointerEvents: status !== "normal" ? "none" : "auto",
      }}>
        <input type="checkbox" className="mp-checkbox" checked={isSelected} onChange={() => toggle(recipe.id)} />
        {cat && <CategoryIcon icon={cat.icon} size={16} color={cat.hex} />}
        <span className="mp-small" style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{recipe.name}</span>
        {cat && (
          <span className="mp-badge" style={{ background: `${cat.hex}18`, color: cat.hex, border: `1px solid ${cat.hex}30`, fontSize: "0.58rem", fontWeight: 600, flexShrink: 0 }}>
            {cat.label}
          </span>
        )}
      </label>
    );
  };

  return (
    <Modal onClose={onClose} width="420px">
      <ModalHeader title="Planifier ce repas" onClose={onClose} />
      <p className="mp-small mp-text-soft" style={{ marginBottom: "0.75rem" }}>
        {typeLabel} — {date}
      </p>

      {/* Statuts spéciaux — en haut */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.9rem", paddingBottom: "0.9rem", borderBottom: "1px solid var(--line)" }}>
        <button type="button" onClick={() => setStatus(status === "restaurant" ? "normal" : "restaurant")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
            padding: "0.55rem 0.5rem", borderRadius: radius.sm, cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.82rem", fontWeight: status === "restaurant" ? 700 : 500,
            border: `1.5px solid ${status === "restaurant" ? "var(--amber)" : "var(--line)"}`,
            background: status === "restaurant" ? "var(--amber-wash)" : "transparent",
            color: status === "restaurant" ? "var(--amber)" : "var(--ink-soft)",
            transition: "all 100ms",
          }}>
          <Icon name="restaurant" size={15} />
          Restaurant
        </button>
        <button type="button" onClick={() => setStatus(status === "skip" ? "normal" : "skip")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
            padding: "0.55rem 0.5rem", borderRadius: radius.sm, cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.82rem", fontWeight: status === "skip" ? 700 : 500,
            border: `1.5px solid ${status === "skip" ? "var(--ink-soft)" : "var(--line)"}`,
            background: status === "skip" ? "var(--paper-sunken)" : "transparent",
            color: status === "skip" ? "var(--ink)" : "var(--ink-soft)",
            transition: "all 100ms",
          }}>
          <Icon name="skip" size={15} />
          Pas de repas
        </button>
      </div>

      {/* Recherche */}
      <div style={{ position: "relative", marginBottom: "0.6rem" }}>
        <span style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)", display: "flex" }}>
          <Icon name="search" size={13} />
        </span>
        <input className="mp-input" style={{ paddingLeft: "1.8rem", fontSize: "0.85rem" }}
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
      </div>

      {/* Filtres catégories */}
      {presentCats.length > 1 && (
        <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", marginBottom: "0.75rem", paddingBottom: "2px" }}>
          <button type="button" onClick={() => setFilterCat(null)}
            style={{ flexShrink: 0, padding: "0.2rem 0.55rem", borderRadius: radius.pill, border: "1px solid var(--line)", background: !filterCat ? "var(--ink)" : "transparent", color: !filterCat ? "#fff" : "var(--ink-soft)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 500, fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Toutes
          </button>
          {presentCats.map((cat) => (
            <button key={cat.id} type="button" onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
              style={{ flexShrink: 0, padding: "0.2rem 0.55rem", borderRadius: radius.pill, border: `1px solid ${cat.hex}`, background: filterCat === cat.id ? cat.hex : "transparent", color: filterCat === cat.id ? "#fff" : cat.hex, cursor: "pointer", fontSize: "0.72rem", fontWeight: 500, fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <><CategoryIcon icon={cat.icon} size={13} /> {cat.label}</>
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: space.md }}>
        {recipes.length === 0 && <EmptyState title="Aucune recette" hint="Ajoutez d'abord des recettes." />}
        {recipes.length > 0 && recent.length === 0 && others.length === 0 && (
          <p className="mp-small mp-text-faint" style={{ padding: "0.5rem 0.6rem" }}>Aucune recette ne correspond.</p>
        )}
        {recent.length > 0 && (
          <><div className="mp-recipe-sep">Récemment utilisées</div>
          {recent.map((r) => <RecipeRow key={r.id} recipe={r} />)}</>
        )}
        {others.length > 0 && (
          <>{recent.length > 0 && <div className="mp-recipe-sep" style={{ paddingTop: "0.8rem" }}>Toutes les recettes</div>}
          {others.map((r) => <RecipeRow key={r.id} recipe={r} />)}</>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button type="button" className="mp-btn mp-btn-primary" onClick={handleSave}>
          {status === "restaurant" ? "Restaurant" : status === "skip" ? "Pas de repas" : `Valider${selected.length > 0 ? ` (${selected.length})` : ""}`}
        </button>
      </div>
    </Modal>
  );
};

// ============================================================
// RECIPES VIEW
// ============================================================

const getIngredientMeta = (ingredients, ingredientId) => {
  const ingredient = ingredients.find((i) => i.id === ingredientId);
  const category = ingredient ? ingredientCategories.find((c) => c.id === ingredient.category) : null;
  return { ingredient, category };
};

// Stepper visuel
const Stepper = ({ steps, current }) => (
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

const RecipeModal = ({ recipe, ingredients, onClose, onSave }) => {
  const isVariant = !!(recipe?.parentId);
  const [name, setName] = useState(recipe?.name || "");
  const [category, setCategory] = useState(recipe?.category || "main");
  const [portions, setPortions] = useState(recipe?.portions || 4);
  const [variantName, setVariantName] = useState(recipe?.variantName || "");
  const [description, setDescription] = useState(recipe?.description || "");
  const [showDescription, setShowDescription] = useState(!!(recipe?.description));
  const [showIngredients, setShowIngredients] = useState(!!(recipe?.ingredients?.length));
  const [showTags, setShowTags] = useState(!!(recipe?.tags?.length));
  const [recipeIngredients, setRecipeIngredients] = useState(recipe?.ingredients || []);
  const [tags, setTags] = useState(recipe?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [pickerCategory, setPickerCategory] = useState("legumes");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickedIngredient, setPickedIngredient] = useState(null);
  const [quantityValue, setQuantityValue] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");

  const filteredPickerIngredients = ingredients.filter(
    (ing) => ing.category === pickerCategory && ing.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const addIngredient = () => {
    if (!pickedIngredient || !quantityValue) return;
    const fullQuantity = quantityUnit ? `${quantityValue} ${quantityUnit}` : quantityValue;
    const entry = { ingredientId: pickedIngredient.id, ingredientName: pickedIngredient.name, quantity: fullQuantity };
    setRecipeIngredients((prev) => {
      const idx = prev.findIndex((i) => i.ingredientId === pickedIngredient.id);
      if (idx >= 0) { const c = [...prev]; c[idx] = entry; return c; }
      return [...prev, entry];
    });
    setPickedIngredient(null); setQuantityValue(""); setQuantityUnit("");
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (!val || tags.includes(val)) return;
    setTags((prev) => [...prev, val]);
    setTagInput("");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: recipe?.id || Date.now().toString(), name: name.trim(), category, portions, description: description.trim(), ingredients: recipeIngredients, tags, parentId: recipe?.parentId || null, rootId: recipe?.rootId || null, variantName: variantName.trim() || null });
  };

  // Bouton "Ajouter X" discret — utilisé pour les sections optionnelles
  const AddLink = ({ label, onClick }) => (
    <button type="button" className="mp-small"
      style={{ background: "none", border: "none", color: "var(--clay)", cursor: "pointer", padding: "0 0 0.5rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.3rem" }}
      onClick={onClick}>
      <Icon name="plus" size={12} /> {label}
    </button>
  );

  return (
    <Modal onClose={onClose} width="500px">
      <ModalHeader title={isVariant ? "Ma variante" : recipe ? "Modifier la recette" : "Nouvelle recette"} onClose={onClose} />

      {/* Bandeau variante */}
      {isVariant && (
        <div style={{ padding: "0.5rem 0.75rem", background: "var(--sage-wash)", borderRadius: radius.sm, marginBottom: "0.75rem", border: "1px solid var(--sage-soft)" }}>
          <p className="mp-small" style={{ color: "var(--sage)", fontWeight: 600 }}>Variante</p>
          <p className="mp-micro mp-text-soft">Basée sur une recette existante — modifiez librement.</p>
        </div>
      )}

      {/* Nom de la variante (si variante) */}
      {isVariant && (
        <Field label="Nom de la variante *">
          <input className="mp-input" value={variantName} onChange={(e) => setVariantName(e.target.value)}
            placeholder="Ex : Version sans lactose, Variante express..." autoFocus />
        </Field>
      )}

      {/* Nom + portions sur la même ligne */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", marginBottom: "0.9rem" }}>
        <div style={{ flex: 1 }}>
          <span className="mp-label">Nom *</span>
          <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Pâtes carbonara" autoFocus />
        </div>
        <div style={{ width: "5.5rem", flexShrink: 0 }}>
          <span className="mp-label">Portions</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <button type="button" onClick={() => setPortions((p) => Math.max(1, p - 1))}
              style={{ width: "1.8rem", height: "2rem", borderRadius: radius.sm, border: "1px solid var(--line)", background: "var(--paper-sunken)", cursor: "pointer", fontFamily: "inherit", fontSize: "1rem", color: "var(--ink-soft)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              −
            </button>
            <span className="mp-small" style={{ textAlign: "center", fontWeight: 600, minWidth: "1.25rem" }}>{portions}</span>
            <button type="button" onClick={() => setPortions((p) => Math.min(20, p + 1))}
              style={{ width: "1.8rem", height: "2rem", borderRadius: radius.sm, border: "1px solid var(--line)", background: "var(--paper-sunken)", cursor: "pointer", fontFamily: "inherit", fontSize: "1rem", color: "var(--ink-soft)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              +
            </button>
          </div>
        </div>
      </div>

      {/* Catégorie */}
      <Field label="Catégorie">
        <div className="mp-recipe-cat-list">
          {RECIPE_CATEGORIES.map((cat) => (
            <button key={cat.id} type="button"
              className={`mp-recipe-cat-pill ${category === cat.id ? "selected" : ""}`}
              onClick={() => setCategory(cat.id)}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </Field>

      {/* Description */}
      {showDescription ? (
        <Field label="Description">
          <textarea className="mp-textarea" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Temps de préparation, astuces..." style={{ minHeight: "2.5rem" }} />
        </Field>
      ) : (
        <AddLink label="Ajouter une description" onClick={() => setShowDescription(true)} />
      )}

      {/* Ingrédients */}
      {showIngredients ? (
        <div style={{ marginBottom: "0.65rem" }}>
          <span className="mp-label">Ingrédients{recipeIngredients.length > 0 && ` (${recipeIngredients.length})`}</span>

          {recipeIngredients.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.4rem" }}>
              {recipeIngredients.map((ing) => {
                const { category: cat } = getIngredientMeta(ingredients, ing.ingredientId);
                return (
                  <span key={ing.ingredientId} className="mp-small" style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.15rem 0.4rem", borderRadius: radius.pill,
                    background: "var(--paper-sunken)", border: "1px solid var(--line)",
                  }}>
                    {cat && <CategoryDot hex={cat.hex} />}
                    {ing.ingredientName} · {ing.quantity}
                    <button type="button" onClick={() => setRecipeIngredients((prev) => prev.filter((i) => i.ingredientId !== ing.ingredientId))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 0 }}>
                      <Icon name="x" size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div style={{ border: "1px solid var(--line)", borderRadius: radius.md, overflow: "hidden" }}>
            <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--line)", background: "var(--paper-raised)" }}>
              {ingredientCategories.map((cat) => (
                <button key={cat.id} type="button"
                  onClick={() => { setPickerCategory(cat.id); setPickerSearch(""); setPickedIngredient(null); }}
                  style={{
                    flexShrink: 0, padding: "0.3rem 0.55rem",
                    border: "none", borderBottom: pickerCategory === cat.id ? `2px solid ${cat.hex}` : "2px solid transparent",
                    background: "transparent", cursor: "pointer", fontFamily: "inherit",
                    fontSize: "0.68rem", fontWeight: pickerCategory === cat.id ? 700 : 400,
                    color: pickerCategory === cat.id ? cat.hex : "var(--ink-soft)", whiteSpace: "nowrap",
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "0.45rem" }}>
              <input className="mp-input" style={{ marginBottom: "0.35rem", fontSize: "0.82rem" }}
                value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="Rechercher..." />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", maxHeight: "72px", overflowY: "auto" }}>
                {filteredPickerIngredients.map((ing) => (
                  <button key={ing.id} type="button" onClick={() => setPickedIngredient(ing)}
                    style={{
                      padding: "0.18rem 0.45rem", borderRadius: radius.sm, border: "1px solid var(--line)",
                      background: pickedIngredient?.id === ing.id ? "var(--clay)" : "var(--paper-raised)",
                      color: pickedIngredient?.id === ing.id ? "#fff" : "var(--ink)",
                      cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit",
                    }}>
                    {ing.name}
                  </button>
                ))}
                {filteredPickerIngredients.length === 0 && <p className="mp-small mp-text-faint">Aucun</p>}
              </div>
              {pickedIngredient && (
                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginTop: "0.35rem", padding: "0.35rem", background: "var(--clay-wash)", borderRadius: radius.sm }}>
                  <span style={{ fontWeight: 600, color: "var(--clay)", minWidth: "55px", fontSize: "0.75rem", fontFamily: "inherit" }}>{pickedIngredient.name}</span>
                  <input className="mp-input" style={{ flex: 1, fontSize: "0.78rem" }} value={quantityValue} onChange={(e) => setQuantityValue(e.target.value)} placeholder="Qté" />
                  <select className="mp-select" style={{ width: "5.5rem", fontSize: "0.75rem" }} value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)}>
                    <option value="">unité</option>
                    {QUANTITY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={addIngredient} disabled={!quantityValue}>
                    <Icon name="plus" size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <AddLink label={`Ajouter des ingrédients${recipeIngredients.length > 0 ? ` (${recipeIngredients.length})` : ""}`} onClick={() => setShowIngredients(true)} />
      )}

      {/* Tags */}
      {showTags ? (
        <div style={{ marginBottom: "0.65rem" }}>
          <span className="mp-label">Tags</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.4rem" }}>
            {tags.map((tag) => (
              <span key={tag} className="mp-badge mp-badge-clay" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                {tag}
                <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <input className="mp-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Ex : Rapide, Végétarien..." />
            <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={addTag} disabled={!tagInput.trim()}>OK</button>
          </div>
        </div>
      ) : (
        <AddLink label={`Ajouter des tags${tags.length > 0 ? ` (${tags.length})` : ""}`} onClick={() => setShowTags(true)} />
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", paddingTop: "0.65rem", borderTop: "1px solid var(--line)", marginTop: "0.25rem" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button type="button" className="mp-btn mp-btn-primary" onClick={handleSave} disabled={!name.trim()}>
          <Icon name="check" size={14} /> {recipe ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </Modal>
  );
};


// Fiche détaillée d'une recette
const RecipeDetailModal = ({ recipe, ingredients, allRecipes = [], currentUser, userFamilies = [], activeFamily, onClose, onEdit, onCreateVariant, onShareRecipe }) => {
  const [tab, setTab] = useState("recipe"); // "recipe" | "variants"
  const cat = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);
  const isOwner = recipe.createdBy === currentUser?.id || !recipe.createdBy;

  // Toutes les variantes de cette recette (même rootId ou parentId = recipe.id)
  const rootId = recipe.rootId || recipe.id;
  const variants = allRecipes.filter((r) =>
    r.id !== recipe.id && (r.rootId === rootId || r.parentId === recipe.id)
  );

  // Grouper les ingrédients par catégorie
  const grouped = useMemo(() => {
    const map = new Map();
    recipe.ingredients.forEach((ing) => {
      const { ingredient, category } = getIngredientMeta(ingredients, ing.ingredientId);
      const key = category?.id || "autres";
      if (!map.has(key)) map.set(key, { meta: category || { id: "autres", label: "Autres", hex: colors.inkSoft }, items: [] });
      map.get(key).items.push({ ...ing, resolvedName: ingredient?.name || ing.ingredientName });
    });
    return Array.from(map.values());
  }, [recipe, ingredients]);

  // Familles avec lesquelles partager (que l'user possède la recette)
  const shareableFamilies = userFamilies.filter((f) => f.id !== activeFamily?.id);

  return (
    <Modal onClose={onClose} width="480px">
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {cat && <CategoryIcon icon={cat.icon} size={28} color={cat.hex} />}
          <div>
            <h2 className="mp-h2" style={{ marginBottom: "0.25rem" }}>{recipe.name}</h2>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
              {cat && <span className="mp-badge" style={{ background: `${cat.hex}18`, color: cat.hex, border: `1px solid ${cat.hex}30` }}>{cat.label}</span>}
              {recipe.variantName && <span className="mp-badge mp-badge-neutral" style={{ fontStyle: "italic" }}>{recipe.variantName}</span>}
              {recipe.parentId && <span className="mp-micro mp-text-faint">Variante</span>}
            </div>
          </div>
        </div>
        <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Onglets — Recette / Variantes */}
      {(variants.length > 0 || recipe.scope !== "global") && (
        <div style={{ display: "flex", gap: "0.3rem", marginBottom: space.md, borderBottom: "1px solid var(--line)", paddingBottom: "0.6rem" }}>
          <button type="button" onClick={() => setTab("recipe")}
            style={{ padding: "0.3rem 0.65rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: tab === "recipe" ? 700 : 400, color: tab === "recipe" ? "var(--clay)" : "var(--ink-soft)", borderBottom: tab === "recipe" ? "2px solid var(--clay)" : "2px solid transparent", marginBottom: "-0.6rem" }}>
            Recette
          </button>
          <button type="button" onClick={() => setTab("variants")}
            style={{ padding: "0.3rem 0.65rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: tab === "variants" ? 700 : 400, color: tab === "variants" ? "var(--clay)" : "var(--ink-soft)", borderBottom: tab === "variants" ? "2px solid var(--clay)" : "2px solid transparent", marginBottom: "-0.6rem" }}>
            Variantes {variants.length > 0 && `(${variants.length})`}
          </button>
          {shareableFamilies.length > 0 && isOwner && (
            <button type="button" onClick={() => setTab("share")}
              style={{ padding: "0.3rem 0.65rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: tab === "share" ? 700 : 400, color: tab === "share" ? "var(--clay)" : "var(--ink-soft)", borderBottom: tab === "share" ? "2px solid var(--clay)" : "2px solid transparent", marginBottom: "-0.6rem" }}>
              Partager
            </button>
          )}
        </div>
      )}

      {/* ── Onglet Recette ── */}
      {tab === "recipe" && (
        <>
          {recipe.description && (
            <p className="mp-body mp-text-soft" style={{ marginBottom: space.lg, lineHeight: 1.6 }}>{recipe.description}</p>
          )}

          {recipe.portions && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: space.md, padding: "0.3rem 0.7rem", borderRadius: radius.pill, background: "var(--paper-sunken)", border: "1px solid var(--line)" }}>
              <Icon name="users" size={14} />
              <span className="mp-small" style={{ fontWeight: 500 }}>{recipe.portions} portion{recipe.portions > 1 ? "s" : ""}</span>
            </div>
          )}

          {recipe.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: space.md }}>
              {recipe.tags.map((tag) => <span key={tag} className="mp-badge mp-badge-neutral">{tag}</span>)}
            </div>
          )}

          {recipe.ingredients.length > 0 ? (
            <div>
              <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Ingrédients ({recipe.ingredients.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {grouped.map(({ meta, items }) => (
                  <div key={meta.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                      <CategoryDot hex={meta.hex} />
                      <span className="mp-micro mp-text-soft" style={{ fontWeight: 600, textTransform: "uppercase" }}>{meta.label}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1rem" }}>
                      {items.map((ing, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span className="mp-small">{ing.resolvedName}</span>
                          <span className="mp-small mp-text-faint">{ing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mp-small mp-text-faint">Aucun ingrédient renseigné.</p>
          )}
        </>
      )}

      {/* ── Onglet Variantes ── */}
      {tab === "variants" && (
        <div>
          {variants.length === 0 ? (
            <div style={{ padding: "1rem 0", textAlign: "center" }}>
              <p className="mp-small mp-text-faint" style={{ marginBottom: "0.75rem" }}>Aucune variante pour l'instant.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: space.md }}>
              {variants.map((v) => {
                const vCat = RECIPE_CATEGORIES.find((c) => c.id === v.category);
                return (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.7rem", borderRadius: radius.sm, background: "var(--paper-sunken)", border: "1px solid var(--line)" }}>
                    {vCat && <CategoryIcon icon={vCat.icon} size={16} color={vCat.hex} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="mp-small" style={{ fontWeight: 600 }}>{v.variantName || v.name}</p>
                      <p className="mp-micro mp-text-faint">{v.name}</p>
                    </div>
                    <span className="mp-badge mp-badge-neutral" style={{ fontSize: "0.6rem" }}>
                      {v.ingredients.length} ingr.
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {/* Créer une variante */}
          <button type="button" className="mp-btn mp-btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => { onCreateVariant(recipe); onClose(); }}>
            <Icon name="plus" size={14} /> Créer ma variante
          </button>
        </div>
      )}

      {/* ── Onglet Partager ── */}
      {tab === "share" && (
        <div>
          <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
            Partager cette recette dans vos autres familles.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {shareableFamilies.map((f) => {
              const shared = (recipe.sharedWith || []).includes(f.id);
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.7rem", borderRadius: radius.sm, background: shared ? "var(--sage-wash)" : "var(--paper-sunken)", border: `1px solid ${shared ? "var(--sage)" : "var(--line)"}` }}>
                  <div>
                    <p className="mp-small" style={{ fontWeight: 600 }}>{f.name}</p>
                    <p className="mp-micro mp-text-faint">{f.members.length} membre{f.members.length > 1 ? "s" : ""}</p>
                  </div>
                  <button type="button"
                    className={`mp-btn mp-btn-sm ${shared ? "mp-btn-secondary" : "mp-btn-primary"}`}
                    onClick={() => onShareRecipe(recipe.id, f.id)}>
                    {shared ? "Retirer" : "Partager"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions bas de modale */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: space.xl, paddingTop: space.lg, borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Fermer</button>
        {isOwner && tab === "recipe" && (
          <button type="button" className="mp-btn mp-btn-primary" onClick={onEdit}>
            <Icon name="edit" size={14} /> Modifier
          </button>
        )}
      </div>
    </Modal>
  );
};

const RecipesView = ({ recipes, allRecipes = [], globalRecipes = [], ingredients, currentUser, userFamilies = [], activeFamily, onAddRecipe, onEditRecipe, onDeleteRecipe, onImportRecipe, onCreateVariant, onShareRecipe, activeFamilyId }) => {
  const [recipeTab, setRecipeTab] = useState("family"); // "family" | "global"
  const [modalRecipe, setModalRecipe] = useState(undefined); // undefined=fermé, null=création, obj=édition
  const [detailRecipe, setDetailRecipe] = useState(null);    // recette affichée en fiche
  const [filterCategory, setFilterCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("mealPlanner_recipesView") || "grid"; } catch { return "grid"; }
  });

  const toggleView = () => {
    const next = viewMode === "grid" ? "compact" : "grid";
    setViewMode(next);
    try { localStorage.setItem("mealPlanner_recipesView", next); } catch {}
  };

  const handleSave = (recipeData) => {
    // Une variante pré-remplie a un id généré mais n'existe pas encore en base
    const existsInBase = modalRecipe && recipes.some((r) => r.id === recipeData.id);
    if (existsInBase) onEditRecipe(recipeData);
    else onAddRecipe(recipeData);
    setModalRecipe(undefined);
  };

  // Recettes à afficher selon l'onglet
  const displayRecipes = recipeTab === "family"
    ? recipes.filter((r) => {
        if (r.scope === "global") return false;
        if (r.createdBy === currentUser?.id) return true;
        if (activeFamilyId && (r.sharedWith || []).includes(activeFamilyId)) return true;
        if (r.familyId === activeFamilyId || r.scope === "family") return true;
        return false;
      })
    : initialRecipes;

  const familyRecipeIds = new Set(
    recipes.filter((r) => r.createdBy === currentUser?.id || (r.sharedWith || []).includes(activeFamilyId) || r.familyId === activeFamilyId)
      .map((r) => r.name.toLowerCase())
  );

  const filtered = displayRecipes.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Recettes</h1>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-icon" onClick={toggleView}
            title={viewMode === "grid" ? "Vue compacte" : "Vue grille"} aria-label="Changer la vue">
            {viewMode === "grid"
              ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            }
          </button>
          {recipeTab === "family" && (
            <button type="button" className="mp-btn mp-btn-primary" onClick={() => setModalRecipe(null)}>
              <Icon name="plus" size={15} /> Nouvelle recette
            </button>
          )}
        </div>
      </div>

      {/* Onglets Base globale / Nos recettes */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
        <button type="button" onClick={() => setRecipeTab("family")}
          className={`mp-btn mp-btn-sm ${recipeTab === "family" ? "mp-btn-primary" : "mp-btn-secondary"}`}>
          Nos recettes ({displayRecipes.length})
        </button>
        <button type="button" onClick={() => setRecipeTab("global")}
          className={`mp-btn mp-btn-sm ${recipeTab === "global" ? "mp-btn-primary" : "mp-btn-secondary"}`}>
          Base commune ({initialRecipes.length})
        </button>
      </div>

      {recipeTab === "global" && (
        <div className="mp-card" style={{ marginBottom: "1rem", background: "var(--sage-wash)", border: "1px solid var(--sage-soft)" }}>
          <p className="mp-small" style={{ color: "var(--sage)" }}>
            <strong>Base commune</strong> — recettes partagées par tous. Cliquez sur <strong>+ Ajouter</strong> pour les copier dans vos recettes familiales.
          </p>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <span style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)", display: "flex" }}>
          <Icon name="search" size={14} />
        </span>
        <input className="mp-input" style={{ paddingLeft: "2rem" }} value={search}
          onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une recette..." />
      </div>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <button type="button" onClick={() => setFilterCategory(null)} className="mp-small"
          style={{ padding: "0.3rem 0.65rem", borderRadius: radius.pill, cursor: "pointer", fontWeight: 500, border: "1px solid var(--line)", background: !filterCategory ? "var(--ink)" : "transparent", color: !filterCategory ? "#fff" : "var(--ink-soft)" }}>
          Toutes
        </button>
        {RECIPE_CATEGORIES.map((cat) => {
          const count = displayRecipes.filter((r) => r.category === cat.id).length;
          if (count === 0) return null;
          return (
            <button key={cat.id} type="button" onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)} className="mp-small"
              style={{ padding: "0.3rem 0.65rem", borderRadius: radius.pill, cursor: "pointer", fontWeight: 500, border: `1px solid ${cat.hex}`, background: filterCategory === cat.id ? cat.hex : "transparent", color: filterCategory === cat.id ? "#fff" : cat.hex, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <><CategoryIcon icon={cat.icon} size={13} color={filterCategory === cat.id ? "#fff" : cat.hex} /> {cat.label} <span style={{ opacity: 0.7 }}>·{count}</span></>
            </button>
          );
        })}
      </div>

      {/* Vue grille */}
      {viewMode === "grid" && (
        <div className="mp-grid-cards">
          {filtered.map((recipe) => {
            const cat = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);
            return (
              <div key={recipe.id} className="mp-card mp-recipe-card"
                onClick={() => setDetailRecipe(recipe)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setDetailRecipe(recipe)}>
                <div className="mp-recipe-card-actions" onClick={(e) => e.stopPropagation()}>
                  {recipeTab === "global" ? (
                    <button type="button" className="mp-btn mp-btn-sm"
                      style={{ background: familyRecipeIds.has(recipe.name.toLowerCase()) ? "var(--sage)" : "var(--clay)", color:"#fff", border:"none", fontSize:"0.72rem" }}
                      onClick={() => !familyRecipeIds.has(recipe.name.toLowerCase()) && onImportRecipe && onImportRecipe(recipe)}
                      disabled={familyRecipeIds.has(recipe.name.toLowerCase())}>
                      {familyRecipeIds.has(recipe.name.toLowerCase()) ? "✓ Ajoutée" : "+ Ajouter"}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" style={{ background: "var(--paper-raised)" }}
                        onClick={() => setModalRecipe(recipe)} aria-label="Modifier"><Icon name="edit" size={13} /></button>
                      <button type="button" className="mp-btn mp-btn-danger mp-btn-icon" style={{ background: "var(--paper-raised)" }}
                        onClick={() => onDeleteRecipe(recipe.id)} aria-label="Supprimer"><Icon name="trash" size={13} /></button>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {cat && <CategoryIcon icon={cat.icon} size={20} color={cat.hex} />}
                  <div style={{ minWidth: 0, paddingRight: "3.5rem" }}>
                    <h3 className="mp-h3" style={{ margin: 0 }}>{recipe.variantName || recipe.name}</h3>
                    {recipe.variantName && <p className="mp-micro mp-text-faint" style={{ marginTop: "0.1rem" }}>{recipe.name}</p>}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center" }}>
                  {recipe.parentId && <span className="mp-badge mp-badge-sage" style={{ fontSize: "0.58rem" }}>Variante</span>}
                  {cat && <span className="mp-badge" style={{ background: `${cat.hex}18`, color: cat.hex, border: `1px solid ${cat.hex}30`, fontSize: "0.62rem", fontWeight: 600 }}>{cat.label}</span>}
                  {recipe.tags.slice(0, 3).map((tag) => <span key={tag} className="mp-badge mp-badge-clay">{tag}</span>)}
                  {recipe.tags.length > 3 && <span className="mp-badge mp-badge-neutral">+{recipe.tags.length - 3}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState title={search || filterCategory ? "Aucune recette trouvée" : "Aucune recette ajoutée"}
                hint={search || filterCategory ? "Essayez d'autres filtres" : "Cliquez sur « Nouvelle recette » pour commencer"} />
            </div>
          )}
        </div>
      )}

      {/* Vue compacte */}
      {viewMode === "compact" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((recipe) => {
            const cat = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);
            return (
              <div key={recipe.id} onClick={() => setDetailRecipe(recipe)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.4rem", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-sunken)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: "1.1rem", lineHeight: 1, flexShrink: 0, width: "1.4rem", textAlign: "center" }}>{cat ? <CategoryIcon icon={cat.icon} size={16} color={cat.hex} /> : <Icon name="cat-other" size={16} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="mp-small" style={{ fontWeight: 600 }}>{recipe.variantName || recipe.name}</span>
                  {recipe.variantName && <span className="mp-micro mp-text-faint" style={{ marginLeft: "0.4rem" }}>{recipe.name}</span>}
                </div>
                <div style={{ display: "flex", gap: "0.2rem", alignItems: "center", flexShrink: 0 }}>
                  {recipe.parentId && <span className="mp-badge mp-badge-sage" style={{ fontSize: "0.58rem" }}>Variante</span>}
                  {cat && (
                    <span className="mp-badge" style={{ background: `${cat.hex}18`, color: cat.hex, border: `1px solid ${cat.hex}30`, fontSize: "0.6rem", fontWeight: 600 }}>
                      {cat.label}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.1rem", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={() => setModalRecipe(recipe)} aria-label="Modifier"><Icon name="edit" size={13} /></button>
                  <button type="button" className="mp-btn mp-btn-danger mp-btn-icon" onClick={() => onDeleteRecipe(recipe.id)} aria-label="Supprimer"><Icon name="trash" size={13} /></button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <EmptyState title={search || filterCategory ? "Aucune recette trouvée" : "Aucune recette ajoutée"}
              hint={search || filterCategory ? "Essayez d'autres filtres" : "Cliquez sur « Nouvelle recette » pour commencer"} />
          )}
        </div>
      )}

            {/* Fiche de consultation */}
      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          ingredients={ingredients}
          allRecipes={allRecipes}
          currentUser={currentUser}
          userFamilies={userFamilies}
          activeFamily={activeFamily}
          onClose={() => setDetailRecipe(null)}
          onEdit={() => { setModalRecipe(detailRecipe); setDetailRecipe(null); }}
          onCreateVariant={(recipe) => {
            const variant = onCreateVariant(recipe);
            setDetailRecipe(null);
            setModalRecipe(variant);
          }}
          onShareRecipe={onShareRecipe}
        />
      )}

      {/* Modale de création/édition */}
      {modalRecipe !== undefined && (
        <RecipeModal recipe={modalRecipe} ingredients={ingredients} onClose={() => setModalRecipe(undefined)} onSave={handleSave} />
      )}
    </div>
  );
};

// ============================================================
// SHOPPING LIST VIEW
// ============================================================

// Déduit la catégorie d'un article de la liste de courses
// en cherchant son nom dans la base d'ingrédients (insensible à la casse).
const guessItemCategory = (itemName, ingredients) => {
  const normalized = itemName.toLowerCase();
  const match = ingredients.find((ing) => ing.name.toLowerCase() === normalized);
  return match ? match.category : "autres";
};

// Enrichit chaque article avec sa catégorie déduite, puis regroupe par catégorie.
// Retourne un tableau ordonné : d'abord les catégories ayant des articles,
// dans l'ordre de ingredientCategories, "autres" toujours en dernier.
const groupByCategory = (items, ingredients) => {
  const withCat = items.map((item) => ({
    ...item,
    _category: guessItemCategory(item.name, ingredients),
  }));

  const groups = new Map();
  for (const cat of ingredientCategories) {
    const catItems = withCat.filter((i) => i._category === cat.id);
    if (catItems.length > 0) groups.set(cat.id, { meta: cat, items: catItems });
  }
  // Articles non reconnus
  const unknown = withCat.filter((i) => !ingredientCategories.some((c) => c.id === i._category));
  if (unknown.length > 0) {
    const autreCat = ingredientCategories.find((c) => c.id === "autres");
    const existing = groups.get("autres");
    groups.set("autres", { meta: autreCat, items: [...(existing?.items || []), ...unknown] });
  }
  return Array.from(groups.values());
};

const ShoppingItemRow = ({ item, onToggle, onDelete }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    padding: "0.3rem 0.2rem",
    borderBottom: "1px solid var(--line)",
  }}>
    <input type="checkbox" className="mp-checkbox" checked={item.completed} onChange={() => onToggle(item.id)} style={{ flexShrink: 0 }} />
    <span className="mp-small" style={{
      flex: 1,
      textDecoration: item.completed ? "line-through" : "none",
      color: item.completed ? "var(--ink-faint)" : "var(--ink)",
    }}>
      {item.name}
    </span>
    {item.quantity && (
      <span className="mp-micro mp-text-faint" style={{ flexShrink: 0 }}>{item.quantity}</span>
    )}
    <button
      type="button"
      onClick={() => onDelete(item.id)}
      aria-label="Supprimer"
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: "0.1rem", flexShrink: 0 }}
    >
      <Icon name="x" size={13} />
    </button>
  </div>
);

const CategorySection = ({ meta, items, onToggle, onDelete }) => (
  <div style={{ marginBottom: "0.9rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
      <CategoryDot hex={meta.hex} />
      <span className="mp-micro" style={{ textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)", letterSpacing: "0.05em" }}>
        {meta.label}
      </span>
      <span className="mp-micro mp-text-faint">({items.length})</span>
    </div>
    <div>
      {items.map((item) => (
        <ShoppingItemRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  </div>
);

// Barre de sélection de plage de dates — intégrée dans le header, sans modale
const DateRangeBar = ({ dateFrom, dateTo, onChangeDateFrom, onChangeDateTo }) => {
  const today = todayStr();
  const setRange = (days) => {
    const end = new Date(today + "T12:00:00");
    end.setDate(end.getDate() + days - 1);
    onChangeDateFrom(today);
    onChangeDateTo(end.toISOString().split("T")[0]);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
      <input
        className="mp-input"
        type="date"
        value={dateFrom}
        onChange={(e) => onChangeDateFrom(e.target.value)}
        style={{ width: "9rem" }}
      />
      <span className="mp-small mp-text-faint">→</span>
      <input
        className="mp-input"
        type="date"
        value={dateTo}
        onChange={(e) => onChangeDateTo(e.target.value)}
        style={{ width: "9rem" }}
      />
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {[["7j", 7], ["14j", 14], ["30j", 30]].map(([label, days]) => (
          <button
            key={label}
            type="button"
            className="mp-btn mp-btn-secondary mp-btn-sm"
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.72rem" }}
            onClick={() => setRange(days)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ShoppingListView = ({ shoppingList, ingredients, onAddItem, onToggleItem, onDeleteItem, onGenerate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const today = todayStr();
  const defaultEnd = new Date(today + "T12:00:00");
  defaultEnd.setDate(defaultEnd.getDate() + 6);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(defaultEnd.toISOString().split("T")[0]);

  const active = shoppingList.filter((i) => !i.completed);
  const completed = shoppingList.filter((i) => i.completed);
  const activeGroups = useMemo(() => groupByCategory(active, ingredients), [active, ingredients]);

  return (
    <div>
      {/* Header compact sur 2 lignes */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <h1 className="mp-h1">
            Courses
            {active.length > 0 && (
              <span className="mp-small mp-text-soft" style={{ marginLeft: "0.5rem", fontFamily: "inherit", fontWeight: 400 }}>
                {active.length} article{active.length > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => setShowAddModal(true)}>
              <Icon name="plus" size={13} /> Ajouter
            </button>
            {shoppingList.length > 0 && (
              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowExportModal(true)}>
                <Icon name="download" size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Barre de plage + bouton générer */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <DateRangeBar
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeDateFrom={setDateFrom}
            onChangeDateTo={setDateTo}
          />
          <button
            type="button"
            className="mp-btn mp-btn-secondary mp-btn-sm"
            onClick={() => onGenerate(dateFrom, dateTo)}
          >
            <Icon name="calendar" size={13} /> Générer
          </button>
        </div>
      </div>

      {/* Deux colonnes compactes */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 260px" }}>
          <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            À acheter ({active.length})
          </p>
          {active.length === 0
            ? <EmptyState title="Liste vide" hint="Générez depuis le planning ou ajoutez manuellement" />
            : activeGroups.map(({ meta, items }) => (
              <CategorySection key={meta.id} meta={meta} items={items} onToggle={onToggleItem} onDelete={onDeleteItem} />
            ))
          }
        </div>

        {completed.length > 0 && (
          <div style={{ flex: "1 1 220px" }}>
            <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Achetés ({completed.length})
            </p>
            {completed.map((item) => (
              <ShoppingItemRow key={item.id} item={item} onToggle={onToggleItem} onDelete={onDeleteItem} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddShoppingItemModal
          onClose={() => setShowAddModal(false)}
          onSave={(item) => { onAddItem(item); setShowAddModal(false); }}
        />
      )}
      {showExportModal && (
        <ExportListModal
          shoppingList={shoppingList}
          ingredients={ingredients}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

const AddShoppingItemModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ id: Date.now().toString(), name: name.trim(), quantity: quantity.trim(), completed: false });
  };
  return (
    <Modal onClose={onClose} width="360px">
      <ModalHeader title="Ajouter un article" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <Field label="Article *">
          <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Tomates" required autoFocus />
        </Field>
        <Field label="Quantité">
          <input className="mp-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex : 500g" />
        </Field>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
          <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="mp-btn mp-btn-primary">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

const ExportListModal = ({ shoppingList, ingredients, onClose }) => {
  const [copied, setCopied] = useState(false);

  const exportText = useMemo(() => {
    const active = shoppingList.filter((i) => !i.completed);
    const completed = shoppingList.filter((i) => i.completed);

    const lines = ["Liste de courses", "═".repeat(20), ""];

    // Grouper les actifs par catégorie
    const groups = groupByCategory(active, ingredients);
    groups.forEach(({ meta, items }) => {
      lines.push(`▸ ${meta.label.toUpperCase()}`);
      items.forEach((item) => lines.push(`  [ ] ${item.name}${item.quantity ? ` — ${item.quantity}` : ""}`));
      lines.push("");
    });

    if (completed.length > 0) {
      lines.push("─".repeat(20), "Déjà achetés", "");
      completed.forEach((item) => lines.push(`  [x] ${item.name}${item.quantity ? ` — ${item.quantity}` : ""}`));
    }
    return lines.join("\n");
  }, [shoppingList, ingredients]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(exportText); } catch { /* presse-papier indisponible */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal onClose={onClose} width="420px">
      <ModalHeader title="Exporter la liste" onClose={onClose} />
      <textarea className="mp-textarea" style={{ minHeight: "260px", fontFamily: "monospace", fontSize: "0.8rem" }} value={exportText} readOnly />
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Fermer</button>
        <button type="button" className="mp-btn mp-btn-primary" onClick={handleCopy}>
          <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copié !" : "Copier le texte"}
        </button>
      </div>
    </Modal>
  );
};


// ============================================================
// WEEK TEMPLATES
// ============================================================

// Calcule le lundi de la semaine contenant `date`
// Retourne le lundi de la semaine ISO contenant `date` (lun=1er jour, dim=7e jour).
// Ancrage via le mardi (immunisé contre tout décalage timezone) puis -1 jour.
// Dimanche (dow=0) est le 7e jour → son mardi ISO = dimanche - 5 jours.
const getMondayOf = (date) => {
  const d = new Date(date);
  const dow = d.getDay(); // 0=dim … 6=sam
  // offset pour aller au mardi ISO de la même semaine
  // lun=1→+1, mar=2→0, mer=3→-1, jeu=4→-2, ven=5→-3, sam=6→-4, dim=0→-5
  const offsetToTuesday = dow === 0 ? -5 : 2 - dow;
  d.setDate(d.getDate() + offsetToTuesday - 1); // mardi puis -1 = lundi
  d.setHours(12, 0, 0, 0);
  return d;
};

const dateOfSlot = (monday, dayIndex) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

// Mini grille 7j × 3 repas pour afficher/éditer un template
const TemplateGrid = ({ slots, recipes, onCellClick, readOnly }) => (
  <div style={{ overflowX: "auto" }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: `5.5rem repeat(7, 1fr)`,
      gap: "2px",
      minWidth: "560px",
    }}>
      {/* En-têtes jours */}
      <div />
      {DAYS_OF_WEEK.map((d, i) => (
        <div key={d} className="mp-micro" style={{
          textAlign: "center",
          padding: "0.25rem 0",
          fontWeight: 600,
          textTransform: "uppercase",
          color: i >= 5 ? "var(--clay)" : "var(--ink-soft)",
        }}>
          {d}
        </div>
      ))}

      {/* Lignes repas */}
      {MEAL_TYPES.map((type) => (
        <React.Fragment key={type.id}>
          {/* Label repas */}
          <div className="mp-micro mp-text-soft" style={{
            display: "flex",
            alignItems: "center",
            paddingRight: "0.5rem",
            fontWeight: 600,
            textTransform: "uppercase",
          }}>
            {type.label}
          </div>

          {/* Cellules */}
          {DAYS_OF_WEEK.map((_, dayIdx) => {
            const slotRecipeIds = slots
              .filter((s) => s.day === dayIdx && s.type === type.id)
              .flatMap((s) => s.recipeIds);
            const names = slotRecipeIds
              .map((id) => recipes.find((r) => r.id === id)?.name)
              .filter(Boolean);
            const filled = names.length > 0;
            const label = filled
              ? (names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`)
              : null;

            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => !readOnly && onCellClick && onCellClick(dayIdx, type.id, slotRecipeIds)}
                style={{
                  padding: "0.25rem 0.3rem",
                  borderRadius: radius.sm,
                  border: filled
                    ? `1px solid ${type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)"}`
                    : "1px dashed var(--line)",
                  background: filled
                    ? (type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)")
                    : "transparent",
                  cursor: readOnly ? "default" : "pointer",
                  fontSize: "0.6rem",
                  lineHeight: 1.3,
                  color: filled
                    ? (type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)")
                    : "var(--ink-faint)",
                  textAlign: "center",
                  fontFamily: "inherit",
                  fontWeight: 500,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  minHeight: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {label || (readOnly ? "—" : "+")}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// Éditeur d'un template (nom + grille éditable)
const WeekTemplateEditor = ({ template, recipes, recentRecipeIds, activeFamily, onSave, onCancel }) => {
  const [name, setName] = useState(template?.name || "Nouvelle semaine type");
  const [scope, setScope] = useState(template?.scope || "family");
  const [slots, setSlots] = useState(template?.slots || []);
  const [editingCell, setEditingCell] = useState(null); // { day, type, recipeIds }

  const handleCellClick = (day, type, currentIds) => {
    setEditingCell({ day, type, recipeIds: currentIds });
  };

  const handleCellSave = (recipeIds) => {
    if (!editingCell) return;
    setSlots((prev) => {
      // Retirer les slots existants pour ce créneau, puis ajouter le nouveau
      const filtered = prev.filter((s) => !(s.day === editingCell.day && s.type === editingCell.type));
      if (recipeIds.length > 0) {
        return [...filtered, { day: editingCell.day, type: editingCell.type, recipeIds }];
      }
      return filtered;
    });
    setEditingCell(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: template?.id || Date.now().toString(),
      name: name.trim(),
      scope,
      familyId: scope === "family" ? activeFamily?.id : undefined,
      slots,
    });
  };

  return (
    <div className="mp-card" style={{ background: "var(--paper-sunken)" }}>
      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: space.md, alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px" }}>
          <span className="mp-label">Nom du modèle</span>
          <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Semaine classique" />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <span className="mp-label">Visibilité</span>
          <select className="mp-select" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="family">Famille ({activeFamily?.name})</option>
            <option value="user">Personnel (moi uniquement)</option>
          </select>
        </div>
      </div>

      <TemplateGrid
        slots={slots}
        recipes={recipes}
        onCellClick={handleCellClick}
      />

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.md }}>
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={onCancel}>Annuler</button>
        <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={handleSubmit} disabled={!name.trim()}>
          Enregistrer
        </button>
      </div>

      {editingCell && (
        <RecipeSelectionModal
          recipes={recipes}
          meal={{ recipeIds: editingCell.recipeIds }}
          mealType={editingCell.type}
          date={`${DAYS_OF_WEEK[editingCell.day]}`}
          recentRecipeIds={recentRecipeIds}
          onClose={() => setEditingCell(null)}
          onSave={handleCellSave}
        />
      )}
    </div>
  );
};

// Modale pour appliquer un template à une semaine donnée
const ApplyTemplateModal = ({ template, recipes, mealPlans, onClose, onApply }) => {
  const monday = getMondayOf(new Date());
  const [weekStart, setWeekStart] = useState(monday.toISOString().split("T")[0]);
  const [mode, setMode] = useState("merge"); // "merge" | "overwrite"

  const preview = useMemo(() => {
    const mon = getMondayOf(new Date(weekStart + "T12:00:00"));
    return template.slots.map((slot) => {
      const date = dateOfSlot(mon, slot.day);
      const names = slot.recipeIds.map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean);
      const type = MEAL_TYPES.find((t) => t.id === slot.type);
      return { date, type, names, day: DAYS_OF_WEEK[slot.day] };
    });
  }, [template, weekStart, recipes]);

  const conflictCount = useMemo(() => {
    const mon = getMondayOf(new Date(weekStart + "T12:00:00"));
    return template.slots.filter((slot) => {
      const date = dateOfSlot(mon, slot.day);
      return mealPlans.some((mp) => mp.date === date && mp.type === slot.type && (mp.recipeIds || []).length > 0);
    }).length;
  }, [template, weekStart, mealPlans]);

  return (
    <Modal onClose={onClose} width="480px">
      <ModalHeader title={`Appliquer « ${template.name} »`} onClose={onClose} />

      <Field label="Semaine cible (lundi)">
        <input
          className="mp-input"
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
      </Field>

      {conflictCount > 0 && (
        <div style={{ marginBottom: space.md }}>
          <span className="mp-label">En cas de conflit ({conflictCount} créneau{conflictCount > 1 ? "x" : ""} déjà planifié{conflictCount > 1 ? "s" : ""})</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={`mp-btn mp-btn-sm ${mode === "merge" ? "mp-btn-primary" : "mp-btn-secondary"}`}
              onClick={() => setMode("merge")}
            >
              Conserver l'existant
            </button>
            <button
              type="button"
              className={`mp-btn mp-btn-sm ${mode === "overwrite" ? "mp-btn-primary" : "mp-btn-secondary"}`}
              onClick={() => setMode("overwrite")}
            >
              Écraser
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: space.lg }}>
        <span className="mp-label">Aperçu ({preview.length} créneau{preview.length > 1 ? "x" : ""})</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: "200px", overflowY: "auto" }}>
          {preview.length === 0
            ? <p className="mp-small mp-text-faint">Ce template ne contient aucun repas.</p>
            : preview.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className={`mp-badge mp-badge-${p.type?.color || "neutral"}`}>{p.day}</span>
                <span className="mp-small mp-text-soft">{p.type?.label}</span>
                <span className="mp-small" style={{ flex: 1 }}>{p.names.join(", ") || <em>—</em>}</span>
                <span className="mp-micro mp-text-faint">{p.date}</span>
              </div>
            ))
          }
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="mp-btn mp-btn-primary"
          disabled={preview.length === 0}
          onClick={() => { onApply(weekStart, mode); onClose(); }}
        >
          Appliquer
        </button>
      </div>
    </Modal>
  );
};

// ============================================================
// PREFERENCES VIEW
// ============================================================

// Résout une allergie { type, id } en { label, hex }
const resolveAllergy = (allergy, ingredients) => {
  if (allergy.type === "category") {
    const cat = ingredientCategories.find((c) => c.id === allergy.id);
    return cat ? { label: cat.label, hex: cat.hex, icon: "cat-other" } : null;
  }
  const ing = ingredients.find((i) => i.id === allergy.id);
  if (!ing) return null;
  const cat = ingredientCategories.find((c) => c.id === ing.category);
  return { label: ing.name, hex: cat?.hex || colors.berry, icon: "cat-starter" };
};

// Badge générique allergie/dislike
const IngredientRestrictionBadge = ({ item, ingredients, mode = "allergy", onRemove }) => {
  const resolved = resolveAllergy(item, ingredients);
  if (!resolved) return null;
  const hex = mode === "allergy" ? resolved.hex : colors.inkSoft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.5rem", borderRadius: radius.pill,
      background: `${hex}18`, border: `1px solid ${hex}40`,
      fontSize: "0.75rem", fontWeight: 500, color: hex,
    }}>
      {item.type === "category" && <span className="mp-micro" style={{ opacity: 0.7 }}>cat.</span>}
      {resolved.label}
      {onRemove && (
        <button type="button" onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
          <Icon name="x" size={11} />
        </button>
      )}
    </span>
  );
};
// Alias pour compatibilité — mappe allergy → item
const AllergyBadge = ({ allergy, ingredients, onRemove }) =>
  <IngredientRestrictionBadge item={allergy} ingredients={ingredients} mode="allergy" onRemove={onRemove} />;

// Picker générique allergie / aliment non apprécié
const IngredientRestrictionPicker = ({ current, ingredients, mode = "allergy", onClose, onSave }) => {
  const titles = {
    allergy: { title: "Allergies & intolérances", hint: "Sélectionnez des catégories entières ou des ingrédients spécifiques." },
    dislike: { title: "Aliments non appréciés", hint: "Ingrédients ou familles d'aliments que vous évitez sans allergie." },
  };
  const { title, hint } = titles[mode] || titles.allergy;

  const [tab, setTab] = useState("category");
  const [selected, setSelected] = useState(current || []);
  const [pickerCategory, setPickerCategory] = useState("viande");
  const [search, setSearch] = useState("");

  const isSelected = (type, id) => selected.some((a) => a.type === type && a.id === id);
  const toggle = (type, id) => setSelected((prev) =>
    isSelected(type, id) ? prev.filter((a) => !(a.type === type && a.id === id)) : [...prev, { type, id }]
  );
  const filteredIngredients = ingredients.filter((i) =>
    i.category === pickerCategory && i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal onClose={onClose} width="440px">
      <ModalHeader title={title} onClose={onClose} />
      <p className="mp-small mp-text-soft" style={{ marginBottom: "0.75rem" }}>{hint}</p>

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem", padding: "0.5rem", background: mode === "allergy" ? "var(--berry-wash)" : "var(--paper-sunken)", borderRadius: radius.sm }}>
          {selected.map((a, i) => (
            <IngredientRestrictionBadge key={i} item={a} ingredients={ingredients} mode={mode}
              onRemove={() => toggle(a.type, a.id)} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
        {[["category", "Par catégorie"], ["ingredient", "Par ingrédient"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`mp-btn mp-btn-sm ${tab === id ? "mp-btn-primary" : "mp-btn-secondary"}`}
            style={{ flex: 1, justifyContent: "center" }}>{label}</button>
        ))}
      </div>

      {tab === "category" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "260px", overflowY: "auto" }}>
          {ingredientCategories.map((cat) => {
            const sel = isSelected("category", cat.id);
            const hex = mode === "dislike" ? colors.inkSoft : cat.hex;
            return (
              <label key={cat.id} style={{
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.55rem 0.7rem", borderRadius: radius.sm, cursor: "pointer",
                background: sel ? `${hex}12` : "transparent",
                border: `1px solid ${sel ? hex : "var(--line)"}`, transition: "all 100ms",
              }}>
                <input type="checkbox" checked={sel} onChange={() => toggle("category", cat.id)} style={{ accentColor: hex }} />
                <CategoryDot hex={cat.hex} />
                <span className="mp-small" style={{ fontWeight: sel ? 600 : 400, color: sel ? hex : "var(--ink)" }}>
                  {cat.label}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {tab === "ingredient" && (
        <div>
          <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--line)", marginBottom: "0.5rem" }}>
            {ingredientCategories.map((cat) => (
              <button key={cat.id} type="button" onClick={() => { setPickerCategory(cat.id); setSearch(""); }}
                style={{
                  flexShrink: 0, padding: "0.3rem 0.55rem", border: "none",
                  borderBottom: pickerCategory === cat.id ? `2px solid ${cat.hex}` : "2px solid transparent",
                  background: "transparent", cursor: "pointer", fontFamily: "inherit",
                  fontSize: "0.68rem", fontWeight: pickerCategory === cat.id ? 700 : 400,
                  color: pickerCategory === cat.id ? cat.hex : "var(--ink-soft)", whiteSpace: "nowrap",
                }}>
                {cat.label}
              </button>
            ))}
          </div>
          <input className="mp-input" style={{ marginBottom: "0.4rem", fontSize: "0.82rem" }}
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", maxHeight: "160px", overflowY: "auto" }}>
            {filteredIngredients.map((ing) => {
              const sel = isSelected("ingredient", ing.id);
              const cat = ingredientCategories.find((c) => c.id === ing.category);
              const hex = mode === "dislike" ? colors.inkSoft : (cat?.hex || colors.berry);
              return (
                <button key={ing.id} type="button" onClick={() => toggle("ingredient", ing.id)}
                  style={{
                    padding: "0.25rem 0.55rem", borderRadius: radius.sm,
                    border: `1px solid ${sel ? hex : "var(--line)"}`,
                    background: sel ? `${hex}18` : "var(--paper-raised)",
                    color: sel ? hex : "var(--ink)",
                    cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit", fontWeight: sel ? 600 : 400,
                  }}>
                  {ing.name}
                </button>
              );
            })}
            {filteredIngredients.length === 0 && <p className="mp-small mp-text-faint">Aucun ingrédient</p>}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
        <button type="button" className="mp-btn mp-btn-primary" onClick={() => { onSave(selected); onClose(); }}>
          Enregistrer ({selected.length})
        </button>
      </div>
    </Modal>
  );
};
// Alias
const AllergyPicker = (props) => <IngredientRestrictionPicker {...props} mode="allergy" current={props.currentAllergies} />;

const DIET_OPTIONS = [
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

const PreferencesView = ({ currentUser, ingredients, weekTemplates, recipes, recentRecipeIds,
  activeFamily, onAddIngredient, onDeleteIngredient,
  onSaveTemplate, onDeleteTemplate, onApplyTemplate, onUpdateUserProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("legumes");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("legumes");
  const [editingTemplate, setEditingTemplate] = useState(undefined);
  const [applyingTemplate, setApplyingTemplate] = useState(null);
  const [showAllergyPicker, setShowAllergyPicker] = useState(false);
  const [showDislikePicker, setShowDislikePicker] = useState(false);

  const allergies = currentUser?.allergies || [];
  const dislikes = currentUser?.dislikes || [];
  const diets = currentUser?.diets || [];
  const rules = currentUser?.rules || [];

  const toggleDiet = (id) => {
    const next = diets.includes(id) ? diets.filter((d) => d !== id) : [...diets, id];
    onUpdateUserProfile({ diets: next });
  };

  const familyTemplates = weekTemplates.filter((t) => t.scope === "family" || (!t.scope && t.familyId === activeFamily?.id));
  const userTemplates = weekTemplates.filter((t) => t.scope === "user");

  const filteredIngredients = ingredients.filter(
    (ing) => ing.category === selectedCategory && ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    if (!newName.trim()) return;
    onAddIngredient({ id: Date.now().toString(), name: newName.trim(), category: newCategory });
    setNewName(""); setShowAddForm(false);
  };

  const TemplateSection = ({ title, templates, hint }) => (
    <div style={{ marginBottom: space.xl }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md, flexWrap: "wrap", gap: "0.6rem" }}>
        <div>
          <h3 className="mp-h3">{title}</h3>
          {hint && <p className="mp-small mp-text-soft" style={{ marginTop: "0.15rem" }}>{hint}</p>}
        </div>
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm"
          onClick={() => setEditingTemplate({ scope: title.includes("famille") ? "family" : "user" })}
          disabled={editingTemplate !== undefined}>
          <Icon name="plus" size={13} /> Nouveau
        </button>
      </div>

      {editingTemplate !== undefined && ((title.includes("famille") && editingTemplate?.scope === "family") || (title.includes("personnel") && editingTemplate?.scope === "user") || (editingTemplate?.id && templates.some((t) => t.id === editingTemplate.id))) && (
        <div style={{ marginBottom: space.lg }}>
          <WeekTemplateEditor
            template={editingTemplate?.id ? editingTemplate : null}
            recipes={recipes} recentRecipeIds={recentRecipeIds} activeFamily={activeFamily}
            onSave={(tpl) => { onSaveTemplate({ ...tpl, scope: editingTemplate?.scope || tpl.scope }); setEditingTemplate(undefined); }}
            onCancel={() => setEditingTemplate(undefined)}
          />
        </div>
      )}

      {templates.length === 0 && editingTemplate === undefined && (
        <EmptyState title="Aucun modèle" hint="Créez un modèle pour planifier vos semaines rapidement." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>
        {templates.map((tpl) => {
          const filledCount = tpl.slots.length;
          return (
            <div key={tpl.id} className="mp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md, flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 className="mp-h3">{tpl.name}</h3>
                  <span className="mp-badge mp-badge-neutral" style={{ marginTop: "0.3rem" }}>{filledCount} créneau{filledCount > 1 ? "x" : ""}</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => setApplyingTemplate(tpl)}>
                    <Icon name="calendar" size={13} /> Appliquer
                  </button>
                  <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={() => setEditingTemplate(tpl)} aria-label="Modifier">
                    <Icon name="edit" size={14} />
                  </button>
                  <button type="button" className="mp-btn mp-btn-danger mp-btn-icon" onClick={() => onDeleteTemplate(tpl.id)} aria-label="Supprimer">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <TemplateGrid slots={tpl.slots} recipes={recipes} readOnly />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Préférences</h1>
      </div>

      {/* Mon profil */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <h3 className="mp-h3" style={{ marginBottom: space.md }}>Mon profil</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Identité */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="mp-small mp-text-soft">Nom</span>
              <span className="mp-small">{currentUser?.name}</span>
            </div>
            <hr className="mp-divider" />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="mp-small mp-text-soft">Email</span>
              <span className="mp-small">{currentUser?.email}</span>
            </div>
          </div>

          <hr className="mp-divider" />

          {/* Régimes alimentaires */}
          <div>
            <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Régime alimentaire</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {DIET_OPTIONS.map((diet) => {
                const active = diets.includes(diet.id);
                return (
                  <button key={diet.id} type="button" onClick={() => toggleDiet(diet.id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.3rem 0.65rem", borderRadius: radius.pill, cursor: "pointer",
                      fontFamily: "inherit", fontSize: "0.78rem", fontWeight: active ? 600 : 400,
                      border: `1.5px solid ${active ? "var(--sage)" : "var(--line)"}`,
                      background: active ? "var(--sage-wash)" : "transparent",
                      color: active ? "var(--sage)" : "var(--ink-soft)",
                      transition: "all 100ms",
                    }}>
                    <CategoryIcon icon={diet.icon} size={14} color={active ? "var(--sage)" : "var(--ink-soft)"} />
                    <span>{diet.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="mp-divider" />

          {/* Allergies */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <p className="mp-small" style={{ fontWeight: 600 }}>Allergies & intolérances</p>
              <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => setShowAllergyPicker(true)}>
                <Icon name="edit" size={13} /> Modifier
              </button>
            </div>
            {allergies.length === 0
              ? <p className="mp-small mp-text-faint">Aucune allergie renseignée</p>
              : <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {allergies.map((a, i) => <AllergyBadge key={i} allergy={a} ingredients={ingredients} />)}
                </div>
            }
          </div>

          <hr className="mp-divider" />

          {/* Aliments non appréciés */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div>
                <p className="mp-small" style={{ fontWeight: 600 }}>Aliments non appréciés</p>
                <p className="mp-micro mp-text-faint">Pas d'allergie, mais vous préférez éviter</p>
              </div>
              <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => setShowDislikePicker(true)}>
                <Icon name="edit" size={13} /> Modifier
              </button>
            </div>
            {dislikes.length === 0
              ? <p className="mp-small mp-text-faint">Aucun aliment renseigné</p>
              : <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {dislikes.map((d, i) => (
                    <IngredientRestrictionBadge key={i} item={d} ingredients={ingredients} mode="dislike" />
                  ))}
                </div>
            }
          </div>

          <hr className="mp-divider" />

          {/* Règles personnalisées — placeholder backend */}
          <div>
            <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Règles personnalisées</p>
            <div style={{
              padding: "0.75rem 0.9rem", borderRadius: radius.sm,
              background: "var(--paper-sunken)", border: "1px dashed var(--line)",
            }}>
              <p className="mp-small mp-text-faint" style={{ textAlign: "center" }}>
                Les règles personnalisées seront disponibles avec le backend.
              </p>
              <p className="mp-micro mp-text-faint" style={{ textAlign: "center", marginTop: "0.25rem" }}>
                Elles permettront la génération automatique de menus à partir des préférences et allergies de la famille.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Semaines types */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: space.xl, marginBottom: space.xl }}>
        <h2 className="mp-h2" style={{ marginBottom: space.lg }}>Semaines types</h2>
        <TemplateSection
          title={`Modèles de la famille (${activeFamily?.name || "—"})`}
          templates={familyTemplates}
          hint="Visibles par tous les membres de la famille"
        />
        <TemplateSection
          title="Modèles personnels"
          templates={userTemplates}
          hint="Visibles uniquement par vous"
        />
      </div>

      {/* Ingrédients */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: space.xl }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg, flexWrap: "wrap", gap: "0.6rem" }}>
          <h2 className="mp-h2">Ingrédients</h2>
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowAddForm((v) => !v)}>
            <Icon name="plus" size={13} /> Nouvel ingrédient
          </button>
        </div>

        {showAddForm && (
          <div className="mp-card" style={{ marginBottom: space.lg, background: "var(--paper-sunken)" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <input className="mp-input" style={{ flex: "1 1 200px" }} value={newName}
                onChange={(e) => setNewName(e.target.value)} placeholder="Nom de l'ingrédient" />
              <select className="mp-select" style={{ width: "auto" }} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {ingredientCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowAddForm(false)}>Annuler</button>
              <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={handleAddNew} disabled={!newName.trim()}>Ajouter</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: space.md }}>
          {ingredientCategories.map((cat) => (
            <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className="mp-small"
              style={{ padding: "0.3rem 0.65rem", borderRadius: radius.pill, border: `1px solid ${cat.hex}`, background: selectedCategory === cat.id ? cat.hex : "transparent", color: selectedCategory === cat.id ? "#fff" : cat.hex, cursor: "pointer", fontWeight: 500 }}>
              {cat.label}
            </button>
          ))}
        </div>

        <input className="mp-input" style={{ maxWidth: "320px", marginBottom: space.md }} value={search}
          onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un ingrédient..." />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem" }}>
          {filteredIngredients.map((ingredient) => {
            const category = ingredientCategories.find((c) => c.id === ingredient.category);
            return (
              <div key={ingredient.id} className="mp-card"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.7rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }} className="mp-small">
                  <CategoryDot hex={category.hex} />
                  {ingredient.name}
                </span>
                <button type="button" onClick={() => onDeleteIngredient(ingredient.id)} aria-label={`Supprimer ${ingredient.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex" }}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            );
          })}
          {filteredIngredients.length === 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState title="Aucun ingrédient dans cette catégorie" />
            </div>
          )}
        </div>
      </div>

      {applyingTemplate && (
        <ApplyTemplateModal template={applyingTemplate} recipes={recipes} mealPlans={[]}
          onClose={() => setApplyingTemplate(null)}
          onApply={(weekStart, mode) => { onApplyTemplate(applyingTemplate, weekStart, mode); setApplyingTemplate(null); }} />
      )}

      {showAllergyPicker && (
        <IngredientRestrictionPicker
          mode="allergy"
          current={allergies}
          ingredients={ingredients}
          onClose={() => setShowAllergyPicker(false)}
          onSave={(v) => onUpdateUserProfile({ allergies: v })}
        />
      )}

      {showDislikePicker && (
        <IngredientRestrictionPicker
          mode="dislike"
          current={dislikes}
          ingredients={ingredients}
          onClose={() => setShowDislikePicker(false)}
          onSave={(v) => onUpdateUserProfile({ dislikes: v })}
        />
      )}
    </div>
  );
};

// ============================================================
// FAMILY VIEW
// ============================================================

// ============================================================
// ACCOUNT VIEW
// ============================================================

// ============================================================
// RGPD — Politique de confidentialité
// ============================================================

const PRIVACY_CONTENT = {
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

const PrivacyModal = ({ onClose }) => (
  <Modal onClose={onClose} width="560px">
    <ModalHeader title="Politique de confidentialité" onClose={onClose} />
    <p className="mp-micro mp-text-faint" style={{ marginBottom: space.lg }}>Dernière mise à jour : {PRIVACY_CONTENT.lastUpdate}</p>
    <div style={{ maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: space.lg }}>
      {PRIVACY_CONTENT.sections.map((s) => (
        <div key={s.title}>
          <h3 className="mp-h3" style={{ marginBottom: "0.5rem", color: "var(--sage)" }}>{s.title}</h3>
          <p className="mp-small mp-text-soft" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{s.content}</p>
        </div>
      ))}
    </div>
    <div style={{ paddingTop: space.lg, borderTop: "1px solid var(--line)", marginTop: space.lg }}>
      <button type="button" className="mp-btn mp-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
        Fermer
      </button>
    </div>
  </Modal>
);

const PrivacyView = ({ onBack }) => (
  <div>
    <div className="mp-view-header">
      <h1 className="mp-h1">Confidentialité</h1>
      <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={onBack}>
        <Icon name="chevronLeft" size={13} /> Retour
      </button>
    </div>
    <p className="mp-micro mp-text-faint" style={{ marginBottom: space.xl }}>Dernière mise à jour : {PRIVACY_CONTENT.lastUpdate}</p>
    <div style={{ display: "flex", flexDirection: "column", gap: space.xl }}>
      {PRIVACY_CONTENT.sections.map((s) => (
        <div key={s.title} className="mp-card">
          <h3 className="mp-h3" style={{ marginBottom: "0.6rem", color: "var(--sage)" }}>{s.title}</h3>
          <p className="mp-small mp-text-soft" style={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>{s.content}</p>
        </div>
      ))}
    </div>
  </div>
);

// Lien réutilisable vers la politique
const PrivacyLink = ({ onClick }) => (
  <button type="button" onClick={onClick}
    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage)", textDecoration: "underline", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}>
    politique de confidentialité
  </button>
);

// ============================================================
// ACCOUNT VIEW
// ============================================================

const AccountView = ({ currentUser, onLogout, onDeleteAccount, onNavigate }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const isDemo = currentUser.id === "demo";

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Mon compte</h1>
      </div>

      {/* Carte profil */}
      <div className="mp-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: space.xl, flexWrap: "wrap" }}>
        <div style={{
          width: "4rem", height: "4rem", borderRadius: "50%",
          background: "var(--clay-wash)", border: "2px solid var(--clay-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--clay)", fontFamily: "'Fraunces', Georgia, serif" }}>
            {currentUser.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="mp-h2" style={{ marginBottom: "0.2rem" }}>{currentUser.name}</h2>
          <p className="mp-small mp-text-soft">{currentUser.email}</p>
          {isDemo && <span className="mp-badge mp-badge-amber" style={{ marginTop: "0.4rem" }}>Compte de démonstration</span>}
        </div>
      </div>

      {/* Informations */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <h3 className="mp-h3" style={{ marginBottom: space.md }}>Informations</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="mp-small mp-text-soft">Nom</span>
            <span className="mp-small">{currentUser.name}</span>
          </div>
          <hr className="mp-divider" />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="mp-small mp-text-soft">Email</span>
            <span className="mp-small">{currentUser.email}</span>
          </div>
          <hr className="mp-divider" />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="mp-small mp-text-soft">Type de compte</span>
            <span className="mp-small">{isDemo ? "Démonstration" : "Standard"}</span>
          </div>
          {currentUser.consentDate && (
            <>
              <hr className="mp-divider" />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mp-small mp-text-soft">Consentement</span>
                <span className="mp-small">{new Date(currentUser.consentDate).toLocaleDateString("fr-FR")}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mes données RGPD */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <h3 className="mp-h3" style={{ marginBottom: "0.35rem" }}>Mes données</h3>
        <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
          Conformément au RGPD, vous pouvez consulter, modifier ou exporter vos données.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button type="button" className="mp-btn mp-btn-secondary" style={{ justifyContent: "flex-start" }}
            onClick={() => setShowPrivacy(true)}>
            <Icon name="sliders" size={14} /> Politique de confidentialité
          </button>
          <button type="button" className="mp-btn mp-btn-secondary" style={{ justifyContent: "flex-start" }}
            onClick={() => onNavigate?.("preferences")}>
            <Icon name="edit" size={14} /> Modifier mes préférences alimentaires
          </button>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="mp-card" style={{ marginBottom: space.md, border: "1px solid var(--line)" }}>
        <h3 className="mp-h3" style={{ marginBottom: "0.35rem" }}>Déconnexion</h3>
        <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
          Vos données locales resteront sauvegardées sur cet appareil.
        </p>
        {!showConfirm ? (
          <button type="button" className="mp-btn"
            style={{ background: "var(--paper-sunken)", color: "var(--ink)", border: "1px solid var(--line)" }}
            onClick={() => setShowConfirm(true)}>
            <Icon name="x" size={14} /> Se déconnecter
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="mp-small mp-text-soft">Confirmer ?</span>
            <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowConfirm(false)}>Annuler</button>
            <button type="button" className="mp-btn mp-btn-sm"
              style={{ background: "var(--ink)", color: "#fff", border: "none" }} onClick={onLogout}>
              Confirmer
            </button>
          </div>
        )}
      </div>

      {/* Supprimer le compte — zone danger */}
      {!isDemo && (
        <div className="mp-card" style={{ border: "1px solid var(--berry-wash)" }}>
          <h3 className="mp-h3" style={{ marginBottom: "0.35rem", color: "var(--berry)" }}>Supprimer mon compte</h3>
          <p className="mp-small mp-text-soft" style={{ marginBottom: space.md }}>
            Cette action est irréversible. Toutes vos données personnelles seront supprimées sous 30 jours (droit à l'effacement RGPD).
          </p>
          {!showDeleteConfirm ? (
            <button type="button" className="mp-btn"
              style={{ background: "var(--berry-wash)", color: "var(--berry)", border: "1px solid var(--berry-wash)" }}
              onClick={() => setShowDeleteConfirm(true)}>
              <Icon name="trash" size={14} /> Supprimer mon compte
            </button>
          ) : (
            <div>
              <p className="mp-small" style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input className="mp-input" style={{ flex: 1 }}
                  value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="SUPPRIMER" />
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
                  Annuler
                </button>
                <button type="button" className="mp-btn mp-btn-sm"
                  style={{ background: "var(--berry)", color: "#fff", border: "none" }}
                  disabled={deleteInput !== "SUPPRIMER"}
                  onClick={() => { if (deleteInput === "SUPPRIMER") onDeleteAccount?.(); }}>
                  Confirmer la suppression
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

// ============================================================
// FAMILY VIEW — association de comptes existants
// ============================================================

// Avatar utilisateur réutilisable
const UserAvatar = ({ name, size = "md" }) => {
  const sz = size === "sm" ? "1.75rem" : "2.25rem";
  const fs = size === "sm" ? "0.7rem" : "0.8rem";
  return (
    <div style={{ width: sz, height: sz, borderRadius: "50%", background: "var(--clay-wash)", border: "1px solid var(--clay-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: fs, fontWeight: 700, color: "var(--clay)" }}>{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
};

const FamilyView = ({ families, currentUser, ingredients = [], onCreateFamily, onJoinFamily, onLeaveFamily, onSetActiveFamily, onPromoteMember, onRemoveMember, onRegenerateCode }) => {
  const [tab, setTab] = useState("create");
  const [showJoinCreate, setShowJoinCreate] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  const activeFamily = families.find((f) => f.id === currentUser.activeFamilyId) || families[0];
  if (!activeFamily) return <EmptyState title="Aucune famille" hint="Créez ou rejoignez une famille." />;

  const currentMember = activeFamily.members.find((m) => m.userId === currentUser.id);
  const isAdmin = currentMember?.role === "admin";

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    try { await onCreateFamily(familyName.trim()); setShowJoinCreate(false); setFamilyName(""); setError(""); }
    catch (err) { setError(err.message); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try { await onJoinFamily(inviteCode.trim().toUpperCase()); setShowJoinCreate(false); setInviteCode(""); setError(""); }
    catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Famille</h1>
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowJoinCreate((v) => !v)}>
          <Icon name="plus" size={13} /> Créer / Rejoindre
        </button>
      </div>

      {/* Panneau créer / rejoindre */}
      {showJoinCreate && (
        <div className="mp-card" style={{ marginBottom: space.xl, background: "var(--paper-sunken)" }}>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
            {[["create","Créer"],["join","Rejoindre"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setTab(id); setError(""); }}
                className={`mp-btn mp-btn-sm ${tab === id ? "mp-btn-primary" : "mp-btn-secondary"}`}
                style={{ flex: 1, justifyContent: "center" }}>{label}</button>
            ))}
          </div>
          {error && <div className="mp-auth-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}
          {tab === "create" && (
            <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem" }}>
              <input className="mp-input" style={{ flex: 1 }} value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Nom de la famille" required autoFocus />
              <button type="submit" className="mp-btn mp-btn-primary mp-btn-sm" disabled={!familyName.trim()}>Créer</button>
            </form>
          )}
          {tab === "join" && (
            <form onSubmit={handleJoin} style={{ display: "flex", gap: "0.5rem" }}>
              <input className="mp-input" style={{ flex: 1, letterSpacing: "0.1em", fontWeight: 600 }}
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Code (6 car.)" maxLength={6} required autoFocus />
              <button type="submit" className="mp-btn mp-btn-primary mp-btn-sm" disabled={inviteCode.length < 6}>Rejoindre</button>
            </form>
          )}
        </div>
      )}

      {/* Sélecteur de famille active */}
      {families.length > 1 && (
        <div style={{ marginBottom: space.xl }}>
          <span className="mp-label">Famille active</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {families.map((f) => (
              <button key={f.id} type="button" onClick={() => onSetActiveFamily(f.id)}
                className={`mp-btn mp-btn-sm ${f.id === currentUser.activeFamilyId ? "mp-btn-primary" : "mp-btn-secondary"}`}>
                {f.name}
                {f.id === currentUser.activeFamilyId && <Icon name="check" size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Famille active — détails */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md, flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 className="mp-h2">{activeFamily.name}</h2>
            <p className="mp-micro mp-text-faint">{activeFamily.members.length} membre{activeFamily.members.length > 1 ? "s" : ""}</p>
          </div>
          {families.length > 1 && !isAdmin && (
            <button type="button" className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => onLeaveFamily(activeFamily.id)}>
              Quitter
            </button>
          )}
        </div>

        {/* Code d'invitation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.8rem", background: "var(--paper-sunken)", borderRadius: radius.sm, marginBottom: space.md, flexWrap: "wrap" }}>
          <span className="mp-label" style={{ margin: 0 }}>Code d'invitation</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.15em", color: "var(--clay)" }}>
            {activeFamily.inviteCode}
          </span>
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => copyCode(activeFamily.inviteCode)}>
            <Icon name={copiedCode === activeFamily.inviteCode ? "check" : "copy"} size={13} />
            {copiedCode === activeFamily.inviteCode ? "Copié" : "Copier"}
          </button>
          {isAdmin && (
            <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => onRegenerateCode(activeFamily.id)} title="Générer un nouveau code">
              Nouveau code
            </button>
          )}
        </div>

        {/* Membres */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {activeFamily.members.map((member) => {
            const isSelf = member.userId === currentUser.id;
            return (
              <div key={member.userId} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0", borderBottom: "1px solid var(--line)" }}>
                <UserAvatar name={member.userName} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span className="mp-small" style={{ fontWeight: 600 }}>{member.userName}</span>
                    {isSelf && <span className="mp-badge mp-badge-clay">Vous</span>}
                    <span className={`mp-badge ${member.role === "admin" ? "mp-badge-amber" : "mp-badge-neutral"}`}>
                      {member.role === "admin" ? "Admin" : "Membre"}
                    </span>
                  </div>
                  <p className="mp-micro mp-text-faint" style={{ marginBottom: "0.3rem" }}>{member.userEmail}</p>
                  {/* Allergies du membre (lues depuis registeredUsers via userId) */}
                  {(() => {
                    const userAllergies = (() => {
                      try {
                        const users = JSON.parse(localStorage.getItem("mealPlanner_registeredUsers") || "[]");
                        const u = users.find((u) => u.id === member.userId);
                        return u?.allergies || [];
                      } catch { return []; }
                    })();
                    if (member.userId === currentUser.id) {
                      return currentUser.allergies?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {currentUser.allergies.map((a, i) => <AllergyBadge key={i} allergy={a} ingredients={ingredients} />)}
                        </div>
                      ) : <p className="mp-micro mp-text-faint">Aucune allergie renseignée</p>;
                    }
                    return userAllergies.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {userAllergies.map((a, i) => <AllergyBadge key={i} allergy={a} ingredients={ingredients} />)}
                      </div>
                    ) : <p className="mp-micro mp-text-faint">Aucune allergie renseignée</p>;
                  })()}
                </div>
                {isAdmin && !isSelf && (
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {member.role !== "admin" && (
                      <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => onPromoteMember(activeFamily.id, member.userId)} title="Promouvoir admin">
                        ↑ Admin
                      </button>
                    )}
                    <button type="button" className="mp-btn mp-btn-danger mp-btn-icon" onClick={() => onRemoveMember(activeFamily.id, member.userId)} aria-label="Retirer">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// NOTIFICATIONS VIEW
// ============================================================

const NotificationToggle = ({ label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
    <input type="checkbox" className="mp-checkbox" />
    <span className="mp-small">{label}</span>
  </label>
);

const NotificationsView = () => (
  <div>
    <div className="mp-view-header">
      <h1 className="mp-h1">Notifications</h1>
      <button type="button" className="mp-btn mp-btn-primary">
        <Icon name="plus" size={15} /> Rappel
      </button>
    </div>

    <div className="mp-card" style={{ marginBottom: space.xl }}>
      <h3 className="mp-h3" style={{ marginBottom: space.md }}>Paramètres</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
        <div>
          <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Rappels de repas</p>
          <div style={{ display: "flex", gap: space.lg, flexWrap: "wrap" }}>
            <NotificationToggle label="1h avant" />
            <NotificationToggle label="Le matin" />
          </div>
        </div>
        <div>
          <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Liste de courses</p>
          <div style={{ display: "flex", gap: space.lg, flexWrap: "wrap" }}>
            <NotificationToggle label="Liste mise à jour" />
            <NotificationToggle label="1 jour avant" />
          </div>
        </div>
        <div>
          <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Canaux</p>
          <div style={{ display: "flex", gap: space.lg, flexWrap: "wrap" }}>
            <NotificationToggle label="Email" />
            <NotificationToggle label="Notification push" />
            <NotificationToggle label="SMS" />
          </div>
        </div>
      </div>
    </div>

    <h3 className="mp-h3" style={{ marginBottom: space.md }}>Historique</h3>
    <EmptyState title="Aucune notification" hint="Les notifications apparaîtront ici" />
  </div>
);

// ============================================================
// FAMILY SETUP — écran obligatoire après inscription
// ============================================================

const FamilySetupView = ({ currentUser, onCreateFamily, onJoinFamily }) => {
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [familyName, setFamilyName] = useState(`Famille ${currentUser.name}`);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    try { await onCreateFamily(familyName.trim()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    try { await onJoinFamily(inviteCode.trim().toUpperCase()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="mp-auth-root">
      <div className="mp-auth-card">
        <AuthLogo />
        <h2 className="mp-h2" style={{ textAlign: "center", marginBottom: "0.4rem" }}>Votre famille</h2>
        <p className="mp-small mp-text-soft" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Le planning est lié à une famille. Créez la vôtre ou rejoignez-en une existante.
        </p>

        {/* Onglets */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
          {[["create", "Créer une famille"], ["join", "Rejoindre"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setTab(id); setError(""); }}
              className={`mp-btn mp-btn-sm ${tab === id ? "mp-btn-primary" : "mp-btn-secondary"}`}
              style={{ flex: 1, justifyContent: "center" }}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mp-auth-error">{error}</div>}

        {tab === "create" && (
          <form onSubmit={handleCreate}>
            <Field label="Nom de la famille">
              <input className="mp-input" value={familyName} onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex : Famille Dupont" required autoFocus />
            </Field>
            <button type="submit" className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }} disabled={loading || !familyName.trim()}>
              {loading ? "Création…" : "Créer et continuer"}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={handleJoin}>
            <Field label="Code d'invitation (6 caractères)">
              <input className="mp-input" value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex : ABC123" maxLength={6} required autoFocus
                style={{ letterSpacing: "0.15em", fontWeight: 600, textAlign: "center", fontSize: "1.1rem" }} />
            </Field>
            <button type="submit" className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }} disabled={loading || inviteCode.length < 6}>
              {loading ? "Vérification…" : "Rejoindre la famille"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================
// AUTH VIEWS
// ============================================================

// Logo SVG Keskon'm — assiette + couverts + point d'interrogation
const KeskомLogo = ({ size = "md" }) => {
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
const AuthLogo = () => (
  <div className="mp-auth-logo">
    <KeskомLogo size="md" />
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder = "••••••••" }) => {
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

const LoginView = ({ onLogin, onGoRegister, onGoForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-auth-root">
      <div className="mp-auth-card">
        <AuthLogo />
        <h2 className="mp-h2" style={{ marginBottom: "1.25rem", textAlign: "center" }}>Connexion</h2>

        {/* Bandeau compte démo */}
        <div style={{
          background: "var(--clay-wash)",
          border: "1px solid var(--clay-soft)",
          borderRadius: radius.sm,
          padding: "0.6rem 0.75rem",
          marginBottom: "1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}>
          <div>
            <p className="mp-micro" style={{ fontWeight: 700, color: "var(--clay)", textTransform: "uppercase", marginBottom: "0.15rem" }}>
              Compte de démonstration
            </p>
            <p className="mp-micro mp-text-soft">
              {DEMO_USER.email} · {DEMO_USER.password}
            </p>
          </div>
          <button
            type="button"
            className="mp-btn mp-btn-sm"
            style={{ background: "var(--clay)", color: "#fff", border: "none", flexShrink: 0 }}
            onClick={() => onLogin(DEMO_USER.email, DEMO_USER.password)}
          >
            Essayer
          </button>
        </div>

        {error && <div className="mp-auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              className="mp-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              autoFocus
            />
          </Field>
          <PasswordInput
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ textAlign: "right", marginTop: "-0.4rem", marginBottom: "1.25rem" }}>
            <button type="button" className="mp-auth-link" onClick={onGoForgot}>
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            className="mp-btn mp-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mp-auth-divider">
          Pas encore de compte ?{" "}
          <button type="button" className="mp-auth-link" onClick={onGoRegister}>
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterView = ({ onRegister, onGoLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consentGeneral, setConsentGeneral] = useState(false);
  const [consentSensitive, setConsentSensitive] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (!consentGeneral) { setError("Vous devez accepter la politique de confidentialité pour créer un compte."); return; }
    setLoading(true);
    try {
      await onRegister(name.trim(), email.trim(), password, { consentGeneral, consentSensitive, consentDate: new Date().toISOString() });
    } catch (err) {
      setError(err.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-auth-root">
      <div className="mp-auth-card">
        <AuthLogo />
        <h2 className="mp-h2" style={{ marginBottom: "1.25rem", textAlign: "center" }}>Créer un compte</h2>

        {error && <div className="mp-auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Prénom ou nom">
            <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Camille Dupont" required autoFocus />
          </Field>
          <Field label="Email">
            <input className="mp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com" required />
          </Field>
          <PasswordInput label="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" />
          <PasswordInput label="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          {/* Consentement général — obligatoire */}
          <div style={{ margin: "1rem 0 0.6rem", padding: "0.75rem", background: "var(--paper-sunken)", borderRadius: radius.sm, border: "1px solid var(--line)" }}>
            <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={consentGeneral} onChange={(e) => setConsentGeneral(e.target.checked)}
                style={{ marginTop: "0.15rem", accentColor: "var(--sage)", flexShrink: 0 }} />
              <span className="mp-small">
                J'ai lu et j'accepte la{" "}
                <PrivacyLink onClick={() => setShowPrivacy(true)} />{" "}
                de Keskon'm. <span style={{ color: "var(--berry)" }}>*</span>
              </span>
            </label>
          </div>

          {/* Consentement données sensibles — recommandé mais facultatif */}
          <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--paper-sunken)", borderRadius: radius.sm, border: "1px solid var(--line)" }}>
            <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={consentSensitive} onChange={(e) => setConsentSensitive(e.target.checked)}
                style={{ marginTop: "0.15rem", accentColor: "var(--sage)", flexShrink: 0 }} />
              <span className="mp-small">
                J'accepte de renseigner mes allergies et préférences alimentaires (données de santé et/ou religieuses) pour personnaliser les suggestions de repas. <span className="mp-text-faint">Facultatif</span>
              </span>
            </label>
            {!consentSensitive && (
              <p className="mp-micro mp-text-faint" style={{ marginTop: "0.4rem", paddingLeft: "1.4rem" }}>
                Sans ce consentement, les fonctionnalités de filtrage par allergies seront désactivées.
              </p>
            )}
          </div>

          <button type="submit" className="mp-btn mp-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading || !consentGeneral}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mp-auth-divider">
          Déjà un compte ?{" "}
          <button type="button" className="mp-auth-link" onClick={onGoLogin}>Se connecter</button>
        </p>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

const ForgotPasswordView = ({ onGoLogin }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO Phase 3 — remplacer par fetch("/api/auth/forgot-password", { method: "POST", body: { email } })
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="mp-auth-root">
      <div className="mp-auth-card">
        <AuthLogo />
        <h2 className="mp-h2" style={{ marginBottom: "0.5rem", textAlign: "center" }}>Mot de passe oublié</h2>
        <p className="mp-small mp-text-soft" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        {sent ? (
          <>
            <div className="mp-auth-success">
              Un lien a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
            </div>
            <button
              type="button"
              className="mp-btn mp-btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={onGoLogin}
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Field label="Email">
              <input
                className="mp-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoFocus
              />
            </Field>
            <button
              type="submit"
              className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mp-auth-divider">
            <button type="button" className="mp-auth-link" onClick={onGoLogin}>
              ← Retour à la connexion
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

const NEW_MEMBER_SENTINEL = "__new__";

// ============================================================
// QUICK PLAN (FAB mobile) — planifier un repas en 2 étapes
// ============================================================

const QuickPlanModal = ({ recipes, recentRecipeIds, onClose, onSave }) => {
  const [step, setStep] = useState(1); // 1 = date+type, 2 = recettes
  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState("lunch");

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  if (step === 2) {
    return (
      <RecipeSelectionModal
        recipes={recipes}
        meal={null}
        mealType={mealType}
        date={date}
        recentRecipeIds={recentRecipeIds}
        onClose={onClose}
        onSave={(recipeIds) => { onSave({ date, type: mealType, recipeIds }); onClose(); }}
      />
    );
  }

  return (
    <Modal onClose={onClose} width="360px">
      <ModalHeader title="Planifier un repas" onClose={onClose} />
      <form onSubmit={handleNextStep}>
        <Field label="Date">
          <input
            className="mp-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Repas">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {MEAL_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMealType(t.id)}
                className={`mp-btn mp-btn-sm ${mealType === t.id ? "mp-btn-primary" : "mp-btn-secondary"}`}
                style={{ flex: 1 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
          <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="mp-btn mp-btn-primary">
            Choisir les recettes <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// APP SHELL
// ============================================================

const STORAGE_KEYS = {
  recipes: "mealPlanner_recipes",
  mealPlans: "mealPlanner_mealPlans",
  shoppingList: "mealPlanner_shoppingList",
  ingredients: "mealPlanner_ingredients",
  darkMode: "mealPlanner_darkMode",
  weekTemplates: "mealPlanner_weekTemplates",
  currentUser: "mealPlanner_currentUser",
  registeredUsers: "mealPlanner_registeredUsers",
  families: "mealPlanner_families",           // toutes les familles
};

// Compte de démonstration — toujours disponible
const DEMO_USER = { id: "demo", name: "Famille Demo", email: "demo@carnet.app", password: "demo1234",
  activeFamilyId: "demo-family", preferences: [], allergies: [] };

// Famille de démonstration
const DEMO_FAMILY = {
  id: "demo-family",
  name: "Famille Demo",
  inviteCode: "DEMO01",
  members: [{ userId: "demo", userName: "Famille Demo", userEmail: "demo@carnet.app", role: "admin" }],
};

// Génère un code d'invitation à 6 caractères
const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponible (mode privé, quota, etc.) — on ignore silencieusement
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState("calendar");
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.darkMode, false));
  const [currentUser, setCurrentUser] = useState(() => loadFromStorage(STORAGE_KEYS.currentUser, null));
  const [authScreen, setAuthScreen] = useState("login");
  const [families, setFamilies] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.families, null);
    return stored || [DEMO_FAMILY];
  });
  const [recipes, setRecipes] = useState(() => loadFromStorage(STORAGE_KEYS.recipes, initialRecipes));
  const [mealPlans, setMealPlans] = useState(() => loadFromStorage(STORAGE_KEYS.mealPlans, initialMealPlans));
  const [shoppingList, setShoppingList] = useState(() => loadFromStorage(STORAGE_KEYS.shoppingList, initialShoppingList));
  const [ingredients, setIngredients] = useState(() => loadFromStorage(STORAGE_KEYS.ingredients, initialIngredients));
  const [weekTemplates, setWeekTemplates] = useState(() => loadFromStorage(STORAGE_KEYS.weekTemplates, []));
  const [showFab, setShowFab] = useState(false);

  // Familles dont l'utilisateur est membre uniquement
  const userFamilies = useMemo(() =>
    families.filter((f) => f.members.some((m) => m.userId === currentUser?.id)),
  [families, currentUser]);

  // Famille active (parmi les familles de l'utilisateur uniquement)
  const activeFamily = useMemo(() =>
    userFamilies.find((f) => f.id === currentUser?.activeFamilyId) || userFamilies[0],
  [userFamilies, currentUser]);

  // Données filtrées par famille active
  const familyMealPlans = useMemo(() =>
    mealPlans.filter((mp) => mp.familyId === activeFamily?.id || !mp.familyId),
  [mealPlans, activeFamily]);
  const familyShoppingList = useMemo(() =>
    shoppingList.filter((i) => i.familyId === activeFamily?.id || !i.familyId),
  [shoppingList, activeFamily]);
  // Recettes visibles : globales + créées par l'user + partagées dans la famille active
  const familyRecipes = useMemo(() =>
    recipes.filter((r) => {
      if (r.scope === "global") return true;
      if (r.createdBy === currentUser?.id) return true;
      if (activeFamily && (r.sharedWith || []).includes(activeFamily.id)) return true;
      // Compat ancienne structure
      if (r.familyId === activeFamily?.id) return true;
      return false;
    }),
  [recipes, activeFamily, currentUser]);
  const familyWeekTemplates = useMemo(() =>
    weekTemplates.filter((t) => t.familyId === activeFamily?.id || t.userId === currentUser?.id || !t.familyId),
  [weekTemplates, activeFamily, currentUser]);

  const recentRecipeIds = useMemo(() => {
    const sorted = [...familyMealPlans].sort((a, b) => b.date.localeCompare(a.date));
    const seen = new Set();
    for (const mp of sorted) {
      for (const id of (mp.recipeIds || [])) {
        seen.add(id);
        if (seen.size >= 5) break;
      }
      if (seen.size >= 5) break;
    }
    return Array.from(seen);
  }, [familyMealPlans]);

  const { toast, showToast } = useToast();

  useEffect(() => saveToStorage(STORAGE_KEYS.recipes, recipes), [recipes]);
  useEffect(() => saveToStorage(STORAGE_KEYS.mealPlans, mealPlans), [mealPlans]);
  useEffect(() => saveToStorage(STORAGE_KEYS.shoppingList, shoppingList), [shoppingList]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ingredients, ingredients), [ingredients]);
  useEffect(() => saveToStorage(STORAGE_KEYS.weekTemplates, weekTemplates), [weekTemplates]);
  useEffect(() => saveToStorage(STORAGE_KEYS.darkMode, darkMode), [darkMode]);
  useEffect(() => saveToStorage(STORAGE_KEYS.currentUser, currentUser), [currentUser]);
  useEffect(() => saveToStorage(STORAGE_KEYS.families, families), [families]);

  // ---- Auth ----
  const handleLogin = async (email, password) => {
    if (email.toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) {
      setCurrentUser({ ...DEMO_USER, password: undefined });
      return;
    }
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) throw new Error("Email ou mot de passe incorrect.");
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
  };

  const handleRegister = async (name, email, password, consents = {}) => {
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error("Un compte existe déjà avec cet email.");
    const newUser = {
      id: Date.now().toString(), name, email, password,
      activeFamilyId: null, preferences: [], allergies: [], dislikes: [], diets: [], rules: [],
      consentGeneral: consents.consentGeneral || false,
      consentSensitive: consents.consentSensitive || false,
      consentDate: consents.consentDate || new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.registeredUsers, [...users, newUser]);
    const { password: _, ...safeUser } = newUser;
    setCurrentUser(safeUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEYS.currentUser, null);
    setAuthScreen("login");
  };

  // ---- Famille ----
  const handleCreateFamily = async (name) => {
    const newFamily = {
      id: Date.now().toString(),
      name,
      inviteCode: generateInviteCode(),
      members: [{ userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "admin" }],
    };
    setFamilies((prev) => [...prev, newFamily]);
    setCurrentUser((u) => ({ ...u, activeFamilyId: newFamily.id }));
    // Persister activeFamilyId dans registeredUsers
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    saveToStorage(STORAGE_KEYS.registeredUsers, users.map((u) => u.id === currentUser.id ? { ...u, activeFamilyId: newFamily.id } : u));
    showToast(`Famille « ${name} » créée`, "sage");
  };

  const handleJoinFamily = async (code) => {
    const allFamilies = loadFromStorage(STORAGE_KEYS.families, [DEMO_FAMILY]);
    const target = [...allFamilies, DEMO_FAMILY].find((f) => f.inviteCode === code);
    if (!target) throw new Error("Code invalide ou famille introuvable.");
    if (target.members.some((m) => m.userId === currentUser.id)) throw new Error("Vous êtes déjà membre de cette famille.");
    const updated = { ...target, members: [...target.members, { userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "member" }] };
    setFamilies((prev) => prev.some((f) => f.id === target.id) ? prev.map((f) => f.id === target.id ? updated : f) : [...prev, updated]);
    setCurrentUser((u) => ({ ...u, activeFamilyId: target.id }));
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    saveToStorage(STORAGE_KEYS.registeredUsers, users.map((u) => u.id === currentUser.id ? { ...u, activeFamilyId: target.id } : u));
    showToast(`Vous avez rejoint « ${target.name} »`, "sage");
  };

  const handleSetActiveFamily = (familyId) => {
    setCurrentUser((u) => ({ ...u, activeFamilyId: familyId }));
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    saveToStorage(STORAGE_KEYS.registeredUsers, users.map((u) => u.id === currentUser.id ? { ...u, activeFamilyId: familyId } : u));
  };

  const handleLeaveFamily = (familyId) => {
    setFamilies((prev) => prev.map((f) => f.id === familyId
      ? { ...f, members: f.members.filter((m) => m.userId !== currentUser.id) }
      : f
    ));
    const remaining = families.filter((f) => f.id !== familyId && f.members.some((m) => m.userId === currentUser.id));
    const newActive = remaining[0]?.id || null;
    setCurrentUser((u) => ({ ...u, activeFamilyId: newActive }));
    showToast("Vous avez quitté la famille", "sage");
  };

  const handlePromoteMember = (familyId, userId) => {
    setFamilies((prev) => prev.map((f) => f.id !== familyId ? f : {
      ...f, members: f.members.map((m) => ({ ...m, role: m.userId === userId ? "admin" : m.role }))
    }));
    showToast("Membre promu admin", "sage");
  };

  const handleRemoveMember = (familyId, userId) => {
    setFamilies((prev) => prev.map((f) => {
      if (f.id !== familyId) return f;
      const remaining = f.members.filter((m) => m.userId !== userId);
      // Si plus d'admin, promouvoir le premier membre
      const hasAdmin = remaining.some((m) => m.role === "admin");
      return { ...f, members: hasAdmin ? remaining : remaining.map((m, i) => i === 0 ? { ...m, role: "admin" } : m) };
    }));
    showToast("Membre retiré", "sage");
  };

  const handleRegenerateCode = (familyId) => {
    setFamilies((prev) => prev.map((f) => f.id === familyId ? { ...f, inviteCode: generateInviteCode() } : f));
    showToast("Nouveau code généré", "sage");
  };

  // ---- Recettes ----
  const handleAddRecipe = (recipe) =>
    setRecipes((prev) => [...prev, {
      ...recipe,
      id: recipe.id || Date.now().toString(),
      createdBy: currentUser?.id,
      scope: "shared",
      sharedWith: activeFamily ? [activeFamily.id] : [],
      parentId: recipe.parentId || null,
      rootId: recipe.rootId || null,
      variantName: recipe.variantName || null,
    }]);

  const handleEditRecipe = (updated) =>
    setRecipes((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));

  const handleDeleteRecipe = (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setMealPlans((prev) => prev.map((mp) => ({ ...mp, recipeIds: (mp.recipeIds || []).filter((rid) => rid !== id) })));
  };

  const handleImportRecipe = (recipe) => {
    const copy = {
      ...recipe,
      id: Date.now().toString(),
      createdBy: currentUser?.id,
      scope: "shared",
      sharedWith: activeFamily ? [activeFamily.id] : [],
      parentId: null,
      rootId: null,
      variantName: null,
    };
    setRecipes((prev) => [...prev, copy]);
    showToast(`« ${recipe.name} » ajoutée à ${activeFamily?.name}`, "sage");
  };

  const handleCreateVariant = (originalRecipe) => {
    const rootId = originalRecipe.rootId || originalRecipe.id;
    return {
      ...originalRecipe,
      id: Date.now().toString(),
      parentId: originalRecipe.id,
      rootId,
      createdBy: currentUser?.id,
      scope: "shared",
      sharedWith: activeFamily ? [activeFamily.id] : [],
      variantName: `Variante de ${originalRecipe.name}`,
    };
  };

  const handleShareRecipe = (recipeId, familyId) => {
    setRecipes((prev) => prev.map((r) => {
      if (r.id !== recipeId) return r;
      const already = (r.sharedWith || []).includes(familyId);
      return {
        ...r,
        scope: already ? (r.sharedWith.length <= 1 ? "private" : "shared") : "shared",
        sharedWith: already
          ? (r.sharedWith || []).filter((id) => id !== familyId)
          : [...(r.sharedWith || []), familyId],
      };
    }));
  };

  // ---- Repas ----
  const handleAddMeal = (mealData) => setMealPlans((prev) => [...prev, {
    id: Date.now().toString(), date: mealData?.date || todayStr(),
    recipeIds: mealData?.recipeIds || [], type: mealData?.type || "lunch",
    status: mealData?.status || "normal",
    familyId: activeFamily?.id,
  }]);
  const handleUpdateMeal = (mealId, recipeIds, status = "normal") =>
    setMealPlans((prev) => prev.map((mp) => mp.id === mealId ? { ...mp, recipeIds, status } : mp));

  // ---- Courses ----
  const handleAddShoppingItem = (item) =>
    setShoppingList((prev) => [...prev, { id: Date.now().toString(), name: item.name, quantity: item.quantity, completed: false, familyId: activeFamily?.id }]);
  const handleToggleShoppingItem = (id) =>
    setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  const handleDeleteShoppingItem = (id) =>
    setShoppingList((prev) => prev.filter((item) => item.id !== id));

  const handleGenerateShoppingList = (from, to) => {
    const startStr = from || todayStr();
    const endDate = new Date((to || startStr) + "T12:00:00");
    endDate.setDate(endDate.getDate() + 1);
    const endStr = endDate.toISOString().split("T")[0];
    const upcomingMeals = familyMealPlans.filter((mp) => mp.date >= startStr && mp.date < endStr);
    if (upcomingMeals.length === 0) {
      showToast(`Aucune recette planifiée sur cette période`, "berry"); return;
    }
    const parseQty = (str) => { const m = str.match(/^([\d.,/]+)\s*(.*)/); if (!m) return null; const num = parseFloat(m[1].replace(",",".")); return isNaN(num) ? null : { num, unit: m[2].trim() }; };
    const addQty = (a, b) => { const pa = parseQty(a), pb = parseQty(b); if (pa && pb && pa.unit === pb.unit) { const sum = Math.round((pa.num+pb.num)*10)/10; const noSpace = /^(g|kg|ml|L|cl|dl)$/.test(pa.unit); return `${Number.isInteger(sum)?sum:sum}${noSpace?"":pa.unit?" ":""}${pa.unit}`.trim(); } return `${a} + ${b}`; };
    const aggregated = new Map(); let recipeCount = 0;
    upcomingMeals.forEach((meal) => {
      (meal.recipeIds || []).forEach((recipeId) => {
        const recipe = familyRecipes.find((r) => r.id === recipeId); if (!recipe) return;
        recipeCount++;
        const multiplier = Math.max(1, activeFamily?.members.length || 1) / (recipe.portions || 4);
        recipe.ingredients.forEach((ing) => {
          const key = ing.ingredientName;
          const parsed = parseQty(ing.quantity);
          let qty = ing.quantity;
          if (parsed && Math.abs(multiplier - 1) > 0.01) { const adj = Math.round(parsed.num * multiplier * 10)/10; qty = `${Number.isInteger(adj)?adj:adj}${parsed.unit?" "+parsed.unit:""}`.trim(); }
          aggregated.set(key, aggregated.has(key) ? addQty(aggregated.get(key), qty) : qty);
        });
      });
    });
    let addedCount = 0;
    setShoppingList((prev) => {
      const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
      const additions = []; aggregated.forEach((quantity, name) => { if (existingNames.has(name.toLowerCase())) return; additions.push({ id: `${Date.now()}-${name}`, name, quantity, completed: false, familyId: activeFamily?.id }); });
      addedCount = additions.length; return [...prev, ...additions];
    });
    setTimeout(() => { addedCount === 0 ? showToast("Tous les ingrédients sont déjà dans la liste","sage") : showToast(`${addedCount} article${addedCount>1?"s":""} ajouté${addedCount>1?"s":""} depuis ${recipeCount} recette${recipeCount>1?"s":""}`, "sage"); }, 0);
  };

  // ---- Ingrédients ----
  const handleAddIngredient = (ing) => setIngredients((prev) => [...prev, ing]);
  const handleDeleteIngredient = (id) => {
    if (familyRecipes.some((r) => r.ingredients?.some((i) => i.ingredientId === id))) {
      alert("Cet ingrédient est utilisé dans une recette."); return;
    }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  // ---- Semaines types ----
  const handleSaveTemplate = (tpl) => setWeekTemplates((prev) => {
    const base = { ...tpl, familyId: tpl.scope === "family" ? activeFamily?.id : undefined, userId: tpl.scope === "user" ? currentUser?.id : undefined };
    const idx = prev.findIndex((t) => t.id === base.id);
    return idx >= 0 ? prev.map((t) => t.id === base.id ? base : t) : [...prev, base];
  });
  const handleDeleteTemplate = (id) => setWeekTemplates((prev) => prev.filter((t) => t.id !== id));
  const handleApplyTemplate = (template, weekStart, mode) => {
    const monday = getMondayOf(new Date(weekStart + "T12:00:00"));
    setMealPlans((prev) => {
      let base = prev;
      if (mode === "overwrite") {
        const affected = new Set(template.slots.map((s) => dateOfSlot(monday, s.day)));
        base = prev.filter((mp) => !affected.has(mp.date) || !template.slots.some((s) => s.type === mp.type && dateOfSlot(monday, s.day) === mp.date));
      }
      const additions = template.slots.filter((slot) => {
        if (mode === "merge") { const date = dateOfSlot(monday, slot.day); return !base.some((mp) => mp.date === date && mp.type === slot.type && (mp.recipeIds||[]).length > 0); }
        return true;
      }).map((slot) => ({ id: `tpl-${Date.now()}-${slot.day}-${slot.type}`, date: dateOfSlot(monday, slot.day), type: slot.type, recipeIds: slot.recipeIds, familyId: activeFamily?.id }));
      return [...base, ...additions];
    });
    showToast(`${template.slots.length} créneau${template.slots.length>1?"x":""} appliqué${template.slots.length>1?"s":""}`, "sage");
  };

  // ---- Duplication / vidage semaine ----
  const handleDuplicateWeek = (srcDateStr, targetMondayStr) => {
    const monday = getMondayOf(new Date(srcDateStr + "T12:00:00"));
    const targetMonday = new Date(targetMondayStr + "T12:00:00");
    const weekMeals = familyMealPlans.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === monday.toISOString().split("T")[0]);
    if (weekMeals.length === 0) { showToast("Aucun repas à dupliquer", "berry"); return; }
    setMealPlans((prev) => {
      const additions = weekMeals.map((mp) => {
        const offset = Math.round((new Date(mp.date + "T12:00:00") - monday) / 86400000);
        const newDate = new Date(targetMonday); newDate.setDate(targetMonday.getDate() + offset);
        const newDateStr = newDate.toISOString().split("T")[0];
        if (prev.some((p) => p.date === newDateStr && p.type === mp.type && (p.recipeIds||[]).length > 0)) return null;
        return { id: `dup-${Date.now()}-${mp.id}`, date: newDateStr, type: mp.type, recipeIds: [...(mp.recipeIds||[])], familyId: activeFamily?.id };
      }).filter(Boolean);
      return [...prev, ...additions];
    });
    showToast(`${weekMeals.length} repas dupliqué${weekMeals.length>1?"s":""}`, "sage");
  };

  const handleClearWeek = (dateStr) => {
    const mondayStr = getMondayOf(new Date(dateStr + "T12:00:00")).toISOString().split("T")[0];
    setMealPlans((prev) => {
      const removed = prev.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId));
      showToast(`${removed.length} repas supprimé${removed.length>1?"s":""}`, "berry");
      return prev.filter((mp) => !(getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId)));
    });
  };

  const handleUpdateUserProfile = (updates) => {
    setCurrentUser((u) => ({ ...u, ...updates }));
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    saveToStorage(STORAGE_KEYS.registeredUsers, users.map((u) =>
      u.id === currentUser.id ? { ...u, ...updates } : u
    ));
  };

  const handleDeleteAccount = () => {
    // Supprimer le compte des utilisateurs enregistrés
    const users = loadFromStorage(STORAGE_KEYS.registeredUsers, []);
    saveToStorage(STORAGE_KEYS.registeredUsers, users.filter((u) => u.id !== currentUser.id));
    // Supprimer les données personnelles
    setRecipes((prev) => prev.filter((r) => r.createdBy !== currentUser.id));
    setMealPlans((prev) => prev.filter((mp) => mp.familyId !== activeFamily?.id));
    // Retirer l'utilisateur de toutes les familles
    setFamilies((prev) => prev.map((f) => ({
      ...f, members: f.members.filter((m) => m.userId !== currentUser.id)
    })).filter((f) => f.members.length > 0));
    handleLogout();
  };

  const viewProps = {
    calendar: { mealPlans: familyMealPlans, recipes: familyRecipes, onAddMeal: handleAddMeal, onUpdateMeal: handleUpdateMeal, recentRecipeIds, weekTemplates: familyWeekTemplates, onApplyTemplate: handleApplyTemplate, onDuplicateWeek: handleDuplicateWeek, onClearWeek: handleClearWeek, onNavigate: setCurrentView, familyMembers: activeFamily?.members || [] },
    recipes: { recipes: familyRecipes, allRecipes: recipes, globalRecipes: initialRecipes, ingredients, currentUser, userFamilies, activeFamily, onAddRecipe: handleAddRecipe, onEditRecipe: handleEditRecipe, onDeleteRecipe: handleDeleteRecipe, onImportRecipe: handleImportRecipe, onCreateVariant: handleCreateVariant, onShareRecipe: handleShareRecipe, activeFamilyId: activeFamily?.id },
    shopping: { shoppingList: familyShoppingList, ingredients, onAddItem: handleAddShoppingItem, onToggleItem: handleToggleShoppingItem, onDeleteItem: handleDeleteShoppingItem, onGenerate: handleGenerateShoppingList },
    preferences: { currentUser, ingredients, weekTemplates: familyWeekTemplates, recipes: familyRecipes, recentRecipeIds, activeFamily, onAddIngredient: handleAddIngredient, onDeleteIngredient: handleDeleteIngredient, onSaveTemplate: handleSaveTemplate, onDeleteTemplate: handleDeleteTemplate, onApplyTemplate: handleApplyTemplate, onUpdateUserProfile: handleUpdateUserProfile },
    family: { families: userFamilies, currentUser, ingredients, onCreateFamily: handleCreateFamily, onJoinFamily: handleJoinFamily, onLeaveFamily: handleLeaveFamily, onSetActiveFamily: handleSetActiveFamily, onPromoteMember: handlePromoteMember, onRemoveMember: handleRemoveMember, onRegenerateCode: handleRegenerateCode },
    account: { currentUser, onLogout: handleLogout, onDeleteAccount: handleDeleteAccount, onNavigate: setCurrentView },
  };

  const renderView = () => {
    switch (currentView) {
      case "calendar": return <CalendarView {...viewProps.calendar} />;
      case "recipes": return <RecipesView {...viewProps.recipes} />;
      case "shopping": return <ShoppingListView {...viewProps.shopping} />;
      case "preferences": return <PreferencesView {...viewProps.preferences} />;
      case "family": return <FamilyView {...viewProps.family} />;
      case "notifications": return <NotificationsView />;
      case "privacy": return <PrivacyView onBack={() => setCurrentView("account")} />;
      case "account": return <AccountView {...viewProps.account} />;
      default: return <CalendarView {...viewProps.calendar} />;
    }
  };

  // L'utilisateur est connecté mais n'a pas de famille → FamilySetupView obligatoire
  const needsFamilySetup = currentUser && !currentUser.activeFamilyId && currentUser.id !== "demo";

  return (
    <div className={`mp-root${darkMode ? " dark" : ""}`}>
      <GlobalStyle />

      {/* Auth */}
      {!currentUser && authScreen === "login" && <LoginView onLogin={handleLogin} onGoRegister={() => setAuthScreen("register")} onGoForgot={() => setAuthScreen("forgot")} />}
      {!currentUser && authScreen === "register" && <RegisterView onRegister={handleRegister} onGoLogin={() => setAuthScreen("login")} />}
      {!currentUser && authScreen === "forgot" && <ForgotPasswordView onGoLogin={() => setAuthScreen("login")} />}

      {/* Setup famille obligatoire */}
      {needsFamilySetup && <FamilySetupView currentUser={currentUser} onCreateFamily={handleCreateFamily} onJoinFamily={handleJoinFamily} />}

      {/* App principale */}
      {currentUser && !needsFamilySetup && (
        <>
          <div className="mp-shell">
            <Sidebar currentView={currentView} onNavigate={setCurrentView} darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} currentUser={currentUser} onLogout={handleLogout} />
            <main className="mp-main">{renderView()}</main>
          </div>

          <button type="button" className="mp-fab mp-hide-desktop" onClick={() => setShowFab(true)} aria-label="Planifier un repas">
            <Icon name="plus" size={22} />
          </button>

          {showFab && (
            <QuickPlanModal recipes={familyRecipes} recentRecipeIds={recentRecipeIds} onClose={() => setShowFab(false)}
              onSave={(mealData) => { handleAddMeal(mealData); setShowFab(false); showToast(`Repas planifié le ${mealData.date}`); }} />
          )}

          <Toast toast={toast} />
        </>
      )}
    </div>
  );
};

export default App;
