/** Logic for the Classroom Quiz Display. No React and no data files here, so it can be tested on its own. */

export type QuizMode = 'learn' | 'mock' | 'real';

export const MODES: Array<{ id: QuizMode; label: string; blurb: string }> = [
  { id: 'learn', label: 'Learn (manual)', blurb: 'You click, it moves. One click shows the answer, the next click goes to the next question.' },
  { id: 'mock', label: 'Mock exam (auto)', blurb: 'A timer on every question. It moves on by itself and shows the answer after each question.' },
  { id: 'real', label: 'Real exam (auto)', blurb: 'A timer on every question. It moves on by itself. No answers until the end, then the full answer key.' },
];

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
export const LETTERS = 'ABCDEF';

export interface QuizOption { key: string; text: string; /** Picture as a data URL. Optional. */ image?: string }
export interface QuizQuestion {
  key: string;
  text: string;
  image?: string;
  options: QuizOption[];
  /** Index into options. */
  correct: number;
  explanation: string;
}
export interface Quiz { title: string; subject: string; /** YYYY-MM-DD */ date: string; questions: QuizQuestion[] }
export interface QuizTiming { /** Seconds to answer each question (auto modes). */ seconds: number; /** Seconds the answer stays on screen (mock exam). */ reveal: number }
export interface QuizShow { date: boolean; title: boolean; subject: boolean; number: boolean; timer: boolean; explanation: boolean; light: boolean }
export interface PlayOptions { shuffleQuestions: boolean; shuffleOptions: boolean }

export const DEFAULT_QUIZ_SHOW: QuizShow = { date: true, title: true, subject: true, number: true, timer: true, explanation: true, light: false };
export const INTRO_SECONDS = 6;

let counter = 0;
export const newKey = (): string => { counter += 1; return `q${Date.now().toString(36)}${counter.toString(36)}`; };

export const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const emptyQuiz = (): Quiz => ({ title: 'Class quiz', subject: '', date: todayIso(), questions: [] });

export const blankQuestion = (optionCount = 4): QuizQuestion => ({
  key: newKey(), text: '', correct: 0, explanation: '',
  options: Array.from({ length: Math.min(MAX_OPTIONS, Math.max(MIN_OPTIONS, optionCount)) }, () => ({ key: newKey(), text: '' })),
});

export const trueFalseQuestion = (): QuizQuestion => ({
  key: newKey(), text: '', correct: 0, explanation: '',
  options: [{ key: newKey(), text: 'True' }, { key: newKey(), text: 'False' }],
});

export const clampSeconds = (value: number, min: number, max: number, fallback: number): number => (Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback);

/** Problems that stop the quiz from being shown, one line per problem. */
export function quizIssues(quiz: Quiz): string[] {
  const issues: string[] = [];
  if (quiz.questions.length === 0) issues.push('Add at least one question.');
  quiz.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.text.trim() && !question.image) issues.push(`${label}: write the question or add a picture.`);
    const filled = question.options.filter((option) => option.text.trim() || option.image).length;
    if (filled < MIN_OPTIONS || question.options.some((option) => !option.text.trim() && !option.image)) issues.push(`${label}: every option needs text or a picture, and there must be at least ${MIN_OPTIONS}.`);
    if (question.correct < 0 || question.correct >= question.options.length) issues.push(`${label}: choose the correct answer.`);
  });
  return issues;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const a = copy[index] as T;
    copy[index] = copy[other] as T;
    copy[other] = a;
  }
  return copy;
}

/** The quiz as it will be played: optionally shuffled, with the correct index kept in step. The saved quiz is never changed. */
export function prepareQuiz(quiz: Quiz, options: PlayOptions, random: () => number = Math.random): Quiz {
  const questions = quiz.questions.map((question) => {
    if (!options.shuffleOptions) return question;
    const order = shuffled(question.options.map((_, index) => index), random);
    return { ...question, options: order.map((index) => question.options[index] as QuizOption), correct: Math.max(0, order.indexOf(question.correct)) };
  });
  return { ...quiz, questions: options.shuffleQuestions ? shuffled(questions, random) : questions };
}

export type QuizSlide =
  | { kind: 'intro'; seconds: number }
  | { kind: 'question'; question: QuizQuestion; number: number; total: number; seconds: number }
  | { kind: 'answer'; question: QuizQuestion; number: number; total: number; seconds: number }
  | { kind: 'review'; seconds: number }
  | { kind: 'end'; seconds: number };

/** seconds = 0 means the slide waits for a click. */
export function buildQuizSlides(quiz: Quiz, mode: QuizMode, timing: QuizTiming): QuizSlide[] {
  const total = quiz.questions.length;
  const slides: QuizSlide[] = [{ kind: 'intro', seconds: mode === 'learn' ? 0 : INTRO_SECONDS }];
  quiz.questions.forEach((question, index) => {
    const number = index + 1;
    slides.push({ kind: 'question', question, number, total, seconds: mode === 'learn' ? 0 : timing.seconds });
    if (mode !== 'real') slides.push({ kind: 'answer', question, number, total, seconds: mode === 'learn' ? 0 : Math.max(1, timing.reveal) });
  });
  slides.push(mode === 'real' ? { kind: 'review', seconds: 0 } : { kind: 'end', seconds: 0 });
  return slides;
}

