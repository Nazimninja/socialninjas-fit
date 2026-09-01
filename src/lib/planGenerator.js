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
export function buildCustomDietPlan(diet, totalKcal = 2400, totalP = 140) {
  const k = totalKcal
  const p = totalP

  if (diet === 'nonveg') {
    return [
      {
        id: 'm1',
        slot: 'Breakfast',
        time: '8:00 AM',
        title: 'High-Protein Eggs & Oats/Roti',
        note: '3 Whole Eggs + 2 Egg Whites scramble in 5g ghee, 2 Multigrain Rotis or 50g Oats',
        icon: '🍳',
        kcal: Math.round(k * 0.28),
        protein: Math.round(p * 0.30),
        carbs: Math.round((k * 0.28 * 0.40) / 4),
        fat: Math.round((k * 0.28 * 0.30) / 9)
      },
      {
        id: 'm2',
        slot: 'Mid-Morning Fuel',
        time: '11:30 AM',
        title: 'Roasted Chana & Fruit Fuel',
        note: '40g Roasted Chana (1 handful) + 1 Banana or Apple + Green Tea',
        icon: '🥗',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.14),
        carbs: Math.round((k * 0.14 * 0.65) / 4),
        fat: Math.round((k * 0.14 * 0.15) / 9)
      },
      {
        id: 'm3',
        slot: 'Lunch',
        time: '1:30 PM',
        title: 'Chicken Breast & Dal Tadka Rice Bowl',
        note: '180g Chicken Breast curry / Fish curry, 1.5 cups Rice, 1 bowl Moong Dal, Cucumber Salad',
        icon: '🍱',
        kcal: Math.round(k * 0.34),
        protein: Math.round(p * 0.36),
        carbs: Math.round((k * 0.34 * 0.45) / 4),
        fat: Math.round((k * 0.34 * 0.20) / 9)
      },
      {
        id: 'm4',
        slot: 'Pre-Workout Snack',
        time: '5:00 PM',
        title: 'Peanut Butter Toast & Coffee',
        note: '2 Slices Whole Wheat Bread with 1 tbsp Peanut Butter + Black Coffee / Pre-workout',
        icon: '⚡',
        kcal: Math.round(k * 0.10),
        protein: Math.round(p * 0.08),
        carbs: Math.round((k * 0.10 * 0.55) / 4),
        fat: Math.round((k * 0.10 * 0.35) / 9)
      },
      {
        id: 'm5',
        slot: 'Dinner',
        time: '8:30 PM',
        title: 'Grilled Chicken Tikka & Dahi',
        note: '150g Grilled Chicken or Egg Curry (3 eggs), 2 Rotis, 1 bowl Thick Dahi (Curd), Green Sabzi',
        icon: '🍛',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.12),
        carbs: Math.round((k * 0.14 * 0.35) / 4),
        fat: Math.round((k * 0.14 * 0.30) / 9)
      }
    ]
  } else if (diet === 'veg') {
    return [
      {
        id: 'm1',
        slot: 'Breakfast',
        time: '8:00 AM',
        title: 'Paneer Bhurji & Multigrain Roti',
        note: '150g Low-Fat Paneer Bhurji with tomatoes & onions, 2 Multigrain Rotis, 1 Glass Milk',
        icon: '🧀',
        kcal: Math.round(k * 0.28),
        protein: Math.round(p * 0.28),
        carbs: Math.round((k * 0.28 * 0.40) / 4),
        fat: Math.round((k * 0.28 * 0.35) / 9)
      },
      {
        id: 'm2',
        slot: 'Mid-Morning Fuel',
        time: '11:30 AM',
        title: 'Sprouted Moong & Kala Chana Chaat',
        note: '1 Bowl Sprouted Moong & Chana chaat with lemon & cucumber + 10 Almonds',
        icon: '🥗',
        kcal: Math.round(k * 0.15),
        protein: Math.round(p * 0.18),
        carbs: Math.round((k * 0.15 * 0.60) / 4),
        fat: Math.round((k * 0.15 * 0.20) / 9)
      },
      {
        id: 'm3',
        slot: 'Lunch',
        time: '1:30 PM',
        title: 'Soya Chunks Curry & Dal Rice Power Bowl',
        note: '50g Soya Chunks curry (dry wt), 1 Bowl Dal Tadka, 1.5 cups Steamed Rice, 1 Bowl Dahi (Curd)',
        icon: '🍱',
        kcal: Math.round(k * 0.33),
        protein: Math.round(p * 0.34),
        carbs: Math.round((k * 0.33 * 0.50) / 4),
        fat: Math.round((k * 0.33 * 0.20) / 9)
      },
      {
        id: 'm4',
        slot: 'Pre-Workout Snack',
        time: '5:00 PM',
        title: 'Roasted Makhana & Banana',
        note: '1 Medium Banana + 1 Bowl Roasted Makhana (Foxnuts) + Black Coffee',
        icon: '⚡',
        kcal: Math.round(k * 0.10),
        protein: Math.round(p * 0.08),
        carbs: Math.round((k * 0.10 * 0.70) / 4),
        fat: Math.round((k * 0.10 * 0.15) / 9)
      },
      {
        id: 'm5',
        slot: 'Dinner',
        time: '8:30 PM',
        title: 'Paneer / Tofu Tikka & Mixed Veg Sabzi',
        note: '120g Grilled Paneer / Tofu, 2 Whole Wheat Rotis, Mixed Sabzi, 1 Bowl Curd',
        icon: '🍛',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.12),
        carbs: Math.round((k * 0.14 * 0.40) / 4),
        fat: Math.round((k * 0.14 * 0.35) / 9)
      }
    ]
  } else if (diet === 'egg') {
    return [
      {
        id: 'm1',
        slot: 'Breakfast',
        time: '8:00 AM',
        title: 'Whole Egg & White Masala Omelette',
        note: '3 Whole Eggs + 2 Egg Whites masala scramble with peppers & onions, 2 Rotis or Multigrain Toast',
        icon: '🍳',
        kcal: Math.round(k * 0.28),
        protein: Math.round(p * 0.30),
        carbs: Math.round((k * 0.28 * 0.40) / 4),
        fat: Math.round((k * 0.28 * 0.30) / 9)
      },
      {
        id: 'm2',
        slot: 'Mid-Morning Fuel',
        time: '11:30 AM',
        title: 'Boiled Egg Whites & Mixed Nuts',
        note: '2 Boiled Egg Whites + 10 Almonds & Walnuts + Green Tea',
        icon: '🥜',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.16),
        carbs: Math.round((k * 0.14 * 0.30) / 4),
        fat: Math.round((k * 0.14 * 0.40) / 9)
      },
      {
        id: 'm3',
        slot: 'Lunch',
        time: '1:30 PM',
        title: 'Egg Curry / Paneer & Dal Rice Bowl',
        note: 'Egg Curry (3 eggs) or 100g Paneer Bhurji, 1 Bowl Dal, 1.5 cups Rice, Salad',
        icon: '🍱',
        kcal: Math.round(k * 0.34),
        protein: Math.round(p * 0.34),
        carbs: Math.round((k * 0.34 * 0.45) / 4),
        fat: Math.round((k * 0.34 * 0.25) / 9)
      },
      {
        id: 'm4',
        slot: 'Pre-Workout Snack',
        time: '5:00 PM',
        title: 'Banana & Peanut Butter Fuel',
        note: '1 Medium Banana with 1 tbsp Peanut Butter + Black Coffee',
        icon: '⚡',
        kcal: Math.round(k * 0.10),
        protein: Math.round(p * 0.08),
        carbs: Math.round((k * 0.10 * 0.60) / 4),
        fat: Math.round((k * 0.10 * 0.30) / 9)
      },
      {
        id: 'm5',
        slot: 'Dinner',
        time: '8:30 PM',
        title: 'Egg Bhurji & Multigrain Roti',
        note: '3 Egg Bhurji or Soya Curry (40g soya), 2 Rotis, 1 Bowl Dahi, Green Salad',
        icon: '🍛',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.12),
        carbs: Math.round((k * 0.14 * 0.40) / 4),
        fat: Math.round((k * 0.14 * 0.30) / 9)
      }
    ]
  } else {
    // Vegan
    return [
      {
        id: 'm1',
        slot: 'Breakfast',
        time: '8:00 AM',
        title: 'Tofu Scramble & Rolled Oats',
        note: '150g Tofu Scramble with spinach & turmeric, 2 Rotis or 50g Oats with soy milk',
        icon: '🥗',
        kcal: Math.round(k * 0.28),
        protein: Math.round(p * 0.28),
        carbs: Math.round((k * 0.28 * 0.45) / 4),
        fat: Math.round((k * 0.28 * 0.25) / 9)
      },
      {
        id: 'm2',
        slot: 'Mid-Morning Fuel',
        time: '11:30 AM',
        title: 'Sprouted Moong & Chia Seed Drink',
        note: '1 Bowl Sprouted Moong & Kala Chana with lemon + 1 Glass Chia Seed Water',
        icon: '🥜',
        kcal: Math.round(k * 0.16),
        protein: Math.round(p * 0.18),
        carbs: Math.round((k * 0.16 * 0.60) / 4),
        fat: Math.round((k * 0.16 * 0.18) / 9)
      },
      {
        id: 'm3',
        slot: 'Lunch',
        time: '1:30 PM',
        title: 'Rajma / Chole Bowl with Pan-Seared Tofu',
        note: '1 Bowl Rajma or Chole, 1.5 cups Rice, 100g Pan-Seared Tofu, Garden Salad',
        icon: '🍱',
        kcal: Math.round(k * 0.32),
        protein: Math.round(p * 0.32),
        carbs: Math.round((k * 0.32 * 0.50) / 4),
        fat: Math.round((k * 0.32 * 0.20) / 9)
      },
      {
        id: 'm4',
        slot: 'Pre-Workout Snack',
        time: '5:00 PM',
        title: 'Banana & Peanut Butter Energy',
        note: '1 Banana with 1 tbsp Natural Peanut Butter + Black Coffee',
        icon: '⚡',
        kcal: Math.round(k * 0.10),
        protein: Math.round(p * 0.08),
        carbs: Math.round((k * 0.10 * 0.60) / 4),
        fat: Math.round((k * 0.10 * 0.30) / 9)
      },
      {
        id: 'm5',
        slot: 'Dinner',
        time: '8:30 PM',
        title: 'Soya Chunks Curry & Whole Wheat Roti',
        note: '1 Bowl Soya Chunks curry (50g dry soya), 2 Whole Wheat Rotis, Steamed Veggies',
        icon: '🍛',
        kcal: Math.round(k * 0.14),
        protein: Math.round(p * 0.14),
        carbs: Math.round((k * 0.14 * 0.50) / 4),
        fat: Math.round((k * 0.14 * 0.15) / 9)
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
