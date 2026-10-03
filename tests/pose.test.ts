import { describe, it, expect } from 'vitest';
import { extractPoseFromMatrix, extractPoseFromLandmarks, computeFaceGeometry } from '../src/core/pose';
import { Point3D } from '../src/types';

describe('extractPoseFromMatrix', () => {
  it('returns near-zero Euler angles for an identity transformation matrix', () => {
    // 4x4 Identity Matrix in column-major
    const identity = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    const pose = extractPoseFromMatrix(identity);
    expect(pose).not.toBeNull();
    expect(pose!.yaw).toBeCloseTo(0, 2);
    expect(pose!.pitch).toBeCloseTo(0, 2);
    expect(pose!.roll).toBeCloseTo(0, 2);
  });

  it('correctly extracts roll from rotated matrix around Z axis', () => {
    // Rotation around Z by 30 deg (~0.523 rad)
    const angle = Math.PI / 6;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // [ cos -sin 0 0 ]
    // [ sin  cos 0 0 ]
    // [  0    0  1 0 ]
    // [  0    0  0 1 ]
    // Column-major:
    const matrix = [
      cosA, sinA, 0, 0,
      -sinA, cosA, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    const pose = extractPoseFromMatrix(matrix);
    expect(pose).not.toBeNull();
    expect(pose!.roll).toBeCloseTo(angle, 2);
  });
});

describe('extractPoseFromLandmarks', () => {
  it('extracts head roll angle when eyes are tilted', () => {
    const landmarks: Point3D[] = new Array(478).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));

    // Left eye (263) and Right eye (33) tilted at ~45 degrees
    // In MediaPipe normalized coordinates
    landmarks[263] = { x: 0.6, y: 0.4, z: 0 };
    landmarks[33] = { x: 0.4, y: 0.6, z: 0 };
    landmarks[4] = { x: 0.5, y: 0.5, z: 0 }; // nose
    landmarks[10] = { x: 0.5, y: 0.2, z: 0 }; // forehead
    landmarks[152] = { x: 0.5, y: 0.8, z: 0 }; // chin

    const pose = extractPoseFromLandmarks(landmarks);
    expect(pose.roll).toBeGreaterThan(0.5); // Positive tilt
  });
});

describe('computeFaceGeometry', () => {
  it('computes screen coordinates, bounding boxes, and anatomical anchors', () => {
    const landmarks: Point3D[] = new Array(478).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));

    landmarks[10] = { x: 0.5, y: 0.2, z: 0 }; // forehead
    landmarks[152] = { x: 0.5, y: 0.8, z: 0 }; // chin
    landmarks[33] = { x: 0.3, y: 0.4, z: 0 }; // right eye
    landmarks[263] = { x: 0.7, y: 0.4, z: 0 }; // left eye
    landmarks[4] = { x: 0.5, y: 0.5, z: 0 }; // nose tip
    landmarks[61] = { x: 0.4, y: 0.65, z: 0 }; // mouth left
    landmarks[291] = { x: 0.6, y: 0.65, z: 0 }; // mouth right

    const geom = computeFaceGeometry(landmarks, 1000, 1000);

    expect(geom.landmarksScreen.length).toBe(478);
    expect(geom.bounds.width).toBeGreaterThan(0);
    expect(geom.bounds.height).toBeGreaterThan(0);
    expect(geom.anchors.forehead.y).toBe(200);
    expect(geom.anchors.chin.y).toBe(800);
    expect(geom.anchors.eyeCenter.x).toBe(500);
    expect(geom.anchors.eyeCenter.y).toBe(400);
    expect(geom.anchors.faceWidth).toBeGreaterThan(300);
  });
});
