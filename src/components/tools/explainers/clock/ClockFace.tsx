import React, { useRef } from 'react';
import { hourAngle, minuteAngle, pointAngle, type ClockTime } from '../../../../lib/kids/clockTime';

export const HOUR_COLOUR = '#dc2626';
export const MINUTE_COLOUR = '#2563eb';

interface ClockFaceProps {
  time: ClockTime;
  /** When given, the hands can be moved by touch, mouse or pen. */
  onChange?: (time: ClockTime) => void;
  /** Minutes the long hand snaps to while dragging: 1, 5 or 15. */
  step?: number;
  numbers?: boolean;
  showHands?: boolean;
  label?: string;
  className?: string;
}

const polar = (angle: number, radius: number) => {
  const rad = (angle * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(rad), y: 100 - radius * Math.cos(rad) };
};

/** A round analog clock. Drag near the middle for the short hour hand, near the edge for the long minute hand. */
export const ClockFace: React.FC<ClockFaceProps> = ({ time, onChange, step = 1, numbers = true, showHands = true, label, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<'hour' | 'minute' | null>(null);
  const latest = useRef(time);
  latest.current = time;
  const interactive = Boolean(onChange);

  const move = (event: React.PointerEvent<SVGSVGElement>, first: boolean) => {
    const svg = svgRef.current;
    if (!svg || !onChange) return;
    const rect = svg.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (first) drag.current = Math.hypot(dx, dy) / (rect.width / 2) < 0.52 ? 'hour' : 'minute';
    const angle = pointAngle(dx, dy);
    const current = latest.current;
    if (drag.current === 'minute') {
      const m = (Math.round(angle / 6 / step) * step) % 60;
      let h = current.h % 12;
      // Going past the top of the clock moves the hour hand on (or back), as a real clock does.
      if (current.m >= 45 && m <= 15) h = (h + 1) % 12;
      else if (current.m <= 15 && m >= 45) h = (h + 11) % 12;
      if (m !== current.m || h !== current.h) onChange({ h, m });
    } else {
      const h = (((Math.round((angle - current.m * 0.5) / 30)) % 12) + 12) % 12;
      if (h !== current.h % 12) onChange({ h, m: current.m });
    }
  };

  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      role="img"
      aria-label={label ?? 'Analog clock'}
      className={className}
      style={{ touchAction: interactive ? 'none' : undefined, cursor: interactive ? 'grab' : undefined, userSelect: 'none', display: 'block', width: '100%', height: 'auto' }}
      onPointerDown={interactive ? (event) => { event.currentTarget.setPointerCapture(event.pointerId); move(event, true); } : undefined}
      onPointerMove={interactive ? (event) => { if (drag.current) move(event, false); } : undefined}
      onPointerUp={interactive ? () => { drag.current = null; } : undefined}
      onPointerCancel={interactive ? () => { drag.current = null; } : undefined}
    >
      <circle cx="100" cy="100" r="96" fill="#fff" stroke="#1e293b" strokeWidth="4" />
      {ticks.map((i) => {
        const big = i % 5 === 0;
        const a = polar(i * 6, 90);
        const b = polar(i * 6, big ? 80 : 85);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1e293b" strokeWidth={big ? 2.5 : 1} strokeLinecap="round" />;
      })}
      {numbers && Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
        const p = polar(n * 30, 65);
        return <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="19" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#0f172a">{n}</text>;
      })}
      {showHands && (
        <>
          <line x1="100" y1="100" x2={polar(hourAngle(time), 46).x} y2={polar(hourAngle(time), 46).y} stroke={HOUR_COLOUR} strokeWidth="8" strokeLinecap="round" />
          <line x1="100" y1="100" x2={polar(minuteAngle(time), 74).x} y2={polar(minuteAngle(time), 74).y} stroke={MINUTE_COLOUR} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      <circle cx="100" cy="100" r="6" fill="#0f172a" />
    </svg>
  );
};
