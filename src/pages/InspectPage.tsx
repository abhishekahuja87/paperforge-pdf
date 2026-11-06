import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { InspectPdf } from '../components/tools/InspectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const InspectPage: React.FC = () => {

  const faqs = [
    {
      question: `Why inspect PDFs on ${siteConfig.name}?`,
      answer:
        'Use the report to review basic PDF structure and look for features such as JavaScript actions. It is not a full security audit, malware scanner, or PDF/A conformance validator.',
    },
    {
      question: 'Are my confidential documents uploaded to a remote server?',
      answer:
        'The selected PDF is analyzed in your browser and is not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
  ];

  return (
    <ToolLayout
      title="PDF Structure & Metadata Inspector"
      subtitle="Review PDF version, metadata, encryption status, page geometry, and selected document features in your browser."
      seoContent={<ToolGuide toolName="PDF Inspector" faqs={faqs} />}
    >
      <InspectPdf />
    </ToolLayout>
  );
};