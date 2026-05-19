import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const AUTH_ROUTES = ['/', '/login', '/register'];

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  if (!isAuthenticated || AUTH_ROUTES.includes(pathname)) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <img src="/images/logo.png" alt="FoodSaver" className="logo-image" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;  
