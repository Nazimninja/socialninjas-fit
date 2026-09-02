import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyRegister, verifyMemberEmail, signInWithGoogle } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { useState, useRef, useEffect } from 'react'
import { Button } from '../components/ui.jsx'
import { openRazorpayCheckout } from '../lib/payment.jsx'

import { onboardingWizardSheet } from '../sheets.jsx'

const ADMIN_LIST = [
  'nazim.socialninja@gmail.com',
  'nazimpasha906@gmail.com',
  'nazim@socialninjas.in',
  'admin@socialninjas.in',
  'support@socialninjas.in',
  'fit@socialninjas.in'
]

export function RegisterSheet({ close }) {
  const { setUser, setPaid } = useStore()
  const [name, setName] = useState('')
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])

  const go = async () => {
    const n = name.trim()
    if (!n) { useUI.getState().toast(t('Enter a name')); return }
    try {
      if (webauthnOK()) {
        const u = await passkeyRegister(n, '').catch(() => ({ name: n }))
        setUser(u)
      } else {
        setUser({ name: n })
      }
      setPaid(true)
      close()
    } catch (e) {
      setUser({ name: n })
      setPaid(true)
      close()
    }
  }

  return (
    <div style={{ padding: '8px 4px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--label)', margin: '0 0 6px' }}>
        {t('Complete your Fit Ninja Profile')}
      </h3>
      <div className="muted small" style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--label-2)' }}>
        {t('Enter your athlete name to complete your membership setup.')}
      </div>
      <input
        ref={ref}
        className="input"
        placeholder={t('Your full athlete name')}
        maxLength={40}
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: '14px', fontSize: '15px' }}
      />
      <Button variant="primary" onClick={go} style={{ width: '100%', padding: '14px', fontWeight: '800' }}>
        {t('Complete Registration & Launch Client Onboarding')}
      </Button>
    </div>
  )
}

