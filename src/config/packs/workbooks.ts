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
  definePackTool({
    id: 'lead-tracker-excel-maker', kind: 'workbookLeads', guideKey: 'leadsExcelGuide', category: 'business', icon: 'contact', tier: 'popular',
    keywords: ['lead tracker excel', 'enquiry register excel', 'customer enquiry tracker', 'sales pipeline excel template', 'follow up tracker excel', 'crm excel sheet free', 'lead management excel', 'inquiry log excel', 'sales leads sheet', 'admission enquiry register', 'quotation follow up sheet', 'small business crm excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'expense-claim-excel-maker', kind: 'workbookExpenses', guideKey: 'expensesExcelGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['expense claim form excel', 'reimbursement sheet excel', 'travel expense report excel', 'expense report template', 'staff expense claim format', 'claim form excel with limits', 'business expense tracker', 'expense approval tracker', 'petty expense sheet excel', 'monthly expense report excel', 'employee reimbursement form', 'expense sheet with receipts'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'job-order-tracker-excel-maker', kind: 'workbookJobs', guideKey: 'jobsExcelGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['order tracker excel', 'job tracker excel', 'tailor order register', 'repair shop job card excel', 'custom order tracking sheet', 'work order tracker', 'delivery date tracker excel', 'customer order register', 'boutique order book excel', 'job status tracker', 'order book with advance and balance', 'pending orders list excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'vehicle-log-book-excel-maker', kind: 'workbookVehicle', guideKey: 'vehicleExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['vehicle log book excel', 'car log book template', 'fuel log excel', 'mileage tracker excel', 'vehicle expense tracker', 'fleet log sheet', 'trip log excel', 'fuel consumption sheet', 'bike fuel tracker', 'cab running log', 'vehicle running cost excel', 'km per litre calculator excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'marks-rank-sheet-excel-maker', kind: 'workbookGradebook', guideKey: 'gradebookExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['marks sheet excel', 'student marksheet excel', 'rank list excel', 'class result sheet', 'gradebook excel template', 'exam result calculator excel', 'total and percentage excel', 'school marks register', 'result sheet with rank', 'pass fail sheet excel', 'marks entry sheet', 'class topper list excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'leave-tracker-excel-maker', kind: 'workbookLeave', guideKey: 'leaveExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['leave tracker excel template', 'employee leave tracker excel', 'leave record sheet in excel', 'leave balance calculator excel', 'staff leave register format', 'annual leave tracker excel', 'casual leave sick leave tracker', 'teacher leave register excel', 'leave management excel sheet', 'who is on leave today excel', 'leave planner excel template', 'employee leave report excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'daily-sales-report-excel-maker', kind: 'workbookSales', guideKey: 'salesExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['daily sales report excel template', 'daily sales register excel', 'shop sales record excel', 'daily sales sheet format', 'sales tracker for small business', 'cash upi card sales report', 'monthly sales report excel', 'daily collection sheet excel', 'day wise sales report excel', 'best selling items excel', 'cafe sales sheet excel', 'retail sales log excel'],
  }, workbooks.toolCatalog),
  definePackTool({
    id: 'loan-emi-tracker-excel-maker', kind: 'workbookLoan', guideKey: 'loanExcelGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['loan emi tracker excel', 'loan repayment schedule excel', 'emi calculator excel sheet', 'loan amortization schedule excel', 'home loan tracker excel', 'multiple loans tracker excel', 'loan balance calculator excel', 'emi due date tracker', 'loan interest and principal split', 'personal loan tracker excel', 'car loan emi sheet excel', 'loan payment schedule template'],
  }, workbooks.toolCatalog),
];
