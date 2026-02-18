const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: authHeaders(),
  });

  if (res.status === 401) {
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
  getAll:       ()         => request("/users"),
  getById:      (id)       => request(`/users/${id}`),
  updateRole:   (id, role) => request(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  }),
  toggleActive: (id)       => request(`/users/${id}/toggle-active`, { method: "PATCH" }),
};

// ============ CLIENTS ============
export const clientsAPI = {
  getAll:  ()      => request("/clients"),
  search:  (query) => request(`/clients/search?q=${encodeURIComponent(query)}`),
  create:  (data)  => request("/clients", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

// ============ VEHICLES (reemplaza bikesAPI) ============
export const vehiclesAPI = {
  // Listar vehiculos con filtros opcionales de placa y tipo
  getAll: ({ plate = "", type_vehicle = "" } = {}) => {
    const params = new URLSearchParams();
    if (plate)        params.append("plate", plate);
    if (type_vehicle) params.append("type_vehicle", type_vehicle);
    const qs = params.toString();
    return request(`/vehicles${qs ? `?${qs}` : ""}`);
  },

  // Obtener por ID
  getById: (id) => request(`/vehicles/${id}`),

  // Obtener vehiculos de un cliente
  getByClient: (clientId) => request(`/vehicles/client/${clientId}`),

  // Crear vehiculo
  create: (data) => request("/vehicles", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Actualizar vehiculo (horas, datos, etc.)
  update: (id, data) => request(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};

// Alias para compatibilidad con codigo antiguo que use bikesAPI
export const bikesAPI = vehiclesAPI;

// ============ WORK ORDERS ============
export const workOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/work-orders${query ? `?${query}` : ""}`);
  },
  getById:      (id)              => request(`/work-orders/${id}`),
  create:       (data)            => request("/work-orders", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateStatus: (id, toStatus, note = "") => request(`/work-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ toStatus, note }),
  }),
  addItem:      (id, data)        => request(`/work-orders/${id}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  deleteItem:   (id, itemId)      => request(`/work-orders/${id}/items/${itemId}`, {
    method: "DELETE",
  }),
  getHistory:   (id, page = 1)   => request(`/work-orders/${id}/history?page=${page}`),
};