import type { ToolIconName } from './tools';

/**
 * What the home page shows, in order. Only tool ids and layout numbers live here; the words are in en.json
 * (`homeSections`, `homeCollections`) and each tool's own title comes from its catalogue entry.
 *
 * Every available tool should appear in exactly one COLLECTION (or be a workspace). A tool that is in none still
 * shows up, under "More tools", so a newly added tool is never hidden by accident.
 */

/** "Most used" tiles. Reorder with real traffic (Search Console or Analytics) when you have it. */
/**
 * The "Our popular tools" row on the home page (the name MOST_USED is kept for the code). Mix of the everyday favourites and the tools
 * that many other sites charge for or limit (fillable PDFs, smart split, redaction, bulk photos), which are free and unlimited here.
 */
export const MOST_USED = [
  'merge-pdf', 'compress-pdf', 'make-pdf-fillable', 'smart-split-pdf', 'redact-pdf', 'income-tax-calculator',
  'emi-calculator', 'bulk-image-tools', 'social-image-resizer', 'sign-pdf', 'remove-photo-location', 'resume-builder',
];

/** Recently added tools. They get a small "New" tag on their tile in the topic lists. Drop the oldest when a new tool ships. */
export const NEW_TOOLS = [
  'notice-board-display', 'classroom-quiz-display', 'workout-planner', 'printable-meal-planner', 'rent-receipt-generator', 'price-tag-maker', 'bulk-qr-code-generator', 'offer-poster-maker', 'screenshot-redactor', 'sports-court-size-guide', 'exercise-library', 'solar-system-explorer', 'learn-the-clock', 'kids-money-shop', 'tambola-ticket-generator', 'shadow-explorer-for-kids', 'addition-with-carrying-for-kids', 'subtraction-with-borrowing-for-kids', 'json-to-csv-converter', 'json-viewer', 'resize-pdf-page-size', 'pdf-booklet-maker', 'grayscale-pdf', 'extract-images-from-pdf', 'whatsapp-chat-to-pdf', 'audio-cutter-and-joiner', 'bulk-certificate-maker', 'report-card-and-rank-list-maker', 'pdf-table-to-excel', 'omr-scanner-and-grader', 'blur-faces-or-plates-in-video', 'review-us-sign-maker', 'bulk-letter-maker'
];

/** Studio-style tools shown as a slim row. Scanning and display have their own topics below. */
export const WORKSPACES = ['master-document-studio', 'pos-invoice-studio'];

/** How many tools each topic shows on a phone before "Show more". Larger screens show every tool. */
export const COLLECTION_PREVIEW = 6;

/** Image tools named like resize-image-to-20kb are shown as small chips instead of cards. */
export const SIZE_PRESET_PATTERN = /^resize-image-to-(\d+)kb$/;

/**
 * Tools that are another tool's page opened on one option (for example the dot grid page is the paper maker opened on
 * dot grid). They have their own address for search and are linked from the main tool's option buttons, but the home
 * page shows only the main tool, so these are not listed there.
 */
