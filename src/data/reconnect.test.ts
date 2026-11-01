import { describe, expect, it, vi } from 'vitest';
import { isConnectionLost, withReconnect } from './reconnect';

const lost = () => new DOMException('Connection to Indexed Database server lost. Refresh the page to try again', 'UnknownError');

function fakeDb() {
  return { close: vi.fn(), open: vi.fn(async () => undefined) };
}

describe('isConnectionLost', () => {
  it('recognises the WebKit lost-connection error', () => {
    expect(isConnectionLost(lost())).toBe(true);
  });

  it('recognises a closed Dexie database', () => {
    expect(isConnectionLost(Object.assign(new Error('Database has been closed'), { name: 'DatabaseClosedError' }))).toBe(true);
  });

  it('recognises an error wrapped by Dexie', () => {
    expect(isConnectionLost(Object.assign(new Error('wrapped'), { name: 'AbortError', inner: lost() }))).toBe(true);
  });

  it('ignores ordinary errors', () => {
    expect(isConnectionLost(new Error('Unknown item n-zz'))).toBe(false);
  });
});

describe('withReconnect', () => {
  it('reopens the database and retries once when the connection is lost', async () => {
    const db = fakeDb();
    const work = vi.fn().mockRejectedValueOnce(lost()).mockResolvedValueOnce('saved');
    await expect(withReconnect(db, work)).resolves.toBe('saved');
    expect(db.close).toHaveBeenCalledOnce();
    expect(db.open).toHaveBeenCalledOnce();
    expect(work).toHaveBeenCalledTimes(2);
  });

  it('gives up after one retry', async () => {
    const db = fakeDb();
    const work = vi.fn().mockRejectedValue(lost());
    await expect(withReconnect(db, work)).rejects.toThrow(/lost/);
    expect(work).toHaveBeenCalledTimes(2);
  });

  it('does not retry ordinary errors', async () => {
    const db = fakeDb();
    const work = vi.fn().mockRejectedValue(new Error('bug'));
    await expect(withReconnect(db, work)).rejects.toThrow('bug');
    expect(work).toHaveBeenCalledOnce();
    expect(db.open).not.toHaveBeenCalled();
  });
});
