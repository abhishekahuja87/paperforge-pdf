# MyDailyUtils: test results template

How to use: go top to bottom on a real phone first (note the phone and browser), then the computer checks. Put **P** (pass) or **F** (fail) in the Result column and add a short note for every F: what you did, what you saw, a screenshot name if you have one. Send the filled file back and I will fix every F in one go.

- Tester: ____________  Date: ____________
- Phone and browser (for example Pixel 8, Chrome; iPhone 15, Safari): ____________
- Computer and browser: ____________
- Site address tested (live or preview link): ____________

## A. Deploy health (computer)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Amplify build for the latest merge | Green, no red lines | | |
| A2 | Open the home page, then every new page in this file | No blank page, no error message | | |
| A3 | Open /sitemap.xml | Lists the new tool, guide and collection pages | | |
| A4 | Open the site on a phone at normal size | No sideways scrolling anywhere | | |

## B. Redact PDF (/redact-pdf)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Open a text PDF, type a word that appears twice, tap Find and cover | Black boxes on every match, each covers the word | | |
| B2 | Remove one box with Remove | Only that box goes | | |
| B3 | Choose Draw boxes and draw a box with your finger | A box appears where you drew | | |
| B4 | Choose Scroll and swipe the page | The page scrolls and no box is drawn | | |
| B5 | Download. Open the file and try to select or search the covered text | Cannot select or search it | | |
| B6 | Other pages in the downloaded file | Still sharp, text still selectable | | |
| B7 | Turn off "Keep other pages as normal text" and download | Every page becomes a picture | | |
| B8 | A scanned PDF with hand-drawn boxes | Works | | |
| B9 | A password PDF; a PDF over 60 pages | A clear message, no crash | | |
| B10 | File info (title, author) in the downloaded file | Empty | | |

## C. Compare PDF and Text (/compare-pdf-and-text)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Paste two texts that differ by one word, Word by word | Only that word is marked | | |
| C2 | Whole lines with Show only the changed lines | Only changed lines shown | | |
| C3 | Two PDFs with text | Differences shown | | |
| C4 | A scanned PDF | Message about running OCR first | | |
| C5 | Two long unrelated texts | "Too long" message, page does not freeze | | |
| C6 | Identical texts | "No difference found" | | |

## D. Remove Location and EXIF (/remove-photo-location)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| D1 | A phone photo taken with location on | Shows place, phone, time | | |
| D2 | Tap the map link | Opens Google Maps at the right spot | | |
| D3 | A photo with location off | "No hidden details found" (or only camera and time) | | |
| D4 | A PNG | Says only JPG details are shown, can still be cleaned | | |
| D5 | Download the clean copy and choose it again | No place, phone or time; picture upright and looks the same | | |
| D6 | Choose 3 photos and Clean all | All three download (allow multiple downloads if asked) | | |
| D7 | Take photo button (phone only) | Opens the camera | | |

## E. QR Code Scanner (/qr-code-scanner)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| E1 | Choose a screenshot of a website QR code | Shows Web link, the website name, a caution; nothing opens by itself | | |
| E2 | Tap Open the link | Opens in a new tab | | |
| E3 | A UPI payment QR (a shop stand or one made with the UPI tool) | Shows payee name and UPI ID (and amount if present); a payment is never started | | |
| E4 | A Wi-Fi QR made with the Wi-Fi QR tool | Shows network name, password, security | | |
| E5 | Scan with live camera on a phone, allow camera | Camera opens, code is read | | |
| E6 | Deny the camera permission | Clear message, photo option still works | | |
| E7 | Take photo (phone only) | Reads the code | | |
| E8 | A picture with no QR code | "No QR code found" message | | |
| E9 | Copy text button | Copies the full text | | |
| E10 | iPhone Safari live camera (if you have an iPhone) | Works, or the message appears and photo works | | |

## F. Fill PDF fields (/fill-pdf)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| F1 | A PDF form with fillable fields | A "Fill the form fields" list appears | | |
| F2 | Type in a text field, tick a box, choose from a list, download | Answers show in your phone viewer and a computer viewer | | |
| F3 | Same with Lock the filled fields turned off | Fields stay editable; check they still show the answers | | |
| F4 | A PDF with no fields (and a scan) | No field list; tap-to-place works as before | | |
| F5 | Fill fields and also add a text mark and a tick on the page | Both are in the file | | |
| F6 | Type "Rs." and a rupee sign in a field | Rs. works; rupee sign shows a message, no crash | | |
| F7 | A password PDF | Clear message | | |

