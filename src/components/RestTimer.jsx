import { useEffect, useState, useMemo } from 'react'
import { useUI } from '../store/useUI.js'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { exOr } from '../lib/exercises.js'
import Icon from './Icon.jsx'

const clock = sec => {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.floor(Math.max(0, sec) % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RestTimer() {
  const timer = useUI(s => s.timer)
  const work = useUI(s => s.work)
  const { addRest, stopRest, togglePauseRest, finishWorkEarly, stopWork } = useUI()
  const S = useStore(s => s.S)
  const activeWorkout = S?.active

  // By default, full-screen is ON unless user disabled fullscreenRest in settings or explicitly minimized
  const userWantsFullscreen = S?.fullscreenRest !== false
  const [minimized, setMinimized] = useState(false)

  const on = work || timer

  // Whenever a new rest timer starts, expand to full screen if user has full-screen enabled
  useEffect(() => {
    if (timer && userWantsFullscreen) {
      setMinimized(false)
    }
  }, [timer?.endsAt, userWantsFullscreen])

  // Prevent background scroll when full-screen is active
  useEffect(() => {
    const isFullscreenActive = !!on && !minimized
    document.body.classList.toggle('resting', !!on)
    document.body.classList.toggle('rest-fullscreen', isFullscreenActive)
    return () => {
      document.body.classList.remove('resting')
      document.body.classList.remove('rest-fullscreen')
    }
  }, [!!on, minimized])

  // Compute Next Exercise & Next Set info from active workout
  const nextTargetInfo = useMemo(() => {
    if (!activeWorkout || !activeWorkout.entries) return null
    for (let eIdx = 0; eIdx < activeWorkout.entries.length; eIdx++) {
      const entry = activeWorkout.entries[eIdx]
      const pendingSetIdx = entry.sets.findIndex(s => !s.done)
      if (pendingSetIdx !== -1) {
        const exObj = exOr(entry.id)
        const setObj = entry.sets[pendingSetIdx]
        const unit = S.unit || 'kg'
        let targetStr = ''
        if (setObj.w > 0 && setObj.r) {
          targetStr = `${setObj.w} ${unit} × ${setObj.r} reps`
        } else if (setObj.r) {
          targetStr = `${setObj.r} reps`
        } else if (setObj.sec) {
          targetStr = `${setObj.sec}s hold`
        } else if (setObj.min) {
          targetStr = `${setObj.min} mins`
        } else {
          targetStr = 'Next working set'
        }

        return {
          name: exObj?.n || 'Upcoming Exercise',
          bodypart: exObj?.b ? exObj.b.toUpperCase() : null,
          setNum: pendingSetIdx + 1,
          totalSets: entry.sets.length,
          targetStr
        }
      }
    }
    return null
  }, [activeWorkout, S.unit])

  if (!on) return null

  // ──────────────────────────────────────────────────────────────────────────
  // 1. TIMED EXERCISE WORK TIMER (e.g. Planks)
  // ──────────────────────────────────────────────────────────────────────────
  if (work) {
    const workPct = Math.min(100, Math.max(0, (work.left / (work.total || 1)) * 100))

    if (!minimized) {
      return (
        <div
          id="work-timer-fullscreen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'radial-gradient(ellipse at 50% 35%, #1c1005 0%, #060301 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'calc(16px + env(safe-area-inset-top, 16px)) 20px calc(24px + env(safe-area-inset-bottom, 20px))',
            boxSizing: 'border-box',
            userSelect: 'none'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.3)', padding: '6px 12px', borderRadius: 99 }}>
              <span style={{ fontSize: 13, color: '#fb923c' }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Timed Exercise Set
              </span>
            </div>
            <button
              onClick={() => setMinimized(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ▾ Minimize
            </button>
          </div>

          {/* Center Circular Countdown */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto' }}>
            <div style={{ position: 'relative', width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="125" cy="125" r="105" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                <circle
                  cx="125"
                  cy="125"
                  r="105"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="12"
                  strokeDasharray="660"
                  strokeDashoffset={660 - (workPct / 100) * 660}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fb923c', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
                  HOLD TIME
                </div>
                <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: '-1.5px', color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {clock(work.left)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 700 }}>
                  {work.label || 'Keep Holding Strong'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: 12, maxWidth: 440, width: '100%', margin: '0 auto' }}>
            <button
              type="button"
              onClick={stopWork}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {t('Cancel Set')}
            </button>
            <button
              type="button"
              onClick={finishWorkEarly}
              style={{
                flex: 2,
                padding: '16px',
                borderRadius: 16,
                background: '#fb923c',
                border: 'none',
                color: '#000',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(251,146,60,0.35)'
              }}
            >
              {t('Finish Set ✓')}
            </button>
          </div>
        </div>
      )
    }

    // Minimized Work Floating Bar
    return (
      <div
        id="timer"
        className="working"
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          left: '16px',
          right: '16px',
          maxWidth: '480px',
          margin: '0 auto',
          border: '1px solid rgba(251,146,60,0.35)',
          borderTop: '2px solid #fb923c',
          background: 'var(--card-gradient, var(--card-bg))',
          boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
          borderRadius: '22px',
          padding: '16px 18px',
          color: 'var(--label)',
          zIndex: 9999,
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            <Icon name="timer" /> <span>Timed Exercise Set</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fb923c', fontVariantNumeric: 'tabular-nums' }}>
              {clock(work.left)}
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMinimized(false) }}
              style={{ background: 'rgba(251,146,60,0.15)', border: 'none', borderRadius: 8, color: '#fb923c', padding: '4px 8px', fontSize: 11, fontWeight: 900 }}
            >
              ⤢ Expand
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 12, height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: workPct + '%', height: '100%', borderRadius: 99, background: '#fb923c', transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--label-2)', fontWeight: 700 }}>
            {work.label || 'Hold steady!'}
          </div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); finishWorkEarly() }}
            style={{ background: '#fb923c', color: '#000', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
          >
            {t('Done ✓')}
          </button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REST COUNTDOWN TIMER (Between Sets)
  // ──────────────────────────────────────────────────────────────────────────
  const pct = Math.min(100, Math.max(0, (timer.left / (timer.total || 1)) * 100))
  const isEndingSoon = timer.left <= 5 && !timer.paused

  // Breathing tip based on remaining rest
  const coachPrompt = timer.paused
    ? 'Timer paused. Catch your breath and hit resume when ready.'
    : timer.left > 30
    ? 'Inhale deep through your nose for 4s... Exhale slow through your mouth.'
    : timer.left > 10
    ? 'Get into position. Check your grip and focus on the upcoming set.'
    : 'Mental lock-in! Explode with power and clean form! 💥'

  // ────────────── FULLSCREEN MODE (ANTI-MISSTOUCH SHIELD) ──────────────────
  if (!minimized) {
    return (
      <div
        id="rest-timer-fullscreen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: timer.paused
            ? 'radial-gradient(ellipse at 50% 30%, #1c1505 0%, #080601 100%)'
            : isEndingSoon
            ? 'radial-gradient(ellipse at 50% 30%, #061e14 0%, #010805 100%)'
            : 'radial-gradient(ellipse at 50% 30%, #0a192f 0%, #030712 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'calc(16px + env(safe-area-inset-top, 16px)) 20px calc(24px + env(safe-area-inset-bottom, 20px))',
          boxSizing: 'border-box',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: timer.paused ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)',
              border: timer.paused ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(56,189,248,0.25)',
              padding: '6px 14px',
              borderRadius: 99
            }}
          >
            <span style={{ fontSize: 13, color: timer.paused ? '#fbbf24' : '#38bdf8' }}>
              {timer.paused ? '⏸' : '🛡️'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: timer.paused ? '#fbbf24' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {timer.paused ? 'Rest Paused' : 'Rest Screen Shield'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.75)',
              padding: '6px 14px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>▾</span> {t('Minimize')}
          </button>
        </div>

        {/* Centerpiece: Circular SVG Progress Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto' }}>
          <div
            style={{
              position: 'relative',
              width: 260,
              height: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: isEndingSoon ? 'drop-shadow(0 0 25px rgba(52,211,153,0.45))' : 'none',
              transition: 'filter 0.3s ease'
            }}
          >
            <svg width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="restRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="pausedRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="12"
              />

              {/* Active Progress Track */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="none"
                stroke={timer.paused ? 'url(#pausedRingGradient)' : isEndingSoon ? '#34d399' : 'url(#restRingGradient)'}
                strokeWidth="12"
                strokeDasharray="691"
                strokeDashoffset={691 - (pct / 100) * 691}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.6s ease'
                }}
              />
            </svg>

            {/* Inner Digits & Status */}
            <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: timer.paused ? '#fbbf24' : isEndingSoon ? '#34d399' : '#38bdf8',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                {timer.paused ? '⏸ PAUSED' : isEndingSoon ? '⚡ GET READY' : 'RECOVERING'}
              </div>

              <div
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  color: '#ffffff',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  textShadow: '0 4px 24px rgba(0,0,0,0.5)'
                }}
              >
                {clock(timer.left)}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 6
                }}
              >
                {timer.total}s total rest
              </div>
            </div>
          </div>

          {/* Up Next Exercise Preview Card */}
          {nextTargetInfo && (
            <div
              style={{
                marginTop: 20,
                width: '100%',
                maxWidth: 380,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18,
                padding: '12px 18px',
                textAlign: 'left',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  ⚡ Up Next · Set {nextTargetInfo.setNum} of {nextTargetInfo.totalSets}
                </span>
                {nextTargetInfo.bodypart && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>
                    {nextTargetInfo.bodypart}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: 2 }}>
                {nextTargetInfo.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                Target: <span style={{ color: '#34d399', fontWeight: 800 }}>{nextTargetInfo.targetStr}</span>
              </div>
            </div>
          )}

          {/* Breathing / Motivational Cue */}
          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              maxWidth: 340,
              lineHeight: 1.4
            }}
          >
            {coachPrompt}
          </div>
        </div>

        {/* Bottom Controls Area (Anti-Misstouch Large Thumb Targets) */}
        <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Quick Increments */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => addRest(-15)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                borderRadius: 16,
                padding: '14px 10px',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              −15s
            </button>

            <button
              type="button"
              onClick={togglePauseRest}
              style={{
                background: timer.paused ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.06)',
                border: timer.paused ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
                color: timer.paused ? '#fbbf24' : '#ffffff',
                borderRadius: 16,
                padding: '14px 10px',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span>{timer.paused ? '▶' : '⏸'}</span>
              <span>{timer.paused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={() => addRest(30)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                borderRadius: 16,
                padding: '14px 10px',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              +30s
            </button>
          </div>

          {/* Primary Skip / I'm Ready Button */}
          <button
            type="button"
            onClick={stopRest}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 18,
              padding: '18px 24px',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '-0.3px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>I'm Ready ✓</span>
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>(Skip Rest)</span>
          </button>
        </div>
      </div>
    )
  }

  // ────────────── MINIMIZED FLOATING BAR ────────────────────────────────────
  return (
    <div
      id="timer"
      className="rest"
      onClick={() => setMinimized(false)}
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '16px',
        right: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        border: timer.paused ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(56,189,248,0.28)',
        borderTop: timer.paused ? '2px solid #fbbf24' : '2px solid #38bdf8',
        background: 'var(--card-gradient, var(--card-bg))',
        boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
        borderRadius: '22px',
        padding: '16px 18px',
        color: 'var(--label)',
        zIndex: 9999,
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: timer.paused ? 'rgba(251,191,36,0.15)' : 'rgba(56,189,248,0.14)',
              border: timer.paused ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(56,189,248,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: timer.paused ? '#fbbf24' : '#38bdf8',
              fontSize: 16
            }}
          >
            <Icon name="timer" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: timer.paused ? '#fbbf24' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Rest Timer {timer.paused && <span style={{ color: '#fbbf24' }}>· Paused</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600 }}>
              {nextTargetInfo ? `Up next: ${nextTargetInfo.name}` : 'Tap to expand full screen'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: timer.paused ? '#fbbf24' : 'var(--label)', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>
            {clock(timer.left)}
          </div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setMinimized(false) }}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              color: 'var(--label-2)',
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Expand to full screen"
          >
            ⤢ Expand
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); stopRest() }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              color: 'var(--label-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800
            }}
            aria-label="Dismiss timer"
            title="Dismiss rest timer"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12, height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div
          style={{
            width: pct + '%',
            height: '100%',
            borderRadius: 99,
            background: timer.paused ? '#fbbf24' : 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); addRest(-15) }}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              color: 'var(--label)',
              borderRadius: 10,
              padding: '7px 11px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            −15s
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); addRest(30) }}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              color: 'var(--label)',
              borderRadius: 10,
              padding: '7px 11px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            +30s
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); togglePauseRest() }}
            style={{
              background: timer.paused ? 'rgba(251,191,36,0.14)' : 'var(--surface-2)',
              border: timer.paused ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--card-border)',
              color: timer.paused ? '#fbbf24' : 'var(--label)',
              borderRadius: 10,
              padding: '7px 11px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {timer.paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>

        <button
          type="button"
          onClick={e => { e.stopPropagation(); stopRest() }}
          style={{
            background: 'var(--btn-pri-bg)',
            color: 'var(--btn-pri-color)',
            boxShadow: 'var(--btn-pri-shadow)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {t("I'm Ready ✓")}
        </button>
      </div>
    </div>
  )
}
