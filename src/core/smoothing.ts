import { Point2D, Point3D, HeadPose } from '../types';

/**
 * 1€ (One Euro) Filter
 * Reference: Casiez, G., Roussel, N. and Vogel, F. (2012).
 * 1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Human-Computer Interaction.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  setAlpha(alpha: number) {
    if (alpha <= 0 || alpha > 1.0) {
      // clamped
    }
  }

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = alpha * value + (1.0 - alpha) * (this.s ?? value);
    this.s = this.y;
    return this.y;
  }

  lastValue(): number | null {
    return this.y;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  setParams(minCutoff: number, beta: number, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp = performance.now()): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 1e-4);
    this.lastTime = timestamp;

    const prevX = this.xFilter.lastValue();
    const dx = prevX === null ? 0 : (value - prevX) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * Filter for 2D Points (e.g. screen anchors)
 */
export class Point2DFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(minCutoff = 0.8, beta = 0.04) {
    this.xFilter = new OneEuroFilter(minCutoff, beta);
    this.yFilter = new OneEuroFilter(minCutoff, beta);
  }

  setParams(minCutoff: number, beta: number) {
    this.xFilter.setParams(minCutoff, beta);
    this.yFilter.setParams(minCutoff, beta);
  }

  filter(pt: Point2D, timestamp = performance.now()): Point2D {
    return {
      x: this.xFilter.filter(pt.x, timestamp),
      y: this.yFilter.filter(pt.y, timestamp),
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}

/**
 * Filter for 3D Points
 */
export class Point3DFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private zFilter: OneEuroFilter;

  constructor(minCutoff = 0.8, beta = 0.04) {
    this.xFilter = new OneEuroFilter(minCutoff, beta);
    this.yFilter = new OneEuroFilter(minCutoff, beta);
    this.zFilter = new OneEuroFilter(minCutoff, beta);
  }

  setParams(minCutoff: number, beta: number) {
    this.xFilter.setParams(minCutoff, beta);
    this.yFilter.setParams(minCutoff, beta);
    this.zFilter.setParams(minCutoff, beta);
  }

  filter(pt: Point3D, timestamp = performance.now()): Point3D {
    return {
      x: this.xFilter.filter(pt.x, timestamp),
      y: this.yFilter.filter(pt.y, timestamp),
      z: this.zFilter.filter(pt.z, timestamp),
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }
}

/**
 * Filter for Head Pose (Yaw, Pitch, Roll)
 */
export class PoseFilter {
  private yawFilter: OneEuroFilter;
  private pitchFilter: OneEuroFilter;
  private rollFilter: OneEuroFilter;

  constructor(minCutoff = 0.7, beta = 0.05) {
    this.yawFilter = new OneEuroFilter(minCutoff, beta);
    this.pitchFilter = new OneEuroFilter(minCutoff, beta);
    this.rollFilter = new OneEuroFilter(minCutoff, beta);
  }

  setParams(minCutoff: number, beta: number) {
    this.yawFilter.setParams(minCutoff, beta);
    this.pitchFilter.setParams(minCutoff, beta);
    this.rollFilter.setParams(minCutoff, beta);
  }

  filter(pose: HeadPose, timestamp = performance.now()): HeadPose {
    return {
      yaw: this.yawFilter.filter(pose.yaw, timestamp),
      pitch: this.pitchFilter.filter(pose.pitch, timestamp),
      roll: this.rollFilter.filter(pose.roll, timestamp),
    };
  }

  reset() {
    this.yawFilter.reset();
    this.pitchFilter.reset();
    this.rollFilter.reset();
  }
}

export const SMOOTHING_PRESETS = {
  responsive: { minCutoff: 1.4, beta: 0.09 },
  balanced: { minCutoff: 0.8, beta: 0.04 },
  silky: { minCutoff: 0.35, beta: 0.015 },
};