## G. Hindi text recognition (/digitize-documents)
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| G1 | The Text language box is visible near Output | English, and Hindi and English | | |
| G2 | A clear photo of a printed English page, English chosen | Searchable PDF, search finds words | | |
| G3 | A clear photo of printed Hindi text, Hindi and English chosen | Search finds Hindi words (note how good it is) | | |
| G4 | A mixed Hindi and English page | Both read reasonably | | |
| G5 | How long Hindi took the first time, and on a phone | Note the seconds; it must not freeze the phone | | |

## H. Related tools, collection pages, guides
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| H1 | Open Merge PDF, scroll to the bottom | A Related tools row with 4 sensible tools, links work | | |
| H2 | Open 5 other tools (an image tool, a calculator, a printable) | Related tools row shows, none broken, none is the tool itself | | |
| H3 | Focus mode on a tool | Related tools hidden | | |
| H4 | Open /pdf-tools, /photo-and-image-tools, /qr-and-sharing-tools, /everyday-tools | Each shows intro text and all its tools; cards open the right tool | | |
| H5 | Footer links on a phone | The four collection links show and work | | |
| H6 | /guides shows 49 guides; open the QR guide and the three guides from last time | Open, Try it links work | | |

## I. Earlier features still to confirm on a real phone
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| I1 | Take photo button in Passport Photo Sheet, Photo Grid Splitter, Collage, logo pickers | Opens camera, photo is used | | |
| I2 | Photo name and date strip: exam photo under 50 KB | Name and date strip added, size within the KB limit | | |
| I3 | WhatsApp link generator: make a link and QR, open the link | Opens the right chat with the message | | |
| I4 | Barcode generator: Code 128 and EAN-13, scan the PNG with a scanner app | Scans to the right value; A4 label sheet prints at 100% | | |
| I5 | Random name picker and team generator | Picks, no repeats when set; teams are balanced | | |
| I6 | Install the app (Add to Home Screen) | Icon shows correctly (not cut), opens full screen | | |
| I7 | After installing, turn on aeroplane mode and open Merge PDF | Opens and works offline | | |
| I8 | Pin a tool, use two tools, return to the home page | "Your tools" shows pinned and recent | | |
| I9 | /why-trust-us page | Claims are true for you (independent, Bangalore, no sign-up, ad-supported); links work | | |
| I10 | Open Sign PDF and sign a PDF | Works; downloaded file shows the signature | | |

## K. No-limit tools and the free promise
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| K1 | Make PDF Fillable: text box, tick box, drop-down, download, type into them in two viewers | Fields work and sit where drawn | | |
| K2 | Make PDF Fillable on a rotated page | Fields are in the right place | | |
| K3 | Smart Split: every N, blank pages, bookmarks, by size | Parts listed first, ZIP opens, ranges correct | | |
| K4 | Bulk Image Tools with 30+ photos, watermark, WebP | ZIP downloads, sizes shown, no crash | | |
| K5 | Bates Numbering, 3 PDFs, keep counting | Unbroken numbers, tokens filled, ZIP opens | | |
| K6 | Social Image Sizes, Fill and Fit | Correct pixel sizes, crop moves | | |
| K7 | GIF Maker, 5 pictures | GIF plays on WhatsApp and browser, no watermark | | |
| K8 | Green badge on tools, none on scanner / Digitize | As described | | |
| K9 | Home strip, /free-no-limits, footer link, guides | All load and read well | | |
| K10 | Sign, Fill, Redact, Compare with a large file | No size or page message | | |

## L. One promise pill
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| L1 | Merge, Fill PDF, Smart Split, Bulk Images | One orange pill "Free · No limits · Stays on your device" | | |
| L2 | A calculator, Word Counter, Document Scanner | One orange pill "Stays in your browser", same look | | |
| L3 | Home page | Pill and tool count only; no green strip | | |
| L4 | Tap the pills | Open /free-no-limits (full) or /why-trust-us (short) | | |
| L5 | Fill PDF, Redact, Compare, Passport Photo | No extra "never uploaded" line under the tool | | |

## M. Home hero and topic pages
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| M1 | Home page on a computer | Two columns, tiles on the right, little empty space | | |
| M2 | Home page on a phone | Tags, headline, search, tiles in 2 columns; no sideways scroll | | |
| M3 | Tap each of the 13 tiles | Opens its page; tool counts look right | | |
| M4 | Read the 8 new topic pages | Text is accurate and tool lists complete | | |
| M5 | "Browse N+ tools" number | Matches roughly the number of tools you have | | |

