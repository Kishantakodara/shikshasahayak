import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || (localStorage.getItem('theme-preference') as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) return 'dark';
      const stored = (localStorage.getItem('theme') as Theme) || (localStorage.getItem('theme-preference') as Theme);
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (t: Theme) => {
      const isDark = t === 'dark' || (t === 'system' && mediaQuery.matches);
      
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    applyTheme(theme);

    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'theme-preference' || e.key === 'theme') && e.newValue) {
        const nextTheme = e.newValue as Theme;
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      }
    };

    mediaQuery.addEventListener('change', handler);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handler);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('theme-preference', newTheme);
    } catch {}
    setThemeState(newTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = newTheme === 'dark' || (newTheme === 'system' && mediaQuery.matches);
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};