import type { Article } from './types';

const ARTICLES: readonly Article[] = ['der', 'die', 'das'];

/** Trim, collapse spaces, lowercase and drop trailing punctuation. */
export function normalise(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[.!?,;:]+$/, '')
    .trim();
}

/** Normalise, then fold umlauts and ß so either spelling compares equal. */
export function fold(input: string): string {
  return normalise(input)
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/** Fold, then drop all punctuation (apostrophes, commas, ellipses): for whole phrases. */
export function bare(input: string): string {
  return fold(input)
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitArticle(input: string): { article: Article | undefined; rest: string } {
  const [first, ...others] = input.split(' ');
  if (others.length > 0 && (ARTICLES as readonly string[]).includes(first)) {
    return { article: first as Article, rest: others.join(' ') };
  }
  return { article: undefined, rest: input };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost));
    }
    previous = current;
  }
  return previous[b.length];
}
