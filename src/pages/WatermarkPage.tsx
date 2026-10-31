import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { WatermarkPdf } from '../components/tools/WatermarkPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const WatermarkPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload the document you want to stamp with a security or status watermark.',
    },
    {
      title: 'Customize Watermark',
      description: 'Choose preset tags (CONFIDENTIAL, DRAFT), color, transparency, rotation angle, and target pages.',
    },
    {
      title: 'Stamp & Download',
      description: 'The watermark is rendered directly into the PDF coordinate stream in your local browser RAM.',
    },
  ];

  const faqs = [
    {
      question: `Are my watermarked documents uploaded to a remote server on ${siteConfig.name}?`,
      answer:
        'Never. All PDF parsing, font embedding, and vector transformations take place directly in your browser memory via WebAssembly. Zero bytes leave your computer.',
    },
    {
      question: 'Will the watermark obscure my existing text?',
      answer:
        'You can adjust the opacity slider down to 10%–25% so the underlying text and graphics remain completely readable.',
    },
    {
      question: 'Can I watermark only specific pages?',
      answer:
        'Yes. You can select All Pages, Odd Pages, Even Pages, or provide a Custom Page Range (e.g., 1-5, 8).',
    },
  ];

  return (
    <ToolLayout
      title="Watermark PDF"
      subtitle="Stamp custom text watermarks, draft stamps, and confidential markers onto PDF pages. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="Watermark PDF" steps={steps} faqs={faqs} />}
    >
      <WatermarkPdf />
    </ToolLayout>
  );
};