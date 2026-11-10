import { createContext } from 'react';

/**
 * The tool layout shows the written article itself, unless a guide on the page takes it over and lists it
 * in the same accordion as the questions. A guide calls `setGuideShowsArticle(true)` while it is mounted.
 */
export const GuideRegistryContext = createContext<{ guideShowsArticle: boolean; setGuideShowsArticle: (on: boolean) => void }>({
  guideShowsArticle: false,
  setGuideShowsArticle: () => undefined,
});
