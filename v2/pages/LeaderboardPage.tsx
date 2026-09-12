import React, { useMemo } from 'react';
import { useFitNinja } from '../context/FitNinjaContext';

// Mock leaderboard data — in production wire to Supabase
const MOCK_LEADERS = [
  { rank: 1, name: 'Iron Nazim',    points: 3840, streak: 22, avatar: '🥷' },
  { rank: 2, name: 'SteelMike',     points: 3210, streak: 18, avatar: '💪' },
  { rank: 3, name: 'QuadQueen',     points: 2980, streak: 15, avatar: '👸' },
  { rank: 4, name: 'BulkBasha',     points: 2750, streak: 12, avatar: '🏋️' },
  { rank: 5, name: 'DeadliftDan',   points: 2500, streak: 10, avatar: '⚡' },
  { rank: 6, name: 'PressurePaula', points: 2200, streak: 9,  avatar: '🔥' },
  { rank: 7, name: 'RepRaja',       points: 1980, streak: 7,  avatar: '👊' },
  { rank: 8, name: 'GainzGuru',     points: 1750, streak: 6,  avatar: '🎯' },
  { rank: 9, name: 'FlexFarhan',    points: 1500, streak: 5,  avatar: '💥' },
  { rank: 10, name: 'CleanCara',    points: 1200, streak: 3,  avatar: '✨' },
];

const medalColors: Record<number, string> = { 1: '#e8b86d', 2: '#9BA8B4', 3: '#8B5E3C' };

export default function LeaderboardPage() {
  const { state } = useFitNinja();
  const { user, points } = state;

  // Find or insert user in leaderboard
  const leaders = useMemo(() => {
    const me = { rank: 0, name: user.name || 'You', points, streak: state.streak, avatar: '🥷', isMe: true };
    const all = [...MOCK_LEADERS.map(l => ({ ...l, isMe: false })), me]
      .sort((a, b) => b.points - a.points)
      .map((l, i) => ({ ...l, rank: i + 1 }));
    return all;
  }, [user, points, state.streak]);

  const me = leaders.find(l => (l as any).isMe);

  return (
    <div className="pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard 🏆</h1>
        <p className="text-sm text-[#9BA8B4]">Top Fit Ninjas this month</p>
      </div>

      {/* Your rank card */}
      {me && (
        <div className="bg-gradient-to-r from-[#1F4B99]/20 to-[#9b8ef0]/20 border border-[#1F4B99]/30 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-3xl">🥷</span>
          <div className="flex-1">
            <p className="text-white font-semibold">{user.name || 'You'}</p>
            <p className="text-xs text-[#9BA8B4]">Rank #{me.rank} · {state.streak}🔥 streak</p>
          </div>
          <div className="text-right">
            <p className="text-[#e8b86d] font-bold text-lg">{points}</p>
            <p className="text-xs text-[#9BA8B4]">points</p>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-3 py-4">
        {[leaders[1], leaders[0], leaders[2]].filter(Boolean).map((l, podiumIdx) => {
          const heights = ['h-24', 'h-32', 'h-20'];
          const orders = [1, 0, 2];
          const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
          const leader = leaders.find(x => x.rank === rank);
          if (!leader) return null;
          return (
            <div key={rank} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{leader.avatar}</span>
              <p className="text-xs text-white font-medium text-center max-w-[60px] truncate">{leader.name}</p>
              <div className={`${heights[podiumIdx]} w-16 rounded-t-xl flex items-end justify-center pb-2`}
                style={{ background: podiumIdx === 1 ? 'rgba(232,184,109,0.2)' : 'rgba(31,75,153,0.15)', border: `1px solid ${podiumIdx === 1 ? 'rgba(232,184,109,0.3)' : 'rgba(31,75,153,0.2)'}` }}>
                <span className="text-lg font-bold" style={{ color: medalColors[rank] ?? '#fff' }}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {leaders.map(l => {
          const isMe = (l as any).isMe;
          return (
            <div key={l.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isMe ? 'border-[#1F4B99]/40 bg-[#1F4B99]/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}>
              {/* Rank */}
              <span className="w-7 text-center text-sm font-bold" style={{ color: medalColors[l.rank] ?? '#9BA8B4' }}>
                {l.rank <= 3 ? ['🥇','🥈','🥉'][l.rank - 1] : `#${l.rank}`}
              </span>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                {l.avatar}
              </div>

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isMe ? 'text-[#7ba3e0]' : 'text-white'}`}>
                  {l.name} {isMe && '(You)'}
                </p>
                <p className="text-xs text-[#9BA8B4]">{l.streak}🔥 streak</p>
              </div>

              {/* Points */}
              <span className="text-sm font-bold text-white">{l.points} <span className="text-[#9BA8B4] font-normal text-xs">pts</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
