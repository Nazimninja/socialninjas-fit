import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Check, Dumbbell, Flame, Activity, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import BodyMap from './BodyMap.jsx';

const EXERCISES = [
  {
    id: 'bench',
    name: 'Barbell Bench Press',
    category: 'Chest & Triceps Hypertrophy',
    muscleLoad: { chest: 18, triceps: 12, delts: 8 },
    weight: '82.5 kg',
    reps: '5, 5, 8 (AMRAP)',
    sets: [
      { set: 1, reps: 5, weight: '82.5 kg', done: true },
      { set: 2, reps: 5, weight: '82.5 kg', done: true },
      { set: 3, reps: '8+ (AMRAP)', weight: '82.5 kg', done: false }
    ],
    progression: '+2.5 kg next session (Greyskull LP)'
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    category: 'Quad & Posterior Chain Power',
    muscleLoad: { quads: 20, glutes: 15, hamstrings: 12, calves: 6 },
    weight: '115 kg',
    reps: '5, 5, 6 (AMRAP)',
    sets: [
      { set: 1, reps: 5, weight: '115 kg', done: true },
      { set: 2, reps: 5, weight: '115 kg', done: false },
      { set: 3, reps: '5+ (AMRAP)', weight: '115 kg', done: false }
    ],
    progression: '+5 kg next session (Double Progression)'
  },
  {
    id: 'pullup',
    name: 'Weighted Pull-Up',
    category: 'Lat Width & Biceps Growth',
    muscleLoad: { lats: 18, biceps: 14, upperBack: 10, abs: 6 },
    weight: '+15 kg',
    reps: '6, 6, 8 (AMRAP)',
    sets: [
      { set: 1, reps: 6, weight: '+15 kg', done: true },
      { set: 2, reps: 6, weight: '+15 kg', done: true },
      { set: 3, reps: '8+ (AMRAP)', weight: '+15 kg', done: true }
    ],
    progression: '+1.25 kg next session (Target Reached)'
  }
];

