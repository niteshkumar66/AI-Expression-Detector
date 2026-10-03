/**
 * Camera management and video stream utilities
 */

export interface CameraConfig {
  deviceId?: string;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

/**
 * Initializes webcam stream with ideal 720p constraints
 */
export async function startCamera(config: CameraConfig = {}): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access is not supported by your browser or environment.');
  }

  const {
    deviceId,
    width = 1280,
    height = 720,
    facingMode = 'user',
  } = config;

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: width },
    height: { ideal: height },
  };

  if (deviceId) {
    videoConstraints.deviceId = { exact: deviceId };
  } else {
    videoConstraints.facingMode = facingMode;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });
    return stream;
  } catch (err: any) {
    // Fallback if specific resolution fails
    if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      return await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      });
    }
    throw err;
  }
}

/**
 * Stops all tracks in a MediaStream
 */
export function stopCamera(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Lists available video input devices
 */
export async function getAvailableVideoDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}

/**
 * Fast ambient luminance analysis (samples a 32x24 downscaled frame)
 * Returns true if the environment is under-illuminated (luma < 30)
 */
export function analyzeLightLevel(
  video: HTMLVideoElement,
  sampleCanvas?: HTMLCanvasElement
): { isLowLight: boolean; avgLuminance: number } {
  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return { isLowLight: false, avgLuminance: 128 };
  }

  const canvas = sampleCanvas || document.createElement('canvas');
  const width = 32;
  const height = 24;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { isLowLight: false, avgLuminance: 128 };
  }

  try {
    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height).data;
    let totalLuma = 0;
    const count = imgData.length / 4;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      // ITU-R BT.601 perceptual luma formula
      totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const avgLuminance = totalLuma / count;
    return {
      isLowLight: avgLuminance < 30,
      avgLuminance,
    };
  } catch {
    return { isLowLight: false, avgLuminance: 128 };
  }
}
