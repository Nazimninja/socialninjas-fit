import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export default function GetReadyModal({
  isOpen,
  routineTitle,
  exerciseCount,
  onStart,
  onCancel,
}: {
  isOpen: boolean;
  routineTitle: string;
  exerciseCount: number;
  onStart: () => void;
  onCancel: () => void;
}) {
  const [count, setCount] = useState(3);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setCount(3);
      startedRef.current = false;
      return;
    }

    if (count <= 0) {
      if (!startedRef.current) {
        startedRef.current = true;
        onStart();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCount(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, count, onStart]);

  if (!isOpen) return null;

  const R = 54;
  const circ = 2 * Math.PI * R;
  const progress = ((3 - count) / 3) * circ;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0b1322] border border-[#172744] rounded-3xl p-6 text-center shadow-2xl animate-popIn">
        {/* Label */}
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#38bdf8] mb-2">
          Get Ready
        </p>

        {/* Title */}
        <h2 className="text-xl font-black text-white tracking-tight mb-1 leading-snug">
          {routineTitle || "Today's Protocol"}
        </h2>
        <p className="text-xs text-[#71829d] mb-6">{exerciseCount} exercises</p>

        {/* Countdown Ring */}
        <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
          <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="7"
            />
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ - progress}
              style={{
                transition: 'stroke-dashoffset 0.9s linear',
                filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white tracking-tighter transition-all">
              {count > 0 ? count : '🏋️'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              startedRef.current = true;
              onStart();
            }}
            className="w-full py-3.5 bg-white hover:bg-slate-100 text-black font-extrabold text-sm rounded-2xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Icon name="play" size={16} />
            <span>Start Now</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2.5 text-xs font-bold text-[#71829d] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
