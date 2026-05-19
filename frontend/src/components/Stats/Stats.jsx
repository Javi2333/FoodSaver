import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Trash2, ChefHat, TrendingUp, Euro } from 'lucide-react';
import { getStats } from '../../services/statsService';
import './Stats.css';

const Stats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas...</div>;

  const s = stats ?? { consumed: 0, wasted: 0, total: 0, savingsPct: 0, cooked: 0, estimatedSavings: '0.00' };

  return (
    <div className="mobile-container stats-page">
      <div className="stats-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Mis estadísticas</h1>
      </div>

      {/* Aprovechamiento */}
      <div className="stats-card stats-card-main">
        <div className="stats-card-label">
          <TrendingUp size={18} />
          Tasa de aprovechamiento
        </div>
        <div className="stats-pct">{s.savingsPct}%</div>
        <div className="stats-bar-bg">
          <div className="stats-bar-fill" style={{ width: `${s.savingsPct}%` }} />
        </div>
        <p className="stats-card-sub">
          {s.total === 0
            ? 'Empieza a registrar qué haces con tus productos'
            : `${s.consumed} de ${s.total} productos consumidos antes de caducar`}
        </p>
      </div>

      <div className="stats-grid">
        {/* Productos consumidos */}
        <div className="stats-card stats-card-green">
          <div className="stats-card-icon"><Leaf size={22} /></div>
          <div className="stats-card-value">{s.consumed}</div>
          <div className="stats-card-label">Salvados</div>
        </div>

        {/* Productos tirados */}
        <div className="stats-card stats-card-red">
          <div className="stats-card-icon"><Trash2 size={22} /></div>
          <div className="stats-card-value">{s.wasted}</div>
          <div className="stats-card-label">Desperdiciados</div>
        </div>

        {/* Recetas cocinadas */}
        <div className="stats-card stats-card-blue">
          <div className="stats-card-icon"><ChefHat size={22} /></div>
          <div className="stats-card-value">{s.cooked}</div>
          <div className="stats-card-label">Recetas cocinadas</div>
        </div>

        {/* Ahorro estimado */}
        <div className="stats-card stats-card-orange">
          <div className="stats-card-icon"><Euro size={22} /></div>
          <div className="stats-card-value">{s.estimatedSavings}€</div>
          <div className="stats-card-label">Ahorro estimado</div>
        </div>
      </div>

      <p className="stats-note">
        El ahorro estimado se calcula a razón de 2€ por producto consumido antes de caducar.
      </p>
    </div>
  );
};

export default Stats;
