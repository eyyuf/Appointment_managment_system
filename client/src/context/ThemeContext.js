import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors } from '../theme/colors';

const THEME_KEY = 'app_theme_mode';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored === 'dark') setIsDark(true);
      } catch {}
    };
    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await SecureStore.setItemAsync(THEME_KEY, next ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Convenience hook
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
