import { BaseEffect, ParticleSystem } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class RainbowEffect extends BaseEffect {
  id = 'rainbow';
  name = 'Rainbow Breath';
  iconName = 'Flame';
  description = 'Vibrant cascading rainbow streams out of your mouth when you open it!';

  private particles = new ParticleSystem(120);
  private wavePhase = 0;
  private rainbowOpacity = 0;

  private colors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Violet
  ];

  update(face: DetectedFace, dt: number, _theme: ThemeConfig, intensity: number): void {
    const jawOpen = face.expression.scores.jawOpen;
    const mouthFunnel = face.expression.scores.mouthFunnel;
    const openness = Math.max(jawOpen, mouthFunnel);
    const targetOpacity = openness > 0.2 ? Math.min(1.0, (openness - 0.2) / 0.3) : 0;

    // Smooth transition
    this.rainbowOpacity += (targetOpacity - this.rainbowOpacity) * 12 * dt;
    this.wavePhase += dt * 8;

    if (this.rainbowOpacity > 0.05) {
      const { mouthCenter } = face.anchors;
      const faceWidth = face.anchors.faceWidth;
      const count = Math.floor(this.rainbowOpacity * 5 * intensity);

      for (let i = 0; i < count; i++) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const spread = (Math.random() - 0.5) * faceWidth * 0.35;
        this.particles.emit(
          mouthCenter.x + spread,
          mouthCenter.y + 10,
          (Math.random() - 0.5) * 80,
          Math.random() * 140 + 80,
          Math.random() * 4 + 2,
          color,
          Math.random() * 0.6 + 0.3
        );
      }
    }

    this.particles.update(dt, 90, 0.95);
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    _theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    if (this.rainbowOpacity <= 0.01) {
      this.particles.render(ctx, 'circle');
      return;
    }

    const { mouthCenter } = face.anchors;
    const { roll } = face.pose;
    const faceWidth = face.anchors.faceWidth * intensity;
    const streamWidth = faceWidth * 0.45;
    const streamLength = faceWidth * 1.5;

    ctx.save();
    ctx.globalAlpha = this.rainbowOpacity;
    ctx.translate(mouthCenter.x, mouthCenter.y);
    ctx.rotate(roll);

    // Draw flowing rainbow stripes
    const numStripes = this.colors.length;
    const stripeWidth = streamWidth / numStripes;

    for (let s = 0; s < numStripes; s++) {
      const color = this.colors[s];
      const startX = -streamWidth / 2 + s * stripeWidth;

      ctx.beginPath();
      ctx.moveTo(startX, 0);

      // Create wavy cascade downward
      const points = 10;
      for (let p = 1; p <= points; p++) {
        const progress = p / points;
        const currentY = progress * streamLength;
        // Wavy horizontal displacement
        const wave = Math.sin(this.wavePhase + progress * 4) * (20 * progress);
        const currentX = startX * (1 + progress * 0.6) + wave;
        ctx.lineTo(currentX, currentY);
      }

      ctx.lineTo(startX + stripeWidth * (1 + 0.6) + Math.sin(this.wavePhase + 4) * 20, streamLength);

      for (let p = points; p >= 1; p--) {
        const progress = p / points;
        const currentY = progress * streamLength;
        const wave = Math.sin(this.wavePhase + progress * 4) * (20 * progress);
        const currentX = (startX + stripeWidth) * (1 + progress * 0.6) + wave;
        ctx.lineTo(currentX, currentY);
      }

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Glowing mouth emission flare
    const flare = ctx.createRadialGradient(0, 0, 5, 0, 0, streamWidth * 0.6);
    flare.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    flare.addColorStop(0.5, 'rgba(255, 235, 59, 0.7)');
    flare.addColorStop(1, 'transparent');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.ellipse(0, 0, streamWidth * 0.5, streamWidth * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.particles.render(ctx, 'circle');
  }

  dispose(): void {
    this.particles.clear();
  }
}
