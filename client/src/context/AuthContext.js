import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
          SecureStore.getItemAsync(STORAGE_KEYS.USER),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // corrupted storage — clear it
        await clearSession();
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const saveSession = async (userData, accessToken) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
    setToken(accessToken);
  };

  const clearSession = async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    setUser(null);
    setToken(null);
  };

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: userData, accessToken } = res.data.data;
    await saveSession(userData, accessToken);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { user: userData, accessToken } = res.data.data;
    await saveSession(userData, accessToken);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    await clearSession();
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
