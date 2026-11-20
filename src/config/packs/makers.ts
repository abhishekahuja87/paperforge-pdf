import makers from '../../locales/packs/makers.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Worksheets, puzzles, certificates, labels, notices and society and creator sheets on the shared records maker (components/tools/records). Puzzles and worksheets are made from a puzzle number (lib/records/rng.ts). Records and templates only: no legal, tax or safety rules. */
export const MAKERS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'math-worksheet-generator-printable', kind: 'mkMathWorksheetGenerator', guideKey: 'mathWorksheetGeneratorGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['maths worksheet generator', 'addition worksheet printable', 'subtraction worksheet maker', 'multiplication worksheet printable', 'division worksheet generator', 'math practice sheet', 'random maths worksheet', 'free printable maths sheets', 'worksheet maker for kids', 'sums worksheet with answers'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'times-table-worksheet-printable', kind: 'mkTimesTableWorksheet', guideKey: 'timesTableWorksheetGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['times table worksheet', 'multiplication table printable', 'times tables practice sheet', 'multiplication chart printable', 'tables 2 to 20 printable', 'multiplication worksheet for kids', 'table practice sheet', 'learn tables worksheet', 'mixed order tables practice', 'tables chart for kids'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'word-search-generator-printable', kind: 'mkWordSearchGenerator', guideKey: 'wordSearchGeneratorGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['word search generator', 'word search maker free', 'make your own word search', 'printable word search', 'custom word search puzzle', 'word search for kids', 'classroom word search', 'word find puzzle maker', 'word search with answers', 'vocabulary word search'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'maze-generator-printable', kind: 'mkMazeGenerator', guideKey: 'mazeGeneratorGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['maze generator printable', 'printable mazes for kids', 'maze maker free', 'random maze printable', 'easy maze for kids', 'hard maze printable', 'maze puzzle worksheet', 'maze with answer', 'kids maze worksheets', 'activity sheet maze'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'sudoku-puzzle-printable', kind: 'mkSudokuPuzzle', guideKey: 'sudokuPuzzleGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['sudoku printable', 'printable sudoku puzzles', 'easy sudoku for kids', 'sudoku 4x4 printable', 'sudoku 6x6 printable', 'hard sudoku printable', 'sudoku with answers', 'sudoku generator', 'free sudoku sheets', 'sudoku puzzle maker'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'handwriting-tracing-sheet-printable', kind: 'mkHandwritingTracingSheet', guideKey: 'handwritingTracingSheetGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['handwriting tracing sheet', 'name tracing worksheet printable', 'alphabet tracing printable', 'number tracing sheet', 'letter tracing worksheet', 'handwriting practice for kids', 'tracing words printable', 'preschool tracing sheet', 'write your name practice', 'custom tracing sheet maker'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'bingo-card-generator-printable', kind: 'mkBingoCardGenerator', guideKey: 'bingoCardGeneratorGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['bingo card generator', 'custom bingo cards printable', 'bingo maker free', 'classroom bingo cards', 'party bingo printable', 'baby shower bingo', 'vocabulary bingo cards', 'bingo card maker for kids', '5x5 bingo card printable', 'word bingo generator'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'omr-answer-sheet-printable', kind: 'mkOmrAnswerSheet', guideKey: 'omrAnswerSheetGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['omr sheet printable', 'omr answer sheet pdf', 'bubble answer sheet printable', 'mcq answer sheet', 'exam answer sheet template', 'omr sheet 100 questions', 'omr sheet for practice', 'test answer sheet printable', 'mock test omr sheet', 'optical mark sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'rangoli-dot-grid-printable', kind: 'mkRangoliDotGrid', guideKey: 'rangoliDotGridGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['rangoli dot grid printable', 'rangoli dots practice sheet', 'kolam dots printable', 'rangoli design practice', 'diamond dot pattern', 'rangoli dot patterns', 'rangoli sheet for kids', 'pulli kolam dots', 'festival rangoli practice', 'dot grid for rangoli'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'recipe-card-printable', kind: 'mkRecipeCard', guideKey: 'recipeCardGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['recipe card printable', 'blank recipe cards', 'family recipe card template', 'recipe page printable', 'recipe card 4x6 printable', 'cookbook page template', 'recipe template for kitchen', 'handwritten recipe card', 'recipe organiser sheets', 'recipe card with lines'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'certificate-of-achievement-printable', kind: 'mkCertificateOfAchievement', guideKey: 'certificateOfAchievementGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['certificate of achievement printable', 'achievement certificate template', 'printable achievement award', 'school achievement certificate', 'award certificate template', 'certificate for kids', 'certificate of excellence printable', 'free certificate maker', 'editable certificate pdf', 'achievement award certificate'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'certificate-of-participation-printable', kind: 'mkCertificateOfParticipation', guideKey: 'certificateOfParticipationGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['certificate of participation printable', 'participation certificate template', 'event participation certificate', 'school competition certificate', 'workshop participation certificate', 'free participation certificate', 'certificate for all participants', 'participant certificate pdf', 'sports day participation certificate', 'printable participation award'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'certificate-of-appreciation-printable', kind: 'mkCertificateOfAppreciation', guideKey: 'certificateOfAppreciationGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['certificate of appreciation printable', 'appreciation certificate template', 'thank you certificate printable', 'volunteer appreciation certificate', 'certificate of gratitude', 'staff appreciation certificate', 'printable appreciation award', 'teacher appreciation certificate', 'society appreciation certificate', 'free appreciation certificate'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'course-completion-certificate-printable', kind: 'mkCourseCompletionCertificate', guideKey: 'courseCompletionCertificateGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['course completion certificate template', 'certificate of completion printable', 'workshop completion certificate', 'training completion certificate', 'class completion certificate', 'internship certificate template', 'summer camp certificate', 'free course certificate maker', 'certificate for training program', 'printable completion certificate'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'sports-winner-certificate-printable', kind: 'mkSportsWinnerCertificate', guideKey: 'sportsWinnerCertificateGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['sports certificate template', 'sports winner certificate printable', 'sports day certificate', 'first prize certificate', 'winner certificate printable', 'school sports certificate', 'athletics certificate template', 'medal certificate printable', 'certificate of merit sports', 'tournament certificate template'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'perfect-attendance-certificate-printable', kind: 'mkPerfectAttendanceCertificate', guideKey: 'perfectAttendanceCertificateGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['perfect attendance certificate', 'attendance award certificate printable', 'school attendance certificate', '100 percent attendance certificate', 'attendance certificate template', 'printable attendance award', 'monthly attendance award', 'class attendance certificate', 'punctuality certificate', 'attendance recognition certificate'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'employee-of-the-month-certificate-printable', kind: 'mkEmployeeOfTheMonthCertificate', guideKey: 'employeeOfTheMonthCertificateGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['employee of the month certificate', 'employee recognition certificate printable', 'star employee certificate', 'staff award certificate template', 'employee award template', 'best employee certificate', 'team member of the month certificate', 'workplace recognition certificate', 'office award certificate', 'printable employee award'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'best-student-certificate-printable', kind: 'mkBestStudentCertificate', guideKey: 'bestStudentCertificateGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['best student certificate', 'star student certificate printable', 'student of the month certificate', 'class topper certificate', 'outstanding student certificate', 'excellence award certificate for students', 'student award template', 'school award certificate printable', 'good conduct certificate', 'student of the year certificate'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'name-tag-sticker-sheet-printable', kind: 'mkNameTagStickerSheet', guideKey: 'nameTagStickerSheetGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['name tag printable', 'hello my name is sticker printable', 'name tag template', 'name badge printable', 'event name tags', 'class name tags', 'party name tags', 'printable name labels', 'name tags for school', 'name sticker sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'school-book-label-printable', kind: 'mkSchoolBookLabel', guideKey: 'schoolBookLabelGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['school book label printable', 'notebook label template', 'book name label printable', 'school notebook stickers', 'name label for books', 'class and subject label', 'printable school labels', 'book cover label', 'exercise book label', 'student label sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'kids-name-labels-printable', kind: 'mkKidsNameLabels', guideKey: 'kidsNameLabelsGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['kids name labels printable', 'name stickers for school items', 'water bottle label printable', 'lunch box name label', 'pencil name labels', 'daycare name labels', 'small name labels sheet', 'uniform name tags', 'school supplies labels', 'children name stickers'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'spice-jar-label-printable', kind: 'mkSpiceJarLabel', guideKey: 'spiceJarLabelGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['spice jar label printable', 'pantry label printable', 'kitchen jar labels', 'masala dabba labels', 'rice dal jar labels', 'grocery container labels', 'kitchen storage labels', 'printable spice labels', 'jar label template', 'labels for kitchen containers'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'address-label-printable', kind: 'mkAddressLabel', guideKey: 'addressLabelGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['address label printable', 'shipping label template', 'parcel address label', 'envelope address labels', 'to address sticker printable', 'courier address label', 'address sticker sheet', 'mailing labels printable', 'return address labels', 'small business address labels'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'storage-box-and-file-label-printable', kind: 'mkStorageBoxAndFileLabel', guideKey: 'storageBoxAndFileLabelGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['file label printable', 'storage box labels', 'folder label template', 'shelf label printable', 'cupboard labels', 'office file labels', 'home organisation labels', 'wardrobe storage labels', 'filing label stickers', 'printable organizing labels'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'freezer-food-date-label-printable', kind: 'mkFreezerFoodDateLabel', guideKey: 'freezerFoodDateLabelGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['freezer label printable', 'food date label', 'leftover food label', 'fridge container labels', 'meal prep labels', 'freezer meal labels', 'kitchen date labels', 'food storage labels', 'use by date label', 'homemade food label'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'gift-tag-printable', kind: 'mkGiftTag', guideKey: 'giftTagGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['gift tag printable', 'to from gift tags', 'printable gift labels', 'birthday gift tag', 'diwali gift tag printable', 'wedding favour tags', 'christmas gift tags printable', 'gift tag template', 'present tags', 'hamper labels'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'table-place-card-printable', kind: 'mkTablePlaceCard', guideKey: 'tablePlaceCardGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['place card printable', 'table name cards', 'wedding place cards', 'party place cards template', 'seating name cards', 'dinner place cards', 'guest name cards printable', 'name cards for tables', 'reserved cards', 'event place card'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'door-sign-printable', kind: 'mkDoorSign', guideKey: 'doorSignGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['door sign printable', 'open closed sign printable', 'welcome sign template', 'shop sign printable', 'back in 10 minutes sign', 'please knock sign', 'reserved sign printable', 'staff only sign', 'silence please sign', 'meeting in progress sign'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'wedding-seating-chart-printable', kind: 'mkWeddingSeatingChart', guideKey: 'weddingSeatingChartGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['seating chart printable', 'wedding seating plan template', 'table seating chart', 'party seating plan', 'reception seating chart', 'guest table plan', 'banquet seating chart', 'seating arrangement sheet', 'event table plan', 'family dinner seating chart'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'society-notice-template-printable', kind: 'mkSocietyNoticeTemplate', guideKey: 'societyNoticeTemplateGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['society notice template', 'notice format for society', 'rwa notice printable', 'notice board notice template', 'apartment notice format', 'residents notice sample', 'housing society notice', 'general notice template', 'notice template printable', 'notice for residents'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'general-body-meeting-notice-printable', kind: 'mkGeneralBodyMeetingNotice', guideKey: 'generalBodyMeetingNoticeGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['general body meeting notice', 'agm notice format', 'society meeting notice template', 'meeting notice printable', 'rwa meeting notice', 'notice of meeting sample', 'association meeting notice', 'committee meeting notice', 'club meeting notice', 'meeting invite notice'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'maintenance-collection-reminder-notice-printable', kind: 'mkMaintenanceCollectionReminderNotice', guideKey: 'maintenanceCollectionReminderNoticeGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['maintenance reminder notice', 'society maintenance due notice', 'maintenance charges reminder', 'rwa dues reminder', 'apartment maintenance notice', 'pending maintenance notice', 'society payment reminder', 'polite reminder notice', 'maintenance notice format', 'dues notice printable'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'water-supply-interruption-notice-printable', kind: 'mkWaterSupplyInterruptionNotice', guideKey: 'waterSupplyInterruptionNoticeGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['water supply notice', 'water shut off notice', 'society water notice', 'water tank cleaning notice', 'planned maintenance notice', 'power cut notice', 'lift maintenance notice', 'notice for interruption', 'temporary closure notice', 'building work notice'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'festival-celebration-notice-printable', kind: 'mkFestivalCelebrationNotice', guideKey: 'festivalCelebrationNoticeGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['festival notice for society', 'diwali celebration notice', 'society event notice', 'holi celebration notice', 'ganesh utsav notice', 'navratri garba notice', 'cultural event notice', 'community event invitation', 'annual day notice', 'resident event invitation'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'office-circular-template-printable', kind: 'mkOfficeCircularTemplate', guideKey: 'officeCircularTemplateGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['office circular template', 'circular format for staff', 'company circular printable', 'office notice format', 'staff announcement template', 'internal circular sample', 'hr circular template', 'circular letter format', 'notice to employees', 'office memo template'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'gate-pass-printable', kind: 'mkGatePass', guideKey: 'gatePassGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['gate pass format', 'visitor gate pass printable', 'gate pass template', 'society gate pass', 'office visitor pass', 'security gate pass', 'vehicle gate pass', 'entry pass printable', 'visitor slip format', 'gate pass book'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'society-maintenance-collection-register-printable', kind: 'mkSocietyMaintenanceCollectionRegister', guideKey: 'societyMaintenanceCollectionRegisterGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['maintenance collection register', 'society maintenance register printable', 'flat wise maintenance sheet', 'rwa collection register', 'apartment dues register', 'maintenance receipt record', 'society accounts register', 'monthly maintenance tracker', 'flat dues tracker', 'housing society collection sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'parking-slot-allotment-register-printable', kind: 'mkParkingSlotAllotmentRegister', guideKey: 'parkingSlotAllotmentRegisterGuide', category: 'business', icon: 'hash', tier: 'more',
    keywords: ['parking slot register', 'society parking register', 'vehicle register printable', 'parking allotment sheet', 'apartment parking record', 'vehicle sticker register', 'parking slot chart', 'rwa vehicle record', 'office parking register', 'two wheeler four wheeler register'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'society-complaint-register-printable', kind: 'mkSocietyComplaintRegister', guideKey: 'societyComplaintRegisterGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['complaint register printable', 'society complaint register', 'resident complaint format', 'complaint log sheet', 'maintenance complaint register', 'office complaint register', 'customer complaint log', 'issue tracking register', 'complaint book format', 'helpdesk register'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'key-register-printable', kind: 'mkKeyRegister', guideKey: 'keyRegisterGuide', category: 'business', icon: 'lock', tier: 'more',
    keywords: ['key register printable', 'key issue register', 'key movement register', 'key log sheet', 'society key register', 'office key record', 'key handover register', 'key control register', 'equipment issue register', 'key return log'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'meeting-agenda-template-printable', kind: 'mkMeetingAgendaTemplate', guideKey: 'meetingAgendaTemplateGuide', category: 'business', icon: 'clock', tier: 'more',
    keywords: ['meeting agenda template', 'meeting agenda printable', 'agenda sheet', 'team meeting agenda', 'committee meeting agenda', 'society meeting agenda', 'agenda format for meeting', 'meeting planner sheet', 'office meeting agenda', 'weekly meeting agenda'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'content-calendar-printable', kind: 'mkContentCalendar', guideKey: 'contentCalendarGuide', category: 'business', icon: 'clock', tier: 'more',
    keywords: ['content calendar printable', 'social media content calendar', 'instagram content planner printable', 'posting schedule template', 'content planner for creators', 'social media planner sheet', 'content ideas tracker', 'youtube content planner', 'reels planner printable', 'small business content calendar'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'social-media-post-planner-printable', kind: 'mkSocialMediaPostPlanner', guideKey: 'socialMediaPostPlannerGuide', category: 'business', icon: 'clock', tier: 'more',
    keywords: ['social media planner printable', 'weekly social media schedule', 'social media post planner', 'posting schedule by platform', 'weekly content planner', 'instagram facebook planner', 'social media weekly template', 'creator weekly planner', 'business social media schedule', 'posting plan sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'invoice-tracker-printable', kind: 'mkInvoiceTracker', guideKey: 'invoiceTrackerGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['invoice tracker printable', 'invoice log template', 'freelancer invoice tracker', 'payment tracking sheet', 'accounts receivable log', 'client payment tracker', 'invoice register printable', 'unpaid invoices list', 'small business invoice log', 'billing tracker sheet'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'freelance-project-tracker-printable', kind: 'mkFreelanceProjectTracker', guideKey: 'freelanceProjectTrackerGuide', category: 'business', icon: 'briefcase', tier: 'more',
    keywords: ['freelance project tracker', 'client project tracker printable', 'project deadline tracker', 'freelancer work log', 'client work tracker', 'project status sheet', 'freelance planner printable', 'project fee tracker', 'work in progress tracker', 'small agency project tracker'],
  }, makers.toolCatalog),
  definePackTool({
    id: 'client-contact-list-printable', kind: 'mkClientContactList', guideKey: 'clientContactListGuide', category: 'business', icon: 'contact', tier: 'more',
    keywords: ['client contact list printable', 'customer contact sheet', 'vendor contact list', 'business contact list template', 'phone directory printable', 'customer list sheet', 'client database printable', 'address book printable', 'contacts register', 'supplier list template'],
  }, makers.toolCatalog),
];
