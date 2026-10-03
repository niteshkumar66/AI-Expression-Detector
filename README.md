# AI Magic Mirror ✨

> **A real-time, 100% in-browser interactive face-effects experience built with Vite, React, TypeScript, Tailwind CSS, and MediaPipe Face Landmarker.**

A parent stands in front of the webcam and sees themselves mirrored on screen. The app detects their face and overlays interactive visual effects that track head pose in real time and react live to physical facial expressions (smiles, open mouth / surprise, raised eyebrows, winks, kisses). Dual-face tracking allows parent and child to interact simultaneously with independent visual effects!

---

## 🔒 1. Privacy Statement & Guarantees (Non-Negotiable)

1. **100% In-Browser Local Execution:**
   - All facial landmark detection, head pose estimation, and blendshape classification execute strictly inside the client browser using WebAssembly and WebGL.
   - **Zero telemetry, zero image uploads, zero API calls, and zero external tracking.**
   - The MediaPipe model (`face_landmarker.task`, 3.7MB) and WASM binaries are hosted locally in `/public/models` and `/public/wasm` for complete offline capability.

2. **Zero Biometric or Emotional Profiling:**
    - Facial movements are described playfully and neutrally (e.g., *"Smile detected ✨"*, *"Sad face detected 😢"*, *"Angry face detected 😠"*, *"Mouth open 😮"*, *"Eyebrows raised 💫"*, *"Neutral face 🪞"*).
   - Wording is playful, respectful, and non-judgmental.

3. **Explicit Consent & Clean Lifecycle:**
   - Camera access starts only after the user explicitly clicks **"Start the Magic ✨"**.
   - Clicking **"Stop"** or closing the tab immediately stops all webcam hardware tracks and purges memory.
   - Photos captured via the **Capture 📸** button are composited locally on a hidden `<canvas>` and saved exclusively to the user's local device download folder.

---

## 🚀 2. Quickstart & Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- Modern web browser (Chrome, Edge, Safari, Firefox) with WebGL support and webcam access

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open `http://localhost:3000/` in your browser.

