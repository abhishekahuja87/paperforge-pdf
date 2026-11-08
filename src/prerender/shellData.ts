/**
 * Plain data used at build time to generate a static HTML page for every route
 * (see scripts/prerender-shell.mjs). It must stay free of React, i18next and any
 * browser APIs because it is bundled and run in Node.
 *
 * The text mirrors what each page shows in English so crawlers that do not run
 * JavaScript see the same title, description, steps and FAQs.
 */
import en from '../locales/en.json';
import { siteConfig } from '../config/site';
import { TOOLS, type ToolItem } from '../config/tools';
import { GUIDES } from '../content/guides';
import { buildHomeJsonLd, buildToolJsonLd, type JsonLd } from '../lib/structuredData';

type Json = Record<string, unknown>;

export interface ShellStep {
  title: string;
  description: string;
}

export interface ShellFaq {
  question: string;
  answer: string;
}

export interface ShellSection {
  heading: string;
  paragraphs: string[];
}

export interface ShellPage {
  kind: 'home' | 'tool' | 'info';
  /** Route path, for example "/merge-pdf". */
  path: string;
  /** Document title without the site name suffix. */
  title: string;
  description: string;
  heading: string;
  subtitle: string;
  steps: ShellStep[];
  faqs: ShellFaq[];
  /** Longer written explanation from en.toolArticles (empty when a tool has none yet). */
  article: ShellSection[];
  /** schema.org data written into the page head as JSON-LD. */
  jsonLd: JsonLd[];
}

export interface ShellLink {
  path: string;
  title: string;
  description: string;
}

export interface ShellGroup {
  name: string;
  links: ShellLink[];
}

export const SHELL_SITE = { name: siteConfig.name, shortName: siteConfig.shortName, url: siteConfig.url };

export const SHELL_TEXT = {
  howToUse: en.howToUse,
  questions: en.questions,
  localProcessing: en.localProcessing,
  allTools: en.allTools,
  company: en.company,
  about: en.about,
  contact: en.contact,
  privacyPolicy: en.privacyPolicy,
  terms: en.terms,
};

function rec(value: unknown): Json {
  return value && typeof value === 'object' ? (value as Json) : {};
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.replaceAll('{{siteName}}', siteConfig.name) : '';
}

function faqsFrom(value: unknown): ShellFaq[] {
  return arr(value).flatMap((item) => {
    const pair = Array.isArray(item)
      ? { question: str(item[0]), answer: str(item[1]) }
      : { question: str(rec(item).question), answer: str(rec(item).answer) };
    return pair.question && pair.answer ? [pair] : [];
  });
}

function stepsFrom(value: unknown): ShellStep[] {
  return arr(value).flatMap((item) => {
    const step = Array.isArray(item)
      ? { title: str(item[0]), description: str(item[1]) }
      : { title: str(rec(item).title), description: str(rec(item).description) };
    return step.title && step.description ? [step] : [];
  });
}

