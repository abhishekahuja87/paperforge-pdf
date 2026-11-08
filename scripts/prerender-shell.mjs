/**
 * Writes a static HTML page for every route after `vite build`.
 *
 * Each page is dist/index.html with its own <title>, description, canonical and social tags,
 * plus a plain-HTML copy of the page text (heading, steps, FAQs and links to every tool)
 * inside <div id="root">. React replaces that content as soon as the app loads, so visitors
 * get the normal app while crawlers that do not run JavaScript get real content.
 *
 * Input:  dist/index.html (from `vite build`) and dist-ssr/shellData.js (from
 *         `vite build --ssr src/prerender/shellData.ts --outDir dist-ssr`).
 * Output: dist/<route>/index.html for every route; the home page content is written to dist/index.html.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = process.env.PRERENDER_DIST_DIR ?? join(root, 'dist');
const ssrDir = process.env.PRERENDER_SSR_DIR ?? join(root, 'dist-ssr');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const ROOT_PLACEHOLDER = '<div id="root"></div>';

/** Replace the first match of `pattern` and fail loudly if the template no longer contains it. */
function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`index.html template is missing ${label}`);
  return html.replace(pattern, () => replacement);
}

function withHead(template, page, site) {
  const pageTitle = page.kind === 'home' ? null : `${page.title} | ${site.shortName}`;
  const canonical = new URL(page.path, site.url).toString();
  const description = escapeHtml(page.description);
  let html = template;
  if (pageTitle) {
    const title = escapeHtml(pageTitle);
    html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, '<title>');
    html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`, 'meta description');
    html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`, 'og:title');
    html = replaceOnce(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`, 'og:description');
    html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title');
    html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description');
  }
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`, 'canonical link');
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`, 'og:url');
  if (page.jsonLd?.length) {
    // Escape "<" so page text can never close the script element.
    const json = JSON.stringify(page.jsonLd).replaceAll('<', '\\u003c');
    html = replaceOnce(html, /<\/head>/, `<script type="application/ld+json" id="page-jsonld">${json}</script></head>`, '</head>');
  }
  return html;
}

const SHELL_STYLE = `<style>
.prerender-shell{max-width:56rem;margin:0 auto;padding:1.5rem 1rem 3rem;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1c1917}
.prerender-shell a{color:#c2410c}
.prerender-shell h1{font-size:2rem;line-height:1.15;margin:1rem 0 .5rem}
.prerender-shell h2{font-size:1.25rem;margin:1.75rem 0 .5rem}
.prerender-shell h3{font-size:1rem;margin:1rem 0 .25rem}
.prerender-shell ul{padding-left:1.25rem}
.prerender-shell li{margin:.35rem 0}
</style>`;

function linkList(links) {
  return `<ul>${links.map((link) => `<li><a href="${escapeHtml(link.path)}">${escapeHtml(link.title)}</a>${link.description ? ` &ndash; ${escapeHtml(link.description)}` : ''}</li>`).join('')}</ul>`;
}

function shellBody(page, groups, text, site) {
  const parts = [
    SHELL_STYLE,
    `<div class="prerender-shell">`,
    `<header><p><a href="/"><strong>${escapeHtml(site.name)}</strong></a></p></header>`,
    `<main>`,
    `<h1>${escapeHtml(page.heading)}</h1>`,
    `<p>${escapeHtml(page.subtitle)}</p>`,
  ];

  if (page.kind === 'info' && page.description && page.description !== page.subtitle) {
    parts.push(`<p>${escapeHtml(page.description)}</p>`);
  }

  if (page.kind === 'tool') {
    parts.push(`<p>${escapeHtml(text.localProcessing)}</p>`);
  }

  for (const section of page.article ?? []) {
    parts.push(`<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`);
  }

  if (page.steps.length > 0) {
    parts.push(`<section><h2>${escapeHtml(text.howToUse)}</h2><ol>${page.steps
      .map((step) => `<li><strong>${escapeHtml(step.title)}</strong> &ndash; ${escapeHtml(step.description)}</li>`)
      .join('')}</ol></section>`);
  }

  if (page.faqs.length > 0) {
    parts.push(`<section><h2>${escapeHtml(text.questions)}</h2>${page.faqs
      .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
      .join('')}</section>`);
  }

  parts.push(`</main>`);
  parts.push(`<nav aria-label="${escapeHtml(text.allTools)}">`);
  parts.push(`<h2>${escapeHtml(text.allTools)}</h2>`);
  for (const group of groups) {
    parts.push(`<h3>${escapeHtml(group.name)}</h3>${linkList(group.links)}`);
  }
  parts.push(`<h3>${escapeHtml(text.company)}</h3>`);
  parts.push(linkList([
    { path: '/about', title: text.about, description: '' },
    { path: '/contact', title: text.contact, description: '' },
    { path: '/privacy', title: text.privacyPolicy, description: '' },
    { path: '/terms', title: text.terms, description: '' },
  ]));
  parts.push(`</nav></div>`);
  return parts.join('');
}

async function loadShellData() {
  const files = await readdir(ssrDir);
  const entry = files.find((name) => /^shellData\.(m?js)$/.test(name));
  if (!entry) throw new Error(`shellData build output not found in ${ssrDir}`);
  return import(pathToFileURL(join(ssrDir, entry)).href);
}

async function main() {
  const template = await readFile(join(distDir, 'index.html'), 'utf8');
  if (!template.includes(ROOT_PLACEHOLDER)) {
    throw new Error(`dist/index.html does not contain ${ROOT_PLACEHOLDER}; was it already processed?`);
  }

  const { getShellPages, getShellGroups, SHELL_SITE, SHELL_TEXT } = await loadShellData();
  const pages = getShellPages();
  const groups = getShellGroups();

  let written = 0;
  for (const page of pages) {
    const html = withHead(template, page, SHELL_SITE)
      .replace(ROOT_PLACEHOLDER, () => `<div id="root">${shellBody(page, groups, SHELL_TEXT, SHELL_SITE)}</div>`);
    const target = page.path === '/'
      ? join(distDir, 'index.html')
      : join(distDir, page.path.replace(/^\//, ''), 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    written += 1;
  }
  console.log(`prerender-shell: wrote ${written} static pages to ${distDir}`);
}

main().catch((error) => {
  console.error(`prerender-shell failed: ${error.message}`);
  process.exit(1);
});
