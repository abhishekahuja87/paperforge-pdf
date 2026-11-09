import React from 'react';
import { QrGenerator } from './QrGenerator';

/** The same generator opened on one kind of content, for pages that target a single search. */
export const QrPage: React.FC = () => <QrGenerator initialKind="url" />;
export const WifiQrPage: React.FC = () => <QrGenerator initialKind="wifi" />;
export const ContactQrPage: React.FC = () => <QrGenerator initialKind="contact" />;
