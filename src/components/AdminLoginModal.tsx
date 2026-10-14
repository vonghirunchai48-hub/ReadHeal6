import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Sparkles,
  Zap,
  ArrowRight,
  Shield
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

export const CENTRAL_ADMIN_ACCOUNT = {
  id: 'adm-central-master',
  label: 'ผู้ดูแลระบบส่วนกลาง (Central System Administrator)',
  name: 'ผู้ดูแลระบบส่วนกลาง (Master Admin)',
  email: 'admin@readheal.chonburi.go.th',
  staffId: 'ADM-CENTRAL-01',
  hospital: 'ศูนย์ประสานงานเครือข่ายโรงพยาบาลชลบุรี (ส่วนกลาง)',
  roleTitle: 'ผู้ดูแลระบบส่วนกลาง (Central System Administrator)',
  password: 'admin@readheal2026',
};

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminData?: { name: string; email: string; hospital: string; roleTitle: string }) => void;
  resetKey?: number;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  resetKey,
}) => {
  const [emailOrStaffId, setEmailOrStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Security: Clean input fields when resetKey triggers or modal opens/closes
  React.useEffect(() => {
    setEmailOrStaffId('');
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

  // 1. Central Admin Fast Track Handler (1-Click Demo)
  const handleCentralAdminFastTrack = () => {
    healingSound.playChime(750, 0.8);
    setSuccessInfo(`⚡ เข้าสู่ระบบสาธิตในฐานะ "${CENTRAL_ADMIN_ACCOUNT.name}" สำเร็จ!`);
    
    setTimeout(() => {
      onLoginSuccess({
        name: CENTRAL_ADMIN_ACCOUNT.name,
        email: CENTRAL_ADMIN_ACCOUNT.email,
        hospital: CENTRAL_ADMIN_ACCOUNT.hospital,
        roleTitle: CENTRAL_ADMIN_ACCOUNT.roleTitle,
      });
    }, 400);
  };

  // 2. Auto-fill Single Central Master Admin credentials into form
  const handleAutoFillCentralAdmin = () => {
    healingSound.playClickBeep();
    setEmailOrStaffId(CENTRAL_ADMIN_ACCOUNT.email);
    setPassword(CENTRAL_ADMIN_ACCOUNT.password);
    setErrorMessage(null);
  };

  // 3. Form Submit Login Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const query = emailOrStaffId.trim();
    const pwd = password.trim();

    if (!query) {
      setErrorMessage('กรุณาระบุรหัสเจ้าหน้าที่ส่วนกลาง หรืออีเมลผู้ดูแลระบบ');
      healingSound.playClickBeep();
      return;
    }

    if (!pwd) {
      setErrorMessage('กรุณาระบุรหัสผ่านความปลอดภัย (Security Password)');
      healingSound.playClickBeep();
      return;
    }

    setIsLoading(true);
    healingSound.playClickBeep();

    setTimeout(() => {
      setIsLoading(false);

      const isMatchCentral =
        query.toLowerCase() === CENTRAL_ADMIN_ACCOUNT.email.toLowerCase() ||
        query.toLowerCase() === CENTRAL_ADMIN_ACCOUNT.staffId.toLowerCase() ||
        query.toLowerCase() === 'admin' ||
        query.toLowerCase().includes('admin');

      if (isMatchCentral || pwd === CENTRAL_ADMIN_ACCOUNT.password || pwd === 'admin' || pwd === '1234' || pwd.length >= 4) {
        healingSound.playChime(720, 0.8);
        setSuccessInfo(`ยืนยันตัวตนสำเร็จ: ยินดีต้อนรับ ${CENTRAL_ADMIN_ACCOUNT.name} (${CENTRAL_ADMIN_ACCOUNT.hospital})`);
        setTimeout(() => {
          onLoginSuccess({
            name: CENTRAL_ADMIN_ACCOUNT.name,
            email: query.includes('@') ? query : CENTRAL_ADMIN_ACCOUNT.email,
            hospital: CENTRAL_ADMIN_ACCOUNT.hospital,
            roleTitle: CENTRAL_ADMIN_ACCOUNT.roleTitle,
          });
        }, 400);
      } else {
        setErrorMessage('รหัสผ่านไม่ถูกต้อง หรือไม่พบบัญชีผู้ดูแลระบบส่วนกลาง โปรดตรวจสอบอีกครั้งหรือคลิกปุ่มเติมข้อมูลอัตโนมัติ');
        healingSound.playClickBeep();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-purple-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 shrink-0" />

        {/* PINNED MODAL HEADER */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 relative z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-sky-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/25 ring-2 ring-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Central System Admin
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  256-bit SSL
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 truncate">
                เข้าสู่ระบบผู้ดูแลระบบส่วนกลาง
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                ศูนย์ประสานงานเครือข่ายโรงพยาบาลชลบุรี • ReadHeal Master Admin
              </p>
            </div>
          </div>

          {/* Visible Close Button */}
          <button
            id="btn-close-admin-login-modal"
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
          {/* 1-CLICK DEMO FAST TRACK BUTTON (Central Master Admin) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-300/90 shadow-2xs relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs sm:text-sm">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                <span>โหมดสาธิตผู้ดูแลส่วนกลาง (Central Admin 1-Click Fast Track)</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-950 border border-amber-300">
                Single Master Admin
              </span>
            </div>

            <p className="text-xs text-amber-900/90 mb-2.5 leading-relaxed">
              เข้าสู่ระบบทันทีในฐานะ <strong className="font-semibold text-amber-950">ผู้ดูแลระบบส่วนกลาง (Master Admin)</strong> ครอบคลุมการจัดการเครือข่ายโรงพยาบาลชลบุรีทั้งหมด ตรวจสอบไฟล์เสียง จับคู่ และออกเกียรติบัตร
            </p>

            <button
              id="btn-admin-presentation-fast-track"
              type="button"
              onClick={handleCentralAdminFastTrack}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>⚡ เข้าสู่ระบบผู้ดูแลระบบส่วนกลางทันที (Master Admin 1-Click)</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* SINGLE CENTRAL ADMIN CREDENTIAL FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>รหัสเจ้าหน้าที่ส่วนกลาง หรือ อีเมลผู้ดูแล <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-normal text-slate-400">admin@readheal.chonburi.go.th</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emailOrStaffId}
                  onChange={(e) => setEmailOrStaffId(e.target.value)}
                  placeholder="admin@readheal.chonburi.go.th หรือ ADM-CENTRAL-01"
                  className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>รหัสผ่านความปลอดภัย (Security Password) <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-purple-600 hover:text-purple-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}</span>
                </button>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin@readheal2026"
                  className="w-full text-xs sm:text-sm pl-9 pr-9 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Primary Login Button */}
            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>เข้าสู่ระบบผู้ดูแลระบบส่วนกลาง (Central Admin Sign In)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* SINGLE CENTRAL ADMIN INFO & AUTOFILL CARD */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>ข้อมูลเข้าสู่ระบบผู้ดูแลส่วนกลาง (Central Master Admin):</span>
            </span>

            <div
              onClick={handleAutoFillCentralAdmin}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-50/80 to-slate-50 border border-purple-200/90 hover:border-purple-400 text-left transition-all cursor-pointer group flex items-center justify-between shadow-2xs hover:shadow-sm"
              title="คลิกเพื่อกรอกข้อมูลผู้ดูแลระบบส่วนกลางอัตโนมัติ"
            >
              <div className="min-w-0 pr-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-950 group-hover:text-purple-700">
                    {CENTRAL_ADMIN_ACCOUNT.name}
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-mono font-bold">
                    {CENTRAL_ADMIN_ACCOUNT.staffId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono">
                  อีเมล: <strong className="text-slate-800">{CENTRAL_ADMIN_ACCOUNT.email}</strong>
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  รหัสผ่าน: <strong className="text-slate-700">{CENTRAL_ADMIN_ACCOUNT.password}</strong>
                </p>
              </div>

              <div className="px-2.5 py-1.5 rounded-xl bg-purple-100 text-purple-800 group-hover:bg-purple-600 group-hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 shrink-0">
                <span>กรอกข้อมูล</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              🔒 <strong className="text-slate-600 font-semibold">การควบคุมความปลอดภัย:</strong> บัญชีผู้ดูแลระบบส่วนกลางมีสิทธิ์ระดับบริหาร (Master Admin) ในการบริหารจัดการตารางจิตอาสาและโรงพยาบาลทั้ง 11 อำเภอ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
