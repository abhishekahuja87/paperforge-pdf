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
        <h2 className="text-xl font-bold text-slate-900">1. Local File Processing</h2>
        <p>
          At <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), file operations—including merging, splitting, flattening, organizing, extracting text, and rendering images—are performed in your web browser using JavaScript and WebAssembly. Files selected for utility processing are not uploaded to MyDailyUtils for processing.
        </p>
        <p>
          Some tools may request supporting resources, such as PDF rendering data, from a third-party content delivery network. These requests are separate from processing your selected files and do not upload the files to MyDailyUtils for processing. The website itself also makes network requests for its services; local file processing does not mean the entire website is offline or makes no network requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Contact Form (Web3Forms)</h2>
        <p>
          If you submit the Contact form, your name, email address, and message are sent to Web3Forms, a third-party form service, so your message can be delivered to us. Do not include sensitive information you would not want handled by that provider. This form submission is separate from the file-processing tools; it does not upload files selected for those tools.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">3. Third-Party Resources, Ads & Cookies</h2>
        <p>
          The website loads third-party resources, including Google advertising scripts and, where needed, supporting assets from content delivery networks. Those providers may receive technical information associated with requests, such as your IP address and browser details, and may use cookies according to their own policies.
        </p>
        <p>
          Google may use advertising cookies to serve ads based on visits to this or other websites. You can manage personalized advertising through <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google Ads Settings</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. Analytics</h2>
        <p>
          The site includes a Google tag for analytics. If configured and active, it may send usage information such as page views, browser details, and interaction timing to Google. Analytics does not need your selected document contents to provide these measurements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">5. User Rights & Contact</h2>
        <p>
          You have the right to inspect, review, or request information regarding our site policies. If you have questions regarding this Privacy Policy, please reach out via our contact page.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPage;