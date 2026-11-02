================================================================================
PROJECT ARCHITECTURE & CONTEXT CHEATSHEET (README.txt)
Use this file to instantly bootstrap fresh chats with zero context loss.
================================================================================

1. PROJECT SUMMARY
------------------
Name: PaperForge / MyDailyUtils
Objective: Browser-based utilities for PDF, image, data, display, and business tasks.
Core Principle: Supported file operations run in the user's browser. Selected files
are not uploaded to MyDailyUtils for processing; the site itself still makes
network requests for pages, third-party resources, and advertising.

================================================================================
CRITICAL ARCHITECTURAL LAW: KEEP USER FILES LOCAL
================================================================================
All file-processing tools across EVERY category MUST keep selected file contents,
file names, and previews in the browser. Do not send them to a remote service.

This is a local file-processing design, not an air-gapped website. The website
loads external resources and Google AdSense ads. The Contact form sends the name,
email address, and message the user submits to Web3Forms so it can deliver the
message. These requests are separate from file processing.

1. In-Browser File Processing:
   - PDFs: pdf-lib and PDF.js run in the browser; PDF.js may load character-map
     support files from jsDelivr for some documents.
   - Images: HTML5 Canvas / Web Workers
   - Encoders/Decoders: Native Web APIs (SubtleCrypto, TextEncoder, Blob)

2. Failure Safeguard:
   If a proposed feature technically demands a remote server or cloud pipeline
   (e.g., heavy server-side OCR or AI transcription that cannot run locally),
   do not upload user files to provide it. Prefer an in-browser engine or clearly
   explain that the feature is not available locally.
================================================================================

2. CORE TECH STACK
------------------
- Framework: React 19 + TypeScript
- Build Tool: Vite
- Package Manager: pnpm
- Styling: Tailwind CSS v4
- Icons: Lucide React
- PDF Libraries: pdf-lib, PDF.js, and pdfmake; file operations run in the browser
- Hosting / CI/CD: AWS Amplify (connected to GitHub main branch)
- OS / Shell: Windows 11 / PowerShell

3. DESIGN SYSTEM & ARCHITECTURAL PATTERNS
-----------------------------------------
- Decoupled Hierarchy:
    1. Config: `src/config/tools.ts` (registry, metadata, categories, icons)
    2. Engine: `src/lib/pdf/[tool].ts` (pure binary manipulation functions)
    3. UI Component: `src/components/tools/[ToolName].tsx` (state, drag-and-drop, UI)
    4. Route Page: `src/pages/[ToolPage].tsx` (page metadata, ToolGuide, layout)
- Layout Standard:
    Every tool page uses `ToolLayout` containing:
    - Header
    - Tool Container
    - `ToolGuide` (task instructions, FAQs, and a processing note)
    - One clearly labeled `AdBanner` after the tool and guide, configured in
      `src/config/ads.ts`
- Search and Sharing:
    `PageMetadata` updates page titles, descriptions, canonical URLs, and social
    metadata for client-side routes. `public/robots.txt` and `public/sitemap.xml`
    describe the crawlable public routes.
- Dynamic Branding:
    Global site name is referenced dynamically via `siteConfig.name`.
- Collision-Free File Naming (`src/lib/pdf/naming.ts`):
    Utility function `generatePdfFilename(base, tool, details)` generates:
    `[clean_basename]_[tool]_[details]_[YYYYMMDD_HHMMSS].pdf`
- Live Dirty-State Tracking:
    Tool components track `lastGeneratedKey` vs `currentSettingsKey`. If the user
    modifies parameters post-generation, UI flags unsaved changes and updates
    the download action to prevent downloading outdated files.

4. SELECTED IMPLEMENTED TOOLS & ROUTES
--------------------------------------
The examples below are not exhaustive. `src/config/tools.ts` is the current tool
registry and `src/App.tsx` defines the public routes.
1. Merge PDF:
   - Route: `/merge-pdf`
   - Engine: `src/lib/pdf/merge.ts`
   - Component: `src/components/tools/MergePdf.tsx`
   - Page: `src/pages/MergePage.tsx`
   - Features: Reorder files (Up/Down), remove file, local multi-file merge.

2. Split PDF:
   - Route: `/split-pdf`
   - Engine: `src/lib/pdf/split.ts`
   - Component: `src/components/tools/SplitPdf.tsx`
   - Page: `src/pages/SplitPage.tsx`
   - Features: Extract specific pages/ranges (e.g., 1-3, 5, 8-10), validation.

3. Rotate PDF:
   - Route: `/rotate-pdf`
   - Engine: `src/lib/pdf/rotate.ts`
   - Component: `src/components/tools/RotatePdf.tsx`
   - Page: `src/pages/RotatePage.tsx`
   - Features: 90 CW, 180 flip, 270 CCW; apply to all, odd, even, or custom ranges.

4. Sample PDF Generator & QA Sandbox:
   - Route: `/generate-sample-pdf`
   - Engine: `src/lib/pdf/generateSample.ts`
   - Component: `src/components/tools/GenerateSamplePdf.tsx`
   - Page: `src/pages/GenerateSamplePage.tsx`
   - Features:
     * Templates: Invoice, Multipage Article, Contract/NDA, Spec Sheet, Minimal.
     * Synthetic PII / DLP: Mock credit cards (Luhn compliant), fake tax IDs,
       and simulated OCR redaction blocks for testing compliance scrapers.
     * Mixed Geometry Stress Preset: Combined A4, A3 Landscape, 90 deg rotated,
       and long POS receipt pages in a single document.
     * QA Chaos Corruptions: Truncated EOF (network drop), broken magic header
       bytes, and scrambled cross-reference tables (XRef) for upload pipeline testing.
     * Optional Elements: Bookmarks tree, sample images, form fields, highlight layers.
     * Size Inflation: 1MB, 5MB, 10MB test payload padding.

5. Delete PDF Pages:
   - Route: `/delete-pdf-pages`
   - Engine: `src/lib/pdf/deletePages.ts`
   - Component: `src/components/tools/DeletePagesPdf.tsx`
   - Page: `src/pages/DeletePagesPage.tsx`
   - Features: Remove specific pages/ranges, quick first/last page stripping,
     enforces at least 1 page retention.

6. Compress PDF:
   - Route: `/compress-pdf`
   - Engine: `src/lib/pdf/compress.ts`
   - Component: `src/components/tools/CompressPdf.tsx`
   - Page: `src/pages/CompressPage.tsx`
   - Features: Basic Lossless vs. Strong optimization (metadata/XMP/thumbnail stripping, cross-reference object stream consolidation), before/after size metrics and percentage savings calculation.

7. Image to PDF:
   - Route: `/image-to-pdf`
   - Engine: `src/lib/pdf/imagesToPdf.ts`
   - Component: `src/components/tools/ImagesToPdf.tsx`
   - Page: `src/pages/ImagesToPdfPage.tsx`
   - Features: Multi-image upload (JPG, PNG, WebP via Canvas), drag-and-drop, Move Up/Down reordering, page sizing presets (A4 Portrait/Landscape, US Letter, Fit to Image), margin control, collision-free timestamped exports.

8. Add Page Numbers:
   - Route: `/add-page-numbers`
   - Engine: `src/lib/pdf/pageNumbers.ts`
   - Component: `src/components/tools/AddPageNumbers.tsx`
   - Page: `src/pages/AddPageNumbersPage.tsx`
   - Features: 6 placement positions (Top/Bottom Left, Center, Right), formats (Page X of Y, Slash, Number only, Hyphenated), typography selection, font size, page margins, cover page skip, start count offset.

9. Watermark PDF:
   - Route: `/watermark-pdf`
   - Engine: `src/lib/pdf/watermark.ts`
   - Component: `src/components/tools/WatermarkPdf.tsx`
   - Page: `src/pages/WatermarkPage.tsx`
   - Features: Custom text watermark, quick presets (CONFIDENTIAL, DRAFT, SAMPLE, DO NOT COPY), custom hex colors, font size (18-96pt), rotation (-90° to 90°), opacity (5%-100%), font selection, page scope (All, Odd, Even, Custom range).

