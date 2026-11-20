import { CLEAN_FAMILY } from './clean';
import { HOME_FAMILY } from './home';
import { PET_FAMILY } from './pet';
import { SHOP_FAMILY } from './shop';
import { TEACH_FAMILY } from './teach';
import type { Family } from './types';

export const FAMILIES: Record<Family['key'], Family> = { home: HOME_FAMILY, shop: SHOP_FAMILY, pet: PET_FAMILY, teach: TEACH_FAMILY, clean: CLEAN_FAMILY };
export type { Common, Family, Field, SheetDef, Values } from './types';
