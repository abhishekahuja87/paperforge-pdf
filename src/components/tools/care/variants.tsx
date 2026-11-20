import React from 'react';
import { CareSheets } from './CareSheets';

/** The care sheets opened on one sheet. Every page shows all five; picking one goes to that sheet's address. */
export const MedicinePage: React.FC = () => <CareSheets initialKind="medicine" />;
export const HealthLogPage: React.FC = () => <CareSheets initialKind="log" />;
export const EmergencyPage: React.FC = () => <CareSheets initialKind="emergency" />;
export const VisitPage: React.FC = () => <CareSheets initialKind="visit" />;
export const CaregiverPage: React.FC = () => <CareSheets initialKind="caregiver" />;
