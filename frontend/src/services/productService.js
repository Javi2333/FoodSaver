import api from './api';

// Obtener todos los productos del usuario
export const getAllProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

// Obtener productos próximos a caducar
export const getExpiringProducts = async () => {
  const response = await api.get('/products/expiring');
  return response.data;
};

// Obtener un producto específico
export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Crear nuevo producto
export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

// Actualizar producto
export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

// Marcar producto como consumido o desechado
export const markProductStatus = async (id, status) => {
  const response = await api.put(`/products/${id}/status`, { status });
  return response.data;
};

// Obtener productos por debajo del stock mínimo
export const getBelowMinimum = async () => {
  const response = await api.get('/products/below-minimum');
  return response.data;
};

// Reponer stock de un producto existente (suma cantidad)
export const restockProduct = async (id, data) => {
  const response = await api.patch(`/products/${id}/restock`, data);
  return response.data;
};