10. Crop PDF:
    - Route: `/crop-pdf`
    - Engine: `src/lib/pdf/crop.ts`
    - Component: `src/components/tools/CropPdf.tsx`
    - Page: `src/pages/CropPage.tsx`
    - Features: Trim margins uniformly or individually (Top, Bottom, Left, Right), multi-unit input (pt, mm, in), quick trim presets (Bleed Clean, Header & Footer, Side Margins), page scope (All, Odd, Even, Custom range), live dimension calculations.

11. Sanitize PDF:
    - Route: `/sanitize-pdf`
    - Engine: `src/lib/pdf/sanitize.ts`
    - Component: `src/components/tools/SanitizePdf.tsx`
    - Page: `src/pages/SanitizePage.tsx`
    - Features: Strips standard Document Info (Author, Title, Creator, Producer), XMP metadata & revision history, PieceInfo application workspaces (Illustrator, InDesign, Word), embedded page thumbnails, JavaScript/OpenAction execution hooks, and embedded file attachments.

12. N-Up PDF (Pages Per Sheet):
    - Route: `/n-up-pdf`
    - Engine: `src/lib/pdf/nUp.ts`
    - Component: `src/components/tools/NUpPdf.tsx`
    - Page: `src/pages/NUpPage.tsx`
    - Features: 2-Up (side-by-side) and 4-Up (2x2 grid) page consolidation, A4/US Letter (Portrait/Landscape), custom gutter spacing, optional border outlines, automatic sheet count reduction calculation.

13. Inspect PDF (Developer & QA Forensics):
    - Route: `/inspect-pdf`
    - Engine: `src/lib/pdf/inspect.ts`
    - Component: `src/components/tools/InspectPdf.tsx`
    - Page: `src/pages/InspectPage.tsx`
    - Features: Analyzes PDF specification versions, Info dictionaries, XMP streams, encryption status, embedded thumbnail caches, JavaScript execution hooks, and page geometry bounding boxes.

14. Protect PDF:
    - Route: `/protect-pdf`
    - Engine: `src/lib/pdf/protect.ts`
    - Component: `src/components/tools/ProtectPdf.tsx`
    - Page: `src/pages/ProtectPage.tsx`
    - Features: In-memory password encryption, separate User and Owner passwords, permissions toggling (printing, text copying), zero-server execution.

5. ADVERTISING, CONTACT, AND LOCAL PREFERENCES
-----------------------------------------------
- Google AdSense is loaded from `index.html`; publisher and ad-unit IDs are
  configured in `src/config/ads.ts`. `public/ads.txt` identifies the publisher.
- A Google Analytics script is not currently configured. Do not add a placeholder
  measurement ID; update the Privacy Policy if analytics is introduced later.
- Contact form submissions are sent to Web3Forms. The Contact page and Privacy
  Policy disclose this separate third-party request.
- Tool visit counts are kept in browser local storage for usage labels. No selected
  file data is stored there.
- Review consent and regional advertising requirements in the AdSense account;
  those settings cannot be verified from this repository alone.

6. KEY SOURCE LOCATIONS
-----------------------
- Routes: `src/App.tsx`
- Tool registry and descriptions: `src/config/tools.ts`
- Shared site and advertising settings: `src/config/site.ts`, `src/config/ads.ts`
- Per-route metadata: `src/components/common/PageMetadata.tsx`
- Shared tool layout and guides: `src/components/layout/ToolLayout.tsx`,
  `src/components/common/ToolGuide.tsx`
- Public crawler files: `public/robots.txt`, `public/sitemap.xml`, `public/ads.txt`
- Tool implementations and route pages: `src/components/tools/`, `src/pages/`
- AWS Amplify deployment: configure a `200 (Rewrite)` rule from extensionless
  app routes to `/index.html` in Hosting > Rewrites and redirects. Without it,
  direct requests to routes such as `/privacy` return 404 on the live site.

================================================================================