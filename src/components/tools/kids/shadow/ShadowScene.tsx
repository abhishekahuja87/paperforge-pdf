import React, { useRef } from 'react';
import { SCENE, SUBJECTS, angleFromPoint, elevation, shadowLength, shadowSide, sunPoint, type SubjectId } from '../../../../lib/kids/shadow';

interface Props {
  alpha: number;
  personX: number;
  subject: SubjectId;
  /** Hide the shadow so a child can guess first. */
  hideShadow?: boolean;
  /** Allow dragging the sun and the subject. */
  onSun?: (alpha: number) => void;
  onMove?: (x: number) => void;
}

const SubjectShape: React.FC<{ subject: SubjectId; height: number }> = ({ subject, height }) => {
  if (subject === 'tree') {
    return (
      <g>
        <rect x={-6} y={-height * 0.45} width={12} height={height * 0.45} fill="#92400e" />
        <circle cx={0} cy={-height * 0.7} r={height * 0.32} fill="#15803d" />
        <circle cx={-14} cy={-height * 0.55} r={height * 0.2} fill="#16a34a" />
      </g>
    );
  }
  if (subject === 'pole') {
    return (
      <g>
        <rect x={-2} y={-height} width={4} height={height} fill="#475569" />
        <path d={`M2 ${-height} h30 l-8 8 l8 8 h-30 z`} fill="#ea580c" />
      </g>
    );
  }
  const body = height * 0.55;
  return (
    <g>
      <circle cx={0} cy={-height + 9} r={9} fill="#fcd9b6" stroke="#92400e" strokeWidth={1} />
      <rect x={-9} y={-height + 18} width={18} height={body - 18 + 8} rx={5} fill="#2563eb" />
      <rect x={-8} y={-height * 0.45} width={6} height={height * 0.45} fill="#1e293b" />
      <rect x={2} y={-height * 0.45} width={6} height={height * 0.45} fill="#1e293b" />
    </g>
  );
};

/** The sun, the sky, a subject and its shadow. The sun and the subject can be dragged. */
export const ShadowScene: React.FC<Props> = ({ alpha, personX, subject, hideShadow, onSun, onMove }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<'sun' | 'person' | null>(null);
  const height = SUBJECTS.find((item) => item.id === subject)?.height ?? 70;
  const sun = sunPoint(alpha);
  const side = shadowSide(alpha);
  const len = shadowLength(height, alpha);
  const dir = side === 'right' ? 1 : -1;
  const tipX = personX + dir * len;
  const rayDx = Math.cos((alpha * Math.PI) / 180);
  const rayDy = Math.sin((alpha * Math.PI) / 180);
  const headY = SCENE.ground - height;

  const toScene = (event: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((event.clientX - rect.left) / rect.width) * SCENE.width, y: ((event.clientY - rect.top) / rect.height) * SCENE.height };
  };
  const start = (which: 'sun' | 'person') => (event: React.PointerEvent) => {
    if (which === 'sun' ? !onSun : !onMove) return;
    drag.current = which;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };
  const move = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const point = toScene(event);
    if (drag.current === 'sun') onSun?.(Math.round(angleFromPoint(point.x, point.y)));
    else onMove?.(Math.round(Math.min(SCENE.maxX, Math.max(SCENE.minX, point.x))));
  };
  const end = () => { drag.current = null; };

  // Parallel rays from the sun, plus one that just touches the top of the head and ends at the tip of the shadow.
  const offsets = [-48, -24, 0, 24, 48];
  const rays = offsets.map((off) => {
    const x1 = sun.x + -rayDy * off;
    const y1 = sun.y + rayDx * off;
    const t = (SCENE.ground - y1) / rayDy;
    return { x1, y1, x2: x1 + rayDx * t, y2: SCENE.ground };
  }).filter((r) => r.y1 < SCENE.ground - 4 && r.x2 > -40 && r.x2 < SCENE.width + 40);
  const grazeLen = 220;
  const graze = { x1: personX - rayDx * grazeLen, y1: headY - rayDy * grazeLen, x2: personX + (len > 0 ? dir * len : 0), y2: SCENE.ground };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${SCENE.width} ${SCENE.height}`} className="w-full select-none rounded-2xl border border-slate-300 bg-sky-100" role="img"
      aria-label={`A ${subject} on the ground with the sun at ${Math.round(elevation(alpha))} degrees above the horizon.`}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <rect x={0} y={SCENE.ground} width={SCENE.width} height={SCENE.height - SCENE.ground} fill="#86efac" />
      <path d={`M ${SCENE.cx - SCENE.radius} ${SCENE.ground} A ${SCENE.radius} ${SCENE.radius} 0 0 1 ${SCENE.cx + SCENE.radius} ${SCENE.ground}`} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 6" />
      <text x={8} y={SCENE.ground - 6} fontSize={11} fontWeight={700} fill="#475569">East</text>
      <text x={SCENE.width - 40} y={SCENE.ground - 6} fontSize={11} fontWeight={700} fill="#475569">West</text>

      {rays.map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#f59e0b" strokeWidth={1.5} opacity={0.55} />)}
      <line x1={graze.x1} y1={graze.y1} x2={graze.x2} y2={graze.y2} stroke="#ea580c" strokeWidth={2} strokeDasharray="6 4" />

      {!hideShadow && (
        len > 0 ? (
          <g fill="#1e293b" opacity={0.55}>
            <polygon points={`${personX - 8},${SCENE.ground + 1} ${personX + 8},${SCENE.ground + 1} ${tipX},${SCENE.ground + 7} ${tipX},${SCENE.ground + 1}`} />
            <ellipse cx={tipX} cy={SCENE.ground + 4} rx={7} ry={4} />
          </g>
        ) : <ellipse cx={personX} cy={SCENE.ground + 3} rx={16} ry={4} fill="#1e293b" opacity={0.55} />
      )}
      {hideShadow && (
        <g>
          <rect x={Math.min(SCENE.width - 50, Math.max(4, personX + dir * 40 - 18))} y={SCENE.ground + 12} width={36} height={22} rx={6} fill="#fff" stroke="#94a3b8" />
          <text x={Math.min(SCENE.width - 32, Math.max(22, personX + dir * 40))} y={SCENE.ground + 28} textAnchor="middle" fontSize={16} fontWeight={800} fill="#475569">?</text>
        </g>
      )}

      <g transform={`translate(${personX} ${SCENE.ground})`} onPointerDown={start('person')} style={{ cursor: onMove ? 'grab' : 'default', touchAction: onMove ? 'none' : 'auto' }} tabIndex={-1}>
        <rect x={-26} y={-height - 6} width={52} height={height + 10} fill="transparent" />
        <SubjectShape subject={subject} height={height} />
      </g>

      <g onPointerDown={start('sun')} style={{ cursor: onSun ? 'grab' : 'default', touchAction: onSun ? 'none' : 'auto' }}>
        <circle cx={sun.x} cy={sun.y} r={22} fill="transparent" />
        <circle cx={sun.x} cy={sun.y} r={15} fill="#fde047" stroke="#f59e0b" strokeWidth={2.5} />
        <circle cx={sun.x} cy={sun.y} r={21} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 4" />
      </g>
    </svg>
  );
};
