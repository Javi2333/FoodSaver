import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Check, Leaf, AlertTriangle } from 'lucide-react';
import './AuthForms.css';

const DIETARY_OPTIONS = [
  'Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Sin azúcar', 'Baja en calorías',
];

const ALLERGY_OPTIONS = [
  'Frutos secos', 'Marisco', 'Huevo', 'Gluten', 'Lácteos', 'Soja', 'Sésamo', 'Mostaza',
];

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dietary, setDietary] = useState([]);
  const [allergies, setAllergies] = useState([]);

  const navigate = useNavigate();
  const { login } = useAuth();

  const toggleChip = (value, list, setList) => {
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (formData.name.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('La contraseña debe contener mayúsculas, minúsculas y números');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const response = await registerService({ ...dataToSend, dietary_preferences: dietary, allergies });
      
      if (response.success) {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al registrarse';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container auth-page">
      <div className="auth-header">
        <img src="/images/logo.png" alt="FoodSaver" className="auth-logo" />
        <h2>Crear Cuenta</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nombre</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <div className="input-with-icon-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <small className="form-hint">Debe contener mayúsculas, minúsculas y números</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
          <div className="input-with-icon-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label prefs-label">
            <Leaf size={16} />
            Preferencias dietéticas <span className="prefs-optional">(opcional)</span>
          </label>
          <div className="chips-grid">
            {DIETARY_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip ${dietary.includes(opt) ? 'chip-active' : ''}`}
                onClick={() => toggleChip(opt, dietary, setDietary)}
              >
                {dietary.includes(opt) && <Check size={13} />}
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label prefs-label">
            <AlertTriangle size={16} />
            Alergias <span className="prefs-optional">(opcional)</span>
          </label>
          <div className="chips-grid">
            {ALLERGY_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`chip chip-danger ${allergies.includes(opt) ? 'chip-danger-active' : ''}`}
                onClick={() => toggleChip(opt, allergies, setAllergies)}
              >
                {allergies.includes(opt) && <Check size={13} />}
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <div className="auth-footer">
        <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
      </div>
    </div>
  );
};

export default RegisterForm;
