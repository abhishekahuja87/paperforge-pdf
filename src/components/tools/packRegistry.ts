import type { ComponentType } from 'react';
import { CAREERS_COMPONENTS } from './careers/registry';

/**
 * Screen for each pack tool, by the `kind` set in its src/config/packs file. Each pack keeps its own registry
 * next to its components, with one lazy() per screen so a visitor only downloads the tool they open.
 */
export const PACK_COMPONENTS: Record<string, ComponentType> = {
  ...CAREERS_COMPONENTS,
};
