import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFitNinja,
  type HealthCondition,
  type WorkoutSplit,
  type FitnessGoal,
  calculateNutrition,
} from '../context/FitNinjaContext';
import { generateCustomPlan } from '../data/workoutPlanAI';
import CloudSyncModal from '../components/app/CloudSyncModal';

const steps = [
  'welcome',
  'basics',        // gender, age
  'body',          // weight, height
  'goal_level',    // goal, fitness level, days/week
  'health',        // thyroid, diabetes, pregnancy, injuries
  'split',         // PPL, Upper/Lower, Full Body, Coach decides
  'generating',    // AI plan building + reveal
] as const;

type Step = typeof steps[number];

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.25 },
};

const HEALTH_OPTIONS: { id: HealthCondition; label: string; icon: string; desc: string }[] = [
  { id: 'none',             label: 'None / Fully Healthy',   icon: '🛡️', desc: 'No active injuries or metabolic conditions' },
  { id: 'thyroid',          label: 'Thyroid Condition',      icon: '🦋', desc: 'Metabolic adaptation, steady recovery' },
  { id: 'diabetes',         label: 'Diabetes (Type 1 or 2)', icon: '🩸', desc: 'Blood sugar & glycogen management' },
  { id: 'post_pregnancy',   label: 'Post-Pregnancy Recovery',icon: '👶', desc: 'Gentle core restoration, pelvic floor safe' },
  { id: 'knee_injury',      label: 'Knee Pain / Injury',     icon: '🦵', desc: 'Avoids heavy knee shearing & high jumps' },
  { id: 'back_injury',      label: 'Lower Back / Spine Pain',icon: '🩹', desc: 'Excludes heavy axial spine compression' },
  { id: 'shoulder_injury',  label: 'Shoulder Impingement',   icon: '🦾', desc: 'Protects rotator cuff with safe angles' },
  { id: 'hypertension',     label: 'High Blood Pressure',    icon: '💓', desc: 'Controlled breathing & moderate loading' },
  { id: 'pcos',             label: 'PCOS / Hormonal Balance',icon: '🌸', desc: 'Low-stress resistance training focus' },
];

