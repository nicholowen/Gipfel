import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTheme } from './theme-context';
import { darkQuery } from './theme-dom';
import { paletteFor, THEMES } from './themes';

export const MOUNTAIN_LOGO = (
  <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
    <path d="M3 27 L13 9 L18 17 L21 12 L29 27 Z" fill="currentColor" />
    <path d="M13 9 L10.5 13.5 L13 12.5 L15.2 13 Z" fill="var(--logo-snow, var(--paper))" />
  </svg>
);

interface Props {
  /** Replaces the mountain mark. */
  logo?: ReactNode;
  /** Small line above the name (e.g. "Departures"). */
  kicker?: ReactNode;
  /** Defaults to "Gipfel". */
  name?: ReactNode;
  /** Small line below the name. */
  tagline?: ReactNode;
  className?: string;
  /** Shown beside the menu button (e.g. the streak). */
  children?: ReactNode;
}

/** The Gipfel header: logo and name, an optional slot (e.g. the streak), and the menu. */
export function AppHeader({ logo = MOUNTAIN_LOGO, kicker, name = 'Gipfel', tagline, className = '', children }: Props) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    // Start keyboard users on the selected theme.
    panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus();

    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className={`app-header ${className}`}>
      <div className="brand-block">
        {kicker && <p className="brand__kicker">{kicker}</p>}
        <h1 className="brand">
          {logo}
          <span className="brand__name">{name}</span>
        </h1>
        {tagline && <p className="brand__tagline">{tagline}</p>}
      </div>
      <div className="app-header__end">
        {children}
        <button
          ref={button}
          type="button"
          className="icon-button menu-button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div ref={panel} id={panelId} className="menu">
          <ThemePicker />
        </div>
      )}
    </header>
  );
}

function ThemePicker() {
  const { theme: current, setTheme } = useTheme();
  const prefersDark = darkQuery()?.matches ?? false;
  return (
    <fieldset className="theme-picker">
      <legend className="theme-picker__legend">Theme</legend>
      {THEMES.map((theme) => {
        // Preview colours in the scheme the theme would actually show right now.
        const { palette } = paletteFor(theme, prefersDark);
        return (
          <label key={theme.id} className="theme-option">
            <input
              type="radio"
              name="theme"
              value={theme.id}
              checked={theme.id === current.id}
              onChange={() => setTheme(theme.id)}
            />
            <span className="theme-option__text">
              <span className="theme-option__name">{theme.name}</span>
              <span className="theme-option__stages" lang="de">
                {theme.stages[1].de} → {theme.stages[5].de}
              </span>
              <span className="theme-option__tagline">{theme.tagline}</span>
            </span>
            <span className="swatches" aria-hidden="true">
              {[palette.paper, palette.accent, palette.german, palette.meaning].map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
