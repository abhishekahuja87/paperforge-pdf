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
  {
    path: "/tax-and-salary-calculators",
    collection: "tax",
    title: "Free Tax, Salary and GST Calculators",
    subtitle: "Income tax, take-home salary, HRA, GST, gratuity and EPF estimates in one place. No sign-up, and nothing you type is sent anywhere.",
    description: "Free calculators for income tax, salary in hand, HRA, GST, gratuity and EPF. Quick estimates in your browser with no sign-up.",
    sections: [
      { heading: "What you can work out here", paragraphs: [
        "Compare the old and new income tax regime for your figures, turn a yearly salary package into monthly pay in hand, see how much of your HRA may be exempt, add or remove GST from a price, and estimate gratuity and EPF.",
      ] },
      { heading: "How to use the results", paragraphs: [
        "These are estimates for planning. Tax and payroll rules change, and your employer, your tax filing or a qualified adviser decides the figures that count. Check the rules that apply to you and keep your own records before you act on any result.",
      ] },
      { heading: "Private by design", paragraphs: [
        "The numbers you type are used in your browser and are not sent to MyDailyUtils. Read how to check this on the Why trust us page.",
      ] },
    ],
  },
  {
    path: "/loan-and-investment-calculators",
    collection: "invest",
    title: "Free Loan, EMI, SIP and Savings Calculators",
    subtitle: "Work out loan instalments, SIP and lump-sum growth, FD, RD and PPF returns, CAGR, interest and inflation.",
    description: "Free calculators for EMI, SIP, lump sum, FD, RD, PPF, CAGR, simple and compound interest and inflation. Quick, private and no sign-up.",
    sections: [
      { heading: "What you can work out here", paragraphs: [
        "See the monthly instalment and total interest on a loan, how a regular SIP or a one-time investment could grow over the years, what a fixed or recurring deposit may return, and how inflation reduces what money can buy.",
      ] },
      { heading: "Reading the numbers", paragraphs: [
        "Every result depends on the rate and period you enter. Rates on loans and deposits change, and market returns are not guaranteed, so treat the answers as a way to compare options, not as a promise. Check the exact terms with your bank or adviser.",
      ] },
      { heading: "Private by design", paragraphs: [
        "Calculations run in your browser. The amounts you enter are not sent anywhere.",
      ] },
    ],
  },
  {
    path: "/sports-and-fitness-tools",
    collection: "sports",
    title: "Free Sports and Fitness Tools",
    subtitle: "Court and ground sizes with set-out measurements, an exercise library with how-to steps, and a BMI calculator.",
    description: "Free sports and fitness tools: sports court and ground size guide, exercise library with how-to steps and a BMI calculator.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Look up the size and markings of common courts and grounds, browse exercises with simple step-by-step instructions, and work out a BMI figure from height and weight.",
      ] },
      { heading: "A note on health", paragraphs: [
        "BMI and exercise guides are general information. They are not medical advice and do not diagnose anything. If you have a health condition, an injury or a doubt, speak to a doctor or a qualified trainer first.",
      ] },
    ],
  },
  {
    path: "/printables-and-templates",
    collection: "printables",
    title: "Free Printable Sheets, Planners and Templates",
    subtitle: "Make and print paper, planners, meal plans, flashcards, registers, certificates, labels and more as a PDF.",
    description: "Free printable sheets and templates: planners, meal plans, flashcards, registers, certificates, name tags, trackers and more. Make a PDF in your browser.",
    sections: [
      { heading: "What you can make", paragraphs: [
        "Lined, grid and dotted paper, monthly and weekly planners, meal plans, flashcards, health and care sheets, household registers, certificates, name tags, trackers, worksheets and puzzles. Type your details, choose a look and download a PDF.",
      ] },
      { heading: "Printing tips", paragraphs: [
        "Choose Actual size or 100% in the print window and turn off Fit to page, because printers add their own unprintable border. Print one page first to check.",
      ] },
      { heading: "Your details stay with you", paragraphs: [
        "The sheets are built in your browser. What you type is not sent to MyDailyUtils.",
      ] },
    ],
  },
  {
    path: "/jobs-and-business-tools",
    collection: "work",
    title: "Free Jobs, Freelancing and Small Business Tools",
    subtitle: "Resume, invoices, quotations, rent receipts, price tags, visiting cards, posters and registers for work and shops.",
    description: "Free tools for work: resume builder, GST invoice, quotation, rent receipt, freelance rate and margin calculators, price tags, visiting cards and posters.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Build a resume, write a job description, check a file before an online application, price your freelance work, make a quotation, invoice or rent receipt, work out margin and markup, and design price tags, posters, visiting cards, ID cards and stamps for a shop or business.",
      ] },
      { heading: "Check before you send", paragraphs: [
        "Invoices, receipts and quotations made here are documents you fill in yourself. Check amounts, tax details and names before you send them, and follow the rules that apply to your business.",
      ] },
      { heading: "Your details stay with you", paragraphs: [
        "Everything is made in your browser. Your business and customer details are not sent to MyDailyUtils.",
      ] },
    ],
  },
  {
    path: "/student-and-writing-tools",
    collection: "study",
    title: "Free Tools for Students and Writing",
    subtitle: "GPA and grade calculators, a citation generator, study planner, word counter, case converter and printable school sheets.",
    description: "Free student tools: GPA and CGPA calculator, final grade calculator, citation generator, study planner, word counter, case converter and printable exam sheets.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Work out a GPA or the score you need on a final exam, make citations, plan study time, count words and characters, change text case, and print class registers, exam timetables, OMR sheets and question paper layouts.",
      ] },
      { heading: "Check with your school", paragraphs: [
        "Grading scales and citation rules differ between schools and publishers. Use the results as a guide and follow your own institution's instructions.",
      ] },
    ],
  },
  {
    path: "/kids-learning-tools",
    collection: "kids",
    title: "Free Kids Learning Tools and Worksheets",
    subtitle: "Learn the clock, practise sums with carrying and borrowing, multiplication and division, play a money shop, and print worksheets and mazes.",
    description: "Free learning tools for kids: learn the clock, maths practice, money shop, tambola tickets, solar system and shadow explorers, worksheets and mazes.",
    sections: [
      { heading: "What children can do here", paragraphs: [
        "Practise telling the time, add and subtract with carrying and borrowing, work through long multiplication and division, run a pretend shop with money, explore the solar system and shadows, and print maths worksheets and mazes.",
      ] },
      { heading: "For parents and teachers", paragraphs: [
        "Tools show each step so a child can follow the method. Sit with younger children, and use the printable sheets for offline practice.",
      ] },
    ],
  },
  {
    path: "/developer-and-data-tools",
    collection: "dev",
    title: "Free Developer and Data Tools",
    subtitle: "Format, view and convert JSON, encode Base64 and URLs, convert timestamps and colours, and generate UUIDs, passwords and placeholder text.",
    description: "Free developer tools: JSON formatter, JSON viewer, JSON to CSV, Base64 and URL encoder, timestamp and colour converters, UUID, password and lorem ipsum generators.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Tidy and check JSON, explore big nested JSON as a tree, turn JSON into CSV, encode and decode Base64 and URLs, convert Unix timestamps and colour codes, and generate UUIDs, random passwords and placeholder text.",
      ] },
      { heading: "Keys and data stay with you", paragraphs: [
        "Everything runs on your device in your browser, so text, tokens and data you paste are not sent to MyDailyUtils. Still, avoid pasting live secrets into any website you have not checked.",
      ] },
    ],
  },
  {
    path: '/display-and-presentation-tools',
    collection: 'present',
    title: 'Free Display and Presentation Tools: Run a Slideshow on a TV or Shop Screen',
    subtitle: 'Slideshows, menu boards, queue numbers, exam clocks, interval timers and notice boards for a TV, a projector or a screen in your shop, class or gym.',
    description: 'Free display tools for a TV, projector or shop screen: slideshows, menu boards, queue token numbers, exam hall clock, interval timer, yoga class display, timings board and notice board. Run in your browser.',
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Add PDFs, Word files and pictures, put the slides in your order, set how long each one stays, choose fade or zoom, and play them fullscreen on a TV, a kiosk or a screen at the counter. You can loop or shuffle the slides and show a clock and the date while the screen stays awake.',
      ] },
      { heading: 'Good to know', paragraphs: [
        'Other tools here put your own text on a big screen. Show a menu or price list in a shop, call queue numbers in a clinic, run an exam hall clock, time Tabata or circuit rounds in a gym, lead a timed routine with pictures, show temple or hall timings that highlight what is on now, play a spelling bee, or rotate notices and birthday wishes. Everything runs in your browser. What you type is kept on your device and is not uploaded to MyDailyUtils.',
      ] },
      { heading: 'Ideas for who uses it', paragraphs: [
        'Shops and cafes use the menu board. Clinics, pharmacies and service counters use the queue token screen. Teachers and tuition centres use the exam hall display, the spelling bee and the Classroom Quiz Display. Gyms, yoga teachers and schools use the interval timer and the routine display. Temples, societies and offices use the timings board and the notice board.',
      ] },
    ],
  },
];
