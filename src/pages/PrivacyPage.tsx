import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-700 leading-relaxed">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Effective Date: October 2026</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">1. Client-Side Document Processing (Zero Server Storage)</h2>
        <p>
          At <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), your document privacy is our foremost priority. All file operations—including merging, splitting, flattening, organizing, extracting text, and rendering images—occur strictly within your web browser using WebAssembly and local JavaScript memory.
        </p>
        <p>
          <strong>Your documents and files are never uploaded, transmitted across the internet, or stored on any server.</strong> When you close or refresh your browser tab, all document buffers are purged from your device’s active RAM.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Google AdSense & Third-Party Cookies</h2>
        <p>
          We use Google AdSense to serve advertisements when you visit our website. Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads based on prior visits to our website or other websites across the Internet.
        </p>
        <p>
          Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our sites and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google Ads Settings</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">3. Google Analytics (GA4)</h2>
        <p>
          We use Google Analytics 4 to collect aggregated, anonymized usage telemetry (such as page views, browser types, and interaction times) to optimize user experience and diagnose client-side performance issues. GA4 does not collect personal identity information, passwords, or document data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. User Rights & Contact</h2>
        <p>
          You have the right to inspect, review, or request information regarding our site policies. If you have questions regarding this Privacy Policy, please reach out via our contact page.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPage;