import { useState, useEffect } from 'react'
import { useUI } from '../store/useUI.js'

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

export function openInstallSheet() {
  const isIOS = isIOSDevice()
  useUI.getState().openSheet(close => (
    <div style={{ padding: '24px 20px', color: '#ffffff', textAlign: 'center', maxWidth: '420px', margin: '0 auto' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(145deg, #182235, #0d1522)',
          border: '1.5px solid rgba(56,189,248,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(56,189,248,0.35)'
        }}
      >
        <img src="/ninja-emblem.png" alt="Fit Ninja" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
      </div>

      <h3 style={{ fontSize: '19px', fontWeight: '900', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
        Install Fit Ninja to Home Screen
      </h3>
      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.45, margin: '0 0 20px' }}>
        Install the official web app for full-screen workouts, instant load times, and offline access.
      </p>

      {isIOS ? (
        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#05101a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              1
            </div>
            <div style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '600' }}>
              Tap the <strong>Share</strong> button <span style={{ fontSize: '18px', verticalAlign: 'middle' }}>⎋</span> at the bottom of Safari.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#05101a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              2
            </div>
            <div style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '600' }}>
              Scroll down and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: '16px', verticalAlign: 'middle' }}>⊞</span>.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00e5a0', color: '#05101a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              1
            </div>
            <div style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '600' }}>
              Tap the <strong>three dots menu (⋮)</strong> in Chrome.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00e5a0', color: '#05101a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
              2
            </div>
            <div style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '600' }}>
              Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={close}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: '13px',
          fontWeight: '800',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Got it!
      </button>
    </div>
  ))
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) return
    const dismissed = sessionStorage.getItem('fit_pwa_dismissed')
    if (dismissed) return

    const isApple = isIOSDevice()
    setIsIOS(isApple)

    const handleBeforeInstallPrompt = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    let timer = null
    if (isApple) {
      timer = setTimeout(() => {
        if (!isStandaloneMode() && !sessionStorage.getItem('fit_pwa_dismissed')) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
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
