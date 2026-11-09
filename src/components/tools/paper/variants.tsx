import React from 'react';
import { PaperMaker } from './PaperMaker';

/** The same maker opened on a particular template, for pages that target one kind of paper. */
export const DotGridPaper: React.FC = () => <PaperMaker initialStyle="dot" />;
export const GraphPaper: React.FC = () => <PaperMaker initialStyle="graph" />;
export const CornellNotesPaper: React.FC = () => <PaperMaker initialStyle="cornell" />;
export const PaperMakerPage: React.FC = () => <PaperMaker initialStyle="lined" />;
export const HexPaper: React.FC = () => <PaperMaker initialStyle="hex" />;
export const CalligraphyPaper: React.FC = () => <PaperMaker initialStyle="calligraphy" />;
export const CrossStitchPaper: React.FC = () => <PaperMaker initialStyle="crossstitch" />;
