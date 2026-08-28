import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { lastBW, streakWeeks } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, weekKey } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { bwSheet, goalSheet, calendarSheet, workoutDetailSheet, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Heatmap from '../components/Heatmap.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'

export default function Stats() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const [range, setRange] = useState(90)

  // 30d weight delta
  const now = Date.now()
  const bwHist = S.bodyweight || []
  const bwLatest = lastBW(S)
  const bw30dAgo = bwHist.find(b => (new Date(b.d).getTime()) > now - 30 * 86400000)
  const bwDelta30 = bwLatest && bw30dAgo ? bwLatest.w - bw30dAgo.w : null

  const monthW = S.workouts.filter(w => {
    const d = new Date(w.d)
    const today = new Date()
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  const bwPts = bwHist
    .filter(b => range === 0 || (new Date(b.d).getTime()) > now - range * 86400000)
    .map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  return (
    <div className="narrow">
      {/* Header */}
      <div className="hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="iconbtn" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--label-1, #fff)', letterSpacing: '-0.5px' }}>
            {t('Progress & Stats')}
          </h1>
        </div>
      </div>

      {/* Basic KPI Tiles */}
      <div className="tiles" style={{ marginBottom: '16px' }}>
        <div className="tile"><div className="l"><Icon name="dumbbell" />{t('Workouts')}</div><div className="v">{S.workouts.length}</div></div>
        <div className="tile"><div className="l"><Icon name="calendar" />{t('This month')}</div><div className="v">{monthW}</div></div>
        <div className="tile"><div className="l"><Icon name="flame" style={{ color: 'var(--orange)' }} />{t('Week streak')}</div><div className="v">{streakWeeks(S)}</div></div>
        <div className="tile">
          <div className="l"><Icon name="scale" />{t('Weight 30d')}</div>
          <div className="v" style={{ fontSize: 20, color: bwDelta30 === null ? 'inherit' : bwDeltaColor(bwDelta30, (lastBW(S) || {}).w || 0) }}>
            {bwDelta30 === null ? '—' : (bwDelta30 > 0 ? '+' : '') + fmtNum(bwDelta30) + ' ' + S.unit}
          </div>
        </div>
      </div>

      {/* Calendar / Activity Heatmap */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h2>{t('Training Calendar')} <span className="dim" style={{ textTransform: 'none', letterSpacing: 0 }}>· {t('last 12 months')}</span></h2>
        <Heatmap S={S} onDay={iso => { const ws = S.workouts.filter(w => w.d === iso); if (ws.length === 1) workoutDetailSheet(ws[0]); else if (ws.length) calendarSheet(iso) }} />
      </div>

      {/* Body Weight Chart */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{t('Body Weight Trend')}</h2>
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
        </div>
        <Segmented className="seg-range" value={range} onChange={setRange}
          options={[{ value: 30, label: '1M' }, { value: 90, label: '3M' }, { value: 365, label: '1Y' }, { value: 0, label: t('All') }]} />
        {bwPts.length ? (
          <div className="chart"><LineChart points={bwPts} h={160} unit={S.unit} goal={S.targetW} /></div>
        ) : (
          <div className="muted small" style={{ padding: '20px 0', textAlign: 'center' }}>
            {t('Log your weight to see your progress curve.')}
          </div>
        )}
      </div>
    </div>
  )
}
