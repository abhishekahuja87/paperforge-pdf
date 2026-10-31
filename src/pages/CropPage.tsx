import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CropPdf } from '../components/tools/CropPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const CropPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDF',
      description: 'Select the document you wish to trim margins or crop borders from.',
    },
    {
      title: 'Specify Margins',
      description: 'Choose quick presets or enter exact values for Top, Bottom, Left, and Right in pt, mm, or inches.',
    },
    {
      title: 'Crop & Save',
      description: 'Page boundary boxes are recalculated instantly in local memory for download.',
    },
  ];

  const faqs = [
    {
      question: `How does cropping work on ${siteConfig.name}?`,
      answer:
        'Cropping adjusts the internal CropBox and MediaBox parameters of the PDF. This trims empty white borders, printer bleed marks, or unwanted headers without degrading typography or vector quality.',
    },
    {
      question: 'Are my confidential files uploaded anywhere?',
      answer:
        'Never. The crop operation runs 100% locally in your browser memory. You can even disconnect your internet before clicking Crop.',
    },
    {
      question: 'Can I crop only odd or even pages?',
      answer:
        'Yes. You can select All Pages, Odd Pages Only, Even Pages Only, or specify a custom page range.',
    },
  ];

  return (
    <ToolLayout
      title="Crop & Trim PDF"
      subtitle="Trim outer margins, remove printer bleed marks, and crop page boundaries. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="Crop PDF" steps={steps} faqs={faqs} />}
    >
      <CropPdf />
    </ToolLayout>
  );
};