import { useState, useMemo } from "react";

import { space } from "../theme";
import { ingredientCategories } from "../constants";
import { todayStr } from "../lib/dateUtils";
import { Icon, CategoryDot, EmptyState, Modal, ModalHeader, Field } from "./ui";

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

export const ShoppingItemRow = ({ item, onToggle, onDelete }) => (
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

export const CategorySection = ({ meta, items, onToggle, onDelete }) => (
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
export const DateRangeBar = ({ dateFrom, dateTo, onChangeDateFrom, onChangeDateTo }) => {
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

export const ShoppingListView = ({ shoppingList, ingredients, onAddItem, onToggleItem, onDeleteItem, onGenerate }) => {
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

export const AddShoppingItemModal = ({ onClose, onSave }) => {
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

export const ExportListModal = ({ shoppingList, ingredients, onClose }) => {
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
