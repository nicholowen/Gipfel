import { Component, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Last-resort error handling, so a failure never leaves a blank screen.
 * Render errors are caught by ErrorBoundary; async failures (rejected promises)
 * are reported to a tiny store that the same screen subscribes to.
 */

let current: unknown = null;
const listeners = new Set<() => void>();

export function reportError(error: unknown): void {
  console.error(error);
  current = error;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
  window.addEventListener('error', (e) => reportError(e.error ?? e.message));
}

function describe(error: unknown): string {
  if (error instanceof Error || error instanceof DOMException) return `${error.name}: ${error.message}`;
  return String(error);
}

export function ErrorScreen({ error }: { error: unknown }) {
  return (
    <main className="page centred">
      <h1>Something went wrong</h1>
      <p className="muted">
        Everything saved before this is safe, though you may need to redo the last few words. Reloading usually fixes it.
      </p>
      <button type="button" className="button" onClick={() => window.location.assign('/')}>
        Reload Gipfel
      </button>
      <details className="error-details">
        <summary>Details for a bug report</summary>
        <code>{describe(error)}</code>
      </details>
    </main>
  );
}

class Boundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.error ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}

function AsyncErrorGate({ children }: { children: ReactNode }) {
  const error = useSyncExternalStore(subscribe, () => current);
  return error ? <ErrorScreen error={error} /> : <>{children}</>;
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Boundary>
      <AsyncErrorGate>{children}</AsyncErrorGate>
    </Boundary>
  );
}
