import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PACK_TOOLS } from './config/packs';
import { PageLoader } from './components/common/PageLoader';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded route components for optimal bundle splitting
const HomePage = lazy(() => import('./pages/HomePage2').then((m) => ({ default: m.HomePage2 })));
const MergePage = lazy(() => import('./pages/MergePage').then((m) => ({ default: m.MergePage })));
const SplitPage = lazy(() => import('./pages/SplitPage').then((m) => ({ default: m.SplitPage })));
const GenerateSamplePage = lazy(() => import('./pages/GenerateSamplePage').then((m) => ({ default: m.GenerateSamplePage })));
const RotatePage = lazy(() => import('./pages/RotatePage').then((m) => ({ default: m.RotatePage })));
const DeletePagesPage = lazy(() => import('./pages/DeletePagesPage').then((m) => ({ default: m.DeletePagesPage })));
const CompressPage = lazy(() => import('./pages/CompressPage').then((m) => ({ default: m.CompressPage })));
const ImagesToPdfPage = lazy(() => import('./pages/ImagesToPdfPage').then((m) => ({ default: m.ImagesToPdfPage })));
const AddPageNumbersPage = lazy(() => import('./pages/AddPageNumbersPage').then((m) => ({ default: m.AddPageNumbersPage })));
const WatermarkPage = lazy(() => import('./pages/WatermarkPage').then((m) => ({ default: m.WatermarkPage })));
const CropPage = lazy(() => import('./pages/CropPage').then((m) => ({ default: m.CropPage })));
const SanitizePage = lazy(() => import('./pages/SanitizePage').then((m) => ({ default: m.SanitizePage })));
const NUpPage = lazy(() => import('./pages/NUpPage').then((m) => ({ default: m.NUpPage })));
const InspectPage = lazy(() => import('./pages/InspectPage').then((m) => ({ default: m.InspectPage })));
const ProtectPage = lazy(() => import('./pages/ProtectPage').then((m) => ({ default: m.ProtectPage })));
const UnlockPage = lazy(() => import('./pages/UnlockPage').then((m) => ({ default: m.UnlockPage })));
const FlattenPage = lazy(() => import('./pages/FlattenPage').then((m) => ({ default: m.FlattenPage })));
const PdfToImagesPage = lazy(() => import('./pages/PdfToImagesPage').then((m) => ({ default: m.PdfToImagesPage })));
const ExtractTextPage = lazy(() => import('./pages/ExtractTextPage').then((m) => ({ default: m.ExtractTextPage })));
const OrganizePage = lazy(() => import('./pages/OrganizePage').then((m) => ({ default: m.OrganizePage })));
const MasterDocumentStudioPage = lazy(() => import('./pages/MasterDocumentStudioPage').then((m) => ({ default: m.MasterDocumentStudioPage })));
const DigitizeDocumentsPage = lazy(() => import('./pages/DigitizeDocumentsPage').then((m) => ({ default: m.DigitizeDocumentsPage })));
const ImageConverterPage = lazy(() => import('./pages/ImageConverterPage').then((m) => ({ default: m.ImageConverterPage })));
const ImageCompressorPage = lazy(() => import('./pages/ImageCompressorPage').then((m) => ({ default: m.ImageCompressorPage })));
const UtilityPage = lazy(() => import('./pages/UtilityPage').then((m) => ({ default: m.UtilityPage })));
const FinanceCalculatorPage = lazy(() => import('./pages/FinanceCalculatorPage').then((m) => ({ default: m.FinanceCalculatorPage })));
const PackToolPage = lazy(() => import('./pages/PackToolPage').then((m) => ({ default: m.PackToolPage })));
const ImageResizerPage = lazy(() => import('./pages/ImageResizerPage').then((m) => ({ default: m.ImageResizerPage })));
const JsonFormatterPage = lazy(() => import('./pages/JsonFormatterPage').then((m) => ({ default: m.JsonFormatterPage })));
const Base64ToolPage = lazy(() => import('./pages/Base64ToolPage').then((m) => ({ default: m.Base64ToolPage })));
const DisplayStudioPage = lazy(() => import('./pages/DisplayStudioPage').then((m) => ({ default: m.DisplayStudioPage })));
const PosInvoiceStudioPage = lazy(() => import('./pages/PosInvoiceStudioPage').then((m) => ({ default: m.PosInvoiceStudioPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const EditorialPolicyPage = lazy(() => import('./pages/EditorialPolicyPage').then((m) => ({ default: m.EditorialPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const GuidesPage = lazy(() => import('./pages/GuidesPage').then((m) => ({ default: m.GuidesPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((m) => ({ default: m.GuidePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const Ac1Page = lazy(() => import('./pages/Ac1Page').then((m) => ({ default: m.Ac1Page })));
const Ac1PosterPage = lazy(() => import('./pages/Ac1PosterPage').then((m) => ({ default: m.Ac1PosterPage })));
const CatalogTemplatesPage = lazy(() => import('./pages/CatalogTemplatesPage').then((m) => ({ default: m.CatalogTemplatesPage })));

export const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[var(--theme-background)] text-stone-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-stone-900 focus:shadow-lg">Skip to main content</a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ac1" element={<CatalogTemplatesPage />} />
              <Route path="/ac1/edit" element={<Ac1Page />} />
              <Route path="/ac1/poster" element={<Ac1PosterPage />} />
              <Route path="/merge-pdf" element={<MergePage />} />
              <Route path="/split-pdf" element={<SplitPage />} />
              <Route path="/generate-sample-pdf" element={<GenerateSamplePage />} />
              <Route path="/rotate-pdf" element={<RotatePage />} />
              <Route path="/compress-pdf" element={<CompressPage />} />
              <Route path="/delete-pdf-pages" element={<DeletePagesPage />} />
              <Route path="/image-to-pdf" element={<ImagesToPdfPage />} />
              <Route path="/add-page-numbers" element={<AddPageNumbersPage />} />
              <Route path="/watermark-pdf" element={<WatermarkPage />} />
              <Route path="/crop-pdf" element={<CropPage />} />
              <Route path="/sanitize-pdf" element={<SanitizePage />} />
              <Route path="/n-up-pdf" element={<NUpPage />} />
              <Route path="/inspect-pdf" element={<InspectPage />} />
              <Route path="/protect-pdf" element={<ProtectPage />} />
              <Route path="/unlock-pdf" element={<UnlockPage />} />
              <Route path="/flatten-pdf" element={<FlattenPage />} />
              <Route path="/pdf-to-images" element={<PdfToImagesPage />} />
              <Route path="/extract-text" element={<ExtractTextPage />} />
              <Route path="/organize-pdf" element={<OrganizePage />} />
              <Route path="/master-document-studio" element={<MasterDocumentStudioPage />} />
              <Route path="/digitize-documents" element={<DigitizeDocumentsPage />} />
              <Route path="/image-converter" element={<ImageConverterPage />} />
              <Route path="/image-compressor" element={<ImageCompressorPage />} />
              <Route path="/income-tax-calculator" element={<FinanceCalculatorPage kind="incomeTax" />} />
              <Route path="/salary-calculator" element={<FinanceCalculatorPage kind="salary" />} />
              <Route path="/hra-calculator" element={<FinanceCalculatorPage kind="hra" />} />
              <Route path="/emi-calculator" element={<FinanceCalculatorPage kind="emi" />} />
              <Route path="/sip-calculator" element={<FinanceCalculatorPage kind="sip" />} />
              <Route path="/fd-calculator" element={<FinanceCalculatorPage kind="fd" />} />
              <Route path="/ppf-calculator" element={<FinanceCalculatorPage kind="ppf" />} />
              <Route path="/gst-calculator" element={<FinanceCalculatorPage kind="gst" />} />
              <Route path="/gst-invoice-generator" element={<UtilityPage kind="gstInvoice" />} />
              <Route path="/epf-calculator" element={<UtilityPage kind="epf" />} />
              <Route path="/time-zone-converter" element={<UtilityPage kind="timeZone" />} />
              <Route path="/lorem-ipsum-generator" element={<UtilityPage kind="lorem" />} />
              <Route path="/color-converter" element={<UtilityPage kind="color" />} />
              <Route path="/uuid-generator" element={<UtilityPage kind="uuid" />} />
              <Route path="/timestamp-converter" element={<UtilityPage kind="timestamp" />} />
              <Route path="/url-encoder-decoder" element={<UtilityPage kind="url" />} />
              <Route path="/gratuity-calculator" element={<UtilityPage kind="gratuity" />} />
              <Route path="/lumpsum-calculator" element={<UtilityPage kind="lumpsum" />} />
              <Route path="/inflation-calculator" element={<UtilityPage kind="inflation" />} />
              <Route path="/bmi-calculator" element={<UtilityPage kind="bmi" />} />
              <Route path="/bill-splitter" element={<UtilityPage kind="billSplitter" />} />
              <Route path="/simple-compound-interest-calculator" element={<UtilityPage kind="simpleCompound" />} />
              <Route path="/rd-calculator" element={<UtilityPage kind="rd" />} />
              <Route path="/cagr-calculator" element={<UtilityPage kind="cagr" />} />
              <Route path="/age-calculator" element={<UtilityPage kind="age" />} />
              <Route path="/date-difference-calculator" element={<UtilityPage kind="dateDifference" />} />
              <Route path="/percentage-calculator" element={<UtilityPage kind="percentage" />} />
              <Route path="/discount-calculator" element={<UtilityPage kind="discount" />} />
              <Route path="/unit-converter" element={<UtilityPage kind="unit" />} />
              <Route path="/word-counter" element={<UtilityPage kind="wordCounter" />} />
              {PACK_TOOLS.map(({ tool, kind }) => <Route key={tool.path} path={tool.path} element={<PackToolPage kind={kind} />} />)}
              <Route path="/case-converter" element={<UtilityPage kind="caseConverter" />} />
              <Route path="/number-to-words" element={<UtilityPage kind="numberToWords" />} />
              <Route path="/password-generator" element={<UtilityPage kind="password" />} />
              <Route path="/image-resizer" element={<ImageResizerPage guideId="imageResizer" defaultMaxKb={100} />} />
              <Route path="/resize-image-to-20kb" element={<ImageResizerPage guideId="imageResizer20" defaultMaxKb={20} />} />
              <Route path="/resize-image-to-50kb" element={<ImageResizerPage guideId="imageResizer50" defaultMaxKb={50} />} />
              <Route path="/resize-image-to-100kb" element={<ImageResizerPage guideId="imageResizer100" defaultMaxKb={100} />} />
              <Route path="/resize-image-to-200kb" element={<ImageResizerPage guideId="imageResizer200" defaultMaxKb={200} />} />
              <Route path="/passport-photo-resizer" element={<ImageResizerPage guideId="passportPhoto" defaultMaxKb={100} defaultPreset="passport" />} />
              <Route path="/signature-resizer" element={<ImageResizerPage guideId="signatureResizer" defaultMaxKb={20} defaultPreset="signature" />} />
              <Route path="/exam-photo-resizer" element={<ImageResizerPage guideId="examPhoto" defaultMaxKb={50} defaultPreset="exam-photo" />} />
              <Route path="/resize-image-to-30kb" element={<ImageResizerPage guideId="imageResizer30" defaultMaxKb={30} />} />
              <Route path="/json-formatter" element={<JsonFormatterPage />} />
              <Route path="/base64-tool" element={<Base64ToolPage />} />
              <Route path="/display-studio" element={<DisplayStudioPage />} />
              <Route path="/pos-invoice-studio" element={<PosInvoiceStudioPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/guides/:slug" element={<GuidePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;