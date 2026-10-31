import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { InspectPdf } from '../components/tools/InspectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const InspectPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload any PDF to examine its internal binary catalogs, dictionary trees, and versions.',
    },
    {
      title: 'Analyze Tree Structure',
      description: 'Review PDF specification versions, metadata, encryption status, and JavaScript hooks.',
    },
    {
      title: 'Audit Geometry',
      description: 'Check per-page dimensions, aspect ratios, and bounding boxes for pre-flight print checks.',
    },
  ];

  const faqs = [
    {
      question: `Why inspect PDFs on ${siteConfig.name}?`,
      answer:
        'Engineers and QA testers use it to debug broken upload pipelines, verify PDF/A conformance, and inspect unknown files for malicious script triggers without risking running untrusted code.',
    },
    {
      question: 'Are my confidential documents uploaded to a remote server?',
      answer:
        'Never. The inspector operates 100% inside your browser memory using pure client-side binary parsers. Zero data is transmitted.',
    },
  ];

  return (
    <ToolLayout
      title="PDF Structure & Metadata Inspector"
      subtitle="Inspect internal PDF object dictionaries, specification versions, metadata, and security flags. 100% private in-browser analysis."
      seoContent={<ToolGuide toolName="PDF Inspector" steps={steps} faqs={faqs} />}
    >
      <InspectPdf />
    </ToolLayout>
  );
};