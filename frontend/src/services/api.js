const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Obtener token almacenado
const getToken = () => localStorage.getItem("token");

// Helper para headers con autenticacion
const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper generico para peticiones
const request = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: authHeaders(),
  });

  if (res.status === 401) {
    // Token expirado o invalido -> cerrar sesion
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Sesion expirada");
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en la peticion");
  return data;
};

// ============ AUTH ============
export const authAPI = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  getMe: () => request("/auth/me"),
};

// ============ USERS ============
export const usersAPI = {
  getAll: () => request("/users"),
  getById: (id) => request(`/users/${id}`),
  updateRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  toggleActive: (id) =>
    request(`/users/${id}/toggle-active`, { method: "PATCH" }),
};

// ============ CLIENTS ============
export const clientsAPI = {
  getAll: () => request("/clients"),
  search: (query) => request(`/clients/search?q=${encodeURIComponent(query)}`),
  create: (data) =>
    request("/clients", { method: "POST", body: JSON.stringify(data) }),
};

// ============ BIKES ============
export const bikesAPI = {
  getAll: (plate = "") =>
    request(`/bikes${plate ? `?plate=${encodeURIComponent(plate)}` : ""}`),

  getByClient: (clientId) => request(`/bikes/client/${clientId}`),

  create: (data) =>
    request("/bikes", { method: "POST", body: JSON.stringify(data) }),
};

/*export const bikesAPI = {
  getAll: () => request("/bikes"),
  getByClient: (clientId) => request(`/bikes/client/${clientId}`),
  create: (data) =>
    request("/bikes", { method: "POST", body: JSON.stringify(data) }),
}; */

// ============ WORK ORDERS ============
export const workOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/work-orders${query ? `?${query}` : ""}`);
  },
  getById: (id) => request(`/work-orders/${id}`),
  create: (data) =>
    request("/work-orders", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id, toStatus, note = "") =>
    request(`/work-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ toStatus, note }),
    }),
  addItem: (id, data) =>
    request(`/work-orders/${id}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteItem: (id, itemId) =>
    request(`/work-orders/${id}/items/${itemId}`, { method: "DELETE" }),
  getHistory: (id, page = 1) => request(`/work-orders/${id}/history?page=${page}`),
};
/*import axios from 'axios';

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

export default api;*/
