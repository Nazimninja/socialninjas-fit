import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { exOr } from '../lib/exercises.js'
import { effectiveRoutine, lastEntryFor, bestWeightFor, buildSets, setsDoneActive, supersetUnits, unitOf, setLabel, modeOf, isBw, isPerSide, sideReps, repStep, EFFORT, effortOf, stepEffort, capEffort } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, exCount, DAYN } from '../lib/format.js'
import { beep, vibrate } from '../lib/sound.js'
import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import Media from '../components/Media.jsx'
import { startFlow, exercisePicker, exConfigSheet, exerciseDetailSheet, topWeightSheet, finishWorkout, workoutCompleteSheet, confirmSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Check, NumberField } from '../components/ui.jsx'
import { nextPrescription, applyPrescription } from '../lib/progression.js'
import { glyphOf } from '../lib/glyphs.js'

/* ---------- start chooser (no active workout) ---------- */
function StartChooser() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const todayR = effectiveRoutine(S, todayISO())
  const todayOvr = S.dayPlan[todayISO()] !== undefined
  const others = S.routines.filter(r => r !== todayR)
  return <div className="narrow">
    <div className="hdr"><div><h1>{t('Start workout')}</h1><div className="sub">{t(DAYN[new Date().getDay()])} — {todayR ? t('today is {0}', todayR.name) : t('rest day, but no one’s stopping you')}</div></div></div>
    {todayR && <div className="card" style={{ borderColor: 'var(--acc)' }}>
      <h2 className="accent">{t("Today's plan")}{todayOvr ? ' · ' + t('rescheduled') : ''}</h2>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div><div className="big">{todayR.name}</div><div className="muted small">{exCount(todayR.ex.length)}</div></div>
        <span className="lrow-i" style={{ width: 38, height: 38, borderRadius: 9, fontSize: 22 }}><Icon name={glyphOf(todayR.emoji)} /></span>
      </div>
      <Button variant="primary" icon="play" onClick={() => startFlow(todayR.id)}>{t('Start {0}', todayR.name)}</Button>
    </div>}
    {others.length > 0 && <><h4 className="sec">{t('Other routines')}</h4>
      <div className="list">{others.map(r => <div key={r.id} className="item" onClick={() => startFlow(r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        <span className="tag acc">{t('Start')}</span></div>)}</div></>}
    <div style={{ height: 14 }} />
    <Button icon="shuffle" onClick={() => startFlow(null)}>{t('Freestyle workout (pick as you go)')}</Button>
    {!S.routines.length && <><div style={{ height: 10 }} /><Button variant="primary" onClick={() => nav('/plan')}>{t('Build a plan first')}</Button></>}
  </div>
}

/* ---------- elapsed clock (supports pause, resume, and total paused duration) ---------- */
function Elapsed({ start, paused, pausedAt, totalPausedMs = 0 }) {
  const [t, setT] = useState('0:00')
  useEffect(() => {
    const calc = () => {
      const currentPaused = paused ? (Date.now() - (pausedAt || Date.now())) : 0
      const effectiveElapsedMs = Date.now() - start - (totalPausedMs || 0) - currentPaused
      const s = Math.max(0, Math.floor(effectiveElapsedMs / 1000))
      setT(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'))
    }
    calc()
    if (!paused) {
      const iv = setInterval(calc, 1000)
      return () => clearInterval(iv)
    }
  }, [start, paused, pausedAt, totalPausedMs])
  return <span>{t}</span>
}

/* ---------- one exercise block (reps: weight×reps · time: a held duration · cardio: duration+speed) ---------- */
function ExerciseBlock({ entryIdx, compact, onToggle, onField, onAddSet, onRemoveSet, onStartTimed }) {
  const S = useStore(s => s.S)
  const working = useUI(s => s.work)
  const entry = S.active.entries[entryIdx]
  const ex = exOr(entry.id)
  const mode = modeOf({ ...(entry.target || {}), id: entry.id })
  const cardio = mode === 'cardio'
  const timed = mode === 'time'
  const last = lastEntryFor(S, entry.id)
  const best = cardio ? 0 : Math.max(bestWeightFor(S, entry.id), (S.exWeights[entry.id] || {}).w || 0)
  const plan = entry.plan
  const cfg = { ...(entry.target || {}), id: entry.id }
  const bw = !cardio && isBw(cfg)
  const added = bw && entry.sets.some(s => s.w > 0)
  const loadCol = { f: 'w', step: 2.5, dec: true, hd: bw ? t('Added ({0})', S.unit) : t('Weight ({0})', S.unit) }
  const repCol = { f: 'r', step: repStep(cfg), dec: false, hd: t('Reps') }
  const col1 = cardio ? { f: 'min', step: 1, dec: false, hd: t('Duration (min)') }
    : timed ? { f: 'sec', step: 5, dec: false, hd: t('Seconds') }
      : (bw && !added) ? repCol : loadCol
  const col2 = cardio ? { f: 'speed', step: 0.5, dec: true, hd: t('Speed (km/h)') }
    : timed ? ((bw && !added) ? null : loadCol)
      : (bw && !added) ? null : repCol
  const kind = effortOf(S)
  const eff = EFFORT[kind]
  const col3 = mode === 'reps' && eff ? { ...eff, eff: kind, dec: true, opt: true, hd: t(eff.hd) } : null

  const bump = (s, i, col, dir) => {
    if (col.eff) return onField(i, col.f, stepEffort(col.eff, s[col.f], dir))
    onField(i, col.f, Math.max(0, Math.round(((s[col.f] || 0) + dir * col.step) * 100) / 100))
  }

  const cell = (s, i, col, cls) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: s.done ? 'var(--surface-3)' : 'var(--surface-2)',
        border: '1px solid var(--sep)',
        borderRadius: '10px',
        overflow: 'hidden',
        minWidth: 0,
        height: '42px',
        flex: cls === 'w' ? 1.3 : 1,
        transition: 'all 0.15s ease'
      }}
    >
      <button
        aria-label="Decrease"
        onClick={() => bump(s, i, col, -1)}
        disabled={s.done}
        style={{
          width: '32px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--label-2)',
          fontSize: '15px',
          fontWeight: '900',
          cursor: s.done ? 'default' : 'pointer',
          background: 'none',
          border: 'none'
        }}
      >
        −
      </button>
      <span style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <NumberField
          decimal={col.dec}
          nullable={col.opt}
          value={s[col.f] ?? ''}
          onChange={v => onField(i, col.f, col.eff ? capEffort(col.eff, v) : v)}
          disabled={s.done}
          style={{
            width: '100%',
            textAlign: 'center',
            background: 'none',
            border: 'none',
            fontSize: '15px',
            fontWeight: '800',
            color: s.done ? 'var(--label-2)' : 'var(--label)'
          }}
        />
      </span>
      <button
        aria-label="Increase"
        onClick={() => bump(s, i, col, 1)}
        disabled={s.done}
        style={{
          width: '32px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--label-2)',
          fontSize: '15px',
          fontWeight: '900',
          cursor: s.done ? 'default' : 'pointer',
          background: 'none',
          border: 'none'
        }}
      >
        +
      </button>
    </div>
  )

  const completedSetsCount = entry.sets.filter(s => s.done).length

  return (
    <div style={{ position: 'relative' }}>
      {/* Exercise Media Hero */}
      <Media ex={ex} key={entry.id} compact={compact} minimizable />

      {/* Exercise Title & Tags Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: compact ? '17px' : '21px', fontWeight: '900', color: 'var(--label)', margin: '0 0 4px', letterSpacing: '-0.4px', textTransform: 'capitalize' }}>
            {ex.n}
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {cardio && <span className="tag acc"><Icon name="figureRun" />{t('Cardio')}</span>}
            {!cardio && !timed && isPerSide(cfg) && <span className="tag acc nocap"><Icon name="shuffle" />{t('{0} per side', fmtNum(sideReps(entry.sets.find(s => !s.done)?.r ?? entry.sets[0]?.r)))}</span>}
            {(ex.tg || ex.bp) && <span className="tag" style={{ fontSize: '10.5px', fontWeight: '800' }}>{t(ex.tg || ex.bp)}</span>}
            {ex.eq && <span className="tag" style={{ fontSize: '10.5px', fontWeight: '800' }}>{t(ex.eq)}</span>}
            {best > 0 && <span className="tag nocap" style={{ fontSize: '10.5px', fontWeight: '800' }}>🏆 {fmtNum(best)} {S.unit} PR</span>}
          </div>
        </div>

        <button
          className="iconbtn"
          aria-label={t('Details')}
          onClick={() => exerciseDetailSheet(ex)}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--sep)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--label-2)',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <Icon name="info" />
        </button>
      </div>

      {/* Previous Performance or Progression Target */}
      {last ? (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--sep)',
          borderRadius: '10px',
          padding: '7px 12px',
          marginBottom: '12px',
          fontSize: '11px',
          color: 'var(--label-2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontWeight: '800', color: 'var(--label)' }}>⏱️ Last ({fmtDate(last.d)}):</span>
          <span>{last.sets.map(s => setLabel(entry.id, s, last.target)).join(' · ')}</span>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--sep)',
          borderRadius: '10px',
          padding: '7px 12px',
          marginBottom: '12px',
          fontSize: '11px',
          color: 'var(--label-2)'
        }}>
          📍 First time logging — this session sets your baseline!
        </div>
      )}

      {plan && plan.why && plan.kind !== 'off' && (
        <div className={'progline' + (plan.kind === 'deload' ? ' warn' : '')} style={{ marginBottom: '10px' }}>
          <Icon name={plan.kind === 'up' ? 'arrowUp' : plan.kind === 'deload' ? 'arrowDown' : 'lightbulb'} />
          <span>{t(...plan.why)}</span>
        </div>
      )}

      {/* Precision Set Logging Card */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderTop: '1px solid var(--card-border-top)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '14px'
        }}
      >
        {/* Table Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--sep)', marginBottom: '8px' }}>
          <span style={{ width: '28px', fontSize: '10px', fontWeight: '900', color: 'var(--label-3)', textAlign: 'center', textTransform: 'uppercase' }}>SET</span>
          <span style={{ flex: 1.3, fontSize: '10px', fontWeight: '900', color: 'var(--label-3)', textAlign: 'center', textTransform: 'uppercase' }}>{col1.hd}</span>
          {col2 && <span style={{ flex: 1, fontSize: '10px', fontWeight: '900', color: 'var(--label-3)', textAlign: 'center', textTransform: 'uppercase' }}>{col2.hd}</span>}
          {col3 && <span style={{ flex: 0.9, fontSize: '10px', fontWeight: '900', color: 'var(--label-3)', textAlign: 'center', textTransform: 'uppercase' }}>{col3.hd}</span>}
          {timed && <span style={{ width: '36px' }} />}
          <span style={{ width: '38px', fontSize: '10px', fontWeight: '900', color: 'var(--acc)', textAlign: 'center', textTransform: 'uppercase' }}>LOG</span>
        </div>

        {/* Set Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entry.sets.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                opacity: s.done ? 0.6 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              {/* Set Number Badge */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: s.done ? 'var(--acc)' : 'var(--surface-3)',
                  color: s.done ? 'var(--on-acc)' : 'var(--label)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '900',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {i + 1}
              </div>

              {/* Col 1 (Weight or Reps) */}
              {cell(s, i, col1, 'w')}

              {/* Col 2 (Reps) */}
              {col2 && cell(s, i, col2, 'r')}

              {/* Col 3 (Effort / RPE) */}
              {col3 && cell(s, i, col3, 'eff')}

              {/* Timed Hold Trigger */}
              {timed && (
                <button
                  aria-label={t('Start set')}
                  disabled={s.done || !!working}
                  onClick={() => onStartTimed(i)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--surface-3)',
                    border: '1px solid var(--sep)',
                    color: 'var(--acc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Icon name="play" />
                </button>
              )}

              {/* Checkmark Completion Button */}
              <button
                type="button"
                onClick={() => onToggle(i)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: s.done ? 'var(--acc)' : 'var(--surface-2)',
                  border: s.done ? '1.5px solid var(--acc)' : '1.5px solid var(--sep)',
                  color: s.done ? 'var(--on-acc)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: s.done ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                {s.done ? '✓' : ''}
              </button>
            </div>
          ))}
        </div>

        {/* Set Controls (Add / Remove) */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--sep)' }}>
          <button
            type="button"
            disabled={entry.sets.length <= 1}
            onClick={onRemoveSet}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--sep)',
              color: entry.sets.length <= 1 ? 'var(--label-3)' : 'var(--label)',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: entry.sets.length <= 1 ? 'default' : 'pointer'
            }}
          >
            — Remove Set
          </button>
          <button
            type="button"
            onClick={onAddSet}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--sep)',
              color: 'var(--label)',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            + Add Set
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- active workout ---------- */
function ActiveWorkout() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const { startRest, stopRest } = useUI()
  const A = S.active
  const units = supersetUnits(A.entries)
  const cur = Math.min(A.cur, Math.max(0, A.entries.length - 1))
  const unit = A.entries.length ? unitOf(units, cur) : []
  const unitIdx = units.findIndex(u => u === unit)
  const isSuperset = unit.length > 1

  const total = A.entries.reduce((n, e) => n + e.sets.length, 0)
  const done = setsDoneActive(A)

  const mutEntry = (idx, fn) => update(s => { fn(s.active.entries[idx]) }, true)
  const setField = (idx, i, field, v) => mutEntry(idx, e => {
    if (v == null) delete e.sets[i][field]; else e.sets[i][field] = v
  })
  const modeAt = idx => modeOf({ ...(A.entries[idx].target || {}), id: A.entries[idx].id })
  const addSet = idx => mutEntry(idx, e => {
    const l = e.sets[e.sets.length - 1]
    const m = modeOf({ ...(e.target || {}), id: e.id })
    if (m === 'cardio') e.sets.push({ min: l ? l.min : (e.target.min || 20), speed: l ? l.speed : (e.target.speed || 8), done: false })
    else if (m === 'time') e.sets.push({ sec: l ? l.sec : (e.target.sec || 45), w: l ? (l.w || 0) : (e.target.weight || 0), done: false })
    else e.sets.push({ w: l ? l.w : 0, r: l ? l.r : e.target.reps, done: false })
  })
  const removeSet = idx => mutEntry(idx, e => { if (e.sets.length > 1) e.sets.pop() })

  const startTimed = (idx, i) => {
    const e = A.entries[idx]
    useUI.getState().startWork(e.sets[i].sec || 45, exOr(e.id).n, elapsed => {
      mutEntry(idx, en => { en.sets[i].sec = elapsed })
      if (!useStore.getState().S.active.entries[idx].sets[i].done) toggle(idx, i)
    })
  }

  const toggle = (idx, i) => {
    const m = modeAt(idx)
    const cardioEntry = m === 'cardio'
    const isLastUnit = unitIdx >= units.length - 1
    let askTop = false, exJustDone = false, workoutDone = false
    mutEntry(idx, e => {
      e.sets[i].done = !e.sets[i].done
      if (e.sets[i].done) {
        beep(S.sound, 1040, 0.12); vibrate(30)
        const isLastExInUnit = idx === unit[unit.length - 1]
        const unitDone = unit.every(ui => (ui === idx ? e : A.entries[ui]).sets.every(x => x.done))
        if (isLastExInUnit && !unitDone) startRest(S.restSec)
        else if (unitDone) stopRest()
        if (unitDone && isLastUnit) workoutDone = true
        const loaded = m === 'reps' && !(isBw({ ...(e.target || {}), id: e.id }) && !e.sets.some(x => x.w > 0))
        if (e.sets.every(x => x.done)) { exJustDone = true; if (loaded && !e.asked) { e.asked = true; askTop = true } }
      }
    })
    if (askTop) topWeightSheet(idx)
    else if (workoutDone) workoutCompleteSheet()
    else if (exJustDone && cardioEntry) useUI.getState().toast(t('Cardio logged'))
    else if (exJustDone && m === 'time') useUI.getState().toast(t('Hold logged'))
  }

  // Live-presence heartbeat
  useEffect(() => {
    if (!useStore.getState().user) return
    let stopped = false
    const ping = active => {
      const A2 = useStore.getState().S.active
      if (!A2) return
      const u = supersetUnits(A2.entries)
      const c = Math.min(A2.cur, Math.max(0, A2.entries.length - 1))
      const ui = u.findIndex(x => x.includes(c))
      const tot = A2.entries.reduce((n, e) => n + e.sets.length, 0)
      api('/api/activity', { method: 'POST', body: JSON.stringify({
        active, name: A2.name, exIdx: ui + 1, exTotal: u.length,
        setsDone: setsDoneActive(A2), setsTotal: tot, startedAt: A2.start
      }) }).catch(() => {})
    }
    ping(true)
    const iv = setInterval(() => { if (!stopped) ping(true) }, 20000)
    return () => {
      stopped = true; clearInterval(iv)
      try { navigator.sendBeacon?.('/api/activity', new Blob([JSON.stringify({ active: false })], { type: 'application/json' })) } catch { /* */ }
      api('/api/activity', { method: 'POST', body: JSON.stringify({ active: false }) }).catch(() => {})
    }
  }, [])

  const togglePauseWorkout = () => {
    update(s => {
      if (!s.active) return
      if (s.active.paused) {
        const pausedDuration = Date.now() - (s.active.pausedAt || Date.now())
        s.active.totalPausedMs = (s.active.totalPausedMs || 0) + pausedDuration
        s.active.paused = false
        s.active.pausedAt = null
        useUI.getState().toast(t('▶️ Workout Resumed'))
      } else {
        s.active.paused = true
        s.active.pausedAt = Date.now()
        useUI.getState().toast(t('⏸️ Workout Paused'))
      }
    })
  }

  const currentEntry = A.entries[cur]
  const currentExAllDone = currentEntry && currentEntry.sets.length > 0 && currentEntry.sets.every(s => s.done)
  const nextUncompletedSetIdx = currentEntry ? currentEntry.sets.findIndex(s => !s.done) : -1

  return (
    <div className="narrow" style={{ paddingBottom: '120px' }}>
      
      {/* ── FOCUS HEADER HUD ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          padding: '6px 0'
        }}
      >
        {/* Left: Minimize & Discard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="iconbtn"
            title={t('Minimize to background')}
            onClick={() => nav('/home')}
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--sep)' }}
          >
            <Icon name="chevronDown" />
          </button>
          <button
            className="iconbtn dim"
            title={t('Discard workout')}
            onClick={() => confirmSheet({
              title: t('Discard workout?'),
              message: t('The sets you logged in this session will be lost.'),
              confirmText: t('Discard'),
              danger: true,
              onConfirm: () => { update(s => { s.active = null }); stopRest(); nav('/home') }
            })}
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--sep)', color: 'var(--red)' }}
          >
            <Icon name="xmark" />
          </button>
        </div>

        {/* Center: Routine & Pulsing Live Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '900', fontSize: '15px', color: 'var(--label)', letterSpacing: '-0.3px' }}>
            {A.name}
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--label-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: A.paused ? 'var(--orange)' : 'var(--acc)', boxShadow: A.paused ? 'none' : '0 0 6px var(--acc)' }} />
            <Elapsed start={A.start} paused={A.paused} pausedAt={A.pausedAt} totalPausedMs={A.totalPausedMs} />
            <span>·</span>
            <span>{done}/{total} Sets</span>
            {A.paused && <span style={{ color: 'var(--orange)' }}>(Paused)</span>}
          </div>
        </div>

        {/* Right: Pause & Finish Check */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="iconbtn"
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--sep)', color: A.paused ? 'var(--orange)' : 'var(--label)' }}
            title={A.paused ? t('Resume workout') : t('Pause workout')}
            onClick={togglePauseWorkout}
          >
            <Icon name={A.paused ? 'play' : 'pause'} />
          </button>
          <button
            className="iconbtn"
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--acc)', border: 'none', color: 'var(--on-acc)', fontWeight: '900' }}
            title={t('Finish')}
            onClick={finishWorkout}
          >
            <Icon name="check" />
          </button>
        </div>
      </div>

      {/* ── REAL-TIME PROGRESS BAR ───────────────────────────────── */}
      <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ width: (total ? (done / total * 100) : 0) + '%', height: '100%', background: 'linear-gradient(90deg, var(--acc) 0%, var(--label) 100%)', transition: 'width 0.3s ease' }} />
      </div>

      {/* ── PAUSE BANNER (IF PAUSED) ─────────────────────────────── */}
      {A.paused && (
        <div style={{
          background: 'color-mix(in srgb,var(--orange) 14%,var(--surface))',
          border: '1px solid var(--orange)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⏸️</span>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--orange)', fontSize: 13 }}>{t('Workout Paused')}</div>
              <div className="small muted" style={{ fontSize: 11 }}>{t('The session timer is paused. Tap resume when ready.')}</div>
            </div>
          </div>
          <Button size="sm" variant="primary" style={{ background: 'var(--orange)', color: '#000', fontWeight: '800' }} icon="play" onClick={togglePauseWorkout}>
            {t('Resume')}
          </Button>
        </div>
      )}

      {/* ── HORIZONTAL EXERCISE CAROUSEL / NAVIGATOR ─────────────── */}
      {A.entries.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '14px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {A.entries.map((entry, idx) => {
            const exInfo = exOr(entry.id)
            const setsDone = entry.sets.filter(s => s.done).length
            const isEntryComplete = entry.sets.length > 0 && setsDone === entry.sets.length
            const isSelected = cur === idx

            return (
              <button
                key={idx}
                type="button"
                onClick={() => update(s => { s.active.cur = idx })}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '12px',
                  background: isSelected ? 'var(--card-bg)' : 'var(--surface-2)',
                  border: isSelected ? '1.5px solid var(--label)' : '1px solid var(--sep)',
                  color: isSelected ? 'var(--label)' : 'var(--label-2)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--card-shadow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '900' }}>
                  {idx + 1}. {exInfo.n.length > 14 ? exInfo.n.slice(0, 14) + '…' : exInfo.n}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  background: isEntryComplete ? 'var(--acc)' : isSelected ? 'var(--surface-3)' : 'var(--surface-3)',
                  color: isEntryComplete ? 'var(--on-acc)' : 'var(--label-2)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  {isEntryComplete ? '✓' : `${setsDone}/${entry.sets.length}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── ACTIVE EXERCISE HERO & SET LOGGING ────────────────────── */}
      {A.entries.length ? (
        isSuperset ? (
          <div className="ss-card">
            <div className="ss-hd"><Icon name="link" />{t('Superset · do these back-to-back, rest after both')}</div>
            {unit.map((idx, k) => (
              <div key={idx} className="ss-ex">
                {k > 0 && <div className="ss-amp">+</div>}
                <ExerciseBlock
                  entryIdx={idx}
                  compact
                  onToggle={i => toggle(idx, i)}
                  onField={(i, f, v) => setField(idx, i, f, v)}
                  onAddSet={() => addSet(idx)}
                  onRemoveSet={() => removeSet(idx)}
                  onStartTimed={i => startTimed(idx, i)}
                />
              </div>
            ))}
          </div>
        ) : (
          <ExerciseBlock
            entryIdx={cur}
            onToggle={i => toggle(cur, i)}
            onField={(i, f, v) => setField(cur, i, f, v)}
            onAddSet={() => addSet(cur)}
            onRemoveSet={() => removeSet(cur)}
            onStartTimed={i => startTimed(cur, i)}
          />
        )
      ) : (
        <div className="empty">
          <div className="ico"><Icon name="shuffle" /></div>
          {t('Freestyle workout — add your first exercise.')}
        </div>
      )}

      {/* ── SMART NEXT-STEP ACTION HUD ───────────────────────────── */}
      {A.entries.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Main Contextual Step Button */}
          {nextUncompletedSetIdx !== -1 ? (
            <button
              type="button"
              onClick={() => toggle(cur, nextUncompletedSetIdx)}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14.5px',
                fontWeight: '900',
                borderRadius: '14px',
                background: 'var(--btn-pri-bg)',
                color: 'var(--btn-pri-color)',
                border: '1px solid var(--btn-pri-border)',
                boxShadow: 'var(--btn-pri-shadow)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>⚡ Log Set {nextUncompletedSetIdx + 1} Done</span>
            </button>
          ) : cur < A.entries.length - 1 ? (
            <button
              type="button"
              onClick={() => update(s => { s.active.cur = cur + 1 })}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14.5px',
                fontWeight: '900',
                borderRadius: '14px',
                background: 'var(--acc)',
                color: 'var(--on-acc)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Next Exercise: {exOr(A.entries[cur + 1].id).n} →</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={finishWorkout}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '15px',
                fontWeight: '900',
                borderRadius: '14px',
                background: 'var(--acc)',
                color: 'var(--on-acc)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)'
              }}
            >
              <span>🎉 All Sets Done · Finish Workout</span>
            </button>
          )}

          {/* Secondary Controls: Add Exercise & Prev/Next */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              icon="chevronLeft"
              disabled={cur <= 0}
              onClick={() => update(s => { s.active.cur = cur - 1 })}
              style={{ flex: 1, padding: '10px 8px', fontSize: '12px', fontWeight: '800' }}
            >
              Prev
            </Button>
            <Button
              size="sm"
              icon="plus"
              onClick={() => exercisePicker(ex => exConfigSheet(ex, null, cfg => update(s => {
                const full = { ...cfg, id: ex.id }
                const plan = nextPrescription(s, full, s.routines.find(r => r.id === s.active.routineId))
                s.active.entries.push({ id: ex.id, target: { ...cfg }, plan, sets: applyPrescription(buildSets(s, full), plan) })
                s.active.cur = s.active.entries.length - 1
              }), null, S.routines.find(r => r.id === A.routineId)))}
              style={{ flex: 1.2, padding: '10px 8px', fontSize: '12px', fontWeight: '800' }}
            >
              + Exercise
            </Button>
            <Button
              trailingIcon="chevronRight"
              disabled={cur >= A.entries.length - 1}
              onClick={() => update(s => { s.active.cur = cur + 1 })}
              style={{ flex: 1, padding: '10px 8px', fontSize: '12px', fontWeight: '800' }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Workout() {
  const active = useStore(s => s.S.active)
  return active ? <ActiveWorkout /> : <StartChooser />
}