export const VARIANT_PAGES = [
  'wifi-password-sign-printable', 'restaurant-menu-card-printable',
  'dot-grid-paper-generator', 'graph-paper-generator', 'cornell-notes-template', 'hexagon-graph-paper-generator', 'calligraphy-practice-sheet-generator', 'cross-stitch-pattern-grid-generator',
  'printable-calendar-maker', 'daily-planner-printable', 'daily-menu-planner-printable', 'monthly-menu-planner-printable',
  'health-log-sheet-printable', 'emergency-info-card-printable', 'doctor-visit-sheet-printable', 'caregiver-daily-log-printable',
  'monthly-household-budget-sheet-printable', 'warranty-service-record-printable', 'udhaar-credit-ledger-printable', 'daily-cash-sales-sheet-printable', 'stock-count-sheet-printable', 'pet-vaccination-tracker-printable', 'pet-sitter-instructions-printable',
  'lock-a-file-with-password',
  'times-table-worksheet-printable', 'word-search-generator-printable', 'sudoku-puzzle-printable', 'handwriting-tracing-sheet-printable', 'bingo-card-generator-printable', 'certificate-of-participation-printable', 'certificate-of-appreciation-printable', 'course-completion-certificate-printable', 'sports-winner-certificate-printable', 'perfect-attendance-certificate-printable', 'employee-of-the-month-certificate-printable', 'best-student-certificate-printable', 'school-book-label-printable', 'kids-name-labels-printable', 'spice-jar-label-printable', 'address-label-printable', 'storage-box-and-file-label-printable', 'freezer-food-date-label-printable', 'gift-tag-printable', 'table-place-card-printable', 'wedding-seating-chart-printable', 'general-body-meeting-notice-printable', 'maintenance-collection-reminder-notice-printable', 'water-supply-interruption-notice-printable', 'festival-celebration-notice-printable', 'office-circular-template-printable', 'gate-pass-printable', 'society-maintenance-collection-register-printable', 'parking-slot-allotment-register-printable', 'society-complaint-register-printable', 'key-register-printable', 'meeting-agenda-template-printable', 'social-media-post-planner-printable', 'invoice-tracker-printable', 'freelance-project-tracker-printable', 'client-contact-list-printable',
  'revision-planner-printable', 'assignment-tracker-printable', 'weekly-study-timetable-printable', 'reading-log-printable', 'chapter-syllabus-checklist-printable', 'guest-list-rsvp-tracker-printable', 'wedding-planning-checklist-printable', 'event-budget-planner-printable', 'party-planning-checklist-printable', 'festival-gift-list-printable', 'kitty-party-tracker-printable', 'baby-sleep-log-printable', 'baby-diaper-log-printable', 'kids-chore-chart-printable', 'pocket-money-tracker-printable', 'birthday-anniversary-list-printable', 'fuel-mileage-log-printable', 'vehicle-document-tracker-printable', 'home-maintenance-log-printable', 'home-service-contacts-printable', 'home-inventory-list-printable', 'rent-payment-record-printable', 'utility-bill-tracker-printable', 'monthly-expense-tracker-printable', 'savings-goal-tracker-printable', 'travel-packing-list-printable', 'travel-itinerary-planner-printable', 'grocery-shopping-list-printable', 'subscription-tracker-printable', 'workout-log-printable', 'petty-cash-voucher-printable', 'meeting-minutes-template-printable', 'weekly-timesheet-printable', 'visitor-register-printable',
  'student-marks-register-printable', 'weekly-lesson-plan-printable', 'class-timetable-printable', 'homework-diary-printable', 'parent-teacher-meeting-sheet-printable', 'washroom-cleaning-checklist-printable', 'lift-cleaning-checklist-printable', 'room-cleaning-checklist-printable', 'pantry-kitchen-cleaning-checklist-printable', 'society-common-area-cleaning-checklist-printable', 'washroom-hourly-cleaning-log-printable', 'water-tank-cleaning-record-printable', 'deep-cleaning-planner-printable',
];

export interface CollectionSpec {
  id: string;
  icon: ToolIconName;
  tools: string[];
}

