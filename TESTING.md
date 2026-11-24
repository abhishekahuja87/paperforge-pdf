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

### FAQ clean-up and situation questions (17 Nov)

Not run: full tsc, vite build, browser check. JSON files parse and round-trip.

- [ ] Compress PDF, Image Compressor, Image Converter, Images to PDF, PDF to Images, Protect PDF, Percentage, EMI, SIP and Word Counter pages show the new questions, with the privacy question still reading naturally; EMI examples read about 20,758 EMI and about 2,45,501 interest (10,00,000 at 9 percent for 5 years) and about 12,668 and 5,20,109 for 10 years.
- [ ] Age Calculator no longer shows the leap-day question twice; Upload File Checker shows one privacy question, not two.
- [ ] Switch language to German on /image-compressor: the first four questions keep their translations in order and the new ones follow in English.

### Image resizer merge (17 Nov)

Not run: full tsc, vite build, browser check. Parse-checked only.

- [ ] `/image-resizer` shows KB buttons (20, 30, 50, 100, 200) that fill the Maximum file size box and show a pressed state; the quick presets for forms still work.
- [ ] The page FAQ has the signature 20 KB, exam photo 50 KB, passport photo and "20, 30, 50, 100, 200 KB" questions, and the article has "Common sizes for forms".
- [ ] `/resize-image-to-20kb`, `/30kb`, `/50kb`, `/100kb`, `/200kb`, `/passport-photo-resizer`, `/signature-resizer` and `/exam-photo-resizer` show the not-found page; the sitemap has none of them; home Images group shows Image Compressor, Image Converter, Image Resizer and Screenshot Redactor; no "Need an exact file size?" box.
- [ ] The two guide articles (reduce image size for online forms; passport photo and signature) still open and list Image Resizer.

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

Paper flow (17 Nov), not run in a browser (full tsc, vite build, styled check). Checked in Node: for all 11 styles, `forStyle` keeps the page size, page count and binding and never throws when the sheet is built.

- [ ] The home Printable list shows Printable Paper Maker, planner and flashcards only; the dot grid, graph, Cornell, hexagon, calligraphy and cross-stitch addresses still open.
- [ ] In the paper maker only "Choose the paper" (style grid) is open; there is no quick start or "Paper for one use" row. "Adjust everything" is closed; opening it shows the style settings, page and margins, ink, header and extras, and "How many pages" is below it.
- [ ] Picking a style gives that paper's sensible start (dot: 5 mm dots; graph: 5 mm squares with axes; habit tracker: landscape) and keeps your page size and orientation. Plain lined keeps the plain defaults.
- [ ] Every paper page shows the full grid. Picking a paper with its own page (dot grid, graph, hexagon, Cornell, calligraphy, cross-stitch) goes to that address and the heading, FAQ and article match; picking lined, isometric, music, storyboard or tracker goes to `/printable-paper-maker`; picking one on the same address just switches in place. The page size, count and orientation chosen carry across. Reset returns to that page's own paper.

Geometry checked in Node: for all seven styles in portrait and landscape (and isometric in all four modes) no line, dot or text lies outside the printable area; binding margins on the front, back and landscape; segment clipping; settings validation and file round trip; presets. The screens and the PDF export were not run. After deploying: on /printable-paper-maker try each style and preset and check the preview changes at once; Download PDF for 1 page and for 50 pages (file stays small, opens, lines are sharp when zoomed); Print this sheet (only the sheet prints, at the page size); with Binding and Switch edge on, 2+ pages, compare Front and Back preview and the PDF; page numbers with a start number; Save and Load settings round trip; a margin below 5 mm shows the warning; habit names with non-Latin letters show as ? in the PDF. Also open /dot-grid-paper-generator, /graph-paper-generator and /cornell-notes-template and check each opens on its template.

### Printable meal planner (17 Nov)

Not run: full tsc, vite build, styled browser check. Checked in Node: 2,304 pages (week, day and month in both orientations on every paper size, one and five meals, shopping and notes on and off, a very long typed dish) keep every line and text origin inside the margins. Checked in Chromium (unstyled): the three kinds render, typed dishes appear in the preview, meal chips toggle, no errors.

- [ ] `/printable-meal-planner` opens, is in the Printable group and New tools, with a guide, FAQ (nine questions) and article.
- [ ] Weekly: seven days down, chosen meals across, shopping list on the right; switching it off widens the grid. Daily: one block per meal. Monthly: calendar with lines under each date.
- [ ] Meal chips: at least one stays on. Adjust everything opens dates, extras, typed dishes (not for monthly), paper and ink.
- [ ] Typing dishes prints them in the cells (long ones wrap to two lines, then end in ...); Clear all dishes empties them; the PDF download and print show the same sheet.

### Planners pack

Merge (17 Nov), revised: `/printable-calendar-maker` and `/daily-planner-printable` are back as link-reached addresses of the one planner (same pattern as the paper maker).

- [ ] Both old addresses open the planner maker (no blank page, no 404); the maker opens on Month and the Month, Week, Day and Year buttons work.
- [ ] The home page lists one planner tile and one meal planner tile, one paper tile, and none of the variant pages (also not under More tools); the sitemap lists the variant addresses; on each page the kind buttons change the address and keep paper, margins and title; the Back button returns to the previous kind; the page FAQ and article now cover calendars for any year and the daily schedule.

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

### Home page order

Not run: `tsc`, `vite build`, browser.

- [ ] Home page order is: search, Most used, Workspaces, topic lists, What's new (short lines), Guides (four linked titles). Together the last two take only a few lines.
- [ ] Each What's new line and guide title opens the right page; "All N guides" opens /guides. While searching, they are hidden.

### Tool page columns and Collapse all

Not run: `tsc`, `vite build`, browser.

- [ ] Desktop and tablet (768px and up) on /merge-pdf: the article is on the left and "How to use" (steps stacked) with the questions on the right; the page is clearly shorter than before.
- [ ] Phone: the steps and questions come first, then the article, then the ad. Nothing overflows sideways.
- [ ] All questions are open on first load. "Collapse all" folds them all and the label becomes "Expand all"; opening a single question by hand updates the label correctly.
- [ ] A tool with no article (for example one without a written article) shows the guide centred, with three steps in a row on a wide screen.
- [ ] Check three more tools: EMI calculator, Compress PDF, QR code generator. Report any that look uneven or broken.

### Focus mode and Collapse all

Not run: `tsc`, `vite build`, browser.

- [ ] On /merge-pdf, a "Focus mode" button and a "Collapse all" button sit above the article and guide. Tapping Focus mode hides the header (a slim bar with "Exit focus (Esc)" remains), footer, article, steps, questions and the ad; only a one-line title and the tool stay. The address now ends with ?focus=1.
- [ ] Escape and the Exit focus button return to the normal page and the ?focus=1 is removed.
- [ ] Open the copied link with ?focus=1 in a new tab: it opens in focus mode. Open the home page in that tab after turning focus on: the home page is normal. Open another tool: it opens in focus mode (same visit) and the address shows ?focus=1.
- [ ] Close the tab and open the tool again: normal view.
- [ ] Collapse all folds the article sections and the questions together; the label changes to Expand all; opening one section by hand while all are closed keeps the label right (Expand all until every section is open).
- [ ] Tools without an article or without questions still show the buttons correctly (Collapse all hidden when nothing can fold).

### One accordion for article and questions

Not run: `tsc`, `vite build`, browser.

- [ ] On /merge-pdf, the article sections and the questions appear as ONE list with the same look (same row style, title size, plus icon, text size). No second set of differently styled questions.
- [ ] Wide screen: the list is on the left; "How to use" steps and the privacy note are on the right. Phone: steps first, then the list.
- [ ] Every row is open on load, no text is hidden; the article text appears only once on the page.
- [ ] Collapse all / Expand all folds and opens every row; the label follows manual changes.
- [ ] A tool with an article but no guide still shows the article in the same look.
- [ ] Focus mode still hides all of this. Report any tool that looks uneven.

### Stacked guide

Not run: `tsc`, `vite build`, browser.

- [ ] /merge-pdf: "How to use" steps (three across on a wide screen), then the single accordion, then the privacy note, all in one centred column with no empty side space.
- [ ] Phone: same order, nothing overflows.

### Update note removed from tool pages

Not run: `tsc`, `vite build`, browser.

- [ ] No "what changed" note appears above any tool. /whats-new still lists everything, including today's two entries, and the home strip and footer link still work.

### Tool header bar and fold toggle

Not run: `tsc`, `vite build`, browser.

- [ ] Desktop: title on the left, description and "runs in your browser" on the right of the same row; Focus mode is an orange button at the top right and the first thing the eye lands on. Phone: stacked and centred, Focus button on the same row as "All tools".
- [ ] Collapse all / Expand all sits at the top right of the list heading and works; label follows manual changes. A tool with only an article shows it above the article.
- [ ] Focus mode still works (Esc exits).

### Header alignment

Not run: `tsc`, `vite build`, browser.

- [ ] Desktop: the title, description, tool card and guide all start at the same left edge and end at the same right edge; the Focus button ends flush with the tool card on the right. No text floats at the far page edges.
- [ ] Wide tools (for example the Sudoku or image tools) use the wider column for the header too.
- [ ] Phone: left-aligned, title wraps beside the Focus button without overlap.

### Guide text audit, batch 1

Not run: `tsc`, `vite build`, browser.

- [ ] Phone: no sideways scroll on any tool page; "runs in your browser" wraps under the description.
- [ ] /merge-pdf step 2 and the second question mention page ranges and Organize PDF.
- [ ] /compress-pdf steps and questions mention Reduce to a size and Clean up only, matching the two buttons.
- [ ] /split-pdf steps and questions mention All, Odd and Even pages.

### Upload box and workspace headers

Not run: `tsc`, `vite build`, browser.

- [ ] Compare the upload box on Merge PDF, Split PDF, Compress PDF, Image Resizer, Image to PDF, JSON Formatter and Base64: same height, same title style, one grey hint line listing types (for example "PDF · Stays on your device"). Multi-file tools say "Choose files or drop them here".
- [ ] Choosing a file shows "Reading your file…" while it loads.
- [ ] Master Document Studio, Digitize and Display Studio: before adding files the header lines up with the centred card; after adding files it lines up with the wide workspace. POS invoice stays wide.
- [ ] Switch the site to Hindi or Spanish: the upload box text is translated.

### Download names and topic borders

Not run: `tsc`, `vite build`, browser.

- [ ] Merge two PDFs and download: the name looks like `merged_2026-11-10_22-56_documents_2files.pdf` (your local time).
- [ ] Spot-check Split, Compress, Rotate, Protect, Unlock, Organize, Flatten, Extract text (.txt), PDF to images (each page), Image resizer / compressor / converter, JSON formatter, QR code (PNG, SVG, ZIP), Settle up, Planner, Paper maker, Offer poster, Screenshot redactor, Flashcards, vCard converter, Resume data: each file name starts with the feature, then the date and time.
- [ ] Downloading twice a minute apart gives two different names; the newest sorts last in the folder.
- [ ] Home page: each topic panel has a light border in its own colour; it is subtle, not heavy, in light and dark themes.