/** Tool id -> key in en.pageGuides for tools whose copy lives there. */
const PAGE_GUIDE_KEYS: Record<string, string> = {
  'compress-pdf': 'compress',
  'crop-pdf': 'crop',
  'delete-pdf-pages': 'delete',
  'generate-sample-pdf': 'sample',
  'image-to-pdf': 'imagesToPdf',
  'inspect-pdf': 'inspect',
  'json-formatter': 'jsonFormatter',
  'add-page-numbers': 'pageNumbers',
  'watermark-pdf': 'watermark',
  'n-up-pdf': 'nup',
  'pdf-to-images': 'pdfToImages',
  'organize-pdf': 'organize',
  'flatten-pdf': 'flatten',
  'base64-tool': 'base64',
  'extract-text': 'extract',
  'sanitize-pdf': 'sanitize',
  'protect-pdf': 'protect',
  'unlock-pdf': 'unlock',
  'image-converter': 'imageConverter',
  'image-compressor': 'imageCompressor',
  'income-tax-calculator': 'incomeTaxCalc',
  'salary-calculator': 'salaryCalc',
  'hra-calculator': 'hraCalc',
  'emi-calculator': 'emiCalc',
  'sip-calculator': 'sipCalc',
  'fd-calculator': 'fdCalc',
  'ppf-calculator': 'ppfCalc',
  'gst-calculator': 'gstCalc',
  'gst-invoice-generator': 'gstInvoiceGen',
  'gratuity-calculator': 'gratuityCalc',
  'lumpsum-calculator': 'lumpsumCalc',
  'inflation-calculator': 'inflationCalc',
  'bmi-calculator': 'bmiCalc',
  'bill-splitter': 'billSplitter',
  'simple-compound-interest-calculator': 'simpleCompoundCalc',
  'rd-calculator': 'rdCalc',
  'cagr-calculator': 'cagrCalc',
  'age-calculator': 'ageCalc',
  'date-difference-calculator': 'dateDifferenceCalc',
  'percentage-calculator': 'percentageCalc',
  'discount-calculator': 'discountCalc',
  'unit-converter': 'unitConverter',
  'word-counter': 'wordCounter',
  'case-converter': 'caseConverter',
  'number-to-words': 'numberToWords',
  'password-generator': 'passwordGenerator',
  'image-resizer': 'imageResizer',
  'resize-image-to-20kb': 'imageResizer20',
  'resize-image-to-50kb': 'imageResizer50',
  'resize-image-to-100kb': 'imageResizer100',
  'resize-image-to-200kb': 'imageResizer200',
  'passport-photo-resizer': 'passportPhoto',
  'signature-resizer': 'signatureResizer',
  'exam-photo-resizer': 'examPhoto',
  'resize-image-to-30kb': 'imageResizer30',
};

interface ToolCopy {
  heading: string;
  subtitle: string;
  steps: ShellStep[];
  faqs: ShellFaq[];
}

function articleFor(tool: ToolItem): ShellSection[] {
  const sections = arr(rec(rec(rec(en).toolArticles)[tool.path.slice(1)]).sections);
  return sections.flatMap((item) => {
    const heading = str(rec(item).heading);
    const paragraphs = arr(rec(item).paragraphs).map(str).filter(Boolean);
    return heading && paragraphs.length > 0 ? [{ heading, paragraphs }] : [];
  });
}

function guideSteps(tool: ToolItem): ShellStep[] {
  return stepsFrom(rec(en.guideSteps)[tool.path.slice(1)]);
}

