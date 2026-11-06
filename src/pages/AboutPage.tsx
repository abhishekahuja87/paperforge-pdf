import React from 'react';
import { Lock, Zap, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';

export const AboutPage: React.FC = () => {
  return (
    <InfoPageLayout
        title="About MyDailyUtils"
        subtitle="Simple browser-based tools for everyday tasks."
        description="Learn about MyDailyUtils online tools and utilities for files, data, and everyday tasks, how local file processing works, and how to get support."
      >

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">What you can do here</h2>
        <p>
          <strong>MyDailyUtils</strong> is a collection of practical browser tools for working with PDFs, images, text and data, presentations, and shop bills. You can combine or organize PDF pages, convert images, inspect or format data, build a presentation, or prepare a bill without installing a desktop application.
        </p>
        <p>
          Choose a tool from the home page, add the files or information it asks for, review the result, and download it when you are ready. Each tool page includes instructions and answers to common questions about that task.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">What “processed in your browser” means</h2>
        <p>
          For the file utilities, selected files are processed by code running in your browser and are not uploaded to MyDailyUtils for processing. Work happens in the current page; download the result before closing or refreshing if you need to keep it. The site still makes network requests to load its pages and third-party resources, including ads. The Contact form separately sends the details you submit to Web3Forms so it can deliver your message.
        </p>
        <p>
          Results can vary with file format, file condition, browser support, and available device memory. Keep an original copy of important files and check downloaded results before relying on them.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Lock className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Local file processing</h3>
          <p className="text-xs text-slate-500">
            Selected files stay in the browser while the file tools process them; they are not sent to MyDailyUtils for processing.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Runs on your device</h3>
          <p className="text-xs text-slate-500">
            Processing uses your device and browser. Speed depends on the file, browser, and available device resources.
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
          <Cpu className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Open Web Standards</h3>
          <p className="text-xs text-slate-500">
            The site uses browser APIs and open-source libraries, including pdf-lib and PDF.js, for supported tasks.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Questions or feedback?</h2>
        <p>
          If you find a problem or have a suggestion, please use the <Link to="/contact" className="font-semibold text-indigo-700 underline">contact form</Link>. Contact form submissions are handled by Web3Forms, a third-party service; file processing remains separate.
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default AboutPage;