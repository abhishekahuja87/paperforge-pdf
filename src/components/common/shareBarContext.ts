import { createContext } from 'react';

/** A tool page tells its layout when it already shows the "share this calculation" bar, so the layout does not add a second share row. */
export const ShareBarContext = createContext<(shown: boolean) => void>(() => undefined);
