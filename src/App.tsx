import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { MergePage } from './pages/MergePage';
import { SplitPage } from './pages/SplitPage';
import { GenerateSamplePage } from './pages/GenerateSamplePage';
import { RotatePage } from './pages/RotatePage';
import { DeletePagesPage } from './pages/DeletePagesPage';
import { CompressPage } from './pages/CompressPage';
import { ImagesToPdfPage } from './pages/ImagesToPdfPage';
import { AddPageNumbersPage } from './pages/AddPageNumbersPage';
import { WatermarkPage } from './pages/WatermarkPage';
import { CropPage } from './pages/CropPage';
import { SanitizePage } from './pages/SanitizePage';
import { NUpPage } from './pages/NUpPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Header />
        <main className="flex-1">
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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;