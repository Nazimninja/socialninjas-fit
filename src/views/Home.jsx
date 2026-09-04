import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, fmtVol, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { EXIDX } from '../lib/exercises.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, bwDeltaColor, athleteProfileSheet, weeklyCheckinSheet, exConfigSheet, workoutDetailSheet } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'
import BodyMap from '../components/BodyMap.jsx'
import { loadOfWorkouts, rankOf, MUSCLE_NAME } from '../lib/muscles.js'

/* ── Apple-style SVG mini activity ring ───────────────────────────── */
function MiniRing({ done = false, today = false, size = 32 }) {
  const strokeWidth = 3.5
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const ringColor = done ? '#34d399' : today ? '#38bdf8' : 'transparent'
  const trackColor = done ? 'rgba(52,211,153,0.18)' : today ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.08)'
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      {(done || today) && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={ringColor} strokeWidth={strokeWidth}
          strokeDasharray={done ? `${circ} 0` : `${circ * 0.28} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90,${size / 2},${size / 2})`}
        />
      )}
    </svg>
  )
}

/* ── Large hero ring (weekly completion) ──────────────────────────── */
function HeroRing({ pct = 0, size = 132, children }) {
  const r = (size - 18) / 2
  const circ = 2 * Math.PI * r
  const fill = Math.min(pct / 100, 1) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="ninjaHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={14} />
        {pct > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="url(#ninjaHeroGrad)" strokeWidth={14}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90,${size / 2},${size / 2})`}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

export default function Home() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const update = useStore(s => s.update)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO())
  const [showBodyMap, setShowBodyMap] = useState(false)

  const isSelectedToday = selectedDateISO === todayISO()
  const selectedRoutine = effectiveRoutine(S, selectedDateISO)
  const selectedDayWorkouts = S.workouts.filter(w => w.d === selectedDateISO)
  const isSelectedDone = selectedDayWorkouts.length > 0

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null

  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0
    ? t('This week')
    : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const currentWeekKey = weekKey(todayISO())
  const thisWeekWorkouts = S.workouts.filter(w => weekKey(w.d) === currentWeekKey)
  const wThisWeek = thisWeekWorkouts.length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length || 4
  const weeklyCompletionPct = Math.min(100, Math.round((wThisWeek / plannedPerWeek) * 100))
  const totalWeeklyVol = thisWeekWorkouts.reduce((sum, w) => sum + (w.vol || 0), 0)
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))
  const targetKcal = S.targetCalories || S.aiPlan?.kcal || 2400
  const targetProtein = S.targetProtein || S.aiPlan?.protein || 140
  const targetCarbs = S.aiPlan?.carbs || Math.round((targetKcal * 0.45) / 4)
  const targetFat = S.aiPlan?.fat || Math.round((targetKcal * 0.25) / 9)
  const dayOfWeek = today.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const lastCheckin = S.checkins && S.checkins.length > 0 ? S.checkins[S.checkins.length - 1] : null
  const checkedInThisWeekend = lastCheckin && (Date.now() - (new Date(lastCheckin.date).getTime() || 0) < 4 * 24 * 3600 * 1000)
  const athleteName = S.aiAnswers?.pname || user?.name || 'Athlete'
  const firstName = athleteName.split(' ')[0]
  const readinessScore = lastCheckin?.soreness === 'sore' ? 78 : lastCheckin?.soreness === 'mild' ? 92 : 96
  const readinessColor = readinessScore >= 90 ? '#34d399' : readinessScore >= 80 ? '#fbbf24' : '#f87171'

  // Muscle Volume & Stimulus calculation
  const thisWeekLoad = loadOfWorkouts(thisWeekWorkouts)
  const { worked: workedMuscles } = rankOf(thisWeekLoad)
  const maxMuscleSets = Math.max(1, ...Object.values(thisWeekLoad))

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  const greet = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="narrow" style={{ paddingBottom: '148px' }}>

      {/* ─── 1. INTERNATIONAL BRAND HEADER ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingTop: '6px' }}>
        <div onClick={() => athleteProfileSheet()} style={{ display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            {S.profilePhoto || user?.avatar ? (
              <img
                src={S.profilePhoto || user.avatar}
                alt="Profile"
                style={{ width: 48, height: 48, borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(56,189,248,0.3)', display: 'block' }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: '16px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#38bdf8', border: '1.5px solid rgba(56,189,248,0.35)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: '50%', background: '#34d399', border: '2px solid var(--bg)', boxShadow: '0 0 8px #34d399' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 7px', borderRadius: '99px', border: '1px solid rgba(56,189,248,0.25)' }}>
                FIT NINJA
              </span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-3)' }}>
                {today.toLocaleDateString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.6px', color: 'var(--label)', lineHeight: 1.15 }}>
              {greet}, {firstName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div onClick={() => calendarSheet()} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '7px 13px', fontSize: '12px', fontWeight: '800', color: 'var(--label)', cursor: 'pointer', letterSpacing: '-0.2px' }}>
            🔥 <span>{streakWeeks(S)}w</span>
          </div>
          <button className="iconbtn" onClick={() => update(s => { s.theme = s.theme === 'light' ? 'dark' : 'light' })} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon name={S.theme === 'light' ? 'moon' : 'sun'} />
          </button>
          <button className="iconbtn" onClick={() => nav('/settings')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon name="gear" />
          </button>
        </div>
      </div>

      {/* ─── 2. AUTONOMOUS ATHLETE COMMAND CENTER (HERO HUD) ─────────────── */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 14, 26, 0.95) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        borderTop: '1px solid rgba(56, 189, 248, 0.45)',
        borderRadius: '26px',
        padding: '22px 20px 18px',
        marginBottom: '14px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 35px rgba(37, 99, 235, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle cyber watermark logo */}
        <div style={{ position: 'absolute', top: -15, right: -15, width: 140, height: 140, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'url(/ninja-logo.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HeroRing pct={weeklyCompletionPct} size={130}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-1.2px', lineHeight: 1 }}>
              {weeklyCompletionPct}<span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '700' }}>%</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>
              Cycle Goal
            </div>
          </HeroRing>

          <div style={{ flex: 1, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {[
              { icon: '⚡', label: 'Sessions', value: `${wThisWeek} / ${plannedPerWeek} Done`, color: '#38bdf8' },
              { icon: '🎯', label: 'Readiness', value: `${readinessScore}% · Optimal`, color: readinessColor },
              { icon: '📈', label: 'Total Volume', value: totalWeeklyVol > 0 ? fmtVol(totalWeeklyVol, S.unit) : '0 ' + S.unit, color: '#34d399' },
              { icon: '⚖️', label: 'Bodyweight', value: bw ? `${fmtNum(bw.w)} ${S.unit}` : 'Log Weight', color: '#fbbf24', tap: () => bwSheet() },
            ].map(({ icon, label, value, color, tap }) => (
              <div key={label} onClick={tap} style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: tap ? 'pointer' : 'default' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px' }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '900', color: label === 'Readiness' ? color : 'var(--label)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress rail */}
        <div style={{ marginTop: '18px', width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: `${weeklyCompletionPct}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #2563eb, #34d399)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.04em' }}>
            ⚡ ADAPTIVE OVERLOAD ACTIVE
          </div>
          <div style={{ fontSize: '10px', color: 'var(--label-3)', fontWeight: '600' }}>
            {wThisWeek} of {plannedPerWeek} sessions logged
          </div>
        </div>
      </div>

      {/* ─── 3. TACTICAL ACTION DECK ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { icon: '▶', label: S.active ? 'Resume' : routine ? 'Start' : 'Workout', isPrimary: true, action: onToday },
          { icon: '🥗', label: 'Log Meal', isPrimary: false, action: () => nav('/nutrition') },
          { icon: '⚖️', label: 'Weigh In', isPrimary: false, action: () => bwSheet() },
        ].map(({ icon, label, isPrimary, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isPrimary ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' : 'rgba(255,255,255,0.06)',
              border: isPrimary ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '12px 6px',
              fontSize: '13px',
              fontWeight: '900',
              color: isPrimary ? '#020617' : 'var(--label)',
              cursor: 'pointer',
              letterSpacing: '-0.2px',
              transition: 'all 0.15s ease',
              width: '100%',
              boxShadow: isPrimary ? '0 4px 16px rgba(255,255,255,0.2)' : 'none'
            }}
          >
            {icon && <span style={{ fontSize: isPrimary ? '11px' : '14px' }}>{icon}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── 4. 7-DAY PROTOCOL STRIP ─────────────────────────────────────── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)', borderRadius: '22px', padding: '16px 14px', marginBottom: '14px', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--label)', letterSpacing: '-0.3px' }}>{wkLabel}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 12, borderRadius: '8px' }} onClick={() => setWeekOffset(w => w - 1)}><Icon name="chevronLeft" /></button>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 12, borderRadius: '8px' }} onClick={() => setWeekOffset(w => w + 1)}><Icon name="chevronRight" /></button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday); d.setDate(monday.getDate() + i)
            const iso = isoOf(d)
            const isDone = S.workouts.some(w => w.d === iso)
            const isToday = iso === todayISO()
            const isSelected = iso === selectedDateISO
            return (
              <div
                key={i}
                onClick={() => setSelectedDateISO(iso)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 2px',
                  borderRadius: '16px',
                  background: isSelected ? 'rgba(56,189,248,0.14)' : 'transparent',
                  border: isSelected ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  color: isSelected ? '#38bdf8' : isToday ? '#60a5fa' : 'var(--label-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px'
                }}>
                  {t(DAYS[d.getDay()]).slice(0, 1)}
                </div>

                <MiniRing done={isDone} today={isToday && !isDone} size={32} />

                <div style={{
                  fontSize: '12px',
                  fontWeight: isSelected || isToday ? '800' : '600',
                  color: isSelected ? '#ffffff' : isToday ? '#38bdf8' : isDone ? '#34d399' : 'var(--label-2)',
                  marginTop: '6px',
                  lineHeight: 1
                }}>
                  {d.getDate()}
                </div>

                <div style={{ height: '5px', marginTop: '4px' }}>
                  {isSelected && (
                    <div style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 6px #38bdf8'
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 5. WORKOUT PROTOCOL CARD ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-gradient, var(--card-bg))',
        border: '1px solid var(--card-border)',
        borderTop: '1px solid var(--card-border-top)',
        borderRadius: '24px',
        padding: '20px',
        marginBottom: '14px',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {isSelectedToday && S.active && <div style={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, background: 'radial-gradient(circle,rgba(245,158,11,0.22) 0%,transparent 70%)', pointerEvents: 'none' }} />}
        {selectedRoutine && !S.active && <div style={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, background: 'radial-gradient(circle,rgba(56,189,248,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', background: (isSelectedToday && S.active) ? '#f59e0b' : isSelectedDone ? '#34d399' : selectedRoutine ? '#38bdf8' : 'var(--label-4)', boxShadow: (isSelectedToday && S.active) ? '0 0 8px #f59e0b' : selectedRoutine ? '0 0 8px #38bdf8' : 'none' }} />
            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--label-2)' }}>
              {isSelectedToday
                ? (S.active ? '⚡ Session In Progress' : selectedRoutine ? "Today's Protocol" : 'Active Recovery')
                : `${fmtDate(selectedDateISO, true)} · ${isSelectedDone ? 'Completed ✓' : selectedRoutine ? 'Scheduled' : 'Rest Day'}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {selectedRoutine && !S.active && (
              <>
                <span style={{ fontSize: '10.5px', fontWeight: '800', background: 'var(--surface-2)', border: '1px solid var(--card-border)', padding: '3px 9px', borderRadius: '99px', color: 'var(--label-2)' }}>~45 min</span>
                <span style={{ fontSize: '10.5px', fontWeight: '800', background: 'var(--surface-2)', border: '1px solid var(--card-border)', padding: '3px 9px', borderRadius: '99px', color: 'var(--label)' }}>{selectedRoutine.ex.length} exercises</span>
              </>
            )}
            <button
              onClick={() => dayOverrideSheet(selectedDateISO)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', color: 'var(--label-2)', fontSize: '10.5px', fontWeight: '700', borderRadius: '99px', padding: '3px 9px', cursor: 'pointer' }}
              title="Reschedule or switch workout"
            >
              Change
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderTop: '1px solid var(--card-border-top)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', color: 'var(--label)' }}>
            <Icon name={(isSelectedToday && S.active) ? 'timer' : isSelectedDone ? 'trophy' : selectedRoutine ? glyphOf(selectedRoutine.emoji) : 'moon'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
              {(isSelectedToday && S.active) ? S.active.name : isSelectedDone ? selectedDayWorkouts[0].name : selectedRoutine ? selectedRoutine.name : 'Rest & Recovery'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--label-2)', lineHeight: 1.3 }}>
              {(isSelectedToday && S.active)
                ? `${setsDoneActive(S.active)} / ${S.active.entries.reduce((n, e) => n + e.sets.length, 0)} sets completed`
                : isSelectedDone
                ? `${selectedDayWorkouts[0].entries?.length || 0} exercises completed · ${fmtVol(selectedDayWorkouts[0].vol, S.unit)} logged`
                : selectedRoutine ? 'AI-calibrated progressive overload' : 'Hydrate · hit protein · sleep 8h'}
            </div>
          </div>
        </div>

        {/* Exercise Lineup */}
        {isSelectedDone ? (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Completed Sets</div>
            {selectedDayWorkouts[0].entries?.slice(0, 4).map((e, idx) => {
              const exObj = EXIDX[e.id] || { n: e.id }
              const doneSets = e.sets?.filter(s => s.done) || []
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < Math.min(selectedDayWorkouts[0].entries.length, 4) - 1 ? '1px solid var(--card-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#34d399', width: '14px', textAlign: 'right', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exObj.n}</span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--label-2)', flexShrink: 0 }}>{doneSets.length} sets</span>
                </div>
              )
            })}
            {selectedDayWorkouts[0].entries?.length > 4 && <div style={{ fontSize: '11px', color: 'var(--label-3)', fontWeight: '600', paddingTop: '5px' }}>+{selectedDayWorkouts[0].entries.length - 4} more exercises</div>}
          </div>
        ) : selectedRoutine && selectedRoutine.ex && selectedRoutine.ex.length > 0 && !S.active ? (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Exercise Lineup</div>
            {selectedRoutine.ex.slice(0, 4).map((e, idx) => {
              const exObj = EXIDX[e.id] || { n: e.id }
              return (
                <div key={idx} onClick={() => exConfigSheet(e, true, () => {}, () => {}, selectedRoutine)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', cursor: 'pointer', borderBottom: idx < Math.min(selectedRoutine.ex.length, 4) - 1 ? '1px solid var(--card-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--label-3)', width: '14px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exObj.n}</span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--label-2)', flexShrink: 0 }}>{e.sets || 3} × {e.reps || 10}</span>
                </div>
              )
            })}
            {selectedRoutine.ex.length > 4 && <div style={{ fontSize: '11px', color: 'var(--label-3)', fontWeight: '600', paddingTop: '5px' }}>+{selectedRoutine.ex.length - 4} more exercises</div>}
          </div>
        ) : null}

        {/* Action CTA */}
        {isSelectedToday && S.active ? (
          <button onClick={() => nav('/workout')} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
            border: 'none', borderRadius: '14px', padding: '15px',
            fontSize: '15px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.2px'
          }}>
            ⚡ Resume Active Workout
          </button>
        ) : isSelectedDone ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => workoutDetailSheet(selectedDayWorkouts[0])} style={{
              flex: 1,
              background: 'var(--btn-pri-bg)',
              color: 'var(--btn-pri-color)',
              boxShadow: 'var(--btn-pri-shadow)',
              border: 'none', borderRadius: '14px', padding: '14px',
              fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', letterSpacing: '-0.2px'
            }}>
              View Workout Summary
            </button>
            <button onClick={() => startFlow(selectedRoutine?.id)} style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              color: 'var(--label)',
              borderRadius: '14px', padding: '14px 16px',
              fontSize: '13.5px', fontWeight: '800', cursor: 'pointer'
            }}>
              Train Again
            </button>
          </div>
        ) : selectedRoutine ? (
          <button onClick={() => startFlow(selectedRoutine.id)} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(56,189,248,0.35)',
            border: 'none', borderRadius: '14px', padding: '15px',
            fontSize: '15px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.2px'
          }}>
            {`▶  Start ${selectedRoutine.name}`}
          </button>
        ) : (
          <button onClick={() => dayOverrideSheet(selectedDateISO)} style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--card-border)',
            color: 'var(--label-2)',
            borderRadius: '14px', padding: '14px',
            fontSize: '14px', fontWeight: '800', cursor: 'pointer'
          }}>
            + Schedule Workout for this Day
          </button>
        )}
      </div>

      {/* ─── 6. ANATOMICAL MUSCLE STIMULUS & RECOVERY HUD ────────────────── */}
      <div style={{
        background: 'var(--card-gradient, var(--card-bg))',
        border: '1px solid var(--card-border)',
        borderTop: '1px solid var(--card-border-top)',
        borderRadius: '24px',
        padding: '20px',
        marginBottom: '14px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
              Weekly Stimulus
            </div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>
              Targeted Muscle Recovery
            </div>
          </div>
          <button
            onClick={() => setShowBodyMap(v => !v)}
            style={{
              background: showBodyMap ? 'rgba(56,189,248,0.15)' : 'var(--surface-2)',
              border: showBodyMap ? '1px solid rgba(56,189,248,0.35)' : '1px solid var(--card-border)',
              color: showBodyMap ? '#38bdf8' : 'var(--label-2)',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '99px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            {showBodyMap ? 'Hide Heatmap ▲' : '3D Heatmap ▼'}
          </button>
        </div>

        {/* Inline BodyMap when toggled */}
        {showBodyMap && (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid var(--card-border)', marginBottom: '14px' }}>
            <BodyMap load={thisWeekLoad} body={S.body || (S.aiAnswers?.gender === 'female' ? 'female' : 'male')} />
          </div>
        )}

        {workedMuscles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {workedMuscles.slice(0, 4).map(slug => {
              const sets = Math.round((thisWeekLoad[slug] || 0) * 10) / 10
              const pct = Math.min(100, Math.round((sets / maxMuscleSets) * 100))
              return (
                <div key={slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--label)', minWidth: '95px' }}>
                    {t(MUSCLE_NAME[slug] || slug)}
                  </span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)', borderRadius: '99px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', minWidth: '46px', textAlign: 'right' }}>
                    {sets} sets
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ fontSize: '12.5px', color: 'var(--label-3)', textAlign: 'center', padding: '12px 0' }}>
            No sets logged yet this week. Complete today's workout to activate hypertrophy heatmap.
          </div>
        )}
      </div>

      {/* ─── 7. WEEKEND AUDIT (IF APPLICABLE) ─────────────────────────────── */}
      {isWeekend && (
        <div style={{
          background: checkedInThisWeekend ? 'var(--card-gradient, var(--card-bg))' : 'linear-gradient(145deg, rgba(52,211,153,0.1) 0%, rgba(15,23,42,0.95) 100%)',
          border: `1px solid ${checkedInThisWeekend ? 'var(--card-border)' : 'rgba(52,211,153,0.3)'}`,
          borderTop: '1px solid var(--card-border-top)',
          borderRadius: '22px',
          padding: '18px 20px',
          marginBottom: '14px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ marginBottom: '9px' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.7px', color: checkedInThisWeekend ? 'var(--label-3)' : '#34d399', background: checkedInThisWeekend ? 'var(--surface-2)' : 'rgba(52,211,153,0.14)', padding: '4px 10px', borderRadius: '99px' }}>
              {checkedInThisWeekend ? '✓ Check-in Done' : '🌟 Weekend Protocol Audit'}
            </span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px', marginBottom: '6px' }}>
            {checkedInThisWeekend ? 'Protocol calibrated for next cycle' : 'Weekly Adaptation Check-in'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--label-2)', marginBottom: '14px', lineHeight: 1.45 }}>
            {checkedInThisWeekend
              ? (S.aiCoachCard?.weeklyInsight || `Targets (${targetKcal} kcal · ${targetProtein}g protein) locked in. Rest up!`)
              : `${wThisWeek} workouts logged! Complete check-in to calibrate progressive overload.`}
          </div>
          {!checkedInThisWeekend ? (
            <button onClick={weeklyCheckinSheet} style={{ background: 'linear-gradient(145deg,#34d399 0%,#10b981 100%)', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 18px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', width: '100%', boxShadow: '0 4px 20px rgba(52,211,153,0.35)' }}>
              📸 Complete Audit &amp; Adapt Overload →
            </button>
          ) : (
            <button onClick={weeklyCheckinSheet} style={{ background: 'none', border: 'none', color: 'var(--label-3)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Review check-in →
            </button>
          )}
        </div>
      )}

      {/* ─── 8. UNIVERSAL PRECISION MACRO NUTRITION ──────────────────────── */}
      <div style={{
        background: 'var(--card-gradient, var(--card-bg))',
        border: '1px solid var(--card-border)',
        borderTop: '1px solid var(--card-border-top)',
        borderRadius: '24px',
        padding: '20px',
        marginBottom: '14px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Daily Fuel Target</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>Adaptive Precision Nutrition</div>
          </div>
          <button onClick={() => nav('/nutrition')} style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderRadius: '99px', padding: '7px 13px', fontSize: '11.5px', fontWeight: '800', color: 'var(--label-2)', cursor: 'pointer' }}>
            Log Meal →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: 'Calories', val: targetKcal, unit: 'kcal', color: '#38bdf8' },
            { label: 'Protein', val: targetProtein, unit: 'g', color: '#34d399' },
            { label: 'Carbs', val: targetCarbs, unit: 'g', color: '#818cf8' },
            { label: 'Fats', val: targetFat, unit: 'g', color: '#fbbf24' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{m.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: m.color, letterSpacing: '-0.4px', lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: '10px', color: 'var(--label-3)', fontWeight: '600', marginTop: '2px' }}>{m.unit}</div>
            </div>
          ))}
        </div>

        {[
          { label: 'Energy Target', value: `${targetKcal} kcal`, pct: 70, color: '#38bdf8' },
          { label: 'Hypertrophy Protein', value: `${targetProtein}g`, pct: 65, color: '#34d399' },
          { label: 'Glycogen Fuel (Carbs)', value: `${targetCarbs}g`, pct: 55, color: '#818cf8' },
          { label: 'Essential Lipids (Fats)', value: `${targetFat}g`, pct: 45, color: '#fbbf24' },
        ].map(({ label, value, pct, color }) => (
          <div key={label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--label-2)' }}>{label}</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--label)' }}>{value}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── 9. PHYSIQUE & BODY COMPOSITION PROGRESS ─────────────────────── */}
      <div className="card" style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Physique Velocity</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>{t('Weight Progress')}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" icon="target" onClick={goalSheet}>{S.targetW ? `${fmtNum(S.targetW)} ${S.unit}` : t('Set Goal')}</Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
        </div>
        {bw ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <div style={{ fontSize: '30px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-1px', lineHeight: 1 }}>{fmtNum(bw.w)}</div>
              <span style={{ fontSize: '14px', color: 'var(--label-3)', fontWeight: '600' }}>{S.unit}</span>
              {!!delta && (
                <span style={{ fontSize: '12px', fontWeight: '800', color: bwDeltaColor(delta, bw.w), display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
                  {fmtNum(Math.abs(delta))} {S.unit}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: 'var(--label-3)', fontWeight: '600' }}>{fmtDate(bw.d, true)}</span>
            </div>
            {bwPoints.length > 1 && <div style={{ marginTop: 14 }}><LineChart data={bwPoints} target={S.targetW} unit={S.unit} /></div>}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--label-3)' }}>
            <div style={{ fontSize: '13px', marginBottom: '10px' }}>{t('No weight logged yet.')}</div>
            <Button size="sm" onClick={() => bwSheet()}>{t('Log weight')}</Button>
          </div>
        )}
      </div>

    </div>
  )
}
