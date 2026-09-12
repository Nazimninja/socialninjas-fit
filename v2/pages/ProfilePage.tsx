import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitNinja } from '../context/FitNinjaContext';
import { formatSplitName } from '../data/workoutPlanAI';
import Icon from '../components/app/Icon';
import { Section, Row, Switch, Segmented } from '../components/app/ui';
import WeeklyCheckinModal from '../components/app/WeeklyCheckinModal';
import CloudSyncModal from '../components/app/CloudSyncModal';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch, userEmail, lastSynced } = useFitNinja();
  const { user, activePlan, badges, points, streak, workouts } = state;

  // Local state for edits
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [weight, setWeight] = useState(user.weightKg);
  const [height, setHeight] = useState(user.heightCm);
  const [age, setAge] = useState(user.age);
  const [saved, setSaved] = useState(false);

  // Training preferences
  const [restTimer, setRestTimer] = useState<'60' | '90' | '120' | '180'>('90');
  const [keepAwake, setKeepAwake] = useState(true);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(user.unit === 'imperial' ? 'lb' : 'kg');
  const [bodyGender, setBodyGender] = useState<'male' | 'female'>((user.gender as any) === 'female' ? 'female' : 'male');

  // Modals
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const level = Math.floor(points / 500) + 1;
  const levelProgress = ((points % 500) / 500) * 100;
  const activeConditions = (user.healthConditions || []).filter(c => c !== 'none');

  function savePersonalData() {
    dispatch({
      type: 'SET_USER',
      payload: {
        name,
        weightKg: Number(weight),
        heightCm: Number(height),
        age: Number(age),
        unit: weightUnit === 'lb' ? 'imperial' : 'metric',
      },
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEditingProfile(false);
    }, 1200);
  }

  function handleSplitSwitch(newSplit: any) {
    dispatch({
      type: 'SET_USER',
      payload: { workoutSplit: newSplit },
    });
  }

  function reconfigureWizard() {
    if (window.confirm('Re-run the personalization wizard to adjust health conditions, injuries, and schedule?')) {
      dispatch({ type: 'SET_USER', payload: { setupDone: false } });
      navigate('/app');
    }
  }

  function handleResetAll() {
    if (window.confirm('Reset all user data, workouts, and plans? This cannot be undone.')) {
      dispatch({ type: 'RESET' });
      navigate('/app');
    }
  }

  return (
    <div className="max-w-xl mx-auto pb-24 px-4 pt-2 space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app')}
            className="w-9 h-9 rounded-full bg-[#121c2e] border border-[#172744] flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Back to Home"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Settings & Profile</h1>
            <p className="text-[11px] text-[#71829d]">Fit Ninja Intelligence Engine</p>
          </div>
        </div>

        {/* Level badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101c30] border border-[#1d3356]">
          <span className="text-xs">🥷</span>
          <span className="text-xs font-bold text-[#38bdf8]">Lvl {level}</span>
        </div>
      </div>

      {/* ── Cross-Device Cloud Sync Card ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f1d35] to-[#0a1222] border border-[#1d3356] space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/30 flex items-center justify-center text-lg">
              ☁️
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Cross-Device Cloud Vault</p>
              <p className="text-[11px] text-[#71829d]">
                {userEmail ? (
                  <span className="text-[#38bdf8] font-medium truncate inline-block max-w-[190px] align-bottom">
                    {userEmail}
                  </span>
                ) : (
                  'No email linked · Tap to backup'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCloudSync(true)}
            className="py-1.5 px-3 rounded-xl bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/30 text-xs font-bold text-[#38bdf8] active:scale-95 transition-all"
          >
            {userEmail ? 'Sync / Switch' : 'Link Email'}
          </button>
        </div>

        {userEmail ? (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-[#71829d]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-sync active across phones & laptops
            </span>
            {lastSynced && <span>Updated {lastSynced}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 text-[10px] text-amber-300">
            <span>⚠️</span>
            Attach your email so you can switch phones or log in from a laptop without losing logs.
          </div>
        )}
      </div>

      {/* ── Section 1: Athlete Profile ── */}
      <Section title="Athlete Profile">
        <Row
          icon="person"
          iconTint="var(--blue)"
          title={user.name || 'Fit Ninja Athlete'}
          subtitle={`${user.fitnessLevel} · ${user.gender || 'Athlete'} · ${user.age}yo · ${user.weightKg} kg`}
          accessory="chevron"
          onClick={() => setEditingProfile(!editingProfile)}
        />

        {editingProfile && (
          <div className="p-4 bg-[#090e1a] border-t border-[#172744] space-y-3">
            <p className="text-xs font-bold text-white mb-2">Edit Athlete Details</p>
            <div>
              <label className="block text-[11px] text-[#71829d] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#121c2e] border border-[#1e3256] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#38bdf8]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#71829d] mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full bg-[#121c2e] border border-[#1e3256] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#38bdf8]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#71829d] mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full bg-[#121c2e] border border-[#1e3256] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#38bdf8]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#71829d] mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full bg-[#121c2e] border border-[#1e3256] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
            <button
              onClick={savePersonalData}
              className="w-full py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#07090e] font-bold text-xs rounded-xl transition-colors mt-2"
            >
              {saved ? '✓ Saved!' : 'Save Details'}
            </button>
          </div>
        )}

        <Row
          icon="camera"
          iconTint="var(--indigo)"
          title="Weekly Progress Audit"
          subtitle="Calibrate weight, photos & progressive overload"
          accessory="chevron"
          onClick={() => setShowCheckin(true)}
        />
      </Section>

      {/* ── Section 2: AI Training Brain & Safety ── */}
      <Section
        title="Coaching Brain & Protocol"
        footer="Fit Ninja safeguards your workouts against injuries, thyroid, or pregnancy restrictions automatically."
      >
        <Row
          icon="dumbbell"
          iconTint="var(--blue)"
          title="Active Workout Split"
          subtitle={formatSplitName(user.workoutSplit)}
          value={`${user.daysPerWeek}d / wk`}
          accessory="chevron"
          onClick={reconfigureWizard}
        />

        <Row
          icon="shield"
          iconTint="var(--teal)"
          title="Health & Safety Guardrails"
          subtitle={
            activeConditions.length > 0
              ? activeConditions.map(c => c.replace('_', ' ')).join(', ')
              : 'No medical restrictions active'
          }
          value={activeConditions.length > 0 ? `${activeConditions.length} active` : 'Optimal'}
        />

        <Row
          icon="nutrition"
          iconTint="var(--orange)"
          title="Target Daily Fuel"
          subtitle={`Macro Target: ${user.proteinTargetG}g Protein`}
          value={`${user.dailyCalorieTarget} kcal`}
        />

        <Row
          icon="gear"
          iconTint="var(--indigo)"
          title="Reconfigure Health & Split"
          subtitle="Update injuries, thyroid condition, or schedule"
          accessory="chevron"
          onClick={reconfigureWizard}
        />
      </Section>

      {/* ── Section 3: Training Preferences ── */}
      <Section
        title="During a Workout"
        footer="Rest timer sounds automatically after completing a set. Keep screen awake prevents lock during session."
      >
        <Row icon="timer" iconTint="var(--orange)" title="Rest Timer">
          <Segmented
            options={[
              { value: '60', label: '60s' },
              { value: '90', label: '90s' },
              { value: '120', label: '120s' },
              { value: '180', label: '180s' },
            ]}
            value={restTimer}
            onChange={v => setRestTimer(v as any)}
          />
        </Row>

        <Row icon="sun" iconTint="var(--yellow)" title="Keep screen awake">
          <Switch checked={keepAwake} onChange={setKeepAwake} />
        </Row>

        <Row icon="scale" iconTint="var(--teal)" title="Weight unit">
          <Segmented
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
            value={weightUnit}
            onChange={v => {
              setWeightUnit(v as any);
              dispatch({
                type: 'SET_USER',
                payload: { unit: v === 'lb' ? 'imperial' : 'metric' },
              });
            }}
          />
        </Row>

        <Row icon="figureStrength" iconTint="var(--purple)" title="Anatomical Model">
          <Segmented
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            value={bodyGender}
            onChange={v => {
              setBodyGender(v as any);
              dispatch({
                type: 'SET_USER',
                payload: { gender: v },
              });
            }}
          />
        </Row>
      </Section>

      {/* ── Section 4: Gamification & Badges ── */}
      <Section title="Achievements & Progress">
        <Row
          icon="flame"
          iconTint="var(--orange)"
          title="Ninja Points Balance"
          subtitle={`Level ${level} · ${500 - (points % 500)} pts to next rank`}
          value={`${points} pts`}
        />

        <Row
          icon="trophy"
          iconTint="var(--yellow)"
          title="Badges & Milestones"
          subtitle={`${unlockedCount} of ${badges.length} unlocked`}
          value={`${Math.round((unlockedCount / badges.length) * 100)}%`}
          accessory="chevron"
          onClick={() => setShowBadges(!showBadges)}
        />

        {showBadges && (
          <div className="p-4 bg-[#090e1a] border-t border-[#172744] space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {badges.map(b => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    b.unlocked
                      ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <p className="text-2xl mb-1">{b.icon}</p>
                  <p className="text-white text-xs font-bold">{b.name}</p>
                  <p className="text-[10px] text-[#71829d] mt-0.5">{b.description}</p>
                  {!b.unlocked && (
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#38bdf8] rounded-full"
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Section 5: Help & Support ── */}
      <Section title="Help & Support">
        <Row
          icon="info"
          iconTint="var(--blue)"
          title="Fit Ninja User Manual"
          subtitle="How exercises, safety rules & check-ins work"
          accessory="chevron"
          onClick={() => window.open('https://socialninjas.in', '_blank')}
        />
        <Row
          icon="link"
          iconTint="var(--teal)"
          title="Coach & Support Desk"
          subtitle="support@socialninjas.in"
          accessory="chevron"
          onClick={() =>
            window.open('mailto:support@socialninjas.in?subject=Fit%20Ninja%20Support', '_blank')
          }
        />
      </Section>

      {/* ── Section 6: Data & Reset ── */}
      <Section title="Data Management">
        <Row
          icon="trash"
          iconTint="var(--red)"
          title="Reset Everything"
          subtitle="Deletes active plan, workout history and check-ins"
          danger
          onClick={handleResetAll}
        />
      </Section>

      {/* Weekly Checkin Modal */}
      <WeeklyCheckinModal isOpen={showCheckin} onClose={() => setShowCheckin(false)} />

      {/* Cross-Device Cloud Sync Modal */}
      <CloudSyncModal isOpen={showCloudSync} onClose={() => setShowCloudSync(false)} />
    </div>
  );
}
