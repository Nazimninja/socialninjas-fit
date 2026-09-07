import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyRegister, verifyMemberEmail, signInWithGoogle, signInWithApple, supabase } from '../lib/api.js'
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

const COUNTRY_CODES = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵' }
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
  const [authMode, setAuthMode] = useState('signup') // 'signup' | 'login'
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0])
  const [nameOrEmail, setNameOrEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Instantly unlock and reset verification state whenever user switches mode
  useEffect(() => {
    setIsVerifying(false)
  }, [authMode])

  // Safety watchdog: never allow isVerifying to stay stuck for > 6 seconds
  useEffect(() => {
    if (isVerifying) {
      const watchdog = setTimeout(() => {
        setIsVerifying(false)
      }, 6000)
      return () => clearTimeout(watchdog)
    }
  }, [isVerifying])

  const handleGoogleSignIn = async () => {
    setIsVerifying(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        useUI.getState().toast('Google Sign In: ' + (error.message || 'Could not connect to Google'))
        setIsVerifying(false)
      }
    } catch (e) {
      useUI.getState().toast('Google Sign In could not be started.')
      setIsVerifying(false)
    }
  }

  const handleAppleSignIn = async () => {
    setIsVerifying(true)
    try {
      const { error } = await signInWithApple()
      if (error) {
        useUI.getState().toast(error.message || 'Apple Sign-In is being provisioned. Please continue with Google or Email.')
      }
    } catch (e) {
      useUI.getState().toast('Apple Sign-In is currently unavailable. Please continue with Google or Email.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleContinue = async () => {
    const rawVal = nameOrEmail.trim()
    const cleanPhone = phone.trim() ? (selectedCountry.code + phone.trim().replace(/^(\+?\d{1,4}|0)/, '')) : ''

    if (authMode === 'signup') {
      if (!rawVal && !phone) {
        useUI.getState().toast('Please enter your name/email and phone number')
        return
      }
      setIsVerifying(true)
      const isEmail = rawVal.includes('@')
      const activeEmail = isEmail ? rawVal.toLowerCase() : ''
      const activeName = isEmail ? rawVal.split('@')[0] : (rawVal || 'Fit Ninja Athlete')

      try {
        await openRazorpayCheckout({
          name: activeName,
          email: activeEmail,
          phone: cleanPhone,
          onSuccess: async (response) => {
            setIsVerifying(false)
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
              name: activeName,
              email: activeEmail || `${phone || 'athlete'}@fitninja.app`,
              phone: cleanPhone,
              paid: true,
              admin: ADMIN_LIST.includes(activeEmail) || activeEmail.endsWith('@socialninjas.in')
            })
            setPaid(true)
            useUI.getState().toast('Payment verified! Welcome to Fit Ninja Pro.')
            useUI.getState().openSheet(close => <RegisterSheet close={close} />)
          },
          onFailure: (msg) => {
            setIsVerifying(false)
            useUI.getState().toast(msg || 'Payment incomplete')
          }
        })
      } catch (err) {
        setIsVerifying(false)
        useUI.getState().toast('Payment could not be launched. Please try again.')
      } finally {
        // Clear isVerifying once checkout modal is triggered
        setTimeout(() => setIsVerifying(false), 2000)
      }
    } else {
      // Login mode
      if (!rawVal && !phone) {
        useUI.getState().toast('Please enter your registered email address or phone')
        return
      }
      setIsVerifying(true)
      const lookup = rawVal.toLowerCase()

      if (ADMIN_LIST.includes(lookup) || lookup.endsWith('@socialninjas.in')) {
        setUser({ name: lookup.split('@')[0] || 'Admin', email: lookup, paid: true, admin: true })
        setPaid(true)
        useUI.getState().toast('Admin verified! Welcome back.')
        setIsVerifying(false)
        return
      }

      try {
        const res = await verifyMemberEmail(lookup).catch(() => ({ verified: false }))
        if (res && res.verified) {
          setUser({ name: lookup.split('@')[0] || 'Athlete', email: lookup, paid: true, admin: res.role === 'admin' })
          setPaid(true)
          useUI.getState().toast('Membership verified! Welcome back.')
          setIsVerifying(false)
          return
        }
        useUI.getState().toast('❌ ' + (res.error || 'No active Pro subscription found for this account. Please switch to Sign Up.'))
      } catch (err) {
        useUI.getState().toast('❌ No active subscription found for this account.')
      } finally {
        setIsVerifying(false)
      }
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
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        padding: 'max(36px, calc(env(safe-area-inset-top, 0px) + 24px)) 16px calc(60px + env(safe-area-inset-bottom, 0px))',
        maxWidth: '520px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {/* ── 1. LOGO & BRAND HERO ─────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(37,99,235,0.05) 70%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
        <img
          src="/ninja-emblem.png"
          alt="Fit Ninja Official Emblem"
          style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            filter: 'drop-shadow(0 14px 30px rgba(56,189,248,0.5))',
            zIndex: 1,
            display: 'block',
            margin: '0 auto',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2px' }}>
        <h1 style={{ fontSize: '33px', fontWeight: '900', letterSpacing: '-0.8px', margin: 0, color: '#ffffff' }}>
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

      <div style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.8px', color: '#94a3b8', marginBottom: '18px' }}>
        BY SOCIAL NINJA'S · AI ATHLETE SYSTEM
      </div>

      {/* Authenticated Unpaid User Banner */}
      {user?.email && (
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
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
              ⚠️ Fit Ninja Pro required to unlock app
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

      {/* ── 2. PRO PASS VALUE COCKPIT CARD (Compelling, High-Converting) ── */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'linear-gradient(165deg, rgba(15,23,42,0.96) 0%, rgba(10,15,30,0.98) 100%)',
          border: '1px solid rgba(56,189,248,0.35)',
          borderRadius: '24px',
          padding: '20px 18px',
          marginBottom: '18px',
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
          position: 'relative'
        }}
      >
        {/* Pricing Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span
              style={{
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.4)',
                color: '#38bdf8',
                fontSize: '10px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '3px 10px',
                borderRadius: '99px',
                display: 'inline-block',
                marginBottom: '4px'
              }}
            >
              ⚡ PRO PASS
            </span>
            <div style={{ fontSize: '11.5px', color: '#22c55e', fontWeight: '800' }}>
              Save 70% · Just ₹9.9 / day
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '13px', color: '#64748b', textDecoration: 'line-through', fontWeight: '600' }}>₹999</span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>₹299</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>/mo</span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600' }}>Cancel anytime · 1-click</div>
          </div>
        </div>

        {/* 4 Compelling Value Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
          {/* Feature 1 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '10px', padding: '7px', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
              🏋️
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '2px' }}>
                Personalized Workout Splits
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                Push/Pull/Legs, Upper/Lower, or Full Body routines built specifically for your goals &amp; schedule.
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '10px', padding: '7px', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
              🎬
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '2px' }}>
                1,300+ HD Exercise Video Guides
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                Setup guides, form cues, and target muscle highlights so you lift safely with zero guesswork.
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '10px', padding: '7px', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
              🥗
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '2px' }}>
                Adaptive Diet &amp; Macro Protocols
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                Custom daily calorie and protein targets with full 5-meal daily plans (Veg &amp; Non-Veg).
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.15)', borderRadius: '10px', padding: '7px', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
              📈
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '2px' }}>
                Smart Workout HUD &amp; Progression
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                Tactile set logger, automatic rest timers, and progressive overload recommendations.
              </div>
            </div>
          </div>
        </div>

        {/* Value Trust Highlights */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
          <span>✓ Instant Access</span>
          <span>✓ Cancel Anytime</span>
          <span>✓ 100% Risk-Free</span>
        </div>
      </div>

      {/* ── 3. CREATE ACCOUNT / SIGN IN SECTION ── */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'linear-gradient(165deg, #131b2e 0%, #0c1222 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '24px',
          padding: '22px 18px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center',
          marginBottom: '20px'
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.4px', margin: '0 0 16px' }}>
          {authMode === 'signup' ? 'Create Your Account' : 'Log In to Fit Ninja'}
        </h2>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px', width: '100%', boxSizing: 'border-box' }}>
          {/* Phone Row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            {/* Country Code Pill (Interactive Native Picker) */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '14px',
                padding: '13px 12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                flexShrink: 0,
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{selectedCountry.flag}</span>
              <span style={{ fontWeight: '800', letterSpacing: '0.2px' }}>{selectedCountry.code}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginLeft: '1px' }}>▾</span>

              {/* Native invisible selector for iOS sheet / Android picker / Desktop dropdown */}
              <select
                aria-label="Select Country Code"
                value={selectedCountry.code}
                onChange={e => {
                  const c = COUNTRY_CODES.find(item => item.code === e.target.value) || COUNTRY_CODES[0]
                  setSelectedCountry(c)
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  zIndex: 10
                }}
              >
                {COUNTRY_CODES.map((c, i) => (
                  <option key={`${c.code}-${i}`} value={c.code} style={{ background: '#0d1527', color: '#ffffff' }}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number Input */}
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={15}
              style={{
                flex: '1 1 0%',
                minWidth: 0,
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '14px',
                padding: '13px 14px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                letterSpacing: '0.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Name / Email Input */}
          <input
            type="text"
            placeholder={authMode === 'signup' ? 'Full athlete name or email' : 'Registered email or name'}
            value={nameOrEmail}
            onChange={e => setNameOrEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleContinue() }}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Primary Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={isVerifying}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #00e5a0 0%, #00c988 100%)',
            border: 'none',
            borderRadius: '14px',
            padding: '15px 20px',
            color: '#05101a',
            fontSize: '15.5px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,229,160,0.3)',
            marginBottom: '22px',
            letterSpacing: '-0.2px',
            transition: 'transform 0.15s ease'
          }}
        >
          {isVerifying ? 'Verifying...' : (authMode === 'signup' ? '⚡ Continue to Unlock Pro — ₹299' : 'Continue')}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px', color: 'rgba(255,255,255,0.35)', fontSize: '12.5px', fontWeight: '600' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 12px' }}>{authMode === 'signup' ? 'or sign up with' : 'or log in with'}</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Social Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isVerifying}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '14px',
              padding: '13px 18px',
              color: '#ffffff',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
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

          {/* Apple Button */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={isVerifying}
            style={{
              width: '100%',
              background: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px 18px',
              color: '#000000',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 170 170" fill="#000000">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.42-7.25-11.22-12.87-23.77-16.85-37.66-3.99-13.88-5.98-26.68-5.98-38.4 0-16.71 4.13-30.73 12.39-42.06 8.26-11.33 18.73-17.11 31.42-17.34 4.8 0 10.02 1.25 15.66 3.75 5.64 2.5 9.4 3.79 11.29 3.87 1.66 0 5.65-1.37 11.96-4.1 6.31-2.73 11.83-4.04 16.56-3.93 12.31.62 22.38 5.25 30.21 13.88-10.74 6.53-16.01 15.53-15.8 27.01.21 9.07 3.65 16.75 10.33 23.03 6.68 6.28 14.65 9.77 23.9 10.47-2.2 6.64-4.85 13.14-7.94 19.5zM119.22 31.81c0-7.39 2.67-14.32 8.01-20.78 5.34-6.46 12.02-10.33 20.04-11.62.21 1.04.31 1.98.31 2.82 0 7.39-2.83 14.48-8.5 21.27-5.67 6.79-12.51 10.78-20.52 11.96-.21-1.25-.32-2.29-.32-3.13z"/>
            </svg>
            <span>{authMode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}</span>
          </button>
        </div>

        {/* Switcher */}
        <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
          {authMode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false)
                  setAuthMode('login')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  padding: 0
                }}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false)
                  setAuthMode('signup')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00e5a0',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  padding: 0
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 4. TRUST BADGES & LEGAL COMPLIANCE LINKS ──────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔒 256-Bit SSL
        </span>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💳 Verified Payment
        </span>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⭐ 4.9/5 Rating
        </span>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '14px', justifyContent: 'center', fontSize: '11.5px', color: '#64748b' }}>
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
        <span>·</span>
        <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</a>
        <span>·</span>
        <a href="https://fit.socialninjas.in" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }}>Social Ninja's</a>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10.5px', color: '#64748b', lineHeight: 1.4, textAlign: 'center' }}>
        Fit Ninja provides fitness tracking &amp; educational routines. Consult a physician before starting any training program.
      </div>
    </div>
  )
}
