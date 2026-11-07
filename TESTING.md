# Testing notes

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
