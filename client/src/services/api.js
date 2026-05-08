import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach Token ──────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle Errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Check your connection.';

    if (error.response?.status === 401) {
      // Token expired — clear storage (AuthContext will handle redirect)
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
