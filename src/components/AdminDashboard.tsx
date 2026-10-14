import React, { useState } from 'react';
import { 
  BookingRequest, 
  VolunteerProfile, 
  Story, 
  AudioSubmission,
  AudioErrorReport,
  VolunteerAvailabilitySlot,
  ServiceEvaluation,
  CertificateRequest,
  VolunteerWarning
} from '../types';
import { 
  ShieldCheck, 
  Users, 
  UserCheck,
  Calendar, 
  Clock, 
  Search, 
  FileAudio, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Award, 
  BookOpen, 
  Check, 
  X, 
  Star, 
  AlertTriangle, 
  XCircle,
  Mail, 
  ArrowLeft,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  Eye,
  Building2,
  CalendarCheck,
  Send,
  ExternalLink,
  Trash2,
  RotateCcw,
  RefreshCw,
  Database,
  MapPin,
  Phone,
  Settings
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';
import { CHONBURI_HOSPITALS, CHONBURI_DISTRICTS } from '../data/chonburiHospitals';
import { Html5AudioPlayer } from './Html5AudioPlayer';

interface AdminDashboardProps {
  bookings: BookingRequest[];
  onUpdateBookingStatus: (id: string, newStatus: 'confirmed' | 'pending' | 'completed' | 'cancelled') => void;
  onDeleteBooking?: (id: string) => void;
  volunteers: VolunteerProfile[];
  onApproveVolunteer?: (volunteerId: string, adminNotes?: string) => void;
  onRejectVolunteer?: (volunteerId: string, reason: string, adminNotes?: string) => void;
  onRevertVolunteerToPending?: (volunteerId: string) => void;
  stories: Story[];
  onDeleteStory?: (id: string) => void;
  onViewVolunteer: (vol: VolunteerProfile) => void;
  audioSubmissions?: AudioSubmission[];
  onApproveSubmission?: (id: string, adminNotes?: string) => void;
  onRejectSubmission?: (id: string, reason: string, adminNotes?: string) => void;
  onRevertSubmissionToPending?: (id: string) => void;
  onDeleteSubmission?: (id: string) => void;
  onResetToLanding?: () => void;
  onResetDatabase?: () => void;
  audioErrorReports?: AudioErrorReport[];
  onResolveErrorReport?: (reportId: string, resolutionNotes: string) => void;
  availabilitySlots?: VolunteerAvailabilitySlot[];
  onConfirmMatch?: (bookingId: string, slotId: string) => void;
  evaluations?: ServiceEvaluation[];
  onIssueWarning?: (volunteerId: string, volunteerName: string, reason: string, severity: 'advisory' | 'warning' | 'critical') => void;
  certificateRequests?: CertificateRequest[];
  onApproveCertificate?: (requestId: string) => void;
  onRejectCertificate?: (requestId: string, reason: string) => void;
  onViewCertificate?: (certificate: CertificateRequest) => void;
  currentAdmin?: { name: string; email: string; hospital: string; roleTitle: string } | null;
  onAdminLogout?: () => void;
  onReMatchBooking?: (bookingId: string) => void;
  activeSubTab?: 'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings';
  onSubTabChange?: (tab: 'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  onUpdateBookingStatus,
  onDeleteBooking,
  volunteers,
  onApproveVolunteer,
  onRejectVolunteer,
  onRevertVolunteerToPending,
  stories,
  onDeleteStory,
  onViewVolunteer,
  audioSubmissions = [],
  onApproveSubmission,
  onRejectSubmission,
  onRevertSubmissionToPending,
  onDeleteSubmission,
  onResetToLanding,
  onResetDatabase,
  audioErrorReports = [],
  onResolveErrorReport,
  availabilitySlots = [],
  onConfirmMatch,
  evaluations = [],
  onIssueWarning,
  certificateRequests = [],
  onApproveCertificate,
  onRejectCertificate,
  onViewCertificate,
  currentAdmin,
  onAdminLogout,
  onReMatchBooking,
  activeSubTab: controlledSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<
    'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings'
  >('matching');
  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : internalSubTab;
  const setActiveSubTab = (
    tab: 'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings'
  ) => {
    setInternalSubTab(tab);
    onSubTabChange?.(tab);
  };

  // Cancelled bookings for Urgent Re-matching
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  // Filters
  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [hospitalFilter, setHospitalFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [storySearchFilter, setStorySearchFilter] = useState('');

  // Hospital Network Settings Filters
  const [settingsDistrictFilter, setSettingsDistrictFilter] = useState<string>('all');
  const [settingsOwnershipFilter, setSettingsOwnershipFilter] = useState<'all' | 'รัฐบาล' | 'เอกชน'>('all');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');

  // Audio Review state
  const [audioReviewFilter, setAudioReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectModalSubmission, setRejectModalSubmission] = useState<AudioSubmission | null>(null);
  const [selectedStandardReason, setSelectedStandardReason] = useState<string>('มีเสียงรบกวนมากเกินไป');
  const [customRejectionText, setCustomRejectionText] = useState<string>('');
  const [adminNoteText, setAdminNoteText] = useState<string>('');

  // Error Report Resolution Modal State
  const [resolvingReport, setResolvingReport] = useState<AudioErrorReport | null>(null);
  const [reportResolutionText, setReportResolutionText] = useState<string>('');

  // Matching Selection State
  const [selectedPatientBookingId, setSelectedPatientBookingId] = useState<string | null>(null);
  const [selectedVolunteerSlotId, setSelectedVolunteerSlotId] = useState<string | null>(null);

  // Warning Modal State
  const [warningVolunteer, setWarningVolunteer] = useState<VolunteerProfile | null>(null);
  const [warningReason, setWarningReason] = useState<string>('');
  const [warningSeverity, setWarningSeverity] = useState<'advisory' | 'warning' | 'critical'>('warning');

  // Certificate Reject Modal State
  const [rejectingCert, setRejectingCert] = useState<CertificateRequest | null>(null);
  const [certRejectionReason, setCertRejectionReason] = useState<string>('ชั่วโมงหรือจำนวนไฟล์เสียงยังไม่ครบถ้วนตามเกณฑ์ 5 ไฟล์ / 3 ครั้ง');

  // Success Feedback Message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Metrics
  const pendingAudioCount = audioSubmissions.filter((s) => s.status === 'pending').length;
  const approvedAudioCount = audioSubmissions.filter((s) => s.status === 'approved').length;
  const rejectedAudioCount = audioSubmissions.filter((s) => s.status === 'rejected').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const pendingReportsCount = audioErrorReports.filter((r) => r.status === 'pending').length;
  const pendingCertsCount = certificateRequests.filter((c) => c.status === 'pending').length;

  // Volunteer Approval States & Metrics (Requirement 3)
  const pendingVolunteersCount = volunteers.filter(
    (v) => v.approvalStatus === 'pending' || v.status === 'pending'
  ).length;
  const approvedVolunteersCount = volunteers.filter(
    (v) => v.approvalStatus === 'approved' || v.status === 'verified' || v.status === 'active'
  ).length;
  const rejectedVolunteersCount = volunteers.filter(
    (v) => v.approvalStatus === 'rejected' || v.status === 'rejected'
  ).length;

  const [volunteerApprovalFilter, setVolunteerApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState('');
  const [rejectModalVolunteer, setRejectModalVolunteer] = useState<VolunteerProfile | null>(null);
  const [volunteerRejectReasonChoice, setVolunteerRejectReasonChoice] = useState('มีเสียงรบกวนรอบข้างมากเกินไป');
  const [volunteerRejectCustomText, setVolunteerRejectCustomText] = useState('');

  const standardVolunteerRejectReasons = [
    'มีเสียงรบกวนรอบข้างมากเกินไป (ไมค์ช็อต/เสียงลม/เสียงแวดล้อม)',
    'ระดับเสียงเบาเกินไป ไม่ได้มาตรฐานสำหรับหอผู้ป่วยข้างเตียง',
    'การเว้นวรรคและการออกเสียงยังไม่ราบรื่นหรือพูดไม่ต่อเนื่อง',
    'ระยะเวลาคลิปเสียงสั้นเกินไป ไม่เพียงพอต่อการประเมินคุณภาพ',
    'โรงพยาบาลที่เลือกลงทะเบียนไม่ตรงกับพื้นที่ให้บริการที่เปิดรับ',
    'เหตุผลอื่นๆ (ระบุเพิ่มเติมด้านล่าง)',
  ];

  const handleConfirmVolunteerReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalVolunteer || !onRejectVolunteer) return;
    healingSound.playClickBeep();
    const finalReason = volunteerRejectReasonChoice === 'เหตุผลอื่นๆ (ระบุเพิ่มเติมด้านล่าง)'
      ? (volunteerRejectCustomText.trim() || 'คุณสมบัติหรือคลิปเสียงอ่านยังไม่ผ่านเกณฑ์การประเมิน')
      : volunteerRejectCustomText.trim()
        ? `${volunteerRejectReasonChoice} (${volunteerRejectCustomText.trim()})`
        : volunteerRejectReasonChoice;

    onRejectVolunteer(rejectModalVolunteer.id, finalReason);
    triggerSuccessMsg(`บันทึกผลการไม่อนุมัติจิตอาสา "${rejectModalVolunteer.fullName}" เรียบร้อยแล้ว`);
    setRejectModalVolunteer(null);
    setVolunteerRejectCustomText('');
  };

  const handleApproveVolunteerClick = (vol: VolunteerProfile) => {
    if (!onApproveVolunteer) return;
    healingSound.playChime(750, 0.8);
    onApproveVolunteer(vol.id, 'ผ่านการตรวจสอบคุณสมบัติและคลิปเสียงอ่านเรียบร้อยแล้ว ได้มาตรฐานโรงพยาบาลชลบุรี');
    triggerSuccessMsg(`อนุมัติจิตอาสา "${vol.fullName}" สำเร็จ! สามารถเข้าสู่ระบบเพื่อเริ่มปฏิบัติงานได้ทันที`);
  };

  const handleRevertVolunteerClick = (vol: VolunteerProfile) => {
    if (!onRevertVolunteerToPending) return;
    healingSound.playClickBeep();
    onRevertVolunteerToPending(vol.id);
    triggerSuccessMsg(`คืนสถานะจิตอาสา "${vol.fullName}" กลับสู่ "รอการตรวจสอบ" เรียบร้อยแล้ว`);
  };

  const triggerSuccessMsg = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  // Standard rejection reasons
  const standardRejectionReasons = [
    'มีเสียงรบกวนมากเกินไป (ไมค์ช็อต/เสียงลม/เสียงแวดล้อม)',
    'มีการเว้นวรรคระหว่างการอ่านนานเกินไป หรือพูดไม่ต่อเนื่อง',
    'ไฟล์เสียงเกิดปัญหาไม่สามารถเปิดได้ หรือไฟล์ชำรุด',
    'ไม่มีเสียง (ระดับสัญญาณเป็นศูนย์)',
    'ระดับเสียงเบาเกินไป ไม่ได้มาตรฐานสำหรับหอผู้ป่วยข้างเตียง',
    'เนื้อหาหรือถ้อยคำไม่เหมาะสมกับการบำบัดฟื้นฟูจิตใจผู้ป่วย',
    'เหตุผลอื่นๆ (ระบุเพิ่มเติมด้านล่าง)',
  ];

  // Handle Audio Rejection submit
  const handleConfirmAudioReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalSubmission || !onRejectSubmission) return;

    healingSound.playClickBeep();
    const finalReason = selectedStandardReason === 'เหตุผลอื่นๆ (ระบุเพิ่มเติมด้านล่าง)'
      ? (customRejectionText.trim() || 'ไม่ผ่านเกณฑ์มาตรฐานการอ่าน')
      : customRejectionText.trim()
        ? `${selectedStandardReason} (${customRejectionText.trim()})`
        : selectedStandardReason;

    onRejectSubmission(rejectModalSubmission.id, finalReason, adminNoteText.trim());
    triggerSuccessMsg(`ปฏิเสธไฟล์เสียง "${rejectModalSubmission.title}" พร้อมแจ้งเหตุผลไปยังจิตอาสาเรียบร้อยแล้ว`);
    setRejectModalSubmission(null);
    setCustomRejectionText('');
    setAdminNoteText('');
  };

  // Handle Audio Approval
  const handleApproveAudio = (sub: AudioSubmission) => {
    if (!onApproveSubmission) return;
    healingSound.playChime(750, 0.8);
    onApproveSubmission(
      sub.id,
      'ผ่านการตรวจสอบคุณภาพเสียงและการอ่านเรียบร้อยแล้ว ได้มาตรฐานโรงพยาบาลชลบุรี เผยแพร่สู่คลังเรื่องเล่าสาธารณะ'
    );
    triggerSuccessMsg(`อนุมัติไฟล์เสียง "${sub.title}" สำเร็จ! เผยแพร่สู่คลังเรื่องเล่าเพื่อให้ผู้ป่วยฟังได้ทันที`);
  };

  // Handle Revert Audio to Pending
  const handleRevertAudio = (sub: AudioSubmission) => {
    if (!onRevertSubmissionToPending) return;
    healingSound.playClickBeep();
    onRevertSubmissionToPending(sub.id);
    triggerSuccessMsg(`คืนสถานะไฟล์เสียง "${sub.title}" กลับสู่ "รอการตรวจสอบ" เรียบร้อยแล้ว`);
  };

  // Handle Delete Audio
  const handleDeleteAudio = (sub: AudioSubmission) => {
    if (!onDeleteSubmission) return;
    if (confirm(`คุณต้องการลบไฟล์เสียง "${sub.title}" ออกจากระบบและฐานข้อมูลถาวรใช่หรือไม่?`)) {
      healingSound.playClickBeep();
      onDeleteSubmission(sub.id);
      triggerSuccessMsg(`ลบไฟล์เสียง "${sub.title}" ออกจากฐานข้อมูลเรียบร้อยแล้ว`);
    }
  };

  // Handle Delete Story
  const handleDeleteStoryItem = (story: Story) => {
    if (!onDeleteStory) return;
    if (confirm(`คุณต้องการลบเรื่องเล่า "${story.title}" ออกจากคลังเรื่องเล่าถาวรใช่หรือไม่?`)) {
      healingSound.playClickBeep();
      onDeleteStory(story.id);
      triggerSuccessMsg(`ลบเรื่องเล่า "${story.title}" ออกจากคลังเรื่องเล่าเรียบร้อยแล้ว`);
    }
  };

  // Handle Delete Booking
  const handleDeleteBookingItem = (b: BookingRequest) => {
    if (!onDeleteBooking) return;
    if (confirm(`คุณต้องการลบรายการนัดหมายรหัส ${b.id} ของคุณ ${b.patientInfo.fullName} ออกจากระบบใช่หรือไม่?`)) {
      healingSound.playClickBeep();
      onDeleteBooking(b.id);
      triggerSuccessMsg(`ลบรายการนัดหมาย ${b.id} ออกจากระบบเรียบร้อยแล้ว`);
    }
  };

  // Handle Match Confirm
  const handleConfirmMatchAction = () => {
    if (!selectedPatientBookingId || !selectedVolunteerSlotId || !onConfirmMatch) return;
    healingSound.playChime(800, 0.8);
    onConfirmMatch(selectedPatientBookingId, selectedVolunteerSlotId);
    triggerSuccessMsg('จับคู่และยืนยันการนัดหมายสำเร็จ! ส่งอีเมลและการแจ้งเตือนถึงผู้ป่วยและจิตอาสาแล้ว');
    setSelectedPatientBookingId(null);
    setSelectedVolunteerSlotId(null);
  };

  // Handle Resolve Audio Report
  const handleConfirmResolveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport || !onResolveErrorReport) return;

    healingSound.playChime(640, 0.6);
    onResolveErrorReport(
      resolvingReport.id,
      reportResolutionText.trim() || 'ทีมงานได้แก้ไขไฟล์เสียงเรียบร้อยแล้ว ขอบคุณสำหรับการแจ้งปัญหาเพื่อผู้ป่วยค่ะ'
    );
    triggerSuccessMsg(`ทำเครื่องหมายแก้ไขปัญหา "${resolvingReport.storyTitle}" และส่งข้อความขอบคุณผู้แจ้งแล้ว`);
    setResolvingReport(null);
    setReportResolutionText('');
  };

  // Handle Issue Warning
  const handleConfirmWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningVolunteer || !warningReason.trim() || !onIssueWarning) return;

    healingSound.playClickBeep();
    onIssueWarning(warningVolunteer.id, warningVolunteer.fullName, warningReason.trim(), warningSeverity);
    triggerSuccessMsg(`ออกหนังสือแจ้งเตือนไปยัง ${warningVolunteer.fullName} เรียบร้อยแล้ว`);
    setWarningVolunteer(null);
    setWarningReason('');
  };

  // Handle Certificate Reject
  const handleConfirmRejectCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCert || !onRejectCertificate) return;

    healingSound.playClickBeep();
    onRejectCertificate(rejectingCert.id, certRejectionReason.trim());
    triggerSuccessMsg(`ปฏิเสธคำขอเกียรติบัตรและส่งอีเมลแจ้งเหตุผลไปยัง ${rejectingCert.email} แล้ว`);
    setRejectingCert(null);
  };

  // Filter pending patient requests and available slots
  const pendingRequests = bookings.filter((b) => b.status === 'pending');
  const availableSlots = availabilitySlots.filter((s) => !s.isBooked);

  // Filtered stories in Stories Tab
  const filteredStoriesInAdmin = stories.filter((s) => {
    if (!storySearchFilter) return true;
    const q = storySearchFilter.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.readerName.toLowerCase().includes(q) || s.categoryName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Bar / Role Switcher & Database Sync Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onResetToLanding && (
          <button
            onClick={onResetToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-purple-900 hover:text-purple-950 text-xs sm:text-sm font-semibold transition-all shadow-2xs group cursor-pointer"
            title="กลับสู่หน้าเลือกบทบาท (Role Selection Gateway)"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>← กลับสู่หน้าเลือกบทบาท (Patient, Volunteer, Admin)</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>IndexedDB & localStorage พร้อมใช้งาน (CRUD ถาวร)</span>
          </span>

          {onResetDatabase && (
            <button
              onClick={onResetDatabase}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              title="รีเซ็ตฐานข้อมูลสู่ค่าเริ่มต้น (Default Seed Data)"
            >
              <RefreshCw className="w-3 h-3" />
              <span>รีเซ็ตฐานข้อมูล</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            ✕ ปิด
          </button>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-sky-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>ศูนย์ควบคุมและประสานงานจิตอาสาโรงพยาบาล (Hospital Admin Hub)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              ระบบบริหารจัดการโครงการ "เตียงนี้มีเรื่องเล่า"
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              ประสานการจับคู่นัดหมายข้างเตียง ตรวจสอบคุณภาพไฟล์เสียงอ่าน MP3 จัดการรายงานข้อผิดพลาด 
              และอนุมัติเกียรติบัตรรับรองแก่จิตอาสาเครือข่าย 14 โรงพยาบาลในจังหวัดชลบุรี
            </p>

            {currentAdmin && (
              <div className="mt-3 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs text-xs text-white border border-white/20">
                <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>เจ้าหน้าที่: <strong className="text-amber-200">{currentAdmin.name}</strong> • {currentAdmin.hospital}</span>
                {onAdminLogout && (
                  <button
                    onClick={onAdminLogout}
                    className="ml-2 text-purple-200 hover:text-white underline hover:no-underline text-[11px] cursor-pointer"
                  >
                    ออกจากระบบแอดมิน
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center min-w-[75px]">
              <span className="text-2xl font-bold block">{pendingBookingsCount}</span>
              <span className="text-[10px] text-purple-200">รอนัดหมาย</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-amber-300/40 rounded-2xl p-3 text-center min-w-[85px] bg-amber-500/20">
              <span className="text-2xl font-bold block text-amber-300">{pendingVolunteersCount}</span>
              <span className="text-[10px] text-amber-200 font-semibold">รออนุมัติจิตอาสา</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center min-w-[75px]">
              <span className="text-2xl font-bold block text-sky-200">{pendingAudioCount}</span>
              <span className="text-[10px] text-purple-200">รอตรวจเสียง</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center min-w-[75px]">
              <span className="text-2xl font-bold block text-teal-300">{pendingCertsCount}</span>
              <span className="text-[10px] text-purple-200">ขอเกียรติบัตร</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/20 overflow-x-auto no-scrollbar text-xs font-semibold">
          {/* TAB: พิจารณาอนุมัติตรวจสอบจิตอาสาใหม่ (Requirement 3) */}
          <button
            id="tab-admin-volunteer-approvals"
            type="button"
            onClick={() => setActiveSubTab('volunteer-approvals')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'volunteer-approvals'
                ? 'bg-white text-purple-900 shadow-md font-bold'
                : 'text-white/90 hover:bg-white/15 bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>พิจารณาอนุมัติตรวจสอบจิตอาสาใหม่</span>
            {pendingVolunteersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-purple-950 rounded-full text-[10px] font-bold animate-pulse">
                {pendingVolunteersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('matching')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'matching'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>จับคู่การนัดหมาย (Matching)</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-purple-950 rounded-full text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            id="tab-admin-cancellations"
            onClick={() => setActiveSubTab('cancellations')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'cancellations'
                ? 'bg-white text-rose-900 shadow-xs font-bold'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
            <span>Cancellations / Urgent Re-matching</span>
            {cancelledBookings.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                {cancelledBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audio-reviews')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'audio-reviews'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>ตรวจไฟล์เสียงอ่าน ({audioSubmissions.length})</span>
            {pendingAudioCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-purple-950 rounded-full text-[10px] font-bold animate-pulse">
                {pendingAudioCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('stories')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'stories'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>คลังเรื่องเล่าสาธารณะ ({stories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audio-reports')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'audio-reports'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>รายงานปัญหาไฟล์เสียง ({audioErrorReports.length})</span>
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-400 text-white rounded-full text-[10px] font-bold">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('evaluations')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'evaluations'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>ฐานข้อมูลการประเมิน & เตือนจิตอาสา ({evaluations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('certificates')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'certificates'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>คำขอเกียรติบัตร ({certificateRequests.length})</span>
            {pendingCertsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-sky-300 text-purple-950 rounded-full text-[10px] font-bold">
                {pendingCertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'bookings'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>รายการนัดหมายทั้งหมด ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('volunteers')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'volunteers'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ทำเนียบจิตอาสา ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ตั้งค่าเครือข่ายโรงพยาบาล ({CHONBURI_HOSPITALS.length} แห่ง)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE: VOLUNTEER APPROVALS (Requirement 3: พิจารณาอนุมัติตรวจสอบจิตอาสาใหม่) */}
      {/* ========================================================================= */}
      {activeSubTab === 'volunteer-approvals' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                      พิจารณาอนุมัติตรวจสอบจิตอาสาใหม่ (Volunteer Approval Workflow)
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Chon Buri Network
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    ตรวจสอบประวัติผู้สมัคร คุณสมบัติความพร้อม โรงพยาบาลในจังหวัดชลบุรีที่สะดวกปฏิบัติหน้าที่ 
                    และรับฟังคลิปเสียงอ่านตัวอย่าง (Voice Sample Recording) เพื่อกดอนุมัติหรือไม่อนุมัติการเข้าใช้งานระบบ
                  </p>
                </div>
              </div>

              {/* Status summary counters */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center min-w-[70px]">
                  <span className="text-xs font-bold text-amber-800 block">รอการอนุมัติ</span>
                  <span className="text-lg font-black text-amber-700">{pendingVolunteersCount}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[70px]">
                  <span className="text-xs font-bold text-emerald-800 block">อนุมัติแล้ว</span>
                  <span className="text-lg font-black text-emerald-700">{approvedVolunteersCount}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center min-w-[70px]">
                  <span className="text-xs font-bold text-rose-800 block">ไม่อนุมัติ</span>
                  <span className="text-lg font-black text-rose-700">{rejectedVolunteersCount}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {[
                  { id: 'pending', label: 'รอการตรวจสอบ', count: pendingVolunteersCount, color: 'text-amber-700 bg-amber-100' },
                  { id: 'approved', label: 'อนุมัติแล้ว', count: approvedVolunteersCount, color: 'text-emerald-700 bg-emerald-100' },
                  { id: 'rejected', label: 'ไม่อนุมัติ', count: rejectedVolunteersCount, color: 'text-rose-700 bg-rose-100' },
                  { id: 'all', label: 'ทั้งหมด', count: volunteers.length, color: 'text-slate-700 bg-slate-200' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVolunteerApprovalFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      volunteerApprovalFilter === tab.id
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      volunteerApprovalFilter === tab.id ? 'bg-white/20 text-white' : tab.color
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={volunteerSearchQuery}
                  onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, โรงพยาบาล..."
                  className="w-full text-xs pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* Volunteer Application Cards List */}
          {(() => {
            const query = volunteerSearchQuery.trim().toLowerCase();
            const filtered = volunteers.filter((v) => {
              // 1. Filter by status
              const isPending = v.approvalStatus === 'pending' || v.status === 'pending';
              const isApproved = v.approvalStatus === 'approved' || v.status === 'verified' || v.status === 'active';
              const isRejected = v.approvalStatus === 'rejected' || v.status === 'rejected';

              if (volunteerApprovalFilter === 'pending' && !isPending) return false;
              if (volunteerApprovalFilter === 'approved' && !isApproved) return false;
              if (volunteerApprovalFilter === 'rejected' && !isRejected) return false;

              // 2. Filter by search query
              if (query) {
                const matchName = v.fullName?.toLowerCase().includes(query) || v.nickname?.toLowerCase().includes(query);
                const matchEmail = v.email?.toLowerCase().includes(query);
                const matchPhone = v.phone?.includes(query);
                const matchHosp = v.availableHospitals?.some((h) => h.toLowerCase().includes(query)) || v.hospitalZone?.toLowerCase().includes(query);
                return matchName || matchEmail || matchPhone || matchHosp;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 space-y-2">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">ไม่พบรายการจิตอาสาตามเงื่อนไขที่เลือก</h4>
                  <p className="text-xs text-slate-500">
                    {volunteerApprovalFilter === 'pending'
                      ? 'ขณะนี้ไม่มีใบสมัครจิตอาสาที่รอการอนุมัติ ทุกรายการได้รับการตรวจสอบเรียบร้อยแล้ว'
                      : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะด้านบน'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filtered.map((vol) => {
                  const isPending = vol.approvalStatus === 'pending' || vol.status === 'pending';
                  const isApproved = vol.approvalStatus === 'approved' || vol.status === 'verified' || vol.status === 'active';
                  const isRejected = vol.approvalStatus === 'rejected' || vol.status === 'rejected';

                  return (
                    <div
                      key={vol.id}
                      className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                        isPending
                          ? 'border-amber-300/90 hover:border-amber-400 shadow-amber-500/5 ring-1 ring-amber-200/50'
                          : isApproved
                          ? 'border-emerald-200 hover:border-emerald-300'
                          : 'border-rose-200 hover:border-rose-300'
                      }`}
                    >
                      {/* Top identity row */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={vol.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                              alt={vol.fullName}
                              className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm sm:text-base text-slate-800 truncate">
                                  {vol.fullName}
                                </h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium shrink-0">
                                  {vol.nickname}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {vol.email} • {vol.phone}
                              </p>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                อายุ {vol.age} ปี • เพศ {vol.gender === 'female' ? 'หญิง' : vol.gender === 'male' ? 'ชาย' : 'อื่นๆ'} • สมัครเมื่อ {vol.registeredAt ? new Date(vol.registeredAt).toLocaleDateString('th-TH') : 'ก่อนหน้า'}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>รอการอนุมัติ</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>อนุมัติแล้ว</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>ไม่อนุมัติ</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selected Chon Buri Hospitals */}
                        <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                          <span className="font-semibold text-slate-700 block mb-1">
                            🏥 โรงพยาบาลในชลบุรีที่สะดวกปฏิบัติหน้าที่ ({vol.availableHospitals?.length || 0} แห่ง):
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {vol.availableHospitals && vol.availableHospitals.length > 0 ? (
                              vol.availableHospitals.map((h) => (
                                <span key={h} className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                  {h}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">ไม่ได้ระบุ</span>
                            )}
                          </div>
                        </div>

                        {/* Reading Style & Bio */}
                        <div className="text-xs text-slate-600 space-y-1 mb-3">
                          <p><strong className="text-slate-700">สไตล์การอ่าน:</strong> {vol.readingStyle} ({vol.voiceToneDesc})</p>
                          <p><strong className="text-slate-700">หมวดที่ถนัด:</strong> {vol.specialties?.join(', ') || 'นิทาน / เรื่องสั้น'}</p>
                          {vol.bio && (
                            <p className="italic text-slate-500 line-clamp-2 mt-1">
                              "{vol.bio}"
                            </p>
                          )}
                        </div>

                        {/* VOICE SAMPLE RECORDING AUDIO PLAYER (Requirement 3: Listen to uploaded voice sample) */}
                        <div className="mt-2 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/90">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                              <Volume2 className="w-4 h-4 text-amber-700" />
                              <span>คลิปเสียงอ่านตัวอย่าง (Voice Sample Recording)</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              ความยาว {vol.voiceSampleDuration || '00:20'}
                            </span>
                          </div>

                          {vol.voiceSampleAudioUrl ? (
                            <div className="rounded-xl overflow-hidden border border-amber-200 bg-white">
                              <Html5AudioPlayer 
                                audioUrl={vol.voiceSampleAudioUrl}
                                title={`คลิปเสียงทดสอบ: ${vol.fullName} (${vol.nickname})`}
                                subtitle={`สไตล์: ${vol.readingStyle}`}
                              />
                            </div>
                          ) : (
                            <div className="p-3 text-center bg-white rounded-xl border border-amber-200 text-xs text-amber-800 italic">
                              ผู้สมัครบันทึกเสียงแล้วแต่ไม่ได้อัปโหลดไฟล์เสียงแบบถาวร (มีบันทึกความพร้อม {vol.readingStyle})
                            </div>
                          )}
                        </div>

                        {/* Rejection / Approval Notes */}
                        {vol.rejectionReason && (
                          <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <strong>เหตุผลที่ไม่อนุมัติ:</strong> {vol.rejectionReason}
                          </div>
                        )}
                        {vol.adminNotes && isApproved && (
                          <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                            <strong>บันทึกการอนุมัติ:</strong> {vol.adminNotes}
                          </div>
                        )}
                      </div>

                      {/* Admin Action Buttons (Approve / Reject / Revert) */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                healingSound.playClickBeep();
                                setRejectModalVolunteer(vol);
                                setVolunteerRejectReasonChoice(standardVolunteerRejectReasons[0]);
                                setVolunteerRejectCustomText('');
                              }}
                              className="px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ไม่อนุมัติ (Reject)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveVolunteerClick(vol)}
                              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-98"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติ (Approve)</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleRevertVolunteerClick(vol)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-400" />
                            <span>คืนสถานะเป็นรอการตรวจสอบ</span>
                          </button>
                        )}

                        {isRejected && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRevertVolunteerClick(vol)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              <span>คืนสถานะเป็นรอตรวจ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveVolunteerClick(vol)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>เปลี่ยนใจอนุมัติ (Approve)</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 1: MATCHING & SCHEDULE CONTROL (Side-by-side comparative blocks)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'matching' && (
        <div className="space-y-6">
          {/* CANCELLATIONS / URGENT RE-MATCHING ALERT SECTION (Prompt Requirement 3a) */}
          {cancelledBookings.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-white rounded-3xl p-5 sm:p-6 border-2 border-rose-300 shadow-md space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800">
                        Cancellations / Urgent Re-matching (รายการยกเลิกนัดหมาย / จัดคู่ด่วนทดแทน)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                        {cancelledBookings.length} รายการ
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 mt-0.5">
                      มีการยกเลิกนัดหมายข้างเตียง โปรดตรวจสอบเหตุผลการยกเลิก และคลิก "จัดคู่ด่วนใหม่" เพื่อนำคำขอกลับเข้าสู่ระบบจับคู่จิตอาสาทันที
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancelledBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs flex flex-col justify-between gap-3 hover:border-rose-400 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          {b.id}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ยกเลิกโดย: {b.cancelledBy === 'patient' ? 'ผู้ป่วย' : b.cancelledBy === 'volunteer' ? 'จิตอาสา' : 'แอดมิน'}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          ผู้ป่วย: {b.patientInfo.fullName} ({b.patientInfo.age} ปี)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {b.patientInfo.hospitalName} • {b.patientInfo.ward} • เตียง/ห้อง {b.patientInfo.bedNumber}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                          <span>วันที่นัด: <strong>{b.date}</strong></span>
                          <span>•</span>
                          <span>เวลา: <strong>{b.timeSlot}</strong></span>
                        </p>
                      </div>

                      {/* Stated Cancellation Reason Display */}
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>เหตุผลที่แจ้งยกเลิก (Stated Reason):</span>
                        </div>
                        <p className="font-medium pl-4.5 text-slate-800">
                          "{b.cancellationReason || 'ไม่ได้ระบุเหตุผล'}"
                        </p>
                        {b.cancelledAt && (
                          <p className="text-[10px] text-rose-600 pl-4.5">
                            เวลาที่บันทึกยกเลิก: {b.cancelledAt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 truncate">
                        จิตอาสาเดิม: {b.volunteerName || 'ไม่ระบุ'}
                      </span>
                      <button
                        onClick={() => {
                          healingSound.playChime(680, 0.7);
                          if (onReMatchBooking) {
                            onReMatchBooking(b.id);
                          }
                          setSelectedPatientBookingId(b.id);
                          triggerSuccessMsg(`นำคำขอของ ${b.patientInfo.fullName} กลับสู่คิวจับคู่ด่วนแล้ว โปรดเลือกจิตอาสาในคอลัมน์ขวา`);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>⚡ จัดคู่ด่วนใหม่ (Re-match)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-3xl p-5 sm:p-6 border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                ระบบจัดคู่นัดหมายข้างเตียงอัจฉริยะ (Bedside Matchmaking Engine)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                เลือกคำขอของผู้ป่วยจากคอลัมน์ซ้าย และเลือกจิตอาสาที่เปิดรับจากคอลัมน์ขวา เพื่อยืนยันการจับคู่
              </p>
            </div>

            <button
              onClick={handleConfirmMatchAction}
              disabled={!selectedPatientBookingId || !selectedVolunteerSlotId}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedPatientBookingId && selectedVolunteerSlotId
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันการจับคู่นัดหมาย</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Pending Patient Requests */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-800">
                    รายการรอยืนยันจับคู่ ({pendingRequests.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">เลือกจับคู่หรืออนุมัติได้ทันที</span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ไม่มีคำขอนัดหมายใหม่ที่รอการจับคู่
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {pendingRequests.map((b) => {
                    const isSelected = selectedPatientBookingId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          healingSound.playClickBeep();
                          setSelectedPatientBookingId(isSelected ? null : b.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            {b.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {b.patientInfo.fullName} ({b.patientInfo.age} ปี)
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{b.patientInfo.hospitalName} ({b.patientInfo.ward} • {b.patientInfo.bedNumber})</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-amber-700">{b.date} • {b.timeSlot}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            โรค/อาการ: {b.patientInfo.disease} ({b.patientInfo.symptoms})
                          </p>
                          {b.volunteerName && (
                            <div className="flex items-center gap-1.5 text-xs text-sky-800 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 mt-1.5 font-medium">
                              <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>จิตอาสาที่ระบุ: <strong>{b.volunteerName}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Direct Approval Action Button */}
                        <div className="pt-2.5 mt-2.5 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              healingSound.playChime(800, 0.8);
                              if (selectedVolunteerSlotId && onConfirmMatch) {
                                onConfirmMatch(b.id, selectedVolunteerSlotId);
                              } else if (onConfirmMatch) {
                                onConfirmMatch(b.id);
                              } else {
                                onUpdateBookingStatus(b.id, 'confirmed');
                              }
                              triggerSuccessMsg(`อนุมัติและยืนยันการจับคู่สำหรับ ${b.patientInfo.fullName} สำเร็จแล้ว!`);
                              setSelectedPatientBookingId(null);
                              setSelectedVolunteerSlotId(null);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="อนุมัติและยืนยันการจับคู่ทันที"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>อนุมัติ / ยืนยันการจับคู่ (Approve / Confirm Match)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Available Volunteer Slots */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <h3 className="font-bold text-sm text-slate-800">
                    เวลาว่างที่จิตอาสาเปิดรับ ({availableSlots.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">คลิกการ์ดเพื่อเลือก</span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ไม่มีจิตอาสาลงเวลาว่างในขณะนี้
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedVolunteerSlotId === slot.id;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          healingSound.playClickBeep();
                          setSelectedVolunteerSlotId(isSelected ? null : slot.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}

                        <div className="flex items-center gap-2.5">
                          <img
                            src={slot.volunteerAvatar || undefined}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {slot.volunteerName} ({slot.volunteerNickname || 'จิตอาสา'})
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{slot.id}</span>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot.hospitalName}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span className="font-semibold text-teal-800">{slot.date} ({slot.startTime} - {slot.endTime} น.)</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 1.5: CANCELLATIONS & URGENT RE-MATCHING DASHBOARD                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'cancellations' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-white rounded-3xl p-6 sm:p-8 border-2 border-rose-300 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                    Cancellations / Urgent Re-matching (ระบบจัดการการยกเลิก & จับคู่ด่วน)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    ศูนย์รวมนัดหมายที่ถูกยกเลิก แสดงเหตุผลการยกเลิกที่แท้จริง และระบบเร่งด่วนสำหรับจัดหาจิตอาสาทดแทน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('matching')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>ไปที่ระบบจับคู่ (Matchmaking)</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Cancelled Bookings */}
          <div className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">ไม่มีนัดหมายที่ถูกยกเลิกในระบบขณะนี้</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ทุกการนัดหมายข้างเตียงดำเนินไปด้วยความราบรื่น หากมีการยกเลิกจากผู้ป่วยหรือจิตอาสา รายการจะปรากฏที่นี่ทันที
                </p>
              </div>
            ) : (
              cancelledBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-rose-200 shadow-sm hover:border-rose-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                          {b.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                          ยกเลิกการนัดหมาย
                        </span>
                        <span className="text-xs text-rose-700 font-semibold">
                          ยกเลิกโดย: {b.cancelledBy === 'patient' ? 'ผู้ป่วย' : b.cancelledBy === 'volunteer' ? 'จิตอาสา' : 'แอดมิน'}
                        </span>
                        {b.cancelledAt && (
                          <span className="text-xs text-slate-400">• เมื่อ {b.cancelledAt}</span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-800 pt-1">
                        ผู้ป่วย: {b.patientInfo.fullName} ({b.patientInfo.age} ปี)
                        {b.patientInfo.hnNumber && (
                          <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                            HN: {b.patientInfo.hnNumber}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {b.patientInfo.hospitalName} • {b.patientInfo.ward} • เตียง/ห้อง {b.patientInfo.bedNumber} • เบอร์ติดต่อ: {b.patientInfo.contactPhone}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        healingSound.playChime(680, 0.7);
                        if (onReMatchBooking) {
                          onReMatchBooking(b.id);
                        }
                        setActiveSubTab('matching');
                        setSelectedPatientBookingId(b.id);
                        triggerSuccessMsg(`นำคำขอของ ${b.patientInfo.fullName} กลับสู่คิวจับคู่ด่วนแล้ว โปรดเลือกจิตอาสาในคอลัมน์ขวา`);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>⚡ จัดคู่ด่วนใหม่ทันที (Urgent Re-match)</span>
                    </button>
                  </div>

                  {/* Stated Cancellation Reason Card */}
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>เหตุผลการยกเลิกที่ระบุ (Mandatory Cancellation Reason):</span>
                    </div>
                    <p className="font-semibold text-slate-800 pl-5.5 text-sm leading-relaxed">
                      "{b.cancellationReason || 'ไม่ได้ระบุเหตุผล'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-400 block font-semibold">วันและเวลาที่นัดไว้</span>
                      <strong className="text-slate-800">{b.date} ({b.timeSlot})</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-400 block font-semibold">เรื่อง/หมวดที่ต้องการฟัง</span>
                      <strong className="text-slate-800">{b.storyTitle || b.customTopic || 'เรื่องเล่าสร้างกำลังใจ'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-400 block font-semibold">จิตอาสาเดิมที่เคยจับคู่</span>
                      <strong className="text-slate-800">{b.volunteerName || 'ยังไม่ระบุ'}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: AUDIO REVIEW & MANAGEMENT (Full CRUD Operations)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'audio-reviews' && (
        <div className="space-y-6">
          {/* Status Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAudioReviewFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  audioReviewFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ทั้งหมด ({audioSubmissions.length})
              </button>

              <button
                onClick={() => setAudioReviewFilter('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioReviewFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>รอการตรวจสอบ ({pendingAudioCount})</span>
              </button>

              <button
                onClick={() => setAudioReviewFilter('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioReviewFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>อนุมัติเรียบร้อย ({approvedAudioCount})</span>
              </button>

              <button
                onClick={() => setAudioReviewFilter('rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  audioReviewFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>ไม่ผ่านการอนุมัติ ({rejectedAudioCount})</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              ไฟล์เสียงถูกบันทึกใน IndexedDB ถาวรและพร้อมฟังทุกเมื่อ
            </span>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {audioSubmissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <FileAudio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">ไม่มีผลงานเสียงอ่านในระบบ</h4>
                <p className="text-xs text-slate-400 mt-1">จิตอาสายังไม่ได้ส่งไฟล์เสียง หรือมีการลบรายการออก</p>
              </div>
            ) : audioSubmissions.filter((s) => audioReviewFilter === 'all' || s.status === audioReviewFilter).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">ไม่มีรายการในหมวดนี้ ({audioReviewFilter})</p>
                <button
                  onClick={() => setAudioReviewFilter('all')}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100"
                >
                  ดูทั้งหมด
                </button>
              </div>
            ) : (
              audioSubmissions
                .filter((s) => audioReviewFilter === 'all' || s.status === audioReviewFilter)
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-start justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {sub.id}
                        </span>
                        {sub.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            รออนุมัติ
                          </span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            อนุมัติเรียบร้อย (ในคลังเรื่องเล่า)
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            ไม่ผ่านการอนุมัติ
                          </span>
                        )}
                        <span className="text-xs text-slate-400">• อัปโหลดเมื่อ {sub.uploadedAt}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        {sub.title}
                      </h3>
                      {sub.thaiTitle && sub.thaiTitle !== sub.title && (
                        <p className="text-xs text-slate-400 -mt-1 font-medium">{sub.thaiTitle}</p>
                      )}

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {sub.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          จิตอาสา: {sub.volunteerName} ({sub.volunteerNickname || 'ผู้อ่าน'})
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                          หมวด: {sub.categoryName}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                          ความยาว {sub.durationFormatted} ({sub.fileSizeFormatted})
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-medium border border-teal-100">
                          โทนเสียง: {sub.audioTone}
                        </span>
                      </div>

                      {/* Rejection reason alert */}
                      {sub.status === 'rejected' && sub.rejectionReason && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-rose-700">
                            <AlertCircle className="w-4 h-4" />
                            <span>เหตุผลที่ไม่ผ่านการอนุมัติ:</span>
                          </div>
                          <p className="leading-relaxed pl-5">{sub.rejectionReason}</p>
                          {sub.adminNotes && (
                            <p className="text-[11px] text-rose-600 italic pl-5">บันทึกเพิ่มเติม: {sub.adminNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Approval notes */}
                      {sub.status === 'approved' && sub.adminNotes && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                          <span className="font-bold">บันทึกการอนุมัติ: </span>
                          <span>{sub.adminNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Player & Action Buttons (CRUD) */}
                    <div className="w-full lg:w-84 shrink-0 space-y-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <Html5AudioPlayer
                          src={sub.audioUrl}
                          audioUrl={sub.audioUrl}
                          title={sub.title}
                          subtitle={`${sub.volunteerName} • ${sub.durationFormatted}`}
                        />
                      </div>

                      {/* Dynamic action buttons based on status */}
                      <div className="space-y-2 pt-1">
                        {sub.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveAudio(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              title="อนุมัติและเผยแพร่สู่คลังเรื่องเล่า"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติไฟล์เสียง</span>
                            </button>

                            <button
                              onClick={() => setRejectModalSubmission(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              title="ปฏิเสธพร้อมระบุเหตุผล"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ไม่ผ่านเกณฑ์</span>
                            </button>
                          </div>
                        )}

                        {sub.status === 'approved' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevertAudio(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              title="ดึงกลับมารอตรวจสอบใหม่"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>คืนสถานะรอตรวจ</span>
                            </button>

                            <button
                              onClick={() => setRejectModalSubmission(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              title="เปลี่ยนเป็นไม่ผ่านการอนุมัติ"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ไม่ผ่านเกณฑ์</span>
                            </button>
                          </div>
                        )}

                        {sub.status === 'rejected' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveAudio(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              title="อนุมัติไฟล์เสียงนี้"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติใหม่</span>
                            </button>

                            <button
                              onClick={() => handleRevertAudio(sub)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              title="คืนสถานะรอตรวจสอบ"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>คืนสถานะรอตรวจ</span>
                            </button>
                          </div>
                        )}

                        {/* Permanent Delete Button */}
                        <button
                          onClick={() => handleDeleteAudio(sub)}
                          className="w-full py-1.5 px-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 border border-transparent hover:border-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="ลบไฟล์เสียงและข้อมูลออกจากฐานข้อมูลถาวร"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบผลงานนี้ออกจากระบบถาวร</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: STORIES CATALOG MANAGEMENT (Public Library)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'stories' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                คลังเรื่องเล่าสาธารณะ (Active Stories Catalog)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                จัดการเรื่องเล่าทั้งหมด ({stories.length} เรื่อง)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                เรื่องเล่าที่เผยแพร่ให้ผู้ป่วยและครอบครัวฟังฟรีข้างเตียง รวมถึงเรื่องที่ผ่านการอนุมัติจากจิตอาสา
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเรื่อง หรือจิตอาสา..."
                value={storySearchFilter}
                onChange={(e) => setStorySearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStoriesInAdmin.map((story) => (
              <div
                key={story.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                      {story.categoryName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {story.duration} • ฟังแล้ว {story.listenCount} ครั้ง
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 mt-2 line-clamp-1">{story.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{story.excerpt}</p>
                  <p className="text-[11px] text-slate-600 mt-2 font-medium">
                    🎙️ ผู้อ่าน: <strong>{story.readerName}</strong> ({story.audioTone})
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <Html5AudioPlayer
                    src={story.audioUrl}
                    audioUrl={story.audioUrl}
                    compact={true}
                    title={story.title}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {story.id}</span>
                    <button
                      onClick={() => handleDeleteStoryItem(story)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบออกจากคลัง</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 4: AUDIO ERROR REPORTS (Resolve and thank-you message)             */}
      {/* ========================================================================= */}
      {activeSubTab === 'audio-reports' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                ระบบจัดการข้อร้องเรียนไฟล์เสียง
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                รายงานปัญหาไฟล์เสียงจากผู้ป่วยและพยาบาล
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ตรวจสอบปัญหาไฟล์เสียง ทำเครื่องหมายว่าแก้ไขแล้ว และส่งข้อความขอบคุณกลับไปยังผู้แจ้ง
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {audioErrorReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">ไม่มีรายงานปัญหาไฟล์เสียงในขณะนี้</p>
            ) : (
              audioErrorReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {report.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        เรื่อง: {report.storyTitle}
                      </span>
                      {report.status === 'resolved' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          แก้ไขเรียบร้อยแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          รอดำเนินการ
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-rose-900 font-semibold mt-1">
                      ปัญหา: {report.issueTypeLabel} - "{report.description}"
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      ผู้แจ้ง: {report.reporterName} ({report.reporterContact}) • เมื่อ {report.reportedAt}
                    </p>

                    {report.resolutionNotes && (
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-bold">บันทึกการแก้ไข & ข้อความขอบคุณ: </span>
                        <span>{report.resolutionNotes}</span>
                      </div>
                    )}
                  </div>

                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setResolvingReport(report);
                        setReportResolutionText('ทีมงานได้ทำการปรับแต่งเสียงและอัปเดตไฟล์เสียงใหม่ให้เรียบร้อยแล้ว ขอบคุณสำหรับข้อเสนอแนะเพื่อผู้ป่วยค่ะ');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>แก้ไขแล้ว & ส่งข้อความขอบคุณ</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: FEEDBACK DATABASE & WARNING SYSTEM                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'evaluations' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                ฐานข้อมูลการประเมินและการควบคุมคุณภาพ
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                แบบประเมินจากผู้ป่วย & ระบบออกหนังสือเตือน (Warning System)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ตรวจสอบคะแนนความพึงพอใจ และสามารถออกหนังสือตักเตือน/แจ้งข้อเสนอแนะแก่จิตอาสาได้ทันที
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{ev.volunteerName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{ev.hospitalName} ({ev.date})</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">"{ev.comments}"</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>มารยาท: {ev.etiquetteRating}/5</span>
                    <span>น้ำเสียง: {ev.voiceWarmthRating}/5</span>
                    <span className="font-bold text-amber-600">รวม: {ev.overallRating}/5 ดาว</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const vol = volunteers.find((v) => v.id === ev.volunteerId) || volunteers[0];
                    setWarningVolunteer(vol);
                    setWarningReason(`สืบเนื่องจากข้อเสนอแนะในการอ่านวันที่ ${ev.date}: ขอให้ปรับปรุงระดับเสียงและความสุภาพให้เหมาะสมกับเตียงผู้ป่วย`);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>ออกหนังสือเตือน / แจ้งข้อเสนอแนะ</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: CERTIFICATE APPROVAL TABLE                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'certificates' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                ระบบอนุมัติเกียรติบัตรรับรองดิจิทัล
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
                รายการคำขอรับเกียรติบัตรจิตอาสา
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                เกณฑ์: ส่งไฟล์เสียงครบ 5 ไฟล์ (Online) หรือ อ่านข้างเตียงครบ 3 ครั้ง (Onsite)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {certificateRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">ไม่มีคำขอเกียรติบัตรในขณะนี้</p>
            ) : (
              certificateRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{req.fullNameThai}</span>
                      <span className="text-xs text-slate-500">({req.fullNameEn})</span>
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          อนุมัติแล้ว
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          ปฏิเสธแล้ว
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          รออนุมัติ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      อีเมล: {req.email} • วัตถุประสงค์: {req.purpose}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ผลงาน: ไฟล์เสียง {req.onlineAudioCount}/5 • อ่านข้างเตียง {req.onsiteSessionCount}/3 ครั้ง
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            if (onApproveCertificate) {
                              healingSound.playChime(720, 0.8);
                              onApproveCertificate(req.id);
                              triggerSuccessMsg(`อนุมัติเกียรติบัตรแก่ ${req.fullNameThai} และส่งอีเมลเรียบร้อยแล้ว`);
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติเกียรติบัตร</span>
                        </button>
                        <button
                          onClick={() => setRejectingCert(req)}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          ปฏิเสธ
                        </button>
                      </>
                    )}

                    {req.status === 'approved' && onViewCertificate && (
                      <button
                        onClick={() => onViewCertificate(req)}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>เปิดดูเกียรติบัตร</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 7: ALL BOOKINGS LIST (With Full Update & Delete CRUD)               */}
      {/* ========================================================================= */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                ฐานข้อมูลการนัดหมายข้างเตียง
              </span>
              <h3 className="font-bold text-xl text-slate-800 mt-2">
                บันทึกการนัดหมายทั้งหมด ({bookings.length} รายการ)
              </h3>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    bookingFilter === st
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'ทั้งหมด' : st === 'confirmed' ? 'ยืนยันแล้ว' : st === 'pending' ? 'รอจิตอาสา' : st === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {bookings
              .filter((b) => bookingFilter === 'all' || b.status === bookingFilter)
              .map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {b.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {b.patientInfo.fullName} ({b.patientInfo.age} ปี)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'completed'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status === 'confirmed' ? 'ยืนยันแล้ว' : b.status === 'pending' ? 'รอดำเนินการ' : b.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิกแล้ว'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {b.patientInfo.hospitalName} ({b.patientInfo.ward} • {b.patientInfo.bedNumber})
                    </p>
                    <p className="text-xs font-semibold text-purple-800">
                      วันที่ {b.date} • เวลา {b.timeSlot}
                    </p>
                    {b.cancellationReason && (
                      <p className="text-xs text-rose-600 font-semibold">
                        เหตุผลที่ยกเลิก: {b.cancellationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick Approve Button if Pending */}
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          healingSound.playChime(800, 0.8);
                          if (onConfirmMatch) onConfirmMatch(b.id);
                          else onUpdateBookingStatus(b.id, 'confirmed');
                          triggerSuccessMsg(`อนุมัติและยืนยันนัดหมาย ${b.id} เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                        title="อนุมัติและยืนยันการนัดหมายทันที"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อนุมัติ / ยืนยัน</span>
                      </button>
                    )}

                    {/* Status updater */}
                    <select
                      value={b.status}
                      onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as any)}
                      className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="pending">รอการอนุมัติ (Pending)</option>
                      <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
                      <option value="completed">เสร็จสิ้น (Completed)</option>
                      <option value="cancelled">ยกเลิก (Cancelled)</option>
                    </select>

                    <button
                      onClick={() => handleDeleteBookingItem(b)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="ลบการนัดหมาย"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 8: VOLUNTEERS DIRECTORY                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'volunteers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              ทำเนียบจิตอาสาประจำเครือข่าย
            </span>
            <h3 className="font-bold text-xl text-slate-800 mt-2">
              จิตอาสาที่ลงทะเบียน ({volunteers.length} ท่าน)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={vol.avatar || undefined}
                    alt={vol.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{vol.fullName}</h4>
                    <p className="text-[11px] text-teal-600 font-semibold">{vol.nickname || 'จิตอาสา'}</p>
                    <p className="text-[10px] text-slate-400">{vol.badge}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="text-[11px] text-slate-500">📍 {vol.hospitalZone}</p>
                  <p className="text-[11px] text-slate-500">⭐ เรตติ้ง: {vol.rating} ({vol.reviewCount} รีวิว)</p>
                  <p className="text-[11px] text-slate-500">⏱️ สะสม {vol.totalReadHours} ชม. ({vol.totalStoriesRead} เรื่อง)</p>
                </div>

                <button
                  onClick={() => onViewVolunteer(vol)}
                  className="w-full py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  ดูโปรไฟล์และประวัติ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE: HOSPITAL NETWORK SETTINGS (Admin Settings - 11 Districts, 30 Hosps) */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* Header & Metrics */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      การตั้งค่าและฐานข้อมูลเครือข่ายโรงพยาบาลชลบุรี
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      Admin Settings
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    ศูนย์ข้อมูลเครือข่ายโรงพยาบาลครอบคลุม 11 อำเภอ รวม {CHONBURI_HOSPITALS.length} แห่ง ทั่วจังหวัดชลบุรี เพื่อรองรับการจับคู่จิตอาสาและผู้ป่วยข้างเตียง
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ระบบเชื่อมต่อ 11 อำเภอ ครบ 100%
                </span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <p className="text-xs text-purple-700 font-medium">โรงพยาบาลทั้งหมด</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-purple-950">{CHONBURI_HOSPITALS.length}</span>
                  <span className="text-xs text-purple-600">แห่ง</span>
                </div>
                <p className="text-[11px] text-purple-600/80 mt-1">ครอบคลุมทั้งจังหวัดชลบุรี</p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
                <p className="text-xs text-sky-700 font-medium">อำเภอที่เปิดให้บริการ</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-sky-950">{CHONBURI_DISTRICTS.length}</span>
                  <span className="text-xs text-sky-600">อำเภอ</span>
                </div>
                <p className="text-[11px] text-sky-600/80 mt-1">ทั้ง 11 อำเภอในชลบุรี</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium">โรงพยาบาลรัฐบาล</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-emerald-950">
                    {CHONBURI_HOSPITALS.filter(h => h.ownership === 'รัฐบาล').length}
                  </span>
                  <span className="text-xs text-emerald-600">แห่ง</span>
                </div>
                <p className="text-[11px] text-emerald-600/80 mt-1">รพ.ศูนย์ / มหาวิทยาลัย / ชุมชน</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium">โรงพยาบาลเอกชน</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-indigo-950">
                    {CHONBURI_HOSPITALS.filter(h => h.ownership === 'เอกชน').length}
                  </span>
                  <span className="text-xs text-indigo-600">แห่ง</span>
                </div>
                <p className="text-[11px] text-indigo-600/80 mt-1">พันธมิตรเอกชนเมืองชลบุรี & ศรีราชา</p>
              </div>
            </div>
          </div>

          {/* District Filter Pills & Search Controls */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            {/* District Filter Pills (All 11 Districts) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>กรองตามอำเภอ ({CHONBURI_DISTRICTS.length} อำเภอในชลบุรี):</span>
                </label>
                <span className="text-xs text-slate-500">
                  กำลังแสดง: {settingsDistrictFilter === 'all' ? 'ทุกอำเภอ' : settingsDistrictFilter}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSettingsDistrictFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    settingsDistrictFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
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
                      onClick={() => setSettingsDistrictFilter(district)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        settingsDistrictFilter === district
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {district} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ownership Filter & Search Query */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-500 font-medium shrink-0">สังกัด:</span>
                <button
                  type="button"
                  onClick={() => setSettingsOwnershipFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    settingsOwnershipFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทุกประเภท ({CHONBURI_HOSPITALS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOwnershipFilter('รัฐบาล')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    settingsOwnershipFilter === 'รัฐบาล'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  เฉพาะรัฐบาล ({CHONBURI_HOSPITALS.filter(h => h.ownership === 'รัฐบาล').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOwnershipFilter('เอกชน')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    settingsOwnershipFilter === 'เอกชน'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  เฉพาะเอกชน ({CHONBURI_HOSPITALS.filter(h => h.ownership === 'เอกชน').length})
                </button>
              </div>

              {/* Search bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ รพ., หอผู้ป่วย, ที่อยู่..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
                {settingsSearchQuery && (
                  <button
                    onClick={() => setSettingsSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hospital Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CHONBURI_HOSPITALS
              .filter(h => settingsDistrictFilter === 'all' || h.district === settingsDistrictFilter)
              .filter(h => settingsOwnershipFilter === 'all' || h.ownership === settingsOwnershipFilter)
              .filter(h => {
                if (!settingsSearchQuery.trim()) return true;
                const q = settingsSearchQuery.toLowerCase();
                return (
                  h.name.toLowerCase().includes(q) ||
                  h.nameEn.toLowerCase().includes(q) ||
                  h.district.toLowerCase().includes(q) ||
                  h.address.toLowerCase().includes(q) ||
                  h.suggestedWards.some(w => w.toLowerCase().includes(q))
                );
              })
              .map((hospital) => {
                const hospitalBookingsCount = bookings.filter(b => b.patientInfo.hospitalName === hospital.name).length;
                return (
                  <div
                    key={hospital.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-600" />
                          {hospital.district}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hospital.ownership === 'รัฐบาล'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {hospital.ownership}
                        </span>
                      </div>

                      {/* Hospital Name */}
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {hospital.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {hospital.nameEn}
                      </p>

                      {/* Hospital Type label */}
                      <div className="mt-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {hospital.typeLabel}
                        </span>
                      </div>

                      {/* Address & Phone */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{hospital.address}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${hospital.phone}`} className="text-sky-600 hover:underline font-mono">
                            {hospital.phone}
                          </a>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>เยี่ยม: {hospital.visitingHours}</span>
                        </p>
                      </div>

                      {/* Suggested Wards */}
                      {hospital.suggestedWards && hospital.suggestedWards.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            หอผู้ป่วยที่เปิดรับบริการ ({hospital.suggestedWards.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {hospital.suggestedWards.slice(0, 3).map((w) => (
                              <span
                                key={w}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"
                              >
                                {w}
                              </span>
                            ))}
                            {hospital.suggestedWards.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                +{hospital.suggestedWards.length - 3} หอผู้ป่วย
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status & Quick Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        พร้อมให้บริการ
                      </span>

                      {hospitalBookingsCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFilter('all');
                            setActiveSubTab('bookings');
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
                        >
                          มีนัดหมาย {hospitalBookingsCount} รายการ
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">ยังไม่มีนัดหมาย</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty state if search yields no hospitals */}
          {CHONBURI_HOSPITALS
            .filter(h => settingsDistrictFilter === 'all' || h.district === settingsDistrictFilter)
            .filter(h => settingsOwnershipFilter === 'all' || h.ownership === settingsOwnershipFilter)
            .filter(h => {
              if (!settingsSearchQuery.trim()) return true;
              const q = settingsSearchQuery.toLowerCase();
              return (
                h.name.toLowerCase().includes(q) ||
                h.district.toLowerCase().includes(q) ||
                h.address.toLowerCase().includes(q)
              );
            }).length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">ไม่พบโรงพยาบาลที่ตรงตามเงื่อนไขการค้นหา</h4>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตการกรองอำเภอและสังกัด</p>
              <button
                type="button"
                onClick={() => {
                  setSettingsDistrictFilter('all');
                  setSettingsOwnershipFilter('all');
                  setSettingsSearchQuery('');
                }}
                className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
      {/* REJECTION MODAL FOR AUDIO SUBMISSIONS (Predefined reasons + notes)        */}
      {/* ========================================================================= */}
      {rejectModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setRejectModalSubmission(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleConfirmAudioReject} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">ระบุเหตุผลที่ไม่ผ่านการอนุมัติ</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    เรื่อง: {rejectModalSubmission.title}
                  </p>
                </div>
              </div>

              {/* Standard Predefined Reasons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">เลือกเหตุผลมาตรฐาน</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {standardRejectionReasons.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedStandardReason === r
                          ? 'bg-rose-50/70 border-rose-300 font-semibold text-rose-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stdReason"
                        value={r}
                        checked={selectedStandardReason === r}
                        onChange={() => setSelectedStandardReason(r)}
                        className="text-rose-600 focus:ring-rose-400 cursor-pointer"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ข้อเสนอแนะเพิ่มเติมสำหรับจิตอาสา</label>
                <textarea
                  value={customRejectionText}
                  onChange={(e) => setCustomRejectionText(e.target.value)}
                  rows={2}
                  placeholder="เช่น มีเสียงพัดลมในนาทีที่ 01:20 ขอแนะนำให้อัดในห้องที่เงียบขึ้นค่ะ..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalSubmission(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  ยืนยันการปฏิเสธ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL FOR AUDIO REPORT */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setResolvingReport(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleConfirmResolveReport} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">ส่งข้อความขอบคุณ & แจ้งผลแก้ไข</h3>
                  <p className="text-xs text-slate-500">ผู้แจ้ง: {resolvingReport.reporterName}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ข้อความขอบคุณและการดำเนินการแก้ไข</label>
                <textarea
                  value={reportResolutionText}
                  onChange={(e) => setReportResolutionText(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  บันทึก & ส่งข้อความ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WARNING MODAL */}
      {warningVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setWarningVolunteer(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleConfirmWarning} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">ออกหนังสือเตือน / ข้อเสนอแนะ</h3>
                  <p className="text-xs text-slate-500">จิตอาสา: {warningVolunteer.fullName}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ระดับความสำคัญ</label>
                <select
                  value={warningSeverity}
                  onChange={(e) => setWarningSeverity(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 outline-none bg-white cursor-pointer"
                >
                  <option value="advisory">ข้อเสนอแนะเพื่อพัฒนา (Advisory)</option>
                  <option value="warning">หนังสือตักเตือน (Formal Warning)</option>
                  <option value="critical">ตักเตือนขั้นวิกฤต (Critical)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">รายละเอียดเหตุผล</label>
                <textarea
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-200 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningVolunteer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  ออกหนังสือเตือน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT CERTIFICATE MODAL */}
      {rejectingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setRejectingCert(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleConfirmRejectCert} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">ปฏิเสธคำขอเกียรติบัตร</h3>
                  <p className="text-xs text-slate-500">จิตอาสา: {rejectingCert.fullNameThai}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ระบุเหตุผลเพื่อส่งกลับทางอีเมล</label>
                <textarea
                  value={certRejectionReason}
                  onChange={(e) => setCertRejectionReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingCert(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  ยืนยันการปฏิเสธ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
