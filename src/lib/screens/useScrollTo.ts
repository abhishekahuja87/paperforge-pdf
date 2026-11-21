import { useCallback, useRef } from 'react';

/** Returns a ref for the element to show and a function that scrolls to it. On a phone the result of a quick start is below the buttons, so the page brings it into view. */
export function useScrollTo<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const scroll = useCallback(() => { window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); }, []);
  return { ref, scroll };
}
