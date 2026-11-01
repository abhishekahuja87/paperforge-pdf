import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageCompressor } from '../components/tools/ImageCompressor';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';

export const ImageCompressorPage: React.FC = () => {
  const steps = [
    { title: 'Select images', description: 'Choose one or more PNG, JPG, or WebP files to process together.' },
    { title: 'Set size and quality', description: 'Choose an output format and quality. Optionally limit the maximum image width or height to reduce dimensions.' },
    { title: 'Compare and download', description: 'Review the before/after sizes and savings for each result. Download the compressed files you want to keep.' },
  ];
  const faqs = [
    { question: `Are images uploaded to ${siteConfig.name}?`, answer: 'No. Image processing runs locally in browser memory with HTML Canvas. Original files are not modified or uploaded.' },
    { question: 'Will every image become smaller?', answer: 'Not necessarily. Some images are already optimized, and lossless PNG output can be larger. Results show the actual size change; try a smaller dimension or a lossy format for a smaller file.' },
    { question: 'How does the dimension limit work?', answer: 'The selected maximum applies to the longer side. The original aspect ratio is preserved, and images smaller than the selected limit are not enlarged.' },
    { question: 'What happens if I convert a transparent image to JPG?', answer: 'JPG cannot store transparency. Transparent areas are filled with white when producing JPG output.' },
  ];
  return (
    <ToolLayout title="Image Compressor" subtitle="Reduce image file size by adjusting quality, dimensions, and output format—all processed locally." seoContent={<ToolGuide toolName="Image Compressor" steps={steps} faqs={faqs} />}>
      <ImageCompressor />
    </ToolLayout>
  );
};

export default ImageCompressorPage;
