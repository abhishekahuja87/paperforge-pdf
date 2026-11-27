/**
 * Smoke test: every route that the build prerenders (src/prerender/shellData.ts) must open
 * in the real app without hitting the error screen or the "Page not found" page, and must
 * show a top-level heading. It does not use any tool; see TESTING.md for that.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '../i18n';
import { App } from '../App';
import { getShellPages } from '../prerender/shellData';

const paths = getShellPages().map((page) => page.path);

describe('prerendered routes', () => {
  beforeAll(() => {
    expect(paths.length).toBeGreaterThan(100);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each(paths)('%s renders', async (path) => {
    const pageErrors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => { pageErrors.push(args); });
    window.history.pushState({}, '', path);

    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading Tool...')).toBeNull(), { timeout: 20_000 });
    expect(screen.queryByText('This page could not be loaded'), JSON.stringify(pageErrors).slice(0, 2000)).toBeNull();
    expect(screen.queryByRole('heading', { level: 1, name: 'Page not found' })).toBeNull();
    expect(document.querySelector('main h1')).not.toBeNull();
  });
});
