import { BaseEffect, ParticleSystem } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class CrownEffect extends BaseEffect {
  id = 'crown';
  name = 'Golden Crown';
  iconName = 'Crown';
  description = 'Imperial crown anchored to forehead; bursts with sparkles when you smile!';

  private particles = new ParticleSystem(100);

  update(face: DetectedFace, dt: number, theme: ThemeConfig, intensity: number): void {
    const smile = face.expression.scores.smile;
    const { forehead } = face.anchors;
    const width = face.anchors.faceWidth;

    // Emit sparkles when smile triggers or is held high
    if (smile > 0.38) {
      const emitCount = Math.floor(smile * 4 * intensity);
      for (let i = 0; i < emitCount; i++) {
        const offset = (Math.random() - 0.5) * width * 0.7;
        const color = theme.particleColors[Math.floor(Math.random() * theme.particleColors.length)];
        this.particles.emit(
          forehead.x + offset,
          forehead.y - width * 0.35 + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 120,
          -Math.random() * 150 - 40,
          Math.random() * 5 + 3,
          color,
          Math.random() * 0.8 + 0.4
        );
      }
    }

    this.particles.update(dt, 80, 0.95);
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const { forehead } = face.anchors;
    const width = face.anchors.faceWidth * 0.85 * intensity;
    const height = width * 0.55;
    const { roll, pitch } = face.pose;

    ctx.save();
    // Position at forehead and tilt with head roll and pitch
    ctx.translate(forehead.x, forehead.y - height * 0.5);
    ctx.rotate(roll);
    ctx.scale(1, Math.cos(pitch)); // Foreshortening based on pitch

    // Crown Base Arch
    const grad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    grad.addColorStop(0, '#d97706');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(0.7, '#fbbf24');
    grad.addColorStop(1, '#b45309');

    // Glow effect
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = 18;

    // Draw 5-pointed ornate crown
    ctx.beginPath();
    ctx.moveTo(-width * 0.45, 0);
    // Base curve
    ctx.quadraticCurveTo(0, height * 0.1, width * 0.45, 0);
    // Right point
    ctx.lineTo(width * 0.45, -height * 0.55);
    // Dip 1
    ctx.lineTo(width * 0.25, -height * 0.3);
    // Peak 2
    ctx.lineTo(width * 0.22, -height * 0.8);
    // Dip 2
    ctx.lineTo(0.08 * width, -height * 0.4);
    // Center Master Peak
    ctx.lineTo(0, -height);
    // Dip 3
    ctx.lineTo(-0.08 * width, -height * 0.4);
    // Peak 4
    ctx.lineTo(-width * 0.22, -height * 0.8);
    // Dip 4
    ctx.lineTo(-width * 0.25, -height * 0.3);
    // Left Point
    ctx.lineTo(-width * 0.45, -height * 0.55);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Crown Band
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.05, width * 0.44, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Jewel insets
    const jewelColors = [theme.secondaryColor, theme.accentColor, '#ef4444', theme.accentColor, theme.secondaryColor];
    const jewelX = [-width * 0.35, -width * 0.18, 0, width * 0.18, width * 0.35];
    const jewelY = [-height * 0.05, -height * 0.05, -height * 0.05, -height * 0.05, -height * 0.05];

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(jewelX[i], jewelY[i], width * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = jewelColors[i];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Jewel gleam
      ctx.beginPath();
      ctx.arc(jewelX[i] - 1.5, jewelY[i] - 1.5, width * 0.012, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Top Gem on Central Peak
    ctx.beginPath();
    ctx.arc(0, -height - 4, width * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = theme.accentColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Render particles in world coordinates
    this.particles.render(ctx, 'sparkle');
  }

  dispose(): void {
    this.particles.clear();
  }
}