## N. Topic pages
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| N1 | Open all 13 topic pages from the hero tiles | Each opens its own page (also Display) | | |
| N2 | Task table on a phone and a computer | Readable; every tool link opens the right tool | | |
| N3 | Read the rows for your own areas (PDF, photos, printables) | Every row is true to the tool | | |
| N4 | Hero tile colours | Same colour per topic as the sections below | | |

## O. Workout Planner and Gym Display
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| O1 | Open /workout-planner | Three empty parts; Start slideshow disabled | | |
| O2 | Tap each quick start, then Undo | All three parts fill; Undo restores | | |
| O3 | In every part add from the list and add your own (name and note) | Both work; own entry shows "No picture" | | |
| O4 | Start slideshow | Intro, exercises, rest, end; pictures only for list items | | |
| O5 | Arrow keys, space, Escape, buttons | Move, pause, close; buttons hide then return | | |
| O6 | Display options and timings | Slideshow follows them | | |
| O6b | Show all on one screen | Three parts, small pictures, time buttons, tick-off, session clock; fits one screen on a TV | | |
| O7 | Reload; Copy plan as text | Plan is kept; text pastes well | | |
| O8 | On a phone | Fills the screen and stays awake | | |

## P. Classroom Quiz Display
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| P1 | Open /classroom-quiz-display, create 5 questions, try the sample | Questions appear; Start disabled until valid; Undo works | | |
| P2 | Edit a question: options, correct answer, pictures, explanation | 2 to 6 options; pictures show as thumbnails | | |
| P3 | Paste questions from a document | Questions, options, answers and explanations read correctly | | |
| P4 | Save a quiz file, reload, open the file | Same quiz comes back with pictures | | |
| P5 | Learn mode | Click shows answer, click goes on; green correct option | | |
| P6 | Mock exam | Timer, then answer and explanation, then next by itself | | |
| P7 | Real exam | Timer, no answers, answer key at the end | | |
| P8 | Shuffle, show options, copy paper and key | Work; answers stay right after shuffling | | |
| P9 | On a phone and on a TV or projector | Usable and fills the screen | | |

## Q. Big-screen tools
| # | Check | Expected | Result | Notes |
|---|---|---|---|---|
| Q1 | Interval timer: Tabata, Circuit, beeps | Right rounds and times; green/blue; beeps | | |
| Q2 | Step-by-step routine display: sample, add from picture list, own step, paste many, start | Name, cue, picture, countdown, next step | | |
| Q3 | Exam hall display: press start and set time | Clock, time left, amber warning, red Pens down | | |
| Q4 | Menu board: sample, paging, symbol, loop | Sections and pages loop; prices correct | | |
| Q5 | Queue token display: next, back, jump, big screen | Number huge, next three, chime, count kept | | |
| Q6 | Daily timings board | Sorted; now green, next marked, changes with the clock | | |
| Q7 | Spelling bee: Spell it, Read it, auto, shuffle | Clue/word reveal works | | |
| Q8 | Notice board: colours, picture, loop | Messages rotate | | |
| Q9 | Quick start buttons on a phone (all eight) | "Loaded" mark and scroll to the list | | |
| Q10 | All eight on a TV or projector | Large and readable, fullscreen, buttons fade | | |
| Q11 | Pictures, video and logo (menu, spelling bee, notices, routine, logo on all) | Show correctly; video gone after reload, pictures stay | | |
| Q25 | Same layout in all PDF tools: upload box, file bar (pages, size, Change), main button, banner, grey another button | Identical | | |
| Q26 | Password-protected PDF in Sanitize, Protect, Flatten, Smart Split, Redact, Fill, Sign, Bates, Extract text, Compare | Password box appears | | |
| Q27 | Checkboxes (Protect, Sanitize, N-up, Numbers, Watermark) | Orange, not blue | | |
| Q28 | Flatten shows one banner; PDF to images has Save ZIP and grey button; Document scanner starts on Original and ends with banner | As described | | |
| Q24 | Scan to searchable PDF: one page flow, banner with rename, grey start-over, no separate editor | Same as the other PDF tools; text is searchable | | |
| Q21 | Main buttons named for the action; grey "another" button after a result; banner turns amber when settings change | Same in all PDF tools | | |
| Q22 | Rotate angle options on a small phone; Organize "N pages" | Fit; no "remaining" | | |
| Q23 | Related tools shows the Master Document Studio card on PDF tools | Shown | | |
| Q18 | Save banner and rename (pencil) in all PDF tools; amber outdated state | Same in every tool, new name is used for the download | | |
| Q19 | Merge on phone: row buttons clear of the page box; small files show KB | No overlap | | |
| Q20 | Back link goes tool, collection, home; contact page from a tool says report or suggest | Works | | |
| Q14 | Spinner wheel: winner always matches the slice under the pointer | Yes, on phone and TV | | |
| Q15 | Lucky draw: no repeats, prizes in order, big screen | Works | | |
| Q16 | Team scoreboard and classroom seating plan | Work, saved after reload | | |
| Q17 | Share row under tools (share sheet on phone, copy link on desktop, contact link) | Works, not doubled on calculators | | |
| Q13 | Screen colours (six) on exam hall, token, timings, bee, menu, routine, quiz and workout slideshow and board | Readable on all six, remembered after reload where saved, an older saved light screen still opens as Light | | |
| Q12 | Phone full screen on the quiz, workout slideshow and the big-screen tools | Buttons at the top, not hidden by the browser's message | | |

