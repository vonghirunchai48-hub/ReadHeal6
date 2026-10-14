/**
 * Persistent Storage & Audio Database Engine for ReadHeal
 * Provides permanent CRUD persistence using IndexedDB and localStorage:
 * - IndexedDB: Permanent, high-capacity browser database for audio files (MP3/WAV Base64 Data URLs)
 * - localStorage: Fast, reactive metadata store with quota-safe fallbacks
 * - FileReader: Converts uploaded MP3s to permanent Data URLs that survive page reloads
 * - Audio Hydration: Restores audio files seamlessly across browser refreshes and session restarts
 */

import { AudioSubmission, Story, VolunteerProfile } from '../types';

const DB_NAME = 'ReadHeal_PermanentDB';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'audio_files';

// Open / initialize IndexedDB
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save an audio file (Base64 Data URL or Blob) into IndexedDB keyed by record ID
 */
export async function saveAudioToIndexedDB(id: string, audioDataUrl: string): Promise<void> {
  if (!id || !audioDataUrl) return;
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const putRequest = store.put({ id, audioUrl: audioDataUrl, updatedAt: Date.now() });

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn(`[ReadHeal DB] Failed to save audio ${id} in IndexedDB:`, err);
  }
}

/**
 * Retrieve an audio file Data URL from IndexedDB by record ID
 */
export async function getAudioFromIndexedDB(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result && result.audioUrl ? result.audioUrl : null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (err) {
    console.warn(`[ReadHeal DB] Failed to get audio ${id} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Delete an audio record from IndexedDB
 */
export async function deleteAudioFromIndexedDB(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (err) {
    console.warn(`[ReadHeal DB] Failed to delete audio ${id} from IndexedDB:`, err);
  }
}

/**
 * Retrieve all audio entries stored in IndexedDB as key-value map
 */
export async function getAllAudioFromIndexedDB(): Promise<Record<string, string>> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([AUDIO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = request.result || [];
        const map: Record<string, string> = {};
        list.forEach((item: { id: string; audioUrl: string }) => {
          if (item.id && item.audioUrl) {
            map[item.id] = item.audioUrl;
          }
        });
        resolve(map);
      };
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/**
 * Convert any uploaded File or Blob into a permanent Base64 Data URL using FileReader
 */
export function readFileAsBase64DataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert ArrayBuffer to Base64 in safe chunks (prevent call stack overflow)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

/**
 * Generates a permanent, soothing harmonic WAV audio Data URL (432Hz healing resonance)
 * Returns a data:audio/wav;base64,... string that NEVER expires on refresh!
 */
export function generatePermanentWavDataUrl(
  toneType: 'piano' | 'singing_bowl' | 'gentle_chime' | 'bedside_whisper' | 'nature' = 'piano',
  durationSeconds: number = 20
): string {
  try {
    const sampleRate = 16000; // Optimal 16kHz for rich tone and compact Base64 size (~400KB)
    const totalSamples = Math.min(sampleRate * durationSeconds, sampleRate * 30);
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeAsciiString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeAsciiString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeAsciiString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    // data sub-chunk
    writeAsciiString(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    // Harmonic pentatonic frequencies (A-Major / F#-Minor 432Hz warm healing tuning)
    const chords = toneType === 'singing_bowl'
      ? [216, 324, 432, 648]
      : toneType === 'gentle_chime'
      ? [540, 648, 864, 1080]
      : toneType === 'nature'
      ? [288, 360, 432, 576]
      : [256.8, 324.0, 384.8, 432.0, 513.7];

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // Note changes smoothly every 2.5 seconds
      const noteCycle = Math.floor(t / 2.5);
      const freq1 = chords[noteCycle % chords.length];
      const freq2 = chords[(noteCycle + 1) % chords.length];

      // Soft sinusoidal envelope
      const phase = (t % 2.5) / 2.5;
      const envelope = Math.sin(phase * Math.PI) * Math.exp(-phase * 1.2);

      // Warm pure tone with gentle second harmonic
      let sample = Math.sin(2 * Math.PI * freq1 * t) * 0.65;
      sample += Math.sin(2 * Math.PI * freq2 * 0.5 * t) * 0.25;
      sample += Math.sin(2 * Math.PI * (freq1 * 2) * t) * 0.1;

      // Fade in and out
      const songFade = Math.min(t / 1.5, 1) * Math.min((durationSeconds - t) / 2, 1);
      const finalVal = sample * envelope * songFade * 0.6;

      // 16-bit clamp
      const clamped = Math.max(-1, Math.min(1, finalVal));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }

    const base64Str = arrayBufferToBase64(buffer);
    return `data:audio/wav;base64,${base64Str}`;
  } catch (err) {
    console.warn('[ReadHeal] Fallback WAV generation:', err);
    return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';
  }
}

function writeAsciiString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Safely saves data to localStorage.
 * If quota is exceeded or strings are large, stores an indexeddb pointer reference
 * in localStorage while keeping the full audio data URL permanently safe in IndexedDB.
 */
export function safeSaveToLocalStorage<T>(key: string, data: T): void {
  try {
    // If it's an array with audioUrl or voiceSampleAudioUrl properties, store compact version if large
    if (Array.isArray(data)) {
      const sanitized = data.map((item: any) => {
        if (!item || !item.id) return item;
        let modified = false;
        let nextItem = { ...item };

        if (item.audioUrl && item.audioUrl.length > 50000) {
          saveAudioToIndexedDB(item.id, item.audioUrl).catch(() => {});
          nextItem.audioUrl = `indexeddb://${item.id}`;
          modified = true;
        }

        if (item.voiceSampleAudioUrl && item.voiceSampleAudioUrl.length > 50000) {
          saveAudioToIndexedDB(item.id, item.voiceSampleAudioUrl).catch(() => {});
          nextItem.voiceSampleAudioUrl = `indexeddb://${item.id}`;
          modified = true;
        }

        return modified ? nextItem : item;
      });
      localStorage.setItem(key, JSON.stringify(sanitized));
      return;
    }

    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn(`[ReadHeal DB] localStorage quota exceeded for key "${key}". Trimming heavy audio payloads...`);
      try {
        if (Array.isArray(data)) {
          const trimmed = data.map((item: any) => {
            if (item && item.id && item.audioUrl) {
              saveAudioToIndexedDB(item.id, item.audioUrl).catch(() => {});
              return { ...item, audioUrl: `indexeddb://${item.id}` };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(trimmed));
        }
      } catch (innerErr) {
        console.error(`[ReadHeal DB] Critical localStorage save failure for "${key}":`, innerErr);
      }
    } else {
      console.warn(`[ReadHeal DB] Error saving "${key}" to localStorage:`, err);
    }
  }
}

