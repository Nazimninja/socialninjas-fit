import React, { useState } from 'react';
import {
  useFitNinja,
  type WeeklyCheckin,
  type WorkoutSplit,
  type PhysiquePhoto,
} from '../../context/FitNinjaContext';
import { generateCustomPlan, formatSplitName } from '../../data/workoutPlanAI';
import Icon from './Icon';

interface WeeklyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyCheckinModal({ isOpen, onClose }: WeeklyCheckinModalProps) {
  const { state, dispatch } = useFitNinja();
  const { user, activePlan } = state;

  const [currentWeight, setCurrentWeight] = useState(user.weightKg || 78.0);
  const [difficulty, setDifficulty] = useState<'easy' | 'good' | 'hard'>('good');
  const [soreness, setSoreness] = useState<'fresh' | 'mild' | 'sore'>('mild');
  const [dietRating, setDietRating] = useState<'on_track' | 'minor_slip' | 'cravings'>('on_track');
  const [notes, setNotes] = useState('');

  // 3-Angle Photos
  const [photos, setPhotos] = useState<{ slot: string; url: string }[]>([]);

  // Split switcher
  const [changeSplit, setChangeSplit] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit>(user.workoutSplit);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const weightDelta = Number((currentWeight - user.weightKg).toFixed(1));

  function adjustWeight(delta: number) {
    setCurrentWeight(prev => Number(Math.max(30, Math.min(250, prev + delta)).toFixed(1)));
  }

