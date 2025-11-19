import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'pocketlm-theme';

/**
 * Hook for managing theme state
 *
 * Persists theme preference in browser storage and applies it to the DOM
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme from storage on mount
  useEffect(() => {
    browser.storage.local.get(THEME_STORAGE_KEY).then((result) => {
      const savedTheme = result[THEME_STORAGE_KEY] as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }
    });
  }, []);

  // Apply theme to DOM
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);

    // Persist to storage
    browser.storage.local.set({ [THEME_STORAGE_KEY]: newTheme });
  };

  return { theme, toggleTheme };
}
