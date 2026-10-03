import { create } from 'zustand';
import { ThemeId, DetectedFace } from '../types';

export type SmoothingProfile = 'responsive' | 'balanced' | 'silky';
export type PerformanceMode = 'auto' | 'quality' | 'battery';

interface MirrorState {
  // Consent & Camera
  hasConsent: boolean;
  isStreaming: boolean;
  cameraError: string | null;
  availableCameras: MediaDeviceInfo[];
  activeDeviceId: string;
  mirrorHorizontal: boolean;
  
  // Model & Performance
  isModelLoading: boolean;
  modelProgress: number;
  modelError: string | null;
  fps: number;
  latencyMs: number;
  isLowLight: boolean;
  
  // Face Tracking Data
  faces: DetectedFace[];
  lastFaceTimestamp: number;
  
  // Effects & Themes
  activeEffects: string[];
  activeTheme: ThemeId;
  effectIntensity: number;
  smoothingProfile: SmoothingProfile;
  showLandmarks: boolean;
  showExpressionMeter: boolean;
  showFps: boolean;
  performanceMode: PerformanceMode;
  highContrast: boolean;
  reducedMotion: boolean;
  
  // UI & Photo Capture
  isSettingsOpen: boolean;
  isCapturing: boolean;
  captureCountdown: number | null;
  capturedPhotoUrl: string | null;
  isCaptureModalOpen: boolean;
  
  // Actions
  setConsent: (consent: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setCameraError: (error: string | null) => void;
  setAvailableCameras: (cameras: MediaDeviceInfo[]) => void;
  setActiveDeviceId: (deviceId: string) => void;
  setMirrorHorizontal: (mirror: boolean) => void;
  toggleMirror: () => void;
  
  setModelLoading: (loading: boolean, progress?: number) => void;
  setModelError: (error: string | null) => void;
  setFps: (fps: number, latencyMs?: number) => void;
  setIsLowLight: (isLow: boolean) => void;
  
  setFaces: (faces: DetectedFace[]) => void;
  
  toggleEffect: (effectId: string) => void;
  setEffects: (effects: string[]) => void;
  setTheme: (theme: ThemeId) => void;
  setEffectIntensity: (intensity: number) => void;
  setSmoothingProfile: (profile: SmoothingProfile) => void;
  setShowLandmarks: (show: boolean) => void;
  setShowExpressionMeter: (show: boolean) => void;
  setShowFps: (show: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setHighContrast: (contrast: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  startCaptureCountdown: (onComplete: () => void) => void;
  setCapturedPhotoUrl: (url: string | null) => void;
  setCaptureModalOpen: (open: boolean) => void;
}

export const useMirrorStore = create<MirrorState>((set, get) => ({
  hasConsent: false,
  isStreaming: false,
  cameraError: null,
  availableCameras: [],
  activeDeviceId: '',
  mirrorHorizontal: true,
  
  isModelLoading: false,
  modelProgress: 0,
  modelError: null,
  fps: 0,
  latencyMs: 0,
  isLowLight: false,
  
  faces: [],
  lastFaceTimestamp: Date.now(),
  
  activeEffects: ['crown', 'aura'],
  activeTheme: 'royal',
  effectIntensity: 1.0,
  smoothingProfile: 'balanced',
  showLandmarks: false,
  showExpressionMeter: true,
  showFps: true,
  performanceMode: 'auto',
  highContrast: false,
  reducedMotion: false,
  
  isSettingsOpen: false,
  isCapturing: false,
  captureCountdown: null,
  capturedPhotoUrl: null,
  isCaptureModalOpen: false,
  
  setConsent: (consent) => set({ hasConsent: consent }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setCameraError: (cameraError) => set({ cameraError }),
  setAvailableCameras: (availableCameras) => set({ availableCameras }),
  setActiveDeviceId: (activeDeviceId) => set({ activeDeviceId }),
  setMirrorHorizontal: (mirrorHorizontal) => set({ mirrorHorizontal }),
  toggleMirror: () => set((state) => ({ mirrorHorizontal: !state.mirrorHorizontal })),
  
  setModelLoading: (isModelLoading, modelProgress = 0) => set({ isModelLoading, modelProgress }),
  setModelError: (modelError) => set({ modelError }),
  setFps: (fps, latencyMs = 0) => set({ fps, latencyMs }),
  setIsLowLight: (isLowLight) => set({ isLowLight }),
  
  setFaces: (faces) => set({
    faces,
    lastFaceTimestamp: faces.length > 0 ? Date.now() : get().lastFaceTimestamp
  }),
  
  toggleEffect: (effectId) => set((state) => {
    const exists = state.activeEffects.includes(effectId);
    const updated = exists
      ? state.activeEffects.filter(id => id !== effectId)
      : [...state.activeEffects, effectId];
    return { activeEffects: updated };
  }),
  
  setEffects: (activeEffects) => set({ activeEffects }),
  setTheme: (activeTheme) => set({ activeTheme }),
  setEffectIntensity: (effectIntensity) => set({ effectIntensity }),
  setSmoothingProfile: (smoothingProfile) => set({ smoothingProfile }),
  setShowLandmarks: (showLandmarks) => set({ showLandmarks }),
  setShowExpressionMeter: (showExpressionMeter) => set({ showExpressionMeter }),
  setShowFps: (showFps) => set({ showFps }),
  setPerformanceMode: (performanceMode) => set({ performanceMode }),
  setHighContrast: (highContrast) => set({ highContrast }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  
  startCaptureCountdown: (onComplete) => {
    if (get().isCapturing) return;
    set({ isCapturing: true, captureCountdown: 3 });
    
    const tick = (val: number) => {
      if (val > 1) {
        set({ captureCountdown: val - 1 });
        setTimeout(() => tick(val - 1), 1000);
      } else {
        set({ captureCountdown: 0 });
        setTimeout(() => {
          set({ isCapturing: false, captureCountdown: null });
          onComplete();
        }, 400);
      }
    };
    
    setTimeout(() => tick(3), 1000);
  },
  
  setCapturedPhotoUrl: (capturedPhotoUrl) => set({ capturedPhotoUrl, isCaptureModalOpen: !!capturedPhotoUrl }),
  setCaptureModalOpen: (isCaptureModalOpen) => set({ isCaptureModalOpen, capturedPhotoUrl: isCaptureModalOpen ? get().capturedPhotoUrl : null }),
}));
