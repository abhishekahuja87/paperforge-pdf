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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;