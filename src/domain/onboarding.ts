import type { StageKey, Theme } from '../ui/themes';

/**
 * First-run intro and one-time hints. Pure data and functions; storage lives in repo.ts.
 *
 * All copy that names a stage takes it from the theme, so it reads right in every theme.
 */

/** Bump when the intro changes enough that existing learners should see it once more. */
export const ONBOARDING_VERSION = 1;

export interface OnboardingState {
  version: number;
  completedAt: number;
}

/** The intro is done when it was completed (or skipped) at the current version. */
export function introDone(state: OnboardingState | undefined): boolean {
  return state !== undefined && state.version >= ONBOARDING_VERSION;
}

export interface IntroCard {
  heading: string;
  body: string;
  /** The button's German label, with its English shown underneath. */
  button: { de: string; en: string };
  /** Card 4 shows the theme's stage names as a little ladder. */
  showStages?: boolean;
}

const name = (theme: Theme, key: StageKey) => theme.stages[key].de;

export function introCards(theme: Theme): IntroCard[] {
  const next = { de: 'Weiter', en: 'next' };
  return [
    {
      heading: 'Willkommen bei Gipfel',
      body: 'Learn the German people actually speak, one small step at a time. About 20–40 minutes a day is plenty.',
      button: next,
    },
    {
      heading: 'Five new words a day',
      body: 'Each day brings up to 5 new words and phrases, most useful first. Nouns always come with their article: der, die or das.',
      button: next,
    },
    {
      heading: 'Type your answers',
      body: 'Reviews ask both ways: German to English, and English to German. Typing the German is what gets it ready for speaking.',
      button: next,
    },
    {
      heading: 'Words move up',
      body: `Every right answer moves a word up a step and spaces out its next review, from hours to months. A wrong answer sends it back down. New words start in ${name(theme, 1)} and climb to ${name(theme, 5)}.`,
      button: next,
      showStages: true,
    },
    {
      heading: 'Read and listen',
      body: 'Short stories unlock once you know almost every word in them. Tap any word you don’t know to see it. Every story can be read aloud.',
      button: { de: 'Los geht’s', en: 'let’s go' },
    },
  ];
}

export type HintId =
  | 'stage-steps'
  | 'next-reviews'
  | 'first-up'
  | 'early-limit'
  | 'speaking'
  | 'wrong-answer'
  | 'article'
  | 'story-unlocked'
  | 'story-words'
  | 'level-complete';

export const HINT_IDS: readonly HintId[] = [
  'stage-steps',
  'next-reviews',
  'first-up',
  'early-limit',
  'speaking',
  'wrong-answer',
  'article',
  'story-unlocked',
  'story-words',
  'level-complete',
];

export function hintText(id: HintId, theme: Theme): string {
  const s1 = name(theme, 1);
  const s2 = name(theme, 2);
  switch (id) {
    case 'stage-steps':
      return `The boxes beside ${s1} are your newest words, one box per step: 4 hours, 8 hours, 1 day, 2 days. Words move right as you get them right.`;
    case 'next-reviews':
      return 'Your next reviews and how many are due. Short, frequent visits work best.';
    case 'first-up':
      return `Your first word has reached ${s2}. Its next review is in 1–2 weeks.`;
    case 'early-limit':
      return `New lessons pause at 40 words in ${s1}, so reviews stay manageable. They start again as words move up to ${s2}.`;
    case 'speaking':
      return 'You know enough words for simple real conversations. Try a few minutes with a German speaker this week.';
    case 'wrong-answer':
      return 'No problem: this word drops back a step and comes round again sooner.';
    case 'article':
      return 'Learn the article with the noun, as one unit: der Tisch, die Tür, das Haus.';
    case 'story-unlocked':
      return 'You know enough words to read a story. The percentage shows how much of it you know.';
    case 'story-words':
      return 'Tap a word you don’t know to see what it means.';
    case 'level-complete':
      return 'New words keep coming either way: levels are chapters, not locks.';
  }
}

/** Words at the known stage or above before the app suggests speaking. */
export const SPEAKING_MILESTONE = 400;

/** New lessons pause at 40 in the first group; warn a little before. */
export const EARLY_LIMIT_HINT_AT = 30;

export interface DashboardFacts {
  /** Words in stage group 1. */
  first: number;
  /** Words in stage group 2. */
  second: number;
  /** Words at the known stage or above (groups 2–5). */
  known: number;
  /** Any review is scheduled. */
  scheduled: boolean;
}

/** Home-screen hints, in the order a new learner meets them. */
const DASHBOARD_HINTS: readonly { id: HintId; when: (f: DashboardFacts) => boolean }[] = [
  { id: 'stage-steps', when: (f) => f.first > 0 },
  { id: 'next-reviews', when: (f) => f.scheduled },
  { id: 'first-up', when: (f) => f.second > 0 },
  { id: 'early-limit', when: (f) => f.first >= EARLY_LIMIT_HINT_AT },
  { id: 'speaking', when: (f) => f.known >= SPEAKING_MILESTONE },
];

/** The one home-screen hint to show now, if any: the first that applies and hasn't been seen. */
export function dashboardHint(facts: DashboardFacts, seen: readonly string[]): HintId | null {
  return DASHBOARD_HINTS.find((h) => !seen.includes(h.id) && h.when(facts))?.id ?? null;
}