### Running Unit Tests
```bash
npm test
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🛠️ 3. How It Works (Architecture)

```
src/
├── core/
│   ├── camera.ts         # Webcam initialization (720p), device enumeration, cleanup, low-light analyzer
│   ├── faceTracker.ts    # MediaPipe Face Landmarker loader (GPU with CPU fallback) & multi-face loop
│   ├── smoothing.ts      # One Euro Filter (Casiez et al.) for jitter-free pose & anchor tracking
│   ├── pose.ts           # Matrix decomposition (yaw/pitch/roll) + robust 3D geometric fallback
│   └── expressions.ts    # Blendshape classification, 150ms debounce, and hysteresis thresholds
├── effects/
│   ├── Effect.ts         # BaseEffect abstract class & pooled particle system
│   ├── crown.ts          # Golden Crown: forehead anchored, pitch/roll tilt, smile sparkle burst
│   ├── glasses.ts        # Cool Shades: spring physics flip up onto forehead on eyebrow raise
│   ├── aura.ts           # Sparkle Aura: pulsing halo, emission scales with smile intensity
│   ├── rainbow.ts        # Rainbow Breath: cascading undulating rainbow waterfall when mouth opens
│   ├── eyes.ts           # Heart/Star Eyes: animated eye replacements + floating kiss particles
│   ├── mesh.ts           # Face Mesh Neon: futuristic sci-fi wireframe & laser scanline (Science Mode)
│   ├── ears.ts           # Animal Ears & Nose: wiggle physics on head roll + cute button nose
│   ├── vignette.ts       # Atmospheric theme vignette and backdrop tint
│   ├── themes.ts         # 4 Theme configurations (Royal, Space, Garden, Neon)
│   └── index.ts          # EffectManager lifecycle & composite rendering
├── components/
│   ├── WelcomeScreen.tsx # Cinematic consent screen, privacy badges, and loader
│   ├── MirrorStage.tsx   # Video/canvas compositing stage, keyboard handlers, and 60 FPS loop
│   ├── TopBar.tsx        # Status chip, live friendly expression badge, quick action buttons
│   ├── StatusChip.tsx    # Live face count, dual-track badge, FPS & latency readout
│   ├── EffectDock.tsx    # Large touch-friendly effect toggles (1-7) & theme selector
│   ├── ExpressionMeter.tsx # Real-time scientific blendshape bars
│   ├── SettingsDrawer.tsx # Smoothing strength (Responsive/Balanced/Silky), camera picker, intensity
│   ├── CaptureModal.tsx  # 3-2-1 countdown, camera flash, local PNG download, and confetti burst
│   └── ErrorStates.tsx   # Permission guide, model error retry, low-light tip, attract mode
├── store/
│   └── useMirrorStore.ts # Central Zustand state management
└── types.ts              # TypeScript interfaces
```

### Head Pose & One Euro Filter Smoothing
Head tracking uses MediaPipe's `facialTransformationMatrixes` column-major matrix to compute Euler angles:
- **Pitch ($\theta_x$):** $\text{atan2}(-r_{12}, \sqrt{r_{02}^2 + r_{22}^2})$
- **Yaw ($\theta_y$):** $\text{atan2}(r_{02}, r_{22})$
- **Roll ($\theta_z$):** $\text{atan2}(r_{10}, r_{11})$

To eliminate high-frequency webcam jitter while maintaining near-zero latency (< 25–40ms), every face landmark and pose angle is filtered through a **One Euro Filter** (`OneEuroFilter`), which adaptively adjusts cutoff frequency based on instantaneous speed:
- **Low velocity:** Low cutoff ($f_{\min} = 0.8\text{ Hz}$), removing jitter when the subject is still.
- **High velocity:** High cutoff scaled by $\beta \cdot |\dot{x}|$, eliminating lag during rapid head movements.
- Configurable in the Settings Drawer: **Responsive**, **Balanced**, or **Silky**.

---

## 🎨 4. How to Add a New Effect

Creating a new interactive face effect takes just 3 simple steps:

1. **Create the Effect Class** (e.g., `src/effects/mustache.ts`):
   ```typescript
   import { BaseEffect } from './Effect';
   import { DetectedFace, ThemeConfig } from '../types';

   export class MustacheEffect extends BaseEffect {
     id = 'mustache';
     name = 'Mustache';
     iconName = 'Smile';
     description = 'Fancy handlebar mustache that twirls when you smile!';

     private twirlAngle = 0;

     update(face: DetectedFace, dt: number, _theme: ThemeConfig, intensity: number): void {
       // React to smile blendshape
       const smile = face.expression.scores.smile;
       this.twirlAngle += dt * (smile > 0.4 ? 12 : 2);
     }

     render(
       ctx: CanvasRenderingContext2D,
       face: DetectedFace,
       theme: ThemeConfig,
       intensity: number,
       _isMirrored: boolean
     ): void {
       const { mouthUpper, faceWidth } = face.anchors;
       const { roll } = face.pose;
       const width = faceWidth * 0.45 * intensity;

       ctx.save();
       ctx.translate(mouthUpper.x, mouthUpper.y - 6);
       ctx.rotate(roll);

       // Draw vector mustache with bezier curves
       ctx.fillStyle = theme.primaryColor;
       ctx.beginPath();
       ctx.moveTo(0, 0);
       ctx.quadraticCurveTo(-width * 0.3, -15, -width * 0.5, 0);
       ctx.quadraticCurveTo(-width * 0.25, 12, 0, 4);
       ctx.quadraticCurveTo(width * 0.25, 12, width * 0.5, 0);
       ctx.quadraticCurveTo(width * 0.3, -15, 0, 0);
       ctx.fill();

       ctx.restore();
     }
   }
   ```

2. **Register in `src/effects/index.ts`**:
   ```typescript
   import { MustacheEffect } from './mustache';
   // Inside constructor:
   this.register(new MustacheEffect());
   ```

3. **Add to Dock Carousel in `src/components/EffectDock.tsx`**:
   ```typescript
   { id: 'mustache', name: 'Mustache', keyNumber: '8', icon: Smile, hint: 'Twirls on smile' }
   ```

---

## 🎭 5. Parent Demo Script (30 Seconds)

> **Setting:** Kiosk / Event Demo Display  
> **Speaker:** Demonstrator / Parent to Child

1. **[0:00 - 0:08] The Intro:**  
   *"Look into the Magic Mirror! Stand right here with me — see how it spots both of us and puts glowing golden crowns on our heads?"*  
   *(Stand together ~1.5 - 2 meters from the screen. Crowns and sparkle auras lock onto both faces immediately.)*

2. **[0:08 - 0:15] The Smile & Eyebrow Reaction:**  
   *"Now, give the mirror a giant smile! ✨"*  
   *(Smile broadly → Sparkles erupt from the crown gems, and the aura flares bright gold.)*  
   *"Now raise your eyebrows high like you're super surprised!"*  
   *(Raise eyebrows → Cool sunglasses smoothly flip up onto the forehead with spring physics.)*

3. **[0:15 - 0:22] The Rainbow & Wiggle:**  
   *"Open your mouth wide like 'Aaaaah'!"*  
   *(Open mouth → A bright cascade of rainbow ribbons streams outward.)*  
   *"Tilt your head left and right!"*  
   *(Tilt head → Fox ears wiggle back and forth dynamically with spring physics.)*

4. **[0:22 - 0:30] Capture the Souvenir:**  
   *"Let's take a photo together — 3, 2, 1, smile!"*  
   *(Press Spacebar or tap Capture 📸 → Flash goes off, confetti bursts on screen, and your photo is ready to download!)*

---

## ⚠️ 6. Technical Limitations & Physical Movement Clarification

1. **Ambient Lighting:**
   - MediaPipe requires sufficient contrast to locate facial landmarks. In dim rooms (< 30 lux), an ambient warning chip appears: *"Lighting looks dim — brighter light gives sharper head tracking!"*
2. **Face Coverings & Extreme Glasses:**
   - Thick dark sunglasses or opaque face masks obscure eye/mouth landmarks. Clear eyeglasses are handled cleanly by the 1€ filter.
3. **Head Pose Angles:**
   - Accurate tracking operates within $\pm 45^\circ$ yaw (looking left/right) and $\pm 35^\circ$ pitch (looking up/down). Extreme profile views (> $60^\circ$) will gracefully retain last known positions.
4. **Physical Movement vs. Emotion:**
   - The expression classifications (*Smile*, *Sad face*, *Angry face*, *Mouth open*, *Eyebrows raised*, *Wink*, *Kiss shape*) represent purely physical biometric geometric contractions. They **never** diagnose or infer human emotional states (e.g. happiness, sadness, or intent).

---

## ⌨️ 7. Keyboard Shortcuts

| Key | Action |
|:---:|:---|
| <kbd>Space</kbd> | Start 3-2-1 photo capture countdown |
| <kbd>F</kbd> | Toggle Fullscreen mode |
| <kbd>M</kbd> | Toggle Horizontal Video Mirroring |
| <kbd>1</kbd> – <kbd>7</kbd> | Toggle individual effects (Crown, Shades, Aura, Rainbow, Hearts, Sci-Mesh, Animals) |
| <kbd>Esc</kbd> | Close Settings Drawer / Photo Preview Modal |

---

## 📄 License
MIT License. Built for privacy-first interactive educational and entertainment experiences.
