import { tableSheet } from './simple';
import type { Family, SheetDef } from './types';


const vehicleServiceLog: SheetDef = tableSheet({
  "id": "vehicle-service-log-printable",
  "label": "Vehicle service log",
  "hint": "Service dates, work and cost",
  "title": "Vehicle service log",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.5
    },
    {
      "label": "Odometer (km)",
      "w": 1.6
    },
    {
      "label": "Work done",
      "w": 4.0
    },
    {
      "label": "Workshop",
      "w": 2.0
    },
    {
      "label": "Cost (Rs.)",
      "w": 1.4
    },
    {
      "label": "Next due",
      "w": 1.6
    }
  ],
  "rows": 18,
  "maxRows": 26,
  "top": [
    "Vehicle:",
    "Registration no.:"
  ],
  "numbered": true
});

const fuelMileageLog: SheetDef = tableSheet({
  "id": "fuel-mileage-log-printable",
  "label": "Fuel and mileage log",
  "hint": "Fill-ups, distance and cost",
  "title": "Fuel and mileage log",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.5
    },
    {
      "label": "Odometer (km)",
      "w": 1.6
    },
    {
      "label": "Fuel (litres)",
      "w": 1.5
    },
    {
      "label": "Amount (Rs.)",
      "w": 1.5
    },
    {
      "label": "Distance (km)",
      "w": 1.5
    },
    {
      "label": "Mileage (km/l)",
      "w": 1.6
    },
    {
      "label": "Notes",
      "w": 2.6
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Vehicle:",
    "Fuel type:"
  ],
  "numbered": true
});

const vehicleDocumentTracker: SheetDef = tableSheet({
  "id": "vehicle-document-tracker-printable",
  "label": "Vehicle document tracker",
  "hint": "Papers, numbers and renewal dates",
  "title": "Vehicle documents",
  "landscape": true,
  "columns": [
    {
      "label": "Document",
      "w": 3.0
    },
    {
      "label": "Number",
      "w": 2.4
    },
    {
      "label": "Issued on",
      "w": 1.6
    },
    {
      "label": "Expires on",
      "w": 1.6
    },
    {
      "label": "Renewed on",
      "w": 1.6
    },
    {
      "label": "Where kept",
      "w": 2.0
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 10,
  "maxRows": 16,
  "top": [
    "Vehicle:",
    "Owner:"
  ],
  "list": {
    "label": "Documents",
    "hint": "One per line, up to 16. Edit them for your vehicle.",
    "defaults": "Registration certificate\nInsurance\nPollution certificate\nDriving licence\nService booklet\nWarranty\nLoan papers\nRoad tax receipt"
  }
});

const homeMaintenanceLog: SheetDef = tableSheet({
  "id": "home-maintenance-log-printable",
  "label": "Home maintenance log",
  "hint": "Repairs, servicing and costs",
  "title": "Home maintenance log",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Date",
      "w": 1.5
    },
    {
      "label": "Area or item",
      "w": 2.4
    },
    {
      "label": "Work done",
      "w": 4.0
    },
    {
      "label": "Done by",
      "w": 2.0
    },
    {
      "label": "Cost (Rs.)",
      "w": 1.4
    },
    {
      "label": "Next due",
      "w": 1.6
    }
  ],
  "rows": 18,
  "maxRows": 26,
  "top": [
    "Home:",
    "Year:"
  ],
  "numbered": true
});

