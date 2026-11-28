/**
 * Plain data used at build time to generate a static HTML page for every route
 * (see scripts/prerender-shell.mjs). It must stay free of React, i18next and any
 * browser APIs because it is bundled and run in Node.
 *
 * The text mirrors what each page shows in English so crawlers that do not run
 * JavaScript see the same title, description, steps and FAQs.
 */
import { PACK_GUIDE_KEYS } from '../config/packs';
import { en } from '../locales/english';
import { metaDescription, siteConfig, toolPageTitle } from '../config/site';
import { TOOLS, type ToolItem } from '../config/tools';
import { GUIDES } from '../content/guides';
import { getTopics } from '../config/topics';
import { EDITORIAL } from '../content/editorial';
import { TRUST } from '../content/trust';
import { FREE_NO_LIMITS } from '../content/freeNoLimits';
import { HUB_EXTRAS } from '../content/hubExtras';
import { HUBS } from '../content/hubs';
import { HUB_FAQS } from '../content/hubFaqs';
import { hubGuides } from '../content/hubGuides';
import { plainText } from '../lib/toolLinks';
import { COLLECTIONS } from '../config/homeSections';
import { COURT_PAGES } from '../config/courtPages';
import { FIXTURE_PAGES } from '../config/fixturePages';
import { GLOBE_PAGES } from '../config/globePages';
import { UPDATES, formatUpdateDate } from '../config/updates';
import { buildHomeJsonLd, buildToolJsonLd, type JsonLd } from '../lib/structuredData';
import { hubForTool, hubLabel } from '../lib/hubForTool';

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
  /** The section page this tool belongs to, linked at the top of the static page. */
  parent?: { path: string; label: string; count: number };
  /** schema.org data written into the page head as JSON-LD. */
  jsonLd: JsonLd[];
  /** ISO date of the last real change, from the updates log (src/config/updateEntries.ts). Left out when no change is recorded, so the sitemap never states a made-up date. */
  lastmod?: string;
}

export interface ShellLink {
  path: string;
  title: string;
  description: string;
}

export interface ShellGroup {
  name: string;
  links: ShellLink[];
  /** Which pages list this group: 'all', a topic page path (that topic page and its tools) or 'only:<path>' (that one page). */
  showOn: string;
}

export { REDIRECTS } from '../config/redirects';
export { pageTitle } from '../lib/seo/pageTitle';

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
  editorialPolicy: en.editorialPolicy,
  whatsNew: en.whatsNew,
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
  'epf-calculator': 'epfCalc',
  'time-zone-converter': 'timeZoneConverter',
  'lorem-ipsum-generator': 'loremIpsum',
  'color-converter': 'colorConverter',
  'uuid-generator': 'uuidGenerator',
  'timestamp-converter': 'timestampConverter',
  'url-encoder-decoder': 'urlEncoder',
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
};

interface ToolCopy {
  heading: string;
  subtitle: string;
  steps: ShellStep[];
  faqs: ShellFaq[];
}

function articleFor(tool: Pick<ToolItem, 'path'>): ShellSection[] {
  const sections = arr(rec(rec(rec(en).toolArticles)[tool.path.slice(1)]).sections);
  return sections.flatMap((item) => {
    const heading = str(rec(item).heading);
    const paragraphs = arr(rec(item).paragraphs).map(str).filter(Boolean);
    return heading && paragraphs.length > 0 ? [{ heading, paragraphs }] : [];
  });
}

