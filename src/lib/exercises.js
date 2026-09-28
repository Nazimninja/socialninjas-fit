import { EXDB } from './exercises-data.js'
import { t } from './i18n.js'

export { EXDB }
export const EXIDX = {}
EXDB.forEach(e => { EXIDX[e.id] = e })
export const BODYPARTS = [...new Set(EXDB.map(e => e.bp).filter(Boolean))].sort()

function refreshBodyparts() {
  const parts = [...new Set(EXDB.map(e => e.bp).filter(Boolean))].sort()
  BODYPARTS.length = 0
  BODYPARTS.push(...parts)
}

// Master 4,029 exercise database integration
let masterLoaded = false
const subscribers = new Set()

export function onExercisesLoaded(fn) {
  if (typeof fn !== 'function') return () => {}
  if (masterLoaded) {
    fn(EXDB)
    return () => {}
  }
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export async function initMasterExercises() {
  if (masterLoaded) return
  try {
    const res = await fetch('/data/exercises_master.json')
    if (!res.ok) return
    const master = await res.json()
    if (!Array.isArray(master)) return

    master.forEach(item => {
      const existing = EXIDX[item.id]
      if (existing) {
        if (item.description && !existing.desc) existing.desc = item.description
        if (item.gifUrl && !existing.gifUrl) existing.gifUrl = item.gifUrl
        if (item.thumbUrl && !existing.thumbUrl) existing.thumbUrl = item.thumbUrl
        if (item.instructions && item.instructions.length && (!existing.st || !existing.st.length)) existing.st = item.instructions
        return
      }

      const bpNorm = (item.bodyPart || item.muscleGroup || 'other').toLowerCase()
      const tgNorm = (item.muscle || 'general').toLowerCase()
      const eqNorm = (item.equipment || 'body weight').toLowerCase()

      const ex = {
        id: item.id,
        n: item.name,
        bp: bpNorm,
        tg: tgNorm,
        eq: eqNorm,
        sm: item.secondaryMuscles || [],
        st: item.instructions || [],
        desc: item.description || '',
        gifUrl: item.gifUrl || '',
        thumbUrl: item.thumbUrl || '',
        img: item.thumbUrl || item.gifUrl || '',
        gif: item.gifUrl || ''
      }
      EXDB.push(ex)
      EXIDX[ex.id] = ex
    })

    refreshBodyparts()
    masterLoaded = true
    subscribers.forEach(cb => {
      try { cb(EXDB) } catch (e) {}
    })
  } catch (err) {
    console.warn('Master exercises lazy fetch note:', err)
  }
}

if (typeof window !== 'undefined') {
  setTimeout(initMasterExercises, 100)
}

// Equipment options present in a given list of exercises, most common first (issue #6).
// Deriving them from the *already filtered* list keeps the chip row short and means
// every body-part × equipment combination on screen has results behind it.
export function equipmentOf(list) {
  const c = {}
  list.forEach(e => { if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1 })
  return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1))
}

// Custom (user-created) exercises live in synced state S.customEx (issue #11) and are
// merged into the id index here so every EXIDX[id] lookup keeps working unchanged.
let customIds = []
export function registerCustom(list) {
  customIds.forEach(id => delete EXIDX[id])
  customIds = (list || []).map(e => e.id)
  ;(list || []).forEach(e => { EXIDX[e.id] = e })
}
// Full searchable catalogue — customs first so your own exercises are easy to find.
export const allExercises = st => [...(st?.customEx || []), ...EXDB]