const homeServiceContacts: SheetDef = tableSheet({
  "id": "home-service-contacts-printable",
  "label": "Home service contacts",
  "hint": "Plumber, electrician and more",
  "title": "Home service contacts",
  "landscape": true,
  "columns": [
    {
      "label": "Service",
      "w": 2.2
    },
    {
      "label": "Name",
      "w": 2.6
    },
    {
      "label": "Phone",
      "w": 2.2
    },
    {
      "label": "Area or shop",
      "w": 2.4
    },
    {
      "label": "Rate or visit charge",
      "w": 2.0
    },
    {
      "label": "Last used",
      "w": 1.5
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 16,
  "maxRows": 24,
  "list": {
    "label": "Services",
    "hint": "One per line, up to 24. They are printed in the first column.",
    "defaults": "Plumber\nElectrician\nCarpenter\nAC technician\nGas agency\nWater supplier\nPainter\nPest control\nMaid or cook\nDriver\nLaundry\nGrocery delivery"
  }
});

const homeInventoryList: SheetDef = tableSheet({
  "id": "home-inventory-list-printable",
  "label": "Home inventory list",
  "hint": "Items by room with value",
  "title": "Home inventory",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Room",
      "w": 1.8
    },
    {
      "label": "Item",
      "w": 3.6
    },
    {
      "label": "Qty",
      "w": 0.9
    },
    {
      "label": "Bought on",
      "w": 1.5
    },
    {
      "label": "Value (Rs.)",
      "w": 1.5
    },
    {
      "label": "Brand or model",
      "w": 2.4
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Home:",
    "Date:"
  ],
  "list": {
    "label": "Items (optional)",
    "hint": "One per line, up to 30. They are printed in the room column.",
    "defaults": ""
  },
  "numbered": true
});

const rentPaymentRecord: SheetDef = tableSheet({
  "id": "rent-payment-record-printable",
  "label": "Rent payment record",
  "hint": "Monthly rent paid and received",
  "title": "Rent payment record",
  "landscape": true,
  "columns": [
    {
      "label": "Month",
      "w": 1.8
    },
    {
      "label": "Rent due (Rs.)",
      "w": 1.8
    },
    {
      "label": "Paid on",
      "w": 1.6
    },
    {
      "label": "Amount paid (Rs.)",
      "w": 2.0
    },
    {
      "label": "Mode",
      "w": 1.4
    },
    {
      "label": "Receipt no.",
      "w": 1.6
    },
    {
      "label": "Balance (Rs.)",
      "w": 1.6
    },
    {
      "label": "Notes",
      "w": 2.4
    }
  ],
  "rows": 12,
  "maxRows": 14,
  "top": [
    "Property:",
    "Tenant or landlord:"
  ],
  "list": {
    "label": "Months",
    "hint": "One per line, up to 14. They are printed in the month column.",
    "defaults": "January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember"
  }
});

const utilityBillTracker: SheetDef = tableSheet({
  "id": "utility-bill-tracker-printable",
  "label": "Utility bill tracker",
  "hint": "Electricity, water, gas and more",
  "title": "Utility bill tracker",
  "landscape": true,
  "columns": [
    {
      "label": "Month",
      "w": 1.7
    },
    {
      "label": "Electricity",
      "w": 1.6
    },
    {
      "label": "Water",
      "w": 1.4
    },
    {
      "label": "Gas",
      "w": 1.4
    },
    {
      "label": "Internet",
      "w": 1.4
    },
    {
      "label": "Mobile",
      "w": 1.4
    },
    {
      "label": "Other",
      "w": 1.4
    },
    {
      "label": "Total",
      "w": 1.5
    },
    {
      "label": "Paid on",
      "w": 1.5
    }
  ],
  "rows": 12,
  "maxRows": 14,
  "top": [
    "Home:",
    "Year:"
  ],
  "list": {
    "label": "Months",
    "hint": "One per line, up to 14. They are printed in the month column.",
    "defaults": "January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember"
  }
});

export const AUTO_FAMILY: Family = {
  key: 'auto',
  headingLabel: "Vehicle or home",
  headingPlaceholder: "Honda City  or  Flat 302",
  note: "These sheets help you keep records of a vehicle or a home. Follow the maker's manual, your workshop's advice and the rules that apply where you live.",
  sheets: [vehicleServiceLog, fuelMileageLog, vehicleDocumentTracker, homeMaintenanceLog, homeServiceContacts, homeInventoryList, rentPaymentRecord, utilityBillTracker],
};
