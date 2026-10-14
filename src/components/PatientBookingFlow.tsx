import React, { useState } from 'react';
import { VolunteerProfile, Category, Story, BookingRequest, Gender, PatientAccount } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Heart, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Phone, 
  Sparkles,
  BedDouble,
  ShieldCheck,
  Star,
  QrCode,
  Share2,
  Printer,
  Activity,
  FileText,
  BadgeCheck,
  Filter,
  Headphones,
  Volume2,
  AlertCircle,
  Plus,
  Layers,
  Trash2,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { CHONBURI_HOSPITALS, CHONBURI_DISTRICTS } from '../data/chonburiHospitals';
import { Html5AudioPlayer } from './Html5AudioPlayer';
import { generateHealingWavAudioUrl } from '../utils/audioGenerator';
import { BookingSlotItem, VolunteerAvailabilitySlot } from '../types';
import { AppointmentSlipModal } from './AppointmentSlipModal';

interface PatientBookingFlowProps {
  volunteers: VolunteerProfile[];
  categories: Category[];
  stories: Story[];
  preSelectedVolunteer?: VolunteerProfile | null;
  preSelectedStory?: Story | null;
  onBookingSuccess: (newBooking: BookingRequest, newPatientAccount?: PatientAccount) => void;
  onCancel: () => void;
  onResetToLanding?: () => void;
  availabilitySlots?: VolunteerAvailabilitySlot[];
  currentPatient?: PatientAccount | null;
  onRegisterPatientAccount?: (account: PatientAccount) => void;
}

