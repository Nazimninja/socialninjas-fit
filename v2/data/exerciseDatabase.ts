// ── Unified Exercise Database ──────────────────────────────────────────────
// Sources:
//   [1] hasaneyldrm/exercises-dataset   — detailed step instructions + media
//   [2] JahelCuadrado/ExerciseGymGifsDB — 1,323 exercises, GIF URLs, secondary muscles
//   [3] azilRababe/Exercises_Dataset    — descriptions, difficulty levels, equipment types
//
// This file defines:
//   1. The canonical ExerciseRecord type used throughout Fit Ninja
//   2. A fetcher that pulls live data from the CDN-hosted repos at runtime
//   3. A lightweight local seed (key exercises) so the app works offline
//   4. Helper utilities for OpenAI workout plan generation

// ── Canonical Type ────────────────────────────────────────────────────────
export interface ExerciseRecord {
  id: string;                    // slug, e.g. "biceps/barbell-curl"
  name: string;                  // "Barbell Curl"
  muscle: string;                // primary muscle (normalised, lowercase)
  muscleGroup: string;           // display group: "Biceps", "Back", etc.
  bodyPart: string;              // "upper arms", "legs", etc.
  equipment: string;             // "barbell", "dumbbell", "bodyweight", etc.
  category: string;              // "strength" | "cardio" | "flexibility" | "plyometrics"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  secondaryMuscles: string[];
  instructions: string[];        // ordered step-by-step
  description: string;           // 1–2 sentence description for AI context
  gifUrl: string;                // animated GIF URL (CDN)
  thumbUrl: string;              // thumbnail webp URL (CDN)
  // Workout plan metadata
  setsRange: [number, number];   // [min, max] suggested sets
  repsRange: [number, number];   // [min, max] suggested reps
  restSeconds: number;           // recommended rest between sets
  caloriesPerSet: number;        // approximate kcal burned per set (avg)
  sources?: string[];            // ['hasaneyldrm', 'JahelCuadrado', 'azilRababe']
}

// ── Muscle group normalisation map ────────────────────────────────────────
// Maps raw muscle names from all 3 repos → our canonical display group
export const MUSCLE_GROUP_MAP: Record<string, string> = {
  // Chest
  pectorals: 'Chest', pectoralis: 'Chest', chest: 'Chest',
  // Back
  lats: 'Back', 'upper-back': 'Back', 'upper back': 'Back',
  traps: 'Back', trapezius: 'Back', back: 'Back',
  'levator-scapulae': 'Back', rhomboids: 'Back', 'erector spinae': 'Back',
  spine: 'Back', 'middle back': 'Back', neck: 'Back',
  // Shoulders
  delts: 'Shoulders', deltoids: 'Shoulders', shoulders: 'Shoulders',
  'serratus-anterior': 'Shoulders', 'serratus anterior': 'Shoulders',
  // Biceps
  biceps: 'Biceps', 'bicep': 'Biceps', 'upper arms': 'Biceps',
  // Triceps
  triceps: 'Triceps', 'tricep': 'Triceps',
  // Forearms
  forearms: 'Forearms',
  // Core / Abs
  abs: 'Core', abdominals: 'Core', core: 'Core', obliques: 'Core',
  'lower back': 'Core', 'lower-back': 'Core', 'waist': 'Core',
  // Legs
  quads: 'Legs', quadriceps: 'Legs', hamstrings: 'Legs',
  calves: 'Legs', glutes: 'Legs', 'hip flexors': 'Legs',
  abductors: 'Legs', adductors: 'Legs', legs: 'Legs', ankles: 'Legs',
  // Cardio
  cardio: 'Cardio', 'full-body': 'Cardio', 'full body': 'Cardio',
};

