import { create } from 'zustand'
import { api, supabase } from '../lib/api.js'
import { localTZ } from '../lib/format.js'
import { registerCustom, EXIDX, EXDB } from '../lib/exercises.js'
import { DEMO, DEMO_SEEDED } from '../lib/demo.js'
import { MOBILE, nativeLoad, nativeSave, syncReminder } from '../lib/mobile.js'

const KEY = 'gym_state_v1'
export const DEF = {
  unit: 'kg', restSec: 90, sound: true, keepAwake: true, lang: 'en',
  theme: 'dark', accent: 'sky', body: 'male', targetW: null,
  bodyweight: [], routines: [], week: {}, dayPlan: {},
  exWeights: {}, workouts: [], active: null, customEx: [], gifSize: 'full',
  reminder: { on: false, time: '08:00', tz: null }, effort: null,
  // AI coach fields
  onboarded: false,    // true once user has completed initial onboarding & plan setup
  aiPlan: null,        // latest AI-generated nutrition plan { kcal, protein, carbs, fat, meals[], coachNote, ... }
  aiAnswers: null,     // onboarding answers used to generate the plan { pname, age, weight, height, gender, goal, days, location, diet }
  checkins: [],        // weekly & post-workout check-ins [{ id, date, weight, difficulty, soreness, dietRating, notes, photos[] }]
  photos: [],          // physique progress photos [{ id, date, weight, photoUrl, label, notes }]
  aiCoachCard: null,   // latest AI coach message to show on Home { coachNote, changes[], weeklyInsight, celebration, seenAt }
  loggedMeals: {},     // daily logged meals { 'YYYY-MM-DD': [{ id, mealType, title, kcal, protein, carbs, fat, completed }] }
}
const clone = o => JSON.parse(JSON.stringify(o))

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return Object.assign(clone(DEF), JSON.parse(raw))
  } catch (e) { /* ignore */ }
  return clone(DEF)
}

const hasData = st => !!(
  (st.workouts || []).length ||
  (st.routines || []).length ||
  (st.bodyweight || []).length ||
  st.aiPlan ||
  st.onboarded
)

