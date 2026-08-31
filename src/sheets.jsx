import { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { EXDB, EXIDX, BODYPARTS, isCardio, isBodyweightEq, allExercises, equipmentOf } from './lib/exercises.js'
import { fmtDate, fmtNum, fmtVol, fmtDur, durPart, todayISO, uid, exCount, DAYN, MONTHS_LONG, ACCENTS } from './lib/format.js'
import { lastEntryFor, bestWeightFor, buildSets, effectiveRoutineId, workoutVolume, setsDone, setsDoneActive, lastBW, supersetUnits, unitOf, setLabel, defaultConfig, cleanupSg, modeOf, effortOf, isBw, isPerSide, sideReps } from './lib/history.js'
import { beep, vibrate } from './lib/sound.js'
import { t, instrFor, getLang, INSTR_LANGS } from './lib/i18n.js'
import { nav } from './lib/nav.js'
import { starterRoutines } from './lib/starter.js'
import Media, { Thumb } from './components/Media.jsx'
import Stepper from './components/Stepper.jsx'
import Icon from './components/Icon.jsx'
import { Button, Slider, Switch, Segmented, SelectRow, Row } from './components/ui.jsx'
import { glyphOf, GLYPH_GROUPS, DEFAULT_GLYPH } from './lib/glyphs.js'
import BodyMap from './components/BodyMap.jsx'
import { loadOfWorkouts } from './lib/muscles.js'
import { parseImport, mergeImport } from './lib/import-csv.js'
import { buildPlanBundle, parsePlan, mergePlan, printPlan } from './lib/plan-share.js'
import { estimate1RM, best1RM, is1RMRecord, REP_CAP } from './lib/onerm.js'
import { nextPrescription, applyPrescription, policyFor, defaultIncrement, POLICIES_FOR, POLICY_NAME, POLICY_DESC, MAX_BW_SETS } from './lib/progression.js'
import { MOBILE, shareExport } from './lib/mobile.js'
import { api } from './lib/api.js'
import { generateCustomPlan, convertPlanToStoreRoutines, PRESET_PROGRAMS, findEx } from './lib/planGenerator.js'

const S = () => useStore.getState().S
const update = (...a) => useStore.getState().update(...a)
const ui = () => useUI.getState()
const toast = m => ui().toast(m)
const snd = () => S().sound

/* ============================ custom confirm dialog ============================ */
function ConfirmDialog({ title, message, confirmText, cancelText, danger, onConfirm, close }) {
  return <div style={{ textAlign: 'center', padding: '4px 0' }}>
    {title && <h3 style={{ marginBottom: 8 }}>{title}</h3>}
    <div className="muted" style={{ marginBottom: 18, lineHeight: 1.5 }}>{message}</div>
    <button className={'btn ' + (danger ? 'danger' : 'primary')} onClick={() => { close(); onConfirm && onConfirm() }}>{confirmText || t('Confirm')}</button>
    <div style={{ height: 8 }} />
    <Button variant="ghost" className="dim" onClick={close}>{cancelText || t('Cancel')}</Button>
  </div>
}
// Themed replacement for window.confirm — callback-based (no blocking).
export function confirmSheet(opts) {
  ui().openSheet(close => <ConfirmDialog {...opts} close={close} />, { kind: 'center' })
}

/* ============================ starter plan ============================ */
export function loadStarterPlan() {
  const [push, pull, legs] = starterRoutines()
  update(st => {
    st.routines.push(push, pull, legs)
    st.week[1] = push.id; st.week[3] = pull.id; st.week[5] = legs.id
  })
  toast(t('Starter plan loaded — Mon Push · Wed Pull · Fri Legs'))
}

/* ============================ weight picker (shared: body weight + goal) ============================ */
// Fixed range, not a moving window — a window that resizes itself mid-drag (the previous
// attempt) makes the thumb's position unpredictable: every time it grows, everything already
// placed on it shifts toward one side. A static range never has that problem, at the cost of
// coarser precision per pixel — the +/- buttons cover exact values.
// The ceiling follows the profile's unit: 300 covers a body weight or a working weight in
// kg, but as pounds it cut off at 136 kg — below plenty of people's body weight, and well
// below an everyday squat.
const W_LO = 1
const wHi = unit => (unit === 'lb' ? 660 : 300)
function WeightInput({ value, setValue, unit }) {
  const W_HI = wHi(unit)
  const clamp = x => Math.max(W_LO, Math.min(W_HI, Math.round((x || 0) * 10) / 10))
  const sv = Math.max(W_LO, Math.min(W_HI, value))
  const onSlide = v => setValue(clamp(v))
  return <>
    <div className="bwstep">
      <button className="bw-pm" onClick={() => onSlide(value - 0.1)} aria-label="minus 0.1"><Icon name="minus" /></button>
      <div className="bw-read">{fmtNum(value)}<span className="u"> {unit}</span></div>
      <button className="bw-pm" onClick={() => onSlide(value + 0.1)} aria-label="plus 0.1"><Icon name="plus" /></button>
    </div>
    <div className="chips" style={{ justifyContent: 'center', margin: '8px 0' }}>
      <button className="chip" onClick={() => onSlide(value - 1)}>−1</button>
      <button className="chip" onClick={() => onSlide(value - 0.5)}>−0.5</button>
      <button className="chip" onClick={() => onSlide(value + 0.5)}>+0.5</button>
      <button className="chip" onClick={() => onSlide(value + 1)}>+1</button>
    </div>
    <Slider value={sv} min={W_LO} max={W_HI} step={0.5} onChange={onSlide} />
  </>
}

/* ============================ body weight ============================ */
function BwSheet({ required, onDone, close }) {
  const st = useStore(s => s.S)
  const unit = st.unit
  const bw = lastBW(st)
  const [v, setV] = useState(bw ? bw.w : 70)
  const save = () => {
    const n = Math.round((v || 0) * 10) / 10
    if (!n || n <= 0) { toast(t('Enter a valid weight')); return }
    let weights = []
    update(s => {
      const iso = todayISO()
      const ex = s.bodyweight.find(b => b.d === iso)
      if (ex) { ex.w = n; ex.t = Date.now() } else s.bodyweight.push({ d: iso, w: n, t: Date.now() })
      s.bodyweight.sort((a, b) => (a.d < b.d ? -1 : 1))
      weights = s.bodyweight.map(x => x.w)
    })
    close()
    if (onDone) onDone(n)
    else {
      toast(t('Weight saved'))
      // Automatically adapt plan after weight log
      useStore.getState().adaptPlan(weights)
    }
  }
  const recent = [...st.bodyweight].reverse().slice(0, 3)
  const delEntry = d => update(s => { s.bodyweight = s.bodyweight.filter(b => b.d !== d) })
  return <>
    <h3>{required ? t('Quick check-in') : t('Log body weight')}</h3>
    <div className="muted small">{required ? t('Slide or tap to set your weight — tracked before every workout so your curve stays honest.') : t('Today') + ', ' + fmtDate(todayISO(), true)}</div>
    <WeightInput value={v} setValue={setV} unit={unit} />
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={save}>{required ? t('Save & start workout') : t('Save')}</Button>
    {required && <>
      <div style={{ height: 8 }} /><Button variant="ghost" className="dim" onClick={() => { close(); onDone && onDone(null) }}>{t('Start without weighing in')}</Button>
      <div style={{ height: 2 }} /><Button variant="ghost" className="dim" icon="reset" onClick={() => { close(); nav('/workout') }}>{t('Choose a different workout')}</Button>
    </>}
    {!required && recent.length > 0 && <>
      <h4 className="sec">{t('Recent weigh-ins')}</h4>
      <div className="list" style={{ gap: 0 }}>
        {recent.map(b => <div key={b.d} className="row between" style={{ padding: '9px 2px', borderBottom: '1px solid var(--sep)' }}>
          <span className="small muted">{fmtDate(b.d, true)}</span>
          <span className="row" style={{ gap: 12 }}><b>{fmtNum(b.w)} {unit}</b>
            <button className="iconbtn" style={{ width: 32, height: 30, borderRadius: 8, fontSize: 15, color: 'var(--red)' }} onClick={() => delEntry(b.d)} aria-label="delete"><Icon name="trash" /></button></span>
        </div>)}
      </div>
    </>}
  </>
}
export function bwSheet(opts = {}) {
  const h = ui().openSheet(close => <BwSheet {...opts} close={close} />, { locked: !!opts.required })
  return h
}

/* ============================ import from another app ============================ */
// Shows what a parsed export would actually do before anything is written. An import is
// the one action where "just try it" is expensive — it's someone's entire training
// history — so the numbers, the unit conversion and the exercises we couldn't recognise
// are all on screen before the confirm button.
function ImportSummary({ parsed, close }) {
  const st = useStore(s => s.S)
  const isBW = parsed.kind === 'bodyweight'
  const have = isBW
    ? parsed.bodyweight.filter(b => st.bodyweight.some(x => x.d === b.d)).length
    : parsed.workouts.filter(w => st.workouts.some(x => x.d === w.d)).length
  const fresh = (isBW ? parsed.bodyweight.length : parsed.workouts.length) - have

  const doImport = () => {
    let res
    update(s => { res = mergeImport(s, parsed) })
    close()
    toast(isBW
      ? t('{0} weigh-ins imported', res.added)
      : t('{0} workouts imported', res.added))
  }

  return <>
    <h3>{parsed.source ? t('Import from {0}', parsed.source) : t('Import history')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>
      {parsed.from === parsed.to ? fmtDate(parsed.from, true) : fmtDate(parsed.from, true) + ' – ' + fmtDate(parsed.to, true)}
    </div>

    <div className="tiles" style={{ textAlign: 'left' }}>
      {isBW ? <>
        <div className="tile"><div className="l">{t('Weigh-ins')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{parsed.bodyweight.length}</div></div>
        <div className="tile"><div className="l">{t('New')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{fresh}</div></div>
      </> : <>
        <div className="tile"><div className="l">{t('Workouts')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{parsed.workouts.length}</div></div>
        <div className="tile"><div className="l">{t('Sets')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{parsed.sets}</div></div>
        <div className="tile"><div className="l">{t('Exercises matched')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{parsed.matched}</div></div>
        <div className="tile"><div className="l">{t('Added as your own')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{parsed.created}</div></div>
      </>}
    </div>

    {parsed.mixedUnits ? <div className="small" style={{ color: 'var(--yellow)', marginBottom: 10 }}>
      {t('The file mixes kg and lb — each set is converted to {0}.', st.unit)}
    </div> : parsed.converted ? <div className="small" style={{ color: 'var(--yellow)', marginBottom: 10 }}>
      {t('The file is in {0} and your profile is in {1} — weights will be converted.', parsed.fileUnit, st.unit)}
    </div> : null}
    {!isBW && !parsed.fileUnit && !parsed.mixedUnits && <div className="small dim" style={{ marginBottom: 10 }}>
      {t('The file does not say which unit it uses — numbers are imported as they are.')}
    </div>}
    {have > 0 && <div className="small dim" style={{ marginBottom: 10 }}>
      {t('{0} days already have data here and will be left alone.', have)}
    </div>}
    {/* The file rated its sets. Say so: the column is off by default, so the ratings would
        otherwise arrive invisibly and look like they had been dropped. */}
    {!isBW && (parsed.rirSets + parsed.rpeSets) > 0 && <div className="small dim" style={{ marginBottom: 10 }}>
      {t(effortOf(st) === 'none'
        ? '{0} sets bring an {1} with them — switch on Effort per set in Settings to see it.'
        : '{0} sets bring an {1} with them.',
      parsed.rirSets || parsed.rpeSets, parsed.rirSets ? 'RIR' : 'RPE')}
    </div>}
    {!isBW && parsed.unmatchedNames.length > 0 && <>
      <h4 className="sec">{t('Not in the library — added as your own exercises')}</h4>
      <div className="mchips" style={{ marginBottom: 12 }}>
        {parsed.unmatchedNames.slice(0, 12).map(n => <span key={n} className="mchip capitalize">{n}</span>)}
        {parsed.unmatchedNames.length > 12 && <span className="mchip">+{parsed.unmatchedNames.length - 12}</span>}
      </div>
    </>}

    <Button variant="primary" onClick={doImport} disabled={!fresh}>
      {fresh ? t('Import') : t('Nothing new to import')}
    </Button>
    <div style={{ height: 8 }} />
    <Button variant="ghost" className="dim" onClick={close}>{t('Cancel')}</Button>
  </>
}

/** Read a CSV/XML export, then show what it would do. */
export function importFromApp(file, onDone) {
  const rd = new FileReader()
  rd.onload = () => {
    let parsed
    try { parsed = parseImport(String(rd.result), { unit: S().unit }) }
    catch (e) { toast(t('Could not read that file')); return }
    if (parsed.error === 'empty') { toast(t('That file is empty')); return }
    if (parsed.error) { toast(t("That file's columns aren't recognised — see the docs for supported apps.")); return }
    if (parsed.kind === 'bodyweight' ? !parsed.bodyweight.length : !parsed.workouts.length) {
      toast(t('Nothing to import from that file')); return
    }
    ui().openSheet(close => <ImportSummary parsed={parsed} close={close} />)
    onDone && onDone()
  }
  rd.onerror = () => toast(t('Could not read that file'))
  rd.readAsText(file)
}

/* ============================ target weight ============================ */
export function bwDeltaColor(delta, currentW) {
  if (!delta) return 'var(--label-2)'
  if (!S().targetW) return 'var(--label)'
  const up = S().targetW > currentW
  return (delta > 0) === up ? 'var(--acc)' : 'var(--red)'
}
function GoalSheet({ close }) {
  const st = S()
  const bw = lastBW(st)
  const [v, setV] = useState(st.targetW || (bw ? bw.w : 70))
  return <>
    <h3>{t('Target weight')}</h3>
    <div className="muted small">{t('Your goal is drawn as a line through the weight charts, and gains/losses are colored by whether they move toward it.')}</div>
    <WeightInput value={v} setValue={setV} unit={st.unit} />
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={() => {
      const n = Math.round((v || 0) * 10) / 10
      if (!n || n <= 0) { toast(t('Enter a valid weight')); return }
      update(s => { s.targetW = n }); close()
      const b = lastBW(S()); toast(t('Goal set: {0}', fmtNum(n) + ' ' + st.unit) + (b ? ' (' + t('{0} to go', fmtNum(Math.abs(n - b.w))) + ')' : ''))
    }}>{t('Save goal')}</Button>
    {st.targetW && <><div style={{ height: 8 }} /><Button variant="danger" onClick={() => { update(s => { s.targetW = null }); close(); toast(t('Goal removed')) }}>{t('Remove goal')}</Button></>}
  </>
}
export const goalSheet = () => ui().openSheet(close => <GoalSheet close={close} />)

/* ============================ exercise detail ============================ */
// Estimated 1RM for one exercise (issue #18): what the log already implies, plus a calculator
// for a set you have not done — so the number is reachable before there is any history.
function OneRM({ ex }) {
  const st = useStore(s => s.S)
  const best = best1RM(st, ex.id)
  const [w, setW] = useState(best ? best.w : (st.exWeights[ex.id] || {}).w || 20)
  const [r, setR] = useState(best ? best.r : 5)
  const est = estimate1RM(w, r)
  return <>
    <h4 className="sec">{t('Estimated 1RM')}</h4>
    {best && <div className="small" style={{ marginBottom: 8 }}>
      {t('From your log:')} <b className="accent">{fmtNum(best.est)} {st.unit}</b>
      <span className="dim"> · {t('{0} × {1} on {2}', fmtNum(best.w) + ' ' + st.unit, best.r, fmtDate(best.d, true))}</span>
    </div>}
    <div className="row cfgrow" style={{ marginBottom: 10 }}>
      <Stepper label={t('Weight ({0})', st.unit)} value={w} step={2.5} onChange={setW} />
      <Stepper label={t('Reps')} value={r} step={1} decimal={false} onChange={setR} />
    </div>
    <div className="row between" style={{ marginBottom: 4 }}>
      <span className="muted small">{t('Estimate')}</span>
      <b className="accent" style={{ fontSize: 20 }}>{est === null ? '—' : fmtNum(est) + ' ' + st.unit}</b>
    </div>
    <div className="small dim">{est === null
      ? t('Enter a weight and 1–{0} reps — beyond that an estimate is guesswork.', REP_CAP)
      : t('Epley formula — a calculation from one set, not a tested max.')}</div>
  </>
}

function ExerciseDetail({ ex, close }) {
  const st = useStore(s => s.S)
  const last = lastEntryFor(st, ex.id)
  const best = bestWeightFor(st, ex.id)
  return <>
    <h3 className="capitalize">{ex.n}</h3>
    <Media ex={ex} />
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
      <span className="tag acc">{t(ex.bp)}</span>
      {ex.tg && <span className="tag"><Icon name="target" />{t(ex.tg)}</span>}
      <span className="tag"><Icon name="dumbbell" />{t(ex.eq)}</span>
      {(ex.sm || []).slice(0, 3).map((s, i) => <span key={i} className="tag">{t(s)}</span>)}
    </div>
    {ex.desc && <div className="exnote">{ex.desc}</div>}
    {best > 0 && <div className="small row" style={{ marginBottom: 6, gap: 5 }}><Icon name="trophy" style={{ fontSize: 14, color: 'var(--yellow)' }} />{t('Best:')} <b className="accent">{fmtNum(best)} {st.unit}</b>{last ? ` · ${t('last')} ${fmtDate(last.d)}: ${last.sets.map(s => setLabel(ex.id, s, last.target)).join(', ')}` : ''}</div>}
    <Button variant="primary" icon="plus" style={{ margin: '10px 0 4px' }} onClick={() => addToRoutineSheet(ex)}>{t('Add to my plan')}</Button>
    {ex.custom && <div className="row" style={{ gap: 8, marginTop: 8 }}>
      <Button icon="pencil" style={{ flex: 1 }} onClick={() => { close(); customExSheet(ex) }}>{t('Edit')}</Button>
      <Button variant="danger" icon="trash" style={{ flex: 1 }} onClick={() => deleteCustomEx(ex, close)}>{t('Delete')}</Button>
    </div>}
    {!isCardio(ex) && <OneRM ex={ex} />}
    {instrFor(ex).length > 0 &&<><h4 className="sec">{t('How to')}{!INSTR_LANGS.includes(getLang()) && <span className="dim" style={{ textTransform: 'none', letterSpacing: 0 }}> · {t('instructions in English')}</span>}</h4><ol className="steps-list">{instrFor(ex).map((s, i) => <li key={i}>{s}</li>)}</ol></>}
  </>
}
export const exerciseDetailSheet = ex => ui().openSheet(close => <ExerciseDetail ex={ex} close={close} />)

/* ============================ add to routine ============================ */
function AddToRoutine({ ex, close }) {
  const st = useStore(s => s.S)
  const pick = rid => {
    close()
    const isNew = rid === '_new'
    exConfigSheet(ex, null, cfg => {
      update(s => {
        let r = isNew ? { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] } : s.routines.find(x => x.id === rid)
        if (isNew) s.routines.push(r)
        if (r) r.ex.push({ id: ex.id, ...cfg })
      })
      const r = isNew ? S().routines[S().routines.length - 1] : st.routines.find(x => x.id === rid)
      toast(t('“{0}” added to {1}', ex.n, r ? r.name : t('routine')))
      if (isNew && r) nav('/plan/r/' + r.id)
    }, null, isNew ? null : st.routines.find(x => x.id === rid))
  }
  return <>
    <h3 className="capitalize">{t('Add “{0}”', ex.n)}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{t('Pick a routine — sets, reps & weight come next.')}</div>
    <div className="list">
      {st.routines.map(r => <div key={r.id} className="item" onClick={() => pick(r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        {r.ex.some(e => e.id === ex.id) && <span className="tag">{t('already in')}</span>}<Icon name="plus" className="chev" />
      </div>)}
      <div className="item" onClick={() => pick('_new')}><span className="lrow-i" style={{ background: 'var(--surface-3)' }}><Icon name="sparkles" /></span>
        <div className="grow"><div className="tt">{t('New routine')}</div><div className="ss">{t('Create one and start with this exercise')}</div></div><Icon name="plus" className="chev" /></div>
    </div>
  </>
}
export const addToRoutineSheet = ex => ui().openSheet(close => <AddToRoutine ex={ex} close={close} />)

/* ============================ custom exercises (issue #11) ============================ */
// Name + body part is all it takes — the exercise then behaves like any built-in one
// (planning, logging, PRs, stats), just without an animation.
function CustomExForm({ existing, prefill, onDone, close }) {
  const [n, setN] = useState(existing ? existing.n : (prefill || ''))
  const [bp, setBp] = useState(existing ? existing.bp : '')
  const [desc, setDesc] = useState(existing ? (existing.desc || '') : '')
  const save = () => {
    const name = n.trim()
    if (!name) { toast(t('Give it a name')); return }
    if (!bp) { toast(t('Pick a body part')); return }
    const dup = allExercises(S()).find(e => e.n.toLowerCase() === name.toLowerCase() && e.id !== (existing || {}).id)
    if (dup) { toast(t('“{0}” already exists', dup.n)); return }
    const d = desc.trim().slice(0, 1000)
    let id = existing && existing.id
    if (existing) update(s => { const c = (s.customEx || []).find(x => x.id === id); if (c) { c.n = name; c.bp = bp; c.desc = d } })
    else {
      id = 'c' + uid()
      update(s => { (s.customEx = s.customEx || []).push({ id, n: name, bp, desc: d, tg: '', eq: 'custom', custom: true }) })
    }
    close()
    toast(existing ? t('Saved') : t('“{0}” created', name))
    onDone && onDone(EXIDX[id])
  }
  return <>
    <h3>{existing ? t('Edit custom exercise') : t('Create your own exercise')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{t('Name it and pick a body part — it behaves like any other exercise, just without an animation.')}</div>
    <input className="input" placeholder={t('Exercise name')} value={n} onChange={e => setN(e.target.value)} />
    <div className="chips" style={{ margin: '12px 0' }}>
      {BODYPARTS.map(b => <button key={b} className={'chip' + (bp === b ? ' on' : '')} onClick={() => setBp(b)}>{t(b)}</button>)}
    </div>
    {bp === 'cardio' && <div className="small dim row" style={{ marginBottom: 10, gap: 5 }}><Icon name="figureRun" style={{ fontSize: 13 }} />{t('Cardio exercises log time + speed instead of weight × reps.')}</div>}
    <textarea className="input" rows={4} maxLength={1000} placeholder={t('Description (optional) — setup, cues, anything you want to remember')}
      value={desc} onChange={e => setDesc(e.target.value)} />
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={save}>{existing ? t('Save') : t('Create exercise')}</Button>
    {existing && <><div style={{ height: 8 }} /><Button variant="danger" icon="trash" onClick={() => { close(); deleteCustomEx(existing) }}>{t('Delete exercise')}</Button></>}
  </>
}
export const customExSheet = (existing, onDone, prefill) => ui().openSheet(close => <CustomExForm existing={existing} prefill={prefill} onDone={onDone} close={close} />)

export function deleteCustomEx(ex, afterDelete) {
  if (S().active?.entries.some(e => e.id === ex.id)) { toast(t('Finish your current workout first')); return }
  confirmSheet({
    title: t('Delete “{0}”?', ex.n),
    message: t('It will be removed from your routines. Already-logged workouts keep their sets.'),
    confirmText: t('Delete'), danger: true,
    onConfirm: () => {
      update(s => {
        s.customEx = (s.customEx || []).filter(x => x.id !== ex.id)
        s.routines.forEach(r => { r.ex = r.ex.filter(e => e.id !== ex.id); cleanupSg(r.ex) })
        // stamp the name into history entries so past workouts stay readable
        s.workouts.forEach(w => w.entries.forEach(e => { if (e.id === ex.id) e.n = ex.n }))
        delete s.exWeights[ex.id]
      })
      toast(t('Exercise deleted'))
      afterDelete && afterDelete()
    }
  })
}

/* ============================ exercise picker ============================ */
// Exercises already used in your routines or past workouts (for the "Chosen" filter + a marker).
function usageMap(st) {
  const u = {}
  st.routines.forEach(r => r.ex.forEach(e => { u[e.id] = (u[e.id] || 0) + 1 }))
  st.workouts.forEach(w => w.entries.forEach(e => { u[e.id] = (u[e.id] || 0) + 1 }))
  return u
}
function ExercisePicker({ onPick, close }) {
  const st = useStore(s => s.S)
  const usage = usageMap(st)
  const [q, setQ] = useState('')
  const [bp, setBp] = useState('')          // '' = all, '★' = chosen, else a body part
  const [eq, setEq] = useState('')          // '' = any equipment
  const [shown, setShown] = useState(50)
  const ql = q.toLowerCase().trim()
  const all = allExercises(st)
  let base = all.filter(e =>
    (bp === '★' ? usage[e.id] : (!bp || e.bp === bp)) &&
    (!ql || e.n.toLowerCase().includes(ql) || e.tg.includes(ql) || e.eq.includes(ql) || (e.desc || '').toLowerCase().includes(ql)))
  if (bp === '★') base = [...base].sort((a, b) => (usage[b.id] - usage[a.id]) || (a.n < b.n ? -1 : 1))
  const eqOpts = equipmentOf(base)
  // Drop the equipment filter if the search narrowed it away, so you never hit a dead end.
  const eqOn = eqOpts.includes(eq) ? eq : ''
  const f = eqOn ? base.filter(e => e.eq === eqOn) : base
  const chosenCount = Object.keys(usage).length
  return <>
    <h3>{t('Add exercise')}</h3>
    <div className="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input className="input" placeholder={t('Search {0} exercises…', all.length)} value={q} onChange={e => { setQ(e.target.value); setShown(50) }} /></div>
    <div className="chips" style={{ margin: eqOpts.length > 1 ? '10px 0 6px' : '10px 0' }}>
      {chosenCount > 0 && <button className={'chip' + (bp === '★' ? ' on' : '')} onClick={() => { setBp('★'); setEq(''); setShown(50) }}><Icon name="starFill" style={{ fontSize: 12, display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />{t('Chosen')} ({chosenCount})</button>}
      <button className={'chip nocap' + (!bp ? ' on' : '')} onClick={() => { setBp(''); setEq(''); setShown(50) }}>{t('All')}</button>
      {BODYPARTS.map(b => <button key={b} className={'chip' + (bp === b ? ' on' : '')} onClick={() => { setBp(b); setEq(''); setShown(50) }}>{t(b)}</button>)}
    </div>
    {eqOpts.length > 1 && <div className="chips" style={{ marginBottom: 10 }}>
      <button className={'chip nocap' + (!eqOn ? ' on' : '')} onClick={() => { setEq(''); setShown(50) }}>{t('Any equipment')}</button>
      {eqOpts.map(x => <button key={x} className={'chip' + (eqOn === x ? ' on' : '')} onClick={() => { setEq(x); setShown(50) }}>{t(x)}</button>)}
    </div>}
    <div className="list">
      {bp !== '★' && <div className="item" onClick={() => customExSheet(null, ex => onPick(ex), q.trim())}>
        <div className="thumb thumb-x"><Icon name="sparkles" /></div>
        <div className="grow"><div className="tt">{t('Create your own exercise')}</div><div className="ss">{t('name + body part, no animation')}</div></div><Icon name="plus" className="chev" />
      </div>}
      {f.slice(0, shown).map(e => <div key={e.id} className="item" onClick={() => onPick(e)}>
        <Thumb ex={e} /><div className="grow"><div className="tt capitalize">{e.n}</div><div className="ss capitalize">{t(e.tg || e.bp)} · {t(e.eq)}</div></div>
        {usage[e.id] && <span className="tag acc"><Icon name="starFill" /></span>}<Icon name="plus" className="chev" />
      </div>)}
      {f.length === 0 && bp === '★' && <div className="empty">{t('Nothing chosen yet — add exercises and they’ll show up here.')}</div>}
    </div>
    {f.length > shown && <><div style={{ height: 8 }} /><Button onClick={() => setShown(s => s + 50)}>{t('Show more')}</Button></>}
  </>
}
export const exercisePicker = onPick => ui().openSheet(close => <ExercisePicker onPick={onPick} close={close} />)

/* ============================ exercise config ============================ */
// Progression settings for one exercise (issue #17). Shown inside the config sheet because
// "how does this lift go up" belongs next to sets and reps, not in a separate screen. Left
// on "follow the routine" it inherits, so most people never touch it.
function ProgressionFields({ ex, mode, c, setC, routine, unit }) {
  const options = POLICIES_FOR[mode] || ['off']
  if (options.length < 2) return null
  const inherited = policyFor({ id: ex.id }, routine, mode)
  const active = policyFor({ ...c, id: ex.id }, routine, mode)
  const inc = c.inc > 0 ? c.inc : (mode === 'time' ? 5 : defaultIncrement(ex.id, unit))
  return <>
    <h4 className="sec">{t('Progression')}</h4>
    <div className="sect-b" style={{ marginBottom: 8 }}>
      <SelectRow title={t('Rule')} sheetTitle={t('Progression')} value={c.prog || ''} onChange={v => setC(x => ({ ...x, prog: v || undefined }))}
        options={[{ value: '', label: t('Follow the routine ({0})', t(POLICY_NAME[inherited])) },
          ...options.map(p => ({ value: p, label: t(POLICY_NAME[p]) }))]} />
    </div>
    <div className="small dim" style={{ marginBottom: active === 'off' ? 18 : 10 }}>{t(POLICY_DESC[active])}</div>
    {active !== 'off' && <div className="row cfgrow" style={{ marginBottom: 18 }}>
      <Stepper label={mode === 'time' ? t('Step (seconds)') : t('Step ({0})', unit)} value={inc}
        step={mode === 'time' ? 5 : 1.25} decimal={mode !== 'time'} onChange={v => setC(x => ({ ...x, inc: v }))} />
      {active === 'double' && <Stepper label={t('Reps from')} value={c.repsMin || Math.max(1, (c.reps || 10) - 2)}
        step={1} decimal={false} onChange={v => setC(x => ({ ...x, repsMin: v }))} />}
    </div>}
  </>
}

function ExConfig({ ex, existing, onSave, onDelete, close, routine }) {
  const st = useStore(s => s.S)
  const cardio = isCardio(ex.id)
  const [c, setC] = useState(existing || defaultConfig(ex.id))
  // Cardio keeps its own duration+speed form; the reps/time choice (issue #16) is offered for
  // everything else, which is where the gap was — planks, hangs, wall sits, loaded carries.
  const mode = cardio ? 'cardio' : modeOf({ ...c, id: ex.id })
  // Both default from the dataset and are then whatever the config says — see isBw.
  const bw = !cardio && isBw({ ...c, id: ex.id })
  const perSide = isPerSide(c)
  // Keep whatever the other mode already had (sets, weight) and fill only what is missing.
  const setMode = m => setC(x => ({ ...defaultConfig(ex.id, m), ...x, mode: m }))
  const save = () => {
    close()
    const sets = Math.max(1, Math.round(c.sets) || (cardio ? 1 : 3))
    // Only carry progression settings that differ from the inherited default, so a plan file
    // stays readable and "follow the routine" keeps meaning exactly that.
    const prog = {}
    if (c.prog) prog.prog = c.prog
    if (c.inc > 0) prog.inc = c.inc
    // Written only when it differs from what the dataset already says, so a barbell config
    // stays exactly the shape it was before these flags existed.
    // `bodyweight` is true of a hold as much as of a set of reps; `side` is not — it counts
    // reps, and a timed hold has none. Switching an exercise to Time therefore drops it
    // rather than carrying a flag nothing downstream can read.
    const flags = {}
    if (bw !== isBodyweightEq(ex.id)) flags.bodyweight = bw
    if (cardio) onSave({ sets, min: Math.max(1, Math.round(c.min) || 20), speed: Math.max(0, c.speed || 8) })
    else if (mode === 'time') onSave({ sets, mode: 'time', sec: Math.max(1, Math.round(c.sec) || 45), weight: Math.max(0, c.weight || 0), ...flags, ...prog })
    else {
      // A unilateral target is stored even: the split has to divide, and a typed 15 would
      // otherwise plan seven reps on one side and eight on the other, every session.
      const typed = Math.max(1, Math.round(c.reps) || 10)
      const reps = perSide ? Math.ceil(typed / 2) * 2 : typed
      const out = { sets, mode: 'reps', reps, weight: Math.max(0, c.weight || 0), ...flags, ...(perSide ? { side: true } : {}), ...prog }
      if (policyFor({ ...c, id: ex.id }, routine, 'reps') === 'double') out.repsMin = Math.min(reps, Math.max(1, Math.round(c.repsMin) || Math.max(1, reps - 2)))
      // A ceiling below the working reps would tell you to add a set on day one.
      if (bw && !(out.weight > 0) && c.repsMax > 0) out.repsMax = Math.max(reps, Math.round(c.repsMax))
      onSave(out)
    }
  }
  return <>
    <h3 className="capitalize">{ex.n}</h3>
    <Media ex={ex} />
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '10px 0 14px' }}>
      {cardio && <span className="tag acc"><Icon name="figureRun" />{t('Cardio')}</span>}
      <span className="tag">{t(ex.tg || ex.bp)}</span><span className="tag">{t(ex.eq)}</span>
    </div>
    {ex.desc && <div className="exnote">{ex.desc}</div>}
    {!cardio && <div style={{ marginBottom: 14 }}>
      <Segmented className="seg-range" value={mode} onChange={setMode}
        options={[{ value: 'reps', label: t('Reps') }, { value: 'time', label: t('Time') }]} />
    </div>}
    <div className="row cfgrow" style={{ marginBottom: mode === 'time' ? 8 : 18 }}>
      {cardio ? <>
        <Stepper label={t('Intervals')} value={c.sets} step={1} decimal={false} onChange={v => setC(x => ({ ...x, sets: v }))} />
        <Stepper label={t('Minutes')} value={c.min} step={1} decimal={false} onChange={v => setC(x => ({ ...x, min: v }))} />
        <Stepper label={t('Speed (km/h)')} value={c.speed} step={0.5} onChange={v => setC(x => ({ ...x, speed: v }))} />
      </> : mode === 'time' ? <>
        <Stepper label={t('Sets')} value={c.sets} step={1} decimal={false} onChange={v => setC(x => ({ ...x, sets: v }))} />
        <Stepper label={t('Seconds')} value={c.sec} step={5} decimal={false} onChange={v => setC(x => ({ ...x, sec: v }))} />
        <Stepper label={t('Weight ({0})', st.unit)} value={c.weight} step={2.5} onChange={v => setC(x => ({ ...x, weight: v }))} />
      </> : <>
        <Stepper label={t('Sets')} value={c.sets} step={1} decimal={false} onChange={v => setC(x => ({ ...x, sets: v }))} />
        <Stepper label={t('Reps')} value={c.reps} step={perSide ? 2 : 1} decimal={false} onChange={v => setC(x => ({ ...x, reps: v }))} />
        {/* On bodyweight work the weight stepper is the click #32 is about, so it is not here
            until there is a belt to describe — see the added-weight row below. */}
        {!bw && <Stepper label={t('Weight ({0})', st.unit)} value={c.weight} step={2.5} onChange={v => setC(x => ({ ...x, weight: v }))} />}
      </>}
    </div>
    {mode === 'time' && !bw && <div className="small dim" style={{ marginBottom: 18 }}>
      {t('A timer runs while you hold the set. Leave the weight at 0 for bodyweight holds.')}
    </div>}
    {/* ---------- bodyweight + per side (issues #31/#32/#33) ---------- */}
    {!cardio && <div className="sect-b" style={{ marginBottom: 8 }}>
      <Row icon="figureStrength" iconTint="var(--acc)" title={t('Bodyweight')}
        subtitle={bw ? t('No weight to enter — just log the reps.') : t('Ask for a weight on every set.')}>
        <Switch checked={bw} onChange={v => setC(x => ({ ...x, bodyweight: v, weight: v ? 0 : x.weight }))} />
      </Row>
      {mode === 'reps' && <Row icon="shuffle" iconTint="var(--blue)" title={t('Reps per side')}
        subtitle={perSide ? t('You still log the total: {0} is {1} per side.', c.reps || 0, fmtNum(sideReps(c.reps))) : t('For lunges, single-arm rows and the like.')}>
        {/* Turning it on rounds the target up to an even number, since half of an odd
            total is a rep one side does not get. */}
        <Switch checked={perSide} onChange={v => setC(x => ({ ...x, side: v || undefined, reps: v ? Math.ceil((x.reps || 0) / 2) * 2 : x.reps }))} />
      </Row>}
    </div>}
    {/* A stepper is too wide to sit in a list row next to a label — it squeezes the text to
        one word per line — so added weight gets the same full-width treatment as sets and
        reps, with its explanation underneath. */}
    {bw && <>
      <div className="row cfgrow" style={{ marginBottom: 8 }}>
        <Stepper label={t('Added ({0})', st.unit)} value={c.weight || 0} step={2.5}
          onChange={v => setC(x => ({ ...x, weight: v }))} />
      </div>
      <div className="small dim" style={{ marginBottom: 18 }}>
        {t('For dips or pull-ups with a belt. Progression then follows the weight.')}
      </div>
    </>}
    {/* The rep ceiling only means something when there is no load to add instead. */}
    {mode === 'reps' && bw && !(c.weight > 0) && <div className="row cfgrow" style={{ marginBottom: 18 }}>
      <Stepper label={t('Top of the range')} value={c.repsMax || 0} step={1} decimal={false}
        onChange={v => setC(x => ({ ...x, repsMax: v }))} />
    </div>}
    {mode === 'reps' && bw && !(c.weight > 0) && <div className="small dim" style={{ marginTop: -10, marginBottom: 18 }}>
      {c.repsMax > 0
        ? t('Reps climb to {0}, then a set is added and the reps start over. At {1} sets it asks you to add weight instead.', c.repsMax, MAX_BW_SETS)
        : t('Reps climb by one whenever every set was clean. Set a ceiling to add sets instead of reps forever.')}
    </div>}
    <ProgressionFields ex={ex} mode={mode} c={c} setC={setC} routine={routine} unit={st.unit} />
    <Button variant="primary" onClick={save}>{existing ? t('Save') : t('Add to routine')}</Button>
    {ex.custom && <><div style={{ height: 8 }} /><Button icon="pencil" onClick={() => { close(); customExSheet(ex) }}>{t('Edit or delete this exercise')}</Button></>}
    {onDelete && <><div style={{ height: 8 }} /><Button variant="danger" onClick={() => { close(); onDelete() }}>{t('Remove from routine')}</Button></>}
  </>
}
export const exConfigSheet = (ex, existing, onSave, onDelete, routine) => ui().openSheet(close => <ExConfig ex={ex} existing={existing} onSave={onSave} onDelete={onDelete} routine={routine} close={close} />)

/* ============================ glyph picker ============================ */
// Grouped by what the glyph means for a training day, so picking one is a scan
// of four short rows rather than a hunt through twenty loose icons.
export const glyphPicker = (current, onPick) => {
  const cur = glyphOf(current)
  return ui().openSheet(close => <>
    <h3>{t('Pick an icon')}</h3>
    {GLYPH_GROUPS.map(g => (
      <div key={g.key} style={{ marginBottom: 14 }}>
        <div className="sect-t" style={{ padding: '0 2px 7px' }}>{t(g.key)}</div>
        <div className="glyph-grid">
          {g.items.map(n => (
            <button key={n} className={'glyph-cell' + (n === cur ? ' on' : '')}
              onClick={() => { close(); onPick(n) }} aria-label={n}>
              <Icon name={n} />
            </button>
          ))}
        </div>
      </div>
    ))}
    <div style={{ height: 4 }} />
  </>)
}

/* ============================ share / print / import a plan ============================ */
export const planToolsSheet = () => ui().openSheet(close => <PlanTools close={close} />)

function PlanTools({ close }) {
  const st = useStore(s => s.S)
  const user = useStore(s => s.user)
  const fileRef = useRef(null)
  const hasRoutines = (st.routines || []).some(r => r.ex && r.ex.length)

  const exportFile = async () => {
    const bundle = buildPlanBundle(st, user?.name ? t('{0}’s plan', user.name) : '')
    const json = JSON.stringify(bundle, null, 2)
    const name = 'opengym-plan-' + todayISO() + '.json'
    if (MOBILE) { try { await shareExport(json, name) } catch (e) { /* dismissed */ } close(); return }
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href)
    close(); toast(t('Plan file saved — send it to a friend'))
  }
  const pickFile = ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return
    const rd = new FileReader()
    rd.onload = () => {
      try { const bundle = parsePlan(rd.result); close(); planImportSheet(bundle) }
      catch (e) { toast(t('Import failed: {0}', e.message)) }
    }
    rd.readAsText(f)
  }

  return <>
    <h3>{t('Share your plan')}</h3>
    <div className="muted small" style={{ marginBottom: 16 }}>{t('Send your routines to a friend, or put your week on paper.')}</div>
    <Button variant="primary" icon="upload" onClick={exportFile} disabled={!hasRoutines}>{t('Export plan file')}</Button>
    <div className="dim small" style={{ margin: '7px 2px 0', lineHeight: 1.4 }}>{t('A small file a friend imports into their own openGym — routines only, none of your workouts or weigh-ins.')}</div>
    {!MOBILE && <>
      <div style={{ height: 12 }} />
      <Button variant="tinted" icon="download" onClick={() => { close(); printPlan(st, user?.name || '') }} disabled={!hasRoutines}>{t('Print / Save as PDF')}</Button>
      <div className="dim small" style={{ margin: '7px 2px 0', lineHeight: 1.4 }}>{t('A clean one-page-per-plan printout — no exercise ever splits across a page.')}</div>
    </>}
    {!hasRoutines && <div className="dim small" style={{ margin: '12px 2px 0' }}>{t('Add an exercise to a routine first — an empty plan has nothing to share.')}</div>}
    <h4 className="sec">{t('Got a plan from a friend?')}</h4>
    <Button variant="ghost" icon="folder" onClick={() => fileRef.current?.click()}>{t('Import a plan file')}</Button>
    <input ref={fileRef} type="file" accept="application/json,.json" onChange={pickFile} hidden />
  </>
}

export const planImportSheet = bundle => ui().openSheet(close => <PlanImport bundle={bundle} close={close} />)

function PlanImport({ bundle, close }) {
  const [schedule, setSchedule] = useState(false)
  const apply = () => {
    update(s => mergePlan(s, bundle, { schedule }))
    close()
    toast(t('Added {0} routines to your plan', bundle.routineCount))
    nav('/plan')
  }
  return <>
    <h3>{bundle.name ? t('Import “{0}”', bundle.name) : t('Import this plan')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>
      {t(bundle.routineCount === 1 ? '{0} routine' : '{0} routines', bundle.routineCount)}
      {' · ' + exCount(bundle.exerciseCount)}
      {bundle.scheduledDays > 0
        ? ' · ' + t(bundle.scheduledDays === 1 ? 'scheduled on {0} day' : 'scheduled on {0} days', bundle.scheduledDays)
        : ''}
    </div>
    <div className="dim small" style={{ marginBottom: 14, lineHeight: 1.4 }}>{t('These are added as new routines — nothing you already have is changed.')}</div>
    {bundle.dropped > 0 && <div className="small" style={{ color: 'var(--yellow)', marginBottom: 14, lineHeight: 1.4 }}>
      {t(bundle.dropped === 1
        ? '{0} exercise in the file isn’t in your library and was left out.'
        : '{0} exercises in the file aren’t in your library and were left out.', bundle.dropped)}
    </div>}
    {bundle.scheduledDays > 0 && <div className="row between" style={{ padding: '10px 2px', borderTop: '1px solid var(--sep)', borderBottom: '1px solid var(--sep)', marginBottom: 16, gap: 12 }}>
      <div><div className="tt" style={{ fontSize: 15 }}>{t('Use this weekly schedule')}</div><div className="small dim">{t('Replaces your current Mon–Sun assignments.')}</div></div>
      <Switch checked={schedule} onChange={setSchedule} />
    </div>}
    <Button variant="primary" onClick={apply}>{t('Add to my plan')}</Button>
    <div style={{ height: 8 }} />
    <Button variant="ghost" className="dim" onClick={close}>{t('Cancel')}</Button>
  </>
}

/* ============================ day override / assign ============================ */
function DayOverride({ iso, close }) {
  const st = useStore(s => s.S)
  const wd = new Date(iso + 'T12:00:00').getDay()
  const weeklyR = st.routines.find(r => r.id === st.week[wd])
  const hasOvr = st.dayPlan[iso] !== undefined
  const effId = effectiveRoutineId(st, iso)
  const set = v => {
    update(s => { if (!v) delete s.dayPlan[iso]; else s.dayPlan[iso] = v })
    close()
    toast(v === '' ? t('Back to weekly plan') : v === 'rest' ? t('{0} set to rest', fmtDate(iso)) : t('{0} planned for {1}', (st.routines.find(r => r.id === v) || {}).name, fmtDate(iso)))
  }
  return <>
    <h3>{fmtDate(iso, true)}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{t('Weekly plan:')} {weeklyR ? weeklyR.name : t('Rest')}{hasOvr && <span style={{ color: 'var(--orange)' }}> · {t('changed for this day')}</span>}<br />{t('Sick, missed a day or want a different session? Pick what to train instead.')}</div>
    <div className="list">
      {st.routines.map(r => <div key={r.id} className="item" onClick={() => set(r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        {effId === r.id && <Icon name="check" className="accent" />}</div>)}
      <div className="item" onClick={() => set('rest')}><span className="lrow-i" style={{ background: 'var(--surface-3)' }}><Icon name="moon" /></span><div className="grow"><div className="tt">{t('Rest / skip this day')}</div></div>{effId === null && <Icon name="check" className="accent" />}</div>
      {hasOvr && <div className="item" onClick={() => set('')}><span className="lrow-i" style={{ background: 'var(--surface-3)' }}><Icon name="reset" /></span><div className="grow"><div className="tt">{t('Back to weekly plan')}</div></div></div>}
    </div>
  </>
}
export const dayOverrideSheet = iso => ui().openSheet(close => <DayOverride iso={iso} close={close} />)

function DayAssign({ day, close }) {
  const st = useStore(s => s.S)
  const set = v => { update(s => { if (v) s.week[day] = v; else delete s.week[day] }); close() }
  return <>
    <h3>{t(DAYN[day])}</h3>
    <div className="list">
      <div className="item" onClick={() => set('')}><span className="lrow-i" style={{ background: 'var(--surface-3)' }}><Icon name="moon" /></span><div className="grow"><div className="tt">{t('Rest day')}</div></div>{!st.week[day] && <Icon name="check" className="accent" />}</div>
      {st.routines.map(r => <div key={r.id} className="item" onClick={() => set(r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        {st.week[day] === r.id && <Icon name="check" className="accent" />}</div>)}
    </div>
  </>
}
export const dayAssignSheet = day => ui().openSheet(close => <DayAssign day={day} close={close} />)

/* ============================ workout detail ============================ */
function WorkoutDetail({ w, close }) {
  const st = useStore(s => s.S)
  return <>
    <h3>{w.name}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{[fmtDate(w.d, true), ...durPart(w.end - w.start), fmtVol(w.vol, st.unit), ...(w.bw ? [fmtNum(w.bw) + ' ' + st.unit] : [])].join(' · ')}</div>
    {w.entries.map((e, i) => {
      const ex = EXIDX[e.id]
      return <div key={i} className="row" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
        {ex && <Thumb ex={ex} />}
        <div className="grow"><div className="tt capitalize" style={{ fontWeight: 600 }}>{ex ? ex.n : (e.n || e.id)} {w.prs && w.prs.includes(e.id) && <span className="pr"><Icon name="trophy" />PR</span>}</div>
          <div className="ss">{e.sets.filter(s => s.done).map(s => setLabel(e.id, s, e.target)).join('  ·  ') || t('no sets')}</div></div>
      </div>
    })}
    <Button variant="danger" onClick={() => confirmSheet({ title: t('Delete workout?'), message: t('This removes it from your history for good.'), confirmText: t('Delete'), danger: true, onConfirm: () => { update(s => { s.workouts = s.workouts.filter(x => x.id !== w.id) }); close(); toast(t('Workout deleted')) } })}>{t('Delete workout')}</Button>
  </>
}
export const workoutDetailSheet = w => ui().openSheet(close => <WorkoutDetail w={w} close={close} />)

/* ============================ calendar ============================ */
function Calendar({ start, close }) {
  const st = useStore(s => s.S)
  const [cur, setCur] = useState(() => { const d = start ? new Date(start) : new Date(); d.setDate(1); return d })
  const y = cur.getFullYear(), mo = cur.getMonth()
  const byDay = {}
  st.workouts.forEach(w => (byDay[w.d] = byDay[w.d] || []).push(w))
  const startOffset = (new Date(y, mo, 1).getDay() + 6) % 7
  const daysIn = new Date(y, mo + 1, 0).getDate()
  const monthWs = st.workouts.filter(w => w.d.startsWith(y + '-' + String(mo + 1).padStart(2, '0')))
  const monthVol = monthWs.reduce((a, w) => a + (w.vol || 0), 0)
  const monthMs = monthWs.reduce((a, w) => a + Math.max(0, (w.end || w.start) - w.start), 0)
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(<div key={'e' + i} />)
  for (let d = 1; d <= daysIn; d++) {
    const iso = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
    const ws = byDay[iso], effId = effectiveRoutineId(st, iso), ovr = st.dayPlan[iso] !== undefined
    const dotCls = ws ? 'done' : ovr && effId ? 'ovr' : effId ? 'plan' : ''
    cells.push(<button key={d} className={'cal-d' + (ws ? ' has' : '') + (iso === todayISO() ? ' today' : '')} onClick={() => {
      if (!ws) { close(); dayOverrideSheet(iso); return }
      if (ws.length === 1) { close(); workoutDetailSheet(ws[0]); return }
      close(); ui().openSheet(c2 => <><h3>{fmtDate(iso, true)}</h3><div className="list">{ws.map(w => <WorkoutRow key={w.id} w={w} onClick={() => { c2(); workoutDetailSheet(w) }} />)}</div></>)
    }}><span>{d}</span><i className={dotCls} /></button>)
  }
  return <>
    <div className="row between" style={{ marginBottom: 2 }}>
      <button className="iconbtn" onClick={() => setCur(new Date(y, mo - 1, 1))} aria-label="Previous month"><Icon name="chevronLeft" /></button>
      <h3 style={{ margin: 0 }}>{t(MONTHS_LONG[mo])} {y}</h3>
      <button className="iconbtn" onClick={() => setCur(new Date(y, mo + 1, 1))} aria-label="Next month"><Icon name="chevronRight" /></button>
    </div>
    <div className="small muted" style={{ textAlign: 'center' }}>{monthWs.length ? `${t(monthWs.length === 1 ? '{0} workout' : '{0} workouts', monthWs.length)} · ${fmtDur(monthMs)} · ${fmtVol(monthVol, st.unit)}` : t('No workouts this month')}</div>
    <div className="cal-grid">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(l => <div key={l} className="cal-h">{t(l)}</div>)}{cells}</div>
    <div className="cal-legend">
      <span><i style={{ background: 'var(--acc)' }} />{t('Trained')}</span>
      <span><i style={{ background: 'var(--label-3)' }} />{t('Planned')}</span>
      <span><i style={{ background: 'var(--orange)' }} />{t('Rescheduled')}</span>
    </div>
    <div className="small dim" style={{ textAlign: 'center', marginTop: 10 }}>{t('Tap a trained day for details · tap any other day to plan a session')}</div>
  </>
}
export const calendarSheet = start => ui().openSheet(close => <Calendar start={start} close={close} />)

/* shared small workout row (used in lists) */
export function WorkoutRow({ w, onClick }) {
  const st = useStore(s => s.S)
  const glyph = glyphOf((st.routines.find(r => r.id === w.routineId) || {}).emoji)
  return <div className="item" onClick={onClick}>
    <span className="lrow-i" style={{ width: 34, height: 34, borderRadius: 8, fontSize: 19 }}><Icon name={glyph} /></span>
    <div className="grow"><div className="tt">{w.name}</div>
      <div className="ss">{[fmtDate(w.d, true), ...durPart(w.end - w.start), t('{0} sets', setsDone(w)), fmtVol(w.vol, st.unit)].join(' · ')}</div></div>
    {w.prs && w.prs.length > 0 && <span className="pr"><Icon name="trophy" />{w.prs.length} PR</span>}
    <Icon name="chevronRight" className="chev" />
  </div>
}

/* ============================ workout lifecycle ============================ */
export function startFlow(routineId) {
  bwSheet({ required: true, onDone: bw => beginWorkout(routineId, bw) })
}
export function beginWorkout(routineId, bw) {
  const st = S()
  const r = routineId ? st.routines.find(x => x.id === routineId) : null
  // The prescription is applied as the session is built, so you walk up to the bar with the
  // right weight already on the screen instead of being told about it afterwards. `plan` is
  // kept on the entry purely so the workout can explain the number it chose.
  const entries = (r ? r.ex : []).map(cfg => {
    const plan = nextPrescription(st, cfg, r)
    return { id: cfg.id, sg: cfg.sg, target: { ...cfg }, plan, sets: applyPrescription(buildSets(st, cfg), plan) }
  })
  update(s => {
    s.active = { id: uid(), d: todayISO(), start: Date.now(), routineId, name: r ? r.name : t('Freestyle'), bw: bw || null, cur: 0, entries }
  })
  useUI.getState().stopRest()
  nav('/workout')
}
function TopWeight({ entryIdx, close }) {
  const st = useStore(s => s.S)
  const A = st.active
  // The workout can end underneath this sheet: finishing from the last exercise clears
  // `active`, and this re-renders before the sheet is torn down. Everything below is
  // read defensively and the sheet dismisses itself — reading A.entries straight took
  // the whole app down with it. Hooks still run unconditionally, so the bail-out has
  // to sit after every one of them.
  const entry = A ? A.entries[entryIdx] : null
  const ex = entry && EXIDX[entry.id]
  const maxSet = entry ? Math.max(0, ...entry.sets.filter(s => s.done).map(s => s.w || 0)) : 0
  const prevBest = entry ? Math.max((st.exWeights[entry.id] || {}).w || 0, bestWeightFor(st, entry.id)) : 0
  const [v, setV] = useState(entry ? (Math.max(maxSet, prevBest) || entry.target.weight || 0) : 0)
  useEffect(() => { if (!entry) close() }, [!entry])

  const units = supersetUnits(A ? A.entries : [])
  const unit = entry ? unitOf(units, entryIdx) : []
  const unitDone = !!entry && unit.every(i => A.entries[i].sets.every(s => s.done))
  const unitIdx = units.findIndex(u => u === unit)
  const isLastUnit = unitIdx === units.length - 1
  if (!entry || !ex) return null

  const commit = advance => {
    const n = Math.round((v || 0) * 10) / 10
    if (!isFinite(n) || n < 0) { toast(t('Enter a valid weight')); return }
    update(s => {
      s.active.entries[entryIdx].topW = n
      const cur = s.exWeights[entry.id]
      s.exWeights[entry.id] = { w: Math.max(n, cur ? cur.w : 0), d: todayISO() }
    })
    close()
    if (advance && unitDone) {
      if (isLastUnit) workoutCompleteSheet()               // whole workout done → finish/continue prompt
      else update(s => { s.active.cur = units[unitIdx + 1][0] })
    } else toast(t('Tracked — next time starts at {0}', fmtNum(S().exWeights[entry.id].w) + ' ' + st.unit))
  }
  return <>
    <h3 className="capitalize row" style={{ gap: 8 }}><Icon name="checkCircle" style={{ color: 'var(--acc)' }} />{t('{0} done', ex.n)}</h3>
    <div className="muted small">{t('Confirm the weight you worked with — your highest becomes the default next time.')}{!unitDone && unit.length > 1 ? ' ' + t('Then finish the superset partner.') : ''}</div>
    <WeightInput value={v} setValue={setV} unit={st.unit} />
    <div style={{ height: 10 }} />
    {prevBest > 0 ? <div className="small dim" style={{ textAlign: 'center', marginBottom: 12 }}>{t('Previous best:')} {fmtNum(prevBest)} {st.unit}{maxSet > prevBest && <span style={{ color: 'var(--yellow)' }}> — {t('new record!')}</span>}</div> : <div style={{ height: 4 }} />}
    {unitDone ? <>
      <Button variant="primary" trailingIcon={isLastUnit ? null : 'chevronRight'} onClick={() => commit(true)}>{isLastUnit ? t('Save') : t('Save & next exercise')}</Button>
      <div style={{ height: 8 }} /><Button variant="ghost" className="dim" onClick={() => commit(false)}>{t('Just close')}</Button>
    </> : <Button variant="primary" onClick={() => commit(false)}>{t('Save weight')}</Button>}
  </>
}
export const topWeightSheet = entryIdx => ui().openSheet(close => <TopWeight entryIdx={entryIdx} close={close} />)

// Shown when the last exercise's last set is checked — finish, or keep going.
function WorkoutComplete({ close }) {
  return <div style={{ textAlign: 'center', padding: '8px 0' }}>
    <div style={{ fontSize: 44, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="checkCircle" /></div>
    <h3 style={{ margin: '8px 0' }}>{t("That's the whole workout!")}</h3>
    <div className="muted small" style={{ marginBottom: 16 }}>{t('Every exercise done — great work. Finish up, or keep going and add another exercise.')}</div>
    <Button variant="primary" icon="flag" onClick={() => { close(); finishWorkout() }}>{t('Finish workout')}</Button>
    <div style={{ height: 8 }} />
    <Button onClick={() => { close(); useUI.getState().toast(t('Keep going — tap “+ Add exercise” below')) }}>{t('Continue workout')}</Button>
  </div>
}
export const workoutCompleteSheet = () => ui().openSheet(close => <WorkoutComplete close={close} />, { kind: 'center' })

function FinishSummary({ w, prs, e1prs = [], close }) {
  const st = useStore(s => s.S)
  return <div style={{ textAlign: 'center', padding: '8px 0' }}>
    <div style={{ fontSize: 44, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="trophy" /></div>
    <h3 style={{ margin: '8px 0' }}>{t('Workout complete!')}</h3>
    <div className="tiles" style={{ textAlign: 'left' }}>
      <div className="tile"><div className="l">{t('Duration')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{fmtDur(w.end - w.start)}</div></div>
      <div className="tile"><div className="l">{t('Volume')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{fmtVol(w.vol, st.unit)}</div></div>
      <div className="tile"><div className="l">{t('Sets')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{setsDone(w)}</div></div>
      <div className="tile"><div className="l">{t('PRs')}</div><div className="v" style={{ fontSize: 20 }}>{prs.length || '—'}</div></div>
    </div>
    {(prs.length > 0 || e1prs.length > 0) && <div style={{ textAlign: 'left', marginBottom: 12 }}>
      {prs.map(id => <div key={id} className="small accent capitalize row" style={{ gap: 5 }}><Icon name="trophy" style={{ fontSize: 13 }} />{t('New PR:')} {(EXIDX[id] || {}).n || id}</div>)}
      {e1prs.map(p => <div key={p.id} className="small accent capitalize row" style={{ gap: 5 }}><Icon name="chartLine" style={{ fontSize: 13 }} />{t('Best estimated 1RM:')} {(EXIDX[p.id] || {}).n || p.id} · {fmtNum(p.est)} {st.unit}</div>)}
    </div>}
    <h4 className="sec" style={{ textAlign: 'left' }}>{t('What you just trained')}</h4>
    <BodyMap load={loadOfWorkouts([w])} body={st.body} />
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={() => { close(); nav('/home') }}>{t('Nice!')}</Button>
  </div>
}
export function finishWorkout() {
  const A = S().active
  if (!A) return
  const done = setsDoneActive(A)
  const total = A.entries.reduce((n, e) => n + e.sets.length, 0)
  if (!done) { confirmSheet({ title: t('Nothing logged yet'), message: t('You haven’t checked off any sets. Finish the workout anyway?'), confirmText: t('Finish anyway'), onConfirm: doFinishWorkout }); return }
  if (done < total) { confirmSheet({ title: t('Finish early?'), message: t(total - done === 1 ? '{0} set still unchecked. Finish the workout now?' : '{0} sets still unchecked. Finish the workout now?', total - done), confirmText: t('Finish workout'), onConfirm: doFinishWorkout }); return }
  doFinishWorkout()
}
function doFinishWorkout() {
  const st = S()
  const A = st.active
  if (!A) return
  const prs = []
  const e1prs = []
  A.entries.forEach(e => {
    const mx = Math.max(0, ...e.sets.filter(s => s.done).map(s => s.w))
    if (mx > 0 && mx > bestWeightFor(st, e.id)) prs.push(e.id)
    // A heavier estimate without a heavier top set is its own kind of progress —
    // same weight for more reps. Reported separately so it can't be read as a load PR.
    const rec = is1RMRecord(st, e.id, e)
    if (rec && !prs.includes(e.id)) e1prs.push({ id: e.id, ...rec })
  })
  const w = {
    id: A.id, d: A.d, start: A.start, end: Date.now(), routineId: A.routineId, name: A.name, bw: A.bw,
    // `target` (what the session prescribed) is kept alongside the sets: without it a
    // finished workout cannot say whether it hit its reps, and a timed session reads back
    // as "0 reps". It is what the progression engine works from.
    entries: A.entries.map(e => ({ id: e.id, sets: e.sets, topW: e.topW || null, target: e.target || null })).filter(e => e.sets.some(s => s.done)),
    prs
  }
  w.vol = workoutVolume(w)
  update(s => {
    w.entries.forEach(e => {
      const mx = Math.max(0, ...e.sets.filter(x => x.done).map(x => x.w || 0), e.topW || 0)
      if (mx > 0) { const cur = s.exWeights[e.id]; if (!cur || mx > cur.w) s.exWeights[e.id] = { w: mx, d: w.d } }
    })
    s.workouts.push(w)
    s.active = null
  })
  useUI.getState().stopRest()
  beep(snd(), 880, 0.15); beep(snd(), 1100, 0.15, 0.18); beep(snd(), 1320, 0.3, 0.36)
  ui().openSheet(close => <PostWorkoutCheckin w={w} prs={prs} e1prs={e1prs} close={close} />, { kind: 'center', locked: true })
}

const resolveExerciseId = (name) => {
  if (!name) return null;
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const e of EXDB) {
    if (e.n.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) return e.id;
  }
  for (const e of EXDB) {
    if (e.n.toLowerCase().includes(norm) || norm.includes(e.n.toLowerCase())) return e.id;
  }
  return null;
};

function PostWorkoutCheckin({ w, prs, e1prs, close }) {
  const [difficulty, setDifficulty] = useState('good')
  const [soreness, setSoreness] = useState('mild')

  const handleSubmit = async () => {
    update(s => {
      s.checkins = s.checkins || []
      s.checkins.push({
        date: todayISO(),
        workoutId: w.id,
        difficulty,
        soreness
      })
    })

    // Auto adapt in the background
    useStore.getState().adaptPlan([], { difficulty, soreness })

    close()
    ui().openSheet(closeSummary => <FinishSummary w={w} prs={prs} e1prs={e1prs} close={closeSummary} />, { kind: 'center', locked: true })
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 44, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}>
        <Icon name="sparkles" />
      </div>
      <h3 style={{ margin: '8px 0' }}>{t('Coach Check-in')}</h3>
      <div className="muted small" style={{ marginBottom: 18 }}>
        {t('Tell your AI Coach how today’s session felt so it can adjust next week’s plan.')}
      </div>

      <div style={{ textAlign: 'left', marginBottom: 16 }}>
        <label className="small muted" style={{ display: 'block', marginBottom: 6 }}>{t('Session Difficulty')}</label>
        <Segmented
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: 'easy', label: t('😅 Too Easy') },
            { value: 'good', label: t('💪 Just Right') },
            { value: 'hard', label: t('😤 Too Hard') }
          ]}
        />
      </div>

      <div style={{ textAlign: 'left', marginBottom: 20 }}>
        <label className="small muted" style={{ display: 'block', marginBottom: 6 }}>{t('Muscle Soreness & Recovery')}</label>
        <Segmented
          value={soreness}
          onChange={setSoreness}
          options={[
            { value: 'fresh', label: t('😌 No Pain') },
            { value: 'mild', label: t('😐 Mild') },
            { value: 'sore', label: t('😣 Very Sore') }
          ]}
        />
      </div>

      <Button variant="primary" onClick={handleSubmit}>{t('Save & See Summary')}</Button>
    </div>
  )
}

/* ============================ onboarding & ai plan wizard ============================ */
const ONBOARDING_SPLITS = {
  3: [
    { id: 'ppl-3', title: 'Push / Pull / Legs (PPL)', desc: 'Mon: Chest & Shoulders · Wed: Back & Arms · Fri: Legs', badge: 'Most Popular' },
    { id: 'full-body-3', title: '3-Day Full Body Blast', desc: 'Mon / Wed / Fri: Full body compound workouts every session', badge: 'Best for Beginners' },
    { id: 'calisthenics-3', title: 'Bodyweight & Calisthenics', desc: 'Push-ups, Pull-ups, Dips, Squats & Core (Zero Equipment)', badge: 'No Equipment' }
  ],
  4: [
    { id: 'upper-lower-4', title: 'Upper / Lower Split', desc: 'Upper Body Mon/Thu · Lower Body Tue/Fri (3 Recovery Days)', badge: 'Best Balance' },
    { id: 'bro-split-4', title: '4-Day Bodypart Split', desc: 'Day 1: Chest/Tri · Day 2: Back/Bi · Day 3: Shoulders · Day 4: Legs', badge: 'Bodybuilding' },
    { id: 'home-dumbbell-4', title: 'Home Dumbbell & Bench', desc: 'Complete 4-day muscle routine using only dumbbells & bench', badge: 'Home Friendly' },
    { id: 'fat-burn-shred-4', title: 'Fat Burn & Athletic Shred', desc: 'High-density supersets + compound lifting for rapid fat loss', badge: 'Shred & Tone' }
  ],
  5: [
    { id: 'pplul-5', title: 'Push / Pull / Legs + Upper / Lower', desc: '3-Day PPL followed by 2-Day Upper/Lower for maximum growth', badge: 'Top Recommended' },
    { id: 'bro-split-5', title: 'Classic 5-Day Bro Split', desc: 'Mon: Chest · Tue: Back · Wed: Shoulders · Thu: Arms · Fri: Legs', badge: 'Classic Mass' }
  ],
  6: [
    { id: 'ppl-6', title: 'Push / Pull / Legs (2x/Week)', desc: 'Push A, Pull A, Legs A, Push B, Pull B, Legs B for maximum volume', badge: 'Advanced' },
    { id: 'arnold-split-6', title: 'Arnold Schwarzenegger Split', desc: 'Chest+Back, Shoulders+Arms, Legs repeated twice a week', badge: 'Golden Era' }
  ]
}

function OnboardingWizard({ close }) {
  const st = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [step, setStep] = useState(1)
  
  // State
  const [pname, setPname] = useState(user?.name || '')
  const [age, setAge] = useState('25')
  const [weight, setWeight] = useState(String(lastBW(st)?.w || '72'))
  const [height, setHeight] = useState('175')
  const [gender, setGender] = useState('male')
  const [goal, setGoal] = useState('muscle') // 'fat_loss', 'muscle', 'general'
  const [days, setDays] = useState(4)
  const [location, setLocation] = useState('gym') // 'gym', 'home'
  const [splitId, setSplitId] = useState('upper-lower-4')
  const [diet, setDiet] = useState('nonveg') // 'nonveg', 'veg', 'egg', 'vegan'
  const [loading, setLoading] = useState(false)

  // When days change, update default split
  const handleDaysChange = (newDays) => {
    setDays(newDays)
    const available = ONBOARDING_SPLITS[newDays] || []
    if (available.length > 0) {
      setSplitId(available[0].id)
    }
  }

  // Energy Calculation Preview
  const numAge = Number(age) || 25
  const numWeight = Number(weight) || 72
  const numHeight = Number(height) || 175
  const numDays = Number(days) || 4

  let bmrCalc = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5)
  const actMultipliers = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 }
  const tdeeCalc = Math.round(bmrCalc * (actMultipliers[numDays] || 1.55))
  let targetKcalCalc = tdeeCalc
  if (goal === 'fat_loss') targetKcalCalc = Math.round(tdeeCalc - 450)
  else if (goal === 'muscle') targetKcalCalc = Math.round(tdeeCalc + 350)
  else if (goal === 'general') targetKcalCalc = Math.round(tdeeCalc)

  const targetProteinCalc = Math.round(numWeight * (goal === 'fat_loss' ? 2.2 : 2.0))

  const applyPlanToStore = (plan) => {
    localStorage.setItem('fit_onboarded', '1')
    localStorage.setItem('gym_dirty', '1')
    update(s => {
      s.onboarded = true
      s.aiPlan = plan
      s.aiAnswers = {
        pname: pname || 'Athlete',
        age: numAge,
        weight: numWeight,
        height: numHeight,
        gender,
        goal,
        days: numDays,
        location,
        splitId,
        diet
      }
      s.targetCalories = plan.kcal
      s.targetProtein = plan.protein
      s.targetW = goal === 'fat_loss' ? Math.round((numWeight - 5) * 10) / 10 : goal === 'muscle' ? Math.round((numWeight + 4) * 10) / 10 : numWeight
      
      if (!s.bodyweight.length) {
        s.bodyweight.push({ d: todayISO(), w: numWeight, t: Date.now() })
      }

      // Convert workout plan to store routines
      const { routines, week } = convertPlanToStoreRoutines(plan.workout)
      s.routines = routines
      s.week = week

      s.aiCoachCard = {
        coachNote: plan.coachNote,
        changes: [],
        weeklyInsight: plan.weeklyInsight || 'Welcome to your custom plan! Let’s crush it! 💪',
        celebration: '',
        seenAt: null
      }
    })
    close()
    toast(t('🎉 Custom Plan Activated! ({0} kcal · {1}g Protein)', plan.kcal, plan.protein))
  }

  const handleGenerate = async () => {
    setLoading(true)
    const clientAnswers = {
      pname: pname || 'Athlete',
      age: numAge,
      weight: numWeight,
      height: numHeight,
      gender,
      goal,
      days: numDays,
      location,
      splitId,
      diet
    }

    try {
      const res = await api('/api/generate-plan', {
        method: 'POST',
        body: JSON.stringify({ answers: clientAnswers })
      }).catch(() => null)

      if (res && res.plan && res.plan.workout && res.plan.workout.length > 0) {
        applyPlanToStore(res.plan)
        return
      }
    } catch (e) {
      console.warn('Serverless plan generation fallback:', e)
    }

    const localPlan = generateCustomPlan(clientAnswers)
    applyPlanToStore(localPlan)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="spin" style={{ fontSize: 50, color: 'var(--acc)', display: 'inline-block', marginBottom: 16 }}>
          <Icon name="sparkles" />
        </div>
        <h3 style={{ margin: '8px 0' }}>{t('Building Your Workout & Meal Plan...')}</h3>
        <div className="muted small" style={{ lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          {t('Setting up your {0}-day schedule, target macros ({1} kcal), and Indian meals.', numDays, targetKcalCalc)}
        </div>
      </div>
    )
  }

  const activeSplits = ONBOARDING_SPLITS[days] || ONBOARDING_SPLITS[4]

  return (
    <div style={{ maxHeight: '85vh', overflowY: 'auto', padding: '16px 20px 24px', width: '100%', maxWidth: '480px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Setup Plan · Step {step} of 3
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>
            {step === 1 ? '1. About You & Your Goal' : step === 2 ? '2. Choose Workout Days & Style' : '3. Nutrition & Diet Preference'}
          </h3>
        </div>
        <button className="iconbtn" onClick={close} aria-label="Close"><Icon name="close" /></button>
      </div>

      {/* ── STEP 1: ABOUT YOU & GOAL ─────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 4 }}>
              Your Name
            </label>
            <input
              className="input"
              value={pname}
              placeholder="e.g. Nazim Pasha"
              onChange={e => setPname(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Gender & Age */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 4 }}>
                Gender
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  style={{
                    background: gender === 'male' ? 'var(--acc)' : 'var(--surface-2)',
                    color: gender === 'male' ? 'var(--on-acc)' : 'var(--label)',
                    border: '1px solid ' + (gender === 'male' ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 8, padding: '9px 4px', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  👨 Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  style={{
                    background: gender === 'female' ? 'var(--acc)' : 'var(--surface-2)',
                    color: gender === 'female' ? 'var(--on-acc)' : 'var(--label)',
                    border: '1px solid ' + (gender === 'female' ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 8, padding: '9px 4px', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  👩 Female
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 4 }}>
                Age (years)
              </label>
              <input
                className="input"
                type="number"
                value={age}
                placeholder="25"
                onChange={e => setAge(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Weight & Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 4 }}>
                Body Weight ({st.unit})
              </label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={weight}
                placeholder="72.0"
                onChange={e => setWeight(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 4 }}>
                Height (cm)
              </label>
              <input
                className="input"
                type="number"
                value={height}
                placeholder="175"
                onChange={e => setHeight(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Goal Selector - 3 Big Visual Cards */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
              What is your primary goal?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'fat_loss', title: '🔥 Lose Fat & Get Lean', desc: 'Burn body fat, get shredded, maintain muscle tone' },
                { id: 'muscle', title: '💪 Build Muscle & Get Big', desc: 'Hypertrophy training to gain muscle size & strength' },
                { id: 'general', title: '⚡ Stay Fit & Athletic', desc: 'Healthy lifestyle, stamina, mobility & daily energy' }
              ].map(g => (
                <div
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  style={{
                    background: goal === g.id ? 'var(--surface-2)' : 'var(--surface)',
                    border: '1.5px solid ' + (goal === g.id ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: goal === g.id ? 'var(--acc)' : 'var(--label)' }}>
                      {g.title}
                    </div>
                    <div className="small muted" style={{ fontSize: 11, marginTop: 2 }}>{g.desc}</div>
                  </div>
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px solid ' + (goal === g.id ? 'var(--acc)' : 'var(--sep)'),
                      background: goal === g.id ? 'var(--acc)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {goal === g.id && <span style={{ color: 'var(--on-acc)', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={() => setStep(2)} style={{ padding: '12px', fontSize: 14, fontWeight: 700 }}>
            Next: Workout Schedule →
          </Button>
        </div>
      )}

      {/* ── STEP 2: WORKOUT DAYS & SPLIT STYLE ───────────────────── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Question 1: How many days? */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
              1. How many days per week do you want to workout?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[3, 4, 5, 6].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDaysChange(d)}
                  style={{
                    background: days === d ? 'var(--acc)' : 'var(--surface-2)',
                    color: days === d ? 'var(--on-acc)' : 'var(--label)',
                    border: '1px solid ' + (days === d ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 10, padding: '10px 4px', fontWeight: 800, fontSize: 13, cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  <div>{d} Days</div>
                  <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>/ week</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Location */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 6 }}>
              2. Where will you train?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setLocation('gym')}
                style={{
                  background: location === 'gym' ? 'var(--surface-2)' : 'var(--surface)',
                  color: location === 'gym' ? 'var(--acc)' : 'var(--label)',
                  border: '1.5px solid ' + (location === 'gym' ? 'var(--acc)' : 'var(--sep)'),
                  borderRadius: 10, padding: '10px 8px', fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center'
                }}
              >
                🏢 Commercial Gym
              </button>
              <button
                type="button"
                onClick={() => setLocation('home')}
                style={{
                  background: location === 'home' ? 'var(--surface-2)' : 'var(--surface)',
                  color: location === 'home' ? 'var(--acc)' : 'var(--label)',
                  border: '1.5px solid ' + (location === 'home' ? 'var(--acc)' : 'var(--sep)'),
                  borderRadius: 10, padding: '10px 8px', fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center'
                }}
              >
                🏠 Home (Dumbbells)
              </button>
            </div>
          </div>

          {/* Question 3: Select Workout Split / Style */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
              3. Choose Your Preferred Workout Style:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeSplits.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSplitId(s.id)}
                  style={{
                    background: splitId === s.id ? 'var(--surface-2)' : 'var(--surface)',
                    border: '1.5px solid ' + (splitId === s.id ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: splitId === s.id ? 'var(--acc)' : 'var(--label)' }}>
                        {s.title}
                      </span>
                      <span style={{ fontSize: 9, background: 'var(--surface-3)', color: 'var(--acc)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="small muted" style={{ fontSize: 11, marginTop: 3 }}>
                      {s.desc}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: '2px solid ' + (splitId === s.id ? 'var(--acc)' : 'var(--sep)'),
                      background: splitId === s.id ? 'var(--acc)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {splitId === s.id && <span style={{ color: 'var(--on-acc)', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              Next: Nutrition &amp; Diet →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: NUTRITION & GENERATE ─────────────────────────── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
              What is your food preference?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'nonveg', title: '🍗 Non-Veg', desc: 'Chicken, Eggs, Fish, Meat' },
                { id: 'veg', title: '🥛 Vegetarian', desc: 'Paneer, Soya, Dal, Milk' },
                { id: 'egg', title: '🥚 Eggetarian', desc: 'Eggs + Vegetarian Diet' },
                { id: 'vegan', title: '🥗 Vegan', desc: '100% Plant-based Tofu & Dal' }
              ].map(d => (
                <div
                  key={d.id}
                  onClick={() => setDiet(d.id)}
                  style={{
                    background: diet === d.id ? 'var(--surface-2)' : 'var(--surface)',
                    border: '1.5px solid ' + (diet === d.id ? 'var(--acc)' : 'var(--sep)'),
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: diet === d.id ? 'var(--acc)' : 'var(--label)' }}>
                    {d.title}
                  </div>
                  <div className="small muted" style={{ fontSize: 10, marginTop: 2 }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Calorie & Macro Target Breakdown */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="sparkles" /> Estimated Energy &amp; Macro Targets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ background: 'var(--surface)', padding: '8px 4px', borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--label)' }}>{targetKcalCalc}</div>
                <div className="small muted" style={{ fontSize: 10 }}>DAILY KCAL</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '8px 4px', borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{targetProteinCalc}g</div>
                <div className="small muted" style={{ fontSize: 10 }}>PROTEIN</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '8px 4px', borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{numDays} Days</div>
                <div className="small muted" style={{ fontSize: 10 }}>SCHEDULE</div>
              </div>
            </div>
            <div className="small muted" style={{ fontSize: 11, lineHeight: 1.4 }}>
              Your plan will be built with your exact chosen split ({numDays} days) and Indian meal schedule.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={handleGenerate} icon="sparkles" style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              ⚡ Build My Workout &amp; Nutrition Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================ Explore 12+ Pre-built Programs Sheet ============================ */
function ExploreProgramsModal({ close }) {
  const [selectedId, setSelectedId] = useState(PRESET_PROGRAMS[0].id)
  const currentProgram = PRESET_PROGRAMS.find(p => p.id === selectedId) || PRESET_PROGRAMS[0]

  const handleApplyProgram = (program) => {
    update(s => {
      const routines = []
      const week = {}
      let dayCount = 1

      program.routines.forEach(r => {
        const routineId = uid()
        const routine = {
          id: routineId,
          name: r.name,
          emoji: r.emoji,
          ex: r.exercises.map(e => ({
            id: findEx(e.name),
            sets: e.sets,
            reps: e.reps,
            weight: e.weight || 0
          }))
        }
        routines.push(routine)
        week[dayCount] = routineId
        dayCount++
      })

      s.routines = routines
      s.week = week
    })
    close()
    toast(t('✅ Activated "{0}" Program!', currentProgram.name))
  }

  return (
    <div style={{ padding: '8px 0', maxHeight: '75vh', overflowY: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
        Workout Library
      </div>
      <h3 style={{ margin: '0 0 12px' }}>Explore Workout Programs</h3>
      <div className="muted small" style={{ marginBottom: 14 }}>
        Choose from 12+ curated, science-backed workout splits designed for different schedules, goals, and equipment.
      </div>

      {/* Program Selector Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 14 }}>
        {PRESET_PROGRAMS.map(prog => (
          <button
            key={prog.id}
            onClick={() => setSelectedId(prog.id)}
            style={{
              flex: 'none',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: selectedId === prog.id ? 700 : 500,
              background: selectedId === prog.id ? 'var(--acc)' : 'var(--surface-2)',
              color: selectedId === prog.id ? 'var(--on-acc)' : 'var(--label)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {prog.name.split('(')[0]} ({prog.days}d)
          </button>
        ))}
      </div>

      {/* Selected Program Detail Card */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 style={{ margin: 0, fontSize: 16 }}>{currentProgram.name}</h4>
          <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 99, color: 'var(--acc)', fontWeight: 700 }}>
            {currentProgram.badge}
          </span>
        </div>
        <p className="small muted" style={{ margin: '0 0 14px', lineHeight: 1.45 }}>{currentProgram.desc}</p>

        {/* Routines & Exercises in Program */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {currentProgram.routines.map((r, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--label)', marginBottom: 6 }}>
                Day {idx + 1}: {r.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.exercises.map((ex, eIdx) => (
                  <span key={eIdx} style={{ fontSize: 11, background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 6, color: 'var(--label-2)' }}>
                    {ex.name} ({ex.sets}x{ex.reps})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button variant="primary" onClick={() => handleApplyProgram(currentProgram)}>
          ⚡ Apply "{currentProgram.name.split('(')[0]}" to My Schedule
        </Button>
      </div>
    </div>
  )
}

export function onboardingWizardSheet() {
  ui().openSheet(close => <OnboardingWizard close={close} />, { kind: 'center' })
}

export function exploreProgramsSheet() {
  ui().openSheet(close => <ExploreProgramsModal close={close} />, { kind: 'center' })
}

/* ============================ weekly progress check-in with photos ============================ */
function compressImageFile(file, maxDim = 700, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function WeeklyCheckinModal({ close }) {
  const S_state = useStore(s => s.S)
  const update = useStore(s => s.update)
  const lastBwVal = (S_state.bodyweight && S_state.bodyweight.length > 0) ? S_state.bodyweight[S_state.bodyweight.length - 1].w : (S_state.aiAnswers?.weight || 70)

  const [weightStr, setWeightStr] = useState(String(lastBwVal))
  const [photos, setPhotos] = useState([])
  const [difficulty, setDifficulty] = useState('good') // 'easy', 'good', 'hard'
  const [soreness, setSoreness] = useState('mild') // 'fresh', 'mild', 'sore'
  const [dietRating, setDietRating] = useState('on_track') // 'on_track', 'minor_slip', 'cravings'
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setCompressing(true)
    try {
      const compressedList = []
      for (const file of files) {
        if (photos.length + compressedList.length >= 4) break
        const dataUrl = await compressImageFile(file)
        compressedList.push({ id: uid(), url: dataUrl, label: 'Physique Photo' })
      }
      setPhotos(prev => [...prev, ...compressedList].slice(0, 4))
    } catch (err) {
      toast('Failed to process photo: ' + err.message)
    } finally {
      setCompressing(false)
    }
  }

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    const numericWeight = parseFloat(weightStr)
    if (isNaN(numericWeight) || numericWeight <= 20 || numericWeight >= 400) {
      toast('Please enter a valid bodyweight in ' + S_state.unit)
      return
    }

    setLoading(true)
    const checkinId = uid()
    const checkinDate = todayISO()
    const photoUrls = photos.map(p => p.url)

    // 1. Update client store with bodyweight, checkin, and photos
    update(s => {
      // Add bodyweight log
      s.bodyweight.push({ d: checkinDate, t: Date.now(), w: numericWeight })
      // Add checkin entry
      s.checkins = s.checkins || []
      s.checkins.push({
        id: checkinId,
        date: checkinDate,
        weight: numericWeight,
        difficulty,
        soreness,
        dietRating,
        notes,
        photos: photoUrls
      })
      // Add photos to gallery
      s.photos = s.photos || []
      photoUrls.forEach((url, i) => {
        s.photos.push({
          id: uid(),
          date: checkinDate,
          weight: numericWeight,
          photoUrl: url,
          label: `Check-in ${checkinDate}`,
          notes
        })
      })
    })

    // 2. Call AI Adapt Plan endpoint (with hybrid fail-safe fallback)
    try {
      const answers = S_state.aiAnswers || {
        pname: 'Athlete',
        gender: S_state.body || 'male',
        age: 26,
        weight: numericWeight,
        goal: 'muscle',
        diet: 'non_veg',
        location: 'gym'
      }
      const currentPlan = S_state.aiPlan || {
        kcal: S_state.targetCalories || 2400,
        protein: S_state.targetProtein || 140,
        carbs: 250,
        fat: 70
      }
      const weeklyWeights = S_state.bodyweight.slice(-4).map(b => b.w)
      if (!weeklyWeights.includes(numericWeight)) weeklyWeights.push(numericWeight)

      const recentWorkouts = (S_state.workouts || []).slice(-4).map(w => ({
        name: w.name,
        date: w.d,
        setsCompleted: w.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0),
        setsTotal: w.entries.reduce((n, e) => n + e.sets.length, 0),
        completed: true
      }))

      let adapted = null
      try {
        const res = await api('/api/adapt-plan', {
          method: 'POST',
          body: JSON.stringify({
            answers,
            currentPlan,
            weeklyWeights,
            workoutSummary: recentWorkouts,
            checkin: { difficulty, soreness, dietRating, notes }
          })
        })
        if (res && res.kcal) adapted = res
      } catch (e) {
        // Fallback to deterministic Mifflin-St Jeor adaptation
      }

      // If remote failed or was unavailable, compute smart local adaptation
      if (!adapted) {
        const deltaW = weeklyWeights.length > 1 ? numericWeight - weeklyWeights[weeklyWeights.length - 2] : 0
        let newKcal = currentPlan.kcal
        let changes = []
        let celebration = ''

        if (answers.goal === 'fat_loss') {
          if (deltaW > -0.2) {
            newKcal = Math.max(1400, newKcal - 100)
            changes.push('Reduced daily target by 100 kcal to break weight plateau')
          } else {
            celebration = `Great fat loss pace (${Math.abs(deltaW).toFixed(1)} kg drop this week)!`
            changes.push('Maintained current calorie deficit as progression is optimal')
          }
        } else if (answers.goal === 'muscle') {
          if (deltaW < 0.1) {
            newKcal = newKcal + 120
            changes.push('Increased calories by 120 kcal to accelerate muscle hypertrophy')
          } else {
            celebration = `Solid muscle gain trend (+${deltaW.toFixed(1)} kg)!`
            changes.push('Preserved calorie surplus for steady lean tissue growth')
          }
        }

        if (difficulty === 'easy') {
          changes.push('Weights felt light — increased recommended exercise working weights by 2.5kg')
        } else if (difficulty === 'hard' || soreness === 'sore') {
          changes.push('Added extra recovery guidance to prevent central nervous system fatigue')
        }

        const newProtein = Math.round(numericWeight * 2.0)
        adapted = {
          kcal: newKcal,
          protein: newProtein,
          carbs: Math.round((newKcal * 0.45) / 4),
          fat: Math.round((newKcal * 0.25) / 9),
          coachNote: `Weekly check-in processed. Current weight logged at ${numericWeight} ${S_state.unit}. We adjusted your energy targets to optimize progressive overload and body composition.`,
          changes,
          weeklyInsight: 'Keep tracking your daily meals and focus on quality protein intake post-workout! 🔥',
          celebration,
          meals: currentPlan.meals || []
        }
      }

      // 3. Apply adapted plan
      update(s => {
        s.targetCalories = adapted.kcal
        s.targetProtein = adapted.protein
        s.aiPlan = { ...(s.aiPlan || {}), ...adapted }
        s.aiCoachCard = {
          coachNote: adapted.coachNote,
          changes: adapted.changes || [],
          weeklyInsight: adapted.weeklyInsight,
          celebration: adapted.celebration || '',
          seenAt: null
        }
      })

      toast('🎉 Check-in & Photos Saved! AI Plan Adapted.')
      close()
    } catch (err) {
      toast('Check-in saved locally.')
      close()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxHeight: '85vh', overflowY: 'auto', padding: '16px 20px 24px', width: '100%', maxWidth: '480px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--label)' }}>
            📸 Weekly Progress Check-in
          </h3>
          <div className="small muted" style={{ fontSize: 11 }}>
            Update your bodyweight, upload physique photos &amp; let Coach AI adapt your plan.
          </div>
        </div>
        <button className="iconbtn" onClick={close} aria-label="Close"><Icon name="close" /></button>
      </div>

      {/* Step 1: Current Body Weight */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
          1. Current Weigh-in ({S_state.unit})
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="iconbtn"
            style={{ background: 'var(--surface-3)', width: 36, height: 36 }}
            onClick={() => setWeightStr(s => String(Math.max(20, (parseFloat(s) || 70) - 0.2).toFixed(1)))}
          >
            <Icon name="minus" />
          </button>
          <input
            type="number"
            step="0.1"
            value={weightStr}
            onChange={e => setWeightStr(e.target.value)}
            style={{
              flex: 1, background: 'var(--surface-3)', border: '1px solid var(--sep)',
              borderRadius: 8, padding: '8px 12px', fontSize: 18, fontWeight: 800,
              color: 'var(--label)', textAlign: 'center'
            }}
          />
          <button
            type="button"
            className="iconbtn"
            style={{ background: 'var(--surface-3)', width: 36, height: 36 }}
            onClick={() => setWeightStr(s => String(Math.min(300, (parseFloat(s) || 70) + 0.2).toFixed(1)))}
          >
            <Icon name="plus" />
          </button>
        </div>
      </div>

      {/* Step 2: Physique Progress Photos */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)' }}>
            2. Physique Photos (Optional)
          </label>
          <span style={{ fontSize: 10, color: 'var(--label-3)' }}>{photos.length}/4 uploaded</span>
        </div>

        {/* Photo Gallery Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {photos.map((p, idx) => (
            <div key={p.id || idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 80, background: '#000', border: '1px solid var(--sep)' }}>
              <img src={p.url} alt="Progress" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                style={{
                  position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)',
                  border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff',
                  fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {photos.length < 4 && (
            <label
              style={{
                height: 80, border: '2px dashed var(--sep)', borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--label-2)'
              }}
            >
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <span style={{ fontSize: 18 }}>📸</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{compressing ? 'Optimizing…' : '+ Add Photo'}</span>
            </label>
          )}
        </div>
      </div>

      {/* Step 3: Training & Soreness Ratings */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
          3. How Did Your Workouts Feel?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
          {[
            { id: 'easy', label: '😅 Too Easy', desc: 'Ready for more' },
            { id: 'good', label: '💪 Just Right', desc: 'Great pump' },
            { id: 'hard', label: '😤 Brutal', desc: 'High fatigue' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDifficulty(opt.id)}
              style={{
                background: difficulty === opt.id ? 'var(--acc)' : 'var(--surface-3)',
                color: difficulty === opt.id ? 'var(--on-acc)' : 'var(--label)',
                border: '1px solid ' + (difficulty === opt.id ? 'var(--acc)' : 'var(--sep)'),
                borderRadius: 8, padding: '8px 4px', textAlign: 'center', cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 11 }}>{opt.label}</div>
              <div style={{ fontSize: 9, opacity: 0.8 }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-2)', display: 'block', marginBottom: 6 }}>
          Muscle Recovery &amp; Soreness:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { id: 'fresh', label: '😌 Fresh', desc: 'No aches' },
            { id: 'mild', label: '😐 Normal', desc: 'Mild soreness' },
            { id: 'sore', label: '😣 Very Sore', desc: 'Need recovery' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSoreness(opt.id)}
              style={{
                background: soreness === opt.id ? 'var(--orange)' : 'var(--surface-3)',
                color: soreness === opt.id ? '#000' : 'var(--label)',
                border: '1px solid ' + (soreness === opt.id ? 'var(--orange)' : 'var(--sep)'),
                borderRadius: 8, padding: '8px 4px', textAlign: 'center', cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 11 }}>{opt.label}</div>
              <div style={{ fontSize: 9, opacity: 0.8 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 4: Diet Adherence */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--acc)', display: 'block', marginBottom: 6 }}>
          4. Diet &amp; Nutrition Adherence
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { id: 'on_track', label: '🥗 100% On Track' },
            { id: 'minor_slip', label: '🥪 80% Good' },
            { id: 'cravings', label: '🍕 High Cravings' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDietRating(opt.id)}
              style={{
                background: dietRating === opt.id ? 'var(--acc)' : 'var(--surface-3)',
                color: dietRating === opt.id ? 'var(--on-acc)' : 'var(--label)',
                border: '1px solid ' + (dietRating === opt.id ? 'var(--acc)' : 'var(--sep)'),
                borderRadius: 8, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 700
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Optional Feedback Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--label-3)', display: 'block', marginBottom: 4 }}>
          Notes for Coach AI (Optional):
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Felt great on bench press, slight knee stiffness on squats, energy was high."
          style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)',
            borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--label)', boxSizing: 'border-box'
          }}
        />
      </div>

      <Button variant="primary" onClick={handleSubmit} disabled={loading || compressing} icon="sparkles" style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 700 }}>
        {loading ? '⚡ Analyzing with Coach AI…' : '⚡ Submit Check-in & Adapt My AI Plan'}
      </Button>
    </div>
  )
}

export function weeklyCheckinSheet() {
  ui().openSheet(close => <WeeklyCheckinModal close={close} />, { kind: 'center' })
}