// Canonical staple mapping: everyday gym names -> rich EXDB items with guaranteed HD GIFs
export const STAPLE_EXERCISE_MAP = {
  // Squats
  'barbell back squat': '0043',
  'barbell back squats': '0043',
  'barbell back squat to box': '0041',
  'barbell full squat': '0043',
  'barbell squat': '0043',
  'barbell squats': '0043',
  'king maker barbell back squat': '0043',
  'un barbell back squat': '0043',
  'am barbell squat': '0043',
  'am bodyweight squat': '3543',
  'bodyweight squat': '3543',
  'air squat': '3543',
  'goblet squat': '1760',
  'dumbbell goblet squat': '1760',
  'dumbbell squat': '0413',
  'dumbbell squats': '0413',
  'split squat': '2368',
  'split squats': '2368',
  'bulgarian split squat': '2368',
  'hack squat': '0743',
  'sled hack squat': '0743',
  'zercher squat': '0127',
  'barbell zercher squat': '0127',
  'front squat': '0041',
  'barbell front squat': '0041',

  // Biceps
  'dumbbell bicep curl': '0416',
  'dumbbell bicep curls': '0416',
  'dumbbell biceps curl': '0416',
  'dumbbell alternate bicep curl': '0285',
  'dumbbell alternate biceps curl': '0285',
  'dumbbell alternating bicep curl': '0285',
  'dumbbell alternating biceps curl': '0285',
  'alternating biceps curl': '0285',
  'alternating bicep curl': '0285',
  'alternate hammer curl': '0313',
  'alternating hammer curl': '0313',
  'dumbbell hammer curl': '0313',
  'hammer curl': '0313',
  'hammer curls': '0313',
  'am cable biceps curl': '0240',
  'cable bicep curl': '0240',
  'cable biceps curl': '0240',
  'cable curl': '0240',
  'barbell curl': '0031',
  'barbell bicep curl': '0031',
  'barbell biceps curl': '0031',
  'incline dumbbell curl': '0314',
  'incline dumbbell bicep curl': '0314',
  'dumbbell preacher curl': '0372',
  'preacher curl': '0372',
  'barbell preacher curl': '0059',
  'concentration curl': '0418',
  'dumbbell concentration curl': '0418',
  'zottman curl': '0439',
  'dumbbell zottman curl': '0439',
  'spider curl': '1667',
  'dumbbell curl': '0416',
  'dumbbell curls': '0416',
  'bicep curl': '0416',
  'biceps curl': '0416',

  // Chest / Bench Press
  'barbell bench press': '0025',
  'bench press': '0025',
  'flat bench press': '0025',
  'flat barbell bench press': '0025',
  'flat bench barbell press': '0025',
  'am flat bench barbell press': '0025',
  'am dumbbell bench press': '0289',
  'dumbbell bench press': '0289',
  'incline barbell bench press': '0047',
  'incline bench press': '0047',
  'incline barbell press': '0047',
  'incline dumbbell press': '0314',
  'incline dumbbell bench press': '0314',
  'dumbbell incline bench press': '0314',
  'decline barbell bench press': '0033',
  'decline bench press': '0033',
  'decline dumbbell press': '0302',
  'push-up': '0662',
  'push up': '0662',
  'pushups': '0662',
  'push-ups': '0662',
  'chest dip': '0251',
  'chest dips': '0251',
  'dips': '0251',
  'dumbbell fly': '0308',
  'dumbbell chest fly': '0308',
  'cable crossover': '1269',
  'cable fly': '1269',
  'pec deck': '0596',
  'pec dec': '0596',

  // Back / Pull
  'deadlift': '0032',
  'barbell deadlift': '0032',
  'conventional deadlift': '0032',
  'romanian deadlift': '0085',
  'barbell romanian deadlift': '0085',
  'dumbbell romanian deadlift': '0380',
  'rdl': '0085',
  'sumo deadlift': '0117',
  'barbell sumo deadlift': '0117',
  'barbell bent over row': '0027',
  'barbell row': '0027',
  'bent over row': '0027',
  'dumbbell row': '0292',
  'one arm dumbbell row': '0292',
  'single arm dumbbell row': '0292',
  'seated cable row': '0213',
  'cable seated row': '0213',
  'cable row': '0213',
  'cable lat pulldown': '2330',
  'lat pulldown': '2330',
  'pull up': '0652',
  'pull-up': '0652',
  'pullups': '0652',
  'pull-ups': '0652',
  'chin up': '1326',
  'chin-up': '1326',
  'chinups': '1326',
  'chin-ups': '1326',
  'inverted row': '0499',
  'australian pull-up': '0499',

  // Shoulders
  'barbell standing overhead press': '0070',
  'overhead press': '0070',
  'military press': '0070',
  'barbell shoulder press': '0070',
  'dumbbell shoulder press': '0426',
  'dumbbell standing overhead press': '0426',
  'dumbbell seated shoulder press': '0395',
  'am dumbbell shoulder press': '0426',
  'dumbbell lateral raise': '0334',
  'lateral raise': '0334',
  'side lateral raise': '0334',
  'side raise': '0334',
  'dumbbell front raise': '0310',
  'front raise': '0310',
  'dumbbell rear lateral raise': '0380',
  'rear delt fly': '0380',
  'arnold press': '0286',
  'dumbbell arnold press': '0286',
  'upright row': '0115',
  'barbell upright row': '0115',
  'cable lateral raise': '0179',

  // Legs / Lower
  'sled 45° leg press': '0739',
  'leg press': '0739',
  '45 degree leg press': '0739',
  'am leg press': '0739',
  'lever leg extension': '0585',
  'leg extension': '0585',
  'leg extensions': '0585',
  'quad extension': '0585',
  'lever lying leg curl': '0586',
  'lying leg curl': '0586',
  'lying leg curls': '0586',
  'leg curl': '0586',
  'leg curls': '0586',
  'hamstring curl': '0586',
  'lever seated leg curl': '0601',
  'seated leg curl': '0601',
  'bodyweight standing calf raise': '1373',
  'standing calf raise': '1373',
  'calf raise': '1373',
  'calf raises': '1373',
  'lever seated calf raise': '0738',
  'seated calf raise': '0738',
  'walking lunge': '1460',
  'walking lunges': '1460',
  'dumbbell walking lunges': '0434',
  'lunges': '1460',
  'lunge': '1460',
  'glute bridge': '3013',

  // Triceps
  'cable pushdown': '0241',
  'cable tricep pushdown': '0241',
  'cable triceps pushdown': '0241',
  'tricep pushdown': '0241',
  'triceps pushdown': '0241',
  'tricep push-down': '0241',
  'triceps push-down': '0241',
  'am bar triceps push-down': '0241',
  'am rope triceps pushdown': '0241',
  'barbell lying triceps extension': '0060',
  'skull crusher': '0060',
  'skullcrusher': '0060',
  'am skullcrusher': '0060',
  'barbell skull crusher': '0060',
  'dumbbell standing triceps extension': '0424',
  'overhead tricep extension': '0424',
  'dumbbell overhead tricep extension': '0424',
  'bench dip': '0129',
  'tricep dip': '0129',
  'tricep dips': '0129',
  'close grip bench press': '0030',
  'barbell close grip bench press': '0030',
  'dumbbell kickback': '0338',
  'tricep kickback': '0338',

  // Core
  'crunch': '0274',
  'crunches': '0274',
  'ab crunch': '0274',
  'am ball crunch': '0274',
  'cable kneeling crunch': '0175',
  'cable crunch': '0175',
  'am cable crunch': '0175',
  'hanging leg raise': '0472',
  'hanging leg raises': '0472',
  'leg raise': '0472',
  'front plank': '0464',
  'plank': '0464',
  '3/4 sit-up': '0001',
  'sit-up': '0001'
}

