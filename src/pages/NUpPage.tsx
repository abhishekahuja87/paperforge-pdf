import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { NUpPdf } from '../components/tools/NUpPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const NUpPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Select a multi-page PDF, such as a presentation or document, to arrange for printing.',
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
        'Pages are embedded as PDF page objects rather than rasterized, so text and vector elements remain scalable. Check the result at your intended print size.',
    },
    {
      question: 'Are my files uploaded anywhere during layout composition?',
      answer:
        'The selected PDF is arranged in your browser and is not uploaded to MyDailyUtils for processing. The website may make separate requests for resources and advertising.',
    },
  ];

  return (
    <ToolLayout
      title="N-Up PDF (Multiple Pages Per Sheet)"
      subtitle="Arrange two or four PDF pages on each sheet for handouts and presentation notes."
      seoContent={<ToolGuide toolName="N-Up PDF" steps={steps} faqs={faqs} />}
    >
      <NUpPdf />
    </ToolLayout>
  );
};