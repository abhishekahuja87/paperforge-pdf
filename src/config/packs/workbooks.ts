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
];
