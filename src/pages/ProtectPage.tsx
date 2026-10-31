import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ProtectPdf } from '../components/tools/ProtectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const ProtectPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload Document',
      description: 'Select the PDF file you wish to secure with password encryption.',
    },
    {
      title: 'Set Passwords & Permissions',
      description: 'Define an open password and toggle restrictions for printing and text copying.',
    },
    {
      title: 'Encrypt & Save',
      description: 'The document is encrypted directly in client RAM using AES encryption standards.',
    },
  ];

  const faqs = [
    {
      question: `Does ${siteConfig.name} see or store my password?`,
      answer:
        'Never. The encryption process occurs entirely within your browser memory. Your password and document data never touch an external server.',
    },
    {
      question: 'Can anyone open the file without the password?',
      answer:
        'No. The document object streams are fully encrypted using standard PDF encryption handlers and require the password to read.',
    },
  ];

  return (
    <ToolLayout
      title="Protect PDF (Password Encryption)"
      subtitle="Encrypt your PDF documents with custom passwords and restrict printing or copying. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="Protect PDF" steps={steps} faqs={faqs} />}
    >
      <ProtectPdf />
    </ToolLayout>
  );
};