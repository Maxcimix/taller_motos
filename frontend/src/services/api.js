import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.details?.join(', ') ||
      'Error de conexion con el servidor.';
    return Promise.reject(new Error(message));
  }
);

// ---- Clientes ----
export const clientService = {
  getAll: (search = '') => api.get(`/clients?search=${search}`),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
};

// ---- Motos ----
export const bikeService = {
  getAll: (plate = '') => api.get(`/bikes?plate=${plate}`),
  getById: (id) => api.get(`/bikes/${id}`),
  create: (data) => api.post('/bikes', data),
};

// ---- Ordenes de Trabajo ----
export const workOrderService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.plate) query.append('plate', params.plate);
    if (params.page) query.append('page', params.page);
    if (params.pageSize) query.append('pageSize', params.pageSize);
    return api.get(`/work-orders?${query.toString()}`);
  },
  getById: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  updateStatus: (id, status) => api.patch(`/work-orders/${id}/status`, { status }),
  addItem: (id, data) => api.post(`/work-orders/${id}/items`, data),
  deleteItem: (itemId) => api.delete(`/work-orders/items/${itemId}`),
};

export default api;
