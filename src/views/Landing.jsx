import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Flame, Target, Sparkles, ShieldCheck, ChevronRight, Check, ArrowRight, Star, Play, Zap, HelpCircle, Timer } from 'lucide-react';
import AthleteHeroVisual from '../components/AthleteHeroVisual.jsx';
import InteractiveWorkoutPreview from '../components/InteractiveWorkoutPreview.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategoryDot, setActiveCategoryDot] = useState(0);
  const [activeExerciseDot, setActiveExerciseDot] = useState(0);
  const catTrackRef = useRef(null);
  const exTrackRef = useRef(null);

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
      a: "Yes! Whenever your schedule changes, you hit a plateau, or your goals shift (e.g. from fat loss to muscle gain), you can update your answers and generate a brand-new AI training split and diet plan in seconds. Your previous workout history remains safely stored."
    },
    {
      q: "How much does Fit Ninja cost?",
      a: "Fit Ninja Pro is just ₹399/month (less than ₹13/day). That gives you complete, unrestricted access to 5,300+ animated video exercises, guided workout player, full-screen rest timers, automatic weight suggestions, custom AI meal plans, and cloud backup."
    }
  ];

  const values = [
    {
      icon: "🎥",
      title: "5,300+ HD Looping Form Guides",
      desc: "Never feel lost or intimidated by gym machines or complex lifts. Watch crystal-clear 60fps video demonstrations for every barbell, dumbbell, cable, machine, and bodyweight exercise from optimal angles.",
      badge: "Zero Form Guesswork"
    },
    {
      icon: "🤖",
      title: "Personalized AI Workout & Diet Plan",
      desc: "Get a 7-day workout split matched to your schedule, plus a tailored meal plan with exact calorie and protein targets (Veg, Non-Veg, Vegan, or Keto). Easily refresh your plan whenever your routine changes.",
      badge: "Tailored to Your Body"
    },
    {
      icon: "⚡",
      title: "Automatic 'Lift Heavier' Progression",
      desc: "Building muscle requires lifting slightly heavier over time. Fit Ninja automatically remembers your previous weights and sets, telling you exactly when to add +1 kg to +2.5 kg so you never plateau.",
      badge: "Steady Muscle Growth"
    },
    {
      icon: "⏱️",
      title: "Distraction-Free Full-Screen Rest Timer",
      desc: "A clean, full-screen countdown between sets with audible chimes and vibration alerts. Built specifically to eliminate accidental mis-touches and stop you from doom-scrolling social media while resting.",
      badge: "Gym Focus & Screen Wake Lock"
    },
    {
      icon: "🥗",
      title: "Practical Food Logging & Calorie Guidance",
      desc: "Log what you eat in seconds. We give you realistic, approximate calorie and protein numbers for quick daily tracking, plus honest guidance on when to use a kitchen food scale for pinpoint accuracy.",
      badge: "No Complicated Menus"
    },
    {
      icon: "📶",
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
              <span>⚡ Launch App</span>
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
            <span className="pill-sub" style={{ color: '#e2e8f0' }}>AI Workout &amp; Nutrition Coach</span>
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
            Never guess what weights to lift or what to eat again. 5,300+ looping animated video exercises, custom AI workout &amp; diet plans, distraction-free full-screen rest timer, muscle recovery maps, and dead-simple food logging — in an app that runs 100% offline in underground gyms.
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
              <span>⚡ Start Your Transformation</span>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
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
        </section>

        {/* ── OUR CATEGORIES / TRAINING DISCIPLINES ─────────────────── */}
        <section id="categories" style={{ maxWidth: '1200px', margin: '0 auto 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              BUILT FOR REAL RESULTS
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 12px' }}>
              Guided Workout Tracking in Action
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '580px', margin: '0 auto' }}>
              Step into the gym with total confidence. Structured routines, video demonstrations, and automated set guidance designed for real progress.
            </p>
          </div>

          {/* Cards Grid */}
          <div
            ref={catTrackRef}
            onScroll={handleTrackScroll(setActiveCategoryDot)}
            className="mobile-swipe-grid"
            style={{ marginTop: '40px' }}
          >
            {categories.map((c, idx) => (
              <div
                key={idx}
                className="cat-card landing-card-hover"
                style={{
                  background: 'rgba(13, 20, 36, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {c.icon}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#38bdf8' }}>{c.tag}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
                    {c.title}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                    {c.desc}
                  </p>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={() => nav(c.path)}
                    className="cat-btn"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      padding: '10px 18px',
                      borderRadius: '99px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{c.action}</span>
                    <span style={{ fontSize: '13px' }}>↗</span>
                  </button>
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
                className={`swipe-dot ${activeCategoryDot === idx ? 'active' : ''}`}
                onClick={() => scrollToCard(catTrackRef, idx)}
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
        <section id="pricing" className="pricing-sec" style={{ maxWidth: '840px', margin: '0 auto 80px', textAlign: 'center' }}>
          <h2 className="section-h2" style={{ fontSize: '34px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
            Simple, Fair Pricing
          </h2>
          <p className="section-sub" style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '32px' }}>
            Get elite fitness technology at less than the cost of a single gym energy drink per week.
          </p>

          <div className="pricing-box" style={{
            background: 'linear-gradient(145deg, rgba(13, 20, 36, 0.95) 0%, rgba(7, 11, 20, 0.98) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderTop: '1px solid rgba(56, 189, 248, 0.7)',
            borderRadius: '28px',
            padding: '42px 32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.1)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-13px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '900',
              padding: '5px 18px',
              borderRadius: '20px',
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
            }}>
              ALL-INCLUSIVE PRO
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '8px 0 4px' }}>Fit Ninja Pro</h3>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: '16px 0' }}>
              ₹399 <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>/ month</span>
            </div>

            {/* Value comparison pill */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '6px 16px',
              fontSize: '12px',
              color: '#38bdf8',
              fontWeight: '700',
              marginBottom: '24px'
            }}>
              Just ₹13/day · Cancel anytime with 1 tap · Zero hidden fees
            </div>

            <ul className="pricing-features-list" style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 auto 30px',
              maxWidth: '540px',
              textAlign: 'left',
              display: 'grid',
              gap: '12px',
              fontSize: '14px',
              color: '#f1f5f9'
            }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Full access to 5,300+ animated exercises &amp; looping 60fps HD form guides</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Personalized AI workout &amp; diet plan (High-Protein, Veg, Non-Veg, Vegan, Keto)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Distraction-free full-screen rest timer with sound chimes, haptics &amp; screen lock</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Smart "Lift Heavier" suggestions to build strength steadily without plateaus</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Visual muscle recovery heatmap (front and back body analysis)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>Practical food logging with realistic calorie estimates &amp; kitchen scale tips</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#38bdf8" strokeWidth={3} />
                <span>100% offline gym basement mode + automatic cloud backup via email</span>
              </li>
            </ul>

            {/* Value Comparison Box */}
            <div style={{
              margin: '0 auto 24px',
              maxWidth: '540px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#f43f5e', textTransform: 'uppercase', marginBottom: '6px' }}>Personal Gym Trainer</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.5' }}>
                  ❌ ₹3,000–₹8,000 / mo<br />
                  ❌ Unavailable at off-hours<br />
                  ❌ No video guides to check<br />
                  ❌ Generic paper diet charts
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>Fit Ninja Pro</div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  ✅ Just ₹399 / mo (₹13/day)<br />
                  ✅ 24/7 on your phone<br />
                  ✅ 5,300+ animated videos<br />
                  ✅ Custom AI meals updated anytime
                </div>
              </div>
            </div>

            <button
              onClick={() => nav('/app?mode=signup')}
              className="landing-glow-button"
              style={{
                width: '100%',
                maxWidth: '460px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#031024',
                fontWeight: '900',
                fontSize: '16px',
                padding: '16px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(56, 189, 248, 0.4)'
              }}
            >
              ⚡ Start Fit Ninja Pro →
            </button>
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
