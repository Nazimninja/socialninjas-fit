import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  useFitNinja,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
  type PlannedDay,
  type PlannedExercise,
} from '../context/FitNinjaContext';
import {
  fetchAllExercises,
  searchExercises,
  MUSCLE_GROUPS_LIST,
  LOCAL_EXERCISE_SEED,
  type ExerciseRecord,
} from '../data/exerciseDatabase';
import { formatSplitName } from '../data/workoutPlanAI';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Rest Timer ────────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [secs, setSecs] = useState(seconds);
  useEffect(() => {
    if (secs <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onDone]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const pct = (secs / seconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0f1219] border border-[#1F4B99]/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[220px]"
    >
      <div className="relative w-10 h-10 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <motion.circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#1F4B99"
            strokeWidth="3"
            strokeDasharray={94.2}
            animate={{ strokeDashoffset: 94.2 * (1 - pct / 100) }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{secs}</span>
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-[#9BA8B4] uppercase tracking-wider">Rest Timer</p>
        <p className="font-semibold text-sm">{m}:{s.toString().padStart(2, '0')}</p>
      </div>
      <button onClick={onDone} className="text-xs text-[#9BA8B4] hover:text-white underline">
        Skip
      </button>
    </motion.div>
  );
}

// ── Exercise Picker Modal ─────────────────────────────────────────────────
function ExercisePicker({
  onSelect,
  onClose,
}: {
  onSelect: (e: ExerciseRecord) => void;
  onClose: () => void;
}) {
  const [allExercises, setAllExercises] = useState<ExerciseRecord[]>(LOCAL_EXERCISE_SEED);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');

  useEffect(() => {
    fetchAllExercises().then(data => {
      setAllExercises(data);
      setLoading(false);
    });
  }, []);

  const filtered = searchExercises(allExercises, q, {
    muscleGroup: group !== 'All' ? group : undefined,
  }).slice(0, 50);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0f1219] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-white font-semibold text-sm">Add Extra Exercise</h3>
            <button onClick={onClose} className="text-[#9BA8B4] hover:text-white text-sm">✕</button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Search 1,300+ exercises..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-white/30 text-xs outline-none focus:border-[#1F4B99]"
          />
        </div>

        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-white/10 shrink-0" style={{ scrollbarWidth: 'none' }}>
          {MUSCLE_GROUPS_LIST.map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                group === g ? 'bg-[#1F4B99] text-white' : 'bg-white/5 text-[#9BA8B4]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left border-b border-white/[0.04] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                {ex.thumbUrl ? (
                  <img src={ex.thumbUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-xs font-bold text-[#7ba3e0]">{ex.muscleGroup[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{ex.name}</p>
                <p className="text-[#9BA8B4] text-[10px] truncate">{ex.muscleGroup} · {ex.equipment}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Active Workout View ───────────────────────────────────────────────────
function ActiveWorkout({
  workoutName,
  exercises,
  onAddExercise,
  onUpdateSet,
  onAddSet,
  onDeleteExercise,
  onFinish,
  onCancel,
  elapsed,
}: {
  workoutName: string;
  exercises: (WorkoutExercise & { restSeconds?: number })[];
  onAddExercise: () => void;
  onUpdateSet: (exId: string, setIdx: number, field: keyof WorkoutSet, val: any) => void;
  onAddSet: (exId: string) => void;
  onDeleteExercise: (exId: string) => void;
  onFinish: () => void;
  onCancel: () => void;
  elapsed: number;
}) {
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 90 });

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  function handleSetComplete(exId: string, setIdx: number, completed: boolean, restSecs: number) {
    onUpdateSet(exId, setIdx, 'completed', completed);
    if (completed) setRestTimer({ active: true, seconds: restSecs });
  }

  const completedSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.completed).length, 0);
  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="space-y-4">
      {/* Active Top Bar */}
      <div className="bg-[#1F4B99]/15 border border-[#1F4B99]/30 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm truncate max-w-[200px]">{workoutName}</p>
          <div className="flex items-center gap-3 text-xs text-[#9BA8B4] mt-0.5">
            <span className="font-mono text-[#7ba3e0] font-bold">⏱ {m}:{s.toString().padStart(2, '0')}</span>
            <span>·</span>
            <span>{completedSetsCount} / {totalSetsCount} sets</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-xs text-[#9BA8B4] hover:text-white px-3 py-1.5 bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onFinish}
            className="text-xs text-white bg-[#3ba213] hover:bg-[#2d8a0f] px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-md"
          >
            Finish ✓
          </button>
        </div>
      </div>

      {/* Exercises Cards */}
      {exercises.map((ex, exIndex) => (
        <div key={ex.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1F4B99]/20 text-[#7ba3e0] text-[10px] font-bold flex items-center justify-center">
                  {exIndex + 1}
                </span>
                <p className="text-white font-bold text-sm">{ex.name}</p>
              </div>
              <p className="text-[11px] text-[#9BA8B4] ml-7">{ex.muscleGroup} {ex.notes && `· ${ex.notes}`}</p>
            </div>
            <button
              onClick={() => onDeleteExercise(ex.id)}
              className="text-[#9BA8B4] hover:text-red-400 text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-1.5 text-[11px] text-[#9BA8B4] px-1 font-semibold">
            <span>SET</span>
            <span className="text-center">TARGET REPS</span>
            <span className="text-center">WEIGHT (KG)</span>
            <span className="text-center">DONE</span>
          </div>

          {ex.sets.map((set, idx) => (
            <div
              key={set.id}
              className={`grid grid-cols-4 gap-2 mb-1.5 items-center rounded-xl px-1.5 py-1.5 transition-colors ${
                set.completed ? 'bg-[#3ba213]/10 border border-[#3ba213]/20' : 'bg-white/[0.02]'
              }`}
            >
              <span className="text-xs text-[#9BA8B4] font-medium pl-1">{idx + 1}</span>
              <input
                type="number"
                min={0}
                value={set.reps}
                onChange={e => onUpdateSet(ex.id, idx, 'reps', Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg text-center text-white text-xs py-1.5 w-full outline-none focus:border-[#1F4B99]"
              />
              <input
                type="number"
                min={0}
                step={0.5}
                value={set.weightKg}
                onChange={e => onUpdateSet(ex.id, idx, 'weightKg', Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg text-center text-white text-xs py-1.5 w-full outline-none focus:border-[#1F4B99]"
              />
              <button
                onClick={() => handleSetComplete(ex.id, idx, !set.completed, ex.restSeconds || 90)}
                className={`mx-auto w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  set.completed
                    ? 'bg-[#3ba213] border-[#3ba213] text-white shadow-md shadow-[#3ba213]/30'
                    : 'border-white/20 text-transparent hover:border-[#3ba213]/60'
                }`}
              >
                ✓
              </button>
            </div>
          ))}

          <button
            onClick={() => onAddSet(ex.id)}
            className="mt-2 text-xs text-[#7ba3e0] hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            + Add Set
          </button>
        </div>
      ))}

      <button
        onClick={onAddExercise}
        className="w-full border border-dashed border-white/15 hover:border-[#1F4B99] text-[#9BA8B4] hover:text-white rounded-2xl py-3.5 text-xs font-semibold transition-colors"
      >
        + Add Extra Exercise to Today's Routine
      </button>

      {restTimer.active && (
        <RestTimer seconds={restTimer.seconds} onDone={() => setRestTimer(r => ({ ...r, active: false }))} />
      )}
    </div>
  );
}

// ── Weekly 7-Day Plan View ────────────────────────────────────────────────
function WeeklyPlanView({ onStartDay }: { onStartDay: (day: PlannedDay) => void }) {
  const { state } = useFitNinja();
  const { activePlan } = state;

  if (!activePlan) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-2">🥷</p>
        <p className="text-white text-sm font-semibold">No active plan found</p>
        <p className="text-xs text-[#9BA8B4]">Complete onboarding to generate your customized schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-bold text-sm">{activePlan.title}</h3>
            <p className="text-xs text-[#7ba3e0] font-medium mt-0.5">
              Week {activePlan.weekNumber} of {activePlan.durationWeeks} · {formatSplitName(activePlan.split)}
            </p>
          </div>
          <span className="text-xs bg-[#1F4B99]/20 text-[#7ba3e0] border border-[#1F4B99]/30 px-2.5 py-1 rounded-full font-semibold">
            Active
          </span>
        </div>
        <p className="text-xs text-[#9BA8B4] mt-2 leading-relaxed">{activePlan.summary}</p>
      </div>

      <div className="space-y-3">
        {activePlan.days.map((day, idx) => (
          <div
            key={idx}
            className={`border rounded-2xl p-4 transition-all ${
              day.isRest
                ? 'bg-white/[0.01] border-white/5 opacity-70'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#9BA8B4] uppercase">
                  {day.dayName}
                </span>
                <p className="text-white font-bold text-sm mt-0.5">{day.focus}</p>
              </div>
              {!day.isRest && (
                <button
                  onClick={() => onStartDay(day)}
                  className="text-xs bg-[#1F4B99] hover:bg-[#153880] text-white px-3 py-1.5 rounded-xl font-semibold transition-all shadow-md shadow-[#1F4B99]/20"
                >
                  Start This Day →
                </button>
              )}
            </div>

            {day.isRest ? (
              <p className="text-xs text-[#9BA8B4] italic">Rest, hydrate & hit daily protein.</p>
            ) : (
              <div className="space-y-1 mt-3 pt-2.5 border-t border-white/5">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="flex justify-between items-center text-xs py-0.5">
                    <span className="text-[#e0e0e0] font-medium truncate max-w-[240px]">
                      {exIdx + 1}. {ex.name}
                    </span>
                    <span className="text-[#9BA8B4] text-[11px] shrink-0">
                      {ex.sets} sets × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Workout History View ──────────────────────────────────────────────────
function WorkoutHistoryView() {
  const { state, dispatch } = useFitNinja();

  if (state.workouts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-white font-semibold text-sm">No workouts logged yet</p>
        <p className="text-xs text-[#9BA8B4] mt-1">Complete your first session from Today's Workout tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.workouts.map(w => (
        <div key={w.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-white font-bold text-sm">{w.name}</p>
              <p className="text-[11px] text-[#9BA8B4] mt-0.5">
                {format(new Date(w.date), 'EEEE, MMM d, yyyy')} · {Math.round(w.durationSeconds / 60)} mins
              </p>
            </div>
            <span className="text-xs font-bold text-[#7ba3e0] bg-[#1F4B99]/20 px-2.5 py-1 rounded-lg border border-[#1F4B99]/30">
              {w.totalVolumeKg.toFixed(0)} kg vol
            </span>
          </div>

          <div className="text-xs text-[#9BA8B4] space-y-1 mt-2.5 pt-2 border-t border-white/5">
            {w.exercises.map((ex, i) => (
              <div key={i} className="flex justify-between">
                <span>{ex.name}</span>
                <span>{ex.sets.filter(s => s.completed).length} sets</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between items-center text-xs">
            <span className="text-[#e8b86d] font-bold">+{w.pointsEarned} pts earned</span>
            <button
              onClick={() => dispatch({ type: 'DELETE_WORKOUT', payload: w.id })}
              className="text-red-400 hover:text-red-300 text-[11px] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Workout Page Component ───────────────────────────────────────────
export default function WorkoutPage() {
  const { state, dispatch, todaysPlan } = useFitNinja();
  const { activePlan, user } = state;

  const [tab, setTab] = useState<'today' | 'schedule' | 'history'>('today');
  const [isActive, setIsActive] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<(WorkoutExercise & { restSeconds?: number })[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Load a planned day into active workout tracker
  function startPlannedWorkout(day: PlannedDay) {
    const loadedExercises = day.exercises.map(pe => {
      const repCount = parseInt(pe.reps) || 10;
      const sets: WorkoutSet[] = Array.from({ length: pe.sets }, () => ({
        id: genId(),
        reps: repCount,
        weightKg: 0,
        completed: false,
      }));

      return {
        id: genId(),
        name: pe.name,
        muscleGroup: pe.muscleGroup,
        restSeconds: pe.restSeconds || 90,
        notes: pe.notes,
        sets,
      };
    });

    setWorkoutName(`${day.focus} (${day.dayName})`);
    setExercises(loadedExercises);
    setElapsed(0);
    setIsActive(true);
    setTab('today');
  }

  // Fallback / blank session
  function startFreeWorkout() {
    setWorkoutName(`Custom Workout — ${format(new Date(), 'MMM d')}`);
    setExercises([]);
    setElapsed(0);
    setIsActive(true);
  }

  function addCustomExercise(template: ExerciseRecord) {
    const repNum = Math.round((template.repsRange[0] + template.repsRange[1]) / 2);
    const newEx = {
      id: genId(),
      name: template.name,
      muscleGroup: template.muscleGroup,
      restSeconds: template.restSeconds,
      sets: [
        { id: genId(), reps: repNum, weightKg: 0, completed: false },
        { id: genId(), reps: repNum, weightKg: 0, completed: false },
        { id: genId(), reps: repNum, weightKg: 0, completed: false },
      ],
    };
    setExercises(prev => [...prev, newEx]);
  }

  function updateSet(exId: string, setIdx: number, field: keyof WorkoutSet, val: any) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exId) return ex;
        const sets = ex.sets.map((s, i) => (i === setIdx ? { ...s, [field]: val } : s));
        return { ...ex, sets };
      })
    );
  }

  function addSet(exId: string) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: genId(), reps: last?.reps ?? 10, weightKg: last?.weightKg ?? 0, completed: false },
          ],
        };
      })
    );
  }

  function deleteExercise(exId: string) {
    setExercises(prev => prev.filter(e => e.id !== exId));
  }

  function finishWorkout() {
    if (exercises.length === 0) return;

    const totalVolumeKg = exercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets.filter(s => s.completed).reduce((s2, s) => s2 + s.reps * s.weightKg, 0),
      0
    );

    const pts = Math.max(25, Math.round(totalVolumeKg / 10));

    const completedWorkout: Workout = {
      id: genId(),
      name: workoutName || `Workout ${format(new Date(), 'MMM d')}`,
      date: new Date().toISOString(),
      durationSeconds: elapsed,
      exercises,
      totalVolumeKg,
      pointsEarned: pts,
    };

    dispatch({ type: 'ADD_WORKOUT', payload: completedWorkout });
    dispatch({ type: 'ADD_POINTS', payload: pts });
    setIsActive(false);
    setExercises([]);
    setElapsed(0);
    setTab('history');
  }

  function cancelWorkout() {
    if (confirm('Cancel this active workout? Progress will not be saved.')) {
      setIsActive(false);
      setExercises([]);
      setElapsed(0);
    }
  }

  return (
    <div className="pb-4 space-y-4">
      {/* Top Tab Switcher */}
      {!isActive && (
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {[
            { id: 'today', label: "Today's Session", icon: '💪' },
            { id: 'schedule', label: '7-Day Plan', icon: '📅' },
            { id: 'history', label: 'History', icon: '📋' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === t.id
                  ? 'bg-[#1F4B99] text-white shadow-md'
                  : 'text-[#9BA8B4] hover:text-white'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: TODAY'S SESSION */}
      {!isActive && tab === 'today' && (
        <div className="space-y-4">
          {todaysPlan ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[11px] font-bold text-[#7ba3e0] uppercase tracking-wider">
                    Today is {todaysPlan.dayName}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{todaysPlan.focus}</h2>
                  <p className="text-xs text-[#9BA8B4] mt-1">
                    {todaysPlan.isRest
                      ? 'Scheduled recovery day'
                      : `${todaysPlan.exercises.length} planned exercises · Est. ${todaysPlan.estimatedDurationMins} mins`}
                  </p>
                </div>
                <span className="text-2xl">{todaysPlan.isRest ? '🧘' : '🔥'}</span>
              </div>

              {todaysPlan.isRest ? (
                /* Rest Day Card */
                <div className="bg-white/5 rounded-xl p-4 my-4 text-center">
                  <p className="text-xs text-[#9BA8B4] leading-relaxed">
                    Recovery is where muscles grow and energy recharges. Focus on hydration, mobility, and hitting your{' '}
                    <strong className="text-white">{user.proteinTargetG}g protein</strong> target today.
                  </p>
                  <button
                    onClick={() => setTab('schedule')}
                    className="mt-4 text-xs text-[#7ba3e0] underline hover:text-white"
                  >
                    Want to train anyway? View 7-day schedule →
                  </button>
                </div>
              ) : (
                /* Planned Exercises List */
                <div className="space-y-2.5 my-4">
                  <p className="text-xs font-semibold text-[#9BA8B4] uppercase tracking-wider">
                    Today's Target Routine (Never Random)
                  </p>
                  {todaysPlan.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#1F4B99]/20 text-[#7ba3e0] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{ex.name}</p>
                          <p className="text-[10px] text-[#9BA8B4]">{ex.muscleGroup} {ex.notes && `· ${ex.notes}`}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#7ba3e0]">{ex.sets} sets</span>
                        <p className="text-[10px] text-[#9BA8B4]">{ex.reps} reps</p>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => startPlannedWorkout(todaysPlan)}
                    className="w-full bg-[#1F4B99] hover:bg-[#153880] text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-[#1F4B99]/30 mt-2 flex items-center justify-center gap-2"
                  >
                    <span>Start Today's Workout</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-[#9BA8B4]">
                <span>Want a blank session?</span>
                <button
                  onClick={startFreeWorkout}
                  className="text-xs text-[#7ba3e0] hover:underline"
                >
                  Start Empty Workout
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <p className="text-3xl mb-2">🥷</p>
              <h3 className="text-white font-bold text-base mb-1">No Active Plan Assigned</h3>
              <p className="text-xs text-[#9BA8B4] mb-4">
                Let's set up your personalized workout split and health profile.
              </p>
              <button
                onClick={startFreeWorkout}
                className="bg-[#1F4B99] text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                Start Workout
              </button>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE WORKOUT TRACKER */}
      {isActive && (
        <ActiveWorkout
          workoutName={workoutName}
          exercises={exercises}
          onAddExercise={() => setShowPicker(true)}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onDeleteExercise={deleteExercise}
          onFinish={finishWorkout}
          onCancel={cancelWorkout}
          elapsed={elapsed}
        />
      )}

      {/* TAB 2: 7-DAY SCHEDULE */}
      {!isActive && tab === 'schedule' && (
        <WeeklyPlanView onStartDay={startPlannedWorkout} />
      )}

      {/* TAB 3: WORKOUT HISTORY */}
      {!isActive && tab === 'history' && <WorkoutHistoryView />}

      {/* EXERCISE PICKER MODAL */}
      <AnimatePresence>
        {showPicker && (
          <ExercisePicker onSelect={addCustomExercise} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
