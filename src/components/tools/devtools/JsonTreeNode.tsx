import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { childrenOf, isContainer, kindOf, pathKey, type JsonKind } from '../../../lib/devtools/jsonTree';

export const PAGE = 100;

export interface TreeContext {
  isOpen: (key: string, depth: number) => boolean;
  toggle: (key: string, depth: number) => void;
  select: (keys: string[], kinds: JsonKind[]) => void;
  selectedKey: string | null;
  hitKeys: Set<string>;
  currentHitKey: string | null;
  query: string;
  shown: Map<string, number>;
  showMore: (key: string) => void;
  /** Rows left to draw in this pass, so "expand all" on a huge file cannot freeze the page. */
  budget: { left: number };
}

/** Colours keep to slate and violet and rose so they never look like the orange buttons or the green status. */
const VALUE_STYLE: Record<JsonKind, string> = {
  object: 'text-slate-500', array: 'text-slate-500', string: 'text-slate-700', number: 'text-violet-700', boolean: 'text-rose-700', null: 'italic text-slate-400',
};

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark className="rounded bg-yellow-200 px-0.5 text-slate-900">{text.slice(at, at + needle.length)}</mark>{text.slice(at + needle.length)}</>;
};

const COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const LINK = /^https?:\/\/[^\s]+$/i;
const LIMIT = 300;

const Leaf: React.FC<{ value: unknown; kind: JsonKind; query: string }> = ({ value, kind, query }) => {
  if (kind === 'string') {
    const text = value as string;
    const clipped = text.length > LIMIT ? `${text.slice(0, LIMIT)}` : text;
    return (
      <span className={`${VALUE_STYLE.string} break-words`}>
        {COLOR.test(text) && <span className="mr-1 inline-block h-3 w-3 translate-y-0.5 rounded-sm border border-slate-300" style={{ backgroundColor: text }} aria-hidden="true" />}
        &quot;{LINK.test(text) ? <a href={text} target="_blank" rel="noopener noreferrer nofollow" onClick={(event) => event.stopPropagation()} className="underline decoration-dotted"><Highlight text={clipped} query={query} /></a> : <Highlight text={clipped} query={query} />}&quot;
        {text.length > LIMIT && <span className="text-slate-400"> … {(text.length - LIMIT).toLocaleString('en-IN')} more characters</span>}
      </span>
    );
  }
  return <span className={VALUE_STYLE[kind]}><Highlight text={String(value)} query={query} /></span>;
};

interface NodeProps { label?: string; value: unknown; keys: string[]; kinds: JsonKind[]; depth: number; ctx: TreeContext }

/** One row of the tree, and its children when it is open. Children are drawn only for open nodes and in pages of 100. */
export const JsonTreeNode: React.FC<NodeProps> = ({ label, value, keys, kinds, depth, ctx }) => {
  const kind = kindOf(value);
  const key = pathKey(keys);
  const container = isContainer(value);
  const open = container && ctx.isOpen(key, depth);
  const selected = ctx.selectedKey === key;
  const isHit = ctx.hitKeys.has(key);
  const current = ctx.currentHitKey === key;
  const count = container ? (Array.isArray(value) ? value.length : Object.keys(value).length) : 0;

  let children: React.ReactNode = null;
  if (open && container) {
    const entries = childrenOf(value);
    const visible = ctx.shown.get(key) ?? PAGE;
    const drawn: React.ReactNode[] = [];
    for (let index = 0; index < entries.length && index < visible; index += 1) {
      if (ctx.budget.left <= 0) break;
      ctx.budget.left -= 1;
      const [childKey, child] = entries[index]!;
      drawn.push(<JsonTreeNode key={childKey} label={childKey} value={child} keys={[...keys, childKey]} kinds={[...kinds, kind]} depth={depth + 1} ctx={ctx} />);
    }
    const stopped = drawn.length < Math.min(entries.length, visible);
    children = (
      <div role="group" className="ml-[7px] border-l border-slate-200 pl-3">
        {drawn}
        {stopped && <p className="py-1 text-[11px] text-slate-500">Too many rows to show at once. Collapse something above, or use search to jump to what you need.</p>}
        {!stopped && entries.length > visible && (
          <button type="button" onClick={() => ctx.showMore(key)} className="my-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
            Show {Math.min(PAGE, entries.length - visible).toLocaleString('en-IN')} more of {(entries.length - visible).toLocaleString('en-IN')} left
          </button>
        )}
      </div>
    );
  }

  return (
    <div role="treeitem" aria-expanded={container ? open : undefined} aria-selected={selected}>
      <div
        data-hit={current ? 'current' : undefined}
        onClick={() => ctx.select(keys, kinds)}
        className={`flex cursor-pointer items-start gap-1 rounded-md px-1 py-0.5 font-mono text-xs leading-relaxed ${selected ? 'bg-stone-200' : isHit ? 'bg-yellow-50' : 'hover:bg-slate-50'} ${current ? 'ring-2 ring-yellow-400' : ''}`}
      >
        {container ? (
          <button type="button" onClick={(event) => { event.stopPropagation(); ctx.toggle(key, depth); }} aria-label={open ? 'Collapse' : 'Expand'} className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200">
            {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        ) : <span className="inline-block h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="min-w-0 flex-1 break-words">
          {label !== undefined && <><span className={kinds[kinds.length - 1] === 'array' ? 'text-slate-400' : 'font-semibold text-slate-900'}><Highlight text={label} query={ctx.query} /></span><span className="text-slate-400">: </span></>}
          {container
            ? <span className="text-slate-500">{kind === 'array' ? '[' : '{'}{!open && <span className="text-slate-400"> {count.toLocaleString('en-IN')} {kind === 'array' ? (count === 1 ? 'item' : 'items') : count === 1 ? 'key' : 'keys'} </span>}{!open && (kind === 'array' ? ']' : '}')}{open && count === 0 && (kind === 'array' ? ']' : '}')}</span>
            : <Leaf value={value} kind={kind} query={ctx.query} />}
        </span>
      </div>
      {children}
      {open && count > 0 && <div className="pl-5 font-mono text-xs text-slate-400" aria-hidden="true">{kind === 'array' ? ']' : '}'}</div>}
    </div>
  );
};
