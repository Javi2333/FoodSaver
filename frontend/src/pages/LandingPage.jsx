import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Auth/AuthForms.css';

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="mobile-container auth-page">
      <div className="landing-content">
        <div className="brand-section">
          <img src="/images/logo.png" alt="FoodSaver" className="landing-logo" />
        </div>
        
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary mb-4">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="btn btn-primary">
            Registrarse
          </Link>
          
          <p className="tagline">Empieza a ahorrar comida hoy</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
