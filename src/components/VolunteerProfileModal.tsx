import React, { useState } from 'react';
import { VolunteerProfile, Story } from '../types';
import { 
  X, 
  Star, 
  Calendar, 
  Clock, 
  Award, 
  Play, 
  Pause, 
  BookOpen, 
  MapPin, 
  Heart, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { Html5AudioPlayer } from './Html5AudioPlayer';

interface VolunteerProfileModalProps {
  volunteer: VolunteerProfile | null;
  onClose: () => void;
  onBook: (volunteer: VolunteerProfile) => void;
  stories: Story[];
  onPlayStory: (story: Story) => void;
}

export const VolunteerProfileModal: React.FC<VolunteerProfileModalProps> = ({
  volunteer,
  onClose,
  onBook,
  stories,
  onPlayStory,
}) => {
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);

  if (!volunteer) return null;

  const volunteerStories = stories.filter((s) => s.readerId === volunteer.id);

  const toggleVoiceSample = () => {
    if (isPlayingVoiceSample) {
      healingSound.stopAmbient();
      setIsPlayingVoiceSample(false);
    } else {
      setIsPlayingVoiceSample(true);
      healingSound.startAmbient('piano');
      setTimeout(() => {
        setIsPlayingVoiceSample(false);
        healingSound.stopAmbient();
      }, 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 p-6 text-white relative">
          <button
            onClick={() => {
              healingSound.stopAmbient();
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <img
                src={volunteer.avatar || undefined}
                alt={volunteer.fullName}
                className="w-22 h-22 rounded-2xl object-cover border-3 border-white/80 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-white font-bold" title="ยืนยันตัวตนแล้ว">
                ✓
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold">{volunteer.fullName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                  ({volunteer.nickname})
                </span>
              </div>

              <p className="text-xs text-sky-100 mb-2">
                อายุ {volunteer.age} ปี • {volunteer.gender === 'female' ? 'หญิง' : 'ชาย'} • ประสบการณ์ {volunteer.experienceYears} ปี
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-white">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>{volunteer.badge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Stats Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{volunteer.rating.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">({volunteer.reviewCount} รีวิวผู้ป่วย)</p>
            </div>

            <div className="border-x border-slate-200">
              <p className="text-sm font-bold text-slate-800">
                {volunteer.totalReadHours} ชั่วโมง
              </p>
              <p className="text-xs text-slate-400 mt-0.5">ชั่วโมงอ่านสะสม</p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {volunteer.totalStoriesRead} เรื่อง
              </p>
              <p className="text-xs text-slate-400 mt-0.5">ผลงานบันทึกเสียง</p>
            </div>
          </div>

          {/* Voice Sample Player Clip */}
          {volunteer.voiceSampleAudioUrl ? (
            <div className="bg-sky-50/90 rounded-2xl p-3 sm:p-4 border border-sky-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Volume2 className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">
                  คลิปตัวอย่างเสียงอ่านจิตอาสา ({volunteer.readingStyle})
                </span>
              </div>
              <Html5AudioPlayer
                compact
                audioUrl={volunteer.voiceSampleAudioUrl}
                title={`เสียงอ่าน: ${volunteer.nickname || volunteer.fullName}`}
              />
            </div>
          ) : (
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleVoiceSample}
                  className="w-11 h-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0"
                >
                  {isPlayingVoiceSample ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isPlayingVoiceSample ? 'กำลังเล่นคลิปตัวอย่างเสียงอ่าน...' : 'ฟังตัวอย่างน้ำเสียงจิตอาสา'}
                  </p>
                  <p className="text-[11px] text-sky-700">
                    🎙️ {volunteer.readingStyle}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-500 shrink-0">
                {volunteer.voiceSampleDuration || '00:20'}
              </span>
            </div>
          )}

          {/* Bio & Motivation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ประวัติและแรงบันดาลใจ (Biography)
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {volunteer.bio}
            </p>
          </div>

          {/* Specialties & Hospital Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                หมวดหมู่ที่ถนัด
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {volunteer.specialties.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                โรงพยาบาลในชลบุรีที่ประจำการ
              </h4>
              <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>พื้นที่หลัก: {volunteer.hospitalZone}</span>
              </p>
              {volunteer.availableHospitals && volunteer.availableHospitals.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {volunteer.availableHospitals.map((h) => (
                    <span key={h} className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Days & Time Slots */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">วันว่างที่สะดวก:</span>
              <span className="font-semibold text-slate-800">
                {volunteer.availableDays.join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ช่วงเวลาบริการ:</span>
              <span className="font-semibold text-slate-800">
                {volunteer.availableTimeSlots.join(', ')}
              </span>
            </div>
          </div>

          {/* Stories read by this volunteer */}
          {volunteerStories.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                เรื่องที่จิตอาสาท่านนี้อ่าน ({volunteerStories.length} เรื่อง)
              </h4>
              <div className="space-y-2">
                {volunteerStories.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-sky-50/50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
                        {st.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        หมวด: {st.categoryName} • {st.duration} นาที
                      </p>
                    </div>

                    <button
                      onClick={() => onPlayStory(st)}
                      className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>ฟัง</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              healingSound.stopAmbient();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs sm:text-sm font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={() => {
              healingSound.stopAmbient();
              onClose();
              onBook(volunteer);
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Calendar className="w-4 h-4" />
            <span>นัดหมายให้อ่านข้างเตียง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
