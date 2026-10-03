import { HeadPose, Point2D, Point3D, FaceBounds } from '../types';

/**
 * Key MediaPipe Face Mesh landmark indices
 */
export const LANDMARK_INDEX = {
  FOREHEAD: 10,
  NOSE_TIP: 4,
  CHIN: 152,
  LEFT_EYE_OUTER: 263,
  LEFT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 33,
  RIGHT_EYE_INNER: 133,
  LEFT_EYE_PUPIL: 468, // iris landmark if available
  RIGHT_EYE_PUPIL: 473,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  MOUTH_UPPER: 13,
  MOUTH_LOWER: 14,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  NOSE_BRIDGE: 168,
  LEFT_EYEBROW_TOP: 70,
  RIGHT_EYEBROW_TOP: 300,
};

/**
 * Extracts Euler angles (yaw, pitch, roll in radians) from a 4x4 facial transformation matrix.
 * MediaPipe provides transformation matrix in column-major order:
 * [ R00  R01  R02  Tx ]
 * [ R10  R11  R12  Ty ]
 * [ R20  R21  R22  Tz ]
 * [ 0    0    0    1  ]
 */
export function extractPoseFromMatrix(matrix: number[] | Float32Array): HeadPose | null {
  if (!matrix || matrix.length < 16) return null;

  // Assuming column-major
  // m0  m4  m8  m12
  // m1  m5  m9  m13
  // m2  m6  m10 m14
  // m3  m7  m11 m15
  const r02 = matrix[8];
  const r10 = matrix[1];
  const r11 = matrix[5];
  const r12 = matrix[9];
  const r22 = matrix[10];

  // Pitch (around X axis)
  const pitch = Math.atan2(-r12, Math.sqrt(r02 * r02 + r22 * r22));

  // Yaw (around Y axis)
  const yaw = Math.atan2(r02, r22);

  // Roll (around Z axis)
  const roll = Math.atan2(r10, r11);

  if (isNaN(yaw) || isNaN(pitch) || isNaN(roll)) {
    return null;
  }

  return { yaw, pitch, roll };
}

/**
 * Geometric pose estimation from 3D landmarks (robust fallback and cross-validation)
 */
export function extractPoseFromLandmarks(landmarks: Point3D[]): HeadPose {
  const leftEye = landmarks[LANDMARK_INDEX.LEFT_EYE_OUTER] || landmarks[263];
  const rightEye = landmarks[LANDMARK_INDEX.RIGHT_EYE_OUTER] || landmarks[33];
  const nose = landmarks[LANDMARK_INDEX.NOSE_TIP] || landmarks[4];
  const chin = landmarks[LANDMARK_INDEX.CHIN] || landmarks[152];
  const forehead = landmarks[LANDMARK_INDEX.FOREHEAD] || landmarks[10];

  // 1. Roll: Angle of the eye line relative to horizontal
  const dX = rightEye.x - leftEye.x;
  const dY = rightEye.y - leftEye.y;
  const roll = Math.atan2(dY, dX);

  // 2. Yaw: Lateral displacement of nose relative to eye midpoint
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeDist = Math.max(Math.hypot(dX, dY), 0.01);
  const noseOffset = (nose.x - eyeMidX) / eyeDist;
  // Non-linear projection to radians
  const yaw = Math.asin(Math.max(-1, Math.min(1, noseOffset * 1.8)));

  // 3. Pitch: Vertical tilt of forehead -> nose -> chin vector
  const faceHeight = Math.hypot(forehead.x - chin.x, forehead.y - chin.y);
  const upperDist = Math.hypot(forehead.x - nose.x, forehead.y - nose.y);
  const lowerDist = Math.hypot(chin.x - nose.x, chin.y - nose.y);
  const pitchRatio = (lowerDist - upperDist) / Math.max(faceHeight, 0.01);
  const pitch = Math.asin(Math.max(-1, Math.min(1, pitchRatio * 1.5)));

  return {
    yaw: isNaN(yaw) ? 0 : yaw,
    pitch: isNaN(pitch) ? 0 : pitch,
    roll: isNaN(roll) ? 0 : roll,
  };
}

/**
 * Calculates screen coordinates and bounding box for detected landmarks
 */
export function computeFaceGeometry(
  landmarks: Point3D[],
  canvasWidth: number,
  canvasHeight: number
): {
  landmarksScreen: Point2D[];
  bounds: FaceBounds;
  anchors: any;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const landmarksScreen: Point2D[] = new Array(landmarks.length);

  for (let i = 0; i < landmarks.length; i++) {
    const lx = landmarks[i].x * canvasWidth;
    const ly = landmarks[i].y * canvasHeight;
    landmarksScreen[i] = { x: lx, y: ly };

    if (lx < minX) minX = lx;
    if (ly < minY) minY = ly;
    if (lx > maxX) maxX = lx;
    if (ly > maxY) maxY = ly;
  }

  const bounds: FaceBounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  };

  const getScreenPt = (idx: number): Point2D => {
    return landmarksScreen[idx] || bounds.center;
  };

  const leftEye = getScreenPt(LANDMARK_INDEX.LEFT_EYE_OUTER);
  const rightEye = getScreenPt(LANDMARK_INDEX.RIGHT_EYE_OUTER);
  const mouthLeft = getScreenPt(LANDMARK_INDEX.MOUTH_LEFT);
  const mouthRight = getScreenPt(LANDMARK_INDEX.MOUTH_RIGHT);
  const mouthUpper = getScreenPt(LANDMARK_INDEX.MOUTH_UPPER);
  const mouthLower = getScreenPt(LANDMARK_INDEX.MOUTH_LOWER);

  const anchors = {
    forehead: getScreenPt(LANDMARK_INDEX.FOREHEAD),
    noseTip: getScreenPt(LANDMARK_INDEX.NOSE_TIP),
    chin: getScreenPt(LANDMARK_INDEX.CHIN),
    leftEye,
    rightEye,
    eyeCenter: {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    },
    mouthCenter: {
      x: (mouthLeft.x + mouthRight.x) / 2,
      y: (mouthUpper.y + mouthLower.y) / 2,
    },
    mouthUpper,
    mouthLower,
    mouthLeft,
    mouthRight,
    leftEar: getScreenPt(LANDMARK_INDEX.LEFT_EAR),
    rightEar: getScreenPt(LANDMARK_INDEX.RIGHT_EAR),
    faceWidth: Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) * 2.2,
  };

  return { landmarksScreen, bounds, anchors };
}
