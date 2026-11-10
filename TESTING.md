# Testing notes

## Baseline: November 8, 2026 (everyday utilities)

Checks for the batch that added 12 tools (simple/compound interest, RD, CAGR, age,
date difference, percentage, discount, unit converter, word counter, case
converter, number to words, password generator) and the general-purpose rebrand.
The working environment for this batch had no installed packages and no network,
so the full `pnpm build` and `pnpm lint` could not be run there. Run both after
merging and treat the first hosted build as the real check.

- The calculation modules in `src/lib/utilities/` were type-checked with `tsc
  --strict` and exercised with a Node script: leap-day and short-month age
  arithmetic, next-birthday on 29 February, weekday counts, text statistics,
  case conversion, rupee amounts in Indian and international words, unit
  factors including temperature, interest, recurring deposit and CAGR figures.
  Two defects found this way (negative days in some month-end ranges and word
  splitting in mixed-case text) were fixed.
- `en.json` was parsed after the edits and every new tool id was confirmed to
  have catalog, steps and article entries.
- The social preview image was regenerated and viewed.
- Not checked: rendering of the new components in a browser, mobile layout,
  the generated static pages and sitemap, other-language fallbacks for new keys.

## Update: November 8, 2026 (calculators batch 3)

Gratuity, lumpsum, inflation, BMI and bill splitter were added. Their maths in
`src/lib/utilities/more.ts` type-checks under `tsc --strict`; spot values
(gratuity 50,000 × 15 × 11 ÷ 26 = 3,17,308; ₹1 lakh after 10 years at 6% inflation
≈ ₹55,839) were checked by hand. `en.json` parses. As before, no build, lint or
browser rendering was possible in that environment; run `pnpm build` and `pnpm lint`.

## Update: November 8, 2026 (depth pass)

Extras added to the new tools. Helper logic was exercised in Node: zodiac date edges,
month-end addition (31 Jan + 1 month = 28 Feb), toggle/alternating case, line clean-up
ops, word statistics, PIN length, guess-time text (40 bits is about 55 seconds at 10
billion guesses a second) and the calorie formula. The components were type-checked
against a minimal stub of React (no real React types were installed), which only
flagged event-handler parameters that the stub leaves untyped. Not checked: browser
rendering, mobile layout, printing, clipboard behaviour, build and lint.

## Update: November 8, 2026 (form photo tools)

The unit-to-pixel conversion was checked in Node (35 × 45 mm at 300 DPI gives 413 × 531
px; 2 inch gives 600 px; 3.5 cm gives 413 px). The resizer component was type-checked
against a React stub with no errors of its own. Not checked: the actual resizing in a
browser with the new background colour, the preset buttons on mobile, the four new
landing pages, build and lint. Test with a real photo and signature after deploying,
and confirm the output size in KB and pixels.

## Update: November 8, 2026 (accessibility round)

Added dialog keyboard handling (`useDialog`) to the six Document Studio dialogs, linked
18 visible labels to their inputs with `htmlFor`/`id` (found by a script that looks for
inputs with no label), added `aria-label` to 11 controls that had none, and enlarged
six small buttons. A script check found no remaining icon-only buttons without a name
and no unlabelled inputs in the tool components (apart from hidden and file inputs).
One wrong label link the script made (Add Page Numbers, skip-first-page checkbox) was
found in review and fixed. Not checked: real keyboard and screen-reader use, focus
return in each dialog, mobile tap targets, build and lint. Test: open each Document
Studio dialog, press Tab repeatedly (focus must stay inside), press Escape (it must
close and focus must return to the button that opened it).

## Update: November 8, 2026 (GST invoice generator)

The GSTIN validator was checked against a known valid number (27AAPFU0939F1ZV passes;
altered, short and wrong-state-code numbers fail). Invoice maths was checked by hand for
an intra-state and an inter-state example (taxable 1,539.97; CGST and SGST 73.60 each;
total 1,687.17 rounded to 1,687; the IGST version differs by one paisa because each
half is rounded separately, which is expected). The component type-checks against a
React stub. Not checked: the print-to-PDF layout in real browsers (especially mobile),
localStorage save and removal, build and lint. Test by printing an invoice to PDF on
desktop and phone and by ticking and unticking 'Remember my business details'.

## Update: November 8, 2026 (twelve new guides)

Twelve guides were added (interest, RD vs FD, gratuity, CAGR, inflation, age on cut-off dates,
GST invoices, photo and signature sizing, passwords, amounts in words, BMI, percentages). Every
tool id they link to was confirmed to exist, and worked numbers were recomputed (for example
31 years 4 months 17 days from 15 Aug 1995 to 1 Jan 2027 with the age code, and the interest,
gratuity, inflation and BMI examples by hand). Statements about tax limits (gratuity ₹20 lakh) and
BMI cut-offs are as the tools use them and should be rechecked when rules change. Not checked:
rendering of the new guide pages, build and lint.

## Update: November 8, 2026 (batch 4: EPF, time zones, developer utilities)

Checked in Node: colour conversions and the WCAG ratio (black on white 21:1), UUID format, epoch
seconds and milliseconds, time zone conversion (9:00 IST is 03:30 UTC and 10:30 pm the previous day
in New York; a July noon in New York is 16:00 UTC), lorem ipsum output and the EPF split (a
₹15,000 wage over one year at 0% gives 28,206 contributed, 21,600 from the employee). Components
type-check against a React stub. Not checked: rendering, the clipboard, the nonexistent-time case
in a daylight saving gap, build and lint.

The November 7 baseline below is historical: it predates the finance, guides,
image resizer and utilities work, and its "27 tool routes" count is out of date
(the catalog now has well over fifty).

## Baseline: November 7, 2026

The following checks were performed on the then-current working tree, including
the document digitization, studio layout, localization, and POS changes. They
are a snapshot, not an automated regression suite or a guarantee for future
changes.

- `pnpm build` passed after fixing an unused import.
- `pnpm lint` passed with two warnings: the date in the footer render and a
  state update in a POS effect.
- `pnpm install --frozen-lockfile --ignore-scripts` and `git diff --check`
  passed.
- All 27 tool routes were opened and their headings checked.
- PDF smoke checks exercised merge, split, rotate, compress, delete pages,
  page numbers, watermark, crop, sanitize, N-up, flatten, PDF-to-images,
  extract text and organize. Output page counts and/or extracted text were
  checked for merge, split, rotate, delete, N-up and page numbering.
- Password protection and unlocking were exercised in sequence; the unlocked
  result was opened and its page count checked. The PDF inspector displayed
  test metadata. A sample PDF was generated.
