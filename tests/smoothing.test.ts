import { describe, it, expect } from 'vitest';
import { OneEuroFilter, Point2DFilter, PoseFilter } from '../src/core/smoothing';

describe('OneEuroFilter', () => {
  it('dramatically reduces jitter variance on noisy static signal', () => {
    const filter = new OneEuroFilter(0.8, 0.04);
    const baseValue = 100;
    const noisySamples: number[] = [];
    const filteredSamples: number[] = [];

    // Simulate 60 FPS signal with Gaussian-like jitter
    let time = 0;
    for (let i = 0; i < 60; i++) {
      time += 16.66;
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 3.1)) * 3;
      const noisyVal = baseValue + noise;
      noisySamples.push(noisyVal);
      filteredSamples.push(filter.filter(noisyVal, time));
    }

    // Skip initial settling
    const steadyNoisy = noisySamples.slice(15);
    const steadyFiltered = filteredSamples.slice(15);

    const calcVariance = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
    };

    const noisyVar = calcVariance(steadyNoisy);
    const filteredVar = calcVariance(steadyFiltered);

    // Filtered signal should have significantly lower variance than raw jitter
    expect(filteredVar).toBeLessThan(noisyVar * 0.45);
  });

  it('responds quickly to sudden large head movement (high velocity)', () => {
    const filter = new OneEuroFilter(0.8, 0.04);

    // Initial resting state around 0
    let time = 0;
    for (let i = 0; i < 30; i++) {
      time += 16.66;
      filter.filter(0, time);
    }

    // Sudden rapid jump from 0 to 500
    time += 16.66;
    const step1 = filter.filter(500, time);
    time += 16.66;
    const step2 = filter.filter(500, time);
    time += 16.66;
    const step3 = filter.filter(500, time);

    // Speed-adaptive cutoff should allow rapid transition towards 500
    expect(step1).toBeGreaterThan(150);
    expect(step2).toBeGreaterThan(step1);
    expect(step3).toBeGreaterThan(400);
  });
});

describe('Point2DFilter', () => {
  it('smooths 2D coordinate pairs', () => {
    const filter = new Point2DFilter(0.8, 0.04);
    const pt1 = filter.filter({ x: 100, y: 200 }, 16.66);
    expect(pt1.x).toBe(100);
    expect(pt1.y).toBe(200);

    const pt2 = filter.filter({ x: 105, y: 205 }, 33.33);
    expect(pt2.x).toBeGreaterThan(100);
    expect(pt2.x).toBeLessThan(105);
  });
});

describe('PoseFilter', () => {
  it('smooths yaw, pitch, roll angles simultaneously', () => {
    const filter = new PoseFilter(0.7, 0.05);
    const initialPose = { yaw: 0.1, pitch: -0.05, roll: 0.02 };
    const p1 = filter.filter(initialPose, 16.66);

    expect(p1.yaw).toBeCloseTo(0.1);
    expect(p1.pitch).toBeCloseTo(-0.05);
    expect(p1.roll).toBeCloseTo(0.02);

    const updatedPose = { yaw: 0.25, pitch: -0.15, roll: 0.1 };
    const p2 = filter.filter(updatedPose, 33.33);

    expect(p2.yaw).toBeGreaterThan(0.1);
    expect(p2.yaw).toBeLessThan(0.25);
  });
});
