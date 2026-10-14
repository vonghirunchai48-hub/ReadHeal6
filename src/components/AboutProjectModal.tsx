import React from 'react';
import { 
  X, 
  BookHeart, 
  Heart, 
  Sparkles, 
  Hospital, 
  ShieldCheck, 
  Clock, 
  Award,
  Users
} from 'lucide-react';

interface AboutProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutProjectModal: React.FC<AboutProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <BookHeart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">เกี่ยวกับ ReadHeal (เตียงนี้มีเรื่องเล่า)</h2>
              <p className="text-xs text-sky-100">
                Hospital Patient Reading Support Platform
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ที่มาและความตั้งใจของโครงการ</span>
            </h3>
            <p className="text-slate-600">
              การพักรักษาตัวในโรงพยาบาลเป็นช่วงเวลาที่ร่างกายต้องการการซ่อมแซม 
              และจิตใจต้องการการโอบกอดมากที่สุด <strong>"ReadHeal"</strong> จึงถือกำเนิดขึ้นจากแนวคิด 
              <strong>Bibliotherapy (วรรณกรรมบำบัด)</strong> ผสานกับพลังจิตอาสา 
              เพื่อนำเสียงอ่านที่สงบ นุ่มนวล และสร้างพลังบวกไปสู่ข้างเตียงผู้ป่วย
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-center">
              <Heart className="w-6 h-6 text-sky-600 mx-auto mb-1.5" />
              <h4 className="font-bold text-slate-800 text-xs">พลังเสียงบำบัด</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                ช่วยลดระดับฮอร์โมนคอร์ติซอล (ความเครียด) และสร้างความผ่อนคลาย
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <h4 className="font-bold text-slate-800 text-xs">จิตอาสาคัดกรอง</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                ผ่านการอบรมทักษะการใช้น้ำเสียงและการดูแลผู้ป่วยตามมาตรฐาน
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-center">
              <Hospital className="w-6 h-6 text-purple-600 mx-auto mb-1.5" />
              <h4 className="font-bold text-slate-800 text-xs">เคียงข้างเตียง</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                บริการทั้งมาอ่านข้างเตียง และฟังผ่านแท็บเล็ต/เสียงตามสาย
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              โรงพยาบาลเครือข่ายความร่วมมือ
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
              <li>โรงพยาบาลศิริราช (Siriraj Hospital)</li>
              <li>โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย (King Chulalongkorn Memorial Hospital)</li>
              <li>โรงพยาบาลรามาธิบดี (Ramathibodi Hospital)</li>
              <li>โรงพยาบาลมหาวิทยาลัยบูรพา (Burapha University Hospital)</li>
              <li>โรงพยาบาลชลบุรี (Chonburi Hospital)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
