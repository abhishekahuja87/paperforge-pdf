import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { JsonFormatter } from '../components/tools/JsonFormatter';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';

export const JsonFormatterPage: React.FC = () => {
  const faqs = [
    { question: `Is my JSON sent to ${siteConfig.name}?`, answer: 'No. Parsing, sorting, and formatting happen locally in your browser. The tool does not evaluate code or make network requests with your JSON.' },
    { question: 'Does sorting keys change my data?', answer: 'It changes the order of object keys recursively for readability. Array order and values are retained. Avoid key sorting if the original order is meaningful to your workflow.' },
    { question: 'Does validation check a schema?', answer: 'No. Validation checks whether the input is syntactically valid JSON. It does not validate application-specific fields or a JSON Schema.' },
  ];
  return (
    <ToolLayout title="JSON Formatter" subtitle="Beautify, minify, and validate JSON data with clear syntax errors and optional key sorting." seoContent={<ToolGuide toolName="JSON Formatter" faqs={faqs} />}>
      <JsonFormatter />
    </ToolLayout>
  );
};

export default JsonFormatterPage;
