import React from 'react';
import { CameraOff, AlertTriangle, RefreshCw, Sun, Sparkles } from 'lucide-react';

interface CameraPermissionErrorProps {
  onRetry: () => void;
}

export const CameraPermissionError: React.FC<CameraPermissionErrorProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
      <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border-rose-500/30 text-center space-y-5 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <CameraOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display text-white">Camera Access Needed</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The Magic Mirror runs entirely on your device and requires camera access to detect head pose and expressions.
          </p>
        </div>

        <div className="text-left bg-slate-900/60 p-4 rounded-xl border border-white/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-white">To grant access:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Click the camera or lock icon in your browser address bar.</li>
            <li>Select <span className="text-amber-300 font-medium">"Allow"</span> for Camera.</li>
            <li>Click the button below to start the magic!</li>
          </ol>
        </div>

        <button
          onClick={onRetry}
          className="w-full glass-button py-3 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};

export const ModelLoadError: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
      <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border-amber-500/30 text-center space-y-5 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display text-white">AI Engine Setup</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Could not initialize the local vision model: <span className="text-amber-200">{error}</span>
          </p>
        </div>

        <button
          onClick={onRetry}
          className="w-full glass-button py-3 px-6 rounded-full font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    </div>
  );
};

export const LowLightTip: React.FC = () => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
      <div className="glass-chip px-4 py-2 rounded-full border-amber-500/40 bg-amber-950/70 text-amber-200 flex items-center gap-2 text-xs shadow-lg">
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Lighting looks dim — brighter light gives sharper head tracking!</span>
      </div>
    </div>
  );
};

export const IdleAttractPrompt: React.FC = () => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center select-none">
      <div className="glass-panel px-8 py-5 rounded-3xl border-white/20 shadow-2xl text-center space-y-2 animate-gentle-pulse max-w-sm backdrop-blur-xl">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-300 mb-1">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold font-display text-white">Step in front of the mirror</h3>
        <p className="text-xs text-slate-300">
          Stand ~1.5 - 2 metres away to unlock magical interactive face effects ✨
        </p>
      </div>
    </div>
  );
};
