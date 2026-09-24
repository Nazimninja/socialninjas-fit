import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Check, Dumbbell, TrendingUp, BookOpen, RotateCcw, Sparkles } from 'lucide-react';

export default function InteractiveWorkoutPreview() {
  const nav = useNavigate();
  const [set3Done, setSet3Done] = useState(false);
  const [restActive, setRestActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const timerRef = useRef(null);

  // Play subtle web audio chime upon set completion
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  };

  const handleLogSet3 = () => {
    playChime();
    setSet3Done(true);
    setRestActive(true);
    setSecondsLeft(90);
  };

  const handleReset = () => {
    setSet3Done(false);
    setRestActive(false);
    setSecondsLeft(90);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (restActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restActive]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timerPercent = (secondsLeft / 90) * 100;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -20%)',
        width: '320px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(31,75,153,0.12) 50%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Smartphone Chassis Frame */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '390px',
        background: '#0c0c0e',
        border: '9px solid #1a1a1f',
        borderRadius: '48px',
        boxShadow: '0 25px 65px -12px rgba(0,0,0,0.85), 0 0 40px rgba(56,189,248,0.18)',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>

        {/* Dynamic Island / Notch */}
        <div style={{ background: '#0c0c0e', paddingTop: '10px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '105px',
            height: '24px',
            background: '#000',
            borderRadius: '99px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '10px',
            boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1)'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#121215', border: '1px solid rgba(255,255,255,0.12)' }} />
          </div>
        </div>

        {/* Phone Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 22px 8px', fontSize: '11.5px', fontWeight: '800', color: '#fff', letterSpacing: '0.2px' }}>
          <span>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="11" viewBox="0 0 16 12" fill="currentColor"><path d="M0 8.5h3v3H0v-3zm4.5-3h3v6h-3v-6zm4.5-3h3v9h-3v-9zm4.5-2.5h3v11.5h-3v-11.5z"/></svg>
            <svg width="13" height="11" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.5C4.8 2.5 2 3.8.3 5.8l7.7 9.5 7.7-9.5C14 3.8 11.2 2.5 8 2.5z"/></svg>
            <svg width="18" height="10" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="18" height="10" rx="3"/><path d="M22 4v4" strokeLinecap="round"/><rect x="3" y="3" width="10" height="6" fill="currentColor" rx="1.5"/></svg>
          </div>
        </div>

        {/* App Screen Content */}
        <div style={{ padding: '10px 14px 20px', background: '#000000', color: '#fff' }}>
          
          {/* Top Workout Bar */}
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(56,189,248,0.35)',
            borderRadius: '16px',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', lineHeight: '1.2' }}>Push Day A · Chest &amp; Triceps</div>
              <div style={{ fontSize: '10.5px', color: '#9BA8B4', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Timer size={11} /> 14:35
                </span>
                <span>•</span>
                <span style={{ color: '#e2e8f0', fontWeight: '700' }}>
                  {set3Done ? '3 / 3 sets done' : '2 / 3 sets done'}
                </span>
              </div>
            </div>
            <button style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              fontSize: '11px',
              fontWeight: '800',
              padding: '5px 12px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
              cursor: 'default'
            }}>
              Finish ✓
            </button>
          </div>

          {/* Exercise Card */}
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '18px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(56,189,248,0.15)',
                  border: '1px solid rgba(56,189,248,0.4)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  1
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Barbell Bench Press</div>
                  <div style={{ fontSize: '10px', color: '#9BA8B4' }}>Chest &amp; Front Delts · Barbell</div>
                </div>
              </div>
              <span style={{
                fontSize: '9.5px',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.25)',
                padding: '2px 7px',
                borderRadius: '6px',
                fontWeight: '800'
              }}>
                PRIMARY LIFT
              </span>
            </div>

            {/* Real Looping Exercise Video Demo */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '140px',
              background: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <img
                src="https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif"
                alt="Barbell Bench Press"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
              />
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'rgba(18,18,21,0.92)',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.3)',
                fontSize: '8.5px',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '5px'
              }}>
                ▶ 60FPS
              </span>
              <span style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                background: 'rgba(18,18,21,0.92)',
                color: '#94a3b8',
                fontSize: '8.5px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '5px'
              }}>
                BARBELL GRIP: 1.5× SHOULDER
              </span>
            </div>

            {/* Set Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 1fr 1fr',
              gap: '6px',
              fontSize: '9.5px',
              fontWeight: '800',
              color: '#64748b',
              padding: '0 6px 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span>SET</span>
              <span style={{ textAlign: 'center' }}>KG</span>
              <span style={{ textAlign: 'center' }}>REPS</span>
              <span style={{ textAlign: 'right' }}>ACTION</span>
            </div>

            {/* Set 1 (Done) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 1fr 1fr',
              gap: '6px',
              alignItems: 'center',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: '10px',
              padding: '6px 8px',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>1</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>82.5</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>5</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: '#22c55e',
                  color: '#031024',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  ✓ Done
                </span>
              </div>
            </div>

            {/* Set 2 (Done) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 1fr 1fr',
              gap: '6px',
              alignItems: 'center',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: '10px',
              padding: '6px 8px',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>2</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>82.5</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>5</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: '#22c55e',
                  color: '#031024',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  ✓ Done
                </span>
              </div>
            </div>

            {/* Set 3 (Interactive Target Set) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 1fr 1fr',
              gap: '6px',
              alignItems: 'center',
              background: set3Done ? 'rgba(34,197,94,0.12)' : 'rgba(56,189,248,0.12)',
              border: set3Done ? '1.5px solid #22c55e' : '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '6px 8px',
              boxShadow: set3Done ? '0 0 16px rgba(34,197,94,0.25)' : '0 0 16px rgba(56,189,248,0.25)',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: set3Done ? '#22c55e' : '#38bdf8' }}>3</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>82.5</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>8+</span>
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={set3Done ? handleReset : handleLogSet3}
                  style={{
                    background: set3Done ? '#22c55e' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    color: '#031024',
                    border: 'none',
                    fontSize: '10.5px',
                    fontWeight: '900',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(56,189,248,0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {set3Done ? '✓ Done' : 'Log Set 3'}
                </button>
              </div>
            </div>

          </div>

          {/* Dynamic Rest Timer & Progression Notification Banner */}
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(56,189,248,0.35)',
            borderRadius: '14px',
            padding: '10px 12px',
            marginBottom: '12px',
            transition: 'all 0.3s ease'
          }}>
            {!set3Done ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                <div style={{ fontSize: '11px', color: '#9BA8B4' }}>
                  <strong style={{ color: '#fff' }}>Try it now:</strong> Tap <strong style={{ color: '#38bdf8' }}>[ Log Set 3 ]</strong> above to test the real player.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Timer size={14} color="#38bdf8" />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>REST COUNTDOWN</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>{timeFormatted}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${timerPercent}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #0284c7)', transition: 'width 1s linear' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '800' }}>
                    ✓ Target Reached: +2.5 kg Next Week
                  </span>
                  <button
                    onClick={handleReset}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '9.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floating Dock Navigation (Authentic App Dock) */}
          <div style={{
            background: 'rgba(18, 18, 21, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '24px',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '9px', fontWeight: '700' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              <span>Home</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '9px', fontWeight: '700' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2v20M6 2v20M6 8h12"/></svg>
              <span>Meals</span>
            </div>
            {/* Center Workout Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#38bdf8 0%,#0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                boxShadow: '0 4px 14px rgba(56,189,248,0.45)'
              }}>
                <Dumbbell size={18} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>Workout</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '9px', fontWeight: '700' }}>
              <TrendingUp size={15} />
              <span>Progress</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '9px', fontWeight: '700' }}>
              <BookOpen size={15} />
              <span>Library</span>
            </div>
          </div>

        </div>

        {/* Home Bar */}
        <div style={{ background: '#0c0c0e', paddingBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.25)', borderRadius: '99px' }} />
        </div>

      </div>

      {/* Action CTA Under Phone */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={() => nav('/app?mode=signup')}
          className="btn-glow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '900',
            padding: '14px 32px',
            borderRadius: '99px',
            background: 'linear-gradient(135deg,#38bdf8 0%,#0284c7 100%)',
            color: '#031024',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(56,189,248,0.35)'
          }}
        >
          <span>Launch Real Workout In App →</span>
        </button>
        <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '10px' }}>
          Distraction-free gym training · Instant load on iPhone &amp; Android
        </p>
      </div>

    </div>
  );
}
