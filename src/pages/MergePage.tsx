import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MergePdf } from '../components/tools/MergePdf';

export const MergePage: React.FC = () => {
  return (
    <ToolLayout
      title="Merge PDF Files Online"
      subtitle="Combine multiple PDF documents into one single file with exact page ordering. 100% private and processed on your device."
      seoContent={
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">How to Merge PDF Files Free</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
            <li>Click <strong>Click to upload</strong> or drag and drop two or more PDF files into the box.</li>
            <li>Use the up and down arrow buttons to arrange the files in your preferred sequence.</li>
            <li>Click <strong>Merge PDFs</strong> to generate the combined document instantly.</li>
            <li>Click <strong>Download Merged PDF</strong> to save the file to your computer.</li>
          </ol>

          <h2 className="text-xl font-bold text-slate-900 pt-4">Is merging PDFs safe on PaperForge?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Yes. Unlike other tools that require uploading your private PDF files to remote servers, PaperForge executes all operations in your browser using JavaScript and HTML5 File APIs. Your documents never leave your computer.
          </p>
        </div>
      }
    >
      <MergePdf />
    </ToolLayout>
  );
};