import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { Base64Hash } from '../components/tools/Base64Hash';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';

export const Base64ToolPage: React.FC = () => {
  const faqs = [
    { question: `Does this tool upload my data to ${siteConfig.name}?`, answer: 'No. Encoding, decoding, and hashing use browser APIs locally. Selected files are read in memory and never uploaded.' },
    { question: 'Is Base64 encryption?', answer: 'No. Base64 is a reversible encoding, not encryption. Anyone can decode it; never use it to protect secrets.' },
    { question: 'Can a hash be reversed?', answer: 'Cryptographic hashes are designed to be one-way fingerprints. This tool offers SHA-1, SHA-256, SHA-384, and SHA-512. SHA-1 is included for compatibility, not for security-sensitive new designs.' },
    { question: 'What does URL-safe Base64 change?', answer: 'It substitutes hyphen and underscore for plus and slash, and omits padding when encoding. This is useful in URLs and filenames; decoding must use the matching option.' },
    { question: 'Why can’t some Base64 data be decoded as text?', answer: 'The decoder displays UTF-8 text only. Base64 may represent arbitrary binary data such as an image or archive; that data is not valid UTF-8 text.' },
  ];
  return (
    <ToolLayout title="Base64 & Hash" subtitle="Encode or decode UTF-8 text, create URL-safe Base64, or calculate SHA fingerprints for text and files." seoContent={<ToolGuide toolName="Base64 & Hash" faqs={faqs} />}>
      <Base64Hash />
    </ToolLayout>
  );
};

export default Base64ToolPage;
