import { PhysicalExpressionCategory, ExpressionScores, FaceExpressionData } from '../types';

/**
 * Hysteresis and threshold constants for facial expressions
 * High entry threshold to trigger, lower exit threshold to release
 */
const THRESHOLDS = {
  SMILE_ENTER: 0.45,
  SMILE_EXIT: 0.28,
  
  BIG_SMILE_ENTER: 0.55,
  BIG_SMILE_EXIT: 0.35,
  BIG_SMILE_JAW_ENTER: 0.25,
  BIG_SMILE_JAW_EXIT: 0.15,
  
  MOUTH_OPEN_ENTER: 0.40,
  MOUTH_OPEN_EXIT: 0.22,
  
  BROW_RAISE_ENTER: 0.45,
  BROW_RAISE_EXIT: 0.28,
  
  WINK_BLINK_ENTER: 0.55,
  WINK_BLINK_EXIT: 0.30,
  WINK_OPPOSITE_MAX: 0.25,
  
  PUCKER_ENTER: 0.45,
  PUCKER_EXIT: 0.28,

  SAD_ENTER: 0.30,
  SAD_EXIT: 0.16,

  ANGRY_ENTER: 0.32,
  ANGRY_EXIT: 0.18,
};

const DEBOUNCE_MS = 150;

export interface RawBlendshapeItem {
  categoryName: string;
  score: number;
}

export class ExpressionClassifier {
  private currentCategory: PhysicalExpressionCategory = 'Neutral face';
  private candidateCategory: PhysicalExpressionCategory = 'Neutral face';
  private candidateSince = 0;
  
  // Track active state for hysteresis
  private isSmiling = false;
  private isBigSmiling = false;
  private isMouthOpen = false;
  private isBrowRaised = false;
  private isWinkLeft = false;
  private isWinkRight = false;
  private isKiss = false;
  private isSad = false;
  private isAngry = false;

  /**
   * Classifies facial movements from raw MediaPipe blendshapes
   */
  classify(
    blendshapes: RawBlendshapeItem[],
    now = performance.now()
  ): FaceExpressionData {
    // Map blendshape array to key-value lookup
    const map = new Map<string, number>();
    for (let i = 0; i < blendshapes.length; i++) {
      map.set(blendshapes[i].categoryName, blendshapes[i].score);
    }

    const smileLeft = map.get('mouthSmileLeft') || 0;
    const smileRight = map.get('mouthSmileRight') || 0;
    const smile = (smileLeft + smileRight) / 2;

    const frownLeft = map.get('mouthFrownLeft') || 0;
    const frownRight = map.get('mouthFrownRight') || 0;
    const mouthFrown = (frownLeft + frownRight) / 2;
    const mouthShrugLower = map.get('mouthShrugLower') || 0;
    const mouthRollLower = map.get('mouthRollLower') || 0;
    const browInnerUp = map.get('browInnerUp') || 0;

    // Sad face: downturned mouth corners, pout, or inner brow raise combined with downturn
    const sad = Math.max(
      mouthFrown,
      mouthShrugLower * 0.9,
      (mouthFrown + browInnerUp) / 1.4,
      (mouthFrown + mouthRollLower) / 1.5
    );

    const browDownLeft = map.get('browDownLeft') || 0;
    const browDownRight = map.get('browDownRight') || 0;
    const browDown = (browDownLeft + browDownRight) / 2;
    const noseSneerLeft = map.get('noseSneerLeft') || 0;
    const noseSneerRight = map.get('noseSneerRight') || 0;
    const noseSneer = (noseSneerLeft + noseSneerRight) / 2;
    const eyeSquintLeft = map.get('eyeSquintLeft') || 0;
    const eyeSquintRight = map.get('eyeSquintRight') || 0;
    const eyeSquint = (eyeSquintLeft + eyeSquintRight) / 2;
    const mouthPressLeft = map.get('mouthPressLeft') || 0;
    const mouthPressRight = map.get('mouthPressRight') || 0;
    const mouthPress = (mouthPressLeft + mouthPressRight) / 2;

    // Angry face: furrowed browDown (corrugator), amplified by nose sneer, eye squint, or mouth press
    const angry = Math.max(
      browDown * 1.15,
      (browDown + noseSneer) / 1.35,
      (browDown + eyeSquint) / 1.4,
      (browDown + mouthPress) / 1.4
    );

    const jawOpen = map.get('jawOpen') || 0;
    const mouthFunnel = map.get('mouthFunnel') || 0;
    const mouthPucker = map.get('mouthPucker') || 0;

    const browOuterUpLeft = map.get('browOuterUpLeft') || 0;
    const browOuterUpRight = map.get('browOuterUpRight') || 0;
    const browRaise = Math.max(browInnerUp, (browOuterUpLeft + browOuterUpRight) / 2);

    const eyeBlinkLeft = map.get('eyeBlinkLeft') || 0;
    const eyeBlinkRight = map.get('eyeBlinkRight') || 0;

    const scores: ExpressionScores = {
      smile,
      sad,
      angry,
      jawOpen,
      mouthFunnel,
      browRaise,
      eyeBlinkLeft,
      eyeBlinkRight,
      mouthPucker,
    };

    // Apply Hysteresis state transitions
    this.isSmiling = this.updateHysteresis(this.isSmiling, smile, THRESHOLDS.SMILE_ENTER, THRESHOLDS.SMILE_EXIT);
    
    const bigSmileScore = (smile + jawOpen) / 2;
    this.isBigSmiling = this.updateHysteresis(
      this.isBigSmiling,
      bigSmileScore,
      THRESHOLDS.BIG_SMILE_ENTER,
      THRESHOLDS.BIG_SMILE_EXIT
    ) && (jawOpen > THRESHOLDS.BIG_SMILE_JAW_EXIT);

    this.isMouthOpen = this.updateHysteresis(
      this.isMouthOpen,
      Math.max(jawOpen, mouthFunnel),
      THRESHOLDS.MOUTH_OPEN_ENTER,
      THRESHOLDS.MOUTH_OPEN_EXIT
    );

    this.isBrowRaised = this.updateHysteresis(
      this.isBrowRaised,
      browRaise,
      THRESHOLDS.BROW_RAISE_ENTER,
      THRESHOLDS.BROW_RAISE_EXIT
    );

    this.isKiss = this.updateHysteresis(
      this.isKiss,
      mouthPucker,
      THRESHOLDS.PUCKER_ENTER,
      THRESHOLDS.PUCKER_EXIT
    );

    this.isSad = this.updateHysteresis(
      this.isSad,
      sad,
      THRESHOLDS.SAD_ENTER,
      THRESHOLDS.SAD_EXIT
    ) && (smile < 0.25);

    this.isAngry = this.updateHysteresis(
      this.isAngry,
      angry,
      THRESHOLDS.ANGRY_ENTER,
      THRESHOLDS.ANGRY_EXIT
    ) && (smile < 0.25) && (browRaise < 0.35);

    // Wink detection requires asymmetry
    const winkLeftTrigger = eyeBlinkLeft >= THRESHOLDS.WINK_BLINK_ENTER && eyeBlinkRight <= THRESHOLDS.WINK_OPPOSITE_MAX;
    const winkLeftRelease = eyeBlinkLeft < THRESHOLDS.WINK_BLINK_EXIT;
    this.isWinkLeft = this.isWinkLeft ? !winkLeftRelease : winkLeftTrigger;

    const winkRightTrigger = eyeBlinkRight >= THRESHOLDS.WINK_BLINK_ENTER && eyeBlinkLeft <= THRESHOLDS.WINK_OPPOSITE_MAX;
    const winkRightRelease = eyeBlinkRight < THRESHOLDS.WINK_BLINK_EXIT;
    this.isWinkRight = this.isWinkRight ? !winkRightRelease : winkRightTrigger;

    // Determine target category based on physical hierarchy
    let targetCategory: PhysicalExpressionCategory = 'Neutral face';
    let confidence = 0.5;

    if (this.isBigSmiling) {
      targetCategory = 'Big smile / Laugh shape';
      confidence = bigSmileScore;
    } else if (this.isKiss) {
      targetCategory = 'Kiss shape';
      confidence = mouthPucker;
    } else if (this.isWinkLeft) {
      targetCategory = 'Wink left';
      confidence = eyeBlinkLeft;
    } else if (this.isWinkRight) {
      targetCategory = 'Wink right';
      confidence = eyeBlinkRight;
    } else if (this.isMouthOpen) {
      targetCategory = 'Mouth open / Surprise shape';
      confidence = Math.max(jawOpen, mouthFunnel);
    } else if (this.isBrowRaised) {
      targetCategory = 'Eyebrows raised';
      confidence = browRaise;
    } else if (this.isSmiling) {
      targetCategory = 'Smile';
      confidence = smile;
    } else if (this.isAngry) {
      targetCategory = 'Angry face';
      confidence = angry;
    } else if (this.isSad) {
      targetCategory = 'Sad face';
      confidence = sad;
    }

    // 150ms Debounce to prevent rapid transitions
    if (targetCategory !== this.candidateCategory) {
      this.candidateCategory = targetCategory;
      this.candidateSince = now;
    }

    if (now - this.candidateSince >= DEBOUNCE_MS) {
      this.currentCategory = this.candidateCategory;
    }

    const { friendlyLabel, emoji } = this.getDescriptor(this.currentCategory);

    return {
      primaryCategory: this.currentCategory,
      friendlyLabel,
      emoji,
      confidence,
      scores,
    };
  }

