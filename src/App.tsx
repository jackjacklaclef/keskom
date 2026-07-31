import React, { useState, useEffect, useMemo } from "react";

import { colors, space, radius, GlobalStyle } from "./theme";
import {
  MEAL_TYPES, NAV_PRIMARY, NAV_SECONDARY, QUANTITY_UNITS,
  RECIPE_CATEGORIES, DAYS_OF_WEEK, MONTHS, DIET_OPTIONS, PRIVACY_CONTENT,
  AVATAR_EMOJI_GROUPS, APPETITE_LEVELS, NEW_MEMBER_SENTINEL, STORAGE_KEYS,
  ingredientCategories,
} from "./constants";

import {
  Icon, CategoryIcon, Modal, ModalHeader, Field, EmptyState, useToast, Toast,
  CategoryDot, TagInput, NavButton, LogoMark, AuthLogo, PasswordInput,
} from "./components/ui";


import type { AppUser } from "./types";
import { getSupabase } from "./lib/supabaseClient";
import {
  loadFromStorage, saveToStorage, DEMO_USER, DEMO_PASSWORD, DEMO_FAMILY, generateInviteCode,
  initialRecipes, initialMealPlans, initialShoppingList, initialIngredients,
} from "./lib/storage";
import { AuthService } from "./lib/authService";
import {
  fetchIngredients, fetchRecipeCategoryMap, fetchIngredientCategoryMap, fetchUserPreferences,
  saveFoodRestrictions, saveDiets, fetchRecipesForUser, saveRecipeIngredients, saveRecipeSteps,
  fetchMealPlansForFamily, upsertMealSlot, fetchShoppingListForFamily, fetchWeekTemplatesForFamily,
  fetchFamiliesForUser,
} from "./lib/dataLayer";
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

// ============================================================
// SIDEBAR / NAVIGATION
// ============================================================


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
      <p className="mp-micro mp-text-faint" title={__BUILD_TIME__} style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: 0 }}>v{__APP_VERSION__}</p>
    </div>
  </>
);


