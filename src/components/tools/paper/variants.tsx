import React from 'react';
import { PaperMaker } from './PaperMaker';

/** The maker opened on one kind of paper. Every page shows the full paper grid; picking a paper goes to that paper's address. */
export const DotGridPaper: React.FC = () => <PaperMaker initialStyle="dot" />;
export const GraphPaper: React.FC = () => <PaperMaker initialStyle="graph" />;
export const CornellNotesPaper: React.FC = () => <PaperMaker initialStyle="cornell" />;
export const PaperMakerPage: React.FC = () => <PaperMaker initialStyle="lined" />;
export const HexPaper: React.FC = () => <PaperMaker initialStyle="hex" />;
export const CalligraphyPaper: React.FC = () => <PaperMaker initialStyle="calligraphy" />;
export const CrossStitchPaper: React.FC = () => <PaperMaker initialStyle="crossstitch" />;