function guideSteps(tool: Pick<ToolItem, 'path'>): ShellStep[] {
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

  const guideKey = PACK_GUIDE_KEYS[tool.id] ?? PAGE_GUIDE_KEYS[tool.id];
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

const hubPathOf = (collectionId: string) => HUBS.find((hub) => hub.collection === collectionId)?.path ?? 'all';
const hubPathOfPage = (path: string) => hubForTool(path.replace(/^\//, ''))?.path ?? 'all';

/**
 * Link groups for the static pages. Each page lists only the tools of its own topic (titles only), every
 * topic page and the company pages, so the shared list does not outweigh the page's own text. Every tool
 * is still linked from its topic page, the sitemap and the app's footer.
 */
export function getShellGroups(): ShellGroup[] {
  const topicName = (id: string) => (id === 'workspaces' ? en.workspaces : (en.homeCollections as Record<string, { name: string }>)[id]?.name ?? id);
  const groups: ShellGroup[] = [];
  for (const topic of getTopics()) {
    if (topic.id !== 'other') {
      groups.push({ name: topicName(topic.id), links: topic.tools.map(toLink), showOn: topic.id === 'workspaces' ? 'all' : hubPathOf(topic.id) });
      continue;
    }
    // Option pages kept off the home page (VARIANT_PAGES) are listed with the topic page they link up to.
    const byHub = new Map<string, ToolItem[]>();
    for (const tool of topic.tools) {
      const path = hubPathOfPage(tool.path);
      byHub.set(path, [...(byHub.get(path) ?? []), tool]);
    }
    for (const [path, tools] of byHub) {
      const hub = HUBS.find((entry) => entry.path === path);
      groups.push({ name: hub ? `More ${hubLabel(hub.title)}` : 'More tools', links: tools.map(toLink), showOn: `only:${path}` });
    }
  }
  const family = (name: string, pages: readonly { path: string; name: string }[]): ShellGroup[] =>
    pages.length === 0 ? [] : [{ name, links: pages.map((page) => ({ path: page.path, title: page.name, description: '' })), showOn: hubPathOfPage(pages[0].path) }];
  return groups.concat(
    family('Court size pages', COURT_PAGES),
    family('Tournament schedules', FIXTURE_PAGES),
    family('Globe video pages', GLOBE_PAGES),
    [{
      name: 'Sections',
      links: HUBS.map((hub) => ({ path: hub.path, title: hubLabel(hub.title), description: '' })),
      showOn: 'all',
    }, {
      name: 'Guides',
      links: [
        { path: '/guides', title: 'All guides', description: '' },
        ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, title: guide.title, description: '' })),
      ],
      showOn: 'only:/guides',
    }],
  );
}

export function getShellPages(): ShellPage[] {
  return withLastmod(buildShellPages());
}

/** Adds the date of the newest logged update to each page that has one. The home page takes the newest update on the site. */
function withLastmod(pages: ShellPage[]): ShellPage[] {
  const newest = new Map<string, string>();
  for (const update of UPDATES) if (!newest.has(update.path) || update.date > newest.get(update.path)!) newest.set(update.path, update.date);
  const siteNewest = UPDATES.reduce((latest, update) => (update.date > latest ? update.date : latest), '');
  return pages.map((page) => {
    const date = page.path === '/' ? siteNewest : newest.get(page.path);
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { ...page, lastmod: date } : page;
  });
}

