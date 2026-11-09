import React from 'react';
import { FlashcardMaker } from './FlashcardMaker';

export const FlashcardPage: React.FC = () => <FlashcardMaker />;
/** The same maker with the printer alignment test shown first, for people searching for double-sided printing. */
export const DoubleSidedFlashcardPage: React.FC = () => <FlashcardMaker focus="duplex" />;