## J. Your own tasks (not testing, tick when done)
- [ ] Merge the PR only after `pnpm-lock.yaml` includes qr-scanner and @tesseract.js-data/hin
- [ ] Search Console: resubmit the sitemap
- [ ] Search Console: request indexing for the new tools, guides and the four collection pages
- [ ] Search Console: press Validate fix on the old 404 issues (the merged resizer pages are meant to be gone)
- [ ] AdSense: resubmit around 25 Nov after the new pages are indexed

## Anything else you noticed
(slow screens, confusing words, things you expected that were missing)


## K. 22 Nov additions
| # | What to try | Result | Notes |
|---|---|---|---|
| K1 | Colour picker in Colour Converter, Watermark, QR, Resume and Document Editor (phone and computer) | | |
| K2 | Timestamp converter: live clock, zones, unit detection, add/subtract, batch | | |
| K3 | JSON to CSV: sample, file with several lists, open result in Excel | | |
| K4 | JSON Viewer: expand/collapse, search, copy path, table and text views, a large file | | |

## L. Free-more tools (22 Nov)
| # | What to try | Result | Notes |
|---|---|---|---|
| L1 | Resize PDF Page Size: mixed-size and rotated pages to A4 | | |
| L2 | PDF Booklet Maker: print a 4-page test double-sided and fold | | |
| L3 | Grayscale PDF: grey and black-and-white on a colour PDF | | |
| L4 | Extract Images from PDF: ZIP of the photos in a PDF | | |
| L5 | Audio Cutter and Joiner: join two files, trim, play, save WAV | | |
| L6 | Globe Video Maker: pick A and B, preview, make a 10 s video, play it, save it | | |
| L7 | Globe Video Maker: One to many and Places visited layouts, an example button, and one purpose page such as /travel-route-video-maker | | |
| L8 | Globe Video Maker: import a GPX route and make a 5 s 4K video | | |
| L9 | Globe Video Maker: face photo as the marker and a place picture with credit at a stop | | |
| L10 | Globe Video Maker: a note on a stop, an intro card, an ending card with facts | | |
| L11 | Handwriting Video Maker: type 3 lines, preview writes with the pen, make a 10 s video, play it, save it; try Hindi text and the chalkboard look | | |
| L12 | Sequence Diagram Video Maker: pick an example, change a line, tap through with the microphone, make a video, play it with sound, save it; turn Show the arrows off | | |
| L13 | Explainer Video Maker: pick an example, add a picture and use it on the left, tap through with the microphone, make a video, play it with sound, save it | | |
| L14 | Map Video Maker: pick an example, add a country from the search box, add a pin on a city, tap through with the microphone, make a video, play it with sound, save it | | |
| L15 | Chart Reveal Video Maker: pick each of the six examples, edit a number, switch chart type, set a rupee sign and the Indian number style, add an end card, tap through with the microphone, make a video, play it with sound, save it | | |
| L16 | Photo Story Video Maker: add 3 photos from the phone camera, pick a starter, fill the captions, try Print frame and Big text, tap through with the microphone, make a video, play it with sound, save it | | |
| L17 | Tap-to-Time Captions: pick a starter, add an audio file, tap through, undo once, change one time, save the SRT and import it in CapCut or YouTube, make a captions video and play it with sound | | |
| L18 | Audio Clip Video Maker: pick Podcast clip, add a real MP3 or voice note, add a cover picture, try bars and the circle, make a video and play it with sound, post it to Instagram or YouTube | | |
| L19 | App & Website Demo Video Maker: add 4 real screenshots, pick Online shop order, point at one button with zoom, hide a phone number and check it is unreadable, add one long web page screenshot, make a video and play it with sound | | |
| L20 | Speak-to-Captions Video Maker: read the privacy note, speak a Hindi or English sentence, fix one word, try 2 and 7 words at a time, save the SRT and import it in CapCut, make a video and play it with sound (Android Chrome and iPhone Safari) | | |
| L21 | Video Compressor and Trimmer: pick the WhatsApp starter, add a one minute phone video, cut it with Start here and End here, make it, check it is under about 15 MB and plays with sound (Android Chrome and iPhone Safari), then send it on WhatsApp | | |
| L22 | Subtitles Burner: add a phone video and an SRT made with Tap-to-Time Captions, try Reel bold box, make the video and play it with sound and captions on your phone, then post it as a Reel | | |
| L23 | Voice Clean-up: record a voice note near a fan, use the Noisy room starter, play the original and the cleaned sound with headphones, and send the saved file on WhatsApp | | |
| L24 | Background Remover: photograph a product on white paper, use Product on white, adjust How much to remove, save the transparent PNG and place it on a coloured background in another app | | |
| L25 | Screen Recorder with Face Bubble: on a laptop use the Tutorial starter, record one minute of a window with your face and voice while switching to another window, stop, and check the saved video plays with sound and the face bubble | | |
| L26 | WhatsApp Chat to PDF: export one of your own chats from WhatsApp, pick the Memory book starter, save the PDF, and check the dates, names, Hindi or emoji and photos are right | | |
| L27 | Teleprompter with Video Recording: on a phone use the Self-introduction starter, record 20 seconds while reading, stop and check the video has your voice and no script | | |
| L28 | Whiteboard Lesson Recorder: on a phone use the Maths lesson starter, record 30 seconds of drawing and talking, stop and check the video shows the drawing and your voice | | |
| L29 | Before and After Video Maker: use the Room makeover starter with two real photos of the same place, make the video and check the reveal and the tags look right | | |
| L30 | Bulk Certificate Maker: use the Participation starter with the sample names, make the one PDF and the zip, print one page at Actual size and check the border and name are not cut off | | |
| L31 | Report Card and Rank List Maker: use the With pass and fail starter with the sample marks, change one grade band and the pass mark, make the PDF and check a card, the rank list and a Fail row | | |
| L32 | PDF Table to Excel: use the Bank statement starter with the sample PDF, save the Excel file and check the totals; then try one real statement and compare a few rows with the PDF | | |
| L33 | OMR Scanner and Grader: print the 20 question sheet, fill it in with a pen and a pencil, photograph it on a phone and check the roll number, answers and score against the paper | | |
| L34 | Blur Faces or Number Plates in a Video: use the sample video, make the video and check the face and the moving plate stay hidden all the way; then try a real phone video with a face | | |
| L35 | Review Us Sign Maker: use the Enjoyed your visit starter with your own business name and review link, then try Connect with us with three real links; make the tent PDF, print at Actual size, cut and fold it, and scan both faces with two phones | | |
| L36 | Bulk Letter Maker: use the Fee reminder starter with your own list as an Excel file (include a date column and a phone number starting with 0), check the What we read panel against your sheet, make the PDF and the zip, and print one letter at Actual size | | |
| L37 | Gantt Chart Excel Maker: use the Website launch starter, download the Excel file and open it in Excel or Google Sheets: check the bars, the yellow today column, a late task in red, the Owners sheet, and that changing a date or Done % moves the bars | | |
| L38 | Attendance Register Excel Maker: use the Office starter with 3 months and two holidays, download the Excel file and open it: mark some days with the drop-down and check the weekends and holidays are grey, the totals and attendance percentage update, and the Summary sheet adds the months | | |
| L39 | Invoice Excel Template Maker: use the Freelancer starter, add one tax and your own item and customer lists, download the Excel file and open it: pick a customer and items, check the totals by hand, print the Invoice sheet, and add a line to the Invoice Log | | |
| L40 | Monthly Delivery Bill Excel Maker: use the Milk starter with your own customer list as an Excel file, download the workbook and open it: change a few days, type a payment, print one bill, and click a WhatsApp reminder link to check the message and phone number | | |
| L41 | Excel template makers section: open the section page from the home hero tile, check all fifteen tools are listed, the FAQ links work, and each workbook tool's top link returns to this page | | |
| L42 | Home page hero: headline, description, and all 16 topic tiles with their short lines of jobs. Check they fit on a phone (two lines at most) and each tile opens its section | | |
| L43 | Home search: merge, split, compress, qr, emi, invoice, excel, reduce pdf size. The tool named for the word is first and the list is short and relevant | | |
| L44 | Topic pages: open all 16 topic pages and read the line under the heading and the common questions; open two tools from each task table. Then search sign pdf, habit tracker, barcode and random teams | | |
| L45 | Stock Register Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L46 | Credit Ledger (Udhaar Khata) Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L47 | Timesheet Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L48 | Fees and Rent Tracker Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L49 | Daily Cash Book Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L50 | Budget Planner Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L51 | Supplier Payment Tracker Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows on the log sheet and check totals, statuses and colours match by hand; try Blank and With sample data; tap Start again | | |
| L52 | Lead and Enquiry Tracker Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows and check totals, flags and colours match by hand; try Blank and With sample data; tap Start again | | |
| L53 | Expense Claim Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows and check totals, flags and colours match by hand; try Blank and With sample data; tap Start again | | |
| L54 | Job and Order Tracker Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows and check totals, flags and colours match by hand; try Blank and With sample data; tap Start again | | |
| L55 | Vehicle Log Book Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows and check totals, flags and colours match by hand; try Blank and With sample data; tap Start again | | |
| L56 | Marks and Rank Sheet Excel Maker: pick a starter, add your own list, download the Excel file and open it in Excel, Google Sheets or WPS: enter a few rows and check totals, flags and colours match by hand; try Blank and With sample data; tap Start again | | |
| L58 | Cover Letter Word Maker: pick each starter, change a few boxes, check the preview, make the Word file and open it in Word, Google Docs or WPS: text, bullets, tables and dates match the preview; tap Start again | | |
| L59 | Resignation Letter Word Maker: pick each starter, change a few boxes, check the preview, make the Word file and open it in Word, Google Docs or WPS: text, bullets, tables and dates match the preview; tap Start again | | |
| L60 | Leave Application Word Maker: pick each starter, change a few boxes, check the preview, make the Word file and open it in Word, Google Docs or WPS: text, bullets, tables and dates match the preview; tap Start again | | |
| L61 | Meeting Minutes Word Maker: pick each starter, change a few boxes, check the preview, make the Word file and open it in Word, Google Docs or WPS: text, bullets, tables and dates match the preview; tap Start again | | |
| L62 | Notice and Circular Word Maker: pick each starter, change a few boxes, check the preview, make the Word file and open it in Word, Google Docs or WPS: text, bullets, tables and dates match the preview; tap Start again | | |
| L63 | Word document makers section: open it from the home hero tile, check the five document makers are listed, the FAQ links work, and each tool's top link returns here | | |
| L84 | Resume Builder (/resume-builder): fill the sample, tap Download Word (.docx) with a Classic and a Modern design, open it in Word, Google Docs or WPS: the words, dates, bullets and colour match, one single column | | |
| L85 | Word makers: the preview fits the phone width with no sideways scroll; View larger opens a bigger page you can scroll and pinch, and Close or Escape closes it | | |
| L86 | Word makers: change some boxes, tap Start again twice: everything goes back to the starter text, the page scrolls to the top and a message says so | | |
| L87 | Leave Tracker Excel Maker: pick each starter, paste or upload a list, download blank and with sample data, open in Excel, Google Sheets or WPS: formulas, drop-downs, colours and charts work; tap Start again | | |
| L88 | Daily Sales Report Excel Maker: pick each starter, paste or upload a list, download blank and with sample data, open in Excel, Google Sheets or WPS: formulas, drop-downs, colours and charts work; tap Start again | | |
| L89 | Loan and EMI Tracker Excel Maker: pick each starter, paste or upload a list, download blank and with sample data, open in Excel, Google Sheets or WPS: formulas, drop-downs, colours and charts work; tap Start again | | |
| L90 | Word makers designs: on the cover letter, leave application, minutes, notice and one long template, tap each of the 12 designs; the preview changes colours, font, title block and headings; download and open in Word, Google Docs or WPS: the same look, headings still appear in the Navigation pane | | |
| L91 | PowerPoint makers designs: on two PowerPoint makers tap each of the 12 designs; the preview and the downloaded .pptx match (title slide, headings, bullets, tables); change the font after choosing a design; dark and bold designs are readable | | |
| L92 | Wording: the Word, PowerPoint and Excel hubs and the home groups say no Word, PowerPoint or Excel is needed; each tool FAQ has "Do I need Word/PowerPoint to make this?" | | |
| L93 | Marketing Plan Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L94 | Lesson Plan Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L95 | Seminar Report Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L96 | Product Requirements Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L97 | Training Manual Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L98 | Grant Proposal Word Template: change the title boxes, tick and untick sections, edit a section, pick a design, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; tap Start again | | |
| L99 | PowerPoint makers new starters: on each of the eight tools pick every new starter; the outline fills in, the preview shows every slide, the .pptx opens in PowerPoint, Google Slides or WPS; quiz answers match the questions; Start again returns to the picked starter | | |
| L100 | Invitation Card Maker: every occasion and a sample of designs and sizes; edit all boxes, long text shrinks to fit; colours, fonts, text size, decorations and frame off; photo in three shapes with zoom and move; download PNG, JPG and PDF and open them; Hindi text; Start again | | |
| L101 | Product Catalogue Maker: shop details remembered; many photos at once; edit every product box; sections; move, copy, delete; all layouts and page sizes; designs, colours, fonts, currency; toggles and logo; page preview; download PDF and ZIP and open them; Hindi text; Start again | | |
| L102 | Tournament fixtures: once, twice, three and four times; print sheet and preview; points table and players page; entered scores on and off; knockout byes | | |
| L103 | Print credit line: on and off, grey bottom-left on every page, not over the sheet, choice remembered, off by default on invoices, quotations, rent receipts and resumes | | |
| L64 | Project Proposal Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L65 | Project Report Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L66 | Business Plan Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L67 | SOP Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L68 | Job Description Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L69 | Company Policy Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L70 | Case Study Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L71 | Internship Report Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L72 | Event Plan Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L73 | Status Report Word Template: change the title boxes, tick and untick sections, edit a section, add your own, make the Word file and open it in Word, Google Docs or WPS: cover page, contents list, numbered headings, bullets and tables match the preview; update the contents list; tap Start again | | |
| L74 | Word document makers section: the hero tile says Resume, letters, templates; fifteen tools are listed; the new FAQ links work | | |
| L75 | Text to PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L76 | Pitch Deck PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L77 | Business Proposal PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L78 | Lesson PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L79 | Project Status PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L80 | School Project PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L81 | Quiz PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L82 | Event Programme PowerPoint Maker: pick each starter, edit the outline, change the look, make the PowerPoint file and open it in PowerPoint, Google Slides or WPS: titles, bullets and tables match the preview; tap Start again | | |
| L83 | PowerPoint makers section: open it from the home hero tile, check eight tools are listed, the FAQ links work, and each tool's top link returns here | | |

