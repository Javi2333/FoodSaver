import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Globe, Lock } from 'lucide-react';
import { createRecipe, updateRecipe, getRecipe } from '../../services/recipeService';
import './RecipeForm.css';

const DIET_OPTIONS = ['vegetariana', 'vegana', 'sin gluten'];

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
};

const RecipeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName]               = useState('');
  const [imageUrl, setImageUrl]       = useState('');
  const [difficulty, setDifficulty]   = useState('Fácil');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [calories, setCalories]       = useState('');
  const [diet, setDiet]               = useState([]);
  const [isPublic, setIsPublic]       = useState(false);
  const [ingredients, setIngredients] = useState([{ text: '', key: '' }]);
  const [steps, setSteps]             = useState(['']);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [loadingRecipe, setLoadingRecipe] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getRecipe(id)
      .then(res => {
        const r = res.data?.recipe;
        if (!r) { setError('Receta no encontrada'); return; }
        setName(r.name || '');
        setImageUrl(r.image_url || '');
        setDifficulty(r.difficulty || 'Fácil');
        setTimeMinutes(r.time_minutes ? String(r.time_minutes) : '');
        setCalories(r.calories || '');
        setDiet(toArray(r.diet));
        setIsPublic(!!r.is_public);
        const ings = toArray(r.ingredients);
        setIngredients(ings.length > 0 ? ings.map(i => ({ text: i.text || '', key: i.key || '' })) : [{ text: '', key: '' }]);
        setSteps(toArray(r.steps).length > 0 ? toArray(r.steps) : ['']);
      })
      .catch(() => setError('Error al cargar la receta'))
      .finally(() => setLoadingRecipe(false));
  }, [id, isEdit]);

  // ── Ingredientes ──────────────────────────────────────
  const addIngredient = () =>
    setIngredients(prev => [...prev, { text: '', key: '' }]);

  const removeIngredient = (idx) =>
    setIngredients(prev => prev.filter((_, i) => i !== idx));

  const updateIngredient = (idx, field, value) =>
    setIngredients(prev =>
      prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing)
    );

  // ── Pasos ─────────────────────────────────────────────
  const addStep = () => setSteps(prev => [...prev, '']);

  const removeStep = (idx) =>
    setSteps(prev => prev.filter((_, i) => i !== idx));

  const updateStep = (idx, value) =>
    setSteps(prev => prev.map((s, i) => i === idx ? value : s));

  // ── Dieta ─────────────────────────────────────────────
  const toggleDiet = (d) =>
    setDiet(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIngredients = ingredients.filter(i => i.text.trim() !== '');
    const cleanSteps       = steps.filter(s => s.trim() !== '');

    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!timeMinutes || parseInt(timeMinutes) < 1) { setError('El tiempo es obligatorio'); return; }
    if (cleanIngredients.length === 0) { setError('Añade al menos un ingrediente'); return; }
    if (cleanSteps.length === 0) { setError('Añade al menos un paso'); return; }

    const payload = {
      name:         name.trim(),
      image_url:    imageUrl.trim() || null,
      time_minutes: parseInt(timeMinutes),
      difficulty,
      calories:     calories.trim() || null,
      diet,
      is_public:    isPublic,
      ingredients:  cleanIngredients.map(i => ({
        text: i.text.trim(),
        key:  i.key.trim() || null,
      })),
      keywords: cleanIngredients
        .filter(i => i.key.trim())
        .map(i => i.key.trim().toLowerCase()),
      steps: cleanSteps,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateRecipe(id, payload);
        navigate(`/recipes/${id}`);
      } else {
        await createRecipe(payload);
        navigate('/recipes');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar la receta';
      setError(msg);
      setSaving(false);
    }
  };

  if (loadingRecipe) return <div className="loading">Cargando receta…</div>;

  return (
    <div className="mobile-container recipe-form-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}>
          <ArrowLeft size={24} />
        </button>
        <h2>{isEdit ? 'Editar receta' : 'Nueva receta'}</h2>
      </div>

      <form className="recipe-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        {/* Nombre */}
        <div className="form-group">
          <label className="detail-label">Nombre *</label>
          <input
            className="detail-input"
            type="text"
            placeholder="Ej: Tortilla de patatas"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Imagen */}
        <div className="form-group">
          <label className="detail-label">Imagen (opcional)</label>
          {imageUrl && (
            <div className="rf-image-preview">
              <img
                src={imageUrl}
                alt="Vista previa"
                onError={e => { e.target.style.display = 'none'; }}
                onLoad={e => { e.target.style.display = 'block'; }}
              />
            </div>
          )}
          <input
            className="detail-input"
            type="url"
            placeholder="https://... (pega una URL de imagen)"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
          />
        </div>

        {/* Dificultad + Tiempo */}
        <div className="rf-row">
          <div className="form-group rf-half">
            <label className="detail-label">Dificultad *</label>
            <select
              className="detail-input"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option>Fácil</option>
              <option>Media</option>
              <option>Difícil</option>
            </select>
          </div>
          <div className="form-group rf-half">
            <label className="detail-label">Tiempo (min) *</label>
            <input
              className="detail-input"
              type="number"
              min="1"
              placeholder="20"
              value={timeMinutes}
              onChange={e => setTimeMinutes(e.target.value)}
            />
          </div>
        </div>

        {/* Calorías (opcional) */}
        <div className="form-group">
          <label className="detail-label">Calorías (opcional)</label>
          <input
            className="detail-input"
            type="text"
            placeholder="Ej: 250 kcal"
            value={calories}
            onChange={e => setCalories(e.target.value)}
          />
        </div>

        {/* Dieta */}
        <div className="form-group">
          <label className="detail-label">Dieta (opcional)</label>
          <div className="rf-diet-chips">
            {DIET_OPTIONS.map(d => (
              <button
                type="button"
                key={d}
                className={`filter-chip ${diet.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDiet(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Visibilidad */}
        <div className="form-group">
          <label className="detail-label">Visibilidad</label>
          <button
            type="button"
            className={`rf-visibility-btn ${isPublic ? 'public' : 'private'}`}
            onClick={() => setIsPublic(p => !p)}
          >
            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
            {isPublic ? 'Pública — visible en Comunidad' : 'Privada — solo para ti'}
          </button>
        </div>

        {/* Ingredientes */}
        <div className="form-group">
          <label className="detail-label">Ingredientes *</label>
          <p className="rf-hint">
            La "palabra clave" sirve para detectar si tienes el ingrediente en tu despensa.
            Si es sal, pimienta, etc. puedes dejarla vacía.
          </p>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="rf-ingredient-row">
              <div className="rf-ingredient-inputs">
                <input
                  className="detail-input"
                  type="text"
                  placeholder="Ej: 3 huevos"
                  value={ing.text}
                  onChange={e => updateIngredient(idx, 'text', e.target.value)}
                />
                <input
                  className="detail-input rf-key-input"
                  type="text"
                  placeholder="Palabra clave: huevo"
                  value={ing.key}
                  onChange={e => updateIngredient(idx, 'key', e.target.value)}
                />
              </div>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  className="rf-remove-btn"
                  onClick={() => removeIngredient(idx)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="rf-add-btn" onClick={addIngredient}>
            <Plus size={16} /> Añadir ingrediente
          </button>
        </div>

        {/* Pasos */}
        <div className="form-group">
          <label className="detail-label">Pasos de preparación *</label>
          {steps.map((step, idx) => (
            <div key={idx} className="rf-step-row">
              <span className="step-number">{idx + 1}</span>
              <textarea
                className="detail-input rf-step-textarea"
                placeholder={`Paso ${idx + 1}...`}
                value={step}
                rows={2}
                onChange={e => updateStep(idx, e.target.value)}
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  className="rf-remove-btn"
                  onClick={() => removeStep(idx)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="rf-add-btn" onClick={addStep}>
            <Plus size={16} /> Añadir paso
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-action"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={saving}
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar receta'}
        </button>
      </form>
    </div>
  );
};

export default RecipeForm;
