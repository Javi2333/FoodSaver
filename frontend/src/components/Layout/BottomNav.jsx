import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllProducts } from '../../services/productService';
import { getMyRecipeComments } from '../../services/recipeService';
import { Refrigerator, ShoppingCart, Bell, BookOpen, UserCircle } from 'lucide-react';
import './BottomNav.css';

const PUBLIC_ROUTES = ['/', '/login', '/register'];

const BottomNav = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [alertCount, setAlertCount]         = useState(0);
  const [hasNewComments, setHasNewComments] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setAlertCount(0); setHasNewComments(false); return; }

    getAllProducts()
      .then(res => {
        const products = res.products ?? res.data?.products ?? [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let count = 0;
        products.forEach(p => {
          if (p.location === 'congelador') return;
          if (!p.expiration_date) return;
          const exp = new Date(p.expiration_date); exp.setHours(0, 0, 0, 0);
          const diff = Math.round((exp - today) / 86400000);
          if (diff <= 3) count++;
        });
        setAlertCount(count);
      })
      .catch(() => {});

    getMyRecipeComments()
      .then(res => {
        const comments = res.data?.comments ?? [];
        setHasNewComments(comments.length > 0);
      })
      .catch(() => {});
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated || PUBLIC_ROUTES.includes(location.pathname)) return null;

  const isActive = (path) => location.pathname === path;
  const badgeLabel = alertCount > 9 ? '9+' : String(alertCount);

  return (
    <nav className="bottom-nav">
      <Link to="/products" className={`nav-item ${isActive('/products') ? 'active' : ''}`}>
        <Refrigerator size={24} />
        <span>Despensa</span>
      </Link>

      <Link to="/shopping" className={`nav-item ${isActive('/shopping') ? 'active' : ''}`}>
        <ShoppingCart size={24} />
        <span>Compra</span>
      </Link>

      <Link to="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
        <span className="nav-icon-wrapper">
          <Bell size={24} />
          {alertCount > 0 && <span className="nav-badge">{badgeLabel}</span>}
          {hasNewComments && <span className="nav-badge-dot" />}
        </span>
        <span>Avisos</span>
      </Link>

      <Link to="/recipes" className={`nav-item ${isActive('/recipes') ? 'active' : ''}`}>
        <BookOpen size={24} />
        <span>Recetas</span>
      </Link>

      <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
        <UserCircle size={24} />
        <span>Perfil</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