- Image-to-PDF, image conversion and image compression were exercised with a
  generated image. JSON formatting and Base64 text encoding were checked.
- Master Studio produced a PDF with a linked contents entry. Display Studio
  loaded and played a slide. Their guides hid after adding content and returned
  after clearing it.
- Digitization produced searchable English text from a generated image, and
  separate searchable PDFs in a ZIP. A blackout was drawn and its covered words
  were absent from extracted text in that test. Production preview loaded the
  OCR worker, engine and model from the application origin.
- POS setup, browser profile save and reload, billing, note editing and the
  sharing guard during note editing were exercised. The test profile was
  removed afterwards.
- The desktop featured cards were checked for two columns; the mobile tools
  menu was checked for viewport fit and scrolling. Featured card translations
  were checked in all six languages, and their locale arrays were checked for
  matching lengths.

These are smoke checks with small synthetic files, not exhaustive tests of all
settings, output fidelity, redaction cases, devices, browsers, languages, or
accessibility. The reused digitization editor still has English-only controls.

## Careers pack (manual check needed)

Logic checked in Node: resume checklist findings, month and range formatting, imported-file clean-up, notice-period dates (calendar, working days, months with month-end clamping, buyout, leave, joining gap), file-name clean-up and the size, type, page and name checks. The screens were not run. After deploying: Resume Builder (load the example, change layout/paper, press Print and check that only the resume prints, the PDF text is selectable, the page count matches, Save and Open data file round-trips, the Remember box keeps and clears the saved copy); Notice Period (compare a few dates by hand, check a shared link restores the inputs); Upload File Checker (a large PDF, a protected PDF, a scanned PDF, a JPG and a file named with spaces; the fix links open the right tools).

### Students pack

Logic checked in Node: credit-weighted GPA, CGPA conversions and the next-term target, weighted final grade and the score needed, citation text for APA, MLA, Chicago and Harvard (with and without authors) and the study plan allocation. The screens were not run. After deploying: GPA calculator (all four modes; the 10-point and 4.0 scales; custom points; the target result when it is above the scale); Final Grade (the sample, an empty score, weights not adding to 100); Citation Generator (each style and source type, Copy with italics pasted into a document, the reference list sorting and removal); Study Planner (two subjects, a subject that cannot fit shows the warning, weekday buttons, copy and print).

## Shareable links (manual check needed)

Not run in the sandbox. On EMI, Unit converter (change the unit type to Temperature and pick units), Time zone converter, HRA (tick metro), Date difference (Add or subtract mode) and Percentage: change the inputs, press Copy link, open the link in a new tab and confirm every input and the result match. A tampered value (letters in a number field, an unknown option) must be ignored, and the address bar should lose its query once the page loads.

## Password-protected PDFs (manual check needed)

Not run in the sandbox. After deploying, upload a password-protected PDF to Split, Rotate, Compress, Merge and Organize. Expect a password dialog; a wrong password shows an error and stays open; the right password continues with the pages; Skip file drops it; an owner-password-only file opens with the field left empty.

## Performance note (static review, not measured)

The sandbox cannot run `pnpm build`, so the per-tool lazy loading in `UtilityPage` was checked only by reading the code and imports. After the next Amplify build, compare chunk sizes in the build log and run Lighthouse on `/` and one utility page.

## Future changes

Start with focused checks for the changed behavior and its directly affected
surfaces. Expand to broader checks when shared code, dependencies, risk, or a
failure warrants it; do not treat the baseline above as proof for new changes.

### Freelancers pack

Logic checked in Node: rate build-up (tax, overhead, benefits, buffer, billable hours), income at a given rate, project price, margin and markup conversions, price for a target margin, discount impact, break-even, quotation totals with rounding, payment split adding up exactly. The screens were not run. After deploying: Freelance Rate (change each input and watch the rate; the check-my-rate and project boxes; a shared link restores the numbers); Quotation (add items, discount, tax, deposit and a 30,40,30 split; Print and check only the quotation prints; the remember box keeps and clears details after reload; a split that does not total 100 shows the warning); Margin (all four modes; 40% margin = 66.67% markup; a discount that removes all profit).

### Page depth

41 core tool pages gained two extra article sections and two FAQs each (`locales/depth/core.en.json`). After deploying, open a few (for example /case-converter, /emi-calculator, /watermark-pdf) and check that the new sections show before the Privacy section, the FAQ list ends with the privacy question, and nothing is duplicated in the page or in the prerendered HTML.

### Page depth, second round

A further 18 PDF, image and utility pages gained extra sections and FAQs (rotate PDF gets sections only). Spot-check /rotate-pdf, /resize-image-to-50kb and /protect-pdf for the new sections before the closing Limits and privacy section.

### New guides

Seven guides were added (GPA and CGPA, citations, freelance rate, margin vs markup, resume, study planning, notice period). Check /guides lists them, each opens, the "Try it" tool links work, and the sitemap has the seven URLs.

### Stationery pack (paper maker)

Geometry checked in Node: for all seven styles in portrait and landscape (and isometric in all four modes) no line, dot or text lies outside the printable area; binding margins on the front, back and landscape; segment clipping; settings validation and file round trip; presets. The screens and the PDF export were not run. After deploying: on /printable-paper-maker try each style and preset and check the preview changes at once; Download PDF for 1 page and for 50 pages (file stays small, opens, lines are sharp when zoomed); Print this sheet (only the sheet prints, at the page size); with Binding and Switch edge on, 2+ pages, compare Front and Back preview and the PDF; page numbers with a start number; Save and Load settings round trip; a margin below 5 mm shows the warning; habit names with non-Latin letters show as ? in the PDF. Also open /dot-grid-paper-generator, /graph-paper-generator and /cornell-notes-template and check each opens on its template.

### Planners pack

Layout checked in Node for all four kinds in portrait and landscape: nothing falls outside the page area; November 2026 with a Monday start puts day 1 in the last column; weekly headings; month rollover from December to January; Spanish, French and German names. Screens and the PDF were not run. After deploying: /printable-planner-maker, /printable-calendar-maker and /daily-planner-printable each open on the right kind; change month, year, week start and language and watch the preview; count 12 gives 12 pages and the previous/next buttons work; Download PDF opens with the same pages; Print this page prints one page; paper-maker FAQs now mention the clef, non-Latin names and printing bundles.

### QR pack

