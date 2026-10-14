import React, { useState } from 'react';
import { Story, VolunteerProfile } from '../types';
import { 
  X, 
  Play, 
  Pause, 
  Clock, 
  Star, 
  Calendar, 
  Volume2, 
  Type, 
  Share2, 
  Heart,
  Bookmark,
  Headphones,
  AlertCircle
} from 'lucide-react';
import { Html5AudioPlayer } from './Html5AudioPlayer';
import { generateHealingWavAudioUrl } from '../utils/audioGenerator';

interface StoryModalProps {
  story: Story | null;
  onClose: () => void;
  onPlay: (story: Story) => void;
  isPlaying: boolean;
  onBookWithReader: (volunteer: VolunteerProfile, story: Story) => void;
  volunteers: VolunteerProfile[];
  onReportError?: (story: Story) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  story,
  onClose,
  onPlay,
  isPlaying,
  onBookWithReader,
  volunteers,
  onReportError,
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');
  const [isLiked, setIsLiked] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  if (!story) return null;

  const audioSrc = story.audioUrl || generateHealingWavAudioUrl('piano', 40);

  const matchedVolunteer =
    volunteers.find((v) => v.id === story.readerId) || volunteers[0];

  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 'normal':
        return 'text-base leading-relaxed';
      case 'large':
        return 'text-lg leading-loose';
      case 'huge':
        return 'text-2xl leading-loose font-medium';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={story.coverImage || undefined}
            alt={story.title}
            className="w-full h-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Duration */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-xs font-semibold px-3 py-1 rounded-full">
              {story.categoryName}
            </span>
            <span className="bg-black/50 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{story.duration} นาที</span>
            </span>
          </div>

          {/* Title & Author at bottom of header */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm">
              {story.title}
            </h2>
            {story.thaiTitle && (
              <p className="text-xs sm:text-sm text-sky-200 mt-1 line-clamp-1">
                {story.thaiTitle}
              </p>
            )}
          </div>
        </div>

        {/* Accessible font size selector and audio toggle bar */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={story.readerAvatar || undefined}
              alt={story.readerName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                อ่านโดย: {story.readerName}
              </p>
              <p className="text-[11px] text-sky-600">
                🎙️ สไตล์: {story.audioTone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct HTML5 Audio Player toggle */}
            <button
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
              className={`px-3 py-1 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                showAudioPlayer
                  ? 'bg-sky-500 border-sky-500 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{showAudioPlayer ? 'ซ่อนเครื่องเล่น' : 'เครื่องเล่นเสียง HTML5'}</span>
            </button>

            {/* Accessible font size selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <Type className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <span className="text-slate-400 text-[11px]">ขนาด:</span>
              {(['normal', 'large', 'huge'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFontSizeLevel(lvl)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                    fontSizeLevel === lvl
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lvl === 'normal' ? 'ก' : lvl === 'large' ? 'ก+' : 'ก++'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Embedded HTML5 Audio Player when active */}
        {showAudioPlayer && (
          <div className="px-5 py-3.5 bg-sky-50/70 border-b border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-600" />
                เครื่องเล่นเสียงตัวอย่าง HTML5 Audio Player สำหรับผู้ป่วย
              </span>
              <span className="text-[11px] text-slate-500">
                พร้อมปุ่มปรับระดับเสียง / ความเร็วเสียง
              </span>
            </div>
            <Html5AudioPlayer
              src={audioSrc}
              title={story.title}
              subtitle={`เสียงอ่านโดย: ${story.readerName}`}
              autoPlay={true}
              compact={false}
            />
          </div>
        )}

        {/* Story Text Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-['Sarabun',sans-serif] text-slate-700">
          <div className={`${getFontSizeClass()} whitespace-pre-line space-y-4`}>
            {story.fullText}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 italic">
            บทความและเรื่องเล่านี้ได้รับอนุญาตเพื่อใช้ในการอ่านบำบัดใจผู้ป่วยในโรงพยาบาลโดย ReadHeal
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-white border-t border-slate-100 p-4 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span>{isLiked ? story.likes + 1 : story.likes} ชื่นชอบ</span>
            </button>

            {onReportError && (
              <button
                onClick={() => onReportError(story)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                title="แจ้งปัญหาไฟล์เสียง (เช่น เสียงแตก เสียงเบา เปิดไม่ได้)"
              >
                <AlertCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                <span className="hidden sm:inline">แจ้งปัญหาไฟล์เสียง</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlay(story)}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>หยุดเล่นเสียง</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>ฟังเสียงอ่านเรื่องนี้</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onClose();
                onBookWithReader(matchedVolunteer, story);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>จองให้อ่านข้างเตียง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
