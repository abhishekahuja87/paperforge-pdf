import React from 'react';
import { PaperMaker } from './PaperMaker';

/** The maker opened on one kind of paper: the page is focused on that type (no style picker) and links to the others. The lined page is the full maker with every type. */
export const DotGridPaper: React.FC = () => <PaperMaker initialStyle="dot" focused />;
export const GraphPaper: React.FC = () => <PaperMaker initialStyle="graph" focused />;
export const CornellNotesPaper: React.FC = () => <PaperMaker initialStyle="cornell" focused />;
export const PaperMakerPage: React.FC = () => <PaperMaker initialStyle="lined" />;
export const HexPaper: React.FC = () => <PaperMaker initialStyle="hex" focused />;
export const CalligraphyPaper: React.FC = () => <PaperMaker initialStyle="calligraphy" focused />;
export const CrossStitchPaper: React.FC = () => <PaperMaker initialStyle="crossstitch" focused />;
