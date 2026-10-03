import React from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { THEMES } from '../effects/themes';

export const ExpressionMeter: React.FC = () => {
  const faces = useMirrorStore((s) => s.faces);
  const showMeter = useMirrorStore((s) => s.showExpressionMeter);
  const activeThemeId = useMirrorStore((s) => s.activeTheme);
  const theme = THEMES[activeThemeId];

  if (!showMeter || faces.length === 0) return null;

  // Use primary face (or first detected)
  const face = faces[0];
  const scores = face.expression.scores;

  const meters = [
    { label: 'Smile', value: scores.smile, color: theme.primaryColor },
    { label: 'Sad', value: scores.sad, color: '#60a5fa' },
    { label: 'Angry', value: scores.angry, color: '#ef4444' },
    { label: 'Mouth Open', value: scores.jawOpen, color: theme.secondaryColor },
    { label: 'Brow Raise', value: scores.browRaise, color: theme.accentColor },
    { label: 'Kiss Pucker', value: scores.mouthPucker, color: '#f43f5e' },
    {
      label: 'Wink Asymmetry',
      value: Math.abs(scores.eyeBlinkLeft - scores.eyeBlinkRight),
      color: '#38bdf8',
    },
  ];

  return (
    <div className="glass-panel p-3.5 rounded-2xl w-60 border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 font-display">
          Expression Dynamics
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">
          Raw Blendshapes
        </span>
      </div>

      <div className="space-y-2">
        {meters.map((m) => {
          const percent = Math.min(100, Math.round(m.value * 100));
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-medium text-[11px] text-slate-300">{m.label}</span>
                <span className="font-mono text-[10px] text-slate-400">{percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: m.color,
                    boxShadow: percent > 40 ? `0 0 8px ${m.color}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
