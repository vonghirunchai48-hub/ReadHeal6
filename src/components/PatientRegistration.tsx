import React, { useState } from 'react';
import { PatientAccount, Gender } from '../types';
import { 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  BedDouble, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Heart, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  LogIn,
  Sparkles,
  Check
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { CHONBURI_HOSPITALS, CHONBURI_DISTRICTS } from '../data/chonburiHospitals';

interface PatientRegistrationProps {
  onRegisterSuccess: (newAccount: PatientAccount) => void;
  onCancel: () => void;
  onResetToLanding?: () => void;
  onGoToLogin?: () => void;
  existingAccounts?: PatientAccount[];
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({
  onRegisterSuccess,
  onCancel,
  onResetToLanding,
  onGoToLogin,
  existingAccounts = [],
}) => {
  // Authentication credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Patient personal details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('male');
  const [contactPhone, setContactPhone] = useState('');
  const [caregiverName, setCaregiverName] = useState('');

  // Hospital in Chon Buri details
  const [hospitalName, setHospitalName] = useState<string>('โรงพยาบาลมหาวิทยาลัยบูรพา');
  const [hospitalDistrictFilter, setHospitalDistrictFilter] = useState<string>('all');
  const [ward, setWard] = useState('หอผู้ป่วยอายุรกรรม ชั้น 6');
  const [bedNumber, setBedNumber] = useState('เตียง 14');
  const [hnNumber, setHnNumber] = useState('');

  // Medical condition
  const [disease, setDisease] = useState('พักฟื้นหลังการรักษา / ผ่าตัด');
  const [symptoms, setSymptoms] = useState('ปวดแผลเล็กน้อย อ่อนเพลีย ต้องการเสียงอ่านผ่อนคลาย');
  const [readingInterests, setReadingInterests] = useState<string[]>([
    'นิทาน / เรื่องสั้น',
    'จิตวิทยา / กำลังใจ',
  ]);
  const [specialNeeds, setSpecialNeeds] = useState('ต้องการเสียงอ่านนุ่มนวล ช้าๆ ชัดเจน');

  // Terms and Consent
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Form error & UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAccount, setSubmittedAccount] = useState<PatientAccount | null>(null);

  // Auto calculate age when DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
  };

  const toggleInterest = (interest: string) => {
    if (readingInterests.includes(interest)) {
      setReadingInterests(readingInterests.filter((i) => i !== interest));
    } else {
      setReadingInterests([...readingInterests, interest]);
    }
  };

  const AVAILABLE_INTERESTS = [
    'นิทาน / เรื่องสั้น',
    'จิตวิทยา / กำลังใจ',
    'ศาสนา / ธรรมะบำบัด',
    'วรรณกรรม / สารคดี',
    'ความรู้ทั่วไป & สุขภาพ',
    'เพลงกล่อม & ดนตรีผ่อนคลาย',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Email format
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('กรุณาระบุอีเมลที่ถูกต้อง (เช่น example@mail.com)');
      healingSound.playClickBeep();
      return;
    }

    // Validation 2: Check duplicate email
    const duplicate = existingAccounts.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );
    if (duplicate) {
      setErrorMessage(`อีเมล ${cleanEmail} มีการลงทะเบียนในระบบแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น`);
      healingSound.playClickBeep();
      return;
    }

    // Validation 3: Password length
    if (!password || password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      healingSound.playClickBeep();
      return;
    }

    // Validation 4: Password confirmation
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      healingSound.playClickBeep();
      return;
    }

    // Validation 5: Required patient fields
    if (!fullName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล ผู้ป่วย');
      healingSound.playClickBeep();
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์ติดต่อ');
      healingSound.playClickBeep();
      return;
    }
    if (!ward.trim() || !bedNumber.trim()) {
      setErrorMessage('กรุณาระบุตึก/หอผู้ป่วย และหมายเลขเตียง');
      healingSound.playClickBeep();
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('กรุณากดยินยอมข้อตกลงการประสานงานอาสา');
      healingSound.playClickBeep();
      return;
    }

    setIsSubmitting(true);
    healingSound.playChime(700, 0.7);

    setTimeout(() => {
      const newAccount: PatientAccount = {
        id: `pac-${Date.now().toString().slice(-6)}`,
        email: cleanEmail,
        password: password,
        fullName: fullName.trim(),
        dob: dob || undefined,
        age: age === '' ? 45 : age,
        gender: gender,
        contactPhone: contactPhone.trim(),
        hospitalName: hospitalName,
        ward: ward.trim(),
        bedNumber: bedNumber.trim(),
        hnNumber: hnNumber.trim() || `HN-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(10000 + Math.random() * 90000)}`,
        disease: disease.trim(),
        symptoms: symptoms.trim(),
        readingInterests: readingInterests,
        specialNeeds: specialNeeds.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      setSubmittedAccount(newAccount);
      setIsSubmitting(false);

      setTimeout(() => {
        onRegisterSuccess(newAccount);
      }, 1200);
    }, 600);
  };

  // SUCCESS BANNER STATE
  if (submittedAccount) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 inline-block mb-2">
            ลงทะเบียนผู้ป่วยสำเร็จ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            ยินดีต้อนรับคุณ {submittedAccount.fullName}
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            บัญชีของคุณได้รับการสร้างเรียบร้อยแล้วด้วยอีเมล <span className="font-semibold text-emerald-700">{submittedAccount.email}</span>
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-md mx-auto">
            <p><span className="text-slate-500">โรงพยาบาล:</span> <span className="font-semibold text-slate-800">{submittedAccount.hospitalName}</span></p>
            <p><span className="text-slate-500">ตึก/เตียง:</span> <span className="font-semibold text-slate-800">{submittedAccount.ward} ({submittedAccount.bedNumber})</span></p>
            <p><span className="text-slate-500">เลขประจำตัว HN:</span> <span className="font-mono font-semibold text-sky-700">{submittedAccount.hnNumber}</span></p>
            <p><span className="text-slate-500">เบอร์ติดต่อ:</span> <span className="font-semibold text-slate-800">{submittedAccount.contactPhone}</span></p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-emerald-700">กำลังนำท่านเข้าสู่ระบบและแดชบอร์ดผู้รับบริการ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4">
      {/* Top Navigation & Back Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            if (onResetToLanding) onResetToLanding();
            else onCancel();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← หน้าหลักเลือกบทบาท</span>
        </button>

        {onGoToLogin && (
          <button
            type="button"
            onClick={onGoToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</span>
          </button>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
            <Users className="w-4 h-4" />
            <span>แบบฟอร์มลงทะเบียนผู้รับบริการ (Patient Registration)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            ลงทะเบียนผู้ป่วยรับบริการเสียงอ่านข้างเตียง
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-2 max-w-xl leading-relaxed">
            เครือข่ายโรงพยาบาล 14 แห่งในจังหวัดชลบุรี • สมัครสมาชิกด้วยอีเมลและรหัสผ่านเพื่อจองคิวจิตอาสา บันทึกเรื่องที่ชอบฟัง และติดตามการนัดหมาย
          </p>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ========================================================================= */}
          {/* SECTION 1: ACCOUNT CREDENTIALS (อีเมลและรหัสผ่าน) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    ข้อมูลเข้าสู่ระบบ (Account Credentials)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ใช้อีเมลและรหัสผ่านนี้เพื่อเข้าสู่ระบบดูนัดหมายในครั้งต่อไป
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                จำเป็นต้องระบุ *
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อีเมล (Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-patient-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="เช่น patient.wichai@gmail.com"
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  จะใช้เป็นชื่อผู้ใช้ (Username) ในการเข้าสู่ระบบ
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-patient-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ยืนยันรหัสผ่าน (Confirm Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-patient-password-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && confirmPassword && (
                  <p className={`text-[11px] mt-1 font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {password === confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PATIENT PROFILE (ข้อมูลผู้ป่วย) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ข้อมูลผู้รับบริการ / ผู้ป่วย (Patient Profile)
                </h3>
                <p className="text-xs text-slate-400">
                  ข้อมูลพื้นฐานสำหรับพยาบาลและจิตอาสาในการประสานงาน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล ผู้รับบริการ / ผู้ป่วย <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-patient-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น คุณวิชัย สุนทรารมย์ หรือ เด็กหญิงพิชญา รัตนวงศ์"
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อายุ (ปี)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="คำนวณอัตโนมัติ"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เพศ (Gender)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'ชาย (Male)' },
                    { id: 'female', label: 'หญิง (Female)' },
                    { id: 'other', label: 'อื่นๆ' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id as Gender)}
                      className={`py-2 px-2 text-xs rounded-xl border transition-all text-center cursor-pointer ${
                        gender === g.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ (ผู้ป่วย หรือ ญาติ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="เช่น 081-998-3321"
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                </div>
              </div>

              {/* Caregiver Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อญาติหรือผู้ดูแลหลัก (Caregiver Name) - ถ้ามี
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="เช่น คุณวราภรณ์ (บุตรสาว) หรือ คุณแม่พรทิพย์"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: HOSPITAL & WARD (สถานที่พักรักษาในจังหวัดชลบุรี) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">
                3
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  สถานที่พักรักษาตัวในโรงพยาบาล (Chon Buri Hospital)
                </h3>
                <p className="text-xs text-slate-400">
                  ระบุตำแหน่งเตียงเพื่อให้จิตอาสาเดินทางไปอ่านให้ถูกจุด
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Hospital Selection */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    โรงพยาบาลในจังหวัดชลบุรี <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                    14 แห่งในเครือข่าย
                  </span>
                </div>

                {/* District Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-xs text-slate-500 mr-1">กรองตามอำเภอ:</span>
                  <button
                    type="button"
                    onClick={() => setHospitalDistrictFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      hospitalDistrictFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทั้งหมด ({CHONBURI_HOSPITALS.length})
                  </button>
                  {CHONBURI_DISTRICTS.map((d) => {
                    const count = CHONBURI_HOSPITALS.filter((h) => h.district === d).length;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setHospitalDistrictFilter(d);
                          const districtHospitals = CHONBURI_HOSPITALS.filter((h) => h.district === d);
                          if (!districtHospitals.some((h) => h.name === hospitalName) && districtHospitals.length > 0) {
                            const firstHosp = districtHospitals[0];
                            setHospitalName(firstHosp.name);
                            if (firstHosp.suggestedWards && firstHosp.suggestedWards.length > 0) {
                              setWard(firstHosp.suggestedWards[0]);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          hospitalDistrictFilter === d
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={hospitalName}
                    onChange={(e) => {
                      const newHosp = e.target.value;
                      setHospitalName(newHosp);
                      const matched = CHONBURI_HOSPITALS.find((h) => h.name === newHosp);
                      if (matched && matched.suggestedWards && matched.suggestedWards.length > 0) {
                        setWard(matched.suggestedWards[0]);
                      }
                    }}
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  >
                    {CHONBURI_HOSPITALS.filter(
                      (h) => hospitalDistrictFilter === 'all' || h.district === hospitalDistrictFilter
                    ).map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name} ({h.district}) • {h.ownership || (h.type === 'private' ? 'เอกชน' : 'รัฐบาล')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Suggested Wards Quick Chips */}
                {(() => {
                  const currentHosp = CHONBURI_HOSPITALS.find((h) => h.name === hospitalName);
                  if (currentHosp?.suggestedWards && currentHosp.suggestedWards.length > 0) {
                    return (
                      <div className="mt-2 text-xs">
                        <span className="text-slate-500 mr-1.5">หอผู้ป่วยแนะนำของ {currentHosp.name}:</span>
                        <div className="inline-flex flex-wrap gap-1.5 mt-1">
                          {currentHosp.suggestedWards.map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setWard(w)}
                              className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                ward === w
                                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Ward & Bed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ตึก / หอผู้ป่วย (Ward) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <BedDouble className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="เช่น หอผู้ป่วยอายุรกรรม ชั้น 6"
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    หมายเลขเตียง (Bed Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    placeholder="เช่น เตียง 14 (ริมหน้าต่าง)"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-medium"
                  />
                </div>
              </div>

              {/* HN Number */}
              <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    เลขประจำตัวผู้ป่วย (HN Number) เพื่อการยืนยันตัวตน
                  </label>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-medium">
                    ✓ ปลอดภัยตามมาตรฐาน PDPA
                  </span>
                </div>
                <input
                  type="text"
                  value={hnNumber}
                  onChange={(e) => setHnNumber(e.target.value)}
                  placeholder="เช่น HN-67-02481 (ดูจากป้ายข้อมือหรือใบนัด หากไม่มีระบบจะสร้างให้)"
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: MEDICAL & READING INTERESTS (ภาวะสุขภาพและความชอบ) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-100">
                4
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ภาวะสุขภาพและความชอบ (Health & Interests)
                </h3>
                <p className="text-xs text-slate-400">
                  ช่วยให้จิตอาสาเลือกน้ำเสียงและเรื่องอ่านที่เหมาะกับความต้องการ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Disease */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  โรคประจำตัว / ภาวะที่กำลังพักรักษา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  placeholder="เช่น พักฟื้นหลังผ่าตัด, โรคหลอดเลือดสมอง"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  อาการสำคัญในปัจจุบัน
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="เช่น ปวดแผล ขยับตัวลำบาก ต้องการผ่อนคลาย"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                />
              </div>

              {/* Reading interests */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  หมวดหมู่เรื่องเล่าที่สนใจฟัง (เลือกได้มากกว่า 1 ข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = readingInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{interest}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special needs */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  ความต้องการพิเศษเพิ่มเติม (Special Needs)
                </label>
                <input
                  type="text"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="เช่น ต้องการเสียงช้าๆ ชัดเจน, สายตาฝ้าฟาง, พักฟื้นหลังผ่าตัด"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                ข้าพเจ้ายินยอมให้ศูนย์ประสานงาน ReadHeal และโรงพยาบาลในเครือข่ายจังหวัดชลบุรี ใช้ข้อมูลข้างต้นเพื่อการจัดคู่นัดหมายจิตอาสาอ่านหนังสือข้างเตียง
              </span>
            </label>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Action Submit Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-submit-patient-register"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูลและสร้างบัญชี...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ยืนยันการลงทะเบียนผู้ป่วย (Register)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onResetToLanding) onResetToLanding();
                else onCancel();
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
