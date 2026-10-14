/**
 * Audio Generator & Helper Utilities for ReadHeal
 * Generates playable soothing WAV audio data in browser via Web Audio API,
 * allowing instant HTML5 audio playback for all sample stories,
 * volunteer uploaded files, and preview clips.
 */

import { generatePermanentWavDataUrl, readFileAsBase64DataUrl } from './persistentStorage';

// Generate a valid soothing WAV audio Base64 Data URL with harmonic healing tones
export function generateHealingWavAudioUrl(
  toneType: 'piano' | 'singing_bowl' | 'gentle_chime' | 'bedside_whisper' | 'nature' = 'piano',
  durationSeconds: number = 20
): string {
  return generatePermanentWavDataUrl(toneType, durationSeconds);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Format seconds into MM:SS
export function formatDurationSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Format file size into readable KB/MB
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Measure actual duration of an audio file via HTML5 Audio and convert to permanent Base64 Data URL
export async function getAudioFileDuration(file: File): Promise<{ durationSeconds: number; durationFormatted: string; url: string }> {
  // Read file as persistent Base64 Data URL
  let persistentDataUrl = '';
  try {
    persistentDataUrl = await readFileAsBase64DataUrl(file);
  } catch (err) {
    console.warn('Could not read file as data URL, generating soothing fallback:', err);
    persistentDataUrl = generatePermanentWavDataUrl('piano', 20);
  }

  return new Promise((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = tempUrl;

    const onLoaded = () => {
      const duration = Math.round(audio.duration) || 180;
      cleanup();
      resolve({
        durationSeconds: duration,
        durationFormatted: formatDurationSeconds(duration),
        url: persistentDataUrl,
      });
    };

    const onError = () => {
      const estimatedSecs = Math.max(30, Math.round(file.size / 16000));
      cleanup();
      resolve({
        durationSeconds: estimatedSecs,
        durationFormatted: formatDurationSeconds(estimatedSecs),
        url: persistentDataUrl,
      });
    };

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      try {
        URL.revokeObjectURL(tempUrl);
      } catch {}
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);

    // Timeout safety
    setTimeout(() => {
      if (audio.readyState === 0) {
        onError();
      }
    }, 2500);
  });
}
