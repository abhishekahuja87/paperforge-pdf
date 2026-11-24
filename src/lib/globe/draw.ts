import { angleBetween, clamp, easeInOut, project, slerp, toVec, viewAt, type Projected, type Vec, type View } from './geo';
import type { GlobeStyle } from './styles';
import type { Frame, GlobeOptions, Stop } from './types';
import type { Ring, World } from './world';

/** Everything needed to paint one picture of the globe. */
export interface DrawInput {
  width: number;
  height: number;
  frame: Frame;
  stops: Stop[];
  world: World;
  style: GlobeStyle;
  options: Pick<GlobeOptions, 'line' | 'arc' | 'mover' | 'pin' | 'highlight' | 'labels' | 'caption'>;
  /** Draw the route, pins, labels and caption. False gives a plain globe, for style previews. */
  overlay?: boolean;
}

const TAU = Math.PI * 2;
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';

interface Screen { cx: number; cy: number; r: number; view: View; unit: number }

const toScreen = (s: Screen, p: Projected): [number, number] => [s.cx + p.x * s.r, s.cy - p.y * s.r];

// ---- shapes of land -------------------------------------------------------------------------------------------

/**
 * Adds one ring of land to the paths. Points on the far side are moved to the edge of the globe (and the edge is followed between them)
 * so a country that wraps round the back still fills correctly. `edge` receives only the parts that are really on the near side.
 */
function addRing(fill: Path2D, edge: Path2D | null, ring: Ring, s: Screen, step: number) {
  const { vec, count } = ring;
  const { east, north, out } = s.view;
  let started = false, onEdge = false, edgeAngle = 0, firstEdgeAngle: number | null = null;
  let px = 0, py = 0, pd = 0, lastX = 0, lastY = 0, hasPrev = false, edgeOpen = false;
  const addArc = (from: number, to: number) => {
    let delta = to - from;
    while (delta > Math.PI) delta -= TAU;
    while (delta < -Math.PI) delta += TAU;
    const n = Math.max(1, Math.ceil(Math.abs(delta) / 0.2));
    for (let k = 1; k <= n; k++) { const a = from + (delta * k) / n; fill.lineTo(s.cx + Math.cos(a) * s.r, s.cy - Math.sin(a) * s.r); }
  };
  const goEdge = (x: number, y: number) => {
    const len = Math.hypot(x, y);
    if (len < 1e-9) return;
    const angle = Math.atan2(y, x);
    if (!started) { fill.moveTo(s.cx + Math.cos(angle) * s.r, s.cy - Math.sin(angle) * s.r); started = true; firstEdgeAngle = angle; }
    else if (onEdge) addArc(edgeAngle, angle);
    else fill.lineTo(s.cx + Math.cos(angle) * s.r, s.cy - Math.sin(angle) * s.r);
    onEdge = true; edgeAngle = angle; edgeOpen = false;
  };
  const goFront = (x: number, y: number, force: boolean) => {
    const sx = s.cx + x * s.r, sy = s.cy - y * s.r;
    if (!started) { fill.moveTo(sx, sy); started = true; lastX = sx; lastY = sy; if (edge) { edge.moveTo(sx, sy); edgeOpen = true; } onEdge = false; return; }
    if (onEdge) {
      fill.lineTo(sx, sy);
      if (edge) { edge.moveTo(sx, sy); edgeOpen = true; }
      lastX = sx; lastY = sy; onEdge = false; return;
    }
    if (!force && Math.abs(sx - lastX) + Math.abs(sy - lastY) < step) return;
    fill.lineTo(sx, sy);
    if (edge) { if (!edgeOpen) { edge.moveTo(lastX, lastY); edgeOpen = true; } edge.lineTo(sx, sy); }
    lastX = sx; lastY = sy;
  };
  for (let i = 0; i < count; i++) {
    const vx = vec[i * 3], vy = vec[i * 3 + 1], vz = vec[i * 3 + 2];
    const x = vx * east[0] + vy * east[1] + vz * east[2];
    const y = vx * north[0] + vy * north[1] + vz * north[2];
    const d = vx * out[0] + vy * out[1] + vz * out[2];
    if (hasPrev && (d >= 0) !== (pd >= 0)) {
      const t = pd / (pd - d);
      const cx = px + (x - px) * t, cy = py + (y - py) * t;
      if (d < 0) { goFront(cx, cy, true); goEdge(cx, cy); } else { goEdge(cx, cy); goFront(cx, cy, true); }
    }
    if (d >= 0) goFront(x, y, i === count - 1); else goEdge(x, y);
    px = x; py = y; pd = d; hasPrev = true;
  }
  if (started) {
    if (onEdge && firstEdgeAngle !== null) addArc(edgeAngle, firstEdgeAngle);
    fill.closePath();
  }
}

/** True when a ring can be skipped: wholly behind the globe, or wholly off the picture. */
function hidden(ring: Ring, s: Screen, visibleCap: number): boolean {
  if (ring.radius * s.r < 0.7) return true;
  const [ox, oy, oz] = s.view.out;
  const angle = Math.acos(clamp(ring.center[0] * ox + ring.center[1] * oy + ring.center[2] * oz, -1, 1));
  return angle - ring.radius > Math.min(Math.PI / 2, visibleCap);
}

// ---- background and globe body ----------------------------------------------------------------------------------

function seeded(seed: number) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) % 4294967296; return value / 4294967296; };
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const random = seeded(7);
  for (let i = 0; i < 150; i++) {
    const x = random() * w, y = random() * h, size = 0.4 + random() * random() * 1.8 * (Math.min(w, h) / 700);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + random() * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, size, 0, TAU); ctx.fill();
  }
}

function drawGraticule(ctx: CanvasRenderingContext2D, s: Screen, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.6, s.unit * 0.0013);
  const line = (points: Vec[]) => {
    let open = false;
    ctx.beginPath();
    for (const v of points) {
      const p = project(v, s.view);
      if (p.depth < 0) { open = false; continue; }
      const [x, y] = toScreen(s, p);
      if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  for (let lon = -180; lon < 180; lon += 30) { const pts: Vec[] = []; for (let lat = -90; lat <= 90; lat += 3) pts.push(toVec(lon, lat)); line(pts); }
  for (let lat = -60; lat <= 60; lat += 30) { const pts: Vec[] = []; for (let lon = -180; lon <= 180; lon += 3) pts.push(toVec(lon, lat)); line(pts); }
  ctx.restore();
}

function drawDots(ctx: CanvasRenderingContext2D, world: World, s: Screen, color: string) {
  const { mask, maskCols, maskRows } = world;
  const cellDeg = 360 / maskCols;
  const pixelsPerDegree = (s.r * Math.PI) / 180;
  // Rows are the same distance apart everywhere, and each row has fewer dots nearer the poles, so the dots are evenly spread and every other row is shifted.
  const spacing = Math.max(cellDeg, 5 / pixelsPerDegree);
  const dot = clamp(pixelsPerDegree * spacing * 0.3, 0.7, s.unit * 0.012);
  ctx.fillStyle = color;
  ctx.beginPath();
  const { east, north, out } = s.view;
  const rows = Math.floor(180 / spacing);
  for (let row = 0; row < rows; row++) {
    const lat = 90 - spacing * (row + 0.5);
    const count = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / spacing));
    const maskRow = Math.min(maskRows - 1, Math.floor((90 - lat) / cellDeg));
    const shift = row % 2 ? 0.5 : 0;
    for (let j = 0; j < count; j++) {
      const lon = -180 + (360 * (j + shift)) / count;
      const col = Math.min(maskCols - 1, Math.floor((((lon + 180) % 360) + 360) % 360 / cellDeg));
      if (!mask[maskRow * maskCols + col]) continue;
      const v = toVec(lon, lat);
      const d = v[0] * out[0] + v[1] * out[1] + v[2] * out[2];
      if (d < 0.02) continue;
      const x = s.cx + (v[0] * east[0] + v[1] * east[1] + v[2] * east[2]) * s.r;
      const y = s.cy - (v[0] * north[0] + v[1] * north[1] + v[2] * north[2]) * s.r;
      if (x < -dot || y < -dot || x > ctx.canvas.width + dot || y > ctx.canvas.height + dot) continue;
      const size = dot * (0.45 + 0.55 * Math.sqrt(d));
      ctx.moveTo(x + size, y); ctx.arc(x, y, size, 0, TAU);
    }
  }
  ctx.fill();
}

