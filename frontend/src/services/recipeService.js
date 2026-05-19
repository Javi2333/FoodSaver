import api from './api';

export const getAllRecipes = async () => {
  const response = await api.get('/recipes');
  return response.data;
};

export const getCommunityRecipes = async () => {
  const response = await api.get('/recipes/community');
  return response.data;
};

export const getRecipe = async (id) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (data) => {
  const response = await api.post('/recipes', data);
  return response.data;
};

export const updateRecipe = async (id, data) => {
  const response = await api.put(`/recipes/${id}`, data);
  return response.data;
};

export const deleteRecipe = async (id) => {
  const response = await api.delete(`/recipes/${id}`);
  return response.data;
};

export const cookRecipe = async (id) => {
  const response = await api.post(`/recipes/${id}/cook`);
  return response.data;
};

export const rateRecipe = async (id, rating) => {
  const response = await api.post(`/recipes/${id}/rate`, { rating });
  return response.data;
};

export const getComments = async (id) => {
  const response = await api.get(`/recipes/${id}/comments`);
  return response.data;
};

export const addComment = async (id, content, rating = null) => {
  const response = await api.post(`/recipes/${id}/comments`, { content, rating });
  return response.data;
};

export const deleteComment = async (id, commentId) => {
  const response = await api.delete(`/recipes/${id}/comments/${commentId}`);
  return response.data;
};

export const getMyRecipeComments = async () => {
  const response = await api.get('/recipes/my-comments');
  return response.data;
};
