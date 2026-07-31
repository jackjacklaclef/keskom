import { useState, useMemo } from "react";
import React from "react";

import { space, radius } from "../theme";
import { MEAL_TYPES, DAYS_OF_WEEK } from "../constants";
import { getMondayOf, dateOfSlot } from "../lib/dateUtils";
import { Modal, ModalHeader, Field, Icon, EmptyState } from "./ui";
import { RecipeSelectionModal } from "./recipeSelection";

// Mini grille 7j × 3 repas pour afficher/éditer un template
export const TemplateGrid = ({ slots, recipes, onCellClick, readOnly }) => (
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
            const slot = slots.find((s) => s.day === dayIdx && s.type === type.id);
            const slotRecipeIds = slot?.recipeIds || [];
            const status = slot?.status || "normal";
            const names = slotRecipeIds
              .map((id) => recipes.find((r) => r.id === id)?.name)
              .filter(Boolean);
            const filled = names.length > 0 || status !== "normal";
            const label = status === "restaurant"
              ? "Restaurant"
              : status === "skip"
              ? "Pas de repas"
              : (names.length > 0 ? (names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`) : null);
            const specialColor = status === "restaurant" ? "amber" : status === "skip" ? "neutral" : null;
            const washColor = specialColor === "amber" ? "var(--amber-wash)" : specialColor === "neutral" ? "var(--paper-sunken)" : (type.color === "amber" ? "var(--amber-wash)" : type.color === "clay" ? "var(--clay-wash)" : "var(--sage-wash)");
            const textColor = specialColor === "amber" ? "var(--amber)" : specialColor === "neutral" ? "var(--ink-soft)" : (type.color === "amber" ? "var(--amber)" : type.color === "clay" ? "var(--clay)" : "var(--sage)");

            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => !readOnly && onCellClick && onCellClick(dayIdx, type.id, slotRecipeIds, status)}
                style={{
                  padding: "0.25rem 0.3rem",
                  borderRadius: radius.sm,
                  border: filled ? `1px solid ${washColor}` : "1px dashed var(--line)",
                  background: filled ? washColor : "transparent",
                  cursor: readOnly ? "default" : "pointer",
                  fontSize: "0.6rem",
                  lineHeight: 1.3,
                  color: filled ? textColor : "var(--ink-faint)",
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
export const WeekTemplateEditor = ({ template, recipes, recentRecipeIds, activeFamily, onSave, onCancel }) => {
  const [name, setName] = useState(template?.name || "Nouvelle semaine type");
  const [scope, setScope] = useState(template?.scope || "family");
  const [slots, setSlots] = useState(template?.slots || []);
  const [editingCell, setEditingCell] = useState(null); // { day, type, recipeIds }

  const handleCellClick = (day, type, currentIds, currentStatus) => {
    setEditingCell({ day, type, recipeIds: currentIds, status: currentStatus || "normal" });
  };

  const handleCellSave = (recipeIds, status = "normal") => {
    if (!editingCell) return;
    setSlots((prev) => {
      // Retirer les slots existants pour ce créneau, puis ajouter le nouveau
      const filtered = prev.filter((s) => !(s.day === editingCell.day && s.type === editingCell.type));
      if (status !== "normal" || recipeIds.length > 0) {
        return [...filtered, { day: editingCell.day, type: editingCell.type, recipeIds, status }];
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
          meal={{ recipeIds: editingCell.recipeIds, status: editingCell.status }}
          mealType={editingCell.type}
          date={`${DAYS_OF_WEEK[editingCell.day]}`}
          recentRecipeIds={recentRecipeIds}
          onClose={() => setEditingCell(null)}
          onSave={(recipeIds) => handleCellSave(recipeIds, "normal")}
          onSaveStatus={(status, recipeIds) => handleCellSave(recipeIds, status)}
        />
      )}
    </div>
  );
};

// Modale pour appliquer un template à une semaine donnée
export const ApplyTemplateModal = ({ template, recipes, mealPlans, onClose, onApply }) => {
  const monday = getMondayOf(new Date());
  const [weekStart, setWeekStart] = useState(monday.toISOString().split("T")[0]);
  const [mode, setMode] = useState("merge"); // "merge" | "overwrite"

  const preview = useMemo(() => {
    const mon = getMondayOf(new Date(weekStart + "T12:00:00"));
    return template.slots.map((slot) => {
      const date = dateOfSlot(mon, slot.day);
      const names = slot.recipeIds.map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean);
      const type = MEAL_TYPES.find((t) => t.id === slot.type);
      return { date, type, names, status: slot.status || "normal", day: DAYS_OF_WEEK[slot.day] };
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
                <span className="mp-small" style={{ flex: 1 }}>
                  {p.status === "restaurant" ? "Restaurant" : p.status === "skip" ? "Pas de repas" : (p.names.join(", ") || <em>—</em>)}
                </span>
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
// TEMPLATES VIEW
// ============================================================

export const TemplatesView = ({ weekTemplates, recipes, recentRecipeIds, activeFamily,
  onSaveTemplate, onDeleteTemplate, onApplyTemplate,
}) => {
  const [editingTemplate, setEditingTemplate] = useState(undefined);
  const [applyingTemplate, setApplyingTemplate] = useState(null);

  const familyTemplates = weekTemplates.filter((t) => t.scope === "family" || (!t.scope && t.familyId === activeFamily?.id));
  const userTemplates = weekTemplates.filter((t) => t.scope === "user");

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
        <h1 className="mp-h1">Modèles</h1>
      </div>

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

      {applyingTemplate && (
        <ApplyTemplateModal template={applyingTemplate} recipes={recipes} mealPlans={[]}
          onClose={() => setApplyingTemplate(null)}
          onApply={(weekStart, mode) => { onApplyTemplate(applyingTemplate, weekStart, mode); setApplyingTemplate(null); }} />
      )}
    </div>
  );
};
