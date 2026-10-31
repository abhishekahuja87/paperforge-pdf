import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CompressPdf } from '../components/tools/CompressPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const CompressPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload any large PDF document you need to optimize for sharing or email.',
    },
    {
      title: 'Choose Level',
      description: 'Select Basic Lossless optimization or Strong (metadata and thumbnail strip).',
    },
    {
      title: 'Compress & Save',
      description: 'The document is restructured and compressed directly in local memory for instant download.',
    },
  ];

  const faqs = [
    {
      question: `How does PDF compression work on ${siteConfig.name}?`,
      answer:
        'It strips duplicate object dictionaries, redundant application metadata, unused font glyph definitions, and consolidates fragmented byte streams into compressed cross-reference object streams.',
    },
    {
      question: 'Will text or vector drawings lose clarity?',
      answer:
        'No. Unlike destructive lossy compression tools that downscale text into blurry pixels, this optimizer retains full vector typography, hyperlinks, and document integrity.',
    },
    {
      question: 'Are my confidential documents uploaded anywhere?',
      answer:
        'Never. All processing runs directly in your browser using client-side WebAssembly. No files or byte fragments ever leave your device.',
    },
  ];

  return (
    <ToolLayout
      title="Compress & Optimize PDF"
      subtitle="Reduce PDF file size by restructuring internal object streams and stripping dead metadata. 100% private, executed in browser RAM."
      seoContent={<ToolGuide toolName="Compress PDF" steps={steps} faqs={faqs} />}
    >
      <CompressPdf />
    </ToolLayout>
  );
};