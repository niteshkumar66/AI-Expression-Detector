import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { DetectedFace, HeadPose } from '../types';
import { extractPoseFromMatrix, extractPoseFromLandmarks, computeFaceGeometry } from './pose';
import { ExpressionClassifier } from './expressions';
import { PoseFilter, Point2DFilter, SMOOTHING_PRESETS } from './smoothing';
import { SmoothingProfile } from '../store/useMirrorStore';

interface FaceTrackState {
  id: number;
  poseFilter: PoseFilter;
  anchorFilters: {
    forehead: Point2DFilter;
    noseTip: Point2DFilter;
    eyeCenter: Point2DFilter;
    mouthCenter: Point2DFilter;
  };
  classifier: ExpressionClassifier;
  lastCenter: { x: number; y: number };
}

export class FaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private faceTracks: Map<number, FaceTrackState> = new Map();
  private nextFaceId = 1;
  private currentProfile: SmoothingProfile = 'balanced';

  /**
   * Initializes the MediaPipe Face Landmarker model with GPU delegate and CPU fallback
   */
  async init(
    onProgress?: (progress: number) => void,
    smoothingProfile: SmoothingProfile = 'balanced'
  ): Promise<void> {
    if (this.landmarker || this.isInitializing) return;
    this.isInitializing = true;
    this.currentProfile = smoothingProfile;

    try {
      onProgress?.(20);
      
      // Attempt local WASM first, fallback to CDN if server environment has issues
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch (wasmErr) {
        console.warn('Local WASM loading had an issue, attempting CDN fallback:', wasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      onProgress?.(50);

      // Try GPU delegate first, fallback to CPU if WebGL fails
      const modelAssetPath = '/models/face_landmarker.task';
      
      try {
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      onProgress?.(100);
    } finally {
      this.isInitializing = false;
    }
  }

  setSmoothingProfile(profile: SmoothingProfile) {
    this.currentProfile = profile;
    const preset = SMOOTHING_PRESETS[profile];
    this.faceTracks.forEach((track) => {
      track.poseFilter.setParams(preset.minCutoff, preset.beta);
      track.anchorFilters.forehead.setParams(preset.minCutoff, preset.beta);
      track.anchorFilters.noseTip.setParams(preset.minCutoff, preset.beta);
      track.anchorFilters.eyeCenter.setParams(preset.minCutoff, preset.beta);
      track.anchorFilters.mouthCenter.setParams(preset.minCutoff, preset.beta);
    });
  }

  private createTrack(id: number, initialCenter: { x: number; y: number }): FaceTrackState {
    const preset = SMOOTHING_PRESETS[this.currentProfile];
    return {
      id,
      poseFilter: new PoseFilter(preset.minCutoff, preset.beta),
      anchorFilters: {
        forehead: new Point2DFilter(preset.minCutoff, preset.beta),
        noseTip: new Point2DFilter(preset.minCutoff, preset.beta),
        eyeCenter: new Point2DFilter(preset.minCutoff, preset.beta),
        mouthCenter: new Point2DFilter(preset.minCutoff, preset.beta),
      },
      classifier: new ExpressionClassifier(),
      lastCenter: initialCenter,
    };
  }

  /**
   * Processes current video frame and returns smoothed face detection results
   */
  detectFaces(
    video: HTMLVideoElement,
    timestamp: number,
    canvasWidth: number,
    canvasHeight: number
  ): DetectedFace[] {
    if (!this.landmarker || video.readyState < 2 || video.videoWidth === 0) {
      return [];
    }

    let result;
    try {
      result = this.landmarker.detectForVideo(video, timestamp);
    } catch (err) {
      console.error('Error during face detection:', err);
      return [];
    }

    if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
      return [];
    }

    const detectedFaces: DetectedFace[] = [];
    const numFaces = Math.min(result.faceLandmarks.length, 2);

    for (let i = 0; i < numFaces; i++) {
      const landmarks = result.faceLandmarks[i];
      const blendshapes = result.faceBlendshapes?.[i]?.categories || [];
      const matrix = result.facialTransformationMatrixes?.[i]?.data as any;

      const { landmarksScreen, bounds, anchors } = computeFaceGeometry(
        landmarks,
        canvasWidth,
        canvasHeight
      );

      // Match face to existing track or assign new ID
      let matchedTrack: FaceTrackState | null = null;
      let minDistance = 250; // max pixel distance threshold for same face match

      this.faceTracks.forEach((track) => {
        const dist = Math.hypot(
          track.lastCenter.x - bounds.center.x,
          track.lastCenter.y - bounds.center.y
        );
        if (dist < minDistance) {
          minDistance = dist;
          matchedTrack = track;
        }
      });

      let currentTrack: FaceTrackState;
      if (!matchedTrack) {
        const newId = this.nextFaceId++;
        currentTrack = this.createTrack(newId, bounds.center);
        this.faceTracks.set(newId, currentTrack);
      } else {
        currentTrack = matchedTrack;
        currentTrack.lastCenter = bounds.center;
      }

      // Compute Pose: try matrix extraction first, fallback to landmark geometry
      let rawPose: HeadPose | null = null;
      if (matrix) {
        rawPose = extractPoseFromMatrix(matrix);
      }
      if (!rawPose) {
        rawPose = extractPoseFromLandmarks(landmarks);
      }

      // Apply One Euro smoothing
      const smoothedPose = currentTrack.poseFilter.filter(rawPose, timestamp);

      // Smooth key anchors
      const smoothedAnchors = {
        ...anchors,
        forehead: currentTrack.anchorFilters.forehead.filter(anchors.forehead, timestamp),
        noseTip: currentTrack.anchorFilters.noseTip.filter(anchors.noseTip, timestamp),
        eyeCenter: currentTrack.anchorFilters.eyeCenter.filter(anchors.eyeCenter, timestamp),
        mouthCenter: currentTrack.anchorFilters.mouthCenter.filter(anchors.mouthCenter, timestamp),
      };

      // Classify physical expression
      const expression = currentTrack.classifier.classify(blendshapes, timestamp);

      detectedFaces.push({
        id: currentTrack.id,
        landmarks,
        landmarksScreen,
        pose: smoothedPose,
        bounds,
        expression,
        anchors: smoothedAnchors,
      });
    }

    // Clean up tracks that haven't been seen
    if (this.faceTracks.size > 4) {
      const activeIds = new Set(detectedFaces.map((f) => f.id));
      for (const [id] of this.faceTracks) {
        if (!activeIds.has(id)) {
          this.faceTracks.delete(id);
        }
      }
    }

    return detectedFaces;
  }

  dispose() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn('Error closing landmarker:', e);
      }
      this.landmarker = null;
    }
    this.faceTracks.clear();
  }
}

export const faceTracker = new FaceTracker();
