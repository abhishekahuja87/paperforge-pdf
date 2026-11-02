import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { WatermarkPdf } from '../components/tools/WatermarkPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const WatermarkPage: React.FC = () => {
  const steps = [
    {
      title: 'Choose a PDF',
      description: 'Choose the PDF you want to mark with a status or text watermark.',
    },
    {
      title: 'Customize Watermark',
      description: 'Choose preset tags (CONFIDENTIAL, DRAFT), color, transparency, rotation angle, and target pages.',
    },
    {
      title: 'Stamp & Download',
      description: 'Preview the settings, apply the watermark in your browser, and download the revised PDF.',
    },
  ];

  const faqs = [
    {
      question: `Are my watermarked documents uploaded to a remote server on ${siteConfig.name}?`,
      answer:
        'The selected PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
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
      subtitle="Add a configurable text watermark to selected PDF pages in your browser."
      seoContent={<ToolGuide toolName="Watermark PDF" steps={steps} faqs={faqs} />}
    >
      <WatermarkPdf />
    </ToolLayout>
  );
};