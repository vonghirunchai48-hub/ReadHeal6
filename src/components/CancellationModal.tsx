import React, { useState } from 'react';
import { BookingRequest } from '../types';
import { X, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  onConfirmCancel: (bookingId: string, reason: string) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmCancel,
}) => {
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('ผู้ป่วยติดนัดตรวจ / ทำหัตถการ');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const presetReasons = [
    'ผู้ป่วยติดนัดตรวจ / ทำหัตถการทางการแพทย์',
    'อาการผู้ป่วยทรุดตัว / อ่อนเพลีย ต้องการพักผ่อน',
    'ผู้ป่วยได้รับอนุญาตให้ออกจากโรงพยาบาลแล้ว',
    'จิตอาสาติดภารกิจเร่งด่วน / สุขภาพไม่พร้อม',
    'ต้องการเปลี่ยนวันและเวลาการนัดหมายใหม่',
    'เหตุผลอื่นๆ (โปรดระบุ)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)' && !customReason.trim()) {
      setErrorMessage('กรุณาระบุรายละเอียดเหตุผลการยกเลิกในช่องข้อความ');
      return;
    }

    const finalReason = selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)'
      ? customReason.trim()
      : customReason.trim()
        ? `${selectedPresetReason} (${customReason.trim()})`
        : selectedPresetReason;

    if (!finalReason) {
      setErrorMessage('กรุณาระบุเหตุผลการยกเลิกนัดหมาย');
      return;
    }

    healingSound.playClickBeep();
    setIsSubmitting(true);
    onConfirmCancel(booking.id, finalReason);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">ยกเลิกการนัดหมายข้างเตียง</h3>
              <p className="text-xs text-slate-500">รหัส: {booking.id} • {booking.patientInfo.hospitalName}</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">โปรดระบุเหตุผลการยกเลิก</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                ระบบจะส่งข้อความแจ้งเตือนและอีเมลไปยังทั้งผู้ป่วยและจิตอาสาทันทีเพื่อปรับตารางเวลา
              </p>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">เหตุผลหลักในการยกเลิก</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {presetReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPresetReason === reason
                      ? 'bg-rose-50/70 border-rose-300 font-semibold text-rose-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="presetReason"
                    value={reason}
                    checked={selectedPresetReason === reason}
                    onChange={() => setSelectedPresetReason(reason)}
                    className="text-rose-600 focus:ring-rose-400"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              รายละเอียดเพิ่มเติม {selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              required={selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)'}
              rows={2}
              placeholder="ระบุข้อความอธิบายเพิ่มเติมสำหรับผู้เกี่ยวข้อง..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)' && !customReason.trim())}
              className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                isSubmitting || (selectedPresetReason === 'เหตุผลอื่นๆ (โปรดระบุ)' && !customReason.trim())
                  ? 'bg-rose-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-95'
              }`}
            >
              <span>ยืนยันการยกเลิกนัดหมาย</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