### Section pages: guides, common questions, related sections (22 Nov)

| # | Check | Result | Notes |
|---|---|---|---|
| M1 | All 14 section pages show guides, 5 questions and related sections | | |
| M2 | Questions open and close on a phone, no clipped text | | |
| M3 | Three new guides open and list working "Try it" tools | | |
| M4 | Passport photo guide shows the rejection-message section | | |
| M5 | Pre-rendered HTML has the same questions | | |

### Information pages: left-aligned header (23 Nov)

| # | Check | Result | Notes |
|---|---|---|---|
| N1 | All information pages have a left-aligned header, back link and pill | | |
| N2 | 404 page matches | | |

### Linked answers (23 Nov)

| # | Check | Result | Notes |
|---|---|---|---|
| O1 | Tool links in all 14 sections' questions open the right tool | | |
| O2 | Guides link first mention of each tool once | | |
| O3 | Tool pages link other tools, never themselves | | |
| O4 | Older iPhone or Safari loads these pages | | |
| O5 | Pre-rendered HTML shows no { } markers | | |

### Exercise library, yoga and Build me a workout (23 Nov)
| # | Check | Result | Notes |
|---|-------|--------|-------|
| P1 | 5, 10, 15, 20, 30 minute builds fill all three parts, time close to chosen | | |
| P2 | With and without equipment give different moves; no kit in no-equipment builds | | |
| P3 | Yoga focus ends with Corpse pose | | |
| P4 | Build another changes moves; Undo restores the previous plan | | |
| P5 | Yoga group shows 21 poses with two pictures each | | |
| P6 | Yoga poses can be added in Interval Timer, Routine Display and slideshow | | |
| P7 | Morning yoga and Evening wind-down quick plans load | | |
| P8 | Equipment filter label reads Bands, kettlebell, ball or other | | |
| P9 | Pictures load on a phone without slowing the page | | |

