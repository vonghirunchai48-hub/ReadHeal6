import React, { useState } from 'react';
import { BookingRequest, PatientAccount } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Phone, 
  QrCode, 
  ArrowRight, 
  Plus, 
  ArrowLeft,
  XCircle,
  Star,
  Layers,
  HeartHandshake,
  Printer,
  ShieldCheck,
  Lock,
  LogIn,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { CancellationModal } from './CancellationModal';
import { EvaluationModal } from './EvaluationModal';
import { AppointmentSlipModal } from './AppointmentSlipModal';
import { healingSound } from '../utils/audioSynthesizer';

interface MyBookingsViewProps {
  bookings: BookingRequest[];
  currentPatient?: PatientAccount | null;
  onNavigateToBooking: () => void;
  onCancelBooking: (id: string, reason: string) => void;
  onResetToLanding?: () => void;
  onSubmitEvaluation?: (evalData: any) => void;
  onOpenPatientLogin?: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  currentPatient,
  onNavigateToBooking,
  onCancelBooking,
  onResetToLanding,
  onSubmitEvaluation,
  onOpenPatientLogin,
}) => {
  const [cancellingBooking, setCancellingBooking] = useState<BookingRequest | null>(null);
  const [evaluatingBooking, setEvaluatingBooking] = useState<BookingRequest | null>(null);
  const [printingBooking, setPrintingBooking] = useState<BookingRequest | null>(null);

  // STRICT PRIVACY & DATA ISOLATION FILTERING:
  // Show ONLY appointments that belong strictly to the logged-in patient.
  // Hide all other patients' private medical and booking records.
  const displayedBookings = bookings.filter((b) => {
    if (!currentPatient) return false;
    const cleanEmail = currentPatient.email?.trim().toLowerCase();
    const cleanHn = currentPatient.hnNumber?.trim().toLowerCase();
    const cleanName = currentPatient.fullName?.trim().toLowerCase();
    const cleanPhone = currentPatient.contactPhone?.replace(/\D/g, '');

    // 1. Match Email
    if (cleanEmail && b.patientInfo.email && b.patientInfo.email.trim().toLowerCase() === cleanEmail) {
      return true;
    }
    // 2. Match HN Number
    if (cleanHn && b.patientInfo.hnNumber && b.patientInfo.hnNumber.trim().toLowerCase() === cleanHn) {
      return true;
    }
    // 3. Match Full Name exact or core name
    if (cleanName && b.patientInfo.fullName) {
      const bName = b.patientInfo.fullName.trim().toLowerCase();
      if (bName === cleanName) return true;
      const cCore = cleanName.replace(/^(คุณ|นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|คุณลุง|คุณป้า|คุณตา|คุณยาย|น้อง)/g, '').trim();
      const bCore = bName.replace(/^(คุณ|นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|คุณลุง|คุณป้า|คุณตา|คุณยาย|น้อง)/g, '').trim();
      if (cCore.length >= 3 && (bName.includes(cCore) || cleanName.includes(bCore))) {
        return true;
      }
    }
    // 4. Match Contact Phone
    if (cleanPhone && b.patientInfo.contactPhone) {
      const bPhone = b.patientInfo.contactPhone.replace(/\D/g, '');
      if (bPhone.length >= 9 && bPhone === cleanPhone) {
        return true;
      }
    }
    return false;
  });

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Header Back Button / Return to Role Selection Gateway */}
      {onResetToLanding && (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onResetToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-all shadow-2xs group cursor-pointer"
            title="กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)</span>
          </button>
        </div>
      )}

      {/* CASE 1: Patient is NOT authenticated / guest */}
      {!currentPatient ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 mb-3 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            มาตรการรักษาความปลอดภัยข้อมูลผู้ป่วย (Medical Privacy Isolation)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
            กรุณาเข้าสู่ระบบบัญชีผู้ป่วยเพื่อดูรายการนัดหมาย
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-6">
            เพื่อคุ้มครองข้อมูลสุขภาพและความเป็นส่วนตัวของผู้รับบริการทุกท่านตามมาตรฐาน PDPA ระบบได้ทำการซ่อนรายการนัดหมายทั้งหมด 
            กรุณาเข้าสู่ระบบด้วยบัญชีผู้ป่วยของคุณเพื่อตรวจสอบเฉพาะรายการนัดหมายที่ตรงกับตัวตนของคุณ
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenPatientLogin && (
              <button
                type="button"
                onClick={onOpenPatientLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบผู้รับบริการ / ผู้ป่วย (Patient Login)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToBooking}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all cursor-pointer"
            >
              จองคิวอ่านหนังสือข้างเตียงใหม่
            </button>
          </div>
        </div>
      ) : (
        /* CASE 2: Patient IS authenticated - Strictly isolated view */
        <>
          {/* Patient Security & Data Isolation Notice Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-800">
                    {currentPatient.fullName}
                  </span>
                  {currentPatient.hnNumber && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      HN: {currentPatient.hnNumber}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-800 font-medium bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    {currentPatient.hospitalName}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  อีเมล: <span className="font-mono text-slate-700 font-medium">{currentPatient.email}</span>
                  {currentPatient.ward ? ` • ${currentPatient.ward}` : ''}
                  {currentPatient.bedNumber ? ` (เตียง ${currentPatient.bedNumber})` : ''}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 border border-emerald-200 text-[11px] font-semibold text-emerald-800 shrink-0 self-start sm:self-auto shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลได้รับการแยกส่วนเฉพาะบุคคล (Data Isolated)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ระบบติดตามสถานะนัดหมายข้างเตียงส่วนบุคคล
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
                รายการนัดหมายของคุณ ({displayedBookings.length})
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                แสดงเฉพาะข้อมูลนัดหมายของคุณ เพื่อความปลอดภัยและเป็นส่วนตัวสูงสุด
              </p>
            </div>

            <button
              onClick={onNavigateToBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>จองคิวใหม่อีกช่วง</span>
            </button>
          </div>

          {displayedBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">ยังไม่มีรายการนัดหมายสำหรับบัญชีของคุณ</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                ยินดีต้อนรับ {currentPatient.fullName} คุณสามารถเลือกจิตอาสาและจองคิวอ่านหนังสือข้างเตียงเพื่อรับฟังเรื่องเล่าอบอุ่นได้ทันที
              </p>
              <button
                onClick={onNavigateToBooking}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm"
              >
                จองคิวอ่านหนังสือข้างเตียง
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`bg-white rounded-3xl p-6 border transition-all flex flex-col md:flex-row md:items-start justify-between gap-6 ${
                    booking.status === 'cancelled'
                      ? 'border-rose-200 bg-rose-50/20'
                      : booking.status === 'confirmed'
                        ? 'border-emerald-200/80 shadow-xs hover:shadow-md'
                        : 'border-slate-200/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                        {booking.id}
                      </span>

                      {booking.status === 'confirmed' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>🟢 ยืนยันแล้ว จิตอาสาตอบรับ</span>
                        </span>
                      )}
                      {booking.status === 'pending' && (
                        <span 
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300"
                          title="รอผู้ดูแลระบบตรวจสอบและยืนยันนัดหมาย"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>🟡 รออนุมัติจากผู้ดูแลระบบ</span>
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          เสร็จสิ้นเรียบร้อย
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          ยกเลิกแล้ว
                        </span>
                      )}

                      {booking.isEvaluated && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          <Star className="w-3 h-3 fill-purple-400 text-purple-400" />
                          ประเมินแล้ว
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        เรื่อง: {booking.storyTitle || booking.customTopic || 'เรื่องเล่าสร้างกำลังใจ'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ผู้รับบริการ: <strong className="text-slate-700">{booking.patientInfo.fullName}</strong>
                        {booking.patientInfo.hnNumber && (
                          <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                            {booking.patientInfo.hnNumber}
                          </span>
                        )}
                        {' '}({booking.patientInfo.hospitalName} • {booking.patientInfo.ward} • {booking.patientInfo.bedNumber})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>{booking.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-teal-500" />
                        <span>หมวด: {booking.categoryName}</span>
                      </div>
                    </div>

                    {/* Multi-slot items if booked with multiple sessions */}
                    {booking.slots && booking.slots.length > 0 && (
                      <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1.5 mt-2">
                        <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          <span>ช่วงเวลาทั้งหมดในการจองล่วงหน้านี้ ({booking.slots.length} รอบ):</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {booking.slots.map((s, idx) => (
                            <div key={s.id || idx} className="p-2 bg-white rounded-xl border border-sky-200/70 text-slate-700">
                              <span className="font-semibold text-sky-700">รอบที่ {idx + 1}: </span>
                              <span>{s.date} ({s.timeSlot})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancellation Details if cancelled */}
                    {booking.status === 'cancelled' && booking.cancellationReason && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 mt-2">
                        <span className="font-bold">เหตุผลการยกเลิก: </span>
                        <span>{booking.cancellationReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Reader avatar & Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={booking.volunteerAvatar || undefined}
                        alt={booking.volunteerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="text-left md:text-right">
                        <p className="text-xs font-bold text-slate-800">
                          {booking.volunteerName}
                        </p>
                        <p className="text-[11px] text-sky-600">จิตอาสาผู้อ่าน</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Print Appointment Slip Button (Enabled strictly only after confirmed by Admin) */}
                      {booking.status === 'confirmed' ? (
                        <button
                          type="button"
                          onClick={() => setPrintingBooking(booking)}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="พิมพ์ใบนัดหมายบริการเตียงนี้มีเรื่องเล่า"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>พิมพ์ใบนัดหมาย</span>
                        </button>
                      ) : booking.status === 'pending' ? (
                        <span
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs font-medium flex items-center gap-1 cursor-not-allowed select-none"
                          title="ปุ่มพิมพ์ใบนัดหมายจะเปิดให้ใช้งานทันทีหลังจากผู้ดูแลระบบอนุมัติและยืนยันการนัดหมายแล้ว"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-300" />
                          <span>พิมพ์ใบนัดหมาย (รออนุมัติ)</span>
                        </span>
                      ) : null}

                      {/* Direct Evaluation Button */}
                      {booking.status !== 'cancelled' && onSubmitEvaluation && (
                        <button
                          onClick={() => setEvaluatingBooking(booking)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            booking.isEvaluated
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>{booking.isEvaluated ? 'แก้ไขการประเมิน' : 'ประเมินความพึงพอใจ'}</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => setCancellingBooking(booking)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
                        >
                          ยกเลิกนัดหมาย
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <CancellationModal
          isOpen={true}
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirmCancel={(id, reason) => {
            onCancelBooking(id, reason);
            setCancellingBooking(null);
          }}
        />
      )}

      {/* Evaluation Modal */}
      {evaluatingBooking && onSubmitEvaluation && (
        <EvaluationModal
          isOpen={true}
          booking={evaluatingBooking}
          onClose={() => setEvaluatingBooking(null)}
          onSubmitEvaluation={(evalData) => {
            onSubmitEvaluation(evalData);
            setEvaluatingBooking(null);
          }}
        />
      )}

      {/* Printable Appointment Slip Modal */}
      {printingBooking && (
        <AppointmentSlipModal
          isOpen={true}
          booking={printingBooking}
          onClose={() => setPrintingBooking(null)}
        />
      )}
    </div>
  );
};
