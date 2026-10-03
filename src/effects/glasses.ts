import { BaseEffect } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class GlassesEffect extends BaseEffect {
  id = 'glasses';
  name = 'Cool Shades';
  iconName = 'Glasses';
  description = 'Sleek designer sunglasses; flip up onto forehead when you raise your eyebrows!';

  private flipProgress = 0; // 0 = on eyes, 1 = flipped on forehead
  private flipVelocity = 0;

  update(face: DetectedFace, dt: number, _theme: ThemeConfig, _intensity: number): void {
    const browRaise = face.expression.scores.browRaise;
    const target = browRaise > 0.35 ? 1.0 : 0.0;

    // Spring physics simulation
    const k = 140; // stiffness
    const d = 16;  // damping
    const force = (target - this.flipProgress) * k;
    const damping = -this.flipVelocity * d;
    this.flipVelocity += (force + damping) * dt;
    this.flipProgress += this.flipVelocity * dt;
    this.flipProgress = Math.max(0, Math.min(1.15, this.flipProgress));
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const { eyeCenter, forehead } = face.anchors;
    const { roll, pitch } = face.pose;
    const faceWidth = face.anchors.faceWidth * intensity;

    // Interpolate position between eye center and forehead based on flipProgress
    const posX = eyeCenter.x + (forehead.x - eyeCenter.x) * this.flipProgress;
    const posY = eyeCenter.y + (forehead.y - eyeCenter.y - faceWidth * 0.12) * this.flipProgress;

    // Additional flip tilt angle when flipped up
    const flipTilt = this.flipProgress * -0.45;

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(roll);
    ctx.scale(1, Math.cos(pitch + flipTilt));

    const glassesWidth = faceWidth * 0.88;
    const lensRadiusX = glassesWidth * 0.22;
    const lensRadiusY = glassesWidth * 0.17;
    const eyeSpacing = glassesWidth * 0.27;

    // Outer frame glow
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = 12;

    // Draw Left and Right Lenses
    const drawLens = (cx: number) => {
      ctx.save();
      ctx.beginPath();
      // Aviator rounded teardrop shape
      ctx.moveTo(cx - lensRadiusX * 0.8, -lensRadiusY * 0.7);
      ctx.quadraticCurveTo(cx, -lensRadiusY * 0.85, cx + lensRadiusX * 0.8, -lensRadiusY * 0.7);
      ctx.quadraticCurveTo(cx + lensRadiusX * 1.05, 0, cx + lensRadiusX * 0.85, lensRadiusY * 0.75);
      ctx.quadraticCurveTo(cx, lensRadiusY * 1.05, cx - lensRadiusX * 0.85, lensRadiusY * 0.75);
      ctx.quadraticCurveTo(cx - lensRadiusX * 1.05, 0, cx - lensRadiusX * 0.8, -lensRadiusY * 0.7);
      ctx.closePath();

      // Tinted Gradient
      const lensGrad = ctx.createLinearGradient(cx, -lensRadiusY, cx, lensRadiusY);
      lensGrad.addColorStop(0, '#0f172a');
      lensGrad.addColorStop(0.5, '#1e293b');
      lensGrad.addColorStop(1, '#020617');
      ctx.fillStyle = lensGrad;
      ctx.fill();

      // Colored lens reflection based on theme
      const reflectionGrad = ctx.createLinearGradient(cx - lensRadiusX, -lensRadiusY, cx + lensRadiusX, lensRadiusY);
      reflectionGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      reflectionGrad.addColorStop(0.3, theme.glowColor);
      reflectionGrad.addColorStop(0.6, 'transparent');
      ctx.fillStyle = reflectionGrad;
      ctx.fill();

      // Lens Rim
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f8fafc';
      ctx.stroke();

      // Inner metallic rim
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = theme.primaryColor;
      ctx.stroke();

      ctx.restore();
    };

    drawLens(-eyeSpacing);
    drawLens(eyeSpacing);

    // Bridge Bar between lenses
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing + lensRadiusX * 0.75, -lensRadiusY * 0.5);
    ctx.quadraticCurveTo(0, -lensRadiusY * 0.7, eyeSpacing - lensRadiusX * 0.75, -lensRadiusY * 0.5);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    // Brow Bar (Top Aviator Bar)
    ctx.beginPath();
    ctx.moveTo(-glassesWidth * 0.42, -lensRadiusY * 0.75);
    ctx.lineTo(glassesWidth * 0.42, -lensRadiusY * 0.75);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.primaryColor;
    ctx.stroke();

    // Sleek white gleam streak across lenses
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-glassesWidth * 0.35, -lensRadiusY * 0.6);
    ctx.lineTo(-glassesWidth * 0.2, lensRadiusY * 0.5);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(glassesWidth * 0.2, -lensRadiusY * 0.6);
    ctx.lineTo(glassesWidth * 0.35, lensRadiusY * 0.5);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}
