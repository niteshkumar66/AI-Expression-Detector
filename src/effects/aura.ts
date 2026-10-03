import { BaseEffect, ParticleSystem } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class AuraEffect extends BaseEffect {
  id = 'aura';
  name = 'Sparkle Aura';
  iconName = 'Sparkles';
  description = 'Radiant particle halo around your head; grows dramatically brighter when you smile!';

  private particles = new ParticleSystem(150);
  private pulsePhase = 0;

  update(face: DetectedFace, dt: number, theme: ThemeConfig, intensity: number): void {
    const smile = face.expression.scores.smile;
    const center = face.bounds.center;
    const radius = Math.max(face.bounds.width, face.bounds.height) * 0.65;

    this.pulsePhase += dt * (2.0 + smile * 4.0);

    // Emission rate scales with smile
    const baseEmits = 2;
    const extraEmits = Math.floor(smile * 8 * intensity);
    const totalEmits = baseEmits + extraEmits;

    for (let i = 0; i < totalEmits; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.85 + Math.random() * 0.4);
      const px = center.x + Math.cos(angle) * r;
      const py = center.y + Math.sin(angle) * r;

      const speed = (30 + smile * 100) * (0.5 + Math.random() * 0.8);
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 20;
      const vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 20;

      const color = theme.particleColors[Math.floor(Math.random() * theme.particleColors.length)];
      this.particles.emit(
        px,
        py,
        vx,
        vy,
        (Math.random() * 4 + 3) * (1 + smile * 0.6),
        color,
        Math.random() * 0.9 + 0.5
      );
    }

    this.particles.update(dt, 0, 0.96);
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const center = face.bounds.center;
    const radius = Math.max(face.bounds.width, face.bounds.height) * 0.65;
    const smile = face.expression.scores.smile;

    // Glowing Halo Rings behind head
    ctx.save();
    const pulseScale = 1.0 + Math.sin(this.pulsePhase) * 0.04 + smile * 0.15;
    const r = radius * pulseScale * intensity;

    const radial = ctx.createRadialGradient(center.x, center.y, r * 0.5, center.x, center.y, r * 1.3);
    radial.addColorStop(0, 'transparent');
    radial.addColorStop(0.6, theme.glowColor);
    radial.addColorStop(0.85, theme.secondaryColor + '33');
    radial.addColorStop(1, 'transparent');

    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Secondary inner decorative ring
    ctx.beginPath();
    ctx.arc(center.x, center.y, r * 0.95, 0, Math.PI * 2);
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -this.pulsePhase * 10;
    ctx.lineWidth = 2 + smile * 3;
    ctx.strokeStyle = theme.primaryColor + 'aa';
    ctx.stroke();

    ctx.restore();

    // Render particles
    this.particles.render(ctx, 'sparkle');
  }

  dispose(): void {
    this.particles.clear();
  }
}
