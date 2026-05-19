import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Flame, ChefHat, CheckCircle, XCircle, MinusCircle, Trash2, Shuffle, ShoppingCart, AlertTriangle, UtensilsCrossed, Pencil, Star, MessageCircle, Globe, Lock } from 'lucide-react';
import { getRecipe, deleteRecipe, cookRecipe, getComments, addComment, deleteComment } from '../../services/recipeService';
import { getAllProducts } from '../../services/productService';
import { addItems } from '../../services/shoppingService';
import { useAuth } from '../../context/AuthContext';
import './Recipes.css';

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

const normalize = str =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

const SUBSTITUTION_MAP = {
  'huevo':       ['clara', 'yema', 'huevo'],
  'leche':       ['nata', 'leche entera', 'leche desnatada', 'leche vegetal', 'bebida vegetal', 'leche'],
  'mantequilla': ['margarina', 'aceite'],
  'aceite':      ['mantequilla', 'margarina'],
  'azúcar':      ['miel', 'estevia', 'edulcorante', 'panela', 'azucar'],
  'harina':      ['harina integral', 'maicena', 'almidón'],
  'yogur':       ['nata', 'crema', 'queso fresco', 'yogurt'],
  'pollo':       ['pavo', 'pechuga', 'muslo de pollo'],
  'tomate':      ['tomate frito', 'salsa de tomate', 'tomate triturado'],
  'queso':       ['queso rallado', 'parmesano', 'queso manchego', 'queso fresco'],
  'pasta':       ['macarrones', 'espagueti', 'fideos', 'tallarines'],
  'cebolla':     ['cebolleta', 'puerro', 'chalota', 'cebollino'],
  'ajo':         ['ajo en polvo', 'ajete'],
  'jamón':       ['jamón serrano', 'jamón cocido', 'bacon', 'beicon', 'panceta', 'jamon'],
  'patata':      ['boniato', 'patata dulce'],
  'limón':       ['lima', 'naranja', 'vinagre'],
  'vinagre':     ['limón', 'lima'],
  'pan':         ['picatostes', 'tostadas', 'pan rallado'],
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userAllergies = toArray(user?.allergies);

  const [recipe, setRecipe]           = useState(null);
  const [pantryItems, setPantryItems] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [deleting, setDeleting]           = useState(false);
  const [addingToList, setAddingToList]   = useState(false);
  const [cooked, setCooked]               = useState(false);
  const [cookingLoading, setCookingLoading] = useState(false);

  // Rating
  const [avgRating, setAvgRating]       = useState(0);
  const [ratingCount, setRatingCount]   = useState(0);
  const [userRating, setUserRating]     = useState(null);
  const [newReviewStars, setNewReviewStars]         = useState(0);
  const [hoveredReviewStar, setHoveredReviewStar]   = useState(null);

  // Comments
  const [comments, setComments]           = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await getComments(id);
      setComments(res.data?.comments ?? []);
    } catch { /* silencioso */ }
    finally { setCommentsLoading(false); }
  }, [id]);

  useEffect(() => {
    Promise.all([
      getRecipe(id).then(res => res.data?.recipe ?? null),
      getAllProducts().then(res => {
        const prods = res.products ?? res.data?.products ?? [];
        return prods.map(p => ({
          name:     normalize(p.name),
          quantity: p.quantity,
          unit:     p.unit ?? '',
        }));
      }),
    ])
      .then(([fetchedRecipe, items]) => {
        setRecipe(fetchedRecipe);
        setPantryItems(items);
        if (fetchedRecipe) {
          setAvgRating(fetchedRecipe.avg_rating ?? 0);
          setRatingCount(fetchedRecipe.rating_count ?? 0);
          setUserRating(fetchedRecipe.user_rating ?? null);
          setNewReviewStars(fetchedRecipe.user_rating ?? 0);
        }
      })
      .catch(() => setError('Error al cargar la receta'))
      .finally(() => setLoading(false));
  }, [id]);

  // Cargar comentarios cuando la receta sea pública
  useEffect(() => {
    if (recipe?.is_public) loadComments();
  }, [recipe, loadComments]);

  const checkIngredient = (key) => {
    if (!key || !pantryItems) return null;
    const keyNorm = normalize(key);
    const match = pantryItems.find(p => p.name.includes(keyNorm) || keyNorm.includes(p.name));
    if (!match) return { found: false };
    return { found: true, quantity: match.quantity, unit: match.unit };
  };

  const findSubstitutes = (key) => {
    if (!key || !pantryItems) return [];
    const keyNorm = normalize(key);
    const possibleSubs = SUBSTITUTION_MAP[keyNorm] || [];
    return possibleSubs.reduce((acc, sub) => {
      const subNorm = normalize(sub);
      const match = pantryItems.find(p => p.name.includes(subNorm) || subNorm.includes(p.name));
      if (match) acc.push({ name: sub, quantity: match.quantity, unit: match.unit });
      return acc;
    }, []);
  };

  const handleAddMissingToList = async () => {
    const missing = toArray(recipe.ingredients)
      .filter(ing => {
        const result = checkIngredient(ing.key ?? null);
        return result !== null && !result.found;
      })
      .map(ing => ({ name: ing.text, quantity: null, unit: 'unidades' }));

    if (missing.length === 0) {
      alert('No faltan ingredientes, ¡tienes todo en la despensa!');
      return;
    }
    setAddingToList(true);
    try {
      await addItems(missing);
      alert(`${missing.length} ingrediente(s) añadido(s) a tu lista de la compra.`);
    } catch {
      alert('Error al añadir a la lista de la compra');
    } finally {
      setAddingToList(false);
    }
  };

  const handleCook = async () => {
    setCookingLoading(true);
    try {
      await cookRecipe(id);
      setCooked(true);
    } catch {
      alert('Error al registrar la receta');
    } finally {
      setCookingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la receta "${recipe.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      navigate('/recipes');
    } catch {
      alert('Error al eliminar la receta');
      setDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addComment(id, newComment.trim(), newReviewStars || null);
      setComments(prev => [...prev, res.data.comment]);
      if (res.data.avg_rating !== undefined) {
        setAvgRating(res.data.avg_rating);
        setRatingCount(res.data.rating_count);
        if (newReviewStars) setUserRating(newReviewStars);
      }
      setNewComment('');
    } catch {
      alert('Error al publicar la reseña');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      alert('Error al eliminar el comentario');
    }
  };

  if (loading) return <div className="loading">Cargando receta...</div>;
  if (error)   return <div className="error-message">{error}</div>;
  if (!recipe) return <div className="error-message">Receta no encontrada</div>;

  const timeLabel = recipe.time_minutes ? `${recipe.time_minutes} min` : '—';
  const isOwn     = recipe.user_id === user?.id;
  const isPublic  = !!recipe.is_public;
  // Puede puntuar si la receta es pública y no es suya
  const canRate   = isPublic && !isOwn;

  return (
    <div className="mobile-container recipe-detail-page">
      <div className="detail-hero">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name} />
        ) : (
          <div className="recipe-hero-placeholder" />
        )}
        <button className="btn-back-float" onClick={() => navigate('/recipes')}>
          <ArrowLeft size={24} />
        </button>
        {isOwn && (
          <>
            <button className="btn-edit-float" onClick={() => navigate(`/recipes/${id}/edit`)}>
              <Pencil size={18} />
            </button>
            <button className="btn-delete-float" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>

      <div className="detail-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <h1 className="recipe-title-lg" style={{ flex: 1 }}>{recipe.name}</h1>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', color: isPublic ? '#3b82f6' : '#888', whiteSpace: 'nowrap', paddingTop: '0.35rem' }}>
            {isPublic ? <Globe size={13} /> : <Lock size={13} />}
            {isPublic ? 'Pública' : 'Privada'}
          </span>
        </div>

        {/* Autor (solo recetas de comunidad) */}
        {recipe.author && !isOwn && (
          <p style={{ fontSize: '0.82rem', color: '#888', margin: '-0.25rem 0 0.25rem' }}>
            por {recipe.author.name}
          </p>
        )}

        {/* Valoración estilo Amazon */}
        {isPublic && (avgRating > 0 || ratingCount > 0 || recipe.comment_count > 0) && (
          <div className="recipe-rating-row">
            {avgRating > 0 && (
              <>
                <span className="social-rating-num">{avgRating.toFixed(1).replace('.', ',')}</span>
                <span className="social-stars">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'}
                      color={s <= Math.round(avgRating) ? '#f59e0b' : '#ddd'}
                    />
                  ))}
                </span>
                <span className="social-rating-count">({ratingCount})</span>
              </>
            )}
            {recipe.comment_count > 0 && (
              <span className="recipe-rating-comments">
                {avgRating > 0 ? '·' : ''} {recipe.comment_count} comentario{recipe.comment_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <div className="recipe-stats">
          <div className="stat-item">
            <Clock size={24} />
            <span>{timeLabel}</span>
            <span className="stat-label">Tiempo</span>
          </div>
          {recipe.calories && (
            <div className="stat-item">
              <Flame size={24} />
              <span>{recipe.calories}</span>
              <span className="stat-label">Calorías</span>
            </div>
          )}
          <div className="stat-item">
            <ChefHat size={24} />
            <span>{recipe.difficulty}</span>
            <span className="stat-label">Dificultad</span>
          </div>
        </div>

        <h3 className="section-title">Ingredientes</h3>

        {(() => {
          if (!userAllergies.length || !recipe) return null;
          const texts = toArray(recipe.ingredients).map(ing =>
            normalize((ing.text || '') + ' ' + (ing.key || ''))
          );
          const found = userAllergies.filter(allergy =>
            (ALLERGEN_KEYWORDS[allergy] || []).some(kw => texts.some(t => t.includes(kw)))
          );
          if (!found.length) return null;
          return (
            <div className="allergen-warning">
              <AlertTriangle size={18} />
              <div>
                <strong>Contiene alérgenos</strong>
                <span>{found.join(' · ')}</span>
              </div>
            </div>
          );
        })()}

        {pantryItems !== null && (
          <>
            <div className="ingredient-legend">
              <span className="legend-item legend-have"><CheckCircle size={12} /> En tu despensa</span>
              <span className="legend-item legend-missing"><XCircle size={12} /> Te falta</span>
              <span className="legend-item legend-basic"><MinusCircle size={12} /> Básico</span>
            </div>
            <button
              className="btn-add-to-shopping"
              onClick={handleAddMissingToList}
              disabled={addingToList}
            >
              <ShoppingCart size={15} />
              {addingToList ? 'Añadiendo…' : 'Añadir faltantes a la lista de la compra'}
            </button>
          </>
        )}

        <ul className="ingredients-list">
          {toArray(recipe.ingredients).map((ing, idx) => {
            const key    = ing.key ?? null;
            const result = checkIngredient(key);
            const subs   = result && !result.found ? findSubstitutes(key) : [];

            let icon, rowClass, quantityTag;
            if (result === null) {
              icon        = <MinusCircle size={18} className="ing-icon basic" />;
              rowClass    = '';
              quantityTag = null;
            } else if (result.found) {
              icon        = <CheckCircle size={18} className="ing-icon have" />;
              rowClass    = 'ing-have';
              quantityTag = (
                <span className="ing-quantity">
                  Tienes: {result.quantity} {result.unit}
                </span>
              );
            } else {
              icon        = <XCircle size={18} className="ing-icon missing" />;
              rowClass    = 'ing-missing';
              quantityTag = <span className="ing-quantity missing-tag">Falta</span>;
            }

            return (
              <li key={idx}>
                <div className={`ing-row ${rowClass}`}>
                  {icon}
                  <span className="ing-name">{ing.text}</span>
                  {quantityTag}
                </div>
                {subs.length > 0 && (
                  <div className="substitute-row">
                    <Shuffle size={12} className="substitute-icon" />
                    <span className="substitute-text">
                      Posible sustituto: {subs.map(s =>
                        `${s.name} (tienes ${s.quantity} ${s.unit})`
                      ).join(' · ')}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button
          className={`btn-cook ${cooked ? 'btn-cook-done' : ''}`}
          onClick={handleCook}
          disabled={cookingLoading || cooked}
        >
          <UtensilsCrossed size={18} />
          {cooked ? '¡Receta registrada!' : cookingLoading ? 'Guardando...' : 'Marcar como cocinada'}
        </button>

        <h3 className="section-title">Preparación</h3>
        <div className="steps-list">
          {toArray(recipe.steps).map((step, idx) => (
            <div key={idx} className="step-item">
              <span className="step-number">{idx + 1}</span>
              <p className="step-text">{step}</p>
            </div>
          ))}
        </div>

        {/* ── Comentarios y valoraciones (solo recetas públicas) ── */}
        {isPublic && (
          <div className="comments-section">
            <h3>
              <MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Comentarios ({comments.length})
            </h3>

            {/* Formulario de reseña: estrellas + texto, solo para recetas ajenas */}
            {canRate && (
              <div className="comment-form">
                <div className="review-stars-picker">
                  <span className="review-stars-label">Tu valoración *</span>
                  <div className="review-stars-row">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= (hoveredReviewStar ?? newReviewStars) ? 'filled' : ''}`}
                        onClick={() => setNewReviewStars(star === newReviewStars ? 0 : star)}
                        onMouseEnter={() => setHoveredReviewStar(star)}
                        onMouseLeave={() => setHoveredReviewStar(null)}
                        aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
                      >
                        <Star
                          size={26}
                          fill={star <= (hoveredReviewStar ?? newReviewStars) ? '#f59e0b' : 'none'}
                          color={star <= (hoveredReviewStar ?? newReviewStars) ? '#f59e0b' : '#ccc'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="comment-input"
                  rows={2}
                  placeholder="Comparte tu opinión..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                {!newReviewStars && newComment.trim() && (
                  <p style={{ fontSize: '0.8em', color: '#e53935', margin: '0 0 0.4rem' }}>
                    Selecciona una valoración antes de publicar.
                  </p>
                )}
                <button
                  className="comment-submit"
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim() || !newReviewStars}
                >
                  Publicar reseña
                </button>
              </div>
            )}

            {commentsLoading ? (
              <p className="no-comments">Cargando...</p>
            ) : comments.length === 0 ? (
              <p className="no-comments">{isOwn ? 'Aún no hay comentarios.' : 'Sé el primero en comentar.'}</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-body">
                    <div className="comment-header">
                      <p className="comment-author">{c.author?.name ?? 'Usuario'}</p>
                      {c.rating && (
                        <span className="comment-inline-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= c.rating ? '#f59e0b' : 'none'}
                              color={s <= c.rating ? '#f59e0b' : '#ddd'}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="comment-text">{c.content}</p>
                    <p className="comment-date">{formatDate(c.created_at)}</p>
                  </div>
                  {c.user_id === user?.id && (
                    <button
                      className="comment-delete"
                      onClick={() => handleDeleteComment(c.id)}
                      aria-label="Eliminar comentario"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;
