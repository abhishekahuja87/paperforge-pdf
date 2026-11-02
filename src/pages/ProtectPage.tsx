import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ProtectPdf } from '../components/tools/ProtectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const ProtectPage: React.FC = () => {
  const steps = [
    {
      title: 'Select a PDF',
      description: 'Select the PDF file you wish to secure with password encryption.',
    },
    {
      title: 'Set Passwords & Permissions',
      description: 'Define an open password and toggle restrictions for printing and text copying.',
    },
    {
      title: 'Encrypt & Save',
      description: 'Create a password-protected copy in your browser, then test it with a PDF reader before sharing.',
    },
  ];

  const faqs = [
    {
      question: `Does ${siteConfig.name} receive my password or PDF?`,
      answer:
        'The password and selected PDF are processed in your browser and are not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
    {
      question: 'Will the protected PDF retain selectable text and links?',
      answer:
        'This tool renders each page to an image before rebuilding the PDF. Text may no longer be selectable or searchable, and links, forms, and other interactive features may not be retained. Review the result before replacing your original.',
    },
    {
      question: 'Do the printing and copying permissions prevent every kind of copying?',
      answer:
        'No. PDF permissions are honored differently by different readers and cannot prevent screenshots or other ways of capturing content. Use a strong password to control opening, and do not treat permission flags as copy-proof security.',
    },
  ];

  return (
    <ToolLayout
      title="Protect PDF (Password Encryption)"
      subtitle="Set password protection for a PDF and choose document permissions in your browser."
      seoContent={<ToolGuide toolName="Protect PDF" steps={steps} faqs={faqs} />}
    >
      <ProtectPdf />
    </ToolLayout>
  );
};