function drawBody(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { world, style, frame, stops, options } = input;
  const { width: w, height: h } = input;
  const visibleCap = Math.asin(clamp(Math.hypot(w, h) / 2 / s.r, 0, 1)) + 0.05;
  const step = Math.max(0.8, s.unit / 700);
  const fill = new Path2D(), edge = new Path2D();
  const extra: { path: Path2D; color: string }[] = [];
  const overrides = style.landOverride ?? {};
  const highlighted = new Set(options.highlight ? stops.filter((st) => st.countryId && (st.kind === 'country' ? options.highlight : st.highlight)).map((st) => st.countryId as string) : []);
  const highlightPaths = new Map<string, Path2D>();
  for (const country of world.countries) {
    const wanted = highlighted.has(country.id);
    const override = overrides[country.id];
    for (const ring of country.rings) {
      if (hidden(ring, s, visibleCap)) continue;
      if (override && !style.dots && !style.outline) {
        let entry = extra.find((e) => e.color === override);
        if (!entry) { entry = { path: new Path2D(), color: override }; extra.push(entry); }
        addRing(entry.path, null, ring, s, step);
      } else addRing(fill, style.outline ? null : edge, ring, s, step);
      if (wanted) {
        let path = highlightPaths.get(country.id);
        if (!path) { path = new Path2D(); highlightPaths.set(country.id, path); }
        addRing(path, null, ring, s, step);
      }
    }
  }
  if (style.dots) drawDots(ctx, world, s, style.dots);
  else if (style.outline) {
    const outline = new Path2D();
    for (const country of world.countries) for (const ring of country.rings) if (!hidden(ring, s, visibleCap)) addRing(new Path2D(), outline, ring, s, step);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = style.outline; ctx.globalAlpha = 0.18; ctx.lineWidth = s.unit * 0.009; ctx.stroke(outline);
    ctx.globalAlpha = 0.35; ctx.lineWidth = s.unit * 0.004; ctx.stroke(outline);
    ctx.globalAlpha = 1; ctx.lineWidth = Math.max(0.9, s.unit * 0.0017); ctx.stroke(outline);
    ctx.restore();
  } else {
    ctx.fillStyle = style.land; ctx.fill(fill, 'evenodd');
    for (const entry of extra) { ctx.fillStyle = entry.color; ctx.fill(entry.path, 'evenodd'); }
    ctx.strokeStyle = style.border; ctx.lineWidth = Math.max(0.5, style.borderWidth * (s.unit / 700)); ctx.lineJoin = 'round';
    ctx.stroke(edge);
  }
  // highlighted countries
  if (highlightPaths.size) {
    stops.forEach((st, i) => {
      const wants = st.kind === 'country' ? options.highlight : st.highlight;
      const path = st.countryId && wants ? highlightPaths.get(st.countryId) : undefined;
      if (!path) return;
      ctx.globalAlpha = 0.55 * clamp(frame.glow[i] ?? 0, 0, 1);
      ctx.fillStyle = style.highlight; ctx.fill(path, 'evenodd');
      ctx.globalAlpha = 0.9 * clamp(frame.glow[i] ?? 0, 0, 1);
      ctx.strokeStyle = style.highlight; ctx.lineWidth = Math.max(1, s.unit * 0.0022); ctx.stroke(path);
    });
    ctx.globalAlpha = 1;
  }
}

