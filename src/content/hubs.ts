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
    subtitle: "Court sizes and rules, cricket and match scoreboards, fixtures, cricket run rates, exercises with pictures, weekly plans, a workout log, pace and strength calculators.",
    description: "Free sports and fitness tools: court size and rules guide, cricket scorer, quick scoreboard, match score keeper, tournament fixtures, cricket run rate calculator, exercise library, weekly workout plans, workout log, running pace and one-rep max calculators.",
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
    path: "/audio-and-video-tools",
    collection: "media",
    title: "Free Audio and Video Tools",
    subtitle: "Cut and join audio files and voice notes, make a globe video from one place to another or to many places, write text on screen by hand, turn a text diagram into an animated video with a voice-over, build slides with arrows and pictures as a video, light up countries on a world map and turn numbers into bar, line, pie or race chart videos turn photos with captions into a story video make subtitle files by tapping to the beat of your audio turn audio into a video with moving sound bars turn screenshots of an app or website into a demo video, turn your speech into timed captions, make a video smaller and cut it to the part you want, burn subtitle files into a video, clean the noise out of a voice recording, make a plain background transparent, record your screen with your face in a bubble, turn a WhatsApp chat into a PDF, read a script from a moving teleprompter while you record, draw on a whiteboard and record the lesson and make a before and after reveal video, free and without uploading anything.",
    description: "Free audio and video tools: cut and trim audio, join files, add fades, and make a globe animation video that flies from A to B, a handwriting video of text being written, an animated sequence diagram video, an explainer slides video, and a world map video that lights up countries one by one, a chart video where bars, lines, pies and races build up from your numbers, a photo story video with captions and a slow zoom on every photo, an SRT subtitle maker where you tap as each line starts, an audio clip video with sound bars and a cover picture, an app or website demo video made from screenshots in a phone or laptop frame, a speak-to-captions maker, a video compressor and trimmer that fits a clip under a size limit, a subtitles burner that draws an SRT file onto a video, a voice clean-up that reduces background noise and evens out the volume, a background remover for plain backgrounds, a screen recorder with a face bubble for computers, a WhatsApp chat to PDF maker, a teleprompter that records your video, a whiteboard lesson recorder, and a before and after video maker, for Reels, Shorts and YouTube. Runs in your browser.",
    sections: [
      { heading: "What you can do here", paragraphs: [
        "Open one or more audio files, put them in order, choose the part to keep on a sound wave, add a fade in and out, listen to the result and save it. For video, the Globe Video Maker turns two places into a short video of a globe flying from the first to the second, with six looks and Reel, YouTube and square sizes. The Handwriting Video Maker writes up to six lines of your text by hand with a pen, in four fonts, for explainer clips. The Sequence Diagram Video Maker turns text such as Customer->Shop: Place order into a video where the boxes and arrows draw themselves, and can record your voice over it. The Explainer Video Maker builds slides from short lines such as left: Factory, arrow: ships goods and right: Port, with bullets, big text and your own pictures. The Map Video Maker lights up the countries you type one by one on a world map, with pins on big cities, for videos such as countries I visited. The Chart Reveal Video Maker turns lines such as Jan: 40 into a bar, horizontal bar, line, pie, donut or race chart that builds up step by step, with notes, an end card and your voice, for sales growth, followers, budgets and class results. The Photo Story Video Maker turns up to 10 photos into a video with a caption on each, a title card, an end card and a slow zoom or pan, in four looks, with quick starters for a trip, a product, a birthday, before and after, a recipe or an event, and your voice if you like. Tap-to-Time Captions takes your own lines and your audio, and you tap each time a line begins, to save an SRT or WebVTT subtitle file for CapCut, YouTube or Instagram Edits, or a simple captions video, with no speech recognition so it works in any language. The Audio Clip Video Maker puts a voice note, podcast clip or song under a cover picture and a title with bars, a wave or a circle that move to the real sound, so audio can be posted where only video is allowed. The App and Website Demo Video Maker puts screenshots in a phone or laptop frame with tap circles, arrows, zoom, scrolling and a cover over private details, for a clean demo without screen recording. The Speak-to-Captions Video Maker listens as you talk and shows your words as timed captions a few at a time, with a fix-the-words step and SRT, WebVTT or video output. Your browser's own speech service does the listening, which sends the voice to Google, Microsoft or Apple, and the page says so before you start. The Video Compressor and Trimmer cuts a video to the part you choose and makes the file smaller, with starters for WhatsApp, email, Reels or a much smaller copy, a size limit in megabytes and a choice of picture size, quality and frames a second. It keeps the sound and the video is never uploaded. The Subtitles Burner adds an SRT or WebVTT subtitle file to your video and saves a new video with the words drawn on the picture, with five quick looks, a preview over your video, a timing shift and a choice of colour, place and size. The video and the words are never uploaded. The Voice Clean-up tool reduces hiss, hum and room noise in a voice note or the sound of a video, evens out and raises the volume, cuts silence at the ends and lets you play the original and the cleaned sound side by side, then save a WAV or a small file. The recording is never uploaded. The Background Remover makes a plain background transparent for a product photo, signature, logo or scan, and can put white or a colour behind it. It matches colours rather than recognising objects, so the page says it suits plain backgrounds, and the picture is never uploaded. The Screen Recorder with Face Bubble records a screen, window or tab on a computer with your face in a corner bubble and your voice, with five starters, pause, a countdown and an optional screen sound. It does not work on phones, because their browsers cannot record the screen, and says so on the page. The recording is never uploaded. The WhatsApp Chat to PDF tool turns an exported chat text file or zip into a PDF as chat bubbles or a plain transcript, with a date range, people and word filters, photos from a zip, a summary page and an option to hide phone numbers. Hindi, other scripts and emoji come out right. The chat is read on the device and never uploaded. The Teleprompter with Video Recording scrolls a script over your camera picture while you record a video of yourself with your voice. It has four sample scripts, speed and text size controls, a practice mode and a countdown, and the script never appears in the saved video. Nothing is uploaded. The Whiteboard Lesson Recorder lets you draw or write on a white, grid, chalk or black board with your finger, a pen or a mouse and records the drawing with your voice as a video. It has four starters, coloured pens, an eraser, undo, pause and a sample drawing, and works on phones and tablets. Nothing is uploaded. The Before and After Video Maker turns two photos into a short reveal video, with a line from the left or top, an opening from the middle or a fade, plus a title, BEFORE and AFTER tags and optional music. It has four starters, sample photos to try first, and reel, square, portrait and wide shapes. There is no watermark and nothing is uploaded.",
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
