import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardPaste, Copy, Download, FileUp, ListPlus, Play, Plus, Trash2 } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import {
  DEFAULT_QUIZ_SHOW, MODES, blankQuestion, buildQuizSlides, clampSeconds, emptyQuiz, formatDuration, newKey, parseQuizText, prepareQuiz, quizIssues, quizToText, readQuiz,
  totalSeconds, trueFalseQuestion, withoutImages, type Quiz, type QuizMode, type QuizQuestion, type QuizShow,
} from '../../../lib/classroom/quiz';
import { QuizPlayer } from './QuizPlayer';
import { QuizQuestionEditor } from './QuizQuestionEditor';

const STORAGE_KEY = 'mdu-quiz-v1';
const FIELD = 'min-h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const LABEL = 'block space-y-1 text-xs font-bold text-stone-700';
const ORANGE = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500';
const OUTLINE = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50';

const SHOW_LABELS: Array<[keyof QuizShow, string]> = [
  ['title', 'Quiz name'], ['subject', 'Subject or class'], ['date', 'Date'], ['number', 'Question number'], ['timer', 'Countdown timer'], ['explanation', 'Explanations'], ['light', 'Light screen (default is dark)'],
];

const SAMPLE: Array<{ text: string; options: string[]; correct: number; explanation: string }> = [
  { text: 'What is 7 × 8?', options: ['54', '56', '58', '64'], correct: 1, explanation: '7 × 8 = 56. Seven eights make fifty-six.' },
  { text: 'Which of these is a prime number?', options: ['9', '15', '17', '21'], correct: 2, explanation: '17 can only be divided exactly by 1 and by itself. The others also divide by 3.' },
  { text: 'True or false: a triangle has three sides.', options: ['True', 'False'], correct: 0, explanation: 'Tri means three. A triangle has three sides and three corners.' },
];

const sampleQuestions = (): QuizQuestion[] => SAMPLE.map((entry) => ({
  key: newKey(), text: entry.text, correct: entry.correct, explanation: entry.explanation, options: entry.options.map((text) => ({ key: newKey(), text })),
}));

function loadQuiz(): Quiz {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return (raw ? readQuiz(JSON.parse(raw)) : null) ?? emptyQuiz();
  } catch {
    return emptyQuiz();
  }
}