The encoder was checked in Node against OpenCV's QR decoder for 11 strings (versions 1 to 36, all four error correction levels, unicode, a Wi-Fi string, 2,400 bytes) and every one decoded to the original text; the payload builders for Wi-Fi (with escaped characters), vCard, event, geo, SMS, email and link decoded correctly too. Screens were not run. After deploying: /qr-code-generator, /wifi-qr-code-generator and /vcard-qr-code-generator open on the right content type; scan each code with an iPhone and an Android phone (Wi-Fi should offer to join, contact to save, event to add); change colours and see the low-contrast and inverted warnings; add a logo and confirm error correction switches to High and the code still scans; PNG sizes 512 to 4096 and SVG download; the green "read back" tick shows in Chrome and is absent (no error) in browsers without BarcodeDetector; "Print the sheet" prints only the copies with captions; pasting more than about 2,900 characters shows the too-much-data message.

### Paper maker extras

Layout checked in Node for hexagon (pointy and flat), calligraphy, cross-stitch and storyboard in portrait and landscape with 3-hole guides and a corner label: nothing falls off the page; the two-up layout gives 297 x 210 mm and is ignored for A4; share links round-trip unicode text; out-of-range values are clamped. The four new sheets were also drawn to an image and looked right (no doubled hexagon edges, slant lines clipped to the writing area, panels in the chosen ratio). Screens and PDF were not run. After deploying: the Paper style list shows 11 styles; /hexagon-graph-paper-generator, /calligraphy-practice-sheet-generator and /cross-stitch-pattern-grid-generator open on the right style; hexagon radius 14.5 mm gives about 1 inch hexes (measure after printing); calligraphy presets 55, 52 and vertical change the lean; cross-stitch 14 count squares measure 1.8 mm; storyboard ratio buttons change the panels; hole guides at 2, 3 and 4 holes appear and the pattern moves clear of them; the corner label moves with the position buttons; A5 portrait plus Two-up gives an A4 landscape PDF with a dashed centre line; Copy link to these settings, then open it in a new tab: same sheet.

### vCard converter

Parser checked in Node: vCard 3.0 with folded lines, escapes and a skipped base64 photo; 2.1 with quoted-printable UTF-8 (Turkish names) including soft line breaks; grouped item1.TEL with an Apple-style label; the result is identical for 200 random chunk splits of the same text; empty cards are counted and skipped; a CSV cell starting with = gets an apostrophe. 150,000 contacts (34 MB) parsed in about 1 s and tabled in under 0.5 s. The XLSX parts were written to disk, zipped and opened with openpyxl (frozen header, bold header, filter, text cells, control characters removed). The screen and a real browser download were not run. After deploying: /vcard-to-csv-converter; export a real phone or Google contacts .vcf (ideally with photos and 5,000+ contacts) and convert; try two files at once; check the counts match the phone; open the .xlsx in Excel and Google Sheets (phone numbers keep +); open the CSV in Excel with and without the Keep + option; duplicates toggle changes the count; a 200 MB+ file shows progress and does not freeze the tab.

### Flashcards

Layout checked in Node against an independent physical model (flip the sheet, see where each back card lands) for portrait and landscape, long and short edge, five grids and two gap sizes: 336 cards, none misaligned. Parser checked for bar, tab and :: separators, \n breaks, quoted CSV. Page rendering checked in headless Chromium: front and back, mirrored columns, shrink-to-fit, long unbroken words, Cyrillic, Greek, accents and Japanese, fold mode with corner ticks. The React screen and the PDF download were not run. After deploying: /printable-flashcard-maker and /double-sided-flashcards-printable; the sample deck shows 8 cards; page 2 (back) has the columns swapped; download the alignment test, print it double-sided and hold it to the light (FRONT n behind BACK n), then try the other flip edge if not; landscape with long edge; fold mode one-sided; import a CSV from Google Sheets and one from Quizlet/Anki; a Hindi or Arabic deck prints in the right script; 100+ cards builds with the progress percentage; print at Actual size and measure a card.

### Deferred items (locale split, Document Studio, pdf.js cleanup)

Checked in the sandbox: en.json round trip equals the old merged data; locale modules type-check; esbuild sizes (core 14.6 KB gzip eager, content 129 KB gzip lazy, was 142 KB eager). `tsc` and `vite build` were not run here.

Check after deploy:
- Open a tool page directly by URL: guide, FAQ and article appear after a brief load, no raw keys such as `pageGuides.x` show.
- Home page and tool search work; Network tab shows a separate content chunk.
- Block the content chunk (offline): home still works; a tool page recovers on retry.
- Document Studio: file names in Hindi or Russian as contents titles, a Hindi watermark, and a Cyrillic page-number format all export legibly; Latin text stays selectable.
- Organize PDF and Unlock: load a good file, a corrupt file and a wrong password; no console errors, memory does not climb across repeats.
- Non-English locales are hidden, so they were not updated; they fall back to English.

### Group settle-up, Screenshot Redactor, slug mode

Checked in the sandbox: `allocate` always sums to the total (2,000 random cases); `minimalTransfers` settles every balance and matches a brute-force minimum on 400 random groups of 2 to 8; a 25-person greedy case settles; slugify cases (accents, apostrophes, Hindi kept, symbols only gives empty); redaction in headless Chromium (solid box exact colour, pixelate yields a few flat tiles, pixels outside boxes unchanged, drag then Download gives an image with the box burned in); Group Settle and Redactor screens mounted with React in Chromium (add expense, payments listed, picture 1080 px wide, equal mode still works). `tsc` and `vite build` were not run.

Check after deploy:
- Bill Splitter: Equal split still gives the same numbers as before; no rupee sign anywhere; old share links with round=5 still open correctly.
- Group settle-up on a phone: add 4 people, 3 expenses (one with Unequal shares and one person left out), check the payments add up by hand; Download picture and Copy picture; reload the page and confirm the data is still there; Clear all.
- Screenshot Redactor on a phone: choose a screenshot, drag a box with a finger, turn off Draw mode and scroll, undo, download PNG and JPG, open the saved file and confirm the covered text cannot be read. On desktop test Ctrl+V of a copied screenshot and the Paste from clipboard button (Safari may ask permission).
- Large image (for example 4000 by 8000 px) stays responsive; an image above 80 megapixels shows the message.
- Case converter: URL slug for "Café Münster: Don't Miss!" gives cafe-munster-dont-miss.
- New page /screenshot-redactor appears in search, home page list, footer and sitemap, and its static HTML has the heading and FAQ.

### Home page redesign (trial)

Checked in the sandbox: with the real catalogue, all 96 available tools get a link on the home page (92 in topics plus 4 workspaces), none twice, none left in "More tools"; type-check of the changed files (only missing-package noise); render in Chromium without errors. Not checked: how it looks, because the sandbox has no Tailwind CSS, and `tsc`/`vite build` were not run.

