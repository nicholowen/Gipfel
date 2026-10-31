import { describe, expect, it } from 'vitest';
import { answer, current, isFinished, settledItems, startSession, undo, wrapUp, type Question } from './review-session';

/** Deterministic "random": always picks the lowest option. */
const first = () => 0;

const ids = (q: Question[]) => q.map((x) => `${x.itemId}:${x.type}`);

describe('startSession', () => {
  it('asks both questions for every item', () => {
    const s = startSession(['a', 'b'], Math.random);
    expect(ids(s.queue).sort()).toEqual(['a:german', 'a:meaning', 'b:german', 'b:meaning']);
  });

  it('avoids putting an item’s two questions next to each other when it can', () => {
    for (let n = 0; n < 50; n++) {
      const s = startSession(['a', 'b', 'c'], Math.random);
      const adjacent = s.queue.some((q, i) => i > 0 && s.queue[i - 1].itemId === q.itemId);
      expect(adjacent).toBe(false);
    }
  });
});

describe('answer', () => {
  it('completes an item once both questions are right', () => {
    let s = startSession(['a'], first);
    s = answer(s, 'correct', first);
    expect(s.completed).toEqual([]);
    s = answer(s, 'correct', first);
    expect(s.completed).toEqual([{ itemId: 'a', wasWrong: false, meaningWrong: 0, germanWrong: 0 }]);
    expect(isFinished(s)).toBe(true);
  });

  it('counts close answers as right', () => {
    let s = startSession(['a'], first);
    s = answer(s, 'close', first);
    s = answer(s, 'close', first);
    expect(s.completed[0].wasWrong).toBe(false);
  });

  it('brings a missed question back later and marks the item wrong', () => {
    let s = startSession(['a', 'b'], first);
    const missed = current(s)!;
    s = answer(s, 'wrong', first);
    expect(s.queue).toContainEqual(missed);
    expect(current(s)).not.toEqual(missed);
    while (!isFinished(s)) s = answer(s, 'correct', first);
    const result = s.completed.find((c) => c.itemId === missed.itemId)!;
    expect(result.wasWrong).toBe(true);
    expect(result[`${missed.type}Wrong`]).toBe(1);
  });

  it('keeps the question in place on a shake and remembers the shake', () => {
    let s = startSession(['a'], first);
    const q = current(s)!;
    s = answer(s, 'shake', first);
    expect(current(s)).toEqual(q);
    expect(s.shaken).toContain(`${q.itemId}:${q.type}`);
  });
});

describe('undo', () => {
  it('restores the state before the last answer', () => {
    const start = startSession(['a', 'b'], first);
    const after = answer(start, 'wrong', first);
    expect(undo(after).queue).toEqual(start.queue);
    expect(undo(after).tallies).toEqual(start.tallies);
  });

  it('only undoes one step', () => {
    let s = startSession(['a'], first);
    s = answer(s, 'correct', first);
    s = undo(s);
    expect(undo(s)).toBe(s);
  });
});

describe('settledItems', () => {
  it('holds back the item completed by the last answer, which can still be undone', () => {
    let s = startSession(['a', 'b'], first);
    while (s.completed.length < 1) s = answer(s, 'correct', first);
    expect(settledItems(s)).toEqual([]);
    s = answer(s, 'correct', first);
    expect(settledItems(s).map((c) => c.itemId)).toEqual([s.completed[0].itemId]);
  });

  it('releases everything once the session is finished and final', () => {
    let s = startSession(['a'], first);
    s = answer(s, 'correct', first);
    s = answer(s, 'correct', first);
    expect(settledItems(s, { final: true })).toHaveLength(1);
  });
});

describe('wrapUp', () => {
  it('drops items that have not been started', () => {
    let s = startSession(['a', 'b', 'c'], first);
    const started = current(s)!.itemId;
    s = answer(s, 'correct', first);
    s = wrapUp(s);
    expect(new Set(s.queue.map((q) => q.itemId))).toEqual(new Set([started]));
  });
});
