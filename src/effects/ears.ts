import { BaseEffect } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

export class EarsEffect extends BaseEffect {
  id = 'ears';
  name = 'Animal Ears & Nose';
  iconName = 'Smile';
  description = 'Cute fox/cat ears with dynamic wiggle physics when you tilt your head, plus a button nose!';

  private leftWiggle = 0;
  private rightWiggle = 0;
  private prevRoll = 0;
  private leftVelocity = 0;
  private rightVelocity = 0;

  update(face: DetectedFace, dt: number, _theme: ThemeConfig, _intensity: number): void {
    const { roll } = face.pose;
    const rollDelta = (roll - this.prevRoll) / Math.max(dt, 0.001);
    this.prevRoll = roll;

    // Apply wiggle impulse from head tilt velocity
    const impulse = Math.max(-8, Math.min(8, rollDelta * 0.15));

    // Spring-damper for ears
    const k = 90;
    const d = 12;

    this.leftVelocity += (-this.leftWiggle * k - this.leftVelocity * d + impulse * 40) * dt;
    this.leftWiggle += this.leftVelocity * dt;

    this.rightVelocity += (-this.rightWiggle * k - this.rightVelocity * d - impulse * 40) * dt;
    this.rightWiggle += this.rightVelocity * dt;
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const { forehead, noseTip, faceWidth } = face.anchors;
    const { roll, pitch } = face.pose;

    const earWidth = faceWidth * 0.42 * intensity;
    const earHeight = earWidth * 1.35;
    const earSpread = faceWidth * 0.42;

    ctx.save();
    ctx.translate(forehead.x, forehead.y - faceWidth * 0.1);
    ctx.rotate(roll);
    ctx.scale(1, Math.cos(pitch));

    // Helper to draw an ear
    const drawEar = (side: 'left' | 'right', wiggleAngle: number) => {
      ctx.save();
      const isLeft = side === 'left';
      const x = isLeft ? -earSpread : earSpread;
      const baseTilt = isLeft ? -0.25 : 0.25;

      ctx.translate(x, -faceWidth * 0.15);
      ctx.rotate(baseTilt + wiggleAngle);

      // Outer ear path
      ctx.beginPath();
      ctx.moveTo(-earWidth * 0.4, 0);
      ctx.quadraticCurveTo(-earWidth * 0.25, -earHeight * 0.6, 0, -earHeight);
      ctx.quadraticCurveTo(earWidth * 0.25, -earHeight * 0.6, earWidth * 0.4, 0);
      ctx.closePath();

      // Fur gradient
      const furGrad = ctx.createLinearGradient(0, 0, 0, -earHeight);
      furGrad.addColorStop(0, theme.primaryColor);
      furGrad.addColorStop(0.7, theme.primaryColor);
      furGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = furGrad;
      ctx.shadowColor = theme.glowColor;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Outer stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner ear fluffy pink/accent patch
      ctx.beginPath();
      ctx.moveTo(-earWidth * 0.25, -earHeight * 0.05);
      ctx.quadraticCurveTo(-earWidth * 0.15, -earHeight * 0.5, 0, -earHeight * 0.75);
      ctx.quadraticCurveTo(earWidth * 0.15, -earHeight * 0.5, earWidth * 0.25, -earHeight * 0.05);
      ctx.closePath();

      const innerGrad = ctx.createLinearGradient(0, -earHeight * 0.1, 0, -earHeight * 0.75);
      innerGrad.addColorStop(0, theme.accentColor + 'cc');
      innerGrad.addColorStop(1, '#ffe4e6');
      ctx.fillStyle = innerGrad;
      ctx.fill();

      ctx.restore();
    };

    drawEar('left', this.leftWiggle);
    drawEar('right', this.rightWiggle);

    ctx.restore();

    // Cute Button Nose & Whiskers
    ctx.save();
    ctx.translate(noseTip.x, noseTip.y);
    ctx.rotate(roll);

    const noseSize = faceWidth * 0.08 * intensity;

    // Button nose (rounded inverted triangle)
    ctx.beginPath();
    ctx.moveTo(-noseSize, -noseSize * 0.4);
    ctx.quadraticCurveTo(0, -noseSize * 0.6, noseSize, -noseSize * 0.4);
    ctx.quadraticCurveTo(noseSize * 0.8, noseSize * 0.6, 0, noseSize * 0.7);
    ctx.quadraticCurveTo(-noseSize * 0.8, noseSize * 0.6, -noseSize, -noseSize * 0.4);
    ctx.closePath();

    ctx.fillStyle = theme.accentColor;
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 8;
    ctx.fill();

    // Gleam highlight
    ctx.beginPath();
    ctx.ellipse(-noseSize * 0.3, -noseSize * 0.2, noseSize * 0.25, noseSize * 0.15, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // Cute Whiskers
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;

    const whiskerLength = faceWidth * 0.35;
    const whiskerGap = noseSize * 1.2;

    const drawWhiskers = (side: 1 | -1) => {
      // Top whisker
      ctx.beginPath();
      ctx.moveTo(side * whiskerGap, 0);
      ctx.quadraticCurveTo(side * (whiskerGap + whiskerLength * 0.5), -10, side * (whiskerGap + whiskerLength), -12);
      ctx.stroke();

      // Middle whisker
      ctx.beginPath();
      ctx.moveTo(side * whiskerGap, 4);
      ctx.lineTo(side * (whiskerGap + whiskerLength), 4);
      ctx.stroke();

      // Bottom whisker
      ctx.beginPath();
      ctx.moveTo(side * whiskerGap, 8);
      ctx.quadraticCurveTo(side * (whiskerGap + whiskerLength * 0.5), 18, side * (whiskerGap + whiskerLength), 20);
      ctx.stroke();
    };

    drawWhiskers(1);
    drawWhiskers(-1);

    ctx.restore();
  }
}
