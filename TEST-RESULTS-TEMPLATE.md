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
