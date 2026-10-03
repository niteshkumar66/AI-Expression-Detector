import React from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { Download, RotateCcw, X, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CaptureModal: React.FC = () => {
  const photoUrl = useMirrorStore((s) => s.capturedPhotoUrl);
  const isOpen = useMirrorStore((s) => s.isCaptureModalOpen);
  const setCaptureModalOpen = useMirrorStore((s) => s.setCaptureModalOpen);
  const [downloaded, setDownloaded] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && photoUrl) {
      setDownloaded(false);
      // Trigger magical confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f43f5e', '#38bdf8', '#a855f7'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen, photoUrl]);

  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `magic-mirror-${timestamp}.png`;
    link.href = photoUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-title"
    >
      <div className="relative glass-panel rounded-3xl p-4 sm:p-6 max-w-2xl w-full border-white/20 shadow-2xl flex flex-col items-center gap-5">
        {/* Close Button */}
        <button
          onClick={() => setCaptureModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h2 id="capture-title" className="text-xl sm:text-2xl font-bold font-display text-white">
              Magic Moment Captured!
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Saved 100% locally on your device. Never uploaded to any server.
          </p>
        </div>

        {/* Photo Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black max-h-[58vh] flex items-center justify-center">
          <img
            src={photoUrl}
            alt="Magic Mirror Portrait"
            className="w-full h-auto object-contain rounded-2xl"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-initial glass-button px-6 py-3 rounded-full flex items-center justify-center gap-2.5 font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-lg cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved to Photos!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Photo</span>
              </>
            )}
          </button>

          <button
            onClick={() => setCaptureModalOpen(false)}
            className="flex-1 sm:flex-initial glass-button px-6 py-3 rounded-full flex items-center justify-center gap-2 font-medium text-sm text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake</span>
          </button>
        </div>
      </div>
    </div>
  );
};
