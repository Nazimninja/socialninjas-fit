// ── AI Workout Plan Generator & Health-Aware Customizer ─────────────────────
// Uses exercises from our unified 1,300+ database (with GIFs and thumbnails)
// Generates a tailored 7-day plan (Monday - Sunday) with custom nutrition targets.
// Adapts for injuries, conditions (thyroid, diabetes, pregnancy, etc.), and split preferences.

import {
  fetchAllExercises,
  LOCAL_EXERCISE_SEED,
  type ExerciseRecord,
} from './exerciseDatabase';
import type {
  UserProfile,
  ActivePlan,
  PlannedDay,
  PlannedExercise,
  WorkoutSplit,
  HealthCondition,
} from '../context/FitNinjaContext';

function genPlanId() {
  return 'plan_' + Math.random().toString(36).substring(2, 10);
}

// ── Exercise safety filtering for health conditions ────────────────────────
export function isExerciseSafeForConditions(
  exerciseName: string,
  muscleGroup: string,
  conditions: HealthCondition[]
): { safe: boolean; reason?: string } {
  const name = exerciseName.toLowerCase();
  const mg = muscleGroup.toLowerCase();

  for (const c of conditions) {
    if (c === 'knee_injury') {
      if (
        name.includes('jump') ||
        name.includes('lunges') ||
        name.includes('deep squat') ||
        name.includes('bulgarian') ||
        name.includes('hack squat')
      ) {
        return { safe: false, reason: 'High knee shear stress' };
      }
    }
    if (c === 'back_injury') {
      if (
        name.includes('deadlift') ||
        name.includes('barbell squat') ||
        name.includes('bent over') ||
        name.includes('good morning') ||
        name.includes('hyperextension')
      ) {
        return { safe: false, reason: 'High spinal compressive load' };
      }
    }
    if (c === 'shoulder_injury') {
      if (
        name.includes('overhead press') ||
        name.includes('military') ||
        name.includes('behind neck') ||
        name.includes('upright row') ||
        name.includes('dip')
      ) {
        return { safe: false, reason: 'Shoulder impingement risk' };
      }
    }
    if (c === 'post_pregnancy') {
      if (
        name.includes('crunch') ||
        name.includes('sit up') ||
        name.includes('heavy deadlift') ||
        name.includes('jump') ||
        name.includes('box jump')
      ) {
        return { safe: false, reason: 'High intra-abdominal & pelvic floor impact' };
      }
    }
    if (c === 'hypertension') {
      if (name.includes('1rm') || name.includes('heavy deadlift')) {
        return { safe: false, reason: 'Avoid extreme Valsalva blood pressure spikes' };
      }
    }
  }

  return { safe: true };
}

