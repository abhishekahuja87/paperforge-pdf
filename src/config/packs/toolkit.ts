import toolkit from '../../locales/packs/toolkit.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Photo name strip, Fill PDF, WhatsApp link, barcodes, random picker and team maker (components/tools/toolkit). All run in the browser. */
export const TOOLKIT_TOOLS: PackTool[] = [
  definePackTool({
    id: 'photo-name-date-strip', kind: 'nameStrip', guideKey: 'photoNameDateStripGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['photo with name and date', 'add name and date to photo', 'name and date strip on photo', 'photo with name below for exam form', 'exam photo with name and date', 'photo name strip online', 'add name below photo', 'photo with date for application', 'write name on passport photo', 'photo with name plate for form', 'add text strip to photo', 'photo with date and name jpg under 50kb'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'fill-pdf', kind: 'fillPdf', guideKey: 'fillPdfGuide', category: 'pdf', icon: 'file-text', tier: 'popular',
    keywords: ['fill pdf online', 'type on pdf', 'write on pdf', 'add text to pdf online', 'fill pdf form without printing', 'edit pdf add text free', 'pdf form filler', 'add tick mark to pdf', 'put text on scanned pdf', 'fill application form pdf', 'type on pdf on phone', 'add date to pdf'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'whatsapp-link-generator', kind: 'waLink', guideKey: 'whatsappLinkGeneratorGuide', category: 'everyday', icon: 'globe', tier: 'popular',
    keywords: ['whatsapp link generator', 'wa.me link maker', 'whatsapp chat link with message', 'click to chat whatsapp link', 'whatsapp qr code generator', 'create whatsapp link', 'whatsapp business link generator', 'whatsapp link with prefilled message', 'whatsapp number to link', 'whatsapp qr for shop', 'direct whatsapp link', 'whatsapp link for instagram bio'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'barcode-generator', kind: 'barcodeMaker', guideKey: 'barcodeGeneratorGuide', category: 'business', icon: 'binary', tier: 'popular',
    keywords: ['barcode generator', 'code 128 barcode generator', 'ean 13 barcode generator', 'barcode label printable', 'barcode maker for shop', 'make barcode online free', 'barcode sheet a4 print', 'product barcode generator', 'inventory barcode labels', 'sku barcode generator', 'barcode png download', 'shelf label barcode'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'random-name-picker', kind: 'randomPicker', guideKey: 'randomNamePickerGuide', category: 'everyday', icon: 'hash', tier: 'popular',
    keywords: ['random name picker', 'pick a random name from a list', 'raffle name picker', 'lucky draw name picker', 'random student picker', 'choose a winner at random', 'name randomizer', 'giveaway winner picker', 'pick names from a hat online', 'random picker for class', 'draw a name online', 'random person selector'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'random-team-generator', kind: 'teamMaker', guideKey: 'randomTeamGeneratorGuide', category: 'everyday', icon: 'layers', tier: 'popular',
    keywords: ['random team generator', 'team splitter', 'split into random teams', 'group maker for class', 'random group generator', 'make teams from a list', 'team picker', 'shuffle names order', 'random seating order', 'random order generator', 'divide students into groups', 'team maker online'],
  }, toolkit.toolCatalog),
  definePackTool({
    id: 'qr-code-scanner', kind: 'qrScanner', guideKey: 'qrCodeScannerGuide', category: 'everyday', icon: 'binary', tier: 'popular',
    keywords: ['qr code scanner online', 'scan qr code from image', 'read qr code from screenshot', 'qr code reader online', 'scan qr code without app', 'upi qr scanner', 'check qr code before scanning', 'scan wifi qr code', 'qr code decoder', 'scan qr from gallery', 'scan qr from photo', 'what is inside this qr code'],
  }, toolkit.toolCatalog),
];
