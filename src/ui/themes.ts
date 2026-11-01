import { stageGroup, type StageGroup } from '../domain/scheduler';
import type { Stage } from '../domain/types';

/**
 * Visual themes. Each one is a palette (light, and dark where the theme has one),
 * a set of fonts, and its own German names for the five SRS stage groups.
 *
 * Pure data and functions only: applying a theme to the page lives in theme-context.tsx.
 */

export type ThemeId = 'alpen' | 'bauhaus' | 'bahn' | 'backstube';
export type StageKey = Exclude<StageGroup, 'lesson'>;

export const STAGE_KEYS: readonly StageKey[] = ['apprentice', 'guru', 'master', 'enlightened', 'burned'];

export interface StageName {
  /** Shown in the app. */
  de: string;
  /** English gloss, for tooltips and screen readers. */
  en: string;
}

export interface Palette {
  paper: string;
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accentInk: string;
  /** Lessons button and meaning prompts. */
  meaning: string;
  onMeaning: string;
  /** Reviews button and German prompts. */
  german: string;
  onGerman: string;
  der: string;
  die: string;
  das: string;
  good: string;
  bad: string;
  warn: string;
  /** A bold block: Alpen's pine header and prompt, Bauhaus's band, the departure board, the bakery's feedback box. */
  hero: string;
  onHero: string;
  onHeroSoft: string;
  /** der, die and das where they sit on the hero. */
  heroDer: string;
  heroDie: string;
  heroDas: string;
  stages: Record<StageKey, { bg: string; fg: string }>;
  shadow: string;
  /** Card and button outline; 'none' for themes that rely on shadow. */
  border: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  /** One line for the theme menu. */
  tagline: string;
  stages: Record<StageKey, StageName>;
  copy: {
    /** Heading over the list of stages. */
    stagesTitle: string;
    /** Feedback headlines, in German. */
    right: string;
    wrong: string;
  };
  fonts: { body: string; display: string; brand: string; word: string };
  radius: string;
  light: Palette;
  /** Omitted for themes that only come in one scheme; `light` is then used always. */
  dark?: Palette;
  /** Use `light` even when the device prefers dark (and the reverse is never needed). */
  fixedScheme?: 'light' | 'dark';
}

const SYSTEM = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const alpen: Theme = {
  id: 'alpen',
  name: 'Alpen',
  tagline: 'Pine, snow and trail markers',
  stages: {
    apprentice: { de: 'Tal', en: 'valley' },
    guru: { de: 'Alm', en: 'alpine pasture' },
    master: { de: 'Hütte', en: 'mountain hut' },
    enlightened: { de: 'Grat', en: 'ridge' },
    burned: { de: 'Gipfel', en: 'summit' },
  },
  copy: { stagesTitle: 'Your route', right: 'Trittsicher!', wrong: 'Ausgerutscht!' },
  fonts: {
    body: SYSTEM,
    display: `'Archivo', ${SYSTEM}`,
    brand: `'Archivo', ${SYSTEM}`,
    word: `'Archivo', ${SYSTEM}`,
  },
  radius: '14px',
  light: {
    paper: '#f4f6f3',
    surface: '#ffffff',
    ink: '#1b1f1d',
    inkSoft: '#4a5550',
    line: '#d5ddd8',
    accent: '#1f3a2e',
    accentInk: '#ffffff',
    meaning: '#2d5141',
    onMeaning: '#ffffff',
    german: '#c8102e',
    onGerman: '#ffffff',
    der: '#1d4ed8',
    die: '#b4232c',
    das: '#2f6b3a',
    good: '#2f6b3a',
    bad: '#b4232c',
    warn: '#8a5a00',
    hero: '#1f3a2e',
    onHero: '#ffffff',
    onHeroSoft: '#c9d6ce',
    heroDer: '#9cc3ff',
    heroDie: '#ffa3ab',
    heroDas: '#a8e0b0',
    stages: {
      apprentice: { bg: '#7a5c3e', fg: '#ffffff' },
      guru: { bg: '#3f7a3a', fg: '#ffffff' },
      master: { bg: '#9a4a22', fg: '#ffffff' },
      enlightened: { bg: '#4a5560', fg: '#ffffff' },
      burned: { bg: '#1f3a2e', fg: '#ffffff' },
    },
    shadow: '0 1px 2px rgb(27 31 29 / 6%), 0 4px 16px rgb(27 31 29 / 7%)',
    border: 'none',
  },
  dark: {
    paper: '#0f1a15',
    surface: '#17251e',
    ink: '#eef3f0',
    inkSoft: '#a9b8b0',
    line: '#2a3b33',
    accent: '#8fc7a8',
    accentInk: '#0f1a15',
    meaning: '#8fc7a8',
    onMeaning: '#0f1a15',
    german: '#ff6b7d',
    onGerman: '#0f1a15',
    der: '#8db4ff',
    die: '#ff8a94',
    das: '#7fd18f',
    good: '#7fd18f',
    bad: '#ff8a94',
    warn: '#e0ac55',
    hero: '#1f3a2e',
    onHero: '#eef3f0',
    onHeroSoft: '#a9b8b0',
    heroDer: '#9cc3ff',
    heroDie: '#ffa3ab',
    heroDas: '#a8e0b0',
    stages: {
      apprentice: { bg: '#c9a27e', fg: '#0f1a15' },
      guru: { bg: '#9bd08a', fg: '#0f1a15' },
      master: { bg: '#e89a6e', fg: '#0f1a15' },
      enlightened: { bg: '#b7c2cc', fg: '#0f1a15' },
      burned: { bg: '#eef3f0', fg: '#0f1a15' },
    },
    shadow: '0 1px 2px rgb(0 0 0 / 30%), 0 4px 16px rgb(0 0 0 / 25%)',
    border: 'none',
  },
};

