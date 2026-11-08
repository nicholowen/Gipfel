import { describe, expect, it } from 'vitest';
import { check, type Outcome } from './answer-checker';
import type { ContentItem, QuestionType } from './types';

const base = { level: 1, order: 1, prerequisites: [], example: { de: '', en: '' } };

const hund: ContentItem = { ...base, id: 'n-hund', kind: 'noun', german: 'Hund', article: 'der', plural: 'Hunde', meanings: ['dog'] };
const handschuh: ContentItem = { ...base, id: 'n-handschuh', kind: 'noun', german: 'Handschuh', article: 'der', plural: 'Handschuhe', meanings: ['glove'] };
const krankenhaus: ContentItem = { ...base, id: 'n-krankenhaus', kind: 'noun', german: 'Krankenhaus', article: 'das', plural: 'Krankenhäuser', meanings: ['hospital'] };
const maedchen: ContentItem = { ...base, id: 'n-maedchen', kind: 'noun', german: 'Mädchen', article: 'das', plural: 'Mädchen', meanings: ['girl'] };
const strasse: ContentItem = { ...base, id: 'n-strasse', kind: 'noun', german: 'Straße', article: 'die', plural: 'Straßen', meanings: ['street', 'road'] };
const gehen: ContentItem = { ...base, id: 'v-gehen', kind: 'verb', german: 'gehen', meanings: ['to go', 'to walk'], verbForms: { present: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen' }, pastParticiple: 'gegangen', auxiliary: 'sein' } };
const wieGehts: ContentItem = { ...base, id: 'p-wie-gehts', kind: 'phrase', german: 'Wie geht’s?', alternatives: ['Wie geht es dir?', 'Wie geht es?'], meanings: ['How are you?', 'How’s it going?'] };
const weissNicht: ContentItem = { ...base, id: 'p-ich-weiss-nicht', kind: 'phrase', german: 'Ich weiß nicht.', meanings: ['I don’t know'] };
const heisse: ContentItem = { ...base, id: 'p-ich-heisse', kind: 'phrase', german: 'Ich heiße …', meanings: ['My name is …', 'I am called …'] };
const ein: ContentItem = { ...base, id: 'o-ein', kind: 'other', german: 'ein', alternatives: ['eine'], forms: ['eine', 'einen'], meanings: ['a', 'an'] };
const schnell: ContentItem = { ...base, id: 'a-schnell', kind: 'adjective', german: 'schnell', meanings: ['fast', 'quick'] };

// Spelled the same in English and German
const inPrep: ContentItem = { ...base, id: 'o-in', kind: 'other', german: 'in', meanings: ['in', 'into'] };
const warm: ContentItem = { ...base, id: 'a-warm', kind: 'adjective', german: 'warm', meanings: ['warm'] };
const hand: ContentItem = { ...base, id: 'n-hand', kind: 'noun', german: 'Hand', article: 'die', plural: 'Hände', meanings: ['hand'] };

type Row = [ContentItem, QuestionType, string, Outcome, { synonyms?: string[]; shookAlready?: boolean }?];

const rows: Row[] = [
  // Words spelled the same in both languages: the German answer is never mistaken for English
  [inPrep, 'german', 'in', 'correct'],
  [inPrep, 'meaning', 'in', 'correct'],
  [inPrep, 'german', 'into', 'shake'],
  [warm, 'german', 'warm', 'correct'],
  [hand, 'german', 'die Hand', 'correct'],
  [hand, 'german', 'Hand', 'shake'],
  [hand, 'german', 'der Hand', 'wrong'],
  // Phrases: whole-phrase answers, punctuation and apostrophes ignored, variants accepted
  [wieGehts, 'german', 'Wie geht’s?', 'correct'],
  [wieGehts, 'german', "wie gehts", 'correct'],
  [wieGehts, 'german', "Wie geht's", 'correct'],
  [wieGehts, 'german', 'wie geht es dir', 'correct'],
  [wieGehts, 'german', 'wie geht dir', 'wrong'],
  [wieGehts, 'german', 'wie gest es dir', 'shake'],
  [wieGehts, 'german', 'wie gest es dir', 'wrong', { shookAlready: true }],
  [wieGehts, 'german', 'was ist das', 'wrong'],
  [wieGehts, 'german', 'how are you', 'shake'],
  [wieGehts, 'meaning', 'how are you', 'correct'],
  [wieGehts, 'meaning', 'hows it going', 'correct'],
  [wieGehts, 'meaning', 'wie gehts', 'shake'],
  [weissNicht, 'german', 'ich weiss nicht', 'correct'],
  [weissNicht, 'meaning', 'i dont know', 'correct'],
  [weissNicht, 'meaning', 'I don’t know.', 'correct'],
  [heisse, 'german', 'ich heiße', 'correct'],
  [heisse, 'meaning', 'my name is', 'correct'],
  // Accepted alternatives for single words
  [ein, 'german', 'ein', 'correct'],
  [ein, 'german', 'eine', 'correct'],
  // Meaning questions
  [hund, 'meaning', 'dog', 'correct'],
  [hund, 'meaning', '  Dog ', 'correct'],
  [hund, 'meaning', 'the dog', 'correct'],
  [hund, 'meaning', 'a dog', 'correct'],
  [hund, 'meaning', 'dgo', 'wrong'],
  [hund, 'meaning', 'cat', 'wrong'],
  [hund, 'meaning', 'pooch', 'correct', { synonyms: ['pooch'] }],
  [handschuh, 'meaning', 'glov', 'close'],
  [handschuh, 'meaning', 'glve', 'close'],
  [handschuh, 'meaning', 'gluv', 'wrong'],
  [handschuh, 'meaning', 'gluvv', 'wrong'],
  [krankenhaus, 'meaning', 'hospitl', 'close'],
  [krankenhaus, 'meaning', 'hosptl', 'close'],
  [krankenhaus, 'meaning', 'hstpl', 'wrong'],
  [strasse, 'meaning', 'road', 'correct'],
  [gehen, 'meaning', 'go', 'correct'],
  [gehen, 'meaning', 'to go', 'correct'],
  [gehen, 'meaning', 'walk', 'correct'],
  [schnell, 'meaning', 'quick', 'correct'],
  // Wrong language or empty
  [hund, 'meaning', 'hund', 'shake'],
  [hund, 'meaning', 'der Hund', 'shake'],
  [hund, 'meaning', '   ', 'shake'],
  [hund, 'german', 'dog', 'shake'],
  [gehen, 'german', 'to go', 'shake'],
  // German questions
  [hund, 'german', 'der Hund', 'correct'],
  [hund, 'german', 'der hund', 'shake'],
  [hund, 'german', 'Der Hund', 'correct'],
  [hund, 'german', '  der Hund ', 'correct'],
  [hund, 'german', 'die hund', 'wrong'],
  [hund, 'german', 'Hund', 'shake'],
  [hund, 'german', 'Hunf', 'shake'],
  [hund, 'german', 'xyzzy', 'wrong'],
  [hund, 'german', 'Katze', 'wrong'],
  [hund, 'german', 'die Hund', 'wrong'],
  [hund, 'german', 'der Hunf', 'shake'],
  [hund, 'german', 'der Hunf', 'wrong', { shookAlready: true }],
  [hund, 'german', 'der Hdnu', 'wrong'],
  [maedchen, 'german', 'das Mädchen', 'correct'],
  [maedchen, 'german', 'das Maedchen', 'correct'],
  [maedchen, 'german', 'das Madchen', 'shake'],
  [strasse, 'german', 'die Strasse', 'correct'],
  [strasse, 'german', 'die straße', 'shake'],
  [strasse, 'german', 'die Straße', 'correct'],
  [maedchen, 'german', 'das maedchen', 'shake'],
  [gehen, 'german', 'gehen', 'correct'],
  [gehen, 'german', 'Gehen', 'correct'],
  [gehen, 'german', 'gehn', 'shake'],
  [schnell, 'german', 'schnell', 'correct'],
  [schnell, 'german', 'langsam', 'wrong'],
];

describe('check', () => {
  it.each(rows)('%o %s answer %j is %s', (item, question, input, expected, ctx) => {
    expect(check(item, question, input, ctx ?? {}).outcome).toBe(expected);
  });

  it('names the right article when the article is wrong', () => {
    expect(check(hund, 'german', 'die Hund', {}).message).toMatch(/der/);
  });

  it('asks for the article, not the German, when a same-spelled noun is typed bare', () => {
    expect(check(hand, 'german', 'Hand', {}).about).toBe('article');
  });

  it('asks for an article when it is missing', () => {
    expect(check(hund, 'german', 'Hund', {}).message).toMatch(/der, die or das/);
  });

  it('explains that nouns are capitalised, showing the right form', () => {
    expect(check(hund, 'german', 'der hund', {}).message).toBe('Nouns are capitalised: der Hund.');
  });

  it('keeps nudging about capitals even after a spelling shake', () => {
    expect(check(hund, 'german', 'der hund', { shookAlready: true }).outcome).toBe('shake');
  });

  it('does not ask for capitals on verbs or adjectives', () => {
    expect(check(gehen, 'german', 'gehen', {}).outcome).toBe('correct');
    expect(check(schnell, 'german', 'schnell', {}).outcome).toBe('correct');
  });

  it('calls a wrong article wrong even when the shake was already used', () => {
    expect(check(hund, 'german', 'Hund', { shookAlready: true }).outcome).toBe('shake');
  });
});