### Home top trial

Not run: `tsc`, `vite build`, browser.

- [ ] Desktop (1024px and wider): search and heading on the left, a topic panel on the right filling the space; no big empty areas at the top.
- [ ] Each topic chip scrolls to its panel; counts match the panel headings.
- [ ] Phone and tablet: top looks exactly as before; the mobile jump bar still shows.
- [ ] Typing in search still switches the page to results.
- [ ] Tell me what you like or dislike; this is a trial and easy to revert.

### Home top at md

Not run: `tsc`, `vite build`, browser.

- [ ] Phone in desktop-site mode (about 980px): search on the left, topic panel on the right.
- [ ] Normal phone: centred top as before plus one line "Files stay in your browser · Free, no sign-up · N+ tools" under the request link.
- [ ] Topic chips are not cut off at 768px (names truncate with an ellipsis).

### Home top v2

Not run: `tsc`, `vite build`, browser.

- [ ] Desktop mode and tablet: heading left, large search right, three pills underneath; the band is short and tools start sooner.
- [ ] Normal phone: centred heading, description, search, request link, then the pills.
- [ ] Search still switches to results.

### Smaller home top

Not run: `tsc`, `vite build`, browser.

- [ ] The heading is visibly smaller and the top takes less height on phone and desktop mode.
- [ ] The description is one short line; the pills still show underneath.
- [ ] Home page still has readable text for Google: heading, description, pills, topic panels.

### Home top centred

Not run: `tsc`, `vite build`, browser.

- [ ] Phone and desktop mode: everything centred in one column; heading smaller than before; pills under the request link.
- [ ] Search still switches to results.

### Privacy badge on tools

Not run: `tsc`, `vite build`, browser.

- [ ] Any tool: the top row shows "← All tools" on the left and the badge on the right; the description below has no extra sentence; the header is one line shorter.
- [ ] Phone: the badge does not push the row sideways (no horizontal scroll).
- [ ] Switch to Hindi or Spanish: the badge text is translated.

### Privacy badge position

Not run: `tsc`, `vite build`, browser.

- [ ] Any tool: "← All tools" and the badge sit together on the left; nothing is above the Focus mode button on the right.
- [ ] Very narrow phone: the badge wraps below the link instead of overflowing.

### Resume templates

Not run: `tsc`, `vite build`, browser.

- [ ] /resume-builder: a gallery of 13 template pictures; tapping one changes the preview. The selected one is highlighted. Click "Load an example" to see a full resume in each.
- [ ] Check each template at A4 and US Letter, with Compact, Normal and Large text: nothing overflows, text stays readable on the gradient and banner colours (try a very light accent such as yellow and a very dark one).
- [ ] Colour templates show the accent colour picker; Classic, Minimal and Developer do not. Changing the accent recolours gradients and banners. Switching templates keeps a colour you chose.
- [ ] Ocean column and Mist column: the column background reaches the bottom of the content; with a long resume it continues on page 2 without cutting text.
- [ ] Print or save as PDF with "Background graphics" on: colours and gradients appear and the text is selectable. Turn it off to see what plain printing looks like.
- [ ] "Remember my resume": reload the page and the chosen template returns. An old saved resume (Classic or Modern) still opens.
- [ ] The page has one h1 (the tool title); the gallery pictures add no extra headings.
### Random text generator

Not run: `tsc`, `vite build`, browser.

- [ ] /lorem-ipsum-generator: four buttons (Lorem ipsum, Random sentences, Random words, Random characters); each shows the right options and the output changes with them.
- [ ] Random sentences read as English, with capital letters and full stops; HTML mode wraps each paragraph in p tags.
- [ ] Random words: separators work; 1000 words fine. Random characters: set lengths and tick/untick sets; with none ticked a message appears and the box is empty.
- [ ] Search the home page for "random text generator" and "random word generator": the tool is found.

### Big-screen tools (interval timer, routine display, exam hall, menu, token, timings, spelling bee, notices)

Not run: `tsc` (project), `vite build`, browser, real phone, TV or projector. Only `lib/screens/*` was strict type-checked and tested in Node, and the components were type-checked against stub React types.

For every tool: the page opens; the quick start buttons show "Loaded" and the page scrolls to the list; every list has Add, move up/down, remove, Clear all; the screen fills the display, buttons fade when idle and return on touch, Escape or Close leaves; reload keeps your settings.

- [ ] /interval-circuit-timer: Tabata gives 8 work rounds of 20 s with 10 s rest; Circuit names repeat; total time shown matches; green work, blue rest, countdown red in the last 3 seconds; beeps with the volume up; Pause, arrows, Next skip.
- [ ] /step-by-step-routine-display: Morning stretch loads 7 steps with pictures that fade between two photos; "Add from the exercise list" adds a step with its pictures; "Add your own step" with and without an own picture; Breathing and Kids' routine have no library pictures; "Paste many at once" with `name | cue | seconds`; Start routine shows name, cue, picture, countdown, next step; Done slide at the end.
- [ ] /exam-hall-display: "Start when I press" runs from that moment; "Start at a set time" counts down to the time and "Use the time now" fills it; amber for the last N minutes, red "Pens down" at the end; rules show; beeps at the phase changes.
- [ ] /menu-board-display: Cafe menu sample shows 3 sections; items per screen and seconds change paging; the symbol is put before number-only prices; it loops; empty section uses the board name.
- [ ] /queue-token-display: Call next number, Go back, Jump to number, Start again; letter and digits change the number (A07); chime; big screen Next button, right arrow, space; numbers called before are listed; reload keeps the count.
- [ ] /daily-timings-board: times are sorted; the current row is green with NOW, the next has NEXT, earlier rows fade, and this changes as the clock moves; 12-hour and 24-hour; clock on and off.
- [ ] /spelling-bee-display: "Spell it" shows the clue then the word with spaced letters; "Read it" shows the word then the meaning; click, space and arrows move; auto mode uses the think and answer seconds; Shuffle changes the order.
- [ ] /notice-board-display: messages show in their colours with an optional picture; it loops; seconds per message work; a large picture is shrunk.
- [ ] Pictures and video: a menu item picture shows beside its price; a spelling word picture shows with the clue and the answer; a notice picture and a notice video (muted, loops) play; after a reload the video is gone but pictures stay; the logo shows small in the bottom left corner of every screen.
- [ ] Consistency round (22 Nov), every PDF tool (Merge, Split, Rotate, Organize, Delete pages, Crop, Compress, Protect, Unlock, Sanitize, Flatten, Watermark, Add page numbers, N-up, Extract text, Inspect, PDF to images, and Smart Split, Redact, Fill, Sign, Make fillable, Compare, Bates numbers): the upload is the orange dashed box; after choosing, a bar shows the name, "N pages • size" (same wording and order, also in the Merge list) and Change; Change goes back to the upload box; no numbered step cards; no "More about this tool" panel anywhere; the main orange button is named for the action; after it, the green banner with pencil rename and Save, then a grey "another" button; changing a setting turns the banner amber and brings the main button back.
- [ ] Password box: upload a password-protected PDF in Sanitize, Protect, Flatten, PDF to images, Smart Split, Redact, Fill, Sign, Make fillable, Bates numbers (box asks for the password; wrong password shows an error; Skip file works) and in Extract text and Compare (the original file is read with the password, so the text is real text); Inspect shows "Encrypted: Yes" without a box.
- [ ] Checkboxes everywhere are orange, not blue: Protect PDF (allow printing, allow copying), Sanitize, N-up, Add page numbers, Watermark.
- [ ] Flatten: only one green banner after flattening (the Save banner), no second "Successfully flattened" banner.
- [ ] PDF to images: after converting, green banner with Save ZIP (one page: Save image) and a grey "Convert another PDF"; the small per-page Save links still work.
- [ ] Document scanner: a new photo starts on Original (not grey); one orange "Create PDF" button below the options, then the green banner with rename and Save PDF, then a grey "Scan another document"; the page size option and "Save this page as a picture" are not inside a numbered step; camera button shows on a phone.
- [ ] Redact, Fill, Sign, Make fillable, Smart Split, Bates: after the main button the banner shows with the right file (open it), start-over works, and the Redact note says covered text is gone.
- [ ] /digitize-documents: choose several images; they list in order with a thumbnail and size, and can be moved or removed; language (English, or Hindi and English) and, with two or more images, One PDF or Separate PDFs (ZIP); "Create searchable PDF" shows progress with Cancel; afterwards the green banner appears with the pencil rename and Save PDF (or Save ZIP), and the grey "Convert other images" starts again; changing the order, language or output clears the banner; there is no editor page and no automatic download; a non-image file shows a friendly message; the text in the saved PDF can be searched and selected.
- [ ] PDF tool buttons: no main button says Save or Download (Rotate PDF, Organize PDF, Compress PDF, Crop PDF, Delete Pages, Extract Pages, Add Watermark, Add Page Numbers and so on). After the file is made the main button is replaced by the green banner and a grey "... another PDF" button that starts again; changing a setting brings the main button back and turns the banner amber. Merge shows "Merge other files". Main action buttons are orange in all of them.
- [ ] Organize PDF shows "N pages" (not "remaining") next to the file.
- [ ] Rotate PDF on a 360 px wide phone: the three angle options stack and nothing goes outside the box.
- [ ] Every PDF tool page has, at the end of Related tools, the card "Want to mix and match several PDF steps?" linking to Master Document Studio.
- [ ] PDF tools, one consistent result: in Merge, Split, Compress, Rotate, Crop, Delete pages, Add page numbers, Watermark, N-up, Sanitize, Images to PDF, Flatten, Organize, Protect, Unlock and Generate sample, the green banner appears above the action button with the file name, a pencil and Save PDF. The pencil lets you type a new name (extension kept, slashes and similar characters replaced, Enter or Done to accept, Escape to cancel) and Save uses it. Change a setting after the file is made: the banner turns amber and cannot be saved until you run it again. Saving after a rename downloads the new name.
- [ ] File sizes: a small PDF (a few KB) shows KB, a large one shows MB, in every PDF tool.
- [ ] Merge on a phone: the up, down and delete buttons sit at the top right of each file row, away from the "Pages to use" box, and the box wraps without overlapping.
- [ ] Back link: a tool page (for example Merge PDF) shows "PDF Tools" at the top and goes to the PDF tools page; that page shows "All tools" and goes home; tools in no collection show All tools.
- [ ] Notes under an upload: Compress shows a small "Typical size limits" table in grey; Protect and Unlock keep their warnings in amber with the same shape; Merge's empty hint is the same grey note.
- [ ] Report link: on any tool page, "Report a problem or suggest an idea" opens the contact page with the heading "Report a problem or suggest an idea", the tool name, a choice of problem or idea, and the message arrives with a subject naming the tool; the plain contact page is unchanged.
- [ ] /spinner-wheel-display: sample list shows a wheel; Spin turns about 5 seconds (about 1 second with reduced motion) and the pointer at the top ends on the winner shown below; the winner shown always matches the slice under the pointer; "Take a choice off the wheel" removes winners and "Put removed names back" restores them; 40 choices max with a note; long names are shortened; big screen spins with space, Enter or the Spin button.
- [ ] /lucky-draw-display: ticket numbers 1 to 100 with letters and 3 digits give A001 style numbers; a list of names works; prizes show above the number in order; the number rolls then stops; no ticket repeats; Start again resets; the big screen draws with space; last number smaller than first shows a message.
- [ ] /team-scoreboard-display: quick team buttons; plus and minus change the score by the step; "highest first" sorts and shows 1st, 2nd; equal scores share a place; on the big screen tapping a card and keys 1 to 9 add points; scores survive a reload; Reset scores.
- [ ] /classroom-seating-plan-display: names plus seats per row make rows numbered from the front; Mix, Keep my order and A to Z behave; tapping two seats swaps them; an incomplete last row shows empty seats; Copy as text; big screen shows the plan; plan survives a reload.
- [ ] /random-name-picker: "Show on the big screen" fills the screen with the name, picks with space, six colours work.
- [ ] Share row: every tool page shows "Found this useful?" under the tool (not on calculators that already have the share-this-calculation bar, and not in focus mode); Share opens the phone share sheet or copies the link; the report link opens the contact form.
- [ ] Screen colours: each tool has the colour picker (exam hall, token, timings, spelling bee, menu, routine); the screen uses the chosen colour, text is readable on all six, exam amber and red warnings still show, the timings board highlights NOW and NEXT on every colour, and the choice is still there after reload. The interval timer has no picker by design.
- [ ] On a phone: forms are usable and fit the width; the screens fill the display. In full screen the buttons are at the top, so the browser's own message along the bottom does not cover them (check Interval timer, Quiz, Workout slideshow too).