### Weekly workout plans, smoother yoga, sport rules (23 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| Q1 | All nine plans load and each day lists warm-up, main and cool-down with pictures | | |
| Q2 | Copy the whole week and Copy this day work | | |
| Q3 | Show this day on a screen opens the Workout Planner with the day filled in | | |
| Q4 | Yoga pose pictures move start, middle, hold and back in the Library, slideshow, one-screen view, Interval Timer and Routine Display | | |
| Q5 | Reduce motion shows a still start picture | | |
| Q6 | Each sport shows "How to play <sport>" and "<sport> playing rules" | | |
| Q7 | Rules read correctly for the sports you know well | | |

### Six more sports and fitness tools (23 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| R1 | Match Score Keeper scores all six sports correctly, Undo works, score survives a reload | | |
| R2 | Tournament Fixtures Maker round robin, home and away and knockout are right for 4, 5 and 8 teams | | |
| R3 | Points table order and Copy the fixtures work | | |
| R4 | Cricket Run Rate Calculator chase, net run rate and player stats are right, invalid overs are rejected | | |
| R5 | Workout Log saves, shows progress and New best, deletes and copies CSV | | |
| R6 | One-Rep Max and Plate Calculator estimates and plates are right in kg and lb | | |
| R7 | Running Pace Calculator pace, time and distance modes, miles, splits and predictions | | |
| R8 | Section page, home page, footer and menu show 12 sports and fitness tools | | |
| R9 | All six pages show guide steps, 7 FAQs and an article, with no horizontal scroll on a phone | | |

