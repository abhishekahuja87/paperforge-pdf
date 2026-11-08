import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { siteConfig } from '../config/site';

export const PrivacyPage: React.FC = () => {
  return (
    <InfoPageLayout
        title="Privacy Policy"
        subtitle="Last updated: November 2, 2026"
        description="Read how MyDailyUtils handles browser-based file processing, local preferences, contact form submissions, advertising, and third-party resources."
      >

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">1. Local File Processing</h2>
        <p>
          At <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), supported file operations are performed in your web browser. Files selected for these tools are not uploaded to MyDailyUtils for processing. Work is temporary unless you download it or explicitly save a POS profile and inventory in your browser; the site does not provide cloud storage for your files.
        </p>
        <p>
          The website loads pages and third-party resources. Some PDF tools request character-map files from jsDelivr when needed to render or read certain PDFs. These are supporting resources; the selected PDF is not sent to jsDelivr for processing. Local file processing does not mean the website is offline or makes no network requests.
        </p>
        <p>
          Document digitization downloads its OCR worker, engine and English language model from this site. Recognition runs in the browser on the edited document; images and recognized text are not uploaded for OCR. Browser or network caches may retain the downloaded engine and model, but not the selected document through this feature.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Local preferences</h2>
        <p>
          The site stores your language choice and tool-visit counts in your browser’s local storage. The counts are used to show labels such as “Frequent” or “Favorite.” These preferences stay on your device and are not needed to process files. You can remove them by clearing this site’s browser storage.
        </p>
        <p>
          If you choose to save a POS shop profile and inventory, they are stored in this browser’s IndexedDB on your device, including the shop details and inventory entered. Customer bills are not saved there. Saved profiles can be loaded or deleted in the POS tool, and clearing site data also removes them. Browser storage may be accessible to others using the same browser profile and may not persist in private browsing; keep a JSON backup.
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
          Where the law requires it, for example for visitors in the European Economic Area, the United Kingdom and Switzerland, a consent message from Google is shown so you can choose whether cookies and personalised advertising are used. You can change your choice later through that message or your browser settings.
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
          For questions about this policy or a contact form submission, please use the <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact page</Link>{siteConfig.contactEmail && (<> or email <a href={`mailto:${siteConfig.contactEmail}`} className="font-semibold text-indigo-700 underline">{siteConfig.contactEmail}</a></>)}. Requests about information submitted through Web3Forms may also depend on that provider’s handling of the submission.
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default PrivacyPage;