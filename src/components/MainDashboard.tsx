import React, { useState } from 'react';
import { Category, VolunteerProfile, Story } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  HeartHandshake, 
  Feather, 
  Compass, 
  Sun, 
  Play, 
  Pause,
  Clock, 
  Star, 
  Headphones, 
  Calendar, 
  ChevronRight, 
  Heart, 
  Award,
  Volume2,
  CheckCircle,
  FileText,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface MainDashboardProps {
  categories: Category[];
  volunteers: VolunteerProfile[];
  stories: Story[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchQuery: string;
  onPlayStory: (story: Story) => void;
  currentPlayingStoryId: string | null;
  isAudioPlaying: boolean;
  onViewStoryDetails: (story: Story) => void;
  onViewVolunteerDetails: (volunteer: VolunteerProfile) => void;
  onStartBookingWithVolunteer: (volunteer: VolunteerProfile, preferredStory?: Story) => void;
  onNavigateToBooking: () => void;
  onResetToLanding?: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  categories,
  volunteers,
  stories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onPlayStory,
  currentPlayingStoryId,
  isAudioPlaying,
  onViewStoryDetails,
  onViewVolunteerDetails,
  onStartBookingWithVolunteer,
  onNavigateToBooking,
  onResetToLanding,
}) => {
  // Mood / Healing filter
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Helper for category icons
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5" />;
      case 'Feather':
        return <Feather className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  // Filter stories based on selected category, search query, and mood
  const filteredStories = stories.filter((story) => {
    const matchesCategory = !selectedCategory || story.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.readerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood =
      !selectedMood ||
      (selectedMood === 'sleep' && (story.durationSeconds > 420 || story.tags.includes('หลับสบาย') || story.categoryId === 'cat-dharma')) ||
      (selectedMood === 'encourage' && (story.categoryId === 'cat-psychology' || story.categoryId === 'cat-self-dev')) ||
      (selectedMood === 'fairy' && story.categoryId === 'cat-fairy-tales') ||
      (selectedMood === 'calm' && (story.categoryId === 'cat-dharma' || story.tags.includes('ผ่อนคลาย')));

    return matchesCategory && matchesSearch && matchesMood;
  });

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">
      {/* Header Back Button / Return to Role Selection Gateway */}
      {onResetToLanding && (
        <div className="flex items-center justify-between">
          <button
            onClick={onResetToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-all shadow-2xs group cursor-pointer"
            title="กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าเลือกบทบาท (Patient, Volunteer, Admin)</span>
          </button>
          <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            บทบาทปัจจุบัน: ผู้รับบริการ / ผู้ป่วยข้างเตียง
          </span>
        </div>
      )}

      {/* Healing Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/90 via-sky-50 to-teal-50 border border-sky-200/70 p-6 sm:p-10 shadow-xs">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-sky-200/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200 text-sky-800 text-xs font-semibold mb-3 shadow-2xs">
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>เสียงอ่านข้างเตียงเพื่อการเยียวยาจิตใจ • เครือข่าย รพ. ชลบุรี 14 แห่ง</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-3">
            สวัสดีค่ะ วันนี้หัวใจของคุณรู้สึกอย่างไรบ้าง?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            ให้เสียงอ่านที่อบอุ่นและเรื่องราวดีๆ ช่วยโอบกอดความเหนื่อยล้า 
            คุณสามารถเลือกฟังเรื่องสั้นบำบัด หรือจองจิตอาสามาอ่านให้ฟังแบบตัวต่อตัวข้างเตียงได้ตลอดเวลา
          </p>

          {/* Quick Mood Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 mr-1">อารมณ์ที่ต้องการ:</span>
            {[
              { id: null, label: 'ทั้งหมด' },
              { id: 'encourage', label: '💖 ต้องการกำลังใจ' },
              { id: 'sleep', label: '🌙 ผ่อนคลายก่อนนอน' },
              { id: 'fairy', label: '📖 นิทานเพลินใจ' },
              { id: 'calm', label: '🕊️ สงบเย็น ปล่อยวาง' },
            ].map((mood) => (
              <button
                key={mood.label}
                onClick={() => {
                  setSelectedMood(mood.id);
                  healingSound.playClickBeep();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedMood === mood.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200/80 hover:border-sky-300'
                }`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: Category Selection (เลือกหมวดหมู่) */}
      {/* ============================================================ */}
      <section id="section-categories">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                เลือกหมวดหมู่เรื่องเล่า (Categories)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              คัดสรรเรื่องราวอบอุ่นที่เหมาะกับการฟื้นฟูจิตใจในโรงพยาบาล
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-full border border-sky-200 transition-colors"
            >
              แสดงทุกหมวดหมู่ (ล้างตัวกรอง)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <div
                key={category.id}
                onClick={() => {
                  healingSound.playClickBeep();
                  onSelectCategory(isSelected ? null : category.id);
                }}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/90 shadow-md ring-2 ring-sky-200'
                    : 'border-slate-200/80 bg-white hover:border-sky-200 hover:shadow-sm'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${category.bgColorClass} ${category.colorClass}`}
                  >
                    {renderCategoryIcon(category.iconName)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{category.storyCount} เรื่อง</span>
                  <span className={`font-semibold ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}>
                    {isSelected ? 'เลือกอยู่' : 'เลือก'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: Stories Read by Volunteers (เรื่องที่จิตอาสาอ่าน) */}
      {/* ============================================================ */}
      <section id="section-stories">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                เรื่องที่จิตอาสาอ่าน (Stories by Volunteers)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              พบกับเสียงอ่านคุณภาพ นิทาน และบทความฮีลใจข้างเตียง พร้อมระบบฟังทันที
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              พบ {filteredStories.length} เรื่อง
            </span>
          </div>
        </div>

        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-base">
              ไม่พบเรื่องเล่าที่ตรงกับเงื่อนไขการค้นหา
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนคำค้นหา หรือคลิกเพื่อล้างตัวกรองหมวดหมู่
            </p>
            <button
              onClick={() => {
                onSelectCategory(null);
                setSelectedMood(null);
              }}
              className="mt-4 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition-colors"
            >
              แสดงเรื่องทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const isCurrentlyPlaying =
                currentPlayingStoryId === story.id && isAudioPlaying;

              return (
                <div
                  key={story.id}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-sky-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Story Cover Image & Duration Badge */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={story.coverImage || undefined}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                      {/* Top Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                          {story.categoryName}
                        </span>
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>{story.duration} นาที</span>
                      </div>

                      {/* Quick Play Trigger Overlay */}
                      <button
                        onClick={() => onPlayStory(story)}
                        className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title={isCurrentlyPlaying ? 'หยุดฟัง' : 'กดฟังเรื่องนี้'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Story Details Body */}
                    <div className="p-5">
                      <h3
                        onClick={() => onViewStoryDetails(story)}
                        className="font-bold text-base text-slate-800 hover:text-sky-700 cursor-pointer line-clamp-1 mb-1 transition-colors"
                      >
                        {story.title}
                      </h3>

                      {story.thaiTitle && (
                        <p className="text-xs text-slate-400 line-clamp-1 mb-2.5">
                          {story.thaiTitle}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {story.excerpt}
                      </p>

                      {/* Volunteer Reader Profile Strip */}
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        <img
                          src={story.readerAvatar || undefined}
                          alt={story.readerName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            อ่านโดย: {story.readerName}
                          </p>
                          <p className="text-[11px] text-sky-600 truncate">
                            {story.audioTone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onViewStoryDetails(story)}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>อ่านเนื้อเรื่อง</span>
                    </button>

                    <button
                      onClick={() => {
                        const matchedVol = volunteers.find((v) => v.id === story.readerId) || volunteers[0];
                        onStartBookingWithVolunteer(matchedVol, story);
                      }}
                      className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium flex items-center justify-center gap-1.5 border border-sky-200 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>จองให้อ่านข้างเตียง</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: Volunteer Profiles (ประวัติจิตอาสา) */}
      {/* ============================================================ */}
      <section id="section-volunteers">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                ประวัติและทีมงานจิตอาสา (Volunteer Profiles)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              จิตอาสาผู้ผ่านการรับรอง พร้อมมอบเสียงอ่านและการดูแลอย่างอบอุ่นข้างเตียงผู้ป่วย
            </p>
          </div>

          <div className="text-xs text-slate-500">
            อาสาสมัครพร้อมให้บริการ {volunteers.length} ท่าน
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {volunteers.map((vol) => (
            <div
              key={vol.id}
              className="bg-white rounded-3xl border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Header Profile with Avatar & Badges */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={vol.avatar || undefined}
                      alt={vol.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white" title="จิตอาสาผ่านการรับรอง">
                      ✓
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-slate-800 group-hover:text-sky-700 transition-colors">
                        {vol.fullName}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-sky-600">
                      ชื่อเล่น: {vol.nickname} • อายุ {vol.age} ปี
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {vol.hospitalZone}
                    </p>
                  </div>
                </div>

                {/* Rating & Stats Strip */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-2xl text-center mb-4 border border-slate-100">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{vol.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({vol.reviewCount} รีวิว)</span>
                  </div>

                  <div className="border-x border-slate-200">
                    <p className="text-xs font-bold text-slate-700">
                      {vol.totalReadHours} ชม.
                    </p>
                    <span className="text-[10px] text-slate-400">อ่านสะสม</span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {vol.totalStoriesRead} เรื่อง
                    </p>
                    <span className="text-[10px] text-slate-400">ผลงานเสียง</span>
                  </div>
                </div>

                {/* Bio Excerpt */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {vol.bio}
                </p>

                {/* Reading Style Tag & Available Hospitals */}
                <div className="mb-3 space-y-1.5">
                  <span className="inline-block text-[11px] px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/60 font-medium">
                    🎙️ {vol.readingStyle}
                  </span>
                  {vol.availableHospitals && vol.availableHospitals.length > 0 && (
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      <span className="font-semibold text-slate-700">ประจำ:</span>{' '}
                      {vol.availableHospitals.join(', ')}
                    </div>
                  )}
                </div>

                {/* Specialties tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {vol.specialties.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onViewVolunteerDetails(vol)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  ดูประวัติ & เสียง
                </button>

                <button
                  onClick={() => onStartBookingWithVolunteer(vol)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>จองคิวอ่านให้ฟัง</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bedside Booking Call-to-Action Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-teal-700 p-8 sm:p-10 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white mb-3 inline-block">
            บริการเพื่อผู้ป่วยในโรงพยาบาล • ไม่มีค่าใช้จ่าย
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">
            ต้องการจิตอาสาไปอ่านหนังสือให้ฟังข้างเตียง?
          </h3>
          <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
            กรอกข้อมูลผู้ป่วยง่ายๆ เพียง 4 ขั้นตอน เลือกจิตอาสาที่ประทับใจ 
            กำหนดวันเวลา แล้วรอรับเสียงอ่านที่ช่วยฟื้นฟูจิตใจข้างเตียงได้ทันที
          </p>
        </div>

        <div className="relative z-10 shrink-0 w-full sm:w-auto">
          <button
            onClick={onNavigateToBooking}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5 text-sky-600" />
            <span>เริ่มต้นจองคิวบริการอ่านข้างเตียง</span>
            <ChevronRight className="w-4 h-4 text-sky-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
