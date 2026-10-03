import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMirrorStore } from './store/useMirrorStore';
import { startCamera, stopCamera, getAvailableVideoDevices } from './core/camera';
import { faceTracker } from './core/faceTracker';
import { THEMES } from './effects/themes';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MirrorStage } from './components/MirrorStage';
import { CameraPermissionError, ModelLoadError } from './components/ErrorStates';

export const App: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasConsent = useMirrorStore((s) => s.hasConsent);
  const isStreaming = useMirrorStore((s) => s.isStreaming);
  const isModelLoading = useMirrorStore((s) => s.isModelLoading);
  const modelProgress = useMirrorStore((s) => s.modelProgress);
  const modelError = useMirrorStore((s) => s.modelError);
  const cameraError = useMirrorStore((s) => s.cameraError);
  const activeDeviceId = useMirrorStore((s) => s.activeDeviceId);
  const activeThemeId = useMirrorStore((s) => s.activeTheme);
  const highContrast = useMirrorStore((s) => s.highContrast);

  const setConsent = useMirrorStore((s) => s.setConsent);
  const setStreaming = useMirrorStore((s) => s.setStreaming);
  const setModelLoading = useMirrorStore((s) => s.setModelLoading);
  const setModelError = useMirrorStore((s) => s.setModelError);
  const setCameraError = useMirrorStore((s) => s.setCameraError);
  const setAvailableCameras = useMirrorStore((s) => s.setAvailableCameras);
  const setActiveDeviceId = useMirrorStore((s) => s.setActiveDeviceId);

  // Sync theme CSS variables
  useEffect(() => {
    const theme = THEMES[activeThemeId];
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primaryColor);
    root.style.setProperty('--theme-secondary', theme.secondaryColor);
    root.style.setProperty('--theme-accent', theme.accentColor);
    root.style.setProperty('--theme-glow', theme.glowColor);
  }, [activeThemeId]);

  // Keep streamRef updated
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Handle exiting / stopping camera
  const handleExit = useCallback(() => {
    if (streamRef.current) {
      stopCamera(streamRef.current);
      setStream(null);
    }
    setStreaming(false);
    setConsent(false);
  }, [setStreaming, setConsent]);

  // Handle camera start
  const handleStart = useCallback(async (deviceIdToUse?: string) => {
    setCameraError(null);
    setModelError(null);
    setModelLoading(true, 10);

    try {
      // 1. Initialize Face Landmarker AI model
      await faceTracker.init((prog) => {
        setModelLoading(true, prog);
      });
      setModelLoading(false, 100);

      // 2. Request Camera Stream
      const mediaStream = await startCamera({
        deviceId: deviceIdToUse || activeDeviceId || undefined,
        width: 1280,
        height: 720,
      });

      // Stop any existing stream
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }

      setStream(mediaStream);
      setConsent(true);
      setStreaming(true);

      // 3. Enumerate available cameras
      try {
        const devices = await getAvailableVideoDevices();
        setAvailableCameras(devices);
        if (devices.length > 0 && !activeDeviceId) {
          const currentTrack = mediaStream.getVideoTracks()[0];
          const settings = currentTrack?.getSettings();
          if (settings?.deviceId) {
            setActiveDeviceId(settings.deviceId);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      setModelLoading(false, 0);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permission denied');
      } else if (err.message && err.message.includes('model')) {
        setModelError(err.message);
      } else {
        setCameraError(err.message || 'Could not start camera');
      }
    }
  }, [
    activeDeviceId,
    setCameraError,
    setModelError,
    setModelLoading,
    setConsent,
    setStreaming,
    setAvailableCameras,
    setActiveDeviceId,
  ]);

  // Change camera device
  const handleCameraChange = useCallback((deviceId: string) => {
    setActiveDeviceId(deviceId);
    handleStart(deviceId);
  }, [setActiveDeviceId, handleStart]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
      faceTracker.dispose();
    };
  }, []);

  return (
    <div className={`w-screen h-screen overflow-hidden ${highContrast ? 'high-contrast' : ''}`}>
      {/* Camera Permission Error Overlay */}
      {cameraError && (
        <CameraPermissionError onRetry={() => handleStart()} />
      )}

      {/* Model Loading Error Overlay */}
      {modelError && (
        <ModelLoadError error={modelError} onRetry={() => handleStart()} />
      )}

      {/* Main Experience or Welcome Screen */}
      {hasConsent && isStreaming && stream ? (
        <MirrorStage
          stream={stream}
          onExit={handleExit}
          onCameraChange={handleCameraChange}
        />
      ) : (
        <WelcomeScreen
          onStart={() => handleStart()}
          isLoading={isModelLoading}
          loadProgress={modelProgress}
        />
      )}
    </div>
  );
};
