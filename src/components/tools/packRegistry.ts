import type { ComponentType } from 'react';
import { CAREERS_COMPONENTS } from './careers/registry';
import { STUDENTS_COMPONENTS } from './students/registry';
import { FREELANCERS_COMPONENTS } from './freelancers/registry';
import { PAPER_COMPONENTS } from './paper/registry';
import { PLANNER_COMPONENTS } from './planner/registry';

/**
 * Screen for each pack tool, by the `kind` set in its src/config/packs file. Each pack keeps its own registry
 * next to its components, with one lazy() per screen so a visitor only downloads the tool they open.
 */
export const PACK_COMPONENTS: Record<string, ComponentType> = {
  ...CAREERS_COMPONENTS,
  ...STUDENTS_COMPONENTS,
  ...FREELANCERS_COMPONENTS,
  ...PAPER_COMPONENTS,
  ...PLANNER_COMPONENTS,
};
