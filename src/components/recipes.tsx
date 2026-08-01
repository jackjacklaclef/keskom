import { useState, useEffect, useMemo } from "react";

import { colors, space, radius } from "../theme";
import { RECIPE_CATEGORIES, QUANTITY_UNITS, ingredientCategories } from "../constants";
import { getSupabase } from "../lib/supabaseClient";
import { Modal, ModalHeader, Field, Icon, CategoryIcon, CategoryDot, EmptyState } from "./ui";

const getIngredientMeta = (ingredients, ingredientId) => {
  const ingredient = ingredients.find((i) => i.id === ingredientId);
  const category = ingredient ? ingredientCategories.find((c) => c.id === ingredient.category) : null;
  return { ingredient, category };
};

// Durée totale (prépa + cuisson) affichée en format compact ("1h05", "35 min")
const formatDuration = (prepMinutes, cookMinutes) => {
  const total = (prepMinutes || 0) + (cookMinutes || 0);
  if (total <= 0) return null;
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60), m = total % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

export const RecipeModal = ({ recipe, ingredients, onClose, onSave }) => {
  const isVariant = !!(recipe?.parentId);
  const [name, setName] = useState(recipe?.name || "");
  const [category, setCategory] = useState(recipe?.category || "main");
  const [portions, setPortions] = useState(recipe?.portions || 4);
  const [originCountry, setOriginCountry] = useState(recipe?.originCountry || "");
  const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes || "");
  const [cookMinutes, setCookMinutes] = useState(recipe?.cookMinutes || "");
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
    onSave({
      id: recipe?.id || Date.now().toString(), name: name.trim(), category, portions,
      originCountry: originCountry.trim() || null,
      prepMinutes: prepMinutes !== "" ? Number(prepMinutes) : null,
      cookMinutes: cookMinutes !== "" ? Number(cookMinutes) : null,
      description: description.trim(), ingredients: recipeIngredients, tags, steps,
      parentId: recipe?.parentId || null, rootId: recipe?.rootId || null, variantName: variantName.trim() || null,
    });
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
              <CategoryIcon icon={cat.icon} size={16} color={cat.hex} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </Field>

      {/* Pays d'origine + durées */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.9rem" }}>
        <div style={{ flex: 1 }}>
          <span className="mp-label">Pays d'origine</span>
          <input className="mp-input" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)}
            placeholder="Ex : Italie" />
        </div>
        <div style={{ width: "6.5rem", flexShrink: 0 }}>
          <span className="mp-label">Prépa. (min)</span>
          <input className="mp-input" type="number" min="0" value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value)} placeholder="15" />
        </div>
        <div style={{ width: "6.5rem", flexShrink: 0 }}>
          <span className="mp-label">Cuisson (min)</span>
          <input className="mp-input" type="number" min="0" value={cookMinutes}
            onChange={(e) => setCookMinutes(e.target.value)} placeholder="20" />
        </div>
      </div>

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
export const StepTimer = ({ seconds }) => {
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

export const CookModeModal = ({ recipe, onClose }) => {
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
export const RecipeDetailModal = ({ recipe, ingredients, allRecipes = [], currentUser, userFamilies = [], activeFamily, onClose, onEdit, onCreateVariant, onShareRecipe }) => {
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
      {/* Photo du plat — étirée jusqu'aux bords du modal (marge négative = padding du modal) */}
      {recipe.photoUrl && (
        <div style={{ margin: "-1.5rem -1.5rem 1rem" }}>
          <img src={recipe.photoUrl} alt={recipe.name}
            style={{ width: "100%", height: "13rem", objectFit: "cover", display: "block", borderRadius: `${radius.lg} ${radius.lg} 0 0` }} />
          {recipe.photoAttribution && (
            <p className="mp-micro mp-text-faint" style={{ textAlign: "right", padding: "0.2rem 0.9rem 0" }}>{recipe.photoAttribution}</p>
          )}
        </div>
      )}

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

          {(recipe.portions || recipe.originCountry || formatDuration(recipe.prepMinutes, recipe.cookMinutes)) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: space.md }}>
              {recipe.portions && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: radius.pill, background: "var(--paper-sunken)", border: "1px solid var(--line)" }}>
                  <Icon name="users" size={14} />
                  <span className="mp-small" style={{ fontWeight: 500 }}>{recipe.portions} portion{recipe.portions > 1 ? "s" : ""}</span>
                </div>
              )}
              {formatDuration(recipe.prepMinutes, recipe.cookMinutes) && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: radius.pill, background: "var(--paper-sunken)", border: "1px solid var(--line)" }}
                  title={`Préparation ${recipe.prepMinutes || 0} min · Cuisson ${recipe.cookMinutes || 0} min`}>
                  <Icon name="clock" size={14} />
                  <span className="mp-small" style={{ fontWeight: 500 }}>{formatDuration(recipe.prepMinutes, recipe.cookMinutes)}</span>
                </div>
              )}
              {recipe.originCountry && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: radius.pill, background: "var(--paper-sunken)", border: "1px solid var(--line)" }}>
                  <Icon name="globe" size={14} />
                  <span className="mp-small" style={{ fontWeight: 500 }}>{recipe.originCountry}</span>
                </div>
              )}
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

