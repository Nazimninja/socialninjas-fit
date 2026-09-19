import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Flame, Target, Sparkles, ShieldCheck, ChevronRight, Check, ArrowRight, Star, Play, Zap, HelpCircle, Timer, Video, UtensilsCrossed, Cloud, TrendingUp, X } from 'lucide-react';
import AthleteHeroVisual from '../components/AthleteHeroVisual.jsx';
import InteractiveWorkoutPreview from '../components/InteractiveWorkoutPreview.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategoryDot, setActiveCategoryDot] = useState(0);
  const [activeExerciseDot, setActiveExerciseDot] = useState(0);
  const [activeValueDot, setActiveValueDot] = useState(0);
  const [activeCompareDot, setActiveCompareDot] = useState(0);
  const valuesTrackRef = useRef(null);
  const catTrackRef = useRef(null);
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
      a: "Most fitness apps are either digital notebooks or complicated spreadsheets full of robotic jargon. Fit Ninja gives you 5,300+ looping animated video guides for every gym movement, automatic 'Lift Heavier' progression recommendations, distraction-free full-screen rest timers, muscle recovery maps, and customized meal plans — all running 100% offline."
    },
    {
      q: "Does the app work underground or without an internet connection?",
      a: "Yes! Fit Ninja was built offline-first. All your exercises, logs, sets, and meals are saved securely on your phone. It runs flawlessly in gym basements with zero mobile network, and syncs automatically with our cloud backup whenever you're connected."
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
      a: "Fit Ninja Pro is just ₹399/month (less than ₹13/day). It is a simple recurring monthly membership with zero lock-in, giving you complete, unrestricted access to 5,300+ animated video exercises, guided workout player, full-screen rest timers, automatic weight suggestions, custom meal plans, and cloud backup."
    },
    {
      q: "Why is there no free plan or ad-supported version?",
      a: "Free fitness apps survive by interrupting your rest timers with noisy 30-second video ads, collecting and selling your health data, or abruptly locking 90% of exercises behind paywalls when you reach the gym. Fit Ninja was built by athletes for athletes: 100% ad-free, 100% private, fully offline in basement gyms, and pro-grade from Day 1."
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
      icon: <Cloud size={22} color="#38bdf8" />,
      title: "100% Offline Gym Mode + Cloud Backup",
      desc: "Underground gym basements with zero mobile reception? No problem. Fit Ninja stores everything locally on your device, and automatically backs up your workout history and custom routines to the cloud.",
      badge: "Works Anywhere"
    }
  ];

  const categories = [
    {
      icon: <Timer size={24} color="#38bdf8" />,
      tag: "Guided Player",
      title: "Guided Workout Execution",
      desc: "Full-screen rest countdowns with sound alerts, pre-filled working weights from previous sessions, and Screen Wake Lock to keep your display alive without touching your phone.",
      action: "Launch Player",
      path: "/workout"
    },
    {
      icon: <Dumbbell size={24} color="#38bdf8" />,
      tag: "5,300+ Library",
      title: "5,300+ Animated Video Demos",
      desc: "Every barbell, dumbbell, cable, and machine movement demonstrated with looping 60fps HD video guides. Search and filter by muscle group & equipment.",
      action: "Explore Catalogue",
      path: "/library"
    },
    {
      icon: <Activity size={24} color="#a855f7" />,
      tag: "Real-Time Analytics",
      title: "Muscle Map & Progress Tracker",
      desc: "Interactive front and back body map showing exactly which muscles you've worked this week, plus smart suggestions on how much weight to lift next.",
      action: "View Muscle Map",
      path: "/stats"
    }
  ];

  return (
    <div style={{
      background: '#040711',
      backgroundImage: 'radial-gradient(1200px circle at 50% 8%, rgba(56, 189, 248, 0.12), rgba(56, 189, 248, 0.08) 30%, transparent 75%)',
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
        background: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px'
      }}>
        <div style={{
          maxWidth: '1240px',
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
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#031024',
                fontWeight: '900',
                fontSize: '13px',
                padding: '9px 20px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)',
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
      <header style={{
        padding: '60px 24px 70px',
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'center'
      }}>

        {/* Left Column: Typography & CTAs */}
        <div>
          {/* Eyebrow Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '50px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#38bdf8',
            marginBottom: '22px'
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
            <span className="pill-sub" style={{ color: '#e2e8f0' }}>Workout &amp; Nutrition Coach</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: '900',
            letterSpacing: '-1.8px',
            lineHeight: 1.08,
            margin: '0 0 20px',
            color: '#ffffff'
          }}>
            Train with Confidence.<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #bae6fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Progress Every Single Session.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#94a3b8',
            lineHeight: 1.65,
            maxWidth: '560px',
            margin: '0 0 32px',
            fontWeight: '500'
          }}>
            Never guess what weights to lift or what to eat again. 5,300+ looping animated video exercises, custom workout &amp; diet plans, distraction-free full-screen rest timer, muscle recovery maps, and dead-simple food logging — in an app that runs 100% offline in underground gyms.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <button
              onClick={() => nav('/app?mode=signup')}
              className="landing-glow-button"
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#031024',
                fontWeight: '900',
                fontSize: '15px',
                padding: '14px 28px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Start Your Transformation</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#sandbox"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '15px',
                padding: '14px 24px',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
            >
              <Play size={15} fill="#38bdf8" color="#38bdf8" />
              <span>Try Interactive Demo</span>
            </a>
          </div>

          {/* Metric Badges Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '14px',
            background: 'rgba(13, 20, 36, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '16px 20px',
            maxWidth: '560px'
          }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>5,300+</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Video Exercises</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>100%</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Offline Gym Mode</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>4.9 ★</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Athlete Rating</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>₹13/day</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Fit Ninja Pro</div>
            </div>
          </div>
        </div>

        {/* Right Column: Athlete Hero Visual with Floating Connected Cards */}
        <div>
          <AthleteHeroVisual />
        </div>

      </header>

      {/* ── ORGANIC CURVED CONTAINER SECTION ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #090e1c 0%, #040711 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '44px 44px 0 0',
        padding: '70px 24px 40px',
        boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.5)'
      }}>

        {/* ── CORE VALUE PILLARS (THE REAL VALUE WE PROVIDE) ──────── */}
        <section id="values" style={{ maxWidth: '1200px', margin: '0 auto 80px' }}>
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
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(9, 14, 26, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
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
        <section id="library" style={{ maxWidth: '1200px', margin: '0 auto 80px' }}>
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
        <section id="sandbox" className="sandbox-sec" style={{ maxWidth: '1100px', margin: '0 auto 80px' }}>
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
        <section id="pricing" className="pricing-sec" style={{ maxWidth: '1060px', margin: '0 auto 90px', padding: '0 16px' }}>
          
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
              background: 'linear-gradient(155deg, rgba(15, 23, 42, 0.98) 0%, rgba(7, 11, 20, 0.99) 100%)',
              border: '2px solid rgba(56, 189, 248, 0.65)',
              borderRadius: '28px',
              padding: '42px 32px 34px',
              position: 'relative',
              boxShadow: '0 24px 65px -10px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.22)',
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
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.5)',
                whiteSpace: 'nowrap'
              }}>
                ALL-ACCESS PRO MEMBERSHIP
              </div>

              {/* Title & Subtitle */}
              <h3 style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', margin: '8px 0 8px', letterSpacing: '-0.5px' }}>
                Fit Ninja Pro
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '440px' }}>
                The complete gym companion with 5,300+ guides, guided sets, automatic progressive overload, and custom nutrition.
              </p>

              {/* Pricing & Daily Rate - Symmetrically Centered */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '54px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px', lineHeight: 1 }}>₹399</span>
                  <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '700' }}>/ month</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '99px', padding: '6px 16px', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>Just ₹13/day</span>
                  <span style={{ color: '#475569' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>Cancel anytime in 1 tap</span>
                </div>
              </div>

              {/* Subtle Divider */}
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.25) 20%, rgba(56, 189, 248, 0.25) 80%, transparent)', margin: '0 auto 24px', width: '100%' }} />

              {/* Feature List - Centered Container with Aligned Left Content */}
              <div style={{ maxWidth: '490px', margin: '0 auto 28px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
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
                    <span><strong>100% Offline Gym Mode</strong> + automatic email cloud sync</span>
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
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    color: '#031024',
                    fontSize: '16.5px',
                    fontWeight: '900',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 28px rgba(56, 189, 248, 0.45)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Start Fit Ninja Pro — ₹399/mo</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
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
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '22px', padding: '30px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
                Why Athletes Choose Fit Ninja Over In-Person Trainers &amp; Free Apps
              </h4>
              <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
                Save over ₹4,500 every single month with professional 60FPS video guides &amp; automatic overload always in your pocket.
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
                background: 'linear-gradient(160deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.55)',
                borderTop: '2px solid #38bdf8',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxShadow: '0 12px 30px rgba(56, 189, 248, 0.12)',
                position: 'relative',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#38bdf8" strokeWidth={3} />
                    </div>
                    Fit Ninja Pro
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#031024', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    BEST VALUE
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>Just ₹399/mo (₹13/day)</strong> — save ₹4,500+ every single month</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={11} color="#38bdf8" strokeWidth={3} />
                    </div>
                    <span><strong>100% Offline Mode:</strong> works in gym basements with 0 signal</span>
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
                background: 'rgba(244, 63, 94, 0.04)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderTop: '2px solid rgba(244, 63, 94, 0.7)',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={13} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    In-Person Trainer
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px' }}>
                    ₹3,000–8,000/MO
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    <span><strong>₹3,000 to ₹8,000 every month</strong> — 10x to 20x higher cost</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    <span><strong>Unavailable during odd hours:</strong> early mornings or late nights</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    <span><strong>No Video Form Guides:</strong> zero reference when training solo</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    <span><strong>Generic photocopied diet charts:</strong> not personalized to macros</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#f43f5e" strokeWidth={2.5} />
                    </div>
                    <span><strong>No automated progressive tracking:</strong> relying on guesswork</span>
                  </li>
                </ul>
              </div>

              {/* Option 3: Generic "Free" Gym Apps */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.04)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderTop: '2px solid rgba(234, 179, 8, 0.7)',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={13} color="#eab308" strokeWidth={2.5} />
                    </div>
                    Generic "Free" Apps
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '3px 8px', borderRadius: '99px', letterSpacing: '0.4px' }}>
                    AD-SUPPORTED
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#eab308" strokeWidth={2.5} />
                    </div>
                    <span><strong>Intrusive Video Ads:</strong> interrupt your rest intervals &amp; workout flow</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#eab308" strokeWidth={2.5} />
                    </div>
                    <span><strong>Freezes Underground:</strong> fails in basement gyms with zero reception</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#eab308" strokeWidth={2.5} />
                    </div>
                    <span><strong>Sudden Paywalls:</strong> lock 90% of exercises and tracking behind fees</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#eab308" strokeWidth={2.5} />
                    </div>
                    <span><strong>Zero Progressive Overload:</strong> no guidance on weight increase</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <X size={11} color="#eab308" strokeWidth={2.5} />
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

        {/* ── FAQ SECTION ───────────────────────────────────────────── */}
        <section id="faq" style={{ maxWidth: '800px', margin: '0 auto 80px' }}>
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
                  background: 'rgba(13, 20, 36, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '40px 20px 20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <img
              src="/ninja-emblem.png"
              alt="Fit Ninja"
              style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(56, 189, 248, 0.4))' }}
            />
            <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>Fit Ninja</span>
            <span>·</span>
            <span>Built by <a href="https://socialninjas.in" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>Social Ninja's</a></span>
          </div>
          <div>© 2026 Social Ninja's · fit.socialninjas.in · All Rights Reserved</div>
        </footer>

      </div>

    </div>
  );
}