const bauhaus: Theme = {
  id: 'bauhaus',
  name: 'Bauhaus',
  tagline: 'Primary colours, hard edges, shapes for gender',
  stages: {
    apprentice: { de: 'Lehrling', en: 'apprentice' },
    guru: { de: 'Geselle', en: 'journeyman' },
    master: { de: 'Jungmeister', en: 'young master' },
    enlightened: { de: 'Meister', en: 'master' },
    burned: { de: 'Meisterwerk', en: 'masterpiece' },
  },
  copy: { stagesTitle: 'the workshop', right: 'Gut gebaut!', wrong: 'Nochmal!' },
  fonts: {
    body: `'Jost', ${SYSTEM}`,
    display: `'Jost', ${SYSTEM}`,
    brand: `'Jost', ${SYSTEM}`,
    word: `'Jost', ${SYSTEM}`,
  },
  radius: '0px',
  light: {
    paper: '#f2f0ea',
    surface: '#ffffff',
    ink: '#111111',
    inkSoft: '#4a4740',
    line: '#d6d2c6',
    accent: '#1c4e9d',
    accentInk: '#ffffff',
    meaning: '#f4c20d',
    onMeaning: '#111111',
    german: '#d52b1e',
    onGerman: '#ffffff',
    der: '#1c4e9d',
    die: '#c0251a',
    das: '#7a5d00',
    good: '#1c6b3a',
    bad: '#d52b1e',
    warn: '#7a5d00',
    hero: '#1c4e9d',
    onHero: '#ffffff',
    onHeroSoft: '#dbe6f7',
    heroDer: '#cfe0ff',
    heroDie: '#ffc2bd',
    heroDas: '#ffe27a',
    stages: {
      apprentice: { bg: '#6e6a60', fg: '#ffffff' },
      guru: { bg: '#1c4e9d', fg: '#ffffff' },
      master: { bg: '#d52b1e', fg: '#ffffff' },
      enlightened: { bg: '#f4c20d', fg: '#111111' },
      burned: { bg: '#111111', fg: '#ffffff' },
    },
    shadow: 'none',
    border: '3px solid #111111',
  },
  dark: {
    paper: '#111111',
    surface: '#1c1c1c',
    ink: '#f2f0ea',
    inkSoft: '#b5b0a4',
    line: '#3a3a3a',
    accent: '#f4c20d',
    accentInk: '#111111',
    meaning: '#f4c20d',
    onMeaning: '#111111',
    german: '#ff5a4e',
    onGerman: '#111111',
    der: '#7fa6f0',
    die: '#ff7a70',
    das: '#f4c20d',
    good: '#7fd18f',
    bad: '#ff7a70',
    warn: '#f4c20d',
    hero: '#1c4e9d',
    onHero: '#ffffff',
    onHeroSoft: '#dbe6f7',
    heroDer: '#cfe0ff',
    heroDie: '#ffc2bd',
    heroDas: '#ffe27a',
    stages: {
      apprentice: { bg: '#b5b0a4', fg: '#111111' },
      guru: { bg: '#7fa6f0', fg: '#111111' },
      master: { bg: '#ff7a70', fg: '#111111' },
      enlightened: { bg: '#f4c20d', fg: '#111111' },
      burned: { bg: '#f2f0ea', fg: '#111111' },
    },
    shadow: 'none',
    border: '3px solid #f2f0ea',
  },
};

