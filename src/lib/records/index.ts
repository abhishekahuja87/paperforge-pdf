import { LIFE_FAMILY } from './life';
import { AUTO_FAMILY } from './auto';
import { KIN_FAMILY } from './kin';
import { EVENT_FAMILY } from './event';
import { STUDY_FAMILY } from './study';
import { CLEAN_FAMILY } from './clean';
import { HOME_FAMILY } from './home';
import { PET_FAMILY } from './pet';
import { SHOP_FAMILY } from './shop';
import { TEACH_FAMILY } from './teach';
import type { Family } from './types';

export const FAMILIES: Record<Family['key'], Family> = { home: HOME_FAMILY, shop: SHOP_FAMILY, pet: PET_FAMILY, teach: TEACH_FAMILY, clean: CLEAN_FAMILY, study: STUDY_FAMILY, event: EVENT_FAMILY, kin: KIN_FAMILY, auto: AUTO_FAMILY, life: LIFE_FAMILY };
export type { Common, Family, Field, SheetDef, Values } from './types';
