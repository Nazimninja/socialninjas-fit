import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFitNinja } from '../context/FitNinjaContext';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import {
  Flame,
  Info,
  Sun,
  Settings,
  Zap,
  Target,
  TrendingUp,
  Scale,
  Play,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import WeeklyCheckinModal from '../components/app/WeeklyCheckinModal';
import BodyMap from '../components/app/BodyMap';
import Icon from '../components/app/Icon';
import GetReadyModal from '../components/app/GetReadyModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { state, totalVolume, todaysPlan } = useFitNinja();
  const { user, activePlan, workouts, streak, checkins } = state;

  const [showCheckin, setShowCheckin] = useState(false);
  const [showGetReady, setShowGetReady] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [showBodyMap, setShowBodyMap] = useState(true); // Default open as in screenshot

  // Current Week Days (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const weekStart = addDays(startOfWeek(now, { weekStartsOn: 1 }), selectedDayOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const isCurrentDay = isToday(date);
      return {
        date,
        dayLetter: format(date, 'EEEEE'),
        dayNumber: format(date, 'd'),
        isToday: isCurrentDay,
        formattedShort: format(date, 'EEE d MMM'),
      };
    });
  }, [selectedDayOffset]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Today's Workouts count and volume
  const todayWorkouts = workouts.filter(w => isToday(new Date(w.date)));
  const thisWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date);
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return d >= start;
  });

  const plannedTotalSessions = user.daysPerWeek || (activePlan ? activePlan.days.filter(d => !d.isRest).length : 6);
  const completedSessions = Math.min(plannedTotalSessions, thisWeekWorkouts.length);
  const cycleGoalPct = Math.round((completedSessions / (plannedTotalSessions || 1)) * 100);

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const readiness = useMemo(() => {
    const base = 94;
    const streakBonus = Math.min(5, streak);
    return Math.min(99, base + streakBonus);
  }, [streak]);

  // Fallback exercises lineup
  const exerciseLineup = useMemo(() => {
    if (todaysPlan && todaysPlan.exercises.length > 0) {
      return todaysPlan.exercises;
    }
    return [
      { name: 'barbell romanian deadlift', sets: 3, reps: '10', muscleGroup: 'Legs' },
      { name: 'dumbbell bulgarian split squat', sets: 3, reps: '10', muscleGroup: 'Legs' },
      { name: 'lever lying leg curl', sets: 3, reps: '12', muscleGroup: 'Legs' },
      { name: 'standing calf raise', sets: 3, reps: '15', muscleGroup: 'Legs' },
      { name: 'hanging leg raise', sets: 3, reps: '12', muscleGroup: 'Core' },
    ];
  }, [todaysPlan]);

  // Compute muscle load from workouts
  const thisWeekLoad = useMemo(() => {
    const load: Record<string, number> = {};
    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        const sets = ex.sets.filter(s => s.completed).length || 1;
        const mg = (ex.muscleGroup || '').toLowerCase();
        const n = (ex.name || '').toLowerCase();

        if (mg.includes('chest') || n.includes('press') || n.includes('bench')) {
          load['chest'] = (load['chest'] || 0) + sets;
          load['triceps'] = (load['triceps'] || 0) + sets * 0.5;
        } else if (mg.includes('back') || n.includes('row') || n.includes('pull')) {
          load['upper-back'] = (load['upper-back'] || 0) + sets;
          load['biceps'] = (load['biceps'] || 0) + sets * 0.5;
        } else if (n.includes('deadlift') || n.includes('glute') || n.includes('curl')) {
          load['hamstring'] = (load['hamstring'] || 0) + sets;
          load['gluteal'] = (load['gluteal'] || 0) + sets;
          load['lower-back'] = (load['lower-back'] || 0) + sets * 0.4;
        } else if (mg.includes('leg') || n.includes('squat') || n.includes('press')) {
          load['quadriceps'] = (load['quadriceps'] || 0) + sets;
          load['gluteal'] = (load['gluteal'] || 0) + sets * 0.5;
        } else if (mg.includes('shoulder') || n.includes('lateral')) {
          load['deltoids'] = (load['deltoids'] || 0) + sets;
        } else if (mg.includes('bicep') || n.includes('curl')) {
          load['biceps'] = (load['biceps'] || 0) + sets;
        } else if (mg.includes('tricep') || n.includes('pushdown')) {
          load['triceps'] = (load['triceps'] || 0) + sets;
        } else if (mg.includes('core') || mg.includes('abs')) {
          load['abs'] = (load['abs'] || 0) + sets;
        } else if (n.includes('calf')) {
          load['calves'] = (load['calves'] || 0) + sets;
        }
      });
    });
    return load;
  }, [workouts]);

  const workedMusclesCount = Object.keys(thisWeekLoad).length;

  // Macro calculations
  const targetKcal = user.dailyCalorieTarget || 2650;
  const targetProtein = user.proteinTargetG || 165;
  const targetFat = Math.round((targetKcal * 0.25) / 9);
  const targetCarbs = Math.round((targetKcal - (targetProtein * 4 + targetFat * 9)) / 4);

  const activeConditions = (user.healthConditions || []).filter(c => c !== 'none');

  return (
    <div className="space-y-4 pb-36 sm:pb-40 pt-1 text-white">
      {/* ── 1. HEADER ROW ── */}
      <header className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1F4B99] via-[#153268] to-[#0a1426] border border-white/15 flex items-center justify-center text-xl font-black text-white shadow-lg overflow-hidden">
              <span className="opacity-95">🥷</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#07090e] rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#0e2238] border border-[#1e3c63] text-[#38bdf8] text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wider uppercase">
                FIT NINJA
              </span>
              <span className="text-xs text-[#8a9bb3] font-medium">
                {format(new Date(), 'EEE d MMM')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {greeting}, {user.name || 'Nazim'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#141b27] border border-[#1f2d42] px-2.5 py-1.5 rounded-full text-xs font-bold text-white shadow-inner">
            <Flame className="w-4 h-4 text-[#f97316] fill-[#f97316]" />
            <span>{streak}w</span>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            className="w-9 h-9 rounded-full bg-[#141b27] hover:bg-[#1a2538] border border-[#1f2d42] flex items-center justify-center text-[#8a9bb3] hover:text-white transition-colors"
            title="Program Info"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowNutritionModal(true)}
            className="w-9 h-9 rounded-full bg-[#141b27] hover:bg-[#1a2538] border border-[#1f2d42] flex items-center justify-center text-[#8a9bb3] hover:text-white transition-colors"
            title="Nutrition Blueprint"
          >
            <Sun className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-full bg-[#141b27] hover:bg-[#1a2538] border border-[#1f2d42] flex items-center justify-center text-[#8a9bb3] hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── 2. HERO HUD (CYCLE GOAL / METRICS) ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1322] border border-[#172744] p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-4">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#38bdf8"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={251.2}
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * cycleGoalPct) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white tracking-tight">{cycleGoalPct}%</span>
              <span className="text-[10px] font-extrabold text-[#71829d] tracking-widest uppercase mt-0.5">
                CYCLE GOAL
              </span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-y-3.5 gap-x-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0f213a] border border-[#1b365d] flex items-center justify-center text-[#38bdf8] shrink-0">
                <Zap className="w-4 h-4 fill-[#38bdf8]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#71829d] tracking-wider uppercase">SESSIONS</p>
                <p className="text-sm font-black text-white truncate">
                  {completedSessions} / {plannedTotalSessions} Done
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0d2a24] border border-[#154a3e] flex items-center justify-center text-[#10b981] shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#71829d] tracking-wider uppercase">READINESS</p>
                <p className="text-sm font-black text-[#10b981] truncate">
                  {readiness}% · Optimal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#142338] border border-[#1e3a5f] flex items-center justify-center text-[#60a5fa] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#71829d] tracking-wider uppercase">TOTAL VOLUME</p>
                <p className="text-sm font-black text-white truncate">
                  {totalVolume > 0 ? `${totalVolume.toFixed(0)} kg` : '0 kg'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#282115] border border-[#48371c] flex items-center justify-center text-[#e8b86d] shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#71829d] tracking-wider uppercase">BODYWEIGHT</p>
                <p className="text-sm font-black text-white truncate">
                  {user.weightKg ? `${user.weightKg.toFixed(0)} kg` : '78 kg'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#172744] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold text-[11px] tracking-wide">
            <Zap className="w-3.5 h-3.5 fill-[#38bdf8]" />
            <span>ADAPTIVE OVERLOAD ACTIVE</span>
          </div>
          <span className="text-[#71829d] text-[11px]">
            {completedSessions} of {plannedTotalSessions} sessions logged
          </span>
        </div>
      </section>

      {/* ── 3. QUICK ACTION BUTTONS ROW ── */}
      <section className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setShowGetReady(true)}
          className="bg-white hover:bg-[#f1f5f9] text-black font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all shadow-xl shadow-white/10 active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>Start</span>
        </button>

        <button
          onClick={() => setShowNutritionModal(true)}
          className="bg-[#0e1726] hover:bg-[#15233a] border border-[#1c2c47] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.98]"
        >
          <span>🥗</span>
          <span>Log Meal</span>
        </button>

        <button
          onClick={() => setShowCheckin(true)}
          className="bg-[#0e1726] hover:bg-[#15233a] border border-[#1c2c47] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.98]"
        >
          <span>🗓️</span>
          <span>Schedule</span>
        </button>
      </section>

      {/* ── 4. "THIS WEEK" CALENDAR STRIP ── */}
      <section className="rounded-3xl bg-[#0b1322] border border-[#172744] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-sm tracking-tight">This week</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDayOffset(o => o - 1)}
              className="w-7 h-7 rounded-xl bg-[#141d2e] hover:bg-[#1a273e] border border-[#1e2f4a] flex items-center justify-center text-[#8a9bb3] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedDayOffset(o => o + 1)}
              className="w-7 h-7 rounded-xl bg-[#141d2e] hover:bg-[#1a273e] border border-[#1e2f4a] flex items-center justify-center text-[#8a9bb3] hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {currentWeekDays.map((item, idx) => {
            const isSelected = isSameDay(item.date, selectedDate);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`flex flex-col items-center py-2.5 rounded-2xl transition-all ${
                  item.isToday
                    ? 'bg-[#132742] border border-[#2563eb] shadow-lg shadow-[#2563eb]/25 text-white'
                    : isSelected
                    ? 'bg-white/5 border border-white/10 text-white'
                    : 'hover:bg-white/[0.02] text-[#71829d]'
                }`}
              >
                <span className={`text-[11px] font-extrabold uppercase ${item.isToday ? 'text-[#38bdf8]' : 'text-[#71829d]'}`}>
                  {item.dayLetter}
                </span>

                <div className="my-2 relative w-7 h-7 flex items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                      item.isToday
                        ? 'border-[#38bdf8] bg-[#1e3a63] text-white shadow-sm'
                        : 'border-white/10 text-white/70'
                    }`}
                  >
                    {item.isToday && (
                      <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-ping absolute" />
                    )}
                  </div>
                </div>

                <span className={`text-xs font-black ${item.isToday ? 'text-white' : 'text-[#8a9bb3]'}`}>
                  {item.dayNumber}
                </span>

                {item.isToday && <span className="w-1 h-1 bg-[#38bdf8] rounded-full mt-1" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 5. "TODAY'S PROTOCOL" CARD ── */}
      <section className="rounded-3xl bg-[#0b1322] border border-[#172744] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded-full animate-pulse shadow-sm shadow-[#38bdf8]" />
            <span className="text-[11px] font-extrabold text-[#38bdf8] uppercase tracking-wider">
              TODAY'S PROTOCOL
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="bg-[#121d30] border border-[#1e3250] text-[#93c5fd] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              ~{todaysPlan?.estimatedDurationMins || 45} min
            </span>
            <span className="bg-[#121d30] border border-[#1e3250] text-[#93c5fd] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {exerciseLineup.length} exercises
            </span>
            <button
              onClick={() => setShowCheckin(true)}
              className="border border-[#1e3250] hover:border-white/30 text-[#8a9bb3] hover:text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#142238] border border-[#1e3556] flex items-center justify-center text-xl text-[#38bdf8] shrink-0 shadow-md">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight leading-snug">
              {todaysPlan?.isRest ? 'Rest & Strategic Recovery' : todaysPlan?.focus || 'Day 6: Legs B · Posterior Chain & Glutes Focus'}
            </h3>
            <p className="text-xs text-[#71829d] mt-0.5">
              Science-backed progressive overload
            </p>
          </div>
        </div>

        <div className="border-t border-[#172744] pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold text-[#71829d] tracking-widest uppercase">
              EXERCISE LINEUP
            </span>
            <span className="text-[10px] text-[#71829d]">TARGET SETS × REPS</span>
          </div>

          <div className="space-y-2.5">
            {exerciseLineup.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#556782] w-4 text-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white lowercase truncate">
                    {ex.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#8a9bb3] shrink-0 pl-2">
                  {ex.sets} × {ex.reps}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowGetReady(true)}
            className="w-full mt-5 bg-gradient-to-r from-[#38bdf8] to-[#2563eb] hover:from-[#0284c7] hover:to-[#1d4ed8] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-xl shadow-[#38bdf8]/25 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>► Start {todaysPlan?.focus || 'Day 6: Legs B · Posterior Chain & Glutes Focus'}</span>
          </button>
        </div>
      </section>

      {/* ── 6. ANATOMICAL MUSCLE STIMULUS & RECOVERY HUD (FROM USER SCREENSHOT) ── */}
      <section className="rounded-3xl bg-[#0b1322] border border-[#172744] p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-[10px] font-extrabold text-[#71829d] uppercase tracking-wider mb-0.5">
              WEEKLY STIMULUS
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Targeted Muscle Recovery
            </h3>
          </div>
          <button
            onClick={() => setShowBodyMap(v => !v)}
            className="bg-[#101b2d] hover:bg-[#162742] border border-[#1e3252] text-[#38bdf8] text-xs font-extrabold px-3 py-1.5 rounded-full transition-colors"
          >
            {showBodyMap ? 'Hide Heatmap ▲' : '3D Heatmap ▼'}
          </button>
        </div>

        {/* The BodyMap Visual Front & Back */}
        {showBodyMap && (
          <div className="py-3 px-2 border-t border-b border-[#172744] my-3">
            <BodyMap load={thisWeekLoad} body={user.gender === 'female' ? 'female' : 'male'} />
          </div>
        )}

        <p className="text-xs text-[#71829d] text-center pt-1 leading-relaxed">
          {workedMusclesCount > 0
            ? `${workedMusclesCount} muscle groups stimulated this week. Dynamic recovery tracking active.`
            : 'No sets logged yet this week. Complete today’s workout to activate hypertrophy heatmap.'}
        </p>
      </section>

      {/* ── 7. WEEKEND PROTOCOL AUDIT (FROM USER SCREENSHOT) ── */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0d2a22]/70 via-[#0b1322] to-[#0b1322] border border-[#14483b] p-5 shadow-2xl">
        <div className="mb-2">
          <span className="bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            🌟 WEEKEND PROTOCOL AUDIT
          </span>
        </div>
        <h3 className="text-lg font-black text-white tracking-tight mb-1">
          Weekly Adaptation Check-in
        </h3>
        <p className="text-xs text-[#8a9bb3] mb-4">
          {checkins.length > 0
            ? `Last check-in recorded. Calories & macros tuned for progressive overload.`
            : `${completedSessions} workouts logged! Complete check-in to calibrate progressive overload.`}
        </p>
        <button
          onClick={() => setShowCheckin(true)}
          className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-black py-3 rounded-2xl text-xs transition-all shadow-xl shadow-[#10b981]/25 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>📸 Complete Audit & Adapt Overload →</span>
        </button>
      </section>

      {/* ── 8. DAILY FUEL TARGET / ADAPTIVE NUTRITION (FROM USER SCREENSHOT) ── */}
      <section className="rounded-3xl bg-[#0b1322] border border-[#172744] p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-[10px] font-extrabold text-[#71829d] uppercase tracking-wider mb-0.5">
              DAILY FUEL TARGET
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Adaptive Precision Nutrition
            </h3>
          </div>
          <button
            onClick={() => setShowNutritionModal(true)}
            className="bg-[#101b2d] hover:bg-[#162742] border border-[#1e3252] text-[#8a9bb3] hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            Log Meal →
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-2.5 text-center">
            <span className="text-[9px] font-extrabold text-[#71829d] uppercase tracking-wider block">CALORIES</span>
            <p className="text-base font-black text-[#38bdf8] mt-1">{targetKcal}</p>
            <span className="text-[9px] text-[#71829d]">kcal</span>
          </div>

          <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-2.5 text-center">
            <span className="text-[9px] font-extrabold text-[#71829d] uppercase tracking-wider block">PROTEIN</span>
            <p className="text-base font-black text-[#10b981] mt-1">{targetProtein}</p>
            <span className="text-[9px] text-[#71829d]">g</span>
          </div>

          <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-2.5 text-center">
            <span className="text-[9px] font-extrabold text-[#71829d] uppercase tracking-wider block">CARBS</span>
            <p className="text-base font-black text-[#818cf8] mt-1">{targetCarbs}</p>
            <span className="text-[9px] text-[#71829d]">g</span>
          </div>

          <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-2.5 text-center">
            <span className="text-[9px] font-extrabold text-[#71829d] uppercase tracking-wider block">FATS</span>
            <p className="text-base font-black text-[#fbbf24] mt-1">{targetFat}</p>
            <span className="text-[9px] text-[#71829d]">g</span>
          </div>
        </div>
      </section>

      {/* ── SAFETY GUARDS MINI BADGE ── */}
      {activeConditions.length > 0 && (
        <section className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-[#71829d]">Active Health Shields:</span>
          {activeConditions.map(c => (
            <span
              key={c}
              className="bg-[#0b1f1a] border border-[#14483b] text-[#10b981] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {c.replace('_', ' ')}
            </span>
          ))}
        </section>
      )}

      {/* ── NUTRITION BLUEPRINT MODAL ── */}
      <AnimatePresence>
        {showNutritionModal && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setShowNutritionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0b1322] border border-[#172744] rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥗</span>
                  <div>
                    <h3 className="text-white font-bold text-base">Nutrition Blueprint</h3>
                    <p className="text-[11px] text-[#71829d]">Mifflin-St Jeor TDEE Calibrated</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNutritionModal(false)}
                  className="text-[#71829d] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-3.5">
                  <span className="text-[10px] font-extrabold text-[#71829d] uppercase tracking-wider">DAILY CALORIES</span>
                  <p className="text-2xl font-black text-[#e8b86d] mt-1">{targetKcal} <span className="text-xs font-normal text-white/50">kcal</span></p>
                </div>
                <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-3.5">
                  <span className="text-[10px] font-extrabold text-[#71829d] uppercase tracking-wider">DAILY PROTEIN</span>
                  <p className="text-2xl font-black text-[#38bdf8] mt-1">{targetProtein} <span className="text-xs font-normal text-white/50">g</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-extrabold text-[#71829d] uppercase">CARBS</span>
                  <p className="text-lg font-black text-[#818cf8] mt-0.5">{targetCarbs} g</p>
                </div>
                <div className="bg-[#121c2e] border border-[#1c2c47] rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-extrabold text-[#71829d] uppercase">FATS</span>
                  <p className="text-lg font-black text-[#fbbf24] mt-0.5">{targetFat} g</p>
                </div>
              </div>

              <button
                onClick={() => setShowNutritionModal(false)}
                className="w-full bg-[#1F4B99] hover:bg-[#153880] text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INFO MODAL ── */}
      <AnimatePresence>
        {showInfoModal && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0b1322] border border-[#172744] rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥷</span>
                  <div>
                    <h3 className="text-white font-bold text-base">Program Methodology</h3>
                    <p className="text-[11px] text-[#71829d]">{activePlan?.title || 'Fit Ninja Protocol'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-[#71829d] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-[#8a9bb3] mb-4">
                <p>• <strong>Adaptive Overload:</strong> We calibrate sets and reps based on your performance history.</p>
                <p>• <strong>Health Shield:</strong> Movements causing excessive knee shear, lumbar compression, or joint impingement are safely filtered.</p>
                <p>• <strong>3D Muscle Recovery:</strong> The anatomical body map visually displays the hypertrophic stimulus across major muscle groups.</p>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full bg-[#1F4B99] hover:bg-[#153880] text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── WEEKLY CHECKIN MODAL ── */}
      <AnimatePresence>
        {showCheckin && (
          <WeeklyCheckinModal isOpen={showCheckin} onClose={() => setShowCheckin(false)} />
        )}
      </AnimatePresence>

      {/* ── GET READY COUNTDOWN MODAL ── */}
      <GetReadyModal
        isOpen={showGetReady}
        routineTitle={todaysPlan?.focus || "Today's Protocol"}
        exerciseCount={exerciseLineup.length || 5}
        onStart={() => {
          setShowGetReady(false);
          navigate('/app/workout');
        }}
        onCancel={() => setShowGetReady(false)}
      />
    </div>
  );
}
