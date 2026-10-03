import { BaseEffect, ParticleSystem, drawStar } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class EyesEffect extends BaseEffect {
  id = 'eyes';
  name = 'Heart & Star Eyes';
  iconName = 'Heart';
  description = 'Magical hearts or stars in your eyes; floating hearts bubble up when you blow a kiss!';

  private particles = new ParticleSystem(100);
  private pulse = 0;

  update(face: DetectedFace, dt: number, theme: ThemeConfig, intensity: number): void {
    this.pulse += dt * 6;
    const pucker = face.expression.scores.mouthPucker;
    const { mouthCenter } = face.anchors;

    // Emit floating hearts on kiss shape
    if (pucker > 0.35) {
      const count = Math.floor(pucker * 4 * intensity);
      for (let i = 0; i < count; i++) {
        this.particles.emit(
          mouthCenter.x + (Math.random() - 0.5) * 30,
          mouthCenter.y - 10,
          (Math.random() - 0.5) * 60,
          -Math.random() * 120 - 60,
          Math.random() * 8 + 6,
          theme.accentColor,
          Math.random() * 1.2 + 0.6
        );
      }
    }

    // Emit gentle water droplets on sad face
    const sad = face.expression.scores.sad;
    if (sad > 0.28) {
      const { leftEye, rightEye } = face.anchors;
      const count = Math.floor(sad * 3 * intensity);
      for (let i = 0; i < count; i++) {
        const eye = Math.random() > 0.5 ? leftEye : rightEye;
        this.particles.emit(
          eye.x + (Math.random() - 0.5) * 16,
          eye.y + 12,
          (Math.random() - 0.5) * 20,
          Math.random() * 90 + 50,
          Math.random() * 5 + 4,
          '#60a5fa',
          Math.random() * 0.9 + 0.5
        );
      }
    }

    // Emit comic fire sparks on angry face
    const angry = face.expression.scores.angry;
    if (angry > 0.3) {
      const { forehead } = face.anchors;
      const count = Math.floor(angry * 3 * intensity);
      for (let i = 0; i < count; i++) {
        this.particles.emit(
          forehead.x + (Math.random() - 0.5) * 60,
          forehead.y - 10 + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 80,
          -Math.random() * 100 - 40,
          Math.random() * 5 + 3,
          Math.random() > 0.5 ? '#ef4444' : '#f97316',
          Math.random() * 0.7 + 0.3
        );
      }
    }

    const gravity = sad > 0.28 ? 120 : (angry > 0.3 ? -60 : -40);
    this.particles.update(dt, gravity, 0.98);
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const { leftEye, rightEye, faceWidth } = face.anchors;
    const { eyeBlinkLeft, eyeBlinkRight, mouthPucker } = face.expression.scores;
    const { roll } = face.pose;

    const eyeSize = faceWidth * 0.16 * intensity;
    const pulseFactor = 1.0 + Math.sin(this.pulse) * 0.12;

    const isWinkLeft = eyeBlinkLeft > 0.45 && eyeBlinkRight < 0.25;
    const isWinkRight = eyeBlinkRight > 0.45 && eyeBlinkLeft < 0.25;
    const isKissing = mouthPucker > 0.35;

    const drawHeart = (cx: number, cy: number, size: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll);
      ctx.scale(size / 30, size / 30);

      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-15, -15, -30, 5, 0, 30);
      ctx.bezierCurveTo(30, 5, 15, -15, 0, 5);
      ctx.fill();

      // Gleam highlight
      ctx.beginPath();
      ctx.arc(-8, 5, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    };

    const drawTwinkleStar = (cx: number, cy: number, size: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll + this.pulse * 0.5);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;

      drawStar(ctx, 0, 0, 4, size, size * 0.35);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    };

    // If theme is space, use stars; otherwise use hearts
    const isStarTheme = theme.id === 'space';
    const drawEyeEffect = isStarTheme ? drawTwinkleStar : drawHeart;
    const eyeColor = theme.accentColor;

    // Check which eyes to display
    const showBoth = isKissing || (!isWinkLeft && !isWinkRight);
    const showLeft = showBoth || isWinkLeft;
    const showRight = showBoth || isWinkRight;

    if (showLeft) {
      drawEyeEffect(leftEye.x, leftEye.y, eyeSize * pulseFactor, eyeColor);
    }
    if (showRight) {
      drawEyeEffect(rightEye.x, rightEye.y, eyeSize * pulseFactor, eyeColor);
    }

    // Draw comic anger mark on temple/forehead when angry
    const angry = face.expression.scores.angry;
    if (angry > 0.3) {
      const { forehead } = face.anchors;
      const angerSize = faceWidth * 0.14 * intensity;
      ctx.save();
      ctx.translate(forehead.x + faceWidth * 0.25, forehead.y - faceWidth * 0.15);
      ctx.rotate(roll + Math.sin(this.pulse * 1.5) * 0.1);

      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      const r = angerSize * 0.55;
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.35, -r * 0.35, -r * 0.35, -r);

      ctx.moveTo(r * 0.35, -r);
      ctx.quadraticCurveTo(r * 0.35, -r * 0.35, r, -r * 0.35);

      ctx.moveTo(r, r * 0.35);
      ctx.quadraticCurveTo(r * 0.35, r * 0.35, r * 0.35, r);

      ctx.moveTo(-r * 0.35, r);
      ctx.quadraticCurveTo(-r * 0.35, r * 0.35, -r, r * 0.35);
      ctx.stroke();

      ctx.restore();
    }

    // Render floating kiss particles as mini hearts
    this.particles.render(ctx, 'sparkle');
  }

  dispose(): void {
    this.particles.clear();
  }
}
