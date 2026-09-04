import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

const clock = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')

export default function RestTimer() {
  const timer = useUI(s => s.timer)
  const work = useUI(s => s.work)
  const { addRest, stopRest, togglePauseRest, finishWorkEarly, stopWork } = useUI()
  const on = work || timer

  useEffect(() => {
    document.body.classList.toggle('resting', !!on)
    return () => document.body.classList.remove('resting')
  }, [!!on])

  if (!on) return null
  const pct = (on.left / on.total) * 100

  if (work) return (
    <div
      id="timer"
      className="working"
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '16px',
        right: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        border: '1px solid rgba(251,146,60,0.3)',
        borderTop: '2px solid #fb923c',
        background: 'var(--card-gradient, var(--card-bg))',
        boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
        borderRadius: '22px',
        padding: '16px 18px',
        color: 'var(--label)',
        zIndex: 999
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <Icon name="timer" /> <span>Timed Exercise Set</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fb923c', fontVariantNumeric: 'tabular-nums' }}>
          {clock(work.left)}
        </div>
      </div>

      <div style={{ marginBottom: 12, height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: '#fb923c', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--label-2)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {work.label || 'Hold steady!'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={stopWork}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--card-border)',
              color: 'var(--label-2)',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={finishWorkEarly}
            style={{
              background: '#fb923c',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {t('Done ✓')}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div
      id="timer"
      className="rest"
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '16px',
        right: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        border: '1px solid rgba(56,189,248,0.28)',
        borderTop: '2px solid #38bdf8',
        background: 'var(--card-gradient, var(--card-bg))',
        boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
        borderRadius: '22px',
        padding: '16px 18px',
        color: 'var(--label)',
        zIndex: 999
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(56,189,248,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#38bdf8', fontSize: 16
          }}>
            <Icon name="timer" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Rest Timer {timer.paused && <span style={{ color: '#fbbf24' }}>· Paused</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600 }}>
              {timer.paused ? 'Timer paused · Tap resume' : 'Catch your breath & prepare'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: timer.paused ? '#fbbf24' : 'var(--label)', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>
            {clock(timer.left)}
          </div>
          <button
            type="button"
            onClick={stopRest}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--card-border)',
              color: 'var(--label-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 12, fontWeight: 800
            }}
            aria-label="Dismiss timer"
            title="Dismiss rest timer"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12, height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{
          width: pct + '%', height: '100%', borderRadius: 99,
          background: timer.paused ? '#fbbf24' : 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => addRest(-15)}
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
            onClick={() => addRest(30)}
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
            onClick={togglePauseRest}
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
          onClick={stopRest}
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
