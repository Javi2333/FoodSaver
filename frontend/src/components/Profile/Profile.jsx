import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Leaf, AlertTriangle, LogOut, Check, ChevronDown, ChevronUp } from 'lucide-react';
import './Profile.css';

const DIETARY_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Sin azúcar',
  'Baja en calorías',
];

const ALLERGY_OPTIONS = [
  'Frutos secos',
  'Marisco',
  'Huevo',
  'Gluten',
  'Lácteos',
  'Soja',
  'Sésamo',
  'Mostaza',
];

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Secciones colapsables
  const [openSection, setOpenSection] = useState('datos');

  // Datos personales
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Preferencias y alergias
  const [dietary, setDietary] = useState(user?.dietary_preferences || []);
  const [allergies, setAllergies] = useState(user?.allergies || []);
  const [prefsMsg, setPrefsMsg] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const toggleChip = (value, list, setList) => {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await updateProfile({ name, email, dietary_preferences: dietary, allergies });
      updateUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Datos actualizados correctamente' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el perfil';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar la contraseña';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePrefsSave = async () => {
    setPrefsMsg(null);
    setPrefsLoading(true);
    try {
      const res = await updateProfile({ name: user.name, email: user.email, dietary_preferences: dietary, allergies });
      updateUser(res.data.user);
      setPrefsMsg({ type: 'success', text: 'Preferencias guardadas correctamente' });
    } catch (err) {
      setPrefsMsg({ type: 'error', text: 'Error al guardar las preferencias' });
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="profile-container">
      {/* Avatar y nombre */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <h2 className="profile-name">{user?.name}</h2>
        <p className="profile-email">{user?.email}</p>
      </div>

      {/* Sección: Datos personales */}
      <div className="profile-section">
        <button className="section-toggle" onClick={() => toggleSection('datos')}>
          <span className="section-toggle-left">
            <User size={20} />
            Datos personales
          </span>
          {openSection === 'datos' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {openSection === 'datos' && (
          <form className="section-body" onSubmit={handleProfileSave}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {profileMsg && (
              <p className={`form-msg ${profileMsg.type}`}>{profileMsg.text}</p>
            )}
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}
      </div>

      {/* Sección: Contraseña */}
      <div className="profile-section">
        <button className="section-toggle" onClick={() => toggleSection('password')}>
          <span className="section-toggle-left">
            <Lock size={20} />
            Cambiar contraseña
          </span>
          {openSection === 'password' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {openSection === 'password' && (
          <form className="section-body" onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordMsg && (
              <p className={`form-msg ${passwordMsg.type}`}>{passwordMsg.text}</p>
            )}
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>

      {/* Sección: Preferencias dietéticas */}
      <div className="profile-section">
        <button className="section-toggle" onClick={() => toggleSection('dieta')}>
          <span className="section-toggle-left">
            <Leaf size={20} />
            Preferencias dietéticas
          </span>
          {openSection === 'dieta' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {openSection === 'dieta' && (
          <div className="section-body">
            <p className="section-hint">Selecciona tus preferencias para personalizar las recetas sugeridas.</p>
            <div className="chips-grid">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip ${dietary.includes(opt) ? 'chip-active' : ''}`}
                  onClick={() => toggleChip(opt, dietary, setDietary)}
                >
                  {dietary.includes(opt) && <Check size={14} />}
                  {opt}
                </button>
              ))}
            </div>

            <h4 className="subsection-title">
              <AlertTriangle size={18} />
              Alergias
            </h4>
            <p className="section-hint">Las recetas que contengan estos ingredientes quedarán marcadas.</p>
            <div className="chips-grid">
              {ALLERGY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip chip-danger ${allergies.includes(opt) ? 'chip-danger-active' : ''}`}
                  onClick={() => toggleChip(opt, allergies, setAllergies)}
                >
                  {allergies.includes(opt) && <Check size={14} />}
                  {opt}
                </button>
              ))}
            </div>

            {prefsMsg && (
              <p className={`form-msg ${prefsMsg.type}`}>{prefsMsg.text}</p>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={handlePrefsSave}
              disabled={prefsLoading}
            >
              {prefsLoading ? 'Guardando...' : 'Guardar preferencias'}
            </button>
          </div>
        )}
      </div>

      {/* Cerrar sesión */}
      <button className="btn-logout" onClick={handleLogout}>
        <LogOut size={20} />
        Cerrar sesión
      </button>
    </div>
  );
};

export default Profile;
