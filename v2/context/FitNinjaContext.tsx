import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
export type WorkoutSplit =
  | 'push_pull_legs'
  | 'upper_lower'
  | 'full_body'
  | 'bro_split'
  | 'coach_decides';

export type FitnessGoal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'strength'
  | 'endurance'
  | 'general_fitness';

export type HealthCondition =
  | 'none'
  | 'thyroid'
  | 'diabetes'
  | 'post_pregnancy'
  | 'knee_injury'
  | 'back_injury'
  | 'shoulder_injury'
  | 'heart_condition'
  | 'hypertension'
  | 'pcos';

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | '';
  age: number;
  weightKg: number;
  heightCm: number;
  unit: 'metric' | 'imperial';
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: FitnessGoal;
  daysPerWeek: number;
  workoutSplit: WorkoutSplit;
  healthConditions: HealthCondition[];
  availableEquipment: string[];
  dailyCalorieTarget: number;   // calculated from TDEE
  proteinTargetG: number;
  setupDone: boolean;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  restSeconds?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  pointsEarned: number;
  planDayIndex?: number;  // which day of the plan this corresponds to
}

// ── Structured Plan Types ──────────────────────────────────────────────────
export interface PlannedExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;        // "8-12" or "30s"
  restSeconds: number;
  notes?: string;
  gifUrl?: string;
  thumbUrl?: string;
}

export interface PlannedDay {
  dayName: string;      // "Monday"
  focus: string;        // "Push — Chest, Shoulders, Triceps"
  isRest: boolean;
  exercises: PlannedExercise[];
  estimatedDurationMins: number;
  estimatedCalories: number;
}

export interface ActivePlan {
  id: string;
  title: string;
  summary: string;
  split: WorkoutSplit;
  durationWeeks: number;
  days: PlannedDay[];   // 7 entries, one per weekday
  progressionTips: string[];
  nutritionTip: string;
  generatedAt: string;
  weekNumber: number;   // current week 1..durationWeeks
}

// ── Weekly Check-in ────────────────────────────────────────────────────────
export interface PhysiquePhoto {
  id: string;
  date: string;
  photoUrl: string;
  weight: number;
  angle?: 'front' | 'side' | 'back' | string;
}

export interface BodyweightEntry {
  d: string;
  w: number;
  t?: number;
}

export interface WeeklyCheckin {
  id: string;
  date: string;
  weekNumber: number;
  weightKg: number;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  sleepHours?: number;
  hungerLevel?: 1 | 2 | 3 | 4 | 5;
  workoutsCompleted?: number;
  notes: string;
  difficulty?: 'easy' | 'good' | 'hard';
  soreness?: 'fresh' | 'mild' | 'sore';
  dietRating?: 'on_track' | 'minor_slip' | 'cravings';
  photos?: string[];
  // AI-adjusted targets after check-in
  adjustedCalories: number;
  adjustedProteinG: number;
  splitChanged?: WorkoutSplit;
  aiInsight: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  category: 'consistency' | 'strength' | 'volume' | 'milestone';
}

export interface FitnessScore {
  score: number;
  summary: string;
  generatedAt: string;
}

interface FitNinjaState {
  user: UserProfile;
  activePlan: ActivePlan | null;
  workouts: Workout[];
  checkins: WeeklyCheckin[];
  photos: PhysiquePhoto[];
  bodyweight: BodyweightEntry[];
  score: FitnessScore | null;
  points: number;
  streak: number;
  badges: Badge[];
}

