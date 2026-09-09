import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { bindUI } from './components/ui.jsx'
import { ACCENTS } from './lib/format.js'
import { setLang, useLang } from './lib/i18n.js'
import { setNav } from './lib/nav.js'
import { useWakeLock } from './lib/wakelock.js'
import { startFlow } from './sheets.jsx'
import Icon from './components/Icon.jsx'
import TabBar from './components/TabBar.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Modals from './components/Modals.jsx'
import Toast from './components/Toast.jsx'
import RestTimer from './components/RestTimer.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'
import Login from './views/Login.jsx'
import Home from './views/Home.jsx'
import Plan from './views/Plan.jsx'
import RoutineEdit from './views/RoutineEdit.jsx'
import Workout from './views/Workout.jsx'
import Stats from './views/Stats.jsx'
import History from './views/History.jsx'
import Library from './views/Library.jsx'
import Nutrition from './views/Nutrition.jsx'
import Settings from './views/Settings.jsx'
import Admin from './views/Admin.jsx'
import { supabase, supabasePublic, ADMIN_EMAILS } from './lib/api.js'

bindUI(useUI)   // lets the shared controls open sheets without importing the store at module scope

function applyPrefs(theme, accent) {
  const de = document.documentElement
  de.dataset.theme = theme === 'light' ? 'light' : 'dark'
  de.dataset.accent = ACCENTS[accent] ? accent : 'blue'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = de.dataset.theme === 'light' ? '#f2f2f7' : '#070a12'
}

// Try to decode a Supabase JWT and return { email, name, picture } or null
function decodeJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const email = (payload.email || payload.user_metadata?.email || '').toLowerCase().trim()
    const name = payload.user_metadata?.full_name || payload.user_metadata?.name || email.split('@')[0] || 'Athlete'
    const picture = payload.user_metadata?.avatar_url || payload.user_metadata?.picture || null
    return email ? { email, name, picture, payload } : null
  } catch (e) {
    return null
  }
}

async function handleAuthUser(email, name, navigate, avatarUrl = null) {
  if (!email) return
  const cleanEmail = email.toLowerCase().trim()

  // 1. Check Admin whitelist (EXACT match or @socialninjas.in domain only)
  let isPaid = false
  let isAdmin = false

  if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@socialninjas.in')) {
    isPaid = true
    isAdmin = true
  } else {
    // 2. Query Supabase database for active membership or existing user state
    const candidates = [cleanEmail]
    const digits = cleanEmail.replace(/\D/g, '')
    if (digits.length >= 10) {
      if (!cleanEmail.startsWith('+')) candidates.push('+' + digits)
      candidates.push(digits)
      if (digits.length === 10) candidates.push('+91' + digits)
      if (digits.startsWith('91') && digits.length === 12) candidates.push(digits.slice(2))
    }

    try {
      const { data: memRows } = await supabasePublic
        .from('scripts')
        .select('*')
        .eq('profile', 'fitninja_membership')
        .in('topic', candidates)
        .limit(1)

      if (memRows && memRows.length > 0) {
        isPaid = true
      }
    } catch (e) {
      console.warn('Membership check error:', e)
    }

    if (!isPaid) {
      try {
        const { data: stateRows } = await supabasePublic
          .from('scripts')
          .select('*')
          .eq('profile', 'fitninja_user_state')
          .in('topic', candidates)
          .limit(1)

        if (stateRows && stateRows.length > 0) {
          isPaid = true
        }
      } catch (e) {}
    }

    if (!isPaid) {
      try {
        const { data: leadRows } = await supabasePublic
          .from('leads')
          .select('*')
          .or(`email.in.(${candidates.map(c => `"${c}"`).join(',')}),phone.in.(${candidates.map(c => `"${c}"`).join(',')})`)
          .limit(1)

        if (leadRows && leadRows.length > 0 && (leadRows[0].status?.includes('PAID') || leadRows[0].status?.includes('MEMBER'))) {
          isPaid = true
        }
      } catch (e) {}
    }
  }

  // Set user state in store
  const existingUser = useStore.getState().user
  const userObj = {
    name: name || cleanEmail.split('@')[0] || 'Athlete',
    email: cleanEmail,
    avatar: avatarUrl || existingUser?.avatar || null,
    paid: isPaid,
    admin: isAdmin
  }

  useStore.getState().setUser(userObj)
  useStore.getState().setPaid(isPaid)

  if (isPaid) {
    useStore.getState().pullState().catch(() => {})
    useUI.getState().toast(isAdmin ? 'Welcome, Admin ' + userObj.name : '⚡ Welcome to Fit Ninja Pro, ' + userObj.name)
    window.location.hash = '#/home'
    navigate('/home', { replace: true })
  } else {
    // UNPAID USER: Stay strictly on the paywall screen!
    useUI.getState().toast('Signed in as ' + cleanEmail + '. Please unlock Pro Pass to access the app.')
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + '#/app')
    }
  }
}

