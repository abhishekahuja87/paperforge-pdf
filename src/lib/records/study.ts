import { tableSheet } from './simple';
import type { Family, SheetDef } from './types';


const examTimetablePlanner: SheetDef = tableSheet({
  "id": "exam-timetable-planner-printable",
  "label": "Exam timetable planner",
  "hint": "Dates, subjects and syllabus",
  "title": "Exam timetable",
  "landscape": false,
  "columns": [
    {
      "label": "Date",
      "w": 2.0
    },
    {
      "label": "Day",
      "w": 1.6
    },
    {
      "label": "Subject",
      "w": 3.0
    },
    {
      "label": "Time",
      "w": 1.6
    },
    {
      "label": "Chapters to cover",
      "w": 4.0
    },
    {
      "label": "Revised",
      "w": 1.5
    }
  ],
  "rows": 14,
  "maxRows": 20,
  "list": {
    "label": "Subjects (optional)",
    "hint": "One per line. They are printed in the Subject column.",
    "defaults": ""
  }
});

const revisionPlanner: SheetDef = tableSheet({
  "id": "revision-planner-printable",
  "label": "Revision planner",
  "hint": "Topics, three revision rounds",
  "title": "Revision planner",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Subject and topic",
      "w": 4.0
    },
    {
      "label": "Target date",
      "w": 1.8
    },
    {
      "label": "Round 1",
      "w": 1.2
    },
    {
      "label": "Round 2",
      "w": 1.2
    },
    {
      "label": "Round 3",
      "w": 1.2
    },
    {
      "label": "Sure?",
      "w": 1.2
    }
  ],
  "rows": 20,
  "maxRows": 30,
  "top": [
    "Subject:",
    "Exam:"
  ],
  "list": {
    "label": "Topics (optional)",
    "hint": "One per line, up to 30. Each is printed in the topic column.",
    "defaults": ""
  },
  "numbered": true
});

const assignmentTracker: SheetDef = tableSheet({
  "id": "assignment-tracker-printable",
  "label": "Assignment tracker",
  "hint": "Homework and project deadlines",
  "title": "Assignment tracker",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Subject",
      "w": 2.0
    },
    {
      "label": "Assignment or project",
      "w": 4.5
    },
    {
      "label": "Given on",
      "w": 1.5
    },
    {
      "label": "Due on",
      "w": 1.5
    },
    {
      "label": "Done",
      "w": 1.0
    },
    {
      "label": "Marks",
      "w": 1.2
    }
  ],
  "rows": 18,
  "maxRows": 28,
  "list": {
    "label": "Subjects or assignments (optional)",
    "hint": "One per line. They are printed in the first free column.",
    "defaults": ""
  },
  "numbered": true
});

const weeklyStudyTimetable: SheetDef = tableSheet({
  "id": "weekly-study-timetable-printable",
  "label": "Weekly study timetable",
  "hint": "Time slots by days of the week",
  "title": "Weekly study timetable",
  "landscape": true,
  "columns": [
    {
      "label": "Time",
      "w": 1.7
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
  "rows": 12,
  "maxRows": 16,
  "list": {
    "label": "Time slots",
    "hint": "One per line, for example 6-7 am. They are printed down the first column.",
    "defaults": "6:00 - 7:00 am\n7:00 - 8:00 am\n8:00 - 9:00 am\n9:00 am - 1:00 pm\n1:00 - 2:00 pm\n2:00 - 4:00 pm\n4:00 - 5:00 pm\n5:00 - 6:00 pm\n6:00 - 7:00 pm\n7:00 - 8:00 pm\n8:00 - 9:00 pm\n9:00 - 10:00 pm"
  }
});

const readingLog: SheetDef = tableSheet({
  "id": "reading-log-printable",
  "label": "Reading log",
  "hint": "Books read, dates and notes",
  "title": "Reading log",
  "landscape": true,
  "columns": [
    {
      "label": "No.",
      "w": 0.7
    },
    {
      "label": "Book title",
      "w": 4.0
    },
    {
      "label": "Author",
      "w": 2.5
    },
    {
      "label": "Started",
      "w": 1.4
    },
    {
      "label": "Finished",
      "w": 1.4
    },
    {
      "label": "Pages",
      "w": 1.0
    },
    {
      "label": "Rating",
      "w": 1.2
    },
    {
      "label": "Notes",
      "w": 3.0
    }
  ],
  "rows": 16,
  "maxRows": 24,
  "list": {
    "label": "Book titles (optional)",
    "hint": "One per line. They are printed in the title column.",
    "defaults": ""
  },
  "numbered": true
});

const chapterSyllabusChecklist: SheetDef = tableSheet({
  "id": "chapter-syllabus-checklist-printable",
  "label": "Chapter and syllabus checklist",
  "hint": "Chapters with study stages",
  "title": "Syllabus checklist",
  "landscape": false,
  "columns": [
    {
      "label": "No.",
      "w": 0.8
    },
    {
      "label": "Chapter or topic",
      "w": 5.0
    },
    {
      "label": "Read",
      "w": 1.1
    },
    {
      "label": "Notes",
      "w": 1.1
    },
    {
      "label": "Practice",
      "w": 1.1
    },
    {
      "label": "Revised",
      "w": 1.1
    },
    {
      "label": "Tested",
      "w": 1.1
    }
  ],
  "rows": 24,
  "maxRows": 32,
  "top": [
    "Subject:",
    "Class:"
  ],
  "list": {
    "label": "Chapters (optional)",
    "hint": "One per line, up to 32. They are printed in the chapter column.",
    "defaults": ""
  },
  "numbered": true
});

export const STUDY_FAMILY: Family = {
  key: 'study',
  headingLabel: "Student name",
  headingPlaceholder: "Riya Sharma, Class 9",
  note: "These sheets help you plan and record your studies. Follow your school's or board's own dates and formats.",
  sheets: [examTimetablePlanner, revisionPlanner, assignmentTracker, weeklyStudyTimetable, readingLog, chapterSyllabusChecklist],
};
