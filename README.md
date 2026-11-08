# MyDailyUtils

Browser-based tools for PDFs, images, text and data, presentations, and billing. The application is built with React, TypeScript, Vite, Tailwind CSS, and pnpm.

## Development

- `pnpm install` installs dependencies.
- `pnpm dev` starts the development server.
- `pnpm build` type-checks and builds the application.
- `pnpm lint` runs Oxlint.
- `pnpm preview` serves the production build locally.

## Architecture

- `src/App.tsx` defines the lazy-loaded routes and shared header and footer.
- `src/pages/` connects route-specific headings and guides to tool components.
- The unlisted `/ac1` catalog trial offers designs for 4, 6, 9 or 12 products, including arched, asymmetric, side-panel and list layouts. Its English-only editor uses local sample photos, in-memory text and image edits (uploaded photos fit inside their frames by default, with per-photo zoom and vertical positioning), and browser-side PNG export for A4 and Instagram sizes. Changes are lost on reload.
- `src/components/tools/` contains the interactive tools; `src/lib/pdf/`, `src/lib/media/`, `src/lib/documentStudio/`, `src/lib/display/`, and `src/lib/pos/` contain domain-specific processing and helpers.
- `src/components/layout/ToolLayout.tsx`, `src/components/common/ToolGuide.tsx`, and `src/components/common/FileDropZone.tsx` provide the shared tool-page presentation and file selection patterns. Use the `wide` layout for workspaces that need additional room.
- `src/config/tools.ts` defines the tool catalog and categories. Every tool has a `tier`: `popular` (compact "Most used" tiles), `workspace` (slim "Workspaces" cards using the `featuredTools` copy), `more` (always-expanded "More tools" groups by category) or `advanced` (footer only). Ordering, tier helpers and search are in `src/lib/homePageVariants.ts`; search covers every tier so footer-only tools stay findable. Homepage components live in `src/components/home/`. The footer (`src/components/layout/Footer.tsx`) lists every available tool in category columns plus a Company column.
- `src/components/layout/InfoPageLayout.tsx` provides the shared informational-page presentation. `PageMetadata` manages route metadata and canonical URLs.
- `src/i18n.ts` initializes i18next and react-i18next, persists the language choice locally, and loads one JSON file per language from `src/locales/`. Tool "How to use" steps, catalog copy, category copy, featured cards, shared navigation, and selected page headings, guides and controls have translations. Most tool controls, messages, FAQs, informational pages, and metadata still need to be moved into resources and translated. Shared guide steps use `guideSteps` keys matching route paths; Merge, Split, and Master Document Studio use their own existing resource groups. `usePageGuide` and `usePageFaqs` read migrated page copy from `pageGuides`; `usePageHeading` reads independently migrated headings from `pageHeadings`. The shared file drop zone defaults to the localized single-PDF prompt; other file prompts may still need translation. Keep resource keys and arrays consistent across languages and update guidance when its tool changes. The `merge`, `image`, and `categories` objects are also exposed as i18next namespaces. Do not remove the partial-translation notice until all visible and accessible text is covered and translations are reviewed. `src/lib/localizedTool.ts` supplies catalog copy to navigation and search.
- The Display and POS page guides use `displayPage` and `posPage` resources; their workspaces still contain untranslated controls and messages. The Contact page uses `contactPage`, including its Web3Forms disclosure. About, Privacy and Terms are not yet translated. `InfoPageLayout` defaults content language to English until a page supplies its translated language.
- Master Document Studio and Document Digitization hide their guides while sources are present; Display Studio hides its guide while slides are present and retains its privacy note. Guides return when the workspace is cleared.
- The sample PDF generator uses `sampleControls` for its interface; its editable default document titles and generated sample content are still English. The sample, images-to-PDF, PDF inspector and JSON formatter page headings and FAQs use `pageGuides`. Their remaining tool controls and messages, and other tool-page FAQs and headings, are not all translated.
- Page-numbering, watermark, N-up, sanitize, inspect, protect, unlock, text extraction, PDF-to-image, flatten, organize, and Base64 page headings and FAQs are localized. Their interactive controls, result messages, and reports are not yet fully localized. The N-up, sanitize, and inspect information panels use `toolInfo`; keep their capability and security limitations accurate when updating them.
- `src/config/theme.json` contains the shared background, surface, shadow, and workshop overrides, which `src/main.tsx` exposes as CSS variables. Other Tailwind palette colors, static HTML and icon colors, and tool-specific design or export colors are not yet centralized. Preserve user-selected and generated document colors separately from website theme colors.
- `public/favicon.svg` supplies the browser icon and header mark.

## Processing and privacy

Supported file operations run in the browser; this does not mean that the entire site is offline. The site loads third-party advertising and may request PDF character maps from jsDelivr. The contact form separately sends its submitted details to Web3Forms. The privacy and terms pages describe these boundaries and must remain consistent with actual behavior. Language preferences and tool-visit counts use browser local storage. POS profiles and inventory can be explicitly saved, replaced, loaded, or deleted in IndexedDB via `src/lib/pos/profileStorage.ts`; bills and customer details are not saved there. Profile and bill JSON downloads remain the portable backup. Browser storage can be cleared or unavailable, so it is not a substitute for a backup.

Document digitization uses Tesseract.js with the English model. Vite serves and emits the worker, engine variants and language data from installed npm packages under `ocr-assets/`; they are downloaded from the application origin when needed. OCR runs on the rendered, edited pages after blackouts, and a text-only layer is added to the PDF. Separate output groups copies by source image into a ZIP. OCR is approximate and users should review the result. The digitization workspace does not offer password protection because the existing protection implementation rasterizes the PDF and removes searchable text. The reused Master Studio editor still has English-only controls.

When adding or changing a tool, keep routes, catalog entries, search, guide content, metadata, accessibility, translations, and relevant privacy disclosures consistent. Keep UI composition separate from reusable processing logic. Update this document when architecture or processing boundaries change.
