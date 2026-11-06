import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SanitizePdf } from '../components/tools/SanitizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { siteConfig } from '../config/site';

export const SanitizePage: React.FC = () => {
  const heading = usePageHeading('sanitize');

  const faqs = [
    {
      question: `What makes ${siteConfig.name} sanitization different from standard PDF editors?`,
      answer:
        'The tool removes the selected document information, XMP metadata, PieceInfo data, page thumbnails, and supported JavaScript actions. It cannot guarantee removal of every kind of hidden information or content embedded in page artwork.',
    },
    {
      question: 'Will sanitizing a PDF alter my visible text, images, or layout?',
      answer:
        'The tool targets metadata and selected PDF structures, not visible page content. Check the sanitized file and do not rely on it as the sole method for concealing sensitive information.',
    },
    {
      question: 'Are my confidential files uploaded to any server?',
      answer:
        'The selected PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. The tool removes the metadata types described on this page; it cannot guarantee removal of every kind of hidden information.',
    },
  ];

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName="Sanitize PDF" faqs={faqs} />}
    >
      <SanitizePdf />
    </ToolLayout>
  );
};