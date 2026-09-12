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

// Media normally sits next to the app (img/ and gif/, mounted into the web container).
// A build can point them somewhere else — the demo build pulls them off a CDN instead of
// shipping ~140 MB of images into the deployment.
const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'img/'
const GIF_BASE = import.meta.env.VITE_GIF_BASE || 'gif/'
export const imgSrc = ex => {
  if (!ex) return ''
  if (ex.thumbUrl) return ex.thumbUrl
  if (ex.img && (ex.img.startsWith('http://') || ex.img.startsWith('https://') || ex.img.startsWith('data:'))) return ex.img
  if (ex.gifUrl) return ex.gifUrl
  if (ex.img) return IMG_BASE + ex.img
  return ''
}
export const gifSrc = ex => {
  if (!ex) return ''
  if (ex.gifUrl) return ex.gifUrl
  if (ex.gif && (ex.gif.startsWith('http://') || ex.gif.startsWith('https://') || ex.gif.startsWith('data:'))) return ex.gif
  if (ex.gif) return GIF_BASE + ex.gif
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

