import React from 'react';
import { FAMILIES } from '../../../lib/records';
import { RecordSheets } from './RecordSheets';

/** One screen for each sheet. Every page of a family shows all its sheets; picking one goes to that sheet's address. */
const page = (family: keyof typeof FAMILIES, id: string): React.FC => () => <RecordSheets family={FAMILIES[family]} initialId={id} />;

export const MilkPage = page('home', 'milk-maid-attendance-calendar-printable');
export const BudgetPage = page('home', 'monthly-household-budget-sheet-printable');
export const WarrantyPage = page('home', 'warranty-service-record-printable');
export const AttendancePage = page('shop', 'staff-attendance-register-printable');
export const LedgerPage = page('shop', 'udhaar-credit-ledger-printable');
export const CashPage = page('shop', 'daily-cash-sales-sheet-printable');
export const StockPage = page('shop', 'stock-count-sheet-printable');
export const PetRecordPage = page('pet', 'pet-health-record-card-printable');
export const PetTrackerPage = page('pet', 'pet-vaccination-tracker-printable');
export const PetSitterPage = page('pet', 'pet-sitter-instructions-printable');
