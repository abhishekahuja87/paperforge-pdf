import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';

export const TermsPage: React.FC = () => {
  return (
    <InfoPageLayout
        title="Terms of Service"
        subtitle="Last updated: November 2, 2026"
        description="Review the terms for using MyDailyUtils browser-based file utilities, business tools, downloads, and third-party services."
      >

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
        <p>
          By accessing and using <strong>MyDailyUtils</strong> (https://www.mydailyutils.in), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our utility tools.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">2. Description of Service</h2>
        <p>
          MyDailyUtils provides browser-based tools for PDF, image, data, display, and business tasks. Supported file processing runs in your browser; selected files are not uploaded to MyDailyUtils for processing. The Contact form and third-party advertising are separate services that make network requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">3. Your responsibilities</h2>
        <p>
          You are responsible for keeping original copies of important files, checking downloaded results, and confirming that you have the right to process or share the content you select. Tool results depend on browser support, file condition, and available device resources.
        </p>
        <p>
          Tax rates and totals in POS &amp; Bill Studio are user-entered estimates, not tax, accounting, or legal advice. Check applicable requirements before issuing a bill.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. Third-party services</h2>
        <p>
          The Contact form is provided through Web3Forms, and advertisements are provided by Google AdSense. Those services are subject to their own terms and privacy policies. See our <Link to="/privacy" className="font-semibold text-indigo-700 underline">Privacy Policy</Link> for more information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">5. Disclaimer of warranties</h2>
        <p>
          The site and its tools are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind. We do not guarantee uninterrupted availability, error-free processing, or that a result will meet a particular requirement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">6. Changes and contact</h2>
        <p>
          We may update the site or these terms as the tools change. Questions about the terms can be sent through the <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact page</Link>.
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default TermsPage;