/**
 * Extra sections for the shorter how-to guides: worked examples, common mistakes and what to check. They are added to
 * each guide before its last section (usually limits or privacy) in guides.ts, so the original wording stays where it
 * was and this file can be reviewed on its own. Plain data, English only.
 *
 * Rules: every number in an example must be worked out correctly; say nothing about a tool that its own page does not
 * already say; no tax, salary, medical or legal facts beyond what the guide already states, and point people to the
 * official source where a rule applies.
 */
import type { GuideSection } from './guides';

export const GUIDE_DEPTH: Record<string, GuideSection[]> = {
  'how-to-calculate-percentages-and-discounts': [
    { heading: 'Working backwards from a price', paragraphs: [
      'Shops and bills often give you the final figure and leave you to find the original. If a price of ₹1,180 includes 18% tax, the price before tax is 1,180 ÷ 1.18 = ₹1,000, not 1,180 minus 18% (which gives ₹967.60 and is wrong). The same idea works for discounts: if you paid ₹1,749.30 after 30% off, the original was 1,749.30 ÷ 0.70 = ₹2,499.',
      'The rule is to divide by (1 + rate) to remove something that was added, and by (1 − rate) to undo something that was taken off.',
    ] },
    { heading: 'Percent and percentage points', paragraphs: [
      'If a loan rate goes from 8% to 10%, it has risen by 2 percentage points, but by 25% of the old rate. News reports and offers sometimes mix the two up, so check which one is meant before comparing.',
      'Marks work the same way. Moving from 60% to 66% is 6 percentage points, which is a 10% improvement on your earlier score.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Adding percentages that apply one after another, as with two discounts or a discount then tax. Taking a percentage of the wrong base, for example working out a fall from the new price instead of the old one. Rounding in the middle of a sum: keep full figures until the last step, then round once.',
    ] },
  ],

  'how-to-convert-images-to-pdf': [
    { heading: 'A quick example', paragraphs: [
      'Say a form asks for your five-page rent agreement as one PDF under 2 MB. A phone photo is often 3 to 5 MB, so five photos straight from the camera can make a PDF of 15 MB or more. Shrink each photo to roughly 200 to 300 KB with Image Compressor first, then build the PDF. Five pages then come to about 1 to 1.5 MB, which fits the limit with room to spare.',
    ] },
    { heading: 'Taking photos that read well as pages', paragraphs: [
      'Lay the page on a dark, plain surface so its edges stand out, and hold the phone straight above it rather than at an angle. Use daylight from a window instead of the flash, which leaves a bright patch in the middle. Fill the frame with the page and keep your fingers off it.',
      'Name the photos in order (01, 02, 03 …) before you start. Adding them in the right order is easier than fixing the order afterwards.',
    ] },
    { heading: 'Choosing the page size', paragraphs: [
      'Pick A4 portrait for documents that will be printed or uploaded to Indian government and bank portals, which usually expect A4. Pick a page that fits each image when the pictures are of different shapes, such as receipts of different lengths, so nothing gets squeezed or cut. A small margin makes printed pages look neater; no margin keeps the most detail on screen.',
    ] },
  ],

  'how-to-write-an-amount-in-words-on-a-cheque': [
    { heading: 'Worked examples', paragraphs: [
      '₹1,05,000 is written "One Lakh Five Thousand Rupees Only". ₹10,50,750.50 is "Ten Lakh Fifty Thousand Seven Hundred Fifty Rupees and Fifty Paise Only". ₹2,00,00,000 is "Two Crore Rupees Only".',
      'Watch the zeros. ₹1,00,500 is "One Lakh Five Hundred", not "One Lakh Fifty Thousand". Reading the figure aloud in lakh and thousand groups before you write it catches most slips.',
    ] },
    { heading: 'Filling in the cheque itself', paragraphs: [
      'Start the words right at the beginning of the line so nothing can be added in front, and draw a line through any space left after "Only". Write the figure close to the ₹ sign in the box, with no gap. Use one pen and do not overwrite or correct anything; banks commonly refuse a cheque with alterations, so tear it up and write a fresh one.',
      'Check the date, the name of the person being paid and your signature as well. A cheque with the amount right but the date missing will still come back.',
    ] },
    { heading: 'Spelling', paragraphs: [
      'Both "Lakh" and "Lac" are seen, but "Lakh" is the usual spelling. Whichever you use, be consistent within the cheque. The words do not need to be in capitals, though many people use capitals to make them harder to change.',
    ] },
  ],

  'how-to-split-a-pdf': [
    { heading: 'Writing the page list', paragraphs: [
      'Ranges use a dash and separate items use a comma, so "1-3, 7" means pages 1, 2, 3 and 7. "5-12" keeps the middle of a document. Count pages as the PDF viewer numbers them, from the first page of the file, not by the numbers printed on the pages, which often start later because of a cover or index.',
    ] },
    { heading: 'Everyday situations', paragraphs: [
      'Sending only the signed page of an agreement to someone who does not need the rest. Uploading one semester\'s mark sheet from a scan of all of them. Keeping the first two pages of a bank statement that show the account details. Removing your salary slip from a set of documents before sharing it with a landlord.',
      'If a portal has a size limit per file but accepts several files, splitting a large scan into two or three parts is often easier than trying to compress it.',
    ] },
    { heading: 'Check before you send', paragraphs: [
      'Open the new file and scroll through every page. Check that the page you need is complete, that nothing private was left in, and that the file name tells the reader what it is, for example "Agreement-signed-page.pdf" rather than "split.pdf".',
    ] },
  ],

  'how-to-convert-pdf-to-images': [
    { heading: 'When a picture is better than a PDF', paragraphs: [
      'To show one page in a chat, where an image opens straight away and a PDF needs a tap and a viewer. To put a page into a presentation or a document as a picture. For forms that ask for an image upload (JPG or PNG) of a certificate you only have as a PDF. For a quick look at a page on a phone that has no PDF app.',
    ] },
    { heading: 'PNG, JPG or WebP', paragraphs: [
      'PNG keeps text and lines crisp and is a good first choice for documents, but files are larger. JPG is smaller and fine for pages that are mostly photos; at low quality, text edges can look smudged. WebP is small and sharp but some older apps and portals do not accept it, so check what the form lists before you choose it.',
      'If a portal wants a JPG under, say, 200 KB, convert the PNG with Image Converter and then bring it under the limit with Image Compressor.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Expecting to edit the text afterwards; a page image is a picture, so use Extract Text from PDF if you need the words. Sending every page of a long PDF as pictures when one PDF would be easier to read. Forgetting that a page image shows everything on that page, so look for private details before sharing.',
    ] },
  ],

  'how-to-make-a-gif-from-photos-with-no-watermark': [
    { heading: 'Picking the timing', paragraphs: [
      'For a slideshow of photos, one to two seconds per picture lets people take each one in. For a before-and-after, two pictures at about a second each make a clear flip. For a simple step-by-step animation, shorter times such as a third of a second give a smoother effect, but you need more pictures for it to look like motion.',
      'A GIF that loops is good for a post or a chat. Turn looping off for a sequence that should end on the last picture, such as a reveal.',
    ] },
    { heading: 'A size example', paragraphs: [
      'Ten photos at 1,080 pixels wide can easily come to several megabytes as a GIF. The same ten at 480 pixels wide are usually a fraction of that and still look good on a phone screen, which is where most GIFs are watched. Start small and go up only if the result looks too soft.',
    ] },
    { heading: 'Before you start', paragraphs: [
      'Use photos of the same shape, all portrait or all landscape, since the first picture sets the shape and others are fitted inside it. Crop and straighten them first. Keep the number of pictures to what tells the story; ten good frames beat thirty similar ones.',
    ] },
  ],

  'understanding-bmi-what-it-is-and-its-limits': [
    { heading: 'Worked examples', paragraphs: [
      'Height 1.65 m and weight 65 kg: 1.65 × 1.65 = 2.7225, and 65 ÷ 2.7225 = 23.9. On the WHO scale that is in the normal range; on the Asian cut-offs it is in the overweight band. This is why the calculator lets you choose the scale, and why the same number can be read two ways.',
      'For a height of 1.70 m, a BMI between 18.5 and 24.9 works out to a weight between about 53.5 kg and 72 kg (2.89 × 18.5 and 2.89 × 24.9).',
    ] },
    { heading: 'Measuring well', paragraphs: [
      'Weigh yourself at the same time of day, ideally in the morning, in light clothes. Measure height without shoes, standing against a wall. Small errors matter: being 2 cm off in height moves the BMI by about half a point for an average adult.',
    ] },
    { heading: 'Numbers that add to BMI', paragraphs: [
      'Because BMI ignores where fat sits, many doctors also look at waist size, since fat around the middle is linked with higher health risk. Track the trend over months rather than one reading. Ask a doctor which measures matter for you, especially if you are older, pregnant, very muscular or managing a health condition.',
    ] },
  ],

  'how-to-password-protect-a-pdf': [
    { heading: 'Sharing the password safely', paragraphs: [
      'The protection is only as good as how you share the password. Send the file by email and the password by phone call or a different chat app, so one leaked message is not enough. Avoid passwords that are easy to guess from public information, such as a date of birth or a phone number.',
    ] },
    { heading: 'Common situations', paragraphs: [
      'Sending ID copies or salary slips to a rental agent or an employer. Emailing a medical report to a family member. Sharing tax papers with an accountant. In each case, ask whether the person can open password-protected files on their device before you send, and tell them which app to use if they are not sure.',
    ] },
    { heading: 'Open password and owner password', paragraphs: [
      'The open password is needed to see the file at all. The owner password and permissions, such as no printing, only ask viewer apps to behave; some apps ignore them. If the content must stay private, rely on the open password and share the file only with people who need it.',
    ] },
  ],

  'how-to-run-a-secret-santa-draw-on-one-phone': [
    { heading: 'Setting it up fairly', paragraphs: [
      'Agree the gift budget and the exchange date before the draw, and say them out loud so nobody is surprised later. Add banned pairs for couples, close family members or people who already exchange gifts. With very many banned pairs in a small group, a valid draw can become impossible; the tool will say so, and you can remove a pair or two.',
    ] },
    { heading: 'Passing the phone', paragraphs: [
      'Turn the screen brightness down a little and ask each person to step aside to read their name. Once they have seen it, they hide the result before handing the phone on. If someone misses their turn, they can still open their own name later, but only once.',
    ] },
    { heading: 'Ideas that keep it fun', paragraphs: [
      'Ask everyone to write a short wish list or a "no thank you" list, such as no sweets, so gifts are useful. For an office group, keep the budget small and the gifts suitable for work. For a family, a theme such as "something handmade" or "a book you loved" makes the exchange more personal.',
    ] },
  ],

  'how-inflation-reduces-the-value-of-savings': [
    { heading: 'A longer example', paragraphs: [
      'At 6% a year, prices roughly double in 12 years and more than triple in 20 (1.06 raised to 20 is about 3.21). So a goal that costs ₹10 lakh today, such as a college course, may need about ₹32 lakh in 20 years. Planning with today\'s figure would leave a large gap.',
      'A quick check is the rule of 72: divide 72 by the inflation rate to get the years it takes prices to double. At 6% that is 12 years; at 8% it is 9.',
    ] },
    { heading: 'Real return', paragraphs: [
      'What matters is how much faster your money grows than prices. If a deposit earns 7% and inflation is 6%, the real gain is only about 1% a year (1.07 ÷ 1.06 − 1 = 0.94%), and less after any tax on the interest. If the deposit earns 5% while prices rise 6%, you are slowly losing buying power even though the balance keeps rising.',
    ] },
    { heading: 'Using the numbers', paragraphs: [
      'Work out each big goal in future rupees, then check whether your saving plan reaches that figure. Revisit the numbers once a year with an updated rate. The calculators show estimates, not promises; actual inflation and returns will differ.',
    ] },
  ],

  'how-to-make-fair-random-teams-and-draws': [
    { heading: 'Balancing skill as well as chance', paragraphs: [
      'Pure chance can put the three strongest players together. If that matters, pick captains first, or split the group into strong and less experienced lists, make teams from each list separately, and combine them. The draw is still random within each list, so nobody can say a team was hand-picked.',
    ] },
    { heading: 'Running a public draw', paragraphs: [
      'Share the full list of names before you pick, so people can check they are in it. Put the screen where everyone can see it, or share it on a projector. Copy the result into the group chat straight away. If you need to draw again, say why first, such as someone who was absent being included by mistake.',
    ] },
    { heading: 'Everyday uses', paragraphs: [
      'Groups for a class project or a sports period. The order of presentations or interviews. Seat or table allocation at an event. Who goes first in a game. Choosing winners for a small contest among entries that met the rules.',
    ] },
  ],

  'how-to-calculate-in-hand-salary-from-ctc': [
    { heading: 'A worked example', paragraphs: [
      'Take a CTC of ₹10,00,000 a year with basic pay at 40%, which is ₹4,00,000. If PF is worked out on the full basic, the employer\'s 12% is ₹48,000, so the gross salary is ₹9,52,000. Your own 12% PF of ₹48,000 comes out of gross, then professional tax and income tax. What remains, divided by 12, is your monthly in-hand pay.',
      'If your employer uses the ₹15,000 monthly wage ceiling instead, each side\'s PF is 12% of ₹15,000 × 12 = ₹21,600 a year, which leaves noticeably more in hand. That is why two offers with the same CTC can pay differently each month.',
    ] },
    { heading: 'Questions to ask about an offer', paragraphs: [
      'How much of the CTC is fixed and how much is variable, and how is the variable part decided? Is PF on the full basic or on the ceiling? Is gratuity or insurance included in the CTC figure? Are there joining or retention bonuses that are one-time only? The answers change the monthly figure more than small differences in the headline CTC.',
    ] },
  ],

  'how-to-merge-pdf-files': [
    { heading: 'Getting the order right', paragraphs: [
      'Put documents in the order the reader expects. For a job or loan application that is usually the application form first, then identity proof, address proof, education or income documents, and anything else last. Many forms list the order they want; follow it exactly, because checkers often go page by page.',
      'Renaming the files with numbers at the front (1-form, 2-aadhaar, 3-pan …) makes the order obvious in the list.',
    ] },
    { heading: 'Size limits', paragraphs: [
      'Merging adds the sizes together, so three 1 MB scans make roughly a 3 MB file. If the portal limit is smaller, reduce the scans before merging, or upload documents separately if the portal allows it. Check the final size shown before you upload.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'A page in the wrong direction (rotate it first with Rotate PDF or Organize PDF), a duplicate page from scanning twice, or a blank back side from a two-sided scan. Flick through the merged file once from start to end; it takes a minute and saves a rejection.',
    ] },
  ],

  'what-is-cagr-and-how-to-use-it': [
    { heading: 'Why CAGR is not the average return', paragraphs: [
      'If an investment rises 50% one year and falls 50% the next, the simple average is 0%, but ₹1,00,000 becomes ₹1,50,000 and then ₹75,000. The CAGR over the two years is about −13.4%, which is what actually happened to your money. CAGR describes the real path from start to end; an average of yearly returns can flatter a bumpy investment.',
    ] },
    { heading: 'Quick checks with the rule of 72', paragraphs: [
      'Dividing 72 by the CAGR gives roughly the years it takes money to double. At 12% that is about 6 years; at 8% about 9. If someone shows a fund that turned ₹1 lakh into ₹4 lakh in 12 years, that is two doublings in 12 years, so about 12% a year, which you can confirm with the calculator.',
    ] },
    { heading: 'Comparing fairly', paragraphs: [
      'Compare CAGRs over the same years, because a period that starts at a market low looks much better than one that starts at a high. Compare after costs and tax where you can. A higher CAGR that came with large falls along the way may not suit money you will need soon.',
    ] },
  ],

  'how-to-create-a-strong-password': [
    { heading: 'Passphrases you can remember', paragraphs: [
      'For the few passwords you must type from memory, such as the password manager itself, a passphrase of four or five unrelated words is both strong and easier to recall than a jumble of symbols. Pick the words at random rather than a quote or a song line, and add a number or symbol if the site insists.',
    ] },
    { heading: 'Signs a password needs changing', paragraphs: [
      'You used it on more than one site. A site you use reported a data breach. You shared it with someone, wrote it on paper in a shared place, or typed it on a shared computer. You get a login alert you did not expect. In each case, change it on that site and anywhere else you used the same password.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Adding "123" or the year to an old password. Using names of family or pets, which are easy to find online. Saving passwords in a notes app or a photo. Answering security questions truthfully when the answers are public; treat them like extra passwords and store the answers in your password manager.',
    ] },
  ],

  'how-to-make-a-pdf-smaller': [
    { heading: 'Typical size limits and what fits', paragraphs: [
      'Many forms allow somewhere between 200 KB and 2 MB per file. A clear one-page scan at a sensible resolution is often 100 to 300 KB as a JPG-based PDF, so a short document can fit even the smaller limits. Ten pages straight from a phone camera will not, and need the images shrunk first.',
    ] },
    { heading: 'Settings that make the most difference', paragraphs: [
      'Width matters most: a page image about 1,200 to 1,600 pixels wide is enough to read printed text on screen. Quality next: for documents, a JPG quality around 60 to 75 usually stays readable while cutting size a lot. Colour last: a black-and-white document scanned in colour carries data you do not need.',
    ] },
    { heading: 'What to avoid', paragraphs: [
      'Shrinking so far that small print, stamps or signatures blur; officials may reject a page they cannot read. Compressing the same file again and again, which adds blur each time; always start again from the original. Cutting pages a form asked for just to fit a size limit.',
    ] },
  ],

  'how-to-calculate-age-for-exam-and-job-forms': [
    { heading: 'Worked example with a range', paragraphs: [
      'Suppose a recruitment asks for an age between 21 and 30 years as on 1 August 2027. Someone born on 2 August 1997 is 29 years, 11 months and 30 days old on that date, so they are within the limit. Someone born on 1 August 1997 turns 30 exactly on the cut-off day. Whether "up to 30" includes that day depends on the wording in the notification, so read it carefully, and contact the recruiting body if it is not clear.',
    ] },
    { heading: 'Born-after and born-before dates', paragraphs: [
      'Many notifications give the limit as dates instead of ages, for example "born not earlier than 2 August 1997 and not later than 1 August 2006". That avoids counting altogether: simply check that your date of birth falls between the two dates. If both an age and dates are given, the dates are usually the clearest test.',
    ] },
    { heading: 'Your documents must agree', paragraphs: [
      'Use the date of birth exactly as it appears on the document the form asks for, usually a school certificate. If your documents show different dates, sort that out before applying, because a mismatch can lead to rejection at verification even if the age looks right.',
    ] },
  ],

  'how-to-calculate-gst': [
    { heading: 'More worked examples', paragraphs: [
      'Adding 5% to ₹2,400 gives ₹120 of GST and a total of ₹2,520. Removing 5% from a total of ₹1,050 gives a base of 1,050 ÷ 1.05 = ₹1,000 and GST of ₹50.',
      'For a sale within one state, ₹180 of GST at 18% shows on the bill as CGST ₹90 and SGST ₹90, each at 9%. For the same sale to a buyer in another state, it shows as IGST ₹180 at 18%. The total the buyer pays is the same either way.',
    ] },
    { heading: 'Bills with several items', paragraphs: [
      'When items carry different rates, work out GST line by line and add the totals, rather than applying one rate to the whole bill. Discounts given on the bill before tax reduce the taxable value; check how your invoice shows them so the tax is worked out on the right amount.',
      'Round at the end of each line or at the end of the bill in the same way every time, so totals on your copy and the customer\'s copy match.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Taking 18% off a price that already includes GST. Charging CGST and SGST on a sale to another state. Using an old rate after a change. When in doubt about the rate or the place of supply, check the official GST portal or ask your accountant before issuing the bill.',
    ] },
  ],

  'how-sip-works-and-how-to-estimate-returns': [
    { heading: 'A worked example', paragraphs: [
      'Investing ₹5,000 a month for 10 years puts in ₹6 lakh. If you assume 12% a year, the SIP Calculator\'s method gives roughly ₹11.6 lakh at the end. Keep the same ₹5,000 going for 20 years and you put in ₹12 lakh, but the estimate is close to ₹50 lakh, because the early instalments have much longer to grow.',
      'That gap is the main lesson of a SIP: time in the plan matters more than the exact monthly amount. These figures are estimates with an assumed rate, not a promise.',
    ] },
    { heading: 'Step-up in practice', paragraphs: [
      'Raising the instalment a little each year, for example in line with a salary increase, often adds more to the final value than starting with a bigger amount and leaving it fixed. Try a 5% or 10% yearly step-up in the calculator and compare the totals side by side.',
    ] },
    { heading: 'Habits that help', paragraphs: [
      'Set the SIP date a few days after your salary arrives so the money is there. Treat a fall in the market as a time when your fixed amount buys more units, not as a reason to stop. Review once a year rather than every week, and match the fund to how soon you will need the money.',
    ] },
  ],

  'how-to-print-certificates-name-tags-and-id-cards': [
    { heading: 'Paper and printer settings', paragraphs: [
      'For certificates, thicker paper or card in the 170 to 300 gsm range feels more official than office paper; check that your printer can feed it, often from the rear tray. Choose the highest print quality in the printer settings and turn off "fit to page" so sizes stay as designed. For sticker sheets, set the paper type to labels if your printer has that option.',
    ] },
    { heading: 'Avoiding the usual slip-ups', paragraphs: [
      'Check the spelling of every name before printing; ask people how they write their names rather than guessing. Keep the same date and the same signatory on a whole set. Print one sheet first and hold it up to the light against a second sheet to check alignment before printing a full batch.',
      'For a whole class or event with one certificate per name, the Bulk Certificate Maker builds every certificate from a list in one go.',
    ] },
    { heading: 'ID cards that last', paragraphs: [
      'Use a recent passport photo with a plain background, trim it to the photo box, and glue it flat at the edges as well as the middle. Lamination pouches protect cards from sweat and rain; leave a small border of laminate around the card when you cut it so it does not peel.',
    ] },
  ],

  'how-to-make-a-upi-scan-and-pay-stand-for-your-shop': [
    { heading: 'Check every payment on your own phone', paragraphs: [
      'A common trick is to show a fake "payment successful" screen or a screenshot. Always confirm the money in your own UPI app or bank alert, or on a payment speaker if you use one, before handing over goods. Do not rely on the customer\'s screen.',
    ] },
    { heading: 'Placing the stand', paragraphs: [
      'Put the stand at the counter where the customer stands, at about chest height, with good light on it and no glare from a tube light. A code about the size of a palm or larger scans easily from an arm\'s length. Laminate it or keep it in a plastic stand so it stays flat and clean.',
    ] },
    { heading: 'When to use a fixed amount', paragraphs: [
      'A fixed amount suits a stall that sells one thing at one price, such as a parking fee or a set meal. For a normal shop, leave the amount blank so each customer types their own bill amount. If prices change often, a blank amount saves reprinting.',
    ] },
  ],

  'how-to-resize-one-image-for-instagram-whatsapp-and-youtube': [
    { heading: 'Common shapes at a glance', paragraphs: [
      'A square post is often 1,080 × 1,080 pixels. A story or reel cover is tall, commonly 1,080 × 1,920 (9:16). A video thumbnail is wide, commonly 1,280 × 720 (16:9). A banner is very wide and short, and the edges are often hidden on phones, so keep text in the middle. These are common sizes, not rules; each app can change what it asks for.',
    ] },
    { heading: 'Plan the picture for every shape', paragraphs: [
      'If one photo must work as a square, a tall story and a wide thumbnail, take or choose a picture with space around the subject. A tight close-up loses heads or hands when cropped to a wide shape. Text placed near the centre survives every crop; text near the edges usually gets cut.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Stretching a picture to fit a new shape, which makes faces look wide or thin. Uploading a small picture that the app then enlarges and blurs. Putting important text where the app shows buttons or a profile picture over the image. Check each size on your own phone after posting.',
    ] },
  ],

  'how-to-make-a-whatsapp-link-and-qr-code': [
    { heading: 'What the link looks like', paragraphs: [
      'For an Indian number, the link uses the country code 91 followed by the ten-digit number, with no plus sign, spaces or leading zero, for example wa.me/919876543210. A first message is added to the end of the link in a coded form, so spaces become %20; the tool does this for you, which is why it is easier than typing the link by hand.',
    ] },
    { heading: 'Good first messages', paragraphs: [
      'Write the message the customer would want to send, so they only press send. For a shop: "Hi, I would like to know today\'s price for …". For a clinic: "Hello, I would like to book an appointment." For a tutor: "Hi, I am asking about classes for class 8." Keep it short and polite, and avoid anything that looks like an advert.',
    ] },
    { heading: 'Printing the QR code', paragraphs: [
      'Print the code large enough to scan from where people stand; on a counter, about 4 to 5 cm across is a sensible minimum, and larger for a wall poster. Keep a white border around it and do not place it on a busy background. Write a short line under it, such as "Scan to chat on WhatsApp", so people know what it does.',
    ] },
  ],

  'how-to-compare-two-versions-of-a-document': [
    { heading: 'What to look for first', paragraphs: [
      'In an agreement: amounts, dates, notice periods, who pays for what, and any new clause about penalties or renewal. In a quote: quantities, unit prices, tax, delivery dates and validity. In a draft you wrote: sentences that were removed, not only those that were added, because removals are easy to miss when reading the new version alone.',
    ] },
    { heading: 'Choosing lines or words', paragraphs: [
      'Whole lines are clearest when someone has rewritten or moved sentences, since each changed line shows as one block. Word by word is best for spotting one changed figure in a long paragraph, such as ₹15,000 becoming ₹18,000 or 30 days becoming 60. If the result looks cluttered, switch to the other mode.',
    ] },
    { heading: 'After you find a change', paragraphs: [
      'Write down each change you do not agree with and raise it before signing or accepting. Keep both versions with clear file names, such as "Agreement-v1-received-12-Oct.pdf" and "Agreement-v2-received-20-Oct.pdf", so you can show later which version you agreed to.',
    ] },
  ],

  'how-to-check-a-tool-keeps-your-files-private': [
    { heading: 'The network check, step by step', paragraphs: [
      'In Chrome or Edge on a computer: open the tool, press F12, choose the Network tab and press the clear button (a circle with a line). Tick "Preserve log". Now choose your file and run the tool. Sort the list by size. A tool that uploads your file shows a request roughly as large as the file going out, usually a POST or PUT. If the largest requests are scripts, fonts and ads coming in, the file stayed on your device.',
    ] },
    { heading: 'The offline check', paragraphs: [
      'Load the tool page fully, then turn off Wi-Fi and mobile data, or in the developer tools set the network to "Offline". Choose a file and run the tool. If it still produces a result, the work was done on your device. A tool that needs a server will show an error instead.',
    ] },
    { heading: 'Reading a privacy policy', paragraphs: [
      'Look for plain answers to three questions: are files uploaded, how long are they kept, and who else receives data such as advertising partners. Vague wording like "files are deleted after some time" means they are uploaded. MyDailyUtils\' Privacy Policy says what runs on your device and what the page still loads from the network.',
    ] },
  ],

  'how-to-add-a-name-and-date-to-a-photo-for-forms': [
    { heading: 'Matching the form\'s instructions', paragraphs: [
      'Read three things in the notice before you start: the date format (for example DD-MM-YYYY or DD/MM/YYYY), whether the name must be in capitals, and the photo and file size limits. Type the name exactly as on your application, including initials. Use the date the photo was taken if the form asks for that, not today\'s date.',
    ] },
    { heading: 'A clear strip', paragraphs: [
      'White strips with black text are the most common and print cleanly. Keep the strip tall enough that the text is easy to read when the photo is viewed small, which is how officials often see it in a list. Very long names may need a slightly taller strip so the text is not squeezed.',
    ] },
    { heading: 'Before you upload', paragraphs: [
      'Open the downloaded file and check the name spelling and date one more time, then check the file size and pixel size against the notice. Keep the original photo without the strip as well, in case another form asks for a plain photo.',
    ] },
  ],

  'hra-exemption-explained': [
    { heading: 'Two more examples', paragraphs: [
      'In a city that is not a metro, with basic salary of 30,000 a month, HRA of 12,000 and rent of 15,000: the three amounts are 12,000, then 15,000 minus 3,000 which is 12,000, then 40 percent of 30,000 which is 12,000. All three are equal, so the full 12,000 a month is exempt.',
      'If rent is low compared with basic, for example rent of 4,000 with basic of 50,000, rent minus 10 percent of basic is below zero, so no HRA is exempt and the whole HRA is taxable.',
    ] },
    { heading: 'Keeping proof', paragraphs: [
      'Pay rent by bank transfer where you can, because it leaves a clear record. Keep monthly rent receipts signed by the landlord, and a rent agreement if there is one. MyDailyUtils\' Rent Receipt Generator makes the receipts and reminds you about the landlord\'s PAN when yearly rent is above 1 lakh rupees.',
    ] },
    { heading: 'Questions people ask', paragraphs: [
      'Can I claim HRA if I pay rent to my parents? People do, but it needs real payment and records, and rules and scrutiny can apply; ask a tax professional about your case. What if I moved mid-year? Work out each period separately with the rent and city for that period. What if my employer did not count my HRA? You may still be able to claim it when filing your return under the old regime, with your proofs.',
    ] },
  ],

  'how-to-resize-and-convert-many-photos-at-once': [
    { heading: 'Settings for common jobs', paragraphs: [
      'Product photos for an online shop: a largest side of about 1,200 to 1,600 pixels in JPG at quality 80 is usually sharp on screens and quick to load. Photos to email or share as an album: about 1,600 pixels at quality 75 keeps each photo well under a megabyte in most cases. Photos for a printed album: keep the full size and choose a high quality, because printing needs more pixels than screens.',
    ] },
    { heading: 'Naming and watermarks', paragraphs: [
      'A name prefix such as "shop-sarees-" keeps files from a batch together and makes them easy to find later. A small text watermark with your shop name helps when photos are shared without credit; place it where it does not cover the product.',
    ] },
    { heading: 'Keep the originals', paragraphs: [
      'Resizing and compressing throw away detail that cannot be brought back. Keep the original photos in a separate folder, and run the batch again from the originals if you need a different size later, rather than resizing a resized copy.',
    ] },
  ],

  'rd-vs-fd-which-is-better': [
    { heading: 'Which suits which goal', paragraphs: [
      'A bonus or a maturity amount you want to keep safe for two years: an FD. Saving ₹5,000 a month towards a holiday or a gadget next year: an RD. Money you may need at short notice: neither may suit, because breaking an FD early or missing RD instalments usually costs you some interest; keep an emergency amount in a savings account.',
    ] },
    { heading: 'Splitting an FD', paragraphs: [
      'Instead of one large FD, some people open several smaller ones for different periods, such as one, two and three years. If money is needed suddenly, only one small FD has to be broken, and the rest keep earning. When each one matures, it can be renewed at the rate on offer then.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Comparing an FD and an RD by the interest rate alone; the RD\'s money is deposited over time, so its total interest is lower for the same rate. Forgetting tax on interest. Letting an FD renew automatically at a lower rate without checking. Not updating the nominee.',
    ] },
  ],

  'how-to-make-barcode-labels-for-your-shop': [
    { heading: 'How the EAN-13 check digit works', paragraphs: [
      'The last digit of an EAN-13 number is worked out from the first twelve, so scanners can spot a misread. For 400638133393, add the digits in odd positions (4+0+3+1+3+9 = 20), add the digits in even positions and multiply by three ((0+6+8+3+3+3) × 3 = 69), and add the two (89). The check digit is what brings the total to the next multiple of ten, which is 1, giving 4006381333931. The Barcode Generator does this for you.',
    ] },
    { heading: 'A simple coding plan', paragraphs: [
      'Give each item a short code that tells you something, such as a category letter and a number: R-001 for the first rice item, O-014 for an oil item. Keep a sheet or spreadsheet listing each code, the item name and the price. Short codes make smaller barcodes that are easier to scan on small packets.',
    ] },
    { heading: 'Common mistakes', paragraphs: [
      'Printing grey or coloured bars, which many scanners struggle to read. Cutting too close to the bars and removing the blank margin the scanner needs. Using the same code for two products. Labelling everything before testing that one printed label scans.',
    ] },
  ],

  'how-to-add-bates-numbers-and-page-stamps-to-pdfs': [
    { heading: 'A worked example', paragraphs: [
      'Three files of 10, 25 and 5 pages, with prefix ABC-, six digits, starting at 1 and counting on from file to file, are numbered ABC-000001 to ABC-000010, then ABC-000011 to ABC-000035, then ABC-000036 to ABC-000040. With counting on turned off, each file would start again at ABC-000001, which is rarely what a bundle needs.',
    ] },
    { heading: 'Choosing a prefix and width', paragraphs: [
      'Use a short prefix that names the matter or the party, such as a case short name or an audit year, so pages from different bundles cannot be confused. Pick enough digits for the largest bundle you expect; six digits allows up to 999,999 pages and keeps every number the same width, which sorts correctly.',
    ] },
    { heading: 'Recording what you produced', paragraphs: [
      'Keep a short list of which number range belongs to which document, for example "ABC-000011 to ABC-000035: bank statements 2025". It makes it easy to cite a page later and to check that nothing is missing.',
    ] },
  ],

  'how-to-make-a-visiting-card-and-print-it': [
    { heading: 'What to put on the card', paragraphs: [
      'Your name, what you do in a few words, one phone number, one email and, if you have one, a website or shop address. Leave out anything you do not want strangers to have, such as a home address. Fewer lines with larger text look more professional than a crowded card.',
    ] },
    { heading: 'Making it easy to read', paragraphs: [
      'Keep the name the largest text and the contact details clearly legible when printed; very small text that looks fine on screen can be hard to read on paper. Dark text on a light background is the easiest to read. Check that phone numbers and emails are typed exactly right, because a single wrong digit wastes the whole print run.',
    ] },
    { heading: 'Cutting a home-printed sheet', paragraphs: [
      'A paper trimmer or a metal ruler and a sharp cutter give much straighter edges than scissors. Cut the long lines first, then the short ones. Thicker card stock makes cards feel sturdier; check that your printer accepts it before buying a pack.',
    ] },
  ],

  'how-emi-works-and-how-to-reduce-interest': [
    { heading: 'A worked example', paragraphs: [
      'A loan of ₹10 lakh at 9% a year for 20 years has an EMI of about ₹8,997. Over 240 months you pay about ₹21.6 lakh, so roughly ₹11.6 lakh is interest. The same loan over 15 years has an EMI of about ₹10,143, which is ₹1,146 more each month, but the total interest falls to about ₹8.3 lakh, saving around ₹3.3 lakh.',
    ] },
    { heading: 'Questions to ask the lender', paragraphs: [
      'Is the rate fixed or floating, and what is it linked to? Is there a fee for paying extra or closing the loan early? When you pay extra, does the lender shorten the tenure or reduce the EMI? What are the processing fee and any compulsory insurance? These change the real cost as much as a small difference in the rate.',
    ] },
    { heading: 'Ways to pay less interest', paragraphs: [
      'Make a larger down payment if you can without emptying your emergency savings. Choose the shortest tenure whose EMI you can still pay comfortably. Put part of a bonus or a salary increase towards the loan each year. If rates fall, ask your lender about a lower rate before considering a switch, and count the costs of switching.',
    ] },
  ],

  'how-to-split-a-large-pdf-into-smaller-files': [
    { heading: 'Worked examples', paragraphs: [
      'A 25 MB scanned report and an email limit of 5 MB: choose split by largest file size, set 5 MB, and the tool groups pages into parts that each stay under the limit, usually five or six parts for a file that size. Name them in order, such as "Report-part-1-of-6", so the reader knows how many to expect.',
      'Forty receipts scanned in one go with a blank sheet between each: choose split at blank pages and you get forty separate files, one per receipt, ready to attach to an expense claim.',
    ] },
    { heading: 'Preparing a batch scan', paragraphs: [
      'If you plan to split at blank pages, put a clean, completely blank sheet between documents and scan it with the rest. A sheet with a stamp, a punch hole shadow or text showing through from the back may not count as blank; use plain white paper and scan with the lid closed.',
    ] },
    { heading: 'Checking the parts', paragraphs: [
      'Read the list of parts before downloading: each should start and end where you expect. Open the first and last part after downloading. If a document was split in the wrong place, try the other method or adjust the setting, rather than fixing the parts by hand.',
    ] },
  ],

  'how-to-scan-documents-to-pdf-with-your-phone': [
    { heading: 'Choosing a mode for each document', paragraphs: [
      'Printed letters, forms and bank statements: Black and white for the sharpest text and the smallest file. Handwritten notes in pencil or light ink: Clean gray, which keeps faint strokes that black and white can drop. ID cards, certificates with coloured seals, photos and anything where colour proves something: Clean colour.',
    ] },
    { heading: 'Two-sided documents', paragraphs: [
      'For an ID card or a two-sided form, photograph the front and then the back, and keep them as pages next to each other in that order. Many offices want both sides on one A4 page for ID cards; if so, say which layout they want before you scan, and check the result at full size.',
    ] },
    { heading: 'A quick quality check', paragraphs: [
      'Zoom into the smallest text and the signature on each page. Check all four edges are inside the page and nothing is cut off. Make sure the page count matches the original. A scan that is clear and complete the first time saves a rejection and a second visit.',
    ] },
  ],

  'how-to-make-passport-size-photos-at-home': [
    { heading: 'Taking the photo', paragraphs: [
      'Stand about half a metre in front of a plain white or light wall, facing a window so daylight falls evenly on your face. Ask the person taking the photo to stand a little further back and hold the phone at your eye level. Keep a neutral expression, eyes open and looking at the camera, and remove glasses if your form asks you to. Take several shots and pick the sharpest.',
    ] },
    { heading: 'Printing cheaply', paragraphs: [
      'A 4 by 6 inch sheet with several photos is the size most photo shops and many home photo printers handle, and printing one sheet usually costs much less than having photos taken at a studio. Ask the shop to print at actual size with no cropping or borders added, and measure one photo before cutting the rest.',
    ] },
    { heading: 'Common reasons photos are rejected', paragraphs: [
      'A shadow on the background or under the chin. The face too small or too large in the frame. A head tilted or turned. Glare on glasses. A background that is not plain. Wrong size after printing because "fit to page" was on. Each form states its own rules; check them before you print many copies.',
    ] },
  ],

  'how-to-make-a-gst-invoice': [
    { heading: 'Invoice numbers that stay tidy', paragraphs: [
      'Use one running series that never repeats within the financial year, such as INV/2026-27/001, INV/2026-27/002 and so on. Do not skip or reuse numbers; if an invoice is cancelled, keep its number on record as cancelled. A clear series makes your monthly returns easier to match.',
    ] },
    { heading: 'Before you send it', paragraphs: [
      'Check the buyer\'s GSTIN character by character against what they gave you, since a wrong GSTIN can stop them claiming the tax credit. Check the place of supply, because it decides between CGST plus SGST and IGST. Check that each item\'s rate and HSN or SAC code is the one you normally use. Then check the totals in words and figures match.',
    ] },
    { heading: 'Keeping records', paragraphs: [
      'Save every invoice as a PDF in a folder by month, and keep the customer\'s copy the same as yours. Ticking Remember my business details saves your seller details in your own browser so you do not type them each time; a different phone or browser will not have them.',
    ] },
  ],

  'how-gratuity-is-calculated': [
    { heading: 'Another worked example', paragraphs: [
      'For an employer not covered by the Act, with the same last basic plus DA of ₹50,000 and 10 years 7 months of service, only completed years count, so 10 years: 50,000 × 15 ÷ 30 × 10 = ₹2,50,000. The same person under the Act would get about ₹3,17,308, because the Act divides by 26 working days and rounds a part-year of six months or more up to a full year.',
    ] },
    { heading: 'What counts as salary', paragraphs: [
      'The formula uses the last drawn basic salary plus dearness allowance, not your full CTC or gross pay. Allowances such as HRA, special allowance and bonuses are usually left out. That is why a gratuity figure can look small next to a large CTC; check your payslip for basic and DA.',
    ] },
    { heading: 'Things to check when you leave', paragraphs: [
      'Your exact joining and last working dates, since a few days can decide whether a part-year counts. Whether your employer pays more than the legal minimum under its own policy. That your nominee details are up to date. If the amount paid looks wrong, ask HR for the calculation in writing.',
    ] },
  ],

  'how-to-make-a-quotation-for-a-customer': [
    { heading: 'An example of clear notes and terms', paragraphs: [
      '"Price includes material and labour for painting two rooms, walls only. Ceiling, putty and repairs are extra. Valid for 15 days. Work can start within a week of confirmation and takes about four days. 50% advance on confirmation, balance on completion. Payment by bank transfer or UPI." Each sentence answers a question the customer would otherwise ask later.',
    ] },
    { heading: 'Pricing so you do not lose money', paragraphs: [
      'List every cost before you set a price: material, labour, travel, tools, and any fee for payments. Add a margin for your time and for small surprises. If you are not sure how to set a price for your time, the Freelance Rate Calculator and the Profit Margin and Markup Calculator help you work it out.',
    ] },
    { heading: 'Following up', paragraphs: [
      'Number your quotations and keep a list with the date sent and the validity. A polite message a few days before the quote expires often gets a decision. If the customer asks for a lower price, change what is included rather than just cutting the price, so the job still pays.',
    ] },
  ],

  'how-to-remove-location-from-a-photo': [
    { heading: 'Checking a photo on your phone', paragraphs: [
      'On most Android phones, open the photo in the Gallery or Photos app and look at Details or swipe up to see the information, which shows a place if one is stored. On an iPhone, open the photo and tap the "i" button. If a map or place name appears, the location is inside the file.',
    ] },
    { heading: 'Stop new photos carrying location', paragraphs: [
      'Most camera apps have a setting such as "Location tags" or "Save location". Turning it off stops future photos from storing where they were taken. You may still want location on for your own albums; in that case, clean the photos you share with strangers, such as items you sell online.',
    ] },
    { heading: 'When it matters most', paragraphs: [
      'Photos of things you are selling, taken at home. Pictures of children near their school. Photos posted to public groups or sent to people you do not know well. Rental listings and property photos. In each case a clean copy shares the picture without sharing the place.',
    ] },
  ],

  'how-to-extract-pages-from-a-pdf': [
    { heading: 'Pages people often need on their own', paragraphs: [
      'The first page of a bank statement with your name and account details. The last page of an agreement with the signatures. One semester\'s mark sheet from a combined scan. The page of a policy document that shows the policy number and cover. A single invoice from a monthly bundle.',
    ] },
    { heading: 'Finding the right page number', paragraphs: [
      'Open the PDF and note the page number your viewer shows at the bottom or side, which counts from the first page of the file. Printed page numbers often differ because of a cover or an index, so a page printed as "5" may be page 7 of the file. Extracting the wrong page is the most common mistake.',
    ] },
    { heading: 'Naming the new file', paragraphs: [
      'Give the extracted file a name that says what it is, such as "Bank-statement-Oct-page-1.pdf". The person receiving it, and you a few months later, will know what it contains without opening it.',
    ] },
  ],

  'how-to-make-a-pdf-fillable-for-free': [
    { heading: 'Designing fields people can fill easily', paragraphs: [
      'Make each text box as long as the line on the form, and tall enough for normal-sized text. Use several lines for addresses and comments. Use a tick box for yes or no questions and a drop-down where answers come from a fixed list, such as departments or sizes, which also stops spelling differences.',
    ] },
    { heading: 'Naming fields', paragraphs: [
      'Give each field a clear, unique name such as "applicant_name", "date_of_birth" or "phone". Two fields with the same name usually show the same answer, which surprises people filling the form. Clear names also help if you later collect the answers into a spreadsheet.',
    ] },
    { heading: 'Good uses', paragraphs: [
      'Admission and registration forms for a school, club or society. Order or enquiry forms for a small business. Internal forms such as leave requests or expense claims. A form you received as a flat PDF and need several people to fill in the same way.',
    ] },
  ],

  'simple-vs-compound-interest': [
    { heading: 'Twenty years side by side', paragraphs: [
      '₹1,00,000 at 8% for 20 years earns ₹1,60,000 as simple interest, so the total is ₹2,60,000. With interest added once a year, the total is ₹1,00,000 × 1.08 raised to 20, about ₹4,66,000, so the interest is about ₹3,66,000, more than twice the simple interest. Small differences in the first few years become large over long periods.',
    ] },
    { heading: 'Flat rates on loans', paragraphs: [
      'Some lenders quote a "flat" rate, worked out on the original loan for the whole period even though you repay part of it every month. A loan of ₹1,00,000 at 10% flat for 2 years has ₹20,000 of interest and a monthly payment of ₹5,000. Because your balance falls each month, that is about 18% a year on the reducing balance, nearly double what the quoted 10% suggests. Ask for the rate on a reducing balance before comparing loans.',
    ] },
    { heading: 'Questions to ask', paragraphs: [
      'For savings: how often is interest added, and is it paid out or added to the balance? For loans: is the rate flat or on a reducing balance, and are there fees? The answers tell you which formula applies and what the money really costs or earns.',
    ] },
  ],

  'how-to-fill-a-pdf-form-without-printing': [
    { heading: 'A neat result', paragraphs: [
      'Use one size and colour for all your text, usually black or dark blue. Put text a little above the printed line rather than on it, so it reads like handwriting on a form. Write dates in the format the form shows, and use capitals where the form asks for block letters.',
    ] },
    { heading: 'Common forms filled this way', paragraphs: [
      'School and college admission forms, bank and KYC update forms, rental and society forms, reimbursement and leave forms at work, and insurance claim forms. Many offices that once asked for printed forms now accept a typed and signed PDF; check with the office if you are not sure.',
    ] },
    { heading: 'Before you send', paragraphs: [
      'Read each page of the downloaded file on your phone, check that every required box is filled, and compare names and numbers against your documents. Add your signature with Sign PDF last, after the content is final, so you do not have to sign again after a correction.',
    ] },
  ],

  'how-to-hide-details-in-a-pdf-before-sharing': [
    { heading: 'What to hide in common documents', paragraphs: [
      'Bank statement for a rental or visa file: keep your name and the balances they need, and consider covering transactions with personal details if the reader does not need them. ID copy: cover the parts the receiver does not need, where that is allowed. Salary slip: cover your bank account number and employee ID if they are not asked for. Medical bill for a claim: keep what the insurer needs, cover other personal notes.',
    ] },
    { heading: 'When not to redact', paragraphs: [
      'Some offices, such as banks and government departments, need the full document and will reject a copy with parts covered. If a document is being submitted for verification, ask what they need before covering anything. Redaction is for documents you share where some details are not needed.',
    ] },
    { heading: 'Checklist', paragraphs: [
      'Search for each number you want hidden, in every format it appears (with and without spaces). Check headers, footers and the last page. Cover details in stamps and handwritten notes by hand, since they cannot be searched. Try selecting the covered text in the downloaded file. Send only the redacted copy.',
    ] },
  ],

  'how-to-sign-a-pdf-on-your-phone': [
    { heading: 'Signing well on a small screen', paragraphs: [
      'Turn the phone sideways to get a wider space to draw in, and sign with a steady, slightly slower movement than on paper. If your finger signature looks shaky, sign on white paper with a dark pen, take a clear photo and upload it with the see-through option on. Make the signature about the size it would be on paper, so it fits the line.',
    ] },
    { heading: 'Where to sign', paragraphs: [
      'Sign where the document has a signature line. Some agreements ask for a signature or initials on every page; use the every-page option for that, and check it lands in an empty area on each page. If the document asks for the date and place next to your signature, add them with Fill PDF before signing.',
    ] },
    { heading: 'When a picture signature is not enough', paragraphs: [
      'Some documents need a certified digital signature, an Aadhaar-based e-sign, or a signature in ink on paper, for example certain legal, property and government filings. If the receiver asks for one of these, a signature picture will not be accepted; ask them which they need.',
    ] },
  ],

  'how-to-scan-a-qr-code-safely': [
    { heading: 'Common QR tricks', paragraphs: [
      'A sticker with a different QR code placed over the real one on a parking meter, shop counter or poster. A message saying you have won a prize and must scan a code to receive it. A buyer on a selling site who sends a QR code "to pay you". In each case the code leads to a fake website or a payment from your account instead of to you.',
    ] },
    { heading: 'Simple rules', paragraphs: [
      'You never need to scan a code or enter your UPI PIN to receive money. Check the payee name shown before paying, and stop if it does not match the shop. Do not enter passwords or card details on a site opened from a QR code unless you are sure of the website name. When paying at a shop, ask the shopkeeper to confirm the name your app shows.',
    ] },
    { heading: 'If you think you scanned a bad code', paragraphs: [
      'Do not enter any details on the page it opened. If you paid or shared details, contact your bank straight away through its official number or app and ask them to block or reverse what they can. In India you can also report cyber fraud through the national cybercrime helpline and website.',
    ] },
  ],

  'reduce-image-size-for-online-forms': [
    { heading: 'A worked example', paragraphs: [
      'Say a form asks for a photo of 200 × 230 pixels under 50 KB and a signature of 140 × 60 pixels under 20 KB. For the photo, crop to your head and shoulders, tick exact size and enter 200 by 230, set 50 KB and resize; a small photo like this usually fits easily. For the signature, sign in dark ink on white paper, photograph it close up, crop tight around the signature, then enter 140 by 60 and 20 KB.',
    ] },
    { heading: 'If the form gives size in cm or mm', paragraphs: [
      'Some forms give the photo size as 3.5 × 4.5 cm instead of pixels. Use the exact size option in millimetres or centimetres; the tool turns it into pixels using the DPI you choose. If the form also gives a pixel size, enter that instead, because pixels are what the portal checks.',
    ] },
    { heading: 'Common reasons for rejection', paragraphs: [
      'The file is in PNG or HEIC when the form wants JPG. The file is under the size limit but the width and height are wrong. The photo is blurry because a large photo was squeezed too hard. The signature has a grey background from poor light. Check each of these against the notice before you upload.',
    ] },
  ],
};
