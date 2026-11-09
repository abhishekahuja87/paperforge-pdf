import { CAREERS_TOOLS } from './careers';
import { STUDENTS_TOOLS } from './students';
import { FREELANCERS_TOOLS } from './freelancers';
import { STATIONERY_TOOLS } from './stationery';
import { PLANNER_TOOLS } from './planners';
import { QR_TOOLS } from './qr';
import { VCARD_TOOLS } from './vcard';
import type { PackTool } from './types';

export type { PackTool } from './types';

/** Every pack, in the order its tools are listed. To add a pack: create its file here and add it below. */
export const PACK_TOOLS: PackTool[] = [...CAREERS_TOOLS, ...STUDENTS_TOOLS, ...FREELANCERS_TOOLS, ...STATIONERY_TOOLS, ...PLANNER_TOOLS, ...QR_TOOLS, ...VCARD_TOOLS];

export const findPackTool = (kind: string) => PACK_TOOLS.find((item) => item.kind === kind);

/** Tool id -> pageGuides key, used by the static page generator. */
export const PACK_GUIDE_KEYS: Record<string, string> = Object.fromEntries(PACK_TOOLS.map(({ tool, guideKey }) => [tool.id, guideKey]));