export const QuizMaker: React.FC = () => {
  const [quiz, setQuiz] = useState<Quiz>(loadQuiz);
  const [previous, setPrevious] = useState<Quiz | null>(null);
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<QuizMode>('learn');
  const [show, setShow] = useState<QuizShow>(DEFAULT_QUIZ_SHOW);
  const [seconds, setSeconds] = useState(20);
  const [reveal, setReveal] = useState(8);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [blankCount, setBlankCount] = useState(5);
  const [blankType, setBlankType] = useState<'mcq' | 'tf'>('mcq');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [playQuiz, setPlayQuiz] = useState<Quiz | null>(null);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const questionsRef = useRef<HTMLElement>(null);
  // On a phone the questions are below the buttons, so bring them into view to show what was added.
  const showQuestions = () => { window.setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz));
    } catch {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutImages(quiz))); } catch { /* the quiz still works without saving */ }
    }
  }, [quiz]);

  const timing = useMemo(() => ({ seconds: clampSeconds(seconds, 3, 600, 20), reveal: clampSeconds(reveal, 1, 120, 8) }), [seconds, reveal]);
  const issues = useMemo(() => quizIssues(quiz), [quiz]);
  const count = quiz.questions.length;
  const hasPictures = quiz.questions.some((question) => question.image || question.options.some((option) => option.image));
  const close = useCallback(() => setPlayQuiz(null), []);

  const change = (next: Quiz, message: string) => { setPrevious(quiz); setQuiz(next); setNotice(message); };
  const setQuestion = (key: string, question: QuizQuestion) => setQuiz((current) => ({ ...current, questions: current.questions.map((entry) => (entry.key === key ? question : entry)) }));
  const moveQuestion = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= quiz.questions.length) return;
    const next = [...quiz.questions];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setQuiz({ ...quiz, questions: next });
  };
  const copyQuestion = (index: number) => {
    const source = quiz.questions[index];
    if (!source) return;
    const copy: QuizQuestion = { ...source, key: newKey(), options: source.options.map((option) => ({ ...option, key: newKey() })) };
    const next = [...quiz.questions];
    next.splice(index + 1, 0, copy);
    setQuiz({ ...quiz, questions: next });
    setFreshKey(copy.key);
  };
  const addQuestion = (type: 'mcq' | 'tf') => {
    const question = type === 'tf' ? trueFalseQuestion() : blankQuestion(4);
    setQuiz({ ...quiz, questions: [...quiz.questions, question] });
    setFreshKey(question.key);
  };
  const addBlank = () => {
    const total = clampSeconds(blankCount, 1, 100, 5);
    const made = Array.from({ length: total }, () => (blankType === 'tf' ? trueFalseQuestion() : blankQuestion(4)));
    change({ ...quiz, questions: [...quiz.questions, ...made] }, `Added ${total} empty ${total === 1 ? 'question' : 'questions'}. Fill them in below.`);
    setFreshKey(made[0]?.key ?? null);
    showQuestions();
  };
  const loadSample = () => {
    change({ ...quiz, title: 'Sample quiz', subject: 'Maths', questions: sampleQuestions() }, 'Loaded a sample quiz. Change anything below.');
    showQuestions();
  };
  const importPasted = () => {
    const found = parseQuizText(pasted);
    if (found.length === 0) { setNotice('No questions found. Start each question with a number, add options A) B) C) D), then a line like Answer: B.'); return; }
    change({ ...quiz, questions: [...quiz.questions, ...found] }, `Added ${found.length} ${found.length === 1 ? 'question' : 'questions'} from your text. Check the correct answers.`);
    setPasted('');
    setPasteOpen(false);
    showQuestions();
  };
  const clearAll = () => change({ ...quiz, questions: [] }, 'Cleared all questions.');
  const undo = () => { if (previous) setQuiz(previous); setPrevious(null); setNotice('Undone.'); };

  const copy = async (part: 'paper' | 'key') => {
    try {
      await navigator.clipboard.writeText(quizToText(quiz, part));
      setNotice(part === 'paper' ? 'Copied the question paper. Paste it into a document.' : 'Copied the answer key. Paste it into a document.');
    } catch {
      setNotice('Could not copy here. Try again after tapping the page.');
    }
  };
  const saveFile = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(quiz)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(quiz.title.trim() || 'quiz').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.quiz.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Saved a quiz file to your downloads. Open it later with "Open a quiz file".');
  };
  const openFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const opened = readQuiz(JSON.parse(await file.text()));
      if (!opened || opened.questions.length === 0) { setNotice('That file is not a quiz saved from this tool.'); return; }
      change(opened, `Opened ${opened.questions.length} ${opened.questions.length === 1 ? 'question' : 'questions'}.`);
    } catch {
      setNotice('That file could not be read as a quiz.');
    }
    if (fileInput.current) fileInput.current.value = '';
  };
  const start = () => setPlayQuiz(prepareQuiz(quiz, { shuffleQuestions, shuffleOptions }));

  const auto = mode !== 'learn';
  const length = auto ? formatDuration(totalSeconds(buildQuizSlides(quiz, mode, timing))) : '';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={LABEL}>Quiz name<input type="text" value={quiz.title} onChange={(event) => setQuiz({ ...quiz, title: event.target.value })} className={FIELD} /></label>
          <label className={LABEL}>Subject or class (optional)<input type="text" value={quiz.subject} onChange={(event) => setQuiz({ ...quiz, subject: event.target.value })} placeholder="For example Maths, Class 6" className={FIELD} /></label>
          <label className={LABEL}>Date<input type="date" value={quiz.date} onChange={(event) => setQuiz({ ...quiz, date: event.target.value })} className={FIELD} /></label>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-black text-stone-900">Quick start</h2>
          <p className="text-xs text-stone-500">Every question has 2 to 6 options, one correct answer, an optional picture and an optional explanation.</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className={LABEL}>How many questions?<input type="number" inputMode="numeric" min={1} max={100} value={blankCount} onChange={(event) => setBlankCount(Number(event.target.value))} className={`${FIELD} w-28`} /></label>
            <label className={LABEL}>Type
              <select value={blankType} onChange={(event) => setBlankType(event.target.value === 'tf' ? 'tf' : 'mcq')} className={`${FIELD} w-48`}>
                <option value="mcq">Multiple choice (4 options)</option>
                <option value="tf">True or false</option>
              </select>
            </label>
            <button type="button" onClick={addBlank} className={ORANGE}><ListPlus className="h-4 w-4" aria-hidden="true" />Create questions</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadSample} className={OUTLINE}>Try a sample quiz</button>
            <button type="button" onClick={() => setPasteOpen(!pasteOpen)} aria-expanded={pasteOpen} className={OUTLINE}><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Paste questions from a document</button>
            <button type="button" onClick={() => fileInput.current?.click()} className={OUTLINE}><FileUp className="h-4 w-4" aria-hidden="true" />Open a quiz file</button>
            <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => void openFile(event.target.files?.[0])} />
          </div>
          {pasteOpen && (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <label className={LABEL}>Paste your questions
                <textarea rows={8} value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={'1. What is 2 + 3?\nA) 4\nB) 5\nC) 6\nAnswer: B\nExplanation: Two plus three is five.\n\n2. Which is a fruit?\nA) Car\nB) Apple\nAnswer: B'} className={`${FIELD} font-mono text-xs`} />
              </label>
              <button type="button" onClick={importPasted} disabled={pasted.trim() === ''} className={ORANGE}>Add these questions</button>
            </div>
          )}
        </div>

        {notice && (
          <p role="status" className="flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-900">
            {notice}
            {previous && <button type="button" onClick={undo} className="underline">Undo</button>}
          </p>
        )}
      </section>

      <section ref={questionsRef} className="scroll-mt-[69px] space-y-2 rounded-2xl border border-stone-200 bg-white/70 p-3 sm:p-4" aria-label="Questions">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-black tracking-tight text-stone-900">Questions <span className="text-xs font-semibold text-stone-500">({count})</span></h2>
          {count > 0 && <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 underline"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear all</button>}
        </div>
        {count === 0 ? (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">No questions yet. Use a quick start above or add one below.</p>
        ) : (
          <ol className="space-y-2">
            {quiz.questions.map((question, index) => (
              <QuizQuestionEditor
                key={question.key}
                question={question}
                index={index}
                count={count}
                startOpen={question.key === freshKey}
                onChange={(next) => setQuestion(question.key, next)}
                onMove={(by) => moveQuestion(index, by)}
                onCopy={() => copyQuestion(index)}
                onRemove={() => change({ ...quiz, questions: quiz.questions.filter((entry) => entry.key !== question.key) }, `Removed question ${index + 1}.`)}
              />
            ))}
          </ol>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addQuestion('mcq')} className={OUTLINE}><Plus className="h-4 w-4" aria-hidden="true" />Add a question</button>
          <button type="button" onClick={() => addQuestion('tf')} className={OUTLINE}><Plus className="h-4 w-4" aria-hidden="true" />Add a true or false</button>
        </div>
      </section>

      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">How to play</h2>
        <div role="radiogroup" aria-label="Play mode" className="grid gap-2 sm:grid-cols-3">
          {MODES.map((entry) => (
            <label key={entry.id} className={`cursor-pointer rounded-xl border p-3 transition ${mode === entry.id ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-300'}`}>
              <input type="radio" name="quiz-mode" value={entry.id} checked={mode === entry.id} onChange={() => setMode(entry.id)} className="sr-only" />
              <span className="block text-sm font-bold text-stone-900">{entry.label}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-stone-600">{entry.blurb}</span>
            </label>
          ))}
        </div>
        {auto && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>Seconds for each question<input type="number" inputMode="numeric" min={3} max={600} value={seconds} onChange={(event) => setSeconds(Number(event.target.value))} className={FIELD} /></label>
            {mode === 'mock' && <label className={LABEL}>Seconds to show each answer<input type="number" inputMode="numeric" min={1} max={120} value={reveal} onChange={(event) => setReveal(Number(event.target.value))} className={FIELD} /></label>}
          </div>
        )}
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {SHOW_LABELS.map(([key, label]) => (
            <label key={key} className="flex min-h-9 items-center gap-2 text-sm text-stone-800">
              <input type="checkbox" checked={show[key]} onChange={(event) => setShow({ ...show, [key]: event.target.checked })} className="h-4 w-4 accent-orange-700" />
              {label}
            </label>
          ))}
          <label className="flex min-h-9 items-center gap-2 text-sm text-stone-800"><input type="checkbox" checked={shuffleQuestions} onChange={(event) => setShuffleQuestions(event.target.checked)} className="h-4 w-4 accent-orange-700" />Shuffle the questions</label>
          <label className="flex min-h-9 items-center gap-2 text-sm text-stone-800"><input type="checkbox" checked={shuffleOptions} onChange={(event) => setShuffleOptions(event.target.checked)} className="h-4 w-4 accent-orange-700" />Shuffle the options</label>
        </div>
        {issues.length > 0 && count > 0 && (
          <ul role="alert" className="list-disc space-y-0.5 rounded-lg bg-amber-50 px-6 py-2 text-xs text-amber-900">{issues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}{issues.length > 5 && <li>And {issues.length - 5} more.</li>}</ul>
        )}
        <p className="text-sm font-semibold text-stone-800">{count === 0 ? 'Add some questions to start.' : `${count} ${count === 1 ? 'question' : 'questions'}${auto ? `, about ${length} on screen` : ', moves when you click'}.`}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={start} disabled={issues.length > 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start {mode === 'learn' ? 'learning' : mode === 'mock' ? 'mock exam' : 'exam'}</button>
          <button type="button" onClick={() => void copy('paper')} disabled={count === 0} className={OUTLINE}><Copy className="h-4 w-4" aria-hidden="true" />Copy question paper</button>
          <button type="button" onClick={() => void copy('key')} disabled={count === 0} className={OUTLINE}><Copy className="h-4 w-4" aria-hidden="true" />Copy answer key</button>
          <button type="button" onClick={saveFile} disabled={count === 0} className={OUTLINE}><Download className="h-4 w-4" aria-hidden="true" />Save quiz file</button>
        </div>
        <Note>
          Your quiz is saved only in this browser{hasPictures ? ' (if the browser is full, pictures may not be kept, so use Save quiz file)' : ''}. Use Save quiz file to keep a copy or move it to another computer. The quiz fills the screen and tries to keep it awake; use the arrow keys, space bar or the buttons to move, pause and close.
        </Note>
      </section>

      {playQuiz && <QuizPlayer quiz={playQuiz} mode={mode} timing={timing} show={show} onClose={close} />}
    </div>
  );
};

export default QuizMaker;
