import React, { useState, useEffect, useMemo } from "react";

import { space, radius, GlobalStyle } from "./theme";
import {
  MEAL_TYPES, NAV_PRIMARY, NAV_SECONDARY,
  DAYS_OF_WEEK, MONTHS,
  APPETITE_LEVELS, STORAGE_KEYS,
} from "./constants";

import {
  Icon, Modal, ModalHeader, Field, useToast, Toast,
  NavButton, LogoMark,
} from "./components/ui";


import type { AppUser } from "./types";
import { getSupabase } from "./lib/supabaseClient";
import {
  loadFromStorage, saveToStorage, DEMO_FAMILY, generateInviteCode,
  initialRecipes, initialMealPlans, initialShoppingList, initialIngredients,
} from "./lib/storage";
import { AuthService } from "./lib/authService";
import {
  fetchIngredients, fetchRecipeCategoryMap, fetchIngredientCategoryMap, fetchUserPreferences,
  saveFoodRestrictions, saveDiets, fetchRecipesForUser, saveRecipeIngredients, saveRecipeSteps,
  fetchMealPlansForFamily, upsertMealSlot, fetchShoppingListForFamily, fetchWeekTemplatesForFamily,
  fetchFamiliesForUser,
} from "./lib/dataLayer";
import { todayStr, getMondayOf, dateOfSlot } from "./lib/dateUtils";
import { RecipeSelectionModal } from "./components/recipeSelection";
import { ShoppingListView } from "./components/shopping";

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


// ============================================================
// RECIPES VIEW
// ============================================================

import { RecipesView } from "./components/recipes";

import { PrivacyView } from "./components/privacy";
import { FamilySetupView, LoginView, RegisterView, ForgotPasswordView } from "./components/auth";
import { AccountView, NotificationsView, PreferencesView } from "./components/account";
import { FamilyView } from "./components/family";



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
