import { describe, it, expect, beforeEach } from 'vitest';
import { ExpressionClassifier, RawBlendshapeItem } from '../src/core/expressions';

describe('ExpressionClassifier', () => {
  let classifier: ExpressionClassifier;

  beforeEach(() => {
    classifier = new ExpressionClassifier();
  });

  const createBlendshapes = (overrides: Record<string, number> = {}): RawBlendshapeItem[] => {
    const defaultShapes = [
      'mouthSmileLeft',
      'mouthSmileRight',
      'mouthFrownLeft',
      'mouthFrownRight',
      'mouthShrugLower',
      'mouthRollLower',
      'browDownLeft',
      'browDownRight',
      'jawOpen',
      'mouthFunnel',
      'mouthPucker',
      'browInnerUp',
      'browOuterUpLeft',
      'browOuterUpRight',
      'eyeBlinkLeft',
      'eyeBlinkRight',
    ];

    return defaultShapes.map((name) => ({
      categoryName: name,
      score: overrides[name] ?? 0.05,
    }));
  };

  it('classifies neutral face when all blendshape scores are low', () => {
    const blendshapes = createBlendshapes();
    const result = classifier.classify(blendshapes, 0);

    expect(result.primaryCategory).toBe('Neutral face');
    expect(result.friendlyLabel).toBe('Neutral face 🪞');
  });

  it('classifies smile after holding above threshold for 150ms debounce', () => {
    const blendshapes = createBlendshapes({
      mouthSmileLeft: 0.6,
      mouthSmileRight: 0.6,
    });

    // At t=0, starts debounce candidate
    const initial = classifier.classify(blendshapes, 0);
    expect(initial.primaryCategory).toBe('Neutral face');

    // At t=80ms, still debouncing
    const midway = classifier.classify(blendshapes, 80);
    expect(midway.primaryCategory).toBe('Neutral face');

    // At t=160ms, debounce period met
    const confirmed = classifier.classify(blendshapes, 160);
    expect(confirmed.primaryCategory).toBe('Smile');
    expect(confirmed.friendlyLabel).toBe('Smile detected ✨');
    expect(confirmed.scores.smile).toBeCloseTo(0.6);
  });

  it('classifies big smile / laugh shape when smile and jaw open are active', () => {
    const blendshapes = createBlendshapes({
      mouthSmileLeft: 0.7,
      mouthSmileRight: 0.7,
      jawOpen: 0.45,
    });

    classifier.classify(blendshapes, 0);
    const result = classifier.classify(blendshapes, 200);

    expect(result.primaryCategory).toBe('Big smile / Laugh shape');
    expect(result.friendlyLabel).toBe('Big smile detected ✨');
  });

  it('classifies mouth open / surprise shape when jaw is open with mouth funnel', () => {
    const blendshapes = createBlendshapes({
      jawOpen: 0.6,
      mouthFunnel: 0.4,
    });

    classifier.classify(blendshapes, 0);
    const result = classifier.classify(blendshapes, 200);

    expect(result.primaryCategory).toBe('Mouth open / Surprise shape');
    expect(result.friendlyLabel).toBe('Mouth open 😮');
  });

  it('classifies eyebrows raised when browInnerUp is elevated', () => {
    const blendshapes = createBlendshapes({
      browInnerUp: 0.65,
    });

    classifier.classify(blendshapes, 0);
    const result = classifier.classify(blendshapes, 200);

    expect(result.primaryCategory).toBe('Eyebrows raised');
    expect(result.friendlyLabel).toBe('Eyebrows raised 💫');
  });

  it('classifies asymmetric wink for left and right eyes', () => {
    // Left eye blinking, right eye open
    const leftWink = createBlendshapes({
      eyeBlinkLeft: 0.75,
      eyeBlinkRight: 0.05,
    });

    classifier.classify(leftWink, 0);
    const resultLeft = classifier.classify(leftWink, 200);
    expect(resultLeft.primaryCategory).toBe('Wink left');

    classifier.reset();

    // Right eye blinking, left eye open
    const rightWink = createBlendshapes({
      eyeBlinkLeft: 0.05,
      eyeBlinkRight: 0.75,
    });

    classifier.classify(rightWink, 0);
    const resultRight = classifier.classify(rightWink, 200);
    expect(resultRight.primaryCategory).toBe('Wink right');
  });

  it('classifies kiss shape on mouth pucker', () => {
    const kiss = createBlendshapes({
      mouthPucker: 0.7,
    });

    classifier.classify(kiss, 0);
    const result = classifier.classify(kiss, 200);

    expect(result.primaryCategory).toBe('Kiss shape');
    expect(result.friendlyLabel).toBe('Kiss shape detected 💋');
  });

  it('classifies sad face when mouth corners are downturned and pout is formed', () => {
    const sad = createBlendshapes({
      mouthFrownLeft: 0.5,
      mouthFrownRight: 0.5,
      mouthShrugLower: 0.3,
    });

    classifier.classify(sad, 0);
    const result = classifier.classify(sad, 200);

    expect(result.primaryCategory).toBe('Sad face');
    expect(result.friendlyLabel).toBe('Sad face detected 😢');
    expect(result.scores.sad).toBeGreaterThan(0.3);
  });

  it('classifies angry face when eyebrows are furrowed down', () => {
    const angry = createBlendshapes({
      browDownLeft: 0.6,
      browDownRight: 0.6,
      noseSneerLeft: 0.3,
      noseSneerRight: 0.3,
    });

    classifier.classify(angry, 0);
    const result = classifier.classify(angry, 200);

    expect(result.primaryCategory).toBe('Angry face');
    expect(result.friendlyLabel).toBe('Angry face detected 😠');
    expect(result.scores.angry).toBeGreaterThan(0.3);
  });

  it('enforces hysteresis: does not drop state until exit threshold is crossed', () => {
    const smileHigh = createBlendshapes({ mouthSmileLeft: 0.6, mouthSmileRight: 0.6 });
    classifier.classify(smileHigh, 0);
    classifier.classify(smileHigh, 200);
    expect(classifier.classify(smileHigh, 250).primaryCategory).toBe('Smile');

    // Drop to intermediate level (below enter threshold 0.45, but above exit threshold 0.28)
    const smileMid = createBlendshapes({ mouthSmileLeft: 0.35, mouthSmileRight: 0.35 });
    const midResult = classifier.classify(smileMid, 450);
    expect(midResult.primaryCategory).toBe('Smile'); // Remains smile due to hysteresis!

    // Drop below exit threshold
    const smileLow = createBlendshapes({ mouthSmileLeft: 0.1, mouthSmileRight: 0.1 });
    classifier.classify(smileLow, 600);
    const lowResult = classifier.classify(smileLow, 800);
    expect(lowResult.primaryCategory).toBe('Neutral face');
  });

  it('CRITICAL COMPLIANCE: strictly forbids demographic and personal identity trait labels', () => {
    const allLabels = [
      'Neutral face 🪞',
      'Smile detected ✨',
      'Big smile detected ✨',
      'Mouth open 😮',
      'Eyebrows raised 💫',
      'Left wink detected 😉',
      'Right wink detected 😉',
      'Kiss shape detected 💋',
      'Sad face detected 😢',
      'Angry face detected 😠',
    ];

    const forbiddenDemographicWords = [
      'gender',
      'male',
      'female',
      'boy',
      'girl',
      'man',
      'woman',
      'age',
      'old',
      'young',
      'ethnicity',
      'race',
      'identity',
      'health',
      'depressed',
      'bipolar',
    ];

    for (const label of allLabels) {
      const lower = label.toLowerCase();
      for (const forbidden of forbiddenDemographicWords) {
        expect(lower).not.toContain(forbidden);
      }
    }
  });
});
