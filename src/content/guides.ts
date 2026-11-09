/**
 * How-to guides shown under /guides. Plain data (no React) so the build-time page generator
 * can use it too. English only for now. Every claim about a MyDailyUtils tool must match what
 * the tool really does; read the tool before editing a guide.
 */
import { PACK_GUIDES } from './packGuides';

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

const CORE_GUIDES: Guide[] = [
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
  {
    slug: "simple-vs-compound-interest",
    title: "Simple interest vs compound interest: the difference and how to calculate both",
    description: "What simple and compound interest mean, the formulas, and why compounding makes such a difference over long periods.",
    tools: ["simple-compound-interest-calculator", "lumpsum-calculator", "fd-calculator"],
    sections: [
      { heading: "Simple interest in one line", paragraphs: [
        "Simple interest is earned only on the original amount. If you invest ₹1,00,000 at 8% simple interest, you earn ₹8,000 every year, whether it is the first year or the tenth. The formula is interest = principal × rate × time ÷ 100.",
      ] },
      { heading: "Compound interest in one line", paragraphs: [
        "With compound interest, the interest from each period is added to the balance, so the next period earns interest on a larger amount. The formula for the final amount is principal × (1 + rate ÷ (100 × n)) raised to the power n × time, where n is how many times a year interest is added.",
      ] },
      { heading: "Why the gap grows over time", paragraphs: [
        "In the first year the two are almost the same. Over many years the difference widens, because compound interest earns interest on interest. At 8% for 3 years, ₹1,00,000 gives ₹24,000 as simple interest and about ₹26,824 as compound interest compounded quarterly. Over 20 years the gap is far bigger.",
        "You can try your own numbers in the Simple & Compound Interest Calculator, which shows both side by side with a year-by-year table.",
      ] },
      { heading: "How often interest is added matters a little", paragraphs: [
        "More frequent compounding (monthly instead of yearly) gives a slightly higher result at the same quoted rate. Most Indian banks compound fixed deposit interest quarterly; your deposit terms state the actual method.",
      ] },
      { heading: "Where each is used", paragraphs: [
        "Savings accounts, fixed deposits and most investments grow by compounding. Some loans, especially informal ones, are quoted as simple interest. Always ask which method applies, because the same quoted rate can cost very different amounts.",
      ] },
    ],
  },
  {
    slug: "rd-vs-fd-which-is-better",
    title: "RD vs FD: how they differ and how to estimate each",
    description: "How recurring and fixed deposits differ, how interest is worked out, and how to estimate what each will give you.",
    tools: ["rd-calculator", "fd-calculator"],
    sections: [
      { heading: "The basic difference", paragraphs: [
        "A fixed deposit (FD) is a single lump sum placed for a fixed period. A recurring deposit (RD) is a fixed amount you add every month for a fixed period. FD suits money you already have; RD suits people who want to build a sum from regular savings.",
      ] },
      { heading: "How the interest is worked out", paragraphs: [
        "Both are usually compounded quarterly at Indian banks, so interest is added to the balance four times a year. In an RD each monthly instalment earns interest only from the month it is deposited, so the early instalments earn the most. That is why an RD of ₹5,000 a month for 5 years at 6.5% grows to about ₹3.55 lakh on ₹3 lakh deposited.",
        "Use the RD Calculator and FD Calculator to estimate each; the RD calculator also shows a year-by-year table.",
      ] },
      { heading: "Things to compare before you choose", paragraphs: [
        "Compare the interest rate for your period, whether the rate is fixed, penalties for early withdrawal or missed RD instalments, the minimum amount, and how interest is paid out. Senior citizens and some institutions offer different rates.",
      ] },
      { heading: "Tax on the interest", paragraphs: [
        "Interest from both is taxable as income, and banks may deduct tax at source (TDS) above a threshold that can change. The calculators show interest before tax, so your actual return will be lower if you pay tax on it.",
      ] },
    ],
  },
  {
    slug: "how-gratuity-is-calculated",
    title: "How gratuity is calculated, who gets it and what is tax-free",
    description: "The gratuity formula, the 5-year rule, how part-years are counted and the tax-free limit, with a worked example.",
    tools: ["gratuity-calculator"],
    sections: [
      { heading: "What gratuity is", paragraphs: [
        "Gratuity is a lump sum an employer pays an employee as thanks for long service, usually when they leave, retire or resign after completing at least five years of continuous service. Exceptions exist, such as death or disability.",
      ] },
      { heading: "The formula", paragraphs: [
        "For employers covered by the Payment of Gratuity Act, gratuity = last drawn monthly basic salary plus dearness allowance × 15 ÷ 26 × years of service. A part-year of six months or more is counted as a full year. For example, with a last basic plus DA of ₹50,000 and 10 years 7 months of service, 11 years are counted: 50,000 × 15 ÷ 26 × 11 = about ₹3,17,308.",
        "If the employer is not covered by the Act, the usual formula uses 15 ÷ 30 and counts only completed years. The Gratuity Calculator lets you pick either.",
      ] },
      { heading: "Tax treatment", paragraphs: [
        "Under current rules, gratuity received by a private-sector employee is tax-free up to ₹20 lakh, with the amount above that taxable. Rules and limits are revised from time to time, so confirm the latest position before you rely on it.",
      ] },
      { heading: "What the calculator shows", paragraphs: [
        "Besides the amount for your service, it shows a table of what the same pay would give after 5, 10, 15 up to 35 years, so you can see how service length changes the result. Your employer may pay more than the legal minimum; check your appointment letter.",
      ] },
    ],
  },
  {
    slug: "what-is-cagr-and-how-to-use-it",
    title: "What is CAGR? How to calculate it and what it can and cannot tell you",
    description: "CAGR explained with an example, the formula, and the cases where it misleads.",
    tools: ["cagr-calculator", "sip-calculator", "lumpsum-calculator"],
    sections: [
      { heading: "CAGR in plain words", paragraphs: [
        "Compound annual growth rate (CAGR) is the single steady yearly rate that would take an investment from its starting value to its ending value over a period. If ₹1,00,000 becomes ₹2,00,000 in 5 years, the CAGR is about 14.87% a year.",
      ] },
      { heading: "The formula", paragraphs: [
        "CAGR = (final value ÷ initial value) raised to the power 1 ÷ years, minus 1. You can type the two values and the years into the CAGR Calculator, which also shows how long the value takes to double at that rate.",
      ] },
      { heading: "What CAGR hides", paragraphs: [
        "Real investments go up and down. Two investments can have the same CAGR with very different risk along the way. CAGR also ignores money you add or withdraw during the period; for regular investments such as a SIP, use XIRR, which accounts for the dates of each payment.",
      ] },
      { heading: "Using it to compare options", paragraphs: [
        "CAGR is useful for comparing two lump-sum results over the same period. Be careful to compare equal periods and the same start and end dates, and remember that past growth does not promise future returns.",
      ] },
    ],
  },
  {
    slug: "how-inflation-reduces-the-value-of-savings",
    title: "How inflation reduces the value of your savings, with an example",
    description: "Why money loses buying power over time, how to estimate the effect, and what it means for savings goals.",
    tools: ["inflation-calculator", "lumpsum-calculator"],
    sections: [
      { heading: "What inflation does", paragraphs: [
        "Inflation is the general rise in prices. If prices rise 6% a year, something that costs ₹1,00,000 today will cost about ₹1,79,000 in 10 years. Put the other way, ₹1,00,000 in 10 years will buy only about what ₹56,000 buys today.",
      ] },
      { heading: "How to calculate it", paragraphs: [
        "Future cost = amount × (1 + inflation rate) raised to the number of years. The Inflation Calculator does this and shows a year-by-year table, plus the share of buying power lost.",
      ] },
      { heading: "Why a savings rate has to beat it", paragraphs: [
        "If your savings earn less than inflation, their real value falls even though the balance grows. The Lumpsum Calculator can show a future value in today's buying power when you enter an inflation rate, which gives a more honest picture of a goal such as retirement or a child's education.",
      ] },
      { heading: "Choosing a rate", paragraphs: [
        "Overall inflation in India has varied over the years, and some costs, such as education and healthcare, often rise faster than the headline figure. Try several rates, including a higher one, rather than relying on a single number.",
      ] },
    ],
  },
  {
    slug: "how-to-calculate-age-for-exam-and-job-forms",
    title: "How to calculate your age on a cut-off date for exam and job forms",
    description: "Why forms ask for age on a particular date, how years, months and days are counted, and how to avoid common mistakes.",
    tools: ["age-calculator", "date-difference-calculator"],
    sections: [
      { heading: "Why the date matters", paragraphs: [
        "Many exams and recruitments set a minimum or maximum age as on a specific date, such as 1 January or 1 August of the year. Your age today is not what counts; your age on that date is.",
      ] },
      { heading: "How to count", paragraphs: [
        "Count completed years first, then completed months, then days. Someone born on 15 August 1995 is 31 years, 4 months and 17 days old on 1 January 2027. For your own dates, use the Age Calculator: set the \"Age on\" date to the cut-off and read the result.",
      ] },
      { heading: "Special cases", paragraphs: [
        "If you were born on 29 February, the calculator treats your birthday as 1 March in years that are not leap years. Rules for how an exam counts this may differ, so follow the notification. Also note that age relaxations for some categories are set by each exam.",
      ] },
      { heading: "Other date questions", paragraphs: [
        "To find the number of days or working days between two dates, or to add 90 days to a date, such as for a notice period, use the Date Difference Calculator. It does not know public holidays, so subtract those yourself.",
      ] },
    ],
  },
  {
    slug: "how-to-make-a-gst-invoice",
    title: "How to make a GST invoice: what to include and how CGST, SGST and IGST work",
    description: "The parts of a tax invoice, when CGST and SGST apply instead of IGST, and how to produce a clean PDF.",
    tools: ["gst-invoice-generator", "gst-calculator"],
    sections: [
      { heading: "What goes on a tax invoice", paragraphs: [
        "A tax invoice usually shows the seller's name, address and GSTIN, a unique invoice number and date, the buyer's details, the place of supply, a description of each item with its HSN or SAC code, quantity, taxable value, tax rate and amount, and the total. Exact requirements depend on your registration and the kind of supply, so check the current rules.",
      ] },
      { heading: "CGST and SGST or IGST", paragraphs: [
        "If the seller and the place of supply are in the same state, the tax is split equally into CGST (central) and SGST (state or union territory). If they are in different states, IGST is charged instead. The GST Invoice Generator decides this from the two states you choose.",
      ] },
      { heading: "Tax invoice vs bill of supply", paragraphs: [
        "A bill of supply is generally used when no GST is charged, for example by some composition dealers or for exempt goods. Choose the document that matches your registration; if you are unsure, ask a tax professional.",
      ] },
      { heading: "Making the PDF", paragraphs: [
        "Fill in the details, add your items, check the preview and press Print or save as PDF, then choose Save as PDF in the print window. Nothing is uploaded; you can tick a box to remember your business details in your own browser.",
      ] },
      { heading: "What the tool does not do", paragraphs: [
        "It does not create e-invoices with an IRN or QR code, file returns or check whether a GSTIN is registered. It only checks the GSTIN format and check character, which catches most typing mistakes.",
      ] },
    ],
  },
  {
    slug: "how-to-resize-a-passport-photo-and-signature-for-forms",
    title: "How to resize a passport photo and signature for online forms",
    description: "Getting a photo or signature to the exact pixel size and file size a form asks for, step by step.",
    tools: ["passport-photo-resizer", "signature-resizer", "exam-photo-resizer", "image-resizer"],
    sections: [
      { heading: "Read the form first", paragraphs: [
        "Look for the required width and height (in pixels, millimetres or inches), the maximum file size in KB, and the format. Requirements differ between forms and change from year to year, so always follow yours; any preset in a tool is only a starting point.",
      ] },
      { heading: "Preparing a good photo", paragraphs: [
        "Use a plain, evenly lit background, face the camera, keep the head centred and avoid shadows. A clean picture compresses better, so you keep more detail under a small KB limit.",
      ] },
      { heading: "Resizing with the tool", paragraphs: [
        "Open the Passport Photo Resizer, Signature Resizer or Exam Photo Resizer, choose your image, check the size and KB limit and press Resize. If your form lists millimetres or inches, change the unit and set a resolution; 300 DPI is common for printed photos. For example, 35 × 45 mm at 300 DPI is about 413 × 531 pixels.",
      ] },
      { heading: "Signatures", paragraphs: [
        "Sign with a dark pen on plain white paper, photograph it in even light and crop closely. If the shape differs from the target size, choose \"Fit inside with white borders\" so no part of the signature is cut off.",
      ] },
      { heading: "If it still does not fit", paragraphs: [
        "If the tool says it could not reach the limit, raise the limit if the form allows, use a smaller size or crop closer. The tool does not change backgrounds or check face position; if your form has such rules, prepare the photo accordingly.",
      ] },
    ],
  },
  {
    slug: "how-to-create-a-strong-password",
    title: "How to create a strong password and keep it safe",
    description: "What makes a password strong, how long it should be, and the habits that matter more than clever tricks.",
    tools: ["password-generator"],
    sections: [
      { heading: "Length beats cleverness", paragraphs: [
        "Each extra character makes a random password far harder to guess. For important accounts such as email and banking, use at least 12 characters, and 16 or more if the site allows. Predictable tricks, such as replacing letters with symbols in a word, add little.",
      ] },
      { heading: "Random is better than memorable", paragraphs: [
        "People choose guessable passwords. A generator picks every character randomly. The Password Generator uses your browser's secure random source, makes the password on your device and does not store or send it. Its strength meter and guess-time estimate are guides only.",
      ] },
      { heading: "One password per account", paragraphs: [
        "If one site leaks your password, attackers try it elsewhere. Use a different password for every account, and keep them in a reputable password manager so you need to remember only one strong master password.",
      ] },
      { heading: "Turn on two-step verification", paragraphs: [
        "Where available, add a second step such as an authenticator app. It protects you even if a password is leaked. Be careful with PINs: a short numeric PIN is only safe where the number of attempts is limited, such as on a phone or ATM.",
      ] },
    ],
  },
  {
    slug: "how-to-write-an-amount-in-words-on-a-cheque",
    title: "How to write an amount in words on a cheque or invoice (lakh and crore)",
    description: "The standard way to write rupee amounts in words, and how to avoid alterations and mistakes.",
    tools: ["number-to-words"],
    sections: [
      { heading: "The standard format", paragraphs: [
        "In India amounts are written with lakh and crore, for example 12,34,567 as \"Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Rupees Only\". With paise, write \"and Fifty Paise\" before \"Only\".",
      ] },
      { heading: "Why \"Only\" and asterisks", paragraphs: [
        "Ending with \"Only\" shows nothing follows the amount, and some people add asterisks or a line before and after the words to prevent additions. The Number to Words tool has a cheque style option that adds asterisks and capitals.",
      ] },
      { heading: "Match the figure and the words", paragraphs: [
        "The amount in words and in figures must agree. If they differ, a bank may refuse the cheque or follow the words. Always compare them before you sign; the tool shows the figure with grouped digits next to the words to help.",
      ] },
      { heading: "Indian and international systems", paragraphs: [
        "The same number reads differently in the international system (million, billion). Pick the one your document needs. The tool supports up to 999,999,999,999.",
      ] },
    ],
  },
  {
    slug: "understanding-bmi-what-it-is-and-its-limits",
    title: "Understanding BMI: how it is calculated and what it can and cannot tell you",
    description: "What body mass index is, why Indian guidance uses lower cut-offs, and why it is only a screening number.",
    tools: ["bmi-calculator"],
    sections: [
      { heading: "How BMI is calculated", paragraphs: [
        "BMI is weight in kilograms divided by the square of height in metres. A person who weighs 70 kg and is 1.70 m tall has a BMI of about 24.2.",
      ] },
      { heading: "Categories", paragraphs: [
        "The WHO standard calls a BMI of 25 to 29.9 overweight and 30 or more obese. Guidance for Asian populations uses 23 and 25 as cut-offs because health risks can rise at lower BMI values. The BMI Calculator lets you choose either scale.",
      ] },
      { heading: "What BMI does not show", paragraphs: [
        "BMI cannot tell muscle from fat, does not show where fat is carried and is not suited to children, pregnancy or athletes. Two people with the same BMI can have very different health.",
      ] },
      { heading: "Using the result", paragraphs: [
        "Treat it as a starting point. The calculator also shows a healthy weight range for your height and an optional rough calorie estimate. None of this is medical advice; talk to a doctor or dietitian before making changes to your diet or exercise.",
      ] },
    ],
  },
  {
    slug: "how-to-calculate-percentages-and-discounts",
    title: "How to calculate percentages, percentage change and discounts",
    description: "The simple formulas behind everyday percentage questions, including why two discounts do not add up.",
    tools: ["percentage-calculator", "discount-calculator", "gst-calculator"],
    sections: [
      { heading: "Percent of a number", paragraphs: [
        "To find X% of Y, multiply Y by X and divide by 100. 15% of 2,400 is 360.",
      ] },
      { heading: "Percentage change", paragraphs: [
        "Percentage change = (new − old) ÷ old × 100. A price going from 80 to 100 is a 25% increase. Going back from 100 to 80 is only a 20% decrease, because the base is now different.",
      ] },
      { heading: "Discounts", paragraphs: [
        "A 30% discount on ₹2,499 gives ₹1,749.30. Two discounts do not add up: 30% then 10% is 37% overall, not 40%, because the second applies to the reduced price. If you know the sale price and the discount, the Discount Calculator can work back to the original price.",
      ] },
      { heading: "Adding GST", paragraphs: [
        "Check whether a displayed price already includes GST. The Discount Calculator can add GST after the discounts, and the GST Calculator can add or remove GST from any amount.",
      ] },
    ],
  },
];

/** Every guide: the core ones above plus those that go with the tool packs. */
export const GUIDES: Guide[] = [...CORE_GUIDES, ...PACK_GUIDES];

export function getGuide(slug: string | undefined): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
