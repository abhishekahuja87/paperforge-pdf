import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WORKBOOKS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  workbookGantt: lazy(() => import('./GanttWorkbook')),
  workbookAttendance: lazy(() => import('./AttendanceWorkbook')),
  workbookInvoice: lazy(() => import('./InvoiceWorkbook')),
  workbookBilling: lazy(() => import('./BillingWorkbook')),
  workbookStock: lazy(() => import('./StockWorkbook')),
  workbookLedger: lazy(() => import('./LedgerWorkbook')),
  workbookTimesheet: lazy(() => import('./TimesheetWorkbook')),
  workbookFees: lazy(() => import('./FeesWorkbook')),
  workbookCashbook: lazy(() => import('./CashbookWorkbook')),
  workbookBudget: lazy(() => import('./BudgetWorkbook')),
  workbookPayables: lazy(() => import('./PayablesWorkbook')),
  workbookLeads: lazy(() => import('./LeadsWorkbook')),
  workbookExpenses: lazy(() => import('./ExpensesWorkbook')),
  workbookJobs: lazy(() => import('./JobsWorkbook')),
  workbookVehicle: lazy(() => import('./VehicleWorkbook')),
  workbookGradebook: lazy(() => import('./GradebookWorkbook')),
  workbookLeave: lazy(() => import('./LeaveWorkbook')),
  workbookSales: lazy(() => import('./SalesWorkbook')),
  workbookLoan: lazy(() => import('./LoanWorkbook')),
};
