import { describe, expect, it } from 'vitest';
import { buildLexicon, coverage, itemForms, tokenizeLine, type Token } from './stories';
import type { ContentItem } from './types';

const base = { level: 1, order: 1, prerequisites: [], example: { de: '', en: '' } };
const present = (ich: string, du: string, er: string, wir: string, ihr: string, sie: string) => ({ ich, du, er, wir, ihr, sie });

const items: ContentItem[] = [
  { ...base, id: 'n-kind', kind: 'noun', german: 'Kind', article: 'das', plural: 'Kinder', meanings: ['child'] },
  { ...base, id: 'o-der', kind: 'other', german: 'der', alternatives: ['die', 'das'], meanings: ['the'] },
  { ...base, id: 'v-sehen', kind: 'verb', german: 'sehen', meanings: ['to see'], verbForms: { present: present('sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'), pastParticiple: 'gesehen', auxiliary: 'haben' } },
  { ...base, id: 'a-gross', kind: 'adjective', german: 'groß', meanings: ['big'] },
  { ...base, id: 'o-ein', kind: 'other', german: 'ein', forms: ['eine', 'einen'], meanings: ['a'] },
  { ...base, id: 'o-ich', kind: 'other', german: 'ich', meanings: ['I'] },
  { ...base, id: 'p-ich-weiss-nicht', kind: 'phrase', german: 'Ich weiß nicht.', meanings: ['I don’t know'] },
  { ...base, id: 'p-wie-gehts', kind: 'phrase', german: 'Wie geht’s?', alternatives: ['Wie geht es dir?'], meanings: ['How are you?'] },
  { ...base, id: 'o-sie', kind: 'other', german: 'sie', meanings: ['she'] },
  { ...base, id: 'o-sie-they', kind: 'other', german: 'sie', meanings: ['they'] },
];
const lexicon = buildLexicon(items);

const words = (tokens: Token[]) => tokens.filter((t) => t.type !== 'text');

describe('itemForms', () => {
  it('includes plurals, the present tense, participles, adjective endings and extra forms', () => {
    expect(itemForms(items[0])).toEqual(['Kind', 'Kinder']);
    expect(itemForms(items[2])).toContain('siehst');
    expect(itemForms(items[2])).toContain('gesehen');
    expect(itemForms(items[3])).toContain('große');
    expect(itemForms(items[4])).toEqual(['ein', 'eine', 'einen']);
  });
});

describe('tokenizeLine', () => {
  it('matches words in any case and keeps punctuation as text', () => {
    const tokens = tokenizeLine('Das Kind sieht große Kinder.', lexicon);
    expect(words(tokens).map((t) => (t.type === 'word' ? t.itemIds : t.type))).toEqual([
      ['o-der'],
      ['n-kind'],
      ['v-sehen'],
      ['a-gross'],
      ['n-kind'],
    ]);
    expect(tokens.map((t) => t.text).join('')).toBe('Das Kind sieht große Kinder.');
  });

  it('matches multi-word phrases first, ignoring punctuation and apostrophes', () => {
    const tokens = words(tokenizeLine('„Ich weiß nicht“, sagt das Kind.'.replace('sagt ', ''), lexicon));
    expect(tokens.slice(0, 3)).toEqual([
      { type: 'word', text: 'Ich', itemIds: ['p-ich-weiss-nicht', 'o-ich'], phraseId: 'p-ich-weiss-nicht' },
      { type: 'word', text: 'weiß', itemIds: ['p-ich-weiss-nicht'], phraseId: 'p-ich-weiss-nicht' },
      { type: 'word', text: 'nicht', itemIds: ['p-ich-weiss-nicht'], phraseId: 'p-ich-weiss-nicht' },
    ]);
    const gehts = words(tokenizeLine('Wie geht’s?', lexicon));
    expect(gehts.every((t) => t.type === 'word' && t.phraseId === 'p-wie-gehts')).toBe(true);
    const long = words(tokenizeLine('Wie geht es dir?', lexicon));
    expect(long).toHaveLength(4);
    expect(long.every((t) => t.type === 'word' && t.phraseId === 'p-wie-gehts')).toBe(true);
  });

  it('reads annotations: explicit item, gloss and name', () => {
    const tokens = words(tokenizeLine('Sie{o-sie-they} wohnt{?lives} in Berlin{-}.', lexicon));
    expect(tokens).toEqual([
      { type: 'word', text: 'Sie', itemIds: ['o-sie-they'] },
      { type: 'gloss', text: 'wohnt', gloss: 'lives' },
      { type: 'unresolved', text: 'in', candidates: [] },
      { type: 'name', text: 'Berlin' },
    ]);
  });

  it('treats listed names as names and flags ambiguous or unknown words', () => {
    const tokens = words(tokenizeLine('Anna sieht sie.', lexicon, ['Anna']));
    expect(tokens[0]).toEqual({ type: 'name', text: 'Anna' });
    expect(tokens[2]).toEqual({ type: 'unresolved', text: 'sie', candidates: ['o-sie', 'o-sie-they'] });
    expect(words(tokenizeLine('Kind{n-nope}', lexicon))[0].type).toBe('unresolved');
  });
});

describe('coverage', () => {
  it('counts glossed words as unknown and skips names', () => {
    const lines = [tokenizeLine('Das Kind sieht{?sees} Anna{-}.', lexicon)];
    expect(coverage(lines, () => true)).toEqual({ total: 3, known: 2, ratio: 2 / 3 });
  });

  it('counts a phrase word as known when either the phrase or the word itself is known', () => {
    const lines = [tokenizeLine('Ich weiß nicht.', lexicon)];
    expect(coverage(lines, (id) => id === 'o-ich').known).toBe(1);
    expect(coverage(lines, (id) => id === 'p-ich-weiss-nicht').known).toBe(3);
  });
});
