/**
 * Audio Synthesizer & Healing Frequencies Utility for ReadHeal
 * Provides relaxing ambient music, soft bell chimes, and optional speech reading
 * without needing external audio file assets.
 */

class HealingSoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private intervalId: number | null = null;
  private rainNode: AudioNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a soft healing kalimba chime (frequency in Hz)
  public playChime(freq: number = 528, duration: number = 1.8) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle pitch bend
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext may be restricted by browser policy before first gesture
    }
  }

  // Start relaxing ambient background (432Hz soft chord + melodic sparkles)
  public startAmbient(type: 'piano' | 'rain' | 'nature' | 'none' = 'piano') {
    if (type === 'none') {
      this.stopAmbient();
      return;
    }

    try {
      const ctx = this.getContext();
      this.stopAmbient();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;
      this.isAmbientPlaying = true;

      if (type === 'piano' || type === 'nature') {
        // Pentatonic peaceful notes in A=432Hz tuning: C4, D4, E4, G4, A4, C5
        const notes = [256.87, 288.33, 323.63, 384.87, 432.0, 513.74, 576.65];

        // Soft drone base
        const drone = ctx.createOscillator();
        const droneGain = ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = 216; // A3 base
        droneGain.gain.value = 0.03;
        drone.connect(droneGain);
        droneGain.connect(masterGain);
        drone.start();

        // Periodic gentle chimes
        this.intervalId = window.setInterval(() => {
          if (!this.isAmbientPlaying) return;
          const randomNote = notes[Math.floor(Math.random() * notes.length)];
          this.playChime(randomNote, 2.5);
        }, 3200);
      } else if (type === 'rain') {
        // Generate soft pink noise for gentle rain
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // Mellow soothing rain

        rainSource.connect(filter);
        filter.connect(masterGain);
        rainSource.start();
        this.rainNode = rainSource;
      }
    } catch (e) {
      console.warn('Healing sound engine init failed:', e);
    }
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rainNode) {
      try {
        (this.rainNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.rainNode = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  // Play a soft UI interaction confirmation chime
  public playClickBeep() {
    this.playChime(648, 0.4);
  }
}

export const healingSound = new HealingSoundEngine();

// Speech Synthesis Helper
export class StorySpeechNarrator {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;

  public speak(text: string, onEnd?: () => void, onBoundary?: (charIndex: number) => void) {
    if (!('speechSynthesis' in window)) return;
    this.stop();

    // Take snippet of text for gentle pacing
    const cleanText = text.replace(/[\n\r]+/g, ' ').trim();
    this.utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Look for Thai voice or pleasant soft pitch
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.startsWith('th'));
    if (thaiVoice) {
      this.utterance.voice = thaiVoice;
    }
    this.utterance.rate = 0.88; // Gentle, slow hospital healing reading pace
    this.utterance.pitch = 1.0;

    this.utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    if (onBoundary) {
      this.utterance.onboundary = (e) => {
        onBoundary(e.charIndex);
      };
    }

    this.isSpeaking = true;
    window.speechSynthesis.speak(this.utterance);
  }

  public pause() {
    if ('speechSynthesis' in window && this.isSpeaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }
}

export const speechNarrator = new StorySpeechNarrator();
