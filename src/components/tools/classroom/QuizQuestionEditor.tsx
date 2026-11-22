import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import { LETTERS, MAX_OPTIONS, MIN_OPTIONS, newKey, type QuizOption, type QuizQuestion } from '../../../lib/classroom/quiz';
import { PictureButton } from '../shared/PictureButton';

const FIELD = 'min-h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const SMALL_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40';

interface Props {
  question: QuizQuestion;
  index: number;
  count: number;
  startOpen: boolean;
  onChange: (question: QuizQuestion) => void;
  onMove: (by: -1 | 1) => void;
  onCopy: () => void;
  onRemove: () => void;
}

/** One question: text, optional picture, 2 to 6 options (each with an optional picture), the correct answer and an explanation. */
export const QuizQuestionEditor: React.FC<Props> = ({ question, index, count, startOpen, onChange, onMove, onCopy, onRemove }) => {
  const [open, setOpen] = useState(startOpen);
  const [error, setError] = useState('');
  const setOption = (key: string, patch: Partial<QuizOption>) => onChange({ ...question, options: question.options.map((option) => (option.key === key ? { ...option, ...patch } : option)) });
  const addOption = () => question.options.length < MAX_OPTIONS && onChange({ ...question, options: [...question.options, { key: newKey(), text: '' }] });
  const removeOption = (position: number) => {
    if (question.options.length <= MIN_OPTIONS) return;
    const correct = question.correct === position ? 0 : question.correct > position ? question.correct - 1 : question.correct;
    onChange({ ...question, correct, options: question.options.filter((_, at) => at !== position) });
  };
  const preview = question.text.trim() || (question.image ? '(picture question)' : 'New question');
  const correctText = question.options[question.correct];

  return (
    <li className="rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center gap-2 p-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-stone-50">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-stone-900">{preview}</span>
            {!open && correctText && <span className="block truncate text-[11px] text-stone-500">Answer: {LETTERS[question.correct]}) {correctText.text.trim() || '(picture)'}</span>}
          </span>
          {open ? <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />}
        </button>
        <button type="button" aria-label={`Move question ${index + 1} up`} onClick={() => onMove(-1)} disabled={index === 0} className={SMALL_BUTTON}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" aria-label={`Move question ${index + 1} down`} onClick={() => onMove(1)} disabled={index === count - 1} className={SMALL_BUTTON}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" aria-label={`Copy question ${index + 1}`} onClick={onCopy} className={SMALL_BUTTON}><Copy className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" aria-label={`Remove question ${index + 1}`} onClick={onRemove} className={SMALL_BUTTON}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-stone-100 p-3">
          <label className="block space-y-1 text-xs font-bold text-stone-700">Question
            <textarea rows={2} value={question.text} onChange={(event) => onChange({ ...question, text: event.target.value })} className={FIELD} />
          </label>
          <PictureButton image={question.image} label="Add a picture to the question" onPick={(image) => onChange({ ...question, image })} onError={setError} />

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-stone-700">Options. Tick the correct one.</legend>
            {question.options.map((option, position) => (
              <div key={option.key} className="flex flex-wrap items-center gap-2 rounded-lg bg-stone-50 p-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <input type="radio" name={`correct-${question.key}`} checked={question.correct === position} onChange={() => onChange({ ...question, correct: position })} className="h-4 w-4 accent-green-700" />
                  <span className="sr-only">Correct answer: </span>{LETTERS[position]}
                </label>
                <input type="text" aria-label={`Option ${LETTERS[position]}`} value={option.text} onChange={(event) => setOption(option.key, { text: event.target.value })} className={`${FIELD} min-w-0 flex-1`} />
                <PictureButton image={option.image} label="Picture" onPick={(image) => setOption(option.key, { image })} onError={setError} />
                <button type="button" aria-label={`Remove option ${LETTERS[position]}`} onClick={() => removeOption(position)} disabled={question.options.length <= MIN_OPTIONS} className={SMALL_BUTTON}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            ))}
            <button type="button" onClick={addOption} disabled={question.options.length >= MAX_OPTIONS} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-orange-300 px-3 text-xs font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden="true" />Add an option</button>
          </fieldset>

          <label className="block space-y-1 text-xs font-bold text-stone-700">Explanation (shown with the answer)
            <textarea rows={2} value={question.explanation} onChange={(event) => onChange({ ...question, explanation: event.target.value })} className={FIELD} />
          </label>
          {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
        </div>
      )}
    </li>
  );
};
