/**
 * iOS home-screen apps (WebKit) can lose their IndexedDB connection after being in the
 * background: the next transaction fails with "Connection to Indexed Database server lost".
 * Reopening the database fixes it, so storage calls get one reconnect-and-retry.
 */

interface Reopenable {
  close: () => void;
  open: () => Promise<unknown>;
}

const LOST_NAMES = new Set(['DatabaseClosedError', 'InvalidStateError']);

export function isConnectionLost(error: unknown): boolean {
  if (!(error instanceof Error) && !(error instanceof DOMException)) return false;
  const e = error as Error & { inner?: unknown };
  if (LOST_NAMES.has(e.name)) return true;
  if (/connection to indexed database server lost|database has been closed|connection is closing/i.test(e.message)) return true;
  return e.inner !== undefined && isConnectionLost(e.inner);
}

export async function withReconnect<T>(db: Reopenable, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!isConnectionLost(error)) throw error;
    db.close();
    await db.open();
    return work();
  }
}
