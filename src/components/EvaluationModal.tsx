import React, { useState } from 'react';
import { BookingRequest, ServiceEvaluation } from '../types';
import { X, Star, Heart, CheckCircle2, ShieldCheck, Send } from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  onSubmitEvaluation: (evaluation: Omit<ServiceEvaluation, 'id' | 'createdAt'>) => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSubmitEvaluation,
}) => {
  const [etiquetteRating, setEtiquetteRating] = useState<number>(5);
  const [voiceWarmthRating, setVoiceWarmthRating] = useState<number>(5);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    healingSound.playChime(720, 0.8);

    onSubmitEvaluation({
      bookingId: booking.id,
      volunteerId: booking.volunteerId,
      volunteerName: booking.volunteerName,
      patientNameAnonymous: isAnonymous
        ? `ผู้รับบริการหอ ${booking.patientInfo.ward || 'ทั่วไป'} (${booking.patientInfo.hospitalName})`
        : booking.patientInfo.fullName,
      hospitalName: booking.patientInfo.hospitalName,
      date: booking.date,
      etiquetteRating,
      voiceWarmthRating,
      overallRating,
      comments: comments.trim() || 'บริการดีมาก รู้สึกอบอุ่นใจ ขอบคุณจิตอาสาค่ะ',
      isAnonymous,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setComments('');
      onClose();
    }, 1600);
  };

  const renderStars = (value: number, onChange: (v: number) => void) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            healingSound.playClickBeep();
            onChange(star);
          }}
          className="p-1 hover:scale-110 transition-transform focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 stroke-slate-300'
            }`}
          />
        </button>
      ))}
      <span className="text-xs font-bold text-slate-700 ml-2">{value}/5 ดาว</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">ขอบคุณสำหรับการประเมิน</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              คะแนนและข้อคิดเห็นของคุณมีคุณค่าอย่างยิ่งในการพัฒนามาตรฐานการอ่านข้างเตียง 
              และสร้างกำลังใจให้จิตอาสาต่อไปค่ะ
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  แบบประเมินบริการอ่านข้างเตียง (Anonymous Feedback)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                  ประเมินจิตอาสา: {booking.volunteerName}
                </h3>
                <p className="text-xs text-slate-500">
                  รหัสการนัดหมาย: {booking.id} • {booking.patientInfo.hospitalName}
                </p>
              </div>
            </div>

            {/* Criteria 1: Etiquette & Politeness */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">1. มารยาทและกาลเทศะ</h4>
                  <p className="text-[11px] text-slate-500">
                    ความสุภาพ การเคารพความเป็นส่วนตัวของผู้ป่วย และการแต่งกายเหมาะสม
                  </p>
                </div>
              </div>
              {renderStars(etiquetteRating, setEtiquetteRating)}
            </div>

            {/* Criteria 2: Voice Warmth & Tone */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800">2. น้ำเสียงการอ่านและความอบอุ่น</h4>
                <p className="text-[11px] text-slate-500">
                  จังหวะการอ่าน ระดับเสียงพอดี ไม่รบกวนเตียงข้างเคียง และสร้างความผ่อนคลาย
                </p>
              </div>
              {renderStars(voiceWarmthRating, setVoiceWarmthRating)}
            </div>

            {/* Criteria 3: Overall Satisfaction */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800">3. ความพึงพอใจในภาพรวม</h4>
                <p className="text-[11px] text-slate-500">
                  ช่วยลดความเครียดและความเหงาของผู้ป่วยระหว่างการพักฟื้น
                </p>
              </div>
              {renderStars(overallRating, setOverallRating)}
            </div>

            {/* Free text comments */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                ข้อเสนอแนะหรือคำชมเชยแด่จิตอาสา
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="ร่วมส่งต่อข้อความกำลังใจ หรือข้อเสนอแนะเพื่อให้จิตอาสาพัฒนาต่อไป..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-400"
              />
              <div className="flex items-center gap-1.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">ประเมินแบบไม่เปิดเผยตัวตน (Anonymous Mode)</span>
                <span className="text-[11px] text-emerald-700 hidden sm:inline">- เพื่อความสบายใจของผู้รับบริการ</span>
              </div>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งผลการประเมิน</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
