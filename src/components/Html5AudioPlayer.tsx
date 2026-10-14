import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw,
  Sparkles,
  Music
} from 'lucide-react';
import { formatDurationSeconds } from '../utils/audioGenerator';
import { getAudioFromIndexedDB, generatePermanentWavDataUrl } from '../utils/persistentStorage';

interface Html5AudioPlayerProps {
  src?: string;
  audioUrl?: string; // Support both prop names seamlessly
  title?: string;
  subtitle?: string;
  compact?: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export const Html5AudioPlayer: React.FC<Html5AudioPlayerProps> = ({
  src,
  audioUrl,
  title,
  subtitle,
  compact = false,
  autoPlay = false,
  onEnded,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rawInput = (audioUrl || src || '').trim();

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!rawInput) return generatePermanentWavDataUrl('piano', 30);
    if (rawInput.startsWith('data:audio/') || rawInput.startsWith('http://') || rawInput.startsWith('https://') || rawInput.startsWith('blob:')) {
      return rawInput;
    }
    return null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve audio source from IndexedDB if necessary
  useEffect(() => {
    let isMounted = true;

    async function resolveSource() {
      if (!rawInput) {
        if (isMounted) setResolvedSrc(generatePermanentWavDataUrl('piano', 30));
        return;
      }

      // 1. Pointer to IndexedDB: indexeddb://<id>
      if (rawInput.startsWith('indexeddb://')) {
        const id = rawInput.replace('indexeddb://', '');
        const fromDb = await getAudioFromIndexedDB(id);
        if (isMounted) {
          setResolvedSrc(fromDb || generatePermanentWavDataUrl('piano', 35));
        }
        return;
      }

      // 2. Direct playable data URL or remote URL
      if (rawInput.startsWith('data:audio/') || rawInput.startsWith('http://') || rawInput.startsWith('https://') || rawInput.startsWith('blob:')) {
        if (isMounted) setResolvedSrc(rawInput);
        return;
      }

      // 3. Might be record ID
      const fromDb = await getAudioFromIndexedDB(rawInput);
      if (isMounted) {
        setResolvedSrc(fromDb || generatePermanentWavDataUrl('piano', 35));
      }
    }

    resolveSource();

    return () => {
      isMounted = false;
    };
  }, [rawInput]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // When resolvedSrc changes, reload audio element
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(true);
    if (audioRef.current && resolvedSrc) {
      audioRef.current.load();
      if (autoPlay) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [resolvedSrc, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration || 300, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.2, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl px-3 py-2 transition-all ${className}`}>
        {resolvedSrc ? (
          <audio
            ref={audioRef}
            src={resolvedSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              onEnded?.();
            }}
            preload="metadata"
          />
        ) : null}

        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
          title={isPlaying ? 'หยุดชั่วคราว' : 'กดฟังเสียง'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          {(title || subtitle) && (
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate">{title}</span>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {formatDurationSeconds(currentTime)} / {formatDurationSeconds(duration || 0)}
              </span>
            </div>
          )}
          
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>

        {/* Animated Sound Wave Indicator */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 shrink-0 px-1">
            <span className="w-0.5 h-3 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-0.5 h-4 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-0.5 h-2 bg-sky-500 rounded-full animate-bounce" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-sky-50/70 via-white to-teal-50/50 rounded-2xl border border-sky-100 p-4 shadow-xs ${className}`}>
      {resolvedSrc ? (
        <audio
          ref={audioRef}
          src={resolvedSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
          preload="metadata"
        />
      ) : null}

      {/* Header Info */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <h4 className="text-xs font-bold text-slate-800 truncate">{title}</h4>
            </div>
            {subtitle && <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-sky-700 hover:border-sky-300 cursor-pointer"
              title="ความเร็วการอ่าน"
            >
              {playbackRate}x
            </button>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              {formatDurationSeconds(currentTime)} / {formatDurationSeconds(duration || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Scrubber Progress Bar */}
      <div className="mb-3">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>{formatDurationSeconds(currentTime)}</span>
          <span>{formatDurationSeconds(duration || 0)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Skip -10s */}
        <button
          type="button"
          onClick={() => handleSkip(-10)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          title="ย้อนกลับ 10 วินาที"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Main Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>พักเสียงอ่าน</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              <span>ทดลองฟังเสียง</span>
            </>
          )}
        </button>

        {/* Skip +10s */}
        <button
          type="button"
          onClick={() => handleSkip(10)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          title="ข้ามไปข้างหน้า 10 วินาที"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-14 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
      </div>
    </div>
  );
};
