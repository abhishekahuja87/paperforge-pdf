import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { FlattenPdf } from '../components/tools/FlattenPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const FlattenPage: React.FC = () => {

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
      seoContent={<ToolGuide toolName="Flatten PDF" faqs={faqs} />}
    >
      <FlattenPdf />
    </ToolLayout>
  );
};

export default FlattenPage;