function drawGlobe(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { style } = input;
  const lightX = s.cx - s.r * 0.32, lightY = s.cy - s.r * 0.38;
  // glow around the globe
  if (s.r < Math.hypot(input.width, input.height) * 0.62) {
    const glow = ctx.createRadialGradient(s.cx, s.cy, s.r * 0.96, s.cx, s.cy, s.r * 1.28);
    glow.addColorStop(0, style.atmosphere); glow.addColorStop(0.35, style.atmosphere.replace(/[\d.]+\)$/, '0.16)')); glow.addColorStop(1, style.atmosphere.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r * 1.3, 0, TAU); ctx.fill();
  }
  ctx.save();
  ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r, 0, TAU); ctx.clip();
  const ocean = ctx.createRadialGradient(lightX, lightY, s.r * 0.05, s.cx, s.cy, s.r * 1.15);
  ocean.addColorStop(0, style.ocean[0]); ocean.addColorStop(1, style.ocean[1]);
  ctx.fillStyle = ocean; ctx.fillRect(s.cx - s.r, s.cy - s.r, s.r * 2, s.r * 2);
  if (style.graticule) drawGraticule(ctx, s, style.graticule);
  drawBody(ctx, input, s);
  if (style.shading > 0) {
    const shade = ctx.createRadialGradient(lightX, lightY, s.r * 0.35, s.cx, s.cy, s.r * 1.12);
    shade.addColorStop(0, 'rgba(255,255,255,0.10)'); shade.addColorStop(0.45, 'rgba(0,0,0,0)'); shade.addColorStop(1, `rgba(0,0,0,${0.62 * style.shading})`);
    ctx.fillStyle = shade; ctx.fillRect(s.cx - s.r, s.cy - s.r, s.r * 2, s.r * 2);
    const rim = ctx.createRadialGradient(s.cx, s.cy, s.r * 0.86, s.cx, s.cy, s.r);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, `rgba(0,0,0,${0.35 * style.shading})`);
    ctx.fillStyle = rim; ctx.fillRect(s.cx - s.r, s.cy - s.r, s.r * 2, s.r * 2);
  }
  ctx.restore();
  // thin bright edge
  ctx.save();
  ctx.strokeStyle = style.atmosphere.replace(/[\d.]+\)$/, '0.55)'); ctx.lineWidth = Math.max(1, s.unit * 0.0022);
  ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r, 0, TAU); ctx.stroke();
  ctx.restore();
}

// ---- route, pins, labels ----------------------------------------------------------------------------------------

const visible = (p: Projected) => p.depth >= 0 || p.x * p.x + p.y * p.y > 1;

/** Points along a hop from stop a to stop b, lifted above the surface in the middle when the arc is lifted. */
function hopPoints(a: Vec, b: Vec, upTo: number, lifted: boolean): { v: Vec; lift: number }[] {
  const angle = angleBetween(a, b);
  const n = Math.max(12, Math.ceil((angle * 180) / Math.PI / 1.5));
  const height = lifted ? 0.07 + 0.16 * clamp(angle / Math.PI, 0, 1) : 0;
  const out: { v: Vec; lift: number }[] = [];
  const last = Math.max(1, Math.ceil(n * upTo));
  for (let i = 0; i <= last; i++) {
    const u = Math.min(upTo, i / n);
    out.push({ v: slerp(a, b, u), lift: 1 + height * Math.sin(Math.PI * u) });
  }
  return out;
}

function strokeSegments(ctx: CanvasRenderingContext2D, s: Screen, points: { v: Vec; lift: number }[]): { x: number; y: number }[] {
  const shown: { x: number; y: number }[] = [];
  let open = false;
  ctx.beginPath();
  for (const pt of points) {
    const p = project(pt.v, s.view, pt.lift);
    if (!visible(p)) { open = false; continue; }
    const [x, y] = toScreen(s, p);
    if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
    shown.push({ x, y });
  }
  ctx.stroke();
  return shown;
}