export default function InteractiveWorkoutPreview() {
  const nav = useNavigate();
  const [selectedEx, setSelectedEx] = useState(EXERCISES[0]);
  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'heatmap' | 'macros'
  const [setsState, setSetsState] = useState(EXERCISES[0].sets);

  // Rest timer state (15s quick interactive demo)
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerDuration = 15;
  const timerRef = useRef(null);

  // Macro target demo state
  const [dietGoal, setDietGoal] = useState('hypertrophy'); // 'hypertrophy' | 'fatloss' | 'strength'

  // Update sets when exercise changes
  const handleSelectExercise = (ex) => {
    setSelectedEx(ex);
    setSetsState(ex.sets);
  };

  const toggleSet = (idx) => {
    setSetsState(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], done: !next[idx].done };
      return next;
    });
  };

  // Play audio beep when timer completes
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  // Timer loop
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const resetTimer = (sec = 15) => {
    setTimerRunning(false);
    setTimeLeft(sec);
  };

  const timerProgress = ((timerDuration - timeLeft) / timerDuration) * 100;

  return (
    <div style={{
      background: 'rgba(10, 15, 26, 0.95)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '24px',
      padding: '28px 24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.06)',
      maxWidth: '880px',
      margin: '0 auto',
      position: 'relative'
    }}>

      {/* Top Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            LIVE INTERACTIVE SANDBOX
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'player', label: '⚡ Guided Player' },
            { id: 'heatmap', label: '🧬 Muscle Heatmap' },
            { id: 'macros', label: '🥗 Macro Engine' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                border: activeTab === tab.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: WORKOUT PLAYER SANDBOX ─────────────────────── */}
      {activeTab === 'player' && (
        <div>
          {/* Exercise Selector Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
            {EXERCISES.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleSelectExercise(ex)}
                style={{
                  background: selectedEx.id === ex.id ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.15))' : 'rgba(255, 255, 255, 0.03)',
                  border: selectedEx.id === ex.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: selectedEx.id === ex.id ? '#fff' : '#94a3b8',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {ex.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
            
            {/* Left: Sets & Weight Log */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>{selectedEx.name}</h4>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>{selectedEx.category}</span>
                </div>
                <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                  Greyskull LP
                </span>
              </div>

              {/* Set Rows */}
              <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                {setsState.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSet(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: s.done ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: s.done ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: s.done ? '#10b981' : '#94a3b8' }}>
                        Set {s.set}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                        {s.weight} × {s.reps}
                      </span>
                    </div>

                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: s.done ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: s.done ? '#031024' : '#64748b'
                    }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Progression Note */}
              <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} />
                <span>Auto Next: {selectedEx.progression}</span>
              </div>
            </div>

            {/* Right: Rest Timer Demonstration */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                SMART REST TIMER
              </div>

              {/* Circular Countdown Ring */}
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '8px auto' }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - (timerDuration - timeLeft) / timerDuration)}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>
                    {timeLeft}s
                  </span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700', marginTop: '2px' }}>
                    {timeLeft === 0 ? 'READY!' : 'RESTING'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  style={{
                    background: timerRunning ? '#f43f5e' : '#38bdf8',
                    color: '#031024',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                  <span>{timerRunning ? 'Pause' : 'Start Timer'}</span>
                </button>

                <button
                  onClick={() => resetTimer(15)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Reset to 15s"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '8px' }}>
                🔊 Plays audio chime on completion &amp; prevents screen sleep
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 2: MUSCLE HEATMAP ────────────────────────────── */}
      {activeTab === 'heatmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '16px' }}>
            Real-time visual tracking of muscle fatigue and weekly training volume across front &amp; back body views.
          </div>

          <div style={{ width: '100%', maxWidth: '320px', minHeight: '260px' }}>
            <BodyMap load={selectedEx.muscleLoad} body="male" />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
            {Object.entries(selectedEx.muscleLoad).map(([muscle, vol]) => (
              <span
                key={muscle}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  textTransform: 'capitalize'
                }}
              >
                {muscle}: {vol} Sets
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: PRECISION MACROS ──────────────────────────── */}
      {activeTab === 'macros' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {[
              { id: 'hypertrophy', label: 'Hypertrophy (+10% Surplus)', cal: 2650, p: 165, c: 310, f: 68 },
              { id: 'fatloss', label: 'Fat Shred (-20% Deficit)', cal: 1950, p: 180, c: 160, f: 48 },
              { id: 'strength', label: 'Strength Maintenance', cal: 2400, p: 160, c: 260, f: 65 }
            ].map(plan => (
              <button
                key={plan.id}
                onClick={() => setDietGoal(plan.id)}
                style={{
                  background: dietGoal === plan.id ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(16, 185, 129, 0.2))' : 'rgba(255, 255, 255, 0.04)',
                  border: dietGoal === plan.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: dietGoal === plan.id ? '#fff' : '#94a3b8',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {plan.label}
              </button>
            ))}
          </div>

          {/* Macro Breakdown Cards */}
          {(() => {
            const currentPlan = {
              hypertrophy: { cal: '2,650 kcal', p: '165g', c: '310g', f: '68g', desc: 'Optimized protein synthesis with high carbohydrate availability for glycogen replenishment.' },
              fatloss: { cal: '1,950 kcal', p: '180g', c: '160g', f: '48g', desc: 'High-protein thermogenic target preserving lean muscle tissue while accelerating fat oxidation.' },
              strength: { cal: '2,400 kcal', p: '160g', c: '260g', f: '65g', desc: 'Stable energy balance supporting central nervous system recovery and linear progression.' }
            }[dietGoal];

            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
                  {currentPlan.cal}
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '460px', margin: '0 auto 20px' }}>
                  {currentPlan.desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '14px 10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#38bdf8' }}>{currentPlan.p}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Protein (g)</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '14px 10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>{currentPlan.c}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Carbs (g)</div>
                  </div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '14px', padding: '14px 10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#f43f5e' }}>{currentPlan.f}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Fats (g)</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Quick Launch CTA Banner */}
      <div style={{
        marginTop: '22px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Ready to log your real workouts with automated progression?
        </div>
        <button
          onClick={() => nav('/app?mode=signup')}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#031024',
            fontWeight: '900',
            fontSize: '12.5px',
            padding: '8px 18px',
            borderRadius: '99px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
          }}
        >
          <span>Unlock Full App (₹399/mo)</span>
          <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
