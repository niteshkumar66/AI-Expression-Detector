// Type definitions for AI Magic Mirror

export type ThemeId = 'royal' | 'space' | 'garden' | 'neon';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  vignetteColor: string;
  particleColors: string[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HeadPose {
  yaw: number;   // rotation around Y axis (looking left/right) in radians
  pitch: number; // rotation around X axis (looking up/down) in radians
  roll: number;  // rotation around Z axis (tilting head) in radians
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  center: Point2D;
}

export type PhysicalExpressionCategory =
  | 'Neutral face'
  | 'Smile'
  | 'Big smile / Laugh shape'
  | 'Mouth open / Surprise shape'
  | 'Eyebrows raised'
  | 'Wink left'
  | 'Wink right'
  | 'Kiss shape'
  | 'Sad face'
  | 'Angry face';

export interface ExpressionScores {
  smile: number;
  sad: number;
  angry: number;
  jawOpen: number;
  mouthFunnel: number;
  browRaise: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  mouthPucker: number;
}

export interface FaceExpressionData {
  primaryCategory: PhysicalExpressionCategory;
  friendlyLabel: string;
  emoji: string;
  confidence: number;
  scores: ExpressionScores;
}

export interface DetectedFace {
  id: number;
  landmarks: Point3D[]; // 468 or 478 landmarks normalized (0-1)
  landmarksScreen: Point2D[]; // in canvas pixel coordinates
  pose: HeadPose;
  bounds: FaceBounds;
  expression: FaceExpressionData;
  // Key anatomical anchors in screen coordinates
  anchors: {
    forehead: Point2D;
    noseTip: Point2D;
    chin: Point2D;
    leftEye: Point2D;
    rightEye: Point2D;
    eyeCenter: Point2D;
    mouthCenter: Point2D;
    mouthUpper: Point2D;
    mouthLower: Point2D;
    mouthLeft: Point2D;
    mouthRight: Point2D;
    leftEar: Point2D;
    rightEar: Point2D;
    faceWidth: number;
  };
}

export interface EffectContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  theme: ThemeConfig;
  intensity: number;
  isMirrored: boolean;
  timestamp: number;
  dt: number;
}

export interface IEffect {
  id: string;
  name: string;
  iconName: string;
  description: string;
  init(): void;
  update(face: DetectedFace, dt: number, theme: ThemeConfig, intensity: number): void;
  render(ctx: CanvasRenderingContext2D, face: DetectedFace, theme: ThemeConfig, intensity: number, isMirrored: boolean): void;
  dispose(): void;
}
