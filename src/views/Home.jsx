import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, fmtVol, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { EXIDX } from '../lib/exercises.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, bwDeltaColor, onboardingWizardSheet, weeklyCheckinSheet, exConfigSheet } from '../sheets.jsx'
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
      
      {/* ── 1. TOP ATHLETE GREETING & FIT NINJA STATUS ───────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/ninja-logo.png?v=3"
              alt="Fit Ninja"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                objectFit: 'contain',
                background: 'linear-gradient(135deg, #101726, #000000)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                boxShadow: '0 0 14px rgba(37, 99, 235, 0.2)',
                padding: '2px'
              }}
            />
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb', border: '2px solid #000', boxShadow: '0 0 8px #2563eb' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '19px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>
                Hi, {athleteName}
              </h1>
              <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.35)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PRO PASS
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--label-3)', marginTop: '2px', fontWeight: '500' }}>
              {today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'short' })} • <span style={{ color: '#60a5fa', fontWeight: '700' }}>⚡ {readinessScore}% Readiness</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => calendarSheet()}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.35)',
              borderRadius: '99px', padding: '5px 10px', fontSize: '12px', fontWeight: '800', color: '#60a5fa',
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

      {/* ── 2. COACH AI INTELLIGENCE BRIEFING (TOP POSITION) ──────── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 23, 0.98) 100%)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderLeft: '4px solid #2563eb',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45), 0 0 16px rgba(37,99,235,0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#60a5fa', fontSize: '17px', display: 'flex', alignItems: 'center' }}>
              <Icon name="sparkles" />
            </span>
            <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px' }}>
              Coach AI Intelligence Briefing
            </span>
          </div>
          <span style={{ fontSize: '9.5px', fontWeight: '800', background: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.35)', padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ACTIVE PLAN
          </span>
        </div>

        {/* Personalized Targets Strip (Black & Royal Blue & Silver Badges) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.35)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px' }}>
            🔥 {targetKcal} kcal
          </span>
          <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '3px 8px', borderRadius: '6px' }}>
            🥩 {targetProtein}g Protein
          </span>
          <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px' }}>
            🍚 {targetCarbs}g Carbs
          </span>
          <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '3px 8px', borderRadius: '6px' }}>
            🥑 {targetFat}g Fats
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '12px' }}>
          {S.aiCoachCard?.coachNote || `Your customized plan is configured. Maintain consistency on your training days, progressive overload on compound lifts, and hit your protein target.`}
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => nav('/plan')}
            style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              padding: '6px 11px', fontSize: '11px', fontWeight: '700', color: '#fff', cursor: 'pointer'
            }}
          >
            🏋️ Manage Split
          </button>
          <button
            onClick={() => nav('/nutrition')}
            style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              padding: '6px 11px', fontSize: '11px', fontWeight: '700', color: '#fff', cursor: 'pointer'
            }}
          >
            🥗 Recipes &amp; Macros
          </button>
          <button
            onClick={onboardingWizardSheet}
            style={{
              background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.4)', borderRadius: '8px',
              padding: '6px 11px', fontSize: '11px', fontWeight: '700', color: '#60a5fa', cursor: 'pointer'
            }}
          >
            ⚡ Rebuild Plan
          </button>
        </div>
      </div>

      {/* ── 3. WEEKLY SCHEDULE CALENDAR STRIP ──────────────────────── */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>{wkLabel}</div>
          <div className="row" style={{ gap: 4 }}>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
          </div>
        </div>
        <div className="week" style={{ marginBottom: '10px' }}>{strip}</div>
        <div className="small muted" style={{ fontSize: '11px', textAlign: 'center', color: '#94a3b8' }}>
          Tap any day to customize routine assignments or set rest days.
        </div>
      </div>

      {/* ── 4. HERO WORKOUT COMMAND CENTER ────────────────────────── */}
      <div
        className="card"
        style={{
          background: S.active
            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(10, 14, 23, 0.98) 100%)'
            : routine
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(10, 14, 23, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(10, 14, 23, 0.98) 100%)',
          border: S.active
            ? '1.5px solid #2563eb'
            : routine
              ? '1.5px solid rgba(37, 99, 235, 0.45)'
              : '1px solid var(--sep)',
          borderRadius: '20px',
          padding: '18px',
          marginBottom: '14px',
          boxShadow: S.active
            ? '0 10px 30px rgba(37, 99, 235, 0.25)'
            : routine
              ? '0 10px 30px rgba(37, 99, 235, 0.18)'
              : '0 8px 24px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: S.active || routine ? '#2563eb' : '#94a3b8',
              boxShadow: S.active || routine ? '0 0 8px #2563eb' : 'none'
            }} />
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: S.active || routine ? '#60a5fa' : 'var(--label-3)' }}>
              {S.active ? '⚡ Workout In Progress' : routine ? "Today's Training Focus" : 'Active Recovery Day'}
            </span>
          </div>

          {routine && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px', color: '#cbd5e1' }}>
                ⏱️ ~45 min
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(37, 99, 235, 0.18)', border: '1px solid rgba(37, 99, 235, 0.4)', padding: '3px 8px', borderRadius: '6px', color: '#60a5fa' }}>
                {routine.ex.length} Exercises
              </span>
            </div>
          )}
        </div>

        {/* Title and Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: S.active || routine ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'var(--surface-2)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0,
              boxShadow: S.active || routine ? '0 4px 16px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <Icon name={S.active ? 'timer' : routine ? glyphOf(routine.emoji) : 'moon'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 3px', fontSize: '18px', fontWeight: '900', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {S.active ? S.active.name : routine ? routine.name : t('Rest & Muscle Recovery')}
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.3 }}>
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
          <div style={{ background: '#0a0e17', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
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
                      background: '#1e293b', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px',
                      padding: '7px 10px', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exObj.n}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', flexShrink: 0 }}>
                      {e.sets || 3} × {e.reps || 10}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main CTA Action Button in Royal Blue */}
        <button
          onClick={onToday}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)'
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

      {/* ── 5. WEEKLY TRAINING TELEMETRY HUD ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
        {/* Workouts Completed */}
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SESSIONS
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {wThisWeek} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ {plannedPerWeek}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${weeklyCompletionPct}%`, height: '100%', background: '#2563eb', borderRadius: '99px' }} />
          </div>
        </div>

        {/* Total Volume */}
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            VOLUME
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {totalWeeklyVol > 0 ? fmtVol(totalWeeklyVol, S.unit) : '0 kg'}
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
            {thisWeekWorkouts.length} logs this wk
          </div>
        </div>

        {/* Current Bodyweight */}
        <div
          onClick={() => bwSheet()}
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px 10px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            WEIGHT
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginTop: '3px' }}>
            {bw ? fmtNum(bw.w) : '--'} <span style={{ fontSize: '10px', color: '#94a3b8' }}>{S.unit}</span>
          </div>
          <div style={{ fontSize: '9.5px', color: delta ? (delta < 0 ? '#60a5fa' : '#e2e8f0') : '#94a3b8', fontWeight: '700', marginTop: '4px' }}>
            {delta ? (delta > 0 ? `+${fmtNum(delta)} ${S.unit}` : `${fmtNum(delta)} ${S.unit}`) : 'Log today'}
          </div>
        </div>
      </div>

      {/* ── 6. BODYWEIGHT PROGRESS TRACKER ────────────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8' }}>
              Body Composition
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '900', color: '#fff' }}>{t('Weight Progress')}</h2>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--acc)' } : undefined} onClick={goalSheet}>
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
              <span className="dim small" style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>{fmtDate(bw.d, true)}</span>
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

      {/* ── 7. WEEKLY PROGRESS CHECK-IN BANNER ────────────────────── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(10, 14, 23, 0.98) 100%)',
          border: '1px solid rgba(37, 99, 235, 0.35)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            📸
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Weekly Progress Check-in
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.3, marginTop: '2px' }}>
              Upload physique photos &amp; weight for Monday AI adaptation.
            </div>
          </div>
        </div>
        <Button size="sm" variant="primary" style={{ background: '#2563eb', color: '#ffffff', flexShrink: 0, fontWeight: 900, borderRadius: '10px', padding: '7px 12px', fontSize: '12px' }} onClick={weeklyCheckinSheet}>
          Check In →
        </Button>
      </div>

    </div>
  )
}
