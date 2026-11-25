/**
 * "Common questions" and "Related sections" for the collection pages (src/content/hubs.ts), keyed by page path.
 * Written from the questions people type into search, in plain words. Each answer adds something the question does not
 * (the exact box to use, what to type, what to do when it fails) and links the tools it names with a marker such as
 * {split-pdf} (see src/lib/toolLinks.ts). Every answer must match what the tool really does and hold no tax, salary, exam,
 * medical or legal rules: where a rule matters, send the reader to the official notice.
 */
export interface HubFaq { q: string; a: string }
export interface HubFaqSet { faqs: HubFaq[]; related: string[] }

export const HUB_FAQS: Record<string, HubFaqSet> = {
  '/pdf-tools': {
    related: ['/photo-and-image-tools', '/jobs-and-business-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I take one page, or a few pages, out of a PDF?', a: 'Open {split-pdf}, choose the file and type the pages in the Pages to Extract box. Use commas for single pages and a dash for a range, for example 1, 4, 7 or 2-5, or mix them as 1-3, 5, 8. You save a new PDF with only those pages and the original is untouched. To keep most of a file and drop a few pages, {delete-pdf-pages} is quicker.' },
      { q: 'How do I cut a long scan into separate documents?', a: 'Use {smart-split-pdf}. It can split every N pages, at blank separator pages, at bookmarks, or by a largest file size, and it shows the list of parts before you download them all as one ZIP. Blank-page detection can miss a page with a stamp or shadow, so read the list first.' },
      { q: 'My PDF is too big to upload or email. What can I do?', a: 'Run it through {compress-pdf}, which shows the new size before you download so you can compare it with your form\'s limit. If it is still too big, remove pages you do not need with {delete-pdf-pages} or split it into parts under a size limit with {smart-split-pdf}.' },
      { q: 'How do I turn photos or phone pictures into one PDF?', a: '{image-to-pdf} joins JPG, PNG and WebP pictures into one file. If the pictures are photos of paper, {document-scanner} first cleans up shadows and trims each page, then saves one tidy PDF. Use {compress-pdf} afterwards if a portal limits the size.' },
      { q: 'How do I fill or sign a PDF without printing it?', a: '{fill-pdf} fills the form\'s own boxes when it has them and also lets you tap anywhere to add text, a tick or today\'s date. {sign-pdf} then places a drawn, typed or uploaded signature. A picture of a signature is not a certified digital signature, so check that the office accepts a plain signed copy.' },
      { q: 'How do I hide account numbers or names before sharing a PDF?', a: 'Use {redact-pdf}, which removes the covered text from the file so it cannot be copied out from under a black box. Then clear the author and date details stored inside the file with {sanitize-pdf}. If you only want a password on the file, use {protect-pdf}.' },
      { q: 'Are my PDFs uploaded anywhere?', a: 'No. Every tool here works in your browser on your own device, so your files are not sent to MyDailyUtils. The {page:why-trust-us|Why trust us} page shows how to check this yourself.' },
    ],
  },
  '/photo-and-image-tools': {
    related: ['/pdf-tools', '/jobs-and-business-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I make a photo or signature 20 KB, 50 KB or 100 KB?', a: 'Open {image-resizer}, choose the picture and press the 20, 50 or 100 KB button. It lowers the quality first and shrinks the picture in small steps only if that is not enough, then shows the new size and tells you if the limit cannot be reached. For another limit, type your own number of KB.' },
      { q: 'My form says only a passport size photo is accepted. What is wrong?', a: 'Forms check the size in KB and also the width and height in pixels, so a small file can still be too wide or too tall. Read the exact limits in your form\'s own notice, then set both the KB limit and the exact width and height in {image-resizer}. For a signature, use the Signature preset so the whole signature stays in the picture.' },
      { q: 'Can I make a file bigger, for example from 10 KB to 20 KB?', a: '{image-resizer} brings a file down to a maximum, so it does not pad a file to make it bigger. File size follows the number of pixels and the quality, so if a form wants a minimum size, start from a clearer picture with more pixels and check the size the tool shows.' },
      { q: 'How do I print passport photos at home?', a: '{passport-photo-sheet-maker} crops one photo and fills a 4x6, 5x7 or A4 sheet to print and cut. If a form wants a name and date under your photo, {photo-name-date-strip} adds it and keeps the JPG under the size you set.' },
      { q: 'How do I remove my location from a photo before I share it?', a: 'Open {remove-photo-location}. It shows what the photo gives away, such as the place, the phone model and the time, and saves a clean copy. For a screenshot with phone numbers or balances, {screenshot-redactor} blurs or blacks them out.' },
      { q: 'Are my photos uploaded anywhere?', a: 'No. Photos are read and changed on your own device in your browser, and nothing is sent to MyDailyUtils. To make many photos smaller at once, {bulk-image-tools} does the same work in one go, also on your device.' },
    ],
  },
  '/tax-and-salary-calculators': {
    related: ['/loan-and-investment-calculators', '/jobs-and-business-tools', '/everyday-tools'],
    faqs: [
      { q: 'How do I compare the old and the new tax regime?', a: 'Enter your income and deductions in {income-tax-calculator}. It shows the old and the new regime side by side for the year named on the tool, so you can see which gives the lower figure for your numbers. Tax rules change, so check the final amount on the official income tax website or with a qualified adviser.' },
      { q: 'How do I turn annual CTC into monthly in-hand salary?', a: 'Use {salary-calculator}. Enter your annual CTC, the basic salary as a percentage of it, the PF option, the tax regime and the professional tax, and it shows the monthly and yearly in-hand salary. Your own pay slip is the final word, because companies split pay in different ways.' },
      { q: 'What do I need to find the tax-exempt part of HRA?', a: '{hra-calculator} asks for monthly basic salary including DA, the HRA you receive, the rent you pay and whether you live in a metro city. Keep your rent receipts, and make one for every month with {rent-receipt-generator}. Ask your employer which proof they need.' },
      { q: 'How much gratuity might I get when I leave a job?', a: '{gratuity-calculator} asks for your last drawn monthly basic plus DA, your years of service and whether your employer is covered by the Payment of Gratuity Act. It is an estimate from those numbers, so check the rules that apply to you with your employer or HR.' },
      { q: 'How big might my provident fund be at retirement?', a: '{epf-calculator} asks for your current EPF balance, monthly basic plus DA, expected yearly pay rise, the interest rate and your retirement age. The rate can change, so type the value from your own statement or passbook.' },
      { q: 'Do these calculators keep what I enter?', a: 'No. The sums are done in your browser and your numbers are not sent to MyDailyUtils. If you also need GST on a price, {gst-calculator} adds or removes it and shows the CGST and SGST parts.' },
    ],
  },
  '/loan-and-investment-calculators': {
    related: ['/tax-and-salary-calculators', '/everyday-tools', '/jobs-and-business-tools'],
    faqs: [
      { q: 'What is the difference between an FD and an RD?', a: 'In a fixed deposit you put in one lump sum for a fixed time. In a recurring deposit you put in the same amount every month. Try both with the same rate and time in {fd-calculator} and {rd-calculator}, and read the {guide:rd-vs-fd-which-is-better|RD versus FD guide} to see which fits which need.' },
      { q: 'How do I work out my monthly loan EMI?', a: 'Open {emi-calculator} and enter the loan amount, the yearly interest rate and the time. It shows the monthly EMI and the repayment table, and shows how much interest you save if you pay extra money in. It works for a home, car or personal loan, because only the numbers change.' },
      { q: 'How might a monthly SIP grow?', a: '{sip-calculator} asks for the monthly investment, the expected yearly return and the time, with an optional yearly step-up, an inflation figure and a goal amount. It is an estimate for planning. Real returns are not fixed and can be lower than the number you type.' },
      { q: 'What is the difference between simple and compound interest?', a: 'Simple interest is worked out on the starting amount only. Compound interest is also worked out on the interest already added. {simple-compound-interest-calculator} puts both side by side for the same principal, rate and time, and lets you choose how often the interest compounds.' },
      { q: 'Which interest rate should I type in?', a: 'Use the rate from your bank, lender or scheme, because rates change. Every calculator here lets you type your own rate. For a long-term scheme, {ppf-calculator} projects the maturity value from your yearly deposit, the rate and the account period.' },
      { q: 'Are my loan or savings numbers stored?', a: 'No. Everything is worked out in your browser and nothing is sent to MyDailyUtils. For salary and tax on the same income, the {income-tax-calculator} compares the old and new regime.' },
    ],
  },
  '/everyday-tools': {
    related: ['/loan-and-investment-calculators', '/jobs-and-business-tools', '/student-and-writing-tools'],
    faqs: [
      { q: 'How do I split a bill between friends?', a: 'Open {bill-splitter}, enter the bill amount, the number of people and any tip or service charge, and it shows what each person pays. You can round each share up to a whole number, and it can also settle who pays whom after a group trip.' },
      { q: 'How do I add or remove GST from a price?', a: '{gst-calculator} adds GST to a price or takes it out and shows the CGST and SGST parts. Choose what you want to do, type the rate that applies to your goods or service, and read the price with and without GST.' },
      { q: 'How do I find exact age on a certain date?', a: '{age-calculator} gives age in years, months and days. Change the Age on field to the date a form asks about, such as the last date to apply, and it shows your age on that day.' },
      { q: 'How many days are there between two dates?', a: '{date-difference-calculator} shows the days, weeks and working days between two dates. It is useful for deadlines, notice periods and waiting times. For a job notice, {notice-period-calculator} finds the last working day.' },
      { q: 'How do I convert units such as area, weight or length?', a: '{unit-converter} handles length, weight, area, volume, speed, data and temperature. Pick the type, enter the number, and read the result in other units. For percentages and discounts, use {percentage-calculator}.' },
      { q: 'Do I need an account for any of these?', a: 'No. Every tool is free, with no sign-up, and works in your browser.' },
    ],
  },
  '/qr-and-sharing-tools': {
    related: ['/jobs-and-business-tools', '/printables-and-templates', '/photo-and-image-tools'],
    faqs: [
      { q: 'Do the QR codes I make expire?', a: 'No. {qr-code-generator} makes a normal QR code that holds your link or text, so there is no account, no subscription and no expiry date. The code works as long as the link inside it works, and you can save it as a PNG or SVG.' },
      { q: 'How do I make many QR codes at once?', a: 'Use {bulk-qr-code-generator}. Paste a list of labels and links, one on each line, and download all the codes as a ZIP of PNG or SVG files, or print a labelled sheet. It suits event passes, product labels and student IDs.' },
      { q: 'How do I put my contact details in a QR code?', a: '{vcard-qr-code-generator} makes a QR code that saves your contact details to a phone address book when someone scans it. To put the same code on a card, add it in {visiting-card-maker}.' },
      { q: 'Can I make a QR code for my Wi-Fi?', a: '{wifi-password-sign-printable} prints a sign with the network name, the password and a QR code that phones can scan to join. Only share it where you are happy for guests to join your network.' },
      { q: 'Is it safe to scan a QR code?', a: 'Check before you open it. {qr-code-scanner} reads a code from a photo, screenshot or camera and explains what it contains, such as a link or a payment request, and it never opens or pays by itself.' },
      { q: 'How do I send a document with a password?', a: 'Write a letter, notice or quote in {password-protected-document-maker}, lock it with a password and send one file. Share the password in a different message from the file.' },
    ],
  },
  '/printables-and-templates': {
    related: ['/kids-learning-tools', '/jobs-and-business-tools', '/student-and-writing-tools'],
    faqs: [
      { q: 'How do I print graph paper?', a: '{graph-paper-generator} prints graph paper with 2.5, 5 or 10 mm squares and darker major lines. For dot grid, lined, Cornell, isometric, music or tracker paper, use {printable-paper-maker}. Print at actual size so the squares stay the right size.' },
      { q: 'Can I make a cross stitch grid for my fabric?', a: '{cross-stitch-pattern-grid-generator} makes printable graph paper sized for your Aida count, so each square on the paper matches a stitch on the cloth.' },
      { q: 'How do I print flashcards that line up on both sides?', a: '{printable-flashcard-maker} prints every answer behind its question, as a two-sided sheet or a fold-over card. Print one page first and hold it to the light to check that the front and back match before printing the rest.' },
      { q: 'Can I change the wording on a template?', a: 'Yes. The notice, certificate, label and tracker templates have text you can edit, so you type your own names, dates and details before you print. For example, {restaurant-menu-card-printable} lets you add your own sections, prices and logo.' },
      { q: 'Are there worksheets for children?', a: '{math-worksheet-generator-printable} makes a maths worksheet with addition, subtraction, multiplication, division or mixed sums, with an answer page, and {bingo-card-generator-printable} makes bingo cards from your own words. See Kids learning tools for the on-screen lessons.' },
      { q: 'Do I need to sign up to print?', a: 'No. All printables are free, with no sign-up, and each page is made in your browser.' },
    ],
  },
  '/jobs-and-business-tools': {
    related: ['/tax-and-salary-calculators', '/pdf-tools', '/qr-and-sharing-tools'],
    faqs: [
      { q: 'How do I make a quotation for a customer?', a: 'Open {quotation-generator}, add your business details, the client, a title, an item list with prices, and any discount or tax, then press Print or save as PDF. A quotation is an offer of a price. When the customer agrees, make the bill with {gst-invoice-generator}. The {guide:how-to-make-a-quotation-for-a-customer|quotation guide} has the steps.' },
      { q: 'How do I make a rent receipt?', a: '{rent-receipt-generator} makes a receipt for every month in a range, with the amount in words, the landlord\'s PAN and a signature line. Print three to a page or save as PDF. Ask your employer which proof they need, and see {hra-calculator} to estimate the exempt part of HRA.' },
      { q: 'Can I make a visiting card for free?', a: '{visiting-card-maker} has 17 colour, gradient and plain designs. Add your details and a QR code, then download a PNG, a PDF with one card, or an A4 sheet of ten cards to print and cut. The {guide:how-to-make-a-visiting-card-and-print-it|visiting card guide} covers printing.' },
      { q: 'How do I work out my last working day?', a: '{notice-period-calculator} finds your last working day, the buyout cost and the gap before a new job. Enter the date you resign and the length of your notice, and add your new joining date to see the gap and what a buyout would cost.' },
      { q: 'How do I set a rate as a freelancer?', a: '{freelance-rate-calculator} finds the hourly, day and project rate you need to earn. Enter the income you need, your business costs and the share of hours you can bill, then quote with {quotation-generator}.' },
      { q: 'Is anything I type kept?', a: 'No. Your business details stay on your device and are not sent to MyDailyUtils.' },
    ],
  },
  '/student-and-writing-tools': {
    related: ['/kids-learning-tools', '/printables-and-templates', '/everyday-tools'],
    faqs: [
      { q: 'How do I make an MLA or APA citation?', a: 'Open {citation-generator}, choose the Citation style and the type of source, and fill in the details. It makes the citation and a sorted reference list in four styles. Check the result against your teacher\'s or journal\'s guide, because some courses add their own rules.' },
      { q: 'How do I show the same source in another style?', a: 'Change the Citation style box in {citation-generator} and the same details are written in the new style. Then copy the result. If details are missing, the tool lists them, because most styles expect them.' },
      { q: 'How do I count words or reading time?', a: '{word-counter} counts words, characters, sentences and reading time as you type or paste. Use it to check a limit on an essay or application.' },
      { q: 'Can I work out GPA, CGPA or percentage?', a: '{gpa-cgpa-calculator} works out GPA, CGPA, percentage and the grade you need next. Universities use different formulas, so check your own university\'s rule before you quote the result.' },
      { q: 'How do I plan my study time?', a: '{study-planner} turns your exam dates and the hours you need into a day-by-day study plan.' },
      { q: 'Is my writing saved anywhere?', a: 'No. Text stays in your browser and is not sent to MyDailyUtils.' },
    ],
  },
  '/kids-learning-tools': {
    related: ['/printables-and-templates', '/student-and-writing-tools', '/everyday-tools'],
    faqs: [
      { q: 'How can my child learn long multiplication?', a: '{long-multiplication-for-kids} shows the sum one digit at a time with every carry, then lets the child try it. Use the examples or type your own numbers.' },
      { q: 'What do carrying and borrowing mean?', a: 'Carrying is moving extra tens to the next column when a column adds up to ten or more. Borrowing is taking a ten from the next column when the top digit is too small to subtract from. {addition-with-carrying-for-kids} and {subtraction-with-borrowing-for-kids} show each step on screen.' },
      { q: 'Can my child learn to read a clock?', a: '{learn-the-clock} lets a child move the hands, with Hour and Minutes buttons, and practise times such as half past and quarter past.' },
      { q: 'Can my child practise money?', a: '{kids-money-shop} lets a child pay, count the change and run a small pretend shop. It is a good game to play at home.' },
      { q: 'Are there printed worksheets as well?', a: '{math-worksheet-generator-printable} makes a printable worksheet with addition, subtraction, multiplication, division or mixed sums, and an answer page.' },
      { q: 'Are the kids tools safe?', a: 'They run in your browser, with no sign-up and no account for the child. Nothing a child types is sent to MyDailyUtils.' },
    ],
  },
  '/sports-and-fitness-tools': {
    related: ['/printables-and-templates', '/everyday-tools', '/display-and-presentation-tools'],
    faqs: [
      { q: 'What is the size of a badminton court?', a: '{sports-court-size-guide} draws the court to scale in metres and feet, with a marking plan, how to play the sport and its playing rules. Court and ground sizes for 13 sports are on the same page. Each sport also has its own page, such as {page:badminton-court-size|badminton court size}, {page:tennis-court-size|tennis court size}, {page:basketball-court-size|basketball court size}, {page:volleyball-court-size|volleyball court size} and {page:football-pitch-size|football pitch size}. For an official event, check the size in the rules of your sports body.' },
      { q: 'What is the size of a kho kho ground?', a: 'A kho kho ground is 27 m by 16 m (88 ft 7 in by 52 ft 5.9 in). The {page:kho-kho-court-size|kho kho court size} page draws it to scale with the lane widths, pole height, a marking plan and the rules.' },
      { q: 'What is the size of a kabaddi court?', a: 'A men\'s kabaddi court is 13 m by 10 m, a women\'s court is 12 m by 8 m and a sub-junior court is 11 m by 8 m. The {page:kabaddi-court-size|kabaddi court size} page shows each one with the baulk and bonus lines and a marking plan.' },
      { q: 'How many matches are in a round robin or a knockout?', a: 'A round robin with n teams has n x (n - 1) ÷ 2 matches, so 15 for 6 teams, and a knockout has one match fewer than the number of teams. See the match lists for {page:round-robin-schedule-6-teams|6 teams}, {page:round-robin-schedule-8-teams|8 teams} and {page:knockout-bracket-8-teams|a knockout of 8 teams}, or use the {tournament-fixtures-maker}.' },
    { q: 'Can I check whether a court fits my space?', a: 'Yes. {sports-court-size-guide} includes a check of which courts fit the space you have. Enter its length and width and read which courts fit.' },
      { q: 'How do I mark a court on the ground?', a: 'Use the marking plan in {sports-court-size-guide} for the lengths to measure. Measure carefully and check the result against the rules of your sports body.' },
      { q: 'How do I score a cricket match ball by ball?', a: '{cricket-scorer} needs no setup. Tap the runs, a wicket, a wide or a no-ball for each ball and it shows the score, overs, run rate and partnership. Set overs and a target only if you want to.' },
      { q: 'Is there a simple scoreboard for basketball, football or kabaddi?', a: '{quick-scoreboard} has big +1, +2 and +3 buttons for each side, a foul counter for basketball, a game clock and undo, and can fill a big screen.' },
      { q: 'How do I keep the score of a badminton or tennis match?', a: '{match-score-keeper} has two big buttons for the two sides and follows the rules for games, sets, deuce and tie-breaks. It works for badminton, tennis, volleyball, table tennis, squash and pickleball, and saves the score on your device.' },
      { q: 'Can I make fixtures for a tournament?', a: '{tournament-fixtures-maker} makes round robin, home and away and knockout fixtures with byes, and builds a points table as you enter the scores.' },
      { q: 'How do I calculate net run rate in cricket?', a: '{cricket-run-rate-calculator} works out net run rate across matches, the required run rate in a chase, and batting and bowling averages. Enter overs the cricket way, such as 18.4.' },
      { q: 'How do I find my one-rep max or work out my running pace?', a: '{one-rep-max-and-plate-calculator} estimates your max from any set and lists the plates for the bar, and {running-pace-calculator} gives your pace, splits and race predictions.' },
      { q: 'Is there a scoreboard I can use at a match?', a: '{team-scoreboard-display} lets you add teams, tap to add points and show big scores on a projector or TV. Scores are saved on your device.' },
      { q: 'Can I print a winner certificate?', a: '{sports-winner-certificate-printable} makes a winner certificate with a name, wording, date and two signature lines, one page for each name.' },
      { q: 'Do these tools give health advice?', a: 'No. They measure, count and plan. For any health question, speak to a doctor or a qualified coach.' },
    ],
  },
  '/audio-and-video-tools': {
    related: ['/photo-and-image-tools', '/qr-and-sharing-tools', '/developer-and-data-tools'],
    faqs: [
      { q: 'How do I cut part of an audio file?', a: 'Open {audio-cutter-and-joiner}, choose the file, set the start and end of the part you want and save it. You can add fades at the start and the end.' },
      { q: 'Can I join two audio files into one?', a: 'Yes. Add the files in {audio-cutter-and-joiner} in the order you want and save one new file.' },
      { q: 'Can I make a ringtone?', a: 'Cut the part you like with {audio-cutter-and-joiner} and save it. Your phone decides which file types it accepts as a ringtone, so check that after saving.' },
      { q: 'What file does it save?', a: '{audio-cutter-and-joiner} saves WAV files. WAV files are bigger than MP3 files, but they keep the full quality of the audio.' },
      { q: 'How do I make a globe video from one place to another?', a: 'Open {globe-video-maker}, pick point A and point B (or start from a ready example such as a travel route, flight path or places visited video), choose a look and a video shape, and tap Make video. It records on your device with no watermark. A video takes as long as its length, so keep the page open. Ready-made pages: {page:travel-route-video-maker|travel route video}, {page:flight-path-animation-maker|flight path animation}, {page:moving-abroad-announcement-video|moving announcement}, {page:export-shipping-route-video-maker|shipping route video}, {page:globe-intro-video-maker|YouTube globe intro} and {page:countries-visited-map-video|countries visited video}.' },
      { q: 'How do I make a video of text being written by hand?', a: 'Open {handwriting-video-maker}, type up to six short lines, choose a font, a whiteboard, chalkboard or other background and the speed, and tap Make video. A pen writes each line in turn and can underline the title. It has no sound, so add music in your editing app. Nothing is uploaded.' },
      { q: 'How do I make an animated diagram video with my voice?', a: 'Open {sequence-diagram-video-maker} and type one step per line, such as Customer->Shop: Place order. Tap Record voice and tap through, speak, and tap Next step as you move on, so the picture follows your voice. Notes, boxes such as alt and loop, dotted arrows and delays are supported, and you can hide the arrows. Nothing is uploaded.' },
      { q: 'How do I make a simple explainer video with text and arrows?', a: 'Open {explainer-video-maker} and type short lines such as left: Factory, arrow: ships the goods and right: Port. Each line slides in as one step, and a line that says slide starts a new slide. Add bullets, a big word or number and your own pictures, then make the video with or without your voice. Nothing is uploaded.' },
      { q: 'How do I make a video of countries I visited on a map?', a: 'Open {region-map-video-maker} and type one country per line, such as India, then France, Italy, Spain: Europe trip. Each place lights up as the map flies to it, with a card for its name. Add pin: Mumbai for a big city, a world line to zoom out, and your voice if you like. It draws countries only, not states. Nothing is uploaded.' },
      { q: 'How do I get automatic captions for my voice for free?', a: 'Open {speak-to-captions-video-maker}, choose your language, press Start speaking and talk. Your words appear as you speak. Fix any word, choose how many words show at a time, then save an SRT file for CapCut or YouTube, or make a captions video. Your browser does the listening, so in Chrome and Edge your voice goes to Google or Microsoft for that. If you want nothing sent anywhere, use {tap-to-time-captions} and type the words yourself.' },
      { q: 'How do I make a video smaller for WhatsApp or email for free?', a: 'Open {video-compressor-and-trimmer}, add your video, and cut it with Start here and End here if you only need part of it. Pick the WhatsApp or Email starter, or choose your own size limit and picture size under More options, then tap Make smaller video and save the MP4. The video is made on your device, so nothing is uploaded and there is no watermark.' },
      { q: 'How do I add an SRT subtitle file to a video for free?', a: 'Open {burn-subtitles-into-video}, add your video, then add your SRT or WebVTT file or paste the text. Pick a look, check the preview, and tap Make video with captions. The words are drawn onto the picture so they show in every app. Nothing is uploaded and there is no watermark. You can make a subtitle file with {tap-to-time-captions} or {speak-to-captions-video-maker}.' },
      { q: 'How do I remove background noise from a voice note for free?', a: 'Open {voice-noise-remover}, add your voice note or video, or record now, and pick the Voice note starter. Tap Clean up audio, then play the original and the cleaned sound to compare. Choose Strong for a fan or hum, or Light if the voice sounds thin, and save a WAV or a small file. The sound stays on your device, with no watermark.' },
      { q: 'How do I remove a white background from a picture for free?', a: 'Open {background-remover}, add your picture and pick a starter such as Product on white or Signature or logo. Adjust How much to remove until the background is gone, tap the background if the wrong colour was found, then save a transparent PNG. It matches colours, so it works best on plain backgrounds. Nothing is uploaded and there is no watermark.' },
      { q: 'How do I make an app or website demo video without screen recording?', a: 'Open {app-demo-video-maker}, add screenshots in the order you want to show them, and choose a phone or laptop frame. Tap the small picture to place a tap circle, arrow or box, turn on zoom, and hide private details if needed. Write a short sentence for each screen, then tap Make video. Long pages scroll by themselves. Nothing is uploaded.' },
      { q: 'How do I turn an audio file into a video for Instagram or YouTube?', a: 'Open {audio-clip-video-maker}, add your voice note, podcast clip or song, write a title, and add a cover picture if you like. Choose bars, a wave or a circle that moves to the sound, then tap Make video and save the MP4. Instagram, YouTube and Facebook accept the video. Nothing is uploaded.' },
      { q: 'How do I make an SRT subtitle file for my video or audio?', a: 'Open {tap-to-time-captions}, paste your captions with one short line for each caption, add your audio or video file and press Start. Tap the big button each time a new line begins. Then save the SRT or WebVTT file and import it in CapCut, YouTube or Instagram Edits. You type the words, so Hindi and mixed languages are always right, and nothing is uploaded.' },
      { q: 'How do I turn my photos into a video with captions?', a: 'Open {photo-story-video-maker}, tap Add photos and choose up to 10, or begin with a quick starter such as Trip story or Birthday tribute. Type a few words under each photo, add a title card and an end card if you like, pick a look, and tap Make video. Each photo moves slowly and you can add your voice by tapping through. Nothing is uploaded.' },
      { q: 'How do I make an animated bar chart or pie chart video?', a: 'Open {chart-reveal-video-maker}, pick Bars, Line, Pie, Donut or Race, and type one line for each step, such as Jan: 40. Each line grows a bar, draws a point or fills a slice, and a note after a bar sign shows on a card. Choose a look, a highlight for the end and how big numbers are written, then make the video with or without your voice. Nothing is uploaded.' },
      { q: 'Is my audio uploaded?', a: 'No. The audio is cut in your browser and nothing is uploaded to MyDailyUtils.' },
    ],
  },
  '/developer-and-data-tools': {
    related: ['/everyday-tools', '/student-and-writing-tools', '/pdf-tools'],
    faqs: [
      { q: 'How do I view a large JSON file?', a: '{json-viewer} shows the data as a tree, a table or text, with search and a copy of the path to any value. Large files are shown in parts so the page stays quick.' },
      { q: 'Can I turn JSON into CSV for Excel?', a: '{json-to-csv-converter} turns a list of records into rows and columns that Excel and Google Sheets open. Nested values are flattened into extra columns, such as address.city, unless you turn that off.' },
      { q: 'Can I format or check JSON?', a: '{json-formatter} formats, checks and shrinks JSON. To read a big file, use {json-viewer} instead.' },
      { q: 'Is my data sent to a server?', a: 'No. The data is processed in your browser, so you can use these tools on private files. The {page:why-trust-us|Why trust us} page shows how to check this.' },
      { q: 'Do I need to create an account?', a: 'No. There is no sign-up and no usage limit.' },
    ],
  },
  '/display-and-presentation-tools': {
    related: ['/sports-and-fitness-tools', '/kids-learning-tools', '/jobs-and-business-tools'],
    faqs: [
      { q: 'How do I show a menu on a TV?', a: '{menu-board-display} loops your items and prices full screen on any TV or monitor. Add items, group them in sections, then open full screen.' },
      { q: 'How do I show notices or birthday wishes on a screen?', a: '{notice-board-display} rotates welcome messages, birthday wishes, notices and reminders with colours and pictures on any screen.' },
      { q: 'Can I run a scoreboard for a quiz or sports day?', a: '{team-scoreboard-display} lets you add teams, tap to add points and show big scores on a projector or TV. Scores are saved on your device.' },
      { q: 'Does it need internet while it is showing?', a: 'The page must load once. After that, keep the tab open. For an important event, test it on the same screen first.' },
      { q: 'Is anything uploaded?', a: 'No. What you add is kept on your device and is not sent to MyDailyUtils.' },
    ],
  },
};
