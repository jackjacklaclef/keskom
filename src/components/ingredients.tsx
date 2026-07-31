import { useState } from "react";

import { space, radius } from "../theme";
import { ingredientCategories } from "../constants";
import { Icon, CategoryDot, EmptyState } from "./ui";

export const IngredientsView = ({ ingredients, onAddIngredient, onDeleteIngredient }) => {
  const [selectedCategory, setSelectedCategory] = useState("legumes");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("legumes");

  const filteredIngredients = ingredients.filter(
    (ing) => ing.category === selectedCategory && ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    if (!newName.trim()) return;
    onAddIngredient({ id: Date.now().toString(), name: newName.trim(), category: newCategory });
    setNewName(""); setShowAddForm(false);
  };

  return (
    <div>
      <div className="mp-view-header">
        <h1 className="mp-h1">Ingrédients</h1>
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
  );
};
