import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, darkQuery, readStoredTheme, storeTheme } from './theme-dom';
import { DEFAULT_THEME, getTheme, type Theme, type ThemeId } from './themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: getTheme(DEFAULT_THEME), setTheme: () => undefined });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState(readStoredTheme);

  useLayoutEffect(() => {
    applyTheme(id);
    // Re-apply when the device switches between light and dark.
    const query = darkQuery();
    const onChange = () => applyTheme(id);
    query?.addEventListener('change', onChange);
    return () => query?.removeEventListener('change', onChange);
  }, [id]);

  const setTheme = useCallback((next: ThemeId) => {
    storeTheme(next);
    setId(next);
  }, []);

  const value = useMemo(() => ({ theme: getTheme(id), setTheme }), [id, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
