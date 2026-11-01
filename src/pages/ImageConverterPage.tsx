import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageConverter } from '../components/tools/ImageConverter';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';

export const ImageConverterPage: React.FC = () => {
  const steps = [
    { title: 'Choose images', description: 'Select one or more PNG, JPG, or WebP images. Files are read locally by your browser.' },
    { title: 'Choose an output format', description: 'Select PNG, JPG, or WebP. Adjust quality for JPG and WebP; PNG preserves transparency and does not use a quality slider.' },
    { title: 'Convert and save', description: 'Review output dimensions and file sizes, then download each converted image.' },
  ];
  const faqs = [
    { question: `Are my images uploaded to ${siteConfig.name}?`, answer: 'No. Your images are decoded and converted in browser memory using HTML Canvas; the files are not sent to our servers.' },
    { question: 'Which formats can I convert?', answer: 'This tool accepts PNG, JPG/JPEG, and WebP, and can output those same formats. SVG is not supported because canvas conversion rasterizes vector artwork.' },
    { question: 'What happens to transparency?', answer: 'PNG and WebP can retain transparency. JPG does not support transparency, so transparent areas are filled white.' },
    { question: 'Does conversion preserve metadata?', answer: 'No. Canvas re-encoding creates a new image and does not carry over metadata such as EXIF camera or location information.' },
  ];
  return (
    <ToolLayout title="Image Converter" subtitle="Convert PNG, JPG, and WebP images to a format that fits your workflow—right in your browser." seoContent={<ToolGuide toolName="Image Converter" steps={steps} faqs={faqs} />}>
      <ImageConverter />
    </ToolLayout>
  );
};

export default ImageConverterPage;
