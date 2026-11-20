import { habitSheet, tableSheet, voucherSheet, minutesSheet } from './simple';
import type { Family, SheetDef } from './types';


const habitTracker: SheetDef = habitSheet({
  "id": "habit-tracker-printable",
  "label": "Habit tracker",
  "hint": "Daily habits by month",
  "title": "Habit tracker",
  "defaults": "Wake up early\nExercise\nRead 20 minutes\nDrink water\nNo sugar\nSleep on time\nPrayer or meditation\nTidy up",
  "listLabel": "Habits",
  "legend": "Fill a box each day you keep the habit. Count the days at the end of the month."
});

const monthlyExpenseTracker: SheetDef = tableSheet({
  "id": "monthly-expense-tracker-printable",
  "label": "Monthly expense tracker",
  "hint": "Daily spending by category",
  "title": "Expense tracker",
  "landscape": false,
  "columns": [
    {
      "label": "Date",
      "w": 1.4
    },
    {
      "label": "Item",
      "w": 3.6
    },
    {
      "label": "Category",
      "w": 2.0
    },
    {
      "label": "Amount (Rs.)",
      "w": 1.7
    },
    {
      "label": "Paid by",
      "w": 1.5
    }
  ],
  "rows": 30,
  "maxRows": 40,
  "top": [
    "Month:",
    "Total spent (Rs.):"
  ]
});

const savingsGoalTracker: SheetDef = tableSheet({
  "id": "savings-goal-tracker-printable",
  "label": "Savings goal tracker",
  "hint": "Deposits toward a goal",
  "title": "Savings goal tracker",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Date",
      "w": 1.6
    },
    {
      "label": "Saved (Rs.)",
      "w": 1.8
    },
    {
      "label": "Total so far (Rs.)",
      "w": 2.0
    },
    {
      "label": "Left to go (Rs.)",
      "w": 2.0
    },
    {
      "label": "Notes",
      "w": 3.0
    }
  ],
  "rows": 26,
  "maxRows": 36,
  "top": [
    "Goal:",
    "Target (Rs.):"
  ],
  "numbered": true
});

const travelPackingList: SheetDef = tableSheet({
  "id": "travel-packing-list-printable",
  "label": "Travel packing list",
  "hint": "Items to pack and tick",
  "title": "Packing list",
  "landscape": false,
  "columns": [
    {
      "label": "Item",
      "w": 3.2
    },
    {
      "label": "Packed",
      "w": 1.0
    },
    {
      "label": "Item",
      "w": 3.2
    },
    {
      "label": "Packed",
      "w": 1.0
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Trip:",
    "Dates:"
  ],
  "list": {
    "label": "Items",
    "hint": "One per line, up to 30. They fill the first Item column.",
    "defaults": "Clothes\nUnderwear and socks\nNight clothes\nShoes and slippers\nToiletries\nMedicines you use\nPhone and charger\nPower bank\nWallet and cards\nTickets and ID\nWater bottle\nUmbrella or cap"
  }
});

const travelItineraryPlanner: SheetDef = tableSheet({
  "id": "travel-itinerary-planner-printable",
  "label": "Travel itinerary planner",
  "hint": "Days, places, stays and bookings",
  "title": "Travel itinerary",
  "landscape": true,
  "columns": [
    {
      "label": "Day",
      "w": 0.8
    },
    {
      "label": "Date",
      "w": 1.4
    },
    {
      "label": "Place or activity",
      "w": 3.4
    },
    {
      "label": "Stay",
      "w": 2.4
    },
    {
      "label": "Travel",
      "w": 2.0
    },
    {
      "label": "Booking ref.",
      "w": 1.8
    },
    {
      "label": "Cost (Rs.)",
      "w": 1.4
    },
    {
      "label": "Notes",
      "w": 2.0
    }
  ],
  "rows": 10,
  "maxRows": 16,
  "top": [
    "Trip:",
    "Travellers:"
  ]
});

const groceryShoppingList: SheetDef = tableSheet({
  "id": "grocery-shopping-list-printable",
  "label": "Grocery shopping list",
  "hint": "Items, quantity and tick",
  "title": "Grocery list",
  "landscape": false,
  "columns": [
    {
      "label": "Item",
      "w": 3.0
    },
    {
      "label": "Qty",
      "w": 1.0
    },
    {
      "label": "Got it",
      "w": 0.9
    },
    {
      "label": "Item",
      "w": 3.0
    },
    {
      "label": "Qty",
      "w": 1.0
    },
    {
      "label": "Got it",
      "w": 0.9
    }
  ],
  "rows": 26,
  "maxRows": 34,
  "top": [
    "Date:",
    "Shop:"
  ],
  "list": {
    "label": "Items (optional)",
    "hint": "One per line, up to 34. They fill the first Item column.",
    "defaults": "Rice\nAtta\nDal\nOil\nSugar\nTea\nSalt\nMilk\nVegetables\nFruits\nSoap\nDetergent"
  }
});

const subscriptionTracker: SheetDef = tableSheet({
  "id": "subscription-tracker-printable",
  "label": "Subscription tracker",
  "hint": "Recurring payments and renewals",
  "title": "Subscription tracker",
  "landscape": true,
  "columns": [
    {
      "label": "Service",
      "w": 3.0
    },
    {
      "label": "Cost (Rs.)",
      "w": 1.5
    },
    {
      "label": "Every",
      "w": 1.4
    },
    {
      "label": "Billing date",
      "w": 1.6
    },
    {
      "label": "Paid through",
      "w": 2.0
    },
    {
      "label": "Cancel by",
      "w": 1.5
    },
    {
      "label": "Notes",
      "w": 3.0
    }
  ],
  "rows": 14,
  "maxRows": 22,
  "top": [
    "Year:"
  ],
  "list": {
    "label": "Services (optional)",
    "hint": "One per line, up to 22. They are printed in the service column.",
    "defaults": ""
  }
});

const workoutLog: SheetDef = tableSheet({
  "id": "workout-log-printable",
  "label": "Workout log",
  "hint": "Exercises, sets, reps and weight",
  "title": "Workout log",
  "landscape": true,
  "columns": [
    {
      "label": "Date",
      "w": 1.5
    },
    {
      "label": "Exercise",
      "w": 3.6
    },
    {
      "label": "Sets",
      "w": 1.0
    },
    {
      "label": "Reps",
      "w": 1.2
    },
    {
      "label": "Weight (kg)",
      "w": 1.4
    },
    {
      "label": "Time or distance",
      "w": 1.8
    },
    {
      "label": "Notes",
      "w": 3.0
    }
  ],
  "rows": 22,
  "maxRows": 30,
  "top": [
    "Name:",
    "Goal:"
  ]
});

const customerOrderRegister: SheetDef = tableSheet({
  "id": "customer-order-register-printable",
  "label": "Customer order register",
  "hint": "Orders, advance and delivery",
  "title": "Customer order register",
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
      "label": "Customer",
      "w": 2.4
    },
    {
      "label": "Phone",
      "w": 1.8
    },
    {
      "label": "Order or item",
      "w": 3.0
    },
    {
      "label": "Amount (Rs.)",
      "w": 1.4
    },
    {
      "label": "Advance (Rs.)",
      "w": 1.4
    },
    {
      "label": "Balance (Rs.)",
      "w": 1.4
    },
    {
      "label": "Delivery",
      "w": 1.4
    },
    {
      "label": "Done",
      "w": 0.9
    }
  ],
  "rows": 18,
  "maxRows": 26,
  "top": [
    "Business:",
    "Month:"
  ],
  "numbered": true
});

