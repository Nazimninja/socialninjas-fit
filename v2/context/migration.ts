import { createClient } from '@supabase/supabase-js';
import type {
  FitNinjaState,
  UserProfile,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WeeklyCheckin,
  PhysiquePhoto,
  BodyweightEntry,
  ActivePlan,
  PlannedDay,
  PlannedExercise,
  WorkoutSplit,
  FitnessGoal
} from './FitNinjaContext';

const SUPABASE_URL = 'https://mocqyvmntemsnmdusjcy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMwMzAsImV4cCI6MjEwMDQ2OTAzMH0.qt4ty1tjGeXMthhSaDZZo80u_JdPK4klUg3QAIhN0nw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const OLD_STORAGE_KEY = 'gym_state_v1';
export const NEW_STORAGE_KEY = 'fitninja_v2';

/**
 * Normalizes goal string from old app to new brain type
 */
function normalizeGoal(goal?: string): FitnessGoal {
  if (!goal) return 'general_fitness';
  const g = goal.toLowerCase();
  if (g.includes('muscle') || g.includes('hypertrophy') || g.includes('bulk')) return 'muscle_gain';
  if (g.includes('fat') || g.includes('loss') || g.includes('cut') || g.includes('lean')) return 'fat_loss';
  if (g.includes('strength') || g.includes('power')) return 'strength';
  if (g.includes('endurance') || g.includes('stamina')) return 'endurance';
  return 'general_fitness';
}

/**
 * Normalizes split string from old app
 */
function normalizeSplit(split?: string, days = 4): WorkoutSplit {
  if (!split) {
    if (days >= 6) return 'push_pull_legs';
    if (days >= 4) return 'upper_lower';
    return 'full_body';
  }
  const s = split.toLowerCase();
  if (s.includes('ppl') || s.includes('push')) return 'push_pull_legs';
  if (s.includes('upper') || s.includes('lower')) return 'upper_lower';
  if (s.includes('full')) return 'full_body';
  if (s.includes('bro') || s.includes('bodypart')) return 'bro_split';
  return 'coach_decides';
}

/**
 * Migrates old gym_state_v1 object to the new FitNinjaState schema
 */
