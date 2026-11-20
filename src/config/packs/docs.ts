import docs from '../../locales/packs/docs.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Signature, PDF signing, document scanner, photo tools (passport sheet, grid splitter, collage), Secret Santa and stamp maker (components/tools/docs), plus five sheets on the records maker: ID cards, UPI stand, Wi-Fi sign, menu card and question paper (lib/records/shopdoc.ts). All run in the browser. */
export const DOCS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'signature-maker', kind: 'sigMaker', guideKey: 'signatureMakerGuide', category: 'media', icon: 'stamp', tier: 'popular',
    keywords: ['signature maker', 'draw signature online', 'signature generator', 'transparent signature png', 'create signature for pdf', 'handwritten signature online', 'e signature image', 'signature for forms', 'digital signature picture', 'sign with finger', 'type signature', 'signature png free'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'sign-pdf', kind: 'signPdf', guideKey: 'signPdfGuide', category: 'pdf', icon: 'file-text', tier: 'popular',
    keywords: ['sign pdf online', 'add signature to pdf', 'sign a pdf without printing', 'pdf signer', 'put signature on pdf', 'sign pdf on phone', 'esign pdf free', 'place signature on document', 'sign pdf without uploading', 'pdf signature tool', 'sign pdf on mobile', 'add image signature to pdf'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'document-scanner', kind: 'docScanner', guideKey: 'documentScannerGuide', category: 'pdf', icon: 'file-plus', tier: 'popular',
    keywords: ['document scanner online', 'scan document to pdf', 'phone camera scanner', 'photo to pdf scanner', 'scan pages to pdf', 'clean scanned document', 'remove shadow from document photo', 'black and white scan', 'multi page scan pdf', 'scan without app', 'camscanner alternative', 'scan id card to pdf'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'passport-photo-sheet-maker', kind: 'passportPhoto', guideKey: 'passportPhotoSheetMakerGuide', category: 'media', icon: 'crop', tier: 'popular',
    keywords: ['passport photo maker', 'passport size photo sheet', 'make passport photos at home', 'print passport photos 4x6', 'passport photo a4 sheet', '35x45 mm photo maker', '2x2 inch photo sheet', 'crop photo to passport size', 'id photo sheet maker', 'visa photo layout', 'passport photo printout', 'photo sheet for stamp size photos'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'photo-grid-splitter', kind: 'gridSplitter', guideKey: 'photoGridSplitterGuide', category: 'media', icon: 'grid', tier: 'popular',
    keywords: ['instagram grid maker', 'photo grid splitter', 'split image into grid', 'split photo into 9 pieces', 'instagram puzzle feed', 'image splitter for instagram', 'cut photo into tiles', 'profile grid splitter', 'split picture into 3x3', 'carousel image splitter', 'split image into equal parts', 'grid post maker'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'photo-collage-maker', kind: 'collage', guideKey: 'photoCollageMakerGuide', category: 'media', icon: 'layers', tier: 'popular',
    keywords: ['photo collage maker', 'collage maker free', 'join photos into one', 'combine pictures online', 'instagram collage', 'photo grid maker', 'make a collage on phone', 'story collage maker', 'picture collage a4', 'combine images into one picture', 'photo collage no app', 'collage with borders'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'secret-santa-generator', kind: 'santa', guideKey: 'secretSantaGeneratorGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['secret santa generator', 'secret santa name picker', 'secret santa draw online', 'kris kringle generator', 'gift exchange name draw', 'secret santa without email', 'secret santa for office', 'secret santa couples not matched', 'random gift draw', 'christmas gift exchange picker', 'draw names for gift exchange', 'secret santa pass the phone'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'stamp-maker', kind: 'stampMaker', guideKey: 'stampMakerGuide', category: 'business', icon: 'stamp', tier: 'more',
    keywords: ['stamp maker online', 'round stamp maker', 'company stamp generator', 'seal maker online', 'make a rubber stamp image', 'office stamp png', 'paid stamp maker', 'business stamp generator', 'transparent stamp png', 'circular stamp maker', 'digital stamp for invoice', 'round seal with text'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'id-card-maker-printable', kind: 'recIdCard', guideKey: 'idCardMakerGuide', category: 'business', icon: 'contact', tier: 'more',
    keywords: ['id card maker', 'id card template printable', 'student id card maker', 'staff id card maker free', 'make id card online', 'id card with photo', 'event badge printable', 'school id card template', 'employee id card printable', 'id card a4 sheet', 'visitor pass id card', 'kids id card'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'upi-payment-qr-stand-printable', kind: 'recUpiStand', guideKey: 'upiPaymentQrStandGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['upi qr code stand', 'scan and pay poster', 'upi qr code printable', 'payment qr code sign for shop', 'upi qr poster maker', 'scan to pay standee', 'shop qr code board', 'upi payment qr with logo', 'counter qr sign', 'make upi qr code poster', 'qr code for payments shop', 'scan and pay stand printable'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'wifi-password-sign-printable', kind: 'recWifiSign', guideKey: 'wifiPasswordSignGuide', category: 'everyday', icon: 'globe', tier: 'more',
    keywords: ['wifi password sign', 'wifi qr code poster', 'wifi sign printable', 'guest wifi sign', 'print wifi qr code', 'wifi password board for cafe', 'wifi poster template', 'scan to connect wifi sign', 'airbnb wifi sign', 'wifi details printable', 'wifi network sign', 'wifi qr sheet'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'restaurant-menu-card-printable', kind: 'recMenuCard', guideKey: 'restaurantMenuCardGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['menu card maker', 'restaurant menu template printable', 'cafe menu maker', 'price list template printable', 'tiffin menu card', 'home kitchen menu card', 'salon price list printable', 'menu card for small shop', 'printable menu a4', 'simple menu maker', 'bakery menu template', 'rate card printable'],
  }, docs.toolCatalog),
  definePackTool({
    id: 'question-paper-template-printable', kind: 'recQuestionPaper', guideKey: 'questionPaperTemplateGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['question paper maker', 'question paper template printable', 'test paper generator', 'make a test paper', 'unit test paper template', 'mcq question paper maker', 'exam paper format printable', 'worksheet with marks', 'school test paper template', 'answer key page maker', 'tuition test paper maker', 'class test paper printable'],
  }, docs.toolCatalog),
];
