import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WORKBOOKS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  workbookGantt: lazy(() => import('./GanttWorkbook')),
  workbookAttendance: lazy(() => import('./AttendanceWorkbook')),
  workbookInvoice: lazy(() => import('./InvoiceWorkbook')),
  workbookBilling: lazy(() => import('./BillingWorkbook')),
};