export function migrateOldGymState(oldState: any, baseState: FitNinjaState): FitNinjaState {
  if (!oldState || typeof oldState !== 'object') return baseState;

  const answers = oldState.aiAnswers || {};
  const hasPriorActivity = (oldState.workouts?.length > 0) ||
                           (oldState.bodyweight?.length > 0) ||
                           (oldState.checkins?.length > 0) ||
                           Boolean(oldState.onboarded) ||
                           Boolean(oldState.aiPlan);

  // 1. Profile Migration
  const weightKg = Number(
    (oldState.bodyweight && oldState.bodyweight.length > 0
      ? oldState.bodyweight[oldState.bodyweight.length - 1].w
      : answers.weight) || 75
  );

  const migratedUser: UserProfile = {
    name: answers.pname || answers.name || oldState.name || 'Athlete',
    gender: (answers.gender === 'female' || oldState.body === 'female') ? 'female' : 'male',
    age: Number(answers.age || 26),
    weightKg: weightKg > 0 ? weightKg : 75,
    heightCm: Number(answers.height || 175),
    unit: oldState.unit === 'lbs' ? 'imperial' : 'metric',
    fitnessLevel: (answers.experience === 'advanced' ? 'Advanced' : answers.experience === 'intermediate' ? 'Intermediate' : 'Beginner'),
    goal: normalizeGoal(answers.goal || oldState.goal),
    daysPerWeek: Number(answers.days || 4),
    workoutSplit: normalizeSplit(answers.split, Number(answers.days || 4)),
    healthConditions: Array.isArray(answers.healthIssues) ? answers.healthIssues : [],
    availableEquipment: answers.location === 'home' ? ['dumbbell', 'bodyweight', 'resistance_bands'] : ['barbell', 'dumbbell', 'bodyweight', 'cables', 'machines'],
    dailyCalorieTarget: Number(oldState.targetCalories || oldState.aiPlan?.kcal || 2200),
    proteinTargetG: Number(oldState.targetProtein || oldState.aiPlan?.protein || 150),
    setupDone: Boolean(oldState.onboarded || hasPriorActivity),
  };

  // 2. Workouts Migration
  const migratedWorkouts: Workout[] = (oldState.workouts || []).map((w: any, idx: number) => {
    let totalVolumeKg = 0;
    const exercises: WorkoutExercise[] = (w.entries || []).map((entry: any, eIdx: number) => {
      const sets: WorkoutSet[] = (entry.sets || []).map((s: any, sIdx: number) => {
        const weight = Number(s.w ?? s.weight ?? s.weightKg ?? 0);
        const reps = Number(s.r ?? s.reps ?? 0);
        const completed = s.done !== undefined ? Boolean(s.done) : (s.completed !== undefined ? Boolean(s.completed) : true);
        if (completed && weight > 0 && reps > 0) {
          totalVolumeKg += (weight * reps);
        }
        return {
          id: s.id || `s_${idx}_${eIdx}_${sIdx}`,
          reps,
          weightKg: weight,
          completed,
        };
      });

      return {
        id: entry.id || `ex_${idx}_${eIdx}`,
        name: entry.name || entry.n || entry.id || 'Exercise',
        muscleGroup: entry.muscleGroup || entry.muscle || 'General',
        sets,
        restSeconds: entry.restSec || 90,
        notes: entry.notes || '',
      };
    });

    const durationSec = Number(w.dur || w.durationSeconds || (w.durationMinutes ? w.durationMinutes * 60 : 2700));

    return {
      id: w.id || `workout_migrated_${idx}_${w.d || Date.now()}`,
      name: w.name || 'Workout Session',
      date: w.d || w.date || new Date().toISOString().slice(0, 10),
      durationSeconds: durationSec,
      exercises,
      totalVolumeKg: w.totalVolumeKg || totalVolumeKg,
      pointsEarned: w.pointsEarned || 50,
      planDayIndex: w.planDayIndex,
    };
  });

  // 3. Bodyweight Entries Migration
  const migratedBodyweight: BodyweightEntry[] = (oldState.bodyweight || []).map((b: any) => ({
    d: b.d || new Date().toISOString().slice(0, 10),
    w: Number(b.w || 0),
    t: b.t || Date.now(),
  })).sort((a: BodyweightEntry, b: BodyweightEntry) => (a.t || 0) - (b.t || 0));

  // 4. Physique Photos Migration
  const migratedPhotos: PhysiquePhoto[] = (oldState.photos || []).map((p: any, idx: number) => ({
    id: p.id || `photo_migrated_${idx}`,
    date: p.date || p.d || new Date().toISOString().slice(0, 10),
    photoUrl: p.photoUrl || p.url || '',
    weight: Number(p.weight || p.w || weightKg),
    angle: p.label?.toLowerCase() || p.angle || (idx % 3 === 0 ? 'front' : idx % 3 === 1 ? 'side' : 'back'),
  }));

  // 5. Checkins Migration
  const migratedCheckins: WeeklyCheckin[] = (oldState.checkins || []).map((c: any, idx: number) => ({
    id: c.id || `checkin_migrated_${idx}`,
    date: c.date || c.d || new Date().toISOString().slice(0, 10),
    weekNumber: c.weekNumber || (idx + 1),
    weightKg: Number(c.weight || c.weightKg || weightKg),
    energyLevel: c.energyLevel || 4,
    sleepHours: c.sleepHours || 7,
    hungerLevel: c.hungerLevel || 3,
    workoutsCompleted: c.workoutsCompleted || 4,
    notes: c.notes || '',
    difficulty: c.difficulty || 'good',
    soreness: c.soreness || 'mild',
    dietRating: c.dietRating || 'on_track',
    photos: c.photos || [],
    adjustedCalories: Number(c.adjustedCalories || oldState.targetCalories || 2200),
    adjustedProteinG: Number(c.adjustedProteinG || oldState.targetProtein || 150),
    splitChanged: c.splitChanged,
    aiInsight: c.aiInsight || 'Check-in recorded and synchronized from previous training cycle.',
  }));

  // 6. Active Plan Generation from Routines or AI Plan
  let migratedPlan: ActivePlan | null = null;
  if (oldState.routines && oldState.routines.length > 0) {
    const days: PlannedDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, dIdx) => {
      const routine = oldState.routines[dIdx % oldState.routines.length];
      const isRest = dIdx >= migratedUser.daysPerWeek;
      if (isRest || !routine) {
        return {
          dayName,
          focus: 'Rest & Recovery',
          isRest: true,
          exercises: [],
          estimatedDurationMins: 0,
          estimatedCalories: 0,
        };
      }
      const exercises: PlannedExercise[] = (routine.ex || []).map((e: any) => ({
        name: e.name || e.id || 'Exercise',
        muscleGroup: routine.name || 'Muscle Group',
        sets: Number(e.sets || 3),
        reps: String(e.reps || '8-12'),
        restSeconds: 90,
        notes: e.notes || '',
      }));
      return {
        dayName,
        focus: routine.name || `${dayName} Session`,
        isRest: false,
        exercises,
        estimatedDurationMins: 45,
        estimatedCalories: 350,
      };
    });

    migratedPlan = {
      id: `plan_${Date.now()}`,
      title: `${migratedUser.name}'s Custom Split`,
      summary: `Automated migration from previous training routines (${migratedUser.daysPerWeek} days/week).`,
      split: migratedUser.workoutSplit,
      durationWeeks: 8,
      days,
      progressionTips: [
        'Aim for progressive overload on your main compound sets each week.',
        'Prioritize 1-2 RIR (reps in reserve) for optimal hypertrophy and fatigue management.'
      ],
      nutritionTip: `Maintain ~${migratedUser.dailyCalorieTarget} kcal and ${migratedUser.proteinTargetG}g protein daily.`,
      generatedAt: new Date().toISOString(),
      weekNumber: 1,
    };
  }

  return {
    ...baseState,
    user: migratedUser,
    workouts: migratedWorkouts.length > 0 ? migratedWorkouts : baseState.workouts,
    bodyweight: migratedBodyweight.length > 0 ? migratedBodyweight : baseState.bodyweight,
    photos: migratedPhotos.length > 0 ? migratedPhotos : baseState.photos,
    checkins: migratedCheckins.length > 0 ? migratedCheckins : baseState.checkins,
    activePlan: migratedPlan || baseState.activePlan,
    streak: Math.min(migratedWorkouts.length, 7),
  };
}

