import { cssVariables, DEFAULT_THEME, getTheme, paletteFor, parseThemeId, type ThemeId } from './themes';

/**
 * The chosen theme is a per-device display preference, so it lives in localStorage
 * rather than IndexedDB: it has to be readable synchronously, before the first paint.
 */
const STORAGE_KEY = 'gipfel.theme';

export function readStoredTheme(): ThemeId {
  try {
    return parseThemeId(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode or storage blocked: the theme still applies for this visit.
  }
}

export const darkQuery = () => (typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/** Writes the theme's variables onto <html>. Safe to call before React renders. */
export function applyTheme(id: ThemeId) {
  const theme = getTheme(id);
  const prefersDark = darkQuery()?.matches ?? false;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(cssVariables(theme, prefersDark))) root.style.setProperty(name, value);
  const { palette, scheme } = paletteFor(theme, prefersDark);
  root.dataset.theme = id;
  root.style.colorScheme = scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.paper);
}
