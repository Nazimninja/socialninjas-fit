import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyLogin, passkeyRegister } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { useState, useRef, useEffect } from 'react'
import { Button } from '../components/ui.jsx'
import { openRazorpayCheckout } from '../lib/payment.js'

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
      useUI.getState().toast(t('Welcome, {0}', n))
    } catch (e) {
      setUser({ name: n })
      setPaid(true)
      close()
    }
  }

  return <>
    <h3>{t('Complete your Fit Ninjas Profile')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Enter your athlete name to complete your membership.')}</div>
    <input ref={ref} className="input" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={go}>{t('Complete Registration & Launch App')}</Button>
  </>
}

export default function Login() {
  const { setUser, setPaid } = useStore()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

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
      useUI.getState().toast('Please enter your registered email or phone')
      return
    }

    setIsVerifying(true)
    try {
      // Cross-check subscription with serverless endpoint
      const res = await fetch('/api/verify-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch(() => null)

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data && data.verified) {
          setUser({ name: email.split('@')[0] || 'Athlete', email, paid: true })
          setPaid(true)
          useUI.getState().toast('Subscription verified! Welcome back.')
          setIsVerifying(false)
          return
        }
      }

      // If API responds 403 / unverified: DO NOT allow login
      useUI.getState().toast('❌ No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.')
    } catch (err) {
      useUI.getState().toast('❌ No active Pro subscription found for this email.')
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

      {/* Sign In for Existing Paid Members */}
      {!showSignInModal ? (
        <Button variant="secondary" onClick={() => setShowSignInModal(true)}>
          🔑 Already a Paid Member? Verify &amp; Sign In
        </Button>
      ) : (
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Verify Pro Subscription</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Enter the email address associated with your Razorpay payment.</div>
          <input
            className="input"
            placeholder="Enter your registered email address"
            value={memberEmail}
            onChange={e => setMemberEmail(e.target.value)}
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

      <div className="dim small" style={{ marginTop: 18, lineHeight: 1.5, fontSize: 11 }}>
        Cancel anytime · Instant access after checkout · Secure Razorpay Payments
      </div>
    </div>
  )
}
