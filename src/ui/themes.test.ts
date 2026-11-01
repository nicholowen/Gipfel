import { describe, expect, it } from 'vitest';
import { cssVariables, DEFAULT_THEME, getTheme, paletteFor, parseThemeId, STAGE_KEYS, THEMES, type Palette } from './themes';

/** WCAG 2 relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every palette a theme can show: light, plus dark where it has one. */
const palettes: [string, Palette][] = THEMES.flatMap((t) => [
  [`${t.id} light`, t.light] as [string, Palette],
  ...(t.dark ? [[`${t.id} dark`, t.dark] as [string, Palette]] : []),
]);

describe('themes', () => {
  it('have unique ids', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });

  it('name every stage group in German with an English gloss', () => {
    for (const theme of THEMES) {
      for (const key of STAGE_KEYS) {
        expect(theme.stages[key].de, `${theme.id} ${key}`).toMatch(/\S/);
        expect(theme.stages[key].en, `${theme.id} ${key}`).toMatch(/\S/);
      }
      const names = STAGE_KEYS.map((k) => theme.stages[k].de);
      expect(new Set(names).size, `${theme.id} stage names are distinct`).toBe(5);
    }
  });

  it('fall back to the default for unknown or missing stored values', () => {
    expect(parseThemeId('bauhaus')).toBe('bauhaus');
    expect(parseThemeId('nonsense')).toBe(DEFAULT_THEME);
    expect(parseThemeId(null)).toBe(DEFAULT_THEME);
    expect(parseThemeId(undefined)).toBe(DEFAULT_THEME);
  });

  it('use the dark palette only where the theme has one', () => {
    expect(paletteFor(getTheme('alpen'), true).scheme).toBe('dark');
    expect(paletteFor(getTheme('alpen'), false).scheme).toBe('light');
    // Schwarz-Rot-Gold is a departure board: always dark.
    expect(paletteFor(getTheme('bahn'), false).scheme).toBe('dark');
  });

  it('produce every CSS variable the stylesheet reads', () => {
    const vars = cssVariables(getTheme('backstube'), false);
    for (const name of ['--paper', '--ink', '--accent', '--der', '--die', '--das', '--border', '--font-brand', '--stage-1', '--on-stage-5']) {
      expect(vars[name], name).toBeTruthy();
    }
  });
});

describe.each(palettes)('%s contrast', (_, p) => {
  const text = (fg: string, bg: string, min = 4.5) => expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(min);

  it('body text reads on paper and cards', () => {
    for (const bg of [p.paper, p.surface]) {
      text(p.ink, bg);
      text(p.inkSoft, bg);
    }
  });

  it('der, die and das read on paper and cards', () => {
    for (const bg of [p.paper, p.surface]) {
      text(p.der, bg);
      text(p.die, bg);
      text(p.das, bg);
    }
  });

  it('feedback colours read on cards', () => {
    text(p.good, p.surface);
    text(p.bad, p.surface);
  });

  it('buttons, prompts and stage tiles have readable labels', () => {
    text(p.accentInk, p.accent);
    text(p.onMeaning, p.meaning);
    text(p.onGerman, p.german);
    for (const key of STAGE_KEYS) text(p.stages[key].fg, p.stages[key].bg);
  });

  it('the brand (large, bold) stands out from the paper', () => {
    text(p.accent, p.paper, 3);
  });
});
