import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { lastBW, streakWeeks } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, weekKey } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { bwSheet, goalSheet, calendarSheet, workoutDetailSheet, bwDeltaColor, weeklyCheckinSheet } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Heatmap from '../components/Heatmap.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'

export default function Stats() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const [range, setRange] = useState(90)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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

  const allPhotos = S.photos || []
  const checkins = S.checkins || []

  return (
    <div className="narrow" style={{ paddingBottom: '120px' }}>
      {/* Header */}
      <div className="hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="iconbtn" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--label-1, #fff)', letterSpacing: '-0.5px' }}>
            {t('Progress & Stats')}
          </h1>
        </div>
        <Button size="sm" variant="primary" icon="sparkles" onClick={weeklyCheckinSheet}>
          {t('📸 Check-in')}
        </Button>
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

      {/* ── PHYSIQUE TRANSFORMATION PHOTO GALLERY ─────────────── */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>📸 Physique Timeline</h2>
            <div className="small muted" style={{ fontSize: '11px' }}>Week-by-week visual transformation photos</div>
          </div>
          <Button size="sm" icon="plus" onClick={weeklyCheckinSheet}>
            {t('Add Photos')}
          </Button>
        </div>

        {allPhotos.length > 0 ? (
          <>
            {/* Before & After comparison if 2+ photos */}
            {allPhotos.length >= 2 && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', marginBottom: 8 }}>
                  ⚡ Visual Progression Comparison
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2)', marginBottom: 4 }}>
                      Start ({fmtDate(allPhotos[0].date, true)}) · {allPhotos[0].weight} {S.unit}
                    </div>
                    <div style={{ borderRadius: 8, overflow: 'hidden', height: 160, background: '#000', cursor: 'pointer' }} onClick={() => setSelectedPhoto(allPhotos[0].photoUrl)}>
                      <img src={allPhotos[0].photoUrl} alt="Initial" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--acc)', marginBottom: 4 }}>
                      Latest ({fmtDate(allPhotos[allPhotos.length - 1].date, true)}) · {allPhotos[allPhotos.length - 1].weight} {S.unit}
                    </div>
                    <div style={{ borderRadius: 8, overflow: 'hidden', height: 160, background: '#000', cursor: 'pointer' }} onClick={() => setSelectedPhoto(allPhotos[allPhotos.length - 1].photoUrl)}>
                      <img src={allPhotos[allPhotos.length - 1].photoUrl} alt="Latest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Stream Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[...allPhotos].reverse().map((p, idx) => (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPhoto(p.photoUrl)}
                  style={{
                    position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120,
                    background: '#000', border: '1px solid var(--sep)', cursor: 'pointer'
                  }}
                >
                  <img src={p.photoUrl} alt="Progress" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                      padding: '12px 6px 4px', fontSize: 10, fontWeight: 700, color: '#fff'
                    }}
                  >
                    <div>{fmtDate(p.date, true)}</div>
                    <div style={{ color: 'var(--acc)', fontSize: 9 }}>{p.weight} {S.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 10px', background: 'var(--surface-2)', borderRadius: 12 }}>
            <span style={{ fontSize: 32 }}>📸</span>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>No Physique Photos Yet</div>
            <div className="small muted" style={{ fontSize: 11, margin: '4px 0 12px' }}>
              Upload your weekly Monday check-in photos to build your visual timeline.
            </div>
            <Button size="sm" variant="primary" icon="plus" onClick={weeklyCheckinSheet}>
              Upload First Progress Photo
            </Button>
          </div>
        )}
      </div>

      {/* Enlarge Photo Modal Overlay */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={selectedPhoto} alt="Full Size" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute', top: -14, right: -14, background: 'var(--acc)',
                color: '#000', border: 'none', borderRadius: '50%', width: 32, height: 32,
                fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── WEEKLY CHECK-IN HISTORY LOG ───────────────────────── */}
      {checkins.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: '800' }}>📋 Check-in History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...checkins].reverse().map((c, idx) => (
              <div key={c.id || idx} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, border: '1px solid var(--sep)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Check-in · {fmtDate(c.date, true)}
                  </div>
                  <span className="tag acc" style={{ fontSize: 11 }}>
                    {c.weight} {S.unit}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: c.notes ? 6 : 0 }}>
                  <span style={{ fontSize: 10, background: 'var(--surface-3)', padding: '2px 7px', borderRadius: 4 }}>
                    Difficulty: {c.difficulty === 'easy' ? '😅 Light' : c.difficulty === 'hard' ? '😤 Heavy' : '💪 Optimal'}
                  </span>
                  <span style={{ fontSize: 10, background: 'var(--surface-3)', padding: '2px 7px', borderRadius: 4 }}>
                    Recovery: {c.soreness === 'sore' ? '😣 High Fatigue' : c.soreness === 'fresh' ? '😌 Fresh' : '😐 Mild Soreness'}
                  </span>
                  <span style={{ fontSize: 10, background: 'var(--surface-3)', padding: '2px 7px', borderRadius: 4 }}>
                    Diet: {c.dietRating === 'on_track' ? '🥗 100%' : '🥪 80%'}
                  </span>
                  {c.photos && c.photos.length > 0 && (
                    <span style={{ fontSize: 10, background: 'rgba(37,99,235,0.2)', color: 'var(--blue)', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                      📸 {c.photos.length} Photo{c.photos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {c.notes && (
                  <div className="small muted" style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                    "{c.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
