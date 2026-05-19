import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, Plus, AlertTriangle, Star, MessageCircle, Globe } from 'lucide-react';
import { getAllProducts } from '../../services/productService';
import { getAllRecipes, getCommunityRecipes } from '../../services/recipeService';
import { useAuth } from '../../context/AuthContext';
import './Recipes.css';

// ── Helpers ────────────────────────────────────────────────────────
const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

// ── Motor de coincidencia ──────────────────────────────────────────
const normalize = str =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const matchScore = (recipe, pantryNames) => {
  const pantryNorm = pantryNames.map(normalize);
  const kws = toArray(recipe.keywords);
  let matched = 0;
  kws.forEach(kw => {
    const kwNorm = normalize(kw);
    if (pantryNorm.some(name => name.includes(kwNorm) || kwNorm.includes(name))) {
      matched++;
    }
  });
  const total = kws.length || 1;
  return { matched, total, pct: Math.round((matched / total) * 100) };
};

const DIFFICULTIES = ['Todos', 'Fácil', 'Media', 'Difícil'];
const TIME_OPTIONS = [
  { label: 'Todos',     fn: () => true },
  { label: '< 20 min', fn: r => r.time_minutes < 20 },
  { label: '20-40 min', fn: r => r.time_minutes >= 20 && r.time_minutes <= 40 },
  { label: '> 40 min', fn: r => r.time_minutes > 40 },
];
const DIETS = ['Todos', 'Vegetariana', 'Vegana', 'Sin gluten'];

const PREF_TO_DIET = { 'Vegano': 'Vegana', 'Vegetariano': 'Vegetariana', 'Sin gluten': 'Sin gluten' };

const ALLERGEN_KEYWORDS = {
  'Frutos secos': ['almendra', 'nuez', 'avellana', 'pistacio', 'anacardo', 'cacahuete', 'piñon', 'fruto seco'],
  'Marisco':      ['gamba', 'langostino', 'mejillon', 'almeja', 'cangrejo', 'bogavante', 'necora', 'sepia', 'calamar', 'pulpo', 'marisco'],
  'Huevo':        ['huevo', 'clara', 'yema'],
  'Gluten':       ['harina', 'pan', 'pasta', 'macarron', 'espagueti', 'fideo', 'semola', 'trigo', 'cebada', 'centeno', 'avena'],
  'Lácteos':      ['leche', 'queso', 'mantequilla', 'nata', 'yogur', 'crema', 'lacteo'],
  'Soja':         ['soja', 'tofu', 'edamame', 'miso'],
  'Sésamo':       ['sesamo', 'tahini'],
  'Mostaza':      ['mostaza'],
};

const getRecipeAllergens = (recipe, userAllergies) => {
  if (!userAllergies?.length) return [];
  const texts = toArray(recipe.ingredients).map(ing =>
    normalize((ing.text || '') + ' ' + (ing.key || ''))
  );
  return userAllergies.filter(allergy =>
    (ALLERGEN_KEYWORDS[allergy] || []).some(kw => texts.some(t => t.includes(kw)))
  );
};