const FamilySelector = ({ families, activeFamily, onSetActiveFamily, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const hasMultiple = families.length > 1;
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => hasMultiple && setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", background: "var(--sage-wash)", border: "1px solid var(--sage-soft)", borderRadius: radius.sm, padding: "0.35rem 0.6rem", cursor: hasMultiple ? "pointer" : "default", fontFamily: "inherit" }}>
        <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--sage)", flexShrink: 0 }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--sage)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
          {activeFamily?.name || "Aucune famille"}
        </span>
        {hasMultiple && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>
      {open && hasMultiple && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 399 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 400, overflow: "hidden", minWidth: "160px" }}>
            {families.map((f) => {
              const isActive = f.id === activeFamily?.id;
              return (
                <button key={f.id} type="button" onClick={() => { onSetActiveFamily(f.id); setOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", padding: "0.6rem 0.75rem", background: isActive ? "var(--sage-wash)" : "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "var(--paper-sunken)")}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: isActive ? "var(--sage)" : "var(--line)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: isActive ? 700 : 400, color: isActive ? "var(--sage)" : "var(--ink)", flex: 1 }}>{f.name}</span>
                  {isActive && <Icon name="check" size={13} color="var(--sage)" />}
                </button>
              );
            })}
            <button type="button" onClick={() => { onNavigate("family"); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.55rem 0.75rem", background: "var(--paper-sunken)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", color: "var(--clay)", fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--paper-sunken)"}>
              <Icon name="plus" size={12} /> Gérer les familles
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const Sidebar = ({ currentView, onNavigate, darkMode, onToggleDark, currentUser, onLogout, families = [], activeFamily, onSetActiveFamily }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const secondaryActive = NAV_SECONDARY.some((i) => i.id === currentView);
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="mp-hide-mobile" style={{ width: "210px", flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 0, height: "100vh", overflowY: "auto", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", background: "var(--paper-raised)" }}>
        <div style={{ padding: "1.1rem 1rem 0.85rem", borderBottom: "1px solid var(--line)" }}>
          <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: activeFamily ? "0.75rem" : 0 }} onClick={() => onNavigate("calendar")}>
            <LogoMark />
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1rem", color: "var(--sage)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Keskon'm</span>
          </div>
          {activeFamily && <FamilySelector families={families} activeFamily={activeFamily} onSetActiveFamily={onSetActiveFamily} onNavigate={onNavigate} />}
        </div>
        <div style={{ padding: "0.75rem 0.75rem 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {NAV_PRIMARY.map((item) => <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} />)}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <p className="mp-micro mp-text-faint" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, padding: "0 0.5rem", marginBottom: "0.35rem" }}>Paramètres</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              {NAV_SECONDARY.map((item) => <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} size="sm" />)}
            </div>
          </div>
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--line)" }}>
          <button type="button" onClick={onToggleDark} className="mp-btn mp-btn-ghost" style={{ justifyContent: "flex-start", width: "100%", marginBottom: "0.5rem" }}>
            <Icon name={darkMode ? "sun" : "moon"} size={15} /> {darkMode ? "Mode clair" : "Mode sombre"}
          </button>
          {currentUser && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.6rem" }}>
              <button type="button" onClick={() => onNavigate("account")}
                style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", background: currentView === "account" ? "var(--clay-wash)" : "transparent", border: "none", borderRadius: radius.sm, padding: "0.45rem 0.5rem", cursor: "pointer", textAlign: "left", transition: "background 100ms" }}>
                <div style={{ width: "1.8rem", height: "1.8rem", borderRadius: "50%", background: "var(--clay-wash)", border: "1.5px solid var(--clay-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clay)" }}>{currentUser.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="mp-small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</p>
                  <p className="mp-micro mp-text-faint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</p>
                </div>
              </button>
              <button type="button" className="mp-btn mp-btn-ghost" style={{ justifyContent: "flex-start", width: "100%", color: "var(--berry)", marginTop: "0.15rem" }} onClick={onLogout}>
                <Icon name="x" size={13} /> Se déconnecter
              </button>
            </div>
          )}
          <p className="mp-micro mp-text-faint" title={__BUILD_TIME__} style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: 0 }}>v{__APP_VERSION__}</p>
        </div>
      </nav>
      {/* Mobile topbar */}
      <header className="mp-hide-desktop" style={{ position: "fixed", top: 0, left: 0, right: 0, height: "52px", background: "var(--paper-raised)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 0.75rem", zIndex: 900, gap: "0.5rem" }}>
        <div onClick={() => onNavigate("calendar")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <LogoMark />
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--sage)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Keskon'm</span>
        </div>
        {activeFamily && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ maxWidth: "160px", width: "100%" }}>
              <FamilySelector families={families} activeFamily={activeFamily} onSetActiveFamily={onSetActiveFamily} onNavigate={onNavigate} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <button type="button" onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", display: "flex", padding: "0.2rem" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          {currentUser && (
            <button type="button" onClick={() => onNavigate("account")}
              style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: currentView === "account" ? "var(--clay)" : "var(--clay-wash)", border: "1.5px solid var(--clay-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: currentView === "account" ? "#fff" : "var(--clay)" }}>{currentUser.name?.charAt(0).toUpperCase()}</span>
            </button>
          )}
        </div>
      </header>
      {/* Bottom nav mobile */}
      <nav className="mp-hide-desktop" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--paper-raised)", borderTop: "1px solid var(--line)", display: "flex", zIndex: 900, padding: "0.2rem 0" }}>
        {NAV_PRIMARY.map((item) => {
          const active = currentView === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "0.45rem 0.1rem", background: "transparent", border: "none", color: active ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer", transition: "color 100ms" }}>
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setDrawerOpen(true)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "0.45rem 0.1rem", background: "transparent", border: "none", color: secondaryActive ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          <span style={{ fontSize: "0.65rem", fontWeight: secondaryActive ? 600 : 400 }}>Plus</span>
        </button>
      </nav>
      {drawerOpen && <MobileDrawer currentView={currentView} onNavigate={onNavigate} darkMode={darkMode} onToggleDark={onToggleDark} currentUser={currentUser} onLogout={onLogout} onClose={() => setDrawerOpen(false)} />}
    </>
  );
};

// ============================================================
// CALENDAR VIEW
// ============================================================

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

// Pile compacte d'avatars des convives présents à un repas — utilisée dans les cartes
// du planning (jour, semaine, mois) pour voir en un coup d'œil qui participe.
const AttendeeAvatarStack = ({ attendeeIds, familyMembers = [], max = 4 }) => {
  if (!attendeeIds || attendeeIds.length === 0 || familyMembers.length === 0) return null;

  const validMemberIds = familyMembers.filter((m) => m.memberId).map((m) => m.memberId);
  const allPresent = validMemberIds.length > 0 && validMemberIds.every((id) => attendeeIds.includes(id));
  if (allPresent) {
    return (
      <div style={{ marginTop: "0.3rem" }}>
        <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <Icon name="users" size={11} /> Tout le monde
        </span>
      </div>
    );
  }

  const members = attendeeIds.map((id) => familyMembers.find((m) => m.memberId === id)).filter(Boolean);
  if (members.length === 0) return null;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: "0.3rem" }}>
      {shown.map((m, i) => (
        <div key={m.memberId} title={m.userName} style={{
          width: "1.1rem", height: "1.1rem", borderRadius: "50%", background: "var(--clay-wash)",
          border: "1.5px solid var(--paper-raised)", display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: i === 0 ? 0 : "-0.35rem", flexShrink: 0, zIndex: shown.length - i,
        }}>
          {m.avatarEmoji
            ? <span style={{ fontSize: "0.62rem", lineHeight: 1 }}>{m.avatarEmoji}</span>
            : <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--clay)" }}>{m.userName?.charAt(0).toUpperCase()}</span>}
        </div>
      ))}
      {extra > 0 && <span className="mp-micro mp-text-faint" style={{ marginLeft: "0.25rem" }}>+{extra}</span>}
    </div>
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

  const handleSaveSlot = (recipeIds, attendeeIds) => {
    const type = editingSlot.type;
    const meal = getMeal(type);
    if (meal) onUpdateMeal(meal.id, recipeIds, "normal", attendeeIds);
    else onAddMeal({ date: dateStr, type, recipeIds, status: "normal", attendeeIds });
    setEditingSlot(null);
    setFlashedSlot(type); setTimeout(() => setFlashedSlot(null), 650);
  };

  const handleSaveStatus = (status, recipeIds, attendeeIds) => {
    const type = editingSlot.type;
    const meal = getMeal(type);
    if (meal) onUpdateMeal(meal.id, recipeIds, status, attendeeIds);
    else onAddMeal({ date: dateStr, type, recipeIds, status, attendeeIds });
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
                    : <>
                        <span className="mp-small" style={{ color: "var(--ink)", lineHeight: 1.4, paddingRight: "1.4rem" }}>{names.join(", ")}</span>
                        <AttendeeAvatarStack attendeeIds={meal?.attendeeIds} familyMembers={familyMembers} />
                      </>
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
          familyMembers={familyMembers}
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
  // Vue personnalisée
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const toggleBreakfast = () => {
    const next = !showBreakfast;
    setShowBreakfast(next);
    try { localStorage.setItem("mealPlanner_showBreakfast", String(next)); } catch {}
  };

  // Filtrer les MEAL_TYPES selon showBreakfast
  const visibleMealTypes = MEAL_TYPES.filter((t) => t.id !== "breakfast" || showBreakfast);

  // Algo suggestion — peut s'appliquer sur un ensemble de dates
  const suggestForDates = (dates) => {
    const today = todayStr();
    const futureDates = dates.filter((d) => d >= today);
    if (futureDates.length === 0) return 0;

    const usedIds = new Set(
      mealPlans.filter((mp) => futureDates.includes(mp.date)).flatMap((mp) => mp.recipeIds || [])
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
    futureDates.forEach((dateStr) => {
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
    if (viewMode === "custom") return; // navigation libre via les date pickers
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    setSelectedDate(null);
  };
  const goToNext = () => {
    if (viewMode === "custom") return;
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    setSelectedDate(null);
  };
  const goToToday = () => {
    if (viewMode === "custom") {
      const today = todayStr();
      const d = new Date(); d.setDate(d.getDate() + 6);
      setCustomStart(today);
      setCustomEnd(d.toISOString().split("T")[0]);
    } else {
      setCurrentDate(new Date());
      setSelectedDate(null);
    }
  };

  // Jours de la plage personnalisée
  const customDays = useMemo(() => {
    if (viewMode !== "custom") return [];
    const days = [];
    const start = new Date(customStart + "T12:00:00");
    const end = new Date(customEnd + "T12:00:00");
    const current = new Date(start);
    while (current <= end && days.length < 31) { // max 31 jours
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [customStart, customEnd, viewMode]);

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
        {/* Flèches + titre — masqués en vue custom */}
        {viewMode !== "custom" && (
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-icon" onClick={goToPrevious} aria-label="Précédent">
            <Icon name="chevronLeft" size={15} />
          </button>
        )}
        <h2 className="mp-h2" style={{ minWidth: viewMode === "custom" ? "auto" : "10rem", textAlign: viewMode === "custom" ? "left" : "center" }}>
          {viewMode === "month"
            ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : viewMode === "week"
            ? `Semaine du ${calendarWeeks[0][0].getDate()} ${MONTHS[calendarWeeks[0][0].getMonth()].slice(0, 3)}`
            : viewMode === "custom" && customDays.length > 0
            ? `${customDays[0].getDate()} ${MONTHS[customDays[0].getMonth()].slice(0,3)} — ${customDays[customDays.length-1].getDate()} ${MONTHS[customDays[customDays.length-1].getMonth()].slice(0,3)}`
            : "Plage personnalisée"}
        </h2>
        {viewMode !== "custom" && (
          <button type="button" className="mp-btn mp-btn-secondary mp-btn-icon" onClick={goToNext} aria-label="Suivant">
            <Icon name="chevronRight" size={15} />
          </button>
        )}
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={goToToday}>
          Aujourd'hui
        </button>

        <div style={{ flex: 1 }} />

        {/* Toggle vue — Semaine / Mois / Perso */}
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: radius.sm, overflow: "hidden" }}>
          {[["week","Semaine"], ["month","Mois"], ["custom","Perso"]].map(([v, label]) => (
            <button key={v} type="button"
              onClick={() => setViewMode(v)}
              style={{
                padding: "0.3rem 0.65rem", border: "none", cursor: "pointer",
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

      {/* Sélecteur de plage — affiché uniquement en vue Perso */}
      {viewMode === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem", flexWrap: "wrap", padding: "0.6rem 0.75rem", background: "var(--paper-sunken)", borderRadius: radius.sm, border: "1px solid var(--line)" }}>
          <Icon name="calendar" size={14} color="var(--clay)" />
          <span className="mp-small mp-text-soft">Du</span>
          <input type="date" className="mp-input" style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.82rem" }}
            value={customStart} onChange={(e) => {
              setCustomStart(e.target.value);
              if (e.target.value > customEnd) setCustomEnd(e.target.value);
            }} />
          <span className="mp-small mp-text-soft">au</span>
          <input type="date" className="mp-input" style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.82rem" }}
            value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} />
          <span className="mp-micro mp-text-faint">({customDays.length} jour{customDays.length > 1 ? "s" : ""})</span>
        </div>
      )}

      {/* ========== VUE SEMAINE ========== */}
      {viewMode === "week" && calendarWeeks[0] && (() => {
        const week = calendarWeeks[0];
        const weekDateStr = week[0].toISOString().split("T")[0];

        return (
          <div>
            {/* ── Ligne 2 : actions semaine ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              marginBottom: "0.85rem", position: "relative",
            }}>
              {/* Groupe gauche scrollable */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", overflowX: "auto", flex: 1, paddingBottom: "2px" }}>
                {/* Toggle PDJ */}
                <button
                  type="button"
                  className={`mp-btn mp-btn-sm ${showBreakfast ? "mp-btn-primary" : "mp-btn-secondary"}`}
                  onClick={toggleBreakfast}
                  style={{ flexShrink: 0 }}
                >
                  <Icon name="sunrise" size={13} /> PDJ
                </button>

                {/* Séparateur */}
                <div style={{ width: "1px", height: "1.5rem", background: "var(--line)", flexShrink: 0, margin: "0 0.1rem" }} />

                {/* Suggérer */}
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                  onClick={() => suggestForDates(week.map((d) => d.toISOString().split("T")[0]))}
                  title="Attribuer aléatoirement des plats sur les créneaux vides">
                  <Icon name="dice" size={13} /> Suggérer
                </button>

                {/* Dupliquer */}
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                  onClick={() => { setWeekActionDate(weekDateStr); setWeekActionType("duplicate"); }}>
                  <Icon name="copy" size={13} /> Dupliquer
                </button>

                {/* Modèle — hors du scroll pour que le dropdown ne soit pas coupé */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm"
                    onClick={() => setShowWeekTemplates((v) => !v)}>
                    <Icon name="calendar" size={13} /> Modèle
                  </button>
                  {showWeekTemplates && (
                    <div style={{
                      position: "fixed",
                      background: "var(--paper-raised)", border: "1px solid var(--line)",
                      borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      zIndex: 500, minWidth: "200px", overflow: "hidden",
                      marginTop: "4px",
                    }}
                    ref={(el) => {
                      if (el) {
                        const btn = el.previousSibling;
                        if (btn) {
                          const r = btn.getBoundingClientRect();
                          el.style.top = (r.bottom + 4) + "px";
                          el.style.left = r.left + "px";
                        }
                      }
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
              </div>

              {/* Vider — toujours visible à droite */}
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
                              : <>
                                  <span className="mp-small" style={{ color: "var(--ink)", lineHeight: 1.4 }}>{names.join(", ")}</span>
                                  <AttendeeAvatarStack attendeeIds={meal?.attendeeIds} familyMembers={familyMembers} />
                                </>
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
                familyMembers={familyMembers}
                onClose={() => setWeekEditingSlot(null)}
                onSave={(recipeIds, attendeeIds) => {
                  const meal = mealPlans.find((mp) => mp.date === weekEditingSlot.dateStr && mp.type === weekEditingSlot.type);
                  if (meal) onUpdateMeal(meal.id, recipeIds, "normal", attendeeIds);
                  else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status: "normal", attendeeIds });
                  setWeekEditingSlot(null);
                }}
                onSaveStatus={(status, recipeIds, attendeeIds) => {
                  const meal = mealPlans.find((mp) => mp.date === weekEditingSlot.dateStr && mp.type === weekEditingSlot.type);
                  if (meal) onUpdateMeal(meal.id, recipeIds, status, attendeeIds);
                  else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status, attendeeIds });
                  setWeekEditingSlot(null);
                }}
              />
            )}
          </div>
        );
      })()}

      {/* ========== VUE PERSONNALISÉE ========== */}
      {viewMode === "custom" && customDays.length > 0 && (() => {
        const customDateStr = customDays[0].toISOString().split("T")[0];
        return (
          <div>
            {/* Barre d'actions — identique à la vue semaine */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.85rem", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", overflowX: "auto", flex: 1, paddingBottom: "2px" }}>
                <button type="button" className={`mp-btn mp-btn-sm ${showBreakfast ? "mp-btn-primary" : "mp-btn-secondary"}`} onClick={toggleBreakfast} style={{ flexShrink: 0 }}>
                  <Icon name="sunrise" size={13} /> PDJ
                </button>
                <div style={{ width: "1px", height: "1.5rem", background: "var(--line)", flexShrink: 0, margin: "0 0.1rem" }} />
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                  onClick={() => suggestForDates(customDays.map((d) => d.toISOString().split("T")[0]))}
                  title="Attribuer des plats sur les créneaux vides futurs">
                  <Icon name="dice" size={13} /> Suggérer
                </button>
                <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ flexShrink: 0 }}
                  onClick={() => { setWeekActionDate(customDateStr); setWeekActionType("duplicate"); }}>
                  <Icon name="copy" size={13} /> Dupliquer
                </button>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setShowWeekTemplates((v) => !v)}>
                    <Icon name="calendar" size={13} /> Modèle
                  </button>
                  {showWeekTemplates && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowWeekTemplates(false)} />
                      <div style={{ position: "fixed", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 500, minWidth: "200px", overflow: "hidden", marginTop: "4px" }}
                        ref={(el) => { if (el) { const btn = el.previousSibling?.previousSibling; if (btn) { const r = btn.getBoundingClientRect(); el.style.top = (r.bottom+4)+"px"; el.style.left = r.left+"px"; } } }}>
                        {weekTemplates.length === 0 && <p className="mp-small mp-text-faint" style={{ padding: "0.6rem 0.85rem" }}>Aucun modèle.</p>}
                        {weekTemplates.map((tpl) => (
                          <button key={tpl.id} type="button"
                            onClick={() => { setWeekActionDate(customDateStr); setWeekActionType("apply-template"); setWeekActionTemplate(tpl); setShowWeekTemplates(false); }}
                            style={{ display: "block", width: "100%", padding: "0.55rem 0.85rem", background: "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: "0.85rem", color: "var(--ink)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            {tpl.name}
                          </button>
                        ))}
                        <button type="button" onClick={() => { setShowWeekTemplates(false); onNavigate("preferences"); }}
                          style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", padding: "0.55rem 0.85rem", background: "var(--paper-sunken)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--clay)", fontWeight: 600 }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "var(--paper-sunken)"}>
                          <Icon name="plus" size={13} /> Créer un modèle
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button type="button" className="mp-btn mp-btn-sm" style={{ flexShrink: 0, color: "var(--berry)", border: "1px solid var(--berry-wash)", background: "transparent" }}
                onClick={() => { setWeekActionDate(customDateStr); setWeekActionType("clear"); }}>
                <Icon name="trash" size={13} /> Vider
              </button>
            </div>

            {/* Grille — même structure que la vue semaine */}
            <div className="mp-week-grid" style={{ gridTemplateColumns: `2.75rem repeat(${visibleMealTypes.length}, 1fr)` }}>
              {/* En-têtes repas */}
              <div />
              {visibleMealTypes.map((type) => {
                const dotColor = type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)";
                return (
                  <div key={type.id} style={{ textAlign: "center", padding: "0.4rem 0.3rem", borderRadius: radius.sm, background: "var(--paper-sunken)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span className="mp-week-meal-label-full mp-micro" style={{ fontWeight: 700, color: dotColor, textTransform: "uppercase" }}>{type.label}</span>
                    <span className="mp-week-meal-label-short mp-micro" style={{ fontWeight: 700, color: dotColor, textTransform: "uppercase" }}>{type.short}</span>
                  </div>
                );
              })}

              {/* Lignes — une par jour de la plage */}
              {customDays.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const isToday = dateStr === todayStr();
                const isPast = dateStr < todayStr();
                const dow = date.getDay();
                const dayLabel = DAYS_OF_WEEK[dow === 0 ? 6 : dow - 1];
                return (
                  <React.Fragment key={dateStr}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0.4rem 0.3rem", borderRadius: radius.sm, background: isToday ? "var(--clay)" : "var(--paper-sunken)", border: `1px solid ${isToday ? "var(--clay)" : "var(--line)"}`, minHeight: "4rem", opacity: isPast ? 0.55 : 1 }}>
                      <span className="mp-week-day-label" style={{ color: isToday ? "rgba(255,255,255,0.75)" : "var(--ink-faint)" }}>{dayLabel}</span>
                      <span className="mp-week-day-num" style={{ color: isToday ? "#fff" : "var(--ink)" }}>{date.getDate()}</span>
                      <span className="mp-micro" style={{ color: isToday ? "rgba(255,255,255,0.6)" : "var(--ink-faint)" }}>{MONTHS[date.getMonth()].slice(0,3)}</span>
                    </div>
                    {visibleMealTypes.map((type) => {
                      const meal = getMeal(dateStr, type.id);
                      const status = meal?.status || "normal";
                      const names = status === "normal" ? (meal?.recipeIds || []).map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean) : [];
                      const dotColor = type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)";
                      const washColor = type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)";
                      const bgColor = status === "restaurant" ? "var(--amber-wash)" : status === "skip" ? "var(--paper-sunken)" : names.length > 0 ? washColor : "var(--paper-raised)";
                      const borderColor = status === "restaurant" ? "var(--amber)" : status === "skip" ? "var(--line)" : names.length > 0 ? dotColor : "var(--line)";
                      return (
                        <button key={type.id} type="button"
                          onClick={() => !isPast && setWeekEditingSlot({ dateStr, type: type.id, mealId: meal?.id || null })}
                          style={{ width: "100%", boxSizing: "border-box", background: bgColor, border: `1px solid ${borderColor}`, borderRadius: radius.sm, padding: "0.55rem 0.65rem", cursor: isPast ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 100ms, border-color 100ms", minHeight: "4rem", opacity: isPast ? 0.55 : 1 }}>
                          {status === "restaurant" && <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--amber)" }}><Icon name="restaurant" size={13} /><span className="mp-small" style={{ fontWeight: 600 }}>Restaurant</span></div>}
                          {status === "skip" && <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--ink-faint)" }}><Icon name="skip" size={13} /><span className="mp-small">Pas de repas</span></div>}
                          {status === "normal" && (names.length === 0 ? <span className="mp-small mp-text-faint">{isPast ? "—" : "+ Ajouter"}</span> : <><span className="mp-small" style={{ color: "var(--ink)", lineHeight: 1.4 }}>{names.join(", ")}</span><AttendeeAvatarStack attendeeIds={meal?.attendeeIds} familyMembers={familyMembers} max={3} /></>)}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modales partagées avec la vue semaine */}
            {weekEditingSlot && (
              <RecipeSelectionModal recipes={recipes} meal={weekEditingSlot.mealId ? mealPlans.find((mp) => mp.id === weekEditingSlot.mealId) : null}
                mealType={weekEditingSlot.type} date={weekEditingSlot.dateStr} recentRecipeIds={recentRecipeIds} familyMembers={familyMembers}
                onClose={() => setWeekEditingSlot(null)}
                onSave={(recipeIds, attendeeIds) => { const meal = getMeal(weekEditingSlot.dateStr, weekEditingSlot.type); if (meal) onUpdateMeal(meal.id, recipeIds, "normal", attendeeIds); else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status: "normal", attendeeIds }); setWeekEditingSlot(null); }}
                onSaveStatus={(status, recipeIds, attendeeIds) => { const meal = getMeal(weekEditingSlot.dateStr, weekEditingSlot.type); if (meal) onUpdateMeal(meal.id, recipeIds, status, attendeeIds); else onAddMeal({ date: weekEditingSlot.dateStr, type: weekEditingSlot.type, recipeIds, status, attendeeIds }); setWeekEditingSlot(null); }}
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

const RecipeSelectionModal = ({ recipes, meal, mealType, date, onClose, onSave, onSaveStatus, recentRecipeIds = [], familyMembers = [] }) => {
  const [selected, setSelected] = useState(meal?.recipeIds || []);
  const [status, setStatus] = useState(meal?.status || "normal");
  const [filterCat, setFilterCat] = useState(null);
  const [search, setSearch] = useState("");
  const allMemberIds = useMemo(() => familyMembers.filter((m) => m.memberId).map((m) => m.memberId), [familyMembers]);
  const [attendeeIds, setAttendeeIds] = useState(meal?.attendeeIds ?? allMemberIds);
  const typeLabel = MEAL_TYPES.find((t) => t.id === mealType)?.label || mealType;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAttendee = (memberId) => setAttendeeIds((prev) => prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]);
  const allAttending = allMemberIds.length > 0 && allMemberIds.every((id) => attendeeIds.includes(id));
  const toggleAllAttendees = () => setAttendeeIds(allAttending ? [] : allMemberIds);

  const handleSave = () => {
    if (status !== "normal") {
      onSaveStatus(status, [], attendeeIds);
    } else {
      onSave(selected, attendeeIds);
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

      {/* Convives réellement présents (pour allergies, goûts et quantités) */}
      {familyMembers.length > 0 && (
        <div style={{
          marginBottom: "0.9rem", paddingBottom: "0.9rem", borderBottom: "1px solid var(--line)",
          opacity: status !== "normal" ? 0.4 : 1, pointerEvents: status !== "normal" ? "none" : "auto",
        }}>
          <span className="mp-small" style={{ fontWeight: 600, display: "block" }}>Convives présents</span>
          <span className="mp-micro mp-text-faint" style={{ display: "block", marginBottom: "0.5rem" }}>Pour les allergies, goûts et quantités</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            <button type="button" onClick={toggleAllAttendees}
              style={{
                padding: "0.25rem 0.6rem", borderRadius: radius.pill, cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.78rem", fontWeight: allAttending ? 700 : 500,
                border: `1.5px solid ${allAttending ? "var(--sage)" : "var(--line)"}`,
                background: allAttending ? "var(--sage-wash)" : "transparent",
                color: allAttending ? "var(--sage)" : "var(--ink-soft)",
              }}>
              Tout le monde
            </button>
            {familyMembers.filter((m) => m.memberId).map((m) => {
              const active = attendeeIds.includes(m.memberId);
              return (
                <button key={m.memberId} type="button" onClick={() => toggleAttendee(m.memberId)}
                  style={{
                    padding: "0.25rem 0.6rem", borderRadius: radius.pill, cursor: "pointer",
                    fontFamily: "inherit", fontSize: "0.78rem", fontWeight: active ? 700 : 500,
                    border: `1.5px solid ${active ? "var(--clay)" : "var(--line)"}`,
                    background: active ? "var(--clay-wash)" : "transparent",
                    color: active ? "var(--clay)" : "var(--ink-soft)",
                  }}>
                  {m.userName}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
  const [showSteps, setShowSteps] = useState(!!(recipe?.steps?.length));
  const [recipeIngredients, setRecipeIngredients] = useState(recipe?.ingredients || []);
  const [tags, setTags] = useState(recipe?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [steps, setSteps] = useState(recipe?.steps || []);
  const [stepTitleInput, setStepTitleInput] = useState("");
  const [stepBodyInput, setStepBodyInput] = useState("");
  const [stepMinutesInput, setStepMinutesInput] = useState("");
  const [stepPhotoUrl, setStepPhotoUrl] = useState(null);
  const [uploadingStepPhoto, setUploadingStepPhoto] = useState(false);
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

  const handleStepPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStepPhoto(true);
    try {
      const sb = await getSupabase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const { error } = await sb.storage.from("recipe-step-photos").upload(path, file);
      if (error) throw error;
      const { data } = sb.storage.from("recipe-step-photos").getPublicUrl(path);
      setStepPhotoUrl(data.publicUrl);
    } catch { /* upload silencieusement ignoré, l'utilisateur peut réessayer */ }
    finally { setUploadingStepPhoto(false); }
  };

  const addStep = () => {
    if (!stepBodyInput.trim()) return;
    const minutes = parseFloat(stepMinutesInput.replace(",", "."));
    setSteps((prev) => [...prev, {
      id: `new-${Date.now()}`,
      title: stepTitleInput.trim(),
      body: stepBodyInput.trim(),
      timerSeconds: minutes > 0 ? Math.round(minutes * 60) : null,
      mediaUrl: stepPhotoUrl,
    }]);
    setStepTitleInput(""); setStepBodyInput(""); setStepMinutesInput(""); setStepPhotoUrl(null);
  };
  const removeStep = (idx) => setSteps((prev) => prev.filter((_, i) => i !== idx));
  const moveStep = (idx, dir) => setSteps((prev) => {
    const target = idx + dir;
    if (target < 0 || target >= prev.length) return prev;
    const copy = [...prev];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    return copy;
  });

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: recipe?.id || Date.now().toString(), name: name.trim(), category, portions, description: description.trim(), ingredients: recipeIngredients, tags, steps, parentId: recipe?.parentId || null, rootId: recipe?.rootId || null, variantName: variantName.trim() || null });
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

      {/* Étapes */}
      {showSteps ? (
        <div style={{ marginBottom: "0.65rem" }}>
          <span className="mp-label">Étapes{steps.length > 0 && ` (${steps.length})`}</span>

          {steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.5rem" }}>
              {steps.map((step, idx) => (
                <div key={step.id || idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.5rem", background: "var(--paper-sunken)", borderRadius: radius.sm, border: "1px solid var(--line)" }}>
                  <span className="mp-badge mp-badge-neutral" style={{ flexShrink: 0, marginTop: "0.1rem" }}>{idx + 1}</span>
                  {step.mediaUrl && (
                    <img src={step.mediaUrl} alt="" style={{ width: "2.6rem", height: "2.6rem", objectFit: "cover", borderRadius: radius.sm, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {step.title && <p className="mp-small" style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{step.title}</p>}
                    <p className="mp-small mp-text-soft" style={{ whiteSpace: "pre-wrap" }}>{step.body}</p>
                    {step.timerSeconds > 0 && (
                      <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", marginTop: "0.2rem" }}>
                        <Icon name="clock" size={11} /> {Math.round(step.timerSeconds / 60)} min
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flexShrink: 0 }}>
                    <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                      style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "var(--ink-faint)" : "var(--ink-soft)", padding: "0.1rem", display: "flex" }} aria-label="Monter">
                      <Icon name="chevronLeft" size={13} />
                    </button>
                    <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}
                      style={{ background: "none", border: "none", cursor: idx === steps.length - 1 ? "default" : "pointer", color: idx === steps.length - 1 ? "var(--ink-faint)" : "var(--ink-soft)", padding: "0.1rem", display: "flex" }} aria-label="Descendre">
                      <Icon name="chevronRight" size={13} />
                    </button>
                    <button type="button" onClick={() => removeStep(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", padding: "0.1rem", display: "flex" }} aria-label="Supprimer">
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: "1px solid var(--line)", borderRadius: radius.md, padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <input className="mp-input" style={{ fontSize: "0.82rem" }} value={stepTitleInput}
              onChange={(e) => setStepTitleInput(e.target.value)} placeholder="Titre de l'étape (optionnel)" />
            <textarea className="mp-textarea" style={{ minHeight: "2.2rem", fontSize: "0.82rem" }} value={stepBodyInput}
              onChange={(e) => setStepBodyInput(e.target.value)} placeholder="Description de l'étape..." />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Icon name="clock" size={13} />
                <input className="mp-input" type="number" min="0" step="0.5" style={{ width: "3.6rem", fontSize: "0.8rem" }}
                  value={stepMinutesInput} onChange={(e) => setStepMinutesInput(e.target.value)} placeholder="min" />
              </div>
              <label className="mp-btn mp-btn-secondary mp-btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                <Icon name="camera" size={13} /> {uploadingStepPhoto ? "Envoi..." : stepPhotoUrl ? "Photo ✓" : "Photo"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleStepPhotoChange} disabled={uploadingStepPhoto} />
              </label>
              {stepPhotoUrl && (
                <button type="button" onClick={() => setStepPhotoUrl(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex" }} aria-label="Retirer la photo">
                  <Icon name="x" size={13} />
                </button>
              )}
              <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" style={{ marginLeft: "auto" }}
                onClick={addStep} disabled={!stepBodyInput.trim()}>
                <Icon name="plus" size={13} /> Ajouter l'étape
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AddLink label={`Ajouter des étapes${steps.length > 0 ? ` (${steps.length})` : ""}`} onClick={() => setShowSteps(true)} />
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

// Mode cuisine — affiche les étapes une par une, en plein écran de la modale
// Minuteur d'étape — remonté (via key={stepIndex} côté appelant) à chaque changement
// d'étape pour repartir de zéro sans logique de synchronisation supplémentaire.
const StepTimer = ({ seconds }) => {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);

  const done = remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.8rem", background: done ? "var(--sage-wash)" : "var(--paper-sunken)", borderRadius: radius.sm, border: "1px solid var(--line)", marginBottom: space.md }}>
      <Icon name="clock" size={16} />
      <span className="mp-h3" style={{ fontVariantNumeric: "tabular-nums", minWidth: "3.2rem" }}>{mm}:{ss}</span>
      {done ? (
        <span className="mp-small" style={{ color: "var(--sage)", fontWeight: 600 }}>Terminé</span>
      ) : (
        <button type="button" className="mp-btn mp-btn-secondary mp-btn-sm" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Démarrer"}
        </button>
      )}
      <button type="button" className="mp-btn mp-btn-ghost mp-btn-sm" onClick={() => { setRemaining(seconds); setRunning(false); }}>
        Réinitialiser
      </button>
    </div>
  );
};

const CookModeModal = ({ recipe, onClose }) => {
  const steps = recipe.steps || [];
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <Modal onClose={onClose} width="min(560px, 92vw)">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
        <div>
          <p className="mp-micro mp-text-faint" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Mode cuisine</p>
          <h2 className="mp-h2">{recipe.name}</h2>
        </div>
        <button type="button" className="mp-btn mp-btn-ghost mp-btn-icon" onClick={onClose} aria-label="Fermer">
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Progression */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: space.lg }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: "4px", borderRadius: radius.pill, background: i <= stepIndex ? "var(--clay)" : "var(--line)" }} />
        ))}
      </div>

      {/* Étape courante */}
      <div style={{ minHeight: "160px" }}>
        <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          Étape {stepIndex + 1} / {steps.length}
        </p>
        {step.title && <h3 className="mp-h3" style={{ marginBottom: "0.6rem" }}>{step.title}</h3>}
        {step.mediaUrl && (
          <img src={step.mediaUrl} alt="" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: radius.md, marginBottom: space.md }} />
        )}
        {step.timerSeconds > 0 && <StepTimer key={stepIndex} seconds={step.timerSeconds} />}
        <p className="mp-body" style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{step.body}</p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginTop: space.xl, paddingTop: space.lg, borderTop: "1px solid var(--line)" }}>
        <button type="button" className="mp-btn mp-btn-secondary" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={isFirst}>
          <Icon name="chevronLeft" size={14} /> Précédent
        </button>
        {isLast ? (
          <button type="button" className="mp-btn mp-btn-primary" onClick={onClose}>
            <Icon name="check" size={14} /> Terminé
          </button>
        ) : (
          <button type="button" className="mp-btn mp-btn-primary" onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
            Suivant <Icon name="chevronRight" size={14} />
          </button>
        )}
      </div>
    </Modal>
  );
};

// Fiche détaillée d'une recette
const RecipeDetailModal = ({ recipe, ingredients, allRecipes = [], currentUser, userFamilies = [], activeFamily, onClose, onEdit, onCreateVariant, onShareRecipe }) => {
  const [tab, setTab] = useState("recipe"); // "recipe" | "variants"
  const [showCookMode, setShowCookMode] = useState(false);
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

          {recipe.steps?.length > 0 && (
            <div style={{ marginTop: space.lg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <p className="mp-micro mp-text-soft" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Étapes ({recipe.steps.length})
                </p>
                <button type="button" className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => setShowCookMode(true)}>
                  <Icon name="chevronRight" size={13} /> Mode cuisine
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recipe.steps.map((step, idx) => (
                  <div key={step.id || idx} style={{ display: "flex", gap: "0.5rem" }}>
                    <span className="mp-badge mp-badge-neutral" style={{ flexShrink: 0, height: "fit-content" }}>{idx + 1}</span>
                    {step.mediaUrl && (
                      <img src={step.mediaUrl} alt="" style={{ width: "2.6rem", height: "2.6rem", objectFit: "cover", borderRadius: radius.sm, flexShrink: 0 }} />
                    )}
                    <div>
                      {step.title && <p className="mp-small" style={{ fontWeight: 600 }}>{step.title}</p>}
                      <p className="mp-small mp-text-soft" style={{ whiteSpace: "pre-wrap" }}>{step.body}</p>
                      {step.timerSeconds > 0 && (
                        <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", marginTop: "0.2rem" }}>
                          <Icon name="clock" size={11} /> {Math.round(step.timerSeconds / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCookMode && <CookModeModal recipe={recipe} onClose={() => setShowCookMode(false)} />}

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
    : globalRecipes;

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
          Base commune ({globalRecipes.length})
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
      <div>
        <Field label="Article *">
          <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Tomates" required autoFocus />
        </Field>
        <Field label="Quantité">
          <input className="mp-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex : 500g" />
        </Field>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: space.lg }}>
          <button type="button" className="mp-btn mp-btn-secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="mp-btn mp-btn-primary">Ajouter</button>
        </div>
      </div>
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

const AccountView = ({ currentUser, activeFamily, onLogout, onDeleteAccount, onNavigate, onSetMyAvatar }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const isDemo = currentUser.id === "demo";
  const myAvatarEmoji = activeFamily?.members.find((m) => m.userId === currentUser.id)?.avatarEmoji;

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
const UserAvatar = ({ name, size = "md", avatarEmoji, onClick }) => {
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


const EmojiAvatarPicker = ({ current, onClose, onSave }) => (
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


const FamilyView = ({ families, currentUser, ingredients = [], onCreateFamily, onJoinFamily, onLeaveFamily, onSetActiveFamily, onPromoteMember, onRemoveMember, onRegenerateCode, onAddMemberByEmail, onAddLocalMember, onSetMyAvatar, onSetMemberAvatar, onSetMyAppetite, onAssignMemberAppetite }) => {
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




const LoginView = ({ onLogin, onGoRegister, onGoForgot }) => {
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

const ForgotPasswordView = ({ onGoLogin }) => {
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


// ============================================================
// QUICK PLAN (FAB mobile) — planifier un repas en 2 étapes
// ============================================================

const QuickPlanModal = ({ recipes, recentRecipeIds, onClose, onSave, familyMembers = [] }) => {
  const [step, setStep] = useState(1); // 1 = date+type, 2 = recettes
  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState("lunch");

  const handleNextStep = () => {
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
        familyMembers={familyMembers}
        onClose={onClose}
        onSave={(recipeIds, attendeeIds) => { onSave({ date, type: mealType, recipeIds, attendeeIds }); onClose(); }}
      />
    );
  }

  return (
    <Modal onClose={onClose} width="360px">
      <ModalHeader title="Planifier un repas" onClose={onClose} />
      <div>
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
          <button type="button" className="mp-btn mp-btn-primary">
            Choisir les recettes <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// APP SHELL
// ============================================================


const App = () => {
  const [currentView, setCurrentView] = useState("calendar");
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.darkMode, false));

  // ── Auth — initialisé depuis AuthService, mis à jour via onAuthChange ──
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => AuthService.getSession());
  const [authScreen, setAuthScreen] = useState("login");

  useEffect(() => {
    // Abonnement aux changements d'auth (Supabase: remplacer par supabase.auth.onAuthStateChange)
    const unsubscribe = AuthService.onAuthChange((user) => {
      setCurrentUser(user);
      if (!user) setAuthScreen("login");
    });
    return unsubscribe;
  }, []);
  const [families, setFamilies] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.families, null);
    return stored || [DEMO_FAMILY];
  });
  // Évite d'afficher à tort l'écran « créer/rejoindre une famille » pendant le
  // court instant où les familles réelles sont encore en cours de chargement.
  const [familiesLoaded, setFamiliesLoaded] = useState(false);
  // Comptes réels : données chargées depuis Supabase via useEffect ci-dessous.
  // Compte démo : jeu de données local, comme avant.
  const isDemo = currentUser?.id === "demo";
  const [recipes, setRecipes] = useState<any[]>(() => isDemo ? initialRecipes : []);
  const [mealPlans, setMealPlans] = useState<any[]>(() => isDemo ? initialMealPlans : []);
  const [shoppingList, setShoppingList] = useState<any[]>(() => isDemo ? initialShoppingList : []);
  const [ingredients, setIngredients] = useState<any[]>(() => isDemo ? initialIngredients : []);
  const [weekTemplates, setWeekTemplates] = useState<any[]>(() => []);
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

  // Compte démo uniquement : ces données restent locales, donc persistées en localStorage.
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.recipes, recipes); }, [recipes, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.mealPlans, mealPlans); }, [mealPlans, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.shoppingList, shoppingList); }, [shoppingList, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.ingredients, ingredients); }, [ingredients, isDemo]);
  useEffect(() => { if (isDemo) saveToStorage(STORAGE_KEYS.weekTemplates, weekTemplates); }, [weekTemplates, isDemo]);
  useEffect(() => saveToStorage(STORAGE_KEYS.darkMode, darkMode), [darkMode]);
  // Note: currentUser est persisté par AuthService, pas ici
  useEffect(() => saveToStorage(STORAGE_KEYS.families, families), [families]);

  // ── Chargement des familles réelles depuis Supabase (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || currentUser.id === "demo") return;
    let cancelled = false;
    setFamiliesLoaded(false);
    (async () => {
      const loaded = await fetchFamiliesForUser(currentUser);
      if (cancelled) return;
      if (loaded.length > 0) {
        const loadedIds = new Set(loaded.map((f) => f.id));
        setFamilies((prev) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
      }
      setFamiliesLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des ingrédients (catalogue global, comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => { const loaded = await fetchIngredients(); if (!cancelled) setIngredients(loaded); })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des préférences perso (régimes, allergies, aliments non appréciés) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => {
      const prefs = await fetchUserPreferences(currentUser.id);
      if (!cancelled) setCurrentUser((u) => u && { ...u, ...prefs });
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Chargement des recettes visibles par l'utilisateur (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    (async () => { const loaded = await fetchRecipesForUser(); if (!cancelled) setRecipes(loaded); })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── Synchronisation temps réel des recettes (Realtime) — comptes non-démo ──
  // Une recette créée/modifiée/partagée par un autre membre de la famille apparaît
  // sans recharger. Pas de family_id unique sur "recipes" (global/privé/familial/
  // partagé), donc abonnement non filtré : RLS restreint déjà ce que ce client reçoit,
  // comme pour meal_plan_meals/meal_plan_meal_recipes.
  useEffect(() => {
    if (!currentUser || isDemo) return;
    let cancelled = false;
    let channel: any = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const loaded = await fetchRecipesForUser();
        if (!cancelled) setRecipes(loaded);
      }, 300);
    };

    (async () => {
      const sb = await getSupabase();
      if (!sb || cancelled) return;
      channel = sb
        .channel(`recipes-${currentUser.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipes" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_ingredients" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_steps" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_family_shares" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "recipe_variants" }, refetch)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) channel.unsubscribe();
    };
  }, [currentUser?.id, isDemo]);

  // ── Chargement des repas / courses / semaines types de la famille active (comptes non-démo) ──
  useEffect(() => {
    if (!currentUser || isDemo || !activeFamily?.id) return;
    let cancelled = false;
    (async () => {
      const [meals, shopping, templates] = await Promise.all([
        fetchMealPlansForFamily(activeFamily.id),
        fetchShoppingListForFamily(activeFamily.id),
        fetchWeekTemplatesForFamily(currentUser.id, activeFamily.id),
      ]);
      if (cancelled) return;
      setMealPlans(meals);
      setShoppingList(shopping);
      setWeekTemplates(templates);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id, isDemo, activeFamily?.id]);

  // ── Synchronisation temps réel du planning (Realtime) — comptes non-démo ──
  // Si un autre membre de la famille modifie le planning, on le voit sans recharger.
  // Refetch complet plutôt qu'un patch fin : plus simple et fiable, le volume de
  // données d'un planning familial est trop faible pour que ça coûte quoi que ce soit.
  useEffect(() => {
    if (!currentUser || isDemo || !activeFamily?.id) return;
    let cancelled = false;
    let channel: any = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const refetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const meals = await fetchMealPlansForFamily(activeFamily.id);
        if (!cancelled) setMealPlans(meals);
      }, 300);
    };

    (async () => {
      const sb = await getSupabase();
      if (!sb || cancelled) return;
      channel = sb
        .channel(`meal-plans-${activeFamily.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plans", filter: `family_id=eq.${activeFamily.id}` }, refetch)
        // meal_plan_meals / meal_plan_meal_recipes n'ont pas de family_id direct (via
        // meal_plan_id / meal_plan_meal_id) : pas de filtre possible côté Realtime,
        // mais RLS restreint déjà ce que ce client reçoit à sa propre famille.
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plan_meals" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "meal_plan_meal_recipes" }, refetch)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) channel.unsubscribe();
    };
  }, [currentUser?.id, isDemo, activeFamily?.id]);

  // ── Auth — délègue à AuthService (swappable Supabase) ──
  const handleLogin = async (email: string, password: string) => {
    const { user, error } = await AuthService.signIn(email, password);
    if (error) throw new Error(error);
    setCurrentUser(user);
  };

  const handleRegister = async (
    name: string, email: string, password: string,
    consents: { consentGeneral: boolean; consentSensitive: boolean; consentDate: string }
  ) => {
    const { user, error } = await AuthService.signUp(name, email, password, consents);
    if (error) throw new Error(error);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setCurrentUser(null);
    setAuthScreen("login");
  };

  // ---- Famille ----
  const handleCreateFamily = async (name: string) => {
    if (currentUser.id === "demo") {
      const newFamily = {
        id: Date.now().toString(),
        name,
        inviteCode: generateInviteCode(),
        ownerId: currentUser.id,
        members: [{ memberId: currentUser.id, userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "admin" }],
      };
      setFamilies((prev: any[]) => [...prev, newFamily]);
      AuthService.updateProfile(currentUser.id, { activeFamilyId: newFamily.id });
      showToast(`Famille « ${name} » créée`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data: familyRow, error: familyError } = await sb
      .from("families")
      .insert({ owner_profile_id: currentUser.id, name, invite_code: generateInviteCode() })
      .select("*")
      .single();
    if (familyError) throw new Error(familyError.message);

    const { data: memberRow, error: memberError } = await sb
      .from("family_members")
      .insert({ family_id: familyRow.family_id, profile_id: currentUser.id, name: currentUser.name })
      .select("*")
      .single();
    if (memberError) throw new Error(memberError.message);

    const { error: profileError } = await sb
      .from("profiles")
      .update({ active_family_id: familyRow.family_id })
      .eq("profile_id", currentUser.id);
    if (profileError) throw new Error(profileError.message);

    const newFamily = {
      id: familyRow.family_id,
      name: familyRow.name,
      inviteCode: familyRow.invite_code,
      ownerId: familyRow.owner_profile_id,
      members: [{ memberId: memberRow.member_id, userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "admin" }],
    };
    setFamilies((prev: any[]) => [...prev.filter((f) => f.id !== newFamily.id), newFamily]);
    setCurrentUser((u: any) => u && { ...u, activeFamilyId: newFamily.id });
    showToast(`Famille « ${name} » créée`, "sage");
  };

  const handleAddFamilyMemberByEmail = async (familyId: string, email: string) => {
    if (currentUser.id === "demo") throw new Error("Ajout par email indisponible pour le compte démo.");

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await sb.rpc("add_family_member_by_email", { p_family_id: familyId, p_email: normalizedEmail });
    if (error) {
      const messages: Record<string, string> = {
        not_authorized: "Seul le créateur de la famille peut ajouter des membres.",
        user_not_found: "Aucun utilisateur trouvé avec cet email.",
        already_member: "Cette personne est déjà membre de la famille.",
      };
      throw new Error(messages[error.message] || error.message);
    }

    setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
      ...f,
      members: [...f.members, {
        memberId: data.member_id,
        userId: data.profile_id,
        userName: data.name,
        userEmail: normalizedEmail,
        role: "member",
      }],
    }));
    showToast(`${data.name} a été ajouté(e) à la famille`, "sage");
  };

  const handleAddLocalFamilyMember = async (familyId: string, name: string) => {
    const trimmedName = name.trim();
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: [...f.members, { memberId: `local-${Date.now()}`, userId: null, userName: trimmedName, userEmail: "", role: "member" }],
      }));
      showToast(`${trimmedName} ajouté(e) à la famille`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data, error } = await sb
      .from("family_members")
      .insert({ family_id: familyId, name: trimmedName })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
      ...f,
      members: [...f.members, { memberId: data.member_id, userId: null, userName: data.name, userEmail: "", role: "member" }],
    }));
    showToast(`${trimmedName} ajouté(e) à la famille`, "sage");
  };

  // Un membre choisit son propre avatar — appliqué à toutes ses familles (RPC
  // SECURITY DEFINER : un membre normal n'a pas le droit de modifier sa ligne
  // family_members via RLS classique, seul le propriétaire de la famille l'a).
  const handleSetMyAvatar = async (emoji: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => ({
        ...f,
        members: f.members.map((m: any) => m.userId === currentUser.id ? { ...m, avatarEmoji: emoji } : m),
      })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("set_my_avatar", { p_avatar_emoji: emoji });
      if (error) throw error;
      const loaded = await fetchFamiliesForUser(currentUser);
      const loadedIds = new Set(loaded.map((f) => f.id));
      setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
    } catch { showToast("Erreur lors de la mise à jour de l'avatar", "clay"); }
  };

  // L'admin choisit l'avatar d'un membre sans compte (couvert par la policy existante
  // "gestion des membres par le propriétaire").
  const handleSetMemberAvatar = async (familyId: string, memberId: string, emoji: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => (m.memberId || m.userId) === memberId ? { ...m, avatarEmoji: emoji } : m),
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("family_members").update({ avatar_emoji: emoji }).eq("member_id", memberId);
      if (error) throw error;
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => m.memberId === memberId ? { ...m, avatarEmoji: emoji } : m),
      }));
    } catch { showToast("Erreur lors de la mise à jour de l'avatar", "clay"); }
  };

  // Un membre choisit son propre appétit (RPC set_my_appetite, comme set_my_avatar).
  const handleSetMyAppetite = async (appetite: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => ({
        ...f,
        members: f.members.map((m: any) => m.userId === currentUser.id ? { ...m, appetite } : m),
      })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("set_my_appetite", { p_appetite: appetite });
      if (error) throw error;
      const loaded = await fetchFamiliesForUser(currentUser);
      const loadedIds = new Set(loaded.map((f) => f.id));
      setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);
    } catch { showToast("Erreur lors de la mise à jour de l'appétit", "clay"); }
  };

  // Assignation par un tiers : l'admin peut le faire pour un membre sans compte ;
  // n'importe quel membre peut le faire pour un membre AVEC compte tant que celui-ci
  // ne l'a pas déjà renseigné lui-même (verrouillage géré côté RPC).
  const handleAssignMemberAppetite = async (familyId: string, memberId: string, appetite: string) => {
    if (currentUser.id === "demo") {
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => (m.memberId || m.userId) === memberId ? { ...m, appetite } : m),
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.rpc("assign_member_appetite", { p_member_id: memberId, p_appetite: appetite });
      if (error) {
        const messages: Record<string, string> = {
          already_set: "Ce membre a déjà renseigné son appétit — seul lui peut le modifier.",
          not_authorized: "Vous n'avez pas le droit de modifier l'appétit de ce membre.",
        };
        throw new Error(messages[error.message] || error.message);
      }
      setFamilies((prev: any[]) => prev.map((f) => f.id !== familyId ? f : {
        ...f,
        members: f.members.map((m: any) => m.memberId === memberId ? { ...m, appetite } : m),
      }));
    } catch (err: any) { showToast(err.message || "Erreur lors de la mise à jour de l'appétit", "clay"); }
  };

  const handleJoinFamily = async (code: string) => {
    if (currentUser.id === "demo") {
      const allFamilies: any[] = loadFromStorage(STORAGE_KEYS.families, [DEMO_FAMILY]);
      const allUnique = [...allFamilies];
      if (!allUnique.some((f) => f.id === DEMO_FAMILY.id)) allUnique.push(DEMO_FAMILY);
      const target = allUnique.find((f) => f.inviteCode === code);
      if (!target) throw new Error("Code invalide ou famille introuvable.");
      if (target.members.some((m: any) => m.userId === currentUser.id)) throw new Error("Vous êtes déjà membre de cette famille.");
      const updated = { ...target, members: [...target.members, { userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, role: "member" }] };
      setFamilies((prev: any[]) => prev.some((f) => f.id === target.id) ? prev.map((f) => f.id === target.id ? updated : f) : [...prev, updated]);
      AuthService.updateProfile(currentUser.id, { activeFamilyId: target.id });
      showToast(`Vous avez rejoint « ${target.name} »`, "sage");
      return;
    }

    const sb = await getSupabase();
    if (!sb) throw new Error("Connexion à la base de données indisponible.");

    const { data, error } = await sb.rpc("join_family_by_code", { p_invite_code: code });
    if (error) {
      const messages: Record<string, string> = {
        invalid_code: "Code invalide ou famille introuvable.",
        already_member: "Vous êtes déjà membre de cette famille.",
      };
      throw new Error(messages[error.message] || error.message);
    }
    const joined = data?.[0];

    const loaded = await fetchFamiliesForUser(currentUser);
    const loadedIds = new Set(loaded.map((f) => f.id));
    setFamilies((prev: any[]) => [...prev.filter((f) => !loadedIds.has(f.id)), ...loaded]);

    await sb.from("profiles").update({ active_family_id: joined?.family_id }).eq("profile_id", currentUser.id);
    setCurrentUser((u: any) => u && { ...u, activeFamilyId: joined?.family_id });
    showToast(`Vous avez rejoint « ${joined?.name} »`, "sage");
  };

  const handleSetActiveFamily = (familyId: string) => {
    AuthService.updateProfile(currentUser.id, { activeFamilyId: familyId });
  };

  const handleLeaveFamily = async (familyId) => {
    if (currentUser.id !== "demo") {
      const sb = await getSupabase();
      if (!sb) { showToast("Connexion à la base indisponible", "clay"); return; }
      const { error } = await sb.from("family_members").delete().eq("family_id", familyId).eq("profile_id", currentUser.id);
      if (error) { showToast("Erreur lors du départ de la famille", "clay"); return; }
    }
    setFamilies((prev) => {
      const updated = prev.map((f) => f.id === familyId
        ? { ...f, members: f.members.filter((m) => m.userId !== currentUser.id) }
        : f
      );
      // Recalculer la famille active depuis l'état mis à jour
      const remaining = updated.filter((f) => f.id !== familyId && f.members.some((m) => m.userId === currentUser.id));
      const newActive = remaining[0]?.id || null;
      setCurrentUser((u) => ({ ...u, activeFamilyId: newActive }));
      return updated;
    });
    showToast("Vous avez quitté la famille", "sage");
  };

  // Seul le propriétaire peut promouvoir (policy "gestion des membres par le
  // propriétaire", ALL sur family_members) — un co-admin promu obtient le badge et
  // partage l'admin visuellement, mais n'hérite pas des droits de gestion des membres.
  const handlePromoteMember = async (familyId, userId) => {
    if (currentUser.id === "demo") {
      setFamilies((prev) => prev.map((f) => f.id !== familyId ? f : {
        ...f, members: f.members.map((m) => ({ ...m, role: m.userId === userId ? "admin" : m.role }))
      }));
      showToast("Membre promu admin", "sage");
      return;
    }
    try {
      const family = families.find((f) => f.id === familyId);
      const member = family?.members.find((m) => m.userId === userId);
      if (!member?.memberId) throw new Error("no_member_row");
      const sb = await getSupabase();
      const { error } = await sb.from("family_members").update({ role: "admin" }).eq("member_id", member.memberId);
      if (error) throw error;
      setFamilies((prev) => prev.map((f) => f.id !== familyId ? f : {
        ...f, members: f.members.map((m) => m.userId === userId ? { ...m, role: "admin" } : m)
      }));
      showToast("Membre promu admin", "sage");
    } catch { showToast("Erreur lors de la promotion", "clay"); }
  };

  const handleRemoveMember = async (familyId, memberId) => {
    if (currentUser.id !== "demo") {
      const sb = await getSupabase();
      if (!sb) { showToast("Connexion à la base indisponible", "clay"); return; }
      const { error } = await sb.from("family_members").delete().eq("member_id", memberId);
      if (error) { showToast("Erreur lors de la suppression du membre", "clay"); return; }
    }
    setFamilies((prev) => prev.map((f) => {
      if (f.id !== familyId) return f;
      const remaining = f.members.filter((m) => (m.memberId || m.userId) !== memberId);
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
  const handleAddRecipe = async (recipe) => {
    if (isDemo) {
      setRecipes((prev) => [...prev, {
        ...recipe, id: recipe.id || Date.now().toString(), createdBy: currentUser?.id,
        scope: "shared", sharedWith: activeFamily ? [activeFamily.id] : [],
        parentId: recipe.parentId || null, rootId: recipe.rootId || null, variantName: recipe.variantName || null,
      }]);
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { data: newRow, error } = await sb.from("recipes").insert({
        name: recipe.name, description: recipe.description || null, portions: recipe.portions || 4, tags: recipe.tags || [],
        scope: activeFamily ? "family" : "private", owner_profile_id: currentUser.id, family_id: activeFamily?.id || null,
        recipe_category_id: categoryMap[recipe.category] || null, created_by: currentUser.id, variant_name: recipe.variantName || null,
      }).select("id").single();
      if (error) throw error;
      await saveRecipeIngredients(sb, newRow.id, recipe.ingredients || []);
      await saveRecipeSteps(sb, newRow.id, recipe.steps || []);
      if (recipe.parentId) {
        await sb.from("recipe_variants").insert({
          variant_recipe_id: newRow.id, parent_recipe_id: Number(recipe.parentId),
          master_recipe_id: Number(recipe.rootId || recipe.parentId), created_by: currentUser.id,
        });
      }
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors de l'enregistrement de la recette", "clay"); }
  };

  const handleEditRecipe = async (updated) => {
    if (isDemo) {
      setRecipes((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { error } = await sb.from("recipes").update({
        name: updated.name, description: updated.description || null, portions: updated.portions || 4,
        tags: updated.tags || [], recipe_category_id: categoryMap[updated.category] || null, variant_name: updated.variantName || null,
      }).eq("id", Number(updated.id));
      if (error) throw error;
      await saveRecipeIngredients(sb, Number(updated.id), updated.ingredients || []);
      await saveRecipeSteps(sb, Number(updated.id), updated.steps || []);
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors de la modification de la recette", "clay"); }
  };

  const handleDeleteRecipe = async (id) => {
    if (isDemo) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setMealPlans((prev) => prev.map((mp) => ({ ...mp, recipeIds: (mp.recipeIds || []).filter((rid) => rid !== id) })));
      return;
    }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("recipes").delete().eq("id", Number(id));
      if (error) throw error;
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (activeFamily?.id) setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la suppression de la recette", "clay"); }
  };

  const handleImportRecipe = async (recipe) => {
    if (isDemo) {
      setRecipes((prev) => [...prev, {
        ...recipe, id: Date.now().toString(), createdBy: currentUser?.id, scope: "shared",
        sharedWith: activeFamily ? [activeFamily.id] : [], parentId: null, rootId: null, variantName: null,
      }]);
      showToast(`« ${recipe.name} » ajoutée à ${activeFamily?.name}`, "sage");
      return;
    }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchRecipeCategoryMap();
      const { data: newRow, error } = await sb.from("recipes").insert({
        name: recipe.name, description: recipe.description || null, portions: recipe.portions || 4, tags: recipe.tags || [],
        scope: activeFamily ? "family" : "private", owner_profile_id: currentUser.id, family_id: activeFamily?.id || null,
        recipe_category_id: categoryMap[recipe.category] || null, created_by: currentUser.id,
      }).select("id").single();
      if (error) throw error;
      await saveRecipeIngredients(sb, newRow.id, recipe.ingredients || []);
      await saveRecipeSteps(sb, newRow.id, recipe.steps || []);
      setRecipes(await fetchRecipesForUser());
      showToast(`« ${recipe.name} » ajoutée à ${activeFamily?.name}`, "sage");
    } catch { showToast("Erreur lors de l'import de la recette", "clay"); }
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

  const handleShareRecipe = async (recipeId, familyId) => {
    if (isDemo) {
      setRecipes((prev) => prev.map((r) => {
        if (r.id !== recipeId) return r;
        const already = (r.sharedWith || []).includes(familyId);
        return {
          ...r,
          scope: already ? (r.sharedWith.length <= 1 ? "private" : "shared") : "shared",
          sharedWith: already ? (r.sharedWith || []).filter((id) => id !== familyId) : [...(r.sharedWith || []), familyId],
        };
      }));
      return;
    }
    try {
      const sb = await getSupabase();
      const { data: existing } = await sb.from("recipe_family_shares").select("recipe_id").eq("recipe_id", Number(recipeId)).eq("family_id", familyId).maybeSingle();
      if (existing) {
        await sb.from("recipe_family_shares").delete().eq("recipe_id", Number(recipeId)).eq("family_id", familyId);
      } else {
        await sb.from("recipe_family_shares").insert({ recipe_id: Number(recipeId), family_id: familyId });
      }
      setRecipes(await fetchRecipesForUser());
    } catch { showToast("Erreur lors du partage de la recette", "clay"); }
  };

  // ---- Repas ----
  const handleAddMeal = async (mealData) => {
    const date = mealData?.date || todayStr();
    const type = mealData?.type || "lunch";
    const recipeIds = mealData?.recipeIds || [];
    const status = mealData?.status || "normal";
    const attendeeIds = mealData?.attendeeIds;
    if (isDemo) {
      const resolvedAttendeeIds = attendeeIds ?? (activeFamily?.members || []).map((m: any) => m.memberId || m.userId).filter(Boolean);
      setMealPlans((prev) => [...prev, { id: Date.now().toString(), date, recipeIds, type, status, attendeeIds: resolvedAttendeeIds, familyId: activeFamily?.id }]);
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, date, type, recipeIds, status, attendeeIds);
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la planification du repas", "clay"); }
  };

  const handleUpdateMeal = async (mealId, recipeIds, status = "normal", attendeeIds?: string[]) => {
    if (isDemo) {
      setMealPlans((prev) => prev.map((mp) => mp.id === mealId ? { ...mp, recipeIds, status, ...(attendeeIds !== undefined ? { attendeeIds } : {}) } : mp));
      return;
    }
    const existing = mealPlans.find((mp) => mp.id === mealId);
    if (!existing || !activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      await upsertMealSlot(sb, activeFamily.id, currentUser.id, existing.date, existing.type, recipeIds, status, attendeeIds);
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
    } catch { showToast("Erreur lors de la mise à jour du repas", "clay"); }
  };

  // ---- Courses ----
  const handleAddShoppingItem = async (item) => {
    if (isDemo) {
      setShoppingList((prev) => [...prev, { id: Date.now().toString(), name: item.name, quantity: item.quantity, completed: false, familyId: activeFamily?.id }]);
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("shopping_list_items")
        .insert({ family_id: activeFamily.id, name: item.name, quantity: item.quantity, created_by: currentUser.id })
        .select("*").single();
      if (error) throw error;
      setShoppingList((prev) => [...prev, { id: String(data.id), name: data.name, quantity: data.quantity, completed: data.completed, familyId: activeFamily.id }]);
    } catch { showToast("Erreur lors de l'ajout à la liste de courses", "clay"); }
  };

  const handleToggleShoppingItem = async (id) => {
    if (isDemo) {
      setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
      return;
    }
    const current = shoppingList.find((i) => i.id === id);
    if (!current) return;
    setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").update({ completed: !current.completed }).eq("id", Number(id));
      if (error) throw error;
    } catch {
      showToast("Erreur lors de la mise à jour", "clay");
      setShoppingList((prev) => prev.map((item) => item.id === id ? { ...item, completed: current.completed } : item));
    }
  };

  const handleDeleteShoppingItem = async (id) => {
    if (isDemo) { setShoppingList((prev) => prev.filter((item) => item.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").delete().eq("id", Number(id));
      if (error) throw error;
      setShoppingList((prev) => prev.filter((item) => item.id !== id));
    } catch { showToast("Erreur lors de la suppression", "clay"); }
  };

  const handleGenerateShoppingList = async (from, to) => {
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
    const memberById = new Map((activeFamily?.members || []).map((m) => [m.memberId || m.userId, m]));
    const appetiteMultiplierOf = (m) => APPETITE_LEVELS.find((l) => l.id === m?.appetite)?.multiplier ?? 1;
    const aggregated = new Map(); let recipeCount = 0;
    upcomingMeals.forEach((meal) => {
      (meal.recipeIds || []).forEach((recipeId) => {
        const recipe = familyRecipes.find((r) => r.id === recipeId); if (!recipe) return;
        recipeCount++;
        const attendeeIds = meal.attendeeIds?.length ? meal.attendeeIds : (activeFamily?.members || []).map((m) => m.memberId || m.userId);
        // Portions pondérées par appétit (Vorace ×1.3 / Normal ×1 / Moineaux ×0.8) plutôt qu'un simple headcount.
        const weightedParts = attendeeIds.reduce((sum, id) => sum + appetiteMultiplierOf(memberById.get(id)), 0);
        const multiplier = Math.max(1, weightedParts) / (recipe.portions || 4);
        recipe.ingredients.forEach((ing) => {
          const key = ing.ingredientName;
          const parsed = parseQty(ing.quantity);
          let qty = ing.quantity;
          if (parsed && Math.abs(multiplier - 1) > 0.01) { const adj = Math.round(parsed.num * multiplier * 10)/10; qty = `${Number.isInteger(adj)?adj:adj}${parsed.unit?" "+parsed.unit:""}`.trim(); }
          aggregated.set(key, aggregated.has(key) ? addQty(aggregated.get(key), qty) : qty);
        });
      });
    });
    if (isDemo) {
      let addedCount = 0;
      setShoppingList((prev) => {
        const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
        const additions = []; aggregated.forEach((quantity, name) => { if (existingNames.has(name.toLowerCase())) return; additions.push({ id: `${Date.now()}-${name}`, name, quantity, completed: false, familyId: activeFamily?.id }); });
        addedCount = additions.length; return [...prev, ...additions];
      });
      setTimeout(() => { addedCount === 0 ? showToast("Tous les ingrédients sont déjà dans la liste","sage") : showToast(`${addedCount} article${addedCount>1?"s":""} ajouté${addedCount>1?"s":""} depuis ${recipeCount} recette${recipeCount>1?"s":""}`, "sage"); }, 0);
      return;
    }
    if (!activeFamily?.id) return;
    const existingNames = new Set(shoppingList.map((i) => i.name.toLowerCase()));
    const additions = [];
    aggregated.forEach((quantity, name) => { if (!existingNames.has(name.toLowerCase())) additions.push({ family_id: activeFamily.id, name, quantity, created_by: currentUser.id }); });
    if (additions.length === 0) { showToast("Tous les ingrédients sont déjà dans la liste", "sage"); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("shopping_list_items").insert(additions);
      if (error) throw error;
      setShoppingList(await fetchShoppingListForFamily(activeFamily.id));
      showToast(`${additions.length} article${additions.length>1?"s":""} ajouté${additions.length>1?"s":""} depuis ${recipeCount} recette${recipeCount>1?"s":""}`, "sage");
    } catch { showToast("Erreur lors de la génération de la liste", "clay"); }
  };

  // ---- Ingrédients ----
  const handleAddIngredient = async (ing) => {
    if (isDemo) { setIngredients((prev) => [...prev, ing]); return; }
    try {
      const sb = await getSupabase();
      const categoryMap = await fetchIngredientCategoryMap();
      const { data, error } = await sb.from("ingredients").insert({ name: ing.name, ingredient_category_id: categoryMap[ing.category] }).select("id").single();
      if (error) throw error;
      setIngredients((prev) => [...prev, { id: String(data.id), name: ing.name, category: ing.category }]);
    } catch { showToast("Erreur lors de l'ajout de l'ingrédient", "clay"); }
  };

  const handleDeleteIngredient = async (id) => {
    if (familyRecipes.some((r) => r.ingredients?.some((i) => i.ingredientId === id))) {
      alert("Cet ingrédient est utilisé dans une recette."); return;
    }
    if (isDemo) { setIngredients((prev) => prev.filter((i) => i.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("ingredients").delete().eq("id", Number(id));
      if (error) throw error;
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch { alert("Cet ingrédient est utilisé dans une recette."); }
  };

  // ---- Semaines types ----
  const handleSaveTemplate = async (tpl) => {
    if (isDemo) {
      setWeekTemplates((prev) => {
        const base = { ...tpl, familyId: tpl.scope === "family" ? activeFamily?.id : undefined, userId: tpl.scope === "user" ? currentUser?.id : undefined };
        const idx = prev.findIndex((t) => t.id === base.id);
        return idx >= 0 ? prev.map((t) => t.id === base.id ? base : t) : [...prev, base];
      });
      return;
    }
    const isExisting = weekTemplates.some((t) => t.id === tpl.id);
    try {
      const sb = await getSupabase();
      const payload = {
        name: tpl.name, scope: tpl.scope,
        family_id: tpl.scope === "family" ? activeFamily?.id : null,
        profile_id: tpl.scope === "user" ? currentUser.id : null,
        slots: tpl.slots, created_by: currentUser.id,
      };
      if (isExisting) {
        const { error } = await sb.from("week_templates").update(payload).eq("id", Number(tpl.id));
        if (error) throw error;
      } else {
        const { error } = await sb.from("week_templates").insert(payload);
        if (error) throw error;
      }
      setWeekTemplates(await fetchWeekTemplatesForFamily(currentUser.id, activeFamily?.id || null));
    } catch { showToast("Erreur lors de l'enregistrement du modèle", "clay"); }
  };

  const handleDeleteTemplate = async (id) => {
    if (isDemo) { setWeekTemplates((prev) => prev.filter((t) => t.id !== id)); return; }
    try {
      const sb = await getSupabase();
      const { error } = await sb.from("week_templates").delete().eq("id", Number(id));
      if (error) throw error;
      setWeekTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { showToast("Erreur lors de la suppression du modèle", "clay"); }
  };

  const handleApplyTemplate = async (template, weekStart, mode) => {
    const monday = getMondayOf(new Date(weekStart + "T12:00:00"));
    const slotsToApply = template.slots.filter((slot) => {
      if (mode === "merge") {
        const date = dateOfSlot(monday, slot.day);
        return !mealPlans.some((mp) => mp.date === date && mp.type === slot.type && (mp.recipeIds || []).length > 0);
      }
      return true;
    });
    if (isDemo) {
      setMealPlans((prev) => {
        let base = prev;
        if (mode === "overwrite") {
          const affected = new Set(template.slots.map((s) => dateOfSlot(monday, s.day)));
          base = prev.filter((mp) => !affected.has(mp.date) || !template.slots.some((s) => s.type === mp.type && dateOfSlot(monday, s.day) === mp.date));
        }
        const additions = slotsToApply.map((slot) => ({ id: `tpl-${Date.now()}-${slot.day}-${slot.type}`, date: dateOfSlot(monday, slot.day), type: slot.type, recipeIds: slot.recipeIds, familyId: activeFamily?.id }));
        return [...base, ...additions];
      });
      showToast(`${slotsToApply.length} créneau${slotsToApply.length>1?"x":""} appliqué${slotsToApply.length>1?"s":""}`, "sage");
      return;
    }
    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      for (const slot of slotsToApply) {
        await upsertMealSlot(sb, activeFamily.id, currentUser.id, dateOfSlot(monday, slot.day), slot.type, slot.recipeIds, "normal");
      }
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${slotsToApply.length} créneau${slotsToApply.length>1?"x":""} appliqué${slotsToApply.length>1?"s":""}`, "sage");
    } catch { showToast("Erreur lors de l'application du modèle", "clay"); }
  };

  // ---- Duplication / vidage semaine ----
  const handleDuplicateWeek = async (srcDateStr, targetMondayStr) => {
    const monday = getMondayOf(new Date(srcDateStr + "T12:00:00"));
    const targetMonday = new Date(targetMondayStr + "T12:00:00");
    const weekMeals = familyMealPlans.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === monday.toISOString().split("T")[0]);
    if (weekMeals.length === 0) { showToast("Aucun repas à dupliquer", "berry"); return; }

    const targets = weekMeals.map((mp) => {
      const offset = Math.round((new Date(mp.date + "T12:00:00") - monday) / 86400000);
      const newDate = new Date(targetMonday); newDate.setDate(targetMonday.getDate() + offset);
      return { newDateStr: newDate.toISOString().split("T")[0], type: mp.type, recipeIds: [...(mp.recipeIds || [])], status: mp.status || "normal", attendeeIds: mp.attendeeIds };
    });

    if (isDemo) {
      const base = Date.now();
      setMealPlans((prev) => {
        const additions = targets.map((t, idx) => {
          if (prev.some((p) => p.date === t.newDateStr && p.type === t.type && (p.recipeIds || []).length > 0)) return null;
          return { id: `dup-${base}-${idx}`, date: t.newDateStr, type: t.type, recipeIds: t.recipeIds, status: t.status, attendeeIds: t.attendeeIds, familyId: activeFamily?.id };
        }).filter(Boolean);
        return [...prev, ...additions];
      });
      showToast(`${weekMeals.length} repas dupliqué${weekMeals.length > 1 ? "s" : ""}`, "sage");
      return;
    }

    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      for (const t of targets) {
        if (mealPlans.some((p) => p.date === t.newDateStr && p.type === t.type && (p.recipeIds || []).length > 0)) continue;
        await upsertMealSlot(sb, activeFamily.id, currentUser.id, t.newDateStr, t.type, t.recipeIds, t.status, t.attendeeIds);
      }
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${weekMeals.length} repas dupliqué${weekMeals.length > 1 ? "s" : ""}`, "sage");
    } catch { showToast("Erreur lors de la duplication de la semaine", "clay"); }
  };

  const handleClearWeek = async (dateStr) => {
    const mondayDate = getMondayOf(new Date(dateStr + "T12:00:00"));
    const mondayStr = mondayDate.toISOString().split("T")[0];
    const sundayDate = new Date(mondayDate); sundayDate.setDate(mondayDate.getDate() + 6);
    const sundayStr = sundayDate.toISOString().split("T")[0];

    if (isDemo) {
      setMealPlans((prev) => {
        const removed = prev.filter((mp) => getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId));
        showToast(`${removed.length} repas supprimé${removed.length>1?"s":""}`, "berry");
        return prev.filter((mp) => !(getMondayOf(new Date(mp.date + "T12:00:00")).toISOString().split("T")[0] === mondayStr && (mp.familyId === activeFamily?.id || !mp.familyId)));
      });
      return;
    }

    if (!activeFamily?.id) return;
    try {
      const sb = await getSupabase();
      const removedCount = mealPlans.filter((mp) => mp.date >= mondayStr && mp.date <= sundayStr).length;
      const { error } = await sb.from("meal_plans").delete().eq("family_id", activeFamily.id).gte("date", mondayStr).lte("date", sundayStr);
      if (error) throw error;
      setMealPlans(await fetchMealPlansForFamily(activeFamily.id));
      showToast(`${removedCount} repas supprimé${removedCount>1?"s":""}`, "berry");
    } catch { showToast("Erreur lors de la suppression de la semaine", "clay"); }
  };

  const handleUpdateUserProfile = async (updates: Partial<AppUser>) => {
    if (!currentUser) return;
    const { diets, allergies, dislikes, ...profileUpdates } = updates as any;

    if (isDemo) {
      AuthService.updateProfile(currentUser.id, updates);
      return;
    }

    try {
      const sb = await getSupabase();
      if (sb && diets !== undefined) {
        await saveDiets(sb, currentUser.id, diets);
        setCurrentUser((u) => u && { ...u, diets });
      }
      if (sb && allergies !== undefined) {
        await saveFoodRestrictions(sb, currentUser.id, "allergy", allergies);
        setCurrentUser((u) => u && { ...u, allergies });
      }
      if (sb && dislikes !== undefined) {
        await saveFoodRestrictions(sb, currentUser.id, "dislike", dislikes);
        setCurrentUser((u) => u && { ...u, dislikes });
      }
    } catch { showToast("Erreur lors de la mise à jour des préférences", "clay"); }

    if (Object.keys(profileUpdates).length > 0) {
      AuthService.updateProfile(currentUser.id, profileUpdates);
      // setCurrentUser mis à jour automatiquement via onAuthChange pour ces champs
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    // Supprimer les données liées
    setRecipes((prev) => prev.filter((r: any) => r.createdBy !== currentUser.id));
    setMealPlans((prev) => prev.filter((mp: any) => mp.familyId !== activeFamily?.id));
    setFamilies((prev) => prev
      .map((f: any) => ({ ...f, members: f.members.filter((m: any) => m.userId !== currentUser.id) }))
      .filter((f: any) => f.members.length > 0)
    );
    AuthService.deleteAccount(currentUser.id);
  };

  const viewProps = {
    calendar: { mealPlans: familyMealPlans, recipes: familyRecipes, onAddMeal: handleAddMeal, onUpdateMeal: handleUpdateMeal, recentRecipeIds, weekTemplates: familyWeekTemplates, onApplyTemplate: handleApplyTemplate, onDuplicateWeek: handleDuplicateWeek, onClearWeek: handleClearWeek, onNavigate: setCurrentView, familyMembers: activeFamily?.members || [] },
    recipes: { recipes: familyRecipes, allRecipes: recipes, globalRecipes: isDemo ? initialRecipes : recipes.filter((r) => r.scope === "global"), ingredients, currentUser, userFamilies, activeFamily, onAddRecipe: handleAddRecipe, onEditRecipe: handleEditRecipe, onDeleteRecipe: handleDeleteRecipe, onImportRecipe: handleImportRecipe, onCreateVariant: handleCreateVariant, onShareRecipe: handleShareRecipe, activeFamilyId: activeFamily?.id },
    shopping: { shoppingList: familyShoppingList, ingredients, onAddItem: handleAddShoppingItem, onToggleItem: handleToggleShoppingItem, onDeleteItem: handleDeleteShoppingItem, onGenerate: handleGenerateShoppingList },
    preferences: { currentUser, ingredients, weekTemplates: familyWeekTemplates, recipes: familyRecipes, recentRecipeIds, activeFamily, onAddIngredient: handleAddIngredient, onDeleteIngredient: handleDeleteIngredient, onSaveTemplate: handleSaveTemplate, onDeleteTemplate: handleDeleteTemplate, onApplyTemplate: handleApplyTemplate, onUpdateUserProfile: handleUpdateUserProfile },
    family: { families: userFamilies, currentUser, ingredients, onCreateFamily: handleCreateFamily, onJoinFamily: handleJoinFamily, onLeaveFamily: handleLeaveFamily, onSetActiveFamily: handleSetActiveFamily, onPromoteMember: handlePromoteMember, onRemoveMember: handleRemoveMember, onRegenerateCode: handleRegenerateCode, onAddMemberByEmail: handleAddFamilyMemberByEmail, onAddLocalMember: handleAddLocalFamilyMember, onSetMyAvatar: handleSetMyAvatar, onSetMemberAvatar: handleSetMemberAvatar, onSetMyAppetite: handleSetMyAppetite, onAssignMemberAppetite: handleAssignMemberAppetite },
    account: { currentUser, activeFamily, onLogout: handleLogout, onDeleteAccount: handleDeleteAccount, onNavigate: setCurrentView, onSetMyAvatar: handleSetMyAvatar },
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

  // Chargement en cours des familles réelles : on ne sait pas encore si l'utilisateur en a une.
  const familiesLoading = currentUser && currentUser.id !== "demo" && !familiesLoaded;

  // L'utilisateur est connecté mais n'est membre d'aucune famille → FamilySetupView obligatoire
  // (basé sur l'appartenance réelle via userFamilies, pas sur activeFamilyId qui peut être
  // absent/périmé même quand l'utilisateur a bien une famille)
  const needsFamilySetup = currentUser && currentUser.id !== "demo" && familiesLoaded && userFamilies.length === 0;

  return (
    <div className={`mp-root${darkMode ? " dark" : ""}`}>
      <GlobalStyle />

      {/* Auth */}
      {!currentUser && authScreen === "login" && <LoginView onLogin={handleLogin} onGoRegister={() => setAuthScreen("register")} onGoForgot={() => setAuthScreen("forgot")} />}
      {!currentUser && authScreen === "register" && <RegisterView onRegister={handleRegister} onGoLogin={() => setAuthScreen("login")} />}
      {!currentUser && authScreen === "forgot" && <ForgotPasswordView onGoLogin={() => setAuthScreen("login")} />}

      {/* Chargement des familles réelles (bref instant après connexion) */}
      {familiesLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <p className="mp-small mp-text-faint">Chargement…</p>
        </div>
      )}

      {/* Setup famille obligatoire */}
      {needsFamilySetup && <FamilySetupView currentUser={currentUser} onCreateFamily={handleCreateFamily} onJoinFamily={handleJoinFamily} />}

      {/* App principale */}
      {currentUser && !needsFamilySetup && !familiesLoading && (
        <>
          <div className="mp-shell">
            <Sidebar currentView={currentView} onNavigate={setCurrentView} darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} currentUser={currentUser} onLogout={handleLogout} families={userFamilies} activeFamily={activeFamily} onSetActiveFamily={handleSetActiveFamily} />
            <main className="mp-main">{renderView()}</main>
          </div>

          <button type="button" className="mp-fab mp-hide-desktop" onClick={() => setShowFab(true)} aria-label="Planifier un repas">
            <Icon name="plus" size={22} />
          </button>

          {showFab && (
            <QuickPlanModal recipes={familyRecipes} recentRecipeIds={recentRecipeIds} familyMembers={activeFamily?.members || []} onClose={() => setShowFab(false)}
              onSave={(mealData) => { handleAddMeal(mealData); setShowFab(false); showToast(`Repas planifié le ${mealData.date}`); }} />
          )}

          <Toast toast={toast} />
        </>
      )}
    </div>
  );
};

export default App;
