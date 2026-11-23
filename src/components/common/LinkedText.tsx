import React from 'react';
import { Link } from 'react-router-dom';
import { linkPieces, type LinkOptions } from '../../lib/toolLinks';

/** Text with its tool names turned into links (see src/lib/toolLinks.ts). Plain text stays plain. */
export const LinkedText: React.FC<{ text: string } & LinkOptions> = ({ text, auto, seen, exclude }) => (
  <>
    {linkPieces(text, { auto, seen, exclude }).map((piece, index) => (piece.path
      ? <Link key={index} to={piece.path} className="font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-900">{piece.text}</Link>
      : <React.Fragment key={index}>{piece.text}</React.Fragment>))}
  </>
);
