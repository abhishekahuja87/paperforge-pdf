import React from 'react';
import { PlannerMaker } from './PlannerMaker';

/** The same maker opened on one kind of planner, for pages that target a single search. */
export const PlannerPage: React.FC = () => <PlannerMaker initialKind="week" />;
export const CalendarPage: React.FC = () => <PlannerMaker initialKind="month" />;
export const DailyPlannerPage: React.FC = () => <PlannerMaker initialKind="day" />;