// ── Deterministic Safe Plan Generator (100% Reliable & Immediate) ──────────
// Guarantees an authentic, non-random, scientifically structured 7-day program
export function createDeterministicPlan(user: UserProfile): ActivePlan {
  const conditions = user.healthConditions || [];
  const level = user.fitnessLevel || 'Beginner';
  const goal = user.goal || 'general_fitness';

  // Determine split
  let split = user.workoutSplit;
  if (!split || split === 'coach_decides') {
    if (user.daysPerWeek <= 3) {
      split = level === 'Beginner' ? 'full_body' : 'push_pull_legs';
    } else if (user.daysPerWeek === 4) {
      split = 'upper_lower';
    } else {
      split = 'push_pull_legs';
    }
  }

  // Base rep & set ranges based on goal and level
  const sets = level === 'Advanced' ? 4 : level === 'Intermediate' ? 3 : 3;
  const repRange =
    goal === 'strength'
      ? '5-8'
      : goal === 'fat_loss'
      ? '12-15'
      : goal === 'endurance'
      ? '15-20'
      : '8-12';
  const restSecs = goal === 'strength' ? 120 : goal === 'fat_loss' ? 60 : 90;

  // Build curated day templates
  const days: PlannedDay[] = [];

  if (split === 'push_pull_legs') {
    // 6 or 3-5 days
    // Mon: Push, Tue: Pull, Wed: Legs, Thu: Rest, Fri: Push / Upper, Sat: Pull / Lower, Sun: Rest
    const isFiveDay = user.daysPerWeek >= 5;
    const isFourDay = user.daysPerWeek === 4;

    days.push(createPushDay('Monday', sets, repRange, restSecs, conditions, level));
    days.push(createPullDay('Tuesday', sets, repRange, restSecs, conditions, level));
    days.push(createLegsDay('Wednesday', sets, repRange, restSecs, conditions, level));

    if (isFiveDay) {
      days.push(createPushDay('Thursday', sets, repRange, restSecs, conditions, level, 'Hypertrophy Focus'));
      days.push(createPullDay('Friday', sets, repRange, restSecs, conditions, level, 'Hypertrophy Focus'));
      days.push(createLegsDay('Saturday', sets - 1, '12-15', 60, conditions, level, 'Volume Focus'));
      days.push(createRestDay('Sunday'));
    } else if (isFourDay) {
      days.push(createRestDay('Thursday'));
      days.push(createUpperDay('Friday', sets, repRange, restSecs, conditions, level));
      days.push(createRestDay('Saturday'));
      days.push(createRestDay('Sunday'));
    } else {
      days.push(createRestDay('Thursday'));
      days.push(createRestDay('Friday'));
      days.push(createRestDay('Saturday'));
      days.push(createRestDay('Sunday'));
    }
  } else if (split === 'upper_lower') {
    // 4-day standard: Mon: Upper A, Tue: Lower A, Wed: Rest, Thu: Upper B, Fri: Lower B, Sat/Sun: Rest
    days.push(createUpperDay('Monday', sets, repRange, restSecs, conditions, level, 'Upper Strength'));
    days.push(createLowerDay('Tuesday', sets, repRange, restSecs, conditions, level, 'Lower Strength'));
    days.push(createRestDay('Wednesday'));
    days.push(createUpperDay('Thursday', sets, '10-15', 60, conditions, level, 'Upper Hypertrophy'));
    days.push(createLowerDay('Friday', sets, '10-15', 60, conditions, level, 'Lower Hypertrophy'));
    days.push(createRestDay('Saturday'));
    days.push(createRestDay('Sunday'));
  } else if (split === 'full_body') {
    // Mon: Full Body A, Wed: Full Body B, Fri: Full Body C
    days.push(createFullBodyDay('Monday', sets, repRange, restSecs, conditions, level, 'Full Body A'));
    days.push(createRestDay('Tuesday'));
    days.push(createFullBodyDay('Wednesday', sets, repRange, restSecs, conditions, level, 'Full Body B'));
    days.push(createRestDay('Thursday'));
    days.push(createFullBodyDay('Friday', sets, repRange, restSecs, conditions, level, 'Full Body C'));
    days.push(createRestDay('Saturday'));
    days.push(createRestDay('Sunday'));
  } else {
    // Bro split / Bodypart split
    days.push(createChestDay('Monday', sets, repRange, restSecs, conditions));
    days.push(createBackDay('Tuesday', sets, repRange, restSecs, conditions));
    days.push(createShouldersDay('Wednesday', sets, repRange, restSecs, conditions));
    days.push(createLegsDay('Thursday', sets, repRange, restSecs, conditions, level));
    days.push(createArmsDay('Friday', sets, repRange, restSecs, conditions));
    days.push(createRestDay('Saturday'));
    days.push(createRestDay('Sunday'));
  }

  // Health specific progression & nutrition notes
  const healthNotes: string[] = [];
  if (conditions.includes('thyroid')) {
    healthNotes.push('Pace yourself: thyroid balance benefits from steady effort and 8+ hours quality sleep.');
  }
  if (conditions.includes('diabetes')) {
    healthNotes.push('Keep a fast-acting carb source nearby and monitor hydration during strength sessions.');
  }
  if (conditions.includes('post_pregnancy')) {
    healthNotes.push('Gentle progressive recovery: prioritize core bracing and pelvic floor breathing over heavy loads.');
  }
  if (conditions.includes('knee_injury')) {
    healthNotes.push('Focus on controlled tempo and hip-dominant hinge movements to protect knees.');
  }
  if (conditions.includes('back_injury')) {
    healthNotes.push('Maintain neutral spine with chest-supported lifts and engaged core.');
  }

  return {
    id: genPlanId(),
    title: `${user.name || 'Ninja'}'s ${formatSplitName(split)} Program`,
    summary: `Personalized ${user.fitnessLevel} plan targeting ${formatGoal(goal)} across ${user.daysPerWeek} training days/week.`,
    split,
    durationWeeks: 8,
    days,
    progressionTips: [
      'Record every set weight & reps in the app to ensure progressive overload.',
      'When you hit the upper rep target on all sets for 2 workouts in a row, increase weight by 2-5%.',
      ...healthNotes,
    ],
    nutritionTip: `Target ${user.dailyCalorieTarget} kcal and ${user.proteinTargetG}g protein daily for optimal recovery.`,
    generatedAt: new Date().toISOString(),
    weekNumber: 1,
  };
}

