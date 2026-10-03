import { IEffect, DetectedFace, ThemeConfig } from '../types';
import { CrownEffect } from './crown';
import { GlassesEffect } from './glasses';
import { AuraEffect } from './aura';
import { RainbowEffect } from './rainbow';
import { EyesEffect } from './eyes';
import { MeshEffect } from './mesh';
import { EarsEffect } from './ears';
import { VignetteOverlay } from './vignette';

export { THEMES } from './themes';

export class EffectManager {
  private effects: Map<string, IEffect> = new Map();
  private vignette = new VignetteOverlay();

  constructor() {
    this.register(new CrownEffect());
    this.register(new GlassesEffect());
    this.register(new AuraEffect());
    this.register(new RainbowEffect());
    this.register(new EyesEffect());
    this.register(new MeshEffect());
    this.register(new EarsEffect());
  }

  private register(effect: IEffect) {
    effect.init();
    this.effects.set(effect.id, effect);
  }

  getAvailableEffects(): IEffect[] {
    return Array.from(this.effects.values());
  }

  update(faces: DetectedFace[], dt: number, theme: ThemeConfig, intensity: number, activeIds: string[]) {
    this.vignette.update(dt);

    for (const id of activeIds) {
      const effect = this.effects.get(id);
      if (!effect) continue;

      for (const face of faces) {
        effect.update(face, dt, theme, intensity);
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    faces: DetectedFace[],
    theme: ThemeConfig,
    intensity: number,
    activeIds: string[],
    isMirrored: boolean,
    showDebugLandmarks = false
  ) {
    // 1. Per-theme background ambient vignette
    this.vignette.render(ctx, width, height, theme);

    // 2. Render each active effect for each face
    // Sort effect order: aura first (behind face), mesh, then accessories (crown, glasses, ears, eyes, rainbow)
    const renderOrder = ['aura', 'mesh', 'ears', 'crown', 'glasses', 'eyes', 'rainbow'];
    const activeSet = new Set(activeIds);

    for (const effectId of renderOrder) {
      if (!activeSet.has(effectId)) continue;
      const effect = this.effects.get(effectId);
      if (!effect) continue;

      for (const face of faces) {
        effect.render(ctx, face, theme, intensity, isMirrored);
      }
    }

    // 3. Render debug landmarks if enabled
    if (showDebugLandmarks) {
      this.renderDebugLandmarks(ctx, faces);
    }
  }

  private renderDebugLandmarks(ctx: CanvasRenderingContext2D, faces: DetectedFace[]) {
    ctx.save();
    for (const face of faces) {
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < face.landmarksScreen.length; i += 2) {
        const pt = face.landmarksScreen[i];
        if (!pt) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bounding box
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(face.bounds.x, face.bounds.y, face.bounds.width, face.bounds.height);

      // Face ID label
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        `Face #${face.id} | Roll: ${(face.pose.roll * 180 / Math.PI).toFixed(0)}°`,
        face.bounds.x,
        face.bounds.y - 8
      );
    }
    ctx.restore();
  }

  dispose() {
    this.effects.forEach((effect) => effect.dispose());
    this.effects.clear();
  }
}

export const effectManager = new EffectManager();
