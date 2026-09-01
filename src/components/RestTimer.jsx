import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { Button } from './ui.jsx'

const clock = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')

export default function RestTimer() {
  const timer = useUI(s => s.timer)
  const work = useUI(s => s.work)
  const { addRest, stopRest, finishWorkEarly, stopWork } = useUI()
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
        border: '1.5px solid var(--orange)',
        background: 'var(--card-bg)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        borderRadius: 18,
        padding: '14px 18px',
        color: 'var(--label)',
        zIndex: 999
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <span>🔥</span> <span>Timed Exercise Set</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orange)', fontVariantNumeric: 'tabular-nums' }}>
          {clock(work.left)}
        </div>
      </div>

      <div style={{ marginBottom: 10, height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: 'var(--orange)', transition: 'width 0.3s' }} />
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
              border: '1px solid var(--sep)',
              color: 'var(--label)',
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
              background: 'var(--orange)',
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
        border: '1.5px solid var(--acc)',
        background: 'var(--card-bg)',
        boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: '14px 18px',
        color: 'var(--label)',
        zIndex: 999
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>⏱️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Rest Between Sets
            </div>
            <div style={{ fontSize: 11, color: 'var(--label-2)', fontWeight: 600 }}>
              Catch your breath &amp; prepare
            </div>
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--label)', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>
          {clock(timer.left)}
        </div>
      </div>

      <div style={{ marginBottom: 12, height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: 'var(--acc)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => addRest(-15)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--sep)',
              color: 'var(--label)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            −15s
          </button>
          <button
            type="button"
            onClick={() => addRest(15)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--sep)',
              color: 'var(--label)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            +15s
          </button>
        </div>
        <button
          type="button"
          onClick={stopRest}
          style={{
            background: 'var(--btn-pri-bg)',
            color: 'var(--btn-pri-color)',
            border: '1px solid var(--btn-pri-border)',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: 'var(--btn-pri-shadow)'
          }}
        >
          {t('Start Next Set →')}
        </button>
      </div>
    </div>
  )
}
