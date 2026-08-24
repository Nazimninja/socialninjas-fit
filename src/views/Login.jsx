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
      onboardingWizardSheet()
    } catch (e) {
      setUser({ name: n })
      setPaid(true)
      close()
      onboardingWizardSheet()
    }
  }

  return <>
    <h3>{t('Complete your Fit Ninjas Profile')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Enter your athlete name to complete your membership.')}</div>
    <input ref={ref} className="input" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={go}>{t('Complete Registration & Launch Client Onboarding')}</Button>
  </>
}

export default function Login() {
  const { setUser, setPaid } = useStore()
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
    openRazorpayCheckout({
      onSuccess: () => {
        setPaid(true)
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

    // Instant Admin & Whitelist verification (Zero network overhead)
    if (ADMIN_LIST.includes(email) || email.endsWith('@socialninjas.in') || email.includes('socialninja')) {
      try { localStorage.setItem('gym_paid_email', email) } catch (e) {}
      setUser({ name: email.split('@')[0] || 'Admin', email, paid: true, admin: true })
      setPaid(true)
      useUI.getState().toast('Admin verified! Welcome back.')
      setIsVerifying(false)
      return
    }

    try {
      const res = await verifyMemberEmail(email).catch(() => ({ verified: false }))
      if (res && res.verified) {
        try { localStorage.setItem('gym_paid_email', email) } catch (e) {}
        setUser({ name: email.split('@')[0] || 'Athlete', email, paid: true, admin: res.role === 'admin' })
        setPaid(true)
        useUI.getState().toast('Subscription verified! Welcome to Fit Ninjas Pro.')
        setIsVerifying(false)
        return
      }

      useUI.getState().toast('❌ ' + (res.error || 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.'))
    } catch (err) {
      useUI.getState().toast('❌ No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.')
    } finally {
      setIsVerifying(false)
    }
  }

  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '82vh', textAlign: 'center' }

  return (
    <div className="narrow" style={wrap}>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-.03em', margin: '0 0 2px', color: '#fff' }}>
        Fit<span style={{ color: '#38bdf8' }}>Ninjas</span>
      </h1>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94a3b8', marginBottom: 20 }}>
        BY SOCIAL NINJA'S
      </div>

      {/* Plan Card */}
      <div style={{ background: '#0f172a', border: '1px solid rgba(37,99,235,0.4)', borderRadius: 20, padding: '24px 20px', marginBottom: 20, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Fit Ninjas Pro Pass</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>₹299 <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>/ month</span></span>
        </div>

        <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6, display: 'grid', gap: 6, marginBottom: 18 }}>
          <div>✓ 1,324+ Animated Video Exercise Demos</div>
          <div>✓ Guided Workout Player &amp; Smart Rest Timers</div>
          <div>✓ Anatomical Muscle Volume Heatmaps</div>
          <div>✓ AI Macro &amp; Nutrition Engine (Veg &amp; Non-Veg)</div>
          <div>✓ Greyskull LP Progressive Overload Trackers</div>
        </div>

        <button
          onClick={handlePayment}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '800',
            width: '100%',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>⚡ Subscribe &amp; Unlock App — ₹299/mo</span>
        </button>
      </div>

      {/* Google Sign In & Paid Member Verification */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleGoogleSignIn}
          disabled={isVerifying}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '700',
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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
          <Button variant="secondary" onClick={() => setShowSignInModal(true)}>
            🔑 Already a Paid Member? Verify &amp; Sign In
          </Button>
        ) : (
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Verify Pro Subscription</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Enter the email address associated with your Razorpay payment or admin account.</div>
          <input
            className="input"
            placeholder="Enter your registered email address"
            value={memberEmail}
            onChange={e => setMemberEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleMemberSignIn() }}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" onClick={handleMemberSignIn} disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify Subscription & Sign In'}
            </Button>
            <Button variant="ghost" onClick={() => setShowSignInModal(false)}>Cancel</Button>
          </div>
        </div>
      )}
      </div>

      <div className="dim small" style={{ marginTop: 18, lineHeight: 1.5, fontSize: 11 }}>
        Cancel anytime · Instant access after checkout · Secure Razorpay Payments
      </div>
    </div>
  )
}