Check after deploy (phone first):
- Page order: search, topic chips, Most used (12), New tools (scrolls sideways on a phone), slim Workspaces, then 9 topic panels.
- Workspaces row is small (two per row on a phone) and each card opens its tool.
- Each topic panel shows up to 6 tools plus "Show N more"; tapping opens the rest. The Images panel has KB chips (20, 30, 50, 100, 200).
- Topic chips jump to the right panel and the heading is not hidden under the header.
- Long tool names are shortened (for example "Printable Flashcard Maker") and none overflow.
- Search still finds every tool, including ones that were footer-only before.
- Page length on a phone is acceptable; if it is too long, lower `COLLECTION_PREVIEW` in `src/config/homeSections.ts`.

### Home page polish

Checked in the sandbox (Chromium, real catalogue, no CSS): the PDF topic shows 6 tiles and "Show 13 more"; pressing it shows all 19 and the button becomes "Show fewer" below the tiles; pressing again folds back; `aria-expanded` follows. The earlier "all tiles highlight on hover" came from the fold container sharing the `group` class with the tiles; the container no longer uses it. Looks were not checked (no Tailwind in the sandbox).

Check after deploy:
- Hover one tile inside an opened topic: only that tile highlights.
- The button stays below the tiles when open and says Show fewer.
- Workspace cards show the heading, the use-case label and the full description; none are cut off.
- Topic tiles are small (two per row on a phone), names are shortened and the full description appears when you hover or long-press.
- Topic descriptions read well and the "New" tag shows on the recently added tools.

### Home page: one column on phones

Check after deploy: on a phone, Most used and every topic list show one tile per row (for example Merge PDF, then Split PDF, then Compress PDF); on a tablet or computer the layout is unchanged and every tile in a topic is visible with no Show more button; on a phone the button still shows "Show N more" and toggles.

### Jump chips and size links

Check after deploy: the topic chips under the search box show on a phone and not on a tablet or computer; /image-resizer and each /resize-image-to-<n>kb page show a "Need an exact file size?" box with 20, 30, 50, 100 and 200 KB chips, the current page is highlighted, and each chip opens that page with its limit set. Passport, signature and exam photo pages do not show the box.

### Fixes from an outside test report

Checked in the sandbox: Notice Period with a 30-day notice and 100-day buyout now gives the resignation date, 30 days applied and a note (also with the resignation day counted as day 1, in months, and in working days); Group settle-up pairs equal and opposite balances then finds the exact fewest payments for up to 20 people (20 people in under 0.1 s; matches a brute-force minimum on 300 cases with matched pairs), and flags larger groups as close to, not proven, the fewest; Document Studio page labels and file names no longer contain `outputPdfPag`.

Not reproduced in the sandbox: the Time Zone Converter's 62 px sideways scroll at 360 px (no app CSS here). I made the field grid unable to grow past the screen; check it on a 360 px phone and, if it still scrolls, tell me which element sticks out.

Check after deploy:
- Notice Period: 30-day notice and 100-day buyout shows the resignation date and the "reduced" note.
- Bill Splitter: Equal split shows the Copy link bar; Group settle-up does not; an old link with round=5 still works.
- Upload File Checker: pick 21 or more images and all are listed; over 100 shows the warning; the drop box no longer says PDF only.
- Group settle-up with 18 people: no "close to the fewest" note; with 25 people the note shows.
- Document Studio and Digitize: page badges read "Page 1", and a downloaded page is named output-page-1.pdf.
- After deploy, load `/ac1` (curl -I) and check the `x-robots-tag: noindex, nofollow` header.

### Offer Poster Maker and /ac1/poster

Checked in the sandbox (headless Chromium, real bundled fonts): all 18 designs drawn in post, portrait, story and A4 with 2, 4, 6, 9, 12 and 15 products, with empty name, heading, tagline, prices and badges; list designs fall back to a grid when rows would be too thin. Both pages mounted with React: public page (15 rows, pre-filled contacts, badge edits, download 1080x1080 and 1080x1920) and /ac1/poster (pencil buttons for every element, edit name, subheading, price, photo zoom, clear a contact, download omits the cleared contact; the chooser shows 18 previews and the count/size selectors change the links). `tsc` and `vite build` were not run.

Check after deploy:
- /offer-poster-maker on a phone and desktop: designs show their real fonts (condensed Teko/Bebas/Anton, scripts like Pacifico/Dancing/Lobster, serifs like DM Serif/Abril/Playfair). In DevTools Network no request leaves mydailyutils.in (fonts are woff files from the site).
- Change shop name, prices and a photo; thumbnails and preview update; old price struck through; badges editable or empty. Download PNG in each size and open it. Story: nothing important in the top 150 px or bottom 190 px.
- 15 products: zoom into the PNG, names and prices readable. Long names, an empty price, a Hindi name, a very large photo.
- Reload: shop details are remembered, photos are not.
- /ac1 (chooser): new designs first, count and size selectors, "Use design" opens /ac1/poster with the right design, count and size; classic designs below still open /ac1/edit.
- /ac1/poster on a phone: tap the pencil on the shop name, a price, a product name and a footer contact; the editor panel appears under the picture; photo buttons replace, zoom and move; Download PNG matches the screen. The page is not indexed (`x-robots-tag` header).
- /offer-poster-maker is in search on the home page, footer and sitemap.

### Poster QR codes, WhatsApp QR kind, home colours

Checked in the sandbox: the QR row decoded with OpenCV for all three contacts in post, story, A4 and portrait (wa.me/917804991800 from 78049-91800 with code 91, the Facebook and Instagram profile links); both pages toggle it, and the public page shows the country-code field only when QR is on. WhatsApp kind in the QR generator builds `https://wa.me/<digits>?text=<message>`. Colours not checked visually (no Tailwind in the sandbox). `tsc` and `vite build` were not run.

Check after deploy: scan each poster QR with a phone camera (WhatsApp should open a chat with the number; Facebook and Instagram should open the profile); try a number with +, one with 10 digits, one starting with 0; /qr-code-generator > WhatsApp, scan; home page: PDF, Images, Money, Everyday topics should be clearly different colours from each other and from the orange tiles above.

### Rent Receipt, Price Tag Maker, Bulk QR

Checked in the sandbox (headless Chromium, logic only, no Tailwind so styled layout is not judged): number-to-words (7, 15,000, 1,25,000, 12,34,567, paise), month ranges (12 months, 36 cap, end before start), PAN shape, 6 receipts on 2 pages; price tags with Code 128 and QR, copies, an unencodable code flagged; bulk list with comma, tab and link-only lines, ZIP built, all three PNGs decoded with OpenCV and list.txt correct. The Code 128 output was decoded from rendered pixels (start, check digit and text matched for five strings). `tsc` and `vite build` were not run.

