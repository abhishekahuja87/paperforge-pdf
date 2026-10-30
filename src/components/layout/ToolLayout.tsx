import React from 'react';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  seoContent?: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({ title, subtitle, children, seoContent }) => {
  return (
    <div className="py-8 px-4 max-w-5xl mx-auto w-full">
      {/* Top Ad Unit Placeholder */}
      <div className="mb-6 p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
        Responsive Ad Banner Slot (Google AdSense Header Unit)
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm">{subtitle}</p>
      </div>

      {/* Main Tool Component */}
      <div className="mb-12">{children}</div>

      {/* Bottom Ad Unit Placeholder */}
      <div className="mb-12 p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
        High-CTR Ad Banner Slot (Displayed next to completion/download)
      </div>

      {/* SEO & Instructional Copy */}
      {seoContent && (
        <article className="prose prose-slate max-w-none border-t border-slate-200 pt-10 text-slate-700">
          {seoContent}
        </article>
      )}
    </div>
  );
};