/**
 * Safely loads data from localStorage with reliable fallback
 */
export function safeLoadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[ReadHeal DB] Failed to parse "${key}" from localStorage, using fallback:`, err);
    return fallback;
  }
}

/**
 * Hydrates audio submissions by restoring full Base64 Data URLs from IndexedDB
 * for any items that were stored as pointers (`indexeddb://${id}`) or missing audio.
 */
export async function hydrateAudioSubmissions(
  submissions: AudioSubmission[]
): Promise<AudioSubmission[]> {
  try {
    const dbMap = await getAllAudioFromIndexedDB();
    return submissions.map((sub) => {
      // 1. If submission has pointer to indexeddb
      if (sub.audioUrl && sub.audioUrl.startsWith('indexeddb://')) {
        const id = sub.audioUrl.replace('indexeddb://', '') || sub.id;
        const restored = dbMap[id];
        if (restored) {
          return { ...sub, audioUrl: restored };
        }
      }

      // 2. If submission has record in IndexedDB
      if (dbMap[sub.id]) {
        return { ...sub, audioUrl: dbMap[sub.id] };
      }

      // 3. If submission has valid data: or http URL, ensure IndexedDB has it
      if (sub.audioUrl && (sub.audioUrl.startsWith('data:audio/') || sub.audioUrl.startsWith('http'))) {
        saveAudioToIndexedDB(sub.id, sub.audioUrl).catch(() => {});
        return sub;
      }

      // 4. Generate soothing permanent audio fallback
      const generated = generatePermanentWavDataUrl('piano', 35);
      saveAudioToIndexedDB(sub.id, generated).catch(() => {});
      return { ...sub, audioUrl: generated };
    });
  } catch (err) {
    console.warn('[ReadHeal DB] Error during audio submissions hydration:', err);
    return submissions;
  }
}

/**
 * Hydrates stories by restoring full Base64 Data URLs from IndexedDB
 */
