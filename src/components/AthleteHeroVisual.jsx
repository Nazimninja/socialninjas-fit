import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Timer } from 'lucide-react';

export default function AthleteHeroVisual() {
  const nav = useNavigate();

  return (
    <div className="hero-visual-col" style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div className="athlete-hero-container" style={{
        position: 'relative',
        width: '360px',
        height: '360px',
        margin: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}>

        {/* Ambient Glow behind athlete card */}
        <div className="athlete-glow" style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Center Athlete Card with Minimalist Badges */}
        <div className="athlete-portal" style={{
          position: 'relative',
          width: '360px',
          height: '360px',
          borderRadius: '22px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.12)',
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

          {/* Subtle Vignette Gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(8, 10, 16, 0.40) 0%, transparent 25%, transparent 70%, rgba(8, 10, 16, 0.85) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Top Left: Catalogue Badge */}
          <div
            className="hero-card-badge-top"
            onClick={() => nav('/library')}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              background: 'rgba(12, 14, 20, 0.85)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '5px 10px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Dumbbell size={12} color="#38bdf8" />
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#fff' }}>5,300+ Guides</span>
          </div>

          {/* Top Right: Live Status Pill */}
          <div
            className="hero-card-pill-top"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(12, 14, 20, 0.85)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '99px',
              padding: '5px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6)'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8'
            }} />
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#fff', letterSpacing: '0.3px' }}>
              Rest Timer
            </span>
          </div>

          {/* Bottom: Clean Status Bar (Desktop) */}
          <div
            className="hero-card-badge-bottom desktop-only-node"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(12, 14, 20, 0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '8px 12px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Auto Progression
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
            <span style={{ color: '#ffffff', fontSize: '10.5px', fontWeight: '700' }}>
              Smart "Lift Heavier" Cues
            </span>
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
            <span className="chip-lbl">Guides</span>
          </div>
        </div>

        <div className="mobile-highlight-chip" onClick={() => nav('/stats')}>
          <div className="chip-icon">
            <Activity size={14} color="#38bdf8" />
          </div>
          <div className="chip-content">
            <span className="chip-val">Heatmaps</span>
            <span className="chip-lbl">Recovery</span>
          </div>
        </div>

        <div className="mobile-highlight-chip" onClick={() => nav('/app?mode=signup')}>
          <div className="chip-icon">
            <Timer size={14} color="#38bdf8" />
          </div>
          <div className="chip-content">
            <span className="chip-val">₹99/mo</span>
            <span className="chip-lbl">Launch Pass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