function drawRoute(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { stops, frame, style, options } = input;
  const lifted = options.arc === 'lifted';
  const width = Math.max(1.6, s.unit * 0.0062);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < stops.length - 1; i++) {
    const progress = frame.routes[i] ?? 0;
    if (progress <= 0.001) continue;
    const a = toVec(stops[i].lon, stops[i].lat), b = toVec(stops[i + 1].lon, stops[i + 1].lat);
    const points = hopPoints(a, b, progress, lifted);
    ctx.strokeStyle = style.route;
    if (options.line === 'rail') {
      // sleepers (short wide dashes) with two thin rails on top
      ctx.globalAlpha = 0.25; ctx.strokeStyle = '#000000'; ctx.lineWidth = width * 2.6; strokeSegments(ctx, s, points);
      ctx.globalAlpha = 1; ctx.strokeStyle = style.route; ctx.lineWidth = width * 2.3; ctx.setLineDash([width * 0.55, width * 1.35]); strokeSegments(ctx, s, points);
      ctx.setLineDash([]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = width * 1.05; strokeSegments(ctx, s, points);
      ctx.strokeStyle = style.route; ctx.lineWidth = width * 0.4; strokeSegments(ctx, s, points);
    } else if (options.line === 'glow') {
      ctx.globalAlpha = 0.16; ctx.lineWidth = width * 4.2; strokeSegments(ctx, s, points);
      ctx.globalAlpha = 0.3; ctx.lineWidth = width * 2.4; strokeSegments(ctx, s, points);
      ctx.globalAlpha = 1; ctx.lineWidth = width; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.9; strokeSegments(ctx, s, points);
      ctx.strokeStyle = style.route; ctx.globalAlpha = 0.85; ctx.lineWidth = width * 0.8; strokeSegments(ctx, s, points);
      ctx.globalAlpha = 1;
    } else {
      // soft dark underline so the line stays readable on any land colour
      ctx.setLineDash([]); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#000000'; ctx.lineWidth = width * 1.7;
      if (options.line === 'solid') strokeSegments(ctx, s, points);
      ctx.globalAlpha = 1; ctx.strokeStyle = style.route; ctx.lineWidth = width;
      if (options.line === 'dashed') ctx.setLineDash([width * 3.4, width * 2.2]);
      else if (options.line === 'dotted') { ctx.setLineDash([0.01, width * 2.4]); ctx.lineWidth = width * 1.25; }
      strokeSegments(ctx, s, points);
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

function planePath(ctx: CanvasRenderingContext2D) {
  const half: [number, number][] = [[1, 0], [0.62, 0.1], [0.2, 0.2], [0.12, 0.92], [-0.02, 0.92], [-0.1, 0.22], [-0.62, 0.17], [-0.78, 0.46], [-0.9, 0.46], [-0.92, 0.12], [-1, 0.1]];
  ctx.beginPath();
  half.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = half.length - 1; i >= 0; i--) ctx.lineTo(half[i][0], -half[i][1]);
  ctx.closePath();
}

/** Top-down vehicles, pointing along +x and drawn in a box about 2 long. Each fills white with a coloured outline and coloured details, like the plane. */
function vehicle(ctx: CanvasRenderingContext2D, kind: 'train' | 'car' | 'bus' | 'ship', color: string) {
  const body = (x: number, y: number, w: number, h: number, r: number) => { roundRect(ctx, x, y, w, h, r); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 0.07; ctx.strokeStyle = color; ctx.stroke(); };
  ctx.fillStyle = color;
  if (kind === 'train') {
    body(0.35, -0.3, 0.75, 0.6, 0.22); // engine, nose first
    ctx.fillStyle = color; roundRect(ctx, 0.72, -0.2, 0.26, 0.4, 0.1); ctx.fill();
    for (let i = 0; i < 3; i++) { body(-0.78 + i * 0.37, -0.28, 0.33, 0.56, 0.08); ctx.fillStyle = color; ctx.fillRect(-0.74 + i * 0.37, -0.1, 0.25, 0.2); }
  } else if (kind === 'bus') {
    body(-0.95, -0.33, 1.9, 0.66, 0.17);
    ctx.fillStyle = color; roundRect(ctx, 0.62, -0.26, 0.24, 0.52, 0.07); ctx.fill();
    for (let i = 0; i < 4; i++) ctx.fillRect(-0.78 + i * 0.36, -0.2, 0.26, 0.4);
  } else if (kind === 'car') {
    body(-0.8, -0.38, 1.6, 0.76, 0.3);
    ctx.fillStyle = color; roundRect(ctx, 0.2, -0.28, 0.3, 0.56, 0.08); ctx.fill(); roundRect(ctx, -0.58, -0.27, 0.22, 0.54, 0.06); ctx.fill(); ctx.fillRect(-0.3, -0.22, 0.46, 0.44);
  } else {
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.bezierCurveTo(0.6, -0.42, 0.2, -0.42, -0.75, -0.42); ctx.lineTo(-0.9, -0.3); ctx.lineTo(-0.9, 0.3); ctx.lineTo(-0.75, 0.42); ctx.bezierCurveTo(0.2, 0.42, 0.6, 0.42, 1, 0); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 0.07; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = color; roundRect(ctx, -0.55, -0.2, 0.7, 0.4, 0.08); ctx.fill(); ctx.fillRect(0.2, -0.12, 0.25, 0.24);
  }
}

function drawMover(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { stops, frame, style, options } = input;
  if (!frame.head || options.mover === 'none') return;
  const { hop, t } = frame.head;
  const a = toVec(stops[hop].lon, stops[hop].lat), b = toVec(stops[hop + 1].lon, stops[hop + 1].lat);
  const angle = angleBetween(a, b);
  const lifted = options.arc === 'lifted';
  const height = lifted ? 0.07 + 0.16 * clamp(angle / Math.PI, 0, 1) : 0;
  const at = (u: number) => project(slerp(a, b, u), s.view, 1 + height * Math.sin(Math.PI * u));
  const p = at(t), q = at(Math.min(1, t + 0.01)), o = at(Math.max(0, t - 0.01));
  if (!visible(p)) return;
  const [x, y] = toScreen(s, p);
  const [x2, y2] = toScreen(s, q), [x1, y1] = toScreen(s, o);
  const heading = Math.atan2(y2 - y1, x2 - x1);
  const size = Math.max(7, s.unit * 0.026);
  ctx.save();
  ctx.translate(x, y);
  if (options.mover === 'plane') {
    ctx.rotate(heading);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = size * 0.5; ctx.shadowOffsetY = size * 0.25;
    ctx.scale(size, size); planePath(ctx);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 0.07; ctx.strokeStyle = style.route; ctx.stroke();
  } else if (options.mover === 'train' || options.mover === 'car' || options.mover === 'bus' || options.mover === 'ship') {
    ctx.rotate(heading);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = size * 0.45; ctx.shadowOffsetY = size * 0.2;
    const grow = options.mover === 'train' ? 1.6 : options.mover === 'bus' ? 1.4 : options.mover === 'car' ? 1.3 : 1.15;
    ctx.scale(size * grow, size * grow); vehicle(ctx, options.mover, style.route);
  } else {
    ctx.fillStyle = style.route; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(0, 0, size * 0.95, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, size * 0.42, 0, TAU); ctx.fill();
    ctx.strokeStyle = style.route; ctx.lineWidth = size * 0.16; ctx.stroke();
  }
  ctx.restore();
}

const easeOutBack = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPins(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { stops, frame, style, options, width: w, height: h } = input;
  const unit = s.unit;
  stops.forEach((stop, i) => {
    const pop = clamp(frame.pins[i] ?? 0, 0, 1);
    if (pop <= 0) return;
    const p = project(toVec(stop.lon, stop.lat), s.view);
    if (p.depth < 0.02) return;
    const [x, y] = toScreen(s, p);
    const grow = easeOutBack(pop);
    const r = Math.max(5, unit * 0.017) * grow;
    ctx.save();
    // pulse
    const pulse = (frame.time * 0.9 + i * 0.3) % 1;
    ctx.globalAlpha = (1 - pulse) * 0.55 * pop; ctx.strokeStyle = style.pin; ctx.lineWidth = Math.max(1.5, unit * 0.004);
    ctx.beginPath(); ctx.arc(x, y, r * (1 + pulse * 2.6), 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    let labelY = y - r * 1.6;
    if (options.pin === 'pin') {
      const head = r * 1.25, tip = y, top = tip - head * 2.3;
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = r * 0.8; ctx.shadowOffsetY = r * 0.3;
      ctx.fillStyle = style.pin; ctx.beginPath();
      ctx.moveTo(x, tip);
      ctx.bezierCurveTo(x - head * 1.05, tip - head * 1.25, x - head, top, x, top);
      ctx.bezierCurveTo(x + head, top, x + head * 1.05, tip - head * 1.25, x, tip);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, top + head * 0.82, head * 0.42, 0, TAU); ctx.fill();
      labelY = top - head * 0.5;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = r * 0.6;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = style.pin; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
      labelY = y - r * 1.4;
    }
    if (options.labels && stop.label) {
      const size = Math.max(11, unit * 0.034);
      ctx.font = `700 ${size}px ${FONT}`;
      const padX = size * 0.7, boxH = size * 1.75;
      const textW = ctx.measureText(stop.label).width;
      const boxW = textW + padX * 2;
      let bx = x - boxW / 2;
      bx = clamp(bx, size * 0.5, w - boxW - size * 0.5);
      const by = clamp(labelY - boxH - size * 0.25, size * 0.4, h - boxH - size * 0.4);
      ctx.globalAlpha = clamp(pop * 1.4, 0, 1);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = size * 0.5; ctx.shadowOffsetY = size * 0.15;
      ctx.fillStyle = style.labelBg; roundRect(ctx, bx, by, boxW, boxH, boxH / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = style.labelText; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(stop.label, bx + padX, by + boxH / 2 + size * 0.04);
    }
    ctx.restore();
  });
}

function drawCaption(ctx: CanvasRenderingContext2D, input: DrawInput, s: Screen) {
  const { options, frame, style, width: w, height: h } = input;
  if (!options.caption || frame.caption <= 0.01) return;
  const size = Math.max(14, s.unit * 0.062);
  ctx.save();
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const maxWidth = w * 0.86;
  const words = options.caption.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; } else current = test;
  }
  if (current) lines.push(current);
  const shown = lines.slice(0, 3);
  const lineHeight = size * 1.2;
  const portrait = h > w * 1.2;
  const startY = (portrait ? h * 0.085 : h * 0.12) + size * 0.8;
  ctx.globalAlpha = frame.caption;
  shown.forEach((line, i) => {
    const y = startY + i * lineHeight - (1 - frame.caption) * size * 0.4;
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = size * 0.35; ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = style.text; ctx.fillText(line, w / 2, y);
  });
  ctx.restore();
}

// ---- one picture -----------------------------------------------------------------------------------------------

export function renderGlobe(ctx: CanvasRenderingContext2D, input: DrawInput) {
  const { width: w, height: h, frame, style } = input;
  const unit = Math.min(w, h);
  const s: Screen = { cx: w / 2, cy: h / 2, r: unit * 0.4 * frame.zoom, view: viewAt(frame.lon, frame.lat), unit };
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, style.bg[0]); bg.addColorStop(1, style.bg[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (style.stars) drawStars(ctx, w, h);
  drawGlobe(ctx, input, s);
  if (input.overlay === false) return;
  drawRoute(ctx, input, s);
  drawMover(ctx, input, s);
  drawPins(ctx, input, s);
  drawCaption(ctx, input, s);
}

export { easeInOut };
