import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor, onboardingWizardSheet, exploreProgramsSheet, weeklyCheckinSheet } from '../sheets.jsx'
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

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
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

  return (
    <div className="narrow" style={{ paddingBottom: '120px' }}>
      {/* ── TOP HEADER ───────────────────────────────────────────── */}
      <div className="hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/ninja-logo.png?v=3" alt="Fit Ninja" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>
              {user ? `Hi, ${user.name || user.email.split('@')[0]}` : 'Fit Ninja'}
            </h1>
            <div className="sub" style={{ fontSize: '11px', color: 'var(--label-3)' }}>
              {today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => calendarSheet()}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '99px', padding: '5px 10px', fontSize: '12px', fontWeight: '700', color: 'var(--orange)',
              cursor: 'pointer'
            }}
          >
            <Icon name="flame" style={{ fontSize: 13 }} />
            <span>{streakWeeks(S)}w</span>
          </div>
          <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
        </div>
      </div>

      {/* ── MONDAY PROGRESS CHECK-IN BANNER ────────────────────── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(28, 28, 30, 0.95))',
          border: '1px solid rgba(37, 99, 235, 0.4)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '26px' }}>📸</span>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Weekly Progress Check-in
            </div>
            <div className="small muted" style={{ fontSize: '11px', lineHeight: 1.3 }}>
              Upload physique photos &amp; weight for Monday AI plan adaptation.
            </div>
          </div>
        </div>
        <Button size="sm" variant="primary" style={{ background: 'var(--blue)', color: '#fff', flexShrink: 0, fontWeight: 700 }} onClick={weeklyCheckinSheet}>
          Check In
        </Button>
      </div>

      {/* ── TODAY'S TRAINING HERO CARD ───────────────────────────── */}
      <div
        className="card"
        style={{
          background: S.active
            ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(28,28,30,0.95))'
            : routine
              ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(28,28,30,0.95))'
              : 'var(--surface)',
          border: S.active ? '1px solid var(--orange)' : routine ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--sep)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: S.active ? 'var(--orange)' : routine ? 'var(--acc)' : 'var(--label-3)' }}>
            {S.active ? '⚡ Workout In Progress' : routine ? "Today's Training Focus" : 'Active Recovery Day'}
          </div>
          {routine && (
            <span style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: '6px', color: 'var(--label-2)' }}>
              {routine.ex.length} Exercises
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: S.active ? 'var(--orange)' : routine ? 'var(--acc)' : 'var(--surface-2)',
              color: S.active ? '#000' : 'var(--on-acc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0
            }}
          >
            <Icon name={S.active ? 'timer' : routine ? glyphOf(routine.emoji) : 'moon'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 3px', fontSize: '18px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {S.active ? S.active.name : routine ? routine.name : t('Rest & Muscle Recovery')}
            </h2>
            <div className="small muted" style={{ fontSize: '12px', lineHeight: 1.3 }}>
              {S.active
                ? `${setsDoneActive(S.active)} / ${S.active.entries.reduce((n, e) => n + e.sets.length, 0)} sets completed`
                : routine
                  ? 'Personalized progressive overload routine'
                  : 'Focus on hydration, 8+ hours sleep, and protein synthesis.'}
            </div>
          </div>
        </div>

        {/* Exercises preview chip list if routine exists */}
        {routine && routine.ex && routine.ex.length > 0 && !S.active && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {routine.ex.slice(0, 4).map((e, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--sep)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  color: 'var(--label-2)'
                }}
              >
                {e.sets || 3}x{e.reps || 10}
              </span>
            ))}
            {routine.ex.length > 4 && (
              <span style={{ fontSize: '11px', color: 'var(--label-3)', alignSelf: 'center' }}>
                +{routine.ex.length - 4} more
              </span>
            )}
          </div>
        )}

        <Button
          variant="primary"
          style={{
            width: '100%',
            background: S.active ? 'var(--orange)' : 'var(--acc)',
            color: S.active ? '#000' : 'var(--on-acc)',
            fontWeight: '700',
            fontSize: '15px',
            padding: '12px'
          }}
          icon={S.active ? 'timer' : 'play'}
          onClick={onToday}
        >
          {S.active ? t('⚡ Resume Active Workout') : routine ? t('▶️ Start {0}', routine.name) : t('📅 Schedule or Log Workout')}
        </Button>
      </div>

      {/* ── DAILY NUTRITION & MACRO TARGETS HUD ──────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--acc)' }}>
              Daily Fuel &amp; Macro Targets
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '2px' }}>
              {targetKcal} <span style={{ fontSize: '12px', color: 'var(--label-3)', fontWeight: '500' }}>KCAL / DAY</span>
            </div>
          </div>
          <Button size="sm" onClick={() => nav('/nutrition')}>
            {t('Meals & Recipes →')}
          </Button>
        </div>

        {/* 3 Macro Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>PROTEIN</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', marginTop: '2px' }}>{targetProtein}g</div>
            <div style={{ fontSize: '10px', color: 'var(--label-3)', marginTop: '2px' }}>{Math.round(targetProtein * 4)} kcal</div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>CARBS</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', marginTop: '2px' }}>{targetCarbs}g</div>
            <div style={{ fontSize: '10px', color: 'var(--label-3)', marginTop: '2px' }}>{Math.round(targetCarbs * 4)} kcal</div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#ec4899', fontWeight: '700' }}>FATS</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', marginTop: '2px' }}>{targetFat}g</div>
            <div style={{ fontSize: '10px', color: 'var(--label-3)', marginTop: '2px' }}>{Math.round(targetFat * 9)} kcal</div>
          </div>
        </div>

        {/* Diet & Food Preference Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--label-2)', background: 'var(--surface-3)', padding: '6px 10px', borderRadius: '8px' }}>
          <span>Diet: <b>{S.aiAnswers?.diet ? S.aiAnswers.diet.toUpperCase() : 'HIGH PROTEIN'}</b></span>
          <span>Goal: <b>{S.aiAnswers?.goal ? S.aiAnswers.goal.toUpperCase() : 'MUSCLE GAIN'}</b></span>
        </div>
      </div>

      {/* ── COACH AI INSIGHT & ADAPTATION ────────────────────────── */}
      {S.aiCoachCard && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--acc)',
            background: 'var(--surface-2)',
            padding: '16px',
            marginBottom: '14px'
          }}
        >
          <div className="row" style={{ gap: 10, marginBottom: 8, justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ color: 'var(--acc)', fontSize: 18 }}><Icon name="sparkles" /></span>
              <span className="big" style={{ fontSize: '16px', fontWeight: 800 }}>{t('Coach AI Insights')}</span>
            </div>
            <span style={{ fontSize: '11px', background: 'var(--surface)', padding: '3px 8px', borderRadius: '99px', color: 'var(--acc)', fontWeight: '700' }}>
              Active Plan
            </span>
          </div>

          <div className="small text-secondary" style={{ lineHeight: 1.5, marginBottom: 12, fontSize: 13, color: 'var(--label-2)' }}>
            {S.aiCoachCard.coachNote || 'Your custom progressive overload routine is configured. Track your sets and body weight weekly for automatic AI adjustments.'}
          </div>

          {S.aiCoachCard.weeklyInsight && (
            <div className="small font-medium italic" style={{ color: 'var(--acc)', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
              💡 {S.aiCoachCard.weeklyInsight}
            </div>
          )}

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={exploreProgramsSheet}
              style={{
                background: 'var(--surface)', border: '1px solid var(--sep)', borderRadius: '8px',
                padding: '6px 10px', fontSize: '11px', fontWeight: '600', color: 'var(--label)', cursor: 'pointer'
              }}
            >
              🏋️ Explore 12+ Programs
            </button>
            <button
              onClick={() => nav('/nutrition')}
              style={{
                background: 'var(--surface)', border: '1px solid var(--sep)', borderRadius: '8px',
                padding: '6px 10px', fontSize: '11px', fontWeight: '600', color: 'var(--label)', cursor: 'pointer'
              }}
            >
              🥗 View Indian Meals
            </button>
            <button
              onClick={onboardingWizardSheet}
              style={{
                background: 'var(--surface)', border: '1px solid var(--sep)', borderRadius: '8px',
                padding: '6px 10px', fontSize: '11px', fontWeight: '600', color: 'var(--acc)', cursor: 'pointer'
              }}
            >
              ⚡ Redo Questionnaire
            </button>
          </div>
        </div>
      )}

      {/* ── WEEKLY CALENDAR SCHEDULE STRIP ───────────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '14px', fontWeight: '700' }}>{wkLabel}</div>
          <div className="row" style={{ gap: 4 }}>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 14 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 14 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
          </div>
        </div>
        <div className="week" style={{ marginBottom: '12px' }}>{strip}</div>
        <div className="small muted" style={{ fontSize: '11px', textAlign: 'center' }}>
          Tap any day above to reschedule routines or set rest days.
        </div>
      </div>

      {/* ── BODYWEIGHT & GOAL TRACKER ────────────────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--label-3)' }}>
              Body Composition
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '800' }}>{t('Weight Progress')}</h2>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>
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
              <div className="big" style={{ fontSize: '24px', fontWeight: '900' }}>
                {fmtNum(bw.w)} <span className="muted" style={{ fontSize: '14px', fontWeight: '500' }}>{S.unit}</span>
              </div>
              {!!delta && (
                <span className="small row" style={{ gap: 2, fontWeight: 700, color: bwDeltaColor(delta, bw.w) }}>
                  <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
                  {fmtNum(Math.abs(delta))} {S.unit}
                </span>
              )}
              <span className="dim small" style={{ marginLeft: 'auto', fontSize: '11px' }}>{fmtDate(bw.d, true)}</span>
            </div>

            {S.targetW && (
              <div className="small row" style={{ color: 'var(--yellow)', marginTop: 6, gap: 5, fontSize: '12px', fontWeight: '600' }}>
                <Icon name="target" style={{ fontSize: 13 }} />
                <span>
                  {Math.abs(S.targetW - bw.w) < 0.05
                    ? t('🎯 Goal reached!')
                    : t(S.targetW > bw.w ? '{0} to gain for target goal' : '{0} to lose for target goal', fmtNum(Math.abs(S.targetW - bw.w)) + ' ' + S.unit)}
                </span>
              </div>
            )}

            <div className="chart" style={{ marginTop: 12 }}>
              <LineChart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} />
            </div>
          </>
        ) : (
          <div className="muted small" style={{ padding: '10px 0', fontSize: '12px' }}>
            {t("No weigh-ins logged yet. Log your weight to start your progress graph.")}
          </div>
        )}
      </div>

      {/* ── QUICK ACTION TOOLKIT ─────────────────────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--label-3)', marginBottom: '10px' }}>
          Quick Toolkit
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div
            onClick={weeklyCheckinSheet}
            style={{
              background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(37,99,235,0.25)'
            }}
          >
            <span style={{ fontSize: 20 }}>📸</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--blue)' }}>Photo Check-in</div>
              <div className="small muted" style={{ fontSize: '11px' }}>Physique &amp; AI adapt</div>
            </div>
          </div>

          <div
            onClick={() => nav('/library')}
            style={{
              background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: 20 }}>🎬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>1,324+ Exercises</div>
              <div className="small muted" style={{ fontSize: '11px' }}>Animated demos</div>
            </div>
          </div>

          <div
            onClick={() => nav('/stats')}
            style={{
              background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: 20 }}>📈</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>PRs &amp; Volume</div>
              <div className="small muted" style={{ fontSize: '11px' }}>Lift progression</div>
            </div>
          </div>

          <div
            onClick={exploreProgramsSheet}
            style={{
              background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: 20 }}>🏋️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>12+ Programs</div>
              <div className="small muted" style={{ fontSize: '11px' }}>PPL, Arnold, Home</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT WORKOUTS HISTORY ──────────────────────────────── */}
      {S.workouts && S.workouts.length > 0 && (
        <div className="card" style={{ padding: '16px' }}>
          <div className="row between" style={{ marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{t('Recent Sessions')}</h2>
            <button
              onClick={() => nav('/history')}
              style={{ background: 'none', border: 'none', color: 'var(--acc)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              {t('View All ({0}) →', S.workouts.length)}
            </button>
          </div>
          <div className="list" style={{ gap: 8 }}>
            {[...S.workouts].reverse().slice(0, 3).map(w => {
              const completedSets = w.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
              const durationMs = (w.end || Date.now()) - w.start
              const mins = Math.round(durationMs / 60000)
              return (
                <div key={w.id} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--sep)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                    <div className="muted small" style={{ fontSize: 11 }}>{fmtDate(w.d, true)} · {mins > 0 ? `${mins} mins` : 'Completed'}</div>
                  </div>
                  <span className="tag acc" style={{ fontSize: 11 }}>
                    {w.prs?.length ? `🏆 ${w.prs.length} PRs` : `${completedSets} sets`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