Check after deploy:
- /rent-receipt-generator on a phone: fill details, choose 12 months, Print or save as PDF: 4 A4 pages, three receipts each, signature lines, nothing cut across pages. Rent above Rs 8,333 a month shows the PAN reminder without a PAN. Amount in words correct.
- /price-tag-maker: paste the sample, print at 100% on A4: tags are in an even grid, prices large, old price struck through. Scan a printed barcode with a scanner or phone app. Try small, medium, large and QR.
- /bulk-qr-code-generator: paste 3 lines, download ZIP, unzip, scan each PNG; SVG option; print the labelled sheet.
- All three appear in search, the sitemap, and the home page (rent receipt under Money, tag maker under Work, bulk QR under Sharing).


## Test round checklist: November 9, 2026 (everything merged since the Offer Poster Maker)

Use this as one pass on a real phone (and once on a desktop). Tick each line; note the page, device and what you saw for anything that fails. Nothing here was visually verified in the sandbox (no Tailwind), and `tsc` and `vite build` were not run, so the first check is that the Amplify build is green.

### A. Build and routes
- [ ] Amplify build for the latest main succeeded with no TypeScript errors.
- [ ] `/catalog-templates` now shows the 404 page (it was removed). `/ac1`, `/ac1/edit` and `/ac1/poster` still open, and `curl -I` on each shows `x-robots-tag: noindex, nofollow`.
- [ ] `/sitemap.xml` lists `/offer-poster-maker`, `/rent-receipt-generator`, `/price-tag-maker`, `/bulk-qr-code-generator` and does not list `/catalog-templates` or `/ac1*`.
- [ ] Search on the home page finds all three new tools ("rent receipt", "price tag", "bulk qr"); each appears in the footer tool list.

### B. Home page colours (#55, #58)
- [ ] Each topic heading icon and its tiles share one colour; PDF, Images, Money, Everyday, Work, Study, Sharing, Dev are clearly different from each other (especially PDF vs the orange tiles, and Money vs Images).
- [ ] Most used tiles and the Workspace cards each have their own distinct colours.
- [ ] New tools row shows Rent Receipt, Price Tag, Bulk QR first with the "New" tag; Rent Receipt is also under Money, Price Tag under Work, Bulk QR under Sharing.

