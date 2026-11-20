import { tableSheet } from './simple';
import type { Family, SheetDef } from './types';


const weddingShagunRegister: SheetDef = tableSheet({
  "id": "wedding-shagun-register-printable",
  "label": "Wedding shagun register",
  "hint": "Names, amounts and gifts received",
  "title": "Shagun and gift register",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Name",
      "w": 3.0
    },
    {
      "label": "Relation",
      "w": 1.8
    },
    {
      "label": "City or place",
      "w": 1.8
    },
    {
      "label": "Amount (Rs.)",
      "w": 1.6
    },
    {
      "label": "Gift",
      "w": 2.4
    },
    {
      "label": "Remarks",
      "w": 2.5
    }
  ],
  "rows": 18,
  "maxRows": 26,
  "top": [
    "Function:",
    "Date:"
  ],
  "numbered": true
});

const guestListRsvpTracker: SheetDef = tableSheet({
  "id": "guest-list-rsvp-tracker-printable",
  "label": "Guest list and RSVP tracker",
  "hint": "Invitations, replies and numbers",
  "title": "Guest list and RSVP",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Guest name",
      "w": 3.2
    },
    {
      "label": "Phone",
      "w": 2.0
    },
    {
      "label": "Group or side",
      "w": 1.8
    },
    {
      "label": "Invited",
      "w": 1.2
    },
    {
      "label": "Reply",
      "w": 1.3
    },
    {
      "label": "People",
      "w": 1.1
    },
    {
      "label": "Notes",
      "w": 2.5
    }
  ],
  "rows": 20,
  "maxRows": 30,
  "list": {
    "label": "Guest names (optional)",
    "hint": "One per line, up to 30. They are printed in the name column.",
    "defaults": ""
  },
  "numbered": true
});

const weddingPlanningChecklist: SheetDef = tableSheet({
  "id": "wedding-planning-checklist-printable",
  "label": "Wedding planning checklist",
  "hint": "Tasks, who and by when",
  "title": "Wedding planning checklist",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Task",
      "w": 4.5
    },
    {
      "label": "Who",
      "w": 1.8
    },
    {
      "label": "Due date",
      "w": 1.6
    },
    {
      "label": "Budget (Rs.)",
      "w": 1.6
    },
    {
      "label": "Done",
      "w": 1.0
    }
  ],
  "rows": 24,
  "maxRows": 32,
  "list": {
    "label": "Tasks",
    "hint": "One per line, up to 32. Edit them to match your plans.",
    "defaults": "Fix the date and venue\nBook the caterer\nBook the photographer\nInvitation cards\nBuy clothes and jewellery\nDecorator and flowers\nMusic and entertainment\nGuest stay and travel\nRitual items and priest\nReturn gifts\nTransport and parking\nMehendi and make-up"
  },
  "numbered": true
});

const eventBudgetPlanner: SheetDef = tableSheet({
  "id": "event-budget-planner-printable",
  "label": "Event budget planner",
  "hint": "Items, vendors, advance and balance",
  "title": "Event budget",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Item",
      "w": 3.0
    },
    {
      "label": "Vendor or person",
      "w": 2.6
    },
    {
      "label": "Estimate (Rs.)",
      "w": 1.8
    },
    {
      "label": "Advance (Rs.)",
      "w": 1.8
    },
    {
      "label": "Balance (Rs.)",
      "w": 1.8
    },
    {
      "label": "Paid on",
      "w": 1.5
    },
    {
      "label": "Notes",
      "w": 2.0
    }
  ],
  "rows": 20,
  "maxRows": 30,
  "top": [
    "Event:",
    "Total budget (Rs.):"
  ],
  "list": {
    "label": "Items (optional)",
    "hint": "One per line, such as Venue, Catering, Decor.",
    "defaults": "Venue\nCatering\nDecoration\nPhotography\nClothes\nInvitations\nMusic\nTransport\nGifts\nMiscellaneous"
  },
  "numbered": true
});

const partyPlanningChecklist: SheetDef = tableSheet({
  "id": "party-planning-checklist-printable",
  "label": "Party planning checklist",
  "hint": "Birthday and home party tasks",
  "title": "Party planning checklist",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Task",
      "w": 5.0
    },
    {
      "label": "Who",
      "w": 2.0
    },
    {
      "label": "By when",
      "w": 1.6
    },
    {
      "label": "Done",
      "w": 1.0
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Party:",
    "Date:"
  ],
  "list": {
    "label": "Tasks",
    "hint": "One per line, up to 30. Edit them to match your party.",
    "defaults": "Make the guest list\nSend invitations\nBook the venue\nOrder the cake\nPlan the food\nBuy decorations\nPlan games and music\nReturn gifts\nSeating and tables\nPhotos and video\nClean-up help"
  },
  "numbered": true
});

const festivalGiftList: SheetDef = tableSheet({
  "id": "festival-gift-list-printable",
  "label": "Festival gift list",
  "hint": "Who, what and budget",
  "title": "Gift list",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Name",
      "w": 3.0
    },
    {
      "label": "Relation",
      "w": 2.0
    },
    {
      "label": "Gift idea",
      "w": 3.2
    },
    {
      "label": "Budget (Rs.)",
      "w": 1.6
    },
    {
      "label": "Bought",
      "w": 1.1
    },
    {
      "label": "Given",
      "w": 1.1
    },
    {
      "label": "Notes",
      "w": 2.2
    }
  ],
  "rows": 20,
  "maxRows": 30,
  "top": [
    "Occasion:",
    "Year:"
  ],
  "list": {
    "label": "Names (optional)",
    "hint": "One per line, up to 30. They are printed in the name column.",
    "defaults": ""
  },
  "numbered": true
});

const kittyPartyTracker: SheetDef = tableSheet({
  "id": "kitty-party-tracker-printable",
  "label": "Kitty party tracker",
  "hint": "Members and monthly payments",
  "title": "Kitty party tracker",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Member",
      "w": 3.0
    },
    {
      "label": "Jan",
      "w": 0.9
    },
    {
      "label": "Feb",
      "w": 0.9
    },
    {
      "label": "Mar",
      "w": 0.9
    },
    {
      "label": "Apr",
      "w": 0.9
    },
    {
      "label": "May",
      "w": 0.9
    },
    {
      "label": "Jun",
      "w": 0.9
    },
    {
      "label": "Jul",
      "w": 0.9
    },
    {
      "label": "Aug",
      "w": 0.9
    },
    {
      "label": "Sep",
      "w": 0.9
    },
    {
      "label": "Oct",
      "w": 0.9
    },
    {
      "label": "Nov",
      "w": 0.9
    },
    {
      "label": "Dec",
      "w": 0.9
    },
    {
      "label": "Hosts on",
      "w": 1.6
    }
  ],
  "rows": 20,
  "maxRows": 30,
  "top": [
    "Group:",
    "Monthly amount (Rs.):"
  ],
  "list": {
    "label": "Members",
    "hint": "One per line, up to 30. They are printed in the member column.",
    "defaults": ""
  },
  "numbered": true
});

export const EVENT_FAMILY: Family = {
  key: 'event',
  headingLabel: "Event or family name",
  headingPlaceholder: "Sharma wedding  or  Aarav's birthday",
  note: "These sheets help you organise a function and keep its records. Follow your family's own customs and your vendors' agreements.",
  sheets: [weddingShagunRegister, guestListRsvpTracker, weddingPlanningChecklist, eventBudgetPlanner, partyPlanningChecklist, festivalGiftList, kittyPartyTracker],
};
