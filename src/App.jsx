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
import { supabase } from './lib/api.js'

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

function loginUser(email, name) {
  try {
    localStorage.setItem('gym_paid_email', email)
    localStorage.setItem('gym_paid', '1')
  } catch(e) {}
  useStore.getState().setUser({
    name,
    email,
    paid: true,
    admin: email.includes('socialninja') || email === 'nazimpasha906@gmail.com'
  })
  useStore.getState().setPaid(true)
  useUI.getState().toast('Welcome, ' + name)
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

    // Step 1: If URL hash has access_token, try to decode JWT immediately (synchronous)
    if (hash.includes('access_token')) {
      setOAuthLoading(true)
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const token = params.get('access_token')
      if (token) {
        const decoded = decodeJWT(token)
        if (decoded) {
          loginUser(decoded.email, decoded.name)
          window.history.replaceState(null, '', window.location.pathname + '#/home')
          navigate('/home', { replace: true })
          setOAuthLoading(false)
          return
        }
      }
    }

    // Step 2: Supabase onAuthStateChange handles the implicit flow token automatically
    // (with flowType: 'implicit' + detectSessionInUrl: true in the client)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        loginUser(email, name)
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + '#/home')
          navigate('/home', { replace: true })
        }
        setOAuthLoading(false)
      }
    })

    // Step 3: Check for existing session on normal page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        if (localStorage.getItem('gym_paid_email') === email || localStorage.getItem('gym_paid') === '1') {
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
          loginUser(email, name)
        }
      }
      setOAuthLoading(false)
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
