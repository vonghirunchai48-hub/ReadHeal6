import React, { useState } from 'react';
import { BookingRequest } from '../types';
import { 
  X, 
  Printer, 
  QrCode, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  HeartHandshake, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Phone,
  Bed,
  Check
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface AppointmentSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
}

export const AppointmentSlipModal: React.FC<AppointmentSlipModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    healingSound.playClickBeep();
    try {
      window.print();
    } catch {
      // In case iframe blocks direct print
    }
  };

  const handleCopySlipText = () => {
    healingSound.playClickBeep();
    const text = `[ใบนัดหมายบริการเตียงนี้มีเรื่องเล่า - ReadHeal]
รหัสนัดหมาย: ${booking.id}
ผู้รับบริการ: ${booking.patientInfo.fullName} (HN: ${booking.patientInfo.hnNumber || 'HN-6709-CHON'})
โรงพยาบาล: ${booking.patientInfo.hospitalName}
ตึก/หอผู้ป่วย: ${booking.patientInfo.ward} เตียง: ${booking.patientInfo.bedNumber}
จิตอาสาผู้อ่าน: ${booking.volunteerName}
วันเวลา: วันที่ ${booking.date} เวลา ${booking.timeSlot}
หมวดหมู่เรื่อง: ${booking.categoryName || 'นิทานสร้างกำลังใจและผ่อนคลาย'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrSeed = encodeURIComponent(
    `READHEAL-VERIFIED:${booking.id}:${booking.patientInfo.hnNumber || 'HN'}:${booking.volunteerName}`
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Modal Top Header (Screen View) */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 relative z-20 no-print">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                ใบนัดหมายบริการเตียงนี้มีเรื่องเล่า
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                รหัสอ้างอิง: <span className="font-mono font-semibold text-emerald-700">{booking.id}</span> • พร้อมสั่งพิมพ์
              </p>
            </div>
          </div>

          {/* Close '✕' Button */}
          <button
            id="btn-close-appointment-slip-modal"
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all shadow-xs cursor-pointer group shrink-0"
            title="ปิดหน้าต่าง (Close)"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.5] text-slate-700 group-hover:text-slate-950 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Scrollable Printable Slip Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 overscroll-contain bg-slate-50/50">
          
          {/* THE OFFICIAL APPOINTMENT SLIP CARD (Target for Print) */}
          <div 
            id="printable-appointment-slip"
            className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-md p-5 sm:p-7 relative overflow-hidden"
          >
            {/* Top Decorative Border */}
            <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 absolute top-0 left-0 right-0" />

            {/* Official Hospital Header */}
            <div className="border-b border-slate-200 pb-4 mb-4 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      กระทรวงสาธารณสุข • เครือข่าย รพ. 14 แห่งในจังหวัดชลบุรี
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                      ใบนัดหมายบริการจิตอาสาอ่านข้างเตียง
                    </h2>
                    <p className="text-xs text-slate-500">
                      โครงการ "เตียงนี้มีเรื่องเล่า" (Bedside Story Reading Service Slip)
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    เลขที่ใบนัดหมาย (Slip No.)
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-800">
                    {booking.id}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ออกเอกสาร: {new Date().toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Ribbon Banner */}
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  สถานะ: ยืนยันการนัดหมายเรียบร้อยแล้ว (Confirmed Bedside Reading)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                พร้อมให้บริการ
              </span>
            </div>

            {/* Information Grid: Patient & Volunteer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
              
              {/* Box 1: Patient Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลผู้รับบริการ / ผู้ป่วย (Patient Info)</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">ชื่อ-นามสกุล:</span>
                    <span className="font-bold text-slate-800 text-right">{booking.patientInfo.fullName}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">เลขประจำตัวผู้ป่วย (HN):</span>
                    <span className="font-bold font-mono text-emerald-700 text-right">
                      {booking.patientInfo.hnNumber || 'HN-670921-CHON'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">โรงพยาบาล:</span>
                    <span className="font-semibold text-slate-800 text-right">{booking.patientInfo.hospitalName}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">หอผู้ป่วย / ตึก:</span>
                    <span className="font-semibold text-slate-800 text-right">{booking.patientInfo.ward || 'หอผู้ป่วยทั่วไป'}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">หมายเลขเตียง:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      เตียง {booking.patientInfo.bedNumber || 'เตียง 12'}
                    </span>
                  </div>
                  {booking.patientInfo.contactPhone && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500">เบอร์ติดต่อญาติ:</span>
                      <span className="font-mono text-slate-700">{booking.patientInfo.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Volunteer Reader & Session Details */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 border-b border-sky-200 pb-1.5">
                  <HeartHandshake className="w-4 h-4 text-sky-600" />
                  <span>ข้อมูลจิตอาสา & รายละเอียดการอ่าน</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">จิตอาสาผู้อ่าน:</span>
                    <span className="font-bold text-sky-900 text-right">{booking.volunteerName}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">วันนัดหมาย:</span>
                    <span className="font-bold text-slate-900 text-right flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-600" />
                      <span>{booking.date}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">รอบเวลาอ่าน:</span>
                    <span className="font-bold text-sky-800 text-right flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-600" />
                      <span>{booking.timeSlot}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">รูปแบบการบริการ:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {booking.format === 'bedside_visit' 
                        ? 'อ่านข้างเตียงผู้ป่วย (Bedside)' 
                        : booking.format === 'hospital_tablet' 
                        ? 'ผ่านแท็บเล็ตประจำหอ' 
                        : 'สายโทรศัพท์ตรง'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">หมวดหมู่เรื่อง:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]">
                      {booking.categoryName || 'นิทานและเรื่องเล่าผ่อนคลาย'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions or Symptoms */}
            {booking.patientInfo.symptoms && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-bold text-amber-950">ข้อควรระวัง/อาการของผู้ป่วย: </span>
                <span>{booking.patientInfo.symptoms}</span>
              </div>
            )}

            {/* Official QR Code & Bedside Verification Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>QR Code ยืนยันการอ่านข้างเตียง</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    แสดง QR Code นี้แก่พยาบาลประจำหอหรือจิตอาสาผู้อ่าน เพื่อเช็กอินและลงบันทึกเวลาบำบัด
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Token: {booking.id}-VERIFIED-MOPH
                  </span>
                </div>
              </div>

              {/* Stamp Watermark */}
              <div className="shrink-0 border-2 border-emerald-600/70 rounded-xl px-3 py-1.5 text-center rotate-[-3deg] bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
                  ReadHeal Verified
                </span>
                <span className="text-[9px] text-emerald-700 block">
                  เครือข่ายโรงพยาบาลชลบุรี
                </span>
              </div>
            </div>

            {/* Slip Footer Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
              หากต้องการเลื่อนหรือยกเลิกนัดหมาย กรุณาแจ้งล่วงหน้าอย่างน้อย 2 ชั่วโมงผ่านระบบ ReadHeal หรือแจ้งพยาบาลประจำวอร์ด • ศูนย์ประสานงานจิตอาสา รพ.ชลบุรี โทร. 038-933-900
            </div>
          </div>

          {/* Quick Copy Info Note (Screen view) */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>สามารถคลิกปุ่ม "พิมพ์ใบนัดหมาย" เพื่อสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที</span>
            </div>
            <button
              onClick={handleCopySlipText}
              className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <span>คัดลอกข้อความ</span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions (Screen View) */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2.5 no-print">
          <button
            id="btn-trigger-print-appointment-slip"
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบนัดหมาย (Print / Save PDF)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 sm:py-3 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
