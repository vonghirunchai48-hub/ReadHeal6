import React from 'react';
import { UserRole } from '../types';
import { 
  X, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Check, 
  Sparkles,
  BookHeart
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onResetToLanding?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenVolunteerStatusCheck?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  onResetToLanding,
  onOpenAdminLogin,
  onOpenVolunteerStatusCheck,
}) => {
  // Accessibility: Close modal on Escape key press
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

  const roles = [
    {
      id: 'patient' as UserRole,
      title: 'ผู้รับบริการ / ผู้ป่วย (Patient)',
      desc: 'ฟังเรื่องเล่าข้างเตียง จองจิตอาสามาอ่านให้ฟัง เลือกหมวดหมู่ที่ต้องการผ่อนคลาย',
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200',
      activeColor: 'border-emerald-500 bg-emerald-50/70',
    },
    {
      id: 'volunteer' as UserRole,
      title: 'อาสาสมัคร / จิตอาสา (Volunteer Reader)',
      desc: 'ลงทะเบียนผู้อ่าน บันทึกเสียงตัวอย่าง รับคำขอนัดหมาย และสะสมชั่วโมงจิตอาสา',
      icon: <UserCheck className="w-6 h-6 text-sky-600" />,
      bg: 'bg-sky-50 border-sky-200',
      activeColor: 'border-sky-500 bg-sky-50/70',
    },
    {
      id: 'admin' as UserRole,
      title: 'ผู้ดูแลระบบ (Administrator)',
      desc: 'จัดการตารางนัดหมาย อนุมัติจิตอาสา และตรวจสอบภาพรวมการให้บริการของโรงพยาบาล',
      icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200',
      activeColor: 'border-purple-500 bg-purple-50/70',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative border border-slate-100">
        {/* Visible Prominent '✕' Close Button */}
        <button
          id="btn-close-role-selection-modal"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            healingSound.playClickBeep();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/90 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs cursor-pointer group"
          title="ปิดหน้าต่าง (Close)"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5 stroke-[2.5] text-slate-700 group-hover:text-slate-950 group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <BookHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              สลับบทบาทการใช้งาน (Switch Role)
            </h3>
            <p className="text-xs text-slate-500">
              เลือกบทบาทเพื่อสัมผัสประสบการณ์ในแต่ละมุมมอง
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {roles.map((r) => {
            const isSelected = currentRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => {
                  healingSound.playClickBeep();
                  if (r.id === 'admin' && onOpenAdminLogin) {
                    onClose();
                    onOpenAdminLogin();
                  } else {
                    onSelectRole(r.id);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected ? `${r.activeColor} ring-2 ring-sky-300 shadow-xs` : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{r.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {onOpenVolunteerStatusCheck && (
          <button
            onClick={() => {
              healingSound.playClickBeep();
              onClose();
              onOpenVolunteerStatusCheck();
            }}
            className="w-full mb-2.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🟡 ตรวจสอบสถานะการอนุมัติจิตอาสา (Check Status)</span>
          </button>
        )}

        {onResetToLanding && currentRole !== null && (
          <button
            onClick={() => {
              healingSound.playClickBeep();
              onResetToLanding();
              onClose();
            }}
            className="w-full mb-2.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>← กลับสู่หน้าหลักเลือกบทบาท (Role Selection Gateway)</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
};