const bahn: Theme = {
  id: 'bahn',
  name: 'Schwarz-Rot-Gold',
  tagline: 'Flag colours on a departure board',
  stages: {
    apprentice: { de: 'Bummelzug', en: 'slow train' },
    guru: { de: 'Regionalzug', en: 'regional train' },
    master: { de: 'Eilzug', en: 'fast train' },
    enlightened: { de: 'Schnellzug', en: 'express' },
    burned: { de: 'Endstation', en: 'terminus' },
  },
  copy: { stagesTitle: 'Timetable', right: 'Pünktlich!', wrong: 'Verspätung!' },
  fonts: {
    body: SYSTEM,
    display: `'Barlow Condensed', ${SYSTEM}`,
    brand: `'Barlow Condensed', ${SYSTEM}`,
    word: `'Barlow Condensed', ${SYSTEM}`,
  },
  radius: '6px',
  fixedScheme: 'dark',
  light: {
    paper: '#0b0b0c',
    surface: '#16233f',
    ink: '#ffffff',
    inkSoft: '#b9c3d9',
    line: '#2a3a5e',
    accent: '#ffce00',
    accentInk: '#0b0b0c',
    meaning: '#ffce00',
    onMeaning: '#0b0b0c',
    german: '#dd0000',
    onGerman: '#ffffff',
    der: '#8db4ff',
    die: '#ff7a7a',
    das: '#7fd18f',
    good: '#7fd18f',
    bad: '#ff7a7a',
    warn: '#ffce00',
    hero: '#16233f',
    onHero: '#ffffff',
    onHeroSoft: '#b9c3d9',
    heroDer: '#8db4ff',
    heroDie: '#ff7a7a',
    heroDas: '#7fd18f',
    stages: {
      apprentice: { bg: '#4b5263', fg: '#ffffff' },
      guru: { bg: '#2a4c9a', fg: '#ffffff' },
      master: { bg: '#dd0000', fg: '#ffffff' },
      enlightened: { bg: '#ffce00', fg: '#0b0b0c' },
      burned: { bg: '#ffffff', fg: '#0b0b0c' },
    },
    shadow: 'none',
    border: 'none',
  },
};

const backstube: Theme = {
  id: 'backstube',
  name: 'Backstube',
  tagline: 'Old print, bread and blackletter',
  stages: {
    apprentice: { de: 'Mehl', en: 'flour' },
    guru: { de: 'Teig', en: 'dough' },
    master: { de: 'Gare', en: 'proofing' },
    enlightened: { de: 'Ofen', en: 'oven' },
    burned: { de: 'Brezel', en: 'pretzel' },
  },
  copy: { stagesTitle: 'The shelf', right: 'Gut gebacken!', wrong: 'Angebrannt!' },
  fonts: {
    body: `'Alegreya Sans', ${SYSTEM}`,
    display: `'Alegreya Sans', ${SYSTEM}`,
    brand: `'UnifrakturMaguntia', 'Alegreya Sans', serif`,
    word: `'Alegreya Sans', ${SYSTEM}`,
  },
  radius: '4px',
  light: {
    paper: '#ede4d3',
    surface: '#fbf6ec',
    ink: '#221d18',
    inkSoft: '#5a4e40',
    line: '#cfc2ab',
    accent: '#8c2b1e',
    accentInk: '#fff8ec',
    meaning: '#5a3e22',
    onMeaning: '#fff8ec',
    german: '#8c2b1e',
    onGerman: '#fff8ec',
    der: '#2b4c8c',
    die: '#8c2b1e',
    das: '#2f6b3a',
    good: '#2f6b3a',
    bad: '#8c2b1e',
    warn: '#7a5300',
    hero: '#221d18',
    onHero: '#fbf6ec',
    onHeroSoft: '#d8cbb6',
    heroDer: '#a9c1f2',
    heroDie: '#f0a090',
    heroDas: '#a8d49a',
    stages: {
      apprentice: { bg: '#7a6e5e', fg: '#ffffff' },
      guru: { bg: '#9c6b2e', fg: '#ffffff' },
      master: { bg: '#6d7a3a', fg: '#ffffff' },
      enlightened: { bg: '#8c2b1e', fg: '#ffffff' },
      burned: { bg: '#3a2614', fg: '#ffffff' },
    },
    shadow: '4px 4px 0 #221d18',
    border: '2px solid #221d18',
  },
  dark: {
    paper: '#1a1511',
    surface: '#241d17',
    ink: '#f3eadb',
    inkSoft: '#bfaf97',
    line: '#3a3027',
    accent: '#e8a08f',
    accentInk: '#1a1511',
    meaning: '#d9b27c',
    onMeaning: '#1a1511',
    german: '#e8a08f',
    onGerman: '#1a1511',
    der: '#9db8f0',
    die: '#f0a090',
    das: '#9ccb8a',
    good: '#9ccb8a',
    bad: '#f0a090',
    warn: '#e0ac55',
    hero: '#3a2614',
    onHero: '#f3eadb',
    onHeroSoft: '#d8cbb6',
    heroDer: '#a9c1f2',
    heroDie: '#f0a090',
    heroDas: '#a8d49a',
    stages: {
      apprentice: { bg: '#cfc2ab', fg: '#1a1511' },
      guru: { bg: '#e0b47a', fg: '#1a1511' },
      master: { bg: '#b8c78a', fg: '#1a1511' },
      enlightened: { bg: '#e8a08f', fg: '#1a1511' },
      burned: { bg: '#f3eadb', fg: '#1a1511' },
    },
    shadow: '4px 4px 0 #000000',
    border: '2px solid #5a4a3a',
  },
};

