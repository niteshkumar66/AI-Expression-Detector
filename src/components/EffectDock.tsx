import React from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { THEMES } from '../effects/themes';
import { ThemeId } from '../types';
import {
  Crown,
  Glasses,
  Sparkles,
  Flame,
  Heart,
  Cpu,
  Smile,
  Palette,
} from 'lucide-react';

interface EffectItem {
  id: string;
  name: string;
  keyNumber: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hint: string;
}

const EFFECTS_LIST: EffectItem[] = [
  { id: 'crown', name: 'Crown', keyNumber: '1', icon: Crown, hint: 'Smiles burst sparkles' },
  { id: 'glasses', name: 'Shades', keyNumber: '2', icon: Glasses, hint: 'Eyebrow raise flips' },
  { id: 'aura', name: 'Aura', keyNumber: '3', icon: Sparkles, hint: 'Glows with smile' },
  { id: 'rainbow', name: 'Rainbow', keyNumber: '4', icon: Flame, hint: 'Open mouth stream' },
  { id: 'eyes', name: 'Hearts', keyNumber: '5', icon: Heart, hint: 'Wink / Kiss reactions' },
  { id: 'mesh', name: 'Sci-Mesh', keyNumber: '6', icon: Cpu, hint: 'Neon face wireframe' },
  { id: 'ears', name: 'Animals', keyNumber: '7', icon: Smile, hint: 'Head tilt wiggles' },
];

const THEME_OPTIONS: { id: ThemeId; name: string; emoji: string }[] = [
  { id: 'royal', name: 'Royal', emoji: '👑' },
  { id: 'space', name: 'Space', emoji: '🚀' },
  { id: 'garden', name: 'Garden', emoji: '🌸' },
  { id: 'neon', name: 'Neon', emoji: '⚡' },
];

export const EffectDock: React.FC = () => {
  const activeEffects = useMirrorStore((s) => s.activeEffects);
  const toggleEffect = useMirrorStore((s) => s.toggleEffect);
  const activeTheme = useMirrorStore((s) => s.activeTheme);
  const setTheme = useMirrorStore((s) => s.setTheme);

  const themeConfig = THEMES[activeTheme];

  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-30 flex flex-col items-center gap-3 pointer-events-none select-none">
      {/* Themes Bar */}
      <div className="pointer-events-auto flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border-white/10 shadow-lg">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-2">
          <Palette className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Theme:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {THEME_OPTIONS.map((t) => {
            const isSelected = activeTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white/20 text-white shadow-md border border-white/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: themeConfig.primaryColor,
                        boxShadow: `0 0 12px ${themeConfig.glowColor}`,
                      }
                    : {}
                }
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Effects Dock */}
      <div className="pointer-events-auto glass-panel px-3 sm:px-5 py-3 rounded-2xl sm:rounded-3xl border-white/15 shadow-2xl flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-[95vw] backdrop-blur-2xl">
        {EFFECTS_LIST.map((item) => {
          const isActive = activeEffects.includes(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => toggleEffect(item.id)}
              className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer group min-w-[68px] sm:min-w-[80px] ${
                isActive
                  ? 'bg-white/15 text-white border-2'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/10'
              }`}
              style={
                isActive
                  ? {
                      borderColor: themeConfig.primaryColor,
                      boxShadow: `0 0 18px ${themeConfig.glowColor}`,
                    }
                  : {}
              }
              aria-pressed={isActive}
              aria-label={`Toggle ${item.name} effect (${item.keyNumber})`}
              title={`${item.name} (${item.hint})`}
            >
              {/* Shortcut badge */}
              <span className="absolute top-1 right-1.5 text-[9px] font-mono text-slate-400 opacity-60 group-hover:opacity-100">
                {item.keyNumber}
              </span>

              <div
                className={`p-2 rounded-xl mb-1 transition-transform group-hover:scale-110 ${
                  isActive ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                <Icon
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={isActive ? { color: themeConfig.primaryColor } : {}}
                />
              </div>

              <span className="text-[11px] sm:text-xs font-semibold tracking-wide font-display">
                {item.name}
              </span>

              {/* Active glow indicator dot */}
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1"
                  style={{
                    backgroundColor: themeConfig.primaryColor,
                    boxShadow: `0 0 6px ${themeConfig.primaryColor}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
