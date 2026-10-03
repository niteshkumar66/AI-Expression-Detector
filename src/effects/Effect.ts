import { DetectedFace, ThemeConfig, IEffect } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
}

/**
 * High-performance pooled particle system
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles: number;

  constructor(maxParticles = 150) {
    this.maxParticles = maxParticles;
    // Pre-allocate pool
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        color: '#ffffff',
        alpha: 0,
        life: 0,
        maxLife: 1,
        rotation: 0,
        vRot: 0,
      });
    }
  }

  emit(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number
  ) {
    if (this.particles.length >= this.maxParticles) return;
    const p = this.pool.pop() || {
      x, y, vx, vy, size, color, alpha: 1, life: 0, maxLife, rotation: 0, vRot: 0
    };
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = maxLife;
    p.rotation = Math.random() * Math.PI * 2;
    p.vRot = (Math.random() - 0.5) * 5;
    this.particles.push(p);
  }

  update(dt: number, gravity = 0, drag = 0.98) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vy += gravity * dt;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
  }

  render(ctx: CanvasRenderingContext2D, shape: 'star' | 'circle' | 'sparkle' = 'sparkle') {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (shape === 'sparkle') {
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
      } else if (shape === 'star') {
        drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    while (this.particles.length > 0) {
      const p = this.particles.pop()!;
      this.pool.push(p);
    }
  }
}

/**
 * Utility to draw a multi-point star
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

export abstract class BaseEffect implements IEffect {
  abstract id: string;
  abstract name: string;
  abstract iconName: string;
  abstract description: string;

  init(): void {}
  abstract update(face: DetectedFace, dt: number, theme: ThemeConfig, intensity: number): void;
  abstract render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    isMirrored: boolean
  ): void;
  dispose(): void {}
}
