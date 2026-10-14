import React from 'react';
import { CertificateRequest, VolunteerProfile } from '../types';
import { X, Award, CheckCircle2, Download, Printer, ShieldCheck, QrCode } from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface DigitalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateRequest | null;
  volunteer?: VolunteerProfile | null;
}

export const DigitalCertificateModal: React.FC<DigitalCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  volunteer,
}) => {
  if (!isOpen || !certificate) return null;

  const certId = certificate.certificateId || `RH-CERT-2026-${certificate.id.replace(/\D/g, '') || '001'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Printable Canvas */}
        <div id="printable-certificate" className="border-8 border-double border-amber-300/80 rounded-2xl p-6 sm:p-10 bg-gradient-to-b from-amber-50/40 via-white to-sky-50/40 text-center relative overflow-hidden shadow-inner">
          {/* Watermark seal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-200/10 rounded-full pointer-events-none blur-xl" />

          {/* Top Seal Badge */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 ring-4 ring-amber-100">
              <Award className="w-9 h-9" />
            </div>
          </div>

          <p className="text-[11px] font-bold tracking-widest text-sky-800 uppercase mb-1">
            โครงการจิตอาสาอ่านหนังสือข้างเตียงเพื่อผู้ป่วย (ReadHeal)
          </p>
          <p className="text-xs text-slate-500 mb-6">
            เครือข่ายโรงพยาบาลกระทรวงสาธารณสุข จังหวัดชลบุรี 14 แห่ง
          </p>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-serif mb-2">
            เกียรติบัตรรับรองจิตอาสา
          </h2>
          <p className="text-xs text-slate-500 font-serif italic mb-6">
            Certificate of Volunteer Excellence & Dedication
          </p>

          <p className="text-xs sm:text-sm text-slate-600 mb-2">
            ขอรับรองว่าเกียรติบัตรฉบับนี้มอบให้แก่
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-sky-900 border-b-2 border-amber-300 pb-2 inline-block px-8 mb-2">
            {certificate.fullNameThai || certificate.volunteerName}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 italic mb-6">
            {certificate.fullNameEn || 'Volunteer Reader'}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-6">
            ได้ร่วมอุทิศตนสร้างคุณประโยชน์ ส่งมอบกำลังใจ และเยียวยาจิตใจผู้ป่วยในโรงพยาบาล 
            ผ่านการบันทึกเสียงอ่านบำบัดใจจำนวน <span className="font-bold text-slate-800">{certificate.onlineAudioCount || 5} ผลงาน</span> 
            และการอ่านหนังสือข้างเตียงตัวต่อตัวจำนวน <span className="font-bold text-slate-800">{certificate.onsiteSessionCount || 3} ครั้ง</span> 
            ครบถ้วนตามเกณฑ์มาตรฐานของโครงการ
          </p>

          {/* Verification Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-amber-200/80 text-left text-xs text-slate-600">
            <div>
              <p className="text-[10px] text-slate-400">รหัสตรวจสอบเกียรติบัตร</p>
              <p className="font-mono font-bold text-sky-800">{certId}</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่อนุมัติ: {certificate.reviewedAt || '2026-09-20'}</p>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400">ผู้รับรองมาตรฐาน</p>
              <p className="font-bold text-slate-800">พญ. วรรณภา สุขเจริญ</p>
              <p className="text-[10px] text-slate-500">ประธานเครือข่ายจิตอาสา รพ.ชลบุรี</p>
            </div>

            <div className="flex sm:justify-end items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <QrCode className="w-8 h-8 text-slate-700" />
              </div>
              <div className="text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                <span>ยืนยันดิจิทัลแท้</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            สถานะ: <span className="font-bold text-emerald-600">อนุมัติแล้ว พร้อมใช้งาน</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                healingSound.playClickBeep();
                window.print();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={() => {
                healingSound.playChime(640, 0.6);
                alert(`ดาวน์โหลดเกียรติบัตรไฟล์ PDF (${certId}.pdf) เรียบร้อยแล้ว`);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
