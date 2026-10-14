import React, { useState, useRef } from 'react';
import { 
  AudioSubmission, 
  Category, 
  VolunteerProfile, 
  ServiceEvaluation, 
  VolunteerWarning, 
  VolunteerAvailabilitySlot, 
  CertificateRequest,
  BookingRequest
} from '../types';
import { 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Play, 
  Sparkles, 
  Plus, 
  Trash2, 
  FileText, 
  Building2, 
  Heart, 
  RotateCcw, 
  Volume2, 
  ArrowLeft,
  Award,
  Star,
  Calendar,
  AlertTriangle,
  Send,
  Eye,
  Check,
  ShieldCheck,
  Headphones,
  Mic,
  Square,
  Radio,
  CalendarCheck,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { CHONBURI_HOSPITALS, COMMON_DISEASE_SUGGESTIONS, COMMON_SYMPTOM_SUGGESTIONS } from '../data/chonburiHospitals';
import { Html5AudioPlayer } from './Html5AudioPlayer';
import { getAudioFileDuration, formatFileSize, generateHealingWavAudioUrl, formatDurationSeconds } from '../utils/audioGenerator';
import { healingSound } from '../utils/audioSynthesizer';
import { saveAudioToIndexedDB, readFileAsBase64DataUrl, generatePermanentWavDataUrl } from '../utils/persistentStorage';
import { CancellationModal } from './CancellationModal';

interface VolunteerAudioPortalProps {
  volunteer?: VolunteerProfile | null;
  submissions: AudioSubmission[];
  categories: Category[];
  onSubmitAudio: (submission: AudioSubmission) => void;
  onDeleteSubmission: (id: string) => void;
  onPlayInBedsidePlayer?: (submission: AudioSubmission) => void;
  onResetToLanding?: () => void;
  evaluations?: ServiceEvaluation[];
  warnings?: VolunteerWarning[];
  onAcknowledgeWarning?: (id: string) => void;
  availabilitySlots?: VolunteerAvailabilitySlot[];
  onAddAvailabilitySlot?: (slot: Omit<VolunteerAvailabilitySlot, 'id' | 'createdAt' | 'isBooked'>) => void;
  onDeleteAvailabilitySlot?: (id: string) => void;
  certificateRequests?: CertificateRequest[];
  onRequestCertificate?: (request: Omit<CertificateRequest, 'id' | 'status' | 'createdAt'>) => void;
  onViewCertificate?: (certificate: CertificateRequest) => void;
  onsiteCompletedCount?: number;
  bookings?: BookingRequest[];
  onCancelBooking?: (bookingId: string, reason: string) => void;
  activeSubTab?: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability';
  onSubTabChange?: (tab: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability') => void;
}

export const VolunteerAudioPortal: React.FC<VolunteerAudioPortalProps> = ({
  volunteer,
  submissions,
  categories,
  onSubmitAudio,
  onDeleteSubmission,
  onPlayInBedsidePlayer,
  onResetToLanding,
  evaluations = [],
  warnings = [],
  onAcknowledgeWarning,
  availabilitySlots = [],
  onAddAvailabilitySlot,
  onDeleteAvailabilitySlot,
  certificateRequests = [],
  onRequestCertificate,
  onViewCertificate,
  onsiteCompletedCount = 3,
  bookings = [],
  onCancelBooking,
  activeSubTab,
  onSubTabChange,
}) => {
  // Active sub-views (controlled or internal)
  const [internalTab, setInternalTab] = useState<'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability'>('schedule');
  const activeTab = activeSubTab !== undefined ? activeSubTab : internalTab;
  const setActiveTab = (tab: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability') => {
    setInternalTab(tab);
    onSubTabChange?.(tab);
  };

  // Schedule modal & filter state
  const [cancellingBooking, setCancellingBooking] = useState<BookingRequest | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('confirmed');

  // Assigned bookings calculation for this volunteer
  const assignedBookings = bookings.filter((b) => 
    !volunteer || b.volunteerId === volunteer.id || b.volunteerName === volunteer.fullName || (!b.volunteerId && b.status === 'confirmed')
  );
  const confirmedBookings = assignedBookings.filter((b) => b.status === 'confirmed');

  // Filter state for status list
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number>(180);
  const [audioDurationFormatted, setAudioDurationFormatted] = useState<string>('03:00');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [fileFormatError, setFileFormatError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [thaiTitle, setThaiTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-psychology');
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([
    'โรงพยาบาลชลบุรี',
    'โรงพยาบาลมหาวิทยาลัยบูรพา'
  ]);
  const [targetConditions, setTargetConditions] = useState<string[]>([
    'พักฟื้นหลังการผ่าตัด',
    'นอนไม่ค่อยหลับ วิตกกังวล'
  ]);
  const [audioTone, setAudioTone] = useState('อบอุ่น นุ่มนวล ผ่อนคลาย');
  const [excerpt, setExcerpt] = useState('');
  const [fullScript, setFullScript] = useState('');
  const [volunteerNameInput, setVolunteerNameInput] = useState(volunteer?.fullName || 'คุณกิตติศักดิ์ เมตตาธรรม');
  const [volunteerNicknameInput, setVolunteerNicknameInput] = useState(volunteer?.nickname || 'พี่กิต');

  // Notification message
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Certificate Request Form State
  const [certFullNameThai, setCertFullNameThai] = useState(volunteer?.fullName || 'นายกิตติศักดิ์ เมตตาธรรม');
  const [certFullNameEn, setCertFullNameEn] = useState('Mr. Kittisak Mettatham');
  const [certEmail, setCertEmail] = useState(volunteer?.email || 'kittisak.vol@example.com');
  const [certPhone, setCertPhone] = useState(volunteer?.phone || '081-234-5678');
  const [certPurpose, setCertPurpose] = useState('ยื่นประกอบการสมัครสอบทุนการศึกษาและบันทึกกิจกรรมจิตอาสา กยศ.');

  // Availability Form State
  const [slotDate, setSlotDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [slotStartTime, setSlotStartTime] = useState('09:30');
  const [slotEndTime, setSlotEndTime] = useState('11:30');
  const [slotHospital, setSlotHospital] = useState('โรงพยาบาลชลบุรี');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Microphone Live Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      setFileFormatError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const dataUrl = await readFileAsBase64DataUrl(audioBlob);
          const duration = Math.max(1, recordingSeconds);
          setAudioUrl(dataUrl);
          setAudioDurationSeconds(duration);
          setAudioDurationFormatted(formatDurationSeconds(duration));
          setFileSizeFormatted(formatFileSize(audioBlob.size));
          setSelectedFile(new File([audioBlob], `recorded_reading_${Date.now()}.mp3`, { type: 'audio/mp3' }));
          if (!title) setTitle(`เสียงบันทึกสดข้างเตียง (${new Date().toLocaleTimeString('th-TH')})`);
        } catch (err) {
          console.warn('Recording processing error:', err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      healingSound.playClickBeep();

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setFileFormatError('ไม่สามารถเข้าถึงไมโครโฟนได้ โปรดอนุญาตสิทธิ์ไมโครโฟนในเบราว์เซอร์ หรืออัปโหลดไฟล์ MP3 จากเครื่องแทน');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      healingSound.playChime(640, 0.6);
    }
  };

  // Handle file selection from disk with strict MP3 validation
  const processSelectedFile = async (file: File) => {
    setFileFormatError(null);

    // Verify .mp3 extension or audio/mpeg mime
    const isMp3Extension = file.name.toLowerCase().endsWith('.mp3');
    const isAudioMime = file.type.includes('audio') || file.type.includes('mpeg') || file.type.includes('mp3');

    if (!isMp3Extension && !isAudioMime) {
      setFileFormatError('ระบบรองรับเฉพาะไฟล์เสียงนามสกุล .mp3 เท่านั้น โปรดเลือกไฟล์ .mp3 ที่ถูกต้อง');
      healingSound.playClickBeep();
      return;
    }

    setIsProcessingAudio(true);
    healingSound.playClickBeep();

    try {
      const { durationSeconds, durationFormatted, url } = await getAudioFileDuration(file);
      setSelectedFile(file);
      setAudioDurationSeconds(durationSeconds);
      setAudioDurationFormatted(durationFormatted);
      setAudioUrl(url);
      setFileSizeFormatted(formatFileSize(file.size));

      if (!title) {
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(rawName);
      }
    } catch {
      // Fallback synthesizer
      const fallbackUrl = generateHealingWavAudioUrl('gentle_chime', 45);
      setSelectedFile(file);
      setAudioDurationSeconds(180);
      setAudioDurationFormatted('03:00');
      setAudioUrl(fallbackUrl);
      setFileSizeFormatted(formatFileSize(file.size || 2500000));
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Quick Demo Audio Loader (generates mock MP3 waveform)
  const handleLoadDemoAudio = (mood: 'piano' | 'singing_bowl' | 'nature' | 'gentle_chime') => {
    healingSound.playClickBeep();
    const mockTitles: Record<string, { title: string; category: string; tone: string; excerpt: string; author: string }> = {
      piano: {
        title: 'สายลมและดวงดาวแห่งความสงบ',
        category: 'cat-dharma',
        tone: 'สงบเย็น แผ่วเบา ช่วยให้นอนหลับ',
        excerpt: 'เรื่องราวและบทนำผ่อนคลายกล้ามเนื้อทีละส่วน ผสานจังหวะลมหายใจเข้าลึก เพื่อช่วยให้ผู้ป่วยนอนหลับง่ายขึ้นในหอผู้ป่วย',
        author: 'พระอาจารย์ชยสาโร (ดัดแปลงเพื่อผู้ป่วย)',
      },
      singing_bowl: {
        title: 'ระฆังแห่งสติ ณ ห้องพักฟื้น',
        category: 'cat-dharma',
        tone: 'สงบ นิ่งลึก ปล่อยวางความกังวล',
        excerpt: 'เสียงระฆังบำบัดใจสลับเสียงอ่านเพื่อฝึกสมาธิเบื้องต้น ช่วยลดความดันโลหิตและคลายความวิตกกังวลก่อนการรักษา',
        author: 'นพ. วิจารย์ เมตตากรณ์',
      },
      nature: {
        title: 'ป่าไผ่และลำธารแห่งกำลังใจ',
        category: 'cat-psychology',
        tone: 'สดชื่น มีชีวิตชีวา นุ่มนวล',
        excerpt: 'เสียงธรรมชาติและเรื่องเล่าเสริมพลังบวก ชวนจิตใจล่องลอยสู่แมกไม้เขียวขจี เติมเต็มพลังในการฟื้นฟูร่างกาย',
        author: 'รศ. ดร. นภาพร สุขจิต',
      },
      gentle_chime: {
        title: 'กระต่ายน้อยกับการเดินทางค้นหาเมล็ดทานตะวัน',
        category: 'cat-fairy-tales',
        tone: 'สดใส อบอุ่น มีชีวิตชีวา',
        excerpt: 'นิทานเสียงสร้างรอยยิ้มสำหรับเด็กๆ และผู้สูงอายุ เรื่องราวของมิตรภาพและการแบ่งปันที่ไม่รู้จบ',
        author: 'ครูปรีชา รักษ์เด็ก',
      },
    };

    const config = mockTitles[mood];
    const generatedUrl = generateHealingWavAudioUrl(mood, 35);
    const mockFile = new File(['mock audio data'], `${mood}_reading_sample.mp3`, { type: 'audio/mp3' });

    setSelectedFile(mockFile);
    setAudioUrl(generatedUrl);
    setAudioDurationSeconds(210);
    setAudioDurationFormatted('03:30');
    setFileSizeFormatted('3.2 MB');
    setTitle(config.title);
    setThaiTitle(config.title);
    setCategoryId(config.category);
    setAudioTone(config.tone);
    setExcerpt(config.excerpt);
    setAuthor(config.author);
    setFullScript(config.excerpt + '\n\nหายใจเข้าลึกๆ ให้ร่างกายผ่อนคลาย... ทุกการเต้นของหัวใจคือสัญญาณแห่งการเยียวยา...');
    setFileFormatError(null);
  };

  // Submit Handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่อเรื่องของไฟล์เสียง');
      return;
    }
    if (!selectedFile && !audioUrl) {
      alert('กรุณาเลือกไฟล์เสียง MP3 เพื่ออัปโหลด');
      return;
    }

    const matchedCategory = categories.find((c) => c.id === categoryId);

    const newSubmission: AudioSubmission = {
      id: `SUB-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      thaiTitle: thaiTitle.trim() || title.trim(),
      author: author.trim() || volunteerNameInput,
      volunteerId: volunteer?.id || 'vol-1',
      volunteerName: volunteerNameInput,
      volunteerNickname: volunteerNicknameInput,
      volunteerAvatar: volunteer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      categoryId,
      categoryName: matchedCategory?.name || 'บทความทั่วไป',
      targetHospitals: selectedHospitals,
      targetConditions,
      audioTone,
      excerpt: excerpt.trim() || 'เรื่องเล่าเสียงอ่านบำบัดใจเพื่อผู้ป่วยข้างเตียงในโรงพยาบาล',
      fullScript: fullScript.trim() || excerpt.trim(),
      fileName: selectedFile?.name || `${title.replace(/\s+/g, '_')}.mp3`,
      fileSize: selectedFile?.size || 3500000,
      fileSizeFormatted: fileSizeFormatted || '3.5 MB',
      audioUrl: audioUrl || generateHealingWavAudioUrl('piano', 40),
      durationSeconds: audioDurationSeconds,
      durationFormatted: audioDurationFormatted,
      uploadedAt: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.',
      status: 'pending',
    };

    // Permanently back up audio into IndexedDB
    if (newSubmission.audioUrl) {
      saveAudioToIndexedDB(newSubmission.id, newSubmission.audioUrl).catch(() => {});
    }

    onSubmitAudio(newSubmission);
    setSuccessToast(`อัปโหลดไฟล์เสียง "${newSubmission.title}" สำเร็จ! ส่งเข้าสู่คิวรออนุมัติของแอดมินแล้ว`);

    // Reset Form
    setSelectedFile(null);
    setAudioUrl('');
    setTitle('');
    setThaiTitle('');
    setAuthor('');
    setExcerpt('');
    setFullScript('');
    setActiveTab('status');

    setTimeout(() => {
      setSuccessToast(null);
    }, 6000);
  };

  // Re-upload from rejected item
  const handlePrepareReUpload = (rejectedSub: AudioSubmission) => {
    healingSound.playClickBeep();
    setTitle(rejectedSub.title + ' (ฉบับแก้ไข)');
    setThaiTitle(rejectedSub.thaiTitle || rejectedSub.title);
    setAuthor(rejectedSub.author);
    setCategoryId(rejectedSub.categoryId);
    setAudioTone(rejectedSub.audioTone);
    setExcerpt(rejectedSub.excerpt);
    setFullScript(rejectedSub.fullScript);
    setSelectedHospitals(rejectedSub.targetHospitals);
    setTargetConditions(rejectedSub.targetConditions);
    setActiveTab('upload');
  };

  // Add Availability Slot Handler
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) return;
    if (onAddAvailabilitySlot) {
      healingSound.playChime(640, 0.6);
      onAddAvailabilitySlot({
        volunteerId: volunteer?.id || 'vol-1',
        volunteerName: volunteer?.fullName || 'คุณกิตติศักดิ์ เมตตาธรรม',
        volunteerNickname: volunteer?.nickname || 'พี่กิต',
        volunteerAvatar: volunteer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        hospitalName: slotHospital,
        preferredCategories: [categories[0]?.name || 'จิตวิทยาและสร้างกำลังใจ'],
      });
      setSuccessToast(`เพิ่มช่วงเวลาว่างวันที่ ${slotDate} (${slotStartTime} - ${slotEndTime} น.) เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Certificate Request Submit
  const handleRequestCertificateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFullNameThai.trim() || !certEmail.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล และอีเมลเพื่อรับเกียรติบัตร');
      return;
    }

    if (onRequestCertificate) {
      healingSound.playChime(720, 0.8);
      onRequestCertificate({
        volunteerId: volunteer?.id || 'vol-1',
        volunteerName: volunteer?.fullName || 'คุณกิตติศักดิ์ เมตตาธรรม',
        fullNameThai: certFullNameThai.trim(),
        fullNameEn: certFullNameEn.trim() || 'Volunteer Reader',
        email: certEmail.trim(),
        phone: certPhone.trim() || '081-234-5678',
        purpose: certPurpose.trim() || 'ยื่นเก็บพอร์ตชั่วโมงจิตอาสา',
        onlineAudioCount: approvedSubmissions.length,
        onsiteSessionCount: onsiteCompletedCount,
        eligible: approvedSubmissions.length >= 5 || onsiteCompletedCount >= 3,
      });

      setSuccessToast('ยื่นคำขอรับเกียรติบัตรเรียบร้อยแล้ว แอดมินจะตรวจสอบและส่งเกียรติบัตรทางอีเมลค่ะ');
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Criteria tracking
  const onlineProgress = Math.min(100, (approvedSubmissions.length / 5) * 100);
  const onsiteProgress = Math.min(100, (onsiteCompletedCount / 3) * 100);
  const isEligibleForCert = approvedSubmissions.length >= 5 || onsiteCompletedCount >= 3;

  // Feedback aggregation
  const volunteerEvaluations = evaluations.filter((e) => !volunteer || e.volunteerId === volunteer.id || e.volunteerName.includes(volunteer.nickname || 'กิต'));
  const avgEtiquette = volunteerEvaluations.length > 0
    ? (volunteerEvaluations.reduce((acc, e) => acc + e.etiquetteRating, 0) / volunteerEvaluations.length).toFixed(1)
    : '5.0';
  const avgWarmth = volunteerEvaluations.length > 0
    ? (volunteerEvaluations.reduce((acc, e) => acc + e.voiceWarmthRating, 0) / volunteerEvaluations.length).toFixed(1)
    : '4.8';
  const avgOverall = volunteerEvaluations.length > 0
    ? (volunteerEvaluations.reduce((acc, e) => acc + e.overallRating, 0) / volunteerEvaluations.length).toFixed(1)
    : '5.0';

  // Warnings for this volunteer
  const activeWarnings = warnings.filter((w) => !volunteer || w.volunteerId === volunteer.id);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header Back Button / Return to Role Selection Gateway */}
      {onResetToLanding && (
        <div className="flex items-center justify-between">
          <button
            onClick={onResetToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-all shadow-2xs group cursor-pointer"
            title="กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าเลือกบทบาท (Patient, Volunteer, Admin)</span>
          </button>
          <span className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full font-medium hidden sm:inline">
            จิตอาสา: {volunteer?.nickname || volunteer?.fullName || 'ผู้อ่านจิตอาสา'}
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold px-2 py-1"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Warning System Banner (if issued by admin) */}
      {activeWarnings.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>แจ้งเตือนและข้อเสนอแนะจากผู้ดูแลระบบโรงพยาบาล</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 bg-amber-200 text-amber-800 rounded-full font-semibold">
              โปรดรับทราบ
            </span>
          </div>
          {activeWarnings.map((w) => (
            <div key={w.id} className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 text-xs flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{w.reason}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">ออกโดย: {w.issuedBy} • {w.issuedAt}</p>
              </div>
              {!w.acknowledged && onAcknowledgeWarning && (
                <button
                  onClick={() => onAcknowledgeWarning(w.id)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  รับทราบข้อความ
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
              <Volume2 className="w-3.5 h-3.5 text-white" />
              <span>ระบบบริหารผลงานและสะสมชั่วโมงจิตอาสา (Volunteer Reader Portal)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ศูนย์รวมผลงานเสียงอ่าน & บริหารคิวข้างเตียง
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl mt-1 leading-relaxed">
              ส่งมอบเสียงอ่านข้างเตียงเพื่อเยียวยาผู้ป่วยใน 14 โรงพยาบาลเครือข่ายจังหวัดชลบุรี 
              ติดตามสถานะอนุมัติ สะสมชั่วโมงรับเกียรติบัตรดิจิทัล และลงเวลาว่างสำหรับอ่านข้างเตียง
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <span className="text-2xl font-bold block">{approvedSubmissions.length}</span>
              <span className="text-[10px] text-sky-100">ไฟล์อนุมัติแล้ว</span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <span className="text-2xl font-bold block">{onsiteCompletedCount}</span>
              <span className="text-[10px] text-sky-100">ครั้งอ่านข้างเตียง</span>
            </div>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/20 overflow-x-auto no-scrollbar text-xs font-semibold">
          <button
            id="tab-vol-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>ตารางนัดหมายข้างเตียง</span>
            {confirmedBookings.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-400 text-sky-950 rounded-full text-[10px] font-bold">
                {confirmedBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>สถานะผลงาน ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดไฟล์เสียง MP3</span>
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'certificate'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>ขอเกียรติบัตร & ชั่วโมงสะสม</span>
            {isEligibleForCert && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>สรุปผลการประเมิน ({avgOverall} ★)</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ลงเวลาว่าง ({availabilitySlots.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 0: BEDSIDE PATIENT SCHEDULE (ตารางนัดหมายข้างเตียงที่ได้รับมอบหมาย) */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-white rounded-3xl p-5 sm:p-6 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  ตารางนัดหมายข้างเตียงที่ได้รับมอบหมาย (Bedside Patient Schedule)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  รายการนัดหมายผู้ป่วยที่คุณได้รับการจับคู่จากแอดมิน เพื่อเข้าอ่านข้างเตียงในโรงพยาบาล
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('availability')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ลงเวลาว่างเพิ่มเติม</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setScheduleFilter('confirmed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>นัดหมายรอเข้าพบ ({assignedBookings.filter((b) => b.status === 'confirmed').length})</span>
            </button>

            <button
              onClick={() => setScheduleFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                scheduleFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ทั้งหมด ({assignedBookings.length})
            </button>

            <button
              onClick={() => setScheduleFilter('completed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleFilter === 'completed'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>เสร็จสิ้นแล้ว ({assignedBookings.filter((b) => b.status === 'completed').length})</span>
            </button>

            <button
              onClick={() => setScheduleFilter('cancelled')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleFilter === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>ยกเลิกแล้ว ({assignedBookings.filter((b) => b.status === 'cancelled').length})</span>
            </button>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {assignedBookings.filter((b) => scheduleFilter === 'all' || b.status === scheduleFilter).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">ไม่มีนัดหมายข้างเตียงในหมวดนี้</h4>
                <p className="text-xs text-slate-400 mt-1">
                  เมื่อเจ้าหน้าที่แอดมินยืนยันการจับคู่ รายชื่อผู้ป่วย วันที่ เวลา และห้องพักจะปรากฏที่นี่ทันที
                </p>
                <button
                  onClick={() => setActiveTab('availability')}
                  className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  ลงช่วงเวลาว่างเพื่อรอรับการจับคู่
                </button>
              </div>
            ) : (
              assignedBookings
                .filter((b) => scheduleFilter === 'all' || b.status === scheduleFilter)
                .map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const isCompleted = b.status === 'completed';

                  return (
                    <div
                      key={b.id}
                      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                        isConfirmed
                          ? 'bg-white border-emerald-300 ring-2 ring-emerald-50 shadow-xs'
                          : isCancelled
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                              {b.id}
                            </span>

                            {isConfirmed && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ยืนยันแล้ว รอเข้าอ่านข้างเตียง</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>เสร็จสิ้นเรียบร้อย</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>ยกเลิกแล้ว</span>
                              </span>
                            )}

                            {b.matchedAt && (
                              <span className="text-[11px] text-slate-400">
                                จับคู่เมื่อ: {b.matchedAt}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-800 pt-1">
                            เรื่อง/หมวด: {b.storyTitle || b.customTopic || b.categoryName || 'เรื่องเล่าสร้างกำลังใจ'}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        {isConfirmed && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                healingSound.playClickBeep();
                                setCancellingBooking(b);
                              }}
                              className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="ยกเลิกนัดหมายนี้หากติดภารกิจเร่งด่วน"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>ยกเลิกการนัดหมาย</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Patient & Hospital Location Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                        {/* Column 1: Patient details */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            ข้อมูลผู้รับบริการ (Patient Details)
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              <User className="w-4 h-4 text-sky-600" />
                              <span>{b.patientInfo.fullName}</span>
                              <span className="text-xs font-normal text-slate-500">
                                ({b.patientInfo.age} ปี • {b.patientInfo.gender || 'ไม่ระบุ'})
                              </span>
                            </p>
                            {b.patientInfo.hnNumber && (
                              <p className="text-slate-600 font-mono text-[11px]">
                                HN: <strong className="text-slate-800">{b.patientInfo.hnNumber}</strong>
                              </p>
                            )}
                            {b.patientInfo.contactPhone && (
                              <p className="text-slate-600 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>ติดต่อ: {b.patientInfo.contactPhone}</span>
                              </p>
                            )}
                            {(b.patientInfo.symptoms || b.patientInfo.disease) && (
                              <p className="text-slate-600 pt-1">
                                <span className="font-semibold text-slate-700">อาการ/โรค: </span>
                                <span>{b.patientInfo.symptoms || b.patientInfo.disease}</span>
                              </p>
                            )}
                            {b.patientInfo.specialNeeds && (
                              <p className="text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                                <span className="font-bold">ข้อควรระวัง: </span>
                                <span>{b.patientInfo.specialNeeds}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Date, Time & Hospital Room */}
                        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2">
                          <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                            วันเวลาและสถานที่เข้าอ่าน (Hospital & Bed Location)
                          </span>
                          <div className="space-y-1.5">
                            <p className="text-sm font-bold text-teal-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-teal-600" />
                              <span>{b.patientInfo.hospitalName}</span>
                            </p>
                            <p className="text-slate-700 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-teal-600" />
                              <span>
                                วอร์ด/แผนก: <strong>{b.patientInfo.ward}</strong> • เตียง/ห้อง: <strong className="text-teal-700 font-mono">{b.patientInfo.bedNumber}</strong>
                              </span>
                            </p>
                            <p className="text-slate-700 flex items-center gap-1.5 pt-1">
                              <Calendar className="w-3.5 h-3.5 text-teal-600" />
                              <span>วันที่: <strong>{b.date}</strong></span>
                              <span className="text-slate-400">•</span>
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>เวลา: <strong>{b.timeSlot} น.</strong></span>
                            </p>
                            <p className="text-[11px] text-slate-500 pt-1">
                              รูปแบบ: {b.format === 'bedside_visit' ? 'อ่านข้างเตียงผู้ป่วยโดยตรง (On-site Bedside)' : 'ผ่านแท็บเล็ต/วิดีโอคอล'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cancellation Notice if Cancelled */}
                      {isCancelled && b.cancellationReason && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>เหตุผลการยกเลิกนัดหมาย:</span>
                          </div>
                          <p className="pl-5.5 font-medium">{b.cancellationReason}</p>
                          <p className="pl-5.5 text-[11px] text-rose-600">
                            ยกเลิกโดย: {b.cancelledBy === 'volunteer' ? 'คุณ (จิตอาสา)' : b.cancelledBy === 'patient' ? 'ผู้ป่วย' : 'เจ้าหน้าที่'} {b.cancelledAt ? `• เมื่อ ${b.cancelledAt}` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: STATUS TRACKING & REJECTION REASONS & PORTFOLIO */}
      {/* ========================================================================= */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Status Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white border-sky-400 ring-2 ring-sky-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs text-slate-500 block">ทั้งหมด</span>
              <span className="text-2xl font-bold text-slate-800">{submissions.length}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">ผลงานในระบบ</span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs text-amber-700 font-semibold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>รออนุมัติ</span>
              </span>
              <span className="text-2xl font-bold text-amber-900">{pendingCount}</span>
              <span className="text-[11px] text-amber-700/80 block mt-0.5">รอพยาบาลตรวจสอบ</span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs text-emerald-700 font-semibold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>อนุมัติเรียบร้อย</span>
              </span>
              <span className="text-2xl font-bold text-emerald-900">{approvedSubmissions.length}</span>
              <span className="text-[11px] text-emerald-700/80 block mt-0.5">เผยแพร่สู่ผู้ป่วยแล้ว</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xs text-rose-700 font-semibold block flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-500" />
                <span>ไม่ผ่านการอนุมัติ</span>
              </span>
              <span className="text-2xl font-bold text-rose-900">{rejectedCount}</span>
              <span className="text-[11px] text-rose-700/80 block mt-0.5">ดูเหตุผลและส่งใหม่</span>
            </button>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <FileAudio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">ไม่มีไฟล์เสียงในสถานะนี้</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  คุณสามารถอัปโหลดไฟล์เสียงอ่าน MP3 เพื่อส่งมอบความสงบให้ผู้ป่วยข้างเตียงได้ตลอดเวลา
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold"
                >
                  เริ่มอัปโหลดไฟล์เสียงใหม่อันแรก
                </button>
              </div>
            ) : (
              filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                    sub.status === 'rejected'
                      ? 'border-rose-200 bg-rose-50/20'
                      : sub.status === 'approved'
                        ? 'border-emerald-200/80 hover:shadow-md'
                        : 'border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {sub.status === 'approved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติเรียบร้อย (เผยแพร่แล้ว)</span>
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รออนุมัติ (Pending Queue)</span>
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ไม่ผ่านการอนุมัติ (ซ่อนจากสาธารณะ)</span>
                          </span>
                        )}

                        <span className="font-mono text-xs text-slate-400 font-semibold">{sub.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{sub.uploadedAt}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        {sub.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {sub.excerpt}
                      </p>

                      {/* Tag badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                          {sub.categoryName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          ความยาว {sub.durationFormatted} ({sub.fileSizeFormatted})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100 font-medium">
                          โทน: {sub.audioTone}
                        </span>
                      </div>

                      {/* REJECTION REASON BANNER (Requirement 1) */}
                      {sub.status === 'rejected' && (
                        <div className="p-3.5 rounded-2xl bg-rose-100/70 border border-rose-300 text-rose-950 mt-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>เหตุผลที่ไม่ผ่านการอนุมัติ:</span>
                          </div>
                          <p className="text-xs font-medium text-rose-800 pl-5 leading-relaxed">
                            {sub.rejectionReason || 'มีเสียงรบกวนมากเกินไป หรือไฟล์เสียงเกิดปัญหา'}
                          </p>
                          {sub.adminNotes && (
                            <p className="text-[11px] text-rose-700 pl-5 italic">
                              บันทึกจากผู้ตรวจ: "{sub.adminNotes}"
                            </p>
                          )}
                          <div className="pt-2 pl-5">
                            <button
                              onClick={() => handlePrepareReUpload(sub)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>แก้ไขและส่งใหม่อีกครั้ง</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Approval Praise Banner */}
                      {sub.status === 'approved' && sub.adminNotes && (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">ข้อความรับรองจากทีมพยาบาล: </span>
                            <span>{sub.adminNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Audio Player & Actions */}
                    <div className="w-full lg:w-80 shrink-0 space-y-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <Html5AudioPlayer
                          audioUrl={sub.audioUrl}
                          title={sub.title}
                          subtitle={`${sub.categoryName} • ${sub.durationFormatted}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        {onPlayInBedsidePlayer && (
                          <button
                            onClick={() => onPlayInBedsidePlayer(sub)}
                            className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            <span>ฟังใน Bedside Bar</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`คุณต้องการลบไฟล์เสียง "${sub.title}" ใช่หรือไม่?`)) {
                              onDeleteSubmission(sub.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบไฟล์</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: INTUITIVE MP3 UPLOAD INTERFACE (Requirement 1) */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              แบบฟอร์มอัปโหลดผลงานจิตอาสา
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
              อัปโหลดไฟล์เสียงอ่าน (MP3 Format Only)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ไฟล์เสียงทุกเรื่องจะผ่านการตรวจสอบคุณภาพความสงบ ความดัง และความถูกต้องก่อนเผยแพร่สู่ผู้ป่วยในโรงพยาบาล 14 แห่ง
            </p>
          </div>

          {/* Quick Demo Synthesizer Chooser */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-blue-50 border border-sky-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>สำหรับทดสอบระบบ (Quick Demo Voice Clips)</span>
              </span>
              <span className="text-[11px] text-sky-700">คลิกเพื่อโหลดเสียง MP3 ตัวอย่างพร้อมฟอร์ม</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoadDemoAudio('piano')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200 transition-colors shadow-2xs"
              >
                🎹 เปียโนบำบัดใจ (หลับสบาย)
              </button>
              <button
                type="button"
                onClick={() => handleLoadDemoAudio('singing_bowl')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200 transition-colors shadow-2xs"
              >
                🕊️ ระฆังสติ (สมาธิ/ปล่อยวาง)
              </button>
              <button
                type="button"
                onClick={() => handleLoadDemoAudio('nature')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200 transition-colors shadow-2xs"
              >
                🌿 ป่าไผ่และลำธาร (กำลังใจ)
              </button>
              <button
                type="button"
                onClick={() => handleLoadDemoAudio('gentle_chime')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200 transition-colors shadow-2xs"
              >
                📖 นิทานกระต่ายน้อย (เด็กๆ)
              </button>
            </div>
          </div>

          {/* DRAG & DROP UPLOAD ZONE (Requirement 1) */}
          <div className="space-y-3">
            {/* Live Microphone Recording Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isRecording ? 'กำลังอัดเสียงสดผ่านไมโครโฟน...' : 'อัดเสียงอ่านสดด้วยไมโครโฟน'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isRecording 
                      ? `เวลาที่อัด: ${formatDurationSeconds(recordingSeconds)} (คลิกหยุดเมื่ออ่านเสร็จ)` 
                      : 'หากไม่มีไฟล์ MP3 สามารถกดอัดเสียงสดจากเบราว์เซอร์ได้ทันที'}
                  </span>
                </div>
              </div>

              <div>
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>หยุดและใช้เสียงนี้ ({formatDurationSeconds(recordingSeconds)})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-rose-500" />
                    <span>เริ่มบันทึกเสียงไมค์</span>
                  </button>
                )}
              </div>
            </div>

            <label className="text-xs font-bold text-slate-800 block">
              เลือกไฟล์เสียงอ่าน (.mp3) หรือผลจากการอัดเสียง <span className="text-rose-500">*</span>
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-100'
                  : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,audio/mpeg,audio/mp3"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-sky-600 mx-auto mb-3">
                {isProcessingAudio ? (
                  <RotateCcw className="w-8 h-8 animate-spin text-sky-500" />
                ) : selectedFile ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-800 truncate max-w-md mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    ความยาว {audioDurationFormatted} • ขนาด {fileSizeFormatted} (ไฟล์ MP3 ถูกต้อง)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">คลิกเพื่อเปลี่ยนไฟล์ใหม่</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">
                    ลากไฟล์เสียง .MP3 มาวางที่นี่ หรือ <span className="text-sky-600 underline">คลิกเพื่อเลือกไฟล์</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    รองรับเฉพาะไฟล์เสียงรูปแบบ <strong>.mp3</strong> (ขนาดไม่เกิน 50MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error format banner */}
            {fileFormatError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fileFormatError}</span>
              </div>
            )}
          </div>

          {/* Audio Preview Player */}
          {audioUrl && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>ทดลองฟังเสียงอ่านก่อนกดส่งอนุมัติ (Pre-submission Audition)</span>
                </span>
                <span className="text-slate-400">{audioDurationFormatted}</span>
              </div>
              <Html5AudioPlayer
                audioUrl={audioUrl}
                title={title || 'ไฟล์เสียงตัวอย่าง'}
                subtitle={`จิตอาสา: ${volunteerNameInput}`}
              />
            </div>
          )}

          {/* Metadata Inputs */}
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">ข้อมูลรายละเอียดของผลงานเสียงอ่าน</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  ชื่อเรื่องของไฟล์เสียง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="เช่น ต้นไม้แห่งความหวังข้างหน้าต่าง"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ผู้ประพันธ์ / ดัดแปลงเรื่อง</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="เช่น วรรณภา สุขเจริญ หรือ นิทานอีสป"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">หมวดหมู่เนื้อหา</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">น้ำเสียงและโทนการอ่าน</label>
                <input
                  type="text"
                  value={audioTone}
                  onChange={(e) => setAudioTone(e.target.value)}
                  placeholder="เช่น อบอุ่น นุ่มนวล, สงบเย็น, สดใสให้กำลังใจ"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none"
                />
              </div>
            </div>

            {/* Excerpt / Summary */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                เรื่องย่อสั้นๆ (แสดงบนการ์ดเรื่องเล่า) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                rows={2}
                placeholder="เล่าสรุป 1-2 ประโยค เพื่อให้ผู้ป่วยหรือญาติเข้าใจหัวใจหลักของเรื่อง..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none"
              />
            </div>

            {/* Full Script */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                บทอ่านฉบับเต็ม (Full Transcript) สำหรับให้ผู้ป่วยอ่านตาม
              </label>
              <textarea
                value={fullScript}
                onChange={(e) => setFullScript(e.target.value)}
                rows={4}
                placeholder="พิมพ์หรือคัดลอกบทความทั้งหมด เพื่อให้ผู้ป่วยที่สายตายังดีสามารถอ่านประกอบการฟังได้..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>ส่งไฟล์เสียงเข้าคิวอนุมัติ</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: VOLUNTEER HOURS & DIGITAL CERTIFICATE (Requirement 6) */}
      {/* ========================================================================= */}
      {activeTab === 'certificate' && (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                เกณฑ์มาตรฐานโครงการจิตอาสา รพ.ชลบุรี
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                ความคืบหน้าสะสมชั่วโมงและขอรับเกียรติบัตร (Certificate Progress)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                สามารถขอรับเกียรติบัตรได้เมื่อผ่านเกณฑ์อย่างใดอย่างหนึ่ง: บันทึกเสียงอ่านครบ 5 ไฟล์ (Online) หรือ อ่านข้างเตียงครบ 3 ครั้ง (Onsite)
              </p>
            </div>

            {/* Two criteria blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Criterion 1: Online audio */}
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-800">เกณฑ์ 1: ผลงานเสียงอ่าน (Online)</h3>
                  </div>
                  <span className="text-xs font-bold text-sky-800">
                    {approvedSubmissions.length} / 5 ไฟล์
                  </span>
                </div>

                <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-sky-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${onlineProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-sky-800 leading-relaxed">
                  {approvedSubmissions.length >= 5
                    ? '✅ ผ่านเกณฑ์บันทึกเสียงอ่าน 5 ไฟล์แล้ว สามารถยื่นขอเกียรติบัตรได้ทันที'
                    : `ขาดอีก ${5 - approvedSubmissions.length} ไฟล์ จะผ่านเกณฑ์ขอเกียรติบัตร`}
                </p>
              </div>

              {/* Criterion 2: Onsite Reading */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">เกณฑ์ 2: อ่านหนังสือข้างเตียง (Onsite)</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">
                    {onsiteCompletedCount} / 3 ครั้ง
                  </span>
                </div>

                <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-emerald-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${onsiteProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {onsiteCompletedCount >= 3
                    ? '✅ ผ่านเกณฑ์อ่านข้างเตียง 3 ครั้งแล้ว สามารถยื่นขอเกียรติบัตรได้ทันที'
                    : `ขาดอีก ${3 - onsiteCompletedCount} ครั้ง จะผ่านเกณฑ์ขอเกียรติบัตร`}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-800">รายการตรวจสอบคุณสมบัติ (Qualification Checklist):</h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  {approvedSubmissions.length >= 5 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>ส่งไฟล์เสียงอ่านผ่านเกณฑ์พยาบาล: {approvedSubmissions.length} / 5 ไฟล์</span>
                </li>
                <li className="flex items-center gap-2">
                  {onsiteCompletedCount >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>ลงพื้นที่อ่านหนังสือข้างเตียงตัวต่อตัว: {onsiteCompletedCount} / 3 ครั้ง</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>คะแนนการประเมินมารยาทและน้ำเสียงเฉลี่ย: {avgOverall} ดาว (ผ่านเกณฑ์ขั้นต่ำ 3.0)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Certificate Request Form */}
          <form onSubmit={handleRequestCertificateSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">แบบฟอร์มขอรับเกียรติบัตรจิตอาสา</h3>
                  <p className="text-xs text-slate-500">ข้อมูลนี้จะถูกพิมพ์ลงบนเกียรติบัตรรับรองดิจิทัล</p>
                </div>
              </div>

              {isEligibleForCert ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>มีสิทธิ์ยื่นขอ</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                  (Demo Mode: สามารถยื่นทดสอบได้)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                <input
                  type="text"
                  value={certFullNameThai}
                  onChange={(e) => setCertFullNameThai(e.target.value)}
                  required
                  placeholder="เช่น นายกิตติศักดิ์ เมตตาธรรม"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name (English) *</label>
                <input
                  type="text"
                  value={certFullNameEn}
                  onChange={(e) => setCertFullNameEn(e.target.value)}
                  required
                  placeholder="e.g. Mr. Kittisak Mettatham"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">อีเมลสำหรับรับเกียรติบัตร *</label>
                <input
                  type="email"
                  value={certEmail}
                  onChange={(e) => setCertEmail(e.target.value)}
                  required
                  placeholder="kittisak.vol@example.com"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  value={certPhone}
                  onChange={(e) => setCertPhone(e.target.value)}
                  placeholder="081-234-5678"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">วัตถุประสงค์ในการขอเกียรติบัตร</label>
              <input
                type="text"
                value={certPurpose}
                onChange={(e) => setCertPurpose(e.target.value)}
                placeholder="เช่น เก็บพอร์ตชั่วโมงจิตอาสา กยศ., สมัครทุนการศึกษา, รับรองวิชาชีพ"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>ยื่นคำขอรับเกียรติบัตรดิจิทัล</span>
            </button>
          </form>

          {/* Certificate Requests History */}
          {certificateRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-800">ประวัติการขอรับเกียรติบัตร</h4>
              <div className="space-y-2">
                {certificateRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.fullNameThai} ({req.fullNameEn})</p>
                      <p className="text-[11px] text-slate-500">ยื่นเมื่อ: {req.createdAt} • เพื่อ: {req.purpose}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'approved' ? (
                        <>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            อนุมัติแล้ว
                          </span>
                          {onViewCertificate && (
                            <button
                              onClick={() => onViewCertificate(req)}
                              className="px-3 py-1 bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูเกียรติบัตร</span>
                            </button>
                          )}
                        </>
                      ) : req.status === 'rejected' ? (
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold block">
                            ไม่ผ่าน
                          </span>
                          <span className="text-[10px] text-rose-600">{req.rejectionReason}</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          รอแอดมินอนุมัติ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: WEEKLY FEEDBACK SUMMARY (Requirement 5) */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Summary Ratings Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  ระบบสรุปข้อคิดเห็นจากผู้รับบริการ (Weekly Feedback)
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                  ผลการประเมินและการตอบรับจากผู้ป่วย
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  รวบรวมแบบไม่เปิดเผยตัวตน (Anonymous) เพื่อให้จิตอาสาพัฒนาคุณภาพเสียงอ่านและมารยาทข้างเตียง
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-amber-500">{avgOverall}</span>
                <span className="text-xs text-slate-400 block">/ 5.0 คะแนนเฉลี่ย</span>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-900">มารยาทและกาลเทศะ</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-extrabold text-slate-800">{avgEtiquette}</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-medium">ระดับดีเยี่ยม</span>
                </div>
                <p className="text-[11px] text-slate-500">ความสุภาพ การเคารพความเป็นส่วนตัวของผู้ป่วย</p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1">
                <span className="text-xs font-bold text-sky-900">น้ำเสียงการอ่านและความอบอุ่น</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-extrabold text-slate-800">{avgWarmth}</span>
                  </div>
                  <span className="text-xs text-sky-700 font-medium">ระดับดีเยี่ยม</span>
                </div>
                <p className="text-[11px] text-slate-500">จังหวะการอ่าน ระดับเสียงพอดี นุ่มนวลผ่อนคลาย</p>
              </div>
            </div>
          </div>

          {/* Evaluations List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              ข้อความประเมินและคำชมเชยล่าสุด ({volunteerEvaluations.length})
            </h3>

            {volunteerEvaluations.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
                ยังไม่มีข้อมูลการประเมินในสัปดาห์นี้
              </div>
            ) : (
              volunteerEvaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {ev.patientNameAnonymous}
                      </span>
                      <span className="text-xs text-slate-400">• {ev.hospitalName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{ev.overallRating}/5 ดาว</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    "{ev.comments}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>วันที่ประเมิน: {ev.date}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ประเมินแบบไม่เปิดเผยตัวตน</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: AVAILABILITY SLOTS (Requirement 3 & 4) */}
      {/* ========================================================================= */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          {/* Add Slot Form */}
          <form onSubmit={handleAddSlot} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                ระบบจัดการเวลาว่างสำหรับจิตอาสา
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                ลงช่วงเวลาว่างเพื่อเปิดรับการจับคู่ (Availability Slots)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                กำหนดวัน เวลา และโรงพยาบาลที่คุณสะดวกเดินทางไปอ่านข้างเตียง เพื่อให้แอดมินจับคู่กับผู้ป่วยได้อย่างรวดเร็ว
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">วันที่สะดวก *</label>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ช่วงเวลา (เริ่ม - สิ้นสุด) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                  />
                  <span className="text-xs text-slate-400">-</span>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">โรงพยาบาลเป้าหมาย</label>
                <select
                  value={slotHospital}
                  onChange={(e) => setSlotHospital(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none bg-white"
                >
                  {CHONBURI_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} ({h.district}) • {h.ownership}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มช่วงเวลาว่างลงตาราง</span>
            </button>
          </form>

          {/* Active Availability Slots */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              ช่วงเวลาที่คุณเปิดรับนัดหมาย ({availabilitySlots.length} ช่วง)
            </h3>

            {availabilitySlots.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีช่วงเวลาว่างที่ลงไว้</p>
            ) : (
              <div className="space-y-2">
                {availabilitySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      slot.isBooked
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {slot.date} ({slot.startTime} - {slot.endTime} น.)
                        </span>
                        {slot.isBooked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            จับคู่กับผู้ป่วยแล้ว ({slot.bookedRequestId})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                            ว่าง (รอแอดมินจับคู่)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{slot.hospitalName}</span>
                      </p>
                    </div>

                    {!slot.isBooked && onDeleteAvailabilitySlot && (
                      <button
                        onClick={() => onDeleteAvailabilitySlot(slot.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                        title="ลบช่วงเวลานี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Modal for Volunteer (Mandatory Reason Input) */}
      <CancellationModal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        booking={cancellingBooking}
        onConfirmCancel={(id, reason) => {
          if (onCancelBooking) {
            onCancelBooking(id, reason);
          }
          setCancellingBooking(null);
          setSuccessToast('ยกเลิกการนัดหมายเรียบร้อยแล้ว ระบบได้แจ้งเตือนผู้ป่วยและส่งข้อความแจ้งแอดมินทันที');
          setTimeout(() => setSuccessToast(null), 4000);
        }}
      />
    </div>
  );
};
