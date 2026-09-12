import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FitNinjaProvider, useFitNinja } from '../context/FitNinjaContext';
import OnboardingPage from './OnboardingPage';
import DashboardPage from './DashboardPage';
import WorkoutPage from './WorkoutPage';
import StatsPage from './StatsPage';
import LeaderboardPage from './LeaderboardPage';
import ProfilePage from './ProfilePage';
import LibraryPage from './LibraryPage';
import Icon from '../components/app/Icon';
import GetReadyModal from '../components/app/GetReadyModal';

// ── Floating Dock Navigation (Matches User's Reference Screenshot) ─────────
function FloatingDockNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { todaysPlan } = useFitNinja();
  const [showGetReady, setShowGetReady] = useState(false);

  const pathClean = location.pathname.replace(/^\/(v2|app)(\.html)?/, '');
  const cur = pathClean.split('/')[1] || 'home';
  const on = (k: string) =>
    (k === 'home' && (!cur || cur === 'home')) ||
    (k === 'nutrition' && cur === 'nutrition') ||
    (k === 'stats' && cur === 'stats') ||
    (k === 'library' && cur === 'library');

  const routineName = todaysPlan?.focus || "Today's Targeted Protocol";
  const exerciseCount = todaysPlan?.exercises?.length || 5;

  return (
    <>
      <nav id="tabbar" className="lg:hidden">
        <button className={on('home') ? 'on' : ''} onClick={() => navigate('/')}>
          <Icon name="house" />
          <span>Home</span>
        </button>

        <button className={on('nutrition') ? 'on' : ''} onClick={() => navigate('/')}>
          <Icon name="nutrition" />
          <span>Nutrition</span>
        </button>

        <button className="start" onClick={() => setShowGetReady(true)}>
          <span className="cir">
            <Icon name="dumbbell" />
          </span>
          <span>Start</span>
        </button>

        <button className={on('stats') ? 'on' : ''} onClick={() => navigate('/stats')}>
          <Icon name="chart" />
          <span>Progress</span>
        </button>

        <button className={on('library') ? 'on' : ''} onClick={() => navigate('/library')}>
          <Icon name="list" />
          <span>Library</span>
        </button>
      </nav>

      <GetReadyModal
        isOpen={showGetReady}
        routineTitle={routineName}
        exerciseCount={exerciseCount}
        onStart={() => {
          setShowGetReady(false);
          navigate('/workout');
        }}
        onCancel={() => setShowGetReady(false)}
      />
    </>
  );
}

// ── Sidebar Nav (Desktop) ─────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen fixed left-0 top-0 bg-[#07090e] border-r border-[#172744] z-40 py-8 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <span className="text-2xl">🥷</span>
        <div>
          <p className="text-white font-bold text-sm tracking-wide">Fit Ninja v2</p>
          <p className="text-[#9BA8B4] text-[10px] tracking-widest uppercase">by Social Ninjas</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {[
          { path: '/', label: 'Home', icon: 'house', exact: true },
          { path: '/workout', label: 'Workout', icon: 'dumbbell', exact: false },
          { path: '/library', label: 'Exercise Library', icon: 'list', exact: false },
          { path: '/stats', label: 'Progress & Stats', icon: 'chart', exact: false },
          { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy', exact: false },
          { path: '/profile', label: 'Profile & Settings', icon: 'gear', exact: false },
        ].map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            end={n.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#1F4B99] text-white'
                  : 'text-[#9BA8B4] hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon name={n.icon} size={16} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── Inner app with access to FitNinja context ─────────────────────────────
function AppShell() {
  const { state } = useFitNinja();

  if (!state.user.setupDone) {
    return <OnboardingPage />;
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-56">
        <div className="max-w-xl lg:max-w-2xl mx-auto px-4 pt-4 pb-28 lg:pb-12 min-h-screen">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </div>

      <FloatingDockNav />
    </div>
  );
}

// ── Root export — wraps everything with FitNinjaProvider ──────────────────
export default function AppLayout() {
  return (
    <FitNinjaProvider>
      <AppShell />
    </FitNinjaProvider>
  );
}
