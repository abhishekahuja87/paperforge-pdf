import { tableSheet } from './simple';
import type { Family, SheetDef } from './types';


const babyFeedingLog: SheetDef = tableSheet({
  "id": "baby-feeding-log-printable",
  "label": "Baby feeding log",
  "hint": "Times, feeds and amounts",
  "title": "Baby feeding log",
  "landscape": false,
  "columns": [
    {
      "label": "Time",
      "w": 1.4
    },
    {
      "label": "Type of feed",
      "w": 2.4
    },
    {
      "label": "Amount or minutes",
      "w": 2.0
    },
    {
      "label": "Notes",
      "w": 3.4
    }
  ],
  "rows": 24,
  "maxRows": 30,
  "top": [
    "Date:",
    "Day:"
  ]
});

const babySleepLog: SheetDef = tableSheet({
  "id": "baby-sleep-log-printable",
  "label": "Baby sleep log",
  "hint": "Nap and night sleep times",
  "title": "Baby sleep log",
  "landscape": false,
  "columns": [
    {
      "label": "Date",
      "w": 1.6
    },
    {
      "label": "Asleep at",
      "w": 1.5
    },
    {
      "label": "Awake at",
      "w": 1.5
    },
    {
      "label": "Total",
      "w": 1.3
    },
    {
      "label": "Nap or night",
      "w": 1.6
    },
    {
      "label": "Notes",
      "w": 3.5
    }
  ],
  "rows": 24,
  "maxRows": 30,
  "top": [
    "Baby:",
    "Month:"
  ]
});

const babyDiaperLog: SheetDef = tableSheet({
  "id": "baby-diaper-log-printable",
  "label": "Baby diaper log",
  "hint": "Wet, soiled and notes",
  "title": "Diaper log",
  "landscape": false,
  "columns": [
    {
      "label": "Time",
      "w": 1.5
    },
    {
      "label": "Wet",
      "w": 1.1
    },
    {
      "label": "Soiled",
      "w": 1.1
    },
    {
      "label": "Colour or type",
      "w": 2.2
    },
    {
      "label": "Notes",
      "w": 4.3
    }
  ],
  "rows": 24,
  "maxRows": 30,
  "top": [
    "Date:",
    "Baby:"
  ]
});

const kidsChoreChart: SheetDef = tableSheet({
  "id": "kids-chore-chart-printable",
  "label": "Kids chore chart",
  "hint": "Chores by days of the week",
  "title": "Chore chart",
  "landscape": true,
  "columns": [
    {
      "label": "Chore",
      "w": 3.4
    },
    {
      "label": "Mon",
      "w": 1.0
    },
    {
      "label": "Tue",
      "w": 1.0
    },
    {
      "label": "Wed",
      "w": 1.0
    },
    {
      "label": "Thu",
      "w": 1.0
    },
    {
      "label": "Fri",
      "w": 1.0
    },
    {
      "label": "Sat",
      "w": 1.0
    },
    {
      "label": "Sun",
      "w": 1.0
    },
    {
      "label": "Done",
      "w": 1.0
    }
  ],
  "rows": 10,
  "maxRows": 16,
  "top": [
    "Name:",
    "Week of:"
  ],
  "list": {
    "label": "Chores",
    "hint": "One per line, up to 16. Edit them for each child.",
    "defaults": "Make the bed\nBrush teeth\nPack the school bag\nSet the table\nHomework\nTidy toys\nWater the plants\nHelp with dinner\nRead for 15 minutes\nPut clothes in the basket"
  }
});

const pocketMoneyTracker: SheetDef = tableSheet({
  "id": "pocket-money-tracker-printable",
  "label": "Pocket money tracker",
  "hint": "Money received, spent and saved",
  "title": "Pocket money tracker",
  "landscape": false,
  "columns": [
    {
      "label": "Date",
      "w": 1.5
    },
    {
      "label": "Received (Rs.)",
      "w": 1.7
    },
    {
      "label": "Spent on",
      "w": 3.2
    },
    {
      "label": "Spent (Rs.)",
      "w": 1.5
    },
    {
      "label": "Balance (Rs.)",
      "w": 1.6
    }
  ],
  "rows": 24,
  "maxRows": 30,
  "top": [
    "Name:",
    "Goal:"
  ]
});

const birthdayAnniversaryList: SheetDef = tableSheet({
  "id": "birthday-anniversary-list-printable",
  "label": "Birthday and anniversary list",
  "hint": "Dates to remember",
  "title": "Birthdays and anniversaries",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Name",
      "w": 3.0
    },
    {
      "label": "Date",
      "w": 1.6
    },
    {
      "label": "Occasion",
      "w": 1.8
    },
    {
      "label": "Relation",
      "w": 1.8
    },
    {
      "label": "Gift idea",
      "w": 2.6
    },
    {
      "label": "Remind",
      "w": 1.2
    }
  ],
  "rows": 24,
  "maxRows": 36,
  "list": {
    "label": "Names (optional)",
    "hint": "One per line, up to 36. They are printed in the name column.",
    "defaults": ""
  },
  "numbered": true
});

export const KIN_FAMILY: Family = {
  key: 'kin',
  headingLabel: "Child or family name",
  headingPlaceholder: "Aarav  or  The Mehta family",
  note: "These sheets are simple records. They give no medical, feeding, sleep or parenting advice, so ask your doctor about any concern.",
  sheets: [babyFeedingLog, babySleepLog, babyDiaperLog, kidsChoreChart, pocketMoneyTracker, birthdayAnniversaryList],
};
