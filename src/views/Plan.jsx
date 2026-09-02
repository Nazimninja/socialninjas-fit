import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { DAYN, uid, exCount, fmtNum } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { exOr } from '../lib/exercises.js'
import { dayAssignSheet, loadStarterPlan, planToolsSheet, startFlow } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js'

export default function Plan() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] }
    update(s => { s.routines.push(r) })
    nav('/plan/r/' + r.id)
  }

  // Calculate weekly statistics
  const dayIndices = [1, 2, 3, 4, 5, 6, 0] // Mon -> Sun
  const activeDays = dayIndices.filter(d => S.week[d] && S.routines.some(r => r.id === S.week[d]))
  const trainingDaysCount = activeDays.length
  const restDaysCount = 7 - trainingDaysCount

  const totalWeeklySets = activeDays.reduce((acc, d) => {
    const r = S.routines.find(x => x.id === S.week[d])
    if (!r || !r.ex) return acc
    return acc + r.ex.reduce((sAcc, e) => sAcc + (Number(e.sets) || (Array.isArray(e.sets) ? e.sets.length : 3)), 0)
  }, 0)

  return (
    <div className="narrow" style={{ paddingBottom: '120px' }}>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => nav('/home')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            aria-label="Back"
          >
            <Icon name="chevronLeft" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.6px', color: '#fff' }}>
              {t('Weekly Workout Plan')}
            </h1>
            <div className="sub" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {t('Your 7-day periodized training split')}
            </div>
          </div>
        </div>
        <button
          className="iconbtn"
          onClick={planToolsSheet}
          aria-label={t('Share your plan')}
          title={t('Share your plan')}
          style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--sep)' }}
        >
          <Icon name="upload" />
        </button>
      </div>

      {/* ── WEEKLY SUMMARY COCKPIT ───────────────────────────────── */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderTop: '1px solid var(--card-border-top)',
          borderRadius: '20px',
          padding: '16px 18px',
          marginBottom: '20px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--label-2)' }}>
            Active Training Split Protocol
          </div>
          <span style={{ fontSize: '10px', fontWeight: '800', background: 'var(--surface-2)', color: 'var(--acc)', padding: '2px 8px', borderRadius: '99px' }}>
            {S.aiAnswers?.goal ? S.aiAnswers.goal.toUpperCase().replace('_', ' ') : 'HYPERTROPHY'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px 4px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)' }}>TRAINING DAYS</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--label)', marginTop: '2px' }}>
              {trainingDaysCount} <span style={{ fontSize: '11px', color: 'var(--label-2)' }}>/ 7</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px 4px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)' }}>REST DAYS</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--label)', marginTop: '2px' }}>
              {restDaysCount} <span style={{ fontSize: '11px', color: 'var(--label-2)' }}>Days</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px 4px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)' }}>WEEKLY VOLUME</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--acc)', marginTop: '2px' }}>
              {totalWeeklySets} <span style={{ fontSize: '11px', color: 'var(--label-2)' }}>Sets</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL 7-DAY WORKOUT SCHEDULE ─────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px', margin: '0 0 12px' }}>
          📅 Full Week Schedule
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dayIndices.map(d => {
            const r = S.routines.find(x => x.id === S.week[d])
            const totalSets = r && r.ex ? r.ex.reduce((sum, e) => sum + (Number(e.sets) || (Array.isArray(e.sets) ? e.sets.length : 3)), 0) : 0

            return (
              <div
                key={d}
                style={{
                  background: 'var(--card-bg)',
                  border: r ? '1px solid var(--card-border)' : '1px dashed var(--sep)',
                  borderTop: r ? '1px solid var(--card-border-top)' : '1px dashed var(--sep)',
                  borderRadius: '20px',
                  padding: '16px 18px',
                  boxShadow: r ? 'var(--card-shadow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Day Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: r ? 'var(--acc)' : 'var(--label-3)',
                      boxShadow: r ? '0 0 6px var(--acc)' : 'none'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--label)' }}>
                      {t(DAYN[d])}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => dayAssignSheet(d)}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--sep)',
                      color: 'var(--label-2)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ {r ? 'Change' : 'Assign'}
                  </button>
                </div>

                {/* If Routine Assigned */}
                {r ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>
                          <Icon name={glyphOf(r.emoji)} style={{ marginRight: '6px', fontSize: '16px' }} />
                          {r.name}
                        </h4>
                        <div style={{ fontSize: '11.5px', color: 'var(--label-2)', fontWeight: '700' }}>
                          {r.ex.length} Exercises · {totalSets} Total Sets · ~45–55 min
                        </div>
                      </div>
                    </div>

                    {/* Prescribed Exercises List */}
                    {r.ex && r.ex.length > 0 && (
                      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '14px', padding: '10px 12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--label-3)', marginBottom: '8px' }}>
                          Prescribed Movement Protocol:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {r.ex.map((e, eIdx) => {
                            const exInfo = exOr(e.id)
                            const setNum = e.sets || (Array.isArray(e.sets) ? e.sets.length : 3)
                            const repsNum = e.reps || (e.sets && e.sets[0]?.r) || 8

                            return (
                              <div
                                key={eIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  padding: '4px 0',
                                  borderBottom: eIdx < r.ex.length - 1 ? '1px solid var(--sep)' : 'none'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--label-3)', width: '16px' }}>
                                    {eIdx + 1}.
                                  </span>
                                  <span style={{ fontWeight: '800', color: 'var(--label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {exInfo.n}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: '6px' }}>
                                    {setNum} sets × {repsNum} reps
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => startFlow(r.id)}
                        style={{
                          flex: 1.4,
                          background: 'var(--btn-pri-bg)',
                          color: 'var(--btn-pri-color)',
                          border: '1px solid var(--btn-pri-border)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          fontSize: '12.5px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: 'var(--btn-pri-shadow)'
                        }}
                      >
                        <span>▶️ Start Workout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => nav('/plan/r/' + r.id)}
                        style={{
                          flex: 1,
                          background: 'var(--surface-2)',
                          border: '1px solid var(--sep)',
                          color: 'var(--label)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        ⚙️ Edit Routine
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Rest Day Details */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--label)' }}>
                        🧘 Scheduled Rest &amp; Recovery
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--label-3)', marginTop: '2px' }}>
                        Muscle protein synthesis &amp; nervous system recovery
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dayAssignSheet(d)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--acc)',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Routine
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ALL ROUTINES REPOSITORY ──────────────────────────────── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '18px 20px', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--label)' }}>
              {t('All Workout Routines')}
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--label-2)', marginTop: '2px' }}>
              {S.routines.length} saved routine protocols
            </div>
          </div>
          <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine}>
            {t('New Routine')}
          </Button>
        </div>

        {S.routines.length > 0 ? (
          <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {S.routines.map(r => (
              <div
                key={r.id}
                className="item"
                onClick={() => nav('/plan/r/' + r.id)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--sep)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
              >
                <span className="lrow-i" style={{ fontSize: '18px', marginRight: '10px' }}>
                  <Icon name={glyphOf(r.emoji)} />
                </span>
                <div className="grow">
                  <div className="tt" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--label)' }}>{r.name}</div>
                  <div className="ss" style={{ fontSize: '11px', color: 'var(--label-2)' }}>{exCount(r.ex ? r.ex.length : 0)}</div>
                </div>
                <Icon name="chevronRight" className="chev" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Button icon="sparkles" onClick={loadStarterPlan}>
              {t('Load Starter Plan (Push / Pull / Legs)')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
