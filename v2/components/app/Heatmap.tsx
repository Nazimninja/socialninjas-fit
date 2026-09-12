import React, { useEffect, useRef } from 'react';
import type { Workout } from '../../context/FitNinjaContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Heatmap({
  workouts = [],
  onDay,
}: {
  workouts: Workout[];
  onDay?: (iso: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapRef.current) {
      wrapRef.current.scrollLeft = wrapRef.current.scrollWidth;
    }
  }, []);

  const agg: Record<string, { n: number; vol: number; min: number }> = {};
  workouts.forEach(w => {
    const d = w.date ? w.date.slice(0, 10) : '';
    if (!d) return;
    const a = (agg[d] = agg[d] || { n: 0, vol: 0, min: 0 });
    a.n++;
    a.vol += w.totalVolumeKg || 0;
    a.min += Math.max(15, Math.round((w.durationSeconds || 1800) / 60));
  });

  const mins = Object.values(agg)
    .map(a => a.min)
    .filter(v => v > 0)
    .sort((a, b) => a - b);
  const q = (p: number) => (mins.length ? mins[Math.min(mins.length - 1, Math.floor(p * mins.length))] : 0);
  const t1 = q(0.25),
    t2 = q(0.5),
    t3 = q(0.75);

  const level = (a?: { n: number; vol: number; min: number }) => {
    if (!a) return 0;
    if (!a.min) return 1;
    if (a.min >= t3) return 4;
    if (a.min >= t2) return 3;
    if (a.min >= t1) return 2;
    return 1;
  };

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayISO = today.toISOString().slice(0, 10);
  const end = new Date(today);
  end.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const start = new Date(end);
  start.setDate(end.getDate() - 52 * 7);

  const months: React.ReactNode[] = [];
  const cols: React.ReactNode[] = [];
  let lastMonth = -1;

  for (let wk = 0; wk <= 52; wk++) {
    const colStart = new Date(start);
    colStart.setDate(start.getDate() + wk * 7);
    const mo = colStart.getMonth();
    const showM = mo !== lastMonth && colStart.getDate() <= 7 && wk < 51;
    months.push(<span key={wk}>{showM ? MONTHS[mo] : ''}</span>);
    if (colStart.getDate() <= 7) lastMonth = mo;

    const cells: React.ReactNode[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(colStart);
      day.setDate(colStart.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      const a = agg[key];
      const cls =
        'hm-c l' +
        level(a) +
        (key === todayISO ? ' today' : '') +
        (day > today ? ' future' : '');

      cells.push(
        <div
          key={d}
          className={cls}
          title={
            key + (a ? ` · ${a.n} workout(s) · ${a.min} min · ${Math.round(a.vol)} kg` : ' · Rest day')
          }
          onClick={a && onDay ? () => onDay(key) : undefined}
          style={{ cursor: a ? 'pointer' : 'default' }}
        />
      );
    }
    cols.push(
      <div key={wk} className="hm-col">
        {cells}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hm-wrap" ref={wrapRef}>
        <div className="hm-months" style={{ marginLeft: 30 }}>
          {months}
        </div>
        <div className="hm-body">
          <div className="hm-days">
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
            <span />
          </div>
          <div className="hm-grid">{cols}</div>
        </div>
      </div>
      <div className="hm-legend">
        Less time <div className="hm-c l0" />
        <div className="hm-c l1" />
        <div className="hm-c l2" />
        <div className="hm-c l3" />
        <div className="hm-c l4" /> More time
      </div>
    </div>
  );
}
