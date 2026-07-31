import { useState } from "react";

import { radius } from "../theme";
import { AuthLogo, Field, PasswordInput } from "./ui";
import { PrivacyLink, PrivacyModal } from "./privacy";
import { DEMO_USER, DEMO_PASSWORD } from "../lib/storage";
import { AuthService } from "../lib/authService";

export const FamilySetupView = ({ currentUser, onCreateFamily, onJoinFamily }) => {
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [familyName, setFamilyName] = useState(`Famille ${currentUser.name}`);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    try { await onCreateFamily(familyName.trim()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
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
          <div>
            <Field label="Nom de la famille">
              <input className="mp-input" value={familyName} onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Ex : Famille Dupont" autoFocus />
            </Field>
            <button type="button" className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }} disabled={loading || !familyName.trim()}
              onClick={handleCreate}>
              {loading ? "Création…" : "Créer et continuer"}
            </button>
          </div>
        )}

        {tab === "join" && (
          <div>
            <Field label="Code d'invitation (6 caractères)">
              <input className="mp-input" value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && inviteCode.length >= 6 && handleJoin()}
                placeholder="Ex : ABC123" maxLength={6} autoFocus
                style={{ letterSpacing: "0.15em", fontWeight: 600, textAlign: "center", fontSize: "1.1rem" }} />
            </Field>
            <button type="button" className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }} disabled={loading || inviteCode.length < 6}
              onClick={handleJoin}>
              {loading ? "Vérification…" : "Rejoindre la famille"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// AUTH VIEWS
// ============================================================

export const LoginView = ({ onLogin, onGoRegister, onGoForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
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
              {DEMO_USER.email} · {DEMO_PASSWORD}
            </p>
          </div>
          <button
            type="button"
            className="mp-btn mp-btn-sm"
            style={{ background: "var(--clay)", color: "#fff", border: "none", flexShrink: 0 }}
            onClick={() => onLogin(DEMO_USER.email, DEMO_PASSWORD)}
          >
            Essayer
          </button>
        </div>

        {error && <div className="mp-auth-error">{error}</div>}

        <div>
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
            type="button"
            className="mp-btn mp-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </div>

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

export const RegisterView = ({ onRegister, onGoLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consentGeneral, setConsentGeneral] = useState(false);
  const [consentSensitive, setConsentSensitive] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Le prénom ou nom est requis."); return; }
    if (!email.trim()) { setError("L'email est requis."); return; }
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

        <div>
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

          <button type="button" className="mp-btn mp-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleSubmit}
            disabled={loading || !consentGeneral}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </div>

        <p className="mp-auth-divider">
          Déjà un compte ?{" "}
          <button type="button" className="mp-auth-link" onClick={onGoLogin}>Se connecter</button>
        </p>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export const ForgotPasswordView = ({ onGoLogin }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await AuthService.resetPassword(email.trim());
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
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
          <div>
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
              type="button"
              className="mp-btn mp-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </div>
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
