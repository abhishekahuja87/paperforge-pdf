import React from 'react';
import { Info, Lock, Zap, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-slate-700 leading-relaxed">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Info className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">About MyDailyUtils</h1>
          <p className="text-sm text-slate-500">100% In-Browser Privacy-First Daily Utilities</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
        <p>
          <strong>MyDailyUtils</strong> keeps file processing on your device. Our utilities perform their work directly in your browser, so your documents are not uploaded to a remote server for processing.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Lock className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Zero Server Uploads</h3>
          <p className="text-xs text-slate-500">
            Utility files are processed in your browser and are not uploaded to MyDailyUtils for processing.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Instant Execution</h3>
          <p className="text-xs text-slate-500">
            No waiting for server queues or download links. WebAssembly delivers instant processing.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Cpu className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Open Web Standards</h3>
          <p className="text-xs text-slate-500">
            Powered by modern standards: pdf-lib, PDF.js, and HTML5 Web Workers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;