// Fit Ninjas AI Fitness & Nutrition Plan Engine
// Generates 100% personalized workout splits and Indian nutrition meal plans
// based on Mifflin-St Jeor formula, equipment, experience, schedule, and cultural diet.

import { uid } from './format.js'
import { EXDB } from './exercises-data.js'

// Helper to find best exercise ID by keywords/equipment
export function findEx(nameOrKeywords, fallbackEq = 'barbell') {
  if (!nameOrKeywords) return EXDB[0]?.id || '0025'
  const norm = nameOrKeywords.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // 1. Exact alphanumeric match
  const exact = EXDB.find(e => e.n.toLowerCase().replace(/[^a-z0-9]/g, '') === norm)
  if (exact) return exact.id

  // 2. Word matches
  const words = nameOrKeywords.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  for (const e of EXDB) {
    const en = e.n.toLowerCase()
    if (words.every(w => en.includes(w))) return e.id
  }

  // 3. Substring match
  const match = EXDB.find(e => e.n.toLowerCase().includes(nameOrKeywords.toLowerCase()) || nameOrKeywords.toLowerCase().includes(e.n.toLowerCase()))
  if (match) return match.id

  // 4. Target/bodypart match fallback
  return EXDB[0]?.id || '0025'
}

/* ==========================================================================
   PRESET WORKOUT PROGRAMS LIBRARY (12+ Professional Templates)
   ========================================================================== */
