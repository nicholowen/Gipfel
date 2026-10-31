import { describe, expect, it } from 'vitest';
import { curriculum } from './curriculum';
import { validateCurriculum } from './validate';

const noun = (id: string, extra: object = {}) => ({
  id,
  level: 1,
  order: 1,
  kind: 'noun',
  german: 'X',
  article: 'der',
  plural: null,
  meanings: ['x'],
  prerequisites: [],
  example: { de: 'x', en: 'x' },
  ...extra,
});

const wrap = (items: object[]) => ({ contentVersion: 1, levels: [{ number: 1, title: 'One' }], items });

describe('validateCurriculum', () => {
  it('accepts the bundled curriculum', () => {
    expect(validateCurriculum(curriculum)).toEqual([]);
  });

  it('requires an article on nouns', () => {
    expect(validateCurriculum(wrap([noun('n-a', { article: undefined })]))).toContainEqual(
      expect.stringContaining('nouns need an article'),
    );
  });

  it('rejects duplicate ids', () => {
    expect(validateCurriculum(wrap([noun('n-a'), noun('n-a', { order: 2 })]))).toContain('n-a: duplicate id');
  });

  it('rejects missing prerequisites', () => {
    expect(validateCurriculum(wrap([noun('n-a', { prerequisites: ['n-zz'] })]))).toContain(
      'n-a: prerequisite n-zz does not exist',
    );
  });

  it('rejects prerequisite cycles', () => {
    const problems = validateCurriculum(
      wrap([noun('n-a', { prerequisites: ['n-b'] }), noun('n-b', { order: 2, prerequisites: ['n-a'] })]),
    );
    expect(problems.some((p) => p.startsWith('prerequisite cycle'))).toBe(true);
  });
});