export function normaliseMuscleGroup(raw: string): string {
  const key = raw.toLowerCase().trim();
  return MUSCLE_GROUP_MAP[key] ?? raw.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ── Sets/Reps/Rest defaults by category ──────────────────────────────────
function defaultSetsRepsRest(category: string, difficulty: string): Pick<ExerciseRecord, 'setsRange' | 'repsRange' | 'restSeconds' | 'caloriesPerSet'> {
  const d = difficulty.toLowerCase();
  if (category === 'cardio') {
    return { setsRange: [1, 3], repsRange: [10, 20], restSeconds: 30, caloriesPerSet: 15 };
  }
  if (category === 'flexibility' || category === 'stretching') {
    return { setsRange: [2, 3], repsRange: [30, 60], restSeconds: 20, caloriesPerSet: 3 };
  }
  if (category === 'plyometrics') {
    return { setsRange: [3, 4], repsRange: [8, 12], restSeconds: 90, caloriesPerSet: 12 };
  }
  // strength
  if (d === 'beginner')     return { setsRange: [2, 3], repsRange: [10, 15], restSeconds: 60,  caloriesPerSet: 6 };
  if (d === 'advanced')     return { setsRange: [4, 5], repsRange: [4, 8],   restSeconds: 120, caloriesPerSet: 10 };
  return                           { setsRange: [3, 4], repsRange: [8, 12],  restSeconds: 90,  caloriesPerSet: 8 };
}

// ── Runtime Unified Master Database Fetcher ──────────────────────────────
// Pulls from /data/exercises_master.json (compiled from all 3 repos: 4,106 exercises)
const MASTER_JSON_URL = '/data/exercises_master.json';
const REPO2_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main';
const REPO3_FITNESS_URL = 'https://raw.githubusercontent.com/azilRababe/Exercises_Dataset/main/fitness_data.json';
const REPO3_GIFS_URL    = 'https://raw.githubusercontent.com/azilRababe/Exercises_Dataset/main/gifs_data.json';

let _cachedExercises: ExerciseRecord[] | null = null;
let _cachePromise: Promise<ExerciseRecord[]> | null = null;

export async function fetchAllExercises(): Promise<ExerciseRecord[]> {
  if (_cachedExercises) return _cachedExercises;
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    try {
      // 1. Try local master JSON (4,106 consolidated exercises)
      const res = await fetch(MASTER_JSON_URL);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          _cachedExercises = data as ExerciseRecord[];
          return _cachedExercises;
        }
      }
    } catch {
      // Continue to fallbacks if offline or path unavailable
    }

    try {
      // 2. Secondary fallback: Fetch Repo 2 + Repo 3 direct CDNs
      const [r2res, r3fitRes, r3gifRes] = await Promise.allSettled([
        fetch(`${REPO2_BASE}/api/en/exercises.json`).then(r => r.json()),
        fetch(REPO3_FITNESS_URL).then(r => r.json()),
        fetch(REPO3_GIFS_URL).then(r => r.json()),
      ]);

      const r3DescMap: Record<string, { description: string; difficulty: string }> = {};
      if (r3fitRes.status === 'fulfilled') {
        for (const item of r3fitRes.value as any[]) {
          const key = (item.title || '').toLowerCase().trim();
          r3DescMap[key] = { description: item.description || '', difficulty: item.difficulty_level || 'Intermediate' };
        }
      }

      const r3GifMap: Record<string, string> = {};
      if (r3gifRes.status === 'fulfilled') {
        for (const item of r3gifRes.value as any[]) {
          const key = (item.title || '').toLowerCase().trim();
          r3GifMap[key] = item.gif_url || '';
        }
      }

      const r2data = r2res.status === 'fulfilled' ? r2res.value : { exercises: [] };
      const exercises: ExerciseRecord[] = (r2data.exercises as any[]).map((ex: any) => {
        const nameKey = (ex.name || '').toLowerCase().trim();
        const r3: { description?: string; difficulty?: string } = r3DescMap[nameKey] || {};
        const difficulty = (r3.difficulty as ExerciseRecord['difficulty']) || 'Intermediate';
        const gifFallback = r3GifMap[nameKey] || '';
        const defaults = defaultSetsRepsRest(ex.category || 'strength', difficulty);

        return {
          id:               ex.id || ex.slug,
          name:             ex.name,
          muscle:           (ex.muscle || '').toLowerCase(),
          muscleGroup:      normaliseMuscleGroup(ex.muscle || ex.bodyPart || ''),
          bodyPart:         ex.bodyPart || '',
          equipment:        ex.equipment || 'bodyweight',
          category:         ex.category || 'strength',
          difficulty,
          secondaryMuscles: (ex.secondaryMuscles || []).map((m: string) => normaliseMuscleGroup(m)),
          instructions:     ex.instructions || [],
          description:      r3.description || `${ex.name} — targets the ${ex.muscle || ex.bodyPart}.`,
          gifUrl:           ex.gifUrl || gifFallback,
          thumbUrl:         ex.thumbUrl || '',
          ...defaults,
        } satisfies ExerciseRecord;
      });

      _cachedExercises = exercises;
      return exercises;
    } catch (e) {
      console.warn('[FitNinja] Live exercise fetch failed, using local seed:', e);
      _cachedExercises = LOCAL_EXERCISE_SEED;
      return LOCAL_EXERCISE_SEED;
    }
  })();

  return _cachePromise;
}

