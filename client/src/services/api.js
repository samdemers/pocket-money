import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => api.post('/auth/signin', credentials),
  getProfile: () => api.get('/auth/me'),
};

// Accounts API
export const accountsAPI = {
  getAccounts: () => api.get('/accounts'),
  generateLinkUrl: () => api.post('/accounts/link-url'),
  syncAccounts: () => api.post('/accounts/sync'),
  unlinkAccount: (accountId) => api.delete(`/accounts/${accountId}`),
  reactivateAccount: (accountId) => api.post(`/accounts/${accountId}/reactivate`),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransactionsSummary: (params) => api.get('/transactions/summary', { params }),
  getCategories: () => api.get('/transactions/categories'),
  getTransaction: (id) => api.get(`/transactions/${id}`),
};

// Sync API
export const syncAPI = {
  manualSync: () => api.post('/sync/manual'),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;