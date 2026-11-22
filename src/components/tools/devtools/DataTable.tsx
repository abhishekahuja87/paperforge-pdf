import React from 'react';

/** A plain table of text cells for previews: sticky header, long cells cut short (the full text shows on hover). */
export const DataTable: React.FC<{ caption: string; columns: string[]; rows: string[][]; maxRows?: number; maxColumns?: number }> = ({ caption, columns, rows, maxRows = 25, maxColumns = 14 }) => {
  const shownColumns = columns.slice(0, maxColumns);
  const shownRows = rows.slice(0, maxRows);
  return (
    <div>
      <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-slate-100 text-slate-700">
            <tr>{shownColumns.map((name) => <th key={name} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{name}</th>)}</tr>
          </thead>
          <tbody>
            {shownRows.map((row, index) => (
              <tr key={index} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                {shownColumns.map((name, column) => <td key={name} title={row[column]} className="max-w-[16rem] truncate px-3 py-1.5 font-mono text-slate-800">{row[column]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        Showing {shownRows.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows{columns.length > shownColumns.length ? ` and ${shownColumns.length} of ${columns.length} columns` : ''}.
      </p>
    </div>
  );
};
