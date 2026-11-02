import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { FlattenPdf } from '../components/tools/FlattenPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const FlattenPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDF',
      description: 'Select or drag your PDF with interactive form fields or annotations into the tool.',
    },
    {
      title: 'Flatten Form Fields',
      description: 'Click Flatten PDF to permanently bake text inputs, checkboxes, and signatures into the base document graphic layer.',
    },
    {
      title: 'Download Secure File',
      description: 'Save your flattened document with non-editable, tamper-evident content in seconds.',
    },
  ];

  const faqs = [
    {
      question: `Is flattening PDFs secure on ${siteConfig.name}?`,
      answer:
        'The selected PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. The website may make separate requests for advertising and supporting resources.',
    },
    {
      question: 'What does flattening a PDF actually do?',
      answer:
        'It converts interactive form elements (AcroForms, dropdowns, radio buttons, annotations) into fixed visual elements on the page, preventing future edits or tampering.',
    },
    {
      question: 'Will text remain readable and printable?',
      answer:
        'Yes. Visual fidelity, fonts, and print clarity remain completely preserved while disabling fillable input fields.',
    },
    {
      question: 'Can a flattened PDF be unflattened later?',
      answer:
        'No. Flattening is an irreversible operation that embeds input fields permanently into page content streams.',
    },
  ];

  return (
    <ToolLayout
      title="Flatten PDF Forms"
      subtitle="Lock fillable form fields and visual annotations permanently into non-editable page graphics without uploading to any server."
      seoContent={<ToolGuide toolName="Flatten PDF" steps={steps} faqs={faqs} />}
    >
      <FlattenPdf />
    </ToolLayout>
  );
};

export default FlattenPage;