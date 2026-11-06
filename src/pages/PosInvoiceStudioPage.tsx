import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PosInvoiceStudio } from '../components/tools/PosInvoiceStudio';

export const PosInvoiceStudioPage: React.FC = () => {
  const faqs = [
    { question: 'Does the app upload my shop profile, inventory, or bills?', answer: 'No. The POS tool runs in your browser. The app does not send your shop profile, inventory, customer information, or bills to a backend.' },
    { question: 'How do I reuse my shop profile and inventory next time?', answer: 'Download the profile JSON from the shop profile screen. It contains your shop profile details, bill prefix, and inventory. Keep it on your device and import it next session. Nothing is stored automatically in browser storage.' },
    { question: 'Can I use fractional inventory quantities?', answer: 'Yes. Quantity fields support decimals for count, weight, volume, length, and package units.' },
    { question: 'How do taxes and other charges work?', answer: 'Set a primary and optional additional percentage tax; both use the same inclusive or exclusive setting. The optional flat charge is added once per bill after percentage taxes. This is a general calculator, not tax or accounting advice; verify the rules that apply to your shop.' },
    { question: 'What bill number will my customer see?', answer: 'Each new bill starts with the prefix you choose in your shop profile, followed by the date and a unique code. Older profile files without a prefix use INV.' },
    { question: 'How do I share a bill with a customer?', answer: 'Print / download bill PDF opens the browser print dialog, where you can print or choose Save as PDF. Download customer image creates a PNG of the bill.' },
    { question: 'What is the difference between bill exports and JSON?', answer: 'PDF and PNG are readable bill copies to share with your customer. JSON is for you: profile JSON contains your shop profile and inventory, while bill JSON also contains the current bill and its items. The same import button accepts either JSON type.' },
  ];

  return (
    <ToolLayout
      wide
      title="POS & Bill Studio"
      subtitle="A local-only tool for shop profiles, inventory, fractional quantities, tax-aware bills, and offline JSON backups."
      seoContent={<ToolGuide toolName="POS & Bill Studio" faqs={faqs} privacyNote="Shop profiles, inventory, customer information, and bills are processed in this browser session. They are only saved when you explicitly export a JSON file; no POS data is uploaded to a server." />}
    >
      <PosInvoiceStudio />
    </ToolLayout>
  );
};

export default PosInvoiceStudioPage;
