import React, { useState, useEffect, useRef } from 'react';
import { Story, AudioPlayerState } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  X, 
  Moon, 
  Sparkles, 
  Heart,
  FileText,
  AlertCircle
} from 'lucide-react';
import { healingSound, speechNarrator } from '../utils/audioSynthesizer';
import { generateHealingWavAudioUrl } from '../utils/audioGenerator';
import { getAudioFromIndexedDB } from '../utils/persistentStorage';

interface BedsideAudioPlayerProps {
  playerState: AudioPlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<AudioPlayerState>>;
  onClose: () => void;
  onOpenTranscript: (story: Story) => void;
  onReportError?: (story: Story) => void;
}

export const BedsideAudioPlayer: React.FC<BedsideAudioPlayerProps> = ({
  playerState,
  setPlayerState,
  onClose,
  onOpenTranscript,
  onReportError,
}) => {
  const { currentStory, isPlaying, progress, currentTime, duration, volume, ambientSound, isExpanded } = playerState;

  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const html5AudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAudioSource, setActiveAudioSource] = useState<string | null>(() => {
    if (!currentStory?.audioUrl) return null;
    const raw = currentStory.audioUrl;
    if (raw.startsWith('data:audio/') || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:')) {
      return raw;
    }
    return null;
  });

  // Sync active audio source when currentStory changes
  useEffect(() => {
    let isMounted = true;
    if (currentStory) {
      const rawSrc = currentStory.audioUrl;
      if (rawSrc && (rawSrc.startsWith('data:audio/') || rawSrc.startsWith('http://') || rawSrc.startsWith('https://') || rawSrc.startsWith('blob:'))) {
        setActiveAudioSource(rawSrc);
      } else if (rawSrc && rawSrc.startsWith('indexeddb://')) {
        const id = rawSrc.replace('indexeddb://', '') || currentStory.id;
        getAudioFromIndexedDB(id).then((dataUrl) => {
          if (isMounted) {
            setActiveAudioSource(dataUrl || generateHealingWavAudioUrl('piano', 45));
          }
        });
      } else {
        // Try looking up story id in IndexedDB
        getAudioFromIndexedDB(currentStory.id).then((dataUrl) => {
          if (isMounted) {
            setActiveAudioSource(dataUrl || generateHealingWavAudioUrl('piano', 45));
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [currentStory?.id, currentStory?.audioUrl]);

  // Sync HTML5 audio play/pause with playerState.isPlaying
  useEffect(() => {
    if (!html5AudioRef.current) return;
    if (isPlaying) {
      html5AudioRef.current.volume = volume;
      html5AudioRef.current.play().catch((e) => {
        console.warn('HTML5 Audio autoplay restricted or waiting for user gesture:', e);
      });
    } else {
      html5AudioRef.current.pause();
    }
  }, [isPlaying, activeAudioSource]);

  // Sync volume with HTML5 Audio
  useEffect(() => {
    if (html5AudioRef.current) {
      html5AudioRef.current.volume = volume;
    }
  }, [volume]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Main playback timer loop
  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying && currentStory) {
      timer = window.setInterval(() => {
        setPlayerState((prev) => {
          if (prev.currentTime >= prev.duration) {
            healingSound.stopAmbient();
            speechNarrator.stop();
            return {
              ...prev,
              isPlaying: false,
              currentTime: 0,
              progress: 0,
            };
          }
          const nextTime = prev.currentTime + 1;
          return {
            ...prev,
            currentTime: nextTime,
            progress: (nextTime / prev.duration) * 100,
          };
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStory, setPlayerState]);

  // Handle ambient sound changes
  useEffect(() => {
    if (isPlaying) {
      healingSound.startAmbient(ambientSound);
    } else {
      healingSound.stopAmbient();
    }
  }, [isPlaying, ambientSound]);

  // Handle Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerMinutes === null) return;

    const timeout = window.setTimeout(() => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      healingSound.stopAmbient();
      speechNarrator.stop();
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [sleepTimerMinutes, setPlayerState]);

  if (!currentStory) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      speechNarrator.pause();
      healingSound.stopAmbient();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      healingSound.playClickBeep();
      healingSound.startAmbient(ambientSound);
      // Also optionally read excerpt gently
      speechNarrator.speak(currentStory.fullText.slice(0, 400));
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    const newTime = (newProgress / 100) * duration;
    setPlayerState((prev) => ({
      ...prev,
      progress: newProgress,
      currentTime: newTime,
    }));
  };

  const handleSkip = (seconds: number) => {
    setPlayerState((prev) => {
      const newTime = Math.max(0, Math.min(prev.duration, prev.currentTime + seconds));
      return {
        ...prev,
        currentTime: newTime,
        progress: (newTime / prev.duration) * 100,
      };
    });
  };

  const toggleExpand = () => {
    setPlayerState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  return (
    <>
      {/* Real HTML5 audio stream element for bedside audio playback */}
      {activeAudioSource ? (
        <audio
          ref={html5AudioRef}
          src={activeAudioSource}
          preload="auto"
          loop
        />
      ) : null}

      {/* ======================================================= */}
      {/* EXPANDED FULL BEDSIDE RELAXATION VIEW */}
      {/* ======================================================= */}
      {isExpanded ? (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col justify-between p-6 sm:p-10 text-white animate-in fade-in duration-300 overflow-y-auto">
          {/* Top Bar in Expanded Mode */}
          <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                โหมดเปิดฟังข้างเตียง (Bedside Healing Mode)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenTranscript(currentStory)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              >
                <FileText className="w-4 h-4 text-sky-300" />
                <span>เปิดอ่านบทความ</span>
              </button>

              <button
                onClick={toggleExpand}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="ย่อแถบเครื่องเล่น"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Story Visual Artwork & Sound Waves */}
          <div className="max-w-md w-full mx-auto text-center my-auto py-8">
            <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 mb-8 group">
              <img
                src={currentStory.coverImage || undefined}
                alt={currentStory.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              {/* Soothing breathing pulse wave when playing */}
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 rounded-full border-2 border-sky-400/40 animate-ping opacity-30" />
                </div>
              )}
            </div>

            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/40 mb-3">
              {currentStory.categoryName}
            </span>

            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {currentStory.title}
            </h2>
            <p className="text-sm text-sky-200/80 mb-1">
              เสียงอ่านโดย: <span className="font-semibold text-white">{currentStory.readerName}</span>
            </p>
            <p className="text-xs text-slate-400">
              🎙️ {currentStory.audioTone}
            </p>
          </div>

          {/* Expanded Bottom Controls */}
          <div className="max-w-2xl w-full mx-auto space-y-6">
            {/* Scrubber progress */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play/Pause skip controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleSkip(-10)}
                className="p-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="ย้อน 10 วินาที"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-xl shadow-sky-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-white" />
                ) : (
                  <Play className="w-7 h-7 fill-white ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="ข้าม 10 วินาที"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            {/* Ambient Sound & Sleep Timer Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">เสียงคลอบำบัด:</span>
                {[
                  { id: 'piano', label: '🎹 เปียโนบำบัด' },
                  { id: 'rain', label: '🌧️ ฝนพรำเบาๆ' },
                  { id: 'none', label: 'ปิดเสียงคลอ' },
                ].map((amb) => (
                  <button
                    key={amb.id}
                    onClick={() =>
                      setPlayerState((prev) => ({
                        ...prev,
                        ambientSound: amb.id as 'piano' | 'rain' | 'none',
                      }))
                    }
                    className={`px-3 py-1 rounded-full border transition-all ${
                      ambientSound === amb.id
                        ? 'bg-sky-500 border-sky-400 text-white font-semibold'
                        : 'border-white/20 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {amb.label}
                  </button>
                ))}
              </div>

              {/* Sleep timer */}
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-amber-300" />
                <span className="text-slate-400">ตั้งเวลาปิด:</span>
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setSleepTimerMinutes(sleepTimerMinutes === mins ? null : mins);
                      healingSound.playClickBeep();
                    }}
                    className={`px-2.5 py-1 rounded-full border transition-all ${
                      sleepTimerMinutes === mins
                        ? 'bg-amber-500 border-amber-400 text-white font-semibold'
                        : 'border-white/20 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {mins} นาที
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================= */
        /* COMPACT FLOATING BOTTOM PLAYER BAR */
        /* ======================================================= */
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl px-4 py-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Story Thumbnail & Info */}
            <div 
              onClick={toggleExpand}
              className="flex items-center gap-3 cursor-pointer min-w-0 max-w-xs sm:max-w-md group"
            >
              <img
                src={currentStory.coverImage || undefined}
                alt={currentStory.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-sky-100 text-sky-800 shrink-0">
                    {currentStory.categoryName}
                  </span>
                  {isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                  {currentStory.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  อ่านโดย: {currentStory.readerName}
                </p>
              </div>
            </div>

            {/* Playback Controls & Scrubber in center */}
            <div className="flex-1 max-w-md hidden sm:flex flex-col items-center">
              <div className="flex items-center gap-4 mb-1">
                <button
                  onClick={() => handleSkip(-10)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  title="ย้อน 10 วินาที"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  title="ข้าม 10 วินาที"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Mini scrub bar */}
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <span className="text-[10px] font-mono text-slate-400">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Mobile Play Button */}
            <div className="flex items-center sm:hidden gap-2">
              <button
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>

            {/* Right Quick Controls */}
            <div className="flex items-center gap-2">
              {onReportError && currentStory && (
                <button
                  onClick={() => onReportError(currentStory)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs transition-colors cursor-pointer"
                  title="แจ้งปัญหาไฟล์เสียงนี้"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">แจ้งปัญหา</span>
                </button>
              )}

              <button
                onClick={() => onOpenTranscript(currentStory)}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
                title="อ่านเนื้อหา"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>อ่าน</span>
              </button>

              <button
                onClick={toggleExpand}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="ขยายเป็นโหมดข้างเตียง"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  healingSound.stopAmbient();
                  speechNarrator.stop();
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="ปิดเครื่องเล่น"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
