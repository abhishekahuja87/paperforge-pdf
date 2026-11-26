/** Where everything sits on the answer sheet, in millimetres on an A4 page. The sheet printer and the photo reader both use this, so they always agree. */

export const PAGE_MM = { width: 210, height: 297 };
export const BIG_MARKER = 11, SMALL_MARKER = 7;
/** Centres of the four corner squares. The top-left one is bigger, so a sheet can be read even when the photo is sideways or upside down. */
export const MARKERS = [
  { x: 12, y: 12, size: BIG_MARKER }, { x: 198, y: 12, size: SMALL_MARKER },
  { x: 198, y: 285, size: SMALL_MARKER }, { x: 12, y: 285, size: SMALL_MARKER },
];
export const BUBBLE_R = 2.4, ROWS_PER_COLUMN = 25, ANSWERS_TOP = 130, ROW_PITCH = 6, OPTION_PITCH = 7, COLUMN_PITCH = 46;
export const MAX_QUESTIONS = 100, LETTERS = 'ABCDE';

export interface SheetShape { questions: number; options: 4 | 5; digits: number }
export interface Bubble { x: number; y: number }
export interface SheetLayout extends SheetShape {
  /** answers[q][o] is the bubble for option o of question q. */
  answers: Bubble[][];
  /** rollDigits[d][n] is the bubble for digit n in digit column d. */
  rollDigits: Bubble[][];
  columns: number;
  /** Where the question numbers and the option letters are printed. */
  labels: { number: number; x: number; y: number }[];
  columnHeads: { x: number; y: number }[][];
  rollBoxes: { x: number; y: number }[];
}

const ROLL_TOP = 60, ROLL_PITCH = 5.6, ROLL_COLUMN_PITCH = 8;

/** The positions for a sheet with this many questions, options and roll number digits. */
export function sheetLayout(shape: SheetShape): SheetLayout {
  const questions = Math.max(1, Math.min(MAX_QUESTIONS, Math.round(shape.questions))), options = shape.options, digits = Math.max(2, Math.min(5, Math.round(shape.digits)));
  const columns = Math.ceil(questions / ROWS_PER_COLUMN), left = 105 - columns * COLUMN_PITCH / 2 + 2;
  const answers: Bubble[][] = [], labels: SheetLayout['labels'] = [], columnHeads: Bubble[][] = [];
  for (let q = 0; q < questions; q += 1) {
    const col = Math.floor(q / ROWS_PER_COLUMN), row = q % ROWS_PER_COLUMN, x0 = left + col * COLUMN_PITCH, y = ANSWERS_TOP + row * ROW_PITCH;
    labels.push({ number: q + 1, x: x0 + 5, y });
    answers.push(Array.from({ length: options }, (_, o) => ({ x: x0 + 12 + o * OPTION_PITCH, y })));
  }
  for (let col = 0; col < columns; col += 1) columnHeads.push(Array.from({ length: options }, (_, o) => ({ x: left + col * COLUMN_PITCH + 12 + o * OPTION_PITCH, y: ANSWERS_TOP - 7 })));
  const rollX = (d: number) => 190 - 4 - (digits - 1 - d) * ROLL_COLUMN_PITCH;
  const rollDigits = Array.from({ length: digits }, (_, d) => Array.from({ length: 10 }, (_, n) => ({ x: rollX(d), y: ROLL_TOP + n * ROLL_PITCH })));
  const rollBoxes = Array.from({ length: digits }, (_, d) => ({ x: rollX(d), y: ROLL_TOP - 9 }));
  return { questions, options, digits, answers, rollDigits, columns, labels, columnHeads, rollBoxes };
}
