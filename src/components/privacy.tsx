import { space } from "../theme";
import { PRIVACY_CONTENT } from "../constants";
import { Modal, ModalHeader, Icon } from "./ui";

// ============================================================
// RGPD — Politique de confidentialité
// ============================================================

export const PrivacyModal = ({ onClose }) => (
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

export const PrivacyView = ({ onBack }) => (
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
export const PrivacyLink = ({ onClick }) => (
  <button type="button" onClick={onClick}
    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage)", textDecoration: "underline", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}>
    politique de confidentialité
  </button>
);
