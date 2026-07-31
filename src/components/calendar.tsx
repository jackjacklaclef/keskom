import { useState, useMemo } from "react";
import React from "react";

import { space, radius } from "../theme";
import { MEAL_TYPES, DAYS_OF_WEEK, MONTHS } from "../constants";
import { todayStr, getMondayOf } from "../lib/dateUtils";
import { Icon, Modal, ModalHeader, Field } from "./ui";
import { RecipeSelectionModal } from "./recipeSelection";

// Modale de confirmation pour vider une semaine
export const ClearWeekModal = ({ dateStr, mealPlans, onClose, onClear }) => {
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
export const ApplyTemplateModeModal = ({ template, dateStr, onClose, onApply }) => {
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
export const DuplicateWeekModal = ({ dateStr, mealPlans, onClose, onDuplicate }) => {
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
export const AttendeeAvatarStack = ({ attendeeIds, familyMembers = [], max = 4 }) => {
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
export const DayPanel = ({
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

export const CalendarView = ({ mealPlans, recipes, onAddMeal, onUpdateMeal, recentRecipeIds = [], weekTemplates = [], onApplyTemplate, onDuplicateWeek, onClearWeek, onNavigate, familyMembers = [] }) => {
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
                        onClick={() => { setShowWeekTemplates(false); onNavigate("templates"); }}
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
                        <button type="button" onClick={() => { setShowWeekTemplates(false); onNavigate("templates"); }}
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

export const QuickPlanModal = ({ recipes, recentRecipeIds, onClose, onSave, familyMembers = [] }) => {
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
