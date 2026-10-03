import { BaseEffect } from './Effect';
import { DetectedFace, ThemeConfig } from '../types';

// Key contour chains for facial wireframe rendering
const FACE_CONTOURS = {
  OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  LIPS_OUTER: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
  LIPS_INNER: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78],
  LEFT_EYE: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263],
  RIGHT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  LEFT_EYEBROW: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
  RIGHT_EYEBROW: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  NOSE: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
};

export class MeshEffect extends BaseEffect {
  id = 'mesh';
  name = 'Face Mesh Neon';
  iconName = 'Cpu';
  description = 'Futuristic sci-fi cyber wireframe mesh connecting facial landmarks in real time.';

  private scanlineY = 0;

  update(_face: DetectedFace, dt: number, _theme: ThemeConfig, _intensity: number): void {
    this.scanlineY = (this.scanlineY + dt * 0.4) % 1.0;
  }

  render(
    ctx: CanvasRenderingContext2D,
    face: DetectedFace,
    theme: ThemeConfig,
    intensity: number,
    _isMirrored: boolean
  ): void {
    const { landmarksScreen, bounds } = face;

    ctx.save();
    ctx.lineWidth = 1.4 * intensity;
    ctx.strokeStyle = theme.secondaryColor;
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = 8;

    const drawContour = (indices: number[], closed = false, color?: string) => {
      ctx.beginPath();
      if (color) ctx.strokeStyle = color;
      let first = true;
      for (const idx of indices) {
        const pt = landmarksScreen[idx];
        if (!pt) continue;
        if (first) {
          ctx.moveTo(pt.x, pt.y);
          first = false;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      if (closed) ctx.closePath();
      ctx.stroke();
    };

    // Draw main anatomical contours
    drawContour(FACE_CONTOURS.OVAL, true, theme.secondaryColor + '99');
    drawContour(FACE_CONTOURS.LEFT_EYE, true, theme.primaryColor);
    drawContour(FACE_CONTOURS.RIGHT_EYE, true, theme.primaryColor);
    drawContour(FACE_CONTOURS.LEFT_EYEBROW, false, theme.accentColor);
    drawContour(FACE_CONTOURS.RIGHT_EYEBROW, false, theme.accentColor);
    drawContour(FACE_CONTOURS.LIPS_OUTER, true, theme.accentColor);
    drawContour(FACE_CONTOURS.LIPS_INNER, true, theme.accentColor + 'aa');
    drawContour(FACE_CONTOURS.NOSE, false, theme.primaryColor + 'cc');

    // Draw key triangulations/cross-links
    const crossLinks: [number, number][] = [
      [10, 168], [168, 6], [6, 4], [4, 152],
      [33, 168], [263, 168],
      [61, 4], [291, 4],
      [61, 152], [291, 152],
    ];

    ctx.strokeStyle = theme.glowColor;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (const [a, b] of crossLinks) {
      const ptA = landmarksScreen[a];
      const ptB = landmarksScreen[b];
      if (ptA && ptB) {
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);
      }
    }
    ctx.stroke();

    // Draw vertex dots on key indices
    ctx.fillStyle = '#ffffff';
    for (const [idx] of crossLinks) {
      const pt = landmarksScreen[idx];
      if (!pt) continue;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animated holographic scanning line across face bounds
    const scanY = bounds.y + bounds.height * this.scanlineY;
    const scanGrad = ctx.createLinearGradient(bounds.x, scanY, bounds.x + bounds.width, scanY);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.5, theme.primaryColor);
    scanGrad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.moveTo(bounds.x - 20, scanY);
    ctx.lineTo(bounds.x + bounds.width + 20, scanY);
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = scanGrad;
    ctx.stroke();

    ctx.restore();
  }
}