### Classroom Quiz Display

Not run: `tsc` (project), `vite build`, browser, real phone or projector. Only `lib/classroom/quiz.ts` was type-checked and tested in Node.

- [ ] /classroom-quiz-display opens empty; Start is disabled until there are valid questions.
- [ ] "Create questions" with 5 multiple choice and with true or false; "Try a sample quiz" fills 3 questions; Undo restores.
- [ ] A question: write text, 2 to 6 options (Add an option, remove down to 2), tick the correct one, add a picture to the question and to an option (shrunk, thumbnail shows), remove the picture, explanation.
- [ ] Move up/down, copy and remove a question. An incomplete question lists a problem under "How to play" and blocks Start.
- [ ] Phone: Create questions, Try a sample quiz and Add these questions scroll to the Questions list.
- [ ] Paste questions: numbered questions, A) B) C) D), "Answer: B", "Explanation: ..." are read correctly; the correct option is selected.
- [ ] Save quiz file, reload, Open a quiz file: everything including pictures comes back. A random JSON file shows a friendly message.
- [ ] Learn: click, space or right arrow shows the answer (correct option green, others faded, explanation), the next click moves on; left arrow goes back; the Next button is orange.
- [ ] Mock exam: timer counts down per question (turns red in the last 5 seconds), then the answer shows for the set seconds, then the next question by itself; Pause works; last slide says it was the last question.
- [ ] Real exam: timer per question, no answers while it runs, final "Answer key" lists every question with the correct option and explanation.
- [ ] Show options (name, subject, date, number, timer, explanations, light screen) and Shuffle questions/options change the screen; the correct answer is still right after shuffling options.
- [ ] Copy question paper and Copy answer key paste readable text.
- [ ] Phone: forms are usable; the quiz fills the screen. Escape or Close leaves.

### Workout Planner and Gym Display

Not run: `tsc` (project), `vite build`, browser, real phone or TV.

- [ ] /workout-planner opens with three empty parts: Warm-up, Main workout, Cool-down; Start slideshow is disabled.
- [ ] Each quick start (Mix day, Push, Pull, Legs, Full body, Home, Cardio and core) fills all three parts; Undo restores the earlier plan.
- [ ] In every part: add from the list (group chips, search), move up/down, edit the note, remove.
- [ ] In every part: "Add your own" with a name and a note adds an entry with "No picture".
- [ ] Start slideshow: intro, then each exercise with picture (library items only), countdown, rest, end screen; custom entries show text only.
- [ ] Arrow keys, space and Escape work; buttons hide after a few seconds and return on touch or mouse move; closing returns to the planner.
- [ ] Phone, slideshow on an exercise with long steps: the picture is never cut or pushed off the screen; name, note and timer stay visible; "Show muscles and steps" opens them (and pauses) and "Hide details" folds them; on a computer or TV they always show.
- [ ] Phone, tapping Mix day (or any quick start): the button shows "Loaded" and the page scrolls to the Warm-up, Main and Cool-down lists; Undo and Clear remove the "Loaded" mark.
- [ ] Display options (date, name, gym, pictures, muscles, steps, timer, next, light screen) change the slideshow.
- [ ] "Show all on one screen": three parts side by side (stacked on a phone), small flipping pictures for library items only, no steps text; tapping a time button counts down that exercise and ticks it at 0; the circle ticks/unticks; session clock starts, pauses; restart icon clears ticks and clock; Escape and Close leave.
- [ ] Reload: the plan is still there. "Copy plan as text" pastes a readable list.
- [ ] On a phone: fullscreen works or the overlay still fills the screen; screen stays awake.

### Exercise library (trial)

Not run: `tsc`, `vite build`, browser.

