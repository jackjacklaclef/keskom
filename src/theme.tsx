// ============================================================
// DESIGN TOKENS — "Carnet de cuisine"
// Palette inspirée des carnets de recettes de famille : papier
// kraft, encre, tampon terracotta. Une seule police d'accent
// (Fraunces) pour les titres, Inter pour tout le reste.
// ============================================================

export const colors = {
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

export const dark = {
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

export const space = {
  xs: "0.375rem",
  sm: "0.625rem",
  md: "0.9rem",
  lg: "1.35rem",
  xl: "1.85rem",
  "2xl": "2.5rem",
  "3xl": "3.25rem",
};

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  pill: "999px",
};

// ============================================================
// GLOBAL STYLE — real CSS with media queries instead of a JS
// isMobile() ternary sprinkled through every component.
// ============================================================

export const GlobalStyle = () => (
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
    /* ---- Boutons d'alerte sur la carte de repas (Plan de prépa / Allergie) ----
       En ligne sur desktop (assez de largeur pour les deux libellés côte à côte),
       en colonne sur mobile (cases de planning trop étroites pour les deux pastilles
       côte à côte sans wrap moche). */
    .mp-meal-alerts {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 0.3rem;
    }
    @media (max-width: 768px) {
      .mp-meal-alerts {
        flex-direction: column;
        align-items: stretch;
      }
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
