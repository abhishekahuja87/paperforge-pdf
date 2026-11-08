/**
 * How-to guides shown under /guides. Plain data (no React) so the build-time page generator
 * can use it too. English only for now. Every claim about a MyDailyUtils tool must match what
 * the tool really does; read the tool before editing a guide.
 */
export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface Guide {
  slug: string;
  title: string;
  /** One sentence for the hub list and the meta description. */
  description: string;
  /** Tool ids (see src/config/tools.ts) shown as "Try it" links. */
  tools: string[];
  sections: GuideSection[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'reduce-image-size-for-online-forms',
    title: 'How to reduce a photo to 20 KB, 50 KB or 100 KB for online forms',
    description: 'Why upload forms reject photos, what size and format to aim for, and how to shrink a picture without it turning blurry.',
    tools: ['resize-image-to-20kb', 'resize-image-to-50kb', 'resize-image-to-100kb', 'image-resizer'],
    sections: [
      { heading: 'Why forms reject your photo', paragraphs: [
        'Exam, job and government portals often accept only small files, commonly somewhere between 20 KB and 200 KB, and sometimes only a particular width and height. A phone photo is usually several megabytes, so it has to be shrunk first. The exact limit is printed on the form page, so read it before you start; this guide cannot know what your portal asks for.',
      ] },
      { heading: 'The two things that make a file small', paragraphs: [
        'File size depends on the number of pixels and on how hard the picture is compressed. Fewer pixels give a much smaller file, and lower JPG quality gives a smaller file at the cost of detail. A passport-style photo can be small in pixels without looking bad, while a full 12-megapixel photo squeezed to 20 KB looks blocky. Crop to the face or document first, because every pixel you remove makes the size target easier.',
      ] },
      { heading: 'Step by step', paragraphs: [
        'Open the Image Resizer, or one of the pages for 20, 50, 100 or 200 KB, and choose your picture. Enter the maximum size in KB. If the form also needs an exact width and height, tick the exact size option and type them, then pick crop, fit or stretch. Press Resize, check the size shown under the result, look at the preview, and download the JPG.',
      ] },
      { heading: 'If the tool says it could not reach the limit', paragraphs: [
        'That means even the lowest quality was still too large at that pixel size. Raise the size limit if the form allows, use a smaller width and height, or crop closer to the subject and try again. Signatures on plain white paper compress far better than busy photos.',
      ] },
      { heading: 'Good to know', paragraphs: [
        'The result is always a JPG, and transparent areas become white. Your picture is processed in your browser and is not uploaded to MyDailyUtils for processing. Keep the original file, since resizing cannot be undone.',
      ] },
    ],
  },
  {
    slug: 'how-to-merge-pdf-files',
    title: 'How to merge PDF files into one document',
    description: 'Combine several PDFs in the order you want, on a phone or computer, without installing anything.',
    tools: ['merge-pdf', 'organize-pdf'],
    sections: [
      { heading: 'When merging helps', paragraphs: [
        'Job applications, loan files and visa forms often ask for a single PDF, while your documents are scattered across several files. Merging puts them into one file so you can upload or email it once.',
      ] },
      { heading: 'Steps', paragraphs: [
        'Open Merge PDF and add your files. Arrange them in the order you want them to appear, check the list, and start the merge. When it finishes, download the combined PDF. Name the files clearly before you start so you can recognise them in the list.',
      ] },
      { heading: 'Tips', paragraphs: [
        'If you only need some pages from a file, extract them first with Split PDF, or remove unwanted pages with Delete PDF Pages. To reorder pages after merging, use Organize PDF. Check the first and last page of the merged file before you send it.',
      ] },
      { heading: 'Limits', paragraphs: [
        'Password-protected PDFs need to be unlocked first. Very large files can be slow on a phone because the work happens on your device. Your files are processed in your browser and are not uploaded to MyDailyUtils for processing.',
      ] },
    ],
  },
  {
    slug: 'how-to-make-a-pdf-smaller',
    title: 'How to make a PDF smaller for email or upload',
    description: 'What really makes a PDF large, what our Compress PDF tool does and does not do, and practical ways to get under a size limit.',
    tools: ['compress-pdf', 'image-compressor', 'image-to-pdf', 'split-pdf'],
    sections: [
      { heading: 'What makes a PDF large', paragraphs: [
        'Most large PDFs are large because of pictures: scans, photos and screenshots. Text and vector drawings take little space. If your file is a scan, the images are almost the whole file.',
      ] },
      { heading: 'What Compress PDF does', paragraphs: [
        'MyDailyUtils Compress PDF rewrites the file structure and removes metadata; the Strong option also removes some extra data such as thumbnails. It does not shrink the images inside the PDF, so for a scan the size may barely change. We would rather say that than promise savings the tool cannot deliver.',
      ] },
      { heading: 'Ways that do work for scans', paragraphs: [
        'Reduce the pictures before building the PDF. Compress or resize each page image with Image Compressor, then combine them with Image to PDF. Lower quality and a smaller maximum width both cut size sharply. Alternatively, split a large file into parts with Split PDF if the portal limits size per upload but allows several files.',
      ] },
      { heading: 'Check the result', paragraphs: [
        'Open the new PDF and zoom into the smallest text before sending. If it looks too soft, raise the image quality a little. Your files stay in your browser and are not uploaded to MyDailyUtils for processing.',
      ] },
    ],
  },
  {
    slug: 'how-to-split-a-pdf',
    title: 'How to extract or split pages from a PDF',
    description: 'Pull out the pages you need from a large PDF, or remove the ones you do not.',
    tools: ['split-pdf', 'delete-pdf-pages', 'organize-pdf'],
    sections: [
      { heading: 'Two common jobs', paragraphs: [
        'You may want just a few pages from a long document, for example the signed page of an agreement, or you may want to drop pages you should not share. These are two sides of the same task.',
      ] },
      { heading: 'Extract pages', paragraphs: [
        'Open Split PDF, choose the file and enter the pages you want, such as 1-3, 7. The selected pages are saved together as one new PDF. Your original is not changed.',
      ] },
      { heading: 'Remove pages', paragraphs: [
        'If it is easier to say what to remove, use Delete PDF Pages and list the pages to drop. For reordering or rotating individual pages as well, Organize PDF shows thumbnails you can arrange.',
      ] },
      { heading: 'Before sharing', paragraphs: [
        'Open the result and make sure no private page slipped through. Page numbers printed on the pages themselves do not change when you remove pages. Processing happens in your browser; files are not uploaded to MyDailyUtils for processing.',
      ] },
    ],
  },
  {
    slug: 'how-to-convert-images-to-pdf',
    title: 'How to convert JPG or PNG images to a PDF',
    description: 'Turn photos and scans into a single PDF with the page size and margins you choose.',
    tools: ['image-to-pdf', 'image-compressor', 'merge-pdf'],
    sections: [
      { heading: 'Why make a PDF from images', paragraphs: [
        'Many portals want one PDF rather than several photos. Photographing each page of a document and combining the pictures is the quickest way to make one.',
      ] },
      { heading: 'Steps', paragraphs: [
        'Open Image to PDF and add your pictures in page order. Choose the page size: A4 portrait, A4 landscape, US Letter, or a page that fits each image. Choose a margin of none, 20 or 40 points, then create the PDF and download it.',
      ] },
      { heading: 'Getting a good result', paragraphs: [
        'Take photos flat and in good light, and crop away the background first. If the final PDF is too large for the portal, shrink the pictures with Image Compressor before converting. To add more pages to an existing PDF afterwards, use Merge PDF.',
      ] },
      { heading: 'Limits', paragraphs: [
        'Images are handled in your browser, so many large photos can be slow on a phone. Nothing is uploaded to MyDailyUtils for processing.',
      ] },
    ],
  },
  {
    slug: 'how-to-convert-pdf-to-images',
    title: 'How to save PDF pages as images',
    description: 'Export each page of a PDF as a PNG image, for sharing on chat or using in a slide.',
    tools: ['pdf-to-images', 'image-converter', 'image-compressor'],
    sections: [
      { heading: 'What you get', paragraphs: [
        'PDF to Images draws every page and lets you download each one as a PNG picture, rendered at twice the normal on-screen scale for sharpness. Text becomes part of the picture, so it can no longer be selected.',
      ] },
      { heading: 'Steps', paragraphs: [
        'Open PDF to Images, choose your file, wait for the pages to appear, and download the pages you want one by one.',
      ] },
      { heading: 'Make them smaller or change format', paragraphs: [
        'PNG files can be large. Use Image Converter to switch to JPG or WebP, or Image Compressor to reduce size, before sharing on WhatsApp or uploading to a form.',
      ] },
      { heading: 'Limits', paragraphs: [
        'All pages are rendered in one go, so a PDF with very many pages needs a lot of memory on a phone. Password-protected files must be unlocked first. For some documents with non-Latin fonts, the PDF viewer library may fetch character-map files from a public CDN; the document itself is not uploaded.',
      ] },
    ],
  },
  {
    slug: 'how-to-password-protect-a-pdf',
    title: 'How to password-protect a PDF (and what to expect)',
    description: 'Add a password to a PDF in your browser, and understand the trade-offs of how our tool does it.',
    tools: ['protect-pdf', 'unlock-pdf'],
    sections: [
      { heading: 'When to protect a PDF', paragraphs: [
        'Bank statements, ID copies and salary slips are often emailed, so adding an open password is sensible. Share the password through a different channel from the file.',
      ] },
      { heading: 'Steps', paragraphs: [
        'Open Protect PDF, choose the file, and type a Document Open password. You can also set an owner password and choose whether to allow printing and copying. Create the protected file and download it.',
      ] },
      { heading: 'Important: pages become images', paragraphs: [
        'Our tool protects a PDF by drawing each page as an image and building a new password-protected PDF from those images. The result looks the same, but its text cannot be selected or searched, links and form fields are lost, and the file can be larger. Keep your original.',
      ] },
      { heading: 'Choosing a password', paragraphs: [
        'Use a long, unique password and store it safely; it cannot be recovered. Permission settings such as no copying are only requests that viewers honour, so the open password is the real protection. To remove a password you know, use Unlock PDF.',
      ] },
    ],
  },
  {
    slug: 'old-vs-new-tax-regime-fy-2026-27',
    title: 'Old vs new tax regime for FY 2026-27: how to choose',
    description: 'How the two regimes differ, which deductions matter, and how to compare them for your own salary.',
    tools: ['income-tax-calculator', 'hra-calculator', 'salary-calculator'],
    sections: [
      { heading: 'The two regimes in one paragraph', paragraphs: [
        'Salaried individuals can pay tax under the new regime, which has lower slab rates and almost no deductions, or the old regime, which has higher slab rates but lets you reduce taxable income through deductions. Which one costs less depends on your income and how much you can deduct. This guide uses the rules as we understand them for FY 2026-27 (AY 2027-28); confirm on incometax.gov.in.',
      ] },
      { heading: 'New regime in brief', paragraphs: [
        'Slabs: nil up to 4 lakh, 5 percent from 4 to 8 lakh, 10 percent from 8 to 12 lakh, 15 percent from 12 to 16 lakh, 20 percent from 16 to 20 lakh, 25 percent from 20 to 24 lakh and 30 percent above that. The standard deduction is 75,000 rupees, and a rebate means no tax is payable when taxable income is up to 12 lakh, with marginal relief just above it. Four percent cess is added.',
      ] },
      { heading: 'Old regime in brief', paragraphs: [
        'Slabs: nil up to 2.5 lakh (higher for senior citizens), 5 percent to 5 lakh, 20 percent to 10 lakh and 30 percent above. The standard deduction is 50,000 rupees. You can claim items such as Section 80C (up to 1.5 lakh), extra NPS (up to 50,000), health insurance under 80D, home loan interest on a self-occupied house (up to 2 lakh) and HRA exemption if you pay rent.',
      ] },
      { heading: 'How to compare', paragraphs: [
        'Enter your salary and your real deductions in the Income Tax Calculator and read the two results side by side. As a rough pattern, people with large deductions such as home loan interest, rent and 80C investments may find the old regime competitive, while people with few deductions usually pay less under the new regime. Your numbers decide, so test them.',
      ] },
      { heading: 'Limits', paragraphs: [
        'Rules change with each Budget, and this is general information, not tax advice. The calculator covers salary and other slab-rate income for a resident individual; capital gains and business income are not included.',
      ] },
    ],
  },
  {
    slug: 'how-to-calculate-in-hand-salary-from-ctc',
    title: 'How to calculate your in-hand salary from CTC',
    description: 'Why take-home pay is lower than CTC, and the deductions that explain the gap.',
    tools: ['salary-calculator', 'income-tax-calculator', 'hra-calculator'],
    sections: [
      { heading: 'CTC is not what you receive', paragraphs: [
        'Cost to company includes money the employer spends on you that never reaches your account, such as the employer share of provident fund, and often insurance, gratuity and a variable component that is paid only if targets are met.',
      ] },
      { heading: 'The usual steps', paragraphs: [
        'Start with annual CTC. Remove employer PF to get gross salary. From gross, your own PF contribution, professional tax and income tax are deducted, and what remains divided by twelve is the monthly in-hand amount. PF is normally 12 percent of basic salary, and many employers calculate it on a wage ceiling of 15,000 rupees a month.',
      ] },
      { heading: 'Using the calculator', paragraphs: [
        'Open the Salary Calculator, enter your CTC, the share that is basic pay, your PF option, tax regime and state professional tax. It shows the estimated monthly in-hand salary and where the rest goes.',
      ] },
      { heading: 'Why your payslip may differ', paragraphs: [
        'Bonuses, variable pay, reimbursements, employer NPS and insurance premiums are not modelled, and your employer deducts tax based on your declarations. Use the figure to compare offers, then check the offer letter breakup.',
      ] },
    ],
  },
  {
    slug: 'hra-exemption-explained',
    title: 'HRA exemption explained with an example',
    description: 'The three-way rule for House Rent Allowance, who can claim it, and a worked example.',
    tools: ['hra-calculator', 'income-tax-calculator'],
    sections: [
      { heading: 'The rule', paragraphs: [
        'If you receive HRA and pay rent, the tax-free part is the smallest of three amounts: the HRA you actually receive, your rent minus 10 percent of basic salary, and 50 percent of basic salary if you live in a metro city or 40 percent if you do not. Basic here includes dearness allowance. Whatever HRA is above that is taxable.',
      ] },
      { heading: 'Worked example', paragraphs: [
        'Suppose basic salary is 50,000 a month, HRA received is 25,000 and rent is 22,000, in a metro city. The three amounts are 25,000, then 22,000 minus 5,000 which is 17,000, then 50 percent of 50,000 which is 25,000. The smallest is 17,000, so 17,000 a month or 2,04,000 a year is exempt, and the remaining 8,000 a month is taxable.',
      ] },
      { heading: 'Conditions', paragraphs: [
        'HRA exemption is available only under the old tax regime and only if you actually pay rent. Keep rent receipts, and for yearly rent above 1 lakh rupees your landlord is generally required to provide a PAN. Which cities count as metro is set by the tax rules, so check yours.',
      ] },
      { heading: 'Use it in your tax comparison', paragraphs: [
        'Calculate the yearly exempt amount with the HRA Calculator, then enter it as the HRA exemption in the old regime section of the Income Tax Calculator to see how it changes the comparison.',
      ] },
    ],
  },
  {
    slug: 'how-emi-works-and-how-to-reduce-interest',
    title: 'How EMI works, and how to reduce the interest you pay',
    description: 'The EMI formula in plain words, why early instalments are mostly interest, and what changes the total cost.',
    tools: ['emi-calculator'],
    sections: [
      { heading: 'What an EMI is', paragraphs: [
        'An EMI is a fixed monthly payment that covers both interest and a part of the loan. It is worked out so that the loan reaches zero exactly at the end of the tenure. The formula is EMI = P x r x (1+r)^n / ((1+r)^n - 1), where P is the loan amount, r is the monthly rate (yearly rate divided by 12 and by 100) and n is the number of months.',
      ] },
      { heading: 'Why early payments are mostly interest', paragraphs: [
        'Each month, interest is charged on the balance still owed. At the start the balance is highest, so most of the EMI is interest and only a little repays principal. Over time the balance falls, interest shrinks and more of each EMI repays principal. The year-wise table in the EMI Calculator shows this clearly.',
      ] },
      { heading: 'What changes the total cost', paragraphs: [
        'A lower rate, a larger down payment and a shorter tenure all reduce total interest. A longer tenure makes the EMI smaller but increases the interest paid overall, so compare the total payment, not only the monthly amount. Paying extra towards principal, when your lender allows it, also reduces interest, although the calculator assumes no prepayments.',
      ] },
      { heading: 'Limits', paragraphs: [
        'The calculator assumes a fixed rate and equal monthly instalments. Floating-rate loans, processing fees and insurance change the real figures, so your lender schedule is the final word.',
      ] },
    ],
  },
  {
    slug: 'how-sip-works-and-how-to-estimate-returns',
    title: 'How a SIP works and how to estimate its future value',
    description: 'Monthly investing explained, what a step-up SIP is, and why any return figure is only an assumption.',
    tools: ['sip-calculator', 'ppf-calculator', 'fd-calculator'],
    sections: [
      { heading: 'What a SIP is', paragraphs: [
        'A systematic investment plan puts a fixed amount into a fund every month. Because you invest regularly, you buy more units when prices are low and fewer when they are high, and you do not need to time the market.',
      ] },
      { heading: 'How the estimate is made', paragraphs: [
        'The SIP Calculator adds each monthly instalment at the start of the month and grows the balance by one-twelfth of the yearly return you assume. If you set a step-up, the instalment rises by that percentage once a year. The result shows the amount invested, the expected value and the gain, plus a year-by-year table.',
      ] },
      { heading: 'Using it sensibly', paragraphs: [
        'Returns on market-linked funds are not guaranteed and vary from year to year, so try several rates instead of trusting one. See how much a small yearly step-up or a few extra years changes the outcome. Tax on gains and fund costs are not included.',
      ] },
      { heading: 'Compare with fixed options', paragraphs: [
        'For comparison, the FD Calculator and PPF Calculator show what a fixed deposit or PPF could reach with a stated rate. Fixed options offer predictability, and market-linked options offer higher potential with higher risk. This is general information, not investment advice.',
      ] },
    ],
  },
  {
    slug: 'how-to-calculate-gst',
    title: 'How to add or remove GST from a price',
    description: 'Simple formulas for GST-exclusive and GST-inclusive prices, and what CGST, SGST and IGST mean on an invoice.',
    tools: ['gst-calculator', 'pos-invoice-studio'],
    sections: [
      { heading: 'Adding GST', paragraphs: [
        'If a price excludes GST, the GST amount is price multiplied by the rate and divided by 100, and the total is price plus GST. For example, 1,000 rupees at 18 percent has 180 rupees GST and a total of 1,180.',
      ] },
      { heading: 'Removing GST', paragraphs: [
        'If a price already includes GST, divide it by one plus the rate. For example, 1,180 divided by 1.18 gives a base price of 1,000, and the difference of 180 is the GST. A common mistake is to subtract 18 percent of 1,180, which gives the wrong answer.',
      ] },
      { heading: 'CGST, SGST and IGST', paragraphs: [
        'When the seller and buyer are in the same state, the GST is split equally into CGST for the centre and SGST for the state, so 180 rupees becomes 90 and 90. When the sale is to another state, the whole amount is charged as IGST.',
      ] },
      { heading: 'Which rate applies', paragraphs: [
        'The rate depends on the product or service and is revised by the GST Council from time to time, so check the official rate schedule or ask your accountant. The GST Calculator has quick buttons for common rates and lets you type any rate.',
      ] },
    ],
  },
  {
    slug: 'how-to-check-a-tool-keeps-your-files-private',
    title: 'How to check that an online tool really keeps your files on your device',
    description: 'A simple way to see for yourself whether a browser tool uploads your file, using your browser developer tools.',
    tools: ['merge-pdf', 'image-compressor', 'inspect-pdf'],
    sections: [
      { heading: 'Why this matters', paragraphs: [
        'Many online tools upload your file to their server. For ID scans, bank statements and contracts, that is a real privacy cost. Some tools, including those on MyDailyUtils, process files with code that runs in your own browser instead.',
      ] },
      { heading: 'How to check it yourself', paragraphs: [
        'On a computer, open the tool page, press F12 (or right-click and choose Inspect) and open the Network tab. Clear the list, then choose a file and run the tool. If the file is processed locally you will not see a large upload request carrying your file. You will still see small requests for page resources and ads. Another quick test: load the page, switch off your internet connection, and run the tool; many local tools keep working.',
      ] },
      { heading: 'What is still loaded from the network', paragraphs: [
        'Even a local tool loads its own code and, on MyDailyUtils, advertising from Google. A few features may fetch supporting files, for example PDF font maps from a public CDN or OCR language data, but your document itself is not sent. Our Privacy Policy describes these boundaries.',
      ] },
      { heading: 'Habits that help', paragraphs: [
        'Keep the original, check the output before sending it, and avoid processing highly sensitive documents on shared or public computers. Browser-based processing protects against uploads, not against someone looking at a shared screen.',
      ] },
    ],
  },
];

export function getGuide(slug: string | undefined): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
