import React from 'react';
import { UserRole } from '../types';
import { 
  HeartHandshake, 
  BookOpen, 
  ShieldCheck, 
  Headphones, 
  Sparkles, 
  Smile, 
  Clock, 
  Award,
  LogIn,
  UserPlus,
  CalendarPlus,
  Zap,
  ArrowRight,
  Search
} from 'lucide-react';

interface RoleSelectionPageProps {
  onSelectRole: (role: UserRole) => void;
  onExploreDirectly: () => void;
  onOpenPatientLogin?: () => void;
  onOpenPatientRegister?: () => void;
  onOpenVolunteerLogin?: () => void;
  onOpenVolunteerRegister?: () => void;
  onOpenVolunteerStatusCheck?: () => void;
  onOpenAdminLogin?: () => void;
  onAdminDemoLogin?: () => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({
  onSelectRole,
  onExploreDirectly,
  onOpenPatientLogin,
  onOpenPatientRegister,
  onOpenVolunteerLogin,
  onOpenVolunteerRegister,
  onOpenVolunteerStatusCheck,
  onOpenAdminLogin,
  onAdminDemoLogin,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50/60 via-slate-50 to-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Decorative background ambient shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto relative z-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 text-sky-800 text-xs sm:text-sm font-medium mb-4 border border-sky-200/70 shadow-xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>โครงการจิตอาสาอ่านหนังสือข้างเตียงเพื่อผู้ป่วย เครือข่ายโรงพยาบาลจังหวัดชลบุรี</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-800 mb-3 sm:mb-4">
            ReadHeal <span className="text-sky-600 font-normal text-2xl sm:text-4xl block sm:inline mt-1 sm:mt-0">(เตียงนี้มีเรื่องเล่า)</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            เชื่อมโยงหัวใจด้วยเสียงอ่านที่อ่อนโยน ส่งมอบกำลังใจสู่ผู้ป่วยในโรงพยาบาล 14 แห่งทั่วจังหวัดชลบุรี 
            ผ่อนคลายความตึงเครียด เติมเต็มพลังบวก และเป็นเพื่อนร่วมทางในทุกช่วงเวลาของการพักฟื้น
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ครอบคลุม 14 รพ. ในชลบุรี</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>จิตอาสาผ่านการรับรอง</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>บริการฟรี ไม่มีค่าใช้จ่าย</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>รองรับทั้งข้างเตียง & ออนไลน์</span>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            โปรดเลือกสถานะการใช้งานของคุณเพื่อเริ่มต้น
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mt-1">
            คุณต้องการเข้าสู่ระบบในฐานะใด?
          </h2>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
          {/* Role 1: Patient / Receiver */}
          <div
            id="role-card-patient"
            onClick={() => {
              if (onOpenPatientLogin) {
                onOpenPatientLogin();
              } else {
                onSelectRole('patient');
              }
            }}
            className="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-100/70 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-5 right-5">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ผู้รับบริการ
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Headphones className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1.5 group-hover:text-emerald-700 transition-colors">
                ผู้รับบริการ / ผู้ป่วย
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Patient & Family Care
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                เลือกฟังเรื่องเล่าข้างเตียง นิทาน ธรรมะ หรือบทความบำบัดใจ 
                พร้อมบริการนัดหมายจิตอาสามาอ่านให้ฟังถึงเตียงผู้ป่วย
              </p>

              {/* Feature highlights */}
              <ul className="space-y-2 text-xs text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <Smile className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ฟังเรื่องเสียงบำบัดฟรีทันที</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>จองคิวจิตอาสาข้างเตียงได้ตามเวลาที่สะดวก</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>มี 6 หมวดเรื่องเล่าให้เลือกตามความชอบ</span>
                </li>
              </ul>
            </div>

            {/* TWO Distinct Buttons for Role 1 */}
            <div className="space-y-2.5 pt-2">
              {/* Button 1: Patient Login */}
              <button
                id="btn-patient-login"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPatientLogin) {
                    onOpenPatientLogin();
                  } else {
                    onSelectRole('patient');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>เข้าสู่ระบบผู้ป่วย (Login)</span>
              </button>

              {/* Button 2: Patient Register / New Booking */}
              <button
                id="btn-patient-register"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPatientRegister) {
                    onOpenPatientRegister();
                  } else {
                    onSelectRole('patient');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200/80 text-emerald-800 border border-emerald-300/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group/reg"
              >
                <CalendarPlus className="w-4 h-4 shrink-0 text-emerald-600 group-hover/reg:translate-x-0.5 transition-transform" />
                <span>ลงทะเบียนผู้ป่วย / จองคิวใหม่ (Register)</span>
              </button>
            </div>
          </div>

          {/* Role 2: Volunteer Reader */}
          <div
            id="role-card-volunteer"
            onClick={() => {
              if (onOpenVolunteerLogin) {
                onOpenVolunteerLogin();
              } else {
                onSelectRole('volunteer');
              }
            }}
            className="group relative bg-white rounded-3xl p-6 sm:p-7 border-2 border-sky-300/80 hover:border-sky-500 shadow-md hover:shadow-xl hover:shadow-sky-200/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            {/* Recommend Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-xs">
                ร่วมแบ่งปันรอยยิ้ม
              </span>
            </div>

            <div className="absolute top-5 right-5 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ⚡ มี Demo Mode
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                จิตอาสา
              </span>
            </div>

            <div className="mt-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5 group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <HeartHandshake className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1.5 group-hover:text-sky-700 transition-colors">
                อาสาสมัคร / จิตอาสา
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Volunteer Reader Portal
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                ลงทะเบียนผู้อ่าน อัปเดตประวัติ ทดสอบเสียงอ่าน 
                และรับคำขอนัดหมายอ่านหนังสือให้ผู้ป่วยในโรงพยาบาล
              </p>

              {/* Feature highlights */}
              <ul className="space-y-2 text-xs text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>บันทึกชั่วโมงจิตอาสา & ใบประกาศรับรอง</span>
                </li>
                <li className="flex items-center gap-2">
                  <Smile className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>สร้างโปรไฟล์ผู้อ่านพร้อมอัดคลิปเสียงตัวอย่าง</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>เลือกวันเวลาและโรงพยาบาลที่สะดวกได้เอง</span>
                </li>
              </ul>
            </div>

            {/* THREE Distinct Buttons for Role 2 (Requirement 2) */}
            <div className="space-y-2 pt-2">
              {/* Button 1: Volunteer Login */}
              <button 
                id="btn-volunteer-login"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenVolunteerLogin) {
                    onOpenVolunteerLogin();
                  } else {
                    onSelectRole('volunteer');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 active:from-sky-700 active:to-teal-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>1. เข้าสู่ระบบจิตอาสา (Login)</span>
              </button>

              {/* Button 2: Volunteer Register */}
              <button
                id="btn-volunteer-register"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenVolunteerRegister) {
                    onOpenVolunteerRegister();
                  } else {
                    onSelectRole('volunteer');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100/90 active:bg-sky-200/80 text-sky-800 border border-sky-300/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group/vreg"
              >
                <UserPlus className="w-4 h-4 shrink-0 text-sky-600 group-hover/vreg:translate-x-0.5 transition-transform" />
                <span>2. ลงทะเบียนจิตอาสาสมัครใหม่ (Register)</span>
              </button>

              {/* Button 3: Check Approval Status */}
              <button
                id="btn-volunteer-status-check"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenVolunteerStatusCheck) {
                    onOpenVolunteerStatusCheck();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:bg-amber-200/80 text-amber-900 border border-amber-300/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group/vstatus"
              >
                <Search className="w-4 h-4 shrink-0 text-amber-600 group-hover/vstatus:scale-110 transition-transform" />
                <span>3. ตรวจสอบสถานะการอนุมัติ (Check Status)</span>
              </button>
            </div>
          </div>

          {/* Role 3: Administrator */}
          <div
            id="role-card-admin"
            onClick={() => {
              if (onOpenAdminLogin) {
                onOpenAdminLogin();
              } else {
                onSelectRole('admin');
              }
            }}
            className="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-100/70 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-5 right-5 flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                ⚡ Fast Track
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                ผู้ดูแล
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-5 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1.5 group-hover:text-purple-700 transition-colors">
                ผู้ดูแลระบบส่วนกลาง (Central Admin)
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Central Network Administrator
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                สำหรับผู้ดูแลระบบส่วนกลาง จัดการตารางนัดหมาย จับคู่จิตอาสา 
                ตรวจอนุมัติไฟล์เสียง MP3 และรับรองเกียรติบัตรทั่วทั้งจังหวัดชลบุรี
              </p>

              {/* Feature highlights */}
              <ul className="space-y-2 text-xs text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>จัดการและอนุมัติคำขอนัดหมายเครือข่าย 11 อำเภอ</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>ตรวจอนุมัติไฟล์เสียงและออกเกียรติบัตรรับรอง</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>แดชบอร์ดสถิติภาพรวมและการจัดการระบบส่วนกลาง</span>
                </li>
              </ul>
            </div>

            {/* TWO Distinct Buttons for Role 3 */}
            <div className="space-y-2.5 pt-2">
              {/* Button 1: Admin Login */}
              <button 
                id="btn-admin-login"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAdminLogin) {
                    onOpenAdminLogin();
                  } else {
                    onSelectRole('admin');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>เข้าสู่ระบบผู้ดูแลส่วนกลาง (Central Admin)</span>
              </button>

              {/* Button 2: Fast-track Admin Demo Mode */}
              <button 
                id="btn-admin-demo"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAdminDemoLogin) {
                    onAdminDemoLogin();
                  } else if (onOpenAdminLogin) {
                    onOpenAdminLogin();
                  } else {
                    onSelectRole('admin');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:bg-amber-200/80 text-amber-900 border border-amber-300/90 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group/ademo"
              >
                <Zap className="w-4 h-4 shrink-0 text-amber-600 group-hover/ademo:scale-110 transition-transform" />
                <span>⚡ เดโมผู้ดูแลระบบส่วนกลาง (Central Admin Demo)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alternative direct browse link */}
        <div className="text-center pt-2">
          <button
            onClick={onExploreDirectly}
            className="text-xs sm:text-sm text-slate-500 hover:text-sky-600 underline underline-offset-4 font-medium transition-colors cursor-pointer"
          >
            หรือเข้าชมหน้าหลักและคลังเรื่องเล่าโดยไม่ต้องเลือกบทบาททันที →
          </button>
        </div>
      </div>
    </div>
  );
};