  function handlePhotoUpload(slot: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      if (url) {
        setPhotos(prev => [...prev.filter(p => p.slot !== slot), { slot, url }]);
      }
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(slot: string) {
    setPhotos(prev => prev.filter(p => p.slot !== slot));
  }

  async function handleCheckinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const currentWeek = activePlan?.weekNumber || 1;

    // Adaptive calorie logic
    let adjustedCalories = user.dailyCalorieTarget;
    let insight = '';

    if (user.goal === 'fat_loss') {
      if (weightDelta > 0.2) {
        adjustedCalories = Math.max(1500, user.dailyCalorieTarget - 120);
        insight = `Weight trended +${weightDelta} kg. Calories adjusted down by 120 kcal to reignite fat loss.`;
      } else if (weightDelta < -1.0) {
        adjustedCalories = user.dailyCalorieTarget + 100;
        insight = `Weight dropped rapidly (-${Math.abs(weightDelta)} kg). Calories bumped by 100 kcal to protect lean tissue.`;
      } else {
        insight = `Optimal fat loss pace (${Math.abs(weightDelta)} kg/wk). Daily calories maintained at ${user.dailyCalorieTarget} kcal.`;
      }
    } else if (user.goal === 'muscle_gain') {
      if (weightDelta < 0.1) {
        adjustedCalories = user.dailyCalorieTarget + 150;
        insight = `Surplus was mild. Adding 150 kcal to accelerate muscle hypertrophy and recovery.`;
      } else if (weightDelta > 0.6) {
        adjustedCalories = Math.max(1800, user.dailyCalorieTarget - 100);
        insight = `Surplus was high (+${weightDelta} kg). Trimming 100 kcal to prioritize lean muscle over fat.`;
      } else {
        insight = `Paced surplus spot on (+${weightDelta} kg). Calories locked at ${user.dailyCalorieTarget} kcal.`;
      }
    } else {
      insight = `Weight steady at ${currentWeight} kg. Maintain progressive overload on core compound lifts.`;
    }

    if (soreness === 'sore') {
      insight += ' Deload volume slightly next week or prioritize an extra recovery meal.';
    }

    const updatedUser = {
      ...user,
      weightKg: currentWeight,
      dailyCalorieTarget: adjustedCalories,
      workoutSplit: changeSplit ? selectedSplit : user.workoutSplit,
    };

    // If split changed, regenerate the 7-day program
    if (changeSplit && selectedSplit !== user.workoutSplit) {
      const newPlan = await generateCustomPlan(updatedUser);
      dispatch({ type: 'SET_PLAN', payload: { ...newPlan, weekNumber: currentWeek + 1 } });
    } else if (activePlan) {
      dispatch({ type: 'ADVANCE_WEEK' });
    }

    const checkinPayload: WeeklyCheckin = {
      id: 'checkin_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      weekNumber: currentWeek,
      weightKg: currentWeight,
      energyLevel: difficulty === 'easy' ? 4 : difficulty === 'good' ? 5 : 2,
      sleepHours: 8,
      hungerLevel: dietRating === 'on_track' ? 3 : 4,
      workoutsCompleted: user.daysPerWeek,
      difficulty,
      soreness,
      dietRating,
      notes,
      photos: photos.map(p => p.url),
      adjustedCalories,
      adjustedProteinG: user.proteinTargetG,
      splitChanged: changeSplit ? selectedSplit : undefined,
      aiInsight: insight,
    };

    dispatch({ type: 'ADD_CHECKIN', payload: checkinPayload });
    dispatch({ type: 'ADD_POINTS', payload: 100 });

    setIsSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0b1322] border border-[#172744] rounded-3xl p-5 sm:p-6 shadow-2xl my-auto animate-popIn max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#172744]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Icon name="camera" size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Weekly Progress Check-in
              </h2>
              <p className="text-[11px] text-[#71829d]">Monday Weigh-in & Protocol Calibration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#121c2e] border border-[#172744] flex items-center justify-center text-[#71829d] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-4">
          {/* ── SECTION 1: CURRENT BODYWEIGHT ── */}
          <div className="bg-[#0e1726] border border-[#172744] rounded-2xl p-4 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#71829d] mb-1">
              Current Bodyweight
            </p>

            <div className="flex items-center justify-center gap-4 my-2">
              <button
                type="button"
                onClick={() => adjustWeight(-0.5)}
                className="w-10 h-10 rounded-full bg-[#121c2e] border border-[#1e3256] text-white font-bold text-lg flex items-center justify-center active:scale-95"
              >
                -
              </button>
              <div className="text-3xl font-black text-white tracking-tight">
                {currentWeight.toFixed(1)} <span className="text-xs font-bold text-[#71829d] uppercase">{user.unit === 'imperial' ? 'LB' : 'KG'}</span>
              </div>
              <button
                type="button"
                onClick={() => adjustWeight(0.5)}
                className="w-10 h-10 rounded-full bg-[#121c2e] border border-[#1e3256] text-white font-bold text-lg flex items-center justify-center active:scale-95"
              >
                +
              </button>
            </div>

            <p className="text-[11px] text-[#71829d]">
              {weightDelta !== 0
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg vs baseline`
                : 'First weekly check-in baseline'}
            </p>

            {/* Incremental chips */}
            <div className="flex justify-center gap-2 mt-3">
              {[-1.0, -0.5, +0.5, +1.0].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => adjustWeight(d)}
                  className="px-2.5 py-1 bg-[#121c2e] hover:bg-[#1a2840] border border-[#172744] rounded-lg text-[11px] font-bold text-[#94a3b8] transition-colors"
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: PHYSIQUE CHECK-IN PHOTOS (0 of 3 Angles) ── */}
          <div className="bg-[#0e1726] border border-[#172744] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#38bdf8]">
                Physique Check-In Photos
              </p>
              <span className="text-[10px] font-bold text-[#71829d]">{photos.length} of 3 Angles</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { slot: 'front', label: 'Front Pose' },
                { slot: 'side', label: 'Side Pose' },
                { slot: 'back', label: 'Back Pose' },
              ].map(item => {
                const photo = photos.find(p => p.slot === item.slot);
                return (
                  <div key={item.slot} className="text-center">
                    {photo ? (
                      <div className="relative rounded-xl overflow-hidden h-28 bg-black border-2 border-[#38bdf8]">
                        <img src={photo.url} alt={item.label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(item.slot)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center font-black"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-[9px] font-extrabold text-[#38bdf8] uppercase tracking-wider">
                          ✓ {item.label}
                        </div>
                      </div>
                    ) : (
                      <label className="h-28 border-2 border-dashed border-[#172744] hover:border-[#38bdf8]/50 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#121c2e]/60 hover:bg-[#121c2e] transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePhotoUpload(item.slot, e)}
                          className="hidden"
                        />
                        <div className="w-7 h-7 rounded-full bg-[#1b2a42] flex items-center justify-center text-[#38bdf8]">
                          <Icon name="camera" size={15} />
                        </div>
                        <span className="text-[10px] font-bold text-[#71829d]">{item.label}</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 3: TRAINING LOAD & INTENSITY ── */}
          <div className="bg-[#0e1726] border border-[#172744] rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#71829d] mb-2">
                Training Load & Intensity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Under-loaded', desc: 'RPE <6' },
                  { id: 'good', label: 'Optimal Load', desc: 'RPE 7-9' },
                  { id: 'hard', label: 'Overloaded', desc: 'Max Fatigue' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id as any)}
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      difficulty === opt.id
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-[#121c2e] text-white border-[#172744] hover:border-[#1e3256]'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{opt.label}</div>
                    <div className="text-[9px] opacity-75 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recovery & Muscle Soreness */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#71829d] mb-2">
                Recovery & Muscle Soreness:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'fresh', label: 'Fully Rested', desc: 'No soreness' },
                  { id: 'mild', label: 'Normal DOMS', desc: 'Ready to train' },
                  { id: 'sore', label: 'High Fatigue', desc: 'Need recovery' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSoreness(opt.id as any)}
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      soreness === opt.id
                        ? 'bg-[#1b2a42] border-[#fb923c] text-[#fb923c] shadow-lg'
                        : 'bg-[#121c2e] text-white border-[#172744] hover:border-[#1e3256]'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{opt.label}</div>
                    <div className="text-[9px] opacity-75 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nutrition Protocol Adherence */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#71829d] mb-2">
                Nutrition Protocol Adherence:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'on_track', label: '100% On Track' },
                  { id: 'minor_slip', label: '80% Adherence' },
                  { id: 'cravings', label: 'Off Track' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietRating(opt.id as any)}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-extrabold border transition-all ${
                      dietRating === opt.id
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-[#121c2e] text-white border-[#172744] hover:border-[#1e3256]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION 4: SPLIT SWITCHER (OPTIONAL) ── */}
          <div className="bg-[#0e1726] border border-[#172744] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Switch Workout Split?</span>
              <button
                type="button"
                onClick={() => setChangeSplit(!changeSplit)}
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full border transition-all ${
                  changeSplit
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40'
                    : 'bg-[#121c2e] text-[#71829d] border-[#172744]'
                }`}
              >
                {changeSplit ? 'Split Switch ON' : 'Keep ' + formatSplitName(user.workoutSplit)}
              </button>
            </div>

            {changeSplit && (
              <div className="grid grid-cols-3 gap-2 mt-3 animate-fadeIn">
                {[
                  { split: 'push_pull_legs', label: 'Push / Pull / Legs' },
                  { split: 'upper_lower', label: 'Upper / Lower' },
                  { split: 'full_body', label: 'Full Body' },
                ].map(s => (
                  <button
                    key={s.split}
                    type="button"
                    onClick={() => setSelectedSplit(s.split as any)}
                    className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                      selectedSplit === s.split
                        ? 'bg-[#38bdf8] text-black border-[#38bdf8]'
                        : 'bg-[#121c2e] text-white border-[#172744]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── SECTION 5: ATHLETE LOG NOTES (OPTIONAL) ── */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71829d] mb-1.5">
              Athlete Log Notes (Optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Log any joint sensations, PR milestones, or lifestyle notes..."
              className="w-full bg-[#0e1726] border border-[#172744] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-[#38bdf8] placeholder:text-[#64748b]"
            />
          </div>

          {/* ── SUBMIT BUTTON ── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-white hover:bg-slate-100 text-black font-black text-sm rounded-2xl shadow-2xl transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>{isSubmitting ? 'Analyzing & Adapting Plan…' : 'Save Check-in & Adapt Plan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
