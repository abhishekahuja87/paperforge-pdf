import { createContext } from 'react';

/**
 * The tool layout shows the written article itself, unless a guide on the page takes it over and lists it
 * in the same accordion as the questions. A guide calls `setGuideShowsArticle(true)` while it is mounted.
 */
export const GuideRegistryContext = createContext<{
  guideShowsArticle: boolean;
  setGuideShowsArticle: (on: boolean) => void;
  /** Fold state of every row below the tool, so the toggle can sit right above the list. */
  folds: { total: number; allOpen: boolean; toggleAll: () => void };
}>({
  guideShowsArticle: false,
  setGuideShowsArticle: () => undefined,
  folds: { total: 0, allOpen: false, toggleAll: () => undefined },
});