// ── Search + Filter helpers ───────────────────────────────────────────────
export function searchExercises(
  exercises: ExerciseRecord[],
  query: string,
  filters: {
    muscleGroup?: string;
    equipment?: string;
    difficulty?: string;
    category?: string;
    hasGifOnly?: boolean;
  } = {}
): ExerciseRecord[] {
  const q = query.toLowerCase().trim();
  const results = exercises.filter(ex => {
    if (q && !ex.name.toLowerCase().includes(q) && !ex.muscleGroup.toLowerCase().includes(q) && !ex.equipment.toLowerCase().includes(q)) return false;
    if (filters.muscleGroup && filters.muscleGroup !== 'All' && ex.muscleGroup !== filters.muscleGroup) return false;
    if (filters.equipment && filters.equipment !== 'All' && ex.equipment !== filters.equipment.toLowerCase()) return false;
    if (filters.difficulty && filters.difficulty !== 'All' && ex.difficulty !== filters.difficulty) return false;
    if (filters.category && filters.category !== 'All' && ex.category !== filters.category.toLowerCase()) return false;
    if (filters.hasGifOnly && !ex.gifUrl) return false;
    return true;
  });

  return results.sort((a, b) => {
    if (q) {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aExact = aName === q;
      const bExact = bName === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }
    // Always prioritize movements that have animated GIFs
    if (a.gifUrl && !b.gifUrl) return -1;
    if (!a.gifUrl && b.gifUrl) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── OpenAI workout plan context builder ───────────────────────────────────
// Compresses exercise data into a token-efficient format for AI prompts
export function buildExerciseContextForAI(
  exercises: ExerciseRecord[],
  options: {
    muscleGroups?: string[];   // focus areas
    maxPerGroup?: number;      // cap per group (default 8)
    includeInstructions?: boolean;
  } = {}
): string {
  const { muscleGroups, maxPerGroup = 8, includeInstructions = false } = options;

  // Group by muscle
  const grouped: Record<string, ExerciseRecord[]> = {};
  for (const ex of exercises) {
    const g = ex.muscleGroup;
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ex);
  }

  const sections: string[] = [];
  const targetGroups = muscleGroups && muscleGroups.length > 0
    ? muscleGroups
    : Object.keys(grouped);

  for (const group of targetGroups) {
    const list = (grouped[group] || []).slice(0, maxPerGroup);
    if (list.length === 0) continue;

    const lines = list.map(ex => {
      const base = `- ${ex.name} [${ex.equipment}] | ${ex.difficulty} | ${ex.setsRange[0]}-${ex.setsRange[1]} sets × ${ex.repsRange[0]}-${ex.repsRange[1]} reps | rest ${ex.restSeconds}s | ~${ex.caloriesPerSet} kcal/set`;
      if (includeInstructions && ex.instructions.length > 0) {
        return base + `\n  How: ${ex.instructions.slice(0, 2).join(' ')}`;
      }
      return base;
    });

    sections.push(`## ${group}\n${lines.join('\n')}`);
  }

  return sections.join('\n\n');
}

// ── Equipment list (from Repo 2) ──────────────────────────────────────────
export const EQUIPMENT_LIST = [
  'All', 'barbell', 'dumbbell', 'bodyweight', 'band',
  'cable', 'lever', 'smith machine', 'kettlebell',
  'medicine ball', 'trx', 'ez bar',
];

export const DIFFICULTY_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export const MUSCLE_GROUPS_LIST = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Forearms', 'Core', 'Legs', 'Cardio',
];

// ── Local seed — top exercises per group (offline fallback) ───────────────
// These are always available even if the fetch fails
export const LOCAL_EXERCISE_SEED: ExerciseRecord[] = [
  // CHEST
  {
    id: 'pectorals/barbell-bench-press',
    name: 'Barbell Bench Press', muscle: 'pectorals', muscleGroup: 'Chest',
    bodyPart: 'chest', equipment: 'barbell', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    instructions: ['Lie flat on bench', 'Grip bar slightly wider than shoulder-width', 'Lower bar to chest', 'Press back up explosively'],
    description: 'The king of chest exercises. Builds mass and strength across the entire pectoral region.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.thumb.webp',
    setsRange: [3, 4], repsRange: [8, 12], restSeconds: 90, caloriesPerSet: 10,
  },
  {
    id: 'pectorals/push-up',
    name: 'Push Up', muscle: 'pectorals', muscleGroup: 'Chest',
    bodyPart: 'chest', equipment: 'bodyweight', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Triceps', 'Core'],
    instructions: ['Start in plank position', 'Lower chest to floor', 'Push back up keeping body straight'],
    description: 'Classic bodyweight chest exercise, great for beginners and warm-ups.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/push-up.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/push-up.thumb.webp',
    setsRange: [2, 4], repsRange: [10, 20], restSeconds: 60, caloriesPerSet: 6,
  },
  {
    id: 'pectorals/dumbbell-fly',
    name: 'Dumbbell Fly', muscle: 'pectorals', muscleGroup: 'Chest',
    bodyPart: 'chest', equipment: 'dumbbell', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Shoulders'],
    instructions: ['Lie on bench, hold dumbbells over chest', 'Open arms wide in arc', 'Bring back together with slight elbow bend'],
    description: 'Isolation exercise for the chest that provides a deep stretch.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-fly.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-fly.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 15], restSeconds: 60, caloriesPerSet: 7,
  },
  // BACK
  {
    id: 'lats/pull-up',
    name: 'Pull Up', muscle: 'lats', muscleGroup: 'Back',
    bodyPart: 'back', equipment: 'bodyweight', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Biceps', 'Core'],
    instructions: ['Hang from bar with overhand grip', 'Pull chest to bar', 'Lower with control'],
    description: 'The ultimate bodyweight back exercise targeting the lats and upper back.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/pull-up.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/pull-up.thumb.webp',
    setsRange: [3, 4], repsRange: [6, 12], restSeconds: 90, caloriesPerSet: 9,
  },
  {
    id: 'lats/barbell-deadlift',
    name: 'Barbell Deadlift', muscle: 'lats', muscleGroup: 'Back',
    bodyPart: 'back', equipment: 'barbell', category: 'strength', difficulty: 'Advanced',
    secondaryMuscles: ['Legs', 'Core', 'Shoulders'],
    instructions: ['Stand over bar, hip-width stance', 'Hinge and grip bar', 'Drive hips forward as you stand', 'Lower with control'],
    description: 'The most powerful compound lift. Trains the entire posterior chain.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/barbell-deadlift.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/barbell-deadlift.thumb.webp',
    setsRange: [4, 5], repsRange: [3, 6], restSeconds: 120, caloriesPerSet: 12,
  },
  {
    id: 'lats/lat-pulldown',
    name: 'Lat Pulldown', muscle: 'lats', muscleGroup: 'Back',
    bodyPart: 'back', equipment: 'cable', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Biceps'],
    instructions: ['Sit at cable machine', 'Grip bar wider than shoulders', 'Pull bar to upper chest', 'Slowly return to start'],
    description: 'Machine-based lat exercise, great for beginners learning to pull movements.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/lat-pulldown.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/lat-pulldown.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 12], restSeconds: 90, caloriesPerSet: 8,
  },
  // SHOULDERS
  {
    id: 'delts/barbell-overhead-press',
    name: 'Barbell Overhead Press', muscle: 'delts', muscleGroup: 'Shoulders',
    bodyPart: 'shoulders', equipment: 'barbell', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Triceps', 'Core'],
    instructions: ['Stand with bar at shoulder height', 'Press bar overhead until arms locked', 'Lower with control'],
    description: 'The foundational shoulder strength exercise for building overhead pressing power.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/barbell-overhead-press.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/barbell-overhead-press.thumb.webp',
    setsRange: [3, 4], repsRange: [8, 10], restSeconds: 90, caloriesPerSet: 9,
  },
  {
    id: 'delts/dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise', muscle: 'delts', muscleGroup: 'Shoulders',
    bodyPart: 'shoulders', equipment: 'dumbbell', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: [],
    instructions: ['Stand holding dumbbells at sides', 'Raise arms to shoulder height', 'Lower slowly'],
    description: 'Key isolation exercise for building wider, rounder shoulders.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.thumb.webp',
    setsRange: [3, 4], repsRange: [12, 15], restSeconds: 60, caloriesPerSet: 5,
  },
  // BICEPS
  {
    id: 'biceps/barbell-curl',
    name: 'Barbell Curl', muscle: 'biceps', muscleGroup: 'Biceps',
    bodyPart: 'upper arms', equipment: 'barbell', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Forearms'],
    instructions: ['Stand holding barbell with underhand grip', 'Curl weight to shoulder height', 'Lower with control'],
    description: 'The classic bicep builder. Best compound curl for overall arm mass.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-curl.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-curl.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 12], restSeconds: 60, caloriesPerSet: 6,
  },
  {
    id: 'biceps/hammer-curl',
    name: 'Hammer Curl', muscle: 'biceps', muscleGroup: 'Biceps',
    bodyPart: 'upper arms', equipment: 'dumbbell', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Forearms'],
    instructions: ['Hold dumbbells with neutral grip', 'Curl up keeping thumbs facing up', 'Lower slowly'],
    description: 'Targets the brachialis and brachioradialis for arm thickness.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/hammer-curl.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/hammer-curl.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 12], restSeconds: 60, caloriesPerSet: 6,
  },
  // TRICEPS
  {
    id: 'triceps/triceps-pushdown',
    name: 'Triceps Pushdown', muscle: 'triceps', muscleGroup: 'Triceps',
    bodyPart: 'upper arms', equipment: 'cable', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: [],
    instructions: ['Stand at cable machine', 'Grip bar with overhand grip at chest height', 'Push down until arms straight', 'Return controlled'],
    description: 'Best cable exercise for building tricep mass and definition.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/triceps-pushdown.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/triceps-pushdown.thumb.webp',
    setsRange: [3, 4], repsRange: [12, 15], restSeconds: 60, caloriesPerSet: 6,
  },
  // LEGS
  {
    id: 'quads/barbell-squat',
    name: 'Barbell Squat', muscle: 'quads', muscleGroup: 'Legs',
    bodyPart: 'legs', equipment: 'barbell', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Legs', 'Core', 'Back'],
    instructions: ['Position bar across upper back', 'Squat down until thighs parallel', 'Drive up through heels'],
    description: 'The king of leg exercises. Builds total lower body strength and mass.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/barbell-squat.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/barbell-squat.thumb.webp',
    setsRange: [4, 5], repsRange: [5, 8], restSeconds: 120, caloriesPerSet: 12,
  },
  {
    id: 'quads/leg-press',
    name: 'Leg Press', muscle: 'quads', muscleGroup: 'Legs',
    bodyPart: 'legs', equipment: 'lever', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Legs'],
    instructions: ['Sit in machine, feet shoulder-width on platform', 'Push platform away until legs nearly straight', 'Lower with control'],
    description: 'Machine-based compound leg exercise, safer for beginners or those with back issues.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/leg-press.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/leg-press.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 15], restSeconds: 90, caloriesPerSet: 10,
  },
  {
    id: 'hamstrings/romanian-deadlift',
    name: 'Romanian Deadlift', muscle: 'hamstrings', muscleGroup: 'Legs',
    bodyPart: 'legs', equipment: 'barbell', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Back', 'Legs'],
    instructions: ['Hold barbell at hip height', 'Hinge at hips, lowering bar along legs', 'Feel hamstring stretch', 'Drive hips forward to stand'],
    description: 'Top exercise for hamstring and glute development with great carryover to deadlifts.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/hamstrings/romanian-deadlift.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/hamstrings/romanian-deadlift.thumb.webp',
    setsRange: [3, 4], repsRange: [8, 12], restSeconds: 90, caloriesPerSet: 10,
  },
  // CORE
  {
    id: 'abs/plank',
    name: 'Plank', muscle: 'abs', muscleGroup: 'Core',
    bodyPart: 'waist', equipment: 'bodyweight', category: 'strength', difficulty: 'Beginner',
    secondaryMuscles: ['Shoulders', 'Back'],
    instructions: ['Get into forearm position', 'Keep body in straight line', 'Hold for time, breathe steadily'],
    description: 'Foundational core stability exercise that builds total midsection strength.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/plank.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/plank.thumb.webp',
    setsRange: [3, 4], repsRange: [30, 60], restSeconds: 45, caloriesPerSet: 4,
  },
  {
    id: 'abs/hanging-leg-raise',
    name: 'Hanging Leg Raise', muscle: 'abs', muscleGroup: 'Core',
    bodyPart: 'waist', equipment: 'bodyweight', category: 'strength', difficulty: 'Intermediate',
    secondaryMuscles: ['Biceps'],
    instructions: ['Hang from pull-up bar', 'Raise legs to 90 degrees', 'Lower slowly without swinging'],
    description: 'Advanced core exercise targeting the lower abs and hip flexors.',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/hanging-leg-raise.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/hanging-leg-raise.thumb.webp',
    setsRange: [3, 4], repsRange: [10, 15], restSeconds: 60, caloriesPerSet: 7,
  },
  // CARDIO
  {
    id: 'cardio/jumping-jack',
    name: 'Jumping Jack', muscle: 'cardio', muscleGroup: 'Cardio',
    bodyPart: 'full body', equipment: 'bodyweight', category: 'cardio', difficulty: 'Beginner',
    secondaryMuscles: [],
    instructions: ['Stand with feet together', 'Jump feet out while raising arms overhead', 'Jump back to start'],
    description: 'Classic full-body cardio exercise for warm-ups and conditioning.',
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Jumping-Jacks.gif',
    thumbUrl: '',
    setsRange: [1, 3], repsRange: [20, 40], restSeconds: 30, caloriesPerSet: 10,
  },
];
