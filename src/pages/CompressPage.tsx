import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CompressPdf } from '../components/tools/CompressPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const CompressPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Select a PDF from your device. Very large documents may require more browser memory and take longer to process.',
    },
    {
      title: 'Choose Level',
      description: 'Select Basic Lossless optimization or Strong (metadata and thumbnail strip).',
    },
    {
      title: 'Compress & Save',
      description: 'The tool rewrites the PDF in your browser. Review the resulting file size before keeping the download.',
    },
  ];

  const faqs = [
    {
      question: `How does PDF compression work on ${siteConfig.name}?`,
      answer:
        'The tool rewrites the PDF using object streams and removes standard document metadata. The Strong option also removes selected XMP metadata, editing information, and embedded page thumbnails. It does not downsample images.',
    },
    {
      question: 'Will text or vector drawings lose clarity?',
      answer:
        'The tool does not rasterize pages or downsample embedded images. It rewrites PDF objects and metadata, so the resulting size may be similar to or larger than the original.',
    },
    {
      question: 'Are my confidential documents uploaded anywhere?',
      answer:
        'The PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. The website still makes separate network requests for resources and advertising.',
    },
  ];

  return (
    <ToolLayout
      title="Compress & Optimize PDF"
      subtitle="Rewrite PDF structure and remove selected metadata in your browser. Size savings depend on the document; image data is not downsampled."
      seoContent={<ToolGuide toolName="Compress PDF" steps={steps} faqs={faqs} />}
    >
      <CompressPdf />
    </ToolLayout>
  );
};