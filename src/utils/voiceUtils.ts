/**
 * Utility functions for voice recording functionality
 */

export interface VoiceCapabilities {
  isSupported: boolean;
  hasMediaRecorder: boolean;
  hasGetUserMedia: boolean;
  supportedMimeTypes: string[];
  error?: string;
}

/**
 * Check if voice recording is supported in the current browser
 */
export const checkVoiceCapabilities = (): VoiceCapabilities => {
  const capabilities: VoiceCapabilities = {
    isSupported: false,
    hasMediaRecorder: false,
    hasGetUserMedia: false,
    supportedMimeTypes: []
  };

  // Check MediaRecorder support
  if (typeof MediaRecorder !== 'undefined') {
    capabilities.hasMediaRecorder = true;
  } else {
    capabilities.error = 'MediaRecorder is not supported in this browser';
    return capabilities;
  }

  // Check getUserMedia support
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    capabilities.hasGetUserMedia = true;
  } else {
    capabilities.error = 'Microphone access is not supported in this browser';
    return capabilities;
  }

  // Check supported MIME types
  const mimeTypeCandidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];

  try {
    for (const mimeType of mimeTypeCandidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
        capabilities.supportedMimeTypes.push(mimeType);
      }
    }
  } catch (error) {
    console.warn('Error checking MIME type support:', error);
  }

  capabilities.isSupported = capabilities.hasMediaRecorder && capabilities.hasGetUserMedia;
  
  if (capabilities.supportedMimeTypes.length === 0) {
    console.warn('No supported audio MIME types found, using browser default');
  }

  return capabilities;
};

/**
 * Check microphone permissions
 */
export const checkMicrophonePermission = async (): Promise<{
  granted: boolean;
  error?: string;
}> => {
  try {
    // Check if permissions API is available
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return {
        granted: permission.state === 'granted'
      };
    }
    
    // Fallback: try to access microphone briefly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Permission check failed'
      };
    }
  } catch (error) {
    return {
      granted: false,
      error: error instanceof Error ? error.message : 'Permission check failed'
    };
  }
};

/**
 * Get the best supported MIME type for recording
 */
export const getBestMimeType = (): string | undefined => {
  const capabilities = checkVoiceCapabilities();
  return capabilities.supportedMimeTypes[0];
};

/**
 * Create MediaRecorder with fallback options
 */
export const createMediaRecorder = (stream: MediaStream): MediaRecorder => {
  const mimeType = getBestMimeType();
  
  try {
    if (mimeType) {
      return new MediaRecorder(stream, { mimeType });
    }
    return new MediaRecorder(stream);
  } catch (error) {
    console.warn('Failed to create MediaRecorder with preferred settings, using defaults:', error);
    return new MediaRecorder(stream);
  }
};

/**
 * Get audio constraints with fallback
 */
export const getAudioConstraints = (preferHighQuality = true): MediaStreamConstraints => {
  if (preferHighQuality) {
    return {
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
  }
  
  return { audio: true };
};

