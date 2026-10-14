import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserPlus,
  Building2,
  Phone,
  Calendar,
  Volume2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { VolunteerProfile } from '../types';
import { healingSound } from '../utils/audioSynthesizer';

interface VolunteerStatusCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteers: VolunteerProfile[];
  initialEmail?: string;
  onLoginSuccess: (volunteer: VolunteerProfile) => void;
  onGoToRegister: () => void;
}

export const VolunteerStatusCheckModal: React.FC<VolunteerStatusCheckModalProps> = ({
  isOpen,
  onClose,
  volunteers,
  initialEmail = '',
  onLoginSuccess,
  onGoToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchedVolunteer, setSearchedVolunteer] = useState<VolunteerProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) {
        setEmail(initialEmail);
        setPassword('volunteer123');
      } else {
        setEmail('');
        setPassword('');
      }
      setSearchedVolunteer(null);
      setErrorMessage(null);
      setShowPassword(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleQuickCheck = (targetEmail: string, targetPass: string = 'volunteer123') => {
    healingSound.playClickBeep();
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage(null);
    setIsLoading(true);

    const cleanEmail = targetEmail.trim().toLowerCase();

    // Check dynamic state volunteers
    let matched = volunteers.find(
      (v) =>
        v.email.toLowerCase() === cleanEmail ||
        v.id.toLowerCase() === cleanEmail
    );

    // Fallbacks for test demo accounts
    if (!matched) {
      if (cleanEmail === 'kanda.saensuk@example.com') {
        matched = {
          id: 'vol-pending-1',
          fullName: 'กานดา แสนสุข',
          nickname: 'น้องแอน',
          dob: '2004-05-14',
          age: 22,
          gender: 'female',
          phone: '085-112-9988',
          email: 'kanda.saensuk@example.com',
          password: 'volunteer123',
          hospitalZone: 'รพ.มหาวิทยาลัยบูรพา & รพ.ชลบุรี',
          availableHospitals: ['โรงพยาบาลมหาวิทยาลัยบูรพา', 'โรงพยาบาลชลบุรี'],
          bio: 'นักศึกษาจิตวิทยา ปี 4 ม.บูรพา มีความตั้งใจอยากนำทักษะการฟังและน้ำเสียงที่นุ่มนวลไปช่วยให้กำลังใจผู้ป่วยพักฟื้นข้างเตียงในโรงพยาบาลชลบุรี',
          readingStyle: 'เสียงนุ่มนวล อบอุ่น ฟังสบาย คลายกังวล',
          voiceToneDesc: 'อบอุ่น อ่อนโยน ชวนผ่อนคลายและคลายกังวล',
          voiceSampleDuration: '00:25',
          experienceYears: 1,
          rating: 5.0,
          reviewCount: 0,
          totalReadHours: 0,
          totalStoriesRead: 0,
          badge: 'ผู้สมัครจิตอาสาใหม่ (รออนุมัติ)',
          availableDays: ['เสาร์', 'อาทิตย์'],
          availableTimeSlots: ['14:00 - 15:30 น.', '18:30 - 19:30 น.'],
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          status: 'pending',
          approvalStatus: 'pending',
          registeredAt: '2026-10-13T10:15:00.000Z',
          specialties: ['นิทาน / เรื่องสั้น', 'จิตวิทยา / กำลังใจ'],
        };
      } else if (cleanEmail === 'nim.sukprasert@readheal.org') {
        matched = volunteers[0];
      } else if (cleanEmail === 'theerapat.c@example.com') {
        matched = {
          id: 'vol-rejected-1',
          fullName: 'ธีรภัทร ชาญวิทย์',
          nickname: 'ท็อป',
          dob: '1999-02-18',
          age: 27,
          gender: 'male',
          phone: '087-443-8822',
          email: 'theerapat.c@example.com',
          password: 'volunteer123',
          hospitalZone: 'รพ.แหลมฉบัง & รพ.บางละมุง',
          availableHospitals: ['โรงพยาบาลแหลมฉบัง', 'โรงพยาบาลบางละมุง'],
          bio: 'สนใจอยากร่วมเป็นจิตอาสาอ่านหนังสือให้ผู้ป่วยพักฟื้นฟังยามว่างในวันหยุดเสาร์-อาทิตย์',
          readingStyle: 'สดใส มีชีวิตชีวา',
          voiceToneDesc: 'รวดเร็ว มีพลัง',
          voiceSampleDuration: '00:18',
          experienceYears: 1,
          rating: 4.5,
          reviewCount: 0,
          totalReadHours: 0,
          totalStoriesRead: 0,
          badge: 'จิตอาสา (ไม่ผ่านการอนุมัติ)',
          availableDays: ['เสาร์'],
          availableTimeSlots: ['10:00 - 11:30 น.'],
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
          status: 'rejected',
          approvalStatus: 'rejected',
          rejectionReason: 'คลิปเสียงอ่านตัวอย่างมีเสียงรบกวนรอบข้างและเสียงลมไมโครโฟนแรงมากเกินไป ไม่ได้ยินเสียงอ่านที่ชัดเจนตามมาตรฐานหอผู้ป่วยข้างเตียง ขอความกรุณาบันทึกใหม่อีกครั้งในที่เงียบสงบ',
          registeredAt: '2026-10-10T14:20:00.000Z',
          reviewedAt: '2026-10-11T09:40:00.000Z',
          reviewedBy: 'ผู้ดูแลระบบส่วนกลาง (ชลบุรี)',
          specialties: ['ความรู้ทั่วไป & สุขภาพ'],
        };
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      if (matched) {
        healingSound.playChime(700, 0.75);
        setSearchedVolunteer(matched);
      } else {
        setErrorMessage('ไม่พบข้อมูลบัญชีจิตอาสานี้ในระบบ');
      }
    }, 200);
  };

  const handleCheckStatus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSearchedVolunteer(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('กรุณาระบุอีเมลที่ใช้ลงทะเบียนสมัครจิตอาสา');
      healingSound.playClickBeep();
      return;
    }

    setIsLoading(true);
    healingSound.playClickBeep();

    setTimeout(() => {
      setIsLoading(false);

      // Find volunteer by email, id, or phone
      const matched = volunteers.find(
        (v) =>
          v.email.toLowerCase() === cleanEmail ||
          v.id.toLowerCase() === cleanEmail ||
          v.phone.replace(/[^0-9]/g, '') === cleanEmail.replace(/[^0-9]/g, '')
      );

      if (!matched) {
        setErrorMessage(
          'ไม่พบข้อมูลการสมัครด้วยอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง หรือลงทะเบียนสมัครจิตอาสาใหม่'
        );
        healingSound.playClickBeep();
        return;
      }

      // If user supplied password, verify it (demo fallback password is volunteer123)
      if (cleanPassword) {
        const validPassword = matched.password || 'volunteer123';
        if (cleanPassword !== validPassword) {
          setErrorMessage(
            'รหัสผ่านไม่ตรงกับที่ตั้งไว้ตอนลงทะเบียน กรุณาตรวจสอบอีกครั้ง (รหัสผ่านตัวอย่างคือ volunteer123)'
          );
          healingSound.playClickBeep();
          return;
        }
      }

      healingSound.playChime(680, 0.7);
      setSearchedVolunteer(matched);
    }, 250);
  };

  const getStatusBadge = (volunteer: VolunteerProfile) => {
    const isPending = volunteer.approvalStatus === 'pending' || volunteer.status === 'pending';
    const isRejected = volunteer.approvalStatus === 'rejected' || volunteer.status === 'rejected';

    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          รอการตรวจสอบและอนุมัติ (Pending)
        </span>
      );
    }

    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          ไม่ผ่านการพิจารณา (Rejected)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        อนุมัติเรียบร้อยแล้ว (Approved)
      </span>
    );
  };

  const isPending = searchedVolunteer && (searchedVolunteer.approvalStatus === 'pending' || searchedVolunteer.status === 'pending');
  const isRejected = searchedVolunteer && (searchedVolunteer.approvalStatus === 'rejected' || searchedVolunteer.status === 'rejected');
  const isApproved = searchedVolunteer && !isPending && !isRejected;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-check-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 p-6 text-white">
          <button
            onClick={() => {
              healingSound.playClickBeep();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Search className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <h2 id="status-check-title" className="text-xl font-bold tracking-tight">
                ตรวจสอบสถานะการสมัครจิตอาสา
              </h2>
              <p className="text-teal-100 text-xs mt-0.5">
                ติดตามผลการพิจารณาคุณสมบัติและคลิปเสียงอ่านโดยผู้ดูแลระบบ
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Demo Fill & Check Buttons (Interactive Presentation Shortcuts) */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
                <span>บัญชีตัวอย่างสำหรับพรีเซนต์ (1-Click Fast Check):</span>
              </div>
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                ⚡ คลิกเดียวดูผลทันที
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Preset 1: Pending */}
              <button
                type="button"
                onClick={() => handleQuickCheck('kanda.saensuk@example.com')}
                className={`group relative flex flex-col items-start p-3 rounded-2xl text-left cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${
                  searchedVolunteer?.email.toLowerCase() === 'kanda.saensuk@example.com'
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/40 ring-offset-1'
                    : 'bg-gradient-to-br from-amber-50 via-amber-50/70 to-amber-100/40 hover:bg-amber-100/80 border border-amber-300/90 hover:border-amber-500 shadow-sm hover:shadow-md hover:shadow-amber-500/10'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:animate-pulse" />
                    <span>🟡 รออนุมัติ (Pending)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-1.5 py-0.2 rounded group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    คลิกตรวจ
                  </span>
                </div>
                <span className="text-slate-800 font-semibold text-xs truncate w-full">น้องแอน (กานดา)</span>
                <span className="text-slate-500 text-[11px] truncate w-full">kanda.saensuk@...</span>
              </button>

              {/* Preset 2: Approved */}
              <button
                type="button"
                onClick={() => handleQuickCheck('nim.sukprasert@readheal.org')}
                className={`group relative flex flex-col items-start p-3 rounded-2xl text-left cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${
                  searchedVolunteer?.email.toLowerCase() === 'nim.sukprasert@readheal.org'
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/40 ring-offset-1'
                    : 'bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-emerald-100/40 hover:bg-emerald-100/80 border border-emerald-300/90 hover:border-emerald-500 shadow-sm hover:shadow-md hover:shadow-emerald-500/10'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🟢 อนุมัติแล้ว (Approved)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-semibold px-1.5 py-0.2 rounded group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    คลิกตรวจ
                  </span>
                </div>
                <span className="text-slate-800 font-semibold text-xs truncate w-full">ครูนิ่ม (พิมลวรรณ)</span>
                <span className="text-slate-500 text-[11px] truncate w-full">nim.sukprasert@...</span>
              </button>

              {/* Preset 3: Rejected */}
              <button
                type="button"
                onClick={() => handleQuickCheck('theerapat.c@example.com')}
                className={`group relative flex flex-col items-start p-3 rounded-2xl text-left cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${
                  searchedVolunteer?.email.toLowerCase() === 'theerapat.c@example.com'
                    ? 'bg-rose-100 border-2 border-rose-500 shadow-md ring-2 ring-rose-400/40 ring-offset-1'
                    : 'bg-gradient-to-br from-rose-50 via-rose-50/70 to-rose-100/40 hover:bg-rose-100/80 border border-rose-300/90 hover:border-rose-500 shadow-sm hover:shadow-md hover:shadow-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>🔴 ไม่ผ่านอนุมัติ</span>
                  </span>
                  <span className="text-[10px] bg-rose-200/80 text-rose-900 font-semibold px-1.5 py-0.2 rounded group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    คลิกตรวจ
                  </span>
                </div>
                <span className="text-slate-800 font-semibold text-xs truncate w-full">ท็อป (ธีรภัทร)</span>
                <span className="text-slate-500 text-[11px] truncate w-full">theerapat.c@...</span>
              </button>
            </div>
          </div>

          {/* Search Form */}
          {!searchedVolunteer ? (
            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อีเมลที่ใช้สมัคร (Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>รหัสผ่านยืนยันตัวตน (Password)</span>
                  <span className="text-slate-400 font-normal text-[11px]">ค่าเริ่มต้น: volunteer123</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านที่ตั้งไว้ตอนลงทะเบียน"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังตรวจสอบข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>ตรวจสอบสถานะใบสมัคร</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    healingSound.playClickBeep();
                    onGoToRegister();
                  }}
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ยังไม่ได้ลงทะเบียน? สมัครเป็นจิตอาสาอ่านหนังสือที่นี่</span>
                </button>
              </div>
            </form>
          ) : (
            /* Result Display */
            <div className="space-y-5 animate-fade-in">
              {/* Status Banner */}
              {isPending && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <Clock className="w-5 h-5 text-amber-600 animate-spin-slow" />
                    <span>อยู่ระหว่างการพิจารณาคุณสมบัติและคลิปเสียงอ่านโดยผู้ดูแลระบบ</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ใบสมัครของท่านถูกบันทึกเข้าระบบเรียบร้อยแล้ว ขณะนี้ทีมผู้ดูแลระบบโรงพยาบาลกำลังทดสอบฟังคลิปเสียงอ่านตัวอย่าง
                    และตรวจสอบคุณสมบัติเบื้องต้น โดยปกติใช้เวลา 1-3 วันทำการ
                  </p>
                </div>
              )}

              {isApproved && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>ยินดีด้วย! บัญชีจิตอาสาของคุณได้รับการอนุมัติเรียบร้อยแล้ว</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    คุณสมบัติและคลิปเสียงอ่านของคุณผ่านเกณฑ์มาตรฐานการบำบัดข้างเตียง
                    คุณสามารถเข้าสู่ระบบและเริ่มเปิดรับคิวอ่านหนังสือให้ผู้ป่วยพักฟื้นได้ทันที
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>ผลการพิจารณา: ใบสมัครไม่ผ่านเกณฑ์การประเมิน</span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-800">
                    <span className="font-semibold block mb-1">เหตุผลจากผู้ดูแลระบบ:</span>
                    <p className="italic">
                      "{searchedVolunteer.rejectionReason || 'คลิปเสียงอ่านหรือคุณสมบัติยังไม่ผ่านเกณฑ์การประเมินเบื้องต้นของโรงพยาบาล'}"
                    </p>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    ท่านสามารถฝึกฝน ปรับปรุงสภาพแวดล้อมการบันทึกเสียงให้เงียบสงบ และส่งคลิปเสียงสมัครใหม่อีกครั้งได้
                  </p>
                </div>
              )}

              {/* Volunteer Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={searchedVolunteer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={searchedVolunteer.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {searchedVolunteer.fullName} ({searchedVolunteer.nickname || 'จิตอาสา'})
                      </h4>
                      <p className="text-xs text-slate-500">{searchedVolunteer.email}</p>
                    </div>
                  </div>
                  <div>{getStatusBadge(searchedVolunteer)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{searchedVolunteer.hospitalZone || 'โรงพยาบาลเครือข่าย'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{searchedVolunteer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>คลิปเสียงตัวอย่าง: {searchedVolunteer.voiceSampleDuration || '00:25 นาที'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      วันที่สมัคร:{' '}
                      {searchedVolunteer.registeredAt
                        ? new Date(searchedVolunteer.registeredAt).toLocaleDateString('th-TH')
                        : 'ล่าสุด'}
                    </span>
                  </div>
                </div>

                {searchedVolunteer.reviewedAt && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">ประวัติการตรวจสอบ:</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(searchedVolunteer.reviewedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    {searchedVolunteer.reviewedBy && (
                      <p className="text-[11px] text-slate-500">
                        ผู้ตรวจสอบ: {searchedVolunteer.reviewedBy}
                      </p>
                    )}
                    {searchedVolunteer.adminNotes && (
                      <p className="text-xs text-slate-700 italic">
                        บันทึกเพิ่มเติม: "{searchedVolunteer.adminNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div className="space-y-2 pt-2">
                {isApproved && (
                  <button
                    type="button"
                    onClick={() => {
                      healingSound.playChime(720, 0.8);
                      onLoginSuccess(searchedVolunteer);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>เข้าสู่แดชบอร์ดจิตอาสาทันที (Go to Dashboard)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {isRejected && (
                  <button
                    type="button"
                    onClick={() => {
                      healingSound.playClickBeep();
                      onGoToRegister();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ลงทะเบียนสมัครใหม่อีกครั้ง (Re-register)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      healingSound.playClickBeep();
                      setSearchedVolunteer(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ตรวจสอบบัญชีอื่น</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      healingSound.playClickBeep();
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