### C. Offer Poster Maker (`/offer-poster-maker`)
- [ ] Designs show their real fonts (check Network: fonts load from your own domain, no requests to Google).
- [ ] Sizes: square, portrait, story, A4. Product counts 2, 4, 6, 9, 12, 15; photos get most of the space. Download a PNG of each size and open it.
- [ ] Header and footer bars are compact (#57) and nothing overlaps on 15 products or with long names.
- [ ] Edit shop name, heading, tagline, corner badge, each product name, old price, new price and each photo badge (percentage, amount or words); empty fields are hidden.
- [ ] Footer: WhatsApp number, Facebook name and Instagram ID appear; turn QR on, scan each QR with a phone camera (WhatsApp opens a chat; Facebook and Instagram open the profile). Try a number with +, a 10-digit number and one starting with 0.
- [ ] Reload: shop details are remembered, photos are not.

### D. Private poster pages (`/ac1`, `/ac1/poster`, `/ac1/edit`)
- [ ] `/ac1` chooser: new designs first, count and size selectors work, "Use design" opens `/ac1/poster` with the right design, count and size; classic designs open `/ac1/edit`.
- [ ] `/ac1/poster` on a phone: tap the pencil on the shop name, a price, a product name and a footer contact; the editor appears under the picture; photo buttons replace, zoom and move; Download PNG works. List-style designs show 3 to 6 readable rows.

### E. QR code generator (`/qr-code-generator`, Wi-Fi, vCard)
- [ ] WhatsApp kind: number plus message, scan, chat opens with the text.
- [ ] Wi-Fi and contact codes still scan; PNG and SVG download.

### F. Rent Receipt Generator (`/rent-receipt-generator`)
- [ ] Fill tenant, landlord, address, rent 15000, April 2026 to March 2027: 12 receipts, 4 pages, amount shows "Rupees Fifteen Thousand Only", each period runs from the 1st to the last day of its month.
- [ ] Rent 9000 a month with no PAN shows the PAN reminder (yearly rent over Rs 1 lakh); a PAN like ABCD1234F shows the format error; ABCDE1234F is accepted.
- [ ] Last month before first month shows the error and disables printing. A 40-month range warns it is capped at 36.
- [ ] Print or save as PDF: three receipts per A4 page, dashed cut lines, nothing split across pages, the form is not in the PDF. Check the revenue stamp box option.
- [ ] Tick remember, reload: names, PAN and address come back; untick clears them.
- [ ] Another currency shows the amount without words.

### G. Price Tag Maker (`/price-tag-maker`)
- [ ] "Fill with an example" shows 3 products. Switch small, medium, large: 40, 24, 10 tags per sheet; text stays readable and nothing overflows the tag.
- [ ] Barcode: print at 100% on A4 and scan a printed barcode with a scanner or a phone barcode app. QR: scan a tag's QR.
- [ ] Old price is struck through and "Save %" is correct; turn the saving off. Shop name bar and colour change work.
- [ ] A code with Hindi or over 40 characters shows the warning and prints without a code.
- [ ] Copies 3 triples the tags; 400-tag limit message appears for large lists. Print preview: all sheets print (not only the first two), one A4 page per sheet, no blank last page.
- [ ] Paste columns from a spreadsheet (tab separated) and a comma separated list.

### H. Bulk QR Code Generator (`/bulk-qr-code-generator`)
- [ ] Paste 3 lines (label, link). Download the ZIP: files named from labels, `list.txt` matches, every PNG scans with a phone. Repeat with SVG.
- [ ] Link containing a comma (`https://example.com/a?x=1,2`) scans correctly; a line with only a link is named from the link; a tab-separated line works.
- [ ] Choose light colours: the contrast warning shows.
- [ ] Print the labelled sheet with 3, 4 and 5 per row: labels under each code, all codes printed even when over 24.

### I. Still on you (not testable by me)
- [ ] AdSense Auto-ads exclusions for `/ac1`, `/ac1/edit`, `/ac1/poster`, legal pages and the 404 page.
- [ ] EEA/UK/CH consent message, Amplify bare-domain redirect, Analytics and AdSense link, Search Console sitemap submission (add the three new URLs).

When reporting: page, device and browser, what you did, what you expected and what happened; a screenshot helps most for layout problems.

### Audit fixes (November 9, 2026)

Checked in the sandbox: bulk QR file names for labels foo, foo, foo-2, foo give foo, foo-2, foo-2-2, foo-3 (no repeats); rent amounts Infinity, 1e12, -5 and abc show an error and disable printing, 15000 works. Not verified: the Time Zone Converter width (no Tailwind in the sandbox, `tsc` and `vite build` not run).

Check after deploy:
- [ ] Bulk QR: labels foo, foo, foo-2 give three files in the ZIP and `list.txt` names each once.
- [ ] Rent receipt: typing Infinity or a negative number shows the error and Print stays disabled.
- [ ] /time-zone-converter at a 360 px wide phone: the page does not scroll sideways; only the results table scrolls inside its box.
- [ ] /privacy section 2 lists the poster maker, group settle-up, resume, quotation and rent receipt storage.
- [ ] `/ac1`, `/ac1/edit`, `/ac1/poster` return HTTP 404 with `x-robots-tag: noindex, nofollow`. This is expected: the Amplify rule is `404-200`, so unlisted addresses fall back to the app. If you would rather they return 200, change the rule (in the Amplify console, not the repository).

### Time Zone Converter pictures

Checked in the sandbox (logic and DOM only, no Tailwind so colours and sizes are not judged): for 10:00 India time the India strip is centred on hour 10 and runs 22 to 21; New York shows the right hours; India and London overlap 4 hours; the clock hands for 10:30 are at 315 and 180 degrees; a 360 px page renders 4 clocks, 5 strips (4 zones plus the overlap row) and 24 boxes per strip with no errors. `tsc` and `vite build` were not run.

Check after deploy:
- [ ] /time-zone-converter on a phone: a row of clocks (night zones look dark), then one strip per zone with the hour numbers readable in each box (9 px text, check at 360 px) and the orange line in the middle.
- [ ] Green is 9 am to 6 pm, amber is 7 to 9 am and 6 to 10 pm, dark is night; the legend matches.
- [ ] Pick India, New York and London: the "Everyone in working hours" bar and its sentence agree with what the strips show. With zones that never overlap it says there is no overlap.
- [ ] Change the time and zone: clocks and strips move; remove a zone with the table button and its clock and strip disappear.
- [ ] A half-hour zone (India, Nepal) shows the right hour numbers and the line is still in the middle.
- [ ] The table is still there below, and the page does not scroll sideways at 360 px.

### Time Zone Converter: half-hour strips, draggable line, day buttons

Replaces the earlier checks for the strips. Checked in the sandbox (logic and DOM at 360 px width, no Tailwind so look and size are not judged): each strip has 48 half-hour boxes; the slider changes the Time field (600 minutes = 10:00; 1140 gives 19:00); dragging across the strip moved the time to 12:00 at the middle; Next day moved the date 9 to 10 Nov; Auckland is +1 day when New York is the same day for 18:30 UTC; month and leap-edge date shifts are right; "Next day / Previous day" badges and "new day" markers appear. `tsc` and `vite build` were not run.

Check after deploy:
- [ ] On a phone the clocks are one per row, stacked, each with its time, date and a "Next day" or "Previous day" tag when the date differs from your zone's.
- [ ] Each zone has a strip for one whole day (midnight to midnight in your zone) with thin half-hour boxes and the hour written at each hour (check the numbers are readable at 360 px).
- [ ] Touch and drag the orange line across all strips: the time field, clocks and table all update, and the line stays under your finger. Dragging sideways does not scroll the page; swiping up and down over the strips still scrolls.
- [ ] The slider under the strips moves the line in 30-minute steps and matches the Time field; typing a time moves the line.
- [ ] Previous day and Next day change the date and everything refreshes. Pick India, Tokyo and New York around midnight: the "new day" marker shows where each zone's date changes and the clock tags say Next day or Previous day correctly.
- [ ] Half-hour zones (India, Nepal) look right and the overlap bar agrees with the strips.

### Time Zone Converter: date above each strip

Checked in the sandbox: for 10:00 India the New York strip title reads "11:30 pm, Sun 8 Nov" with a "Previous day" tag while the others read "Mon 9 Nov"; at 20:30 all four read Mon 9 Nov with no tag. `tsc` was not run.

- [ ] Above each strip the title shows the time and date (for example "11:30 pm, Sun 8 Nov") and follows the orange line as you drag it.
- [ ] When a zone's date differs from your zone's, an orange "Previous day" or "Next day" tag shows next to it. Drag the line across midnight in a zone and the date and tag change at exactly that point.

### EMI Calculator: month-wise table, extra payments, ways to pay less interest

Checked in the sandbox (logic and DOM at 400 px, no Tailwind so styling is not judged): the schedule matches the old calculator for 25 lakh, 8.5%, 20 years (EMI 21,696, interest 27,06,939, same yearly rows) and the principal repaid always adds up to the loan; 5,000 every 6 months from month 6 plus 2 lakh in month 12 ends the loan in 15 years 6 months and saves about 8.4 lakh interest; a 0% rate works; yearly table has 20 rows, monthly 240 (186 with those extras), with "Dec 2026" style months when a first-EMI month is chosen; a one-time payment after the loan ends shows a note and is ignored; the advice section hides at 0% rate and with no tenure. `tsc` and `vite build` were not run.

Check after deploy:
- [ ] /emi-calculator: Year-wise and Month-wise buttons switch the table; month-wise scrolls inside its box and the header stays visible; the first-EMI month adds real month names.
- [ ] Add a repeating extra payment (for example 5,000 every 6 months from month 6) and a one-time payment (month 12, 2,00,000): new cards show the earlier end date, interest saved and extra paid; the tables get an extra-payment column; the yearly balance reaches 0 in the last year; Clear all extra payments restores the plain result. Add and remove several one-time rows on a phone.
- [ ] Spot check by hand: with no extras the first month's interest is balance x rate / 12 / 100.
- [ ] Ways to pay less interest appears below the tables: the suggested shorter loan card (EMI no more than 20% higher), four tables, and the caution note. Numbers look sensible (a shorter tenure has a higher EMI and less interest; a 1% lower rate saves more than 0.25%).
- [ ] Layout at 360 px: tables scroll sideways inside their boxes, nothing makes the page itself scroll sideways.

### EMI Calculator: ways to pay less interest as big numbers

The "longer loan, keep paying your current EMI" comparison was removed. "Ways to pay less interest" now shows each variation (shorter tenure, small extra payments, borrow less, lower rate) as a card with three big numbers: loan amount, total interest and years, plus the EMI and what you save. No tables there.

- [ ] /emi-calculator: under "Ways to pay less interest" the first card is your loan as entered; the others show Loan amount, Interest and Years in large type. No longer-loan section remains.
- [ ] Spot check: a shorter tenure has a higher EMI and less interest; "5% less" borrowed shows the smaller loan amount; 1% lower rate saves more than 0.25%.
- [ ] At 360 px the cards stack and nothing scrolls sideways.

### Sports Court and Ground Size Guide (`/sports-court-size-guide`)

Checked in the sandbox: every sport, version, fact, mark and margin id in the data has text in the locale file; the fit maths (both orientations, run-off per court) gives expected counts; diagrams render (27 versions). `tsc` and `vite build` were not run and styled layout was not viewed.

Check after deploy:
- [ ] Page opens; the sport list has 13 sports; each sport and version shows a court drawing in proportion with a dotted clear-space box, and the lines look like the real court.
- [ ] Spot check against a source you trust: badminton 13.4 x 6.1 m (44 x 20 ft), tennis 23.77 x 10.97 m, pickleball 13.41 x 6.1 m, cricket pitch 20.12 m, basketball FIBA 28 x 15 m, volleyball 18 x 9 m.
- [ ] Lengths read like "13.4 m (43 ft 11.6 in)". Marking plan shows the diagonal and line distances.
- [ ] Fit my space: enter 20 x 10 m: badminton fits; enter 10 x 6 m: tennis does not and shows how short. Switch to feet and the result is the same space. Extra clear space of 1 m removes some courts.
- [ ] Show this court jumps to the sizes tab for that court.
- [ ] Notes and risks, how to play, sources (links open) and the checked date appear for every sport. At 360 px nothing makes the page scroll sideways.
- [ ] The drawing itself shows the length and width (metres with feet and inches) along the top and right, numbered points under or beside the court that match the numbered marking plan, and the dotted clear-space box with its caption.
- [ ] Save as image (PNG) and Save as PDF download one A4 page for the chosen sport and version: drawing with all measurements, marking plan, notes, sources and the checked date. Open the PDF on the phone; nothing is cut off. Try a small court (table tennis), a long one (football) and a ground (cricket).

### Sports Court Size Guide: full marking guide

Checked in the sandbox: all 27 versions produce 2 to 4 valid A4 pages; the set-out numbers on the drawing match the step list (football: outer shape, penalty and goal areas, centre circle, spots, penalty and corner arcs; hockey: goals outside the end lines, circles, 23 m lines); a four-page sheet stacks into one 1573 x 8900 px PNG in Chromium. The PDF step (pdf-lib) and `tsc` were not run here.

- [ ] Open a sport and expand "Full set-out": numbered drawing with corners A to D and both diagonals, a "Before you start" list, one numbered step per line/circle/arc/spot with its position from end A and end B (or side A and side B), and "Check before you finish".
- [ ] Save as image (PNG): one tall image containing every page; zoom in on a phone and the text is readable. Save as PDF: 3 or 4 A4 pages (football 4), nothing cut off, page numbers "n / total".
- [ ] Hand check against a tape or a map: badminton (13.4 x 6.1 m; singles line 0.46 m from side A and from side B; short service line 1.98 m from the net), football common (105 x 68 m; penalty mark 11 m; penalty area 16.5 m x 40.32 m; centre circle 9.15 m), hockey (23 m lines 22.9 m from each end; shooting circle radius 14.63 m).
- [ ] The page says that line width inside or outside the sizes depends on the sport's rules, and tells you to confirm with the rulebook.

### Sports Court Size Guide: measurements on the drawing

Checked in the sandbox: the set-out drawing (page 2 of the saved file and under Full set-out) carries the distances itself; for football, hockey, badminton, basketball and kabaddi the grey figures are readable and the chains do not collide. `tsc` and the PDF step were not run.

- [ ] Full set-out drawing: light grey figures along the top (from end A), bottom (from end B), left (from side A) and right (from side B) for every line, rectangle edge, circle centre and spot; "R ..." radius on every circle and arc; rectangle sizes inside penalty and goal areas. Corner captions say which side is which.
- [ ] Saved PNG and PDF show the same grey figures. Zoom into the football image: every figure is readable; nothing is hidden behind the orange numbers.
- [ ] Spot check football (105 x 68 m): top chain reads 5.5, 11, 16.5, 52.5, 88.5, 94, 99.5 m; left chain reads 13.84, 24.84, 34, 43.16, 54.16 m. Badminton: 0.76, 4.72, 8.68, 12.64 m along; 0.46, 3.05, 5.64 m across.

### Sports Court Size Guide: names and details written on the drawing

Checked in the sandbox: all 27 versions have no unnamed lines or shapes; pages render as valid SVG. `tsc` on components, `vite build`, the PDF step and styled layout were not run. Football and badminton are crowded and use numbered badges.

- [ ] Volleyball: the drawing itself says "Attack line - 3 m (9'10.1") from the net", "Net", net heights; no need to read any list.
- [ ] Every sport: each line, circle, arc, box and spot has its name and size on or beside it (grey figures for distances). Any numbered badge has its line under the drawing.
- [ ] Saved PNG/PDF: page 1 is the labelled drawing, page 2 notes and sources, then the set-out pages. Note anything overlapping or unreadable (sport, version).