### Cricket Scorer and Quick Scoreboard (24 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| S1 | Cricket Scorer runs, wickets, wides, no-balls (free hit), byes and leg byes score correctly | | |
| S2 | Overs limit ends the innings, chase target and required rate are right | | |
| S3 | Undo and reload keep and restore the innings | | |
| S4 | Quick Scoreboard buttons for each game, fouls, clock, periods and Undo | | |
| S5 | Big screen button works where supported and is hidden otherwise | | |
| S6 | Section page, home page, footer and menu show 14 sports and fitness tools | | |
| S7 | Both pages show guide steps, 7 FAQs and an article, with no horizontal scroll on a phone | | |

### Start again buttons (24 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| T1 | Cricket Scorer New match is visible next to Undo and needs a second tap | | |
| T2 | Match Score Keeper, Quick Scoreboard and Tournament Fixtures Maker clear buttons work | | |
| T3 | Workout Log Clear my whole log, Seating Plan, Spinner Wheel and Job Description Builder | | |
| T4 | Menu, Notice, Timings, Spelling Bee, Routine, Exam Hall and Interval Timer clear or reset | | |
| T5 | The first tap turns red, goes back after 4 seconds, and a reload keeps the cleared state | | |

### Court size pages for kho kho and kabaddi (24 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| U1 | /kho-kho-court-size and /kabaddi-court-size open with the sport chosen, no sport list, no Fit tab | | |
| U2 | Sizes, diagonals and marking plan are right (kho kho 27 x 16 m; kabaddi 13 x 10, 12 x 8, 11 x 8 m) | | |
| U3 | 4 steps, 3 written sections, 8 questions; Save as image and PDF work | | |
| U4 | Page source shows heading, steps, questions, own title and canonical | | |
| U5 | Sitemap lists both; main guide links to each sport page; section FAQ links work | | |
| U6 | Search Console: sitemap submitted, both pages requested for indexing (date) | | |
| U7 | After 2-3 weeks: indexed? impressions for the two queries? (note numbers) | | |

### Court size pages for every sport (24 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| V1 | All 12 court size pages open with the sport chosen, no sport list, no Fit tab | | |
| V2 | Choosing a sport in the main guide opens its page; Show this court opens the right page and version | | |
| V3 | Sizes match a trusted source for each sport | | |
| V4 | Each page has 4 steps, 3 sections, 8 questions; own title in page source | | |
| V5 | Sitemap lists all 12; section FAQ links work; no sideways scroll at 360 px | | |
| V6 | Search Console: pages requested for indexing (date) | | |

### Tournament size pages (24 Nov)
| # | Check | Result | Notes |
|---|---|---|---|
| W1 | Round robin 6 teams: on-screen rounds match the written match list (15 matches, 5 rounds) | | |
| W2 | 5 teams rests one team per round; knockout 6 teams has 2 byes; knockout 8 has none | | |
| W3 | Scores kept after reload; main tool's own work not changed; New tournament works | | |
| W4 | Own title, 4 steps, 3 sections, 8 questions in page source; 13 pages in sitemap | | |
| W5 | Links from the main tool and the section FAQ work; no sideways scroll at 360 px | | |
