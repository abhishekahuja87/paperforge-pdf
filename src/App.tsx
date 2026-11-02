import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PageLoader } from './components/common/PageLoader';

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
const ImageConverterPage = lazy(() => import('./pages/ImageConverterPage').then((m) => ({ default: m.ImageConverterPage })));
const ImageCompressorPage = lazy(() => import('./pages/ImageCompressorPage').then((m) => ({ default: m.ImageCompressorPage })));
const JsonFormatterPage = lazy(() => import('./pages/JsonFormatterPage').then((m) => ({ default: m.JsonFormatterPage })));
const Base64ToolPage = lazy(() => import('./pages/Base64ToolPage').then((m) => ({ default: m.Base64ToolPage })));
const DisplayStudioPage = lazy(() => import('./pages/DisplayStudioPage').then((m) => ({ default: m.DisplayStudioPage })));
const PosInvoiceStudioPage = lazy(() => import('./pages/PosInvoiceStudioPage').then((m) => ({ default: m.PosInvoiceStudioPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));

export const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
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
              <Route path="/image-converter" element={<ImageConverterPage />} />
              <Route path="/image-compressor" element={<ImageCompressorPage />} />
              <Route path="/json-formatter" element={<JsonFormatterPage />} />
              <Route path="/base64-tool" element={<Base64ToolPage />} />
              <Route path="/display-studio" element={<DisplayStudioPage />} />
              <Route path="/pos-invoice-studio" element={<PosInvoiceStudioPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;