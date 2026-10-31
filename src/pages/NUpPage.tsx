import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { NUpPdf } from '../components/tools/NUpPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const NUpPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload any multi-page document, slide presentation, or invoice batch.',
    },
    {
      title: 'Choose Grid Layout',
      description: 'Select 2-Up side-by-side or 4-Up grid, paper orientation (A4 or US Letter), and gutter spacing.',
    },
    {
      title: 'Compile & Print',
      description: 'Pages are scaled into vector sub-forms and arranged onto composite sheets in local browser memory.',
    },
  ];

  const faqs = [
    {
      question: `What is N-Up printing on ${siteConfig.name}?`,
      answer:
        'N-Up is a printing technique where multiple logical pages (2 or 4) are scaled down and positioned on a single sheet of paper. This reduces paper usage, ink, and binding size.',
    },
    {
      question: 'Will text or vector drawings lose clarity when scaled?',
      answer:
        'No. Pages are embedded as native vector objects rather than rasterized into pixels, preserving crisp typography and diagram lines at any print resolution.',
    },
    {
      question: 'Are my files uploaded anywhere during layout composition?',
      answer:
        'Never. The entire N-Up arrangement runs directly on your machine in local browser RAM using client-side WebAssembly.',
    },
  ];

  return (
    <ToolLayout
      title="N-Up PDF (Multiple Pages Per Sheet)"
      subtitle="Arrange 2 or 4 pages per sheet for handouts, presentation notes, and paper saving. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="N-Up PDF" steps={steps} faqs={faqs} />}
    >
      <NUpPdf />
    </ToolLayout>
  );
};