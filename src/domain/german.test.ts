import { describe, expect, it } from 'vitest';
import { fold, levenshtein, normalise, splitArticle } from './german';

describe('normalise', () => {
  it.each([
    ['  Dog ', 'dog'],
    ['to   go', 'to go'],
    ['Yes!', 'yes'],
    ['the dog.', 'the dog'],
  ])('normalises %j to %j', (input, expected) => {
    expect(normalise(input)).toBe(expected);
  });
});

describe('fold', () => {
  it.each([
    ['Mädchen', 'maedchen'],
    ['Maedchen', 'maedchen'],
    ['Straße', 'strasse'],
    ['Strasse', 'strasse'],
    ['Tür', 'tuer'],
    ['schön', 'schoen'],
    ['GROSS', 'gross'],
  ])('folds %j to %j', (input, expected) => {
    expect(fold(input)).toBe(expected);
  });
});

describe('splitArticle', () => {
  it('splits a leading article', () => {
    expect(splitArticle('der hund')).toEqual({ article: 'der', rest: 'hund' });
  });

  it('returns no article when there is none', () => {
    expect(splitArticle('hund')).toEqual({ article: undefined, rest: 'hund' });
  });

  it('does not treat a word starting with the letters of an article as one', () => {
    expect(splitArticle('derzeit')).toEqual({ article: undefined, rest: 'derzeit' });
  });
});

describe('levenshtein', () => {
  it.each([
    ['dog', 'dog', 0],
    ['dog', 'dgo', 2],
    ['glove', 'glov', 1],
    ['hospital', 'hospitl', 1],
    ['', 'abc', 3],
  ])('distance between %j and %j is %i', (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
  });
});
