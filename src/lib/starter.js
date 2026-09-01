// Workout Programs & Starter Routines Library
import { uid } from './format.js'
import { findEx } from './planGenerator.js'

export const PRESET_PROGRAMS = []


// Default 3-day PPL for backward compatibility
const DEFAULT_SPEC = [
  ['Push Day (Chest · Shoulders · Triceps)', 'barbell', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
  ['Pull Day (Back · Biceps · Rear Delts)', 'pullup', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
  ['Leg Day (Quads · Hamstrings · Calves)', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]]
]

// Generate fresh routine objects from any preset or default
export const starterRoutines = (programId) => {
  if (programId) {
    const prog = PRESET_PROGRAMS.find(p => p.id === programId)
    if (prog) {
      return prog.routines.map(r => ({
        id: uid(),
        name: r.name,
        emoji: r.emoji,
        ex: r.exercises.map(e => ({
          id: findEx(e.name),
          sets: e.sets,
          reps: e.reps,
          weight: e.weight || 0
        }))
      }))
    }
  }

  return DEFAULT_SPEC.map(([name, emoji, list]) => ({
    id: uid(),
    name,
    emoji,
    ex: list.map(([id, sets, reps]) => ({ id, sets, reps, weight: 0 }))
  }))
}