- [ ] /exercise-library opens; with All selected you see eight sections (Chest to Stretching) on one page, 141 exercises in total.
- [ ] Each card shows a picture that fades between two positions; images load as you scroll (check the Network tab: not all 280 at once). With "reduce motion" on in your phone settings the picture stays still.
- [ ] Body area chips, Equipment, Level and the search box combine; the count updates; "Clear filters" resets; an empty result shows the message.
- [ ] "How to do it" opens the steps on every card.
- [ ] Pictures load on the live site (the host must not rewrite /exercises/*.webp to the home page).
- [ ] Find it from the home page under Everyday, in the footer list and by searching "gym exercises".
- [ ] Report: do the pictures look good enough, is the fade too fast or too slow, which exercises are missing?
### Solar System Explorer (trial)

Not run: `tsc`, `vite build`, browser.

- [ ] /solar-system-explorer: enter a birth date and weight; each planet row shows age, next birthday date and weight. Check: Mercury age is about 4.15 times your Earth age; 60 kg on Mars is about 22.6 kg; a future date shows the warning.
- [ ] kg / lb buttons relabel the result (the number you typed is taken as that unit).
- [ ] Compare two worlds: pick Jupiter and Earth: the sentence says about 11.2 times wider and about 1,410 Earths by volume; picking the same world twice shows a friendly message.
- [ ] The planets-to-scale picture fits the phone width with no sideways scroll; labels do not overlap. The fact table scrolls sideways inside its own box only.
- [ ] Found from the home page under Everyday and by searching "age on mars".
### Visiting Card Maker

Not run: `tsc`, `vite build`, browser.

- [ ] /visiting-card-maker opens with an example card already drawn (Banner design) and every field filled in.
- [ ] Editing any field updates the big preview and all 17 thumbnails; empty fields disappear from the card without leaving gaps that look broken.
- [ ] Try a very long name, title and address on a few designs: text shrinks to fit and never runs off the card or into the QR code.
- [ ] Walk through all 17 designs on a phone: none has unreadable text (check Noir, Gala, Violet wave, Lagoon). The colour box changes coloured designs only and Reset restores the design colour.
- [ ] Add a QR code with "Saves my contact details", scan the preview with a phone: the contact opens with name, phone, email, company. Switch to "Opens my website": the link opens.
- [ ] Download the PNG: file name starts with visiting-card_ and the date/time; it is 1050 x 600.
- [ ] Download "PDF, one card": a 89 x 51 mm page with the card filling it. Download "A4 sheet of 10": two columns by five rows, centred, cutting marks in the margins; printing at 100% makes each card 3.5 x 2 in.
- [ ] Reload: the last card and design return.
- [ ] Search the home page for "business card maker" and "visiting card": the tool is found.
### Job Description Builder

Not run: `tsc` on the page, `vite build`, browser.

- [ ] /job-description-builder opens with an example (Marketing Executive, Corporate style) fully filled in, and a preview below the controls.
- [ ] Change the job title and company: every {title} and {company} in the preview updates. Clear the company: the text says "our company".
- [ ] Try all 8 templates: look and wording change; edit one section, switch template, and that section keeps your text while the others change.
- [ ] Empty a section: it disappears from the preview, PDF and text.
- [ ] Print or save as PDF: only the job description prints (no controls), colours and the band header show with background graphics on, A4, the file suggests a job-description_ name.
- [ ] Plain text (.txt) downloads with headings in capitals and dashes for bullets; Copy for job portals pastes the same text.
- [ ] Reload: last description and template come back. On a phone the preview wraps without sideways scrolling.
- [ ] Search the home page for "job description" and "jd maker": the tool is found.

### Learn the Clock

Not run: `tsc` on the components, `vite build`, browser (the time-wording and answer-option logic was run in Node).

- [ ] /learn-the-clock opens on the Learn tab with Learn, Quiz and Worksheet as large buttons at the top.
- [ ] Learn: dragging near the edge moves the long blue hand, near the middle moves the short red hand; both work with a finger on a phone and the page does not scroll while dragging.
- [ ] Moving the long hand past 12 moves the short hand on to the next hour (and back when going the other way); at 3:30 the short hand sits halfway between 3 and 4.
- [ ] "Tap to see the time" shows e.g. 3:30 and "Half past three"; tapping again hides it. Quick buttons set the long hand; Random time works; the step menu snaps to 1, 5 or 15 minutes; numbers toggle hides the 1-12; the button fallback works.
- [ ] Quiz, Read the clock: four answers, one right; right turns green with "Well done!", a wrong one says the correct time and in words; after 10 questions "You scored X out of 10. Play again". Changing level or type restarts.
- [ ] Quiz, Set the clock: time and words shown, hands can be moved, Check judges it; hands are locked after checking.
- [ ] Worksheet: both kinds, all levels, New worksheet makes a different set; Show the answers fills in hands or times; Print gives a clean A4 sheet with only the worksheet.
- [ ] Search the home page for "clock", "learn the clock" and "telling time": the tool is found.

### Money Shop, Tambola, Solar System sharing, Kids group

Not run: full `tsc`, `vite build`. Checked: the Tambola book maker (2,000 books, all valid), the PDF, and the three screens in a Chromium smoke test (unstyled, no Tailwind): money paying, change and shop flows, 90 unique calls, undo, saved game, Solar System link filling the fields.

- [ ] Home page: a "Kids and learning" group with Learn the Clock, Money Shop and Tambola; Learn the Clock is no longer under Students and writing.
- [ ] Money Shop, Pay: tap notes and coins, the total grows; tap one in the tray to take it back; Pay with the exact amount shows "Thank you"; too little says how much more; too much says how much too much; "Show me" explains a way to pay. After 5 questions the score line and Play again appear. Levels change the prices.
- [ ] Money Shop, Give change: the customer's note is shown; right change turns green, wrong shows the working and an easy way to make it.
- [ ] Money Shop, My shop: + and - on items; the basket total updates; paying more than the total shows the change; Parents section changes names and prices and they are still there after a reload; "Put the original prices back" works.
- [ ] Tambola, Tickets: preview shows 6 tickets; each has 15 numbers, 5 per row, numbers rise down each column; "New tickets" changes them; 3 sheets gives a 3-page PDF with every page using 1-90 once; title, footer and colour appear; a title with Hindi letters shows the warning.
- [ ] Tambola, Number caller: the big button calls a new number each time, never repeating, until 90; the board fills; Undo last works; New game needs a second tap; closing and reopening the page keeps the game; Voice on reads the number (and stays quiet when off).
- [ ] Solar System: type a name, the heading and the table header use it and a Mars line appears; Copy link and open the link in a new tab: name, birth date, weight, unit and compared worlds are filled in.

### Shadow and Sun Explorer (/shadow-explorer-for-kids)

Not run: full `tsc`, `vite build`, styled browser check.

- [ ] Explore: drag the sun along its dashed path (finger or mouse). Sun on the left throws the shadow right, sun on the right throws it left; low sun gives a long shadow, the top gives a small patch under the feet.
- [ ] Drag the person, then switch to Tree and Flagpole; the shadow starts at the feet and the dashed ray from the head ends at the shadow tip.
- [ ] "Hide the shadow so I can guess" shows a ? box; "Show the shadow" reveals it. The sliders do the same as dragging.
- [ ] Quiz: Easy asks left or right, Medium adds long or short and "right under the feet", Hard adds "move the sun" questions with a Check button. After answering, the shadow appears and a plain explanation shows. Ten questions, then a score.
- [ ] The page does not scroll while dragging the sun on a phone, but scrolls normally elsewhere.
- [ ] Home: the tool appears in "Kids and learning" and in New tools.

### Solar System picture (/solar-system-explorer)

Not run: full `tsc`, `vite build`, styled browser check, phone share sheet.

- [ ] Enter a name and date of birth: a "Save a picture to share" preview appears with the age on all eight planets and a small light "Made at www.mydailyutils.in" at the bottom.
- [ ] "Show weight on the picture too" adds a weight column; it is off by default.
- [ ] "Download picture" saves a PNG named after the person. On a phone, "Share picture" opens the share sheet with the image.
- [ ] A long name shrinks to fit; a name in Hindi or another script shows correctly.

### Duplicates and click feedback (16 Nov)

Not run: full `tsc`, `vite build`, styled browser check.

- [ ] `/double-sided-flashcards-printable` shows the not-found page (removed); the home page and the Printable group list only one flashcard tool. The FAQ covers long edge, short edge, landscape and printers without duplex.
- [ ] Calligraphy, dot grid, graph, hexagon, Cornell and cross-stitch pages: no paper-type grid, a heading like "Calligraphy settings", quick starts only for that type, and an "Other paper types" row of links that open the other pages.
- [ ] Printable Paper Maker (lined page): clicking a quick start highlights it, shows "Applied: ..." and the preview changes; changing any control clears the highlight.
- [ ] Watermark PDF presets, Age calculator quick dates and Learn the Clock "Try these" buttons highlight the chosen one.


### Addition and subtraction pages (16 Nov)

Not run: full `tsc`, `vite build`, styled browser check. Checked in Node: for about 95,000 sums and differences (up to 999) the last step's answer digits are right. Checked in Chromium (unstyled): Watch and You try on 58+67 and 304-158 run to the end, wrong answers show "Try again", Show me works, no errors.

- [ ] `/addition-with-carrying-for-kids` and `/subtraction-with-borrowing-for-kids` open, are in "Kids and learning" and New tools, and have a guide, FAQ and article. `/learn-carry-and-borrow` was removed.
- [ ] Watch: Play and the arrows step through; the orange line shows the working; the small 1 appears above the next column when carrying; borrowed digits are crossed out and rewritten.
- [ ] You try: the sum shows one step behind and asks for the next number. A wrong answer says "Try again", after two tries "Show me" appears, and the end shows a star or "x of y right". "Another sum" gives a new one.
- [ ] Examples, the shuffle button and My own numbers (up to 999; sums under 1000; first number bigger for taking away) work. The page is simple on a phone: two big buttons, five sums, the sum, and the controls.

### Long multiplication page (17 Nov)

Not run: full `tsc`, `vite build`, styled browser check. Checked in Node: for about 24,000 products (3 digits by up to 2 digits) the rows and the final answer are right. Checked in Chromium (unstyled): Watch and You try on 47 × 6 and 46 × 23 run to the end, no errors. Addition and subtraction were re-run after the shared StepLesson change and still work.

- [ ] `/long-multiplication-for-kids` opens, is in "Kids and learning" and New tools, with a guide, FAQ and article.
- [ ] Watch 47 × 6: `7 × 6 = 42`, `Write 2, carry 4` with a small 4 above the 4, then `4 × 6 + 4 = 28`, `Write 28`.
- [ ] Watch 46 × 23: row 138, then `Start with a 0`, row 920, then `138 + 920 = 1058`, with the answer in green.
- [ ] You try: multi-digit answers (like 1058) fit in the box; wrong says Try again; Show me after two tries; a score at the end.
- [ ] My own numbers: up to 3 digits times 2 to 99; otherwise the = button stays off.
- [ ] Addition with carrying and Subtraction with borrowing still behave the same.


### Long division page (17 Nov)

Not run: full `tsc`, `vite build`, styled browser check. Checked in Node: all 7,920 sums (10 to 999 divided by 2 to 9) give the right answer digits and remainder. Checked in Chromium (unstyled): Watch and You try on 85 ÷ 4, 612 ÷ 6 and 487 ÷ 5 run to the end with "All right", no errors.

- [ ] `/long-division-for-kids` opens, is in "Kids and learning" and New tools, with a guide, FAQ and article.
- [ ] Watch 85 ÷ 4: `4 goes into 8, 2 times`, `2 × 4 = 8`, `8 - 8 = 0`, `Bring down the 5` (orange), `5 - 4 = 1`, and the answer `21 r 1` in green.
- [ ] Watch 612 ÷ 6: the middle digit of the answer is 0 (`6 goes into 1, 0 times`).
- [ ] Watch 487 ÷ 5: starts with `4 is too small, so start with 48`.
- [ ] You try: three questions per round (how many times, the multiplication, the subtraction); the bring down is shown for you. Wrong says Try again, Show me after two tries, a score at the end.
- [ ] My own numbers: 10 to 999 divided by 2 to 9; otherwise the = button stays off.
- [ ] Addition, subtraction and multiplication pages still behave the same.


### Print pages as addresses (17 Nov)
- [ ] /daily-menu-planner-printable and /monthly-menu-planner-printable open the meal planner on that kind; the weekly, daily and monthly buttons switch the address and keep meals, dishes and paper.
- [ ] Search for "calendar maker" finds the planner; the footer lists the variant pages.
Checked with a router stand-in in an unstyled browser: address and highlighted kind change on every button for both makers. Full tsc, vite build and the styled view were not run.

### FAQ batch 3 (17 Nov)
- [ ] Page numbers, watermark, N-up, sanitize, inspect, crop, delete, JSON formatter, sample, extract, flatten, organize and unlock each show one or more new situation questions (the privacy question is no longer last on these pages). Each answer matches the tool: positions, formats, units, page choices and limits.

### Topics and search (17 Nov)
- [ ] Home shows topics in this order: PDF, Scan and digitize, Images, Tax and loans, Everyday, Sports and fitness, Printables, Jobs and business, Display and presentation, Students, Kids, QR, Developer. The Workspaces row has only Master Document Studio and POS & Bill Studio.
- [ ] Rent receipt is under Jobs and business; BMI under Sports and fitness; solar system explorer under Kids; the header menu and footer show the same groups.
- [ ] Search: "reduce pdf size" finds Compress PDF; "scan to searchable pdf" finds Digitize; "badminton court size" finds the court guide; "slideshow from pdf" finds Display; "hex to rgb" finds the colour converter.
Checked with a Node script against the real config (groups, workspaces, eight searches). The styled home page was not run; check the three new topic colours (teal, sky, indigo).
- [ ] Search ranking: "jpg to png" lists Image Converter first; "qr" lists the QR code tools before others. Checked with a Node script; styled page not run.

### Tool names (18 Nov)
- [ ] /digitize-documents still opens (same address) with the title Scan to Searchable PDF (OCR); it is the fifth tile in the PDF topic; there is no Scan topic and the Workspaces row has two tiles.
- [ ] Renamed tiles and page titles: Add Page Numbers to PDF, Extract Text from PDF, Multiple Pages Per Sheet (N-Up PDF), Remove PDF Metadata (Sanitize PDF), Inspect PDF: Page Size, Metadata and Security, Word and Character Counter. Search "ocr" and "page numbers" still find them. The pre-built page titles in dist match.
Checked: JSON parses and the config was read in Node; the styled home page and a build were not run.

### Money topics (18 Nov)
- [ ] Home has Tax, salary and GST (6 tools) and Loans and investing (9 tools) in place of one money topic; colours emerald and teal; tiles show EMI Calculator, SIP Calculator and so on (text before the colon); page titles show the longer names.
- [ ] Search "emi", "fixed deposit maturity", "provident fund" find the right tools. Checked in Node; the styled page and a build were not run.

### Health and care sheets (20 Nov)
- [ ] The Printables topic shows one new tile, Medicine Schedule Chart Printable; the other four pages are not on the home page or under More tools but are in the sitemap, footer and search.
- [ ] Each of the five addresses opens the same maker on its sheet; the five buttons change the address and keep name, doctor, medicines, paper and ink; Back returns to the previous sheet.
- [ ] Medicine chart: type three medicines (one with 1/2 and one with a long name), set Large print, add two tick weeks. Plan page shows the amounts under the right part of the day, the note, and the reminder line; tick pages show a row per medicine and time with seven boxes and dates; the PDF matches the preview.
- [ ] Health log: toggling columns re-spaces the table; rows and pages work (up to 20 pages). Emergency card: cards give 8 per A4 with cut lines, the fridge sheet one big card; long text wraps and ends with a dot dot dot. Visit sheet: each section can be switched off and the others grow. Caregiver log: 1 to 31 pages, correct weekday and date on each.
- [ ] Print this page prints only the sheet shown at actual size. Search "medicine chart", "bp log", "emergency card" finds the tools.
Checked in Node and an unstyled browser: all five layouts rendered and read by eye (plan, tick chart, cards, fridge sheet, log, visit, caregiver), the link flow with a router stand-in. Full tsc, vite build and the styled page were not run.

### Household, shop and pet sheets (20 Nov)
- [ ] Home: Printables shows Milk and Maid Attendance Calendar and Pet Health Record Card; Jobs and business shows Staff Attendance Register; the other seven pages are not on the home page but are in the sitemap, footer and search ("udhaar", "khata", "pet sitter", "warranty").
- [ ] Each of the ten addresses opens its sheet; the buttons in each family change the address and keep paper and ink and the heading (month, shop or pet name); Back returns.
- [ ] Milk: pick a February in a leap year (29 rows), add a fourth item, totals row on. Budget: edit lines, planned off. Warranty: type 3 items, service log on gives two pages.
- [ ] Attendance: 30 names, 31-day month fits one landscape page; weekday letters and salary columns toggle. Udhaar: 3 names give 3 pages. Daily cash: 7 days give 7 pages with right weekdays. Stock: 60 items spread over pages.
- [ ] Pet record, tracker (6 pages) and sitter sheet print on one page each as expected; download PDF matches the preview; Print prints only the sheet.
Checked in Node and an unstyled browser: all ten layouts rendered and most read by eye, link flow with a router stand-in. Full tsc, vite build and the styled page were not run.

### Private Document Maker and Lock a File (20 Nov)
- [ ] Home: Share privately topic shows Private Document Maker; Lock a File with a Password is not on the home page but is in the sitemap, footer and search ("password protect pdf", "send salary slip safely").
- [ ] Both addresses open the maker; the two buttons switch between writing and locking a file; what was typed in the document is still there after switching and coming back (not after a refresh).
- [ ] Editor: pick each of the nine templates (the "Replace what you wrote?" question appears when the page has text); styles menu (title, headings, quote, code), font and size, bold/italic/underline/strike, colour and highlight, alignment, bullet, numbered and checklist, indent, link (with and without a selection), picture (a large photo shrinks; tap it to resize, align, describe, remove), table (insert; add and delete row and column; header row; stripes; borders; delete), line, page break, signature line, date, the four boxes. Paste text from Word or a web page keeps simple formatting without junk.
- [ ] Look and page: theme, accent colour, A4, Letter, wide, margins, spacing, text size, header, footer and watermark change the editor and the locked page and the printed page.
- [ ] Lock: a short or very common password is refused; Make a passphrase and Make a random password fill the field and the strength bar; Lock takes a few seconds, shows the step messages, downloads a file named locked_date_time_title.html and says it was opened again to check.
- [ ] Open the downloaded file by double-clicking it (a computer) and on a phone (save it, then open it in Chrome or Safari): a wrong password says so; the right one shows the document with the same look; Print or save as PDF works; the watermark prints; Lock again returns to the password screen. Try attaching it to an email or WhatsApp and opening it on another device; note any app that only shows a preview or blocks .html.
- [ ] Lock a file: a PDF, a Word file, a photo and a ZIP each lock, unlock and download the identical file (compare sizes and open them); the unlocked screen shows the original name; a file over 16 MB is refused with a clear message; locking an .html file offers "Show it as a page" or "Offer it as a download".
Checked in a real Chromium from the command line: locked pages for a document, a file and an HTML page opened from `file://` with a wrong and the right password; scripts, handlers and javascript: links in a document were removed; all nine template layouts were rendered after unlocking and read by eye; table, font size, block style and checklist helpers ran in a real browser. The React editor screen, the lock panel and the styled site page were not run, and neither was the full tsc or vite build.

### Teacher and cleaning sheets (20 Nov)
- [ ] Home: Students and writing shows Class Attendance Register; Jobs and business shows Tuition Fee Register and Office Cleaning Checklist; Printables shows Weekly Cleaning Schedule. The other 13 pages are not on the home page but are in the sitemap, footer and search ("PTM", "ODC cleaning", "lift cleaning", "tank register").
- [ ] All 17 addresses open their sheet; the family buttons change the address and keep paper, ink and the heading; Back returns. The closing note under each family reads correctly (cleaning note mentions contractors, not rules).
- [ ] Attendance: 40 students, skip Sundays, month and 3 months; totals columns. Marks: 8 tests, max marks on. Fees: 12 columns start at the chosen month. Timetable: start 09:00, break after 4. Diary: 12 pages. PTM: one page per student.
- [ ] Cleaning checklists: edit the task list (20 tasks), sign-off rows, skip Sundays off by default. Round sheet: 08:00, every 2 hours, 6 rounds, 31 days. Weekly schedule and deep planner on landscape A4.
- [ ] Download PDF matches the preview; Print prints only the sheet.
Checked in Node and an unstyled browser: layouts rendered and most read by eye. Full tsc, vite build and the styled page were not run.

### More printable sheets: 40 pages (20 Nov)
- [ ] Home: Students and writing shows Exam Timetable Planner; Printables shows Wedding Shagun Register, Baby Feeding Log and Habit Tracker; Everyday calculators shows Vehicle Service Log; Jobs and business shows Customer Order Register. The other 34 addresses are not on the home page but are in the sitemap, footer and search ("kitty party", "petty cash voucher", "rent register", "packing list").
- [ ] Open each family's pages (study 6, event 7, baby and family 6, vehicle and home 8, life and business 13); the buttons switch the address and keep paper, ink and the heading. The closing note under each family matches it (the baby note says no medical advice).
- [ ] Typed lists print in the first column: weekly study timetable time slots, packing list and grocery items, chore chart chores, rent and utility months, wedding checklist tasks. A list longer than the rows adds pages.
- [ ] Habit tracker: pick February, three months, weekday letters off. Petty cash voucher: business name prints top right, four to a page. Meeting minutes: 3 and 10 action rows. Kitty tracker: 12 month columns fit one landscape page.
- [ ] Download PDF matches the preview; Print prints only the sheet.
Checked in Node and an unstyled browser: all 40 layouts rendered and about eight read by eye. Full tsc, vite build and the styled page were not run.

### Worksheets, puzzles, certificates, labels, notices and trackers: 46 pages (20 Nov)
- [ ] Home: Kids shows Maths Worksheet and Maze; Students shows OMR Answer Sheet; Printables shows Certificate of Achievement, Name Tags, Recipe Card and Rangoli Dot Grids; Jobs and business shows Society Notice, Content Calendar and Door Signs. The other 36 are not on the home page but are in the sitemap, footer and search ("word search", "sudoku", "gate pass", "place cards", "kitty").
- [ ] Maths worksheet: each kind of sum (division answers are whole numbers, subtraction never goes below zero), stacked and in a line, 60 sums gives three pages, answer page matches the sums, a new puzzle number changes the sums and the same number gives the same sheet.
- [ ] Word search: 24 words, each grid size and direction level; words that cannot fit are left out; the answer page shows the words in bold. Maze: three sizes, six mazes, answer route runs start to end. Sudoku: 4, 6 and 9 grids, three levels, answers match; hard 9 by 9 builds in about a second.
- [ ] Tracing sheet, bingo (3, 4, 5; free space; different cards), OMR (100 questions, 5 choices, 8-digit roll number fits the page), rangoli (all five patterns, six on a page) and recipe card (three sizes, two layouts) print as expected.
- [ ] Certificates: eight pages, four borders, 30 names give 30 pages, long names shrink to fit, wording and signature labels change. Labels: every sheet, repeat on and off, address slashes make lines, door sign custom text, seating chart 24 tables. Notices: text wraps, 14 paragraphs fit, gate pass four to a page.
- [ ] Download PDF matches the preview; Print prints only the sheet.
Checked in Node and an unstyled browser: worksheet, puzzle and recipe layouts rendered and read by eye; certificate, label, notice and tracker layouts rendered. Full tsc, vite build and the styled page were not run.

### Colour themes and fonts for printable sheets (20 Nov)
- Open any records sheet (for example /exam-timetable-printable). Under "Colour, font and lines" pick Ocean, then Serif: the title, rule, table header and striped rows turn blue, text is in Times; the preview matches the downloaded PDF.
- Pick Classic and Sans: output is the same as before this change.
- Typewriter (Courier): typed text still fits cells and wraps inside the page, nothing runs off the edge.
- Certificates: try each border (band, sidebar, tinted, ribbon) with a coloured theme; names stay centred.
- Notice templates: letterhead line, band and box; name tags: header band and filled border.
- Night theme: print preview still readable, no large black areas other than bands.

### Logo, remember and styles on every maker (20 Nov)
- Any records sheet: under "Name on the sheet" add a PNG or JPG logo. It shows in the preview (title bar, certificate top, notice letterhead, each name tag corner) and in the downloaded PDF. Remove clears it. A see-through PNG stays see-through.
- Tick "Remember", type a name, reload: name, logo, theme and font come back. Untick, reload: they are gone. Private window: nothing breaks.
- Certificates with Ribbon, Band and Tinted borders: the logo sits clear of the bands.
- Name tags: paste two columns from Excel (name, class): each tag shows two lines. A list longer than one page makes more pages (up to 12).
- Paper maker, Planner, Meal planner, Care sheets: pick Ocean + Serif; calendars get a blue header band, titles turn blue, text is in Times. Classic or an older ink tone looks as before. Shared paper links with no theme still open.
- Courier on the meal planner and care sheets: typed dishes and medicines still wrap inside their cells.

### Documents, photos and shop sheets: 13 pages (20 Nov)
- /signature-maker: draw with a finger, Undo, Clear, change ink and thickness; Type it shows a script name; download PNG (see-through and white background); the picture is trimmed to the ink.
- /sign-pdf: open a PDF, draw or upload a signature (turn on "see-through" for a photo on white paper), tap the page to place it, size slider, this page / last page / every page; the downloaded PDF shows it in the right place on a phone and a computer. A password PDF gives a clear message.
- /document-scanner: Take a photo opens the camera on a phone; Choose pictures takes several; check Clean colour, Clean gray, Black and white; rotate, trim, reorder, remove; PDF in A4 and in picture size; a very large photo still works.
- /passport-photo-sheet-maker: crop with zoom and move; 35x45, 2x2, custom size; 4x6, 5x7 and A4 fill; print the PDF at 100% and measure a photo with a ruler.
- /photo-grid-splitter: 3x3 square and 3x1; the zip has numbered JPGs; numbering runs 1 at the bottom right to the highest at the top left.
- /photo-collage-maker: 2 to 9 photos, grid and one-big layouts, gap, rounded corners, story and A4 sizes.
- /secret-santa-generator: 4 names with a pair rule, nobody draws themselves or a banned partner; each name opens once; impossible rules show a message.
- /stamp-maker: round and rectangle, curved text fits, worn ink, PNG is see-through.
- /id-card-maker-printable (8 cards on A4, logo in the band, typed and blank), /upi-payment-qr-stand-printable (scan the printed code with a real UPI app; name and amount match), /wifi-password-sign-printable (scan with a phone camera and join), /restaurant-menu-card-printable (sections, leaders, two columns, a long menu goes onto a second page), /question-paper-template-printable (marks add up, MCQ options, =b answer key page, long paper paginates).

### Sitemap lastmod (20 Nov)
- After a build, open dist/sitemap.xml: pages with an entry in updates.ts (for example /merge-pdf, /digitize-documents) have `<lastmod>YYYY-MM-DD</lastmod>`; the home page has the newest update date; pages without an entry have only `<loc>`. No date is in the future.
- Search Console > Sitemaps > open sitemap.xml: status Success, no errors about the date format.

### Take a photo button (20 Nov)
- On a phone or tablet, image tools (/image-resizer, /image-compressor, /image-converter, /images-to-pdf, /screenshot-redactor) show a Take a photo button under the upload box; on a laptop it is not shown. Tap it: the camera opens, the photo loads into the tool like a chosen file. Images to PDF: take two photos in a row and both are listed.
- Tools that take PDFs or documents (merge, compress PDF, etc.) show no camera button.
- /passport-photo-sheet-maker, /photo-grid-splitter, /photo-collage-maker (adds one photo each tap, stops at 9) and the logo picker on the printable makers: same button beside Choose.
- Cancel the camera: nothing changes, no error. A 10 MB phone photo still resizes and compresses quickly.
- iPhone Safari, Android Chrome, and a tablet; Hindi page shows the Hindi label.

### Six new tools (20 Nov)
- /photo-name-date-strip: choose or take a photo, name and date appear on a strip below (or above); white, yellow, black; width 400 and 50 KB gives a JPG under 50 KB with a readable face; a very long name shrinks to fit; no limit (blank) saves at high quality.
- /fill-pdf: open a one-page and a multi-page PDF (and a scanned one); Text, Tick and Cross placed with a tap; drag an item to move it; Today's date; size and colour; the downloaded PDF has everything where it was on screen (open in a phone viewer and a computer viewer); "Rs." works, a rupee sign or Hindi shows the message; a password PDF shows the message.
- /whatsapp-link-generator: India 98765 43210 with a message gives https://wa.me/919876543210?text=...; a leading 0 is removed; Test the link opens WhatsApp; scan the QR with a phone camera; too short or too long a number shows a message.
- /barcode-generator: Code 128 "SKU-1042" scans with a phone scanner app; EAN-13 400638133393 (check digit 1 added) and 4006381333931 scan; a wrong last digit explains the right one; PNG and the A4 label sheets (12, 21, 24) print at 100% and scan.
- /random-name-picker: 10 names, pick 1 then 3; no repeats until Start over; "Everyone has been picked" message; duplicate names are separate entries.
- /random-team-generator: 7 names into 3 teams gives 3, 2, 2; people per team 3 gives 3 teams; shuffled order is numbered; Copy result pastes cleanly.
- Home page lists the six tools; /sitemap.xml after a build lists them with dates.

### Install app, Your tools and offline (20 Nov)
- After deploy, in Chrome on Android: open the home page, the install bar shows Install (or the browser menu shows Install app); install, open the icon: it opens full screen with the orange wrench icon and no address bar. Long-press the icon: shortcuts Merge PDF, Image Resizer, Sign PDF.
- iPhone Safari: the home page bar says tap Share then Add to Home Screen; Add; the icon is correct. Chrome on iPhone shows no bar.
- Hide the bar with the X: it stays hidden for 30 days. Not shown inside the installed app.
- Open three tools, go home: "Your tools" shows them under Recently used. On a tool page tap Pin (star turns filled): the tool moves to Pinned on the home page; tap again to unpin; Clear empties both; a private window does not break anything; search hides the row.
- Offline: open a few tools online, then turn on airplane mode and open the app: home and the visited tools open and work (merge, compress, calculators); a tool never opened offline falls back to the home page. Ads simply do not show.
- After a new deploy, reload once online: the new version appears (pages are network first). DevTools > Application > Service Workers shows /sw.js activated; the cache holds only same-site files (no googlesyndication, no googletagmanager).
- Google Search Console: pages still fetch normally with "Test live URL" (the service worker does not affect crawlers).

### Why trust us page and 11 new guides (20 Nov)
- /why-trust-us opens from the footer ("Why trust us") and from About; one H1, no horizontal scroll at 360 px; the links at the bottom work; after a build the page is in dist/why-trust-us/index.html and in the sitemap.
- Run the two-minute test on the page yourself: open Merge PDF, go offline, merge two PDFs, it still works.
- /guides lists 49 guides (15 from toolGuides.ts); open each new one (sign PDF, fill PDF, scan, passport photos, name and date strip, WhatsApp link, barcode labels, UPI stand, Secret Santa, random teams, certificates and name tags): the "Try it" buttons open the right tools; every step matches the tool as it is today.
- The "reduce a photo" and "passport photo and signature" guides now point to the Image Resizer presets and KB buttons, not to pages that no longer exist.

### Safe sharing: Redact PDF, Compare PDF and Text, Remove Location from Photos (21 Nov)
Not run in the build environment (no packages, no browser). Please check on a real phone and a computer.
- /redact-pdf: open a text PDF, type a word that appears twice, tap Find and cover (boxes appear on every match; remove one); draw a box with a finger in Draw mode; Scroll mode moves the page; download, open the file, try to select or search the covered text (must not be possible); pages without boxes still have selectable text; turn off "Keep other pages as normal text" and every page becomes a picture; a scanned PDF still works with hand-drawn boxes; a password PDF shows the message; a long PDF (100+ pages) works, slowly on a phone; document title and author are empty in the result.
- /compare-pdf-and-text: paste two texts with one changed word (Word by word marks only that word); lines mode with "Show only the changed lines"; two PDFs with text; a scanned PDF shows the OCR message; two long unrelated texts show the "too long" message instead of freezing; identical texts say "No difference found".
- /remove-photo-location: a phone JPG with location on shows coordinates, phone, time and the map link (check the spot is right); a photo with location off says no hidden details; a PNG shows the "only JPG details" line; the clean copy has no location (open it in the tool again) and looks upright; several photos with Clean all (allow multiple downloads); camera button on a phone.
- /guides lists the three new guides; the home page lists the three tools under PDF tools and Image tools.

### QR scanner, Fill PDF fields, Hindi OCR, Related tools and collection pages (21 Nov, second batch)
A fill-in results sheet covering these and every earlier pending check is in `TEST-RESULTS-TEMPLATE.md` (repo root). Not run in the build environment: no packages could be installed and no browser was available, so nothing in this batch has been built or opened. Run `pnpm install` first (new packages `qr-scanner` and `@tesseract.js-data/hin`).

### No-limit tools and the free promise (21 Nov, third batch)
Not run in the build environment: no packages, no build, no browser. Test on a real phone and a computer; sheet K in `TEST-RESULTS-TEMPLATE.md`.
- /make-pdf-fillable: draw a text box, a tick box and a drop-down; download; open in a phone viewer and a computer viewer and type into them; repeat on a page rotated 90 degrees (fields must sit where drawn); two fields with the same name must be refused.
- /smart-split-pdf: every N pages; blank-page mode on a scanned batch with blank separators; bookmarks on a PDF with a table of contents; by size (parts under the limit); read the list before downloading; ZIP opens.
- /bulk-image-tools: 30+ photos to WebP with a watermark; ZIP size matches the before and after line; check the phone does not run out of memory with about 100 photos.
- /pdf-bates-numbering: three PDFs with keep counting on; check numbers run unbroken; header/footer tokens {page}, {pages}, {file}, {date}; rotated page.
- /social-image-resizer: Fill and Fit, move the crop, ZIP of sizes with the right pixel sizes.
- /gif-maker: 5 pictures, 1 second each; GIF plays in WhatsApp and a browser; loop on and off.
- Promise: green badge shows on those tools and on Merge/Compress/Split but NOT on Document Scanner or Digitize Documents; home strip and /free-no-limits load; footer link works; Sign, Fill, Redact and Compare accept a large file with no size message.

### One promise pill (21 Nov, fourth batch)
Not run in the build environment. Check on a phone: every tool page shows ONE orange pill under the back link (full wording on PDF/photo tools such as Merge, Fill, Smart Split, Bulk Images; "Stays in your browser" on calculators, text tools, sheet makers, the scanner and Digitize Documents); tapping it opens /free-no-limits or /why-trust-us; no green box anywhere; the home page shows the pill and the tool count only, no green strip; Fill PDF, Redact, Compare, Remove Location, Sign and Passport Photo no longer repeat "stays in your browser / never uploaded" under the tool.

### Home page top (21 Nov, fifth batch)
Not run in the build environment. On a phone and a computer: headline "Free PDF, photo and everyday tools. No limits. Nothing uploaded."; one orange pill above it; search box; four quick-link buttons (PDF, Photo, QR and sharing, Everyday) that open the collection pages; request link underneath; nothing overflows at 360 px width; search still filters the tool list. Page title and meta description in the browser tab / view-source (description now mentions no limits).

### Home hero v2 and eight topic pages (21 Nov, sixth batch)
Not run in the build environment. Desktop (1280 px+): hero is two columns (tags, headline, description, search and request link on the left; 13 tiles on the right), no wide empty bands. Phone: tags, headline, search, then the tiles in 2 columns. Check the label "Browse N+ tools" (N is the number of tool pages rounded down to ten), each tile's count, and that every tile opens its page: /pdf-tools, /photo-and-image-tools, /tax-and-salary-calculators, /loan-and-investment-calculators, /everyday-tools, /qr-and-sharing-tools, /printables-and-templates, /jobs-and-business-tools, /student-and-writing-tools, /kids-learning-tools, /sports-and-fitness-tools, /developer-and-data-tools, and /display-studio (the tool itself). Each new page lists all its tools. Search still filters the home page tool list.

### Hero polish (21 Nov)
Not run. Desktop: left and right hero columns are the same height (tiles stretch to the left column); the last tile (Display and slides) is a full-width bar; headline is one size smaller; the last tag reads "Why is it free?" and opens /why-trust-us. Phone: last tile spans both columns.

### Hero polish 2 (21 Nov)
Not run. Headline "Free online tools and calculators / for PDFs, photos, money and everyday work." (smaller on phones); "Browse N+ free tools" is large above the tiles and N matches the topic pages; "Why is it free?" opens /free-no-limits which starts with that answer; wider hero and grid on desktop (4 tile columns at xl); Display tile is a normal tile; on a phone the search box and the request box run edge to edge.

### Free page and count (21 Nov)
Not run. Home: heading reads "Browse 250+ tools and templates". /free-no-limits now has a whole-site title ("Why MyDailyUtils is free...") and starts with "Why is it free?". Linked from the hero tag, the footer, the full-wording pill on file tools and the sitemap.

### Related tools in the same box (21 Nov)
Not run. On a tool page, Related tools is a white rounded box with the same small heading and + sign as the questions, the same width as the other sections, open by default, and it folds with the page Collapse all button. Tiles are two across on a phone-wide screen and larger, one column on very narrow phones.

### Topic pages with task tables (21 Nov)
Not run. Open each of the 13 topic pages from the hero tiles (including /display-and-presentation-tools). Check: smaller headline; "What can I do here?" table (stacked rows on a phone, three columns from sm up) and every tool link opens the right tool; "Ideas for your situation" cards; the full tool list at the bottom. Read the rows against the tools for accuracy. Hero tiles now use each topic's colour (the same as the sections below) and brighten on hover.

### Header width and popular tools (21 Nov)
Not run. Desktop: logo and header buttons line up with the hero's left and right edges; footer too. Home: row is called "Our popular tools" with 12 tiles (merge, compress, fillable, smart split, redact, tax, EMI, bulk photos, social sizes, sign, remove location, resume); tiles and the Workspaces cards are noticeably smaller; nothing is cut off. The 404 page's popular list still looks sensible.

### Alignment and topic page header (21 Nov)
Not run. Desktop: the hero's left and right edges line up exactly with the logo and header buttons, the tool grid and the footer. Topic pages (e.g. /pdf-tools): back link, headline and subtitle are left-aligned like a tool page, with the tags row under the subtitle.

### Popular tiles (21 Nov)
Not run. "Our popular tools" tiles: icon and title side by side, one-line description below, same shape and height as the Workspace cards; no tile is taller than the Workspace cards.

### Orange action buttons (21 Nov)
Not run. In Merge, Split, Compress, Rotate, Crop, Watermark, Protect, Unlock, Flatten, Organize, Delete Pages, Page Numbers, N-Up, Images to PDF, Sanitize, Sample PDF, Court Guide and the POS backup buttons: the Save / Download button is orange (same as the main action button) while the "Ready" panel and check marks stay green. Download again in the Master Document Studio is an orange outline.

### Topic page header symmetry (21 Nov)
Not run. On /pdf-tools and the other topic pages the header looks like a tool page: "All tools" link and one pill (Free · No limits · Stays on your device) on the same line, then the headline and the subtitle, all left-aligned; no separate tag row.

### Jump-link scroll gap (21 Nov)
Not run. On a phone, tap a topic chip (for example PDF tools) under the search box: the topic panel stops with the same small gap below the sticky header as the gap between two panels (about 12 px), not a larger one.

### Your tools columns (21 Nov)
Not run. Pin a few tools and open a few more: the Your tools box (Pinned, Recently used) now shows tiles in the same 4 columns, same size and spacing as the topic sections below (1 column on phones, 3 on tablets).

### Advanced colour picker (22 Nov)
Not run. Every place that asks for a colour (Colour Converter, Watermark, Image Resizer, QR and Bulk QR, Resume, Price Tag, Screenshot Redactor, Photo Collage, Visiting Card, Display Studio, Social Image Sizes, Job Description, Document Editor text colour) shows the same swatch button. Tap it: a sheet opens with the colour area, hue slider, hex box, RGB boxes, Recently used and Ready colours. Cancel or Escape keeps the old colour; Done keeps the new one and adds it to Recently used. "Pick from screen" appears only in Chrome and Edge on a computer. Check it on a phone (drag works, sheet fits, no page scroll behind it). In the Document Editor the text you selected is recoloured.

### Unix Timestamp Converter upgrade (22 Nov)
Not run. Live clock (seconds and milliseconds, Copy). Paste 10, 13, 16 and 19 digit values: the unit note says seconds, milliseconds, microseconds, nanoseconds. Zone picker changes the time shown; the table has ISO, RFC 2822, relative, weekday, day of year, ISO week and quarter. Date to timestamp respects the chosen zone. Add or subtract (including 31 Jan + 1 month = 28/29 Feb). Time between two timestamps. Batch: paste several, Copy as CSV.

### JSON to CSV Converter (22 Nov)
Not run. /json-to-csv-converter: use the sample, a .json file and pasted text. A file with several lists asks which one. Nested objects become dotted columns; the three list modes work; unticking columns removes them; separator, quote-all, header, empty text and BOM options change the file. Open it in Excel (Hindi text correct) and Google Sheets. A cell beginning with = shows a leading apostrophe unless formula-safe is off. Invalid JSON shows the error and the "Remove comments and trailing commas" button when it applies. After Save, changing any option marks the saved file outdated.

### JSON Viewer (22 Nov)
Not run. /json-viewer: sample, file, paste. Tree: arrows open/close, Expand all, Collapse all, Level 1 to 4. Search jumps between matches, opens parents, Enter and Shift+Enter move. Tap a row: path (e.g. $.branches[0].city) with Copy path and Copy value. A list of over 100 items shows "Show more". Sort keys A to Z. Table view with filter and the link to JSON to CSV. Text view with 2, 4 and minified, Copy and Save. Try a 20 MB file on a phone and note any slowness.

### Free-more tools (22 Nov): Resize PDF Page Size, PDF Booklet Maker, Grayscale PDF, Extract Images from PDF, Audio Cutter and Joiner
Not run. Check each on a phone and a computer; all use the standard upload box, file bar, orange main button and green Save banner.
- [ ] Resize PDF Page Size (/resize-pdf-page-size): a mixed-size PDF becomes all A4; a PDF with sideways (rotated) pages comes out upright; Fit, Fill, Stretch and a 10 mm margin look right; text is still selectable; changing a setting after saving turns the banner amber and brings the main button back.
- [ ] PDF Booklet Maker (/pdf-booklet-maker): an 8-page PDF lists Front 1: 8 | 1, Back 1: 2 | 7, Front 2: 6 | 3, Back 2: 4 | 5; a 5-page PDF shows blanks. Print a 4-page test double-sided (flip on short edge) and fold: pages read 1, 2, 3, 4. Right-to-left swaps the sides.
- [ ] Grayscale PDF (/grayscale-pdf): grey and black-and-white both work on a colour PDF, a photo PDF and a scan; progress shows page by page; the note about text not being selectable is visible; a 100-page file does not crash a phone.
- [ ] Extract Images from PDF (/extract-images-from-pdf): a PDF with photos gives a ZIP of .jpg files opening at original quality; a PDF with logos/PNG gives .png with transparency kept; "Skip tiny icons" removes bullets; a text-only PDF shows the "No pictures found" note.
- [ ] Globe Video Maker (/globe-video-maker): a photo added to a stop pops up above its name when the trip reaches it and fades when it leaves, and the stop is held a little longer; a logo shows in the chosen corner and size; music plays in the saved video, fades out at the end and the video still plays in the gallery and WhatsApp (on a phone where Smooth mode cannot add music, the note says it is recorded in real time); distance labels show km or miles; route colour changes the line, the marker and the label; with 3 or more stops each leg can have its own vehicle; Show night shades the far side and stays put while the camera moves; photos, logo and music are gone after reopening the page (settings stay); typing "bangalore", "bombay" and "saigon" finds Bengaluru, Mumbai and Ho Chi Minh City; typing "hosur" shows Search more places, tapping it finds Hosur in Tamil Nadu (and the button is not shown again for that letter); with no connection the button shows a retry message; picking a city shows a tick box "Highlight <country>" that colours the country in the preview; Train, Car, Bus and Ship show the vehicle and switch the route to flat, Plane switches it back to lifted, Railway line shows track; Smooth mode (default) shows a progress percentage and time left, finishes with an MP4 of the chosen length at 30 and at 60 frames a second, and plays smoothly in the phone's gallery; Quick mode still works; a browser without Smooth falls back to Quick with no mode choice shown; on a real phone, India to United States previews and plays; typing "Tokyo", "UK" and "28.61, 77.21" each find a place; Add a stop in between works and the globe visits it; all six looks change the preview; 9:16, 16:9, 1:1 and 4:5 change the shape; Make video records in about the length chosen, plays back and saves (MP4 on iPhone and Chrome, WebM where MP4 is not offered; check WhatsApp and Instagram accept it); 1080p on an older phone shows the slow-device note or stays smooth; Save picture gives a PNG; Start again needs a second tap and resets places and looks; closing and reopening the page keeps the settings.
- [ ] Globe Video Maker links: /globe-video-maker shows an "Ideas to start from" line linking all six globe pages (not shown on the six pages themselves, which have their own "More globe videos" line); the Media hub question about making a globe video links the same six pages.
- [ ] Globe Video Maker layouts and pages: on /globe-video-maker the "Start from an example" buttons fill in places, look and title; Route type has A to B, One to many and Places visited; One to many draws a line from the first place to each other place and pins pop as lines arrive; Places visited shows pins without lines; the seconds minimum rises with more places. Each of /travel-route-video-maker, /flight-path-animation-maker, /moving-abroad-announcement-video, /export-shipping-route-video-maker, /globe-intro-video-maker and /countries-visited-map-video opens with its example, has 4 steps, 8 questions and 3 article sections, keeps its own saved settings apart from the main tool, and links to the others.
- [ ] Globe Video Maker 4K and GPX: in Chrome or Edge the quality list shows 4K; a 5 s 4K video saves as MP4 at 2160 pixels on its short side and plays; with music in a browser that cannot encode AAC, 4K cannot be made and the hint says to pick 1080p; Import a GPX route (trip layout) with a real .gpx file fills 2 to 5 places with a note, a wrong file shows the message and changes nothing; the places are in order and the video plays.
- [ ] Globe Video Maker face and place pictures: choose My photo as the moving marker, add a photo, move the zoom and position sliders, and the round badge in the preview follows them and travels the route; without a photo a dot shows; on a stop, Use a picture of this place shows a picture and its credit under the stop, again says Try another picture, and the credit line appears at the bottom of the video while the picture is shown; a place with no free picture shows a message; Add place pictures to stops without a photo fills only stops without your own photo; nothing is saved after reload.
- [ ] Audio Cutter and Joiner (/audio-cutter-and-joiner): an MP3, an M4A and a WhatsApp voice note all open; two files join in the order shown; start/end typed as 1:02.5 and the sliders agree; Play plays the chosen part with fades; the saved WAV plays in the player and on the phone; a 31-minute file shows the memory limit message.

### Kids fixes (22 Nov)
Not run. (1) Addition, Subtraction, Long multiplication and Long division lessons on a laptop (about 800 px tall window): the board, the sentence and the Back / Play / Next buttons are all visible without scrolling, in Watch and You try, and the board is still readable. (2) Learn the Clock on a phone and a laptop: red and blue dots sit on the hand tips; drag each dot and it follows smoothly; touching near a hand moves that hand; touching the middle moves the hour hand, the outer dial moves the minute hand; five-minute steps are the default; Hour and Minutes buttons are visible without opening anything; the Quiz clock is also easier to move.

### Kids tools: desktop and phone layouts (22 Nov)
Not run. On a laptop (1366x768 and 1920x1080) and a phone, open: Addition, Subtraction, Long multiplication, Long division, Kids Money Shop (Pay, Give change, My shop), Shadow Explorer (Explore, Quiz), Learn the Clock (Learn, Quiz). Laptop: the page is wide, the picture or board sits on the left and the controls on the right, and the buttons you press every step (Back/Play/Next, Check, Pay, Next question) are visible without scrolling; nothing overlaps or looks stretched; the tab buttons are not stretched across the whole page. Phone: one column, as before, nothing cut off, the lesson board does not push the buttons off the first screen. Not changed: Solar System Explorer and Tambola, which are forms and printouts.

### Audio and video topic (22 Nov)
Not run. Home page: the "More tools" section is gone (it only held the Audio Cutter and Joiner); a new Audio and video tile (music icon, yellow) sits in the Browse tiles and links to /audio-and-video-tools, which lists the Audio Cutter and Joiner with its task list and guide text; the same tool is listed under an Audio and video heading in All tools by topic; the topic's icon badge and border are yellow on the home page and the tile; /audio-and-video-tools is in the sitemap; the Photo and images page no longer lists the audio cutter.

### Final section names (22 Nov)
Not run. The 14 section names are identical on the home page headings, the Browse tiles, the header tools menu, the footer and each section page's address (see the table in README.md). Browse shows 14 tiles with no clipped text on a phone. No "More tools" section appears. Classroom Quiz Display is under Display and presentation (not Student and writing); Vehicle Service Log is under Printables; WhatsApp Link Generator and Barcode Generator are under QR and sharing; each section page's task table lists only tools in that section. Section addresses did not change.

### Section pages: guides, common questions, related sections (22 Nov)
Not run. Open each of the 14 section pages. Order after the task table and situations: "How-to guides for this section" (up to 6, each links to a real guide), "Common questions" (5 collapsible questions, closed by default, readable on a phone), then the existing "How to choose" and trust text, "All N tools" and "Related sections" (three pills linking to other section pages). View page source or the pre-rendered HTML: the same guide titles and questions appear as plain text. Check no answer states a tax, exam, medical or legal rule, and each answer matches the tool. New guides open: /guides/how-to-extract-pages-from-a-pdf, /guides/how-to-make-a-quotation-for-a-customer, /guides/how-to-make-a-visiting-card-and-print-it. The passport photo guide has a new "If the form still rejects the file" section. Section addresses and headlines did not change. Sitemap has 358 URLs.

### Information pages: left-aligned header (23 Nov)
Not run. Open /whats-new, /guides, any guide, /contact (and /contact?tool=quotation-generator), /about, /why-trust-us, /editorial-policy, /free-no-limits, /privacy, /terms and a made-up address (404). Each has the All tools back link and the Free, No limits, Stays on your device pill on one line, then a left-aligned headline and subtitle, the same as a section page. Nothing is centred in the header. Check phone and desktop widths.

### Linked answers (23 Nov)
Not run. On each of the 14 section pages open every Common question: the tool names in the answers are orange underlined links that open the right tool (no link goes to a missing page). Open three guides: the first mention of each tool in the text is a link, later mentions are plain, and the Try it list still shows every tool. Open a tool page and its written sections and questions: other tools named there are linked once and the page never links to itself. Check on an older iPhone or Safari that the pages still load (no regex error). View the pre-rendered HTML of a section page: questions appear as plain text with tool names and no curly-brace markers.

### Exercise library, yoga and Build me a workout (23 Nov)
Not run in a browser or on a phone. Workout Planner: tap 5 minutes with no equipment and check a warm-up, main part and cool-down fill in and the total time is close to 5 minutes; repeat for 10, 15, 20 and 30 with equipment. Open the details box, pick Yoga, Beginner, 20 minutes and check the plan ends with Corpse pose. Press Build another and check the moves change. Undo brings back the previous plan. Exercise Library: tap Yoga, open a pose and check both pictures show and fade; check the equipment filter label reads Bands, kettlebell, ball or other. Add yoga poses in the Interval Timer, Routine Display and the slideshow. Tap Morning yoga and Evening wind-down. Check page size on a slow phone connection, because the pictures are about 7 MB in total but load only when shown.

### Weekly workout plans, smoother yoga, sport rules (23 Nov)
Not run in a browser or on a phone. Weekly Workout Plans: switch Gym, At home and Yoga and 3, 4 and 5 days (nine plans); the first day is open, each move shows a picture, muscles, equipment and sets or hold; Copy the whole week and Copy this day paste cleanly; "Show this day on a screen" opens the Workout Planner with that day filled in. Yoga: in the Exercise Library, Workout Planner slideshow, one-screen view, Interval Timer and Routine Display a yoga pose moves smoothly start, middle, hold and back, and stays still with reduce motion on. Court guide: each of the 12 sports shows "How to play <sport>" and "<sport> playing rules" with the short check-the-rules note.

### Six more sports and fitness tools (23 Nov)
Not run in a browser or on a phone. Match Score Keeper: for each of the six sports play a game and check the score, the win by two rule, the change ends reminder, Undo and the match winner; reload the page and check the score is still there; New match clears it. Tournament Fixtures Maker: try 4, 5 and 8 teams in each format, check every team plays every other once, byes in the knockout, enter scores and check the points table order, Copy the fixtures, reload and check it is kept. Cricket Run Rate Calculator: check a chase (180 to win, 92 after 10 overs needs 8.80 an over), net run rate with a bowled-out team, invalid overs such as 18.6 show an error, player stats. Workout Log: log 60x8, 60x8, 65x6, check history, progress line and New best on a second better day, delete an entry, copy as CSV, reload. One-Rep Max and Plate Calculator: 80 kg for 6 reps is about 95 kg; 100 kg on a 20 kg bar is 25 + 15 on each side; switch to pounds. Running Pace Calculator: 5 km in 30 minutes is 6:00 per km and 10 km/h; try all three modes, miles, splits and predictions. On every new page check the guide text, FAQs and that the section page and home page counts show 12 sports and fitness tools.

### Cricket Scorer and Quick Scoreboard (24 Nov)
Not run in a browser or on a phone. Cricket Scorer: tap 1, 4, 0, 6, 2, 0 and check 13/0 at 1.0 overs with six balls shown; a wide adds 1 and the overs do not move; No-ball then 4 adds 5 and shows Free hit; Wicket updates wickets and resets the partnership; Undo steps back; set 2 overs and check the innings ends after 12 fair balls and offers the chase with target +1; in a chase check runs needed, balls left and required rate; reload and check the innings is kept; New match clears it. Quick Scoreboard: for each game check the buttons, tap scores for both sides, fouls in basketball, start, pause and reset the clock, change the period, Undo, New game, reload keeps it; the big screen button works on a laptop and is hidden on an iPhone. Check the section page and home page now show 14 sports and fitness tools.

Cricket Scorer over by over (24 Nov): not run in a browser. Score two overs including a wide, open Over by over (it is closed at first) and check each over shows its balls, runs, wickets and total, newest over first, and that the over in progress is labelled.

### Start again buttons (24 Nov)
Not run in a browser or on a phone. For each of Cricket Scorer, Match Score Keeper, Quick Scoreboard, Tournament Fixtures Maker, Workout Log, Seating Plan, Spinner Wheel, Job Description Builder, Menu Board, Notice Board, Timings Board, Spelling Bee, Routine Display, Exam Hall and Interval Timer: add some data, tap the clear or new button once and check it turns red and asks "Tap again", wait 4 seconds and check it goes back to normal without clearing, then tap twice and check the data is cleared and a reload keeps it cleared. The button is disabled when there is nothing to clear.

### Court size pages for kho kho and kabaddi (24 Nov)
Checked in the sandbox: the written sizes, diagonals, baulk and bonus distances match `courtData.ts` (`scripts/check-sports-fitness-logic.mjs`, 100 checks) and the stub-typed `tsc` is clean. Not run: the real `tsc`, `vite build`, the prerender step, a browser or a phone.

Check after deploy:
- [ ] `/kho-kho-court-size` and `/kabaddi-court-size` open and show the court drawn to scale with the sport already chosen, no sport list and no Fit my space tab. Kabaddi still has the Version list (men, women, sub-junior).
- [ ] Sizes read: kho kho 27 m x 16 m (88 ft 7 in x 52 ft 5.9 in); kabaddi men 13 x 10 m, women 12 x 8 m, sub-junior 11 x 8 m. Marking plan shows diagonals 31.38, 16.4, 14.42 and 13.6 m.
- [ ] Each page has 4 steps, 3 written sections and 8 questions; the last is about privacy and names the site. Save as image and Save as PDF work.
- [ ] View page source (or turn off JavaScript) on each page: the heading, steps, sections and questions are in the HTML, the title and description are unique, and the canonical link is the page's own address.
- [ ] `https://www.mydailyutils.in/sitemap.xml` lists both pages. `/sports-court-size-guide` shows "Open the Kho Kho court size page" when kho kho is chosen, and the same for Kabaddi; other sports show no link.
- [ ] Sports and fitness section page FAQ answers both sizes with working links. What's new has the 24 Nov entry.
- [ ] At 360 px nothing scrolls sideways.
- [ ] Search Console: submit the sitemap, then URL Inspection and Request indexing for both pages. Note the date, then check the Pages report and Performance (queries "kho kho court size", "kabaddi court size") after two to three weeks.

### Court size pages for every sport (24 Nov)
Checked in the sandbox: 101 logic checks (every length written in the page text agrees in metres and feet; each page has 4 steps, 3 sections, 8 questions) and the stub-typed `tsc`. Not run: the real `tsc`, `vite build`, the prerender step, a browser or a phone.

Check after deploy:
- [ ] Each of the 12 addresses opens (badminton, tennis, pickleball, basketball, volleyball, cricket pitch, hockey, table tennis, squash, football, kho kho, kabaddi) with that sport chosen, no sport list and no Fit tab.
- [ ] On /sports-court-size-guide, choose each sport: the address changes to that sport's page. In Fit my space, "Show this court" opens the right page and version.
- [ ] Spot check sizes against a source you trust: badminton 13.4 x 6.1 m, tennis 23.77 x 10.97 m, pickleball 13.41 x 6.096 m, basketball 28 x 15 m, volleyball 18 x 9 m, football 105 x 68 m, hockey 91.4 x 55 m, table 2.74 x 1.525 m, squash 9.75 x 6.4 m.
- [ ] Each page has its own title, 4 steps, 3 sections and 8 questions (last one on privacy). Page source shows the text and its own canonical.
- [ ] The sitemap lists all 12 pages. The Sports and fitness section FAQ links work. At 360 px nothing scrolls sideways.
- [ ] Search Console: request indexing for the new pages (the two pilot pages first), then check the Pages report.

### Court size page link in the main guide (24 Nov)
- [ ] /sports-court-size-guide opens on Badminton and shows "Open the Badminton court size page" under the summary; it opens /badminton-court-size. Choosing another sport opens that sport's page straight away. Not run in a browser.

### Tournament size pages (24 Nov)
Checked in the sandbox: 103 logic checks (the page text equals what the generator makes from the fixtures code; no match is repeated; match and bye counts) and the stub-typed `tsc`. Not run: the real `tsc`, `vite build`, the prerender step, a browser or a phone.

Check after deploy:
- [ ] /round-robin-schedule-6-teams opens with 6 teams (Team 1 to Team 6) and "Round robin, everyone plays once" chosen; the on-screen rounds match the written match list further down the page (15 matches, 5 rounds).
- [ ] /round-robin-schedule-5-teams: one team rests in each round. /knockout-bracket-6-teams: Team 1 and Team 2 have byes, 5 matches in all. /knockout-bracket-8-teams has no byes.
- [ ] Type scores on one page, reload: they stay. Open /tournament-fixtures-maker: its own teams and scores are not changed. New tournament and Clear all results work on a size page.
- [ ] Every page has its own title, 4 steps, 3 sections and 8 questions; page source shows the text and its own canonical. All 13 are in the sitemap. The main tool and the section FAQ link to them. No sideways scroll at 360 px.
- [ ] Search Console: request indexing for a few of the pages each day.
