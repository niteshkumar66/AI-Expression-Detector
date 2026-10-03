import React from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { StatusChip } from './StatusChip';
import { Camera, Maximize, Minimize, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  onCapture: () => void;
  onExit: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onCapture, onExit }) => {
  const faces = useMirrorStore((s) => s.faces);
  const toggleSettings = useMirrorStore((s) => s.toggleSettings);
  const isCapturing = useMirrorStore((s) => s.isCapturing);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Expression indicator from primary face
  const primaryFace = faces[0];
  const expression = primaryFace?.expression;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Left: Status and FPS */}
      <div className="pointer-events-auto">
        <StatusChip />
      </div>

      {/* Center: Live Expression Callout */}
      <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          {expression && (
            <motion.div
              key={expression.primaryCategory}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-chip px-5 py-2 rounded-full border-white/20 shadow-xl flex items-center gap-2.5 backdrop-blur-xl bg-slate-900/75"
            >
              <span className="text-xl leading-none">{expression.emoji}</span>
              <span className="text-sm font-semibold text-white tracking-wide font-display">
                {expression.friendlyLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        {/* Photo Capture Button */}
        <button
          onClick={onCapture}
          disabled={isCapturing}
          className="glass-button px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm text-white hover:border-amber-400/50 hover:shadow-amber-500/20 active:scale-95 cursor-pointer bg-gradient-to-r from-amber-500/20 to-pink-500/20 border-white/20"
          aria-label="Capture photo (Spacebar)"
          title="Capture photo (Spacebar)"
        >
          <Camera className="w-4 h-4 text-amber-300" />
          <span className="hidden md:inline font-display">Capture</span>
          <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
            Space
          </kbd>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="glass-button p-2.5 rounded-full text-slate-300 hover:text-white cursor-pointer"
          aria-label="Toggle Fullscreen (F)"
          title="Toggle Fullscreen (F)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={toggleSettings}
          className="glass-button p-2.5 rounded-full text-slate-300 hover:text-white cursor-pointer"
          aria-label="Open Settings"
          title="Open Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Exit / Stop Camera Button */}
        <button
          onClick={onExit}
          className="glass-button p-2.5 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 hover:border-rose-500/40 cursor-pointer"
          aria-label="Stop Camera and Exit"
          title="Stop Camera and Exit"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
