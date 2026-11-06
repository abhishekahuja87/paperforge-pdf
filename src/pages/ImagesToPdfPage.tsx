import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ImagesToPdf } from '../components/tools/ImagesToPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const ImagesToPdfPage: React.FC = () => {

  const faqs = [
    {
      question: `Are my photos uploaded to an external server on ${siteConfig.name}?`,
      answer:
        'Selected images are converted in your browser and are not uploaded to MyDailyUtils for processing. The site makes separate requests for resources and advertising.',
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
      subtitle="Assemble JPG, PNG, and WebP images into a PDF using your browser."
      seoContent={<ToolGuide toolName="Images to PDF" faqs={faqs} />}
    >
      <ImagesToPdf />
    </ToolLayout>
  );
};