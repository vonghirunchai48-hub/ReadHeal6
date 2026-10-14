import React, { useState } from 'react';
import { VolunteerProfile } from '../types';
import { 
  X, 
  HeartHandshake, 
  Zap, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Clock,
  Search
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface VolunteerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteers: VolunteerProfile[];
  onLoginSuccess: (volunteer: VolunteerProfile) => void;
  onGoToRegistration: () => void;
  onOpenStatusCheck?: (email?: string) => void;
  resetKey?: number;
}

export const VolunteerLoginModal: React.FC<VolunteerLoginModalProps> = ({
  isOpen,
  onClose,
  volunteers,
  onLoginSuccess,
  onGoToRegistration,
  onOpenStatusCheck,
  resetKey,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockedVolunteer, setBlockedVolunteer] = useState<VolunteerProfile | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Security: Clean input fields when resetKey triggers or modal opens/closes
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setBlockedVolunteer(null);
    setSuccessInfo(null);
  }, [resetKey, isOpen]);

  // Accessibility: Close modal when pressing Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Demo sample accounts for volunteers using email & password
  const SAMPLE_VOLUNTEERS = [
    {
      id: 'vol-1',
      name: 'ครูนิ่ม (พิมลวรรณ สุขประเสริฐ)',
      email: 'nim.sukprasert@readheal.org',
      password: 'volunteer123',
      hospital: 'รพ.มหาวิทยาลัยบูรพา / รพ.ชลบุรี',
    },
    {
      id: 'vol-2',
      name: 'หมออาร์ต (นพ. ภัทรพล วงศ์รักษ์)',
      email: 'art.phattara@hospital.ac.th',
      password: 'volunteer123',
      hospital: 'รพ.สมเด็จฯ ณ ศรีราชา',
    },
    {
      id: 'vol-3',
      name: 'น้องมายด์ (ชนิกานต์ สว่างเนตร)',
      email: 'mind.chanikarn@go.buu.ac.th',
      password: 'volunteer123',
      hospital: 'รพ.แหลมฉบัง / รพ.ชลบุรี',
    },
  ];

  const handleDemoBypass = () => {
    healingSound.playChime(640, 0.7);
    const demoVolunteer = volunteers.find((v) => v.id === 'vol-1' || v.email === 'nim.sukprasert@readheal.org') || volunteers[0] || {
      id: 'vol-demo',
      fullName: 'พิมลวรรณ สุขประเสริฐ',
      nickname: 'ครูนิ่ม',
      age: 42,
      gender: 'female',
      phone: '081-456-7890',
      email: 'nim.sukprasert@readheal.org',
      password: 'volunteer123',
      hospitalZone: 'เครือข่ายโรงพยาบาลจังหวัดชลบุรี',
      availableHospitals: ['โรงพยาบาลชลบุรี', 'โรงพยาบาลมหาวิทยาลัยบูรพา'],
      bio: 'จิตอาสาตัวอย่างสำหรับสาธิตระบบ',
      readingStyle: 'เสียงนุ่มนวล ผ่อนคลาย',
      voiceToneDesc: 'อบอุ่น อ่อนโยน',
      experienceYears: 3,
      rating: 4.95,
      reviewCount: 112,
      totalReadHours: 75,
      totalStoriesRead: 40,
      badge: 'จิตอาสายอดเยี่ยมประจำปี',
      availableDays: ['จันทร์', 'พุธ', 'เสาร์'],
      availableTimeSlots: ['10:00 - 11:30 น.', '14:00 - 15:30 น.'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      status: 'verified',
      specialties: ['นิทาน / เรื่องสั้น', 'จิตวิทยา / กำลังใจ'],
    };

    setSuccessInfo(`เข้าสู่ระบบสาธิตในนาม "${demoVolunteer.nickname || demoVolunteer.fullName}" (${demoVolunteer.email}) สำเร็จ`);
    setTimeout(() => {
      onLoginSuccess(demoVolunteer);
    }, 450);
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    healingSound.playClickBeep();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('กรุณาระบุอีเมล (Email) ที่ลงทะเบียนไว้');
      healingSound.playClickBeep();
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('กรุณาระบุรหัสผ่าน (Password)');
      healingSound.playClickBeep();
      return;
    }

    setIsLoading(true);
    healingSound.playClickBeep();

    setTimeout(() => {
      setIsLoading(false);

      // 1. Check match by email in volunteers list
      let matched = volunteers.find((v) => v.email.toLowerCase() === cleanEmail);

      // Fallback: match by ID or nickname if entered
      if (!matched) {
        matched = volunteers.find((v) => 
          v.id.toLowerCase() === cleanEmail ||
          v.nickname?.toLowerCase() === cleanEmail ||
          v.fullName.toLowerCase() === cleanEmail
        );
      }

      // Check sample list fallback
      if (!matched) {
        const sampleMatch = SAMPLE_VOLUNTEERS.find((s) => s.email.toLowerCase() === cleanEmail);
        if (sampleMatch) {
          matched = volunteers.find((v) => v.id === sampleMatch.id);
        }
      }

      if (matched) {
        // Strict Password Check: MUST match the registered account's password exactly
        const validPassword = matched.password || 'volunteer123';
        const isPasswordCorrect = cleanPassword === validPassword;

        if (!isPasswordCorrect) {
          healingSound.playClickBeep();
          setErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง (รหัสผ่านตัวอย่างคือ volunteer123)');
          setBlockedVolunteer(null);
          return;
        }

        // Approval Status Verification: Block access if pending or rejected
        const isPending = matched.approvalStatus === 'pending' || matched.status === 'pending';
        const isRejected = matched.approvalStatus === 'rejected' || matched.status === 'rejected';

        if (isPending) {
          healingSound.playClickBeep();
          setBlockedVolunteer(matched);
          setErrorMessage(
            'บัญชีของคุณอยู่ระหว่างการตรวจสอบและอนุมัติจากผู้ดูแลระบบ จึงยังไม่สามารถเข้าสู่แดชบอร์ดจิตอาสาได้ในขณะนี้'
          );
          return;
        }

        if (isRejected) {
          healingSound.playClickBeep();
          setBlockedVolunteer(matched);
          setErrorMessage(
            `ใบสมัครจิตอาสาของคุณไม่ผ่านการพิจารณาอนุมัติ (${matched.rejectionReason || 'คลิปเสียงอ่านหรือคุณสมบัติยังไม่ผ่านเกณฑ์การประเมิน'})`
          );
          return;
        }

        // Approved volunteer - grant dashboard access
        healingSound.playChime(720, 0.8);
        setBlockedVolunteer(null);
        setSuccessInfo(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${matched.nickname || matched.fullName} (${matched.email})`);
        setTimeout(() => {
          onLoginSuccess(matched!);
        }, 500);
      } else {
        healingSound.playClickBeep();
        setBlockedVolunteer(null);
        setErrorMessage(
          `ไม่พบบัญชีจิตอาสาที่ใช้อีเมล "${cleanEmail}" ในระบบ กรุณาตรวจสอบอีเมล หรือลงทะเบียนสมัครจิตอาสาใหม่`
        );
      }
    }, 350);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-teal-400 to-indigo-500 shrink-0" />

        {/* PINNED MODAL HEADER (Always Visible at Top with High z-index) */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 relative z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium border border-sky-200/70 mb-0.5">
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>Volunteer Reader Verification</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                เข้าสู่ระบบจิตอาสานักอ่าน
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                โครงการเตียงนี้มีเรื่องเล่า • อีเมลและรหัสผ่าน
              </p>
            </div>
          </div>

          {/* Visible Prominent '✕' Close Button */}
          <button
            id="btn-close-volunteer-login-modal"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              healingSound.playClickBeep();
              onClose();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all shadow-xs cursor-pointer group shrink-0"
            title="ปิดหน้าต่าง (Close)"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.5] text-slate-700 group-hover:text-slate-950 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* INTERNAL SCROLLABLE CONTENT BODY */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 overscroll-contain">
          {/* ⚡ SPECIAL PROMINENT BUTTON: DEMO MODE (For professors / evaluators) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-orange-500/10 border-2 border-amber-400/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>โหมดสาธิตการนำเสนอ (Presentation Fast Track)</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                1-Click Demo
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
              ท่านอาจารย์หรือคณะกรรมการสามารถกดปุ่มนี้เพื่อเข้าสู่พอร์ทัลจิตอาสาได้ทันที พร้อมสิทธิ์อัปโหลดและจัดการคลิปเสียงบำบัด
            </p>

            <button
              id="btn-demo-mode-bypass"
              type="button"
              onClick={handleDemoBypass}
              className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
              <span>⚡ เข้าสู่ระบบทดลองทันที (Demo Mode)</span>
            </button>
          </div>

          {/* Quick Sample Accounts (Email & Password) */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">บัญชีตัวอย่างจิตอาสา (1-Click Autofill):</span>
              <span className="text-[11px] text-sky-600 font-medium">รหัสผ่าน: volunteer123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {SAMPLE_VOLUNTEERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleFillDemo(s.email, s.password)}
                  className="p-2 text-left rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">
                    {s.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {s.email}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-medium text-slate-400 shrink-0 uppercase tracking-wider">
              หรือ เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Regular Login Form: Email & Password */}
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล (Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-volunteer-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="เช่น nim.sukprasert@readheal.org"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  (บัญชีตัวอย่าง: volunteer123)
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-volunteer-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Pending or Rejected Approval Status Banner */}
            {blockedVolunteer && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                blockedVolunteer.approvalStatus === 'pending' || blockedVolunteer.status === 'pending'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {blockedVolunteer.approvalStatus === 'pending' || blockedVolunteer.status === 'pending' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <span>🟡 รอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>🔴 ไม่ผ่านการพิจารณาอนุมัติ</span>
                    </>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed">
                  {blockedVolunteer.approvalStatus === 'pending' || blockedVolunteer.status === 'pending'
                    ? 'ส่งใบสมัครเรียบร้อยแล้ว อยู่ระหว่างการพิจารณาคุณสมบัติและคลิปเสียงอ่านโดยผู้ดูแลระบบ (คาดว่าจะทราบผลภายใน 1-3 วัน) บัญชีของท่านยังไม่สามารถเข้าใช้งานแดชบอร์ดได้'
                    : `เหตุผล: ${blockedVolunteer.rejectionReason || 'คลิปเสียงอ่านหรือคุณสมบัติยังไม่ผ่านเกณฑ์การประเมิน'}`}
                </p>

                {onOpenStatusCheck && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStatusCheck(blockedVolunteer.email);
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      blockedVolunteer.approvalStatus === 'pending' || blockedVolunteer.status === 'pending'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>ตรวจสอบสถานะการอนุมัติ (Check Status)</span>
                  </button>
                )}
              </div>
            )}

            {/* Error Message (if not blocked banner) */}
            {errorMessage && !blockedVolunteer && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successInfo && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successInfo}</span>
              </div>
            )}

            {/* Login / Verify Button */}
            <button
              id="btn-volunteer-verify-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Login)</span>
                </>
              )}
            </button>
          </form>

          {/* Links for Check Status & Volunteer Registration */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            {onOpenStatusCheck && (
              <button
                type="button"
                onClick={() => {
                  healingSound.playClickBeep();
                  onClose();
                  onOpenStatusCheck(email || undefined);
                }}
                className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold hover:underline cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span>ตรวจสอบสถานะการอนุมัติ</span>
              </button>
            )}

            <button
              id="btn-switch-to-volunteer-registration"
              type="button"
              onClick={() => {
                healingSound.playClickBeep();
                onGoToRegistration();
              }}
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer group ml-auto sm:ml-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ลงทะเบียนสมัครจิตอาสาใหม่</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Safe network footer note */}
          <div className="pt-2 border-t border-slate-50 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ระบบรับรองจิตอาสาข้างเตียง เครือข่าย รพ. 14 แห่งในจังหวัดชลบุรี</span>
          </div>
        </div>
      </div>
    </div>
  );
};
