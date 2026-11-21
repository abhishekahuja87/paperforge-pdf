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

## J. Your own tasks (not testing, tick when done)
- [ ] Merge the PR only after `pnpm-lock.yaml` includes qr-scanner and @tesseract.js-data/hin
- [ ] Search Console: resubmit the sitemap
- [ ] Search Console: request indexing for the new tools, guides and the four collection pages
- [ ] Search Console: press Validate fix on the old 404 issues (the merged resizer pages are meant to be gone)
- [ ] AdSense: resubmit around 25 Nov after the new pages are indexed

## Anything else you noticed
(slow screens, confusing words, things you expected that were missing)

