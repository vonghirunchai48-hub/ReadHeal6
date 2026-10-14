import React, { useState, useEffect, useRef } from 'react';
import { VolunteerProfile, Gender } from '../types';
import { 
  UserCheck, 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  BookOpen, 
  Heart,
  Volume2,
  Building2,
  Check,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Search
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { CHONBURI_HOSPITALS, CHONBURI_DISTRICTS } from '../data/chonburiHospitals';
import { Html5AudioPlayer } from './Html5AudioPlayer';
import { 
  saveAudioToIndexedDB, 
  getAudioFromIndexedDB, 
  deleteAudioFromIndexedDB, 
  readFileAsBase64DataUrl, 
  generatePermanentWavDataUrl, 
  safeSaveToLocalStorage, 
  safeLoadFromLocalStorage 
} from '../utils/persistentStorage';
import { formatDurationSeconds } from '../utils/audioGenerator';

interface VolunteerRegistrationProps {
  onRegisterSuccess: (newVolunteer: VolunteerProfile) => void;
  onCancel: () => void;
  onResetToLanding?: () => void;
  onOpenStatusCheck?: (email?: string) => void;
}

export const VolunteerRegistration: React.FC<VolunteerRegistrationProps> = ({
  onRegisterSuccess,
  onCancel,
  onResetToLanding,
  onOpenStatusCheck,
}) => {
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // Multi-hospital selection for Chon Buri province
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([
    'โรงพยาบาลมหาวิทยาลัยบูรพา',
    'โรงพยาบาลชลบุรี',
  ]);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [bio, setBio] = useState('');
  const [readingStyle, setReadingStyle] = useState('เสียงนุ่มนวล อบอุ่น ฟังสบาย');
  const [voiceToneDesc, setVoiceToneDesc] = useState('อบอุ่น อ่อนโยน ชวนผ่อนคลายและคลายกังวล');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'นิทาน / เรื่องสั้น',
    'จิตวิทยา / กำลังใจ',
  ]);
  const [availableDays, setAvailableDays] = useState<string[]>(['เสาร์', 'อาทิตย์']);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([
    '14:00 - 15:30 น.',
    '18:30 - 19:30 น.',
  ]);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Persistent storage key for volunteer sample voice recording
  const STORAGE_KEY_VOICE_SAMPLE = 'readheal_volunteer_voice_sample';

  // Voice recording test state with real MediaRecorder and Base64 Data URL
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [hasRecordedSample, setHasRecordedSample] = useState(false);
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [registeredProfile, setRegisteredProfile] = useState<VolunteerProfile | null>(null);

  // Restore recorded sample on mount from IndexedDB / localStorage so refresh never loses it!
  useEffect(() => {
    let isMounted = true;
    async function restoreStoredSample() {
      try {
        // 1. Check localStorage first
        const cached = safeLoadFromLocalStorage<{ audioUrl: string; duration: number } | null>(
          STORAGE_KEY_VOICE_SAMPLE,
          null
        );
        if (cached?.audioUrl) {
          let resolvedUrl = cached.audioUrl;
          if (resolvedUrl.startsWith('indexeddb://')) {
            const fromDb = await getAudioFromIndexedDB('volunteer_temp_voice_sample');
            if (fromDb) resolvedUrl = fromDb;
          }
          if (isMounted && resolvedUrl) {
            setRecordedAudioDataUrl(resolvedUrl);
            setHasRecordedSample(true);
            setRecordTimer(cached.duration || 15);
            return;
          }
        }

        // 2. Check IndexedDB directly
        const fromDb = await getAudioFromIndexedDB('volunteer_temp_voice_sample');
        if (isMounted && fromDb) {
          setRecordedAudioDataUrl(fromDb);
          setHasRecordedSample(true);
          setRecordTimer(15);
        }
      } catch (err) {
        console.warn('Failed restoring recorded sample:', err);
      }
    }

    restoreStoredSample();

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
      if (calculatedAge > 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
  };

  const toggleSpecialty = (item: string) => {
    if (selectedSpecialties.includes(item)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleHospital = (hospitalName: string) => {
    if (selectedHospitals.includes(hospitalName)) {
      setSelectedHospitals(selectedHospitals.filter((h) => h !== hospitalName));
    } else {
      setSelectedHospitals([...selectedHospitals, hospitalName]);
    }
  };

  const selectDistrictHospitals = (district: string) => {
    const districtHospitals = CHONBURI_HOSPITALS.filter(h => h.district === district).map(h => h.name);
    const newSelection = Array.from(new Set([...selectedHospitals, ...districtHospitals]));
    setSelectedHospitals(newSelection);
  };

  const selectAllHospitals = () => {
    setSelectedHospitals(CHONBURI_HOSPITALS.map(h => h.name));
  };

  const clearAllHospitals = () => {
    setSelectedHospitals([]);
  };

  const toggleTimeSlot = (slot: string) => {
    if (availableTimeSlots.includes(slot)) {
      setAvailableTimeSlots(availableTimeSlots.filter((s) => s !== slot));
    } else {
      setAvailableTimeSlots([...availableTimeSlots, slot]);
    }
  };

  // Real Web Audio API / MediaRecorder recording start
  const startVoiceRecording = async () => {
    setRecordingError(null);
    healingSound.playChime(660, 0.5);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่รองรับ Microphone / MediaDevices API');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Select supported mimeType
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Clean up stream tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        try {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          let dataUrl = '';
          if (blob.size > 0) {
            dataUrl = await readFileAsBase64DataUrl(blob);
          } else {
            dataUrl = generatePermanentWavDataUrl('bedside_whisper', Math.max(5, recordTimer || 12));
          }

          setRecordedAudioDataUrl(dataUrl);
          setHasRecordedSample(true);
          healingSound.playChime(528, 0.8);

          // Save to IndexedDB and localStorage for persistent browser reload resilience
          await saveAudioToIndexedDB('volunteer_temp_voice_sample', dataUrl);
          safeSaveToLocalStorage(STORAGE_KEY_VOICE_SAMPLE, {
            audioUrl: dataUrl,
            duration: recordTimer || 12,
            recordedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Error saving recorded voice sample:', err);
          const fallbackWav = generatePermanentWavDataUrl('bedside_whisper', 12);
          setRecordedAudioDataUrl(fallbackWav);
          setHasRecordedSample(true);
          await saveAudioToIndexedDB('volunteer_temp_voice_sample', fallbackWav);
          safeSaveToLocalStorage(STORAGE_KEY_VOICE_SAMPLE, {
            audioUrl: fallbackWav,
            duration: 12,
            recordedAt: new Date().toISOString(),
          });
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordTimer(0);
      setHasRecordedSample(false);

      const interval = window.setInterval(() => {
        setRecordTimer((prev) => {
          if (prev >= 60) {
            stopVoiceRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      timerIntervalRef.current = interval;
    } catch (err: any) {
      console.warn('Microphone error or permission denied:', err);
      // Graceful fallback simulation so the user can test even without mic hardware
      setRecordingError('ไม่พบไมโครโฟนหรือการอนุญาตถูกปฏิเสธ ระบบเปิดโหมดทดสอบเสียงอ่านบำบัดให้โดยอัตโนมัติ');
      setIsRecording(true);
      setRecordTimer(0);
      setHasRecordedSample(false);

      const interval = window.setInterval(() => {
        setRecordTimer((prev) => {
          if (prev >= 15) {
            stopVoiceRecordingSimulated();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
      timerIntervalRef.current = interval;
    }
  };

  const stopVoiceRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (!hasRecordedSample) {
      stopVoiceRecordingSimulated();
    }
  };

  const stopVoiceRecordingSimulated = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    healingSound.playChime(528, 0.8);

    const fallbackWav = generatePermanentWavDataUrl('bedside_whisper', Math.max(5, recordTimer || 12));
    setRecordedAudioDataUrl(fallbackWav);
    setHasRecordedSample(true);

    await saveAudioToIndexedDB('volunteer_temp_voice_sample', fallbackWav);
    safeSaveToLocalStorage(STORAGE_KEY_VOICE_SAMPLE, {
      audioUrl: fallbackWav,
      duration: recordTimer || 12,
      recordedAt: new Date().toISOString(),
    });
  };

  const handleResetRecordedSample = async () => {
    healingSound.playClickBeep();
    setHasRecordedSample(false);
    setRecordedAudioDataUrl(null);
    setRecordTimer(0);
    setRecordingError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_VOICE_SAMPLE);
      await deleteAudioFromIndexedDB('volunteer_temp_voice_sample');
    } catch (e) {
      console.warn('Error deleting temp sample:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!firstName || !lastName || !dob || !phone) {
      alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ชื่อ-นามสกุล, วันเดือนปีเกิด, และเบอร์โทร)');
      return;
    }
    if (!email || !email.includes('@')) {
      alert('กรุณากรอกอีเมลสำหรับเข้าสู่ระบบให้ถูกต้อง');
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      alert('กรุณากำหนดรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }
    if (!agreementChecked) {
      alert('กรุณายอมรับข้อตกลงและจรรยาบรรณจิตอาสาโรงพยาบาล');
      return;
    }
    if (selectedHospitals.length === 0) {
      alert('กรุณาเลือกโรงพยาบาลในจังหวัดชลบุรีที่ท่านสะดวกปฏิบัติหน้าที่อย่างน้อย 1 แห่ง');
      return;
    }

    healingSound.playChime(784, 1.2);

    const generatedZoneDesc = selectedHospitals.length === 1
      ? `${selectedHospitals[0]} (จ.ชลบุรี)`
      : selectedHospitals.length <= 3
      ? selectedHospitals.join(', ')
      : `${selectedHospitals[0]} และอีก ${selectedHospitals.length - 1} แห่ง (จ.ชลบุรี)`;

    const newVolunteer: VolunteerProfile = {
      id: `vol-${Date.now()}`,
      fullName: `${firstName} ${lastName}`.trim(),
      nickname: nickname || firstName,
      dob,
      age: Number(age) || 25,
      gender,
      phone,
      email: email.trim().toLowerCase(),
      password: password.trim(),
      hospitalZone: generatedZoneDesc,
      availableHospitals: selectedHospitals,
      bio: bio || 'มีความตั้งใจที่จะนำเสียงอ่านอบอุ่นมาช่วยปลอบประโลมและสร้างรอยยิ้มให้ผู้ป่วยข้างเตียงในโรงพยาบาลจังหวัดชลบุรี',
      readingStyle,
      voiceToneDesc,
      voiceSampleDuration: recordTimer > 0 ? `00:${recordTimer < 10 ? '0' + recordTimer : recordTimer}` : '00:20',
      voiceSampleAudioUrl: recordedAudioDataUrl || undefined,
      experienceYears: 1,
      rating: 5.0,
      reviewCount: 0,
      totalReadHours: 0,
      totalStoriesRead: 0,
      badge: 'ผู้สมัครจิตอาสาใหม่ (รออนุมัติ)',
      availableDays: availableDays.length > 0 ? availableDays : ['เสาร์', 'อาทิตย์'],
      availableTimeSlots: availableTimeSlots.length > 0 ? availableTimeSlots : ['14:00 - 15:30 น.'],
      avatar: gender === 'female' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      status: 'pending',
      approvalStatus: 'pending',
      registeredAt: new Date().toISOString(),
      specialties: selectedSpecialties.length > 0 ? selectedSpecialties : ['นิทาน / เรื่องสั้น'],
    };

    // Permanently save audio sample with new volunteer id into IndexedDB
    if (recordedAudioDataUrl) {
      saveAudioToIndexedDB(newVolunteer.id, recordedAudioDataUrl).catch(() => {});
    }

    setRegisteredProfile(newVolunteer);
    setSubmitted(true);
    onRegisterSuccess(newVolunteer);
  };

  const sampleReadingText = `"กาลครั้งหนึ่งนานมาแล้ว ท่ามกลางสวนดอกไม้หลังตึกพักฟื้น มีสายลมอ่อนโยนพัดพากลิ่นหอมของดอกมะลิลอยมาเบาๆ ขอให้ทุกท่านหลับตาลง ผ่อนคลาย และพักผ่อนให้สบายใจนะคะ..."`;

  if (submitted && registeredProfile) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 text-center animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 sm:p-9 border border-amber-200/80 shadow-xl shadow-amber-500/5 text-left">
          
          {/* Status Icon & Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>🟡 รอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              ลงทะเบียนสำเร็จและส่งใบสมัครเรียบร้อยแล้ว
            </h2>
          </div>

          {/* REQUIRED CONFIRMATION BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-orange-500/10 border-2 border-amber-400/80 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 mb-1">
                  ส่งใบสมัครเรียบร้อยแล้ว อยู่ระหว่างการพิจารณาคุณสมบัติและคลิปเสียงอ่านโดยผู้ดูแลระบบ (คาดว่าจะทราบผลภายใน 1-3 วัน)
                </h4>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  ทีมงานผู้ดูแลระบบส่วนกลางจะรับฟังคลิปเสียงอ่านตัวอย่างของคุณ พร้อมตรวจสอบความพร้อมในการปฏิบัติหน้าที่ตามรายชื่อโรงพยาบาลในจังหวัดชลบุรีที่ท่านเลือกไว้ เมื่อได้รับการอนุมัติแล้ว ท่านจะสามารถเข้าสู่ระบบจิตอาสาเพื่อเริ่มปฏิบัติงานได้ทันที
                </p>
              </div>
            </div>
          </div>

          {/* Volunteer card summary */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={registeredProfile.avatar || undefined} 
                alt={registeredProfile.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 truncate">{registeredProfile.fullName}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium shrink-0">
                    {registeredProfile.nickname}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {registeredProfile.email} • {registeredProfile.phone}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                    สถานะ: รอการอนุมัติ (Pending)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    อายุ {registeredProfile.age} ปี
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-2">
              <p><strong className="text-slate-700">สไตล์การอ่าน:</strong> {registeredProfile.readingStyle}</p>
              <p><strong className="text-slate-700">หมวดที่ถนัด:</strong> {registeredProfile.specialties.join(', ')}</p>
              {registeredProfile.availableHospitals && registeredProfile.availableHospitals.length > 0 && (
                <div>
                  <strong className="text-slate-700 block mb-1">
                    โรงพยาบาลที่เลือก ({registeredProfile.availableHospitals.length} แห่ง):
                  </strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {registeredProfile.availableHospitals.map(h => (
                      <span key={h} className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Voice Sample Preview if recorded */}
            {registeredProfile.voiceSampleAudioUrl && (
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  คลิปเสียงอ่านตัวอย่างที่ส่งให้ผู้ดูแลระบบตรวจสอบ:
                </span>
                <Html5AudioPlayer 
                  audioUrl={registeredProfile.voiceSampleAudioUrl}
                  title="คลิปเสียงอ่านตัวอย่างของคุณ (Audition Sample)"
                  subtitle={`ความยาว ${registeredProfile.voiceSampleDuration || '00:20'}`}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                healingSound.playClickBeep();
                if (onOpenStatusCheck) {
                  onOpenStatusCheck(registeredProfile.email);
                } else if (onCancel) {
                  onCancel();
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>ตรวจสอบสถานะการอนุมัติ (Check Status)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                healingSound.playClickBeep();
                if (onResetToLanding) {
                  onResetToLanding();
                } else {
                  onCancel();
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าเลือกบทบาท</span>
            </button>
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

      {/* Title & Introduction banner */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-500/15 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-medium mb-3">
            <UserCheck className="w-3.5 h-3.5" />
            <span>แบบฟอร์มลงทะเบียนและสร้างโปรไฟล์จิตอาสา</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            ร่วมส่งต่อพลังเสียงอ่านบำบัดใจ (ReadHeal Volunteer)
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            เสียงของคุณมีคุณค่าในการเยียวยาจิตใจผู้ป่วยข้างเตียง กรอกข้อมูลส่วนตัว 
            สไตล์การอ่าน และทดสอบบันทึกเสียงเพื่อสร้างประวัติจิตอาสาในระบบ
          </p>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8">
        
        {/* Section 1: ข้อมูลส่วนตัว (Personal Data) */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              ข้อมูลส่วนตัว (Personal Information)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อจริง (First Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="เช่น พิมลวรรณ, กฤษณะ"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                นามสกุล (Last Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="เช่น สุขประเสริฐ, พิชิตพงศ์"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อเล่น / นามแฝงที่ใช้เรียก (Nickname)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น ครูนิ่ม, น้องมายด์, กานต์"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              />
            </div>

            {/* Date of Birth & Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อายุ (ปี)
                </label>
                <input
                  type="number"
                  min="15"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="คำนวณอัตโนมัติ"
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เพศ (Gender)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female', label: 'หญิง (Female)' },
                  { id: 'male', label: 'ชาย (Male)' },
                  { id: 'other', label: 'อื่นๆ / หลากหลาย' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id as Gender)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all text-center ${
                      gender === item.id
                        ? 'bg-sky-50 border-sky-400 text-sky-700 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                อีเมลสำหรับเข้าสู่ระบบ (Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">อย่างน้อย 6 ตัวอักษร</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  ยืนยันรหัสผ่าน (Confirm Password) <span className="text-rose-500">*</span>
                </label>
                {password && confirmPassword && (
                  <span className={`text-[10px] font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {password === confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="กรอกรหัสผ่านเดิมอีกครั้งเพื่อยืนยัน"
                  className={`w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-3 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100 bg-rose-50/20'
                      : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Error Banner if any */}
            {passwordError && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Chon Buri Multi-Hospital Selection */}
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  โรงพยาบาลในจังหวัดชลบุรีที่สะดวกปฏิบัติหน้าที่ (เลือกได้หลายแห่ง) *
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    selectedHospitals.length > 0 
                      ? 'bg-sky-100 text-sky-800' 
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    เลือกแล้ว {selectedHospitals.length} จาก {CHONBURI_HOSPITALS.length} แห่ง
                  </span>
                  <button
                    type="button"
                    onClick={selectAllHospitals}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllHospitals}
                    className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    ล้าง
                  </button>
                </div>
              </div>

              {/* District Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-xs text-slate-500 mr-1">กรองตามอำเภอ:</span>
                <button
                  type="button"
                  onClick={() => setDistrictFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    districtFilter === 'all'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({CHONBURI_HOSPITALS.length})
                </button>
                {CHONBURI_DISTRICTS.map((district) => {
                  const count = CHONBURI_HOSPITALS.filter(h => h.district === district).length;
                  return (
                    <button
                      key={district}
                      type="button"
                      onClick={() => setDistrictFilter(district)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        districtFilter === district
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {district} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Hospital Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 p-1 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                {CHONBURI_HOSPITALS
                  .filter(h => districtFilter === 'all' || h.district === districtFilter)
                  .map((hospital) => {
                    const isSelected = selectedHospitals.includes(hospital.name);
                    return (
                      <div
                        key={hospital.id}
                        onClick={() => toggleHospital(hospital.name)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-sky-400 bg-white shadow-2xs ring-2 ring-sky-200/70'
                            : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-sky-500 text-white shadow-2xs'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {hospital.name}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                              hospital.ownership === 'รัฐบาล'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {hospital.ownership || (hospital.type === 'private' ? 'เอกชน' : 'รัฐบาล')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                              {hospital.district}
                            </span>
                            <span>•</span>
                            <span>{hospital.zone}</span>
                            {hospital.beds && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{hospital.beds} เตียง</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {selectedHospitals.length === 0 && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                  ⚠️ กรุณาเลือกโรงพยาบาลในจังหวัดชลบุรีอย่างน้อย 1 แห่ง
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: รายละเอียดโปรไฟล์การอ่าน (Reading Profile & Style) */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              รายละเอียดโปรไฟล์ & สไตล์การอ่าน (Reading Profile)
            </h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Reading Style selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                สไตล์หรือเอกลักษณ์น้ำเสียงของคุณ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    title: 'เสียงนุ่มนวล อบอุ่น',
                    desc: 'จังหวะช้า ฟังสบาย เหมาะกับผู้ป่วยพักผ่อนและก่อนนอน',
                  },
                  {
                    title: 'สดใส มีชีวิตชีวา',
                    desc: 'สนุกสนาน เล่นเสียงตัวละคร เหมาะกับผู้ป่วยเด็กและเรื่องสั้น',
                  },
                  {
                    title: 'สงบเย็น แผ่วเบา',
                    desc: 'ดั่งสายน้ำใส ช่วยคลายความเจ็บปวดและฝึกสติสมาธิ',
                  },
                ].map((style) => (
                  <div
                    key={style.title}
                    onClick={() => {
                      setReadingStyle(style.title);
                      setVoiceToneDesc(style.desc);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      readingStyle === style.title
                        ? 'border-sky-400 bg-sky-50/70 shadow-xs ring-2 ring-sky-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-sm text-slate-800 mb-1">{style.title}</p>
                    <p className="text-xs text-slate-500 leading-normal">{style.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Specialties */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                หมวดหมู่เรื่องเล่าที่ถนัดหรือสนใจอ่าน (เลือกได้หลายข้อ)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'นิทาน / เรื่องสั้น',
                  'พัฒนาตนเอง',
                  'จิตวิทยา / กำลังใจ',
                  'วรรณกรรม',
                  'ความรู้ทั่วไป & สุขภาพ',
                  'ศาสนา / ธรรมะบำบัด',
                ].map((item) => {
                  const isChecked = selectedSpecialties.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSpecialty(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isChecked
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                แนะนำตัวสั้นๆ และแรงบันดาลใจในการเป็นจิตอาสา (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="บอกเล่าประสบการณ์ ความสุขที่อยากส่งต่อ หรือเหตุผลที่คุณอยากอ่านหนังสือให้ผู้ป่วยฟัง..."
                className="w-full text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              />
            </div>

            {/* Available Days & Time Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  วันที่สะดวกปฏิบัติหน้าที่
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  ช่วงเวลาที่สะดวก
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    '10:00 - 11:30 น. (ช่วงสาย)',
                    '14:00 - 15:30 น. (ช่วงบ่าย)',
                    '18:30 - 19:30 น. (ช่วงก่อนนอน)',
                  ].map((slot) => {
                    const isSelected = availableTimeSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleTimeSlot(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '○ '} {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: บันทึกทดสอบเสียงอ่าน (Voice Sample Test) */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              ทดสอบบันทึกเสียงอ่านตัวอย่าง (Voice Sample Recording)
            </h3>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              ลองอ่านข้อความตัวอย่างด้านล่างนี้ด้วยน้ำเสียงผ่อนคลาย เพื่อให้ผู้ป่วยและทีมงานรับฟังตัวอย่างเสียงของคุณ ระบบจะบันทึกเสียงผ่านไมโครโฟนและจัดเก็บในเครื่องอย่างถาวร:
            </p>

            {/* Prompt reading box */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 text-sm italic text-slate-700 shadow-2xs font-serif leading-relaxed">
              {sampleReadingText}
            </div>

            {/* Error / Notice banner if any */}
            {recordingError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{recordingError}</span>
              </div>
            )}

            {/* Active Recording State */}
            {isRecording && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-900">
                      กำลังบันทึกเสียงสดผ่านไมโครโฟน...
                    </p>
                    <p className="text-[11px] text-rose-700 font-mono mt-0.5">
                      ระยะเวลาบันทึก: 00:{recordTimer < 10 ? `0${recordTimer}` : recordTimer} วินาที (สูงสุด 60 วินาที)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>หยุดการบันทึก ({recordTimer}s)</span>
                </button>
              </div>
            )}

            {/* Recorded State with HTML5 Audio Player & Persistence confirmation */}
            {hasRecordedSample && recordedAudioDataUrl && !isRecording && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      บันทึกเสียงอ่านตัวอย่างสำเร็จแล้ว ({formatDurationSeconds(recordTimer || 12)}) • จัดเก็บใน IndexedDB เรียบร้อย
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    พร้อมฟัง & ถาวร
                  </span>
                </div>

                {/* Functional HTML5 Audio Player Preview */}
                <div className="rounded-2xl overflow-hidden border border-sky-200 bg-white shadow-xs">
                  <Html5AudioPlayer
                    audioUrl={recordedAudioDataUrl}
                    title="ตัวอย่างเสียงอ่านของคุณ (Voice Sample Preview)"
                    subtitle={`ความยาว ${formatDurationSeconds(recordTimer || 12)} • บันทึกเป็น Base64 Data URL ปลอดภัยในเครื่อง`}
                  />
                </div>

                {/* Re-record & Reset Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>อัดเสียงทับใหม่ (Re-record)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetRecordedSample}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium text-xs flex items-center gap-1 transition-all cursor-pointer"
                      title="ลบไฟล์เสียงตัวอย่างนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>ลบเสียง</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    💡 รีเฟรชหน้าเบราว์เซอร์ ไฟล์เสียงนี้จะไม่สูญหาย
                  </span>
                </div>
              </div>
            )}

            {/* Idle State: Not recording & No sample yet */}
            {!isRecording && (!hasRecordedSample || !recordedAudioDataUrl) && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>เริ่มบันทึกเสียงอ่านตัวอย่าง (Record Voice)</span>
                </button>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-sky-500" />
                  <span>แนะนำให้อัดคลิปสั้นๆ 10-30 วินาที ด้วยน้ำเสียงที่อบอุ่น ผ่อนคลาย</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: จรรยาบรรณจิตอาสาและการยืนยัน */}
        <div className="pt-2">
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                ข้าพเจ้าขอปฏิญาณว่าจะปฏิบัติหน้าที่จิตอาสาอ่านหนังสือข้างเตียงด้วยความเมตตา 
                เคารพความเป็นส่วนตัวของผู้ป่วย ปฏิบัติตามมาตรการป้องกันการติดเชื้อของโรงพยาบาลอย่างเคร่งครัด 
                และมุ่งมั่นส่งมอบกำลังใจที่ดีที่สุดให้แก่ผู้รับบริการทุกท่าน
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-semibold text-sm shadow-md shadow-sky-500/20 hover:shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              ยืนยันการลงทะเบียนจิตอาสา
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
