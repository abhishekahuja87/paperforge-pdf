import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SanitizePdf } from '../components/tools/SanitizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const SanitizePage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF to Sanitize',
      description: 'Upload legal briefs, client contracts, RFP bids, or research documents containing sensitive hidden metadata.',
    },
    {
      title: 'Choose What to Strip',
      description: 'Select whether to purge author info, XMP revision histories, pieceInfo workspace data, page thumbnails, or embedded scripts.',
    },
    {
      title: 'Purge & Download',
      description: 'The PDF object tree is stripped clean in local browser RAM. No metadata or file bytes ever leave your device.',
    },
  ];

  const faqs = [
    {
      question: `What makes ${siteConfig.name} sanitization different from standard PDF editors?`,
      answer:
        'Standard PDF readers merely hide metadata from visual view. Our engine physically deletes the underlying Info dictionaries, XMP metadata XML streams, PieceInfo workspace blocks, and cached thumbnail streams from the binary file.',
    },
    {
      question: 'Will sanitizing a PDF alter my visible text, images, or layout?',
      answer:
        'No. Visual page contents, fonts, vector drawings, and images remain completely unchanged. Only invisible background data streams, author footprints, and script hooks are purged.',
    },
    {
      question: 'Are my confidential files uploaded to any server?',
      answer:
        'Never. Sanitization is executed 100% locally in your browser memory via client-side WebAssembly. You can disconnect your internet completely before sanitizing.',
    },
  ];

  return (
    <ToolLayout
      title="Sanitize PDF (Metadata & Privacy Stripper)"
      subtitle="Remove author information, edit history, computer usernames, and hidden embedded artifacts before sharing. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="Sanitize PDF" steps={steps} faqs={faqs} />}
    >
      <SanitizePdf />
    </ToolLayout>
  );
};