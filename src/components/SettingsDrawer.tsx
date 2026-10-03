import React from 'react';
import { useMirrorStore, SmoothingProfile, PerformanceMode } from '../store/useMirrorStore';
import {
  X,
  Sliders,
  Sparkles,
  FlipHorizontal,
  Camera,
  Activity,
  ShieldCheck,
  Eye,
  Zap,
  Contrast,
} from 'lucide-react';

interface SettingsDrawerProps {
  onCameraChange: (deviceId: string) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ onCameraChange }) => {
  const isOpen = useMirrorStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useMirrorStore((s) => s.setSettingsOpen);

  const smoothingProfile = useMirrorStore((s) => s.smoothingProfile);
  const setSmoothingProfile = useMirrorStore((s) => s.setSmoothingProfile);

  const effectIntensity = useMirrorStore((s) => s.effectIntensity);
  const setEffectIntensity = useMirrorStore((s) => s.setEffectIntensity);

  const mirrorHorizontal = useMirrorStore((s) => s.mirrorHorizontal);
  const toggleMirror = useMirrorStore((s) => s.toggleMirror);

  const showLandmarks = useMirrorStore((s) => s.showLandmarks);
  const setShowLandmarks = useMirrorStore((s) => s.setShowLandmarks);

  const showExpressionMeter = useMirrorStore((s) => s.showExpressionMeter);
  const setShowExpressionMeter = useMirrorStore((s) => s.setShowExpressionMeter);

  const showFps = useMirrorStore((s) => s.showFps);
  const setShowFps = useMirrorStore((s) => s.setShowFps);

  const performanceMode = useMirrorStore((s) => s.performanceMode);
  const setPerformanceMode = useMirrorStore((s) => s.setPerformanceMode);

  const highContrast = useMirrorStore((s) => s.highContrast);
  const setHighContrast = useMirrorStore((s) => s.setHighContrast);

  const reducedMotion = useMirrorStore((s) => s.reducedMotion);
  const setReducedMotion = useMirrorStore((s) => s.setReducedMotion);

  const availableCameras = useMirrorStore((s) => s.availableCameras);
  const activeDeviceId = useMirrorStore((s) => s.activeDeviceId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      <div className="w-full max-w-md h-full glass-panel border-l border-white/15 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-left">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 id="settings-heading" className="text-lg font-bold font-display text-white">
                Mirror Controls & Calibration
              </h2>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                Webcam Device
              </label>
              <select
                value={activeDeviceId}
                onChange={(e) => onCameraChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Smoothing Profile (One Euro Filter) */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Head Pose Smoothing (1€ Filter)
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-normal">
                {smoothingProfile}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['responsive', 'balanced', 'silky'] as SmoothingProfile[]).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setSmoothingProfile(prof)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer ${
                    smoothingProfile === prof
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {smoothingProfile === 'responsive' && 'Lowest latency (<25ms), crisp tracking for rapid head turns.'}
              {smoothingProfile === 'balanced' && 'Golden balance: zero perceptible jitter with responsive tracking.'}
              {smoothingProfile === 'silky' && 'Maximum anti-shake smoothing for movie-grade fluid movement.'}
            </p>
          </div>

          {/* Effect Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Effect & Particle Intensity
              </span>
              <span className="font-mono text-slate-400">{Math.round(effectIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={effectIntensity}
              onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            {/* Mirror Horizontal */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                <FlipHorizontal className="w-4 h-4 text-sky-400" />
                Mirror Video Horizontally
              </span>
              <input
                type="checkbox"
                checked={mirrorHorizontal}
                onChange={toggleMirror}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Expression Meter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Show Live Expression Meter
              </span>
              <input
                type="checkbox"
                checked={showExpressionMeter}
                onChange={(e) => setShowExpressionMeter(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Landmarks Debug Wireframe */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                Show AI Landmarks & Bounds
              </span>
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* FPS Counter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Show FPS & Latency Readout
              </span>
              <input
                type="checkbox"
                checked={showFps}
                onChange={(e) => setShowFps(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Performance Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Performance Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'quality', 'battery'] as PerformanceMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPerformanceMode(mode)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer ${
                    performanceMode === mode
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
              Accessibility
            </h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                <Contrast className="w-4 h-4 text-amber-300" />
                High Contrast Mode
              </span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-slate-200">
                Reduced Motion
              </span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Privacy Promise Footer */}
        <div className="pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-200 space-y-1">
              <p className="font-semibold text-emerald-100">100% In-Browser Privacy</p>
              <p className="text-emerald-300/80">
                No video, frames, or landmarks ever leave this device. Processing executes locally via client-side WebAssembly & WebGL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