// Media fallback resolver: guarantees that exercises never appear without an animated demo
export const resolveExerciseFallback = ex => {
  if (!ex) return null
  const name = (ex.n || ex.name || '').toLowerCase().trim()
  if (!name) return null

  // 1. Direct staple dictionary match
  const stapleId = STAPLE_EXERCISE_MAP[name]
  if (stapleId && EXIDX[stapleId]) {
    return EXIDX[stapleId]
  }

  // 2. Cleaned name check (remove fluff words)
  const cleaned = name
    .replace(/^(am|pm|30\s*degree|30|3d|acft)\s+/i, '')
    .replace(/-\s*(gethin|krissy cela|arnold|crossfit).*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim()
  const cleanStapleId = STAPLE_EXERCISE_MAP[cleaned]
  if (cleanStapleId && EXIDX[cleanStapleId]) {
    return EXIDX[cleanStapleId]
  }

  // 3. Search EXDB for closest exercise that has verified media
  const words = cleaned.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && w !== 'and' && w !== 'with')
  if (words.length >= 2) {
    const candidate = EXDB.find(e => (e.gif || e.gifUrl) && words.every(w => e.n.toLowerCase().includes(w)))
    if (candidate) return candidate
  }

  return null
}

// Media normally sits next to the app (img/ and gif/, mounted into the web container).
// A build can point them somewhere else — the demo build pulls them off a CDN instead of
// shipping ~140 MB of images into the deployment.
const IMG_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IMG_BASE) || 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/'
const GIF_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIF_BASE) || 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/'

export const imgSrc = ex => {
  if (!ex) return ''
  if (ex.thumbUrl) return ex.thumbUrl
  if (ex.img && (ex.img.startsWith('http://') || ex.img.startsWith('https://') || ex.img.startsWith('data:'))) return ex.img
  if (ex.gifUrl) return ex.gifUrl
  if (ex.img) return IMG_BASE + ex.img

  // Intelligent fallback for basic exercises
  const fallback = resolveExerciseFallback(ex)
  if (fallback && fallback !== ex) {
    return imgSrc(fallback)
  }
  return ''
}

export const gifSrc = ex => {
  if (!ex) return ''
  if (ex.gifUrl) return ex.gifUrl
  if (ex.gif && (ex.gif.startsWith('http://') || ex.gif.startsWith('https://') || ex.gif.startsWith('data:'))) return ex.gif
  if (ex.gif) return GIF_BASE + ex.gif

  // Intelligent fallback for basic exercises
  const fallback = resolveExerciseFallback(ex)
  if (fallback && fallback !== ex) {
    return gifSrc(fallback)
  }
  return imgSrc(ex)
}

// Cardio exercises log time + speed instead of weight × reps.
export const isCardio = idOrEx => (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.bp === 'cardio'

// Exercises the dataset already knows carry no external load (issue #32) — a quarter of the
// catalogue. This seeds the `bw` flag on a fresh config so a push-up never asks for a weight
// nobody was going to enter. It is only the default: the flag lives on the config, so a dip
// done with a belt can turn it off and a custom exercise can turn it on.
export const isBodyweightEq = idOrEx =>
  (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.eq === 'body weight'

// An id that resolves to nothing — a plan file built against a different exercise dataset,
// a custom exercise deleted on another device before the sync arrived — still has to
// render. A placeholder keeps it visible (and removable) instead of taking the whole view
// down on the first `ex.n`.
export const exOr = id => EXIDX[id] ||
  { id, n: t('Unknown exercise'), bp: '', tg: '', eq: '', sm: [], st: [], missing: true }


