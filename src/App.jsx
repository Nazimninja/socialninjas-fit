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
import { supabase, ADMIN_EMAILS } from './lib/api.js'

bindUI(useUI)   // lets the shared controls open sheets without importing the store at module scope

function applyPrefs(theme, accent) {
  const de = document.documentElement
  de.dataset.theme = theme === 'light' ? 'light' : 'dark'
  de.dataset.accent = ACCENTS[accent] ? accent : 'blue'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = de.dataset.theme === 'light' ? '#f2f2f7' : '#070a12'
}

// Try to decode a Supabase JWT and return { email, name } or null
function decodeJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const email = (payload.email || payload.user_metadata?.email || '').toLowerCase().trim()
    const name = payload.user_metadata?.full_name || payload.user_metadata?.name || email.split('@')[0] || 'Athlete'
    return email ? { email, name, payload } : null
  } catch (e) {
    return null
  }
}

async function handleAuthUser(email, name, navigate) {
  if (!email) return
  const cleanEmail = email.toLowerCase().trim()

  // 1. Check Admin whitelist (EXACT match or @socialninjas.in domain only)
  let isPaid = false
  let isAdmin = false

  if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@socialninjas.in')) {
    isPaid = true
    isAdmin = true
  } else {
    // 2. Query Supabase database for active subscription
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (sub && (sub.status === 'active' || sub.status === 'authenticated')) {
        isPaid = true
      }
    } catch (e) {
      console.warn('Subscription check error:', e)
    }

    if (!isPaid) {
      try {
        const { data: u } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle()

        if (u && (u.paid || u.role === 'admin' || u.subscription_status === 'active')) {
          isPaid = true
          if (u.role === 'admin') isAdmin = true
        }
      } catch (e) {}
    }
  }

  // Set user state in store
  const userObj = {
    name: name || cleanEmail.split('@')[0] || 'Athlete',
    email: cleanEmail,
    paid: isPaid,
    admin: isAdmin
  }

  useStore.getState().setUser(userObj)
  useStore.getState().setPaid(isPaid)

  if (isPaid) {
    useStore.getState().pullState()
    useUI.getState().toast(isAdmin ? 'Welcome, Admin ' + userObj.name : 'Welcome to Fit Ninja Pro, ' + userObj.name)
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + '#/home')
    }
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
          handleAuthUser(decoded.email, decoded.name, navigate).finally(() => setOAuthLoading(false))
          return
        }
      }
    }

    // Step 2: Supabase onAuthStateChange handles the implicit flow token automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        handleAuthUser(email, name, navigate).finally(() => setOAuthLoading(false))
      }
    })

    // Step 3: Check for existing session on normal page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        handleAuthUser(email, name, navigate).finally(() => setOAuthLoading(false))
      } else {
        setOAuthLoading(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [navigate])

  const paid = useStore(s => s.paid)
  const user = useStore(s => s.user)
  const authed = (user || isGuest) && paid

  // Show loading spinner only during boot (before ready) or active OAuth processing
  if ((!ready && !authed) || oauthLoading) return (
    <div id="app">
      <div style={{ paddingTop: '44vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--label-3)' }}>
        <Icon name="dumbbell" style={{ fontSize: 34 }} />
        {oauthLoading && <div style={{ fontSize: 13, color: '#94a3b8' }}>Signing you in with Google…</div>}
      </div>
    </div>
  )

  return (
    <>
      <div id="app" className="vfade" key={loc.pathname}>
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
      <TabBar onStart={startFlow} />
      <RestTimer />
      <Modals />
      <Toast />
    </>
  )
}

export default function App() {
  const boot = useStore(s => s.boot)
  useEffect(() => { boot() }, [boot])
  return <HashRouter><Shell /></HashRouter>
}
