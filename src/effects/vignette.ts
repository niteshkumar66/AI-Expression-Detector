import { ThemeConfig } from '../types';

export class VignetteOverlay {
  private phase = 0;

  render(ctx: CanvasRenderingContext2D, width: number, height: number, theme: ThemeConfig): void {
    ctx.save();

    // Subtle edge vignette
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.hypot(cx, cy);

    const grad = ctx.createRadialGradient(cx, cy, maxRadius * 0.4, cx, cy, maxRadius);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.7, theme.vignetteColor);
    grad.addColorStop(1, 'rgba(3, 7, 18, 0.65)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  update(dt: number) {
    this.phase += dt * 0.5;
  }
}
