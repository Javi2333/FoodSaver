import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, ChefHat, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllProducts } from '../../services/productService';
import { getAllRecipes } from '../../services/recipeService';
import { cacheGet, cacheSet } from '../../services/cache';
import './Dashboard.css';

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
};

const computeStats = (products, recipes) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let expired = 0, soonExpiring = 0;
  products.forEach(p => {
    if (!p.expiration_date) return;
    const exp = new Date(p.expiration_date); exp.setHours(0, 0, 0, 0);
    const diff = Math.round((exp - today) / 86400000);
    if (diff < 0) expired++;
    else if (diff <= 3) soonExpiring++;
  });
  return { total: products.length, expired, soonExpiring, cookable: recipes.length };
};

const Dashboard = () => {
  const { user } = useAuth();

  const cachedProducts = cacheGet('products');
  const cachedRecipes  = cacheGet('recipes');
  const [stats, setStats] = useState(
    cachedProducts && cachedRecipes ? computeStats(cachedProducts, cachedRecipes) : null
  );

  useEffect(() => {
    Promise.all([
      getAllProducts().then(res => {
        const data = res.products ?? res.data?.products ?? [];
        cacheSet('products', data);
        return data;
      }),
      getAllRecipes().then(res => {
        const data = res.data?.recipes ?? [];
        cacheSet('recipes', data);
        return data;
      }),
    ]).then(([products, recipes]) => {
      setStats(computeStats(products, recipes));
    }).catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Hola, {firstName}</h1>
        <p>Esto es lo que tienes hoy</p>
      </div>

      <Link to="/products?filter=expiring" className={`dashboard-card ${stats && (stats.expired > 0 || stats.soonExpiring > 0) ? 'card-alert' : ''}`}>
        <div className={`card-icon ${stats?.expired > 0 ? 'icon-expiring-alert' : 'icon-expiring'}`}>
          <Clock />
        </div>
        <div className="card-body">
          <h3>Caducidad</h3>
          {stats === null ? (
            <span className="card-count">—</span>
          ) : stats.expired === 0 && stats.soonExpiring === 0 ? (
            <span className="card-count card-ok">Todo en orden</span>
          ) : (
            <div className="expiry-badges">
              {stats.expired > 0 && (
                <span className="expiry-badge badge-expired">
                  {stats.expired} caducado{stats.expired !== 1 ? 's' : ''}
                </span>
              )}
              {stats.soonExpiring > 0 && (
                <span className="expiry-badge badge-soon">
                  {stats.soonExpiring} próximo{stats.soonExpiring !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <Link to="/products" className="dashboard-card">
        <div className="card-icon icon-pantry">
          <Package />
        </div>
        <div className="card-body">
          <h3>Despensa</h3>
          <span className="card-count">
            {stats === null ? '—' : `${stats.total} producto${stats.total !== 1 ? 's' : ''}`}
          </span>
        </div>
      </Link>

      <Link to="/recipes" className="dashboard-card">
        <div className="card-icon icon-recipes">
          <ChefHat />
        </div>
        <div className="card-body">
          <h3>Recetas disponibles</h3>
          <span className="card-count">
            {stats === null ? '—' : stats.cookable === 0 ? 'Añade productos' : `${stats.cookable} receta${stats.cookable !== 1 ? 's' : ''}`}
          </span>
        </div>
      </Link>

      <Link to="/stats" className="dashboard-card">
        <div className="card-icon icon-stats">
          <TrendingUp />
        </div>
        <div className="card-body">
          <h3>Mis estadísticas</h3>
          <span className="card-count">Ver mi impacto</span>
        </div>
      </Link>
    </div>
  );
};

export default Dashboard;
