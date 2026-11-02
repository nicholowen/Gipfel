import { bare } from './german';
import type { ContentItem } from './types';

/**
 * Graded stories. A story's German is plain text with optional annotations right after a word:
 *
 *   Kind{n-kind}         this word is item n-kind (needed when a form is ambiguous or not in the lexicon)
 *   aus{?from}           not taught yet: show this gloss when tapped
 *   Anna{-}              a name or other word that never counts toward coverage
 *
 * Every other word is matched automatically against the items' forms (see buildLexicon), and
 * multi-word phrase items are matched first. Validation insists every word resolves, so coverage
 * is exact.
 */

export interface StoryLine {
  /** For dialogues: who is speaking. */
  speaker?: string;
  de: string;
  en: string;
}

export interface Story {
  /** Stable slug, e.g. 's-der-handschuh'. */
  id: string;
  title: string;
  titleEn: string;
  /** The level the story is written for: every word is taught by this level, or glossed. */
  level: number;
  kind: 'story' | 'dialogue';
  /** Names that never count toward coverage (no need to annotate each one). */
  names?: string[];
  lines: StoryLine[];
}

export type Token =
  | { type: 'text'; text: string }
  /** A word that counts toward coverage. It is known when any of `itemIds` is known (a phrase, or the word itself). */
  | { type: 'word'; text: string; itemIds: string[]; phraseId?: string }
  | { type: 'gloss'; text: string; gloss: string }
  | { type: 'name'; text: string }
  /** No item matches, or more than one does. Only valid content has none of these. */
  | { type: 'unresolved'; text: string; candidates: string[] };

export interface Lexicon {
  words: Map<string, string[]>;
  /** Multi-word items, longest first. */
  phrases: { itemId: string; words: string[] }[];
  ids: Set<string>;
}

const ADJECTIVE_ENDINGS = ['e', 'en', 'er', 'es', 'em'];

/** Every single-word form that counts as this item in a story. */
export function itemForms(item: ContentItem): string[] {
  const forms = [item.german, ...(item.alternatives ?? []), ...(item.forms ?? [])];
  if (item.kind === 'noun' && item.plural) forms.push(item.plural);
  if (item.verbForms) forms.push(...Object.values(item.verbForms.present), item.verbForms.pastParticiple);
  if (item.kind === 'adjective') forms.push(...ADJECTIVE_ENDINGS.map((e) => item.german + e));
  return forms.filter((f) => !bare(f).includes(' '));
}

export function buildLexicon(items: readonly ContentItem[]): Lexicon {
  const words = new Map<string, string[]>();
  const phrases: Lexicon['phrases'] = [];
  for (const item of items) {
    for (const form of itemForms(item)) {
      const key = bare(form);
      if (!key) continue;
      const ids = words.get(key) ?? [];
      if (!ids.includes(item.id)) ids.push(item.id);
      words.set(key, ids);
    }
    for (const text of [item.german, ...(item.alternatives ?? [])]) {
      const parts = bare(text).split(' ').filter(Boolean);
      if (parts.length > 1) phrases.push({ itemId: item.id, words: parts });
    }
  }
  phrases.sort((a, b) => b.words.length - a.words.length);
  return { words, phrases, ids: new Set(items.map((i) => i.id)) };
}

const WORD = /([\p{L}\p{N}]+(?:['’][\p{L}]+)?)(?:\{([^}]*)\})?/gu;

interface RawWord {
  text: string;
  note?: string;
}

/** Split a line into words (with their annotations) and the text between them. */
function split(de: string): (RawWord | string)[] {
  const out: (RawWord | string)[] = [];
  let last = 0;
  for (const m of de.matchAll(WORD)) {
    if (m.index > last) out.push(de.slice(last, m.index));
    out.push({ text: m[1], note: m[2] });
    last = m.index + m[0].length;
  }
  if (last < de.length) out.push(de.slice(last));
  return out;
}

export function tokenizeLine(de: string, lexicon: Lexicon, names: readonly string[] = []): Token[] {
  const parts = split(de);
  const wordIdx = parts.flatMap((p, i) => (typeof p === 'string' ? [] : [i]));
  const nameSet = new Set(names.map(bare));

  // Phrase spans first: runs of unannotated words that spell out a multi-word item.
  const phraseOf = new Map<number, string>();
  for (let w = 0; w < wordIdx.length; w++) {
    if (phraseOf.has(wordIdx[w])) continue;
    for (const phrase of lexicon.phrases) {
      const span = wordIdx.slice(w, w + phrase.words.length);
      if (span.length < phrase.words.length) continue;
      const matches = span.every((i, k) => {
        const p = parts[i] as RawWord;
        return p.note === undefined && bare(p.text) === phrase.words[k];
      });
      if (matches) {
        for (const i of span) phraseOf.set(i, phrase.itemId);
        break;
      }
    }
  }

  return parts.map((p, i): Token => {
    if (typeof p === 'string') return { type: 'text', text: p };
    const { text, note } = p;
    if (note === '-') return { type: 'name', text };
    if (note?.startsWith('?')) return { type: 'gloss', text, gloss: note.slice(1).trim() };
    if (note !== undefined) {
      return lexicon.ids.has(note) ? { type: 'word', text, itemIds: [note] } : { type: 'unresolved', text, candidates: [] };
    }
    if (nameSet.has(bare(text))) return { type: 'name', text };

    const own = lexicon.words.get(bare(text)) ?? [];
    const phraseId = phraseOf.get(i);
    if (phraseId) return { type: 'word', text, itemIds: [phraseId, ...(own.length === 1 ? own : [])], phraseId };
    if (own.length === 1) return { type: 'word', text, itemIds: own };
    return { type: 'unresolved', text, candidates: own };
  });
}

export function tokenizeStory(story: Story, lexicon: Lexicon): Token[][] {
  return story.lines.map((line) => tokenizeLine(line.de, lexicon, story.names));
}

export interface Coverage {
  /** Words that count toward coverage (names excluded). */
  total: number;
  known: number;
  /** known / total, 1 for an empty story. */
  ratio: number;
}

export function coverage(lines: Token[][], isKnown: (itemId: string) => boolean): Coverage {
  let total = 0;
  let known = 0;
  for (const token of lines.flat()) {
    if (token.type === 'text' || token.type === 'name') continue;
    total += 1;
    if (token.type === 'word' && token.itemIds.some(isKnown)) known += 1;
  }
  return { total, known, ratio: total === 0 ? 1 : known / total };
}

/** A story opens once the learner knows this share of its words. */
export const STORY_UNLOCK = 0.95;
/** What a well-written story aims for, counting everything taught up to its level as known. */
export const STORY_TARGET = 0.98;
