import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Flame, Target, Sparkles, ShieldCheck, ChevronRight, Check, ArrowRight, Star, Play, Zap, HelpCircle } from 'lucide-react';
import AthleteHeroVisual from '../components/AthleteHeroVisual.jsx';
import InteractiveWorkoutPreview from '../components/InteractiveWorkoutPreview.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "What makes Fit Ninja different from typical workout apps?",
      a: "Fit Ninja combines 1,324+ animated video exercise demonstrations, automated progressive overload algorithms (Greyskull LP, Linear Progression, Double Progression), real-time front & back muscle heatmaps, and a comprehensive sports nutrition engine into a single 100% offline-capable PWA with zero subscription lock-in."
    },
    {
      q: "Does the app work underground or without an internet connection?",
      a: "Yes! Fit Ninja is built with an offline-first architecture. All your workouts, exercise logs, sets, and macro calculations are cached locally on your device and sync seamlessly whenever you're connected — perfect for basement gyms with zero signal."
    },
    {
      q: "How do the guided workout player and rest timers work?",
      a: "When you start a session, Fit Ninja activates the Screen Wake Lock API to keep your phone screen awake, pre-fills your working weights from previous workouts, advances sets automatically, and sounds audio chimes when your rest timer expires."
    },
    {
      q: "Can I customize my diet preferences for the nutrition engine?",
      a: "Absolutely. You can choose between High-Protein Clean Hypertrophy, Plant-Based Athletic Vegan, Ketogenic Metabolic, and Balanced Nutrition with automated daily macro splits calibrated for your specific goal."
    },
    {
      q: "How much does Fit Ninja cost?",
      a: "Fit Ninja Pro is available for ₹399/month (just ₹13/day), giving you complete, unrestricted access to 1,324+ animated exercises, guided workout player, smart rest timers, automated progressive overload, and adaptive macro nutrition."
    }
  ];

  const categories = [
    {
      icon: <Dumbbell size={24} color="#38bdf8" />,
      tag: "Strength LP",
      title: "Greyskull Strength & LP",
      desc: "Automated weight increments, AMRAP failure detection, and deload protocols engineered for maximum compound lift strength.",
      action: "Explore Routine",
      path: "/library"
    },
    {
      icon: <Activity size={24} color="#10b981" />,
      tag: "Hypertrophy",
      title: "Hypertrophy & Muscle Volume",
      desc: "Targeted exercise selection, isolated muscular tension, and full-range video GIFs covering barbell, dumbbell, cable, and machine work.",
      action: "View 1,324+ Demos",
      path: "/library"
    },
    {
      icon: <Flame size={24} color="#f43f5e" />,
      tag: "Conditioning",
      title: "Fat Shred & High-Density HIIT",
      desc: "High metabolic burn routines, automated supersets, and interval audio cues designed to maximize caloric expenditure.",
      action: "Start Session",
      path: "/workout"
    },
    {
      icon: <Target size={24} color="#fbbf24" />,
      tag: "Nutrition",
      title: "Precision Sports Nutrition",
      desc: "Adaptive macro calculation (Protein, Carbs, Fats) calibrated for your specific bodyweight target: surplus, deficit, or maintenance.",
      action: "Calculate Macros",
      path: "/nutrition"
    },
    {
      icon: <Sparkles size={24} color="#a855f7" />,
      tag: "Analytics",
      title: "Anatomical Muscle Heatmaps",
      desc: "Front and back physiological visualizer tracking weekly set volume per muscle so you never leave a lagging body part behind.",
      action: "View Muscle Map",
      path: "/stats"
    },
    {
      icon: <ShieldCheck size={24} color="#38bdf8" />,
      tag: "Offline First",
      title: "100% Offline Gym PWA",
      desc: "Engineered to run seamlessly underground in gyms with zero signal. Keeps your phone awake during sets with zero battery drain.",
      action: "Launch PWA",
      path: "/app?mode=app"
    }
  ];

  return (
    <div style={{
      background: '#040711',
      backgroundImage: 'radial-gradient(1200px circle at 50% 8%, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08) 30%, transparent 75%)',
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
              href="#categories"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Disciplines
            </a>
            <a
              href="#sandbox"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13.5px', fontWeight: '700', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Interactive Demo
            </a>
            <button
              onClick={() => nav('/library')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              1,324+ Demos
            </button>
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
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '50px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '22px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span>FIT NINJA PRO OS</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span style={{ color: '#e2e8f0' }}>Progressive Overload Architecture</span>
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
            Train Different.<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Progress Every Rep.
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
            Seize the science of progressive overload. 1,324+ looping animated exercise demos, automated rest countdowns with sound alerts, real-time muscle fatigue heatmaps, and precision sports nutrition.
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
              <span>⚡ Start Transformation</span>
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
              <span>Test Interactive Demo</span>
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
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>1,324+</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Animated Demos</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>100%</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Offline PWA</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>4.9 ★</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Athlete Rating</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>₹13/day</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Affordable Pro</div>
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
              OUR DISCIPLINES
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 12px' }}>
              Engineered for Serious Transformation
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '580px', margin: '0 auto' }}>
              Seize the opportunity. It's time to build elite physical capability with scientific structure and automated guidance.
            </p>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '22px'
          }}>
            {categories.map((c, idx) => (
              <div
                key={idx}
                className="landing-card-hover"
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
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#10b981' }}>{c.tag}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
                    {c.title}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                    {c.desc}
                  </p>
                </div>

                <div
                  onClick={() => nav(c.path)}
                  style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  <span>{c.action}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── INTERACTIVE WORKOUT SANDBOX SECTION ───────────────────── */}
        <section id="sandbox" style={{ maxWidth: '1100px', margin: '0 auto 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '99px',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: '900',
              color: '#10b981',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              INTERACTIVE DEMO
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff', margin: '0 0 10px' }}>
              Experience The Live Workout Engine
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '540px', margin: '0 auto' }}>
              Test drive the set logger, smart rest countdown timer, and muscle heatmap right now in your browser.
            </p>
          </div>

          <InteractiveWorkoutPreview />
        </section>

        {/* ── PRICING SECTION ───────────────────────────────────────── */}
        <section id="pricing" style={{ maxWidth: '840px', margin: '0 auto 80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '34px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
            Transparent, High-ROI Access
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '32px' }}>
            Get elite fitness technology at less than the cost of a single gym energy drink per week.
          </p>

          <div style={{
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '900',
              padding: '5px 18px',
              borderRadius: '20px',
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              SPECIAL PRO PASS ACTIVE
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '8px 0 4px' }}>Fit Ninja All-Access Pro</h3>
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
              Average Gym Trainer: ₹3,000–₹8,000/mo · Fit Ninja Pro: Just ₹13/day
            </div>

            <ul style={{
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
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>Full access to 1,324+ animated exercises &amp; looping video GIFs</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>Unlimited custom routines, Greyskull LP &amp; superset progression</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>Guided in-gym player with wake-lock, smart timers &amp; audio chimes</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>Anatomical muscle heatmaps &amp; 1RM strength fatigue analytics</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>Precision macro meal planner (High-Protein, Vegan, Keto)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={18} color="#10b981" strokeWidth={3} />
                <span>100% offline-ready PWA for iPhone, Android, and Desktop</span>
              </li>
            </ul>

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
              ⚡ Claim Pro Pass &amp; Start Transformation →
            </button>
          </div>
        </section>

        {/* ── FAQ SECTION ───────────────────────────────────────────── */}
        <section id="faq" style={{ maxWidth: '800px', margin: '0 auto 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#fff', margin: '0 0 8px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Everything you need to know about Fit Ninja Pro before starting.
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
                  <span style={{ color: '#38bdf8', fontSize: '20px', lineHeight: 1 }}>{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <p style={{ margin: '14px 0 0', fontSize: '14px', color: '#94a3b8', lineHeight: 1.65 }}>
                    {f.a}
                  </p>
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
            <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>Fit Ninja Pro</span>
            <span>·</span>
            <span>Built by <a href="https://socialninjas.in" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>Social Ninja's</a></span>
          </div>
          <div>© 2026 Social Ninja's · fit.socialninjas.in · All Rights Reserved</div>
        </footer>

      </div>

    </div>
  );
}