function copyFor(tool: ToolItem): ToolCopy {
  const catalog = arr(rec(en.toolCatalog)[tool.id]);
  const base: ToolCopy = {
    heading: str(catalog[0]) || tool.title,
    subtitle: str(catalog[1]) || tool.description,
    steps: guideSteps(tool),
    faqs: [],
  };

  const guideKey = PAGE_GUIDE_KEYS[tool.id];
  if (guideKey) {
    const guide = rec(rec(en.pageGuides)[guideKey]);
    const imageTitle = tool.id === 'image-converter' ? en.image.converterTitle
      : tool.id === 'image-compressor' ? en.image.compressorTitle : '';
    const imageSubtitle = tool.id === 'image-converter' ? en.image.converterSubtitle
      : tool.id === 'image-compressor' ? en.image.compressorSubtitle : '';
    return {
      ...base,
      heading: str(guide.title) || imageTitle || base.heading,
      subtitle: str(guide.subtitle) || imageSubtitle || base.subtitle,
      faqs: faqsFrom(guide.faq),
    };
  }

  switch (tool.id) {
    case 'merge-pdf': {
      const merge = rec(en.merge);
      return {
        heading: str(merge.title) || base.heading,
        subtitle: str(merge.subtitle) || base.subtitle,
        steps: stepsFrom([1, 2, 3].map((n) => ({ title: merge[`step${n}Title`], description: merge[`step${n}Description`] }))),
        faqs: faqsFrom([1, 2, 3].map((n) => ({ question: merge[`faq${n}Question`], answer: merge[`faq${n}Answer`] }))),
      };
    }
    case 'split-pdf': {
      const split = rec(en.splitGuide);
      return {
        heading: str(split.title) || base.heading,
        subtitle: str(split.subtitle) || base.subtitle,
        steps: stepsFrom(split.steps),
        faqs: faqsFrom(split.faq),
      };
    }
    case 'rotate-pdf': {
      const rotate = rec(en.rotateGuide);
      return { ...base, heading: str(rotate.title) || base.heading, subtitle: str(rotate.subtitle) || base.subtitle, faqs: faqsFrom(rotate.faq) };
    }
    case 'digitize-documents': {
      const d = rec(en.digitize);
      return {
        heading: str(d.title) || base.heading,
        subtitle: str(d.subtitle) || base.subtitle,
        steps: stepsFrom([1, 2, 3].map((n) => ({ title: d[`step${n}`], description: d[`step${n}Detail`] }))),
        faqs: faqsFrom([1, 2, 3].map((n) => ({ question: d[`q${n}`], answer: d[`a${n}`] }))),
      };
    }
    case 'master-document-studio': {
      const m = rec(en.master);
      const featured = rec(rec(en.featuredTools)[tool.id]);
      return {
        heading: str(featured.title) || base.heading,
        subtitle: str(m.subtitle) || str(featured.description) || base.subtitle,
        steps: stepsFrom([1, 2, 3].map((n) => ({ title: m[`step${n}Title`], description: m[`step${n}Description`] }))),
        faqs: faqsFrom(m.faq),
      };
    }
    case 'display-studio': {
      const p = rec(en.displayPage);
      return { ...base, heading: str(p.title) || base.heading, subtitle: str(p.subtitle) || base.subtitle, faqs: faqsFrom(p.faq) };
    }
    case 'pos-invoice-studio': {
      const p = rec(en.posPage);
      return { ...base, heading: str(p.title) || base.heading, subtitle: str(p.subtitle) || base.subtitle, faqs: faqsFrom(p.faq) };
    }
    default:
      return base;
  }
}

const availableTools = TOOLS.filter((tool) => tool.isAvailable);

function toLink(tool: ToolItem): ShellLink {
  const copy = copyFor(tool);
  return { path: tool.path, title: copy.heading, description: copy.subtitle };
}

/** Same grouping as the site footer, so every tool is linked from every static page. */
export function getShellGroups(): ShellGroup[] {
  return [
    { name: en.pdfTools, tools: availableTools.filter((tool) => tool.category === 'pdf' && tool.tier !== 'workspace') },
    { name: en.imageTools, tools: availableTools.filter((tool) => tool.category === 'media') },
    { name: en.financeTools, tools: availableTools.filter((tool) => tool.category === 'finance') },
    { name: en.everydayTools, tools: availableTools.filter((tool) => tool.category === 'everyday') },
    { name: en.textTools, tools: availableTools.filter((tool) => tool.category === 'text') },
    { name: en.developerTools, tools: availableTools.filter((tool) => tool.category === 'dev') },
    { name: en.workspaces, tools: availableTools.filter((tool) => tool.tier === 'workspace') },
  ]
    .filter((group) => group.tools.length > 0)
    .map((group) => ({ name: group.name, links: group.tools.map(toLink) }))
    .concat([{
      name: 'Guides',
      links: [
        { path: '/guides', title: 'All guides', description: '' },
        ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, title: guide.title, description: guide.description })),
      ],
    }]);
}

