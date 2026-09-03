import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, fmtVol, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { EXIDX } from '../lib/exercises.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, bwDeltaColor, athleteProfileSheet, weeklyCheckinSheet, exConfigSheet } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'

/* ── Apple-style SVG mini activity ring ───────────────────────────── */
function MiniRing({ done = false, today = false, size = 30 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const ringColor = done ? '#34d399' : today ? '#60a5fa' : 'transparent'
  const trackColor = done ? 'rgba(52,211,153,0.18)' : today ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.08)'
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={4.5} />
      {(done || today) && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={ringColor} strokeWidth={4.5}
          strokeDasharray={done ? `${circ} 0` : `${circ * 0.18} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90,${size / 2},${size / 2})`}
          style={{ filter: done ? 'drop-shadow(0 0 4px rgba(52,211,153,0.8))' : 'drop-shadow(0 0 4px rgba(96,165,250,0.8))' }}
        />
      )}
    </svg>
  )
}

/* ── Large hero ring (weekly completion) ──────────────────────────── */
function HeroRing({ pct = 0, size = 130, children }) {
  const r = (size - 18) / 2
  const circ = 2 * Math.PI * r
  const fill = Math.min(pct / 100, 1) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="hRG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={15} />
        {pct > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="url(#hRG)" strokeWidth={15}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90,${size / 2},${size / 2})`}
            style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))' }}
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

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  const greet = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="narrow" style={{ paddingBottom: '148px' }}>

      {/* ─── 1. HEADER ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', paddingTop: '4px' }}>
        <div onClick={() => athleteProfileSheet()} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            {S.profilePhoto || user?.avatar ? (
              <img
                src={S.profilePhoto || user.avatar}
                alt="Profile"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.18)', display: 'block' }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(145deg,#38bdf8 0%,#818cf8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: '#000', border: '2px solid rgba(255,255,255,0.18)'
              }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#34d399', border: '2px solid #000' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.38)', marginBottom: '2px', letterSpacing: '0.02em' }}>
              {today.toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.6px', color: '#fff', lineHeight: 1.15 }}>
              {greet}, {firstName} 👋
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div onClick={() => calendarSheet()} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderTop: '1px solid rgba(255,255,255,0.20)', borderRadius: '99px', padding: '7px 13px', fontSize: '12px', fontWeight: '800', color: '#fff', cursor: 'pointer', letterSpacing: '-0.2px' }}>
            🔥 <span>{streakWeeks(S)}w</span>
          </div>
          <button className="iconbtn" onClick={() => update(s => { s.theme = s.theme === 'light' ? 'dark' : 'light' })} style={{ width: 36, height: 36, borderRadius: '50%' }}>
            <Icon name={S.theme === 'light' ? 'moon' : 'sun'} />
          </button>
          <button className="iconbtn" onClick={() => nav('/settings')} style={{ width: 36, height: 36, borderRadius: '50%' }}>
            <Icon name="gear" />
          </button>
        </div>
      </div>

      {/* ─── 2. HERO RING CARD ───────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg,#0d1627 0%,#080e1a 100%)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.16)', borderRadius: '28px', padding: '22px 20px 18px', marginBottom: '14px', boxShadow: '0 10px 50px rgba(0,0,0,0.55)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: '40%', width: 200, height: 160, background: 'radial-gradient(ellipse,rgba(99,102,241,0.16) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HeroRing pct={weeklyCompletionPct} size={128}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-1.2px', lineHeight: 1 }}>
              {weeklyCompletionPct}<span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>%</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: '3px' }}>weekly</div>
          </HeroRing>

          <div style={{ flex: 1, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {[
              { icon: '🏋️', label: 'Sessions', value: `${wThisWeek} / ${plannedPerWeek}`, color: '#60a5fa' },
              { icon: '⚡', label: 'Readiness', value: `${readinessScore}`, color: readinessColor },
              { icon: '📈', label: 'Volume', value: totalWeeklyVol > 0 ? fmtVol(totalWeeklyVol, S.unit) : '—', color: '#34d399' },
              { icon: '⚖️', label: 'Body', value: bw ? `${fmtNum(bw.w)} ${S.unit}` : 'Log it', color: '#fbbf24', tap: () => bwSheet() },
            ].map(({ icon, label, value, color, tap }) => (
              <div key={label} onClick={tap} style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: tap ? 'pointer' : 'default' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.36)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: label === 'Readiness' ? color : '#fff', letterSpacing: '-0.4px', lineHeight: 1.1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '18px', width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: `${weeklyCompletionPct}%`, height: '100%', background: 'linear-gradient(90deg,#38bdf8,#818cf8,#34d399)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: '600' }}>AI Coach Protocol Active</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: '600' }}>{wThisWeek}/{plannedPerWeek} workouts</div>
        </div>
      </div>

      {/* ─── 3. ESSENTIAL DAILY ACTIONS (100% WIDTH, NO SCROLLING) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { icon: '▶', label: S.active ? 'Resume' : routine ? 'Start' : 'Workout', isPrimary: true, action: onToday },
          { icon: null, label: 'Log Meal', isPrimary: false, action: () => nav('/nutrition') },
          { icon: null, label: 'Weigh In', isPrimary: false, action: () => bwSheet() },
        ].map(({ icon, label, isPrimary, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isPrimary ? '#ffffff' : 'rgba(255,255,255,0.06)',
              border: isPrimary ? 'none' : '1px solid rgba(255,255,255,0.09)',
              borderRadius: '14px',
              padding: '11px 6px',
              fontSize: '12.5px',
              fontWeight: '800',
              color: isPrimary ? '#000000' : 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              letterSpacing: '-0.2px',
              transition: 'all 0.15s ease',
              width: '100%',
              textAlign: 'center'
            }}
          >
            {icon && <span style={{ fontSize: '10px' }}>{icon}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── 4. 7-DAY RING STRIP ─────────────────────────────────────── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.14)', borderRadius: '22px', padding: '16px 14px', marginBottom: '14px', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--label)', letterSpacing: '-0.3px' }}>{wkLabel}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 12, borderRadius: '8px' }} onClick={() => setWeekOffset(w => w - 1)}><Icon name="chevronLeft" /></button>
            <button className="iconbtn" style={{ width: 28, height: 28, fontSize: 12, borderRadius: '8px' }} onClick={() => setWeekOffset(w => w + 1)}><Icon name="chevronRight" /></button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2px' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday); d.setDate(monday.getDate() + i)
            const iso = isoOf(d)
            const isDone = S.workouts.some(w => w.d === iso)
            const isToday = iso === todayISO()
            return (
              <div key={i} onClick={() => dayOverrideSheet(iso)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', padding: '4px 2px', borderRadius: '12px', background: isToday ? 'rgba(96,165,250,0.08)' : 'transparent' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: isToday ? '#60a5fa' : 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                  {t(DAYS[d.getDay()]).slice(0, 1)}
                </div>
                <MiniRing done={isDone} today={isToday && !isDone} size={30} />
                <div style={{ fontSize: '12px', fontWeight: isToday ? '900' : '600', color: isToday ? '#60a5fa' : isDone ? '#34d399' : 'rgba(255,255,255,0.42)', marginTop: '5px', lineHeight: 1 }}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 5. TODAY'S TRAINING CARD ────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg,#0d1627 0%,#090e1c 100%)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '20px', marginBottom: '14px', boxShadow: '0 8px 36px rgba(0,0,0,0.48)', position: 'relative', overflow: 'hidden' }}>
        {S.active && <div style={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, background: 'radial-gradient(circle,rgba(245,158,11,0.22) 0%,transparent 70%)', pointerEvents: 'none' }} />}
        {routine && !S.active && <div style={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, background: 'radial-gradient(circle,rgba(52,211,153,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block', background: S.active ? '#f59e0b' : routine ? '#34d399' : 'rgba(255,255,255,0.22)', boxShadow: S.active ? '0 0 8px #f59e0b' : routine ? '0 0 7px #34d399' : 'none' }} />
            <span style={{ fontSize: '10.5px', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
              {S.active ? '⚡ Session In Progress' : routine ? "Today's Protocol" : 'Active Recovery'}
            </span>
          </div>
          {routine && !S.active && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', padding: '3px 9px', borderRadius: '99px', color: 'rgba(255,255,255,0.48)' }}>~45 min</span>
              <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(52,211,153,0.11)', border: '1px solid rgba(52,211,153,0.22)', padding: '3px 9px', borderRadius: '99px', color: '#34d399' }}>{routine.ex.length} exercises</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <Icon name={S.active ? 'timer' : routine ? glyphOf(routine.emoji) : 'moon'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
              {S.active ? S.active.name : routine ? routine.name : 'Rest & Recovery'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.3 }}>
              {S.active
                ? `${setsDoneActive(S.active)} / ${S.active.entries.reduce((n, e) => n + e.sets.length, 0)} sets completed`
                : routine ? 'AI-calibrated progressive overload' : 'Hydrate · hit protein · sleep 8h'}
            </div>
          </div>
        </div>

        {routine && routine.ex && routine.ex.length > 0 && !S.active && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Exercise Lineup</div>
            {routine.ex.slice(0, 4).map((e, idx) => {
              const exObj = EXIDX[e.id] || { n: e.id }
              return (
                <div key={idx} onClick={() => exConfigSheet(e, true, () => {}, () => {}, routine)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', cursor: 'pointer', borderBottom: idx < Math.min(routine.ex.length, 4) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.20)', width: '14px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exObj.n}</span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'rgba(255,255,255,0.36)', flexShrink: 0 }}>{e.sets || 3} × {e.reps || 10}</span>
                </div>
              )
            })}
            {routine.ex.length > 4 && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.26)', fontWeight: '600', paddingTop: '5px' }}>+{routine.ex.length - 4} more exercises</div>}
          </div>
        )}

        <button onClick={onToday} style={{
          width: '100%',
          background: S.active ? 'linear-gradient(145deg,#f59e0b 0%,#d97706 100%)' : routine ? 'linear-gradient(145deg,#ffffff 0%,#e2e8f0 100%)' : 'rgba(255,255,255,0.07)',
          color: (S.active || routine) ? '#000' : 'rgba(255,255,255,0.48)',
          border: 'none', borderRadius: '14px', padding: '15px',
          fontSize: '15px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.2px',
          boxShadow: S.active ? '0 6px 24px rgba(245,158,11,0.4)' : routine ? '0 6px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.6)' : 'none'
        }}>
          {S.active ? '⚡ Resume Active Workout' : routine ? `▶  Start ${routine.name}` : '📅 Schedule or Log Workout'}
        </button>
      </div>

      {/* ─── 6. WEEKEND CHECK-IN ─────────────────────────────────────── */}
      {isWeekend && (
        <div style={{ background: checkedInThisWeekend ? 'var(--card-bg)' : 'linear-gradient(145deg,rgba(52,211,153,0.09) 0%,rgba(10,16,30,0.98) 100%)', border: `1px solid ${checkedInThisWeekend ? 'rgba(255,255,255,0.07)' : 'rgba(52,211,153,0.22)'}`, borderTop: '1px solid rgba(255,255,255,0.13)', borderRadius: '22px', padding: '18px 20px', marginBottom: '14px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ marginBottom: '9px' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.7px', color: checkedInThisWeekend ? 'rgba(255,255,255,0.38)' : '#34d399', background: checkedInThisWeekend ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.12)', padding: '4px 10px', borderRadius: '99px' }}>
              {checkedInThisWeekend ? '✓ Check-in Done' : '🌟 Weekend Audit Due'}
            </span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: '#fff', letterSpacing: '-0.3px', marginBottom: '6px' }}>
            {checkedInThisWeekend ? 'Protocol calibrated for next week' : 'Weekend Progress Check-in'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', marginBottom: '14px', lineHeight: 1.45 }}>
            {checkedInThisWeekend
              ? (S.aiCoachCard?.weeklyInsight || `Targets (${targetKcal} kcal · ${targetProtein}g protein) locked in. Rest up!`)
              : `${wThisWeek} workouts logged! Check in to adapt next week's progressive overload.`}
          </div>
          {!checkedInThisWeekend ? (
            <button onClick={weeklyCheckinSheet} style={{ background: 'linear-gradient(145deg,#34d399 0%,#10b981 100%)', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 18px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', width: '100%', boxShadow: '0 4px 20px rgba(52,211,153,0.38)' }}>
              📸 Complete Check-in &amp; Adapt Plan →
            </button>
          ) : (
            <button onClick={weeklyCheckinSheet} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.42)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Review check-in →
            </button>
          )}
        </div>
      )}

      {/* ─── 7. NUTRITION SNAPSHOT ───────────────────────────────────── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.13)', borderRadius: '22px', padding: '18px 20px', marginBottom: '14px', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '2px' }}>Daily Target</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>Nutrition Plan</div>
          </div>
          <button onClick={() => nav('/nutrition')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '99px', padding: '7px 13px', fontSize: '11.5px', fontWeight: '800', color: 'rgba(255,255,255,0.62)', cursor: 'pointer' }}>
            Log Meal →
          </button>
        </div>
        {[
          { label: 'Calories', value: `${targetKcal} kcal`, pct: 70 },
          { label: 'Protein', value: `${targetProtein}g`, pct: 62 },
          { label: 'Carbs', value: `${targetCarbs}g`, pct: 54 },
          { label: 'Fats', value: `${targetFat}g`, pct: 48 },
        ].map(({ label, value, pct }) => (
          <div key={label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{value}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'rgba(255,255,255,0.75)', borderRadius: '99px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── 8. BODY WEIGHT TRACKER ──────────────────────────────────── */}
      <div className="card" style={{ padding: '18px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '2px' }}>Body Composition</div>
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
              <span style={{ fontSize: '14px', color: 'var(--label-3)', fontWeight: '500' }}>{S.unit}</span>
              {!!delta && (
                <span style={{ fontSize: '12px', fontWeight: '800', color: bwDeltaColor(delta, bw.w), display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
                  {fmtNum(Math.abs(delta))} {S.unit}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--label-3)', fontWeight: '600' }}>{fmtDate(bw.d, true)}</span>
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