  private updateHysteresis(current: boolean, value: number, enterThresh: number, exitThresh: number): boolean {
    if (current) {
      return value >= exitThresh;
    } else {
      return value >= enterThresh;
    }
  }

  private getDescriptor(category: PhysicalExpressionCategory): { friendlyLabel: string; emoji: string } {
    switch (category) {
      case 'Big smile / Laugh shape':
        return { friendlyLabel: 'Big smile detected ✨', emoji: '🌟' };
      case 'Smile':
        return { friendlyLabel: 'Smile detected ✨', emoji: '✨' };
      case 'Mouth open / Surprise shape':
        return { friendlyLabel: 'Mouth open 😮', emoji: '😮' };
      case 'Eyebrows raised':
        return { friendlyLabel: 'Eyebrows raised 💫', emoji: '💫' };
      case 'Wink left':
        return { friendlyLabel: 'Left wink detected 😉', emoji: '😉' };
      case 'Wink right':
        return { friendlyLabel: 'Right wink detected 😉', emoji: '😉' };
      case 'Kiss shape':
        return { friendlyLabel: 'Kiss shape detected 💋', emoji: '💋' };
      case 'Sad face':
        return { friendlyLabel: 'Sad face detected 😢', emoji: '😢' };
      case 'Angry face':
        return { friendlyLabel: 'Angry face detected 😠', emoji: '😠' };
      case 'Neutral face':
      default:
        return { friendlyLabel: 'Neutral face 🪞', emoji: '🪞' };
    }
  }

  reset() {
    this.currentCategory = 'Neutral face';
    this.candidateCategory = 'Neutral face';
    this.candidateSince = 0;
    this.isSmiling = false;
    this.isBigSmiling = false;
    this.isMouthOpen = false;
    this.isBrowRaised = false;
    this.isWinkLeft = false;
    this.isWinkRight = false;
    this.isKiss = false;
    this.isSad = false;
    this.isAngry = false;
  }
}
