// ── Built-in exercise library ──────────────────────────────────────────────
export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
}

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  // Chest
  { id: 'bench_press',        name: 'Bench Press',           muscleGroup: 'Chest',     category: 'Compound' },
  { id: 'incline_bench',      name: 'Incline Bench Press',   muscleGroup: 'Chest',     category: 'Compound' },
  { id: 'decline_bench',      name: 'Decline Bench Press',   muscleGroup: 'Chest',     category: 'Compound' },
  { id: 'dumbbell_fly',       name: 'Dumbbell Fly',          muscleGroup: 'Chest',     category: 'Isolation' },
  { id: 'cable_crossover',    name: 'Cable Crossover',       muscleGroup: 'Chest',     category: 'Isolation' },
  { id: 'push_up',            name: 'Push Up',               muscleGroup: 'Chest',     category: 'Bodyweight' },
  { id: 'chest_dip',          name: 'Chest Dip',             muscleGroup: 'Chest',     category: 'Bodyweight' },

  // Back
  { id: 'deadlift',           name: 'Deadlift',              muscleGroup: 'Back',      category: 'Compound' },
  { id: 'barbell_row',        name: 'Barbell Row',           muscleGroup: 'Back',      category: 'Compound' },
  { id: 'pull_up',            name: 'Pull Up',               muscleGroup: 'Back',      category: 'Bodyweight' },
  { id: 'lat_pulldown',       name: 'Lat Pulldown',          muscleGroup: 'Back',      category: 'Compound' },
  { id: 'seated_cable_row',   name: 'Seated Cable Row',      muscleGroup: 'Back',      category: 'Compound' },
  { id: 'db_row',             name: 'Dumbbell Row',          muscleGroup: 'Back',      category: 'Isolation' },
  { id: 'face_pull',          name: 'Face Pull',             muscleGroup: 'Back',      category: 'Isolation' },
  { id: 'hyperextension',     name: 'Hyperextension',        muscleGroup: 'Back',      category: 'Isolation' },

  // Shoulders
  { id: 'ohp',                name: 'Overhead Press',        muscleGroup: 'Shoulders', category: 'Compound' },
  { id: 'db_shoulder_press',  name: 'DB Shoulder Press',     muscleGroup: 'Shoulders', category: 'Compound' },
  { id: 'lateral_raise',      name: 'Lateral Raise',         muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: 'front_raise',        name: 'Front Raise',           muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: 'arnold_press',       name: 'Arnold Press',          muscleGroup: 'Shoulders', category: 'Compound' },
  { id: 'rear_delt_fly',      name: 'Rear Delt Fly',         muscleGroup: 'Shoulders', category: 'Isolation' },
  { id: 'upright_row',        name: 'Upright Row',           muscleGroup: 'Shoulders', category: 'Compound' },

  // Biceps
  { id: 'barbell_curl',       name: 'Barbell Curl',          muscleGroup: 'Biceps',    category: 'Isolation' },
  { id: 'db_curl',            name: 'Dumbbell Curl',         muscleGroup: 'Biceps',    category: 'Isolation' },
  { id: 'hammer_curl',        name: 'Hammer Curl',           muscleGroup: 'Biceps',    category: 'Isolation' },
  { id: 'cable_curl',         name: 'Cable Curl',            muscleGroup: 'Biceps',    category: 'Isolation' },
  { id: 'preacher_curl',      name: 'Preacher Curl',         muscleGroup: 'Biceps',    category: 'Isolation' },
  { id: 'incline_db_curl',    name: 'Incline DB Curl',       muscleGroup: 'Biceps',    category: 'Isolation' },

  // Triceps
  { id: 'tricep_pushdown',    name: 'Tricep Pushdown',       muscleGroup: 'Triceps',   category: 'Isolation' },
  { id: 'skull_crusher',      name: 'Skull Crusher',         muscleGroup: 'Triceps',   category: 'Isolation' },
  { id: 'overhead_tricep',    name: 'Overhead Tricep Ext.',  muscleGroup: 'Triceps',   category: 'Isolation' },
  { id: 'tricep_dip',         name: 'Tricep Dip',            muscleGroup: 'Triceps',   category: 'Bodyweight' },
  { id: 'close_grip_bench',   name: 'Close Grip Bench',      muscleGroup: 'Triceps',   category: 'Compound' },

  // Legs
  { id: 'squat',              name: 'Squat',                 muscleGroup: 'Legs',      category: 'Compound' },
  { id: 'leg_press',          name: 'Leg Press',             muscleGroup: 'Legs',      category: 'Compound' },
  { id: 'romanian_deadlift',  name: 'Romanian Deadlift',     muscleGroup: 'Legs',      category: 'Compound' },
  { id: 'leg_extension',      name: 'Leg Extension',         muscleGroup: 'Legs',      category: 'Isolation' },
  { id: 'leg_curl',           name: 'Leg Curl',              muscleGroup: 'Legs',      category: 'Isolation' },
  { id: 'lunge',              name: 'Lunge',                 muscleGroup: 'Legs',      category: 'Compound' },
  { id: 'calf_raise',         name: 'Calf Raise',            muscleGroup: 'Legs',      category: 'Isolation' },
  { id: 'bulgarian_squat',    name: 'Bulgarian Split Squat', muscleGroup: 'Legs',      category: 'Compound' },
  { id: 'hack_squat',         name: 'Hack Squat',            muscleGroup: 'Legs',      category: 'Compound' },

  // Core
  { id: 'plank',              name: 'Plank',                 muscleGroup: 'Core',      category: 'Bodyweight' },
  { id: 'crunch',             name: 'Crunch',                muscleGroup: 'Core',      category: 'Bodyweight' },
  { id: 'cable_crunch',       name: 'Cable Crunch',          muscleGroup: 'Core',      category: 'Isolation' },
  { id: 'hanging_leg_raise',  name: 'Hanging Leg Raise',     muscleGroup: 'Core',      category: 'Bodyweight' },
  { id: 'russian_twist',      name: 'Russian Twist',         muscleGroup: 'Core',      category: 'Bodyweight' },
  { id: 'ab_rollout',         name: 'Ab Rollout',            muscleGroup: 'Core',      category: 'Bodyweight' },

  // Cardio
  { id: 'running',            name: 'Running',               muscleGroup: 'Cardio',    category: 'Cardio' },
  { id: 'cycling',            name: 'Cycling',               muscleGroup: 'Cardio',    category: 'Cardio' },
  { id: 'jump_rope',          name: 'Jump Rope',             muscleGroup: 'Cardio',    category: 'Cardio' },
  { id: 'rowing',             name: 'Rowing Machine',        muscleGroup: 'Cardio',    category: 'Cardio' },
];

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio'
];

export const MUSCLE_COLORS: Record<string, string> = {
  Chest:     '#1F4B99',
  Back:      '#9b8ef0',
  Shoulders: '#e8b86d',
  Biceps:    '#3ba213',
  Triceps:   '#ce2b04',
  Legs:      '#153880',
  Core:      '#8B5E3C',
  Cardio:    '#9BA8B4',
};