export const totalSeconds = (slides: QuizSlide[]): number => slides.reduce((sum, slide) => sum + slide.seconds, 0);

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total} sec`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function formatQuizDate(iso: string, locale = 'en-IN'): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Plain text for pasting into a document or chat. */
export function quizToText(quiz: Quiz, part: 'paper' | 'key'): string {
  const lines: string[] = [quiz.title.trim() || 'Quiz'];
  if (quiz.subject.trim()) lines.push(quiz.subject.trim());
  lines.push(formatQuizDate(quiz.date), '');
  quiz.questions.forEach((question, index) => {
    const correct = question.options[question.correct];
    if (part === 'paper') {
      lines.push(`${index + 1}. ${question.text.trim() || '(picture)'}`);
      question.options.forEach((option, number) => lines.push(`   ${LETTERS[number] ?? '?'}) ${option.text.trim() || '(picture)'}`));
      lines.push('');
    } else {
      lines.push(`${index + 1}. ${LETTERS[question.correct] ?? '?'}) ${correct?.text.trim() || '(picture)'}`);
      if (question.explanation.trim()) lines.push(`   ${question.explanation.trim()}`);
    }
  });
  return lines.join('\n').trimEnd();
}

/**
 * Reads questions pasted from a document. Each question is a line that starts with a number ("1." "1)" "Q1:") or "Q:",
 * options start with A) B) C) D) (or A. / (A) / A:), then "Answer: B" and an optional "Explanation: ...".
 */
export function parseQuizText(text: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let current: { text: string; options: string[]; answer: string; explanation: string } | null = null;
  let field: 'text' | 'option' | 'explanation' | null = null;
  const finish = () => {
    if (!current || !current.text.trim()) { current = null; return; }
    const letter = /^\(?([A-Fa-f])\)?\b/.exec(current.answer.trim())?.[1]?.toUpperCase();
    let correct = letter ? LETTERS.indexOf(letter) : -1;
    if (correct < 0 && current.answer.trim()) correct = current.options.findIndex((option) => option.trim().toLowerCase() === current?.answer.trim().toLowerCase());
    const options = current.options.length >= MIN_OPTIONS ? current.options : [...current.options, ...Array.from({ length: MIN_OPTIONS - current.options.length }, () => '')];
    questions.push({
      key: newKey(), text: current.text.trim(), explanation: current.explanation.trim(),
      options: options.slice(0, MAX_OPTIONS).map((option) => ({ key: newKey(), text: option.trim() })),
      correct: correct >= 0 && correct < Math.min(options.length, MAX_OPTIONS) ? correct : 0,
    });
    current = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const start = /^(?:q(?:uestion)?\s*\d*\s*[:.)-]|\d+\s*[.)]|\d+\s*[:-])\s*(.*)$/i.exec(line);
    const option = /^\(?([A-Fa-f])[).:]\s*(.*)$/.exec(line);
    const answer = /^(?:correct\s+)?(?:ans(?:wer)?|correct)\s*[:\-=]\s*(.*)$/i.exec(line);
    const explanation = /^(?:expl(?:anation)?|why|reason|solution)\s*[:\-=]\s*(.*)$/i.exec(line);
    if (start) {
      finish();
      current = { text: start[1] ?? '', options: [], answer: '', explanation: '' };
      field = 'text';
    } else if (current && answer) { current.answer = answer[1] ?? ''; field = null; }
    else if (current && explanation) { current.explanation = explanation[1] ?? ''; field = 'explanation'; }
    else if (current && option) { current.options.push(option[2] ?? ''); field = 'option'; }
    else if (current) {
      if (field === 'option') current.options[current.options.length - 1] = `${current.options[current.options.length - 1] ?? ''} ${line}`;
      else if (field === 'explanation') current.explanation += ` ${line}`;
      else if (field === 'text') current.text += ` ${line}`;
    }
  }
  finish();
  return questions;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const picture = (value: unknown): string | undefined => (typeof value === 'string' && value.startsWith('data:image/') ? value : undefined);

/** Checks a saved or opened quiz and returns a clean copy, or null when it is not a quiz. */
export function readQuiz(value: unknown): Quiz | null {
  if (!isRecord(value) || !Array.isArray(value.questions)) return null;
  const questions: QuizQuestion[] = [];
  for (const entry of value.questions.slice(0, 300)) {
    if (!isRecord(entry) || !Array.isArray(entry.options)) continue;
    const options = entry.options.slice(0, MAX_OPTIONS).filter(isRecord).map((option) => ({ key: newKey(), text: text(option.text), image: picture(option.image) }));
    if (options.length < MIN_OPTIONS) continue;
    const correct = typeof entry.correct === 'number' && entry.correct >= 0 && entry.correct < options.length ? Math.floor(entry.correct) : 0;
    questions.push({ key: newKey(), text: text(entry.text), image: picture(entry.image), options, correct, explanation: text(entry.explanation) });
  }
  const date = text(value.date);
  return { title: text(value.title) || 'Class quiz', subject: text(value.subject), date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIso(), questions };
}

export const withoutImages = (quiz: Quiz): Quiz => ({
  ...quiz,
  questions: quiz.questions.map((question) => ({ ...question, image: undefined, options: question.options.map((option) => ({ ...option, image: undefined })) })),
});