export const PatientBookingFlow: React.FC<PatientBookingFlowProps> = ({
  volunteers,
  categories,
  stories,
  preSelectedVolunteer,
  preSelectedStory,
  onBookingSuccess,
  onCancel,
  onResetToLanding,
  availabilitySlots = [],
  currentPatient,
  onRegisterPatientAccount,
}) => {
  // 4 steps: 1: Patient Info, 2: Category & Topic, 3: Volunteer Reader, 4: Date & Time, 5: Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Authentication credentials for Step 1
  const [patientEmail, setPatientEmail] = useState(currentPatient?.email || '');
  const [patientPassword, setPatientPassword] = useState(currentPatient?.password || '');
  const [patientConfirmPassword, setPatientConfirmPassword] = useState(currentPatient?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step1ErrorMessage, setStep1ErrorMessage] = useState<string | null>(null);

  // Step 1: Patient Details & Chon Buri Hospital
  const [patientName, setPatientName] = useState(currentPatient?.fullName || '');
  const [patientDob, setPatientDob] = useState(currentPatient?.dob || '');
  const [patientAge, setPatientAge] = useState<number | ''>(currentPatient?.age ?? '');
  const [patientGender, setPatientGender] = useState<Gender>(currentPatient?.gender || 'male');
  const [hospitalName, setHospitalName] = useState<string>(currentPatient?.hospitalName || 'โรงพยาบาลมหาวิทยาลัยบูรพา');
  const [hospitalDistrictFilter, setHospitalDistrictFilter] = useState<string>('all');
  const [ward, setWard] = useState(currentPatient?.ward || 'หอผู้ป่วยอายุรกรรม ชั้น 6');
  const [bedNumber, setBedNumber] = useState(currentPatient?.bedNumber || 'เตียง 14');
  const [disease, setDisease] = useState(currentPatient?.disease || 'พักฟื้นหลังการรักษา / ผ่าตัด');
  const [symptoms, setSymptoms] = useState(currentPatient?.symptoms || 'ปวดแผลเล็กน้อย อ่อนเพลีย ต้องการเสียงอ่านผ่อนคลาย');
  const [hnNumber, setHnNumber] = useState(currentPatient?.hnNumber || 'HN-67-02481');
  const [contactPhone, setContactPhone] = useState(currentPatient?.contactPhone || '');
  const [caregiverName, setCaregiverName] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState(currentPatient?.specialNeeds || 'ต้องการเสียงอ่านนุ่มนวล ช้าๆ ชัดเจน');

  // Step 2: Category & Topic Selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    preSelectedStory?.categoryId || categories[0]?.id || 'cat-fairy-tales'
  );
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    preSelectedStory?.id || ''
  );
  const [customTopic, setCustomTopic] = useState('');

  // Step 3: Volunteer Selection & Hospital Matching
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(
    preSelectedVolunteer?.id || 'auto-assign'
  );
  const [onlyShowHospitalVolunteers, setOnlyShowHospitalVolunteers] = useState(true);

  // Step 4: Date & Time Slot (Preset or Custom)
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('14:00 - 14:45 น. (รอบบ่าย - ยอดนิยม)');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('14:20');
  const [customEndTime, setCustomEndTime] = useState('15:05');
  const [customTimeNote, setCustomTimeNote] = useState('');
  const [readingFormat, setReadingFormat] = useState<'bedside_visit' | 'hospital_tablet' | 'audio_call'>('bedside_visit');
  const [patientNotes, setPatientNotes] = useState('');

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRequest | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  // Multi-slot booking support (Requirement 2 & 3)
  const [additionalSlots, setAdditionalSlots] = useState<BookingSlotItem[]>([]);
  const [extraSlotDate, setExtraSlotDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [extraSlotTime, setExtraSlotTime] = useState('14:00 - 14:45 น. (รอบบ่าย)');
  const [showAddSlotForm, setShowAddSlotForm] = useState(false);

  const handleAddNewSlot = () => {
    if (!extraSlotDate) return;
    healingSound.playClickBeep();
    const newSlotItem: BookingSlotItem = {
      id: `slot-extra-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: extraSlotDate,
      timeSlot: extraSlotTime,
      format: readingFormat,
      hospitalName: hospitalName,
      ward: ward,
      bedNumber: bedNumber,
    };
    setAdditionalSlots((prev) => [...prev, newSlotItem]);
    setShowAddSlotForm(false);
  };

  const handleRemoveAdditionalSlot = (id: string) => {
    healingSound.playClickBeep();
    setAdditionalSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // Sample audio player state for previewing stories & volunteer voices
  const [sampleAudioData, setSampleAudioData] = useState<{ id: string; url: string; title: string; subtitle: string } | null>(null);

  // Auto age calculate from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatientDob(val);
    if (val) {
      const birth = new Date(val);
      const now = new Date();
      let ageCalculated = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        ageCalculated--;
      }
      if (ageCalculated >= 0 && ageCalculated <= 120) {
        setPatientAge(ageCalculated);
      }
    }
  };

  // Step Navigation
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!currentPatient) {
        const cleanEmail = patientEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          setStep1ErrorMessage('กรุณาระบุอีเมลที่ถูกต้องสำหรับลงทะเบียน (เช่น example@mail.com)');
          healingSound.playClickBeep();
          return;
        }
        if (!patientPassword || patientPassword.length < 6) {
          setStep1ErrorMessage('กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร');
          healingSound.playClickBeep();
          return;
        }
        if (patientPassword !== patientConfirmPassword) {
          setStep1ErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
          healingSound.playClickBeep();
          return;
        }
      }
      if (!patientName.trim()) {
        setStep1ErrorMessage('กรุณาระบุชื่อ-นามสกุลของผู้รับบริการ / ผู้ป่วย');
        healingSound.playClickBeep();
        return;
      }
      if (!patientDob) {
        setStep1ErrorMessage('กรุณาระบุวันเดือนปีเกิดของผู้ป่วย');
        healingSound.playClickBeep();
        return;
      }
      if (!contactPhone.trim()) {
        setStep1ErrorMessage('กรุณาระบุเบอร์โทรศัพท์สำหรับติดต่อยืนยัน');
        healingSound.playClickBeep();
        return;
      }
      if (!ward.trim() || !bedNumber.trim()) {
        setStep1ErrorMessage('กรุณาระบุตึก/หอผู้ป่วย และหมายเลขเตียง');
        healingSound.playClickBeep();
        return;
      }
      setStep1ErrorMessage(null);
    }

    healingSound.playClickBeep();
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevStep = () => {
    healingSound.playClickBeep();
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = () => {
    healingSound.playChime(784, 1.5);

    // Resolve Volunteer
    let chosenVolunteer: VolunteerProfile;
    if (selectedVolunteerId === 'auto-assign') {
      // Pick best matching or first volunteer
      chosenVolunteer = volunteers[0];
    } else {
      chosenVolunteer = volunteers.find((v) => v.id === selectedVolunteerId) || volunteers[0];
    }

    // Resolve Category
    const categoryObj = categories.find((c) => c.id === selectedCategoryId) || categories[0];

    // Resolve Story
    const storyObj = stories.find((s) => s.id === selectedStoryId);

    // Compute final effective time slot
    const effectiveTimeSlot = isCustomTime
      ? `${customStartTime} - ${customEndTime} น.${customTimeNote ? ` (${customTimeNote})` : ' (เวลากำหนดเอง)'}`
      : timeSlot;

    const matchedHospital = CHONBURI_HOSPITALS.find(h => h.name === hospitalName);

    const newBooking: BookingRequest = {
      id: `RH-CHON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientInfo: {
        fullName: patientName,
        dob: patientDob,
        age: Number(patientAge) || 45,
        gender: patientGender,
        hospitalName: hospitalName,
        hospitalId: matchedHospital?.id,
        ward,
        bedNumber,
        disease,
        symptoms,
        hnNumber: hnNumber.trim() || `HN-${Math.floor(10000 + Math.random() * 90000)}`,
        verificationStatus: 'verified',
        contactPhone,
        caregiverName,
        readingInterests: [categoryObj.name],
        specialNeeds,
        email: patientEmail.trim().toLowerCase() || currentPatient?.email,
        password: patientPassword || currentPatient?.password,
      },
      volunteerId: chosenVolunteer.id,
      volunteerName: chosenVolunteer.fullName,
      volunteerAvatar: chosenVolunteer.avatar,
      categoryId: categoryObj.id,
      categoryName: categoryObj.name,
      storyId: storyObj?.id,
      storyTitle: storyObj?.title || customTopic || 'เรื่องเล่าสร้างกำลังใจที่จิตอาสาคัดสรร',
      customTopic,
      date: bookingDate,
      timeSlot: effectiveTimeSlot,
      customTimeSlot: isCustomTime ? effectiveTimeSlot : undefined,
      format: readingFormat,
      status: 'pending',
      isMatched: false,
      notes: patientNotes,
      createdAt: new Date().toLocaleString('th-TH'),
      slots: [
        {
          id: `slot-primary-${Date.now()}`,
          date: bookingDate,
          timeSlot: effectiveTimeSlot,
          format: readingFormat,
          hospitalName: hospitalName,
          ward: ward,
          bedNumber: bedNumber,
        },
        ...additionalSlots,
      ],
    };

    let createdAccount: PatientAccount | undefined = undefined;
    if (!currentPatient && patientEmail.trim()) {
      createdAccount = {
        id: `pac-${Date.now().toString().slice(-6)}`,
        email: patientEmail.trim().toLowerCase(),
        password: patientPassword,
        fullName: patientName.trim(),
        dob: patientDob || undefined,
        age: Number(patientAge) || 45,
        gender: patientGender,
        contactPhone: contactPhone.trim(),
        hospitalName: hospitalName,
        ward: ward.trim(),
        bedNumber: bedNumber.trim(),
        hnNumber: newBooking.patientInfo.hnNumber,
        disease: disease.trim(),
        symptoms: symptoms.trim(),
        readingInterests: [categoryObj.name],
        specialNeeds: specialNeeds.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      if (onRegisterPatientAccount) {
        onRegisterPatientAccount(createdAccount);
      }
    }

    setConfirmedBooking(newBooking);
    setCurrentStep(5);
    onBookingSuccess(newBooking, createdAccount);
  };

  // STEP 5: Confirmation Pass
  if (currentStep === 5 && confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl overflow-hidden text-center">
          {/* Top header ribbon */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 p-6 sm:p-8 text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3">
              <Clock className="w-10 h-10 text-white animate-pulse" />
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-200/90 text-amber-950 inline-block mb-2 shadow-xs">
              🟡 รอผู้ดูแลระบบตรวจสอบและยืนยันนัดหมาย
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">
              ส่งคำขอนัดหมายเรียบร้อยแล้ว
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 mt-1">
              ReadHeal Bedside Reading Pass • เลขที่อ้างอิง: <span className="font-mono font-bold tracking-wider">{confirmedBooking.id}</span>
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 text-left space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">ชื่อผู้รับบริการ / ผู้ป่วย</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-slate-800">
                    {confirmedBooking.patientInfo.fullName}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    รออนุมัติจากผู้ดูแลระบบ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  อายุ {confirmedBooking.patientInfo.age} ปี • เพศ {confirmedBooking.patientInfo.gender === 'male' ? 'ชาย' : 'หญิง'}
                </p>
                {confirmedBooking.patientInfo.hnNumber && (
                  <p className="text-xs text-sky-700 font-medium mt-1">
                    รหัสผู้ป่วย (HN): <span className="font-mono">{confirmedBooking.patientInfo.hnNumber}</span>
                  </p>
                )}
                {confirmedBooking.patientInfo.disease && (
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">ภาวะการรักษา:</span> {confirmedBooking.patientInfo.disease}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">สถานที่พักรักษา (จ.ชลบุรี)</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                  {confirmedBooking.patientInfo.hospitalName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {confirmedBooking.patientInfo.ward} • {confirmedBooking.patientInfo.bedNumber}
                </p>
                {confirmedBooking.patientInfo.symptoms && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-1.5 rounded-lg mt-2">
                    <span className="font-semibold">อาการปัจจุบัน:</span> {confirmedBooking.patientInfo.symptoms}
                  </p>
                )}
              </div>
            </div>

            {/* Reading details */}
            <div className="bg-sky-50/70 rounded-2xl p-4 sm:p-5 border border-sky-100 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={confirmedBooking.volunteerAvatar || undefined}
                  alt={confirmedBooking.volunteerName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <p className="text-xs text-sky-600 font-medium">จิตอาสาผู้รับหน้าที่อ่าน</p>
                  <h4 className="font-bold text-sm text-slate-800">
                    {confirmedBooking.volunteerName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    หมวดหมู่: {confirmedBooking.categoryName}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-sky-200/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">วันนัดหมาย:</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ช่วงเวลา:</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.timeSlot}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">รูปแบบการอ่าน:</span>
                  <span className="font-bold text-slate-800">
                    {confirmedBooking.format === 'bedside_visit'
                      ? 'มาอ่านที่เตียง (Bedside)'
                      : confirmedBooking.format === 'hospital_tablet'
                      ? 'ผ่านแท็บเล็ตโรงพยาบาล'
                      : 'โทรศัพท์สายตรง'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">หัวข้อ/เรื่อง:</span>
                  <span className="font-bold text-slate-800 line-clamp-1">
                    {confirmedBooking.storyTitle}
                  </span>
                </div>
              </div>

              {/* Multi-booking session list on ticket if multiple slots */}
              {confirmedBooking.slots && confirmedBooking.slots.length > 1 && (
                <div className="pt-3 border-t border-sky-200/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>ช่วงเวลานัดหมายล่วงหน้าทั้งหมด ({confirmedBooking.slots.length} รอบ):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {confirmedBooking.slots.map((s, idx) => (
                      <div key={s.id || idx} className="p-2 bg-white/90 rounded-xl border border-sky-200 text-slate-700">
                        <span className="font-semibold text-sky-700">รอบที่ {idx + 1}: </span>
                        <span>{s.date} ({s.timeSlot})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code & Hospital Notice */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <QrCode className="w-10 h-10 text-slate-700 shrink-0" />
                <div className="text-xs text-slate-500 leading-relaxed">
                  <p className="font-medium text-slate-700">แสดง QR Code นี้ให้พยาบาลหรือจิตอาสา</p>
                  <p>เจ้าหน้าที่จะติดต่อประสานงานก่อนเริ่มรอบการอ่าน 15 นาที</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>ไปยังหน้ารายการนัดหมายของฉัน (My Bookings)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              * ปุ่ม "พิมพ์ใบนัดหมาย" จะเปิดให้พิมพ์ได้ในหน้าการนัดหมายของฉันทันทีหลังจากผู้ดูแลระบบตรวจสอบและยืนยันการจับคู่
            </p>

            {/* Dedicated Printable Appointment Slip Modal */}
            {isSlipModalOpen && confirmedBooking && (
              <AppointmentSlipModal
                isOpen={isSlipModalOpen}
                onClose={() => setIsSlipModalOpen(false)}
                booking={confirmedBooking}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Header Back Button / Return to Role Selection Gateway */}
      {(onResetToLanding || onCancel) && (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onResetToLanding || onCancel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-all shadow-2xs group cursor-pointer"
            title="กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าเลือกบทบาท (Patient, Volunteer, Admin)</span>
          </button>
        </div>
      )}

      {/* Step Wizard Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
          <span className={currentStep >= 1 ? 'text-sky-600' : ''}>1. ข้อมูลผู้ป่วย</span>
          <span className={currentStep >= 2 ? 'text-sky-600' : ''}>2. หมวดและเรื่องเล่า</span>
          <span className={currentStep >= 3 ? 'text-sky-600' : ''}>3. เลือกจิตอาสา</span>
          <span className={currentStep >= 4 ? 'text-sky-600' : ''}>4. วันเวลานัดหมาย</span>
        </div>

        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
        {/* ============================================================ */}
        {/* STEP 1: Patient Information (ข้อมูลผู้รับบริการ / ผู้ป่วย) */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ขั้นตอนที่ 1 จาก 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                ข้อมูลผู้รับบริการ / ผู้ป่วย (Patient Information)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                กรุณาระบุข้อมูลผู้ป่วยและตำแหน่งเตียง เพื่อให้จิตอาสาและเจ้าหน้าที่ประสานงานได้อย่างถูกต้อง
              </p>
            </div>

            {/* Error Banner */}
            {step1ErrorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{step1ErrorMessage}</span>
              </div>
            )}

            {/* Account Credentials / Authentication */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  บัญชีผู้ใช้งานสำหรับเข้าสู่ระบบ (Account Credentials)
                </span>
                {currentPatient ? (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    เข้าสู่ระบบแล้ว ({currentPatient.email})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    จำเป็นสำหรับลงทะเบียน *
                  </span>
                )}
              </div>

              {currentPatient ? (
                <p className="text-xs text-slate-600">
                  กำลังจองคิวในนาม <span className="font-semibold text-slate-800">{currentPatient.fullName}</span> ({currentPatient.email}) ข้อมูลจะถูกบันทึกไว้ในบัญชีของคุณอัตโนมัติ
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      อีเมล (Email) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="booking-patient-email"
                        type="email"
                        required
                        value={patientEmail}
                        onChange={(e) => {
                          setPatientEmail(e.target.value);
                          setStep1ErrorMessage(null);
                        }}
                        placeholder="เช่น patient.wichai@gmail.com"
                        className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      จะใช้สำหรับเข้าสู่ระบบดูประวัตินัดหมายและการรักษา
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="booking-patient-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={patientPassword}
                        onChange={(e) => {
                          setPatientPassword(e.target.value);
                          setStep1ErrorMessage(null);
                        }}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ยืนยันรหัสผ่าน (Confirm Password) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="booking-patient-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={patientConfirmPassword}
                        onChange={(e) => {
                          setPatientConfirmPassword(e.target.value);
                          setStep1ErrorMessage(null);
                        }}
                        placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                        className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล ผู้รับบริการ / ผู้ป่วย <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="เช่น คุณวิชัย สุนทรารมย์ หรือ เด็กหญิงพิชญา"
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={patientDob}
                  onChange={handleDobChange}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
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
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="คำนวณอัตโนมัติ"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-sky-400"
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
                      onClick={() => setPatientGender(g.id as Gender)}
                      className={`py-2 px-2 text-xs rounded-xl border transition-all text-center ${
                        patientGender === g.id
                          ? 'bg-sky-50 border-sky-400 text-sky-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ (ผู้ป่วย หรือ ญาติผู้ดูแล) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="เช่น 081-998-3321"
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Chon Buri Hospital Selection */}
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    โรงพยาบาลที่พักรักษาตัวในจังหวัดชลบุรี <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-medium">
                    เครือข่ายโรงพยาบาลชลบุรี {CHONBURI_HOSPITALS.length} แห่ง (ครอบคลุม 11 อำเภอ)
                  </span>
                </div>

                {/* District Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-xs text-slate-500 mr-1">กรองตามอำเภอ:</span>
                  <button
                    type="button"
                    onClick={() => setHospitalDistrictFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      hospitalDistrictFilter === 'all'
                        ? 'bg-sky-600 text-white shadow-2xs'
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          hospitalDistrictFilter === d
                            ? 'bg-sky-600 text-white shadow-2xs'
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
                      const matched = CHONBURI_HOSPITALS.find(h => h.name === newHosp);
                      if (matched && matched.suggestedWards && matched.suggestedWards.length > 0) {
                        setWard(matched.suggestedWards[0]);
                      }
                    }}
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                  >
                    {CHONBURI_HOSPITALS
                      .filter(h => hospitalDistrictFilter === 'all' || h.district === hospitalDistrictFilter)
                      .map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.district}) • {h.ownership || (h.type === 'private' ? 'เอกชน' : 'รัฐบาล')}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Suggested Wards Quick Chips */}
                {(() => {
                  const currentHosp = CHONBURI_HOSPITALS.find(h => h.name === hospitalName);
                  if (currentHosp?.suggestedWards && currentHosp.suggestedWards.length > 0) {
                    return (
                      <div className="mt-2 text-xs">
                        <span className="text-slate-500 mr-1.5">หอผู้ป่วยแนะนำของ {currentHosp.name}:</span>
                        <div className="inline-flex flex-wrap gap-1.5 mt-1">
                          {currentHosp.suggestedWards.map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setWard(w)}
                              className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
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

              {/* Ward & Bed Number */}
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
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
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
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>

              {/* Patient HN Number & Hospital Verification */}
              <div className="sm:col-span-2 bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    เลขประจำตัวผู้ป่วย (HN Number) เพื่อการยืนยันตัวตน
                  </label>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-medium">
                    ✓ รองรับระบบ รพ.ชลบุรี
                  </span>
                </div>
                <input
                  type="text"
                  value={hnNumber}
                  onChange={(e) => setHnNumber(e.target.value)}
                  placeholder="เช่น HN-67-02481 (ตรวจสอบจากป้ายข้อมือหรือใบนัด)"
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * ข้อมูล HN ใช้สำหรับการยืนยันสถานะผู้ป่วยในกับพยาบาลประจำตึก ไม่มีการเผยแพร่ต่อบุคคลภายนอก
                </p>
              </div>

              {/* Medical Disease & Symptoms */}
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
                  placeholder="เช่น พักฟื้นหลังผ่าตัด, ความดัน, โรคหัวใจ"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  อาการสำคัญในปัจจุบัน (Symptoms)
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="เช่น ปวดแผลเล็กน้อย, กังวลนอนไม่หลับ, อ่อนเพลีย"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>

              {/* Caregiver Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อญาติผู้ดูแลข้างเตียง (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="เช่น คุณวราภรณ์ (บุตรสาว)"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Special Needs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  สภาพความพร้อม / ข้อควรระวังพิเศษ
                </label>
                <input
                  type="text"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="เช่น ต้องการเสียงเบานุ่มนวล, นอนติดเตียง, สายตาฝ้าฟาง"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: Category & Topic Selection */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ขั้นตอนที่ 2 จาก 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                เลือกหมวดหมู่และเรื่องที่อยากฟัง (Choose Category & Topic)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                คุณสามารถเลือกเรื่องที่มีในระบบ หรือระบุหัวข้อพิเศษที่อยากให้จิตอาสาช่วยคัดสรร
              </p>
            </div>

            {/* Category Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-3">
                หมวดหมู่หลักที่สนใจ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      healingSound.playClickBeep();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-sky-50 border-sky-400 shadow-xs ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-800">{cat.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stories in this category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                เลือกเรื่องเล่าที่แนะนำในหมวดนี้ (หรือเลือก "ให้จิตอาสาแนะนำ")
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedStoryId('')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedStoryId === ''
                      ? 'bg-teal-50 border-teal-400 font-semibold text-teal-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs sm:text-sm">
                    ✨ ให้จิตอาสาคัดสรรเรื่องเล่าที่เหมาะสมตามบรรยากาศและอารมณ์ในวันนั้น
                  </span>
                  <span className="text-xs text-teal-600">
                    {selectedStoryId === '' ? '✓ เลือกอยู่' : 'เลือก'}
                  </span>
                </div>

                {stories
                  .filter((s) => s.categoryId === selectedCategoryId)
                  .map((story) => {
                    const isSelected = selectedStoryId === story.id;
                    const isAudioPreviewActive = sampleAudioData?.id === story.id;
                    const audioSrc = story.audioUrl || generateHealingWavAudioUrl('piano', 35);
                    return (
                      <div
                        key={story.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-400 font-semibold text-sky-900 ring-2 ring-sky-200'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={() => setSelectedStoryId(story.id)}
                            className="cursor-pointer flex-1"
                          >
                            <p className="text-xs sm:text-sm font-medium text-slate-800">{story.title}</p>
                            <p className="text-[11px] text-slate-400">
                              อ่านโดย {story.readerName} • ความยาว {story.duration} นาที • โทนเสียง: {story.audioTone}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAudioPreviewActive) {
                                  setSampleAudioData(null);
                                } else {
                                  setSampleAudioData({
                                    id: story.id,
                                    url: audioSrc,
                                    title: story.title,
                                    subtitle: `เสียงอ่านตัวอย่าง: ${story.readerName} (${story.audioTone})`,
                                  });
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                isAudioPreviewActive
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-sky-100 hover:bg-sky-200 text-sky-800'
                              }`}
                              title="ทดลองฟังตัวอย่างเสียงอ่านด้วย HTML5 Audio Player"
                            >
                              <Headphones className="w-3.5 h-3.5" />
                              <span>{isAudioPreviewActive ? 'ปิดตัวอย่าง' : 'ฟังตัวอย่าง'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedStoryId(story.id)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-sky-600 text-white font-medium'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ เลือกแล้ว' : 'เลือก'}
                            </button>
                          </div>
                        </div>

                        {/* Interactive HTML5 Audio Player for this story */}
                        {isAudioPreviewActive && (
                          <div className="mt-3 pt-3 border-t border-sky-200/60">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                                เครื่องเล่นเสียงตัวอย่าง HTML5 Audio Player
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ควบคุมความเร็วและระดับเสียงได้
                              </span>
                            </div>
                            <Html5AudioPlayer
                              src={audioSrc}
                              title={story.title}
                              subtitle={`ตัวอย่างเสียงอ่านโดย: ${story.readerName}`}
                              autoPlay={true}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Custom Topic / Request */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                หรือระบุหัวข้อพิเศษ / เรื่องราวเฉพาะที่คุณอยากฟัง (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="เช่น นิทานช้างน้อยผจญภัย, บทความสร้างกำลังใจเรื่องการเอาชนะความกลัว"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: Volunteer Reader Selection */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ขั้นตอนที่ 3 จาก 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                เลือกจิตอาสาผู้อ่าน (Select Preferred Reader)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                คุณสามารถเลือกจิตอาสาที่มีสไตล์น้ำเสียงที่ชอบ หรือให้ระบบจัดสรรท่านที่สะดวกที่สุด
              </p>
            </div>

            {/* Option Auto Assign */}
            <div
              onClick={() => {
                setSelectedVolunteerId('auto-assign');
                healingSound.playClickBeep();
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedVolunteerId === 'auto-assign'
                  ? 'bg-sky-50 border-sky-400 shadow-xs ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg">
                  ✨
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    ให้ระบบ ReadHeal จัดสรรจิตอาสาที่เหมาะสมที่สุด (แนะนำ)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ระบบจะจับคู่จิตอาสาที่ว่างตรงเวลาและชำนาญในหมวดที่คุณเลือกโดยเร็วที่สุด
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-sky-600 shrink-0">
                {selectedVolunteerId === 'auto-assign' ? '✓ เลือกอยู่' : 'เลือก'}
              </span>
            </div>

            {/* Hospital Matching Filter & Header */}
            {(() => {
              const matchingVolunteers = volunteers.filter(vol => 
                vol.availableHospitals?.includes(hospitalName) || 
                vol.hospitalZone?.includes(hospitalName) ||
                vol.hospitalZone?.toLowerCase().includes('ชลบุรี')
              );
              const displayedVolunteers = onlyShowHospitalVolunteers && matchingVolunteers.length > 0
                ? matchingVolunteers
                : volunteers;

              return (
                <div className="space-y-4">
                  {/* Hospital Matching Banner */}
                  <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          จับคู่จิตอาสาสำหรับ: {hospitalName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          พบจิตอาสาในเครือข่ายชลบุรีที่พร้อมปฏิบัติหน้าที่ <span className="font-semibold text-sky-700">{matchingVolunteers.length} ท่าน</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOnlyShowHospitalVolunteers(!onlyShowHospitalVolunteers)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          onlyShowHospitalVolunteers
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>{onlyShowHospitalVolunteers ? 'กรองเฉพาะ รพ. นี้' : 'แสดงอาสาทั้งหมด'}</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Volunteers */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      รายชื่อจิตอาสาที่พร้อมบริการ ({displayedVolunteers.length} ท่าน)
                    </label>

                    {displayedVolunteers.map((vol) => {
                      const isSelected = selectedVolunteerId === vol.id;
                      const isHospitalMatch = vol.availableHospitals?.includes(hospitalName) || vol.hospitalZone?.includes(hospitalName);
                      return (
                        <div
                          key={vol.id}
                          onClick={() => {
                            setSelectedVolunteerId(vol.id);
                            healingSound.playClickBeep();
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col ${
                            isSelected
                              ? 'bg-sky-50/80 border-sky-400 shadow-xs ring-2 ring-sky-200'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 w-full">
                            <div className="flex items-start gap-3">
                            <img
                              src={vol.avatar || undefined}
                              alt={vol.fullName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-800">
                                  {vol.fullName} ({vol.nickname})
                                </h4>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                                  {vol.badge}
                                </span>
                                {isHospitalMatch && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    ตรงกับโรงพยาบาลนี้
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                🎙️ สไตล์: {vol.readingStyle}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                พื้นที่: {vol.hospitalZone} • เรตติ้ง ⭐ {vol.rating.toFixed(1)} ({vol.totalReadHours} ชม.)
                              </p>
                              {vol.availableHospitals && vol.availableHospitals.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {vol.availableHospitals.slice(0, 3).map(h => (
                                    <span key={h} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                      {h}
                                    </span>
                                  ))}
                                  {vol.availableHospitals.length > 3 && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-400">
                                      +{vol.availableHospitals.length - 3} แห่ง
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-xs font-semibold text-sky-600">
                              {isSelected ? '✓ เลือกท่านนี้' : 'เลือก'}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const volAudioSrc = vol.sampleAudioUrl || generateHealingWavAudioUrl('piano', 30);
                                if (sampleAudioData?.id === `vol-${vol.id}`) {
                                  setSampleAudioData(null);
                                } else {
                                  setSampleAudioData({
                                    id: `vol-${vol.id}`,
                                    url: volAudioSrc,
                                    title: `น้ำเสียงของ ${vol.fullName} (${vol.nickname})`,
                                    subtitle: `สไตล์: ${vol.readingStyle} • โซน: ${vol.hospitalZone}`,
                                  });
                                }
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                sampleAudioData?.id === `vol-${vol.id}`
                                  ? 'bg-amber-500 border-amber-500 text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Headphones className="w-3 h-3" />
                              <span>{sampleAudioData?.id === `vol-${vol.id}` ? 'ปิดเสียง' : 'ฟังเสียงตัวอย่าง'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Embedded HTML5 Voice Sample Player */}
                        {sampleAudioData?.id === `vol-${vol.id}` && (
                          <div className="mt-3 pt-3 border-t border-sky-200/60 w-full">
                            <Html5AudioPlayer
                              src={vol.sampleAudioUrl || generateHealingWavAudioUrl('piano', 30)}
                              title={`ตัวอย่างน้ำเสียง: ${vol.fullName}`}
                              subtitle={`สไตล์การอ่าน: ${vol.readingStyle}`}
                              autoPlay={true}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: Date, Time & Reading Format */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ขั้นตอนที่ 4 จาก 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                วัน เวลา และรูปแบบการรับฟัง (Schedule & Format)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                กำหนดวันและช่วงเวลาที่คุณสะดวกให้จิตอาสามาอ่านหนังสือให้ฟัง ณ โรงพยาบาลในชลบุรี
              </p>
            </div>

            {/* Reading Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                รูปแบบการให้บริการอ่าน
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'bedside_visit',
                    title: 'มาอ่านที่ข้างเตียง (Bedside)',
                    desc: 'จิตอาสาเดินทางมาพบและอ่านหนังสือให้ฟังข้างเตียงแบบตัวต่อตัว',
                  },
                  {
                    id: 'hospital_tablet',
                    title: 'ผ่านแท็บเล็ตโรงพยาบาล',
                    desc: 'รับฟังผ่านระบบแท็บเล็ตประจำเตียง พร้อมภาพประกอบสวยงาม',
                  },
                  {
                    id: 'audio_call',
                    title: 'โทรศัพท์สายตรงข้างเตียง',
                    desc: 'ส่งต่อเสียงอ่านผ่านสายโทรศัพท์ข้างเตียง เน้นความเงียบสงบ',
                  },
                ].map((fmt) => (
                  <div
                    key={fmt.id}
                    onClick={() => setReadingFormat(fmt.id as 'bedside_visit' | 'hospital_tablet' | 'audio_call')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      readingFormat === fmt.id
                        ? 'bg-sky-50 border-sky-400 shadow-xs ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-800 mb-1">{fmt.title}</p>
                    <p className="text-xs text-slate-500 leading-normal">{fmt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Selection (Preset vs Custom) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    วันที่ต้องการรับฟัง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      การเลือกช่วงเวลา <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsCustomTime(false)}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          !isCustomTime 
                            ? 'bg-sky-600 text-white' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        รอบมาตรฐาน
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomTime(true)}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          isCustomTime 
                            ? 'bg-teal-600 text-white' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        ระบุเวลาเอง
                      </button>
                    </div>
                  </div>

                  {!isCustomTime ? (
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-sky-400"
                      >
                        <option value="10:00 - 10:45 น. (รอบสาย)">10:00 - 10:45 น. (รอบสาย)</option>
                        <option value="14:00 - 14:45 น. (รอบบ่าย - ยอดนิยม)">14:00 - 14:45 น. (รอบบ่าย - ยอดนิยม)</option>
                        <option value="16:00 - 16:45 น. (รอบเย็น)">16:00 - 16:45 น. (รอบเย็น)</option>
                        <option value="18:30 - 19:15 น. (รอบผ่อนคลายก่อนนอน)">18:30 - 19:15 น. (รอบผ่อนคลายก่อนนอน)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <span className="text-[11px] text-teal-800 font-medium block mb-1">เวลาเริ่ม</span>
                          <input
                            type="time"
                            value={customStartTime}
                            onChange={(e) => setCustomStartTime(e.target.value)}
                            className="w-full text-sm px-2.5 py-1.5 bg-white rounded-lg border border-teal-200 focus:outline-none focus:border-teal-500 font-mono"
                          />
                        </div>
                        <span className="text-slate-400 mt-4">-</span>
                        <div className="flex-1">
                          <span className="text-[11px] text-teal-800 font-medium block mb-1">เวลาสิ้นสุด</span>
                          <input
                            type="time"
                            value={customEndTime}
                            onChange={(e) => setCustomEndTime(e.target.value)}
                            className="w-full text-sm px-2.5 py-1.5 bg-white rounded-lg border border-teal-200 focus:outline-none focus:border-teal-500 font-mono"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={customTimeNote}
                        onChange={(e) => setCustomTimeNote(e.target.value)}
                        placeholder="หมายเหตุเวลา เช่น หลังคุณหมอตรวจรอบบ่ายเสร็จ"
                        className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-teal-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Time Chips */}
              {isCustomTime && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500">ช่วงเวลาแนะนำ:</span>
                  {[
                    { label: '10:15 - 11:00 น. (ช่วงสาย)', start: '10:15', end: '11:00' },
                    { label: '13:30 - 14:15 น. (หลังมื้อเที่ยง)', start: '13:30', end: '14:15' },
                    { label: '15:15 - 16:00 น. (ช่วงบ่าย)', start: '15:15', end: '16:00' },
                    { label: '19:00 - 19:45 น. (ก่อนนอน)', start: '19:00', end: '19:45' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setCustomStartTime(chip.start);
                        setCustomEndTime(chip.end);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-booking Section (Requirement 2 & 3) */}
            <div className="bg-sky-50/60 rounded-2xl p-4 sm:p-5 border border-sky-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>จองล่วงหน้าหลายช่วงเวลา (Multi-booking Support)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    ต้องการนัดจิตอาสามาอ่านหนังสือต่อเนื่องหลายวัน สามารถกดเพิ่มช่วงเวลาล่วงหน้าได้ที่นี่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSlotForm(!showAddSlotForm)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มช่วงเวลา (Add Slot)</span>
                </button>
              </div>

              {/* Form to add slot */}
              {showAddSlotForm && (
                <div className="p-4 bg-white rounded-2xl border border-sky-200 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700">ระบุวันและรอบเวลาเพิ่มเติม</span>
                    <button
                      type="button"
                      onClick={() => setShowAddSlotForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ปิด
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">วันเพิ่มเติม</label>
                      <input
                        type="date"
                        value={extraSlotDate}
                        onChange={(e) => setExtraSlotDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ช่วงเวลา</label>
                      <select
                        value={extraSlotTime}
                        onChange={(e) => setExtraSlotTime(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-sky-400"
                      >
                        <option value="10:00 - 10:45 น. (รอบสาย)">10:00 - 10:45 น. (รอบสาย)</option>
                        <option value="14:00 - 14:45 น. (รอบบ่าย)">14:00 - 14:45 น. (รอบบ่าย)</option>
                        <option value="16:00 - 16:45 น. (รอบเย็น)">16:00 - 16:45 น. (รอบเย็น)</option>
                        <option value="18:30 - 19:15 น. (รอบผ่อนคลายก่อนนอน)">18:30 - 19:15 น. (รอบผ่อนคลายก่อนนอน)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddSlotForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewSlot}
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-2xs"
                    >
                      บันทึกรอบนี้
                    </button>
                  </div>
                </div>
              )}

              {/* List of slots */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-sky-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span className="font-semibold text-slate-800">{bookingDate}</span>
                    <span className="text-slate-500">({isCustomTime ? `${customStartTime} - ${customEndTime} น.` : timeSlot})</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-semibold">รอบหลัก</span>
                  </div>
                  <span className="text-[11px] text-slate-400">รอบเริ่มต้น</span>
                </div>

                {additionalSlots.map((slot, idx) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-teal-200 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">{idx + 2}</span>
                      <span className="font-semibold text-slate-800">{slot.date}</span>
                      <span className="text-slate-500">({slot.timeSlot})</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-semibold">รอบจองล่วงหน้า</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalSlot(slot.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                      title="ลบรอบนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ข้อความเพิ่มเติมถึงจิตอาสา (ไม่บังคับ)
              </label>
              <textarea
                rows={3}
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="เช่น ช่วงนี้ตื่นง่าย รบกวนเคาะประตูเบาๆ, ชอบฟังเสียงช้าๆ, มีอาหารว่างต้อนรับ ฯลฯ"
                className="w-full text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls Bottom Bar */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goToPrevStep}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium"
            >
              ยกเลิก
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <span>ถัดไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันการจองคิวจิตอาสา</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
