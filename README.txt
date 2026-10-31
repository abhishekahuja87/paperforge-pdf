================================================================================
PROJECT ARCHITECTURE & CONTEXT CHEATSHEET (README.txt)
Use this file to instantly bootstrap fresh chats with zero context loss.
================================================================================

1. PROJECT SUMMARY
------------------
Name: PaperForge / MyDailyUtils
Objective: Secure, high-performance, 100% client-side PDF utility suite.
Core Principle: Zero server upload/storage. All PDF operations execute strictly
in browser memory via WebAssembly/pure client execution.

================================================================================
CRITICAL ARCHITECTURAL LAW: 100% AIR-GAPPED CLIENT-SIDE INTEGRITY
================================================================================
All current and future tools across EVERY category (PDF, Images, Security, 
Converters, Formatters, Text Utilities) MUST strictly obey the "Air-Gap Test":

1. Zero Network Packets on User Data:
   Once the static application assets (JS, CSS, fonts, wasm) finish loading,
   the app MUST function 100% offline with Wi-Fi / Ethernet disconnected.
   No tool is ever permitted to send user files, byte buffers, file names,
   or previews across the wire.

2. Pure In-Browser Execution Engines Only:
   - PDFs: pdf-lib / WebAssembly
   - Images: OffscreenCanvas / HTML5 Canvas / Web Workers
   - Encoders/Decoders: Native Web APIs (SubtleCrypto, TextEncoder, Blob)
   - Zero third-party telemetry, tracking pixels on documents, or external API relays.

3. Failure Safeguard:
   If a proposed feature technically demands a remote server or cloud pipeline
   (e.g., heavy server-side OCR or AI transcription that cannot run locally in WASM),
   it CANNOT be implemented unless an in-browser WASM engine (e.g., Tesseract.js)
   can execute it completely offline on the user's hardware.
================================================================================

2. CORE TECH STACK
------------------
- Framework: React 19 + TypeScript
- Build Tool: Vite
- Package Manager: pnpm
- Styling: Tailwind CSS v4
- Icons: Lucide React
- PDF Engine: pdf-lib (pure in-browser binary manipulation)
- Hosting / CI/CD: AWS Amplify (connected to GitHub main branch)
- OS / Shell: Windows 11 / PowerShell

3. DESIGN SYSTEM & ARCHITECTURAL PATTERNS
-----------------------------------------
- Decoupled Hierarchy:
    1. Config: `src/config/tools.ts` (registry, metadata, categories, icons)
    2. Engine: `src/lib/pdf/[tool].ts` (pure binary manipulation functions)
    3. UI Component: `src/components/tools/[ToolName].tsx` (state, drag-and-drop, UI)
    4. Route Page: `src/pages/[ToolPage].tsx` (SEO metadata, ToolGuide, layout)
- Layout Standard:
    Every tool page uses `ToolLayout` containing:
    - Header
    - Tool Container
    - `ToolGuide` (SEO How-To step workflow + detailed FAQs)
    - Bottom `AdSlot` (ads restricted strictly to bottom to protect UX)
- Dynamic Branding:
    Global site name is referenced dynamically via `siteConfig.name`.
- Collision-Free File Naming (`src/lib/pdf/naming.ts`):
    Utility function `generatePdfFilename(base, tool, details)` generates:
    `[clean_basename]_[tool]_[details]_[YYYYMMDD_HHMMSS].pdf`
- Live Dirty-State Tracking:
    Tool components track `lastGeneratedKey` vs `currentSettingsKey`. If the user
    modifies parameters post-generation, UI flags unsaved changes and updates
    the download action to prevent downloading outdated files.

4. CURRENTLY IMPLEMENTED TOOLS & ROUTES (8 TOTAL)
-------------------------------------------------
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

5. PENDING / ROADMAP ITEMS
--------------------------
- Google AdSense & Google Analytics 4 integration (`src/config/adsAndAnalytics.ts`
  and `src/components/common/AdSlot.tsx` are scaffolded, awaiting production IDs).
- Next candidate tools (100% In-Browser & Offline-Verified):
  * Protect / Unlock PDF (Password encryption/decryption)
  * PDF to Image / PDF to JPG (Render pages via Canvas to individual image downloads/ZIP)
  * Watermark PDF (Stamp custom diagonal text or logo overlay)
  * Crop / Trim PDF (Adjust crop boxes and media boxes)

6. VERIFIED SOURCE DIRECTORY TREE
---------------------------------
src/
|-- assets/
|   |-- hero.png, react.svg, vite.svg
|-- components/
|   |-- common/
|   |   |-- AdSlot.tsx
|   |   |-- ToolGuide.tsx
|   |   |-- UnifiedHero.tsx
|   |-- layout/
|   |   |-- Footer.tsx
|   |   |-- Header.tsx
|   |   |-- ToolLayout.tsx
|   |-- tools/
|       |-- AddPageNumbers.tsx
|       |-- CompressPdf.tsx
|       |-- DeletePagesPdf.tsx
|       |-- GenerateSamplePdf.tsx
|       |-- ImagesToPdf.tsx
|       |-- MergePdf.tsx
|       |-- RotatePdf.tsx
|       |-- SplitPdf.tsx
|-- config/
|   |-- adsAndAnalytics.ts
|   |-- site.ts
|   |-- tools.ts
|-- lib/
|   |-- storage.ts
|   |-- pdf/
|       |-- compress.ts
|       |-- deletePages.ts
|       |-- generateSample.ts
|       |-- imagesToPdf.ts
|       |-- merge.ts
|       |-- naming.ts
|       |-- pageNumbers.ts
|       |-- rotate.ts
|       |-- split.ts
|-- pages/
|   |-- AddPageNumbersPage.tsx
|   |-- CompressPage.tsx
|   |-- DeletePagesPage.tsx
|   |-- GenerateSamplePage.tsx
|   |-- HomePage.tsx
|   |-- ImagesToPdfPage.tsx
|   |-- MergePage.tsx
|   |-- RotatePage.tsx
|   |-- SplitPage.tsx
|-- App.css
|-- App.tsx
|-- index.css
|-- main.tsx
================================================================================