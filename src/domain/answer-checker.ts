import { fold, levenshtein, normalise, splitArticle } from './german';
import type { ContentItem, QuestionType } from './types';

/**
 * correct / close: the question is passed (close = accepted typo).
 * wrong: the question is failed.
 * shake: not counted; the learner is asked to try again.
 */
export type Outcome = 'correct' | 'close' | 'wrong' | 'shake';

export interface CheckResult {
  outcome: Outcome;
  message?: string;
}

export interface CheckContext {
  /** Extra meanings the learner has added for this item. */
  synonyms?: string[];
  /** True once this question has already used its one spelling shake. */
  shookAlready?: boolean;
}

export function check(item: ContentItem, question: QuestionType, input: string, ctx: CheckContext): CheckResult {
  if (normalise(input) === '') return { outcome: 'shake', message: 'Type an answer first.' };
  return question === 'meaning' ? checkMeaning(item, input, ctx) : checkGerman(item, input, ctx);
}

/** Strip the bits of an English answer that don't change its meaning. */
function englishCore(text: string): string {
  return normalise(text).replace(/^(to|the|a|an) /, '');
}

function meaningTolerance(target: string): number {
  if (target.length <= 3) return 0;
  if (target.length <= 7) return 1;
  return 2;
}

function matchesMeaning(item: ContentItem, input: string, ctx: CheckContext): 'exact' | 'close' | 'none' {
  const answer = englishCore(input);
  const targets = [...item.meanings, ...(ctx.synonyms ?? [])].map(englishCore);
  if (targets.includes(answer)) return 'exact';
  const close = targets.some((t) => levenshtein(answer, t) <= meaningTolerance(t));
  return close ? 'close' : 'none';
}

function isTheGerman(item: ContentItem, input: string): boolean {
  const { rest } = splitArticle(fold(input));
  return rest === fold(item.german);
}

function checkMeaning(item: ContentItem, input: string, ctx: CheckContext): CheckResult {
  const match = matchesMeaning(item, input, ctx);
  if (match === 'exact') return { outcome: 'correct' };
  if (match === 'close') return { outcome: 'close', message: `Close enough: "${item.meanings[0]}".` };
  if (isTheGerman(item, input)) return { outcome: 'shake', message: 'That’s the German. What does it mean in English?' };
  return { outcome: 'wrong' };
}

function checkGerman(item: ContentItem, input: string, ctx: CheckContext): CheckResult {
  const { article, rest } = splitArticle(fold(input));
  const target = fold(item.german);

  if (matchesMeaning(item, input, ctx) === 'exact') {
    return { outcome: 'shake', message: 'That’s the English. Type it in German.' };
  }

  if (item.kind === 'noun' && item.article) {
    if (!article) {
      return { outcome: 'shake', message: 'Include the article: der, die or das.' };
    }
    if (article !== item.article && levenshtein(rest, target) <= 1) {
      return { outcome: 'wrong', message: `It’s ${item.article}, not ${article}.` };
    }
  }

  const answer = item.kind === 'noun' ? rest : fold(input);
  if (answer === target) {
    return item.kind === 'noun' && article !== item.article
      ? { outcome: 'wrong', message: `It’s ${item.article}, not ${article}.` }
      : { outcome: 'correct' };
  }

  if (levenshtein(answer, target) === 1 && !ctx.shookAlready) {
    return { outcome: 'shake', message: 'Almost. Check the spelling.' };
  }
  return { outcome: 'wrong' };
}
