import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMetadata } from '../components/common/PageMetadata';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-700 leading-relaxed">
      <PageMetadata
        title="Privacy Policy"
        description="Read how MyDailyUtils handles browser-based file processing, local preferences, contact form submissions, advertising, and third-party resources."
      />
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: November 2, 2026</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">1. Local File Processing</h2>
        <p>
          At <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), supported file operations are performed in your web browser. Files selected for these tools are not uploaded to MyDailyUtils for processing. Work is temporary unless you download the result; the site does not provide cloud storage for your files.
        </p>
        <p>
          The website loads pages and third-party resources. Some PDF tools request character-map files from jsDelivr when needed to render or read certain PDFs. These are supporting resources; the selected PDF is not sent to jsDelivr for processing. Local file processing does not mean the website is offline or makes no network requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Local preferences</h2>
        <p>
          The site stores tool-visit counts in your browser’s local storage to show labels such as “Frequent” or “Favorite.” These counts stay on your device and are not needed to process files. You can remove them by clearing this site’s browser storage.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">3. Contact form (Web3Forms)</h2>
        <p>
          If you submit the <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact form</Link>, your name, email address, and message are sent to Web3Forms, a third-party form service, to deliver your message. This is separate from file processing and does not send files selected in the tools. Web3Forms handles the submission under its own terms and privacy practices; do not include sensitive information in a message.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. Advertising and third-party resources</h2>
        <p>
          The site displays Google AdSense advertisements. Google and other advertising technology providers enabled for the site may use cookies or similar technologies to serve and measure ads, including ads based on your prior visits to this site or other websites. Requests to these providers can include technical information such as your IP address, browser, and device details. Depending on your settings and applicable consent choices, information may also be used for ad personalization and fraud prevention.
        </p>
        <p>
          You can manage Google personalized advertising through <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google Ads Settings</a>. You can also use the <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Digital Advertising Alliance opt-out page</a> for participating companies. Read <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google’s advertising information</a> and its <a href="https://support.google.com/adsense/answer/9012903?hl=en" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Ad technology partner information</a> for more detail. The providers available can depend on the publisher’s AdSense settings.
        </p>
        <p>
          For visitors in the European Economic Area, the United Kingdom, and Switzerland, Google requires publishers to use a Google-certified consent management platform for applicable consent and disclosure requirements. The publisher must configure its consent message and advertising partners in AdSense; those account settings are not managed by this website’s source code.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">5. Analytics</h2>
        <p>
          MyDailyUtils does not currently have a configured Google Analytics property. Advertising providers may independently measure ad impressions and interactions as described above.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">6. Questions and requests</h2>
        <p>
          For questions about this policy or a contact form submission, please use the <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact page</Link>. Requests about information submitted through Web3Forms may also depend on that provider’s handling of the submission.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPage;