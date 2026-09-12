import React, { useState } from 'react';

export interface ChartPoint {
  t: number;
  y: number;
  d?: string;
}

export default function LineChart({
  points,
  h = 160,
  unit = 'kg',
  goal = null,
}: {
  points: ChartPoint[];
  h?: number;
  unit?: string;
  goal?: number | null;
}) {
  const [hover, setHover] = useState<ChartPoint | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="text-center py-8 text-[#71829d] text-xs">
        Log your weight to see your progress curve.
      </div>
    );
  }

  const W = 340;
  const H = h;
  const P = { l: 30, r: 16, t: 16, b: 24 };

  const pts = points.length === 1 ? [{ ...points[0], t: points[0].t - 86400000 }, points[0]] : points;
  const ys = pts.map(p => p.y);
  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);

  if (goal != null && isFinite(goal)) {
    ymin = Math.min(ymin, goal);
    ymax = Math.max(ymax, goal);
  }

  if (ymin === ymax) {
    ymin -= 2;
    ymax += 2;
  }

  const pad = (ymax - ymin) * 0.15;
  ymin -= pad;
  ymax += pad;

  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t || t0 + 1;

  const X = (t: number) => (t1 === t0 ? (P.l + W - P.r) / 2 : P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r));
  const Y = (y: number) => P.t + (1 - (y - ymin) / (ymax - ymin)) * (H - P.t - P.b);

  const coords = pts.map(p => ({ x: X(p.t), y: Y(p.y), pt: p }));
  const pathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`, '');

  const areaD = coords.length
    ? `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${H - P.b} L ${coords[0].x.toFixed(1)} ${H - P.b} Z`
    : '';

  const goalY = goal != null && isFinite(goal) ? Y(goal) : null;

  return (
    <div className="relative w-full overflow-hidden select-none">
      {hover && (
        <div
          className="absolute z-10 px-2 py-1 rounded bg-[#121c2e] border border-[#1e3256] text-[10px] font-bold text-white shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: `${(X(hover.t) / W) * 100}%`, top: Math.max(8, Y(hover.y) - 6) }}
        >
          {hover.y} {unit}
          {hover.d && <span className="block text-[8px] text-[#71829d] font-normal">{hover.d}</span>}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Goal line */}
        {goalY !== null && (
          <g>
            <line
              x1={P.l}
              y1={goalY}
              x2={W - P.r}
              y2={goalY}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <text
              x={W - P.r}
              y={goalY - 4}
              fill="#fbbf24"
              fontSize="9"
              fontWeight="800"
              textAnchor="end"
            >
              Target: {goal} {unit}
            </text>
          </g>
        )}

        {/* Gradient fill under curve */}
        {areaD && <path d={areaD} fill="url(#chartGrad)" />}

        {/* Line curve */}
        <path
          d={pathD}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hover === c.pt ? 5 : 3.5}
            fill="#38bdf8"
            stroke="#07090e"
            strokeWidth="2"
            onMouseEnter={() => setHover(c.pt)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer transition-all"
          />
        ))}

        {/* Min and Max Y labels */}
        <text x={P.l} y={P.t + 4} fill="#64748b" fontSize="9" fontWeight="700">
          {Math.round(ymax)}
        </text>
        <text x={P.l} y={H - P.b - 2} fill="#64748b" fontSize="9" fontWeight="700">
          {Math.round(ymin)}
        </text>
      </svg>
    </div>
  );
}