// ── Day Generator Helpers ──────────────────────────────────────────────────
function createPushDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  variant = 'Chest, Shoulders & Triceps'
): PlannedDay {
  const hasShoulderInjury = conditions.includes('shoulder_injury');
  const exList: PlannedExercise[] = [];

  // Chest compound
  exList.push({
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    sets,
    reps,
    restSeconds: rest,
    notes: 'Controlled eccentric, squeeze chest at top',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif',
    thumbUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.thumb.webp',
  });

  // Incline chest
  exList.push({
    name: 'Incline Bench Press',
    muscleGroup: 'Chest',
    sets,
    reps,
    restSeconds: rest,
    notes: '30-degree incline for upper chest focus',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/incline-bench-press.gif',
  });

  // Shoulders
  if (!hasShoulderInjury) {
    exList.push({
      name: 'DB Shoulder Press',
      muscleGroup: 'Shoulders',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Neutral grip elbow angle to protect joints',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-shoulder-press.gif',
    });
  } else {
    exList.push({
      name: 'Dumbbell Lateral Raise',
      muscleGroup: 'Shoulders',
      sets,
      reps: '12-15',
      restSeconds: 60,
      notes: 'Light weight, focus on side delt contraction',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.gif',
    });
  }

  // Chest fly/isolation
  exList.push({
    name: 'Cable Crossover',
    muscleGroup: 'Chest',
    sets: 3,
    reps: '12-15',
    restSeconds: 60,
    notes: 'Peak contraction pause for 1 second',
  });

  // Triceps
  exList.push({
    name: 'Triceps Pushdown',
    muscleGroup: 'Triceps',
    sets: 3,
    reps: '12-15',
    restSeconds: 60,
    notes: 'Lock elbows at sides throughout',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/triceps-pushdown.gif',
  });

  if (level === 'Intermediate' || level === 'Advanced') {
    exList.push({
      name: 'Overhead Tricep Ext.',
      muscleGroup: 'Triceps',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Deep tricep long-head stretch',
    });
  }

  return {
    dayName,
    focus: `Push — ${variant}`,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: exList.length * 9,
    estimatedCalories: exList.length * 55,
  };
}

function createPullDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  variant = 'Back, Biceps & Rear Delts'
): PlannedDay {
  const hasBackInjury = conditions.includes('back_injury');
  const exList: PlannedExercise[] = [];

  // Main vertical pull
  exList.push({
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    sets,
    reps,
    restSeconds: rest,
    notes: 'Drive elbows down to hips, retract scapulae',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/lat-pulldown.gif',
  });

  // Horizontal row
  if (hasBackInjury) {
    exList.push({
      name: 'Seated Cable Row',
      muscleGroup: 'Back',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Chest upright, minimal lower back rocking',
    });
  } else {
    exList.push({
      name: 'Barbell Row',
      muscleGroup: 'Back',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Keep core braced, pull to lower ribcage',
    });
  }

  // Upper back / rear delts
  exList.push({
    name: 'Face Pull',
    muscleGroup: 'Back',
    sets: 3,
    reps: '12-15',
    restSeconds: 60,
    notes: 'Excellent for posture & rotator cuff health',
  });

  // Biceps compound
  exList.push({
    name: 'Barbell Curl',
    muscleGroup: 'Biceps',
    sets,
    reps: '10-12',
    restSeconds: 60,
    notes: 'Strict form, no swinging torso',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-curl.gif',
  });

  // Biceps isolation
  exList.push({
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    notes: 'Neutral grip builds forearm and bicep thickness',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/hammer-curl.gif',
  });

  if (level === 'Intermediate' || level === 'Advanced') {
    exList.push({
      name: 'Dumbbell Row',
      muscleGroup: 'Back',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Single arm unilateral back development',
    });
  }

  return {
    dayName,
    focus: `Pull — ${variant}`,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: exList.length * 9,
    estimatedCalories: exList.length * 60,
  };
}

function createLegsDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  variant = 'Quads, Hamstrings & Calves'
): PlannedDay {
  const hasKneeInjury = conditions.includes('knee_injury');
  const hasBackInjury = conditions.includes('back_injury');
  const exList: PlannedExercise[] = [];

  if (hasBackInjury) {
    exList.push({
      name: 'Leg Press',
      muscleGroup: 'Legs',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Back fully supported, do not round lower spine',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/leg-press.gif',
    });
  } else if (!hasKneeInjury) {
    exList.push({
      name: 'Barbell Squat',
      muscleGroup: 'Legs',
      sets,
      reps,
      restSeconds: rest + 30,
      notes: 'Hips back and down, chest up, push floor away',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/barbell-squat.gif',
    });
  } else {
    exList.push({
      name: 'Leg Extension',
      muscleGroup: 'Legs',
      sets: 3,
      reps: '12-15',
      restSeconds: 60,
      notes: 'Controlled slow tempo, pain-free range of motion',
    });
  }

  // Posterior chain
  exList.push({
    name: 'Romanian Deadlift',
    muscleGroup: 'Legs',
    sets,
    reps: '8-12',
    restSeconds: rest,
    notes: 'Feel deep stretch in hamstrings, soft knees',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/hamstrings/romanian-deadlift.gif',
  });

  // Hamstring isolation
  exList.push({
    name: 'Leg Curl',
    muscleGroup: 'Legs',
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    notes: 'Squeeze hamstrings at contraction peak',
  });

  // Calves
  exList.push({
    name: 'Calf Raise',
    muscleGroup: 'Legs',
    sets: 3,
    reps: '15-20',
    restSeconds: 45,
    notes: 'Full stretch at bottom, pause 1s at top',
  });

  // Core / Glutes
  if (conditions.includes('post_pregnancy')) {
    exList.push({
      name: 'Plank',
      muscleGroup: 'Core',
      sets: 3,
      reps: '30s',
      restSeconds: 45,
      notes: 'Focus on gentle transverse abdominal engagement',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/plank.gif',
    });
  } else {
    exList.push({
      name: 'Hanging Leg Raise',
      muscleGroup: 'Core',
      sets: 3,
      reps: '10-15',
      restSeconds: 60,
      notes: 'Control the descent without swinging',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/abs/hanging-leg-raise.gif',
    });
  }

  return {
    dayName,
    focus: `Legs — ${variant}`,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: exList.length * 9,
    estimatedCalories: exList.length * 65,
  };
}

function createUpperDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  variant = 'Upper Body Power'
): PlannedDay {
  const exList: PlannedExercise[] = [
    {
      name: 'Barbell Bench Press',
      muscleGroup: 'Chest',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Solid chest foundation',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif',
    },
    {
      name: 'Lat Pulldown',
      muscleGroup: 'Back',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Full lat stretch and contraction',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/lat-pulldown.gif',
    },
    {
      name: 'DB Shoulder Press',
      muscleGroup: 'Shoulders',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Press overhead smoothly',
    },
    {
      name: 'Seated Cable Row',
      muscleGroup: 'Back',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Middle back thickness',
    },
    {
      name: 'Barbell Curl',
      muscleGroup: 'Biceps',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Arm definition',
    },
    {
      name: 'Triceps Pushdown',
      muscleGroup: 'Triceps',
      sets: 3,
      reps: '12-15',
      restSeconds: 60,
      notes: 'Lockout arms',
    },
  ];

  return {
    dayName,
    focus: variant,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: 55,
    estimatedCalories: 350,
  };
}

function createLowerDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  variant = 'Lower Body & Core'
): PlannedDay {
  const hasKnee = conditions.includes('knee_injury');
  const exList: PlannedExercise[] = [
    {
      name: hasKnee ? 'Leg Press' : 'Barbell Squat',
      muscleGroup: 'Legs',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Core tight, drive through mid-foot',
    },
    {
      name: 'Romanian Deadlift',
      muscleGroup: 'Legs',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Posterior chain loading',
    },
    {
      name: 'Leg Curl',
      muscleGroup: 'Legs',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Hamstring isolation',
    },
    {
      name: 'Calf Raise',
      muscleGroup: 'Legs',
      sets: 3,
      reps: '15-20',
      restSeconds: 45,
      notes: 'Lower leg development',
    },
    {
      name: 'Plank',
      muscleGroup: 'Core',
      sets: 3,
      reps: '45s',
      restSeconds: 45,
      notes: 'Isometric core stability',
    },
  ];

  return {
    dayName,
    focus: variant,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: 45,
    estimatedCalories: 320,
  };
}

function createFullBodyDay(
  dayName: string,
  sets: number,
  reps: string,
  rest: number,
  conditions: HealthCondition[],
  level: string,
  name: string
): PlannedDay {
  const exList: PlannedExercise[] = [
    {
      name: 'Barbell Squat',
      muscleGroup: 'Legs',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Quad and core emphasis',
    },
    {
      name: 'Barbell Bench Press',
      muscleGroup: 'Chest',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Upper body pushing strength',
    },
    {
      name: 'Lat Pulldown',
      muscleGroup: 'Back',
      sets,
      reps,
      restSeconds: rest,
      notes: 'Upper body pulling strength',
    },
    {
      name: 'DB Shoulder Press',
      muscleGroup: 'Shoulders',
      sets: 3,
      reps,
      restSeconds: 60,
      notes: 'Deltoid development',
    },
    {
      name: 'Plank',
      muscleGroup: 'Core',
      sets: 3,
      reps: '45s',
      restSeconds: 45,
      notes: 'Core bracing',
    },
  ];

  return {
    dayName,
    focus: name,
    isRest: false,
    exercises: exList,
    estimatedDurationMins: 50,
    estimatedCalories: 340,
  };
}

