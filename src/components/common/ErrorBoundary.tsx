import React from 'react';

interface ErrorBoundaryState {
  failed: boolean;
}

const RELOAD_FLAG = 'mdu_chunk_reload';

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(message);
}

/**
 * Catches errors while a page renders or loads. After a new deploy, an open tab can ask for a
 * script file that no longer exists; in that case the page is reloaded once to pick up the new files.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('Page failed to load:', error);
    if (!isChunkLoadError(error)) return;
    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    } catch {
      // Storage can be blocked; the visitor can still use the buttons below.
    }
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-stone-900">This page could not be loaded</h1>
        <p className="mt-2 text-sm text-stone-600">Check your connection and try again. If the site was just updated, reloading usually fixes it.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800">Reload</button>
          <a href="/" className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-orange-300">Go to home page</a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