export const COLLECTIONS: CollectionSpec[] = [
  { id: 'pdf', icon: 'file-text', tools: [
    'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'organize-pdf', 'image-to-pdf', 'digitize-documents', 'pdf-to-images', 'extract-text', 'add-page-numbers',
    'watermark-pdf', 'crop-pdf', 'protect-pdf', 'unlock-pdf', 'sanitize-pdf', 'flatten-pdf', 'n-up-pdf', 'inspect-pdf', 'generate-sample-pdf', 'sign-pdf', 'document-scanner', 'fill-pdf', 'make-pdf-fillable', 'smart-split-pdf', 'pdf-bates-numbering', 'redact-pdf', 'compare-pdf-and-text', 'resize-pdf-page-size', 'pdf-booklet-maker', 'grayscale-pdf', 'extract-images-from-pdf', 'whatsapp-chat-to-pdf', 'pdf-table-to-excel',
  ] },
  { id: 'images', icon: 'image', tools: [
    'image-compressor', 'image-converter', 'image-resizer', 'screenshot-redactor', 'signature-maker', 'passport-photo-sheet-maker', 'photo-grid-splitter', 'photo-collage-maker', 'photo-name-date-strip', 'remove-photo-location', 'bulk-image-tools', 'social-image-resizer', 'invitation-card-maker', 'gif-maker', 'background-remover',
  ] },
  { id: 'tax', icon: 'receipt', tools: [
    'income-tax-calculator', 'salary-calculator', 'hra-calculator', 'gst-calculator', 'gratuity-calculator', 'epf-calculator',
  ] },
  { id: 'invest', icon: 'calculator', tools: [
    'emi-calculator', 'sip-calculator', 'lumpsum-calculator', 'fd-calculator', 'rd-calculator', 'ppf-calculator', 'cagr-calculator', 'simple-compound-interest-calculator', 'inflation-calculator',
  ] },
  { id: 'everyday', icon: 'hash', tools: [
    'age-calculator', 'date-difference-calculator', 'percentage-calculator', 'discount-calculator', 'unit-converter', 'bill-splitter', 'time-zone-converter', 'number-to-words', 'secret-santa-generator', 'random-name-picker', 'random-team-generator'
  ] },
  { id: 'sports', icon: 'dumbbell', tools: [
    'sports-court-size-guide', 'cricket-scorer', 'quick-scoreboard', 'match-score-keeper', 'tournament-fixtures-maker', 'cricket-run-rate-calculator', 'exercise-library', 'workout-planner', 'weekly-workout-plans', 'workout-log', 'one-rep-max-and-plate-calculator', 'running-pace-calculator', 'bmi-calculator',
  ] },
  { id: 'printables', icon: 'layers', tools: [
    'printable-paper-maker', 'printable-planner-maker', 'printable-meal-planner', 'printable-flashcard-maker', 'medicine-schedule-chart-printable', 'milk-maid-attendance-calendar-printable', 'pet-health-record-card-printable', 'weekly-cleaning-schedule-printable', 'wedding-shagun-register-printable', 'baby-feeding-log-printable', 'habit-tracker-printable', 'certificate-of-achievement-printable', 'name-tag-sticker-sheet-printable', 'recipe-card-printable', 'rangoli-dot-grid-printable',
    'vehicle-service-log-printable', 'bulk-certificate-maker',
  ] },
  { id: 'work', icon: 'receipt', tools: [
    'resume-builder', 'job-description-builder', 'notice-period-calculator', 'upload-file-checker', 'freelance-rate-calculator', 'quotation-generator', 'margin-markup-calculator', 'gst-invoice-generator', 'rent-receipt-generator',
    'offer-poster-maker', 'product-catalogue-maker', 'price-tag-maker', 'visiting-card-maker', 'staff-attendance-register-printable', 'tuition-fee-register-printable', 'office-cleaning-checklist-printable', 'customer-order-register-printable', 'society-notice-template-printable', 'content-calendar-printable', 'door-sign-printable', 'stamp-maker', 'id-card-maker-printable', 'upi-payment-qr-stand-printable', 'review-us-sign-maker', 'bulk-letter-maker'
  ] },
  { id: 'excel', icon: 'grid', tools: [
    'gantt-chart-excel-maker', 'attendance-register-excel-maker', 'invoice-excel-template-maker', 'delivery-bill-excel-maker', 'stock-register-excel-maker', 'credit-ledger-excel-maker', 'timesheet-excel-maker', 'fees-rent-tracker-excel-maker', 'daily-cash-book-excel-maker', 'budget-planner-excel-maker', 'supplier-payment-tracker-excel-maker', 'lead-tracker-excel-maker', 'expense-claim-excel-maker', 'job-order-tracker-excel-maker', 'vehicle-log-book-excel-maker', 'marks-rank-sheet-excel-maker', 'leave-tracker-excel-maker', 'daily-sales-report-excel-maker', 'loan-emi-tracker-excel-maker'
  ] },
  { id: 'word', icon: 'file-text', tools: [
    'cover-letter-word-maker', 'resignation-letter-word-maker', 'leave-application-word-maker', 'meeting-minutes-word-maker', 'notice-word-maker', 'project-proposal-word-template', 'project-report-word-template', 'business-plan-word-template', 'sop-word-template', 'job-description-word-template', 'company-policy-word-template', 'case-study-word-template', 'internship-report-word-template', 'event-plan-word-template', 'status-report-word-template', 'marketing-plan-word-template', 'lesson-plan-word-template', 'seminar-report-word-template', 'product-requirements-word-template', 'training-manual-word-template', 'grant-proposal-word-template'
  ] },
  { id: 'ppt', icon: 'presentation', tools: [
    'text-to-powerpoint-maker', 'pitch-deck-powerpoint-maker', 'business-proposal-powerpoint-maker', 'lesson-powerpoint-maker', 'project-status-powerpoint-maker', 'school-project-powerpoint-maker', 'quiz-powerpoint-maker', 'event-programme-powerpoint-maker'
  ] },
  { id: 'present', icon: 'presentation', tools: ['display-studio', 'interval-circuit-timer', 'step-by-step-routine-display', 'exam-hall-display', 'menu-board-display', 'queue-token-display', 'daily-timings-board', 'spelling-bee-display', 'notice-board-display', 'spinner-wheel-display', 'lucky-draw-display', 'team-scoreboard-display', 'classroom-seating-plan-display', 'classroom-quiz-display'] },
  { id: 'study', icon: 'type', tools: [
    'gpa-cgpa-calculator', 'final-grade-calculator', 'citation-generator', 'study-planner', 'word-counter', 'case-converter', 'class-attendance-register-printable', 'exam-timetable-planner-printable', 'omr-answer-sheet-printable', 'omr-scanner-and-grader', 'question-paper-template-printable', 'report-card-and-rank-list-maker'
  ] },
  { id: 'kids', icon: 'clock', tools: [
    'learn-the-clock', 'addition-with-carrying-for-kids', 'subtraction-with-borrowing-for-kids', 'long-multiplication-for-kids', 'long-division-for-kids', 'kids-money-shop', 'tambola-ticket-generator', 'shadow-explorer-for-kids', 'solar-system-explorer', 'math-worksheet-generator-printable', 'maze-generator-printable',
  ] },
  { id: 'sharing', icon: 'grid', tools: [
    'password-protected-document-maker', 'qr-code-generator', 'qr-code-scanner', 'bulk-qr-code-generator', 'wifi-qr-code-generator', 'vcard-qr-code-generator', 'vcard-to-csv-converter',
    'whatsapp-link-generator',
    'barcode-generator',
  ] },
  { id: 'media', icon: 'layers', tools: [
    'audio-cutter-and-joiner', 'globe-video-maker', 'handwriting-video-maker', 'sequence-diagram-video-maker', 'explainer-video-maker', 'region-map-video-maker', 'chart-reveal-video-maker', 'photo-story-video-maker', 'tap-to-time-captions', 'audio-clip-video-maker', 'app-demo-video-maker', 'speak-to-captions-video-maker', 'video-compressor-and-trimmer', 'burn-subtitles-into-video', 'voice-noise-remover', 'screen-recorder-with-face', 'teleprompter-with-video-recording', 'whiteboard-lesson-recorder', 'before-and-after-video-maker', 'blur-faces-or-plates-in-video',
  ] },
  { id: 'dev', icon: 'file-code', tools: [
    'json-formatter', 'json-viewer', 'json-to-csv-converter', 'base64-tool', 'url-encoder-decoder', 'timestamp-converter', 'uuid-generator', 'color-converter', 'password-generator', 'lorem-ipsum-generator',
  ] },
];
