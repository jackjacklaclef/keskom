import { useRegisterSW } from "virtual:pwa-register/react";
import { useRef } from "react";

import { Icon } from "./ui";

// Le bandeau revient tout seul après un délai si l'utilisateur clique "Plus tard" —
// sans ça, `setNeedRefresh(false)` éteint le state du hook et rien ne le rallume
// avant le *prochain déploiement* (le check périodique ne fait que revérifier le même
// service worker en attente, il ne re-déclenche onNeedRefresh que sur un contenu
// différent) : un onglet resté ouvert peut alors tourner indéfiniment sur un ancien
// build après un seul "Plus tard".
const RENAG_DELAY_MS = 20 * 60 * 1000;

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

  const renagTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = () => {
    setNeedRefresh(false);
    renagTimer.current = setTimeout(() => setNeedRefresh(true), RENAG_DELAY_MS);
  };

  if (!needRefresh) return null;

  return (
    <div className="mp-update-banner">
      <Icon name="refresh" size={15} />
      <span>Nouvelle version disponible.</span>
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
        <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => updateServiceWorker(true)}>
          Actualiser
        </button>
        <button type="button" onClick={handleDismiss}
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
