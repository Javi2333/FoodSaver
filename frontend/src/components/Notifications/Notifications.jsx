import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../services/productService';
import { getMyRecipeComments } from '../../services/recipeService';
import { getDaysUntilExpiration, formatDate } from '../../utils/dateUtils';
import { AlertTriangle, Clock, ChevronRight, MessageSquare, Star } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [expired, setExpired]           = useState([]);
  const [soonExpiring, setSoonExpiring] = useState([]);
  const [recipeComments, setRecipeComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchProducts(), fetchRecipeComments()]).finally(() => setLoading(false));
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getAllProducts();
      const all = response.products ?? response.data?.products ?? [];
      const exp = [];
      const soon = [];
      all.forEach(p => {
        if (p.location === 'congelador') return;
        const days = getDaysUntilExpiration(p.expiration_date);
        if (days === null) return;
        if (days < 0) exp.push({ ...p, days });
        else if (days <= 3) soon.push({ ...p, days });
      });
      setExpired(exp);
      setSoonExpiring(soon);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipeComments = async () => {
    try {
      const res = await getMyRecipeComments();
      setRecipeComments(res.data?.comments ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Cargando avisos...</div>;

  const total = expired.length + soonExpiring.length;

  return (
    <div className="mobile-container notifications-page">
      <div className="list-header">
        <h1>Avisos</h1>
      </div>

      {/* ── Caducidades ── */}
      {total === 0 ? (
        <div className="no-alerts">
          <Clock size={48} color="#4CAF50" />
          <p>¡Todo en orden!</p>
          <span>No tienes productos caducados ni próximos a caducar.</span>
        </div>
      ) : (
        <>
          {expired.length > 0 && (
            <section className="notif-section">
              <h2 className="notif-section-title danger">
                <AlertTriangle size={18} /> Caducados ({expired.length})
              </h2>
              {expired.map(p => (
                <div
                  key={p.id}
                  className="notif-item danger"
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  <div className="notif-info">
                    <strong>{p.name}</strong>
                    <span>Caducó hace {Math.abs(p.days)} día{Math.abs(p.days) !== 1 ? 's' : ''}</span>
                  </div>
                  <ChevronRight size={20} />
                </div>
              ))}
            </section>
          )}

          {soonExpiring.length > 0 && (
            <section className="notif-section">
              <h2 className="notif-section-title warning">
                <Clock size={18} /> Próximos a caducar ({soonExpiring.length})
              </h2>
              {soonExpiring.map(p => (
                <div
                  key={p.id}
                  className="notif-item warning"
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  <div className="notif-info">
                    <strong>{p.name}</strong>
                    <span>
                      {p.days === 0
                        ? 'Caduca hoy'
                        : `Caduca en ${p.days} día${p.days !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <ChevronRight size={20} />
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* ── Valoraciones de recetas ── */}
      {recipeComments.length > 0 && (
        <section className="notif-section">
          <h2 className="notif-section-title info">
            <MessageSquare size={18} /> Nuevas valoraciones ({recipeComments.length})
          </h2>
          {recipeComments.map(c => (
            <div
              key={c.id}
              className="notif-item info"
              onClick={() => {
                setRecipeComments(prev => prev.filter(x => x.recipe_id !== c.recipe_id));
                navigate(`/recipes/${c.recipe_id}`);
              }}
            >
              <div className="notif-info">
                <strong>{c.author?.name ?? 'Usuario'}</strong>
                <span className="notif-recipe-title">en "{c.recipe_title}"</span>
                {c.rating && (
                  <span className="notif-stars">
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
                <span className="notif-comment-preview">"{c.content.length > 60 ? c.content.slice(0, 60) + '…' : c.content}"</span>
                <span className="notif-date">{formatDate(c.created_at)}</span>
              </div>
              <ChevronRight size={20} />
            </div>
          ))}
        </section>
      )}

      {total === 0 && recipeComments.length === 0 && (
        <div className="no-alerts" style={{ marginTop: '1rem' }}>
          <span>Aún no has recibido valoraciones en tus recetas.</span>
        </div>
      )}
    </div>
  );
};

export default Notifications;
