/**
 * A drawing board: pen strokes kept as lines so they can be undone, drawn on a coloured or gridded background.
 * Pen colours are stored as roles ("red", "main"), so changing from a white board to a blackboard keeps what you drew readable.
 */
export type BoardId = 'white' | 'chalk' | 'black' | 'grid';
export type ShapeId = 'wide' | 'tall' | 'square';
export type PenRole = 'main' | 'red' | 'green' | 'blue' | 'orange';
export type ToolId = PenRole | 'eraser';
export type WidthId = 'thin' | 'medium' | 'thick';

export const BOARD_SIZE: Record<ShapeId, { width: number; height: number }> = { wide: { width: 1280, height: 720 }, tall: { width: 720, height: 1280 }, square: { width: 960, height: 960 } };
export const PEN_WIDTH: Record<WidthId, number> = { thin: 4, medium: 8, thick: 16 };
export const PEN_ROLES: PenRole[] = ['main', 'red', 'green', 'blue', 'orange'];

interface Look { bg: string; dark: boolean; grid: boolean }
export const BOARDS: Record<BoardId, Look> = {
  white: { bg: '#ffffff', dark: false, grid: false },
  grid: { bg: '#ffffff', dark: false, grid: true },
  chalk: { bg: '#1f3d33', dark: true, grid: false },
  black: { bg: '#111111', dark: true, grid: false },
};
const LIGHT: Record<PenRole, string> = { main: '#111827', red: '#dc2626', green: '#15803d', blue: '#1d4ed8', orange: '#ea580c' };
const DARK: Record<PenRole, string> = { main: '#ffffff', red: '#fca5a5', green: '#86efac', blue: '#93c5fd', orange: '#fdba74' };
export const penColor = (board: BoardId, role: PenRole) => (BOARDS[board].dark ? DARK : LIGHT)[role];

export interface Stroke { tool: ToolId; width: number; points: [number, number][] }

/** The lines on one board, and the picture they make. */
export class Board {
  readonly width: number;
  readonly height: number;
  strokes: Stroke[] = [];
  private ink: HTMLCanvasElement;
  private theme: BoardId = 'white';
  private open: Stroke | null = null;

  constructor(width: number, height: number) {
    this.width = width; this.height = height;
    this.ink = document.createElement('canvas'); this.ink.width = width; this.ink.height = height;
  }

  /** Sets which board the pen colours are worked out for, and redraws. */
  setTheme(theme: BoardId): void { this.theme = theme; this.redraw(); }

  private paintSegment(stroke: Stroke, index: number): void {
    const ctx = this.ink.getContext('2d')!;
    const points = stroke.points, erase = stroke.tool === 'eraser';
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = erase ? stroke.width * 4 : stroke.width;
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#000' : penColor(this.theme, stroke.tool);
    ctx.beginPath();
    if (index === 0) { ctx.moveTo(points[0]![0], points[0]![1]); ctx.lineTo(points[0]![0] + 0.01, points[0]![1]); }
    else {
      const a = points[Math.max(0, index - 2)]!, b = points[index - 1]!, c = points[index]!;
      const start = index <= 1 ? a : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      ctx.moveTo(start[0]!, start[1]!); ctx.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
      if (index === points.length - 1) ctx.lineTo(c[0], c[1]);
    }
    ctx.stroke(); ctx.restore();
  }

  begin(tool: ToolId, width: number, x: number, y: number): void {
    this.open = { tool, width, points: [[x, y]] }; this.strokes.push(this.open); this.paintSegment(this.open, 0);
  }
  extend(x: number, y: number): void {
    if (!this.open) return;
    const last = this.open.points[this.open.points.length - 1]!;
    if (Math.hypot(x - last[0], y - last[1]) < 1.5) return;
    this.open.points.push([x, y]); this.paintSegment(this.open, this.open.points.length - 1);
  }
  finish(): void { this.open = null; }

  private redraw(): void {
    this.ink.getContext('2d')!.clearRect(0, 0, this.width, this.height);
    for (const stroke of this.strokes) for (let n = 0; n < Math.max(1, stroke.points.length); n += 1) this.paintSegment(stroke, n);
  }
  undo(): boolean { if (this.strokes.length === 0) return false; this.strokes.pop(); this.open = null; this.redraw(); return true; }
  clear(): void { this.strokes = []; this.open = null; this.redraw(); }
  add(strokes: Stroke[]): void { this.strokes.push(...strokes); this.redraw(); }

  /** Draws the background and the lines onto a canvas of the same size. */
  compose(ctx: CanvasRenderingContext2D, board: BoardId): void {
    const look = BOARDS[board];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = look.bg; ctx.fillRect(0, 0, this.width, this.height);
    if (look.grid) {
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.beginPath();
      const step = Math.round(Math.min(this.width, this.height) / 18);
      for (let x = step; x < this.width; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, this.height); }
      for (let y = step; y < this.height; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(this.width, y + 0.5); }
      ctx.stroke();
    }
    ctx.drawImage(this.ink, 0, 0);
  }
}

/** A small example drawing (a right triangle with a square mark, an arrow and a circle) that fits any board shape. */
export function sampleStrokes(width: number, height: number): Stroke[] {
  const unit = Math.min(width, height) / 100, cx = width / 2, cy = height / 2;
  const at = (x: number, y: number): [number, number] => [cx + x * unit, cy + y * unit];
  const line = (from: [number, number], to: [number, number], steps = 18): [number, number][] => Array.from({ length: steps + 1 }, (_, n) => [from[0] + ((to[0] - from[0]) * n) / steps, from[1] + ((to[1] - from[1]) * n) / steps] as [number, number]);
  const wobble = (points: [number, number][]) => points.map(([x, y], n) => [x + Math.sin(n * 1.7) * 0.8, y + Math.cos(n * 1.3) * 0.8] as [number, number]);
  const a = at(-30, 22), b = at(30, 22), c = at(-30, -26);
  const circle: [number, number][] = Array.from({ length: 41 }, (_, n) => [at(0, 0)[0] + Math.cos((n / 40) * Math.PI * 2) * unit * 9, at(0, -4)[1] + Math.sin((n / 40) * Math.PI * 2) * unit * 9] as [number, number]);
  return [
    { tool: 'main', width: PEN_WIDTH.medium, points: wobble([...line(a, b), ...line(b, c), ...line(c, a)]) },
    { tool: 'red', width: PEN_WIDTH.medium, points: [...line(at(-30, 14), at(-22, 14), 6), ...line(at(-22, 14), at(-22, 22), 6)] },
    { tool: 'blue', width: PEN_WIDTH.medium, points: wobble(line(at(-36, -26), at(-36, 22), 20)) },
    { tool: 'green', width: PEN_WIDTH.medium, points: wobble([...line(at(34, -30), at(34, -8), 10), ...line(at(34, -8), at(30, -14), 4), ...line(at(34, -8), at(38, -14), 4)]) },
    { tool: 'orange', width: PEN_WIDTH.medium, points: wobble(circle) },
  ];
}
