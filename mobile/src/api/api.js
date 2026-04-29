// src/api/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// =====================================================
// CONFIGURATION - Modifiez cette IP avec l'IP du serveur
// =====================================================
export let API_BASE_URL = 'http://192.168.1.100:3000/api';

export const setApiBaseUrl = (url) => {
  API_BASE_URL = url;
};

// =====================================================
// HELPER : requête HTTP avec token JWT
// =====================================================
const request = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  const savedUrl = await AsyncStorage.getItem('api_url');
  const baseUrl = savedUrl || API_BASE_URL;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      throw new Error('Pas de connexion reseau. Verifiez votre WiFi ou l\'adresse IP du serveur.');
    }
    throw error;
  }
};

// =====================================================
// AUTHENTIFICATION
// =====================================================
export const authApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// =====================================================
// PATIENTS
// =====================================================
export const patientsApi = {
  getAll: () => request('/patients'),
  getById: (id) => request(`/patients/${id}`),
  create: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// =====================================================
// CONSULTATIONS
// =====================================================
export const consultationsApi = {
  getAll: () => request('/consultations'),
  getById: (id) => request(`/consultations/${id}`),
  create: (data) => request('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/consultations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/consultations/${id}`, { method: 'DELETE' }),
};

// =====================================================
// GROSSESSES
// =====================================================
export const pregnanciesApi = {
  getAll: () => request('/pregnancies'),
  getById: (id) => request(`/pregnancies/${id}`),
  create: (data) => request('/pregnancies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/pregnancies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/pregnancies/${id}`, { method: 'DELETE' }),
};

// =====================================================
// VACCINATIONS
// =====================================================
export const vaccinationsApi = {
  getAll: () => request('/vaccinations'),
  getRegistry: (month, region) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (region) params.append('region', region);
    return request(`/vaccinations/registry?${params}`);
  },
  create: (data) => request('/vaccinations', { method: 'POST', body: JSON.stringify(data) }),
  getMonthlyStats: (month) => request(`/vaccinations/stats/monthly/${month}`),
};

// =====================================================
// STATISTIQUES
// =====================================================
export const statsApi = {
  getAll: () => request('/stats'),
  getVaccinations: () => request('/stats/vaccinations'),
  getMonthly: (month) => request(`/stats/monthly/${month}`),
};

// =====================================================
// STOCK
// =====================================================
export const stockApi = {
  getByMonth: (month) => request(`/stock?month=${month}`),
  updateStock: (data) => request('/stock', { method: 'POST', body: JSON.stringify(data) }),
  consume: (data) => request('/stock/consume', { method: 'PUT', body: JSON.stringify(data) }),
  getPredictions: () => request('/stock/predict'),
  getAlerts: () => request('/stock/alerts'),
};

// =====================================================
// SYNCHRONISATION
// =====================================================
export const syncApi = {
  sync: (data) => request('/sync', { method: 'POST', body: JSON.stringify(data) }),
};

// =====================================================
// ADMIN
// =====================================================
export const adminApi = {
  getStats: () => request('/admin/stats'),
  getSummary: () => request('/admin/summary'),
  getAgents: () => request('/admin/agents'),
  createAgent: (data) => request('/admin/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id, data) => request(`/admin/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAgent: (id, active) => request(`/admin/agents/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ active }) }),
  getAgentStats: (id) => request(`/admin/agents/${id}/stats`),
  getAllPatients: () => request('/admin/patients'),
  getAllConsultations: () => request('/admin/consultations'),
  getAllVaccinations: () => request('/admin/vaccinations'),
};

// =====================================================
// CHAT / IA
// =====================================================
export const chatApi = {
  sendMessage: (message, userId) =>
    request('/chat/chat', { method: 'POST', body: JSON.stringify({ message, userId }) }),
};
