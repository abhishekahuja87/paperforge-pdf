/** Text of the "Free, no limits" page. One source for the page and the pre-rendered HTML copy. */
export interface FreeSection {
  heading: string;
  paragraphs: string[];
}

export const FREE_NO_LIMITS = {
  path: '/free-no-limits',
  title: 'Free PDF and photo tools with no limits, no sign-up and no upload',
  subtitle: 'Most online PDF and photo tools cap your files, count your uses or ask you to pay. These do not.',
  description:
    'Merge, split, compress, fill, redact, compare and number PDFs, and resize, convert and watermark photos in bulk, free. No daily limit, no file-count limit, no sign-up, no watermark and no upload.',
  sections: [
    {
      heading: 'Why is it free?',
      paragraphs: [
        'There is no paid plan and no hidden catch. The work happens on your device, so it costs us very little to run, and the site is paid for by advertising shown through Google AdSense, not by your files or your data. Every tool on the site works this way, not only the PDF and photo tools. Read the full explanation on the why-trust-us page, including a two-minute test you can run to see the tools working offline.',
      ],
    },
    {
      heading: 'What “no limits” means here',
      paragraphs: [
        'There is no daily limit, no cap on how many files or pages you use at once, no sign-up, no trial, no watermark on your results and no paid plan. Your files are handled inside your browser, so nothing is uploaded and nothing is waiting in a queue.',
        'The one honest limit is your own device. Very large files use your phone or computer’s memory, so a huge scan may be slow on an older phone. Nothing on our side stops you.',
      ],
    },
    {
      heading: 'Things many sites charge for or cap, free here',
      paragraphs: [
        'Make a PDF fillable: draw text boxes, tick boxes and drop-downs on any PDF, then fill and save it. Fill any form and keep the file.',
        'Smart split: cut a PDF every few pages, at blank separator pages, at bookmarks, or into parts under a size you choose, then download all parts in one ZIP.',
        'Bulk photo tools: resize, convert, compress and watermark many photos at once, with a before and after size, and download one ZIP.',
        'Bates numbering: stamp running numbers, file names and dates in the header or footer across many PDFs, continuing the count from one file to the next.',
        'Multi-size images: turn one picture into square, portrait, story, banner, cover and thumbnail sizes together.',
        'GIF maker: turn pictures into an animated GIF with no watermark.',
        'Redact, compare and sign PDFs, merge and compress without page or size caps, and remove hidden location from photos.',
      ],
    },
    {
      heading: 'What these tools do not do',
      paragraphs: [
        'They do not replace a lawyer’s redaction review, a court-approved filing system or paid desktop software for professional print production. Check every result before you send it, and keep your original file.',
      ],
    },
  ] as FreeSection[],
};
