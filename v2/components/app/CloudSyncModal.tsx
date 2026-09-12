import React, { useState } from 'react';
import { useFitNinja } from '../../context/FitNinjaContext';
import { supabase } from '../../context/migration';
import Icon from './Icon';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CloudSyncModal({ isOpen, onClose, onSuccess }: CloudSyncModalProps) {
  const { userEmail, restoreAccountByEmail, syncCloud, unlinkEmail, isSyncing, lastSynced, state } = useFitNinja();
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleRestoreOrLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setStatusMessage({ type: 'info', text: 'Connecting to Fit Ninja cloud vault...' });
    const res = await restoreAccountByEmail(emailInput);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      if (onSuccess) setTimeout(() => onSuccess(), 1000);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSyncNow = async () => {
    setStatusMessage({ type: 'info', text: 'Pushing local updates to cloud...' });
    const success = await syncCloud();
    if (success) {
      setStatusMessage({ type: 'success', text: 'Cloud sync complete! Your profile is up to date.' });
    } else {
      setStatusMessage({ type: 'error', text: 'Sync failed. Please verify your internet connection.' });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Google sign in failed.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isLinked = Boolean(userEmail && userEmail.includes('@'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b1322] border border-[#172744] rounded-3xl p-6 shadow-2xl overflow-hidden text-left">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#121c2e] border border-[#172744] flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <Icon name="xmark" size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8]/20 to-[#6366f1]/20 border border-[#38bdf8]/30 flex items-center justify-center text-2xl shadow-inner">
            ☁️
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Athlete Cloud Account</h2>
            <p className="text-xs text-[#71829d]">Never lose your workout logs, check-ins or split</p>
          </div>
        </div>

        {/* Active Account Banner */}
        {isLinked ? (
          <div className="mb-5 p-4 rounded-2xl bg-[#101b30] border border-[#1d3356] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[11px] font-semibold tracking-wide text-[#22c55e] uppercase">Active Cloud Backup</span>
              </div>
              {lastSynced && (
                <span className="text-[10px] text-[#71829d]">Synced at {lastSynced}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate">{userEmail}</p>
              <p className="text-[11px] text-[#71829d] mt-0.5">
                {state.workouts.length} workout(s) · {state.checkins.length} check-in(s) · {state.bodyweight.length} weight entries
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex-1 py-2 px-3 rounded-xl bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/40 text-xs font-bold text-[#38bdf8] flex items-center justify-center gap-1.5 transition-all"
              >
                <Icon name="flame" size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Unlink this email from this device? Your data remains safely stored in the cloud.')) {
                    unlinkEmail();
                    setStatusMessage({ type: 'info', text: 'Email unlinked from this device.' });
                  }
                }}
                className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-[#94a3b8] transition-colors"
              >
                Unlink
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              No email is linked to this device. Enter your email below to ensure your workouts and check-ins are backed up across all your phones and computers.
            </p>
          </div>
        )}

        {/* Email Entry & Switch Form */}
        <form onSubmit={handleRestoreOrLink} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              {isLinked ? 'Switch or Restore Another Account' : 'Enter Your Athlete Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="athlete@example.com"
                required
                className="w-full px-4 py-3 bg-[#070b14] border border-[#1a2d4f] rounded-2xl text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors"
              />
            </div>
          </div>

          {/* Feedback Status */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSyncing}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#7dd3fc] hover:to-[#0369a1] text-black font-extrabold text-sm shadow-lg shadow-[#38bdf8]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Restoring Account...
              </>
            ) : (
              <>
                <span>⚡</span>
                {isLinked ? 'Restore & Sync This Email' : 'Link & Restore My Data'}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#172744]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0b1322] px-3 text-[#475569] font-bold">Or fast sign in</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#1a2d4f] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Footer Guarantee */}
        <div className="mt-4 pt-3 border-t border-[#172744]/60 text-center">
          <p className="text-[10px] text-[#71829d] flex items-center justify-center gap-1.5">
            <span>🛡️</span>
            Permanent Cloud Vault — survives device upgrades, browser resets & app updates.
          </p>
        </div>
      </div>
    </div>
  );
}
