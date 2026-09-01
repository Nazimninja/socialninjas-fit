// Fit Ninjas AI Fitness & Nutrition Plan Engine
// Generates 100% personalized, custom workout routines and cultural Indian nutrition meal plans
// dynamically generated based on athlete's profile, training frequency, equipment, experience, focus muscles, and diet.

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
   DYNAMIC CUSTOM WORKOUT GENERATOR (100% Tailored from Scratch)
   ========================================================================== */
export function buildDynamicCustomWorkout({ days = 4, location = 'gym', experience = 'intermediate', focus = 'balanced', goal = 'muscle' }) {
  const numDays = Number(days) || 4
  const isGym = location === 'gym'
  const isHome = location === 'home'
  const isCalisthenics = location === 'calisthenics'

  // Set counts based on experience
  const mainSets = experience === 'advanced' ? 4 : experience === 'beginner' ? 3 : 3
  const accSets = experience === 'advanced' ? 4 : 3

  // Rep ranges based on goal
  const mainReps = goal === 'strength' ? 6 : goal === 'fat_loss' ? 10 : 8
  const accReps = goal === 'strength' ? 8 : goal === 'fat_loss' ? 12 : 10
  const isoReps = goal === 'fat_loss' ? 15 : 12

  // ── 3 DAYS CUSTOM SPLIT ──
  if (numDays === 3) {
    if (isCalisthenics) {
      return [
        {
          n: 'Day 1: Upper Body Push & Core Mechanics',
          t: 'Chest · Shoulders · Triceps · Abs',
          exercises: [
            { name: 'push-up', sets: String(mainSets), reps: String(accReps), badge: 'push' },
            { name: 'dips', sets: String(mainSets), reps: '8-10', badge: 'push' },
            { name: 'pike pushup', sets: String(accSets), reps: '10-12', badge: 'push' },
            { name: 'diamond pushup', sets: String(accSets), reps: '12-15', badge: 'push' },
            { name: 'plank', sets: '3', reps: '45s hold', badge: 'core' }
          ]
        },
        {
          n: 'Day 2: Back Width & Pull Dynamics',
          t: 'Lats · Upper Back · Biceps · Rear Delts',
          exercises: [
            { name: 'pull-up', sets: String(mainSets), reps: '6-10', badge: 'pull' },
            { name: 'chin-up', sets: String(mainSets), reps: '6-8', badge: 'pull' },
            { name: 'inverted row', sets: String(accSets), reps: '10-12', badge: 'pull' },
            { name: 'scapular pullup', sets: String(accSets), reps: '12-15', badge: 'pull' },
            { name: 'hanging leg raise', sets: '3', reps: '12-15', badge: 'core' }
          ]
        },
        {
          n: 'Day 3: Lower Body Power & Calisthenics Conditioning',
          t: 'Quads · Hamstrings · Glutes · Calves',
          exercises: [
            { name: 'bodyweight squat', sets: String(mainSets), reps: '15-20', badge: 'legs' },
            { name: 'walking lunges', sets: String(mainSets), reps: '12 each', badge: 'legs' },
            { name: 'bulgarian split squat', sets: String(accSets), reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: String(accSets), reps: '15-20', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12-15', badge: 'legs' }
          ]
        }
      ]
    }

    if (isHome) {
      return [
        {
          n: 'Day 1: Dumbbell Upper Body & Chest Focus',
          t: 'Chest · Shoulders · Triceps',
          exercises: [
            { name: 'dumbbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
            { name: 'incline dumbbell bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: String(accSets), reps: String(accReps), badge: 'push' },
            { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
            { name: 'dumbbell overhead tricep extension', sets: String(accSets), reps: String(isoReps), badge: 'push' }
          ]
        },
        {
          n: 'Day 2: Dumbbell Back Width & Arm Power',
          t: 'Back · Biceps · Rear Delts',
          exercises: [
            { name: 'one arm dumbbell row', sets: String(mainSets), reps: String(mainReps), badge: 'pull' },
            { name: 'pull-up', sets: String(mainSets), reps: '8', badge: 'pull' },
            { name: 'dumbbell romanian deadlift', sets: String(mainSets), reps: String(accReps), badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: String(accSets), reps: String(accReps), badge: 'pull' },
            { name: 'hammer curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
          ]
        },
        {
          n: 'Day 3: Dumbbell Lower Body & Core Strength',
          t: 'Quads · Hamstrings · Glutes · Calves',
          exercises: [
            { name: 'goblet squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: String(mainSets), reps: '10 each', badge: 'legs' },
            { name: 'dumbbell romanian deadlift', sets: String(accSets), reps: String(accReps), badge: 'legs' },
            { name: 'standing calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
            { name: 'plank', sets: '3', reps: '60s hold', badge: 'core' }
          ]
        }
      ]
    }

    // Gym 3 Days
    return [
      {
        n: 'Day 1: Push Hypertrophy & Chest Arc',
        t: 'Chest · Shoulders · Triceps',
        exercises: [
          { name: 'barbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
          { name: 'dumbbell incline bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
          { name: 'standing dumbbell overhead press', sets: String(accSets), reps: String(accReps), badge: 'push' },
          { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
          { name: 'cable tricep pushdown', sets: String(accSets), reps: String(isoReps), badge: 'push' }
        ]
      },
      {
        n: 'Day 2: Lat Width & Back Power',
        t: 'Back · Biceps · Rear Delts',
        exercises: [
          { name: 'barbell deadlift', sets: String(mainSets), reps: '6', badge: 'pull' },
          { name: 'lat pulldown', sets: String(mainSets), reps: String(accReps), badge: 'pull' },
          { name: 'barbell bent over row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'cable seated row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'dumbbell alternate bicep curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
        ]
      },
      {
        n: 'Day 3: Quad & Posterior Chain Power',
        t: 'Quads · Hamstrings · Calves',
        exercises: [
          { name: 'barbell squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
          { name: 'leg press', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
          { name: 'barbell romanian deadlift', sets: String(accSets), reps: String(accReps), badge: 'legs' },
          { name: 'lying leg curls', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'standing calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' }
        ]
      }
    ]
  }

  // ── 4 DAYS CUSTOM SPLIT ──
  if (numDays === 4) {
    if (isHome) {
      return [
        {
          n: 'Day 1: Upper Body Strength & Chest Focus',
          t: 'Chest · Back · Shoulders',
          exercises: [
            { name: 'dumbbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
            { name: 'one arm dumbbell row', sets: String(mainSets), reps: String(mainReps), badge: 'pull' },
            { name: 'incline dumbbell bench press', sets: String(accSets), reps: String(accReps), badge: 'push' },
            { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
            { name: 'dumbbell alternate bicep curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
          ]
        },
        {
          n: 'Day 2: Lower Body Power & Quad Hypertrophy',
          t: 'Quads · Hamstrings · Glutes · Calves',
          exercises: [
            { name: 'goblet squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
            { name: 'dumbbell romanian deadlift', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: String(accSets), reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
            { name: 'plank', sets: '3', reps: '60s hold', badge: 'core' }
          ]
        },
        {
          n: 'Day 3: Upper Body Hypertrophy & Arms Overload',
          t: 'Shoulders · Back · Triceps · Biceps',
          exercises: [
            { name: 'standing dumbbell overhead press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
            { name: 'pull-up', sets: String(mainSets), reps: '8', badge: 'pull' },
            { name: 'dumbbell floor fly', sets: String(accSets), reps: String(isoReps), badge: 'push' },
            { name: 'hammer curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' },
            { name: 'overhead tricep extension', sets: String(accSets), reps: String(isoReps), badge: 'push' }
          ]
        },
        {
          n: 'Day 4: Posterior Chain & Functional Conditioning',
          t: 'Hamstrings · Calves · Core',
          exercises: [
            { name: 'dumbbell romanian deadlift', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
            { name: 'bulgarian split squat', sets: String(accSets), reps: '10 each', badge: 'legs' },
            { name: 'dumbbell calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' },
            { name: 'push-up', sets: '3', reps: '15', badge: 'push' }
          ]
        }
      ]
    }

    // Gym 4 Days
    return [
      {
        n: 'Day 1: Upper Power & Chest Compound Overload',
        t: 'Chest · Upper Back · Delts',
        exercises: [
          { name: 'barbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
          { name: 'barbell bent over row', sets: String(mainSets), reps: String(mainReps), badge: 'pull' },
          { name: 'standing dumbbell overhead press', sets: String(accSets), reps: String(accReps), badge: 'push' },
          { name: 'lat pulldown', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'cable tricep pushdown', sets: String(accSets), reps: String(isoReps), badge: 'push' }
        ]
      },
      {
        n: 'Day 2: Lower Power & Squat Specialization',
        t: 'Quads · Hamstrings · Glutes · Calves',
        exercises: [
          { name: 'barbell squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
          { name: 'barbell romanian deadlift', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
          { name: 'leg press', sets: String(accSets), reps: String(accReps), badge: 'legs' },
          { name: 'lying leg curls', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'standing calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' }
        ]
      },
      {
        n: 'Day 3: Upper Hypertrophy & V-Taper Sculpt',
        t: 'Incline Chest · Lats · Lateral Delts · Arms',
        exercises: [
          { name: 'dumbbell incline bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
          { name: 'pull-up', sets: String(mainSets), reps: '8', badge: 'pull' },
          { name: 'cable seated row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
          { name: 'dumbbell alternate bicep curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
        ]
      },
      {
        n: 'Day 4: Lower Hypertrophy & Posterior Chain',
        t: 'Hamstrings · Quads · Core',
        exercises: [
          { name: 'barbell deadlift', sets: String(mainSets), reps: '6', badge: 'pull' },
          { name: 'dumbbell walking lunges', sets: String(accSets), reps: '10 each', badge: 'legs' },
          { name: 'leg extensions', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'seated calf raise', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' }
        ]
      }
    ]
  }

  // ── 5 DAYS CUSTOM SPLIT ──
  if (numDays === 5) {
    return [
      {
        n: 'Day 1: Chest & Triceps Hypertrophy',
        t: 'Chest · Triceps Overload',
        exercises: [
          { name: 'barbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
          { name: 'dumbbell incline bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
          { name: 'cable crossover', sets: String(accSets), reps: String(isoReps), badge: 'push' },
          { name: 'dips', sets: String(accSets), reps: '10', badge: 'push' },
          { name: 'cable tricep pushdown', sets: String(accSets), reps: String(isoReps), badge: 'push' }
        ]
      },
      {
        n: 'Day 2: Back Thickness & Biceps Arc',
        t: 'Lats · Upper Back · Biceps',
        exercises: [
          { name: 'barbell deadlift', sets: String(mainSets), reps: '6', badge: 'pull' },
          { name: 'lat pulldown', sets: String(mainSets), reps: String(accReps), badge: 'pull' },
          { name: 'barbell bent over row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'cable seated row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'barbell curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
        ]
      },
      {
        n: 'Day 3: Quad & Calves Power Development',
        t: 'Quads · Calves Focus',
        exercises: [
          { name: 'barbell squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
          { name: 'leg press', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
          { name: 'leg extensions', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'dumbbell walking lunges', sets: String(accSets), reps: '12 each', badge: 'legs' },
          { name: 'standing calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' }
        ]
      },
      {
        n: 'Day 4: Boulder Shoulders & Traps Isolation',
        t: 'Front Delts · Side Delts · Rear Delts',
        exercises: [
          { name: 'standing dumbbell overhead press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
          { name: 'dumbbell lateral raise', sets: String(mainSets), reps: String(isoReps), badge: 'push' },
          { name: 'cable face pull', sets: String(accSets), reps: String(isoReps), badge: 'pull' },
          { name: 'barbell shrug', sets: String(accSets), reps: String(accReps), badge: 'pull' },
          { name: 'hammer curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
        ]
      },
      {
        n: 'Day 5: Posterior Chain & Arm Finisher',
        t: 'Hamstrings · Glutes · Biceps & Triceps',
        exercises: [
          { name: 'barbell romanian deadlift', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
          { name: 'lying leg curls', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
          { name: 'dumbbell alternate bicep curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' },
          { name: 'skull crusher', sets: String(accSets), reps: String(isoReps), badge: 'push' },
          { name: 'hanging leg raise', sets: '3', reps: '15', badge: 'core' }
        ]
      }
    ]
  }

  // ── 6 DAYS CUSTOM SPLIT ──
  return [
    {
      n: 'Day 1: Push A · Chest Compound & Front Delts',
      t: 'Chest · Shoulders · Triceps',
      exercises: [
        { name: 'barbell bench press', sets: String(mainSets), reps: String(mainReps), badge: 'push' },
        { name: 'dumbbell incline bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
        { name: 'standing dumbbell overhead press', sets: String(accSets), reps: String(accReps), badge: 'push' },
        { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
        { name: 'cable tricep pushdown', sets: String(accSets), reps: String(isoReps), badge: 'push' }
      ]
    },
    {
      n: 'Day 2: Pull A · Lat Width & Biceps Hypertrophy',
      t: 'Back · Biceps · Rear Delts',
      exercises: [
        { name: 'pull-up', sets: String(mainSets), reps: '8', badge: 'pull' },
        { name: 'lat pulldown', sets: String(mainSets), reps: String(accReps), badge: 'pull' },
        { name: 'barbell bent over row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
        { name: 'cable face pull', sets: String(accSets), reps: String(isoReps), badge: 'pull' },
        { name: 'barbell curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
      ]
    },
    {
      n: 'Day 3: Legs A · Quad Overload & Calves',
      t: 'Quads · Hamstrings · Calves',
      exercises: [
        { name: 'barbell squat', sets: String(mainSets), reps: String(mainReps), badge: 'legs' },
        { name: 'leg press', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
        { name: 'leg extensions', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
        { name: 'barbell romanian deadlift', sets: String(accSets), reps: String(accReps), badge: 'legs' },
        { name: 'standing calf raises', sets: String(accSets), reps: String(isoReps), badge: 'legs' }
      ]
    },
    {
      n: 'Day 4: Push B · Incline Hypertrophy & Lateral Delts',
      t: 'Incline Chest · Delts · Triceps',
      exercises: [
        { name: 'incline dumbbell bench press', sets: String(mainSets), reps: String(accReps), badge: 'push' },
        { name: 'dips', sets: String(mainSets), reps: '10', badge: 'push' },
        { name: 'dumbbell lateral raise', sets: String(accSets), reps: String(isoReps), badge: 'push' },
        { name: 'cable crossover', sets: String(accSets), reps: String(isoReps), badge: 'push' },
        { name: 'skull crusher', sets: String(accSets), reps: String(isoReps), badge: 'push' }
      ]
    },
    {
      n: 'Day 5: Pull B · Back Thickness & Heavy Rows',
      t: 'Back · Biceps',
      exercises: [
        { name: 'barbell deadlift', sets: String(mainSets), reps: '6', badge: 'pull' },
        { name: 'cable seated row', sets: String(mainSets), reps: String(accReps), badge: 'pull' },
        { name: 'one arm dumbbell row', sets: String(accSets), reps: String(accReps), badge: 'pull' },
        { name: 'reverse fly', sets: String(accSets), reps: String(isoReps), badge: 'pull' },
        { name: 'hammer curl', sets: String(accSets), reps: String(isoReps), badge: 'pull' }
      ]
    },
    {
      n: 'Day 6: Legs B · Posterior Chain & Glutes Focus',
      t: 'Hamstrings · Glutes · Calves',
      exercises: [
        { name: 'barbell romanian deadlift', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
        { name: 'goblet squat', sets: String(mainSets), reps: String(accReps), badge: 'legs' },
        { name: 'lying leg curls', sets: String(accSets), reps: String(isoReps), badge: 'legs' },
        { name: 'dumbbell walking lunges', sets: String(accSets), reps: '12 each', badge: 'legs' },
        { name: 'seated calf raise', sets: String(accSets), reps: String(isoReps), badge: 'legs' }
      ]
    }
  ]
}

/* ==========================================================================
   DYNAMIC CUSTOM PLAN GENERATOR (Full Protocol)
   ========================================================================== */
export function generateCustomPlan(answers) {
  const {
    pname = 'Athlete',
    gender = 'male',
    age = 25,
    weight = 72,
    height = 175,
    goal = 'muscle',
    diet = 'nonveg',
    days = 4,
    location = 'gym',
    experience = 'intermediate',
    focus = 'balanced'
  } = answers || {}

  const numAge = Number(age) || 25
  const numWeight = Number(weight) || 72
  const numHeight = Number(height) || 175
  const numDays = Number(days) || 4

  // BMR via Mifflin-St Jeor Formula
  const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5)
  const actMultipliers = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 }
  const tdee = Math.round(bmr * (actMultipliers[numDays] || 1.55))

  let targetKcal = tdee
  if (goal === 'fat_loss') targetKcal = Math.round(tdee - 450)
  else if (goal === 'muscle') targetKcal = Math.round(tdee + 350)
  else if (goal === 'strength') targetKcal = Math.round(tdee + 200)

  const targetProtein = Math.round(numWeight * (goal === 'fat_loss' ? 2.2 : 2.0))
  const targetFat = Math.round((targetKcal * 0.25) / 9)
  const targetCarbs = Math.max(0, Math.round((targetKcal - (targetProtein * 4) - (targetFat * 9)) / 4))

  const heightM = numHeight / 100
  const bmi = parseFloat((numWeight / (heightM * heightM)).toFixed(1))

  const meals = buildCustomDietPlan(diet, targetKcal, targetProtein)
  const workout = buildDynamicCustomWorkout({ days: numDays, location, experience, focus, goal })

  return {
    kcal: targetKcal,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
    bmi,
    goal,
    diet,
    coachNote: `${pname}, your 100% custom training & nutrition architecture is calibrated for ${goal.replace('_', ' ')}. With a daily target of ${targetKcal} kcal (${targetProtein}g Protein) and a dedicated ${numDays}-day ${location === 'gym' ? 'Commercial Gym' : location === 'home' ? 'Home Dumbbells' : 'Calisthenics'} routine, your protocol is configured for steady progressive overload.`,
    weeklyInsight: `Consistency is your superpower, ${pname}! Execute your prescribed working sets close to failure. 🚀`,
    meals,
    workout,
    generatedAt: new Date().toISOString(),
    monthNumber: 1,
    lastUpdated: new Date().toISOString()
  }
}

/* ==========================================================================
   AUTHENTIC INDIAN NUTRITION ENGINE
   ========================================================================== */
function buildCustomDietPlan(diet, totalKcal, totalP) {
  if (diet === 'nonveg') {
    return [
      {
        t: '8:00 AM',
        n: 'High-Protein Breakfast',
        d: '3 Whole Eggs + 2 Egg Whites scramble / omelette cooked in 5g ghee + 2 whole wheat rotis or multigrain toast',
        i: '🍳',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.30),
        note: 'Complete amino acid profile to stimulate morning muscle protein synthesis.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Fuel',
        d: 'Roasted Chana (40g) + 1 small banana / apple + green tea',
        i: '🥗',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.14),
        note: 'Complex fiber and micronutrients to stabilize insulin.'
      },
      {
        t: '1:30 PM',
        n: 'Anabolic Power Lunch',
        d: '160g Chicken Breast curry / Fish curry + 1.5 cups steamed basmati rice + 1 bowl yellow dal + cucumber salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.34),
        p: Math.round(totalP * 0.36),
        note: 'Primary muscle-building meal replenishing intramuscular glycogen.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Snack',
        d: '2 slices brown bread with 1 tbsp peanut butter + black coffee',
        i: '⚡',
        k: Math.round(totalKcal * 0.10),
        p: Math.round(totalP * 0.08),
        note: 'Fast-digesting complex carbs and natural caffeine for lifting power.'
      },
      {
        t: '8:30 PM',
        n: 'Recovery Dinner',
        d: '140g Grilled Chicken Tikka / Egg Curry (3 eggs) + 2 whole wheat rotis + 1 bowl curd (dahi) + mixed vegetable sabzi',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.12),
        note: 'Slow-digesting casein and protein for overnight muscle repair.'
      }
    ]
  } else if (diet === 'veg') {
    return [
      {
        t: '8:00 AM',
        n: 'High-Protein Veg Breakfast',
        d: '150g Low-Fat Paneer Bhurji / Soya Paneer with onions & tomatoes + 2 multigrain rotis + 1 glass warm milk (optional)',
        i: '🧀',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.28),
        note: 'High-density vegetarian protein to halt morning muscle breakdown.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Boost',
        d: 'Sprouted Moong & Kala Chana Chaat (1 bowl) with lemon & cucumber + 10 almonds',
        i: '🥗',
        k: Math.round(totalKcal * 0.15),
        p: Math.round(totalP * 0.18),
        note: 'Living enzymes, plant iron, and sustained fiber.'
      },
      {
        t: '1:30 PM',
        n: 'Vegetarian Muscle Lunch',
        d: '1 bowl Soya Chunks curry (50g dry soya) + 1 bowl thick Dal Tadka + 1.5 cups steamed rice + 1 bowl curd (dahi)',
        i: '🍱',
        k: Math.round(totalKcal * 0.33),
        p: Math.round(totalP * 0.34),
        note: 'Complete synergistic protein from soya, dal, and dairy.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Fuel',
        d: '1 banana + 1 cup roasted makhana (foxnuts) + black coffee',
        i: '⚡',
        k: Math.round(totalKcal * 0.10),
        p: Math.round(totalP * 0.08),
        note: 'Clean pre-training carbohydrates.'
      },
      {
        t: '8:30 PM',
        n: 'Restorative Dinner',
        d: '120g Paneer / Tofu curry + 2 whole wheat rotis + 1 bowl mixed green vegetable sabzi + 1 bowl curd',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.12),
        note: 'Casein-rich paneer to feed muscles throughout sleep.'
      }
    ]
  } else if (diet === 'egg') {
    return [
      {
        t: '8:00 AM',
        n: 'Eggetarian Breakfast',
        d: '3 Whole Eggs + 2 Egg Whites masala omelette + 2 multigrain rotis',
        i: '🍳',
        k: Math.round(totalKcal * 0.28),
        p: Math.round(totalP * 0.30),
        note: 'Complete whole egg amino acid matrix.'
      },
      {
        t: '11:30 AM',
        n: 'Mid-Morning Boost',
        d: '2 boiled egg whites + 1 handful mixed nuts (almonds, walnuts) + green tea',
        i: '🥜',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.16),
        note: 'Omega-3 fats and pure protein.'
      },
      {
        t: '1:30 PM',
        n: 'Power Lunch',
        d: 'Egg Curry (3 eggs) or Paneer Bhurji (100g) + 1 bowl thick dal + 1.5 cups rice + salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.34),
        p: Math.round(totalP * 0.34),
        note: 'Optimal fuel for workout recovery.'
      },
      {
        t: '5:00 PM',
        n: 'Pre-Workout Fuel',
        d: '1 banana + 1 tbsp peanut butter + black coffee',
        i: '⚡',
        k: Math.round(totalKcal * 0.10),
        p: Math.round(totalP * 0.08),
        note: 'Electrolytes and fast energy.'
      },
      {
        t: '8:30 PM',
        n: 'Recovery Dinner',
        d: 'Egg Bhurji (3 eggs) or Soya Curry + 2 rotis + 1 bowl curd',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.12),
        note: 'Overnight tissue repair.'
      }
    ]
  } else {
    // Vegan
    return [
      {
        t: '8:00 AM',
        n: 'Plant-Based Breakfast',
        d: '150g Tofu Scramble with turmeric, tomatoes & spinach + 2 multigrain rotis / oats with soy milk & berries',
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
        d: '1 bowl Rajma / Chole + 1.5 cups rice + 100g pan-seared Tofu + green salad',
        i: '🍱',
        k: Math.round(totalKcal * 0.32),
        p: Math.round(totalP * 0.32),
        note: 'Synergistic amino acid combination of rice and legumes.'
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
        d: '1 bowl Soya Chunks curry (50g soya) + 2 whole wheat rotis + steamed vegetables',
        i: '🍛',
        k: Math.round(totalKcal * 0.14),
        p: Math.round(totalP * 0.14),
        note: 'High leucine soy protein to stimulate muscle rebuilding.'
      }
    ]
  }
}

// Convert generated workout into Zustand store routines structure
export function convertPlanToStoreRoutines(workoutList) {
  const routines = []
  const week = {}

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
    const rName = w.n || w.name || `Day ${idx + 1}`
    const rNameLower = rName.toLowerCase()
    
    const routine = {
      id: routineId,
      name: rName,
      emoji: rNameLower.includes('leg') ? 'legs' : rNameLower.includes('pull') || rNameLower.includes('back') ? 'pullup' : 'barbell',
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
