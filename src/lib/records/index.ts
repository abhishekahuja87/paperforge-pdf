import { HOME_FAMILY } from './home';
import { PET_FAMILY } from './pet';
import { SHOP_FAMILY } from './shop';
import type { Family } from './types';

export const FAMILIES: Record<Family['key'], Family> = { home: HOME_FAMILY, shop: SHOP_FAMILY, pet: PET_FAMILY };
export type { Common, Family, Field, SheetDef, Values } from './types';