type Action =
  | { type: 'SET_USER'; payload: Partial<UserProfile> }
  | { type: 'SET_PLAN'; payload: ActivePlan }
  | { type: 'CLEAR_PLAN' }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'CHANGE_SPLIT'; payload: WorkoutSplit }
  | { type: 'ADD_WORKOUT'; payload: Workout }
  | { type: 'DELETE_WORKOUT'; payload: string }
  | { type: 'ADD_CHECKIN'; payload: WeeklyCheckin }
  | { type: 'ADD_PHOTO'; payload: PhysiquePhoto }
  | { type: 'DELETE_PHOTO'; payload: string }
  | { type: 'LOG_BODYWEIGHT'; payload: { weight: number; date?: string } }
  | { type: 'ADD_EXERCISE_TO_PLAN'; payload: { dayIndex?: number; exercise: PlannedExercise } }
  | { type: 'SET_SCORE'; payload: FitnessScore }
  | { type: 'ADD_POINTS'; payload: number }
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'UNLOCK_BADGE'; payload: string }
  | { type: 'UPDATE_BADGE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'RESET' };

// ── Default badges ─────────────────────────────────────────────────────────
const defaultBadges: Badge[] = [
  { id: 'first_workout',   name: 'First Rep',       description: 'Log your first workout',        icon: '🏋️', unlocked: false, progress: 0, category: 'milestone' },
  { id: 'week_streak',     name: 'Week Warrior',    description: '7-day workout streak',          icon: '🔥', unlocked: false, progress: 0, category: 'consistency' },
  { id: 'month_streak',    name: 'Iron Discipline', description: '30-day workout streak',         icon: '⚔️', unlocked: false, progress: 0, category: 'consistency' },
  { id: 'volume_1000',     name: 'Volume King',     description: 'Lift 1,000 kg total volume',   icon: '👑', unlocked: false, progress: 0, category: 'volume' },
  { id: 'volume_10000',    name: 'Volume God',      description: 'Lift 10,000 kg total volume',  icon: '🏆', unlocked: false, progress: 0, category: 'volume' },
  { id: 'workouts_10',     name: 'Getting Serious', description: 'Complete 10 workouts',         icon: '💪', unlocked: false, progress: 0, category: 'milestone' },
  { id: 'workouts_50',     name: 'Dedicated Ninja', description: 'Complete 50 workouts',         icon: '🥷', unlocked: false, progress: 0, category: 'milestone' },
  { id: 'first_checkin',   name: 'Self Aware',      description: 'Complete your first check-in', icon: '📊', unlocked: false, progress: 0, category: 'milestone' },
  { id: 'score_50',        name: 'Fit Starter',     description: 'Reach a fitness score of 50',  icon: '⭐', unlocked: false, progress: 0, category: 'strength' },
  { id: 'score_80',        name: 'Elite Ninja',     description: 'Reach a fitness score of 80',  icon: '🌟', unlocked: false, progress: 0, category: 'strength' },
];

// ── TDEE + macro calculator ────────────────────────────────────────────────
export function calculateNutrition(user: UserProfile): { calories: number; proteinG: number } {
  // Mifflin-St Jeor BMR
  const bmr = user.gender === 'female'
    ? 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age - 161
    : 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age + 5;

  // Activity multiplier based on days/week
  const activityMap: Record<number, number> = { 1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.55, 6: 1.725 };
  const tdee = Math.round(bmr * (activityMap[user.daysPerWeek] ?? 1.375));

  // Adjust for goal
  const calorieAdjust: Record<FitnessGoal, number> = {
    muscle_gain: 300, fat_loss: -400, strength: 200, endurance: 100, general_fitness: 0,
  };
  let calories = tdee + (calorieAdjust[user.goal] ?? 0);

  // Health condition adjustments
  if (user.healthConditions.includes('thyroid'))        calories = Math.round(calories * 0.9);
  if (user.healthConditions.includes('diabetes'))       calories = Math.round(calories * 0.95);
  if (user.healthConditions.includes('post_pregnancy')) calories = Math.max(calories, 1800);
  if (user.healthConditions.includes('hypertension'))   calories = Math.round(calories * 0.97);

  // Protein: 1.6-2.2g per kg depending on goal
  const proteinMultiplier: Record<FitnessGoal, number> = {
    muscle_gain: 2.2, fat_loss: 2.0, strength: 2.0, endurance: 1.6, general_fitness: 1.8,
  };
  const proteinG = Math.round(user.weightKg * (proteinMultiplier[user.goal] ?? 1.8));

  return { calories, proteinG };
}

const defaultUser: UserProfile = {
  name: '', gender: '', age: 25, weightKg: 75, heightCm: 175,
  unit: 'metric', fitnessLevel: 'Beginner', goal: 'general_fitness',
  daysPerWeek: 3, workoutSplit: 'coach_decides',
  healthConditions: [], availableEquipment: ['barbell', 'dumbbell', 'bodyweight'],
  dailyCalorieTarget: 2000, proteinTargetG: 140, setupDone: false,
};

const initialState: FitNinjaState = {
  user: defaultUser, activePlan: null, workouts: [],
  checkins: [], photos: [], bodyweight: [], score: null, points: 0, streak: 0, badges: defaultBadges,
};

// ── Reducer ────────────────────────────────────────────────────────────────
function reducer(state: FitNinjaState, action: Action): FitNinjaState {
  switch (action.type) {
    case 'SET_USER': {
      const updated = { ...state.user, ...action.payload };
      const { calories, proteinG } = calculateNutrition(updated);
      return {
        ...state,
        user: { ...updated, dailyCalorieTarget: calories, proteinTargetG: proteinG },
      };
    }
    case 'SET_PLAN':    return { ...state, activePlan: action.payload };
    case 'CLEAR_PLAN':  return { ...state, activePlan: null };
    case 'ADVANCE_WEEK':
      return state.activePlan
        ? { ...state, activePlan: { ...state.activePlan, weekNumber: state.activePlan.weekNumber + 1 } }
        : state;
    case 'CHANGE_SPLIT':
      return state.activePlan
        ? { ...state, activePlan: { ...state.activePlan, split: action.payload } }
        : state;
    case 'ADD_WORKOUT':
      return { ...state, workouts: [action.payload, ...state.workouts] };
    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.payload) };
    case 'ADD_CHECKIN': {
      const chk = action.payload;
      const d = chk.date || new Date().toISOString().slice(0, 10);
      const w = chk.weightKg;
      const filteredBw = (state.bodyweight || []).filter(b => b.d !== d);
      const newBw = [...filteredBw, { d, w, t: Date.now() }].sort((a, b) => (a.t || 0) - (b.t || 0));

      const newPhotos = [...(state.photos || [])];
      if (chk.photos && chk.photos.length > 0) {
        chk.photos.forEach((url, i) => {
          newPhotos.unshift({
            id: 'photo_' + Date.now() + '_' + i,
            date: d,
            photoUrl: url,
            weight: w,
            angle: i === 0 ? 'front' : i === 1 ? 'side' : 'back',
          });
        });
      }

      return {
        ...state,
        checkins: [chk, ...state.checkins],
        bodyweight: newBw,
        photos: newPhotos,
        user: { ...state.user, weightKg: w },
      };
    }
    case 'ADD_PHOTO':
      return { ...state, photos: [action.payload, ...(state.photos || [])] };
    case 'DELETE_PHOTO':
      return { ...state, photos: (state.photos || []).filter(p => p.id !== action.payload) };
    case 'LOG_BODYWEIGHT': {
      const d = action.payload.date || new Date().toISOString().slice(0, 10);
      const w = action.payload.weight;
      const filtered = (state.bodyweight || []).filter(b => b.d !== d);
      return {
        ...state,
        user: { ...state.user, weightKg: w },
        bodyweight: [...filtered, { d, w, t: Date.now() }].sort((a, b) => (a.t || 0) - (b.t || 0)),
      };
    }
    case 'ADD_EXERCISE_TO_PLAN': {
      if (!state.activePlan) return state;
      const currentDayIndex = (() => {
        if (typeof action.payload.dayIndex === 'number') return action.payload.dayIndex;
        const d = new Date().getDay();
        return d === 0 ? 6 : d - 1;
      })();
      const updatedDays = state.activePlan.days.map((day, idx) => {
        if (idx !== currentDayIndex) return day;
        return {
          ...day,
          isRestDay: false,
          exercises: [...day.exercises, action.payload.exercise],
        };
      });
      return {
        ...state,
        activePlan: {
          ...state.activePlan,
          days: updatedDays,
        },
      };
    }
    case 'SET_SCORE':   return { ...state, score: action.payload };
    case 'ADD_POINTS':  return { ...state, points: state.points + action.payload };
    case 'SET_STREAK':  return { ...state, streak: action.payload };
    case 'UNLOCK_BADGE':
      return { ...state, badges: state.badges.map(b => b.id === action.payload ? { ...b, unlocked: true, progress: 100 } : b) };
    case 'UPDATE_BADGE_PROGRESS':
      return { ...state, badges: state.badges.map(b => b.id === action.payload.id ? { ...b, progress: action.payload.progress } : b) };
    case 'RESET':
      return { ...initialState, badges: defaultBadges };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────
interface FitNinjaContextValue {
  state: FitNinjaState;
  dispatch: React.Dispatch<Action>;
  totalVolume: number;
  todaysPlan: PlannedDay | null;
}

const FitNinjaContext = createContext<FitNinjaContextValue | null>(null);
const STORAGE_KEY = 'fitninja_v2';

export function FitNinjaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedIds = new Set(parsed.badges?.map((b: Badge) => b.id) ?? []);
        const mergedBadges = [...(parsed.badges ?? []), ...defaultBadges.filter(b => !storedIds.has(b.id))];
        // Recalculate nutrition on load (in case formulas changed)
        const user = { ...init.user, ...parsed.user };
        const { calories, proteinG } = calculateNutrition(user);
        user.dailyCalorieTarget = calories;
        user.proteinTargetG = proteinG;
        return { ...init, ...parsed, user, badges: mergedBadges };
      }
    } catch (_) {}
    return init;
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  // Auto streak
  useEffect(() => {
    if (state.workouts.length === 0) return;
    const today = new Date();
    let streak = 0;
    const sorted = [...state.workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const checked = new Set<string>();
    for (const w of sorted) {
      const d = new Date(w.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (checked.has(key)) continue;
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff === streak) { streak++; checked.add(key); } else break;
    }
    if (streak !== state.streak) dispatch({ type: 'SET_STREAK', payload: streak });
  }, [state.workouts]);

  // Auto-unlock badges
  useEffect(() => {
    const w = state.workouts.length;
    if (w >= 1  && !state.badges.find(b => b.id === 'first_workout')?.unlocked)  dispatch({ type: 'UNLOCK_BADGE', payload: 'first_workout' });
    if (w >= 10 && !state.badges.find(b => b.id === 'workouts_10')?.unlocked)    dispatch({ type: 'UNLOCK_BADGE', payload: 'workouts_10' });
    if (w >= 50 && !state.badges.find(b => b.id === 'workouts_50')?.unlocked)    dispatch({ type: 'UNLOCK_BADGE', payload: 'workouts_50' });
    if (state.checkins.length >= 1 && !state.badges.find(b => b.id === 'first_checkin')?.unlocked) dispatch({ type: 'UNLOCK_BADGE', payload: 'first_checkin' });
  }, [state.workouts.length, state.checkins.length]);

  const totalVolume = state.workouts.reduce((s, w) => s + w.totalVolumeKg, 0);

  // Determine today's planned workout
  const todaysPlan: PlannedDay | null = (() => {
    if (!state.activePlan) return null;
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
    // Map to Mon-Sun (0=Mon, 6=Sun)
    const mapped = dayIndex === 0 ? 6 : dayIndex - 1;
    return state.activePlan.days[mapped] ?? null;
  })();

  return (
    <FitNinjaContext.Provider value={{ state, dispatch, totalVolume, todaysPlan }}>
      {children}
    </FitNinjaContext.Provider>
  );
}

export function useFitNinja() {
  const ctx = useContext(FitNinjaContext);
  if (!ctx) throw new Error('useFitNinja must be used inside FitNinjaProvider');
  return ctx;
}
