import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { GenerateSamplePdf } from '../components/tools/GenerateSamplePdf';
import { ToolGuide } from '../components/common/ToolGuide';

export const GenerateSamplePage: React.FC = () => {
  const steps = [
    {
      title: 'Select Template & Preset',
      description: 'Choose from multi-page prose, synthetic PII datasets, mixed-geometry sheets, or invoices.',
    },
    {
      title: 'Configure Structures & QA Chaos',
      description: 'Toggle bookmarks, fillable forms, target sizes, or test parser failure with corrupted byte modes.',
    },
    {
      title: 'Generate & Save',
      description: 'Synthesize the document directly in browser memory and download immediately.',
    },
  ];

  const faqs = [
    {
      question: 'What is the Mixed-Geometry Stress Test?',
      answer:
        'A single multi-page PDF where each page has a different size or orientation (A4 portrait, A3 landscape blueprint, 90-degree clockwise rotation, and a long mobile POS receipt). It tests if your PDF viewer or thumbnail pipeline handles non-standard pages.',
    },
    {
      question: 'Why would I generate a corrupted PDF?',
      answer:
        'Software developers and QA engineers need to test error handling when users upload broken or incomplete files. Our chaos modes simulate truncated downloads, invalid magic headers, and scrambled cross-reference tables safely.',
    },
    {
      question: 'Is the Synthetic PII dataset real customer data?',
      answer:
        'No. The generator creates synthetic names, payment-like numbers, and tax-like identifiers for software testing. They are not real customer data and should not be used for transactions or identity verification.',
    },
    {
      question: 'How does the file size simulation work?',
      answer:
        'When you select 1 MB, 5 MB, or 10 MB, the generator injects padded binary data streams into the document, allowing you to test file-upload limits without hunting for arbitrary large files.',
    },
  ];

  return (
    <ToolLayout
      title="Sample PDF Generator & QA Sandbox"
      subtitle="Generate sample PDFs with configurable layouts, synthetic test data, and optional malformed-file cases in your browser."
      seoContent={<ToolGuide toolName="Sample PDF Generator" steps={steps} faqs={faqs} />}
    >
      <GenerateSamplePdf />
    </ToolLayout>
  );
};