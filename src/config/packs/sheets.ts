import sheets from '../../locales/packs/sheets.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Forty more printable sheets on the shared records maker (components/tools/records): study, events, baby and family, vehicle and home, and everyday life and small business. Records only: no medical, tax, labour or legal rules. */
export const SHEETS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'exam-timetable-planner-printable', kind: 'shExamTimetablePlanner', guideKey: 'examTimetablePlannerGuide', category: 'everyday', icon: 'clock', tier: 'popular',
    keywords: ['exam timetable printable', 'exam date sheet template', 'exam schedule planner', 'board exam timetable', 'exam time table chart', 'exam preparation planner', 'exam date sheet printable', 'final exam schedule', 'exam planner for students', 'study date sheet'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'revision-planner-printable', kind: 'shRevisionPlanner', guideKey: 'revisionPlannerGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['revision planner printable', 'exam revision timetable', 'revision tracker template', 'topic wise revision sheet', 'study revision chart', 'exam preparation tracker', 'revision schedule printable', 'revision checklist', 'three revision plan', 'revision log'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'assignment-tracker-printable', kind: 'shAssignmentTracker', guideKey: 'assignmentTrackerGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['assignment tracker printable', 'homework tracker template', 'assignment deadline planner', 'school project tracker', 'homework planner sheet', 'assignment log', 'student deadline tracker', 'project submission tracker', 'college assignment tracker', 'homework record'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'weekly-study-timetable-printable', kind: 'shWeeklyStudyTimetable', guideKey: 'weeklyStudyTimetableGuide', category: 'everyday', icon: 'clock', tier: 'popular',
    keywords: ['weekly study timetable printable', 'student daily routine chart', 'study time table template', 'weekly routine for students', 'study schedule printable', 'time table for studying', 'daily study planner', 'home study timetable', 'student weekly planner', 'routine chart for kids'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'reading-log-printable', kind: 'shReadingLog', guideKey: 'readingLogGuide', category: 'everyday', icon: 'type', tier: 'more',
    keywords: ['reading log printable', 'book tracker printable', 'books read list', 'reading record sheet', 'reading challenge log', 'school reading log', 'book journal template', 'reading list tracker', 'library book record', 'book review log'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'chapter-syllabus-checklist-printable', kind: 'shChapterSyllabusChecklist', guideKey: 'chapterSyllabusChecklistGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['syllabus checklist printable', 'chapter checklist template', 'syllabus tracker', 'subject progress tracker', 'exam syllabus planner', 'chapter wise tracker', 'study progress chart', 'syllabus completion sheet', 'topic checklist for students', 'subject chapter list'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'wedding-shagun-register-printable', kind: 'shWeddingShagunRegister', guideKey: 'weddingShagunRegisterGuide', category: 'everyday', icon: 'receipt', tier: 'popular',
    keywords: ['shagun register printable', 'wedding gift register', 'shagun list', 'wedding money record', 'shagun lena dena register', 'gift record for wedding', 'wedding return gift list', 'function gift register', 'wedding guest gift record', 'naam shagun register'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'guest-list-rsvp-tracker-printable', kind: 'shGuestListRsvpTracker', guideKey: 'guestListRsvpTrackerGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['guest list printable', 'wedding guest list template', 'rsvp tracker printable', 'party invitation list', 'guest list with phone number', 'invitation tracker', 'function guest list', 'event guest list', 'headcount sheet', 'guest rsvp sheet'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'wedding-planning-checklist-printable', kind: 'shWeddingPlanningChecklist', guideKey: 'weddingPlanningChecklistGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['wedding checklist printable', 'wedding planning checklist', 'wedding to do list', 'wedding task tracker', 'wedding preparation list', 'indian wedding checklist', 'marriage planning sheet', 'wedding timeline planner', 'wedding work list', 'shaadi checklist'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'event-budget-planner-printable', kind: 'shEventBudgetPlanner', guideKey: 'eventBudgetPlannerGuide', category: 'everyday', icon: 'calculator', tier: 'more',
    keywords: ['event budget planner printable', 'wedding budget sheet', 'party budget template', 'function expense sheet', 'wedding expense tracker', 'event expense list', 'vendor payment tracker', 'advance and balance sheet', 'party expense planner', 'budget for function'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'party-planning-checklist-printable', kind: 'shPartyPlanningChecklist', guideKey: 'partyPlanningChecklistGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['party planning checklist printable', 'birthday party planner', 'birthday party checklist', 'kids party planner', 'home party checklist', 'party to do list', 'party planner sheet', 'celebration checklist', 'birthday party list', 'event preparation checklist'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'festival-gift-list-printable', kind: 'shFestivalGiftList', guideKey: 'festivalGiftListGuide', category: 'everyday', icon: 'stamp', tier: 'more',
    keywords: ['diwali gift list printable', 'festival gift planner', 'gift list template', 'christmas gift list printable', 'eid gift list', 'gift tracker', 'gift budget planner', 'gift ideas list', 'holiday gift list', 'who to give gifts list'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'kitty-party-tracker-printable', kind: 'shKittyPartyTracker', guideKey: 'kittyPartyTrackerGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['kitty party tracker', 'kitty party chart printable', 'kitty payment register', 'committee payment tracker', 'chit fund tracker sheet', 'monthly kitty record', 'kitty party list', 'group savings tracker', 'bishi committee register', 'kitty hosting schedule'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'baby-feeding-log-printable', kind: 'shBabyFeedingLog', guideKey: 'babyFeedingLogGuide', category: 'everyday', icon: 'sun', tier: 'popular',
    keywords: ['baby feeding log printable', 'newborn feeding tracker', 'baby feed chart', 'breastfeeding log printable', 'feeding schedule log', 'baby milk tracker', 'infant feeding record', 'daily baby log', 'newborn tracker printable', 'baby feed time chart'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'baby-sleep-log-printable', kind: 'shBabySleepLog', guideKey: 'babySleepLogGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['baby sleep log printable', 'newborn sleep tracker', 'baby nap tracker', 'sleep chart for baby', 'infant sleep record', 'toddler sleep log', 'baby sleep diary', 'night sleep tracker', 'nap time log', 'baby routine tracker'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'baby-diaper-log-printable', kind: 'shBabyDiaperLog', guideKey: 'babyDiaperLogGuide', category: 'everyday', icon: 'sun', tier: 'more',
    keywords: ['baby diaper log printable', 'nappy change tracker', 'diaper tracker printable', 'newborn diaper chart', 'baby poop tracker', 'wet diaper log', 'daily nappy record', 'baby output log', 'diaper change chart', 'newborn log printable'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'kids-chore-chart-printable', kind: 'shKidsChoreChart', guideKey: 'kidsChoreChartGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['kids chore chart printable', 'weekly chore chart for kids', 'children responsibility chart', 'chore list for children', 'daily chores chart', 'reward chart for kids', 'family chore chart', 'chore tracker printable', 'morning routine chart', 'household chores chart kids'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'pocket-money-tracker-printable', kind: 'shPocketMoneyTracker', guideKey: 'pocketMoneyTrackerGuide', category: 'everyday', icon: 'receipt', tier: 'more',
    keywords: ['pocket money tracker printable', 'kids savings log', 'children money tracker', 'allowance tracker printable', 'piggy bank record', 'kids spending record', 'pocket money chart', 'money diary for kids', 'child savings tracker', 'teaching kids money sheet'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'birthday-anniversary-list-printable', kind: 'shBirthdayAnniversaryList', guideKey: 'birthdayAnniversaryListGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['birthday list printable', 'anniversary tracker printable', 'important dates list', 'birthday reminder chart', 'family birthdays list', 'birthday calendar printable', 'special dates tracker', 'birthday and anniversary register', 'date reminder sheet', 'family dates record'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'vehicle-service-log-printable', kind: 'shVehicleServiceLog', guideKey: 'vehicleServiceLogGuide', category: 'everyday', icon: 'hash', tier: 'popular',
    keywords: ['vehicle service log printable', 'car maintenance log', 'bike service record', 'car service history sheet', 'vehicle maintenance record', 'two wheeler service log', 'car service tracker', 'motorcycle maintenance log', 'scooter service record', 'vehicle service book'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'fuel-mileage-log-printable', kind: 'shFuelMileageLog', guideKey: 'fuelMileageLogGuide', category: 'everyday', icon: 'calculator', tier: 'more',
    keywords: ['fuel log printable', 'mileage log sheet', 'petrol log printable', 'fuel consumption tracker', 'car mileage tracker', 'fuel expense log', 'km per litre tracker', 'vehicle fuel record', 'fuel fill up log', 'bike mileage log'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'vehicle-document-tracker-printable', kind: 'shVehicleDocumentTracker', guideKey: 'vehicleDocumentTrackerGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['vehicle document tracker', 'car insurance renewal tracker', 'puc renewal tracker', 'driving licence expiry tracker', 'vehicle papers checklist', 'document expiry log', 'bike insurance reminder sheet', 'vehicle paperwork record', 'renewal date tracker', 'car documents list'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'home-maintenance-log-printable', kind: 'shHomeMaintenanceLog', guideKey: 'homeMaintenanceLogGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['home maintenance log printable', 'house repair record', 'home maintenance checklist', 'house servicing log', 'flat maintenance record', 'home repair tracker', 'home improvement log', 'appliance servicing record', 'house work register', 'property maintenance log'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'home-service-contacts-printable', kind: 'shHomeServiceContacts', guideKey: 'homeServiceContactsGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['home service contacts printable', 'plumber electrician phone list', 'household helpers contact sheet', 'emergency service numbers list', 'vendor contact list', 'family service providers list', 'maid driver cook contact sheet', 'neighbourhood contact list', 'home repair contacts', 'society services list'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'home-inventory-list-printable', kind: 'shHomeInventoryList', guideKey: 'homeInventoryListGuide', category: 'everyday', icon: 'layers', tier: 'more',
    keywords: ['home inventory list printable', 'household inventory sheet', 'belongings list', 'house contents record', 'room wise inventory', 'moving inventory template', 'valuables list', 'appliance inventory', 'home items register', 'inventory for insurance claim'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'rent-payment-record-printable', kind: 'shRentPaymentRecord', guideKey: 'rentPaymentRecordGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['rent payment record printable', 'rent register template', 'monthly rent tracker', 'rent paid record', 'landlord rent register', 'tenant payment record', 'rent ledger printable', 'house rent record', 'rent receipt log', 'rent payment tracker'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'utility-bill-tracker-printable', kind: 'shUtilityBillTracker', guideKey: 'utilityBillTrackerGuide', category: 'everyday', icon: 'calculator', tier: 'more',
    keywords: ['utility bill tracker printable', 'electricity bill record', 'monthly bills tracker', 'household bills log', 'bill payment tracker', 'water bill tracker', 'gas bill record', 'bill payment chart', 'home expense bills sheet', 'monthly bill checklist'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'habit-tracker-printable', kind: 'shHabitTracker', guideKey: 'habitTrackerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['habit tracker printable', 'monthly habit tracker', 'daily habit chart', 'habit tracking sheet', '30 day habit tracker', 'good habits chart', 'routine tracker printable', 'habit log template', 'self improvement tracker', 'daily routine checklist'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'monthly-expense-tracker-printable', kind: 'shMonthlyExpenseTracker', guideKey: 'monthlyExpenseTrackerGuide', category: 'everyday', icon: 'receipt', tier: 'more',
    keywords: ['expense tracker printable', 'monthly expense sheet', 'daily expense log', 'spending tracker printable', 'personal expense record', 'household expense register', 'money diary printable', 'expense diary', 'budget tracker log', 'expenses notebook'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'savings-goal-tracker-printable', kind: 'shSavingsGoalTracker', guideKey: 'savingsGoalTrackerGuide', category: 'everyday', icon: 'receipt', tier: 'more',
    keywords: ['savings goal tracker printable', 'money saving chart', 'savings tracker sheet', 'saving challenge printable', 'goal savings log', 'piggy bank tracker', 'save money chart', 'target savings record', 'deposit tracker', 'savings plan printable'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'travel-packing-list-printable', kind: 'shTravelPackingList', guideKey: 'travelPackingListGuide', category: 'everyday', icon: 'briefcase', tier: 'more',
    keywords: ['packing list printable', 'travel packing checklist', 'trip checklist template', 'holiday packing list', 'suitcase checklist', 'vacation packing list', 'travel checklist printable', 'weekend trip packing list', 'hostel packing list', 'luggage checklist'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'travel-itinerary-planner-printable', kind: 'shTravelItineraryPlanner', guideKey: 'travelItineraryPlannerGuide', category: 'everyday', icon: 'globe', tier: 'more',
    keywords: ['travel itinerary template printable', 'trip planner printable', 'day wise itinerary sheet', 'holiday plan template', 'vacation itinerary printable', 'tour planner sheet', 'travel plan chart', 'trip schedule printable', 'journey planner sheet', 'travel booking tracker'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'grocery-shopping-list-printable', kind: 'shGroceryShoppingList', guideKey: 'groceryShoppingListGuide', category: 'everyday', icon: 'receipt', tier: 'more',
    keywords: ['grocery list printable', 'shopping list template', 'weekly grocery list', 'monthly ration list', 'kirana list printable', 'supermarket list', 'household shopping list', 'kitchen shopping checklist', 'provisions list', 'market list printable'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'subscription-tracker-printable', kind: 'shSubscriptionTracker', guideKey: 'subscriptionTrackerGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['subscription tracker printable', 'recurring payment list', 'monthly subscriptions log', 'renewal tracker', 'ott subscription tracker', 'bill reminder list', 'auto pay tracker', 'membership tracker', 'subscription list template', 'recurring expenses sheet'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'workout-log-printable', kind: 'shWorkoutLog', guideKey: 'workoutLogGuide', category: 'everyday', icon: 'dumbbell', tier: 'more',
    keywords: ['workout log printable', 'gym log sheet', 'exercise tracker printable', 'fitness log template', 'strength training log', 'weight lifting log', 'gym progress tracker', 'home workout log', 'training diary printable', 'exercise record sheet'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'customer-order-register-printable', kind: 'shCustomerOrderRegister', guideKey: 'customerOrderRegisterGuide', category: 'business', icon: 'receipt', tier: 'popular',
    keywords: ['customer order register printable', 'order book template', 'tailor order register', 'bakery order book', 'order tracking sheet', 'small business order log', 'advance and balance register', 'home business order sheet', 'order booking register', 'delivery date register'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'petty-cash-voucher-printable', kind: 'shPettyCashVoucher', guideKey: 'pettyCashVoucherGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['petty cash voucher printable', 'cash voucher format', 'expense voucher template', 'payment voucher printable', 'cash payment slip', 'office petty cash slip', 'small expense voucher', 'voucher book printable', 'cash memo voucher', 'shop expense voucher'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'meeting-minutes-template-printable', kind: 'shMeetingMinutesTemplate', guideKey: 'meetingMinutesTemplateGuide', category: 'business', icon: 'file-text', tier: 'more',
    keywords: ['meeting minutes template printable', 'meeting notes sheet', 'minutes of meeting format', 'meeting record template', 'action items sheet', 'committee meeting minutes', 'society meeting minutes', 'agenda and notes printable', 'team meeting notes', 'meeting log printable'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'weekly-timesheet-printable', kind: 'shWeeklyTimesheet', guideKey: 'weeklyTimesheetGuide', category: 'business', icon: 'clock', tier: 'more',
    keywords: ['weekly timesheet printable', 'employee timesheet template', 'hours worked log', 'freelancer timesheet', 'work hours tracker', 'daily time log printable', 'staff time sheet', 'part time work hours sheet', 'timesheet with signature', 'time card printable'],
  }, sheets.toolCatalog),
  definePackTool({
    id: 'visitor-register-printable', kind: 'shVisitorRegister', guideKey: 'visitorRegisterGuide', category: 'business', icon: 'contact', tier: 'more',
    keywords: ['visitor register printable', 'visitor log book template', 'visitor entry register', 'visitors book printable', 'office visitor log', 'society visitor register', 'guest register sheet', 'reception register printable', 'visitor sign in sheet', 'gate register format'],
  }, sheets.toolCatalog),
];
