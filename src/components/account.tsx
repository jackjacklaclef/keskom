import { useState } from "react";

import { colors, space, radius } from "../theme";
import { NEW_MEMBER_SENTINEL, ingredientCategories, AVATAR_EMOJI_GROUPS, DIET_OPTIONS } from "../constants";
import { Modal, ModalHeader, Field, TagInput, Icon, CategoryIcon, CategoryDot, EmptyState } from "./ui";
import { PrivacyModal } from "./privacy";

export const MemberModal = ({ member, onClose, onSave }) => {
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
      <div>
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
          <button type="button" className="mp-btn mp-btn-primary">Enregistrer</button>
        </div>
      </div>
    </Modal>
  );
};

// Résout une allergie { type, id } en { label, hex }
export const resolveAllergy = (allergy, ingredients) => {
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
export const IngredientRestrictionBadge = ({ item, ingredients, mode = "allergy", onRemove }) => {
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
export const AllergyBadge = ({ allergy, ingredients, onRemove }) =>
  <IngredientRestrictionBadge item={allergy} ingredients={ingredients} mode="allergy" onRemove={onRemove} />;

// Picker générique allergie / aliment non apprécié
export const IngredientRestrictionPicker = ({ current, ingredients, mode = "allergy", onClose, onSave }) => {
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
export const AllergyPicker = (props) => <IngredientRestrictionPicker {...props} mode="allergy" current={props.currentAllergies} />;

// ============================================================
// ACCOUNT VIEW
// ============================================================

export const AccountView = ({ currentUser, activeFamily, ingredients, onLogout, onDeleteAccount, onUpdateUserProfile, onSetMyAvatar }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showAllergyPicker, setShowAllergyPicker] = useState(false);
  const [showDislikePicker, setShowDislikePicker] = useState(false);
  const isDemo = currentUser.id === "demo";
  const myAvatarEmoji = activeFamily?.members.find((m) => m.userId === currentUser.id)?.avatarEmoji;

  const allergies = currentUser?.allergies || [];
  const dislikes = currentUser?.dislikes || [];
  const diets = currentUser?.diets || [];

  const toggleDiet = (id) => {
    const next = diets.includes(id) ? diets.filter((d) => d !== id) : [...diets, id];
    onUpdateUserProfile({ diets: next });
  };

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Mon compte</h1>
      </div>

      {/* Carte profil */}
      <div className="mp-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: space.xl, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setShowAvatarPicker(true)} title="Changer d'avatar" style={{
          position: "relative", width: "4rem", height: "4rem", borderRadius: "50%",
          background: "var(--clay-wash)", border: "2px solid var(--clay-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          cursor: "pointer", padding: 0,
        }}>
          {myAvatarEmoji
            ? <span style={{ fontSize: "2rem", lineHeight: 1 }}>{myAvatarEmoji}</span>
            : <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--clay)", fontFamily: "'Fraunces', Georgia, serif" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>}
          <span style={{
            position: "absolute", bottom: "-2px", right: "-2px", width: "1.35rem", height: "1.35rem", borderRadius: "50%",
            background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--paper-raised)",
          }}>
            <Icon name="edit" size={10} />
          </span>
        </button>
        <div style={{ flex: 1 }}>
          <h2 className="mp-h2" style={{ marginBottom: "0.2rem" }}>{currentUser.name}</h2>
          <p className="mp-small mp-text-soft">{currentUser.email}</p>
          {isDemo && <span className="mp-badge mp-badge-amber" style={{ marginTop: "0.4rem" }}>Compte de démonstration</span>}
        </div>
      </div>

      {showAvatarPicker && (
        <EmojiAvatarPicker
          current={myAvatarEmoji}
          onClose={() => setShowAvatarPicker(false)}
          onSave={(emoji) => { onSetMyAvatar(emoji); setShowAvatarPicker(false); }}
        />
      )}

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

      {/* Régime alimentaire */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <h3 className="mp-h3" style={{ marginBottom: space.md }}>Régime alimentaire</h3>
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

      {/* Allergies */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <h3 className="mp-h3">Allergies & intolérances</h3>
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

      {/* Aliments non appréciés */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <div>
            <h3 className="mp-h3">Aliments non appréciés</h3>
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

      {/* Règles personnalisées — placeholder backend */}
      <div className="mp-card" style={{ marginBottom: space.xl }}>
        <h3 className="mp-h3" style={{ marginBottom: "0.4rem" }}>Règles personnalisées</h3>
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

// Avatar utilisateur réutilisable
export const UserAvatar = ({ name, size = "md", avatarEmoji, onClick }) => {
  const sz = size === "sm" ? "1.75rem" : "2.25rem";
  const fs = size === "sm" ? "0.7rem" : "0.8rem";
  const emojiFs = size === "sm" ? "1rem" : "1.2rem";
  return (
    <div onClick={onClick} style={{
      width: sz, height: sz, borderRadius: "50%", background: "var(--clay-wash)", border: "1px solid var(--clay-soft)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      cursor: onClick ? "pointer" : "default",
    }}>
      {avatarEmoji
        ? <span style={{ fontSize: emojiFs, lineHeight: 1 }}>{avatarEmoji}</span>
        : <span style={{ fontSize: fs, fontWeight: 700, color: "var(--clay)" }}>{name?.charAt(0).toUpperCase()}</span>}
    </div>
  );
};

export const EmojiAvatarPicker = ({ current, onClose, onSave }) => (
  <Modal onClose={onClose} width="420px">
    <ModalHeader title="Choisir un avatar" onClose={onClose} />
    <div style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {AVATAR_EMOJI_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
            {group.label}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {group.emojis.map(([emoji, label]) => (
              <button key={emoji} type="button" title={label} onClick={() => onSave(emoji)}
                style={{
                  width: "2.6rem", height: "2.6rem", borderRadius: "50%", fontSize: "1.35rem",
                  border: `1.5px solid ${current === emoji ? "var(--clay)" : "var(--line)"}`,
                  background: current === emoji ? "var(--clay-wash)" : "var(--paper-sunken)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Modal>
);

// ============================================================
// NOTIFICATIONS VIEW
// ============================================================

export const NotificationToggle = ({ label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
    <input type="checkbox" className="mp-checkbox" />
    <span className="mp-small">{label}</span>
  </label>
);

export const NotificationsView = () => (
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
