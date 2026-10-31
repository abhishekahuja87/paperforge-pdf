import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { UnlockPdf } from '../components/tools/UnlockPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const UnlockPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload Protected PDF',
      description: 'Select or drag your password-protected PDF document into the tool.',
    },
    {
      title: 'Enter Password',
      description: 'Type the valid open/user password to authenticate and decrypt the document stream.',
    },
    {
      title: 'Unlock & Save',
      description: 'Click Unlock PDF to remove encryption in browser memory and download a restriction-free PDF.',
    },
  ];

  const faqs = [
    {
      question: `Is unlocking PDFs safe on ${siteConfig.name}?`,
      answer:
        'Yes. All decryption and rendering operations occur locally inside your browser memory via Web Workers. Your password and PDF contents are never sent to any server.',
    },
    {
      question: 'Do I need to know the document password?',
      answer:
        'Yes. To remove protection from an encrypted PDF, you must supply the original open or owner password so your browser can decrypt the file streams.',
    },
    {
      question: 'Will unlocking alter the formatting or contents of my PDF?',
      answer:
        'No. The document structure, text, layout, and visual fidelity remain preserved while the encryption wrapper is completely stripped away.',
    },
    {
      question: 'Can I re-encrypt the file later?',
      answer:
        'Yes. Once unlocked, you can open the Protect PDF tool at any time to assign new passwords or custom permissions.',
    },
  ];

  return (
    <ToolLayout
      title="Unlock PDF Documents"
      subtitle="Remove password protection and encryption restrictions permanently without uploading to any server."
      seoContent={<ToolGuide toolName="Unlock PDF" steps={steps} faqs={faqs} />}
    >
      <UnlockPdf />
    </ToolLayout>
  );
};

export default UnlockPage;