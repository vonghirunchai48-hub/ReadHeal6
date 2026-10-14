import React, { useState, useMemo } from 'react';
import { ServiceEvaluation, BookingRequest, UserRole, PatientAccount, VolunteerProfile } from '../types';
import { 
  Star, 
  Heart, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Filter, 
  Search, 
  ArrowLeft, 
  MessageSquare, 
  Sparkles, 
  Building2, 
  User, 
  HeartHandshake, 
  Calendar,
  Volume2,
  Smile,
  BadgeCheck,
  Check
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { CHONBURI_HOSPITALS } from '../data/chonburiHospitals';

interface ServiceEvaluationsViewProps {
  evaluations: ServiceEvaluation[];
  bookings: BookingRequest[];
  currentRole: UserRole;
  currentPatientUser?: PatientAccount | null;
  currentVolunteerUser?: VolunteerProfile | null;
  onSubmitEvaluation: (evalData: Omit<ServiceEvaluation, 'id' | 'createdAt'>) => void;
  onBackToHome?: () => void;
  onOpenBooking?: () => void;
}

export const ServiceEvaluationsView: React.FC<ServiceEvaluationsViewProps> = ({
  evaluations,
  bookings,
  currentRole,
  currentPatientUser,
  currentVolunteerUser,
  onSubmitEvaluation,
  onBackToHome,
  onOpenBooking,
}) => {
  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState<string>(() => {
    const unEvaluated = bookings.find((b) => !b.isEvaluated && b.status !== 'cancelled');
    return unEvaluated?.id || bookings[0]?.id || 'demo-booking';
  });
  const [etiquetteRating, setEtiquetteRating] = useState<number>(5);
  const [voiceWarmthRating, setVoiceWarmthRating] = useState<number>(5);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [hospitalFilter, setHospitalFilter] = useState<string>('all');

  // Find the selected booking object or create fallback
  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId) || bookings[0] || null;
  }, [bookings, selectedBookingId]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (evaluations.length === 0) {
      return { avgOverall: '5.0', avgEtiquette: '5.0', avgVoice: '5.0', count: 0 };
    }
    const totalOverall = evaluations.reduce((sum, e) => sum + e.overallRating, 0);
    const totalEtiquette = evaluations.reduce((sum, e) => sum + e.etiquetteRating, 0);
    const totalVoice = evaluations.reduce((sum, e) => sum + e.voiceWarmthRating, 0);

    return {
      avgOverall: (totalOverall / evaluations.length).toFixed(1),
      avgEtiquette: (totalEtiquette / evaluations.length).toFixed(1),
      avgVoice: (totalVoice / evaluations.length).toFixed(1),
      count: evaluations.length,
    };
  }, [evaluations]);

  // Filtered reviews
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      // Rating filter
      if (ratingFilter !== 'all' && item.overallRating !== parseInt(ratingFilter, 10)) {
        return false;
      }
      // Hospital filter
      if (hospitalFilter !== 'all' && !item.hospitalName.includes(hospitalFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.volunteerName.toLowerCase().includes(query);
        const matchComment = item.comments.toLowerCase().includes(query);
        const matchHospital = item.hospitalName.toLowerCase().includes(query);
        const matchPatient = item.patientNameAnonymous.toLowerCase().includes(query);
        return matchName || matchComment || matchHospital || matchPatient;
      }
      return true;
    });
  }, [evaluations, ratingFilter, hospitalFilter, searchQuery]);

  // Quick feedback phrase chips
  const quickChips = [
    'จิตอาสามารยาทดีมาก พูดจาไพเราะและสำรวม',
    'น้ำเสียงนุ่มนวล อบอุ่น ฟังแล้วผ่อนคลายหลับสบาย',
    'ช่วยคลายความกังวลและอาการปวดได้ดีมาก',
    'คุณพ่อคุณแม่ประทับใจมาก อยากให้มาอ่านอีก',
    'ขอบคุณโครงการเตียงนี้มีเรื่องเล่าที่มอบความสุข',
  ];

  const handleAddChip = (chip: string) => {
    healingSound.playClickBeep();
    setComments((prev) => (prev ? `${prev} ${chip}` : chip));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    healingSound.playChime(720, 0.8);

    const bookingTarget = activeBooking;
    const volunteerId = bookingTarget?.volunteerId || 'vol-1';
    const volunteerName = bookingTarget?.volunteerName || 'คุณกิตติศักดิ์ เมตตาธรรม';
    const hospitalName = bookingTarget?.patientInfo.hospitalName || currentPatientUser?.hospitalName || 'โรงพยาบาลชลบุรี';
    const patientName = isAnonymous 
      ? `ผู้รับบริการหอ ${bookingTarget?.patientInfo.ward || 'ทั่วไป'} (${hospitalName})`
      : (bookingTarget?.patientInfo.fullName || currentPatientUser?.fullName || 'ผู้รับบริการทั่วไป');

    onSubmitEvaluation({
      bookingId: bookingTarget?.id || `BK-${Date.now().toString().slice(-4)}`,
      volunteerId,
      volunteerName,
      patientNameAnonymous: patientName,
      hospitalName,
      date: bookingTarget?.date || new Date().toISOString().split('T')[0],
      etiquetteRating,
      voiceWarmthRating,
      overallRating,
      comments: comments.trim() || 'บริการดีมาก จิตอาสามารยาทสุภาพ น้ำเสียงอบอุ่นและให้กำลังใจดีมากค่ะ',
      isAnonymous,
    });

    setShowSuccessToast(true);
    setComments('');
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  const renderStarPicker = (label: string, value: number, onChange: (val: number) => void, desc: string) => (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800">{label}</label>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          {value} / 5 ดาว
        </span>
      </div>
      <p className="text-[11px] text-slate-500">{desc}</p>
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              healingSound.playClickBeep();
              onChange(star);
            }}
            className="p-1 hover:scale-125 transition-transform focus:outline-hidden cursor-pointer"
            title={`${star} ดาว`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value
                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-2xs'
                  : 'text-slate-200 hover:text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6">
      
      {/* Top Navigation & Return Button */}
      {onBackToHome && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-all shadow-2xs group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าหลัก ReadHeal</span>
          </button>

          <span className="text-xs text-slate-400">
            ระบบบริหารคุณภาพและความพึงพอใจการบริการ (QA & Feedback)
          </span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-purple-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Service Evaluation & Patient Voices</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ประเมินผลการบริการ & เสียงสะท้อนข้างเตียง
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              ร่วมส่งต่อความประทับใจ ติชม และประเมินมาตรฐานการอ่านหนังสือบำบัดใจของจิตอาสา 
              เพื่อพัฒนาคุณภาพการดูแลผู้ป่วยตามมาตรฐานกระทรวงสาธารณสุขในโรงพยาบาลชลบุรี 14 แห่ง
            </p>
          </div>

          {/* Quick Score Badge */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 text-center shrink-0 self-start md:self-auto min-w-[180px]">
            <span className="text-xs font-semibold text-purple-200 block">คะแนนความพึงพอใจเฉลี่ย</span>
            <div className="flex items-center justify-center gap-1.5 my-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-300">{stats.avgOverall}</span>
              <div className="text-left">
                <div className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <span className="text-[10px] text-purple-200">เต็ม 5.0</span>
              </div>
            </div>
            <span className="text-[11px] text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
              จาก {stats.count} ผลประเมินจริง
            </span>
          </div>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-purple-200 block text-[11px]">มารยาท & สัมมาคารวะ:</span>
              <span className="font-bold text-white text-sm">{stats.avgEtiquette} / 5.0 ดาว</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-purple-200 block text-[11px]">ความอบอุ่นของน้ำเสียง:</span>
              <span className="font-bold text-white text-sm">{stats.avgVoice} / 5.0 ดาว</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-purple-200 block text-[11px]">การคุ้มครองข้อมูลส่วนบุคคล:</span>
              <span className="font-bold text-white text-sm">ไม่เปิดเผยชื่อ 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {showSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">ส่งผลการประเมินเรียบร้อยแล้ว</h4>
              <p className="text-xs text-emerald-800">
                ขอบพระคุณสำหรับข้อคิดเห็นอันมีค่า ข้อมูลของท่านถูกบันทึกในฐานข้อมูลและส่งแจ้งเตือนให้จิตอาสาเรียบร้อยแล้วค่ะ
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-200/80 text-emerald-900 px-3 py-1 rounded-full shrink-0">
            บันทึกสำเร็จ
          </span>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE: EVALUATION FORM (LEFT) + LIVE REVIEWS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: INTERACTIVE EVALUATION FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                เขียนแบบประเมินความพึงพอใจ
              </h2>
              <p className="text-[11px] text-slate-500">
                ประเมินจิตอาสาผู้อ่านสำหรับรอบการอ่านข้างเตียง
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Booking Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>เลือกรอบนัดหมายที่ต้องการประเมิน:</span>
                {bookings.length > 0 && (
                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                    พบนัดหมาย {bookings.length} รายการ
                  </span>
                )}
              </label>

              {bookings.length > 0 ? (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-hidden font-medium text-slate-800"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.patientInfo.fullName} • ผู้อ่าน: {b.volunteerName} ({b.date} รอบ {b.timeSlot.split(' ')[0]}) {b.isEvaluated ? '[ประเมินแล้ว]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">รอบตัวอย่าง: คุณกิตติศักดิ์ เมตตาธรรม (รพ.ชลบุรี)</div>
                  <span className="text-[11px] text-slate-400">ท่านสามารถประเมินการบริการรอบสาธิตนี้ได้ทันที</span>
                </div>
              )}
            </div>

            {/* Selected Booking Info Mini Card */}
            {activeBooking && (
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">จิตอาสา: {activeBooking.volunteerName}</span>
                  <span className="text-[10px] bg-purple-200/70 text-purple-900 font-medium px-2 py-0.5 rounded-full">
                    {activeBooking.status === 'confirmed' ? 'ยืนยันแล้ว' : activeBooking.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-600" />
                  <span>{activeBooking.patientInfo.hospitalName} ({activeBooking.patientInfo.ward || 'หอผู้ป่วย'})</span>
                </div>
              </div>
            )}

            {/* Star Rating 1: Etiquette */}
            {renderStarPicker(
              '1. ความสุภาพและมารยาทของจิตอาสา (Etiquette)',
              etiquetteRating,
              setEtiquetteRating,
              'การแต่งกายเรียบร้อย การไหว้ทักทาย และการสำรวมกิริยาข้างเตียง'
            )}

            {/* Star Rating 2: Voice Warmth */}
            {renderStarPicker(
              '2. ความอบอุ่นและนุ่มนวลของน้ำเสียง (Voice Warmth)',
              voiceWarmthRating,
              setVoiceWarmthRating,
              'จังหวะการอ่านช้าชัด น้ำเสียงผ่อนคลาย ไม่เร็วหรือดังจนรบกวน'
            )}

            {/* Star Rating 3: Overall Satisfaction */}
            {renderStarPicker(
              '3. ความพึงพอใจโดยรวมของการให้บริการ (Overall)',
              overallRating,
              setOverallRating,
              'ความรู้สึกผ่อนคลายและคุณค่าที่ได้รับจากการอ่านข้างเตียง'
            )}

            {/* Quick Chips Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                คลิกเพื่อใส่ข้อความชมเชยด่วน:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddChip(chip)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 transition-colors cursor-pointer border border-slate-200/80"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Text Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ข้อเสนอแนะเพิ่มเติม หรือ คำชมเชยถึงจิตอาสา:
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="ระบุความประทับใจ หรือข้อความที่ต้องการส่งต่อให้จิตอาสาผู้อ่าน..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-hidden leading-relaxed"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                id="checkbox-anonymous-eval"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded-sm text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="checkbox-anonymous-eval" className="text-xs text-slate-700 cursor-pointer select-none">
                <span className="font-bold text-slate-800">ประเมินแบบไม่เปิดเผยตัวตน (Anonymous Mode)</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ระบบจะไม่เปิดเผยชื่อจริงของผู้ป่วยในหน้าแสดงความคิดเห็นสาธารณะ
                </p>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-service-evaluation"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99"
            >
              <Send className="w-4 h-4" />
              <span>ส่งผลการประเมิน (Submit Evaluation)</span>
            </button>
          </form>
        </div>

        {/* RIGHT: LIVE SUBMITTED REVIEWS DATABASE (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter and Search Bar Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  เสียงสะท้อนจริงจากผู้ป่วย ({filteredEvaluations.length} รายการ)
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Reviews
                </span>
              </div>

              {/* Star Rating Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', '5', '4', '3'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatingFilter(r)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      ratingFilter === r
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {r === 'all' ? 'ทั้งหมด' : `${r} ดาว ★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input & Hospital Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อจิตอาสา รพ. หรือข้อความ..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-200 text-slate-800"
                />
              </div>

              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-200 text-slate-700"
              >
                <option value="all">ทุกโรงพยาบาลในเครือข่ายชลบุรี ({CHONBURI_HOSPITALS.length} แห่ง)</option>
                {CHONBURI_HOSPITALS.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name} ({h.district}) • {h.ownership}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Review Cards */}
          <div className="space-y-3">
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  {/* Top card metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {item.volunteerName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>จิตอาสา: {item.volunteerName}</span>
                          <BadgeCheck className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          รหัสอ้างอิง: {item.id} • {item.createdAt || item.date}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-800">
                        {item.overallRating}.0
                      </span>
                    </div>
                  </div>

                  {/* Review comment quote box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed relative">
                    <span className="text-purple-300 font-serif text-lg leading-none mr-1">“</span>
                    {item.comments}
                    <span className="text-purple-300 font-serif text-lg leading-none ml-1">”</span>
                  </div>

                  {/* Sub-scores & Author attribution */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Smile className="w-3 h-3 text-emerald-600" />
                        <span>มารยาท: <strong>{item.etiquetteRating}/5</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-sky-600" />
                        <span>น้ำเสียง: <strong>{item.voiceWarmthRating}/5</strong></span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{item.hospitalName}</span>
                      <span>•</span>
                      <span>{item.patientNameAnonymous}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">ไม่พบผลการประเมินที่ตรงกับเงื่อนไข</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด" เพื่อดูผลการประเมินอื่น
                </p>
                <button
                  onClick={() => {
                    setRatingFilter('all');
                    setHospitalFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs text-purple-700 font-semibold hover:underline cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
