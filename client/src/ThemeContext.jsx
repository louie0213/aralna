import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem('aralna-theme');
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : null;
  } catch (error) {
    console.warn('Unable to read the saved theme preference.', error);
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const savedTheme = getSavedTheme();
    return { theme: savedTheme || getSystemTheme(), hasSavedTheme: savedTheme !== null };
  });
  const { theme, hasSavedTheme } = preferences;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = theme === 'dark' ? '/aralna-mark-dark.svg?v=2' : '/aralna-mark.svg?v=2';

    if (hasSavedTheme) return undefined;
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = (event) => {
      setPreferences((current) => ({ ...current, theme: event.matches ? 'dark' : 'light' }));
    };
    if (typeof colorScheme.addEventListener === 'function') {
      colorScheme.addEventListener('change', syncSystemTheme);
      return () => colorScheme.removeEventListener('change', syncSystemTheme);
    }
    colorScheme.addListener(syncSystemTheme);
    return () => colorScheme.removeListener(syncSystemTheme);
  }, [hasSavedTheme, theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setPreferences({ theme: nextTheme, hasSavedTheme: true });
    try {
      window.localStorage.setItem('aralna-theme', nextTheme);
    } catch (error) {
      console.warn('Unable to save the theme preference.', error);
    }
  }, [theme]);

  const value = { theme, toggleTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}