function buildShellPages(): ShellPage[] {
  const home: ShellPage = {
    kind: 'home',
    path: '/',
    title: 'Free Online Tools & Utilities',
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
      title: toolPageTitle(copy.heading),
      description: metaDescription(copy.subtitle),
      heading: copy.heading,
      subtitle: copy.subtitle,
      steps: copy.steps,
      faqs: copy.faqs,
      article: articleFor(tool),
      parent: hubForTool(tool.id) ?? undefined,
      jsonLd: buildToolJsonLd({ name: copy.heading, description: copy.subtitle, path: tool.path }, hubForTool(tool.id) ? { name: hubForTool(tool.id)!.label, path: hubForTool(tool.id)!.path } : null),
    };
  });

  const courtPages: ShellPage[] = [...COURT_PAGES, ...FIXTURE_PAGES, ...GLOBE_PAGES].map((page) => {
    const guide = rec(rec(en.pageGuides)[page.guideKey]);
    const heading = str(guide.title);
    const subtitle = str(guide.subtitle);
    return {
      kind: 'tool',
      path: page.path,
      title: toolPageTitle(heading),
      description: metaDescription(subtitle),
      heading,
      subtitle,
      steps: guideSteps(page),
      faqs: faqsFrom(guide.faq),
      article: articleFor(page),
      parent: hubForTool(page.path.replace(/^\//, '')) ?? undefined,
      jsonLd: buildToolJsonLd({ name: heading, description: subtitle, path: page.path }, hubForTool(page.path.replace(/^\//, '')) ? { name: hubForTool(page.path.replace(/^\//, ''))!.label, path: hubForTool(page.path.replace(/^\//, ''))!.path } : null),
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
      description: 'Step-by-step guides on photo and PDF size for online forms, income tax, EMI, SIP, FD and RD, gratuity, GST invoices, age on cut-off dates, passwords and more.',
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
    ...courtPages,
    ...guidePages,
    info('/about', 'About MyDailyUtils', 'Simple browser-based tools for everyday tasks.',
      'Learn about MyDailyUtils, a growing set of free online tools and calculators for everyday tasks, how in-browser processing works, and how to get support.', [
        { heading: 'What you can do here', paragraphs: ['MyDailyUtils is a growing collection of free, practical tools that run in your browser: finance and tax calculators, date, unit and percentage tools, text and password utilities, image and PDF tools, data formatters, presentations and shop bills.'] },
        { heading: 'Runs on your device', paragraphs: ['Selected files and the numbers you enter are processed in your browser and are not sent to MyDailyUtils for processing. The site itself still loads pages, advertising and other resources over the network.'] },
        { heading: 'Support', paragraphs: ['Use the contact form to report a problem or request a tool.'] },
      ]),
    info('/editorial-policy', EDITORIAL.title, EDITORIAL.subtitle, EDITORIAL.description, EDITORIAL.sections),
    info('/why-trust-us', TRUST.title, TRUST.subtitle, TRUST.description, TRUST.sections),
    info(FREE_NO_LIMITS.path, FREE_NO_LIMITS.title, FREE_NO_LIMITS.subtitle, FREE_NO_LIMITS.description, FREE_NO_LIMITS.sections),
    ...HUBS.map((hub) => {
      const ids = COLLECTIONS.find((collection) => collection.id === hub.collection)?.tools ?? [];
      const listed = ids.map((id) => TOOLS.find((tool) => tool.id === id)).filter((tool): tool is ToolItem => Boolean(tool && tool.isAvailable));
      const extras = HUB_EXTRAS[hub.path];
      const taskSections = extras ? [
        { heading: 'What can I do here?', paragraphs: extras.tasks.map((row) => `${row.task}: ${row.name}. ${row.note}`) },
        { heading: 'Ideas for your situation', paragraphs: extras.situations.map((item) => `${item.who}: ${item.text}`) },
      ] : [];
      const guides = hubGuides(hub);
      const faqSet = HUB_FAQS[hub.path];
      const guideSections = guides.length > 0 ? [{ heading: 'How-to guides for this section', paragraphs: guides.map((guide) => `${guide.title}. ${guide.description}`) }] : [];
      const faqSections = faqSet ? [{ heading: 'Common questions', paragraphs: faqSet.faqs.map((item) => `${item.q} ${plainText(item.a)}`) }] : [];
      return info(hub.path, hub.title, hub.subtitle, hub.description, [...hub.sections.slice(0, 1), ...taskSections, ...guideSections, ...faqSections, ...hub.sections.slice(1), { heading: `All ${listed.length} tools`, paragraphs: listed.map((tool) => `${tool.title}: ${tool.description}`) }]);
    }),
    info('/whats-new', "What's new", 'Improvements to the tools, newest first.',
      'A dated list of what has been added or improved on MyDailyUtils tools and calculators.',
      UPDATES.map((update) => ({ heading: `${formatUpdateDate(update.date)}: ${update.tool} - ${update.title}`, paragraphs: [update.summary] }))),
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
