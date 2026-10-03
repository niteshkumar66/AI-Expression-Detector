import React from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { Users, Activity } from 'lucide-react';

export const StatusChip: React.FC = () => {
  const faces = useMirrorStore((s) => s.faces);
  const fps = useMirrorStore((s) => s.fps);
  const latencyMs = useMirrorStore((s) => s.latencyMs);
  const showFps = useMirrorStore((s) => s.showFps);
  const isModelLoading = useMirrorStore((s) => s.isModelLoading);

  const faceCount = faces.length;
  const hasFace = faceCount > 0;

  return (
    <div className="flex items-center gap-2.5">
      {/* Face Detection Status Chip */}
      <div
        className={`glass-chip px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
          hasFace
            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
            : 'border-amber-500/30 bg-amber-950/30 text-amber-200'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5">
          {hasFace ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </>
          ) : (
            <>
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </>
          )}
        </span>

        <span className="text-xs sm:text-sm font-medium tracking-wide">
          {isModelLoading
            ? 'Initializing AI tracker…'
            : hasFace
            ? faceCount === 1
              ? 'Face detected ✓'
              : `${faceCount} Faces detected ✓`
            : 'Looking for a face…'}
        </span>

        {faceCount > 1 && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
            <Users className="w-3 h-3" /> Dual Track
          </span>
        )}
      </div>

      {/* Live FPS & Latency Chip */}
      {showFps && (
        <div className="hidden sm:flex glass-chip px-3 py-1.5 rounded-full items-center gap-2 text-xs font-mono text-slate-300 border-white/10">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>{fps} FPS</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{latencyMs}ms</span>
        </div>
      )}
    </div>
  );
};
