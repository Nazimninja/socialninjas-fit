import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, fmtVol, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { EXIDX } from '../lib/exercises.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, bwDeltaColor, onboardingWizardSheet, athleteProfileSheet, weeklyCheckinSheet, exConfigSheet } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'

export default function Home() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  const todayOvr = S.dayPlan[todayISO()] !== undefined
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null

  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  const doneDays = new Set(S.workouts.map(w => w.d))
  const strip = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const iso = isoOf(d)
    const eff = effectiveRoutineId(S, iso), ovr = S.dayPlan[iso] !== undefined, done = doneDays.has(iso)
    const dot = done ? ' done' : ovr && eff ? ' ovr' : eff ? ' plan' : ''
    strip.push(
      <div key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
        <div className="lbl">{t(DAYS[d.getDay()])}</div>
        <div className="num">{d.getDate()}</div>
        <div className={'dot' + dot} />
      </div>
    )
  }
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0 ? t('This week') : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  // Weekly workout statistics
  const currentWeekKey = weekKey(todayISO())
  const thisWeekWorkouts = S.workouts.filter(w => weekKey(w.d) === currentWeekKey)
  const wThisWeek = thisWeekWorkouts.length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length || 4
  const weeklyCompletionPct = Math.min(100, Math.round((wThisWeek / plannedPerWeek) * 100))

  // Weekly volume lifted in kg
  const totalWeeklyVol = thisWeekWorkouts.reduce((sum, w) => sum + (w.vol || 0), 0)

  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const targetKcal = S.targetCalories || S.aiPlan?.kcal || 2400
  const targetProtein = S.targetProtein || S.aiPlan?.protein || 140
  const targetCarbs = S.aiPlan?.carbs || Math.round((targetKcal * 0.45) / 4)
  const targetFat = S.aiPlan?.fat || Math.round((targetKcal * 0.25) / 9)

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  const athleteName = user?.name || user?.email?.split('@')[0] || 'Athlete'

  // Readiness calculation based on recovery
  const lastCheckin = S.checkins && S.checkins.length > 0 ? S.checkins[S.checkins.length - 1] : null
  const readinessScore = lastCheckin?.soreness === 'sore' ? 78 : lastCheckin?.soreness === 'mild' ? 92 : 96

  return (
    <div className="narrow" style={{ paddingBottom: '120px' }}>
      
      {/* ── 1. CULT.FIT STYLE TOP ATHLETE HEADER ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingTop: '6px' }}>
        <div
          onClick={() => athleteProfileSheet()}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src="/ninja-logo.png?v=3"
              alt="Fit Ninja"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                objectFit: 'contain',
                background: '#141418',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                padding: '2px'
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '11px', height: '11px', borderRadius: '50%', background: '#ffffff', border: '2px solid #000' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>
                {athleteName}
              </h1>
              <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PROFILE ⚙️
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡ {readinessScore}% Readiness</span>
              <span>•</span>
              <span>{today.toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => calendarSheet()}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'linear-gradient(180deg, #222228 0%, #151518 100%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderTop: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              borderRadius: '99px', padding: '6px 12px', fontSize: '12px', fontWeight: '800', color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <Icon name="flame" style={{ fontSize: 13 }} />
            <span>{streakWeeks(S)}w</span>
          </div>
          <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}>
            <Icon name="gear" />
          </button>
        </div>
      </div>

      {/* ── 2. CULT.FIT STYLE MEMBERSHIP / AI COACH PASS CARD ──────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #1c1c24 0%, #101014 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderTop: '1px solid rgba(255, 255, 255, 0.28)',
          borderRadius: '22px',
          padding: '18px 20px',
          marginBottom: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)'
        }}
      >
        {/* Subtle Watermark Logo Emblem (Cult.fit style) */}
        <div style={{
          position: 'absolute', right: '-15px', top: '-10px', width: '130px', height: '130px',
          opacity: 0.07, pointerEvents: 'none', background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="/ninja-logo.png?v=3" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Top Tag & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 6px #fff' }} />
            <span style={{ fontSize: '10.5px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
              ACTIVE PROTOCOL
            </span>
          </div>
          <span style={{ fontSize: '9.5px', fontWeight: '800', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            FIT NINJA ELITE
          </span>
        </div>

        {/* Big Card Title */}
        <h2 style={{ margin: '0 0 4px', fontSize: '21px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
          Coach AI Intelligence Plan
        </h2>
        <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '14px', lineHeight: 1.4 }}>
          {S.aiCoachCard?.coachNote || `Customized training split and precision nutrition calibrated for your goals.`}
        </div>

        {/* Macro Badges Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>
            🔥 {targetKcal} <span style={{ color: '#71717a', fontSize: '10px' }}>kcal</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>
            🥩 {targetProtein}g <span style={{ color: '#71717a', fontSize: '10px' }}>Protein</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>
            🍚 {targetCarbs}g <span style={{ color: '#71717a', fontSize: '10px' }}>Carbs</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>
            🥑 {targetFat}g <span style={{ color: '#71717a', fontSize: '10px' }}>Fats</span>
          </div>
        </div>

        {/* Bottom Progress Bevel Bar (Cult.fit card red/white line style) */}
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)' }} />
        </div>
      </div>

      {/* ── 3. CULT.FIT 4-TILE QUICK LAUNCHER GRID ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
        {/* Tile 1: Manage Split */}
        <div
          onClick={() => nav('/plan')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #202028 0%, #131317 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderTop: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '14px 6px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '6px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏋️</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>Split</span>
        </div>

        {/* Tile 2: Nutrition & Recipes */}
        <div
          onClick={() => nav('/nutrition')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #202028 0%, #131317 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderTop: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '14px 6px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '6px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🥗</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>Meals</span>
        </div>

        {/* Tile 3: Rebuild Plan */}
        <div
          onClick={onboardingWizardSheet}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #202028 0%, #131317 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderTop: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '14px 6px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '6px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>⚡</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>Rebuild</span>
        </div>

        {/* Tile 4: Check-in */}
        <div
          onClick={weeklyCheckinSheet}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #202028 0%, #131317 100%)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderTop: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '14px 6px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '6px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>📸</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>Check-in</span>
        </div>
      </div>

      {/* ── 4. CULT.FIT STYLE WEEKLY CALENDAR STRIP ───────────────── */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px', background: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px' }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>{wkLabel}</div>
          <div className="row" style={{ gap: 4 }}>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
          </div>
        </div>
        <div className="week" style={{ marginBottom: '10px' }}>{strip}</div>
        <div className="small muted" style={{ fontSize: '11px', textAlign: 'center', color: '#71717a' }}>
          Tap any day to customize routine assignments or set rest days.
        </div>
      </div>

      {/* ── 5. CULT.FIT HERO WORKOUT CENTER ───────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1a1a22 0%, #101014 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '22px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
        }}
      >
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff' }}>
              {S.active ? '⚡ Workout In Progress' : routine ? "Today's Training Focus" : 'Active Recovery Day'}
            </span>
          </div>

          {routine && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '6px', color: '#e2e8f0' }}>
                ⏱️ ~45 min
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: '800', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)', padding: '3px 8px', borderRadius: '6px', color: '#ffffff' }}>
                {routine.ex.length} Exercises
              </span>
            </div>
          )}
        </div>

        {/* Title and Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '54px', height: '54px', borderRadius: '16px',
              background: 'linear-gradient(180deg, #2a2a34 0%, #17171d 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <Icon name={S.active ? 'timer' : routine ? glyphOf(routine.emoji) : 'moon'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 3px', fontSize: '19px', fontWeight: '900', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {S.active ? S.active.name : routine ? routine.name : t('Rest & Muscle Recovery')}
            </h2>
            <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.3 }}>
              {S.active
                ? `${setsDoneActive(S.active)} / ${S.active.entries.reduce((n, e) => n + e.sets.length, 0)} sets completed so far`
                : routine
                  ? 'Personalized progressive overload routine'
                  : 'Hydrate, hit your protein target, and sleep 8+ hours.'}
            </div>
          </div>
        </div>

        {/* Interactive Exercise Preview List (Clickable Drilldown) */}
        {routine && routine.ex && routine.ex.length > 0 && !S.active && (
          <div style={{ background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Prescribed Exercise Lineup:
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {routine.ex.map((e, idx) => {
                const exObj = EXIDX[e.id] || { n: e.id };
                return (
                  <div
                    key={idx}
                    onClick={() => exConfigSheet(e, true, () => {}, () => {}, routine)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'linear-gradient(180deg, #1c1c22 0%, #131317 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderTop: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: '10px',
                      padding: '8px 12px', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: '900' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exObj.n}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#cbd5e1', flexShrink: 0 }}>
                      {e.sets || 3} × {e.reps || 10}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cult.fit Style Full-Width Primary CTA Launch Button */}
        <button
          onClick={onToday}
          style={{
            width: '100%',
            background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
            color: '#000000',
            border: '1px solid #ffffff',
            borderRadius: '14px',
            padding: '15px',
            fontSize: '15px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.25), inset 0 1px 0 #ffffff'
          }}
        >
          <span>
            {S.active
              ? '⚡ Resume Active Workout'
              : routine
                ? `▶️ Start ${routine.name}`
                : '📅 Schedule or Log Workout'}
          </span>
        </button>
      </div>

      {/* ── 6. CULT.FIT ACTIVITY & RECORDS TELEMETRY HUD ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {/* Workouts Completed */}
        <div style={{ background: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px', padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            SESSIONS
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {wThisWeek} <span style={{ fontSize: '11px', color: '#71717a' }}>/ {plannedPerWeek}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: `${weeklyCompletionPct}%`, height: '100%', background: '#ffffff', borderRadius: '99px' }} />
          </div>
        </div>

        {/* Total Volume */}
        <div style={{ background: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px', padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            VOLUME
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {totalWeeklyVol > 0 ? fmtVol(totalWeeklyVol, S.unit) : '0 kg'}
          </div>
          <div style={{ fontSize: '9.5px', color: '#71717a', marginTop: '4px' }}>
            {thisWeekWorkouts.length} logs this wk
          </div>
        </div>

        {/* Current Bodyweight */}
        <div
          onClick={() => bwSheet()}
          style={{ background: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px', padding: '14px 10px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            WEIGHT
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {bw ? fmtNum(bw.w) : '--'} <span style={{ fontSize: '10px', color: '#71717a' }}>{S.unit}</span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#e2e8f0', fontWeight: '800', marginTop: '4px' }}>
            {delta ? (delta > 0 ? `+${fmtNum(delta)} ${S.unit}` : `${fmtNum(delta)} ${S.unit}`) : 'Log today'}
          </div>
        </div>
      </div>

      {/* ── 7. BODYWEIGHT PROGRESS TRACKER ────────────────────────── */}
      <div className="card" style={{ padding: '18px', marginBottom: '16px', background: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px' }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#71717a' }}>
              Body Composition
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '900', color: '#fff' }}>{t('Weight Progress')}</h2>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: '#ffffff' } : undefined} onClick={goalSheet}>
              {S.targetW ? `${fmtNum(S.targetW)} ${S.unit}` : t('Set Goal')}
            </Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>
              {t('Log')}
            </Button>
          </div>
        </div>

        {bw ? (
          <>
            <div className="row" style={{ gap: 8, alignItems: 'baseline', marginTop: '6px' }}>
              <div className="big" style={{ fontSize: '26px', fontWeight: '900', color: '#fff' }}>
                {fmtNum(bw.w)} <span className="muted" style={{ fontSize: '14px', fontWeight: '500' }}>{S.unit}</span>
              </div>
              {!!delta && (
                <span className="small row" style={{ gap: 2, fontWeight: 700, color: bwDeltaColor(delta, bw.w) }}>
                  <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
                  {fmtNum(Math.abs(delta))} {S.unit}
                </span>
              )}
              <span className="dim small" style={{ marginLeft: 'auto', fontSize: '11px', color: '#71717a' }}>{fmtDate(bw.d, true)}</span>
            </div>

            {bwPoints.length > 1 && (
              <div style={{ marginTop: 14 }}>
                <LineChart data={bwPoints} target={S.targetW} unit={S.unit} />
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--label-3)' }}>
            <div className="small">{t('No weight logged yet.')}</div>
            <div style={{ height: 8 }} />
            <Button size="sm" onClick={() => bwSheet()}>{t('Log weight')}</Button>
          </div>
        )}
      </div>

    </div>
  )
}
