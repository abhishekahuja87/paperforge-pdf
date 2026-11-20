import { tableSheet } from './simple';
import type { Family, SheetDef } from './types';

const societyMaintenanceCollectionRegister: SheetDef = tableSheet({
  "id": "society-maintenance-collection-register-printable",
  "label": "Maintenance collection register",
  "hint": "Flats, amounts and receipts",
  "title": "Maintenance collection register",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Flat no.",
      "w": 1.3
    },
    {
      "label": "Resident",
      "w": 2.8
    },
    {
      "label": "Month",
      "w": 1.4
    },
    {
      "label": "Due (Rs.)",
      "w": 1.4
    },
    {
      "label": "Paid on",
      "w": 1.4
    },
    {
      "label": "Mode",
      "w": 1.2
    },
    {
      "label": "Receipt no.",
      "w": 1.5
    },
    {
      "label": "Balance (Rs.)",
      "w": 1.5
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Society:",
    "Month:"
  ],
  "list": {
    "label": "Flats or residents (optional)",
    "hint": "One per line, up to 30. They are printed in the flat column.",
    "defaults": ""
  },
  "numbered": true
});

const parkingSlotAllotmentRegister: SheetDef = tableSheet({
  "id": "parking-slot-allotment-register-printable",
  "label": "Parking slot register",
  "hint": "Slots, flats and vehicles",
  "title": "Parking slot register",
  "landscape": true,
  "columns": [
    {
      "label": "Slot",
      "w": 1.0
    },
    {
      "label": "Flat",
      "w": 1.2
    },
    {
      "label": "Resident",
      "w": 2.6
    },
    {
      "label": "Vehicle no.",
      "w": 2.0
    },
    {
      "label": "Type",
      "w": 1.3
    },
    {
      "label": "Sticker no.",
      "w": 1.5
    },
    {
      "label": "Phone",
      "w": 1.8
    },
    {
      "label": "Remarks",
      "w": 2.4
    }
  ],
  "rows": 24,
  "maxRows": 32,
  "top": [
    "Society:",
    "Block:"
  ]
});

const societyComplaintRegister: SheetDef = tableSheet({
  "id": "society-complaint-register-printable",
  "label": "Complaint register",
  "hint": "Complaints and action taken",
  "title": "Complaint register",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.3
    },
    {
      "label": "Flat or name",
      "w": 1.8
    },
    {
      "label": "Complaint",
      "w": 4.0
    },
    {
      "label": "Assigned to",
      "w": 1.8
    },
    {
      "label": "Action taken",
      "w": 3.0
    },
    {
      "label": "Closed on",
      "w": 1.4
    }
  ],
  "rows": 18,
  "maxRows": 26,
  "top": [
    "Place:",
    "Month:"
  ],
  "numbered": true
});

const keyRegister: SheetDef = tableSheet({
  "id": "key-register-printable",
  "label": "Key register",
  "hint": "Keys taken and returned",
  "title": "Key register",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.4
    },
    {
      "label": "Key or item",
      "w": 2.8
    },
    {
      "label": "Taken by",
      "w": 2.2
    },
    {
      "label": "Time out",
      "w": 1.2
    },
    {
      "label": "Time in",
      "w": 1.2
    },
    {
      "label": "Taken by sign",
      "w": 1.8
    },
    {
      "label": "Returned to sign",
      "w": 1.8
    },
    {
      "label": "Remarks",
      "w": 2.0
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Place:",
    "Month:"
  ],
  "numbered": true
});

const meetingAgendaTemplate: SheetDef = tableSheet({
  "id": "meeting-agenda-template-printable",
  "label": "Meeting agenda",
  "hint": "Time, topic and who leads",
  "title": "Meeting agenda",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Time",
      "w": 1.3
    },
    {
      "label": "Topic",
      "w": 4.0
    },
    {
      "label": "Led by",
      "w": 1.8
    },
    {
      "label": "Minutes",
      "w": 1.1
    },
    {
      "label": "Notes",
      "w": 3.0
    }
  ],
  "rows": 12,
  "maxRows": 18,
  "top": [
    "Meeting:",
    "Date:"
  ],
  "list": {
    "label": "Topics (optional)",
    "hint": "One per line, up to 18. They are printed in the topic column.",
    "defaults": "Welcome and apologies\nMinutes of the last meeting\nMain item\nOther items\nNext meeting and close"
  },
  "numbered": true
});

