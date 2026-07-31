import { useState, useMemo } from "react";

import { space, radius } from "../theme";
import { MEAL_TYPES, RECIPE_CATEGORIES } from "../constants";
import { Modal, ModalHeader, Icon, CategoryIcon, EmptyState } from "./ui";

export const RecipeSelectionModal = ({ recipes, meal, mealType, date, onClose, onSave, onSaveStatus, recentRecipeIds = [], familyMembers = [] }) => {
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
