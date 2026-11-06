import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { UnlockPdf } from '../components/tools/UnlockPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { siteConfig } from '../config/site';

export const UnlockPage: React.FC = () => {
  const heading = usePageHeading('unlock');

  const faqs = [
    {
      question: `Is unlocking PDFs safe on ${siteConfig.name}?`,
      answer:
        'The password and selected PDF are processed in your browser and are not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
    {
      question: 'Do I need to know the document password?',
      answer:
        'Yes. Enter a password you are authorized to use to open the PDF. This tool cannot recover a forgotten password.',
    },
    {
      question: 'Will unlocking alter the formatting or contents of my PDF?',
      answer:
      'This tool rebuilds each page as an image. Text may no longer be selectable or searchable, and links, forms, and other interactive features may not be retained. Check the output before replacing your original.',
    },
    {
      question: 'Can I re-encrypt the file later?',
      answer:
        'Yes. Once unlocked, you can open the Protect PDF tool at any time to assign new passwords or custom permissions.',
    },
  ];

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName="Unlock PDF" faqs={faqs} />}
    >
      <UnlockPdf />
    </ToolLayout>
  );
};

export default UnlockPage;