const weeklyTimesheet: SheetDef = tableSheet({
  "id": "weekly-timesheet-printable",
  "label": "Weekly timesheet",
  "hint": "Hours worked each day",
  "title": "Weekly timesheet",
  "landscape": true,
  "columns": [
    {
      "label": "Day and date",
      "w": 2.2
    },
    {
      "label": "In",
      "w": 1.2
    },
    {
      "label": "Out",
      "w": 1.2
    },
    {
      "label": "Break",
      "w": 1.2
    },
    {
      "label": "Hours",
      "w": 1.2
    },
    {
      "label": "Task or project",
      "w": 4.0
    },
    {
      "label": "Supervisor sign",
      "w": 2.0
    }
  ],
  "rows": 7,
  "maxRows": 14,
  "top": [
    "Name:",
    "Week of:",
    "Rate (Rs.):"
  ],
  "list": {
    "label": "Days (optional)",
    "hint": "One per line, up to 14, such as Mon 3 Nov. They fill the first column.",
    "defaults": "Monday\nTuesday\nWednesday\nThursday\nFriday\nSaturday\nSunday"
  }
});

const visitorRegister: SheetDef = tableSheet({
  "id": "visitor-register-printable",
  "label": "Visitor register",
  "hint": "Visitors, purpose and time",
  "title": "Visitor register",
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
      "label": "Visitor name",
      "w": 2.6
    },
    {
      "label": "Phone",
      "w": 1.8
    },
    {
      "label": "Whom to meet",
      "w": 2.2
    },
    {
      "label": "Purpose",
      "w": 2.6
    },
    {
      "label": "In",
      "w": 1.0
    },
    {
      "label": "Out",
      "w": 1.0
    },
    {
      "label": "Signature",
      "w": 1.8
    }
  ],
  "rows": 20,
  "maxRows": 28,
  "top": [
    "Place:",
    "Month:"
  ],
  "numbered": true
});

export const LIFE_FAMILY: Family = {
  key: 'life',
  headingLabel: "Name or business",
  headingPlaceholder: "Priya  or  Sharma Traders",
  note: "These sheets help you keep your own records. Pay, tax, labour and visitor rules are set by the law and your contracts, which these sheets do not cover.",
  sheets: [habitTracker, monthlyExpenseTracker, savingsGoalTracker, travelPackingList, travelItineraryPlanner, groceryShoppingList, subscriptionTracker, workoutLog, customerOrderRegister, voucherSheet, minutesSheet, weeklyTimesheet, visitorRegister],
};
