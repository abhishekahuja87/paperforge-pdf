import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { RotatePdf } from '../components/tools/RotatePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const RotatePage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload the PDF document with misaligned or sideways pages.',
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
        'No. All operations run directly in your local browser sandbox via WebAssembly. Your documents never leave your device.',
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
      subtitle="Permanently change PDF page orientation to portrait or landscape. 100% private, processed in browser memory."
      seoContent={<ToolGuide toolName="Rotate PDF" steps={steps} faqs={faqs} />}
    >
      <RotatePdf />
    </ToolLayout>
  );
};