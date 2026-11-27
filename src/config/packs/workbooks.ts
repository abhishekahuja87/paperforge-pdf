import workbooks from '../../locales/packs/workbooks.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Excel workbook makers (components/tools/workbooks, generators in src/lib/workbooks, file writer in src/lib/xlsx). Each builds an .xlsx in the browser with formulas, drop-downs and colour rules. */
export const WORKBOOKS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'gantt-chart-excel-maker', kind: 'workbookGantt', guideKey: 'ganttExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['gantt chart excel', 'gantt chart excel template', 'project timeline excel', 'free gantt chart maker', 'gantt chart from task list', 'excel project plan template', 'gantt chart without macros', 'project schedule excel download', 'gantt chart for google sheets', 'task tracker with timeline', 'excel timeline maker', 'weekly gantt chart template'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'attendance-register-excel-maker', kind: 'workbookAttendance', guideKey: 'attendanceExcelGuide', category: 'business', icon: 'contact', tier: 'popular',
    keywords: ['attendance register excel', 'employee attendance sheet excel', 'monthly attendance sheet in excel', 'attendance tracker excel template', 'staff attendance excel with formulas', 'attendance sheet with holidays', 'excel attendance register download', 'attendance and leave tracker excel', 'attendance sheet for 12 months', 'free attendance sheet maker', 'daily attendance sheet excel', 'excel attendance with weekends greyed'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'invoice-excel-template-maker', kind: 'workbookInvoice', guideKey: 'invoiceExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['invoice excel template', 'invoice template excel with formulas', 'excel invoice with item list', 'free invoice maker excel', 'invoice template with vat', 'invoice template with gst', 'excel invoice with tax columns', 'billing sheet excel download', 'printable invoice excel', 'invoice tracker excel', 'invoice template with customer list', 'quotation excel template'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'delivery-bill-excel-maker', kind: 'workbookBilling', guideKey: 'deliveryBillExcelGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['milk delivery bill excel', 'daily milk calculator excel', 'monthly milk bill sheet', 'tiffin service billing excel', 'newspaper bill sheet excel', 'water can delivery register', 'monthly delivery register excel', 'milkman hisab excel', 'customer wise monthly bill excel', 'recurring delivery bill template', 'whatsapp payment reminder excel', 'delivery customer balance sheet'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'stock-register-excel-maker', kind: 'workbookStock', guideKey: 'stockExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['stock register excel', 'inventory register excel template', 'stock management excel sheet', 'stock ledger excel format', 'reorder level excel', 'low stock alert excel', 'shop inventory excel sheet', 'stock in stock out excel', 'inventory tracker with reorder', 'excel inventory template free', 'kirana stock register', 'stock register with formulas'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'credit-ledger-excel-maker', kind: 'workbookLedger', guideKey: 'ledgerExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['udhaar khata excel', 'credit ledger excel template', 'customer ledger excel format', 'udhar register excel', 'party ledger excel sheet', 'customer due list excel', 'khata book excel free', 'receivables tracker excel', 'debtors ageing excel', 'credit customer register', 'pending payment tracker excel', 'udhaar hisab excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'timesheet-excel-maker', kind: 'workbookTimesheet', guideKey: 'timesheetExcelGuide', category: 'business', icon: 'clock', tier: 'popular',
    keywords: ['timesheet excel template', 'employee timesheet excel', 'overtime calculator excel', 'weekly timesheet excel', 'hours worked calculator excel', 'timesheet with overtime', 'work hours tracker excel', 'staff hours sheet excel', 'timesheet with hourly rate', 'shift hours excel sheet', 'overtime hours excel formula', 'free timesheet maker'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'fees-rent-tracker-excel-maker', kind: 'workbookFees', guideKey: 'feesExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['fee tracker excel', 'rent tracker excel', 'monthly rent collection sheet', 'school fee register excel', 'tuition fee tracker excel', 'maintenance collection excel', 'society maintenance tracker', 'tenant rent register excel', 'fee collection sheet excel', 'pending fees list excel', 'rent receipt tracker excel', 'monthly dues tracker excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'daily-cash-book-excel-maker', kind: 'workbookCashbook', guideKey: 'cashbookExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['cash book excel format', 'daily cash book excel', 'income and expense tracker excel', 'cash flow sheet excel', 'small business accounts excel', 'daily sales and expense sheet', 'bank and cash balance excel', 'expense tracker for shop', 'day book excel', 'monthly profit and loss excel', 'cash register excel sheet', 'simple accounts excel for business'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'budget-planner-excel-maker', kind: 'workbookBudget', guideKey: 'budgetExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['budget planner excel', 'monthly budget excel template', 'household budget excel', 'personal budget spreadsheet', 'budget vs actual excel', 'family budget sheet excel', 'student budget excel', 'expense planner excel', 'yearly budget template', 'income and expense budget sheet', 'savings tracker excel', 'small business budget excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'supplier-payment-tracker-excel-maker', kind: 'workbookPayables', guideKey: 'payablesExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['supplier payment tracker excel', 'accounts payable excel template', 'vendor payment tracker', 'bill due date tracker excel', 'creditors list excel', 'purchase bill tracker excel', 'payment due reminder excel', 'supplier ledger excel', 'payables ageing excel', 'vendor bills tracker', 'supplier credit days excel', 'pending supplier payments sheet'],
  }, workbooks.toolCatalog),
];
