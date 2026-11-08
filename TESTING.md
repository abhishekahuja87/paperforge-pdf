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

## Future changes

Start with focused checks for the changed behavior and its directly affected
surfaces. Expand to broader checks when shared code, dependencies, risk, or a
failure warrants it; do not treat the baseline above as proof for new changes.
