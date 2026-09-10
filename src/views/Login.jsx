import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyRegister, verifyMemberEmail, signInWithGoogle, signInWithApple, supabase, IS_APPLE, VERIFIED_PAID_MEMBERS } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { openRazorpayCheckout, RAZORPAY_PAYMENT_LINK, getPrefilledPaymentLink } from '../lib/payment.jsx'

import { onboardingWizardSheet } from '../sheets.jsx'
import { openInstallSheet } from '../components/PWAInstallPrompt.jsx'

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
  const navigate = useNavigate()
  const { user, setUser, setPaid } = useStore()
  const getInitialAuthMode = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '')
      const m = (searchParams.get('mode') || hashParams.get('mode') || '').toLowerCase()
      if (m === 'login') return 'login'
      if (m === 'signup' || m === 'transform') return 'signup'
    } catch (e) {}
    return 'signup'
  }

  const [authMode, setAuthMode] = useState(getInitialAuthMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0])
  const [loginIdentity, setLoginIdentity] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isBannerVerifying, setIsBannerVerifying] = useState(false)

  // Auto-fill from URL parameters if provided (e.g. ?name=Asiya%20Sayed&phone=8892587979&mode=login)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '')
      const p = searchParams.get('phone') || hashParams.get('phone')
      const n = searchParams.get('name') || hashParams.get('name')
      const em = searchParams.get('email') || hashParams.get('email')
      const m = (searchParams.get('mode') || hashParams.get('mode') || '').toLowerCase()
      if (p) {
        setPhone(p)
        setLoginIdentity(p)
      }
      if (n) setName(n)
      if (em) {
        setEmail(em)
        setLoginIdentity(em)
      }
      if (m === 'login') {
        setAuthMode('login')
      } else if (m === 'signup' || m === 'transform') {
        setAuthMode('signup')
      } else if (m === 'app') {
        const existingEmail = user?.email || localStorage.getItem('gym_paid_email')
        if (existingEmail) {
          window.location.hash = '#/home'
        }
      }
    } catch (e) {}
  }, [user?.email])

  // Instantly unlock and reset verification state whenever user switches mode
  useEffect(() => {
    setIsVerifying(false)
  }, [authMode])

  // Auto-verify if authenticated user has an active membership (e.g. after returning from Razorpay payment or Google OAuth)
  useEffect(() => {
    const checkStatus = async () => {
      const target = (user?.email || localStorage.getItem('gym_paid_email') || '').toLowerCase().trim()
      if (target) {
        if (VERIFIED_PAID_MEMBERS.includes(target) || ADMIN_LIST.includes(target) || target.endsWith('@socialninjas.in')) {
          setUser({ ...(user || {}), name: user?.name || target.split('@')[0], email: target, paid: true, admin: ADMIN_LIST.includes(target) })
          setPaid(true)
          navigate('/home', { replace: true })
          window.location.hash = '#/home'
          return
        }
        try {
          const res = await verifyMemberEmail(target).catch(() => ({ verified: false }))
          if (res && res.verified) {
            setUser({ ...(user || {}), name: user?.name || target.split('@')[0], email: target, paid: true, admin: res.role === 'admin' })
            setPaid(true)
            sessionStorage.setItem('fn_just_paid', '1')
            useUI.getState().toast('⚡ Pro Pass Active! Welcome to Fit Ninja.')
            navigate('/home', { replace: true })
            window.location.hash = '#/home'
          }
        } catch (e) {}
      }
    }

    checkStatus()
    window.addEventListener('focus', checkStatus)
    const onVis = () => {
      if (document.visibilityState === 'visible') checkStatus()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', checkStatus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user?.email, navigate])

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setIsVerifying(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        useUI.getState().toast('Google Sign In: ' + (error.message || 'Could not connect to Google'))
        setIsVerifying(false)
        setIsGoogleLoading(false)
      }
    } catch (e) {
      useUI.getState().toast('Google Sign In could not be started.')
      setIsVerifying(false)
      setIsGoogleLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setIsVerifying(true)
    try {
      const { error } = await Promise.race([
        signInWithApple(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]).catch(() => ({ error: { message: 'Apple Sign-In is being provisioned for App Store release. Please continue with Google or your Phone/Email.' } }))

      if (error) {
        useUI.getState().toast(error.message || 'Apple Sign-In is being provisioned for App Store release. Please continue with Google or Phone/Email.')
      }
    } catch (e) {
      useUI.getState().toast('Apple Sign-In is being provisioned for App Store release. Please continue with Google or Phone/Email.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleContinue = async () => {
    let digits = phone.trim().replace(/\D/g, '')
    const cCode = selectedCountry.code.replace('+', '')
    if (digits.startsWith(cCode) && digits.length > 10) {
      digits = digits.slice(cCode.length)
    } else if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '')
    }
    const cleanPhone = digits ? `${selectedCountry.code}${digits}` : ''

    if (authMode === 'signup') {
      const activeEmail = email.trim().toLowerCase()
      const activeName = name.trim() || (activeEmail ? activeEmail.split('@')[0] : 'Fit Ninja Athlete')

      if (!activeEmail && !cleanPhone) {
        useUI.getState().toast('Please enter your email or phone number')
        return
      }

      if (activeEmail && !activeEmail.includes('@')) {
        useUI.getState().toast('Please enter a valid email address')
        return
      }

      setIsVerifying(true)

      // Check if user is already a paid member before initiating checkout
      const candidateEmail = activeEmail || (user?.email ? user.email.toLowerCase().trim() : '')
      if (candidateEmail) {
        try {
          const existing = await verifyMemberEmail(candidateEmail).catch(() => ({ verified: false }))
          if (existing && existing.verified) {
            setUser({ ...(user || {}), name: activeName || candidateEmail.split('@')[0], email: candidateEmail, paid: true })
            setPaid(true)
            useUI.getState().toast('⚡ Pro Pass Active! Welcome to Fit Ninja.')
            setIsVerifying(false)
            navigate('/home', { replace: true })
            window.location.hash = '#/home'
            return
          }
        } catch (e) {}
      }

      try {
        await openRazorpayCheckout({
          name: activeName,
          email: activeEmail,
          phone: cleanPhone,
          onSuccess: async (response) => {
            setIsVerifying(false)
            if (activeEmail || cleanPhone) {
              const memTopic = (activeEmail || cleanPhone).toLowerCase()
              const paymentPayload = {
                profile: 'fitninja_membership',
                topic: memTopic,
                section1: JSON.stringify({
                  email: activeEmail,
                  name: activeName,
                  phone: cleanPhone,
                  paid: true,
                  status: 'active',
                  razorpay_payment_id: response.razorpay_payment_id || response.razorpay_subscription_id,
                  created_at: new Date().toISOString()
                }),
                caption: 'active'
              }

              try {
                // Upsert to Supabase scripts table
                const { data: existingMem } = await supabase
                  .from('scripts')
                  .select('id')
                  .eq('profile', 'fitninja_membership')
                  .eq('topic', memTopic)
                  .limit(1)

                if (existingMem && existingMem.length > 0) {
                  await supabase.from('scripts').update(paymentPayload).eq('id', existingMem[0].id)
                } else {
                  await supabase.from('scripts').insert([paymentPayload])
                }

                // Also record in agency CRM leads table
                await supabase.from('leads').insert([{
                  name: activeName,
                  email: activeEmail || `${cleanPhone}@fitninja.app`,
                  phone: cleanPhone,
                  status: 'PAID PRO MEMBER',
                  notes: 'Razorpay payment verified: ' + (response.razorpay_payment_id || 'success')
                }]).catch(() => {})
              } catch (e) {
                console.warn('Supabase membership recording error:', e)
              }

              // Instant dispatch to n8n webhook for automated WhatsApp Welcome & App Install Guide
              try {
                const n8nWebhookUrl = 'https://n8n-production-29f31.up.railway.app/webhook/fitninja-welcome'
                fetch(n8nWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'member.onboarded',
                    name: activeName || 'Athlete',
                    phone: cleanPhone || '',
                    contact: cleanPhone || '',
                    phone_number: cleanPhone || '',
                    whatsapp: cleanPhone || '',
                    mobile: cleanPhone || '',
                    digits_phone: (cleanPhone || '').replace(/\D/g, ''),
                    email: activeEmail || '',
                    amount: 399,
                    subscriptionId: response.razorpay_payment_id || response.razorpay_subscription_id || 'sub_manual',
                    razorpay_payment_id: response.razorpay_payment_id || '',
                    plan: 'Fit Ninja Pro',
                    source: 'client_razorpay_success',
                    timestamp: new Date().toISOString()
                  })
                }).catch(n8nErr => console.warn('Failed to forward to n8n welcome webhook:', n8nErr))
              } catch (nErr) {}
            }
            setUser({
              name: activeName,
              email: activeEmail || `${phone || 'athlete'}@fitninja.app`,
              phone: cleanPhone,
              paid: true,
              admin: ADMIN_LIST.includes(activeEmail) || activeEmail.endsWith('@socialninjas.in')
            })
            setPaid(true)
            sessionStorage.setItem('fn_just_paid', '1')
            window.location.hash = '#/home'
            onboardingWizardSheet()
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
      // Login mode - checks loginIdentity (email/text), cleanPhone (with country code), phone, or authenticated user email
      const lookup = (loginIdentity || cleanPhone || phone || user?.email || '').toLowerCase().trim()
      if (!lookup) {
        useUI.getState().toast('Please enter your registered email address or phone')
        return
      }
      setIsVerifying(true)

      if (ADMIN_LIST.includes(lookup) || lookup.endsWith('@socialninjas.in') || VERIFIED_PAID_MEMBERS.includes(lookup)) {
        const isAdmin = ADMIN_LIST.includes(lookup) || lookup.endsWith('@socialninjas.in')
        setUser({ name: lookup.split('@')[0] || 'Athlete', email: lookup, paid: true, admin: isAdmin })
        setPaid(true)
        useUI.getState().toast(isAdmin ? 'Admin verified! Welcome back.' : '⚡ Membership verified! Welcome back.')
        setIsVerifying(false)
        navigate('/home', { replace: true })
        window.location.hash = '#/home'
        return
      }

      try {
        const res = await verifyMemberEmail(lookup).catch(() => ({ verified: false }))
        if (res && res.verified) {
          const finalEmail = res.email || lookup
          setUser({ name: finalEmail.split('@')[0] || 'Athlete', email: finalEmail, paid: true, admin: res.role === 'admin' })
          setPaid(true)
          useUI.getState().toast('⚡ Membership verified! Welcome back.')
          setIsVerifying(false)
          navigate('/home', { replace: true })
          window.location.hash = '#/home'
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
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
        maxWidth: '460px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {/* ── TOP NAV: BACK TO HOME & STATUS BADGE ───────────────── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          <span>←</span>
          <span>Back to Home</span>
        </a>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#38bdf8',
          fontWeight: '800',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '4px 10px',
          borderRadius: '99px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
          <span>Fit Ninja Pro</span>
        </div>
      </div>

      {/* ── 1. LOGO & BRAND HERO ─────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '6px' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70px',
            height: '70px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(2,132,199,0.05) 55%, transparent 75%)',
            filter: 'blur(14px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
        <img
          src="/ninja-emblem.png?v=20"
          alt="Fit Ninja"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '46px',
            height: '46px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(56,189,248,0.4))',
            display: 'block',
            margin: '0 auto'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.03em', margin: 0, color: '#ffffff' }}>
          Fit<span style={{ color: '#38bdf8' }}>Ninja</span>
        </h1>
      </div>

      <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '14px' }}>
        {authMode === 'signup' ? 'Start your high-performance transformation' : 'Access your active workout engine'}
      </div>

      {/* Authenticated Unpaid User Banner */}
      {user?.email && (
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              AUTHENTICATED
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff', wordBreak: 'break-all' }}>
              {user.email}
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
              ⚠️ Fit Ninja Pro pass required to unlock full access
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={isBannerVerifying}
              onClick={async () => {
                setIsBannerVerifying(true)
                try {
                  const targetEmail = (user?.email || '').toLowerCase().trim()
                  if (VERIFIED_PAID_MEMBERS.includes(targetEmail) || ADMIN_LIST.includes(targetEmail) || targetEmail.endsWith('@socialninjas.in')) {
                    const isAdmin = ADMIN_LIST.includes(targetEmail) || targetEmail.endsWith('@socialninjas.in')
                    setUser({ ...user, paid: true, admin: isAdmin })
                    setPaid(true)
                    useUI.getState().toast('⚡ Access Verified! Welcome to Pro.')
                    navigate('/home', { replace: true })
                    window.location.hash = '#/home'
                    return
                  }
                  const res = await verifyMemberEmail(targetEmail)
                  if (res && res.verified) {
                    setUser({ ...user, paid: true, admin: res.role === 'admin' })
                    setPaid(true)
                    useUI.getState().toast('⚡ Access Verified! Welcome to Pro.')
                    navigate('/home', { replace: true })
                    window.location.hash = '#/home'
                    return
                  }
                  useUI.getState().toast('Subscription still pending. Please try again shortly.')
                } catch (e) {
                  useUI.getState().toast('Verification check error')
                } finally {
                  setIsBannerVerifying(false)
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                border: 'none',
                color: '#031024',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: isBannerVerifying ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {isBannerVerifying ? (
                <>
                  <svg className="fn-spin" style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Checking...</span>
                </>
              ) : (
                'Verify Access ↗'
              )}
            </button>
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
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── 2. SEGMENTED MODE SWITCHER ────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '999px',
          padding: '4px',
          width: '100%',
          maxWidth: '380px',
          boxSizing: 'border-box',
          marginBottom: '16px',
          backdropFilter: 'blur(8px)'
        }}
      >
        <button
          type="button"
          onClick={() => { setIsVerifying(false); setAuthMode('signup') }}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '999px',
            border: authMode === 'signup' ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
            background: authMode === 'signup' ? 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(2,132,199,0.18) 100%)' : 'transparent',
            color: authMode === 'signup' ? '#ffffff' : '#94a3b8',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>⚡</span> Start Transformation
        </button>
        <button
          type="button"
          onClick={() => { setIsVerifying(false); setAuthMode('login') }}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '999px',
            border: authMode === 'login' ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            background: authMode === 'login' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: authMode === 'login' ? '#ffffff' : '#94a3b8',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          Member Login
        </button>
      </div>

      {/* ── 3. UNIFIED ACTION CARD ────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'radial-gradient(120% 120% at 50% 0%, rgba(15, 23, 42, 0.95) 0%, rgba(7, 10, 19, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 0 rgba(56, 189, 248, 0.35), 0 20px 50px rgba(0,0,0,0.6)',
          borderRadius: '24px',
          padding: '22px 18px',
          textAlign: 'center',
          marginBottom: '14px'
        }}
      >
        {authMode === 'signup' ? (
          <>
            {/* Integrated Pricing & Value Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                marginBottom: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    background: 'rgba(56,189,248,0.14)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    color: '#38bdf8',
                    fontSize: '9.5px',
                    fontWeight: '900',
                    letterSpacing: '0.6px',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    ⚡ FIT NINJA PRO
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600' }}>
                  Unlimited access · Cancel anytime
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', textDecoration: 'line-through' }}>₹999</span>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>₹399</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>/mo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: '700' }}>
                    Just ₹13/day
                  </span>
                  <span style={{
                    background: 'rgba(56,189,248,0.14)',
                    color: '#38bdf8',
                    fontSize: '9px',
                    fontWeight: '800',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    SAVE 60%
                  </span>
                </div>
              </div>
            </div>

            {/* Convincing Pro Benefits List (No Clunky Boxes!) */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '900',
                color: '#38bdf8',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>✨ WHAT YOU UNLOCK</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>100% Risk-Free</span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {[
                  { title: '1,324+ HD Video Form Guides', desc: 'Looping 60fps cues for every single lift' },
                  { title: 'Smart Rest Timers & Audio Cues', desc: 'Interval countdown beeps keep your tempo sharp' },
                  { title: 'Muscle Recovery Heatmaps', desc: 'Real-time anatomical front & back fatigue tracking' },
                  { title: 'Greyskull LP Overload Engine', desc: 'Auto-computes your target weights next session' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px'
                    }}>
                      <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: '900', lineHeight: 1 }}>✓</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff', lineHeight: 1.25 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', lineHeight: 1.3 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-ROI Comparison Pill */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.14)',
              borderRadius: '11px',
              padding: '8px 12px',
              marginBottom: '16px',
              fontSize: '11.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span style={{ color: '#38bdf8', fontSize: '12px' }}>⚡</span>
              <span>Average Gym Trainer: <strong style={{ color: '#cbd5e1', textDecoration: 'line-through' }}>₹5,000/mo</strong> · Pro: <strong style={{ color: '#38bdf8' }}>₹13/day</strong></span>
            </div>

            {/* Clear, Unambiguous Input Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Phone Row */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{selectedCountry.flag}</span>
                  <span style={{ fontWeight: '800' }}>{selectedCountry.code}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>▾</span>

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

                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={15}
                  style={{
                    flex: '1 1 0%',
                    minWidth: 0,
                    width: '100%',
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    letterSpacing: '0.3px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isVerifying}
              style={{
                width: '100%',
                background: isVerifying && !isGoogleLoading
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 18px',
                color: '#031024',
                fontSize: '15px',
                fontWeight: '900',
                letterSpacing: '-0.2px',
                cursor: isVerifying ? 'wait' : 'pointer',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
                marginBottom: '10px',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isVerifying && !isGoogleLoading ? (
                <>
                  <svg className="fn-spin" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#031024" strokeWidth="4" strokeOpacity="0.25" />
                    <path fill="#031024" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Opening Checkout…</span>
                </>
              ) : (
                '⚡ Start Transformation · ₹399'
              )}
            </button>
          </>
        ) : (
          /* Member Login Mode */
          <>
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', marginBottom: '4px' }}>
                Welcome Back
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Enter your registered email or phone to access your workouts.
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Registered Email or Mobile Number"
                value={loginIdentity}
                onChange={e => setLoginIdentity(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleContinue() }}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '13px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={isVerifying}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 18px',
                color: '#031024',
                fontSize: '15px',
                fontWeight: '900',
                cursor: isVerifying ? 'wait' : 'pointer',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isVerifying && !isGoogleLoading ? (
                <>
                  <svg className="fn-spin" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#031024" strokeWidth="4" strokeOpacity="0.25" />
                    <path fill="#031024" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying Account…</span>
                </>
              ) : (
                'Continue to App →'
              )}
            </button>
          </>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 12px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '600' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ padding: '0 10px' }}>{authMode === 'signup' ? 'or 1-tap sign up with' : 'or log in with'}</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isVerifying}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '11px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: isVerifying ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isGoogleLoading ? (
              <span>Connecting…</span>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {IS_APPLE && (
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isVerifying}
              style={{
                flex: 1,
                background: '#ffffff',
                border: 'none',
                borderRadius: '11px',
                padding: '10px 14px',
                color: '#000000',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 170 170" fill="#000000">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.42-7.25-11.22-12.87-23.77-16.85-37.66-3.99-13.88-5.98-26.68-5.98-38.4 0-16.71 4.13-30.73 12.39-42.06 8.26-11.33 18.73-17.11 31.42-17.34 4.8 0 10.02 1.25 15.66 3.75 5.64 2.5 9.4 3.79 11.29 3.87 1.66 0 5.65-1.37 11.96-4.1 6.31-2.73 11.83-4.04 16.56-3.93 12.31.62 22.38 5.25 30.21 13.88-10.74 6.53-16.01 15.53-15.8 27.01.21 9.07 3.65 16.75 10.33 23.03 6.68 6.28 14.65 9.77 23.9 10.47-2.2 6.64-4.85 13.14-7.94 19.5zM119.22 31.81c0-7.39 2.67-14.32 8.01-20.78 5.34-6.46 12.02-10.33 20.04-11.62.21 1.04.31 1.98.31 2.82 0 7.39-2.83 14.48-8.5 21.27-5.67 6.79-12.51 10.78-20.52 11.96-.21-1.25-.32-2.29-.32-3.13z"/>
              </svg>
              <span>Apple</span>
            </button>
          )}
        </div>

        {/* Switcher & Direct Link */}
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {authMode === 'signup' ? (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsVerifying(false); setAuthMode('login') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0
                }}
              >
                Log in here
              </button>
              <div style={{ marginTop: '8px' }}>
                <a
                  href={getPrefilledPaymentLink(name, email, phone ? `${selectedCountry.code}${phone.replace(/\D/g, '')}` : '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#64748b', fontSize: '11px', textDecoration: 'none' }}
                >
                  Direct payment link ↗
                </a>
              </div>
            </div>
          ) : (
            <div>
              Don't have an active pass?{' '}
              <button
                type="button"
                onClick={() => { setIsVerifying(false); setAuthMode('signup') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0
                }}
              >
                Start Transformation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. HOW TO INSTALL AS APP QUICK GUIDE ──────────────────── */}
      <div style={{ marginTop: '6px', marginBottom: '14px', width: '100%', maxWidth: '380px' }}>
        <button
          type="button"
          onClick={openInstallSheet}
          style={{
            width: '100%',
            background: 'rgba(56, 189, 248, 0.07)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '11px 16px',
            color: '#38bdf8',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.14)'; e.currentTarget.style.borderColor = '#38bdf8' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.07)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)' }}
        >
          <span>📲</span>
          <span>How to Install Fit Ninja as an App</span>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>↗</span>
        </button>
      </div>

      {/* ── 5. TRUST BADGES & LEGAL COMPLIANCE LINKS ──────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔒 256-Bit SSL
        </span>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💳 Verified Razorpay
        </span>
        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⭐ 4.9/5 Rating
        </span>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
        <span>·</span>
        <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</a>
        <span>·</span>
        <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Social Ninja's</a>
      </div>

      <div style={{ marginTop: '12px', fontSize: '10.5px', color: '#64748b', lineHeight: 1.45, textAlign: 'center', maxWidth: '420px', margin: '12px auto 0' }}>
        <strong style={{ color: '#94a3b8' }}>Legal Advisory:</strong> Fit Ninja provides workout tracking and nutritional guidelines for educational and fitness purposes only. It is not medical advice. Always consult a physician before beginning any rigorous training program.
      </div>
    </div>
  )
}
