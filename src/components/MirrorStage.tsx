import React, { useRef, useEffect, useCallback } from 'react';
import { useMirrorStore } from '../store/useMirrorStore';
import { faceTracker } from '../core/faceTracker';
import { effectManager } from '../effects';
import { THEMES } from '../effects/themes';
import { analyzeLightLevel } from '../core/camera';
import { TopBar } from './TopBar';
import { EffectDock } from './EffectDock';
import { ExpressionMeter } from './ExpressionMeter';
import { SettingsDrawer } from './SettingsDrawer';
import { CaptureModal } from './CaptureModal';
import { LowLightTip, IdleAttractPrompt } from './ErrorStates';

interface MirrorStageProps {
  stream: MediaStream;
  onExit: () => void;
  onCameraChange: (deviceId: string) => void;
}

export const MirrorStage: React.FC<MirrorStageProps> = ({
  stream,
  onExit,
  onCameraChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store access
  const activeEffects = useMirrorStore((s) => s.activeEffects);
  const activeThemeId = useMirrorStore((s) => s.activeTheme);
  const effectIntensity = useMirrorStore((s) => s.effectIntensity);
  const mirrorHorizontal = useMirrorStore((s) => s.mirrorHorizontal);
  const showLandmarks = useMirrorStore((s) => s.showLandmarks);
  const isCapturing = useMirrorStore((s) => s.isCapturing);
  const captureCountdown = useMirrorStore((s) => s.captureCountdown);
  const isLowLight = useMirrorStore((s) => s.isLowLight);
  const lastFaceTimestamp = useMirrorStore((s) => s.lastFaceTimestamp);
  const smoothingProfile = useMirrorStore((s) => s.smoothingProfile);

  const setFaces = useMirrorStore((s) => s.setFaces);
  const setFps = useMirrorStore((s) => s.setFps);
  const setIsLowLight = useMirrorStore((s) => s.setIsLowLight);
  const startCaptureCountdown = useMirrorStore((s) => s.startCaptureCountdown);
  const setCapturedPhotoUrl = useMirrorStore((s) => s.setCapturedPhotoUrl);
  const toggleEffect = useMirrorStore((s) => s.toggleEffect);
  const toggleMirror = useMirrorStore((s) => s.toggleMirror);

  const theme = THEMES[activeThemeId];

  // Update tracker smoothing profile when changed
  useEffect(() => {
    faceTracker.setSmoothingProfile(smoothingProfile);
  }, [smoothingProfile]);

  // Hook video stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.play().catch((e) => console.warn('Video play error:', e));

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  // Take photo composite
  const captureComposite = useCallback(() => {
    const video = videoRef.current;
    const overlayCanvas = canvasRef.current;
    if (!video || !overlayCanvas) return;

    const width = overlayCanvas.width;
    const height = overlayCanvas.height;

    // Create high-res offscreen composite canvas
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = width;
    snapCanvas.height = height;
    const snapCtx = snapCanvas.getContext('2d');
    if (!snapCtx) return;

    snapCtx.save();
    if (mirrorHorizontal) {
      snapCtx.translate(width, 0);
      snapCtx.scale(-1, 1);
    }
    // Draw raw video frame
    snapCtx.drawImage(video, 0, 0, width, height);
    snapCtx.restore();

    // Composite overlay effects
    snapCtx.drawImage(overlayCanvas, 0, 0, width, height);

    // Subtle branding watermark in corner
    snapCtx.save();
    snapCtx.font = 'bold 16px "Outfit", sans-serif';
    snapCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    snapCtx.shadowColor = 'rgba(0,0,0,0.8)';
    snapCtx.shadowBlur = 6;
    snapCtx.fillText('AI Magic Mirror ✨', 24, height - 24);
    snapCtx.restore();

    const dataUrl = snapCanvas.toDataURL('image/png', 0.95);
    setCapturedPhotoUrl(dataUrl);
  }, [mirrorHorizontal, setCapturedPhotoUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        startCaptureCountdown(captureComposite);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMirror();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const effectIds = ['crown', 'glasses', 'aura', 'rainbow', 'eyes', 'mesh', 'ears'];
        const index = parseInt(e.key, 10) - 1;
        if (effectIds[index]) {
          toggleEffect(effectIds[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startCaptureCountdown, captureComposite, toggleMirror, toggleEffect]);

  // Main Detection & Render Loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let isRunning = true;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let lightCheckTimer = performance.now();

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (document.hidden) {
        animFrameId.current = requestAnimationFrame(renderLoop);
        return;
      }

      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      // Update canvas resolution to match video element
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const width = canvas.width || 1280;
      const height = canvas.height || 720;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState >= 2) {
        // Measure detection latency
        const detectStart = performance.now();
        const faces = faceTracker.detectFaces(video, timestamp, width, height);
        const latency = Math.round(performance.now() - detectStart);

        // Update face store
        setFaces(faces);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update & Render Effects
        effectManager.update(faces, dt, theme, effectIntensity, activeEffects);
        effectManager.render(
          ctx,
          width,
          height,
          faces,
          theme,
          effectIntensity,
          activeEffects,
          mirrorHorizontal,
          showLandmarks
        );

        // FPS Calculation
        frameCount++;
        if (timestamp - fpsTimer >= 1000) {
          const currentFps = Math.round((frameCount * 1000) / (timestamp - fpsTimer));
          setFps(currentFps, latency);
          frameCount = 0;
          fpsTimer = timestamp;
        }

        // Ambient Light Check (every 2.5s)
        if (timestamp - lightCheckTimer >= 2500) {
          const { isLowLight: low } = analyzeLightLevel(video, sampleCanvasRef.current || undefined);
          setIsLowLight(low);
          lightCheckTimer = timestamp;
        }
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [
    activeEffects,
    theme,
    effectIntensity,
    mirrorHorizontal,
    showLandmarks,
    setFaces,
    setFps,
    setIsLowLight,
  ]);

  const isIdle = Date.now() - lastFaceTimestamp > 10000;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Underlying Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
          mirrorHorizontal ? '-scale-x-100' : ''
        }`}
      />

      {/* Render Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          mirrorHorizontal ? '-scale-x-100' : ''
        }`}
      />

      {/* Photo Capture Flash Animation */}
      {captureCountdown === 0 && (
        <div className="absolute inset-0 bg-white pointer-events-none animate-flash z-40" />
      )}

      {/* 3-2-1 Countdown Overlay */}
      {isCapturing && captureCountdown !== null && captureCountdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="text-8xl sm:text-9xl font-black font-display text-white animate-ping drop-shadow-2xl">
            {captureCountdown}
          </div>
        </div>
      )}

      {/* Low Light Tip Banner */}
      {isLowLight && <LowLightTip />}

      {/* Idle / Attract Mode Prompt */}
      {isIdle && <IdleAttractPrompt />}

      {/* Top Bar (Status, Live Expression Badge, Actions) */}
      <TopBar
        onCapture={() => startCaptureCountdown(captureComposite)}
        onExit={onExit}
      />

      {/* Docked Live Expression Meter */}
      <div className="fixed top-20 right-4 sm:right-6 z-20 pointer-events-auto hidden md:block">
        <ExpressionMeter />
      </div>

      {/* Bottom Dock (Effect Carousel, Theme Switcher) */}
      <EffectDock />

      {/* Settings Drawer */}
      <SettingsDrawer onCameraChange={onCameraChange} />

      {/* Capture Preview & Download Modal */}
      <CaptureModal />
    </div>
  );
};
