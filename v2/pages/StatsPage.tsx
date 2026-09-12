import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitNinja } from '../context/FitNinjaContext';
import Icon from '../components/app/Icon';
import Heatmap from '../components/app/Heatmap';
import LineChart from '../components/app/LineChart';
import WeeklyCheckinModal from '../components/app/WeeklyCheckinModal';

export default function StatsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useFitNinja();
  const { user, workouts, checkins, photos = [], bodyweight = [], streak } = state;

  const [range, setRange] = useState<number>(90); // 30, 90, 365, 0 (All)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState(user.weightKg.toString());
  const photoInputRef = useRef<HTMLInputElement>(null);

  const now = Date.now();
  const currentUnit = user.unit === 'imperial' ? 'lb' : 'kg';

  // Workouts this month
  const thisMonthWorkouts = workouts.filter(w => {
    const d = new Date(w.date);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  // Weight 30d delta
  const sortedBw = [...bodyweight].sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());
  const latestBw = sortedBw.length > 0 ? sortedBw[sortedBw.length - 1].w : user.weightKg;
  const bw30dAgo = sortedBw.find(b => new Date(b.d).getTime() > now - 30 * 86400000);
  const bwDelta30 = bw30dAgo ? Number((latestBw - bw30dAgo.w).toFixed(1)) : null;

  // Weight curve points
  let chartPoints = sortedBw
    .filter(b => range === 0 || new Date(b.d).getTime() > now - range * 86400000)
    .map(b => ({
      t: b.t || new Date(b.d).getTime(),
      y: b.w,
      d: b.d,
    }));

  // Fallback if no bodyweight history yet
  if (chartPoints.length === 0) {
    chartPoints = [
      { t: now - 30 * 86400000, y: user.weightKg, d: '1 month ago' },
      { t: now, y: user.weightKg, d: 'Today' },
    ];
  }

  function handleDirectPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      if (url) {
        dispatch({
          type: 'ADD_PHOTO',
          payload: {
            id: 'photo_' + Date.now(),
            date: new Date().toISOString().slice(0, 10),
            photoUrl: url,
            weight: latestBw,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSaveWeight(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(newWeightInput);
    if (w > 0) {
      dispatch({ type: 'LOG_BODYWEIGHT', payload: { weight: w } });
      setShowLogWeight(false);
    }
  }

  const cardStyle = 'bg-[#0b1322] border border-[#172744] rounded-3xl p-5 mb-4 shadow-xl';
  const sectionLabelStyle = 'text-[10px] font-extrabold uppercase tracking-wider text-[#71829d] mb-1';
  const sectionTitleStyle = 'text-lg font-black text-white tracking-tight';

  return (
    <div className="max-w-xl mx-auto pb-28 px-4 pt-2 space-y-4 animate-fadeIn">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app')}
            className="w-9 h-9 rounded-full bg-[#121c2e] border border-[#172744] flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Home"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#71829d]">
              Your journey
            </p>
            <h1 className="text-xl font-black text-white tracking-tight">Progress & Stats</h1>
          </div>
        </div>

        <button
          onClick={() => setShowCheckin(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs text-black bg-gradient-to-r from-[#34d399] to-[#10b981] shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
        >
          <Icon name="camera" size={15} />
          <span>Check-in</span>
        </button>
      </div>

      {/* ── KPI TILES ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Workouts */}
        <div className="bg-[#0b1322] border border-[#172744] border-t-2 border-t-[#38bdf8] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] flex items-center justify-center">
              <Icon name="dumbbell" size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71829d]">
              Total Workouts
            </span>
          </div>
          <div className="text-3xl font-black text-[#38bdf8] tracking-tight">{workouts.length}</div>
          <div className="text-[10px] font-bold text-[#71829d] mt-1">all time</div>
        </div>

        {/* This Month */}
        <div className="bg-[#0b1322] border border-[#172744] border-t-2 border-t-[#34d399] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#34d399]/15 border border-[#34d399]/30 text-[#34d399] flex items-center justify-center">
              <Icon name="calendar" size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71829d]">
              This Month
            </span>
          </div>
          <div className="text-3xl font-black text-[#34d399] tracking-tight">{thisMonthWorkouts}</div>
          <div className="text-[10px] font-bold text-[#71829d] mt-1">sessions</div>
        </div>

        {/* Week Streak */}
        <div className="bg-[#0b1322] border border-[#172744] border-t-2 border-t-[#fbbf24] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/15 border border-[#fbbf24]/30 text-[#fbbf24] flex items-center justify-center">
              <Icon name="flame" size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71829d]">
              Week Streak
            </span>
          </div>
          <div className="text-3xl font-black text-[#fbbf24] tracking-tight">{streak}w</div>
          <div className="text-[10px] font-bold text-[#71829d] mt-1">consecutive weeks</div>
        </div>

        {/* Weight 30d */}
        <div
          onClick={() => setShowLogWeight(true)}
          className="bg-[#0b1322] border border-[#172744] border-t-2 border-t-[#818cf8] rounded-2xl p-4 shadow-lg cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] flex items-center justify-center">
              <Icon name="scale" size={16} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71829d]">
              Weight 30d
            </span>
          </div>
          <div className="text-3xl font-black text-[#818cf8] tracking-tight">
            {bwDelta30 === null
              ? '—'
              : (bwDelta30 > 0 ? '+' : '') + bwDelta30 + ' ' + currentUnit}
          </div>
          <div className="text-[10px] font-bold text-[#71829d] mt-1">
            now {latestBw} {currentUnit} · <span className="underline text-[#818cf8]">log</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: VISUAL TRANSFORMATION / PHYSIQUE TIMELINE ── */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={sectionLabelStyle}>Visual transformation</p>
            <h2 className={sectionTitleStyle}>Physique Timeline</h2>
          </div>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] font-bold text-xs hover:bg-[#38bdf8]/25 transition-colors"
          >
            <span>+</span>
            <span>Add Photo</span>
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleDirectPhotoUpload}
            className="hidden"
          />
        </div>

        {photos.length > 0 ? (
          <div className="space-y-3">
            {/* Side-by-side comparison if 2+ photos */}
            {photos.length >= 2 && (
              <div className="bg-[#121c2e] border border-[#1e3256] rounded-2xl p-3.5 mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2">
                  Transformation Comparison
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { photo: photos[photos.length - 1], label: 'Start', color: 'text-[#71829d]' },
                    { photo: photos[0], label: 'Latest', color: 'text-emerald-400' },
                  ].map(({ photo, label, color }) => (
                    <div key={label}>
                      <p className={`text-[10px] font-bold ${color} mb-1.5`}>
                        {label} · {photo.date} · {photo.weight} {currentUnit}
                      </p>
                      <div
                        onClick={() => setSelectedPhoto(photo.photoUrl)}
                        className="h-36 rounded-xl overflow-hidden bg-black border border-[#172744] cursor-pointer"
                      >
                        <img src={photo.photoUrl} alt={label} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-column photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, idx) => (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPhoto(p.photoUrl)}
                  className="relative h-28 rounded-xl overflow-hidden bg-black border border-[#172744] cursor-pointer group"
                >
                  <img src={p.photoUrl} alt="Progress" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-4">
                    <p className="text-[9px] font-bold text-white">{p.date}</p>
                    <p className="text-[9px] font-bold text-emerald-400">
                      {p.weight} {currentUnit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-7 px-4 bg-[#121c2e]/60 border border-dashed border-[#172744] rounded-2xl">
            <div className="text-4xl mb-2">📸</div>
            <p className="text-sm font-extrabold text-white mb-1">No Photos Yet</p>
            <p className="text-xs text-[#71829d] mb-4 leading-relaxed">
              Upload weekly check-in photos to
              <br />
              build your visual transformation timeline
            </p>
            <button
              onClick={() => photoInputRef.current?.click()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#34d399] to-[#10b981] text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              + Upload First Progress Photo
            </button>
          </div>
        )}
      </div>

      {/* ── PHOTO LIGHTBOX ── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="relative max-w-sm max-h-[85vh]">
            <img src={selectedPhoto} alt="Full size" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black font-black text-sm flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 2: CHECK-IN HISTORY LOG ── */}
      {checkins.length > 0 && (
        <div className={cardStyle}>
          <p className={sectionLabelStyle}>History</p>
          <h2 className={sectionTitleStyle + ' mb-3'}>📋 Check-in Log</h2>

          <div className="space-y-2.5">
            {checkins.map((c, idx) => (
              <div key={c.id || idx} className="bg-[#121c2e] border border-[#172744] rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-white">Check-in · {c.date}</p>
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {c.weightKg} {currentUnit}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.difficulty && (
                    <span className="text-[10px] font-bold bg-[#1b2a42] border border-[#172744] px-2 py-0.5 rounded-md text-[#94a3b8]">
                      {c.difficulty === 'easy' ? '😅 Light' : c.difficulty === 'hard' ? '😤 Overloaded' : '💪 Optimal'}
                    </span>
                  )}
                  {c.soreness && (
                    <span className="text-[10px] font-bold bg-[#1b2a42] border border-[#172744] px-2 py-0.5 rounded-md text-[#94a3b8]">
                      {c.soreness === 'sore' ? '😣 High Fatigue' : c.soreness === 'fresh' ? '😌 Fresh' : '⚡ Normal DOMS'}
                    </span>
                  )}
                  {c.dietRating && (
                    <span className="text-[10px] font-bold bg-[#1b2a42] border border-[#172744] px-2 py-0.5 rounded-md text-[#94a3b8]">
                      {c.dietRating === 'on_track' ? '🥗 Diet 100%' : '🥪 Diet 80%'}
                    </span>
                  )}
                  {c.photos && c.photos.length > 0 && (
                    <span className="text-[10px] font-bold bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-2 py-0.5 rounded-md text-[#38bdf8]">
                      📸 {c.photos.length} photo{c.photos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {c.notes && (
                  <p className="text-[11px] text-[#71829d] italic leading-relaxed">"{c.notes}"</p>
                )}
                {c.aiInsight && (
                  <p className="text-[11px] text-[#38bdf8] font-bold mt-1.5">💡 {c.aiInsight}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 3: ACTIVITY / TRAINING CALENDAR (12-Month Heatmap) ── */}
      <div className={cardStyle}>
        <p className={sectionLabelStyle}>Activity</p>
        <h2 className={sectionTitleStyle + ' mb-3'}>
          Training Calendar <span className="text-xs font-normal text-[#71829d]">· last 12 months</span>
        </h2>
        <Heatmap workouts={workouts} />
      </div>

      {/* ── SECTION 4: BODY COMPOSITION / WEIGHT TREND ── */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={sectionLabelStyle}>Body composition</p>
            <h2 className={sectionTitleStyle}>Weight Trend</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-2.5 py-1 bg-[#121c2e] border border-[#1e3256] rounded-lg text-xs font-black text-[#fbbf24]">
              🎯 82
            </div>
            <button
              onClick={() => setShowLogWeight(true)}
              className="px-3 py-1 bg-[#121c2e] hover:bg-[#1a2840] border border-[#1e3256] rounded-lg text-xs font-extrabold text-white transition-colors"
            >
              + Log
            </button>
          </div>
        </div>

        {/* Range switcher */}
        <div className="flex gap-1 bg-[#121c2e] p-1 rounded-xl mb-3">
          {[
            { val: 30, label: '1M' },
            { val: 90, label: '3M' },
            { val: 365, label: '1Y' },
            { val: 0, label: 'All' },
          ].map(r => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                range === r.val ? 'bg-white text-black font-black shadow-md' : 'text-[#71829d] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Line Chart */}
        <LineChart points={chartPoints} h={160} unit={currentUnit} goal={82} />
      </div>

      {/* ── MODAL: LOG WEIGHT ── */}
      {showLogWeight && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-[#0b1322] border border-[#172744] rounded-3xl p-5 shadow-2xl animate-popIn">
            <h3 className="text-base font-black text-white mb-1">Log Today's Bodyweight</h3>
            <p className="text-xs text-[#71829d] mb-4">Track daily scale fluctuations</p>

            <form onSubmit={handleSaveWeight} className="space-y-4">
              <input
                type="number"
                step="0.1"
                value={newWeightInput}
                onChange={e => setNewWeightInput(e.target.value)}
                className="w-full bg-[#121c2e] border border-[#1e3256] rounded-xl px-4 py-3 text-2xl font-black text-white text-center outline-none focus:border-[#38bdf8]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogWeight(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#121c2e] text-xs font-bold text-[#71829d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#38bdf8] text-xs font-black text-black shadow-lg"
                >
                  Save Weight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Checkin Modal */}
      <WeeklyCheckinModal isOpen={showCheckin} onClose={() => setShowCheckin(false)} />
    </div>
  );
}
