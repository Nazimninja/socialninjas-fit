import { useState, useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { useStore } from '../store/useStore.js'

export function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream
}

function InstallSheetModal({ close }) {
  const [platform, setPlatform] = useState(isIOSDevice() ? 'ios' : 'android')

  return (
    <div style={{ padding: '20px 16px', color: '#ffffff', textAlign: 'center', maxWidth: '440px', margin: '0 auto' }}>
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: 'linear-gradient(145deg, #182235, #0d1522)',
          border: '1.5px solid rgba(56,189,248,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 8px 24px rgba(56,189,248,0.35)'
        }}
      >
        <img src="/ninja-emblem.png" alt="Fit Ninja" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
      </div>

      <h3 style={{ fontSize: '19px', fontWeight: '900', margin: '0 0 6px', letterSpacing: '-0.3px', color: '#ffffff' }}>
        Install Fit Ninja to Home Screen
      </h3>
      <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.45, margin: '0 0 16px' }}>
        Install the official web app for full-screen workouts, instant load times, sound cues, and offline tracking.
      </p>

      {/* Platform Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => setPlatform('ios')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '9px',
            border: 'none',
            background: platform === 'ios' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
            color: platform === 'ios' ? '#031024' : '#94a3b8',
            fontWeight: '800',
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>🍎</span>
          <span>iPhone / iPad</span>
        </button>
        <button
          type="button"
          onClick={() => setPlatform('android')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '9px',
            border: 'none',
            background: platform === 'android' ? 'linear-gradient(135deg, #00e5a0 0%, #00c988 100%)' : 'transparent',
            color: platform === 'android' ? '#031024' : '#94a3b8',
            fontWeight: '800',
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>🤖</span>
          <span>Android / Chrome</span>
        </button>
      </div>

      {platform === 'ios' ? (
        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              1
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Open in <strong>Safari</strong> and tap the <strong>Share</strong> button <span style={{ fontSize: '17px', verticalAlign: 'middle', color: '#38bdf8' }}>⎋</span> at the bottom.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              2
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: '16px', verticalAlign: 'middle', color: '#38bdf8' }}>⊞</span>.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              3
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Tap <strong>"Add"</strong> in top-right. Fit Ninja is now on your home screen!
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00e5a0', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              1
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Open in <strong>Chrome</strong> and tap the <strong>three dots menu (⋮)</strong> in the top right.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00e5a0', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              2
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00e5a0', color: '#031024', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              3
            </div>
            <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: '600', lineHeight: 1.35 }}>
              Confirm install. Fit Ninja will launch full-screen from your app launcher!
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={close}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          color: '#031024',
          border: 'none',
          borderRadius: '12px',
          padding: '13px',
          fontWeight: '900',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Got it, Launch App!
      </button>
    </div>
  )
}

export function openInstallSheet() {
  useUI.getState().openSheet(close => <InstallSheetModal close={close} />)
}

if (typeof window !== 'undefined') {
  window.openFitNinjaInstallGuide = openInstallSheet
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const paid = useStore(s => s.paid)

  useEffect(() => {
    if (isStandaloneMode()) return

    const isApple = isIOSDevice()
    setIsIOS(isApple)

    const handleBeforeInstallPrompt = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = sessionStorage.getItem('fit_pwa_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    let timer = null
    const dismissed = sessionStorage.getItem('fit_pwa_dismissed')
    if (!dismissed) {
      timer = setTimeout(() => {
        const isAuthScreen = !paid && (window.location.pathname.includes('login') || window.location.hash.includes('login') || window.location.hash === '')
        if (!isStandaloneMode() && !sessionStorage.getItem('fit_pwa_dismissed')) {
          if (paid || !isAuthScreen) {
            setShowPrompt(true)
          }
        }
      }, 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (timer) clearTimeout(timer)
    }
  }, [paid])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else {
      openInstallSheet()
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('fit_pwa_dismissed', '1')
  }

  if (!showPrompt || isStandaloneMode()) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        left: '12px',
        right: '12px',
        maxWidth: '480px',
        margin: '0 auto',
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgba(19,27,46,0.96) 0%, rgba(12,18,34,0.98) 100%)',
        border: '1px solid rgba(56,189,248,0.4)',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(56,189,248,0.25)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'viewfade 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <img
          src="/ninja-emblem.png"
          alt="Fit Ninja"
          style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Install Fit Ninja App
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isIOS ? 'Tap Share ⎋ -> Add to Home Screen' : '1-Tap home screen install'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #00e5a0 0%, #00c988 100%)',
            border: 'none',
            borderRadius: '99px',
            padding: '7px 14px',
            color: '#05101a',
            fontSize: '12px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,229,160,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {isIOS ? 'How to Add' : 'Install'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
