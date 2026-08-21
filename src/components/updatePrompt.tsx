import { useRegisterSW } from "virtual:pwa-register/react";

import { Icon } from "./ui";

// Bandeau "nouvelle version disponible" — le service worker (registerType: 'prompt',
// vite.config.ts) détecte qu'un nouveau build a été déployé (précache Workbox différent
// de celui actuellement contrôlé) et déclenche onNeedRefresh plutôt que de recharger
// silencieusement l'utilisateur. `updateServiceWorker(true)` active le nouveau worker
// puis recharge la page.
export const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Vérifie périodiquement si un nouveau build a été déployé — un onglet resté
      // ouvert longtemps ne rechargerait sinon jamais son propre service worker
      // (celui-ci n'est vérifié par le navigateur qu'à la navigation/ouverture).
      if (!registration) return;
      setInterval(() => { registration.update(); }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="mp-update-banner">
      <Icon name="refresh" size={15} />
      <span>Nouvelle version disponible.</span>
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
        <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => updateServiceWorker(true)}>
          Actualiser
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)}
          style={{
            background: "none", border: "none", color: "var(--paper)", opacity: 0.7,
            cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", padding: "0.35rem 0.4rem",
          }}>
          Plus tard
        </button>
      </div>
    </div>
  );
};