export const PRESET_PROGRAMS = [
  {
    id: 'ppl-3',
    name: 'Push / Pull / Legs (3 Days)',
    badge: '3 Days · Gym',
    desc: 'The classic hypertrophy split. Push muscles on Monday, Pull muscles on Wednesday, Legs on Friday.',
    days: 3,
    level: 'Beginner - Intermediate',
    goal: 'muscle',
    routines: [
      {
        name: 'Push Day (Chest · Shoulders · Triceps)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'dumbbell incline bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'standing dumbbell overhead press', sets: 3, reps: 10, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 3, reps: 12, weight: 0 },
          { name: 'cable tricep pushdown', sets: 3, reps: 12, weight: 0 },
          { name: 'dips', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Pull Day (Back · Biceps · Rear Delts)',
        emoji: 'pullup',
        exercises: [
          { name: 'barbell deadlift', sets: 4, reps: 6, weight: 0 },
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'barbell bent over row', sets: 3, reps: 10, weight: 0 },
          { name: 'cable seated row', sets: 3, reps: 10, weight: 0 },
          { name: 'face pull', sets: 3, reps: 15, weight: 0 },
          { name: 'dumbbell alternate bicep curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Leg Day (Quads · Hamstrings · Calves)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'barbell romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'lying leg curls', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs Hypertrophy (6 Days)',
    badge: '6 Days · Advanced',
    desc: 'High frequency PPL hitting each muscle group twice weekly for maximum muscle growth.',
    days: 6,
    level: 'Intermediate - Advanced',
    goal: 'muscle',
    routines: [
      {
        name: 'Push A (Chest Focus)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 6, weight: 0 },
          { name: 'dumbbell incline bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'cable crossover', sets: 3, reps: 12, weight: 0 },
          { name: 'overhead dumbbell press', sets: 3, reps: 10, weight: 0 },
          { name: 'cable tricep pushdown', sets: 3, reps: 12, weight: 0 },
          { name: 'skull crusher', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Pull A (Back Width & Lat Focus)',
        emoji: 'pullup',
        exercises: [
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'lat pulldown', sets: 3, reps: 10, weight: 0 },
          { name: 'barbell bent over row', sets: 4, reps: 8, weight: 0 },
          { name: 'cable face pull', sets: 3, reps: 15, weight: 0 },
          { name: 'barbell curl', sets: 3, reps: 10, weight: 0 },
          { name: 'hammer curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Legs A (Quad & Squat Focus)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 6, weight: 0 },
          { name: 'leg press', sets: 3, reps: 10, weight: 0 },
          { name: 'leg extensions', sets: 3, reps: 12, weight: 0 },
          { name: 'barbell romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Push B (Shoulders & Incline Focus)',
        emoji: 'barbell',
        exercises: [
          { name: 'standing barbell overhead press', sets: 4, reps: 8, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 4, reps: 10, weight: 0 },
          { name: 'dips', sets: 3, reps: 10, weight: 0 },
          { name: 'lateral raise', sets: 4, reps: 15, weight: 0 },
          { name: 'overhead tricep extension', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Pull B (Back Thickness & Rows)',
        emoji: 'pullup',
        exercises: [
          { name: 'barbell deadlift', sets: 3, reps: 5, weight: 0 },
          { name: 'seated cable row', sets: 4, reps: 10, weight: 0 },
          { name: 'one arm dumbbell row', sets: 3, reps: 10, weight: 0 },
          { name: 'reverse fly', sets: 3, reps: 15, weight: 0 },
          { name: 'incline dumbbell curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Legs B (Hamstrings & Posterior Chain)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell romanian deadlift', sets: 4, reps: 8, weight: 0 },
          { name: 'goblet squat', sets: 3, reps: 12, weight: 0 },
          { name: 'lying leg curls', sets: 4, reps: 12, weight: 0 },
          { name: 'walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'seated calf raise', sets: 4, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower Power Split (4 Days)',
    badge: '4 Days · All Levels',
    desc: 'The gold standard 4-day split. Upper Body Mon/Thu, Lower Body Tue/Fri with 3 full recovery days.',
    days: 4,
    level: 'All Levels',
    goal: 'recomp',
    routines: [
      {
        name: 'Upper A (Heavy Strength)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 6, weight: 0 },
          { name: 'barbell bent over row', sets: 4, reps: 6, weight: 0 },
          { name: 'standing overhead press', sets: 3, reps: 8, weight: 0 },
          { name: 'lat pulldown', sets: 3, reps: 10, weight: 0 },
          { name: 'barbell curl', sets: 3, reps: 10, weight: 0 },
          { name: 'tricep pushdown', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Lower A (Squat Focus)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 6, weight: 0 },
          { name: 'romanian deadlift', sets: 3, reps: 8, weight: 0 },
          { name: 'leg press', sets: 3, reps: 10, weight: 0 },
          { name: 'leg curl', sets: 3, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Upper B (Hypertrophy & Volume)',
        emoji: 'barbell',
        exercises: [
          { name: 'incline dumbbell bench press', sets: 4, reps: 10, weight: 0 },
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'seated cable row', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 4, reps: 15, weight: 0 },
          { name: 'incline dumbbell curl', sets: 3, reps: 12, weight: 0 },
          { name: 'cable overhead tricep extension', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Lower B (Deadlift & Posterior Chain)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell deadlift', sets: 3, reps: 5, weight: 0 },
          { name: 'front squat', sets: 3, reps: 8, weight: 0 },
          { name: 'dumbbell walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'lying leg curls', sets: 3, reps: 12, weight: 0 },
          { name: 'hanging leg raise', sets: 3, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'full-body-3',
    name: 'Full Body Functional Strength (3 Days)',
    badge: '3 Days · Busy Schedule',
    desc: 'Hit full body 3 days a week (Mon/Wed/Fri). High muscle protein synthesis with maximum recovery.',
    days: 3,
    level: 'Beginner - Intermediate',
    goal: 'general',
    routines: [
      {
        name: 'Full Body A (Squat & Press)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell squat', sets: 3, reps: 8, weight: 0 },
          { name: 'barbell bench press', sets: 3, reps: 8, weight: 0 },
          { name: 'barbell bent over row', sets: 3, reps: 10, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 3, reps: 12, weight: 0 },
          { name: 'bicep curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Full Body B (Deadlift & Overhead)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell deadlift', sets: 3, reps: 6, weight: 0 },
          { name: 'standing overhead press', sets: 3, reps: 8, weight: 0 },
          { name: 'lat pulldown', sets: 3, reps: 10, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'tricep pushdown', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Full Body C (Hypertrophy & Core)',
        emoji: 'barbell',
        exercises: [
          { name: 'dumbbell romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'seated cable row', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'plank', sets: 3, reps: 45, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'arnold-split-6',
    name: 'Arnold Golden Era Split (6 Days)',
    badge: '6 Days · Bodybuilding',
    desc: 'Arnold Schwarzenegger’s legendary split: Chest+Back, Shoulders+Arms, Legs repeated twice a week.',
    days: 6,
    level: 'Advanced',
    goal: 'muscle',
    routines: [
      {
        name: 'Chest & Back Superset',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'barbell bent over row', sets: 4, reps: 8, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'pull-up', sets: 3, reps: 8, weight: 0 },
          { name: 'dumbbell fly', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Shoulders & Arms',
        emoji: 'barbell',
        exercises: [
          { name: 'standing barbell overhead press', sets: 4, reps: 8, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 4, reps: 12, weight: 0 },
          { name: 'rear delt reverse fly', sets: 3, reps: 15, weight: 0 },
          { name: 'barbell curl', sets: 4, reps: 10, weight: 0 },
          { name: 'skull crusher', sets: 4, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Legs & Calves',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'leg curl', sets: 3, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'home-dumbbell-4',
    name: 'Home Dumbbell & Bench Only (4 Days)',
    badge: '4 Days · Home Gym',
    desc: 'Optimized for home athletes with a pair of adjustable dumbbells and a flat/incline bench.',
    days: 4,
    level: 'All Levels',
    goal: 'muscle',
    routines: [
      {
        name: 'Home Upper A (Chest & Back)',
        emoji: 'barbell',
        exercises: [
          { name: 'dumbbell bench press', sets: 4, reps: 10, weight: 0 },
          { name: 'one arm dumbbell row', sets: 4, reps: 10, weight: 0 },
          { name: 'incline dumbbell press', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell pullovers', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 3, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Home Lower A (Quads & Glutes)',
        emoji: 'legs',
        exercises: [
          { name: 'goblet squat', sets: 4, reps: 12, weight: 0 },
          { name: 'dumbbell romanian deadlift', sets: 4, reps: 10, weight: 0 },
          { name: 'dumbbell bulgarian split squat', sets: 3, reps: 10, weight: 0 },
          { name: 'single leg calf raise', sets: 4, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Home Upper B (Shoulders & Arms)',
        emoji: 'barbell',
        exercises: [
          { name: 'seated dumbbell shoulder press', sets: 4, reps: 10, weight: 0 },
          { name: 'dumbbell rear delt fly', sets: 3, reps: 15, weight: 0 },
          { name: 'dumbbell bicep curl', sets: 3, reps: 12, weight: 0 },
          { name: 'overhead dumbbell tricep extension', sets: 3, reps: 12, weight: 0 },
          { name: 'hammer curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Home Lower B & Core',
        emoji: 'legs',
        exercises: [
          { name: 'dumbbell walking lunges', sets: 4, reps: 12, weight: 0 },
          { name: 'dumbbell sumo squat', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell hip thrust', sets: 3, reps: 15, weight: 0 },
          { name: 'plank', sets: 3, reps: 60, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'calisthenics-3',
    name: 'Pure Bodyweight & Calisthenics (3 Days)',
    badge: '3 Days · Zero Equipment',
    desc: 'Master your own bodyweight with progressive push-ups, pull-ups, squats, dips, and core circuits.',
    days: 3,
    level: 'All Levels',
    goal: 'general',
    routines: [
      {
        name: 'Calisthenics Upper Push & Core',
        emoji: 'barbell',
        exercises: [
          { name: 'push-up', sets: 4, reps: 15, weight: 0 },
          { name: 'diamond push-up', sets: 3, reps: 12, weight: 0 },
          { name: 'pike push up', sets: 3, reps: 10, weight: 0 },
          { name: 'dips', sets: 3, reps: 12, weight: 0 },
          { name: 'plank', sets: 3, reps: 60, weight: 0 }
        ]
      },
      {
        name: 'Calisthenics Pull & Back',
        emoji: 'pullup',
        exercises: [
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'chin-up', sets: 3, reps: 8, weight: 0 },
          { name: 'inverted row', sets: 4, reps: 12, weight: 0 },
          { name: 'hanging knee raise', sets: 3, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Calisthenics Lower Body & Explosiveness',
        emoji: 'legs',
        exercises: [
          { name: 'bodyweight squat', sets: 4, reps: 20, weight: 0 },
          { name: 'walking lunges', sets: 3, reps: 15, weight: 0 },
          { name: 'single leg calf raise', sets: 4, reps: 20, weight: 0 },
          { name: 'jump squat', sets: 3, reps: 12, weight: 0 },
          { name: 'glute bridge', sets: 3, reps: 20, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'fat-burn-shred-4',
    name: 'Fat Burn & Athletic Shred (4 Days)',
    badge: '4 Days · Fat Loss',
    desc: 'High-intensity resistance training paired with compound supersets for maximum caloric expenditure.',
    days: 4,
    level: 'Intermediate',
    goal: 'fat_loss',
    routines: [
      {
        name: 'Upper Body Shred & Density',
        emoji: 'barbell',
        exercises: [
          { name: 'dumbbell bench press', sets: 4, reps: 12, weight: 0 },
          { name: 'lat pulldown', sets: 4, reps: 12, weight: 0 },
          { name: 'dumbbell shoulder press', sets: 3, reps: 12, weight: 0 },
          { name: 'cable row', sets: 3, reps: 12, weight: 0 },
          { name: 'mountain climber', sets: 3, reps: 30, weight: 0 }
        ]
      },
      {
        name: 'Lower Body Metabolic Burn',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 10, weight: 0 },
          { name: 'dumbbell romanian deadlift', sets: 3, reps: 12, weight: 0 },
          { name: 'walking lunges', sets: 3, reps: 15, weight: 0 },
          { name: 'leg press', sets: 3, reps: 15, weight: 0 },
          { name: 'box jump', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Push & Core HIIT',
        emoji: 'barbell',
        exercises: [
          { name: 'incline dumbbell press', sets: 4, reps: 12, weight: 0 },
          { name: 'dips', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 4, reps: 15, weight: 0 },
          { name: 'hanging leg raise', sets: 3, reps: 15, weight: 0 },
          { name: 'burpee', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Pull & Posterior Chain Power',
        emoji: 'pullup',
        exercises: [
  {
    id: 'pplul-5',
    name: 'Push / Pull / Legs + Upper / Lower (5 Days)',
    badge: '5 Days · High Frequency',
    desc: 'The ultimate 5-day routine: 3-day PPL followed by 2-day Upper/Lower for maximum weekly muscle growth.',
    days: 5,
    level: 'Intermediate - Advanced',
    goal: 'muscle',
    routines: [
      {
        name: 'Day 1: Push (Chest · Shoulders · Triceps)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'standing overhead press', sets: 3, reps: 10, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 4, reps: 15, weight: 0 },
          { name: 'tricep pushdown', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Day 2: Pull (Back · Biceps · Rear Delts)',
        emoji: 'pullup',
        exercises: [
          { name: 'barbell deadlift', sets: 3, reps: 5, weight: 0 },
          { name: 'lat pulldown', sets: 4, reps: 10, weight: 0 },
          { name: 'barbell bent over row', sets: 3, reps: 10, weight: 0 },
          { name: 'face pull', sets: 3, reps: 15, weight: 0 },
          { name: 'barbell curl', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Day 3: Legs (Quads · Hamstrings · Calves)',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'leg curl', sets: 3, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Day 4: Upper Body Power',
        emoji: 'barbell',
        exercises: [
          { name: 'incline dumbbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'seated cable row', sets: 3, reps: 10, weight: 0 },
          { name: 'dumbbell shoulder press', sets: 3, reps: 10, weight: 0 },
          { name: 'hammer curl', sets: 3, reps: 12, weight: 0 },
          { name: 'dips', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Day 5: Lower Body & Abs',
        emoji: 'legs',
        exercises: [
          { name: 'front squat', sets: 3, reps: 8, weight: 0 },
          { name: 'dumbbell walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'lying leg curls', sets: 4, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 },
          { name: 'hanging leg raise', sets: 3, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'bro-split-5',
    name: 'Classic 5-Day Bodybuilding Bro Split',
    badge: '5 Days · Single Muscle',
    desc: 'One muscle group per day with maximum volume: Chest, Back, Shoulders, Arms, and Legs.',
    days: 5,
    level: 'All Levels',
    goal: 'muscle',
    routines: [
      {
        name: 'Monday: Chest Annihilation',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 4, reps: 10, weight: 0 },
          { name: 'decline dumbbell bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'cable crossover', sets: 3, reps: 12, weight: 0 },
          { name: 'push-up', sets: 3, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Tuesday: Back Thickness & Width',
        emoji: 'pullup',
        exercises: [
          { name: 'barbell deadlift', sets: 4, reps: 6, weight: 0 },
          { name: 'lat pulldown', sets: 4, reps: 10, weight: 0 },
          { name: 'barbell bent over row', sets: 4, reps: 8, weight: 0 },
          { name: 'one arm dumbbell row', sets: 3, reps: 10, weight: 0 },
          { name: 'seated cable row', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Wednesday: 3D Boulder Shoulders',
        emoji: 'barbell',
        exercises: [
          { name: 'standing overhead press', sets: 4, reps: 8, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 5, reps: 15, weight: 0 },
          { name: 'seated dumbbell shoulder press', sets: 3, reps: 10, weight: 0 },
          { name: 'face pull', sets: 4, reps: 15, weight: 0 },
          { name: 'dumbbell shrugs', sets: 4, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Thursday: Arms Blitz (Biceps & Triceps)',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell curl', sets: 4, reps: 10, weight: 0 },
          { name: 'close grip bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'hammer curl', sets: 3, reps: 12, weight: 0 },
          { name: 'tricep pushdown', sets: 4, reps: 12, weight: 0 },
          { name: 'incline dumbbell curl', sets: 3, reps: 12, weight: 0 },
          { name: 'skull crusher', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Friday: Heavy Leg Day',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'leg press', sets: 4, reps: 12, weight: 0 },
          { name: 'romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'leg extensions', sets: 3, reps: 15, weight: 0 },
          { name: 'lying leg curls', sets: 3, reps: 12, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'bro-split-4',
    name: '4-Day Bodypart Split (Chest/Back/Shoulders/Legs)',
    badge: '4 Days · Classic',
    desc: 'Targeted 4-day split: Chest & Triceps, Back & Biceps, Shoulders & Abs, Legs.',
    days: 4,
    level: 'All Levels',
    goal: 'muscle',
    routines: [
      {
        name: 'Day 1: Chest & Triceps',
        emoji: 'barbell',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: 8, weight: 0 },
          { name: 'incline dumbbell bench press', sets: 3, reps: 10, weight: 0 },
          { name: 'dips', sets: 3, reps: 10, weight: 0 },
          { name: 'cable tricep pushdown', sets: 4, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Day 2: Back & Biceps',
        emoji: 'pullup',
        exercises: [
          { name: 'pull-up', sets: 4, reps: 8, weight: 0 },
          { name: 'barbell bent over row', sets: 4, reps: 8, weight: 0 },
          { name: 'lat pulldown', sets: 3, reps: 10, weight: 0 },
          { name: 'barbell curl', sets: 4, reps: 10, weight: 0 },
          { name: 'hammer curl', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Day 3: Shoulders & Abs',
        emoji: 'barbell',
        exercises: [
          { name: 'standing overhead press', sets: 4, reps: 8, weight: 0 },
          { name: 'dumbbell lateral raise', sets: 4, reps: 15, weight: 0 },
          { name: 'face pull', sets: 3, reps: 15, weight: 0 },
          { name: 'hanging leg raise', sets: 3, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Day 4: Legs & Calves',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'romanian deadlift', sets: 3, reps: 10, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      }
    ]
  },
          { name: 'seated cable row', sets: 3, reps: 12, weight: 0 },
          { name: 'face pull', sets: 4, reps: 15, weight: 0 },
          { name: 'air bike', sets: 3, reps: 20, weight: 0 }
        ]
      }
    ]
  },
  {
    id: 'glute-lower-4',
    name: 'Glutes & Lower Body Curve Focus (4 Days)',
    badge: '4 Days · Lower Focus',
    desc: 'Targeted hypertrophy for glutes, hamstrings, and quads with upper body maintenance.',
    days: 4,
    level: 'All Levels',
    goal: 'muscle',
    routines: [
      {
        name: 'Glute & Hamstring Hypertrophy',
        emoji: 'legs',
        exercises: [
          { name: 'barbell hip thrust', sets: 4, reps: 10, weight: 0 },
          { name: 'romanian deadlift', sets: 4, reps: 10, weight: 0 },
          { name: 'dumbbell bulgarian split squat', sets: 3, reps: 12, weight: 0 },
          { name: 'lying leg curls', sets: 3, reps: 12, weight: 0 },
          { name: 'cable kickback', sets: 3, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Upper Body Tone (Back & Shoulders)',
        emoji: 'barbell',
        exercises: [
          { name: 'lat pulldown', sets: 4, reps: 10, weight: 0 },
          { name: 'dumbbell shoulder press', sets: 3, reps: 10, weight: 0 },
          { name: 'seated cable row', sets: 3, reps: 12, weight: 0 },
          { name: 'lateral raise', sets: 3, reps: 15, weight: 0 },
          { name: 'push-up', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Quad & Glute Power',
        emoji: 'legs',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: 8, weight: 0 },
          { name: 'leg press', sets: 3, reps: 12, weight: 0 },
          { name: 'walking lunges', sets: 3, reps: 12, weight: 0 },
          { name: 'leg extensions', sets: 3, reps: 15, weight: 0 },
          { name: 'standing calf raises', sets: 4, reps: 15, weight: 0 }
        ]
      },
      {
        name: 'Full Body Glute Burner & Abs',
        emoji: 'legs',
        exercises: [
          { name: 'goblet squat', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell romanian deadlift', sets: 3, reps: 12, weight: 0 },
          { name: 'dumbbell bicep curl', sets: 3, reps: 12, weight: 0 },
          { name: 'tricep pushdown', sets: 3, reps: 12, weight: 0 },
          { name: 'plank', sets: 3, reps: 60, weight: 0 }
        ]
      }
    ]
  }
]

/* ==========================================================================
   DYNAMIC SMART AI PLAN GENERATOR
   ========================================================================== */
export function generateCustomPlan(answers) {
  const {
    pname = 'Athlete',
    age = 25,
    weight = 72,
    height = 175,
    gender = 'male',
    goal = 'muscle',
    days = 4,
    location = 'gym',
    diet = 'nonveg',
    focus = 'balanced',
    experience = 'intermediate'
  } = answers

  const numAge = Number(age) || 25
  const numWeight = Number(weight) || 70
  const numHeight = Number(height) || 175
  const numDays = Number(days) || 4

  // 1. Mifflin-St Jeor BMR
  let bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge)
  bmr = gender === 'female' ? bmr - 161 : bmr + 5

  // 2. Activity Multiplier based on training frequency
  const activityFactors = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 }
  const tdee = Math.round(bmr * (activityFactors[numDays] || 1.5))

  // 3. Goal Calorie Adjustment
  let kcal = tdee
  if (goal === 'fat_loss') kcal = Math.round(tdee - 450)
  else if (goal === 'muscle') kcal = Math.round(tdee + 350)
  else if (goal === 'strength') kcal = Math.round(tdee + 250)
  else if (goal === 'recomp') kcal = Math.round(tdee - 100)

  // Minimum safety floor
  if (gender === 'female' && kcal < 1350) kcal = 1350
  if (gender === 'male' && kcal < 1650) kcal = 1650

  // 4. Macro Targets Calculation (Science-backed)
  // Protein: 2.0g to 2.2g per kg bodyweight
  const proteinPerKg = goal === 'fat_loss' || goal === 'recomp' ? 2.2 : 2.0
  const protein = Math.round(numWeight * proteinPerKg)
  const proteinKcal = protein * 4

  // Fats: 25-30% of total calories
  const fatKcal = Math.round(kcal * 0.25)
  const fat = Math.round(fatKcal / 9)

  // Carbs: Remaining calories
  const carbKcal = Math.max(0, kcal - proteinKcal - fatKcal)
  const carbs = Math.round(carbKcal / 4)

  // BMI
  const heightM = numHeight / 100
  const bmi = parseFloat((numWeight / (heightM * heightM)).toFixed(1))

  // 5. Build Cultural Indian Meal Schedule tailored to Diet Type
  const meals = buildCustomMeals(diet, kcal, protein, carbs, fat, pname)

  // 6. Select & Build Workout Routines Split based on chosen days, split preference & goal
  const workout = buildCustomWorkoutSplit(numDays, location, goal, answers.splitId || focus)

  // 7. Personalized Coach Insight
  const goalNames = {
    muscle: 'Hypertrophy & Muscle Building',
    fat_loss: 'Fat Loss & Athletic Shredding',
    recomp: 'Body Recomposition',
    strength: 'Strength & Power',
    general: 'General Longevity & Fitness'
  }

  const coachNote = `${pname}, your personalized plan is engineered for ${goalNames[goal] || 'Fitness'}. With a target of ${kcal} kcal (${protein}g Protein · ${carbs}g Carbs · ${fat}g Healthy Fats) and your ${numDays}-day ${location === 'gym' ? 'Gym' : 'Home'} routine, you will maximize muscle retention and progression.`

  return {
    kcal,
    protein,
    carbs,
    fat,
    bmi,
    goal,
    diet,
    coachNote,
    weeklyInsight: `Consistency is your superpower, ${pname}! Execute this week’s sessions with progressive overload. 🚀`,
    meals,
    workout,
    generatedAt: new Date().toISOString(),
    monthNumber: 1,
    lastUpdated: new Date().toISOString()
  }
}

/* ==========================================================================
   MEAL BUILDER (Gram-Accurate Indian Recipes)
   ========================================================================== */
function buildCustomMeals(diet, totalKcal, totalP, totalC, totalF, name) {
  if (diet === 'nonveg') {
    return [
      {
        t: '8:00 AM',
        n: 'High-Protein Breakfast',
        d: '3 Whole Eggs + 2 Egg Whites scrambled with spinach & tomatoes + 2 whole wheat rotis or brown toast + black coffee / green tea',
        i: '🍳',
        k: Math.round(totalKcal * 0.26),
        p: Math.round(totalP * 0.28),
        note: 'High leucine egg protein to kickstart muscle protein synthesis after overnight fasting.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Snack',
        d: '1 scoop Whey Protein or Greek Yogurt (150g) + 1 banana + 10 almonds & walnuts',
        i: '🥜',
        k: Math.round(totalKcal * 0.16),
        p: Math.round(totalP * 0.20),
        note: 'Sustained energy and micronutrients for optimal metabolic rate.'
      },
      {
        t: '1:30 PM',
        n: 'Power Lunch',
        d: '150g Grilled/Tandoori Chicken Breast or Fish Curry + 1.5 cups steamed basmati rice or 2 rotis + 1 bowl yellow dal + cucumber salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.32),
        p: Math.round(totalP * 0.32),
        note: 'Complex carbs and lean poultry for glycogen replenishment and sustained afternoon focus.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Fuel',
        d: '2 brown bread slices with peanut butter (15g) + black coffee / apple with pinch of cinnamon',
        i: '⚡',
        k: Math.round(totalKcal * 0.12),
        p: Math.round(totalP * 0.08),
        note: 'Fast-digesting glucose for peak explosive energy during training.'
      },
      {
        t: '8:30 PM',
        n: 'Recovery Dinner',
        d: '120g Chicken Tikka / Soya Chaap + 1 bowl mixed vegetable sabzi + 2 whole wheat rotis + cucumber mint raita',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.12),
        note: 'Nutrient-rich dinner to facilitate tissue repair during sleep.'
      }
    ]
  } else if (diet === 'veg') {
    return [
      {
        t: '8:00 AM',
        n: 'Vegetarian High-Protein Breakfast',
        d: '150g Paneer Bhurji / Soya Paneer scramble with onions, tomatoes & green chillies + 2 whole wheat rotis + 1 glass low-fat milk / tea',
        i: '🥛',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.28),
        note: 'Casein & whey protein blend from fresh paneer for steady amino acid release.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Boost',
        d: '1 cup roasted chana (50g) or sprouted moong salad with lemon & chaat masala + 1 fruit (apple or guava)',
        i: '🥗',
        k: Math.round(totalKcal * 0.15),
        p: Math.round(totalP * 0.18),
        note: 'Fiber-packed legume protein for gut health and appetite control.'
      },
      {
        t: '1:30 PM',
        n: 'Complete Protein Lunch',
        d: '1 bowl Soya Chunks curry (50g dry soya) + 1 cup yellow dal tadka + 1.5 cups steamed rice + fresh green salad with curd',
        i: '🍱',
        k: Math.round(totalKcal * 0.32),
        p: Math.round(totalP * 0.32),
        note: 'Soya chunks provide a complete amino acid profile (52g protein per 100g) ideal for vegetarians.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Snack',
        d: '1 cup Sattu drink with jeera & black salt or 2 multigrain bread slices with almond butter',
        i: '⚡',
        k: Math.round(totalKcal * 0.11),
        p: Math.round(totalP * 0.10),
        note: 'Traditional Indian energy drink with natural electrolytes.'
      },
      {
        t: '8:30 PM',
        n: 'Nourishing Dinner',
        d: '100g Tofu / Paneer Matar curry + 1 bowl mixed dal + 2 rotis + cucumber tomato salad',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.12),
        note: 'Light on digestion yet protein-dense to support nighttime recovery.'
      }
    ]
  } else if (diet === 'egg') {
    return [
      {
        t: '8:00 AM',
        n: 'Eggetarian Power Breakfast',
        d: '2 Whole Eggs + 3 Egg Whites masala omelette with onions & coriander + 2 multigrain toasts or rotis',
        i: '🥚',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.30),
        note: 'Highest biological value protein source to prime muscles.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Snack',
        d: '2 boiled egg whites + 1 handful mixed nuts (almonds, walnuts) + green tea',
        i: '🥜',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.16),
        note: 'Clean protein and omega-3 fats for joint lubrication.'
      },
      {
        t: '1:30 PM',
        n: 'Egg & Paneer Lunch',
        d: 'Egg Curry (3 eggs) or Paneer Bhurji (100g) + 1 bowl thick dal + 1.5 cups rice + mixed kachumber salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.32),
        p: Math.round(totalP * 0.32),
        note: 'High-density protein with complex carbs to replenish muscle glycogen.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Boost',
        d: '1 banana + 1 black coffee or roasted peanuts (30g)',
        i: '⚡',
        k: Math.round(totalKcal * 0.12),
        p: Math.round(totalP * 0.08),
        note: 'Electrolytes and potassium to prevent workout cramping.'
      },
      {
        t: '8:30 PM',
        n: 'Recovery Dinner',
        d: 'Egg Bhurji (3 eggs) or Soya Curry + 2 whole wheat rotis + 1 bowl curd (dahi)',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.14),
        note: 'Balanced combination of slow-digesting casein and egg protein.'
      }
    ]
  } else {
    // Vegan
    return [
      {
        t: '8:00 AM',
        n: 'Plant-Based Breakfast',
        d: '150g Tofu Scramble with turmeric, tomatoes & spinach + 2 multigrain rotis / oats cooked with soy milk & berries',
        i: '🥗',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.28),
        note: 'Complete plant protein with natural antioxidants.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Seeds & Nuts',
        d: 'Sprouted Moong & Kala Chana chaat (1 cup) with lemon & cucumber + chia seed water',
        i: '🥜',
        k: Math.round(totalKcal * 0.16),
        p: Math.round(totalP * 0.18),
        note: 'High digestive enzyme and mineral availability from sprouted legumes.'
      },
      {
        t: '1:30 PM',
        n: 'High-Fiber Plant Lunch',
        d: '1 bowl Rajma / Chole (Chickpeas) + 1.5 cups brown/basmati rice + 100g Pan-seared Tofu + green salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.32),
        p: Math.round(totalP * 0.32),
        note: 'Synergistic amino acid combination of grains (rice) and legumes (rajma/tofu).'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Fuel',
        d: '1 banana with 1 tbsp peanut butter + black coffee',
        i: '⚡',
        k: Math.round(totalKcal * 0.10),
        p: Math.round(totalP * 0.08),
        note: 'Pure clean plant energy.'
      },
      {
        t: '8:30 PM',
        n: 'Plant Protein Dinner',
        d: '1 bowl Soya Chunks curry + 2 whole wheat rotis + 1 bowl steamed broccoli & mixed vegetables',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.14),
        note: 'High leucine soy protein to stimulate muscle rebuilding.'
      }
    ]
  }
}

/* ==========================================================================
   WORKOUT SPLIT BUILDER
   ========================================================================== */
function buildCustomWorkoutSplit(days, location, goal, splitId) {
  let preset = null
  if (splitId) {
    preset = PRESET_PROGRAMS.find(p => p.id === splitId)
  }
  if (!preset) {
    if (location === 'home') {
      preset = PRESET_PROGRAMS.find(p => p.id === 'home-dumbbell-4') || PRESET_PROGRAMS[0]
    } else if (days === 3) {
      preset = PRESET_PROGRAMS.find(p => p.id === 'ppl-3') || PRESET_PROGRAMS[0]
    } else if (days === 4) {
      preset = PRESET_PROGRAMS.find(p => p.id === 'upper-lower-4') || PRESET_PROGRAMS[2]
    } else if (days === 5) {
      preset = PRESET_PROGRAMS.find(p => p.id === 'pplul-5') || PRESET_PROGRAMS.find(p => p.id === 'bro-split-5') || PRESET_PROGRAMS[0]
    } else if (days === 6) {
      preset = PRESET_PROGRAMS.find(p => p.id === 'ppl-6') || PRESET_PROGRAMS.find(p => p.id === 'arnold-split-6') || PRESET_PROGRAMS[1]
    } else {
      preset = PRESET_PROGRAMS[0]
    }
  }

  return preset.routines.map(r => ({
    n: r.name,
    t: r.name.split('(')[1]?.replace(')', '') || 'Strength & Hypertrophy',
    exercises: r.exercises.map(ex => ({
      name: ex.name,
      sets: String(ex.sets),
      reps: String(ex.reps),
      badge: r.emoji === 'legs' ? 'legs' : r.emoji === 'pullup' ? 'pull' : 'push'
    }))
  }))
}

// Convert generated workout or preset program into Zustand store routines structure
export function convertPlanToStoreRoutines(workoutList) {
  const routines = []
  const week = {}

  // Filter out pure rest days
  const activeWorkouts = workoutList.filter(w => !w.r)
  const count = activeWorkouts.length

  // Day distribution: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  let daySlots = [1, 3, 5] // 3-day default: Mon, Wed, Fri
  if (count === 2) daySlots = [1, 4] // Mon, Thu
  else if (count === 4) daySlots = [1, 2, 4, 5] // Mon, Tue, Thu, Fri
  else if (count === 5) daySlots = [1, 2, 3, 4, 5] // Mon - Fri
  else if (count === 6) daySlots = [1, 2, 3, 4, 5, 6] // Mon - Sat

  activeWorkouts.forEach((w, idx) => {
    const routineId = uid()
    const routine = {
      id: routineId,
      name: w.n || w.name,
      emoji: (w.n || w.name).toLowerCase().includes('leg') ? 'legs' : (w.n || w.name).toLowerCase().includes('pull') ? 'pullup' : 'barbell',
      ex: []
    }

    w.exercises.forEach(ex => {
      const exId = findEx(ex.name)
      routine.ex.push({
        id: exId,
        sets: parseInt(ex.sets) || 3,
        reps: parseInt(String(ex.reps).split('-')[0]) || 10,
        weight: 0
      })
    })

    routines.push(routine)
    if (daySlots[idx] !== undefined) {
      week[daySlots[idx]] = routineId
    }
  })

  return { routines, week }
}