export function getShellPages(): ShellPage[] {
  const home: ShellPage = {
    kind: 'home',
    path: '/',
    title: 'Free Online Tools & Calculators',
    description: siteConfig.description,
    heading: `${en.homeHeading} ${en.homeHeadingAccent}`,
    subtitle: en.homeDescription,
    steps: [],
    faqs: [],
    article: [],
    jsonLd: buildHomeJsonLd(),
  };

  const tools: ShellPage[] = availableTools.map((tool) => {
    const copy = copyFor(tool);
    return {
      kind: 'tool',
      path: tool.path,
      title: `${copy.heading} ${siteConfig.toolTitleSuffix}`,
      description: copy.subtitle,
      heading: copy.heading,
      subtitle: copy.subtitle,
      steps: copy.steps,
      faqs: copy.faqs,
      article: articleFor(tool),
      jsonLd: buildToolJsonLd({ name: copy.heading, description: copy.subtitle, path: tool.path }),
    };
  });

  const info = (path: string, title: string, subtitle: string, description: string, article: ShellSection[] = []): ShellPage => ({
    kind: 'info', path, title, description, heading: title, subtitle, steps: [], faqs: [], article, jsonLd: [],
  });

  const guidePages: ShellPage[] = [
    {
      kind: 'info',
      path: '/guides',
      title: 'Guides',
      description: 'Step-by-step guides: reduce photo size for online forms, merge and compress PDFs, choose between the old and new tax regime, calculate EMI, SIP, HRA and GST.',
      heading: 'Guides',
      subtitle: 'Plain-language how-to guides for PDFs, images, tax, money, dates and everyday calculations.',
      steps: [],
      faqs: [],
      article: [{ heading: 'All guides', paragraphs: GUIDES.map((guide) => `${guide.title}: ${guide.description}`) }],
      jsonLd: [],
    },
    ...GUIDES.map((guide): ShellPage => ({
      kind: 'info',
      path: `/guides/${guide.slug}`,
      title: guide.title,
      description: guide.description,
      heading: guide.title,
      subtitle: guide.description,
      steps: [],
      faqs: [],
      article: guide.sections,
      jsonLd: [],
    })),
  ];

  return [
    home,
    ...tools,
    ...guidePages,
    info('/about', 'About MyDailyUtils', 'Simple browser-based tools for everyday tasks.',
      'Learn about MyDailyUtils, a growing set of free online tools and calculators for everyday tasks, how in-browser processing works, and how to get support.', [
        { heading: 'What you can do here', paragraphs: ['MyDailyUtils is a growing collection of free, practical tools that run in your browser: finance and tax calculators, date, unit and percentage tools, text and password utilities, image and PDF tools, data formatters, presentations and shop bills.'] },
        { heading: 'Runs on your device', paragraphs: ['Selected files and the numbers you enter are processed in your browser and are not sent to MyDailyUtils for processing. The site itself still loads pages, advertising and other resources over the network.'] },
        { heading: 'Support', paragraphs: ['Use the contact form to report a problem or request a tool.'] },
      ]),
    info('/contact', en.contactPage.title, en.contactPage.subtitle, en.contactPage.description),
    info('/privacy', 'Privacy Policy', 'Last updated: November 8, 2026',
      'Read how MyDailyUtils handles in-browser processing, local preferences, contact form submissions, advertising, analytics and third-party resources.', [
        { heading: 'Summary', paragraphs: ['Supported file operations, calculators and text tools run in your browser and what you enter is not uploaded to MyDailyUtils for processing. Contact form messages are sent to Web3Forms, advertising and analytics are provided by third parties, and language and usage preferences are kept in your browser. Read the full policy on this page after the app loads.'] },
      ]),
    info('/terms', 'Terms of Service', 'Last updated: November 8, 2026',
      'Review the terms for using MyDailyUtils browser-based tools, calculators, downloads, and third-party services.', [
        { heading: 'Summary', paragraphs: ['MyDailyUtils provides browser-based tools and calculators for everyday, finance, text, PDF, image, data, display and business tasks. Results are provided as is and calculators give estimates, not financial, tax, legal or medical advice. Read the full terms on this page after the app loads.'] },
      ]),
  ];
}
