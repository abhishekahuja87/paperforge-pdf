/**
 * "Common questions" and "Related sections" for the collection pages (src/content/hubs.ts), keyed by page path.
 * Written from the questions people type into search (see the keyword research sheet), in plain words.
 * Every answer must match what the tool really does, and must hold no tax, salary, exam, medical or legal rules:
 * where a rule matters, send the reader to the official notice.
 */
export interface HubFaq { q: string; a: string }
export interface HubFaqSet { faqs: HubFaq[]; related: string[] }

export const HUB_FAQS: Record<string, HubFaqSet> = {
  '/pdf-tools': {
    related: ['/photo-and-image-tools', '/jobs-and-business-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I take one page, or a few pages, out of a PDF?', a: 'Open Split PDF, choose the file and pick the pages you want to keep. You download a new PDF with only those pages. The original file is not changed. To cut a long file into several parts, use Smart Split PDF.' },
      { q: 'My PDF is too big to upload or email. What should I do?', a: 'Use Compress PDF. It shows the new file size before you download, so you can check it against the limit on your form. If the file is still too big, split it into parts with Smart Split PDF or delete pages you do not need with Delete PDF Pages.' },
      { q: 'Can I put photos or phone scans into one PDF?', a: 'Yes. Image to PDF joins JPG, PNG and WebP pictures into one file. The Document Scanner works from your phone camera and cleans up shadows before saving a PDF.' },
      { q: 'Can I sign or fill a PDF without printing it?', a: 'Yes. Fill PDF types text, ticks and dates onto any PDF, and Sign PDF places a drawn, typed or uploaded signature. A picture of a signature is not a certified digital signature, so check that the office you are sending it to accepts a plain signed copy.' },
      { q: 'Are my PDFs uploaded anywhere?', a: 'No. These tools work in your browser on your own device, and your files are not sent to MyDailyUtils. The Why trust us page shows how to check this yourself.' },
    ],
  },
  '/photo-and-image-tools': {
    related: ['/pdf-tools', '/jobs-and-business-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I make a photo or signature exactly 20 KB, 50 KB or 100 KB?', a: 'Open the Image Resizer and press the 20, 50 or 100 KB button. The tool lowers the quality first and scales the picture down in small steps only if that is not enough. It shows the new size, and tells you if the limit cannot be reached. You can also set exact pixels if the form asks for them.' },
      { q: 'Why does a form still reject my photo?', a: 'Forms usually check several things at once: file size in KB, width and height in pixels, and file type such as JPG. A file that is small in KB can still be too wide or too tall. Check the exact limits in your form\'s own notice, then set both size and pixels in the Image Resizer.' },
      { q: 'Can I make a file bigger, for example from 10 KB to 20 KB?', a: 'The Image Resizer is made to bring a file down to a maximum size, so it does not pad a file to make it bigger. File size depends on the pixels and the quality, so if a form needs a minimum size, start from a clearer photo with more pixels and check the size shown before you download.' },
      { q: 'How do I remove my location from a photo before sharing it?', a: 'Open Remove Location and EXIF Data. It shows what is hidden in the photo, such as the place, phone model and time, and saves a clean copy with that removed.' },
      { q: 'Are my photos uploaded anywhere?', a: 'No. Photos are read and changed on your own device in your browser. Nothing is sent to MyDailyUtils.' },
    ],
  },
  '/tax-and-salary-calculators': {
    related: ['/loan-and-investment-calculators', '/jobs-and-business-tools', '/everyday-tools'],
    faqs: [
      { q: 'Can I compare the old and new tax regime?', a: 'Yes. The Income Tax Calculator shows the old and the new regime side by side for the year named on the tool, so you can see which gives a lower figure for your numbers. Tax rules change, so check the final figure against the official income tax website or with a qualified adviser.' },
      { q: 'How do I turn annual CTC into monthly in-hand salary?', a: 'Use the Salary Calculator. Enter your annual CTC, the basic salary as a percentage of it, the PF option, the tax regime and professional tax, and it shows the monthly in-hand figure. Your own pay slip is the final word, because companies split pay in different ways.' },
      { q: 'What do I need to work out the tax-exempt part of HRA?', a: 'The HRA Calculator asks for basic salary, the HRA you receive, the rent you pay and whether you live in a metro city. It then shows the exempt part. Keep your rent receipts, and use the Rent Receipt Generator to make them.' },
      { q: 'Can I estimate gratuity or provident fund?', a: 'Yes. The Gratuity Calculator estimates gratuity on leaving a job, and the EPF Calculator projects a provident fund balance. Both are estimates from the numbers you enter. Check the rules that apply to you with your employer.' },
      { q: 'Do these calculators store what I enter?', a: 'No. The sums are done in your browser and your numbers are not sent to MyDailyUtils.' },
    ],
  },
  '/loan-and-investment-calculators': {
    related: ['/tax-and-salary-calculators', '/everyday-tools', '/jobs-and-business-tools'],
    faqs: [
      { q: 'What is the difference between an FD and an RD?', a: 'In a fixed deposit you put in one lump sum for a fixed time. In a recurring deposit you put in the same amount every month. The FD Calculator and the RD Calculator show the maturity value for the rate and time you enter, and the guide on RD versus FD explains which fits which need.' },
      { q: 'How do I work out my monthly loan EMI?', a: 'Open the EMI Calculator and enter the loan amount, the yearly interest rate and the number of months or years. It shows the monthly EMI, the total interest and a repayment schedule, and suggests ways to pay less interest.' },
      { q: 'Can I see how a monthly SIP might grow?', a: 'The SIP Calculator estimates the value of a monthly investment at a return you choose, with an optional yearly step-up. It is an estimate for planning. Real returns are not fixed and can be lower than the figure you type in.' },
      { q: 'What is the difference between simple and compound interest?', a: 'Simple interest is worked out on the starting amount only. Compound interest is also worked out on the interest already added. The Simple and Compound Interest Calculator puts both side by side for the same amount.' },
      { q: 'Which interest rate should I use?', a: 'Use the rate from your bank, lender or scheme, because rates change. Every calculator here lets you type your own rate, so the result matches your offer.' },
    ],
  },
  '/everyday-tools': {
    related: ['/loan-and-investment-calculators', '/jobs-and-business-tools', '/student-and-writing-tools'],
    faqs: [
      { q: 'How do I split a bill between friends?', a: 'Open the Bill Splitter, add the amount, the people and any tip, and it shows each person\'s share. For a group trip with many payments, it can also work out who should pay whom to settle up.' },
      { q: 'How do I add or remove GST from a price?', a: 'The GST Calculator adds GST to a price or takes it out, and shows the CGST and SGST parts. Type the GST rate that applies to your goods or service.' },
      { q: 'Can I work out someone\'s exact age or a number of days?', a: 'The Age Calculator gives exact age in years, months and days.' },
      { q: 'Can I convert units such as area, weight or length?', a: 'Yes. The Unit Converter handles length, weight, area, volume, speed, data and temperature.' },
      { q: 'Do I need an account for any of these?', a: 'No. Every tool is free, with no sign-up, and works in your browser.' },
    ],
  },
  '/qr-and-sharing-tools': {
    related: ['/jobs-and-business-tools', '/printables-and-templates', '/photo-and-image-tools'],
    faqs: [
      { q: 'Do the QR codes I make expire?', a: 'No. The QR Code Generator makes a normal QR code that holds your link or text, so there is no account, no subscription and no expiry date. The code stays valid as long as the link inside it works.' },
      { q: 'How do I make many QR codes at once?', a: 'Use the Bulk QR Code Generator. Paste a list of labels and links, one on each line, and download all the codes as a ZIP of PNG or SVG files, or print a labelled sheet. It suits event passes, product labels and student IDs.' },
      { q: 'How do I put my phone number or contact in a QR code?', a: 'Use the vCard QR Code Generator. When someone scans it, their phone offers to save your name and number to the address book.' },
      { q: 'Can I make a QR code for my Wi-Fi?', a: 'Yes. The Wi-Fi Password Sign in Printables makes a sign with the network name, the password and a QR code that phones can scan to join. Only share it where you are happy for guests to join.' },
      { q: 'Is it safe to scan a QR code?', a: 'Check before you open it. The QR Code Scanner shows what a code contains, such as a link or a payment request, before anything opens, and it never opens or pays by itself.' },
    ],
  },
  '/printables-and-templates': {
    related: ['/kids-learning-tools', '/jobs-and-business-tools', '/student-and-writing-tools'],
    faqs: [
      { q: 'How do I print graph paper or dotted paper?', a: 'Open the Graph Paper Generator for 2.5, 5 or 10 mm squares, or the Printable Paper Maker for dot grid, graph, lined, Cornell, isometric, music and tracker paper. Press print and choose actual size so the squares stay the right size.' },
      { q: 'Can I make a cross stitch grid for my fabric?', a: 'Yes. The Cross Stitch Pattern Grid Generator makes graph paper sized for your Aida count, so each square matches a stitch.' },
      { q: 'How do I print flashcards that line up on both sides?', a: 'The Printable Flashcard Maker prints every answer behind its question, as a two-sided sheet or a fold-over card. Print on both sides of the same sheet and check the first page before printing the rest.' },
      { q: 'Can I change the wording on a template?', a: 'Yes. The notice, certificate, label and tracker templates have editable text, so you type your own names, dates and details before you print.' },
      { q: 'Do I need to sign up to print?', a: 'No. All printables are free, with no sign-up, and the page is made in your browser.' },
    ],
  },
  '/jobs-and-business-tools': {
    related: ['/tax-and-salary-calculators', '/pdf-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I make a quotation for a customer?', a: 'Open the Quotation Generator, add your business details, the customer and your items with prices, and save it as a PDF. Send the PDF by email or WhatsApp. A quotation is an offer of a price. When the customer agrees, you can make a bill with the GST Invoice Generator.' },
      { q: 'How do I make a rent receipt?', a: 'The Rent Receipt Generator makes a receipt for every month in a range, with the amount in words, the landlord\'s PAN and a signature line. Print three to a page or save as PDF. Check with your employer what proof they ask for.' },
      { q: 'Can I make a visiting card for free?', a: 'Yes. The Visiting Card Maker has 17 colour, gradient and plain designs. Add your details and a QR code, then download a PNG, a PDF, or an A4 sheet with ten cards to print and cut.' },
      { q: 'How do I work out my last working day or what to charge as a freelancer?', a: 'The Notice Period Calculator finds your last working day, buyout cost and the gap before a new job. The Freelance Rate Calculator finds the hourly, day and project rate you need to earn.' },
      { q: 'Is anything I type kept?', a: 'No. Your business details stay on your device and are not sent to MyDailyUtils.' },
    ],
  },
  '/student-and-writing-tools': {
    related: ['/kids-learning-tools', '/printables-and-templates', '/everyday-tools'],
    faqs: [
      { q: 'How do I make an MLA or APA citation?', a: 'Open the Citation Generator, choose the style and the kind of source, and fill in the details. It makes the citation and a sorted reference list in four styles. Check the result against your teacher\'s or journal\'s guide, because some courses add their own rules.' },
      { q: 'Can I switch a reference list from one style to another?', a: 'Change the Citation style box and the same details are written in the new style. You can then copy the result.' },
      { q: 'How do I count words or reading time?', a: 'The Word Counter counts words, characters, sentences and reading time as you type or paste.' },
      { q: 'Can I work out GPA, CGPA or percentage?', a: 'Yes. The GPA and CGPA Calculator works out GPA, CGPA, percentage and the grade you need next. Universities use different formulas, so check your own university\'s rule before you quote the result.' },
      { q: 'Is my writing saved anywhere?', a: 'No. Text stays in your browser and is not sent to MyDailyUtils.' },
    ],
  },
  '/kids-learning-tools': {
    related: ['/printables-and-templates', '/student-and-writing-tools', '/everyday-tools'],
    faqs: [
      { q: 'How can my child learn long multiplication?', a: 'Open Long Multiplication for Kids. It shows the sum one digit at a time with every carry, then lets the child try it. Use the examples or type your own numbers.' },
      { q: 'What do carrying and borrowing mean?', a: 'Carrying is moving extra tens to the next column when a column adds up to ten or more. Borrowing is taking a ten from the next column when the top digit is too small to subtract from. The addition and subtraction lessons show each step on screen.' },
      { q: 'Can my child learn to read a clock?', a: 'Yes. Learn the Clock lets a child move the hands, with hour and minute buttons, and practise times such as half past and quarter past.' },
      { q: 'Can my child practise money?', a: 'Yes. The Money Shop lets a child pay, count change and run a small pretend shop. It is a good game to play at home.' },
      { q: 'Are the kids tools safe?', a: 'They run in your browser, with no sign-up and no account for the child. Nothing a child types is sent to MyDailyUtils.' },
    ],
  },
  '/sports-and-fitness-tools': {
    related: ['/printables-and-templates', '/everyday-tools', '/display-and-presentation-tools'],
    faqs: [
      { q: 'What is the size of a badminton court?', a: 'The Sports Court Size Guide shows the badminton court drawn to scale in metres and feet, for singles and doubles, with a marking plan. Court and ground sizes for 13 sports are on the same page. For official events, check the size in the rules of your sports body.' },
      { q: 'Can I check whether a court fits my space?', a: 'Yes. Enter the length and width of your space and the guide shows which courts fit.' },
      { q: 'How do I mark the lines on the ground?', a: 'Each court has a marking plan with the lengths to measure. Measure carefully and check the result against the rules of your sports body.' },
      { q: 'Is there a scoreboard I can use at a match?', a: 'The Team Scoreboard in Display and presentation lets you add teams, tap to add points and show big scores on a projector or TV.' },
      { q: 'Do these tools give health advice?', a: 'No. They measure, count and plan. For any health question, speak to a doctor or a qualified coach.' },
    ],
  },
  '/audio-and-video-tools': {
    related: ['/photo-and-image-tools', '/qr-and-sharing-tools', '/developer-and-data-tools'],
    faqs: [
      { q: 'How do I cut part of an audio file?', a: 'Open the Audio Cutter and Joiner, choose the file, set the start and end of the part you want and save it. You can add fades at the start and end.' },
      { q: 'Can I join two audio files into one?', a: 'Yes. Add the files in the order you want and save one new file.' },
      { q: 'Can I make a ringtone?', a: 'Cut the part you like with the Audio Cutter and Joiner and save it. Your phone decides which file types it accepts as a ringtone, so check that after saving.' },
      { q: 'What file does it save?', a: 'The cutter saves WAV files. WAV files are bigger than MP3 files, but they keep the full quality of the audio.' },
      { q: 'Is my audio uploaded?', a: 'No. The audio is cut in your browser and nothing is uploaded to MyDailyUtils.' },
    ],
  },
  '/developer-and-data-tools': {
    related: ['/everyday-tools', '/student-and-writing-tools', '/pdf-tools'],
    faqs: [
      { q: 'How do I view a large JSON file?', a: 'Open the JSON Viewer. It shows the data as a tree, a table or text, with search and a copy of the path to any value. Large files are shown in parts so the page stays quick.' },
      { q: 'Can I turn JSON into CSV for Excel?', a: 'Yes. The JSON to CSV Converter turns a list of records into rows and columns that Excel and Google Sheets open. Nested values are flattened into extra columns.' },
      { q: 'Can I format or check JSON?', a: 'The JSON Formatter formats, checks and shrinks JSON, and points to the place where it is not valid.' },
      { q: 'Is my data sent to a server?', a: 'No. The data is processed in your browser, so you can use these tools on private files. The Why trust us page shows how to check this.' },
      { q: 'Do I need to create an account?', a: 'No. There is no sign-up and no usage limit.' },
    ],
  },
  '/display-and-presentation-tools': {
    related: ['/sports-and-fitness-tools', '/kids-learning-tools', '/jobs-and-business-tools'],
    faqs: [
      { q: 'How do I show a menu or notices on a TV?', a: 'The Menu Board Display and Notice Board Display loop your items or messages full screen on any TV or monitor. Add your text and prices, then open full screen.' },
      { q: 'Can I run a scoreboard for a quiz or sports day?', a: 'Yes. The Team Scoreboard lets you add teams, tap to add points and show big scores on a projector or TV. Scores are saved on your device.' },
      { q: 'Do these need an internet connection while showing?', a: 'The page must load once. After that, keep the tab open. For an important event, test it on the same screen first.' },
      { q: 'Is anything uploaded?', a: 'No. What you add is kept on your device and is not sent to MyDailyUtils.' },
      { q: 'Do I need to sign up?', a: 'No. They are free and need no account.' },
    ],
  },
};