export const useStore = create((set, get) => {
  let pushTm = null
  let saveTm = null

  // Mobile build: mirror the state into a file in the app's data directory (survives WebView
  // storage eviction) and keep the native reminder schedule in step with the weekly plan.
  const nativePersist = () => {
    clearTimeout(saveTm)
    saveTm = setTimeout(() => { saveTm = null; nativeSave(get().S); syncReminder(get().S) }, 800)
  }

  const persist = (S, push = true) => {
    S._ts = Date.now()
    registerCustom(S.customEx)
    localStorage.setItem(KEY, JSON.stringify(S))
    set({ S })
    if (MOBILE) nativePersist()
    if (push && get().user) {
      clearTimeout(pushTm)
      pushTm = setTimeout(() => get().pushState(), 1500)
    }
  }

  // Automatic background synchronization:
  // - When app is backgrounded/hidden: flush local changes immediately to cloud (pushState)
  // - When app is foregrounded/opened: silently pull latest changes from cloud (pullState)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (MOBILE && saveTm) {
        clearTimeout(saveTm)
        saveTm = null
        nativeSave(get().S)
      }
      if (pushTm) {
        clearTimeout(pushTm)
        pushTm = null
      }
      get().pushState()
    } else if (document.visibilityState === 'visible') {
      get().pullState()
    }
  })

  // Window focus listener for desktop and multi-tab sync
  window.addEventListener('focus', () => {
    get().pullState()
  })

  // Everything a sign-out leaves behind on this device, whichever way it was triggered.
  const clearLocalSession = () => {
    get().setUser(null)
    get().setPaid(false)
    try { supabase.auth.signOut() } catch(e) {}
    localStorage.removeItem('gym_guest')
    localStorage.removeItem('gym_dirty')
    localStorage.removeItem('gym_paid')
    localStorage.removeItem('gym_paid_email')
    localStorage.removeItem('gym_user')
    localStorage.removeItem(KEY)
    persist(clone(DEF), false)
  }

  return {
    S: (() => { const s = loadState(); registerCustom(s.customEx); return s })(),
    user: (() => { try { return JSON.parse(localStorage.getItem('gym_user')) || null } catch { return null } })(),
    paid: (() => {
      try {
        const u = JSON.parse(localStorage.getItem('gym_user') || 'null')
        return !!(u && u.paid)
      } catch {
        return false
      }
    })(),
    ready: false,

    // Mutate a draft of S via producer fn, then persist + schedule sync.
    update(mut, push = true) {
      const S = clone(get().S)
      mut(S)
      persist(S, push)
    },
    replaceState(S, push = false) { persist(clone(S), push) },

    isGuest: () => localStorage.getItem('gym_guest') === '1',
    setGuest(v) { if (v) localStorage.setItem('gym_guest', '1'); else localStorage.removeItem('gym_guest'); set({ guest: !!v }) },

    isPaid: () => !!get().user?.paid && !!get().paid,
    setPaid(v) {
      if (v) {
        localStorage.setItem('gym_paid', '1')
        const email = get().user?.email
        if (email) localStorage.setItem('gym_paid_email', email.trim().toLowerCase())
      } else {
        localStorage.removeItem('gym_paid')
        localStorage.removeItem('gym_paid_email')
      }
      set({ paid: !!v })
    },

    setUser(u) {
      if (u) {
        localStorage.setItem('gym_user', JSON.stringify(u))
        localStorage.removeItem('gym_guest')
        if (u.paid) {
          localStorage.setItem('gym_paid', '1')
          if (u.email) localStorage.setItem('gym_paid_email', u.email.trim().toLowerCase())
        } else {
          localStorage.removeItem('gym_paid')
          localStorage.removeItem('gym_paid_email')
        }
      } else {
        localStorage.removeItem('gym_user')
        localStorage.removeItem('gym_paid')
        localStorage.removeItem('gym_paid_email')
      }
      set({ user: u, paid: !!u?.paid })
    },

    async pushState() {
      const user = get().user
      const paidEmail = localStorage.getItem('gym_paid_email')
      const email = user?.email || paidEmail
      if (!email) return
      clearTimeout(pushTm)
      try {
        await api('/api/data', {
          method: 'PUT',
          headers: { 'x-user-email': email },
          body: JSON.stringify({ email, state: get().S })
        })
        localStorage.removeItem('gym_dirty')
      } catch (e) {
        localStorage.setItem('gym_dirty', '1')
      }
    },
    async pullState() {
      try {
        const user = get().user
        const paidEmail = localStorage.getItem('gym_paid_email')
        const email = user?.email || paidEmail
        if (!email) return

        const res = await api(`/api/data?email=${encodeURIComponent(email)}`, {
          headers: { 'x-user-email': email }
        })
        const state = res.state
        const S = get().S
        const dirty = localStorage.getItem('gym_dirty') === '1'
        if (state && (!hasData(S) || ((state._ts || 0) >= (S._ts || 0) && !dirty))) {
          const active = S.active
          const next = Object.assign(clone(DEF), state)
          if (active) next.active = active
          persist(next, false)
        } else if (hasData(S)) {
          await get().pushState()
        }
      } catch (e) { /* offline — keep local */ }
    },

    async signOut() {
      try { await get().pushState(); await api('/api/logout', { method: 'POST', body: '{}' }) } catch (e) { /* */ }
      clearLocalSession()
    },

    // "Sign out everywhere": the server bumps this profile's session version, which kills every
    // session it has on any device — this browser included, so the app has to end up exactly
    // where a normal signOut leaves it. Unlike signOut the request is NOT swallowed: if it fails
    // the sessions elsewhere are all still valid, and wiping this device's copy of the data
    // would sign the user out of the one place the bump didn't reach. Caller reports the error.
    async signOutAll() {
      await get().pushState()   // never throws — stores gym_dirty and moves on when offline
      await api('/api/logout/all', { method: 'POST', body: '{}' })
      clearLocalSession()
    },

    // Demo build only: drop the seeded example profile back in (Settings → "Reset demo data").
    // Dynamic import so the generator never ships in a self-hosted bundle.
    async resetDemo() {
      const { buildDemoState } = await import('../lib/demoSeed.js')
      localStorage.removeItem('gym_dirty')
      persist(Object.assign(clone(DEF), buildDemoState()), false)
    },

    async adaptPlan(weeklyWeights = [], checkin = null) {
      if (!get().S.aiAnswers) return;

      const uid = () => Math.random().toString(36).substring(2, 15);
      const resolveExerciseId = (name) => {
        if (!name) return null;
        const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const e of EXDB) {
          if (e.n.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) return e.id;
        }
        for (const e of EXDB) {
          if (e.n.toLowerCase().includes(norm) || norm.includes(e.n.toLowerCase())) return e.id;
        }
        return null;
      };

      const workouts = get().S.workouts || [];
      const workoutSummary = workouts.slice(-5).map(w => {
        const totalSets = w.entries.reduce((acc, e) => acc + e.sets.length, 0);
        const completedSets = w.entries.reduce((acc, e) => acc + e.sets.filter(s => s.done).length, 0);
        return {
          name: w.name,
          date: w.d,
          setsTotal: totalSets,
          setsCompleted: completedSets,
          completed: completedSets > 0,
          topWeights: w.entries.map(e => ({
            exercise: (EXIDX[e.id] || {}).n || e.id,
            weight: Math.max(0, ...e.sets.filter(s => s.done).map(s => s.w || 0))
          }))
        };
      });

      try {
        const res = await api('/api/adapt-plan', {
          method: 'POST',
          body: JSON.stringify({
            answers: get().S.aiAnswers,
            currentPlan: get().S.aiPlan || {
              kcal: get().S.targetCalories || 2000,
              protein: get().S.targetProtein || 140,
              carbs: Math.round(((get().S.targetCalories || 2000) * 0.45) / 4),
              fat: Math.round(((get().S.targetCalories || 2000) * 0.25) / 9),
              monthNumber: 1
            },
            weeklyWeights: weeklyWeights.length ? weeklyWeights : get().S.bodyweight.slice(-4).map(b => b.w),
            workoutSummary,
            checkin
          })
        });

        if (res.plan) {
          get().update(s => {
            s.aiPlan = res.plan;
            s.targetCalories = res.plan.kcal;
            s.targetProtein = res.plan.protein;
            
            s.aiCoachCard = {
              coachNote: res.plan.coachNote,
              changes: res.plan.changes || [],
              weeklyInsight: res.plan.weeklyInsight,
              celebration: res.plan.celebration || '',
              seenAt: null
            };

            if (res.plan.workout && res.plan.workout.length) {
              const updatedRoutines = [];
              res.plan.workout.forEach(w => {
                if (w.r) return;
                let routine = s.routines.find(r => r.name.toLowerCase().includes(w.n.toLowerCase()));
                if (!routine) {
                  routine = { id: uid(), name: w.n, emoji: 'barbell', ex: [] };
                  s.routines.push(routine);
                }
                const mappedEx = w.exercises.map(ex => {
                  const resolvedId = resolveExerciseId(ex.name);
                  if (resolvedId) {
                    return { id: resolvedId, sets: parseInt(ex.sets) || 3, reps: parseInt(ex.reps.split('-')[0]) || 10, weight: 0 };
                  }
                  const customId = 'cust_' + uid();
                  s.customEx.push({ id: customId, n: ex.name, bp: 'custom', tg: 'general', eq: 'barbell' });
                  return { id: customId, sets: parseInt(ex.sets) || 3, reps: parseInt(ex.reps.split('-')[0]) || 10, weight: 0 };
                });
                routine.ex = mappedEx;
                updatedRoutines.push(routine);
              });
            }
          });
        }
      } catch (err) {
        console.error('Adapt plan error:', err);
      }
    },

    // Boot: restore session, pull state from cloud, and initialize.
    async boot() {
      // Restore local Google OAuth / paid-email session immediately
      const paidEmail = localStorage.getItem('gym_paid_email')
      const storedUser = JSON.parse(localStorage.getItem('gym_user') || 'null')
      if (storedUser) {
        get().setUser(storedUser)
      } else if (paidEmail) {
        get().setUser({ name: paidEmail.split('@')[0], email: paidEmail, paid: true })
        get().setPaid(true)
      }

      if (MOBILE) {
        const saved = await nativeLoad()
        const S = get().S
        if (saved && (!hasData(S) || (saved._ts || 0) >= (S._ts || 0))) {
          persist(Object.assign(clone(DEF), saved), false)
        } else if (hasData(S)) {
          nativeSave(S)
        }
        get().setGuest(true)
        syncReminder(get().S)
        set({ ready: true })
        return
      }

      // Demo build (GitHub Pages): no backend at all — seed once, stay in guest mode.
      if (DEMO) {
        if (!localStorage.getItem(DEMO_SEEDED)) {
          localStorage.setItem(DEMO_SEEDED, '1')
          await get().resetDemo()
        }
        get().setGuest(true)
        set({ ready: true })
        return
      }

      try {
        // Sync with Cloudflare backend
        await get().pullState()
        const tz = localTZ()
        if (get().S.reminder?.on && get().S.reminder.tz !== tz) {
          get().update(s => { s.reminder = { ...s.reminder, tz } })
        }
      } catch (e) {
        // non-fatal
      }

      set({ ready: true })
    }
  }
})

export { hasData }
