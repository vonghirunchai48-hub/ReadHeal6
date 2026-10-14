import React, { useState } from 'react';
import { 
  X, 
  Headphones, 
  Zap, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { BookingRequest, PatientAccount } from '../types';

interface PatientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRequest[];
  patientAccounts?: PatientAccount[];
  onLoginSuccess: (booking?: BookingRequest, patientAccount?: PatientAccount) => void;
  onGoToRegistration: () => void;
  resetKey?: number;
}

export const PatientLoginModal: React.FC<PatientLoginModalProps> = ({
  isOpen,
  onClose,
  bookings,
  patientAccounts = [],
  onLoginSuccess,
  onGoToRegistration,
  resetKey,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Security: Clean input fields when resetKey triggers or modal opens/closes
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
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

  // Pre-configured demo patient profiles based on actual mock bookings
  const DEMO_PATIENTS = [
    {
      id: 'demo-p1',
      name: 'คุณลุงวิชัย สุนทรารมย์',
      email: 'wichai.s@gmail.com',
      password: 'password123',
      hospital: 'รพ.มหาวิทยาลัยบูรพา',
      ward: 'หอผู้ป่วยอายุรกรรม ชั้น 6',
      hn: 'HN-67-02481',
    },
    {
      id: 'demo-p2',
      name: 'เด็กหญิงพิชญา (น้องพิม)',
      email: 'pichaya.pim@gmail.com',
      password: 'password123',
      hospital: 'รพ.ชลบุรี',
      ward: 'หอผู้ป่วยเด็ก ชั้น 4',
      hn: 'HN-68-11904',
    },
    {
      id: 'demo-p3',
      name: 'คุณประพันธ์ กิจเจริญ',
      email: 'praphan.k@gmail.com',
      password: 'password123',
      hospital: 'รพ.สมเด็จพระบรมราชเทวี ณ ศรีราชา',
      ward: 'อาคารศรีสวรินทิรานุสรณ์ ชั้น 8',
      hn: 'HN-65-88320',
    },
  ];

  const handleDemoBypass = (demoIndex: number = 0) => {
    healingSound.playChime(640, 0.7);
    const selectedDemo = DEMO_PATIENTS[demoIndex] || DEMO_PATIENTS[0];
    const matchingAcc = patientAccounts.find(
      (a) => a.email.toLowerCase() === selectedDemo.email.toLowerCase()
    );
    const matchingBooking = bookings.find(
      (b) => (b.patientInfo.hnNumber && b.patientInfo.hnNumber === selectedDemo.hn) || 
             b.patientInfo.fullName.includes(selectedDemo.name.slice(0, 5))
    ) || bookings[0];

    const accountToUse: PatientAccount = matchingAcc || {
      id: selectedDemo.id,
      email: selectedDemo.email,
      password: selectedDemo.password,
      fullName: selectedDemo.name,
      hospitalName: selectedDemo.hospital,
      ward: selectedDemo.ward,
      hnNumber: selectedDemo.hn,
      contactPhone: '081-998-3321',
      createdAt: new Date().toISOString(),
    };

    setSuccessInfo(`เข้าสู่ระบบสำเร็จในนาม "${selectedDemo.name}" (${selectedDemo.email})`);
    setTimeout(() => {
      onLoginSuccess(matchingBooking, accountToUse);
    }, 450);
  };

  const handleSelectSample = (sample: typeof DEMO_PATIENTS[0]) => {
    healingSound.playClickBeep();
    setEmail(sample.email);
    setPassword(sample.password);
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('กรุณาระบุอีเมลที่ลงทะเบียน');
      healingSound.playClickBeep();
      return;
    }
    if (!password) {
      setErrorMessage('กรุณาระบุรหัสผ่าน');
      healingSound.playClickBeep();
      return;
    }

    setIsLoading(true);
    healingSound.playClickBeep();

    setTimeout(() => {
      setIsLoading(false);

      // 1. Check in stored patient accounts (from registration or state)
      const matchedAccount = patientAccounts.find(
        (a) => a.email.toLowerCase() === cleanEmail
      );

      if (matchedAccount) {
        if (matchedAccount.password !== password) {
          setErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          healingSound.playClickBeep();
          return;
        }

        const matchingBooking = bookings.find(
          (b) => (matchedAccount.hnNumber && b.patientInfo.hnNumber === matchedAccount.hnNumber) ||
                 b.patientInfo.fullName.includes(matchedAccount.fullName.slice(0, 5))
        ) || bookings[0];

        healingSound.playChime(700, 0.7);
        setSuccessInfo(`ยินดีต้อนรับ ${matchedAccount.fullName} (${matchedAccount.hospitalName})`);
        setTimeout(() => {
          onLoginSuccess(matchingBooking, matchedAccount);
        }, 500);
        return;
      }

      // 2. Also check demo patient accounts
      const matchedDemo = DEMO_PATIENTS.find(
        (d) => d.email.toLowerCase() === cleanEmail
      );
      if (matchedDemo) {
        if (matchedDemo.password !== password) {
          setErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          healingSound.playClickBeep();
          return;
        }

        const matchingBooking = bookings.find(
          (b) => (b.patientInfo.hnNumber === matchedDemo.hn) || 
                 b.patientInfo.fullName.includes(matchedDemo.name.slice(0, 5))
        ) || bookings[0];

        healingSound.playChime(700, 0.7);
        setSuccessInfo(`ยินดีต้อนรับ ${matchedDemo.name} (${matchedDemo.hospital})`);
        setTimeout(() => {
          onLoginSuccess(matchingBooking, {
            id: matchedDemo.id,
            email: matchedDemo.email,
            password: matchedDemo.password,
            fullName: matchedDemo.name,
            hospitalName: matchedDemo.hospital,
            ward: matchedDemo.ward,
            hnNumber: matchedDemo.hn,
            contactPhone: '081-998-3321',
            createdAt: new Date().toISOString(),
          });
        }, 500);
        return;
      }

      // 3. Email not found
      setErrorMessage(`ไม่พบบัญชีผู้ป่วยที่ใช้อีเมล "${cleanEmail}" กรุณาตรวจสอบหรือกดลงทะเบียนผู้ป่วยใหม่`);
      healingSound.playClickBeep();
    }, 450);
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
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 shrink-0" />

        {/* PINNED MODAL HEADER (Always Visible at Top with High z-index) */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 relative z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                เข้าสู่ระบบผู้รับบริการ / ผู้ป่วย
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Patient & Family Care • อีเมลและรหัสผ่าน
              </p>
            </div>
          </div>

          {/* Prominent Visible '✕' Close Button */}
          <button
            id="btn-close-patient-login-modal"
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
          {/* Presentation Demo Fast Track Card */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>⚡ Fast Track เข้าใช้งานด่วน (Demo Mode)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                1-Click
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
              สำหรับการทดสอบและสาธิตระบบ สามารถคลิกเพื่อเข้าสู่ระบบในนามผู้ป่วยตัวอย่างได้ทันที
            </p>
            <button
              id="btn-patient-demo-bypass"
              type="button"
              onClick={() => handleDemoBypass(0)}
              className="w-full py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>เข้าสู่ระบบด่วน: คุณลุงวิชัย (wichai.s@gmail.com)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sample Patient Quick-Fill Tags */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>หรือคลิกเลือกบัญชีตัวอย่างเพื่อกรอกอีเมล & รหัสผ่านอัตโนมัติ:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_PATIENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectSample(p)}
                  className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group bg-slate-50/50"
                >
                  <div className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">pw: 123</span>
                  </div>
                  <div className="text-[11px] text-emerald-700/80 mt-0.5 truncate font-medium">
                    {p.email}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{p.hospital}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form with Email and Password */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมลที่ลงทะเบียน (Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-patient-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="เช่น wichai.s@gmail.com หรือ pichaya.pim@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  (บัญชีตัวอย่าง: password123)
                </span>
              </div>
              <div className="relative">
                <input
                  id="input-patient-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Feedback messages */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successInfo && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successInfo}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-1.5 space-y-2">
              <button
                id="btn-submit-patient-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังตรวจสอบข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบผู้ป่วย (Log In)</span>
                  </>
                )}
              </button>

              <button
                id="btn-modal-goto-booking"
                type="button"
                onClick={onGoToRegistration}
                className="w-full py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>ยังไม่มีบัญชี? ลงทะเบียนผู้ป่วยใหม่ (Register)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
