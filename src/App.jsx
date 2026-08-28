import { useEffect } from 'react'
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

bindUI(useUI)   // lets the shared controls open sheets without importing the store at module scope

function applyPrefs(theme, accent) {
  const de = document.documentElement
  de.dataset.theme = theme === 'light' ? 'light' : 'dark'
  de.dataset.accent = ACCENTS[accent] ? accent : 'blue'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = de.dataset.theme === 'light' ? '#f2f2f7' : '#070a12'
}

import { supabase } from './lib/api.js'
import { t } from './lib/i18n.js'

// Detect OAuth redirect immediately at module load time (before any React renders)
// If the URL hash contains access_token, Supabase is about to fire SIGNED_IN.
// We stash the email from localStorage early so the gate doesn't block.
const isOAuthRedirect = typeof window !== 'undefined' && window.location.hash.includes('access_token')

function Shell() {
  const navigate = useNavigate()
  const loc = useLocation()
  const { S, ready } = useStore()
  const isGuest = useStore(s => s.isGuest())
  const langV = useLang()   // re-renders the whole shell when the language (pack) changes
  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => { applyPrefs(S.theme, S.accent) }, [S.theme, S.accent])
  useEffect(() => { setLang(S.lang || 'en') }, [S.lang])
  useEffect(() => { document.documentElement.lang = S.lang || 'en' }, [langV, S.lang])
  // every tab/route change starts at the top of the page
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  // bound to the workout, not to the route — checking Stats mid-session keeps the screen on
  useWakeLock(!!S.active && S.keepAwake !== false)

  // Supabase Google OAuth Redirect Listener
  useEffect(() => {
    const handleAuth = async (session) => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim()
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0]
        
        // Save verified email token to local storage
        try {
          localStorage.setItem('gym_paid_email', email)
          localStorage.setItem('gym_paid', '1')
        } catch(e) {}

        // Log user in with paid access enabled — this triggers reactive re-render of Shell
        useStore.getState().setUser({
          name: name,
          email: email,
          paid: true,
          admin: email.includes('socialninja') || email === 'nazimpasha906@gmail.com'
        })
        useStore.getState().setPaid(true)
        useUI.getState().toast('Signed in as ' + email)
        
        // Clean URL hash and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname + '#/home')
        navigate('/home', { replace: true })
      }
    }

    // getSession() handles the token in the URL hash — Supabase client parses it automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleAuth(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleAuth(session)
    })
    return () => subscription?.unsubscribe()
  }, [navigate])

  const paid = useStore(s => s.paid)
  const user = useStore(s => s.user)
  const authed = (user || isGuest) && paid

  // If this is an OAuth redirect, show a loading spinner while Supabase processes the token.
  // Do NOT show Login — that would flash the wrong screen before auth completes.
  if (!ready && !authed) return (
    <div id="app">
      <div style={{ paddingTop: '44vh', display: 'flex', justifyContent: 'center', fontSize: 34, color: 'var(--label-3)' }}>
        <Icon name="dumbbell" />
      </div>
    </div>
  )

  // If we're on an OAuth redirect and not yet authed, keep showing spinner (don't flash Login)
  if (isOAuthRedirect && !authed) return (
    <div id="app">
      <div style={{ paddingTop: '44vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--label-3)' }}>
        <Icon name="dumbbell" style={{ fontSize: 34 }} />
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Signing you in with Google…</div>
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
