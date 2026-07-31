import { useState } from "react";

import { space, radius } from "../theme";
import { APPETITE_LEVELS } from "../constants";
import { Icon, EmptyState } from "./ui";
import { UserAvatar, EmojiAvatarPicker, AllergyBadge } from "./account";

export const FamilyView = ({ families, currentUser, ingredients = [], onCreateFamily, onJoinFamily, onLeaveFamily, onSetActiveFamily, onPromoteMember, onRemoveMember, onRegenerateCode, onAddMemberByEmail, onAddLocalMember, onSetMyAvatar, onSetMemberAvatar, onSetMyAppetite, onAssignMemberAppetite }) => {
  const hasNoFamily = families.length === 0;
  const [tab, setTab] = useState("create");
  const [showJoinCreate, setShowJoinCreate] = useState(hasNoFamily);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [addTab, setAddTab] = useState("email"); // "email" | "local"
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [addMemberError, setAddMemberError] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [avatarPickerFor, setAvatarPickerFor] = useState(null); // membre en cours d'édition d'avatar, ou null

  const activeFamily = families.find((f) => f.id === currentUser?.activeFamilyId) || families[0];
  const currentMember = activeFamily?.members.find((m) => m.userId === currentUser?.id);
  // Seul le propriétaire (créateur de la famille) a les droits de gestion des membres —
  // un co-admin promu a le badge mais pas ces droits (RLS reste owner-only).
  const isOwner = !!currentUser?.id && activeFamily?.ownerId === currentUser.id;

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!familyName.trim()) return;
    try { await onCreateFamily(familyName.trim()); setShowJoinCreate(false); setFamilyName(""); setError(""); }
    catch (err) { setError(err.message); }
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    try { await onJoinFamily(inviteCode.trim().toUpperCase()); setShowJoinCreate(false); setInviteCode(""); setError(""); }
    catch (err) { setError(err.message); }
  };

  const handleAddByEmail = async (e, familyId) => {
    e?.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    try { await onAddMemberByEmail(familyId, memberEmail.trim()); setMemberEmail(""); setAddMemberError(""); }
    catch (err) { setAddMemberError(err.message); }
    finally { setAddingMember(false); }
  };

  const handleAddLocal = async (e, familyId) => {
    e?.preventDefault();
    if (!memberName.trim()) return;
    setAddingMember(true);
    try { await onAddLocalMember(familyId, memberName.trim()); setMemberName(""); setAddMemberError(""); }
    catch (err) { setAddMemberError(err.message); }
    finally { setAddingMember(false); }
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
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="mp-input" style={{ flex: 1 }} value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && familyName.trim() && handleCreate(e)}
                placeholder="Nom de la famille" autoFocus />
              <button type="button" className="mp-btn mp-btn-primary mp-btn-sm"
                disabled={!familyName.trim()} onClick={handleCreate}>Créer</button>
            </div>
          )}
          {tab === "join" && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="mp-input" style={{ flex: 1, letterSpacing: "0.1em", fontWeight: 600 }}
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && inviteCode.length >= 6 && handleJoin(e)}
                placeholder="Code (6 car.)" maxLength={6} autoFocus />
              <button type="button" className="mp-btn mp-btn-primary mp-btn-sm"
                disabled={inviteCode.length < 6} onClick={handleJoin}>Rejoindre</button>
            </div>
          )}
        </div>
      )}

      {/* Aucune famille — message d'invitation */}
      {!activeFamily && !showJoinCreate && (
        <EmptyState title="Aucune famille" hint="Créez ou rejoignez une famille pour commencer à planifier vos repas." />
      )}
      {!activeFamily && showJoinCreate === false && null}

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
          {families.length > 1 && !isOwner && (
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
          {isOwner && (
            <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => onRegenerateCode(activeFamily.id)} title="Générer un nouveau code">
              Nouveau code
            </button>
          )}
        </div>

        {/* Ajouter un membre */}
        {isOwner && (
          <div style={{ marginBottom: space.md }}>
            <span className="mp-label">Ajouter un membre</span>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
              {[["email", "Par email"], ["local", "Sans compte"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => { setAddTab(id); setAddMemberError(""); }}
                  className={`mp-btn mp-btn-sm ${addTab === id ? "mp-btn-primary" : "mp-btn-secondary"}`}
                  style={{ flex: 1, justifyContent: "center" }}>{label}</button>
              ))}
            </div>
            {addMemberError && <div className="mp-auth-error" style={{ marginBottom: "0.5rem" }}>{addMemberError}</div>}
            {addTab === "email" ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="mp-input" style={{ flex: 1 }} type="email" value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && memberEmail.trim() && handleAddByEmail(e, activeFamily.id)}
                  placeholder="email@exemple.com" />
                <button type="button" className="mp-btn mp-btn-primary mp-btn-sm"
                  disabled={!memberEmail.trim() || addingMember} onClick={(e) => handleAddByEmail(e, activeFamily.id)}>Ajouter</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="mp-input" style={{ flex: 1 }} value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && memberName.trim() && handleAddLocal(e, activeFamily.id)}
                  placeholder="Prénom" />
                <button type="button" className="mp-btn mp-btn-primary mp-btn-sm"
                  disabled={!memberName.trim() || addingMember} onClick={(e) => handleAddLocal(e, activeFamily.id)}>Ajouter</button>
              </div>
            )}
          </div>
        )}

        {/* Membres */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {activeFamily.members.map((member) => {
            const isSelf = member.userId === currentUser.id;
            const memberKey = member.memberId || member.userId;
            const canEditAvatar = isSelf || (isOwner && !member.userId);
            // Verrouillé dès que renseigné par le titulaire du compte : lui seul peut
            // ensuite le changer. Sans compte, seul le propriétaire de la famille décide.
            const canEditAppetite = isSelf || (!member.userId ? isOwner : !member.appetite);
            return (
              <div key={memberKey} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0", borderBottom: "1px solid var(--line)" }}>
                <UserAvatar name={member.userName} avatarEmoji={member.avatarEmoji} size="sm"
                  onClick={canEditAvatar ? () => setAvatarPickerFor(member) : undefined} />
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    <span className="mp-micro mp-text-faint">Appétit :</span>
                    {canEditAppetite ? (
                      APPETITE_LEVELS.map((lvl) => (
                        <button key={lvl.id} type="button"
                          className={`mp-btn mp-btn-sm ${member.appetite === lvl.id ? "mp-btn-primary" : "mp-btn-secondary"}`}
                          style={{ padding: "0.1rem 0.5rem", fontSize: "0.72rem" }}
                          onClick={() => isSelf ? onSetMyAppetite(lvl.id) : onAssignMemberAppetite(activeFamily.id, member.memberId, lvl.id)}>
                          {lvl.label}
                        </button>
                      ))
                    ) : (
                      <span className="mp-badge mp-badge-neutral">
                        {member.appetite ? APPETITE_LEVELS.find((l) => l.id === member.appetite)?.label : "Non renseigné"}
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && !isSelf && (
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {member.role !== "admin" && (
                      <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => onPromoteMember(activeFamily.id, member.userId)} title="Promouvoir admin">
                        ↑ Admin
                      </button>
                    )}
                    <button type="button" className="mp-btn mp-btn-danger mp-btn-icon" onClick={() => onRemoveMember(activeFamily.id, memberKey)} aria-label="Retirer">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {avatarPickerFor && (
        <EmojiAvatarPicker
          current={avatarPickerFor.avatarEmoji}
          onClose={() => setAvatarPickerFor(null)}
          onSave={(emoji) => {
            if (avatarPickerFor.userId === currentUser.id) onSetMyAvatar(emoji);
            else onSetMemberAvatar(activeFamily.id, avatarPickerFor.memberId, emoji);
            setAvatarPickerFor(null);
          }}
        />
      )}
    </div>
  );
};