// ── Componente principal ───────────────────────────────────────────
const RecipeList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userAllergies = toArray(user?.allergies);
  const userPrefs     = toArray(user?.dietary_preferences);

  const [activeTab, setActiveTab] = useState('recetas');

  // Pestaña Recetas
  const [recipes, setRecipes]         = useState([]);
  const [pantryNames, setPantryNames] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Pestaña Comunidad
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError]     = useState('');
  const [communityLoaded, setCommunityLoaded]   = useState(false);

  // Filtros (Recetas)
  const [filterDifficulty, setFilterDifficulty] = useState('Todos');
  const [filterTimeIdx, setFilterTimeIdx]       = useState(0);
  const [filterDiet, setFilterDiet]             = useState(() => {
    for (const [pref, diet] of Object.entries(PREF_TO_DIET)) {
      if (userPrefs.includes(pref)) return diet;
    }
    return 'Todos';
  });

  useEffect(() => {
    Promise.all([
      getAllRecipes().then(res => res.data?.recipes ?? []),
      getAllProducts().then(res => {
        const prods = res.products ?? res.data?.products ?? [];
        return prods.map(p => p.name);
      }),
    ])
      .then(([fetchedRecipes, names]) => {
        setRecipes(fetchedRecipes);
        setPantryNames(names);
      })
      .catch(() => setError('Error al cargar las recetas'))
      .finally(() => setLoading(false));
  }, []);

  const loadCommunity = () => {
    if (communityLoaded) return;
    setCommunityLoading(true);
    getCommunityRecipes()
      .then(res => setCommunityRecipes(res.data?.recipes ?? []))
      .catch(() => setCommunityError('Error al cargar la comunidad'))
      .finally(() => {
        setCommunityLoading(false);
        setCommunityLoaded(true);
      });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'comunidad') loadCommunity();
  };

  // ── Filtrado pestaña Recetas ───────────────────────────────────
  const recipesWithScore = recipes
    .map(r => ({ ...r, score: pantryNames ? matchScore(r, pantryNames) : null }))
    .filter(r => {
      if (filterDifficulty !== 'Todos' && r.difficulty !== filterDifficulty) return false;
      if (!TIME_OPTIONS[filterTimeIdx].fn(r)) return false;
      if (filterDiet !== 'Todos' && !toArray(r.diet).includes(filterDiet.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.score?.pct ?? 0) - (a.score?.pct ?? 0));

  const activeFilters =
    filterDifficulty !== 'Todos' || filterTimeIdx !== 0 || filterDiet !== 'Todos';

  // ── Render card (reutilizado) ─────────────────────────────────
  const renderRecipeCard = (recipe, isCommunity = false) => {
    const score       = recipe.score;
    const isFullMatch = score && score.matched === score.total;
    const isPartial   = score && score.matched > 0 && !isFullMatch;
    const badgeClass  = isFullMatch ? 'match-full' : isPartial ? 'match-partial' : 'match-none';
    const timeLabel   = recipe.time_minutes ? `${recipe.time_minutes} min` : '—';
    const allergens   = getRecipeAllergens(recipe, userAllergies);

    return (
      <div
        key={recipe.id}
        className="recipe-card"
        onClick={() => navigate(`/recipes/${recipe.id}`)}
      >
        <div className="recipe-image-container">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
          ) : (
            <div className="recipe-image-placeholder" />
          )}
          {toArray(recipe.diet).length > 0 && (
            <div className="diet-tags">
              {toArray(recipe.diet).map(d => (
                <span key={d} className={`diet-tag diet-${d.replace(' ', '-')}`}>{d}</span>
              ))}
            </div>
          )}
          {!isCommunity && recipe.user_id && (
            <span className="own-recipe-badge">Mía</span>
          )}
          {isCommunity && (
            <span className="community-badge"><Globe size={11} /> Comunidad</span>
          )}
          {score && (
            <span className={`match-badge ${badgeClass}`}>
              {isFullMatch
                ? '✓ Tienes todo'
                : `${score.matched}/${score.total} ingredientes`}
            </span>
          )}
        </div>

        <div className="recipe-info">
          <h3>{recipe.name}</h3>
          {isCommunity && recipe.author && (
            <p className="recipe-author">por {recipe.author.name}</p>
          )}
          <div className="recipe-meta">
            <span><Clock size={14} /> {timeLabel}</span>
            {recipe.calories && <span><Flame size={14} /> {recipe.calories}</span>}
            <span className="recipe-difficulty-inline">{recipe.difficulty}</span>
          </div>
          {isCommunity && (recipe.avg_rating > 0 || (recipe.comment_count ?? 0) > 0) && (
            <div className="recipe-social-meta">
              {recipe.avg_rating > 0 && (
                <span className="social-rating">
                  <span className="social-rating-num">{recipe.avg_rating.toFixed(1).replace('.', ',')}</span>
                  <span className="social-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= Math.round(recipe.avg_rating) ? '#f59e0b' : 'none'}
                        color={s <= Math.round(recipe.avg_rating) ? '#f59e0b' : '#ddd'}
                      />
                    ))}
                  </span>
                  <span className="social-rating-count">({recipe.rating_count})</span>
                </span>
              )}
              {(recipe.comment_count ?? 0) > 0 && (
                <span className="social-stat">
                  <MessageCircle size={13} /> {recipe.comment_count}
                </span>
              )}
            </div>
          )}
          {allergens.length > 0 && (
            <div className="allergen-card-row">
              <AlertTriangle size={11} /> {allergens.join(', ')}
            </div>
          )}
          {score && (
            <div className="match-bar-container">
              <div className={`match-bar ${badgeClass}`} style={{ width: `${score.pct}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Cargando recetas...</div>;

  return (
    <div className="mobile-container recipes-page">
      <div className="list-header">
        <h1>Recetas</h1>
      </div>

      {/* Pestañas */}
      <div className="recipe-tabs">
        <button
          className={`recipe-tab ${activeTab === 'recetas' ? 'active' : ''}`}
          onClick={() => handleTabChange('recetas')}
        >
          Mis Recetas
        </button>
        <button
          className={`recipe-tab ${activeTab === 'comunidad' ? 'active' : ''}`}
          onClick={() => handleTabChange('comunidad')}
        >
          Comunidad
        </button>
      </div>

      {/* ── Pestaña: Mis Recetas ── */}
      {activeTab === 'recetas' && (
        <>
          {error && <div className="error-message">{error}</div>}

          {pantryNames !== null && !error && (
            <p className="recipes-subtitle">Ordenadas según lo que tienes en tu despensa</p>
          )}

          <div className="recipe-filters">
            <div className="filter-group">
              <span className="filter-label">Dificultad</span>
              <div className="filter-chips">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    className={`filter-chip ${filterDifficulty === d ? 'active' : ''}`}
                    onClick={() => setFilterDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Tiempo</span>
              <div className="filter-chips">
                {TIME_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.label}
                    className={`filter-chip ${filterTimeIdx === idx ? 'active' : ''}`}
                    onClick={() => setFilterTimeIdx(idx)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Dieta</span>
              <div className="filter-chips">
                {DIETS.map(d => (
                  <button
                    key={d}
                    className={`filter-chip ${filterDiet === d ? 'active' : ''}`}
                    onClick={() => setFilterDiet(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {activeFilters && (
              <button
                className="filter-reset"
                onClick={() => { setFilterDifficulty('Todos'); setFilterTimeIdx(0); setFilterDiet('Todos'); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {recipesWithScore.length === 0 ? (
            <div className="no-recipes">
              <p>No hay recetas con estos filtros.</p>
              {activeFilters && (
                <button
                  className="filter-reset"
                  onClick={() => { setFilterDifficulty('Todos'); setFilterTimeIdx(0); setFilterDiet('Todos'); }}
                >
                  Quitar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="recipes-grid">
              {recipesWithScore.map(recipe => renderRecipeCard(recipe, false))}
            </div>
          )}
        </>
      )}

      {/* ── Pestaña: Comunidad ── */}
      {activeTab === 'comunidad' && (
        <>
          {communityError && <div className="error-message">{communityError}</div>}
          {communityLoading && <div className="loading">Cargando comunidad...</div>}

          {!communityLoading && !communityError && (
            communityRecipes.length === 0 ? (
              <div className="no-recipes">
                <Globe size={48} color="#ccc" />
                <p>Aún no hay recetas públicas de otros usuarios.</p>
              </div>
            ) : (
              <div className="recipes-grid">
                {communityRecipes.map(recipe => renderRecipeCard(recipe, true))}
              </div>
            )
          )}
        </>
      )}

      {/* FAB: añadir receta propia */}
      <button className="fab" onClick={() => navigate('/add-recipe')}>
        <Plus size={32} />
      </button>
    </div>
  );
};

export default RecipeList;
