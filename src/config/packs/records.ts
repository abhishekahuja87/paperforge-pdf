import records from '../../locales/packs/records.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable record sheets in three families, each one maker with its own page for every sheet (the buttons are links): household (milk and maid calendar, monthly budget, warranty record), shop (staff attendance, credit ledger, daily cash, stock count) and pet (health record, vaccination tracker, sitter instructions). The first sheet of each family is on the home page; the others are in VARIANT_PAGES. Text only organises records; nothing here gives legal, medical or tax advice. */
export const RECORDS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'milk-maid-attendance-calendar-printable', kind: 'recMilk', guideKey: 'milkMaidGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['milk calendar printable', 'milkman calendar', 'milk attendance calendar', 'maid attendance calendar', 'maid attendance sheet', 'servant attendance register', 'newspaper delivery calendar', 'daily milk record sheet', 'monthly milk bill calculator sheet', 'cook attendance sheet', 'domestic help attendance chart'],
  }, records.toolCatalog),
  definePackTool({
    id: 'monthly-household-budget-sheet-printable', kind: 'recBudget', guideKey: 'householdBudgetGuide', category: 'everyday', icon: 'receipt', tier: 'more',
    keywords: ['household budget printable', 'monthly budget sheet', 'family budget template', 'home budget planner printable', 'budget sheet pdf', 'monthly expense sheet', 'income and expense sheet', 'planned vs actual budget', 'household expense tracker printable'],
  }, records.toolCatalog),
  definePackTool({
    id: 'warranty-service-record-printable', kind: 'recWarranty', guideKey: 'warrantyRecordGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['warranty tracker printable', 'warranty record sheet', 'appliance warranty register', 'home appliance service record', 'bill and warranty log', 'appliance purchase record', 'service history sheet', 'warranty expiry tracker', 'gadget warranty record'],
  }, records.toolCatalog),
  definePackTool({
    id: 'staff-attendance-register-printable', kind: 'recAttendance', guideKey: 'staffAttendanceGuide', category: 'business', icon: 'briefcase', tier: 'popular',
    keywords: ['staff attendance register', 'employee attendance sheet printable', 'monthly attendance sheet', 'attendance register pdf', 'muster roll printable', 'shop staff attendance sheet', 'labour attendance sheet', 'worker attendance register', 'attendance sheet with salary', 'attendance register for small business'],
  }, records.toolCatalog),
  definePackTool({
    id: 'udhaar-credit-ledger-printable', kind: 'recLedger', guideKey: 'udhaarLedgerGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['udhaar khata printable', 'credit ledger printable', 'customer ledger sheet', 'khata book pages', 'udhaar register', 'credit book for shop', 'customer account ledger', 'running balance ledger', 'hisab kitab sheet', 'shop credit register printable'],
  }, records.toolCatalog),
  definePackTool({
    id: 'daily-cash-sales-sheet-printable', kind: 'recCash', guideKey: 'dailyCashGuide', category: 'business', icon: 'calculator', tier: 'more',
    keywords: ['daily cash book printable', 'daily sales sheet', 'cash register sheet', 'shop daily report', 'day book printable', 'daily collection sheet', 'cash closing sheet', 'shop closing register', 'daily sales and expenses sheet', 'cash denomination count sheet'],
  }, records.toolCatalog),
  definePackTool({
    id: 'stock-count-sheet-printable', kind: 'recStock', guideKey: 'stockCountGuide', category: 'business', icon: 'layers', tier: 'more',
    keywords: ['stock count sheet', 'inventory count sheet printable', 'stock register printable', 'inventory checklist', 'physical stock verification sheet', 'stock taking sheet', 'godown stock sheet', 'shop inventory sheet pdf', 'stock audit sheet', 'stock difference sheet'],
  }, records.toolCatalog),
  definePackTool({
    id: 'pet-health-record-card-printable', kind: 'recPetRecord', guideKey: 'petHealthRecordGuide', category: 'everyday', icon: 'shield-check', tier: 'popular',
    keywords: ['pet health record printable', 'dog vaccination card printable', 'cat vaccination record', 'pet vaccination record template', 'pet medical record', 'pet vet record sheet', 'dog health record', 'pet passport sheet', 'pet details card', 'puppy vaccination chart printable', 'deworming record sheet'],
  }, records.toolCatalog),
  definePackTool({
    id: 'pet-vaccination-tracker-printable', kind: 'recPetTracker', guideKey: 'petVaccineTrackerGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['pet vaccination tracker', 'dog vaccination chart printable', 'puppy vaccination schedule sheet', 'cat vaccination tracker', 'pet vaccine log', 'deworming tracker', 'vaccination log for pets', 'pet treatment record', 'pet vaccine record pdf', 'tick and flea treatment log'],
  }, records.toolCatalog),
  definePackTool({
    id: 'pet-sitter-instructions-printable', kind: 'recPetSitter', guideKey: 'petSitterGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['pet sitter instructions printable', 'pet sitter checklist', 'dog sitter instructions sheet', 'pet care instructions template', 'pet sitting notes', 'instructions for pet sitter', 'pet boarding instruction sheet', 'pet care sheet for sitter', 'leaving pet with family instructions', 'cat sitter instructions'],
  }, records.toolCatalog),
];