export const RecipesView = ({ recipes, allRecipes = [], globalRecipes = [], ingredients, currentUser, userFamilies = [], activeFamily, onAddRecipe, onEditRecipe, onDeleteRecipe, onImportRecipe, onCreateVariant, onShareRecipe, activeFamilyId }) => {
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
                {recipe.photoUrl && (
                  <img src={recipe.photoUrl} alt={recipe.name}
                    style={{ margin: "-1.1rem -1.1rem 0.6rem", width: "calc(100% + 2.2rem)", height: "7rem", objectFit: "cover", display: "block", borderRadius: `${radius.lg} ${radius.lg} 0 0` }} />
                )}
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center", marginBottom: "0.3rem" }}>
                  {recipe.parentId && <span className="mp-badge mp-badge-sage" style={{ fontSize: "0.58rem" }}>Variante</span>}
                  {cat && <span className="mp-badge" style={{ background: `${cat.hex}18`, color: cat.hex, border: `1px solid ${cat.hex}30`, fontSize: "0.62rem", fontWeight: 600 }}>{cat.label}</span>}
                  {recipe.tags.slice(0, 3).map((tag) => <span key={tag} className="mp-badge mp-badge-clay">{tag}</span>)}
                  {recipe.tags.length > 3 && <span className="mp-badge mp-badge-neutral">+{recipe.tags.length - 3}</span>}
                </div>
                {(recipe.originCountry || formatDuration(recipe.prepMinutes, recipe.cookMinutes)) && (
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    {recipe.originCountry && (
                      <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <Icon name="globe" size={11} /> {recipe.originCountry}
                      </span>
                    )}
                    {formatDuration(recipe.prepMinutes, recipe.cookMinutes) && (
                      <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <Icon name="clock" size={11} /> {formatDuration(recipe.prepMinutes, recipe.cookMinutes)}
                      </span>
                    )}
                  </div>
                )}
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
                {recipe.photoUrl ? (
                  <img src={recipe.photoUrl} alt={recipe.name} style={{ width: "1.8rem", height: "1.8rem", borderRadius: radius.sm, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: "1.1rem", lineHeight: 1, flexShrink: 0, width: "1.4rem", textAlign: "center" }}>{cat ? <CategoryIcon icon={cat.icon} size={16} color={cat.hex} /> : <Icon name="cat-other" size={16} />}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="mp-small" style={{ fontWeight: 600 }}>{recipe.variantName || recipe.name}</span>
                  {recipe.variantName && <span className="mp-micro mp-text-faint" style={{ marginLeft: "0.4rem" }}>{recipe.name}</span>}
                </div>
                {formatDuration(recipe.prepMinutes, recipe.cookMinutes) && (
                  <span className="mp-micro mp-text-faint" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", flexShrink: 0 }}>
                    <Icon name="clock" size={11} /> {formatDuration(recipe.prepMinutes, recipe.cookMinutes)}
                  </span>
                )}
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