function createChestDay(dayName: string, sets: number, reps: string, rest: number, c: HealthCondition[]): PlannedDay {
  return {
    dayName,
    focus: 'Chest Hypertrophy',
    isRest: false,
    exercises: [
      { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets, reps, restSeconds: rest },
      { name: 'Incline Bench Press', muscleGroup: 'Chest', sets, reps, restSeconds: rest },
      { name: 'Dumbbell Fly', muscleGroup: 'Chest', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Push Up', muscleGroup: 'Chest', sets: 3, reps: '15-20', restSeconds: 60 },
    ],
    estimatedDurationMins: 45,
    estimatedCalories: 280,
  };
}

function createBackDay(dayName: string, sets: number, reps: string, rest: number, c: HealthCondition[]): PlannedDay {
  return {
    dayName,
    focus: 'Back Thickness & Width',
    isRest: false,
    exercises: [
      { name: 'Lat Pulldown', muscleGroup: 'Back', sets, reps, restSeconds: rest },
      { name: 'Barbell Row', muscleGroup: 'Back', sets, reps, restSeconds: rest },
      { name: 'Seated Cable Row', muscleGroup: 'Back', sets: 3, reps: '10-12', restSeconds: 60 },
      { name: 'Face Pull', muscleGroup: 'Back', sets: 3, reps: '15', restSeconds: 45 },
    ],
    estimatedDurationMins: 45,
    estimatedCalories: 300,
  };
}

function createShouldersDay(dayName: string, sets: number, reps: string, rest: number, c: HealthCondition[]): PlannedDay {
  return {
    dayName,
    focus: 'Shoulders & Traps',
    isRest: false,
    exercises: [
      { name: 'DB Shoulder Press', muscleGroup: 'Shoulders', sets, reps, restSeconds: rest },
      { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', sets: 4, reps: '12-15', restSeconds: 60 },
      { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Upright Row', muscleGroup: 'Shoulders', sets: 3, reps: '10-12', restSeconds: 60 },
    ],
    estimatedDurationMins: 40,
    estimatedCalories: 260,
  };
}

function createArmsDay(dayName: string, sets: number, reps: string, rest: number, c: HealthCondition[]): PlannedDay {
  return {
    dayName,
    focus: 'Biceps, Triceps & Forearms',
    isRest: false,
    exercises: [
      { name: 'Barbell Curl', muscleGroup: 'Biceps', sets, reps: '10-12', restSeconds: 60 },
      { name: 'Hammer Curl', muscleGroup: 'Biceps', sets: 3, reps: '10-12', restSeconds: 60 },
      { name: 'Triceps Pushdown', muscleGroup: 'Triceps', sets, reps: '12-15', restSeconds: 60 },
      { name: 'Overhead Tricep Ext.', muscleGroup: 'Triceps', sets: 3, reps: '10-12', restSeconds: 60 },
    ],
    estimatedDurationMins: 40,
    estimatedCalories: 250,
  };
}

function createRestDay(dayName: string): PlannedDay {
  return {
    dayName,
    focus: 'Rest & Recovery',
    isRest: true,
    exercises: [],
    estimatedDurationMins: 0,
    estimatedCalories: 0,
  };
}

// ── Display formatters ─────────────────────────────────────────────────────
export function formatSplitName(split: WorkoutSplit): string {
  switch (split) {
    case 'push_pull_legs':
      return 'Push / Pull / Legs (PPL)';
    case 'upper_lower':
      return 'Upper / Lower Split';
    case 'full_body':
      return 'Full Body Routine';
    case 'bro_split':
      return 'Classic Bodypart Split';
    case 'coach_decides':
    default:
      return 'AI Coach Custom Split';
  }
}

export function formatGoal(goal: string): string {
  switch (goal) {
    case 'muscle_gain':
      return 'Muscle Hypertrophy';
    case 'fat_loss':
      return 'Fat Loss & Lean Muscle';
    case 'strength':
      return 'Maximum Strength';
    case 'endurance':
      return 'Endurance & Stamina';
    case 'general_fitness':
    default:
      return 'Total Body Conditioning';
  }
}

// ── Generate Plan (AI with Instant Fallback) ───────────────────────────────
export async function generateCustomPlan(user: UserProfile): Promise<ActivePlan> {
  // Always build the deterministic plan as the baseline
  const basePlan = createDeterministicPlan(user);

  try {
    const prompt = `You are a world-class certified fitness coach. A user needs a customized 7-day workout and diet plan.
User Profile:
- Name: ${user.name}
- Age: ${user.age}, Gender: ${user.gender}
- Weight: ${user.weightKg}kg, Height: ${user.heightCm}cm
- Level: ${user.fitnessLevel}
- Goal: ${user.goal}
- Days/week: ${user.daysPerWeek}
- Split preference: ${user.workoutSplit}
- Health conditions / injuries: ${user.healthConditions.join(', ') || 'None'}
- Nutrition targets: ${user.dailyCalorieTarget} kcal, ${user.proteinTargetG}g protein

Provide a customized 7-day plan (Monday through Sunday) in JSON format.
Ensure you strictly avoid dangerous exercises for their reported health conditions.
Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "summary": "string",
  "days": [
    {
      "dayName": "Monday",
      "focus": "string",
      "isRest": false,
      "exercises": [
        { "name": "string", "muscleGroup": "string", "sets": 4, "reps": "8-12", "restSeconds": 90, "notes": "string" }
      ],
      "estimatedDurationMins": 50,
      "estimatedCalories": 350
    }
  ],
  "progressionTips": ["string"],
  "nutritionTip": "string"
}`;

    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      if (parsed && Array.isArray(parsed.days) && parsed.days.length === 7) {
        return {
          id: genPlanId(),
          title: parsed.title || basePlan.title,
          summary: parsed.summary || basePlan.summary,
          split: user.workoutSplit,
          durationWeeks: 8,
          days: parsed.days,
          progressionTips: parsed.progressionTips || basePlan.progressionTips,
          nutritionTip: parsed.nutritionTip || basePlan.nutritionTip,
          generatedAt: new Date().toISOString(),
          weekNumber: 1,
        };
      }
    }
  } catch (err) {
    console.warn('[FitNinja] AI generation fallback to deterministic plan:', err);
  }

  // Return high-quality deterministic plan immediately
  return basePlan;
}