function Shell() {
  const navigate = useNavigate()
  const loc = useLocation()
  const { S, ready } = useStore()
  const isGuest = useStore(s => s.isGuest())
  const langV = useLang()
  const [oauthLoading, setOAuthLoading] = useState(false)

  const paid = useStore(s => s.paid)
  const user = useStore(s => s.user)
  const authed = (user || isGuest) && paid

  // Guarantee immediate entry into /home whenever authed becomes true
  useEffect(() => {
    if (authed) {
      if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/app') {
        window.location.hash = '#/home'
        navigate('/home', { replace: true })
      }
    }
  }, [authed, navigate])

  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => { applyPrefs(S.theme, S.accent) }, [S.theme, S.accent])
  useEffect(() => { setLang(S.lang || 'en') }, [S.lang])
  useEffect(() => { document.documentElement.lang = S.lang || 'en' }, [langV, S.lang])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useWakeLock(!!S.active && S.keepAwake !== false)

  useEffect(() => {
    const hash = window.location.hash

    // Step 1: If URL hash has access_token, try to decode JWT immediately
    if (hash.includes('access_token')) {
      setOAuthLoading(true)
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const token = params.get('access_token')
      if (token) {
        const decoded = decodeJWT(token)
        if (decoded) {
          handleAuthUser(decoded.email, decoded.name, navigate, decoded.picture).finally(() => setOAuthLoading(false))
          return
        }
      }
    }

    // Step 2: Supabase onAuthStateChange handles the implicit flow token automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null
        handleAuthUser(email, name, navigate, avatar).finally(() => setOAuthLoading(false))
      }
    })

    // Step 3: Check for existing session on normal page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null
        handleAuthUser(email, name, navigate, avatar).finally(() => setOAuthLoading(false))
      } else {
        setOAuthLoading(false)
      }
    })

    // Step 4: Check if email is in URL query or paid storage for instant pass-through
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const directEmail = urlParams.get('email') || localStorage.getItem('gym_paid_email')
      if (directEmail) {
        const cleanEmail = directEmail.toLowerCase().trim()
        supabasePublic
          .from('scripts')
          .select('id')
          .eq('profile', 'fitninja_membership')
          .eq('topic', cleanEmail)
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              handleAuthUser(cleanEmail, cleanEmail.split('@')[0], navigate)
            }
          }).catch(() => {})
      }
    } catch (e) {}

    return () => subscription?.unsubscribe()
  }, [navigate])

  // Show loading spinner only during boot (before ready) or active OAuth processing
  if ((!ready && !authed) || oauthLoading) return (
    <div id="app" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '0 20px' }}>
        <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Animated Spinner Ring */}
          <svg
            className="fn-spin"
            style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 64 }}
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle cx="32" cy="32" r="28" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="4" />
            <path
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              d="M32 4 A 28 28 0 0 1 60 32"
            />
          </svg>
          {/* Center Ninja / Dumbbell Icon */}
          <Icon name="dumbbell" style={{ fontSize: 26, color: '#38bdf8', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))' }} />
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
            {oauthLoading ? 'Authenticating with Google…' : 'Loading Fit Ninja…'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {oauthLoading ? 'Syncing your profile & pro credentials' : 'Preparing your personalized dashboard'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div id="app" className={`vfade ${!authed ? 'auth-shell' : ''}`} key={loc.pathname}>
        <ErrorBoundary>
          {!authed ? <Login /> : (
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/plan/r/:id" element={<RoutineEdit />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/history" element={<History />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={user?.admin ? <Admin /> : <Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </ErrorBoundary>
      </div>
      {authed && <TabBar onStart={startFlow} />}
      {authed && <RestTimer />}
      <Modals />
      <Toast />
      <PWAInstallPrompt />
    </>
  )
}

export default function App() {
  const boot = useStore(s => s.boot)
  useEffect(() => { boot() }, [boot])
  return <HashRouter><Shell /></HashRouter>
}
