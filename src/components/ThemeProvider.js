'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system'); // light | dark | system

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored);
    } else {
      setTheme('system');
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;

      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // system
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();

    // Listen for system theme changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      
      return () => {
        mediaQuery.removeEventListener('change', applyTheme);
      };
    }
  }, [theme]);

  const setThemePreference = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Three-way toggle: light -> dark -> system -> light
  const toggleTheme = () => {
    if (theme === 'light') {
      setThemePreference('dark');
    } else if (theme === 'dark') {
      setThemePreference('system');
    } else {
      setThemePreference('light');
    }
  };

  const value = {
    theme,
    setTheme: setThemePreference,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};