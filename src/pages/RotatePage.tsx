import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { RotatePdf } from '../components/tools/RotatePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const RotatePage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Select the PDF that contains pages you want to rotate.',
    },
    {
      title: 'Select Angle & Pages',
      description: 'Choose 90°, 180°, or 270° and apply to all pages, odd/even, or custom ranges.',
    },
    {
      title: 'Rotate & Download',
      description: 'Reorient the pages in local memory and instantly download the corrected document.',
    },
  ];

  const faqs = [
    {
      question: `Does rotating change the text or resolution on ${siteConfig.name}?`,
      answer:
        'No. The internal PDF rotation matrix is modified directly. Text layers, embedded fonts, and vector graphics maintain their original quality.',
    },
    {
      question: 'Can I rotate only horizontal or landscape pages?',
      answer:
        'Yes. You can select "Custom Range" to specify only the page numbers that need reorienting (e.g. 2, 5, 8).',
    },
    {
      question: 'Is my document uploaded to a server?',
      answer:
        'The selected PDF is rotated in your browser and is not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
    {
      question: 'Can I undo a rotation?',
      answer:
        'You can select the reverse angle (for example, rotate 270° to reverse a 90° clockwise rotation) and re-save the document at any time.',
    },
  ];

  return (
    <ToolLayout
      title="Rotate PDF Pages"
      subtitle="Change the rotation of selected PDF pages in your browser."
      seoContent={<ToolGuide toolName="Rotate PDF" steps={steps} faqs={faqs} />}
    >
      <RotatePdf />
    </ToolLayout>
  );
};