import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getAllItems    = ()       => axios.get(`${API}/shopping`, authHeader());
export const addItems      = (items)  => axios.post(`${API}/shopping`, items, authHeader());
export const toggleItem    = (id)     => axios.patch(`${API}/shopping/${id}/toggle`, {}, authHeader());
export const deleteItem    = (id)     => axios.delete(`${API}/shopping/${id}`, authHeader());
export const clearChecked  = ()       => axios.delete(`${API}/shopping/checked`, authHeader());
