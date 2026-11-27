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
    subtitle: "Merge, split, compress, fill, sign, redact, scan and convert PDF files. Each tool runs in your browser and your file is not uploaded.",
    description: "Free PDF tools in your browser: merge, split, compress, fill, sign, redact, scan to searchable PDF, table to Excel and more. No sign-up, no upload.",
    sections: [
      { heading: 'What you can do with PDFs here', paragraphs: [
        'Put files together or take them apart with Merge PDF, Split PDF, Organize PDF and Delete PDF Pages. Make a file small enough to send with Compress PDF. Complete a form with Fill PDF and Sign PDF, and hide private details with Redact PDF.',
        'Turn photos and scans into a PDF you can search, extract the text from a PDF, or compare two versions to see what changed. WhatsApp Chat to PDF turns an exported chat into a PDF, as chat bubbles or a plain record. PDF Table to Excel turns the table in a bank statement, marksheet or invoice PDF into an Excel or CSV file.',
        'Document Scanner cleans up photos of paper pages into one tidy PDF. Resize PDF Page Size fits, fills or stretches every page to a paper size, PDF Booklet Maker puts two pages on a sheet in the right order, and Grayscale PDF turns a colour file to greys or black and white. Extract Images from PDF saves the original pictures as one ZIP, Make PDF Fillable adds text boxes, tick boxes and drop-downs to a plain PDF, and PDF Bates Numbering adds running numbers and file names to one or many files.',
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
    subtitle: "Resize photos for forms, make files smaller, remove hidden location, blur private details, and make passport sheets, collages, GIFs and social media sizes. All in your browser.",
    description: "Free photo tools: resize to a size in KB, compress, convert, passport photo sheets, remove location, background remover, collage and GIF maker. In your browser.",
    sections: [
      { heading: 'What you can do with photos here', paragraphs: [
        'Resize a photo to the size an online form asks for, shrink an image to a size in KB, convert between JPG, PNG and WebP, and lay out passport photos on a sheet to print. Add a name and date strip under a photo for forms that ask for one.',
        'Before you share a photo, see what it reveals with Remove Location and EXIF Data, and blur private details in a screenshot with the Screenshot Redactor. The Background Remover makes a plain background transparent for a product photo, signature or logo.',
        'The Social Image Resizer makes post, story, thumbnail, banner and profile sizes together. The Photo Collage Maker puts two to nine photos on one page, the Photo Grid Splitter cuts a picture into numbered tiles for posting, the GIF Maker turns pictures into an animation, and the Signature Maker saves a transparent signature. Bulk Image Tools resize, convert or watermark a whole batch as one ZIP.',
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
    subtitle: "Make QR codes for links, Wi-Fi and contacts, scan one safely, make barcodes and WhatsApp links, and share documents with a password.",
    description: "Free QR code and sharing tools: QR codes for links, Wi-Fi and contacts, a safe scanner, barcodes, WhatsApp links and password-protected documents.",
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Make a QR code for a web address, a Wi-Fi network or a contact card, or make many at once. Scan a QR code from a photo, a screenshot or your camera and see what is inside before you open a link or pay, and put a password on a document you are sharing. You can also make a WhatsApp link that opens a chat with your first message typed in, print a Code 128 or EAN-13 barcode label sheet, and turn a large .vcf contacts file into a CSV.',
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
    subtitle: "Age, dates, percentages, discounts, units, time zones, bill splitting, number to words, and quick name and team pickers. No sign-up.",
    description: "Free everyday tools: age and date calculators, percentage and discount, unit and time zone converters, bill splitter, number to words, name and team pickers.",
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Work out an exact age or the days between two dates, find a percentage or a discounted price, convert units, compare times between cities, split a bill between friends, write a number in words, and pick a name, make random teams or draw Secret Santa pairs.',
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
    subtitle: "Court sizes and rules, cricket and match scoreboards, fixtures, cricket run rates, exercises with pictures, weekly plans, a workout log, pace and strength calculators.",
    description: "Free sports and fitness tools: court size guide, cricket scorer, scoreboards, tournament fixtures, run rate, exercise library, workout plans, log, pace and 1RM.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Look up the size, markings and playing rules of common courts and grounds, score a cricket innings ball by ball, run a quick scoreboard for basketball, football, hockey or kabaddi, keep the score of a badminton, tennis, volleyball, table tennis, squash or pickleball match, and make fixtures and a points table for a tournament. Work out cricket run rates and averages. Browse exercises and yoga poses with moving pictures, follow a fixed 3, 4 or 5 day plan, log your sets, estimate your one-rep max, load a barbell, work out your running pace and check a BMI figure.",
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
    subtitle: "Make and print paper, planners, meal plans, flashcards, registers, certificates for a whole list of names, labels and more as a PDF.",
    description: "Free printable sheets and templates: planners, meal plans, flashcards, registers, certificates for a list of names, name tags and trackers as a PDF.",
    sections: [
      { heading: "What you can make", paragraphs: [
        "Lined, grid and dotted paper, monthly and weekly planners, meal plans, flashcards, health and care sheets, household registers, certificates (including one for every name in a list), name tags, trackers, worksheets and puzzles. Type your details, choose a look and download a PDF.",
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
    subtitle: "Resume, invoices, quotations, rent receipts, price tags, visiting cards, posters, review signs, bulk letters, and registers for work and shops.",
    description: "Free tools for work: resume builder, GST invoice, quotation, rent receipt, freelance rate, margin calculator, price tags, visiting cards, bulk letters, signs.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Build a resume, write a job description, check a file before an online application, work out a notice period, price your freelance work and work out margin and markup. Make a quotation, a GST invoice or a rent receipt, and write one letter that is filled in for every row of a list, such as fee reminders or society dues notices.",
        "For a shop or business, design price tags, offer posters, visiting cards, ID cards, stamps and a UPI payment stand, and make a counter sign with QR codes for your Google review, Instagram, Facebook, Zomato or WhatsApp. Print registers and checklists for staff attendance, tuition fees, customer orders, office cleaning and society notices. The Excel workbook makers for invoices, attendance, delivery bills and Gantt charts have their own section, Excel templates and makers.",
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
    subtitle: "GPA and grade calculators, a citation generator, study planner, word counter, case converter, report cards with a rank list, an OMR sheet grader and printable school sheets.",
    description: "Free student tools: GPA and CGPA, final grade calculator, citation generator, study planner, word counter, report cards, OMR grader and printable exam sheets.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Work out a GPA or the score you need on a final exam, make citations, plan study time, count words and characters, change text case, and print class registers, exam timetables, OMR sheets and question paper layouts. Paste a class's marks to make a report card for each student and a rank list, and mark multiple-choice tests by photographing the answer sheets you print here.",
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
    path: "/audio-and-video-tools",
    collection: "media",
    title: "Free Audio and Video Tools",
    subtitle: "Cut and join audio, clean a voice note, compress and trim video, add subtitles, record your screen or whiteboard, and make globe, map, chart, photo story and explainer videos. Free, with no upload.",
    description: "Free audio and video tools: cut audio, trim and compress video, add subtitles, remove noise, record your screen, and make chart, map, globe and photo videos.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Open one or more audio files, put them in order, choose the part to keep on a sound wave, add a fade in and out, listen to the result and save it. For video, the Globe Video Maker turns two places into a short video of a globe flying from the first to the second, with six looks and Reel, YouTube and square sizes. The Handwriting Video Maker writes up to six lines of your text by hand with a pen, in four fonts, for explainer clips. The Sequence Diagram Video Maker turns text such as Customer->Shop: Place order into a video where the boxes and arrows draw themselves, and can record your voice over it. The Explainer Video Maker builds slides from short lines such as left: Factory, arrow: ships goods and right: Port, with bullets, big text and your own pictures. The Map Video Maker lights up the countries you type one by one on a world map, with pins on big cities, for videos such as countries I visited. The Chart Reveal Video Maker turns lines such as Jan: 40 into a bar, horizontal bar, line, pie, donut or race chart that builds up step by step, with notes, an end card and your voice, for sales growth, followers, budgets and class results. The Photo Story Video Maker turns up to 10 photos into a video with a caption on each, a title card, an end card and a slow zoom or pan, in four looks, with quick starters for a trip, a product, a birthday, before and after, a recipe or an event, and your voice if you like. Tap-to-Time Captions takes your own lines and your audio, and you tap each time a line begins, to save an SRT or WebVTT subtitle file for CapCut, YouTube or Instagram Edits, or a simple captions video, with no speech recognition so it works in any language. The Audio Clip Video Maker puts a voice note, podcast clip or song under a cover picture and a title with bars, a wave or a circle that move to the real sound, so audio can be posted where only video is allowed. The App and Website Demo Video Maker puts screenshots in a phone or laptop frame with tap circles, arrows, zoom, scrolling and a cover over private details, for a clean demo without screen recording. The Speak-to-Captions Video Maker listens as you talk and shows your words as timed captions a few at a time, with a fix-the-words step and SRT, WebVTT or video output. Your browser's own speech service does the listening, which sends the voice to Google, Microsoft or Apple, and the page says so before you start. The Video Compressor and Trimmer cuts a video to the part you choose and makes the file smaller, with starters for WhatsApp, email, Reels or a much smaller copy, a size limit in megabytes and a choice of picture size, quality and frames a second. It keeps the sound and the video is never uploaded. The Subtitles Burner adds an SRT or WebVTT subtitle file to your video and saves a new video with the words drawn on the picture, with five quick looks, a preview over your video, a timing shift and a choice of colour, place and size. The video and the words are never uploaded. The Voice Clean-up tool reduces hiss, hum and room noise in a voice note or the sound of a video, evens out and raises the volume, cuts silence at the ends and lets you play the original and the cleaned sound side by side, then save a WAV or a small file. The recording is never uploaded. The Screen Recorder with Face Bubble records a screen, window or tab on a computer with your face in a corner bubble and your voice, with five starters, pause, a countdown and an optional screen sound. It does not work on phones, because their browsers cannot record the screen, and says so on the page. The recording is never uploaded. The Teleprompter with Video Recording scrolls a script over your camera picture while you record a video of yourself with your voice. It has four sample scripts, speed and text size controls, a practice mode and a countdown, and the script never appears in the saved video. Nothing is uploaded. The Whiteboard Lesson Recorder lets you draw or write on a white, grid, chalk or black board with your finger, a pen or a mouse and records the drawing with your voice as a video. It has four starters, coloured pens, an eraser, undo, pause and a sample drawing, and works on phones and tablets. Nothing is uploaded. The Before and After Video Maker turns two photos into a short reveal video, with a line from the left or top, an opening from the middle or a fade, plus a title, BEFORE and AFTER tags and optional music. It has four starters, sample photos to try first, and reel, square, portrait and wide shapes. There is no watermark and nothing is uploaded. The Blur Faces or Number Plates in a Video tool puts boxes that you place over faces, number plates or anything private, which can move and can be shown for part of the video, and saves a new video with them blurred, blocked or covered in black. There is no watermark and nothing is uploaded.",
      ] },
      { heading: "Your recordings stay with you", paragraphs: [
        "Audio is read and edited, and globe and handwriting videos are drawn and recorded, on your own device in your browser, so private voice notes and recordings are not sent to MyDailyUtils.",
      ] },
    ],
  },
  {
    path: "/developer-and-data-tools",
    collection: "dev",
    title: "Free Developer and Data Tools",
    subtitle: "Format, view and convert JSON, encode Base64 and URLs, convert timestamps and colours, and generate UUIDs, passwords and placeholder text.",
    description: "Free developer tools: JSON formatter, viewer and CSV converter, Base64 and URL encoder, timestamp and colour converters, UUID and password generators.",
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
    subtitle: "Slideshows, menu boards, queue numbers, exam clocks, timers, quizzes, a spinner wheel, lucky draws and notice boards for a TV, a projector or a shop, class or gym screen.",
    description: "Free display tools for a TV or projector: slideshows, menu boards, queue tokens, exam clock, timers, quiz, spinner wheel, lucky draw and notice board.",
    sections: [
      { heading: 'What you can do here', paragraphs: [
        'Add PDFs, Word files and pictures, put the slides in your order, set how long each one stays, choose fade or zoom, and play them fullscreen on a TV, a kiosk or a screen at the counter. You can loop or shuffle the slides and show a clock and the date while the screen stays awake.',
      ] },
      { heading: 'Good to know', paragraphs: [
        'Other tools here put your own text on a big screen. Show a menu or price list in a shop, call queue numbers in a clinic, run an exam hall clock, time Tabata or circuit rounds in a gym, lead a timed routine with pictures, show temple or hall timings that highlight what is on now, play a spelling bee, run a classroom quiz, show team scores, spin a wheel of names, draw lucky winners, show a class seating plan, or rotate notices and birthday wishes. Everything runs in your browser. What you type is kept on your device and is not uploaded to MyDailyUtils.',
      ] },
      { heading: 'Ideas for who uses it', paragraphs: [
        'Shops and cafes use the menu board. Clinics, pharmacies and service counters use the queue token screen. Teachers and tuition centres use the exam hall display, the spelling bee and the Classroom Quiz Display. Gyms, yoga teachers and schools use the interval timer and the routine display. Temples, societies and offices use the timings board and the notice board.',
      ] },
    ],
  },
  {
    path: '/word-document-makers',
    collection: 'word',
    title: 'Free Word Document Makers: Resume, Cover Letter, Leave Letter and More',
    subtitle: 'Fill in a few boxes, check the preview and download an editable Word file. The layout is done for you, and the file is made on your device.',
    description: "Free Word document makers: resume, cover letter, resignation and leave letters, minutes and notices. Edit the .docx in Word. No sign-up, nothing uploaded.",
    sections: [
      { heading: 'What you can make here', paragraphs: [
        'Each tool builds a real Word (.docx) file from a few boxes. The Resume Word Maker makes a resume with a classic or clean look, with jobs, education and skills. The Cover Letter Word Maker lays out your address, the company, three short parts and a sign-off. The Resignation Letter Word Maker adds your last working day and counts the days of notice. The Leave Application Word Maker is for school or office and counts the days of leave. The Meeting Minutes Word Maker records who came, what was decided and who will do what by when. The Notice and Circular Word Maker makes a notice for a school, society or office.',
      ] },
      { heading: 'How these documents work', paragraphs: [
        'Pick a starting point to see a full sample, then replace it with your own words. A live preview shows the page as you type. When you are happy, make the Word file and open it in Word, Google Docs or WPS Office to change anything you like. If a part is still in [square brackets], the page reminds you to replace it.',
      ] },
      { heading: 'Private, and what to check', paragraphs: [
        'The documents are made in your browser and what you type is not sent to MyDailyUtils or saved. The tools only lay out the words you give them: they add no legal, tax or workplace rules. Check names, dates and any notice period against your own contract or rules before you send a document.',
      ] },
    ],
  },
  {
    path: '/excel-template-makers',
    collection: 'excel',
    title: 'Free Excel Templates and Makers: Invoice, Stock, Ledger, Cash Book and More',
    subtitle: 'Make a ready-to-use Excel workbook for your own job. The formulas, drop-downs and colours are already set up, and the file is made on your device.',
    description: "Free Excel templates and makers: invoice, stock, ledger, cash book, timesheet, leads, budget, marks sheet and more. Download an .xlsx with formulas. No sign-up.",
    sections: [
      { heading: 'What you can make here', paragraphs: [
        'Each tool builds a real Excel (.xlsx) workbook around your own details. The Gantt Chart Excel Maker turns a task list into a project timeline that colours itself. The Attendance Register Excel Maker makes monthly sheets with weekly offs, holidays and a summary. The Invoice Excel Template Maker makes an invoice with item and customer lists, taxes you type yourself and a log of every invoice. The Delivery Bill Excel Maker makes monthly bills for milk, tiffin, newspaper or water cans, with a reminder link for customers who owe.',
        'For a shop or small business there are also a Stock Register Excel Maker with a reorder alert and order list, a Credit Ledger (udhaar khata) with ageing and WhatsApp reminders, a Daily Cash Book that tracks cash, bank and UPI, and a Supplier Payment Tracker that shows due and overdue bills. The Timesheet Excel Maker works out hours and overtime, the Fees and Rent Tracker follows twelve months of dues with receipts, and the Budget Planner compares plan with actual.',
        'To stay organised there are a Lead and Enquiry Tracker with follow-up dates and WhatsApp links, an Expense Claim sheet with limits and approval status, a Job and Order Tracker with advance and balance, a Vehicle Log Book with cost per kilometre and kilometres per litre, and a Marks and Rank Sheet for a class.',
      ] },
      { heading: 'How these workbooks work', paragraphs: [
        'You can download a blank workbook, or one filled with sample data to see how it behaves. Choose your region first, so the currency, date order, paper size, tax name and weekly off days match how you work. The sums are ordinary formulas, the drop-downs are real lists and the colours are colour rules, so the file works in Excel, Google Sheets, WPS Office and LibreOffice without macros.',
      ] },
      { heading: 'Private, and what to check', paragraphs: [
        'The workbooks are made in your browser and your lists are not sent to MyDailyUtils. Tax names and rates are typed by you and are not built in, because they differ by country and change over time. Check the totals against your own records before you rely on a file for accounts or payroll.',
      ] },
    ],
  },
];
