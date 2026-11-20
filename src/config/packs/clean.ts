import clean from '../../locales/packs/clean.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable cleaning schedules and logs for offices, societies and other sites: daily checklists (office and ODC, washroom, lift, room, pantry, society common areas), a weekly roster, an hourly round sheet, a tank and pest control record and a deep cleaning planner. Uses the shared records maker (components/tools/records). Records only: no safety, hygiene or legal rules. */
export const CLEAN_TOOLS: PackTool[] = [
  definePackTool({
    id: 'office-cleaning-checklist-printable', kind: 'recCleanOffice', guideKey: 'officeCleaningGuide', category: 'business', icon: 'briefcase', tier: 'popular',
    keywords: ['office cleaning checklist', 'office cleaning schedule template', 'ODC cleaning checklist', 'daily housekeeping checklist office', 'housekeeping checklist printable', 'office cleaning log sheet', 'cleaning checklist for office staff', 'commercial cleaning checklist', 'daily cleaning log', 'office housekeeping schedule'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'washroom-cleaning-checklist-printable', kind: 'recCleanWashroom', guideKey: 'washroomCleaningGuide', category: 'business', icon: 'shield-check', tier: 'more',
    keywords: ['washroom cleaning checklist', 'toilet cleaning chart', 'toilet cleaning checklist printable', 'restroom cleaning log', 'bathroom cleaning checklist for office', 'washroom housekeeping checklist', 'toilet cleaning schedule', 'washroom cleaning sheet', 'public toilet cleaning log', 'washroom cleaning record'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'lift-cleaning-checklist-printable', kind: 'recCleanLift', guideKey: 'liftCleaningGuide', category: 'business', icon: 'layers', tier: 'more',
    keywords: ['lift cleaning checklist', 'elevator cleaning checklist', 'lift cleaning log', 'lift housekeeping checklist', 'elevator cleaning schedule', 'lift cleaning record society', 'daily lift cleaning sheet', 'lift cabin cleaning checklist', 'lift cleaning chart', 'elevator cleaning log sheet'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'room-cleaning-checklist-printable', kind: 'recCleanRoom', guideKey: 'roomCleaningGuide', category: 'business', icon: 'grid', tier: 'more',
    keywords: ['room cleaning checklist', 'hotel room cleaning checklist', 'housekeeping checklist hotel room', 'hostel room cleaning schedule', 'PG room cleaning checklist', 'guest room cleaning log', 'room cleaning schedule template', 'room housekeeping checklist', 'guest house cleaning checklist', 'room cleaning sheet'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'pantry-kitchen-cleaning-checklist-printable', kind: 'recCleanPantry', guideKey: 'pantryCleaningGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['pantry cleaning checklist', 'kitchen cleaning checklist printable', 'office pantry cleaning schedule', 'canteen cleaning checklist', 'daily kitchen cleaning log', 'kitchen cleaning schedule template', 'cafeteria cleaning checklist', 'tea station cleaning checklist', 'kitchen housekeeping checklist', 'pantry cleaning log'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'society-common-area-cleaning-checklist-printable', kind: 'recCleanSociety', guideKey: 'societyCleaningGuide', category: 'business', icon: 'grid', tier: 'more',
    keywords: ['society cleaning checklist', 'apartment common area cleaning checklist', 'housing society housekeeping checklist', 'society cleaning schedule', 'residential society cleaning log', 'common area cleaning schedule', 'staircase cleaning checklist', 'society housekeeping register', 'RWA cleaning checklist', 'apartment cleaning checklist template'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'weekly-cleaning-schedule-printable', kind: 'recCleanWeekly', guideKey: 'weeklyCleaningGuide', category: 'business', icon: 'clock', tier: 'popular',
    keywords: ['weekly cleaning schedule template', 'housekeeping schedule printable', 'cleaning roster template', 'weekly housekeeping schedule', 'cleaning schedule for office', 'society cleaning schedule weekly', 'cleaning duty roster', 'janitorial schedule template', 'commercial cleaning schedule', 'facility cleaning schedule'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'washroom-hourly-cleaning-log-printable', kind: 'recCleanRound', guideKey: 'cleaningRoundGuide', category: 'business', icon: 'clock', tier: 'more',
    keywords: ['washroom hourly cleaning log', 'toilet cleaning round sheet', 'washroom cleaning checklist with time', 'hourly cleaning log', 'cleaning round sheet printable', 'washroom inspection sheet', 'restroom cleaning log with timings', 'housekeeping round sheet', 'toilet cleaning time chart', 'washroom cleaning time sheet'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'water-tank-cleaning-record-printable', kind: 'recCleanService', guideKey: 'serviceRecordGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['water tank cleaning record', 'water tank cleaning log sheet', 'overhead tank cleaning register', 'pest control record sheet', 'pest control register printable', 'society water tank cleaning register', 'service record sheet template', 'periodic cleaning record', 'sump cleaning record', 'cleaning and service log'],
  }, clean.toolCatalog),
  definePackTool({
    id: 'deep-cleaning-planner-printable', kind: 'recCleanDeep', guideKey: 'deepCleaningGuide', category: 'business', icon: 'calculator', tier: 'more',
    keywords: ['deep cleaning schedule template', 'deep cleaning planner printable', 'annual cleaning schedule', 'yearly deep cleaning checklist', 'office deep cleaning schedule', 'society deep cleaning planner', 'periodic cleaning schedule', 'facility cleaning calendar', 'deep clean calendar printable', 'annual housekeeping plan'],
  }, clean.toolCatalog),
];
