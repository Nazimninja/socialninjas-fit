import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAllExercises,
  searchExercises,
  MUSCLE_GROUPS_LIST,
  EQUIPMENT_LIST,
  DIFFICULTY_LEVELS,
  type ExerciseRecord,
} from '../data/exerciseDatabase';
import { useFitNinja } from '../context/FitNinjaContext';
import Icon from '../components/app/Icon';

const CATEGORIES = ['All', 'Strength', 'Cardio', 'Stretching', 'Plyometrics'];

// ── Muscle group color accent mapping ──────────────────────────────────────
const MUSCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Chest:     { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  Back:      { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  Shoulders: { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  Biceps:    { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  Triceps:   { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/30' },
  Forearms:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30' },
  Core:      { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  Legs:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Cardio:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30' },
};

export default function LibraryPage() {
  const { state, dispatch } = useFitNinja();
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hasGifOnly, setHasGifOnly] = useState(false);

  // Pagination cap for 60fps performance
  const [displayCount, setDisplayCount] = useState(36);

  // Active Detail Modal
  const [activeExercise, setActiveExercise] = useState<ExerciseRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAllExercises().then(data => {
      setExercises(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return searchExercises(exercises, search, {
      muscleGroup: selectedMuscle !== 'All' ? selectedMuscle : undefined,
      equipment: selectedEquipment !== 'All' ? selectedEquipment : undefined,
      difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      hasGifOnly,
    });
  }, [exercises, search, selectedMuscle, selectedEquipment, selectedDifficulty, selectedCategory, hasGifOnly]);

  // Reset pagination when filter changes
  useEffect(() => {
    setDisplayCount(36);
  }, [search, selectedMuscle, selectedEquipment, selectedDifficulty, selectedCategory, hasGifOnly]);

  const visibleExercises = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddToRoutine = (ex: ExerciseRecord) => {
    dispatch({
      type: 'ADD_EXERCISE_TO_PLAN',
      payload: {
        exercise: {
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: ex.setsRange[1] || 3,
          reps: ex.repsRange[1] || 10,
          targetRpe: 8,
          restSeconds: ex.restSeconds || 90,
          gifUrl: ex.gifUrl,
          instructions: ex.instructions,
        },
      },
    });
    showToast(`✓ Added "${ex.name}" to today's workout!`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1F4B99] text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 backdrop-blur-md"
          >
            <span>✨</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#1F4B99]/20 text-[#1F4B99]">
              <Icon name="list" size={20} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Exercise Library</h1>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#172744] text-[#86B4F8] border border-[#1F4B99]/30">
            {exercises.length > 0 ? `${exercises.length.toLocaleString()} Exercises` : 'Loading Database...'}
          </span>
        </div>
        <p className="text-xs text-[#9BA8B4]">
          Consolidated from 3 open-source fitness datasets with animated HD GIFs, coaching cues, and step-by-step instructions.
        </p>

        {/* Database Source Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#9BA8B4] border border-white/5">
            📦 hasaneyldrm (1.3k)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#9BA8B4] border border-white/5">
            🎥 JahelCuadrado (1.3k GIFs)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#9BA8B4] border border-white/5">
            📘 azilRababe (2.9k Descriptions)
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#9BA8B4]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search 4,100+ exercises by name or equipment (e.g. Bench, Incline, Squat)..."
          className="w-full bg-[#0d131f] border border-[#172744] rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-[#5A6D82] focus:outline-none focus:border-[#1F4B99] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-[#9BA8B4] hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Horizontal Muscle Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {MUSCLE_GROUPS_LIST.map(m => {
          const isSelected = selectedMuscle === m;
          return (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#1F4B99] text-white shadow-lg shadow-[#1F4B99]/30 border border-[#1F4B99]'
                  : 'bg-[#0d131f] text-[#9BA8B4] hover:text-white hover:bg-white/5 border border-[#172744]'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Secondary Filter Row: Equipment, Difficulty, Category, and GIF toggle */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Equipment Selector */}
        <select
          value={selectedEquipment}
          onChange={e => setSelectedEquipment(e.target.value)}
          className="bg-[#0d131f] border border-[#172744] text-[#9BA8B4] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#1F4B99] capitalize"
        >
          {EQUIPMENT_LIST.map(eq => (
            <option key={eq} value={eq} className="bg-[#07090e] text-white">
              {eq === 'All' ? 'All Equipment' : eq}
            </option>
          ))}
        </select>

        {/* Difficulty Selector */}
        <select
          value={selectedDifficulty}
          onChange={e => setSelectedDifficulty(e.target.value)}
          className="bg-[#0d131f] border border-[#172744] text-[#9BA8B4] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#1F4B99]"
        >
          {DIFFICULTY_LEVELS.map(d => (
            <option key={d} value={d} className="bg-[#07090e] text-white">
              {d === 'All' ? 'All Levels' : d}
            </option>
          ))}
        </select>

        {/* Category Selector */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="bg-[#0d131f] border border-[#172744] text-[#9BA8B4] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#1F4B99]"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c} className="bg-[#07090e] text-white">
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>

        {/* GIF Filter Toggle */}
        <button
          onClick={() => setHasGifOnly(v => !v)}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl font-medium border transition-colors ${
            hasGifOnly
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : 'bg-[#0d131f] text-[#9BA8B4] border-[#172744] hover:text-white'
          }`}
        >
          <span>🎬</span>
          <span>GIF Only</span>
        </button>
      </div>

      {/* Results Meta Info */}
      <div className="flex items-center justify-between text-xs text-[#9BA8B4]">
        <span>
          Showing <strong className="text-white">{Math.min(displayCount, filtered.length)}</strong> of{' '}
          <strong className="text-white">{filtered.length.toLocaleString()}</strong> matching movements
        </span>
        {(selectedMuscle !== 'All' || selectedEquipment !== 'All' || selectedDifficulty !== 'All' || selectedCategory !== 'All' || search || hasGifOnly) && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedMuscle('All');
              setSelectedEquipment('All');
              setSelectedDifficulty('All');
              setSelectedCategory('All');
              setHasGifOnly(false);
            }}
            className="text-[#86B4F8] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Exercise Card Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1F4B99] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#9BA8B4]">Loading 4,106 exercises from master database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#0d131f] rounded-2xl border border-[#172744] p-8 space-y-2">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-semibold text-white">No exercises found</p>
          <p className="text-xs text-[#9BA8B4]">Try broadening your search or adjusting muscle and equipment filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {visibleExercises.map(ex => {
            const muscleStyle = MUSCLE_COLORS[ex.muscleGroup] || {
              bg: 'bg-white/10',
              text: 'text-white',
              border: 'border-white/20',
            };

            return (
              <div
                key={ex.id}
                className="bg-[#0d131f] border border-[#172744] hover:border-[#1F4B99]/60 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group"
              >
                {/* Media Container */}
                <div
                  className="relative aspect-video bg-[#07090e] overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => setActiveExercise(ex)}
                >
                  {ex.gifUrl || ex.thumbUrl ? (
                    <img
                      src={ex.thumbUrl || ex.gifUrl}
                      alt={ex.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#5A6D82]">
                      <Icon name="dumbbell" size={28} />
                      <span className="text-[10px]">No Preview Available</span>
                    </div>
                  )}

                  {/* Muscle Badge */}
                  <span
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${muscleStyle.bg} ${muscleStyle.text} ${muscleStyle.border}`}
                  >
                    {ex.muscleGroup}
                  </span>

                  {/* GIF Indicator */}
                  {ex.gifUrl && (
                    <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/60 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                      <span>▶</span> GIF
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5 cursor-pointer" onClick={() => setActiveExercise(ex)}>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#86B4F8] transition-colors line-clamp-1">
                      {ex.name}
                    </h3>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#9BA8B4] border border-white/5 capitalize">
                        {ex.equipment}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                          ex.difficulty === 'Beginner'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ex.difficulty === 'Advanced'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {ex.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#9BA8B4]">
                        ~{ex.caloriesPerSet} kcal/set
                      </span>
                    </div>

                    {/* Description preview */}
                    {ex.description && (
                      <p className="text-[11px] text-[#9BA8B4] line-clamp-2 pt-0.5">
                        {ex.description}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-[#172744]/60 flex items-center gap-2">
                    <button
                      onClick={() => setActiveExercise(ex)}
                      className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-white/5"
                    >
                      <span>Technique</span>
                    </button>
                    <button
                      onClick={() => handleAddToRoutine(ex)}
                      className="py-1.5 px-3 rounded-xl bg-[#1F4B99] hover:bg-[#255ec0] text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-md shadow-[#1F4B99]/20"
                      title="Add to today's workout"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {filtered.length > displayCount && (
        <div className="text-center pt-4">
          <button
            onClick={() => setDisplayCount(c => c + 36)}
            className="px-6 py-2.5 rounded-2xl bg-[#0d131f] hover:bg-[#172744] text-[#86B4F8] border border-[#1F4B99]/40 text-xs font-bold transition-all shadow-lg"
          >
            Load Next 36 Exercises ({filtered.length - displayCount} remaining)
          </button>
        </div>
      )}

      {/* ── Exercise Detail Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {activeExercise && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveExercise(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0b101a] border border-[#172744] w-full max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#172744] flex items-center justify-between bg-[#07090e]">
                <div>
                  <h2 className="text-base font-bold text-white line-clamp-1">{activeExercise.name}</h2>
                  <p className="text-[11px] text-[#9BA8B4]">
                    {activeExercise.muscleGroup} • {activeExercise.equipment} • {activeExercise.difficulty}
                  </p>
                </div>
                <button
                  onClick={() => setActiveExercise(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 space-y-4">
                {/* Media view */}
                {activeExercise.gifUrl ? (
                  <div className="aspect-video bg-[#07090e] rounded-2xl overflow-hidden border border-[#172744] flex items-center justify-center">
                    <img
                      src={activeExercise.gifUrl}
                      alt={activeExercise.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : activeExercise.thumbUrl ? (
                  <div className="aspect-video bg-[#07090e] rounded-2xl overflow-hidden border border-[#172744] flex items-center justify-center">
                    <img
                      src={activeExercise.thumbUrl}
                      alt={activeExercise.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : null}

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#0d131f] border border-[#172744]">
                    <p className="text-[10px] text-[#9BA8B4] uppercase">Target Sets</p>
                    <p className="text-xs font-bold text-white">
                      {activeExercise.setsRange[0]} - {activeExercise.setsRange[1]} Sets
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0d131f] border border-[#172744]">
                    <p className="text-[10px] text-[#9BA8B4] uppercase">Target Reps</p>
                    <p className="text-xs font-bold text-white">
                      {activeExercise.repsRange[0]} - {activeExercise.repsRange[1]} Reps
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0d131f] border border-[#172744]">
                    <p className="text-[10px] text-[#9BA8B4] uppercase">Rest Period</p>
                    <p className="text-xs font-bold text-white">{activeExercise.restSeconds}s Rest</p>
                  </div>
                </div>

                {/* Secondary Muscles */}
                {activeExercise.secondaryMuscles && activeExercise.secondaryMuscles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#86B4F8] mb-1.5">Secondary Muscles Involved</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeExercise.secondaryMuscles.map(sm => (
                        <span
                          key={sm}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#9BA8B4] text-[11px]"
                        >
                          {sm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coaching Overview */}
                {activeExercise.description && (
                  <div>
                    <p className="text-xs font-semibold text-[#86B4F8] mb-1">Coaching Cues</p>
                    <p className="text-xs text-[#9BA8B4] leading-relaxed bg-[#0d131f] p-3 rounded-xl border border-[#172744]">
                      {activeExercise.description}
                    </p>
                  </div>
                )}

                {/* Instructions */}
                {activeExercise.instructions && activeExercise.instructions.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-[#86B4F8] mb-1.5">Execution Steps</p>
                    <ol className="space-y-2 text-xs text-[#C8D1DC]">
                      {activeExercise.instructions.map((step, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 bg-[#0d131f] p-2.5 rounded-xl border border-[#172744]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#1F4B99] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className="text-xs text-[#5A6D82] italic">
                    Standard movement form applies. Focus on a controlled eccentric tempo and peak muscular contraction.
                  </p>
                )}

                {/* Sources Attribution */}
                {activeExercise.sources && activeExercise.sources.length > 0 && (
                  <div className="pt-2 text-[10px] text-[#5A6D82] flex items-center gap-1.5">
                    <span>Verified Dataset Sources:</span>
                    {activeExercise.sources.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[#9BA8B4]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-[#172744] bg-[#07090e] flex items-center gap-3">
                <button
                  onClick={() => setActiveExercise(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#9BA8B4] text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAddToRoutine(activeExercise);
                    setActiveExercise(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1F4B99] hover:bg-[#255ec0] text-white text-xs font-bold transition-all shadow-lg shadow-[#1F4B99]/30 flex items-center justify-center gap-1.5"
                >
                  <span>+ Add to Today's Workout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
