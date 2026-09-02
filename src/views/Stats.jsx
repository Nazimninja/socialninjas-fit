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
  const streak = streakWeeks(S)

  const card = {
    background: 'linear-gradient(150deg,#0d1627 0%,#090e1c 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderTop: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '24px', padding: '20px',
    marginBottom: '14px',
    boxShadow: '0 6px 30px rgba(0,0,0,0.45)'
  }

  const sectionLabel = { fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '3px' }
  const sectionTitle = { fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '-0.4px', marginBottom: '16px' }

  return (
    <div className="narrow" style={{ paddingBottom: '148px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => nav('/home')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <Icon name="chevronLeft" />
          </button>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1px' }}>Your journey</div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#fff', letterSpacing: '-0.6px' }}>Progress & Stats</h1>
          </div>
        </div>
        <button onClick={weeklyCheckinSheet} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(145deg,#34d399 0%,#10b981 100%)', border: 'none', borderRadius: '99px', padding: '9px 16px', fontSize: '12.5px', fontWeight: '900', color: '#000', cursor: 'pointer', boxShadow: '0 4px 16px rgba(52,211,153,0.35)' }}>
          <span>📸</span><span>Check-in</span>
        </button>
      </div>

      {/* KPI TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { icon: '🏋️', label: 'Total Workouts', value: S.workouts.length, color: '#60a5fa', sub: 'all time' },
          { icon: '📅', label: 'This Month', value: monthW, color: '#34d399', sub: 'sessions' },
          { icon: '🔥', label: 'Week Streak', value: streak + 'w', color: '#f59e0b', sub: 'consecutive weeks' },
          {
            icon: '⚖️', label: 'Weight 30d',
            color: bwDelta30 === null ? 'rgba(255,255,255,0.5)' : bwDeltaColor(bwDelta30, (bwLatest || {}).w || 0),
            value: bwDelta30 === null ? '—' : (bwDelta30 > 0 ? '+' : '') + fmtNum(bwDelta30) + ' ' + S.unit,
            sub: bwLatest ? 'now ' + fmtNum(bwLatest.w) + ' ' + S.unit : 'log weight', tap: () => bwSheet()
          },
        ].map(({ icon, label, value, color, sub, tap }) => (
          <div key={label} onClick={tap} style={{ background: 'linear-gradient(150deg,#0d1627 0%,#090e1c 100%)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.14)', borderRadius: '20px', padding: '16px', cursor: tap ? 'pointer' : 'default', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{icon}</div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color, letterSpacing: '-0.8px', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: '600', marginTop: '4px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* PHYSIQUE TIMELINE */}
      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={sectionLabel}>Visual transformation</div>
            <div style={{ ...sectionTitle, marginBottom: 0 }}>📸 Physique Timeline</div>
          </div>
          <button onClick={weeklyCheckinSheet} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '99px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>+</span><span>Add Photo</span>
          </button>
        </div>

        {allPhotos.length > 0 ? (
          <>
            {allPhotos.length >= 2 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>⚡ Transformation Comparison</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { photo: allPhotos[0], label: 'Start', lc: 'rgba(255,255,255,0.5)' },
                    { photo: allPhotos[allPhotos.length - 1], label: 'Latest', lc: '#34d399' }
                  ].map(({ photo, label, lc }) => (
                    <div key={label}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: lc, marginBottom: '6px' }}>{label} · {fmtDate(photo.date, true)} · {photo.weight} {S.unit}</div>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', height: 150, background: '#000', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setSelectedPhoto(photo.photoUrl)}>
                        <img src={photo.photoUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[...allPhotos].reverse().map((p, idx) => (
                <div key={p.id || idx} onClick={() => setSelectedPhoto(p.photoUrl)} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: 110, background: '#000', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <img src={p.photoUrl} alt="Progress" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.9),transparent)', padding: '14px 7px 5px', fontSize: '9.5px', fontWeight: '700', color: '#fff' }}>
                    <div>{fmtDate(p.date, true)}</div>
                    <div style={{ color: '#34d399', fontSize: '9px' }}>{p.weight} {S.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.10)' }}>
            <div style={{ fontSize: '38px', marginBottom: '10px' }}>📸</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>No Photos Yet</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginBottom: '18px', lineHeight: 1.55 }}>Upload weekly check-in photos to<br />build your visual transformation timeline</div>
            <button onClick={weeklyCheckinSheet} style={{ background: 'linear-gradient(145deg,#34d399 0%,#10b981 100%)', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(52,211,153,0.35)' }}>
              + Upload First Progress Photo
            </button>
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={selectedPhoto} alt="Full Size" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain' }} />
            <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: -12, right: -12, background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: 30, height: 30, fontWeight: '900', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>
      )}

      {/* CHECK-IN HISTORY */}
      {checkins.length > 0 && (
        <div style={{ ...card }}>
          <div style={sectionLabel}>History</div>
          <div style={sectionTitle}>📋 Check-in Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...checkins].reverse().map((c, idx) => (
              <div key={c.id || idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>Check-in · {fmtDate(c.date, true)}</div>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)', padding: '3px 9px', borderRadius: '99px' }}>{c.weight} {S.unit}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    c.difficulty === 'easy' ? '😅 Light' : c.difficulty === 'hard' ? '😤 Heavy' : '💪 Optimal',
                    c.soreness === 'sore' ? '😣 High Fatigue' : c.soreness === 'fresh' ? '😌 Fresh' : '😐 Mild Soreness',
                    c.dietRating === 'on_track' ? '🥗 Diet 100%' : '🥪 Diet 80%',
                  ].map(tag => (
                    <span key={tag} style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', padding: '3px 8px', borderRadius: '99px', color: 'rgba(255,255,255,0.65)' }}>{tag}</span>
                  ))}
                  {c.photos && c.photos.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', padding: '3px 8px', borderRadius: '99px', color: '#60a5fa' }}>📸 {c.photos.length} photo{c.photos.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                {c.notes && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '8px', fontStyle: 'italic', lineHeight: 1.4 }}>"{c.notes}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRAINING HEATMAP */}
      <div style={{ ...card }}>
        <div style={sectionLabel}>Activity</div>
        <div style={sectionTitle}>
          Training Calendar <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>· last 12 months</span>
        </div>
        <Heatmap S={S} onDay={iso => { const ws = S.workouts.filter(w => w.d === iso); if (ws.length === 1) workoutDetailSheet(ws[0]); else if (ws.length) calendarSheet(iso) }} />
      </div>

      {/* BODY WEIGHT TREND */}
      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={sectionLabel}>Body composition</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '-0.4px' }}>Weight Trend</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" icon="target" onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
        </div>
        <Segmented className="seg-range" value={range} onChange={setRange}
          options={[{ value: 30, label: '1M' }, { value: 90, label: '3M' }, { value: 365, label: '1Y' }, { value: 0, label: t('All') }]} />
        {bwPts.length ? (
          <div style={{ marginTop: '12px' }}><LineChart points={bwPts} h={160} unit={S.unit} goal={S.targetW} /></div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            {t('Log your weight to see your progress curve.')}
          </div>
        )}
      </div>

    </div>
  )
}
