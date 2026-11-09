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

### Offer Poster Maker

Checked in the sandbox (headless Chromium, no Google Fonts because the sandbox has no network, so system fonts were used): all 8 designs drawn in post, portrait, story and A4 with 2, 4, 6, 9, 12 and 15 products, with empty name, heading, tagline, prices and badges; no errors, text fits, story safe zones clear, list design readable. Component, `tsc` and `vite build` were not run.

Check after deploy:
- Open /offer-poster-maker on a phone and a desktop. The designs should show Teko, Pacifico, Playfair, Rozha One, Baloo 2 and Poppins, not plain fonts. In DevTools Network, only fonts.googleapis.com and fonts.gstatic.com are contacted, and only on this page.
- Change shop name, prices and a photo; thumbnails and preview update. Old price is struck through, the percentage badge is right (699 to 499 = 29%).
- Download PNG in each size; open it and confirm the dimensions and that fonts match the preview. Story: nothing important in the top 150 px or bottom 190 px.
- Long shop name, 12 products, a Hindi product name, an empty price, a very large photo. Block fonts.googleapis.com and reload: the page still works with plainer fonts and shows a notice.
- Reload: shop details are remembered, photos are not.
- /offer-poster-maker is in search on the home page, footer and sitemap; PrivacyPage section 4 mentions Google Fonts.
- Change the corner badge to FLAT 200 OFF and a product badge to NEW; clear a badge, a name, and the Instagram box: each disappears and the footer re-spaces. Switch Bigger photos / Balanced / Bigger text. Choose 15 products and zoom into the PNG: names and prices should be readable.
