import React from 'react';
import { Link } from 'react-router-dom';
import { linkPieces, type LinkOptions, type LinkPiece } from '../../lib/toolLinks';

/**
 * Text with its tool names turned into links (see src/lib/toolLinks.ts). Plain text stays plain.
 *
 * When several blocks share a `seen` set (each tool linked once per page), work the pieces out in the parent's render
 * with `linkPieces` and pass `pieces`. Doing it here would change the shared set while this component renders, and React
 * may render a component more than once (always twice in development), which made the second pass find every tool
 * already "seen" and drop the links.
 */
export const LinkedText: React.FC<({ text: string; pieces?: never } & Omit<LinkOptions, 'seen'>) | { pieces: LinkPiece[]; text?: never }> = (props) => {
  const pieces = props.pieces ?? linkPieces(props.text, { auto: props.auto, exclude: props.exclude });
  return (
    <>
      {pieces.map((piece, index) => (piece.path
        ? <Link key={index} to={piece.path} className="font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-900">{piece.text}</Link>
        : <React.Fragment key={index}>{piece.text}</React.Fragment>))}
    </>
  );
};