/**
 * Synchronizes FitNinja state back to gym_state_v1 so old legacy builds can read new logs
 */
export function mirrorToOldGymState(state: FitNinjaState): void {
  try {
    let existingOld: any = {};
    try {
      const raw = localStorage.getItem(OLD_STORAGE_KEY);
      if (raw) existingOld = JSON.parse(raw);
    } catch (_) {}

    const oldWorkouts = (state.workouts || []).map(w => ({
      id: w.id,
      name: w.name,
      d: w.date,
      dur: w.durationSeconds,
      entries: (w.exercises || []).map(e => ({
        id: e.id,
        name: e.name,
        sets: (e.sets || []).map(s => ({
          w: s.weightKg,
          r: s.reps,
          done: s.completed,
        })),
      })),
    }));

    const oldPhotos = (state.photos || []).map(p => ({
      id: p.id,
      date: p.date,
      photoUrl: p.photoUrl,
      weight: p.weight,
      label: p.angle,
    }));

    const oldCheckins = (state.checkins || []).map(c => ({
      id: c.id,
      date: c.date,
      weight: c.weightKg,
      difficulty: c.difficulty,
      soreness: c.soreness,
      dietRating: c.dietRating,
      notes: c.notes,
      photos: c.photos,
    }));

    const synced = {
      ...existingOld,
      onboarded: state.user.setupDone,
      targetCalories: state.user.dailyCalorieTarget,
      targetProtein: state.user.proteinTargetG,
      bodyweight: state.bodyweight,
      workouts: oldWorkouts,
      photos: oldPhotos,
      checkins: oldCheckins,
      _ts: Date.now(),
    };

    localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(synced));
  } catch (err) {
    console.warn('Failed to mirror to gym_state_v1:', err);
  }
}

/**
 * Get active user email from multiple auth storage locations
 */
export function getActiveUserEmail(): string | null {
  try {
    const fnEmail = localStorage.getItem('fitninja_user_email');
    if (fnEmail && fnEmail.includes('@')) return fnEmail.trim().toLowerCase();

    const paidEmail = localStorage.getItem('gym_paid_email');
    if (paidEmail && paidEmail.includes('@')) return paidEmail.trim().toLowerCase();

    const u = JSON.parse(localStorage.getItem('gym_user') || 'null');
    if (u?.email && u.email.includes('@')) return u.email.trim().toLowerCase();
  } catch (_) {}
  return null;
}

/**
 * Pull state from Supabase scripts storage
 */
export async function pullCloudState(email: string): Promise<any | null> {
  if (!email) return null;
  try {
    const { data: rows, error } = await supabase
      .from('scripts')
      .select('section1')
      .eq('profile', 'fitninja_user_state')
      .eq('topic', email.toLowerCase())
      .limit(1);

    if (error || !rows || rows.length === 0 || !rows[0].section1) return null;
    return JSON.parse(rows[0].section1);
  } catch (e) {
    console.warn('Cloud state pull error:', e);
    return null;
  }
}

/**
 * Push state to Supabase scripts table
 */
export async function pushCloudState(email: string, state: FitNinjaState): Promise<boolean> {
  if (!email) return false;
  try {
    const { data: existing } = await supabase
      .from('scripts')
      .select('id')
      .eq('profile', 'fitninja_user_state')
      .eq('topic', email.toLowerCase())
      .limit(1);

    const payload = {
      profile: 'fitninja_user_state',
      topic: email.toLowerCase(),
      section1: JSON.stringify(state),
      caption: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabase.from('scripts').update(payload).eq('id', existing[0].id);
    } else {
      await supabase.from('scripts').insert([payload]);
    }
    return true;
  } catch (e) {
    console.warn('Cloud state push error:', e);
    return false;
  }
}