const SPLIT_OPTIONS: { id: WorkoutSplit; label: string; icon: string; subtitle: string; tag: string }[] = [
  { id: 'coach_decides',   label: 'Let Coach Decide',       icon: '🥷', subtitle: 'Smart AI selects the optimal split for your schedule', tag: 'Recommended' },
  { id: 'push_pull_legs',  label: 'Push / Pull / Legs',     icon: '⚡', subtitle: 'Push (Chest/Shoulders/Triceps), Pull (Back/Biceps), Legs', tag: '3-6 Days' },
  { id: 'upper_lower',     label: 'Upper / Lower Split',    icon: '🏋️', subtitle: 'Upper body and Lower body alternating sessions', tag: '4 Days' },
  { id: 'full_body',       label: 'Full Body Routine',      icon: '🔄', subtitle: 'Every session trains major compound muscle groups', tag: '3 Days' },
  { id: 'bro_split',       label: 'Classic Bodypart Split', icon: '🎯', subtitle: 'Dedicated day for Chest, Back, Legs, Shoulders, Arms', tag: '5 Days' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { dispatch } = useFitNinja();
  const [step, setStep] = useState<Step>('welcome');
  const [showCloudModal, setShowCloudModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  // Goal & Level
  const [goal, setGoal] = useState<FitnessGoal>('muscle_gain');
  const [fitnessLevel, setFitnessLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

  // Health Conditions
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(['none']);

  // Split preference
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutSplit>('coach_decides');

  // Generated Plan preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<{
    calories: number;
    protein: number;
    splitName: string;
    tips: string[];
  } | null>(null);

  const stepIndex = steps.indexOf(step);
  const progress = (stepIndex / (steps.length - 1)) * 100;

  function next() {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      const nextStep = steps[idx + 1];
      setStep(nextStep);
      if (nextStep === 'generating') {
        runPlanGeneration();
      }
    }
  }

  function back() {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function toggleHealthCondition(id: HealthCondition) {
    if (id === 'none') {
      setHealthConditions(['none']);
      return;
    }
    setHealthConditions(prev => {
      const withoutNone = prev.filter(x => x !== 'none');
      if (withoutNone.includes(id)) {
        const next = withoutNone.filter(x => x !== id);
        return next.length === 0 ? ['none'] : next;
      } else {
        return [...withoutNone, id];
      }
    });
  }

  async function runPlanGeneration() {
    setIsGenerating(true);

    const weightKg = unit === 'imperial' ? weight * 0.453592 : weight;
    const heightCm = unit === 'imperial' ? height * 2.54 : height;

    const tempProfile = {
      name: name.trim() || 'Ninja',
      gender,
      age,
      weightKg,
      heightCm,
      unit,
      fitnessLevel,
      goal,
      daysPerWeek,
      workoutSplit,
      healthConditions,
      availableEquipment: ['barbell', 'dumbbell', 'bodyweight', 'cable', 'lever'],
      dailyCalorieTarget: 2200,
      proteinTargetG: 150,
      setupDone: true,
    };

    const nutrition = calculateNutrition(tempProfile);
    tempProfile.dailyCalorieTarget = nutrition.calories;
    tempProfile.proteinTargetG = nutrition.proteinG;

    // Generate tailored workout plan with all health safety checks
    const plan = await generateCustomPlan(tempProfile);

    setGeneratedSummary({
      calories: nutrition.calories,
      protein: nutrition.proteinG,
      splitName: plan.title,
      tips: plan.progressionTips,
    });

    // Save both User and Plan to Context (which writes to localStorage)
    dispatch({ type: 'SET_USER', payload: tempProfile });
    dispatch({ type: 'SET_PLAN', payload: plan });

    setIsGenerating(false);
  }

  function finish() {
    // User is already saved, setting setupDone triggers redirect
    dispatch({ type: 'SET_USER', payload: { setupDone: true } });
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <span className="text-3xl">🥷</span>
        <p className="text-xs tracking-[0.25em] text-[#9BA8B4] uppercase mt-1 font-semibold">
          Fit Ninja Custom Coach
        </p>
      </div>

      {/* Progress Bar */}
      {step !== 'welcome' && (
        <div className="w-full max-w-md mb-6">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1F4B99] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-[#9BA8B4] mt-1.5 px-1">
            <span>Step {stepIndex} of {steps.length - 1}</span>
            <span className="capitalize">{step.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {/* Wizard Container */}
      <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 'welcome' && (
            <motion.div key="welcome" {...slide} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1F4B99]/20 border border-[#1F4B99]/30 flex items-center justify-center text-3xl mx-auto mb-4">
                🥷
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Personalized Fit Ninja
              </h1>
              <p className="text-sm text-[#9BA8B4] mb-6 leading-relaxed">
                No random workouts. We build a customized training & nutrition program calibrated for your body, health status, and goals.
              </p>

              <div className="mb-6 text-left">
                <label className="block text-xs font-semibold text-[#9BA8B4] uppercase tracking-wider mb-2">
                  What's your name?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Ninja"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-[#1F4B99] transition-all"
                />
              </div>

              <button
                onClick={next}
                className="w-full bg-[#1F4B99] hover:bg-[#153880] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1F4B99]/25 flex items-center justify-center gap-2"
              >
                <span>Start Personalizing</span>
                <span>→</span>
              </button>

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCloudModal(true)}
                  className="w-full py-3 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-[#38bdf8] flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <span>☁️</span>
                  <span>Already an Athlete? Restore with Email</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: GENDER & AGE */}
          {step === 'basics' && (
            <motion.div key="basics" {...slide}>
              <h2 className="text-xl font-bold text-white mb-1">Gender & Age</h2>
              <p className="text-xs text-[#9BA8B4] mb-5">
                Calibrates basal metabolic rate (BMR) and recovery capacity.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-4 px-3 rounded-xl border text-center transition-all ${
                      gender === g
                        ? 'border-[#1F4B99] bg-[#1F4B99]/20 text-white shadow-md shadow-[#1F4B99]/20'
                        : 'border-white/10 bg-white/5 text-[#9BA8B4] hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{g === 'male' ? '👨' : '👩'}</span>
                    <span className="capitalize font-medium text-xs sm:text-sm">
                      {g === 'male' ? 'Male' : 'Female'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#9BA8B4]">Age</span>
                  <span className="text-lg font-bold text-white">{age} <span className="text-xs text-[#9BA8B4]">years</span></span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={80}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full accent-[#1F4B99] h-2"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="flex-1 bg-white/5 hover:bg-white/10 text-[#9BA8B4] py-3 rounded-xl text-sm font-medium transition-colors">
                  Back
                </button>
                <button onClick={next} className="flex-1 bg-[#1F4B99] hover:bg-[#153880] text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: BODY (WEIGHT & HEIGHT) */}
          {step === 'body' && (
            <motion.div key="body" {...slide}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Body Stats</h2>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setUnit('metric')}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${unit === 'metric' ? 'bg-[#1F4B99] text-white' : 'text-[#9BA8B4]'}`}
                  >
                    kg / cm
                  </button>
                  <button
                    onClick={() => setUnit('imperial')}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${unit === 'imperial' ? 'bg-[#1F4B99] text-white' : 'text-[#9BA8B4]'}`}
                  >
                    lbs / in
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#9BA8B4]">Current Weight</span>
                  <span className="text-lg font-bold text-white">
                    {weight} <span className="text-xs text-[#9BA8B4]">{unit === 'metric' ? 'kg' : 'lbs'}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={unit === 'metric' ? 35 : 77}
                  max={unit === 'metric' ? 180 : 400}
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full accent-[#1F4B99] h-2"
                />
              </div>

              {/* Height */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#9BA8B4]">Height</span>
                  <span className="text-lg font-bold text-white">
                    {height} <span className="text-xs text-[#9BA8B4]">{unit === 'metric' ? 'cm' : 'in'}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={unit === 'metric' ? 130 : 51}
                  max={unit === 'metric' ? 220 : 87}
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full accent-[#1F4B99] h-2"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="flex-1 bg-white/5 hover:bg-white/10 text-[#9BA8B4] py-3 rounded-xl text-sm font-medium transition-colors">
                  Back
                </button>
                <button onClick={next} className="flex-1 bg-[#1F4B99] hover:bg-[#153880] text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: GOAL, LEVEL & DAYS */}
          {step === 'goal_level' && (
            <motion.div key="goal_level" {...slide}>
              <h2 className="text-xl font-bold text-white mb-1">Goal & Experience</h2>
              <p className="text-xs text-[#9BA8B4] mb-4">
                Helps configure proper volume, sets, and rep ranges.
              </p>

              {/* Experience Level */}
              <label className="block text-xs text-[#9BA8B4] mb-1.5 font-medium">Your Fitness Level</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFitnessLevel(lvl)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                      fitnessLevel === lvl
                        ? 'bg-[#1F4B99] border-[#1F4B99] text-white'
                        : 'bg-white/5 border-white/10 text-[#9BA8B4] hover:border-white/20'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Primary Goal */}
              <label className="block text-xs text-[#9BA8B4] mb-1.5 font-medium">Primary Goal</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'muscle_gain', label: 'Build Muscle', icon: '💪' },
                  { id: 'fat_loss', label: 'Burn Fat', icon: '🔥' },
                  { id: 'strength', label: 'Get Stronger', icon: '🏋️' },
                  { id: 'general_fitness', label: 'Fitness & Health', icon: '🎯' },
                ].map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as FitnessGoal)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      goal === g.id
                        ? 'border-[#1F4B99] bg-[#1F4B99]/20 text-white'
                        : 'border-white/10 bg-white/5 text-[#9BA8B4] hover:border-white/20'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span className="font-medium truncate">{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Days per week */}
              <label className="block text-xs text-[#9BA8B4] mb-1.5 font-medium">
                Training Days / Week: <strong className="text-white">{daysPerWeek} Days</strong>
              </label>
              <div className="flex gap-1.5 mb-6">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      daysPerWeek === d
                        ? 'bg-[#1F4B99] border-[#1F4B99] text-white'
                        : 'bg-white/5 border-white/10 text-[#9BA8B4]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="flex-1 bg-white/5 hover:bg-white/10 text-[#9BA8B4] py-3 rounded-xl text-sm font-medium transition-colors">
                  Back
                </button>
                <button onClick={next} className="flex-1 bg-[#1F4B99] hover:bg-[#153880] text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: HEALTH ISSUES & INJURIES (USER REQUESTED) */}
          {step === 'health' && (
            <motion.div key="health" {...slide}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🩺</span>
                <h2 className="text-xl font-bold text-white">Health & Injuries</h2>
              </div>
              <p className="text-xs text-[#9BA8B4] mb-3">
                Crucial for safety: We automatically filter out risky lifts and adapt calorie & pacing targets.
              </p>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 mb-5" style={{ scrollbarWidth: 'thin' }}>
                {HEALTH_OPTIONS.map(opt => {
                  const isSelected = healthConditions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleHealthCondition(opt.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#1F4B99] bg-[#1F4B99]/20 text-white'
                          : 'border-white/10 bg-white/5 text-[#9BA8B4] hover:border-white/20'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#e0e0e0]'}`}>
                            {opt.label}
                          </p>
                          {isSelected && <span className="text-[#7ba3e0] text-xs font-bold">✓</span>}
                        </div>
                        <p className="text-[11px] text-[#9BA8B4] mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="flex-1 bg-white/5 hover:bg-white/10 text-[#9BA8B4] py-3 rounded-xl text-sm font-medium transition-colors">
                  Back
                </button>
                <button onClick={next} className="flex-1 bg-[#1F4B99] hover:bg-[#153880] text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: WORKOUT SPLIT PREFERENCE (USER REQUESTED) */}
          {step === 'split' && (
            <motion.div key="split" {...slide}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📊</span>
                <h2 className="text-xl font-bold text-white">Workout Split</h2>
              </div>
              <p className="text-xs text-[#9BA8B4] mb-4">
                Choose your routine style or let the Ninja Coach auto-select.
              </p>

              <div className="space-y-2.5 mb-6">
                {SPLIT_OPTIONS.map(sp => {
                  const isSelected = workoutSplit === sp.id;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setWorkoutSplit(sp.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#1F4B99] bg-[#1F4B99]/20 text-white shadow-md shadow-[#1F4B99]/20'
                          : 'border-white/10 bg-white/5 text-[#9BA8B4] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sp.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#e0e0e0]'}`}>
                              {sp.label}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#7ba3e0] font-medium">
                              {sp.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9BA8B4] mt-0.5">{sp.subtitle}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#1F4B99] bg-[#1F4B99]' : 'border-white/20'}`}>
                        {isSelected && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="flex-1 bg-white/5 hover:bg-white/10 text-[#9BA8B4] py-3 rounded-xl text-sm font-medium transition-colors">
                  Back
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-[#1F4B99] hover:bg-[#153880] text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#1F4B99]/20"
                >
                  Generate Plan ✦
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 7: GENERATING & REVEAL */}
          {step === 'generating' && (
            <motion.div key="generating" {...slide} className="text-center py-2">
              {isGenerating ? (
                <div className="py-12">
                  <div className="w-12 h-12 border-3 border-[#1F4B99] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-1">Building Your Custom Plan</h3>
                  <p className="text-xs text-[#9BA8B4] max-w-xs mx-auto">
                    Checking health safety, calibrating TDEE macros, and generating a non-random 7-day schedule...
                  </p>
                </div>
              ) : generatedSummary ? (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#3ba213]/20 border border-[#3ba213]/30 text-2xl flex items-center justify-center mx-auto mb-3">
                    ✅
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Your Program is Ready!</h2>
                  <p className="text-xs text-[#9BA8B4] mb-4">
                    {generatedSummary.splitName}
                  </p>

                  {/* Macros overview card */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#9BA8B4]">Daily Calories</p>
                      <p className="text-xl font-black text-[#e8b86d] mt-0.5">
                        {generatedSummary.calories} <span className="text-xs font-normal text-white/50">kcal</span>
                      </p>
                      <p className="text-[10px] text-[#9BA8B4] mt-1">Calibrated to goal & health</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#9BA8B4]">Daily Protein</p>
                      <p className="text-xl font-black text-[#7ba3e0] mt-0.5">
                        {generatedSummary.protein} <span className="text-xs font-normal text-white/50">g</span>
                      </p>
                      <p className="text-[10px] text-[#9BA8B4] mt-1">Optimal muscle preservation</p>
                    </div>
                  </div>

                  {/* Highlights list */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 text-left">
                    <p className="text-xs font-semibold text-white mb-2">Program Safety & Highlights</p>
                    <ul className="space-y-1.5">
                      {generatedSummary.tips.slice(0, 3).map((t, idx) => (
                        <li key={idx} className="text-xs text-[#9BA8B4] flex items-start gap-2">
                          <span className="text-[#3ba213] text-sm shrink-0">✓</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={finish}
                    className="w-full bg-[#1F4B99] hover:bg-[#153880] text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-[#1F4B99]/30"
                  >
                    Enter My Dojo 🥷
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cross-Device Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        onSuccess={() => navigate('/v2')}
      />
    </div>
  );
}
