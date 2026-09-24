import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Flame, Target, Sparkles, ShieldCheck, ChevronRight, Check, ArrowRight, Star, Play, Zap, HelpCircle, Timer, Video, UtensilsCrossed, Cloud, TrendingUp, X } from 'lucide-react';
import AthleteHeroVisual from '../components/AthleteHeroVisual.jsx';
import InteractiveWorkoutPreview from '../components/InteractiveWorkoutPreview.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeExerciseDot, setActiveExerciseDot] = useState(0);
  const [activeValueDot, setActiveValueDot] = useState(0);
  const [activeCompareDot, setActiveCompareDot] = useState(0);
  const valuesTrackRef = useRef(null);
  const exTrackRef = useRef(null);
  const compareTrackRef = useRef(null);

  const handleTrackScroll = (setter) => (e) => {
    const track = e.currentTarget;
    const card = track.firstElementChild;
    if (!card) return;
    const cardWidth = card.offsetWidth + 14;
    const idx = Math.min(2, Math.max(0, Math.round(track.scrollLeft / cardWidth)));
    setter(idx);
  };

  const scrollToCard = (ref, idx) => {
    if (!ref.current) return;
    const card = ref.current.firstElementChild;
    if (!card) return;
    const cardWidth = card.offsetWidth + 14;
    ref.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "What makes Fit Ninja different from typical workout apps?",
      a: "Most fitness apps are either digital notebooks or complicated spreadsheets full of robotic jargon. Fit Ninja gives you 5,300+ looping animated video guides for every gym movement, automatic 'Lift Heavier' progression recommendations, distraction-free full-screen rest timers, muscle recovery maps, and customized meal plans — all designed for fast, focused gym execution."
    },
    {
      q: "How does Fit Ninja keep my workouts focused and distraction-free?",
      a: "Fit Ninja is 100% ad-free with zero popups or video interruptions during your workout. All your sets, weights, reps, and custom routines are logged with 1 tap, supported by our full-screen rest timer with sound alerts so you stay in the zone from start to finish."
    },
    {
      q: "Why is the rest timer full-screen?",
      a: "We designed the full-screen rest timer to keep you focused between heavy sets. It gives you a clean countdown with clear sound alerts, prevents accidental mis-touches when setting your phone down, and stops you from mindlessly scrolling social media between reps."
    },
    {
      q: "How does food and calorie logging work?",
      a: "Food logging in Fit Ninja is fast and practical: search any food, enter your portion, and the app calculates your calories and protein immediately. These numbers give you a realistic daily approximation. If you want pinpoint accuracy for specific foods, using an inexpensive digital kitchen scale is always recommended!"
    },
    {
      q: "Can I upgrade or customize my workout & diet plan later?",
      a: "Yes! Whenever your schedule changes, you hit a plateau, or your goals shift (e.g. from fat loss to muscle gain), you can update your answers and generate a brand-new training split and diet plan in seconds. Your previous workout history remains safely stored."
    },
    {
      q: "How much does Fit Ninja cost?",
      a: "Right now, you can get the Fit Ninja Launch Pass for just ₹99 for your first month (less than ₹4/day). After month 1, your membership renews automatically at the standard rate of ₹399/month. You get complete, unrestricted access to all 5,300+ animated video exercises, guided workout player, full-screen rest timers, automatic weight suggestions, custom meal plans, and cloud backup. You can cancel anytime with 1 tap."
    },
    {
      q: "Why is there no free plan or ad-supported version?",
      a: "Free fitness apps survive by interrupting your rest timers with noisy 30-second video ads, collecting and selling your health data, or abruptly locking 90% of exercises behind paywalls when you reach the gym. Fit Ninja was built by athletes for athletes: 100% ad-free, 100% private, zero spam, and pro-grade from Day 1."
    },
    {
      q: "Can I cancel anytime? Are there hidden fees or commitments?",
      a: "Yes, you can cancel anytime with a single tap inside your Profile settings — no phone calls, no emails, no friction. There are zero hidden fees, and you retain full access until the end of your billing period."
    }
  ];

  const values = [
    {
      icon: <Video size={22} color="#38bdf8" />,
      title: "5,300+ HD Looping Form Guides",
      desc: "Never feel lost or intimidated by gym machines or complex lifts. Watch crystal-clear 60fps video demonstrations for every barbell, dumbbell, cable, machine, and bodyweight exercise from optimal angles.",
      badge: "Zero Form Guesswork"
    },
    {
      icon: <Target size={22} color="#38bdf8" />,
      title: "Personalized Workout & Diet Plan",
      desc: "Get a 7-day workout split matched to your schedule, plus a tailored meal plan with exact calorie and protein targets (Veg, Non-Veg, Vegan, or Keto). Easily refresh your plan whenever your routine changes.",
      badge: "Tailored to Your Body"
    },
    {
      icon: <TrendingUp size={22} color="#38bdf8" />,
      title: "Automatic 'Lift Heavier' Progression",
      desc: "Building muscle requires lifting slightly heavier over time. Fit Ninja automatically remembers your previous weights and sets, telling you exactly when to add +1 kg to +2.5 kg so you never plateau.",
      badge: "Steady Muscle Growth"
    },
    {
      icon: <Timer size={22} color="#38bdf8" />,
      title: "Distraction-Free Full-Screen Rest Timer",
      desc: "A clean, full-screen countdown between sets with audible chimes and vibration alerts. Built specifically to eliminate accidental mis-touches and stop you from doom-scrolling social media while resting.",
      badge: "Gym Focus & Screen Wake Lock"
    },
    {
      icon: <UtensilsCrossed size={22} color="#38bdf8" />,
      title: "Practical Food Logging & Calorie Guidance",
      desc: "Log what you eat in seconds. We give you realistic, approximate calorie and protein numbers for quick daily tracking, plus honest guidance on when to use a kitchen food scale for pinpoint accuracy.",
      badge: "No Complicated Menus"
    },
    {
      icon: <ShieldCheck size={22} color="#38bdf8" />,
      title: "100% Ad-Free & Cloud Backup",
      desc: "Zero annoying 30-second video ads or popups in the middle of your gym session. Fit Ninja gives you a lightning-fast, distraction-free experience and automatically backs up your workout history and custom routines to the cloud.",
      badge: "Zero Distractions"
    }
  ];


  return (
    <div style={{
      background: '#000000',
      backgroundImage: 'radial-gradient(1000px circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 65%)',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      overflowX: 'hidden'
    }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(12, 12, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px'
      }}>
        <div style={{
          maxWidth: '1140px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => nav('/')}
          >
            <img
              src="/ninja-emblem.png"
              alt="Fit Ninja"
              style={{
                width: '42px',
                height: '42px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(56, 189, 248, 0.55))'
              }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>
                Fit<span style={{ color: '#38bdf8' }}>Ninja</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8', marginTop: '3px' }}>
                BY SOCIAL NINJA'S
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="hidden-sm">
            <a
              href="#values"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Core Values
            </a>
            <button
              onClick={() => nav('/library')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              5,300+ Library
            </button>
            <a
              href="#sandbox"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Interactive Demo
            </a>
            <a
              href="#pricing"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Pricing
            </a>
            <a
              href="#faq"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              FAQ
            </a>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => nav('/app?mode=app')}
              className="landing-glow-button"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                color: '#000000',
                fontWeight: '900',
                fontSize: '13px',
                padding: '9px 20px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Launch App</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <header className="hero-split" style={{
        padding: 'clamp(32px, 4.5vh, 48px) 24px clamp(36px, 5vh, 52px)',
        maxWidth: '1140px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.18fr) 360px',
        gap: '48px',
        alignItems: 'center'
      }}>

        {/* Left Column: Typography & CTAs */}
        <div>
          {/* Eyebrow Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#14151b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50px',
            padding: '5px 14px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
            marginBottom: '12px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8'
            }} />
            <span>FIT NINJA</span>
            <span className="pill-divider" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span className="pill-sub" style={{ color: '#38bdf8', fontWeight: '800' }}>Special Launch Offer: ₹99 First Month</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(32px, 3.1vw, 44px)',
            fontWeight: '900',
            letterSpacing: '-1.2px',
            lineHeight: 1.12,
            margin: '0 0 12px',
            color: '#ffffff'
          }}>
            Train with Confidence.<br />
            <span style={{
              background: 'linear-gradient(135deg, #ffffff 15%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Progress Every Single Session.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(14px, 1.05vw, 15.5px)',
            color: '#94a3b8',
            lineHeight: 1.55,
            maxWidth: '530px',
            margin: '0 0 18px',
            fontWeight: '500'
          }}>
            Never guess what weights to lift or what to eat again. 5,300+ looping animated video exercises, custom workout &amp; diet plans, distraction-free full-screen rest timer, and auto-progression tracking — in a distraction-free, 100% ad-free gym app.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={() => nav('/app?mode=signup')}
              className="landing-glow-button"
              style={{
                background: '#ffffff',
                color: '#000000',
                fontWeight: '900',
                fontSize: '14.5px',
                padding: '12px 24px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Claim Launch Pass — ₹99</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#sandbox"
              style={{
                background: '#14151b',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '99px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={14} color="#38bdf8" />
              <span>Try Interactive Demo</span>
            </a>
          </div>

          {/* Social Proof & Metrics Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            background: '#121319',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '16px',
            padding: '12px 18px',
            maxWidth: '530px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1.1 }}>5,300+</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginTop: '3px', letterSpacing: '0.3px' }}>Video Guides</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1.1 }}>Rest Timer</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginTop: '3px', letterSpacing: '0.3px' }}>Full Focus</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1.1 }}>Zero Ads</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginTop: '3px', letterSpacing: '0.3px' }}>Pure Training</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8', lineHeight: 1.1 }}>₹99</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginTop: '3px', letterSpacing: '0.3px' }}>Launch Pass</div>
            </div>
          </div>
        </div>

        {/* Right Column: Athlete Hero Visual */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
          <AthleteHeroVisual />
        </div>

      </header>

      {/* ── ORGANIC CURVED CONTAINER SECTION ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #0a0a0c 0%, #000000 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '44px 44px 0 0',
        padding: '70px 24px 40px',
        boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.7)'
      }}>

        {/* ── CORE VALUE PILLARS (THE REAL VALUE WE PROVIDE) ──────── */}
        <section id="values" style={{ maxWidth: '1140px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '99px',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: '900',
              color: '#38bdf8',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              THE VALUE WE PROVIDE
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 12px' }}>
              Everything You Need to Progress.<br />Zero Complex Gym Fluff.
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
              No confusing jargon, no passive PDF routines, and no guesswork. Here is exactly what Fit Ninja puts in your pocket every day:
            </p>
          </div>

          <div
            ref={valuesTrackRef}
            onScroll={handleTrackScroll(setActiveValueDot)}
            className="values-grid mobile-swipe-grid"
          >
            {values.map((v, idx) => (
              <div
                key={idx}
                className="landing-card-hover"
                style={{
                  background: 'linear-gradient(150deg, #16161c 0%, #0e0e12 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '24px',
                  padding: '26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                  {v.desc}
                </p>
                <div style={{
                  display: 'inline-block',
                  alignSelf: 'flex-start',
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginTop: 'auto'
                }}>
                  {v.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Swipe Indicator Dots */}
          <div className="mobile-swipe-hint">
            {values.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`swipe-dot ${activeValueDot === idx ? 'active' : ''}`}
                onClick={() => scrollToCard(valuesTrackRef, idx)}
              />
            ))}
          </div>
        </section>

        

        {/* ── 5,300+ HD VIDEO EXERCISES SHOWCASE ──────────────────── */}
        <section id="library" style={{ maxWidth: '1140px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box' }}>
          <div className="ex-showcase-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '99px',
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: '900',
                color: '#38bdf8',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                LIBRARY
              </div>
              <h2 className="section-h2" style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 6px' }}>
                5,300+ HD Video Exercises
              </h2>
              <p className="section-sub" style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0 }}>
                Clean 60fps looping form guides for every barbell, dumbbell, cable, and machine movement.
              </p>
            </div>

            <button
              onClick={() => nav('/library')}
              className="ex-showcase-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '800',
                padding: '10px 20px',
                borderRadius: '99px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Open Full Gym Library</span>
              <span>→</span>
            </button>
          </div>

          <div
            ref={exTrackRef}
            onScroll={handleTrackScroll(setActiveExerciseDot)}
            className="mobile-swipe-grid"
          >
            {[
              {
                id: '0314',
                name: 'Incline Dumbbell Press',
                target: 'Upper Chest & Shoulders',
                sets: '3–4 sets × 8–12 reps',
                angle: 'ANGLE 30°',
                gif: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/0314-ns0SIbU.gif'
              },
              {
                id: '0027',
                name: 'Barbell Bent-Over Row',
                target: 'Upper Back & Lats',
                sets: '3–4 sets × 6–10 reps',
                angle: 'HINGE 45°',
                gif: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/0027-eZyBC3j.gif'
              },
              {
                id: '1436',
                name: 'Barbell High-Bar Squat',
                target: 'Quads & Glutes',
                sets: '3–5 sets × 5–8 reps',
                angle: 'DEPTH 90°',
                gif: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/1436-Gnfo4FM.gif'
              }
            ].map(ex => (
              <div
                key={ex.id}
                onClick={() => nav('/library')}
                className="ex-preview-card"
              >
                <div className="ex-img-frame">
                  <img src={ex.gif} alt={ex.name} loading="lazy" />
                  <span className="ex-fps-badge">▶ 60FPS</span>
                  <span className="ex-angle-badge">{ex.angle}</span>
                </div>
                <div style={{ padding: '16px 4px 6px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 4px' }}>{ex.name}</h3>
                  <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: '700', marginBottom: '4px' }}>{ex.target}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{ex.sets}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Swipe Indicator Dots */}
          <div className="mobile-swipe-hint">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`swipe-dot ${activeExerciseDot === idx ? 'active' : ''}`}
                onClick={() => scrollToCard(exTrackRef, idx)}
              />
            ))}
          </div>
        </section>

        {/* ── INTERACTIVE WORKOUT SANDBOX SECTION ───────────────────── */}
        <section id="sandbox" className="sandbox-sec" style={{ maxWidth: '1140px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '99px',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: '900',
              color: '#38bdf8',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              INTERACTIVE DEMO
            </div>
            <h2 className="section-h2" style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 10px' }}>
              Experience The Live Workout Engine
            </h2>
            <p className="section-sub" style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '540px', margin: '0 auto' }}>
              Test drive the set logger, smart rest countdown timer, and muscle heatmap right now in your browser.
            </p>
          </div>

          <InteractiveWorkoutPreview />
        </section>

        {/* ── PRICING SECTION ───────────────────────────────────────── */}
        <section id="pricing" className="pricing-sec" style={{ maxWidth: '1140px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '99px',
              padding: '5px 16px',
              fontSize: '11px',
              fontWeight: '900',
              color: '#38bdf8',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              <Zap size={13} color="#38bdf8" />
              TRANSPARENT PRICING · ALL-ACCESS
            </div>
            <h2 className="section-h2" style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 14px' }}>
              Invest In Real Results. Not Gym Fluff.
            </h2>
            <p className="section-sub" style={{ fontSize: '15.5px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              No ad interruptions between sets. No fake free tiers that hold your data hostage. Just science-backed progressive overload, 5,300+ 60FPS video form guides, and custom nutrition — for less than a cup of chai a day.
            </p>
          </div>

          {/* Single Focused Hero Plan Card */}
          <div style={{ maxWidth: '580px', margin: '0 auto 40px' }}>
            <div style={{
              background: 'linear-gradient(160deg, #16161c 0%, #0d0d10 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              borderTop: '2.5px solid #38bdf8',
              borderRadius: '28px',
              padding: '42px 32px 34px',
              position: 'relative',
              boxShadow: '0 24px 65px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.14)',
              textAlign: 'center'
            }}>
              
              {/* Floating Pill */}
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#031024',
                fontSize: '11px',
                fontWeight: '900',
                padding: '6px 22px',
                borderRadius: '99px',
                letterSpacing: '0.8px',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
                whiteSpace: 'nowrap'
              }}>
                SPECIAL LAUNCH OFFER: ₹99 FIRST MONTH
              </div>

              {/* Title & Subtitle */}
              <h3 style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', margin: '8px 0 8px', letterSpacing: '-0.5px' }}>
                Fit Ninja Pro Launch Pass
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '440px' }}>
                Get unrestricted access to all 5,300+ guides, guided sets, automatic progressive overload, and custom nutrition for just ₹99.
              </p>

              {/* Pricing & Daily Rate - Symmetrically Centered */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', color: '#64748b', textDecoration: 'line-through', fontWeight: '700' }}>₹399</span>
                  <span style={{ fontSize: '56px', fontWeight: '900', color: '#38bdf8', letterSpacing: '-1.5px', lineHeight: 1 }}>₹99</span>
                  <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '700' }}>/ 1st month</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '99px', padding: '6px 16px', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>Then ₹399/mo (Just ₹13/day)</span>
                  <span style={{ color: '#475569' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>Cancel anytime in 1 tap</span>
                </div>
              </div>

              {/* Subtle Divider */}
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.12) 80%, transparent)', margin: '0 auto 24px', width: '100%' }} />

              {/* Feature List - Centered Container with Aligned Left Content */}
              <div style={{ maxWidth: '490px', margin: '0 auto 28px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#38bdf8" />
                  EVERYTHING INCLUDED IN PRO:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px', fontSize: '13.5px', color: '#f1f5f9' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>5,300+ 60FPS Video Form Guides</strong> for every barbell, dumbbell, cable &amp; machine lift</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Automatic "Lift Heavier" Engine</strong> that prompts exactly when to add +1 kg to +2.5 kg</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Personalized 7-Day Workout &amp; Meal Plan</strong> (High-Protein, Veg, Non-Veg, Keto)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Distraction-Free Rest Timer</strong> with Screen Wake Lock &amp; sound alerts</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Muscle Fatigue &amp; Recovery Heatmap</strong> (anatomical front &amp; back analysis)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Distraction-Free Guided Rest Timer</strong> + automatic email cloud sync</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>100% Ad-Free &amp; Data-Private</strong> — zero ads between sets, no selling your health data</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => nav('/app?mode=signup')}
                  className="btn-glow landing-glow-button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '99px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                    color: '#000000',
                    fontSize: '16.5px',
                    fontWeight: '900',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 28px rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Claim Launch Pass — Just ₹99</span>
                  <ArrowRight size={18} strokeWidth={2.5} color="#000000" />
                </button>
              </div>

            </div>
          </div>

          {/* Trust Badges Row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '12px 20px', marginBottom: '44px', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="#22c55e" />
              256-Bit SSL Encrypted
            </span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#38bdf8" />
              Instant Activation in 60s
            </span>
            <span style={{ color: '#475569' }}>•</span>
            <span>Razorpay Secured (UPI, Cards, NetBanking)</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>1-Tap Cancellation in Profile</span>
          </div>

          {/* 3-Way ROI Comparison Matrix */}
          <div style={{ background: '#0c0c0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '22px', padding: '30px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
                Why Athletes Choose Fit Ninja Over In-Person Trainers &amp; Free Apps
              </h4>
              <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
                Get elite guided training with 5,300+ 60FPS video form guides &amp; automatic progressive overload always in your pocket.
              </p>
            </div>

            {/* Swipeable track on mobile / 3-column grid on desktop */}
            <div
              ref={compareTrackRef}
              onScroll={handleTrackScroll(setActiveCompareDot)}
              className="mobile-swipe-grid"
              style={{ textAlign: 'left', alignItems: 'stretch' }}
            >
              {/* Option 1: Fit Ninja Pro (First!) */}
              <div style={{
                background: 'linear-gradient(160deg, rgba(56, 189, 248, 0.08) 0%, #121215 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderTop: '2px solid #38bdf8',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(56, 189, 248, 0.12)',
                position: 'relative',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justify-content: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    Fit Ninja Pro
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#031024', background: '#38bdf8', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    BEST VALUE
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Special Launch Pass: ₹99 Month 1</strong>, then ₹399/mo (cancel anytime)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Guided Rest Timers:</strong> Screen wake lock, vibration &amp; sound alerts</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>5,300+ 60FPS Video Form Guides</strong> for every barbell &amp; dumbbell lift</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Auto Progressive Overload:</strong> prompts when to add +1 to +2.5 kg</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>100% Ad-Free:</strong> zero set interruptions &amp; 1-tap cancellation</span>
                  </li>
                </ul>
              </div>

              {/* Option 2: In-Person Gym Trainer */}
              <div style={{
                background: '#101116',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '2px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={12} color="#94a3b8" strokeWidth={2.5} />
                    </div>
                    In-Person Trainer
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px' }}>
                    ₹3,000–8,000/MO
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>₹3,000 to ₹8,000 every month</strong> — 10x to 20x higher cost</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Unavailable during odd hours:</strong> early mornings or late nights</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>No Video Form Guides:</strong> zero reference when training solo</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Generic photocopied diet charts:</strong> not personalized to macros</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>No automated progressive tracking:</strong> relying on guesswork</span>
                  </li>
                </ul>
              </div>

              {/* Option 3: Generic "Free" Gym Apps */}
              <div style={{
                background: '#101116',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '2px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justify-content: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={12} color="#94a3b8" strokeWidth={2.5} />
                    </div>
                    Generic "Free" Apps
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px' }}>
                    AD-SUPPORTED
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Intrusive Video Ads:</strong> interrupt your rest intervals &amp; workout flow</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Freezes Underground:</strong> fails in basement gyms with zero reception</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Sudden Paywalls:</strong> lock 90% of exercises and tracking behind fees</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Zero Progressive Overload:</strong> no guidance on weight increase</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={10} color="#64748b" strokeWidth={2.5} />
                    </div>
                    <span><strong>Data Privacy Risk:</strong> collects and monetizes your health data</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Swipe Indicator Dots */}
            <div className="mobile-swipe-hint" style={{ marginTop: '18px', marginBottom: '2px' }}>
              {[0, 1, 2].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  className={`swipe-dot ${activeCompareDot === idx ? 'active' : ''}`}
                  onClick={() => scrollToCard(compareTrackRef, idx)}
                />
              ))}
            </div>
          </div>

        </section>

        {/* ── 3.5 HOW TO INSTALL AS APP GUIDE ──────────────────────── */}
        <section id="install-guide" style={{ maxWidth: '800px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box', padding: '0 4px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '99px', padding: '6px 16px', fontSize: '12px', fontWeight: '800', color: '#38bdf8', marginBottom: '12px' }}>
              ZERO APP STORE DOWNLOAD LAG
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>Install Fit Ninja in 10 Seconds</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '560px', margin: '0 auto' }}>
              Fit Ninja runs as an ultra-fast Progressive Web App (PWA). Add it directly to your home screen for full-screen workouts, instant load times, and distraction-free tracking.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto 36px' }}>
            {/* iOS Card */}
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#38bdf8,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#031024' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.36-.57.66-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.66-1.25z"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0 }}>iPhone / iPad</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Apple Safari Browser</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>1</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Open <strong>fit.socialninjas.in</strong> in Safari and tap the <strong>Share</strong> icon <span style={{ color: '#38bdf8', fontSize: '16px' }}>⎋</span> at the bottom.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>2</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Scroll down the share sheet and select <strong>"Add to Home Screen"</strong> <span style={{ color: '#38bdf8', fontSize: '15px' }}>⊞</span>.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>3</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Tap <strong>"Add"</strong>. Fit Ninja now launches instantly full-screen from your home screen!</div>
                </div>
              </div>
            </div>

            {/* Android Card */}
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#38bdf8,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#031024' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#031024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0 }}>Android Devices</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Google Chrome Browser</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>1</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Open <strong>fit.socialninjas.in</strong> in Chrome and tap the <strong>three dots (⋮)</strong> in the top right.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>2</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the menu.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>3</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.4' }}>Confirm install. Fit Ninja is ready on your home screen and app drawer!</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ───────────────────────────────────────────── */}
        <section id="faq" style={{ maxWidth: '800px', margin: '0 auto 80px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#fff', margin: '0 0 8px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Everything you need to know about Fit Ninja before starting.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {faqs.map((f, idx) => (
              <div
                key={idx}
                onClick={() => toggleFaq(idx)}
                style={{
                  background: '#121215',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '18px',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '15px' }}>
                  <span>{f.q}</span>
                  <span style={{ color: '#38bdf8', fontSize: '18px', transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▾
                  </span>
                </div>
                {openFaq === idx && (
                  <div style={{ marginTop: '14px', fontSize: '14px', color: '#94a3b8', lineHeight: 1.65 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{
          maxWidth: '1140px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '36px 20px 48px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
            <img
              src="/ninja-emblem.png"
              alt="Fit Ninja"
              style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(56, 189, 248, 0.4))' }}
            />
            <span style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>Fit Ninja</span>
            <span style={{ color: '#334155' }}>·</span>
            <span>Built by <a href="https://socialninjas.in" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>Social Ninja's</a></span>
          </div>

          {/* Quick Legal Links */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '14px', fontSize: '12px' }}>
            <a href="/privacy.html" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
            <span style={{ color: '#334155' }}>·</span>
            <a href="/terms.html" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</a>
            <span style={{ color: '#334155' }}>·</span>
            <a href="/contact.html" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact Us</a>
          </div>

          {/* Legal Advisory */}
          <div style={{ maxWidth: '680px', margin: '0 auto 14px', fontSize: '11px', color: '#64748b', lineHeight: 1.55, textAlign: 'center' }}>
            <strong style={{ color: '#94a3b8' }}>Legal Advisory:</strong> Fit Ninja provides workout tracking and nutritional guidelines for educational and fitness purposes only. It is not medical advice. Always consult a physician before beginning any rigorous training program.
          </div>

          <div>© 2026 Social Ninja's · fit.socialninjas.in · All Rights Reserved</div>
        </footer>

      </div>

    </div>
  );
}
