import { describe, expect, it } from 'vitest';
import { canLevelUp, itemsToUnlock, lessonQueue } from './unlock';
import type { ContentItem, ItemProgress, Stage } from './types';

const item = (id: string, level: number, order: number, prerequisites: string[] = []): ContentItem => ({
  id,
  level,
  order,
  kind: 'noun',
  german: id,
  article: 'der',
  meanings: [id],
  prerequisites,
  example: { de: '', en: '' },
});

const at = (itemId: string, stage: Stage): ItemProgress => ({
  itemId,
  stage,
  unlockedAt: 0,
  nextReviewAt: null,
  correctCount: 0,
  wrongCount: 0,
});

const byId = (rows: ItemProgress[]) => new Map(rows.map((r) => [r.itemId, r]));

const content = [
  item('hand', 1, 1),
  item('schuh', 1, 2),
  item('handschuh', 1, 3, ['hand', 'schuh']),
  item('tag', 2, 1),
];

describe('itemsToUnlock', () => {
  it('unlocks level 1 items without prerequisites at the start', () => {
    expect(itemsToUnlock(content, byId([]), 1)).toEqual(['hand', 'schuh']);
  });

  it('keeps a compound locked until every part reaches Guru', () => {
    expect(itemsToUnlock(content, byId([at('hand', 5), at('schuh', 4)]), 1)).toEqual([]);
  });

  it('unlocks a compound once every part reaches Guru', () => {
    expect(itemsToUnlock(content, byId([at('hand', 5), at('schuh', 6)]), 1)).toEqual(['handschuh']);
  });

  it('unlocks the next level only when it is the current level', () => {
    const progress = byId([at('hand', 5), at('schuh', 5), at('handschuh', 5)]);
    expect(itemsToUnlock(content, progress, 1)).toEqual([]);
    expect(itemsToUnlock(content, progress, 2)).toEqual(['tag']);
  });
});

describe('canLevelUp', () => {
  const twenty = Array.from({ length: 20 }, (_, i) => item(`w${i}`, 1, i));

  it('levels up when 90% of the level is at the known stage or above', () => {
    const progress = byId(twenty.slice(0, 18).map((i) => at(i.id, 5)));
    expect(canLevelUp(twenty, progress, 1)).toBe(true);
  });

  it('does not level up below 90%', () => {
    const progress = byId(twenty.slice(0, 17).map((i) => at(i.id, 5)));
    expect(canLevelUp(twenty, progress, 1)).toBe(false);
  });

  it('counts locked items in the total', () => {
    expect(canLevelUp(content, byId([at('hand', 5), at('schuh', 5)]), 1)).toBe(false);
  });

  it('cannot level up an empty level', () => {
    expect(canLevelUp(content, byId([]), 3)).toBe(false);
  });
});

describe('lessonQueue', () => {
  it('lists stage-0 items by level then order', () => {
    const progress = byId([at('tag', 0), at('schuh', 0), at('hand', 0), at('handschuh', 1)]);
    expect(lessonQueue(content, progress).map((i) => i.id)).toEqual(['hand', 'schuh', 'tag']);
  });
});
