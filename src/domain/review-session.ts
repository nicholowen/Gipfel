import type { Outcome } from './answer-checker';
import type { QuestionType } from './types';

export interface Question {
  itemId: string;
  type: QuestionType;
}

interface Tally {
  meaningDone: boolean;
  germanDone: boolean;
  meaningWrong: number;
  germanWrong: number;
}

export interface CompletedItem {
  itemId: string;
  wasWrong: boolean;
  meaningWrong: number;
  germanWrong: number;
}

export interface SessionState {
  queue: Question[];
  tallies: Record<string, Tally>;
  /** Keys `${itemId}:${type}` of questions that already used their spelling shake. */
  shaken: string[];
  completed: CompletedItem[];
  /** The state before the last answer, for one-step undo. */
  previous: SessionState | null;
}

/** Returns a number in [0, 1). Injected so tests are deterministic. */
export type Random = () => number;

const key = (q: Question) => `${q.itemId}:${q.type}`;

export function startSession(itemIds: string[], random: Random): SessionState {
  const questions = itemIds.flatMap((itemId): Question[] => [
    { itemId, type: 'meaning' },
    { itemId, type: 'german' },
  ]);
  const tallies = Object.fromEntries(
    itemIds.map((id) => [id, { meaningDone: false, germanDone: false, meaningWrong: 0, germanWrong: 0 }]),
  );
  return { queue: spreadShuffle(questions, random), tallies, shaken: [], completed: [], previous: null };
}

export const current = (s: SessionState): Question | undefined => s.queue[0];
export const isFinished = (s: SessionState): boolean => s.queue.length === 0;
export const hasShaken = (s: SessionState, q: Question): boolean => s.shaken.includes(key(q));

export function answer(state: SessionState, outcome: Outcome, random: Random): SessionState {
  const q = current(state);
  if (!q) return state;
  const snapshot = { ...state, previous: null };

  if (outcome === 'shake') {
    return { ...state, shaken: [...state.shaken, key(q)], previous: snapshot };
  }

  const tally = { ...state.tallies[q.itemId] };
  const rest = state.queue.slice(1);

  if (outcome === 'wrong') {
    tally[`${q.type}Wrong`] += 1;
    // Bring the question back a few cards later (or at the end of a short queue).
    const earliest = Math.min(3, rest.length);
    const at = earliest + Math.floor(random() * (rest.length - earliest + 1));
    const queue = [...rest.slice(0, at), q, ...rest.slice(at)];
    return { ...state, queue, tallies: { ...state.tallies, [q.itemId]: tally }, previous: snapshot };
  }

  tally[`${q.type}Done`] = true;
  const completed =
    tally.meaningDone && tally.germanDone
      ? [
          ...state.completed,
          {
            itemId: q.itemId,
            wasWrong: tally.meaningWrong + tally.germanWrong > 0,
            meaningWrong: tally.meaningWrong,
            germanWrong: tally.germanWrong,
          },
        ]
      : state.completed;
  return { ...state, queue: rest, tallies: { ...state.tallies, [q.itemId]: tally }, completed, previous: snapshot };
}

export function undo(state: SessionState): SessionState {
  return state.previous ?? state;
}

/**
 * Completed items that are safe to save. The item completed by the most recent
 * answer is held back while that answer can still be undone.
 */
export function settledItems(state: SessionState, opts: { final?: boolean } = {}): CompletedItem[] {
  const undoable = state.previous !== null && state.previous.completed.length < state.completed.length;
  return undoable && !opts.final ? state.completed.slice(0, -1) : state.completed;
}

/** Finish only the items already started; drop the rest from the queue. */
export function wrapUp(state: SessionState): SessionState {
  const started = (id: string) => {
    const t = state.tallies[id];
    return t.meaningDone || t.germanDone || t.meaningWrong > 0 || t.germanWrong > 0;
  };
  return { ...state, queue: state.queue.filter((q) => started(q.itemId)), previous: null };
}

function shuffle<T>(items: T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const adjacentPairs = (queue: Question[]) =>
  queue.filter((q, i) => i > 0 && queue[i - 1].itemId === q.itemId).length;

/** Shuffle so an item's two questions don't sit side by side, where possible. */
function spreadShuffle(questions: Question[], random: Random): Question[] {
  let best = shuffle(questions, random);
  for (let attempt = 0; attempt < 200 && adjacentPairs(best) > 0; attempt++) {
    const next = shuffle(questions, random);
    if (adjacentPairs(next) < adjacentPairs(best)) best = next;
  }
  return best;
}
