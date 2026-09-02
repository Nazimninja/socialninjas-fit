import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "What makes Fit Ninjas different from other gym workout apps?",
      a: "Fit Ninjas combines 1,324+ animated video exercise demos, automated progressive overload algorithms (Greyskull LP, Linear Progression, Double Progression), real-time front & back muscle heatmaps, and a full AI macro nutrition engine into a single 100% offline-capable PWA."
    },
    {
      q: "Does the app work without an internet connection?",
      a: "Yes! Fit Ninjas is built with an offline-first architecture. All your workouts, exercise logs, sets, and macro calculations are cached locally on your device and sync seamlessly whenever you're connected."
    },
    {
      q: "How do the guided workout player and rest timers work?",
      a: "When you start a session, Fit Ninjas keeps your phone screen awake (Screen Wake Lock API), pre-fills your working weights from previous workouts, advances sets automatically, and sounds audio cues when your rest timer expires."
    },
    {
      q: "Can I customize my diet preferences for the AI Nutrition engine?",
      a: "Absolutely. You can select between High Protein Balanced, Indian Vegetarian (Paneer, Soya, Dal), Ketogenic Low-Carb, and Plant-Based Vegan with customized daily macro targets."
    },
    {
      q: "How much does Fit Ninjas cost?",
      a: "You can use the core workout tracker, exercises, and guest mode for free. Full access to the AI Macro engine, unlimited custom workouts, and cloud sync is available for just ₹299/month."
    }
  ];

  return (
    <div style={{ background: '#06080e', color: '#fff', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', Roboto, sans-serif" }}>
      
      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6, 8, 14, 0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '1200px', margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => nav('/')}>
          <img src="/ninja-logo.png?v=3" alt="Fit Ninjas" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>
              Fit<span style={{ color: '#f59e0b' }}>Ninjas</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
              BY SOCIAL NINJA'S
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => nav('/library')}
            style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'none' }}
            className="hidden-sm"
          >
            1,324+ Exercises
          </button>
          <button
            onClick={() => nav('/home')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              fontWeight: '800',
              fontSize: '13px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡ Launch App</span>
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <header style={{ padding: '60px 20px 40px', textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
        
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '50px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', color: '#f59e0b',
          marginBottom: '20px'
        }}>
          <span>🔥 FIT NINJAS 2.0 IS LIVE</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>1,324+ Exercises & AI Macros</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: '900', letterSpacing: '-1.5px',
          lineHeight: 1.1, margin: '0 0 18px', color: '#fff'
        }}>
          The All-In-One Workout, Progression & AI Nutrition OS
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'rgba(235, 235, 245, 0.65)', lineHeight: 1.6,
          maxWidth: '680px', margin: '0 auto 30px'
        }}>
          Guided workout player with animated video demos, smart rest timers, Greyskull LP strength progression, real-time anatomical muscle heatmaps, and personalized AI nutrition.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button
            onClick={() => nav('/home')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000', fontWeight: '800', fontSize: '15px', padding: '14px 28px',
              borderRadius: '14px', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.35)', transition: 'transform 0.15s'
            }}
          >
            ⚡ Start Workout (Free)
          </button>
          <button
            onClick={() => nav('/library')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontWeight: '700', fontSize: '15px',
              padding: '14px 24px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer'
            }}
          >
            🏋️ Browse 1,324+ Exercises
          </button>
        </div>

        {/* Metric Badges */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px',
          padding: '18px 24px', maxWidth: '720px', margin: '0 auto'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>1,324+</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Animated Demos</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>100%</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Offline PWA</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#34d399' }}>4.9 ★</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>User Rating</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#c084fc' }}>₹299/mo</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Pro Pass</div>
          </div>
        </div>

      </header>

      {/* ── CORE CAPABILITIES GRID (4 PILLARS) ───────────────────────── */}
      <section style={{ padding: '50px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
            Engineered for Serious Transformation
          </h2>
          <p style={{ fontSize: '15px', color: '#888', maxWidth: '520px', margin: '8px auto 0' }}>
            Everything you need to build muscle, shred body fat, and track strength progress with scientific precision.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          {/* Feature 1 */}
          <div style={{
            background: '#0d111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>🏋️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>1,324+ Animated Exercises</h3>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                Every barbell, dumbbell, cable, and bodyweight movement demonstrated with looping animated video GIFs. Search and filter by muscle group & equipment.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: '#f59e0b', cursor: 'pointer' }} onClick={() => nav('/library')}>
              Explore Catalogue →
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: '#0d111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚡</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Guided In-Session Player</h3>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                Pre-filled weights from your previous sessions, automated rest countdowns with sound alerts, supersets, and screen wake lock so your phone stays on during sets.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: '#38bdf8', cursor: 'pointer' }} onClick={() => nav('/workout')}>
              Start Live Workout →
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#0d111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>🧬</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Muscle Heatmap & Analytics</h3>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                Front and back anatomical body visualizer highlighting muscle volume distribution. Never miss a muscle group with weekly training heatmaps.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: '#34d399', cursor: 'pointer' }} onClick={() => nav('/stats')}>
              View Muscle Map →
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#0d111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>🥗</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>AI Nutrition & Macros</h3>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                Personalized BMR & TDEE calorie calculator with macro targets (Protein, Carbs, Fats) and customized meal plans for High Protein, Indian Veg, Keto, and Vegan diets.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: '#c084fc', cursor: 'pointer' }} onClick={() => nav('/nutrition')}>
              Calculate Macros →
            </div>
          </div>

        </div>
      </section>

      {/* ── PRICING SECTION ─────────────────────────────────────────── */}
      <section style={{ padding: '50px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
          Transparent, Affordable Pricing
        </h2>
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '30px' }}>
          Get elite fitness tools at a fraction of a personal trainer's cost.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #111522, #0d111a)',
          border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '24px',
          padding: '36px 28px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000',
            fontSize: '11px', fontWeight: '900', padding: '4px 16px', borderRadius: '20px', letterSpacing: '0.8px'
          }}>
            MOST POPULAR
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '8px 0 4px' }}>Fit Ninjas All-Access Pro</h3>
          <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: '14px 0' }}>
            ₹299 <span style={{ fontSize: '16px', color: '#888', fontWeight: '500' }}>/ month</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', textAlign: 'left', display: 'grid', gap: '10px', fontSize: '13.5px', color: 'rgba(255,255,255,0.85)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Full access to all 1,324+ animated exercises & video GIFs</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Unlimited custom weekly routines & superset plans</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Live guided workout player with rest timers & audio alerts</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Anatomical muscle heatmaps & 1RM strength tracking</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ AI Macro & Nutrition meal generator (Veg, Non-Veg, Keto)</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ 100% offline-ready PWA for iPhone and Android</li>
          </ul>

          <button
            onClick={() => nav('/home')}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000', fontWeight: '800', fontSize: '16px', padding: '14px',
              borderRadius: '14px', border: 'none', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)'
            }}
          >
            ⚡ Get Started Now
          </button>
        </div>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
      <section style={{ padding: '50px 20px', maxWidth: '760px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: '24px' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'grid', gap: '12px' }}>
          {faqs.map((f, idx) => (
            <div
              key={idx}
              onClick={() => toggleFaq(idx)}
              style={{
                background: '#0d111a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                padding: '18px 20px', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '15px' }}>
                <span>{f.q}</span>
                <span style={{ color: '#f59e0b', fontSize: '18px' }}>{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p style={{ margin: '12px 0 0', fontSize: '13.5px', color: '#888', lineHeight: 1.6 }}>
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 20px',
        textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <img src="/ninja-logo.png?v=3" alt="Fit Ninjas" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          <span style={{ fontWeight: '700', color: '#fff' }}>Fit Ninjas OS</span>
          <span>·</span>
          <span>Built by <a href="https://socialninjas.in" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Social Ninja's AI Agency</a></span>
        </div>
        <div>© 2026 Social Ninja's · fit.socialninjas.in · All Rights Reserved</div>
      </footer>

    </div>
  );
}
