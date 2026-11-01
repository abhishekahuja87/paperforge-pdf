import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MasterDocumentStudio } from '../components/tools/MasterDocumentStudio';
import { siteConfig } from '../config/site';

export const MasterDocumentStudioPage: React.FC = () => {
  const steps = [
    {
      title: '1. Add and choose pages',
      description: 'Combine PDFs, DOCX files, and images with custom cover/note/blank pages or sample PDFs from templates. Use Select all or page ranges such as 1-3, 5; click thumbnails to choose individual pages and set their initial order.',
    },
    {
      title: '2. Organize and edit',
      description: 'In the workspace, drag pages to reorder them. Zoom & edit to rotate, crop, redact, duplicate, delete, or export an individual page. Pin a page and enter a heading to include it in a linked contents page.',
    },
    {
      title: '3. Set PDF options and export',
      description: 'Choose page size, numbering, margins, watermark, metadata, compression, and optional password protection. Set a download filename, then create the final PDF on your device.',
    },
  ];
  const faqs = [
    {
      question: `Are files uploaded to ${siteConfig.name}?`,
      answer: 'No. Files are read, rendered, and assembled in your browser memory.',
    },
    {
      question: 'Does the export preserve PDF text quality?',
      answer: 'Regular PDF pages remain vector-based when possible. Images and rendered DOCX pages are raster content. Encrypted PDFs and pages with redactions are rendered as images; password-protecting the final PDF also rasterizes its pages.',
    },
    {
      question: 'How do I make a linked table of contents?',
      answer: 'In the workspace, click the pin on each page you want listed and enter a heading. The exported PDF adds a contents page at the beginning; each heading links to its page. Pages without a heading are not listed.',
    },
    {
      question: 'How do page numbering and “Skip first page” work?',
      answer: 'Choose None to omit numbers, or choose a header/footer position and format such as “Page {page} of {total}”. Skip first page hides the number on the first document page (after the contents page, if one is added); later pages retain their actual output page numbers.',
    },
    {
      question: 'Can I add a password-protected PDF?',
      answer: 'Yes. When prompted, enter either its open/user password or its owner password. Passwords stay in this browser. Encrypted source pages are rasterized in the finished output, so their text is not preserved as selectable vector text.',
    },
    {
      question: 'Can I password-protect the final PDF?',
      answer: 'Yes. Set a user/open password and optionally an owner password with printing/copying restrictions. The current protection method rasterizes the final pages; text selection/search and clickable contents links are not retained.',
    },
    {
      question: 'What do the page-size and compression options do?',
      answer: 'Choose A4 or US Letter to standardize output pages, or Preserve mixed sizes to keep each source page’s dimensions. Compression affects raster inputs only; size targets are best-effort and do not guarantee a final file size.',
    },
    {
      question: 'Can I save one page without exporting the whole document?',
      answer: 'Yes. Open Zoom & edit on a workspace page to export that page as its own PDF or image. You can also rotate, crop, add blackout redactions, and adjust image fit there.',
    },
  ];

  return (
    <ToolLayout
      title="Master Document Studio"
      subtitle="Build one organized PDF from selected pages across documents, images, custom pages, and templates—then edit, add linked contents, and export."
      seoContent={<ToolGuide toolName="Master Document Studio" steps={steps} faqs={faqs} />}
    >
      <MasterDocumentStudio />
    </ToolLayout>
  );
};

export default MasterDocumentStudioPage;
