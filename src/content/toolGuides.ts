import type { Guide } from './guides';

/**
 * Guides for the document, photo, shop and group tools added in November 2026. They sit in their own file so
 * src/content/guides.ts stays small; GUIDES in that file includes them. Every claim about a MyDailyUtils tool
 * must match what the tool really does, so read the tool before editing a guide.
 */
export const TOOL_GUIDES: Guide[] = [
  {
    slug: "how-to-sign-a-pdf-on-your-phone",
    title: "How to sign a PDF on your phone without printing it",
    description: "Draw or type your signature, place it on the right page of a PDF and download the signed file, all in your browser.",
    tools: ["sign-pdf", "signature-maker", "unlock-pdf"],
    sections: [
      { heading: "When this helps", paragraphs: [
        "Rent agreements, school forms, work letters and bank forms often arrive as a PDF with a line for your signature. Printing, signing and scanning takes time. Placing a picture of your signature on the PDF takes a minute.",
        "A picture of your signature is not a certified digital signature. Use it where the person or office asking accepts a plain signed copy, and check with them if you are not sure.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open Sign PDF and choose the file. Draw your signature with a finger or mouse, or type your name for a script-style signature. Tap the page where it should go, use the size slider, and choose whether it goes on this page, the last page or every page. Then download the signed PDF.",
        "You can also upload a photo of a signature you wrote on paper. Turn on the see-through option so the white paper does not show as a white box on the page.",
      ] },
      { heading: "Making a signature you can reuse", paragraphs: [
        "The Signature Maker saves your signature as a PNG with a see-through background, which you can use in documents and forms. Draw it slowly with a steady hand, and use Undo until it looks right. The picture is trimmed to the ink, so it sits neatly on a line.",
      ] },
      { heading: "If the file will not open", paragraphs: [
        "A PDF with a password cannot be signed until it is unlocked. Use Unlock PDF first, with the password you were given, then sign the unlocked copy. Files over 40 MB should be made smaller with Compress PDF first.",
      ] },
      { heading: "Privacy", paragraphs: [
        "The PDF and your signature stay in your browser. Nothing is uploaded to MyDailyUtils. Check the downloaded file on every page before you send it.",
      ] },
    ],
  },
  {
    slug: "how-to-fill-a-pdf-form-without-printing",
    title: "How to fill in a PDF form without printing it",
    description: "Type text, dates, ticks and crosses onto any PDF, scanned forms included, then download the filled copy.",
    tools: ["fill-pdf", "sign-pdf", "compress-pdf"],
    sections: [
      { heading: "Why typing on the page works", paragraphs: [
        "Some forms have fillable boxes inside the file, and many are plain PDFs or scans of paper. Fill PDF fills the form's own boxes when there are some, and also puts your text straight on the page wherever you tap, so it works for any PDF, including a photo of a form turned into a PDF.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open Fill PDF and choose the file. If it has fillable fields they are listed first: type into them, tick boxes and choose from lists, and keep Lock the filled fields on so every viewer shows your answers. Then, for anything else, pick Text, Tick or Cross. For text, type it and set the size and colour, then tap the page where it should go. Tap Today's date to fill in the date quickly. Drag anything you placed to move it, or remove it from the list. Download the filled PDF.",
      ] },
      { heading: "Getting the placing right", paragraphs: [
        "Take your time with the first item. Zoom your screen so the lines are easy to see, and keep the size close to the printed text on the form, usually 10 to 12 points. Check each page of the downloaded file in your phone's viewer, because the preview on screen is only a guide.",
      ] },
      { heading: "What it does not do", paragraphs: [
        "Only letters, digits and standard keyboard symbols are supported, in the form fields and on the page, so write Rs. instead of the rupee sign, and Hindi or other scripts cannot be added yet. It is not a signature. To add one, run the filled file through Sign PDF.",
      ] },
      { heading: "Privacy", paragraphs: [
        "Your PDF stays in your browser and is never uploaded to MyDailyUtils.",
      ] },
    ],
  },
  {
    slug: "how-to-scan-documents-to-pdf-with-your-phone",
    title: "How to scan documents to a clean PDF with your phone",
    description: "Photograph pages, clean up shadows, trim and reorder them, and save one PDF without installing a scanner app.",
    tools: ["document-scanner", "compress-pdf", "merge-pdf"],
    sections: [
      { heading: "Take better photos first", paragraphs: [
        "Put the page flat on a plain, darker surface in good light, and hold the phone straight above it so the edges are square. Avoid your own shadow on the page. A clear photo gives a clean scan, and no tool can fully rescue a blurry one.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the Document Scanner. On a phone, tap Take a photo for each page, or choose pictures you already have. Pick Clean colour, Clean gray or Black and white, trim the edges, turn pages that are sideways, use Earlier and Later to put pages in the right order, and remove any you do not want. Then save the PDF.",
        "Choose A4 pages for documents you may print, or Same size as the picture if you want the pages to keep the shape of the photos.",
      ] },
      { heading: "Which clean-up to choose", paragraphs: [
        "Black and white usually gives the smallest file and the clearest text for printed pages. Clean gray keeps more shading, and Clean colour suits IDs and anything where colour matters. Try each on one page and compare.",
      ] },
      { heading: "Making the file small enough", paragraphs: [
        "Many portals limit uploads to a few megabytes. If your scan is larger, run it through Compress PDF. To join separate scans into one file, use Merge PDF.",
      ] },
      { heading: "Privacy", paragraphs: [
        "The photos stay on your phone. The scan is made in your browser and nothing is uploaded to MyDailyUtils.",
      ] },
    ],
  },
  {
    slug: "how-to-make-passport-size-photos-at-home",
    title: "How to make passport size photos at home and print them",
    description: "Crop a photo to passport size, lay several copies on a 4x6, 5x7 or A4 sheet and print them yourself.",
    tools: ["passport-photo-sheet-maker", "image-resizer", "photo-name-date-strip"],
    sections: [
      { heading: "Start with the right photo", paragraphs: [
        "Use a plain light background, even light on the face and a straight-on pose with the head centred. Ask someone to take the photo from about arm's length or more so the face is not stretched. The tool crops and lays out the photo; it does not change the background, so the photo must already be plain.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the Passport Photo Sheet Maker, choose the photo or take one, and set the size: 35 by 45 mm, 2 by 2 inch, or a custom size. Use the zoom and move controls to place the face as your form asks. Choose a sheet of 4 by 6 inch, 5 by 7 inch or A4, and download the PDF.",
      ] },
      { heading: "Printing at the right size", paragraphs: [
        "Print the PDF at 100 percent, also called actual size, with no fit-to-page option. After printing, measure one photo with a ruler to confirm the size, then cut along the lines.",
      ] },
      { heading: "For online forms instead", paragraphs: [
        "If the form wants a digital photo, use the Image Resizer with the size and KB limit written on the form. If it also wants a name and date under the photo, the Photo Name and Date Strip adds that and keeps the file under your limit.",
        "Photo rules differ between passports, visas and exams and change over time. Check your own requirement before you print many copies.",
      ] },
    ],
  },
  {
    slug: "how-to-add-a-name-and-date-to-a-photo-for-forms",
    title: "How to add a name and date strip to a photo for exam and application forms",
    description: "Put your name and the date under a photo and save a JPG under the size limit, without an editing app.",
    tools: ["photo-name-date-strip", "image-resizer", "image-compressor"],
    sections: [
      { heading: "Why some forms ask for it", paragraphs: [
        "Some exams and applications ask for a photo with your name and the date written below it, so the picture can be matched to you. Writing a board by hand and photographing it is slow and often unclear.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the Photo Name and Date Strip and choose your photo, or tap Take a photo on a phone. Type your name and the date in the format your form shows. Pick a white, yellow or black strip, place it below or above the photo, and set its height.",
        "Set the width in pixels and, if the form has a limit, the size in KB. The tool saves the photo at a high quality first and lowers the quality, then the size, until the file fits. Check the preview and download the JPG.",
      ] },
      { heading: "Check before you upload", paragraphs: [
        "The strip is added outside the photo, so the face is not covered or cropped. Confirm the text is readable at the size you chose, and that the file is under the limit. Forms differ in strip size, colour, wording and date format, so follow the instructions on yours.",
      ] },
      { heading: "If you only need a smaller photo", paragraphs: [
        "Use the Image Resizer to reach an exact pixel size and KB limit, or the Image Compressor to just make a picture smaller.",
      ] },
    ],
  },
  {
    slug: "how-to-make-a-whatsapp-link-and-qr-code",
    title: "How to make a WhatsApp chat link and QR code for your business",
    description: "Turn your number and a ready-typed message into a wa.me link and a QR code customers can scan.",
    tools: ["whatsapp-link-generator", "qr-code-generator"],
    sections: [
      { heading: "What a chat link does", paragraphs: [
        "A link that starts with wa.me followed by a phone number opens a WhatsApp chat with that number. You can add a first message, so the customer only has to press send. It saves them from saving your number and typing the first line.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the WhatsApp Link Generator, choose the country code, and type the number without the code. Optionally type the first message, such as Hi, I would like to order. Copy the link, use Test the link to confirm it opens the chat, and download the QR code as a PNG.",
        "The tool removes spaces, dashes and a leading zero, and tells you if the number is too short or too long.",
      ] },
      { heading: "Where to use it", paragraphs: [
        "Put the link in an Instagram bio, a website button or a message. Print the QR code on a visiting card, a menu, a shop board or a bill so people can scan it from a short distance.",
      ] },
      { heading: "Keep in mind", paragraphs: [
        "Anyone with the link or QR code can start a chat with that number, so share it only where you want to be contacted, and consider using a business number. Test the QR code with your own phone before you print it.",
      ] },
    ],
  },
  {
    slug: "how-to-make-barcode-labels-for-your-shop",
    title: "How to make barcode labels for shelves, stock and files",
    description: "Make a Code 128 or EAN-13 barcode, download it, and print a sheet of labels on plain A4 paper.",
    tools: ["barcode-generator", "price-tag-maker", "stock-count-sheet-printable"],
    sections: [
      { heading: "Which type to use", paragraphs: [
        "Use Code 128 for your own stock codes, file numbers and any text that has letters. Use EAN-13 only for 13-digit retail numbers. Numbers for products sold in shops and online marketplaces are issued through GS1, so use EAN-style numbers of your own only for internal use.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the Barcode Generator, choose the type, and type the code. For EAN-13 you can enter 12 digits and the tool adds the check digit, or enter all 13 and it checks the last one. Set the bar height, choose whether the number is shown, and download the PNG.",
        "For many labels at once, type an item name or price, choose 12, 21 or 24 labels per A4 sheet and download the label sheet as a PDF.",
      ] },
      { heading: "Printing so it scans", paragraphs: [
        "Print at 100 percent size with black bars on a white background and keep blank space on both sides of the bars. Do not shrink the barcode to squeeze in more labels. Test one printed label with a scanner or a phone scanner app before you label everything.",
      ] },
      { heading: "Using the labels", paragraphs: [
        "Stick labels on shelves, boxes and files, and keep a list of what each code means. The Stock Count Sheet and Price Tag Maker help you record quantities and print price tags to go with them.",
      ] },
    ],
  },
  {
    slug: "how-to-make-a-upi-scan-and-pay-stand-for-your-shop",
    title: "How to make a printable UPI scan-and-pay stand for your shop counter",
    description: "Put your UPI QR code, shop name and logo on a printable stand, then check it with a real UPI app before you display it.",
    tools: ["upi-payment-qr-stand-printable", "qr-code-generator", "wifi-password-sign-printable"],
    sections: [
      { heading: "What you need", paragraphs: [
        "Your UPI ID, which looks like name@bank, and the name you want customers to see. You can also set a fixed amount, change the line under the code and choose a colour theme and font so the stand matches your shop.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the UPI Payment QR Stand and type your UPI ID and shop name. Add an amount only if every customer pays the same, and choose whether the UPI ID prints under the code. The tool tells you if the ID does not look right. Download the PDF, print it at 100 percent on A4, then fold or frame it.",
      ] },
      { heading: "Test before you display it", paragraphs: [
        "Scan the printed stand with a real UPI app and check that the name and the receiving ID shown are yours before any customer pays. Do this after printing, not only on screen, so you know the print is sharp enough.",
      ] },
      { heading: "Keep it safe", paragraphs: [
        "Display the stand where you can see it and check it often, so nobody places another QR code over yours. Use the QR code generator for other codes, and the Wi-Fi Password Sign for a matching guest Wi-Fi board. The stand is a printable template for your own use.",
      ] },
    ],
  },
  {
    slug: "how-to-run-a-secret-santa-draw-on-one-phone",
    title: "How to run a Secret Santa draw on one phone",
    description: "Draw names fairly, avoid pairs that should not match, and pass the phone around so each person sees only their own match.",
    tools: ["secret-santa-generator", "random-name-picker", "random-team-generator"],
    sections: [
      { heading: "How it works", paragraphs: [
        "Add everyone's name, one per line. The draw makes sure nobody gets themselves, and you can list pairs who should not draw each other, such as a couple who would exchange gifts anyway. If the rules leave no possible draw, the tool tells you.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the Secret Santa Generator, type the names, add any banned pairs, and optionally an event name and a gift budget. Start the draw, then pass the phone around. Each person taps their own name, reads who they are buying for, and hides the screen before passing it on.",
      ] },
      { heading: "Keeping it a secret", paragraphs: [
        "Each name opens once, so a person cannot peek twice by accident. The result is not saved or sent, so nobody, including you, can look it up later unless you choose to view it as the organiser.",
      ] },
      { heading: "Other draws", paragraphs: [
        "For a simple lucky draw, use the Random Name Picker. To split a group into fair teams or shuffle a speaking order, use the Random Team Generator.",
      ] },
    ],
  },
  {
    slug: "how-to-make-fair-random-teams-and-draws",
    title: "How to make fair random teams, pick a winner and shuffle an order",
    description: "Split a class or group into teams, pick one or several winners without repeats, or shuffle names into a numbered order.",
    tools: ["random-team-generator", "random-name-picker", "secret-santa-generator"],
    sections: [
      { heading: "Why random helps", paragraphs: [
        "Picking by hand invites arguments about who was favoured. A visible random pick is quick and easy for everyone to accept. These tools use your browser's secure random numbers, so every name has the same chance.",
      ] },
      { heading: "Making teams", paragraphs: [
        "Open the Random Team Generator, paste the names and choose either the number of teams or the number of people per team. Press Make teams. Team sizes never differ by more than one, so seven people in three teams give 3, 2 and 2. Press the button again for a new split, and copy the result to share it.",
      ] },
      { heading: "Shuffling an order", paragraphs: [
        "Choose A shuffled order to get a numbered list for presentation turns, queue order or seats.",
      ] },
      { heading: "Picking winners", paragraphs: [
        "In the Random Name Picker, paste the names, set how many to pick, and press Pick now. Keep Do not pick the same name twice on if everyone should get one turn. Press Start over to use the full list again. For a public draw, show the screen while you pick.",
      ] },
    ],
  },
  {
    slug: "how-to-print-certificates-name-tags-and-id-cards",
    title: "How to print certificates, name tags and ID cards on plain A4 paper",
    description: "Choose a colour theme and font, add your logo, and print certificates, name tag sheets and ID cards at home or in a nearby shop.",
    tools: ["certificate-of-achievement-printable", "name-tag-sticker-sheet-printable", "id-card-maker-printable"],
    sections: [
      { heading: "Pick the sheet", paragraphs: [
        "There are separate pages for achievement, participation, appreciation, course completion, sports and attendance certificates, for name tag and sticker sheets, and for ID cards with a box for a passport photo. Pick the one that matches what you need, and the wording and layout are ready.",
      ] },
      { heading: "Make it yours", paragraphs: [
        "Type the name and details, then choose a colour theme and a font. Add your school, club or shop logo in the logo box; tick Remember if you want your name and logo to come back next time on the same device. Name tag sheets accept a pasted list, so a whole class fits on a few pages.",
      ] },
      { heading: "Printing well", paragraphs: [
        "Download the PDF and print at 100 percent, also called actual size. Use thicker paper or card for certificates. For ID cards, stick a passport photo in the photo box, cut along the lines and laminate if you can. Certificates and ID cards made here are templates, not official documents. Do a test print of one page first to check the colours and the margins.",
      ] },
      { heading: "Privacy", paragraphs: [
        "Names and logos are used only in your browser to draw the PDF. They are not uploaded to MyDailyUtils.",
      ] },
    ],
  },
  {
    slug: "how-to-hide-details-in-a-pdf-before-sharing",
    title: "How to hide names and numbers in a PDF before you share it",
    description: "Black out account numbers, ID numbers, names and addresses in a PDF so the covered text is really removed, not just hidden behind a box.",
    tools: ["redact-pdf", "compress-pdf", "sanitize-pdf"],
    sections: [
      { heading: "Why a black box is not always enough", paragraphs: [
        "Bank statements, rent agreements, ID copies and bills often have details you do not want to send on: an account number, an ID number, a phone number or a full address. A black rectangle drawn in an ordinary PDF editor is only a shape on top of the page, and the text underneath can still be selected, copied and searched.",
        "Redact PDF rebuilds every page that has a black box as a picture with the box painted in, so the covered words are no longer in the file.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open Redact PDF and choose your file. Type a word or number in the find box and tap Find and cover to black it out on every page, or draw boxes with your finger. Choose Scroll when you want to move the page instead of drawing.",
        "Go through every page. A name or address that runs over two lines needs a box drawn by hand, and a scanned page has no text to search, so draw those boxes too. Remove any box you do not want, then download.",
      ] },
      { heading: "Check before you send", paragraphs: [
        "Open the downloaded file and try to select the text under a box. If nothing can be selected, it is gone. Keep your original for yourself and send only the redacted copy.",
        "Pages without a box stay as normal text by default. The redacted file can be larger, so use Compress PDF if you need a smaller one. Sanitize PDF removes hidden file details such as the author name from other documents.",
      ] },
      { heading: "Privacy", paragraphs: [
        "The PDF is read and rebuilt in your browser. Nothing is uploaded to MyDailyUtils. Rules for official filings differ, so check what the office you are sending it to asks for.",
      ] },
    ],
  },
  {
    slug: "how-to-compare-two-versions-of-a-document",
    title: "How to see what changed between two versions of a document",
    description: "Paste two texts or open two PDFs and see what was added and removed, by line or by word, so a changed clause or number does not slip past you.",
    tools: ["compare-pdf-and-text", "extract-text", "digitize-documents"],
    sections: [
      { heading: "When this helps", paragraphs: [
        "A landlord sends a new agreement, a shop sends a revised quote, or a colleague sends back your draft with changes. Reading two long versions one after the other makes it easy to miss a changed date, amount or clause.",
        "Compare PDF and Text marks the removed parts in red with a line through them and the new parts in green, so you can look only at what moved.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the tool and choose Pasted text or Two PDF files. Add the old version first and the new version second. Pick Whole lines for agreements and lists, or Word by word to find one changed number inside a paragraph.",
        "Turn on Show only the changed lines to hide everything that stayed the same.",
      ] },
      { heading: "What it cannot see", paragraphs: [
        "It compares the words, not the layout, fonts or pictures. A scanned PDF is a picture, so turn it into text first with Scan to Searchable PDF (OCR), or use Extract Text if the PDF already has text. Very long, very different documents may be too large to compare on a phone, so compare a few pages at a time.",
      ] },
      { heading: "Privacy", paragraphs: [
        "Your text and files stay in your browser. Nothing is uploaded to MyDailyUtils.",
      ] },
    ],
  },
  {
    slug: "how-to-remove-location-from-a-photo",
    title: "How to see and remove the location hidden in your photos",
    description: "Check what a photo reveals, such as the place, the phone and the time, and save a clean copy before you send or post it.",
    tools: ["remove-photo-location", "image-resizer", "screenshot-redactor"],
    sections: [
      { heading: "What a photo can give away", paragraphs: [
        "Photos from phones often carry hidden details inside the file: where you took the picture, the phone model, the date and time, and sometimes the app that edited it. If you send the original file, a stranger can read them. A photo taken at home or outside your child's school can show where that is.",
        "Many apps remove these details when you post, but not all of them do, and not always when you send a file as a document or by email.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open Remove Location and EXIF Data from Photos and choose one or more photos, or take one with your camera. Each photo lists what it carries. If a place is stored you can open it on a map to see how exact it is.",
        "Tap Download clean copy, or Clean all when you picked several, and share the clean file. Your original stays on your phone.",
      ] },
      { heading: "Good to know", paragraphs: [
        "The tool lists the details stored in JPG photos, which is what phones save. PNG and WebP pictures can still be cleaned. If the photo also shows a name, a car number or a letter in the picture itself, use the Screenshot Redactor to blur it, and the Image Resizer if a form needs a smaller file.",
      ] },
      { heading: "Privacy", paragraphs: [
        "Your photos are read and cleaned in your browser. Nothing is uploaded to MyDailyUtils. The map link opens Google Maps only if you tap it.",
      ] },
    ],
  },
  {
    slug: "how-to-scan-a-qr-code-safely",
    title: "How to scan a QR code safely and see what is inside first",
    description: "Read a QR code from a photo, screenshot or camera, check the website, UPI payee or Wi-Fi details, and only then decide to open or pay.",
    tools: ["qr-code-scanner", "qr-code-generator", "wifi-qr-code-generator"],
    sections: [
      { heading: "Why look before you act", paragraphs: [
        "A QR code is just a picture of some text, so a safe-looking code and a harmful one look the same. Many phone cameras open a link straight away. The QR Code Scanner shows what is inside first, in plain words, and does nothing until you choose.",
      ] },
      { heading: "Steps", paragraphs: [
        "Open the QR Code Scanner. For a code sent to you, save the picture or take a screenshot and tap Choose a photo or screenshot. For a code in front of you, tap Take photo, or Scan with live camera and allow camera access. Fill the frame with the code and hold steady.",
        "The result shows the kind of code and its details: for a web link the website name, for a UPI code the payee name and UPI ID, for a Wi-Fi code the network name and password.",
      ] },
      { heading: "What to check", paragraphs: [
        "For a link, read the website name and open it only if it is what you expect. For a payment code, make sure the name and UPI ID match the person or shop. A UPI PIN is only needed to send money, so if someone asks you to scan a code or enter your PIN to receive money, treat it as a warning sign. The tool never makes a payment.",
      ] },
      { heading: "If it will not read", paragraphs: [
        "Use a clearer or larger picture, remove glare, and fill the frame with the code. It reads one code at a time. If the live camera does not start, allow camera access in your browser settings or use a photo instead. To make your own codes, use the QR Code Generator or the Wi-Fi QR Code Generator.",
      ] },
      { heading: "Privacy", paragraphs: [
        "The picture and camera feed stay in your browser. Nothing is uploaded to MyDailyUtils. The page still loads advertising and other resources from the network.",
      ] },
    ],
  },
];
