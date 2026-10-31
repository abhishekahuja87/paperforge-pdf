import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ImagesToPdf } from '../components/tools/ImagesToPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const ImagesToPdfPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload Images',
      description: 'Select or drag multiple JPG, PNG, or WebP pictures into the converter.',
    },
    {
      title: 'Order & Choose Layout',
      description: 'Reorder pages using the Up/Down buttons and select A4, US Letter, or Fit to Image.',
    },
    {
      title: 'Convert & Download',
      description: 'Compile the images into a multi-page PDF document locally without server latency.',
    },
  ];

  const faqs = [
    {
      question: `Are my photos uploaded to an external server on ${siteConfig.name}?`,
      answer:
        'Never. The image-to-PDF conversion takes place entirely within your browser memory using HTML5 Canvas and WebAssembly. Your photos never leave your device.',
    },
    {
      question: 'Which image formats are supported?',
      answer:
        'We support JPG, JPEG, PNG, and modern WebP image formats. All are automatically converted to optimal PDF streams.',
    },
    {
      question: 'Can I change the order of images before making the PDF?',
      answer:
        'Yes. You can use the Up and Down arrow buttons next to each preview thumbnail to position the pages in your exact required order.',
    },
  ];

  return (
    <ToolLayout
      title="Convert Images to PDF"
      subtitle="Assemble JPG, PNG, and WebP images into a single professional PDF document. 100% private, executed in browser memory."
      seoContent={<ToolGuide toolName="Images to PDF" steps={steps} faqs={faqs} />}
    >
      <ImagesToPdf />
    </ToolLayout>
  );
};