export default function Login() {
  const { user, setUser, setPaid } = useStore()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsVerifying(true)
    const { error } = await signInWithGoogle()
    if (error) {
      if (error.message?.includes('provider is not enabled') || error.error_code === 'validation_failed') {
        setShowSignInModal(true)
        useUI.getState().toast('Please enter your Gmail address below to verify and sign in.')
      } else {
        useUI.getState().toast('Google Sign In: ' + (error.message || 'Could not connect to Google'))
      }
      setIsVerifying(false)
    }
  }

  const handlePayment = () => {
    const activeEmail = (user?.email || memberEmail || '').trim().toLowerCase()
    const activeName = user?.name || ''
    openRazorpayCheckout({
      name: activeName || 'Fit Ninja Athlete',
      email: activeEmail,
      onSuccess: async (response) => {
        if (activeEmail) {
          try {
            await supabase.from('subscriptions').upsert({
              email: activeEmail,
              status: 'active',
              razorpay_payment_id: response.razorpay_payment_id || response.razorpay_subscription_id,
              updated_at: new Date().toISOString()
            })
          } catch (e) {
            console.warn('Supabase subscription record:', e)
          }
        }
        setUser({
          name: activeName || activeEmail.split('@')[0] || 'Athlete',
          email: activeEmail,
          paid: true,
          admin: ADMIN_LIST.includes(activeEmail) || activeEmail.endsWith('@socialninjas.in')
        })
        setPaid(true)
        useUI.getState().toast('Payment verified! Welcome to Fit Ninja Pro.')
        useUI.getState().openSheet(close => <RegisterSheet close={close} />)
      },
      onFailure: (msg) => {
        useUI.getState().toast(msg || 'Payment incomplete')
      }
    })
  }

  const handleMemberSignIn = async () => {
    const email = memberEmail.trim().toLowerCase()
    if (!email) {
      useUI.getState().toast('Please enter your registered email address')
      return
    }

    setIsVerifying(true)

    // Instant Admin & Whitelist verification (EXACT matches or company domain only)
    if (ADMIN_LIST.includes(email) || email.endsWith('@socialninjas.in')) {
      setUser({ name: email.split('@')[0] || 'Admin', email, paid: true, admin: true })
      setPaid(true)
      useUI.getState().toast('Admin verified! Welcome back.')
      setIsVerifying(false)
      return
    }

    try {
      const res = await verifyMemberEmail(email).catch(() => ({ verified: false }))
      if (res && res.verified) {
        setUser({ name: email.split('@')[0] || 'Athlete', email, paid: true, admin: res.role === 'admin' })
        setPaid(true)
        useUI.getState().toast('Subscription verified! Welcome to Fit Ninja Pro.')
        setIsVerifying(false)
        return
      }

      useUI.getState().toast('❌ ' + (res.error || 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninja.'))
    } catch (err) {
      useUI.getState().toast('❌ No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninja.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 16px 60px',
        maxWidth: '520px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {/* ── 1. LOGO & BRAND HERO ─────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '18px' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(37,99,235,0) 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
        <img
          src="/ninja-logo.png"
          alt="Fit Ninja Official Emblem"
          style={{
            position: 'relative',
            width: '92px',
            height: '92px',
            borderRadius: '26px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.5), 0 0 0 2px rgba(56,189,248,0.35)',
            zIndex: 1,
            display: 'block',
            margin: '0 auto',
            objectFit: 'cover'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.8px', margin: 0, color: '#ffffff' }}>
          Fit<span style={{ color: '#38bdf8' }}>Ninja</span>
        </h1>
        <span
          style={{
            background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '900',
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.6px',
            textTransform: 'uppercase'
          }}
        >
          PRO
        </span>
      </div>

      <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.8px', color: '#94a3b8', marginBottom: '24px' }}>
        BY SOCIAL NINJA'S · AI ATHLETE SYSTEM
      </div>

      {/* Authenticated Unpaid User Banner */}
      {user?.email && (
        <div
          style={{
            width: '100%',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              AUTHENTICATED WITH GOOGLE
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', wordBreak: 'break-all' }}>
              {user.email}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              ⚠️ Pro Pass required to unlock app
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUser(null)
              setPaid(false)
              try { supabase.auth.signOut() } catch (e) {}
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      {/* ── 2. PRO PASS VALUE COCKPIT CARD ───────────────────────── */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(165deg, rgba(15,23,42,0.95) 0%, rgba(10,15,30,0.98) 100%)',
          border: '1px solid rgba(56,189,248,0.35)',
          borderRadius: '24px',
          padding: '24px 20px',
          marginBottom: '20px',
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Offer Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span
            style={{
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.4)',
              color: '#38bdf8',
              fontSize: '10.5px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              padding: '4px 10px',
              borderRadius: '99px'
            }}
          >
            ⚡ ALL-ACCESS MEMBERSHIP
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', textDecoration: 'line-through', fontWeight: '600' }}>₹999</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>₹299</span>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600' }}>/mo</span>
            </div>
            <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: '800', marginTop: '1px' }}>
              Save 70% · Just ₹9.9 / day
            </div>
          </div>
        </div>

        {/* Feature Stack with High-Contrast Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '8px', padding: '5px', fontSize: '14px', lineHeight: 1 }}>🎬</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>1,324+ HD Video Exercise Guides</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Anatomical cues, technique videos, &amp; setup walkthroughs.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '8px', padding: '5px', fontSize: '14px', lineHeight: 1 }}>🧠</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Autonomous AI Coach &amp; Check-ins</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Adapts weight targets, reps &amp; calories based on weekly check-ins.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '8px', padding: '5px', fontSize: '14px', lineHeight: 1 }}>🥗</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Custom Diet Engine (Veg &amp; Non-Veg)</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>5-meal daily custom nutrition protocols with 25+ verified foods.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '8px', padding: '5px', fontSize: '14px', lineHeight: 1 }}>📊</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Anatomical Muscle Volume Heatmaps</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>3D fatigue tracking &amp; Greyskull LP progressive overload curves.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '8px', padding: '5px', fontSize: '14px', lineHeight: 1 }}>⏱️</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Distraction-Free Active Workout Player</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Live session HUD, tactile set steppers, &amp; adaptive rest timers.</div>
            </div>
          </div>
        </div>

        {/* Primary Checkout CTA */}
        <button
          onClick={handlePayment}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '900',
            width: '100%',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(37,99,235,0.5), inset 0 1px 1px rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '-0.2px',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>⚡ Unlock Fit Ninja Pro — ₹299/mo</span>
        </button>

        <div style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', marginTop: '10px', fontWeight: '600' }}>
          🔒 Instant 1-Click Activation via UPI, Cards, NetBanking · Cancel Anytime
        </div>
      </div>

      {/* ── 3. GOOGLE SIGN IN & MEMBER ACCESS ─────────────────────── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={handleGoogleSignIn}
          disabled={isVerifying}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 18px',
            color: '#0f172a',
            fontSize: '14.5px',
            fontWeight: '800',
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {!showSignInModal ? (
          <button
            type="button"
            onClick={() => setShowSignInModal(true)}
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '13px 18px',
              color: '#e2e8f0',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>🔑 Already a Paid Member? Verify &amp; Sign In</span>
          </button>
        ) : (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '18px',
              padding: '18px',
              textAlign: 'left',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>
              Verify Paid Membership
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
              Enter the email address used during Razorpay checkout or your registered athlete email.
            </div>
            <input
              className="input"
              placeholder="athlete@example.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleMemberSignIn() }}
              style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={handleMemberSignIn} disabled={isVerifying} style={{ flex: 1, padding: '10px', fontWeight: '800' }}>
                {isVerifying ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <Button variant="ghost" onClick={() => setShowSignInModal(false)} style={{ color: '#94a3b8' }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. TRUST & SECURITY BADGES ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔒 256-Bit SSL
        </span>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💳 Razorpay Verified
        </span>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⭐ 4.9/5 Rating
        </span>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10.5px', color: '#64748b', lineHeight: 1.4 }}>
        Cancel anytime in 1-click · Instant full-access unlock · Dedicated WhatsApp &amp; Email Support
      </div>
    </div>
  )
}
