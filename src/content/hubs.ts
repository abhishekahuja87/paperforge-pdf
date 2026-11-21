/**
 * Collection pages: one short, plain page per group of tools, listing every tool in the group with a line on what it does.
 * `collection` is the id of the matching entry in COLLECTIONS (src/config/homeSections.ts), which supplies the tool list.
 */
export interface HubSection { heading: string; paragraphs: string[] }
export interface Hub {
  path: string;
  collection: string;
  title: string;
  subtitle: string;
  description: string;
  sections: HubSection[];
}

export const HUBS: Hub[] = [
  {
    path: '/pdf-tools',
    collection: 'pdf',
    title: 'Free PDF Tools: Merge, Compress, Sign, Fill and Redact',
    subtitle: 'Everything for PDF files in one place. Each tool runs in your browser and your file is not uploaded.',
    description: 'Free PDF tools that run in your browser: merge, split, compress, sign, fill, redact, scan to searchable PDF and more. No sign-up and no upload.',
    sections: [
      { heading: 'What you can do with PDFs here', paragraphs: [
        'Put files together or take them apart with Merge PDF, Split PDF, Organize PDF and Delete PDF Pages. Make a file small enough to send with Compress PDF. Complete a form with Fill PDF and Sign PDF, and hide private details with Redact PDF.',
        'Turn photos and scans into a PDF you can search, extract the text from a PDF, or compare two versions to see what changed.',
      ] },
      { heading: 'How to choose', paragraphs: [
        'If a file is too big to upload, start with Compress PDF. If a form needs your answers, start with Fill PDF, then Sign PDF if it needs a signature. If you are sharing a document that has private details, use Redact PDF first, and Sanitize PDF to remove hidden file information.',
      ] },
      { heading: 'Your files stay with you', paragraphs: [
        'These tools work on your own device, in your browser. Your PDFs are not uploaded to MyDailyUtils. Read how to check this yourself on the Why trust us page.',
      ] },
    ],
  },
  {
    path: '/photo-and-image-tools',
    collection: 'images',
    title: 'Free Photo and Image Tools: Resize, Compress and Clean Photos',
    subtitle: 'Resize photos for forms, make files smaller, remove hidden location and blur private details. All in your browser.',
    description: 'Free photo and image tools: resize for exam forms, compress to a size in KB, convert, make passport sheets and remove location data. Private and in your browser.',
    sections: [
      { heading: 'What you can do with photos here', paragraphs: [
        'Resize a photo to the size an online form asks for, shrink an image to a size in KB, convert between JPG, PNG and WebP, and lay out passport photos on a sheet to print. Add a name and date strip under a photo for forms that ask for one.',
        'Before you share a photo, see what it reveals with Remove Location and EXIF Data, and blur private details in a screenshot with the Screenshot Redactor.',
      ] },
      { heading: 'How to choose', paragraphs: [
        'For a form with a size limit, open the Image Resizer and use the presets and KB buttons, then check the limit on your own form. For a photo you will post or send, use Remove Location and EXIF Data first. To make a picture smaller without changing its size on screen, use the Image Compressor.',
      ] },
      { heading: 'Your photos stay with you', paragraphs: [
        'Photos are read and changed on your own device. Nothing is uploaded to MyDailyUtils.',
      ] },
    ],
  },
  {
    path: '/qr-and-sharing-tools',
    collection: 'sharing',
    title: 'Free QR Code and Sharing Tools: Make and Scan QR Codes',
    subtitle: 'Make QR codes for links, Wi-Fi and contacts, scan one safely, and share documents with a password.',
    description: 'Free QR code tools: make QR codes for links, Wi-Fi and contacts, scan a QR code from a photo or camera and check it first, and add a password to a document. No sign-up.',
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Make a QR code for a web address, a Wi-Fi network or a contact card, or make many at once. Scan a QR code from a photo, a screenshot or your camera and see what is inside before you open a link or pay, and put a password on a document you are sharing.',
      ] },
      { heading: 'How to choose', paragraphs: [
        'To share Wi-Fi with guests, use the Wi-Fi QR Code Generator. To put your phone number or business on a card, use the vCard QR Code Generator. To check a code someone gave you, use the QR Code Scanner, which shows the website or UPI payee first and never opens or pays by itself.',
      ] },
      { heading: 'Private by design', paragraphs: [
        'Codes are made and read in your browser. What you type or scan is not sent to MyDailyUtils.',
      ] },
    ],
  },
  {
    path: '/everyday-tools',
    collection: 'everyday',
    title: 'Free Everyday Tools: Calculators, Converters and Quick Helpers',
    subtitle: 'Age, dates, percentages, discounts, unit conversion, bill splitting and more. Quick answers with no sign-up.',
    description: 'Free everyday tools: age and date calculators, percentage and discount, unit converter, bill splitter, number to words and more. Quick, simple and in your browser.',
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Work out an exact age or the days between two dates, find a percentage or a discounted price, convert units, split a bill between friends, write a number in words.',
      ] },
      { heading: 'How these tools work', paragraphs: [
        'Each one does one job and shows the answer as you type. The calculations run in your browser, so nothing you enter is sent anywhere. Check important figures against your own records before you rely on them.',
      ] },
    ],
  },
];