### AdSense readiness

Not run: `tsc`, `vite build`, prerender, live site (sandbox cannot reach it).

- [ ] Build passes on Amplify; /editorial-policy opens, is in the footer, About and sitemap.xml, and view-source of /editorial-policy shows the text without JavaScript.
- [ ] View source on any page: `google-adsense-account` meta is present in the head.
- [ ] /resize-image-to-20kb, 50kb, 100kb, 200kb each read differently, no leftover empty headings; the tool still works.
- [ ] https://mydailyutils.in (no www) redirects to https://www.mydailyutils.in and https://www.mydailyutils.in/ads.txt opens.

### Tool extras, batch 1

Checked in the sandbox: `sipForTarget` reproduces the target exactly; `inflationAdjusted(1000, 6, 10)` = 558.39; tax break-even for 15 lakh salary is 544000 and old tax at that amount equals the new regime. `tsc`, `vite build` and a browser test of the PDF rendering were not run.

- [ ] Compress PDF > Reduce to a size: a text PDF of a few pages at 1 MB stays selectable ("Text is still selectable"). A scanned PDF of 5 MB or more at 200 KB becomes pictures, shows dpi and quality, and is at or under 200 KB. An impossible limit (10 KB on a 20-page scan) shows "Could not reach" with the smallest size. Open the downloaded PDF on the phone: pages are in the right order and sizes.
- [ ] Clean up only still works as before.
- [ ] SIP: 10000 a month, 12 percent, 15 years, 6 percent inflation shows value in today's money. Goal 1 crore gives about 19,819 a month with no step-up (about 11,516 with 10 percent step-up).
- [ ] Income tax: salary 15 lakh, 80C 1.5 lakh: the note says the old regime needs about 5.44 lakh in deductions. Salary 9 lakh shows 3.5 lakh. A very high income shows "new regime costs less at any level".
- [ ] Image resizer: each result lists size, exact pixels and JPG ticks; tapping the small picture shows it larger; with two images "Download all" saves both (phones may ask to allow multiple downloads).
- [ ] What is each tool still missing? Note it here.

