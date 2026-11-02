import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SanitizePdf } from '../components/tools/SanitizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const SanitizePage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF to Sanitize',
      description: 'Select a PDF whose metadata you want to inspect and remove. Keep an original copy before sanitizing.',
    },
    {
      title: 'Choose What to Strip',
      description: 'Choose supported items such as document information, XMP metadata, PieceInfo data, thumbnails, and JavaScript actions.',
    },
    {
      title: 'Purge & Download',
      description: 'The selected metadata is removed in your browser. Review the output and do not assume every possible hidden-data type was removed.',
    },
  ];

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
      title="Sanitize PDF (Metadata & Privacy Stripper)"
      subtitle="Remove selected PDF metadata and document structures in your browser. Review the output before sharing."
      seoContent={<ToolGuide toolName="Sanitize PDF" steps={steps} faqs={faqs} />}
    >
      <SanitizePdf />
    </ToolLayout>
  );
};