export const THEMES: readonly Theme[] = [alpen, bauhaus, bahn, backstube];
export const DEFAULT_THEME: ThemeId = 'alpen';

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? alpen;
}

/** Turns whatever was stored into a known theme id, falling back to the default. */
export function parseThemeId(raw: unknown): ThemeId {
  return THEMES.some((t) => t.id === raw) ? (raw as ThemeId) : DEFAULT_THEME;
}

export function paletteFor(theme: Theme, prefersDark: boolean): { palette: Palette; scheme: 'light' | 'dark' } {
  if (theme.fixedScheme) return { palette: theme.light, scheme: theme.fixedScheme };
  if (prefersDark && theme.dark) return { palette: theme.dark, scheme: 'dark' };
  return { palette: theme.light, scheme: 'light' };
}

/** The CSS custom properties the stylesheets read, for this theme and scheme. */
export function cssVariables(theme: Theme, prefersDark: boolean): Record<string, string> {
  const { palette: p } = paletteFor(theme, prefersDark);
  const vars: Record<string, string> = {
    '--paper': p.paper,
    '--surface': p.surface,
    '--ink': p.ink,
    '--ink-soft': p.inkSoft,
    '--line': p.line,
    '--accent': p.accent,
    '--accent-ink': p.accentInk,
    '--meaning': p.meaning,
    '--on-meaning': p.onMeaning,
    '--german': p.german,
    '--on-german': p.onGerman,
    '--der': p.der,
    '--die': p.die,
    '--das': p.das,
    '--good': p.good,
    '--bad': p.bad,
    '--warn': p.warn,
    '--hero': p.hero,
    '--on-hero': p.onHero,
    '--on-hero-soft': p.onHeroSoft,
    '--hero-der': p.heroDer,
    '--hero-die': p.heroDie,
    '--hero-das': p.heroDas,
    '--shadow': p.shadow,
    '--border': p.border,
    '--radius': theme.radius,
    '--font': theme.fonts.body,
    '--font-display': theme.fonts.display,
    '--font-brand': theme.fonts.brand,
    '--font-word': theme.fonts.word,
  };
  STAGE_KEYS.forEach((key, i) => {
    vars[`--stage-${i + 1}`] = p.stages[key].bg;
    vars[`--on-stage-${i + 1}`] = p.stages[key].fg;
  });
  return vars;
}

/** How long words rest at each stage group, in plain English. */
export const STAGE_INTERVAL: Record<StageKey, string> = {
  apprentice: '4 h – 2 days',
  guru: '1–2 weeks',
  master: '1 month',
  enlightened: '4 months',
  burned: 'learned for good',
};

/**
 * The label for one SRS stage in this theme: the group's German name, numbered
 * within the group where it has several steps (Tal 1–4, Alm 1–2). Stage 0 is a new word.
 */
export function stageLabel(theme: Theme, stage: Stage): string {
  const group = stageGroup(stage);
  if (group === 'lesson') return 'Neu';
  const name = theme.stages[group].de;
  if (group === 'apprentice') return `${name} ${stage}`;
  if (group === 'guru') return `${name} ${stage - 4}`;
  return name;
}
