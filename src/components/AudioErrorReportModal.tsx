import React, { useState } from 'react';
import { AudioErrorReport, Story, AudioSubmission } from '../types';
import { X, AlertCircle, VolumeX, Send, CheckCircle2 } from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface AudioErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: Story | AudioSubmission | null;
  onSubmitReport: (report: Omit<AudioErrorReport, 'id' | 'reportedAt' | 'status'>) => void;
}

export const AudioErrorReportModal: React.FC<AudioErrorReportModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  onSubmitReport,
}) => {
  const [issueType, setIssueType] = useState<AudioErrorReport['issueType']>('distorted_sound');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !targetItem) return null;

  const issueTypes: { id: AudioErrorReport['issueType']; label: string; desc: string }[] = [
    { id: 'distorted_sound', label: 'เสียงแตก / มีเสียงรบกวน', desc: 'มีเสียงซ่า เสียงพัดลม หรือเสียงลมกระแทกไมโครโฟน' },
    { id: 'too_quiet', label: 'ระดับเสียงเบาเกินไป', desc: 'เร่งระดับเสียงสูงสุดแล้วยังแทบไม่ได้ยิน' },
    { id: 'wrong_title', label: 'เนื้อหาไม่ตรงกับชื่อเรื่อง', desc: 'ไฟล์เสียงกับหัวข้อเรื่องไม่สอดคล้องกัน' },
    { id: 'missing_audio', label: 'ไฟล์เสียงเปิดไม่ได้ / ขาดหาย', desc: 'กดเล่นแล้วเงียบ หรือหยุดเล่นกะทันหัน' },
    { id: 'other', label: 'ปัญหาอื่นๆ', desc: 'ข้อเสนอแนะหรือปัญหาด้านอื่นๆ' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reporterName.trim()) return;

    healingSound.playChime(640, 0.6);
    const selectedTypeObj = issueTypes.find((t) => t.id === issueType);

    onSubmitReport({
      storyId: 'categoryId' in targetItem ? targetItem.id : undefined,
      storyTitle: targetItem.title,
      submissionId: 'targetConditions' in targetItem ? targetItem.id : undefined,
      reporterName: reporterName.trim(),
      reporterContact: reporterContact.trim() || 'ไม่ระบุ',
      issueType,
      issueTypeLabel: selectedTypeObj?.label || 'ปัญหาไฟล์เสียง',
      description: description.trim(),
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      onClose();
    }, 1600);
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

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ส่งรายงานปัญหาเรียบร้อยแล้ว</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              ขอบคุณที่ช่วยแจ้งข้อผิดพลาด ทีมพยาบาลและแอดมินโครงการจะตรวจสอบและดำเนินการแก้ไขโดยเร็วที่สุดค่ะ
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <VolumeX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">แจ้งปัญหาไฟล์เสียง</h3>
                <p className="text-xs text-slate-500 truncate max-w-[240px]">
                  เรื่อง: {targetItem.title}
                </p>
              </div>
            </div>

            {/* Issue Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">ลักษณะปัญหาที่พบ</label>
              <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                {issueTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      issueType === type.id
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="issueType"
                      value={type.id}
                      checked={issueType === type.id}
                      onChange={() => setIssueType(type.id)}
                      className="mt-0.5 text-amber-600 focus:ring-amber-400"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{type.label}</p>
                      <p className="text-[11px] text-slate-500">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                รายละเอียดเพิ่มเติม <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                placeholder="เช่น เสียงเริ่มสะดุดตอนนาทีที่ 01:40 หรือเสียงพัดลมรบกวนมาก..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
              />
            </div>

            {/* Reporter details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  ชื่อผู้แจ้ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                  placeholder="เช่น ญาติเตียง 5B"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">เบอร์โทร / อีเมล</label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="สำหรับรับแจ้งผลแก้ไข"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

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
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งรายงานปัญหา</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