### What's new notices

Not run: `tsc`, `vite build`, browser.

- [ ] /whats-new lists the entries by date and each tool link opens the right tool.
- [ ] Open Compress PDF, SIP, Income Tax, Image Resizer, EMI, Sports Court Guide: an orange "New (date)" note sits above the tool with a link to all updates. A tool without an entry shows no note.
- [ ] Home page shows a "What's new" strip with 3 cards before Workspaces; tapping one opens the tool. Searching hides it.
- [ ] Footer has the What's new link; view-source of /whats-new shows the list without JavaScript.
### Tool extras, batch 2

Checked in the sandbox: eligibility dates for a 15 Aug 1995 birth (min 21, max 30: eligible from 15 Aug 2016, until 14 Aug 2026; "below 30" ends 14 Aug 2025) and a 29 Feb 2000 birth (turns 21 on 1 Mar 2021). `tsc`, `vite build` and the browser were not run.

- [ ] Age: open "Check age eligibility", min 21, max 30, born 15-08-1995, age on 01-01-2026: within the limit, eligible until 14 Aug 2026. Switch to "Below 30": not eligible, says over the limit. Add 5 relaxation years: eligible again.
- [ ] GST: "Find the GST rate": 1000 and 1180 gives 18% and closest slab 18%; 1000 and 1050 gives 5%; 1000 and 1075 shows no standard slab. Add mode with "Between states" shows IGST.
- [ ] What is each tool still missing? Note it here.


### Tool extras, batch 3

Not run: `tsc`, `vite build`, browser.

- [ ] Merge PDF: add two PDFs; each shows its page count and the total is correct. Type 1-2 in the first file: the total drops accordingly; the merged file has only those pages from that file. Type 99: red "no pages match" and merging shows a clear error. Sort A to Z orders scan 2 before scan 10. Password-protected PDFs still ask for the password.
- [ ] Percentage: each of the five boxes shows a "Working:" line that matches the answer; blank input hides it.
- [ ] What is each tool still missing? Note it here.

### Tool extras, batch 4

Not run: `tsc` on components, `vite build`, browser.

- [ ] FD 5 lakh at 7 percent for 5 years with tax rate 30: tax, interest after tax, maturity after tax and after-tax yield appear and the after-tax yield is below the pre-tax yield. Tax rate 0 hides them.
- [ ] FD 20 lakh at 7 percent for 1 year: the amber TDS note appears for Below 60 and also for Senior citizen above 1 lakh; 5 lakh at 7 percent for 5 years (about 2.1 lakh over 5 years, about 42,000 a year) shows no note for either.
- [ ] RD with tax rate 20: two extra stats appear.
- [ ] Check the TDS limits against the bank or Income Tax Department before relying on them.

### Home guides strip and Split PDF

Not run: `tsc`, `vite build`, browser.

- [ ] Home page: a Guides section with four cards sits between What's new and More tools; each card opens its guide; "All N guides" opens /guides; hidden while searching.
- [ ] Split PDF: on a 10-page PDF, Odd pages fills 1, 3, 5, 7, 9 and says 5 of 10 selected; Even pages the other five; typing 99 shows the red message; the split file has exactly the selected pages.
- [ ] Anything else you notice missing from any tool: note it here.

### Compact footer

Not run: `tsc`, `vite build`, browser.

- [ ] Phone: the footer shows the brand line, one row of company links, and 2 columns of category rows with counts, folded. Tap one: it opens full width with the tool list in the sentence; tap again to close. The whole footer is about one screen.
- [ ] Tablet width: three columns of rows; opening a category lists tools in two columns.
- [ ] Desktop (1024px and wider): every category is open as a column; tapping the heading does nothing.
- [ ] Every tool link in the footer still opens the right tool. Resize from phone to desktop and back: no broken state.

### Slim footer

Not run: `tsc`, `vite build`, browser.

- [ ] Phone: footer is about three lines: links (two lines at most), a closed "All tools (N)" row, and a brand/copyright line. Tap All tools: category rows appear; open one and its tools list; all links work. Tap again to close.
- [ ] Desktop: the same closed row; opening it shows seven open columns.
- [ ] Privacy, Terms, Contact, About, Guides, What's new and the editorial policy links are visible without opening anything.

### Header tools menu

Not run: `tsc`, `vite build`, browser.

- [ ] Phone: tap Explore tools: a search box and about 7 folded category rows (with counts) appear, no long scrolling. Tap a category: only its tools show; tapping another closes the first. Tapping a tool opens it and closes the menu.
- [ ] Type "pdf", "emi" or "photo": a flat list of matching tools replaces the categories; a nonsense word shows "No tools match". Enter opens the first match.
- [ ] Typing in the search box on iPhone does not zoom the page. Escape and tapping outside still close the menu.
- [ ] Desktop: the panel is the same width and works the same way.
- [ ] View-source/DOM check: the tool links exist in the page even when the menu is closed (inspect `#explore-tools-menu`).

### Same groups in header, footer and home

Not run: `tsc`, `vite build`, browser.

- [ ] The names and order of groups are identical in the header menu, the footer's All tools row and the home page: PDF tools, Image and photo tools, Tax loans and investing, Everyday calculators, Printables and stationery, Jobs freelancing and business, Students and writing, QR codes and contacts, Developer and data tools, Workspaces.
- [ ] Every tool appears in exactly one group in the header and footer (spot-check 5 tools: resize-image-to-20kb, sports-court-size-guide, gst-invoice-generator, word-counter, display-studio).
- [ ] No group called "More tools" appears. If it does, a tool is missing from `COLLECTIONS`; tell me which.
- [ ] View-source of any page: the no-JavaScript link lists use the same group names.
