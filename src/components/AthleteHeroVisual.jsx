import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Timer, CheckCircle2, ChevronRight, Target } from 'lucide-react';

export default function AthleteHeroVisual() {
  const nav = useNavigate();

  return (
    <div className="hero-visual-col" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="athlete-hero-container" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}>

        {/* Ambient Glow behind athlete card */}
        <div className="athlete-glow" style={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0.12) 50%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Center Athlete Card with Integrated Glass Badges */}
        <div className="athlete-portal" style={{
          position: 'relative',
          width: '100%',
          maxWidth: '390px',
          aspectRatio: '1 / 1',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.14)',
          zIndex: 1,
          background: '#090b10'
        }}>
          <img
            src="/assets/athlete-hero.jpg"
            alt="Athlete Calisthenics & Strength"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 50%',
              filter: 'contrast(1.08) brightness(0.96)',
              display: 'block'
            }}
          />

          {/* Vignette Gradients */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(8, 10, 16, 0.45) 0%, transparent 25%, transparent 65%, rgba(8, 10, 16, 0.88) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Top Left: Catalogue Badge */}
          <div
            className="hero-card-badge-top"
            onClick={() => nav('/library')}
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              zIndex: 10,
              background: 'rgba(14, 16, 22, 0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer'
            }}
          >
            <Dumbbell size={13} color="#38bdf8" />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff' }}>5,300+ Guides</span>
          </div>

          {/* Top Right: Live Status Pill */}
          <div
            className="hero-card-pill-top"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              zIndex: 10,
              background: 'rgba(14, 16, 22, 0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '99px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399'
            }} />
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#fff', letterSpacing: '0.3px' }}>
              Rest Timer Active
            </span>
          </div>

          {/* Bottom: Feature Glass Panel (Desktop) */}
          <div
            className="hero-card-bottom-panel desktop-only-node"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(13, 15, 21, 0.92)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderTop: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '16px',
              padding: '12px 14px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Core Features Included
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: '800',
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.12)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                100% Ad-Free
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 10px',
              fontSize: '11px',
              color: '#e2e8f0',
              fontWeight: '600',
              margin: '6px 0 10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Timer size={12} color="#34d399" />
                <span>Rest Countdown</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <CheckCircle2 size={12} color="#34d399" />
                <span>Auto "Lift Heavier"</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Target size={12} color="#34d399" />
                <span>Custom Workout Split</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Activity size={12} color="#34d399" />
                <span>Muscle Recovery Map</span>
              </div>
            </div>

            <button
              onClick={() => nav('/app?mode=signup')}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                color: '#000000',
                fontWeight: '900',
                fontSize: '11px',
                padding: '7px 12px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>Claim Launch Pass — ₹99</span>
              <ChevronRight size={13} color="#000000" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Exclusive Clean Badges & Highlights Row (Below Athlete) */}
      <div className="mobile-athlete-highlights">
        <div className="mobile-highlight-chip" onClick={() => nav('/library')}>
          <div className="chip-icon">
            <Dumbbell size={14} color="#38bdf8" />
          </div>
          <div className="chip-content">
            <span className="chip-val">5,300+</span>
            <span className="chip-lbl">Exercises</span>
          </div>
        </div>

        <div className="mobile-highlight-chip" onClick={() => nav('/stats')}>
          <div className="chip-icon">
            <Activity size={14} color="#38bdf8" />
          </div>
          <div className="chip-content">
            <span className="chip-val">Heatmaps</span>
            <span className="chip-lbl">Muscle Map</span>
          </div>
        </div>

        <div className="mobile-highlight-chip" onClick={() => nav('/app?mode=signup')}>
          <div className="chip-icon">
            <Timer size={14} color="#38bdf8" />
          </div>
          <div className="chip-content">
            <span className="chip-val">₹13/day</span>
            <span className="chip-lbl">Pro Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