export async function hydrateStories(stories: Story[]): Promise<Story[]> {
  try {
    const dbMap = await getAllAudioFromIndexedDB();
    return stories.map((story) => {
      // 1. If story has pointer to indexeddb
      if (story.audioUrl && story.audioUrl.startsWith('indexeddb://')) {
        const id = story.audioUrl.replace('indexeddb://', '') || story.id;
        const restored = dbMap[id];
        if (restored) {
          return { ...story, audioUrl: restored };
        }
      }

      // 2. If story has record in IndexedDB
      if (dbMap[story.id]) {
        return { ...story, audioUrl: dbMap[story.id] };
      }

      // 3. If story has valid data: or http URL
      if (story.audioUrl && (story.audioUrl.startsWith('data:audio/') || story.audioUrl.startsWith('http'))) {
        saveAudioToIndexedDB(story.id, story.audioUrl).catch(() => {});
        return story;
      }

      // 4. Generate soothing permanent audio fallback
      const mood = story.categoryId === 'cat-dharma' ? 'singing_bowl' : 'piano';
      const generated = generatePermanentWavDataUrl(mood, 35);
      saveAudioToIndexedDB(story.id, generated).catch(() => {});
      return { ...story, audioUrl: generated };
    });
  } catch (err) {
    console.warn('[ReadHeal DB] Error during stories hydration:', err);
    return stories;
  }
}

/**
 * Hydrates volunteers by restoring full Base64 Data URLs for their recorded voice sample
 */
export async function hydrateVolunteers(
  volunteers: VolunteerProfile[]
): Promise<VolunteerProfile[]> {
  try {
    const dbMap = await getAllAudioFromIndexedDB();
    return volunteers.map((vol) => {
      // 1. If volunteer has pointer to indexeddb
      if (vol.voiceSampleAudioUrl && vol.voiceSampleAudioUrl.startsWith('indexeddb://')) {
        const id = vol.voiceSampleAudioUrl.replace('indexeddb://', '') || vol.id;
        const restored = dbMap[id];
        if (restored) {
          return { ...vol, voiceSampleAudioUrl: restored };
        }
      }

      // 2. If volunteer has direct record in IndexedDB
      if (dbMap[vol.id]) {
        return { ...vol, voiceSampleAudioUrl: dbMap[vol.id] };
      }

      // 3. If volunteer has valid data URL, ensure IndexedDB has it
      if (vol.voiceSampleAudioUrl && (vol.voiceSampleAudioUrl.startsWith('data:audio/') || vol.voiceSampleAudioUrl.startsWith('http'))) {
        saveAudioToIndexedDB(vol.id, vol.voiceSampleAudioUrl).catch(() => {});
        return vol;
      }

      return vol;
    });
  } catch (err) {
    console.warn('[ReadHeal DB] Error during volunteers hydration:', err);
    return volunteers;
  }
}

/**
 * Ensures an audio URL is always permanent and playable.
 * Replaces any dead "blob:..." URLs with a persistent Base64 Data URL.
 */
export async function ensurePlayableAudioUrl(
  id: string,
  existingUrl?: string,
  tone: 'piano' | 'singing_bowl' | 'gentle_chime' | 'bedside_whisper' | 'nature' = 'piano'
): Promise<string> {
  // 1. If it's already a permanent data:audio URL or remote https: URL
  if (existingUrl && (existingUrl.startsWith('data:audio/') || existingUrl.startsWith('https://'))) {
    saveAudioToIndexedDB(id, existingUrl).catch(() => {});
    return existingUrl;
  }

  // 2. Check IndexedDB for a stored audio record
  const stored = await getAudioFromIndexedDB(id);
  if (stored && (stored.startsWith('data:audio/') || stored.startsWith('https://'))) {
    return stored;
  }

  // 3. If missing or was a dead blob URL, generate permanent Data URL
  const permanentUrl = generatePermanentWavDataUrl(tone, 30);
  await saveAudioToIndexedDB(id, permanentUrl);
  return permanentUrl;
}

/**
 * Reset local database back to default initial seed data
 */
export function clearAllLocalStorage(): void {
  try {
    const keysToRemove = [
      'readheal_volunteers',
      'readheal_stories',
      'readheal_bookings',
      'readheal_audio_submissions',
      'readheal_audio_reports',
      'readheal_availability_slots',
      'readheal_evaluations',
      'readheal_warnings',
      'readheal_certificates',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Failed to clear localStorage keys:', e);
  }
}
