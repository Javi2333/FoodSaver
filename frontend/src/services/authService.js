import api from './api';

// Registrar nuevo usuario
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Iniciar sesión
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.success) {
    // Guardar token y usuario en localStorage
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Obtener usuario actual
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Obtener usuario guardado en localStorage
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Actualizar perfil del usuario
export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  if (response.data.success) {
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// Cambiar contraseña
export const changePassword = async (data) => {
  const response = await api.put('/auth/password', data);
  return response.data;
};
