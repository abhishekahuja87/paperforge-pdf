import React from 'react';
import { FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-700 leading-relaxed">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-500">Effective Date: October 2026</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
        <p>
          By accessing and using <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our utility tools.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Description of Service</h2>
        <p>
          MyDailyUtils provides browser-based utilities for viewing, reorganizing, flattening, merging, and transforming PDF documents and related file formats. The tools are free to use and run in your browser.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">3. Disclaimer of Warranties</h2>
        <p>
          All tools are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. While all routines are built for reliability, you are solely responsible for keeping backup copies of your source documents before processing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. Modifications to Service</h2>
        <p>
          We reserve the right to add, modify, or retire any utility tool at any time without notice.
        </p>
      </section>
    </div>
  );
};

export default TermsPage;