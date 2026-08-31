import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { Button } from './ui.jsx'

const clock = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')

// One bar, two meanings: the rest countdown between sets, and the work countdown during a
// timed set (issue #16). They are mutually exclusive by construction — startWork() stops any
// running rest — so the bar can never have to show both, and a work set gets its own colour
// plus a "Done" that logs the time actually held.
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
    <div id="timer" className="working" style={{ border: '1.5px solid var(--orange)', background: 'linear-gradient(135deg, rgba(20,20,24,0.98), rgba(12,12,14,0.98))', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: 16, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>🔥</span> <span>Timed Exercise Set</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--orange)' }}>{clock(work.left)}</div>
      </div>
      <div className="bar" style={{ marginBottom: 8, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
        <i style={{ width: pct + '%', height: '100%', borderRadius: 3, background: 'var(--orange)', display: 'block', transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div className="small muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {work.label || 'Hold steady!'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" onClick={stopWork}>{t('Cancel')}</Button>
          <Button size="sm" variant="primary" icon="check" style={{ background: 'var(--orange)', color: '#000', fontWeight: 700 }} onClick={finishWorkEarly}>{t('Done')}</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div id="timer" className="rest" style={{ border: '1.5px solid var(--acc)', background: 'linear-gradient(135deg, rgba(20,20,24,0.98), rgba(12,12,14,0.98))', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: 16, padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⏱️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rest Between Sets
            </div>
            <div className="small muted" style={{ fontSize: 10 }}>
              Catch your breath &amp; hydrate
            </div>
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--label)', letterSpacing: '-0.5px' }}>
          {clock(timer.left)}
        </div>
      </div>

      <div className="bar" style={{ marginBottom: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
        <i style={{ width: pct + '%', height: '100%', borderRadius: 3, background: 'var(--acc)', display: 'block', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" icon="minus" onClick={() => addRest(-15)} style={{ fontSize: 11, padding: '6px 10px' }}>-15s</Button>
          <Button size="sm" icon="plus" onClick={() => addRest(15)} style={{ fontSize: 11, padding: '6px 10px' }}>+15s</Button>
        </div>
        <Button size="sm" variant="primary" trailingIcon="chevronRight" onClick={stopRest} style={{ background: 'var(--acc)', color: 'var(--on-acc)', fontWeight: 800, fontSize: 12, padding: '6px 14px' }}>
          {t('Start Next Set →')}
        </Button>
      </div>
    </div>
  )
}
