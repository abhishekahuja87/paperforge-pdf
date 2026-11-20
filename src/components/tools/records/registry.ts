import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const screen = (name: string) => lazy(() => import('./variants').then((m) => ({ default: (m as unknown as Record<string, ComponentType>)[name]! })));

export const RECORDS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  recMilk: screen('MilkPage'),
  recBudget: screen('BudgetPage'),
  recWarranty: screen('WarrantyPage'),
  recAttendance: screen('AttendancePage'),
  recLedger: screen('LedgerPage'),
  recCash: screen('CashPage'),
  recStock: screen('StockPage'),
  recPetRecord: screen('PetRecordPage'),
  recPetTracker: screen('PetTrackerPage'),
  recPetSitter: screen('PetSitterPage'),
};
