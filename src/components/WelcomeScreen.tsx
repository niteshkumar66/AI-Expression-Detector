import React from 'react';
import { Sparkles, ShieldCheck, Cpu, Eye, Zap, Camera } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  isLoading: boolean;
  loadProgress: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  isLoading,
  loadProgress,
}) => {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-950 text-slate-100 select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Card */}
      <main className="relative z-10 glass-panel max-w-2xl w-full p-8 sm:p-12 rounded-3xl border-white/15 shadow-2xl text-center space-y-8 backdrop-blur-2xl">
        {/* Emblem / Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Face Experience • Dual Track Enabled</span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white">
            AI Magic <span className="text-gradient-gold">Mirror</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Step into the mirror! Watch royal crowns shimmer when you smile, shades flip when you raise your eyebrows, and vivid rainbows cascade when your mouth opens.
          </p>
        </div>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-bold text-white">100% Private</h2>
            <p className="text-[11px] text-slate-400">All compute is local in browser. Zero server uploads.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h2 className="text-xs font-bold text-white">478 Landmarks</h2>
            <p className="text-[11px] text-slate-400">High-speed MediaPipe tracking with 1€ filter.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <Eye className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-bold text-white">Expression AI</h2>
            <p className="text-[11px] text-slate-400">Physical shapes only. No emotional judgment.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs font-bold text-white">Dual Face Ready</h2>
            <p className="text-[11px] text-slate-400">Parent & child simultaneous real-time effects.</p>
          </div>
        </div>

        {/* Start Action / Loading Bar */}
        <div className="pt-2 space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-semibold">Loading Vision Intelligence…</span>
                <span className="font-mono text-amber-300">{loadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-4 rounded-full font-extrabold text-base sm:text-lg text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 shadow-xl shadow-amber-500/20 active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-3 border border-white/20"
            >
              <Camera className="w-5 h-5 text-amber-200" />
              <span>Start the Magic ✨</span>
            </button>
          )}

          <p className="text-[11px] text-slate-400">
            Clicking starts your webcam for live tracking. Camera stops immediately upon exiting.
          </p>
        </div>
      </main>

      {/* Privacy Guarantee Footer */}
      <footer className="relative z-10 mt-6 text-center text-xs text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
        <span>Privacy Promise: Zero biometric storage • Zero cloud transmission • Safe for school and family events</span>
      </footer>
    </div>
  );
};
