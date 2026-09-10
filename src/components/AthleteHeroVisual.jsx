import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Timer, Zap, Sparkles, CheckCircle2, ChevronRight, Target } from 'lucide-react';

export default function AthleteHeroVisual() {
  const nav = useNavigate();
  const [activeNode, setActiveNode] = useState(null);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '540px',
      margin: '0 auto',
      minHeight: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none'
    }}>

      {/* Atmospheric Ambient Glow behind hero */}
      <div style={{
        position: 'absolute',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(56, 189, 248, 0.18) 45%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* SVG Connecting Spline Curves */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'visible'
        }}
        viewBox="0 0 540 480"
      >
        <defs>
          <linearGradient id="splineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
          </linearGradient>
          <filter id="splineGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Spline from Top Left Badge to Center */}
        <path
          d="M 120 120 C 180 140, 210 210, 270 230"
          fill="none"
          stroke="url(#splineGrad)"
          strokeWidth="2"
          strokeDasharray="4 4"
          filter="url(#splineGlow)"
          opacity="0.85"
        />

        {/* Spline from Center to Right Feature Card */}
        <path
          d="M 270 230 C 330 250, 360 210, 420 230"
          fill="none"
          stroke="url(#splineGrad)"
          strokeWidth="2.5"
          filter="url(#splineGlow)"
          opacity="0.95"
        />

        {/* Spline from Bottom Left Badge to Center */}
        <path
          d="M 150 360 C 200 340, 230 270, 270 230"
          fill="none"
          stroke="url(#splineGrad)"
          strokeWidth="2"
          strokeDasharray="3 3"
          filter="url(#splineGlow)"
          opacity="0.75"
        />

        {/* Animated Anchor Points */}
        <circle cx="270" cy="230" r="5" fill="#10b981" filter="url(#splineGlow)">
          <animate attributeName="r" values="4;7;4" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="120" cy="120" r="4" fill="#38bdf8" />
        <circle cx="420" cy="230" r="4" fill="#10b981" />
        <circle cx="150" cy="360" r="4" fill="#38bdf8" />
      </svg>

      {/* Central Athlete Portal Container */}
      <div style={{
        position: 'relative',
        width: '320px',
        height: '340px',
        borderRadius: '50% 50% 45% 45%',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.15)',
        zIndex: 1,
        background: '#0a0f1d'
      }}>
        <img
          src="/assets/athlete-hero.jpg"
          alt="Athlete Calisthenics & Strength"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            filter: 'contrast(1.08) brightness(0.95)'
          }}
        />

        {/* Soft Vignette Overlay to blend image smoothly */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7, 10, 18, 0.85) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Bottom Fade Gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to top, rgba(5, 8, 15, 0.95), transparent)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* ── FLOATING BADGE 1: METRIC GAUGE (Top Left) ─────────── */}
      <div
        onMouseEnter={() => setActiveNode('metric')}
        onMouseLeave={() => setActiveNode(null)}
        onClick={() => nav('/library')}
        style={{
          position: 'absolute',
          top: '25px',
          left: '0px',
          zIndex: 10,
          background: 'rgba(13, 20, 36, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '18px',
          padding: '14px 16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.12)',
          cursor: 'pointer',
          animation: 'floatSlow 4s ease-in-out infinite',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s',
          transform: activeNode === 'metric' ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
          maxWidth: '150px'
        }}
      >
        {/* Animated Gauge Arc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
          }}>
            <Dumbbell size={14} color="#031024" />
          </div>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#38bdf8', textTransform: 'uppercase' }}>
            Catalogue
          </span>
        </div>

        <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', lineHeight: 1.1 }}>
          1,324+
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
          Animated Demos
        </div>
      </div>

      {/* ── FLOATING PILL TAG: ACTIVE MODE (Center Top) ──────── */}
      <div style={{
        position: 'absolute',
        top: '65px',
        right: '40px',
        zIndex: 10,
        background: 'rgba(7, 10, 18, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '99px',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        animation: 'floatMedium 5s ease-in-out infinite',
        animationDelay: '1s'
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 8px #10b981'
        }} />
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff' }}>
          Live Workout Player
        </span>
      </div>

      {/* ── FLOATING BADGE 2: GOAL CARD (Bottom Left) ────────── */}
      <div
        onMouseEnter={() => setActiveNode('goal')}
        onMouseLeave={() => setActiveNode(null)}
        onClick={() => nav('/stats')}
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '10px',
          zIndex: 10,
          background: 'rgba(13, 20, 36, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          padding: '12px 16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          animation: 'floatSlow 4.5s ease-in-out infinite',
          animationDelay: '2s',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: activeNode === 'goal' ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8'
        }}>
          <Activity size={18} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
            Muscle Heatmap
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600' }}>
            Front &amp; Back Fatigue
          </div>
        </div>
      </div>

      {/* ── FLOATING CARD 3: FEATURE POPOVER (Right Side) ─────── */}
      <div
        onMouseEnter={() => setActiveNode('feature')}
        onMouseLeave={() => setActiveNode(null)}
        style={{
          position: 'absolute',
          top: '160px',
          right: '-10px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderTop: '1px solid rgba(56, 189, 248, 0.7)',
          borderRadius: '20px',
          padding: '16px 18px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
          animation: 'floatMedium 4.8s ease-in-out infinite',
          animationDelay: '0.5s',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: activeNode === 'feature' ? 'scale(1.04) translateY(-3px)' : 'scale(1)',
          minWidth: '175px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          PRO OS INCLUDED
        </div>

        <div style={{ display: 'grid', gap: '6px', marginBottom: '12px', fontSize: '11px', color: '#e2e8f0', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Timer size={12} color="#38bdf8" />
            <span>Auto Rest Timer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={12} color="#10b981" />
            <span>Greyskull LP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={12} color="#38bdf8" />
            <span>Custom Macros</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={12} color="#10b981" />
            <span>100% Offline PWA</span>
          </div>
        </div>

        <button
          onClick={() => nav('/app?mode=signup')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontWeight: '900',
            fontSize: '11.5px',
            padding: '8px 12px',
            borderRadius: '99px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>Join Now</span>
          <ChevronRight size={13} />
        </button>
      </div>

    </div>
  );
}
