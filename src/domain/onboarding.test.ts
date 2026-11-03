import { describe, expect, it } from 'vitest';
import { THEMES, getTheme } from '../ui/themes';
import { dashboardHint, HINT_IDS, hintText, introCards, introDone, ONBOARDING_VERSION } from './onboarding';

const facts = { first: 0, second: 0, known: 0, scheduled: false };

describe('introDone', () => {
  it('is false until completed at the current version', () => {
    expect(introDone(undefined)).toBe(false);
    expect(introDone({ version: ONBOARDING_VERSION - 1, completedAt: 1 })).toBe(false);
    expect(introDone({ version: ONBOARDING_VERSION, completedAt: 1 })).toBe(true);
  });
});

describe('copy follows the theme', () => {
  it.each(THEMES.map((t) => [t.id, t] as const))('%s names its own stages', (_, theme) => {
    const stagesCard = introCards(theme).find((c) => c.showStages)!;
    expect(stagesCard.body).toContain(theme.stages[1].de);
    expect(stagesCard.body).toContain(theme.stages[5].de);
    expect(hintText('stage-steps', theme)).toContain(theme.stages[1].de);
    expect(hintText('first-up', theme)).toContain(theme.stages[2].de);
    for (const other of THEMES.filter((o) => o.id !== theme.id)) {
      for (const id of HINT_IDS) expect(hintText(id, theme)).not.toContain(other.stages[1].de);
    }
  });

  it('has five cards ending on Los geht’s', () => {
    const cards = introCards(getTheme('alpen'));
    expect(cards).toHaveLength(5);
    expect(cards.at(-1)!.button.de).toBe('Los geht’s');
  });
});

describe('dashboardHint', () => {
  it('shows nothing for a learner with no words', () => {
    expect(dashboardHint(facts, [])).toBeNull();
  });

  it('shows hints one at a time, in order', () => {
    const f = { ...facts, first: 5, scheduled: true };
    expect(dashboardHint(f, [])).toBe('stage-steps');
    expect(dashboardHint(f, ['stage-steps'])).toBe('next-reviews');
    expect(dashboardHint(f, ['stage-steps', 'next-reviews'])).toBeNull();
  });

  it('warns before the lesson pause and suggests speaking at the milestone', () => {
    const seen = ['stage-steps', 'next-reviews', 'first-up'];
    expect(dashboardHint({ ...facts, first: 30, second: 1, scheduled: true }, seen)).toBe('early-limit');
    expect(dashboardHint({ ...facts, first: 1, second: 1, known: 400, scheduled: true }, seen)).toBe('speaking');
  });
});
