import React from 'react';
import { MealPlanner } from './MealPlanner';

/** The meal planner opened on one kind of menu. Every page shows all three kinds; picking one goes to that kind's address. */
export const WeeklyMenuPage: React.FC = () => <MealPlanner initialKind="week" />;
export const DailyMenuPage: React.FC = () => <MealPlanner initialKind="day" />;
export const MonthlyMenuPage: React.FC = () => <MealPlanner initialKind="month" />;