const contentCalendar: SheetDef = tableSheet({
  "id": "content-calendar-printable",
  "label": "Content calendar",
  "hint": "Posts planned by date",
  "title": "Content calendar",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.4
    },
    {
      "label": "Platform",
      "w": 1.6
    },
    {
      "label": "Topic or idea",
      "w": 4.0
    },
    {
      "label": "Format",
      "w": 1.5
    },
    {
      "label": "Caption ready",
      "w": 1.2
    },
    {
      "label": "Posted",
      "w": 1.0
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Month:",
    "Account:"
  ],
  "numbered": true
});

const socialMediaPostPlanner: SheetDef = tableSheet({
  "id": "social-media-post-planner-printable",
  "label": "Social media weekly planner",
  "hint": "Platforms by day of the week",
  "title": "Weekly social media planner",
  "landscape": true,
  "columns": [
    {
      "label": "Platform",
      "w": 2.2
    },
    {
      "label": "Mon",
      "w": 1.5
    },
    {
      "label": "Tue",
      "w": 1.5
    },
    {
      "label": "Wed",
      "w": 1.5
    },
    {
      "label": "Thu",
      "w": 1.5
    },
    {
      "label": "Fri",
      "w": 1.5
    },
    {
      "label": "Sat",
      "w": 1.5
    },
    {
      "label": "Sun",
      "w": 1.5
    }
  ],
  "rows": 8,
  "maxRows": 12,
  "top": [
    "Week of:",
    "Account:"
  ],
  "list": {
    "label": "Platforms",
    "hint": "One per line, up to 12. They are printed down the first column.",
    "defaults": "Instagram\nFacebook\nYouTube\nLinkedIn\nWhatsApp status\nX or Threads\nBlog\nEmail newsletter"
  }
});

const invoiceTracker: SheetDef = tableSheet({
  "id": "invoice-tracker-printable",
  "label": "Invoice tracker",
  "hint": "Invoices sent and paid",
  "title": "Invoice tracker",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Invoice no.",
      "w": 1.6
    },
    {
      "label": "Client",
      "w": 2.8
    },
    {
      "label": "Date",
      "w": 1.4
    },
    {
      "label": "Amount (Rs.)",
      "w": 1.6
    },
    {
      "label": "Due date",
      "w": 1.4
    },
    {
      "label": "Paid on",
      "w": 1.4
    },
    {
      "label": "Status",
      "w": 1.4
    },
    {
      "label": "Notes",
      "w": 2.2
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Business:",
    "Year:"
  ],
  "numbered": true
});

const freelanceProjectTracker: SheetDef = tableSheet({
  "id": "freelance-project-tracker-printable",
  "label": "Project tracker",
  "hint": "Clients, deadlines and fees",
  "title": "Project tracker",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Client",
      "w": 2.2
    },
    {
      "label": "Project",
      "w": 3.0
    },
    {
      "label": "Start",
      "w": 1.3
    },
    {
      "label": "Due",
      "w": 1.3
    },
    {
      "label": "Fee (Rs.)",
      "w": 1.4
    },
    {
      "label": "Advance (Rs.)",
      "w": 1.5
    },
    {
      "label": "Status",
      "w": 1.5
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 20,
  "maxRows": 28,
  "top": [
    "Name:",
    "Year:"
  ],
  "numbered": true
});

const clientContactList: SheetDef = tableSheet({
  "id": "client-contact-list-printable",
  "label": "Client contact list",
  "hint": "Names, phones and notes",
  "title": "Client contact list",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Name",
      "w": 2.4
    },
    {
      "label": "Company",
      "w": 2.2
    },
    {
      "label": "Phone",
      "w": 1.8
    },
    {
      "label": "Email",
      "w": 2.6
    },
    {
      "label": "City",
      "w": 1.4
    },
    {
      "label": "Last contact",
      "w": 1.4
    },
    {
      "label": "Notes",
      "w": 2.6
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Business:",
    "Year:"
  ],
  "list": {
    "label": "Names (optional)",
    "hint": "One per line, up to 30. They are printed in the name column.",
    "defaults": ""
  },
  "numbered": true
});

export const OPS_FAMILY: Family = {
  key: 'ops',
  headingLabel: "Society, office or business",
  headingPlaceholder: "Sunrise Heights  or  Sharma Traders",
  note: "These sheets help you keep your own records. Follow your society's bye-laws, your contracts and the rules that apply to you; the sheets set none of them.",
  sheets: [societyMaintenanceCollectionRegister, parkingSlotAllotmentRegister, societyComplaintRegister, keyRegister, meetingAgendaTemplate, contentCalendar, socialMediaPostPlanner, invoiceTracker, freelanceProjectTracker, clientContactList],
};
