import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyLogin, passkeyRegister, api, BIO } from '../lib/api.js'
import { hasData } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { useState, useRef, useEffect } from 'react'
import { Button } from '../components/ui.jsx'
import { openRazorpayCheckout } from '../lib/payment.js'

function RegisterSheet({ close }) {
  const { setUser, pushState, pullState, setPaid } = useStore()
  const [name, setName] = useState('')
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])

  const go = async () => {
    const n = name.trim()
    if (!n) { useUI.getState().toast(t('Enter a name')); return }
    try {
      const u = await passkeyRegister(n, '')
      setUser(u); close()
      if (hasData(useStore.getState().S)) { await pushState(); useUI.getState().toast(t('Profile created')) }
      else { await pullState(); useUI.getState().toast(t('Welcome, {0}', u.name)) }
    } catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') useUI.getState().toast(e.message || t('Registration failed')) }
  }

  return <>
    <h3>{t('Create your profile')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Pick a name, then confirm with {0}.', BIO)}</div>
    <input ref={ref} className="input" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={go}>{t('Create passkey')}</Button>
  </>
}

export default function Login() {
  const { setUser, pullState, setGuest, setPaid } = useStore()

  const handlePayment = () => {
    openRazorpayCheckout({
      onSuccess: () => {
        setPaid(true)
        setGuest(true)
        useUI.getState().toast('Payment successful! Welcome to Fit Ninjas Pro.')
      },
      onFailure: (msg) => {
        useUI.getState().toast(msg || 'Payment incomplete')
      }
    })
  }

  const signIn = async () => {
    try {
      const u = await passkeyLogin()
      setUser(u)
      await pullState()
      setPaid(true)
      useUI.getState().toast(t('Welcome back, {0}', u.name))
    } catch (e) {
      if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
        useUI.getState().toast(e.message || t('Sign-in failed'))
      }
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

      {/* Sign In Options for Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {webauthnOK() && (
          <>
            <Button variant="secondary" onClick={signIn}>{t('Sign in with existing account')}</Button>
            <Button variant="ghost" className="dim" onClick={() => useUI.getState().openSheet(close => <RegisterSheet close={close} />)}>{t('Create passkey profile')}</Button>
          </>
        )}
      </div>

      <div className="dim small" style={{ marginTop: 18, lineHeight: 1.5, fontSize: 11 }}>
        Cancel anytime · Instant access after checkout · Secure Razorpay Payments
      </div>
    </div>
  )
}
