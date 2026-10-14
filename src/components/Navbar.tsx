import React from 'react';
import { UserRole, VolunteerProfile, PatientAccount } from '../types';
import { 
  BookHeart, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  CalendarPlus, 
  Search, 
  Sparkles, 
  Volume2, 
  Bell, 
  RefreshCw, 
  Info, 
  FileAudio, 
  Upload, 
  ArrowLeft, 
  CalendarCheck,
  Star,
  Award,
  Calendar,
  Headphones,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  AlertTriangle,
  LogOut,
  Building2,
  HeartHandshake,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  currentVolunteer?: VolunteerProfile | null;
  currentPatient?: PatientAccount | null;
  isRegistrationPage?: boolean;
  onSelectRole: (role: UserRole) => void;
  onResetToLanding?: () => void;
  onExploreDirectly?: () => void;
  activeTab: 'home' | 'volunteer-register' | 'patient-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings' | 'service-evaluations';
  setActiveTab: (tab: 'home' | 'volunteer-register' | 'patient-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings' | 'service-evaluations') => void;
  volunteerSubTab?: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability';
  onNavigateVolunteerSubTab?: (subTab: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability') => void;
  adminSubTab?: 'matching' | 'cancellations' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings';
  onNavigateAdminSubTab?: (subTab: 'matching' | 'cancellations' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings') => void;
  onOpenEvaluationAction?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  bookingCount: number;
  pendingAudioCount?: number;
  notificationCount?: number;
  onOpenInfoModal: () => void;
  onOpenRoleSelector: () => void;
  onOpenNotificationCenter?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentVolunteer,
  currentPatient,
  isRegistrationPage = false,
  onSelectRole,
  onResetToLanding,
  onExploreDirectly,
  activeTab,
  setActiveTab,
  volunteerSubTab = 'status',
  onNavigateVolunteerSubTab,
  adminSubTab = 'matching',
  onNavigateAdminSubTab,
  onOpenEvaluationAction,
  searchQuery,
  setSearchQuery,
  bookingCount,
  pendingAudioCount = 0,
  notificationCount = 0,
  onOpenInfoModal,
  onOpenRoleSelector,
  onOpenNotificationCenter,
  onLogout,
}) => {
  const isReg = isRegistrationPage || activeTab === 'volunteer-register' || activeTab === 'patient-register';

  // Role badge display
  const getRoleBadge = () => {
    if (isReg) {
      if (activeTab === 'volunteer-register') {
        return {
          label: 'ลงทะเบียนจิตอาสาใหม่',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
        };
      }
      return {
        label: 'ลงทะเบียนผู้รับบริการใหม่',
        icon: <Users className="w-3.5 h-3.5" />,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      };
    }

    switch (currentRole) {
      case 'patient':
        return {
          label: currentPatient ? `ผู้ป่วย: ${currentPatient.fullName.split(' ')[0]}` : 'ผู้รับบริการ / ผู้ป่วย',
          icon: <Users className="w-3.5 h-3.5" />,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        };
      case 'volunteer':
        return {
          label: currentVolunteer ? `จิตอาสา: ${currentVolunteer.nickname || currentVolunteer.fullName}` : 'อาสาสมัคร / จิตอาสา',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
        };
      case 'admin':
        return {
          label: 'ผู้ดูแลระบบ (Admin)',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
        };
      default:
        return {
          label: 'เลือกบทบาท',
          icon: <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />,
          color: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300 font-semibold shadow-2xs',
        };
    }
  };

  const roleInfo = getRoleBadge();

  // Helper to dynamically navigate to the active role's respective home dashboard
  const handleRoleHomeClick = () => {
    if (currentRole === 'volunteer') {
      setActiveTab('volunteer-audio');
      if (onNavigateVolunteerSubTab) {
        onNavigateVolunteerSubTab('status');
      }
    } else if (currentRole === 'admin') {
      setActiveTab('admin');
      if (onNavigateAdminSubTab) {
        onNavigateAdminSubTab('matching');
      }
    } else if (currentRole === 'patient') {
      setActiveTab('home');
    } else {
      // Unauthenticated / Landing guest
      if (onResetToLanding) {
        onResetToLanding();
      } else {
        setActiveTab('home');
      }
    }
  };

  // Helper to handle guest story browse click
  const handleGuestBrowseStories = () => {
    if (onExploreDirectly) {
      onExploreDirectly();
    } else {
      setActiveTab('home');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* Top hospital announcement & global utilities notice bar */}
      <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-blue-50 border-b border-sky-100/60 px-4 py-1.5 text-xs text-sky-900 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-medium text-sky-700 bg-white/80 px-2 py-0.5 rounded-full border border-sky-200/80">
            <Volume2 className="w-3 h-3 text-sky-600 animate-pulse" />
            เสียงอ่านข้างเตียงบำบัดใจ
          </span>
          <span className="hidden sm:inline text-slate-600">
            เปิดให้บริการเพื่อส่งมอบความหวัง รอยยิ้ม และความสงบในโรงพยาบาล 30 แห่ง 11 อำเภอในชลบุรี
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">

          {currentRole !== null && onResetToLanding && (
            <>
              <button
                onClick={onResetToLanding}
                className="flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
                title="กลับสู่หน้าหลักเลือกบทบาท (Role Selection Gateway)"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">หน้าหลักเลือกบทบาท</span>
                <span className="sm:hidden">เลือกบทบาท</span>
              </button>
              <span className="text-slate-300">|</span>
            </>
          )}

          <button
            onClick={onOpenInfoModal}
            className="flex items-center gap-1 hover:text-sky-700 text-slate-500 transition-colors cursor-pointer"
            title="เกี่ยวกับโครงการ ReadHeal"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline">เกี่ยวกับ ReadHeal</span>
          </button>

          <span className="text-slate-300">|</span>

          <button
            onClick={onOpenRoleSelector}
            className="flex items-center gap-1 font-medium text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
            title="สลับบทบาทผู้ใช้งาน (Switch Role)"
          >
            <RefreshCw className="w-3 h-3" />
            <span>สลับบทบาท</span>
          </button>
        </div>
      </div>

      {/* Main navigation header container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-4 lg:gap-6">
          {/* Brand Logo & title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div 
              onClick={handleRoleHomeClick} 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0"
              title="ReadHeal - เตียงนี้มีเรื่องเล่า"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
                <BookHeart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">
                    ReadHeal
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700">
                    TH
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal hidden lg:block">
                  เตียงนี้มีเรื่องเล่า • ชลบุรี
                </p>
              </div>
            </div>

            {/* Role indicator pill */}
            <button
              onClick={onOpenRoleSelector}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${roleInfo.color}`}
              title="คลิกเพื่อสลับบทบาทผู้ใช้งาน"
            >
              {roleInfo.icon}
              <span className="max-w-[100px] sm:max-w-none truncate">{roleInfo.label}</span>
            </button>
          </div>

          {/* Search bar (visible on tablet and desktop) */}
          <div className="flex-1 max-w-xs xl:max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเรื่องเล่า, นิทาน, หรือจิตอาสา..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-700 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/70 hover:bg-slate-300 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* DYNAMIC ROLE-BASED NAVIGATION ITEMS (DESKTOP) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {/* REGISTRATION GUEST VIEW: Minimal navigation when on registration forms */}
            {isReg ? (
              <>
                <button
                  id="nav-reg-role-select"
                  onClick={() => {
                    if (onResetToLanding) onResetToLanding();
                    else onOpenRoleSelector();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>← หน้าหลักเลือกบทบาท</span>
                </button>

                <button
                  id="nav-reg-home"
                  onClick={() => {
                    if (onResetToLanding) onResetToLanding();
                    else setActiveTab('home');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-slate-100 text-slate-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>หน้าแรก</span>
                </button>

                <button
                  id="nav-reg-about"
                  onClick={onOpenInfoModal}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>เกี่ยวกับ ReadHeal</span>
                </button>
              </>
            ) : (
              <>
                {/* VIEW 1: Unauthenticated / Guest View (Landing Page) */}
                {currentRole === null && (
                  <>
                    <button
                      id="nav-guest-select-role"
                      onClick={onOpenRoleSelector}
                      className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <span>เลือกบทบาท</span>
                    </button>

                    <button
                      id="nav-guest-home"
                      onClick={() => {
                        if (onResetToLanding) onResetToLanding();
                        else setActiveTab('home');
                      }}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        activeTab === 'home'
                          ? 'bg-slate-100 text-slate-800 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>หน้าแรก</span>
                    </button>
                  </>
                )}

            {/* VIEW 2: Patient Role View */}
            {currentRole === 'patient' && (
              <>
                <button
                  id="nav-patient-home"
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  หน้าแรก
                </button>

                <button
                  id="nav-patient-stories"
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'home'
                      ? 'text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>คลังเสียงบำบัด</span>
                </button>

                <button
                  id="nav-patient-book"
                  onClick={() => setActiveTab('booking')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'booking'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70'
                  }`}
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>จองคิวอ่านข้างเตียง</span>
                </button>

                <button
                  id="nav-patient-my-bookings"
                  onClick={() => setActiveTab('my-bookings')}
                  className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'my-bookings'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-slate-500" />
                  <span>การนัดหมายของฉัน</span>
                  {bookingCount > 0 && (
                    <span className="w-4.5 h-4.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {bookingCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-patient-switch-role"
                  onClick={onOpenRoleSelector}
                  className="px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
                  title="สลับไปบทบาทอื่น"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>สลับบทบาท</span>
                </button>
              </>
            )}

            {/* VIEW 3: Volunteer Reader Role View (Cleaned & Simplified) */}
            {currentRole === 'volunteer' && (
              <>
                <button
                  id="nav-vol-home"
                  onClick={() => setActiveTab('home')}
                  className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="หน้าแรกของระบบ"
                >
                  <span>หน้าแรก</span>
                </button>

                <button
                  id="nav-vol-dashboard"
                  onClick={() => setActiveTab('volunteer-audio')}
                  className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'volunteer-audio'
                      ? 'bg-sky-600 text-white font-semibold shadow-xs'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80'
                  }`}
                  title="ศูนย์จิตอาสา (Dashboard & ระบบงานข้างเตียง)"
                >
                  <HeartHandshake className="w-4 h-4 shrink-0" />
                  <span>ศูนย์จิตอาสา (Dashboard)</span>
                </button>

                <button
                  id="nav-vol-switch-role"
                  onClick={onOpenRoleSelector}
                  className="h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-200/80 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  title="สลับไปบทบาทอื่น (ผู้ป่วย หรือ เจ้าหน้าที่)"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>สลับบทบาท</span>
                </button>
              </>
            )}

            {/* VIEW 4: Admin Role View */}
            {currentRole === 'admin' && (
              <>
                <button
                  id="nav-admin-home"
                  onClick={handleRoleHomeClick}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'matching'
                      ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="หน้าแรกแอดมิน (แดชบอร์ดแอดมินภาพรวม)"
                >
                  หน้าแรก
                </button>

                <button
                  id="nav-admin-dashboard"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('matching');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'matching'
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>แดชบอร์ดแอดมิน</span>
                </button>

                <button
                  id="nav-admin-audio-review"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('audio-reviews');
                  }}
                  className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'audio-reviews'
                      ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileAudio className="w-4 h-4 text-purple-600" />
                  <span>ตรวจอนุมัติไฟล์เสียง</span>
                  {pendingAudioCount > 0 && (
                    <span className="w-4.5 h-4.5 bg-amber-400 text-purple-950 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-2xs">
                      {pendingAudioCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-admin-matchmaking"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('matching');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'matching'
                      ? 'text-purple-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>จัดคู่นัดหมาย (Matchmaking)</span>
                </button>

                <button
                  id="nav-admin-cancellations"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('cancellations');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'cancellations'
                      ? 'bg-rose-50 text-rose-800 font-semibold border border-rose-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="รายการยกเลิกนัดหมายและจัดคู่ด่วนทดแทน"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Cancellations / จัดคู่ด่วน</span>
                </button>

                <button
                  id="nav-admin-certificates"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('certificates');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'certificates'
                      ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>อนุมัติเกียรติบัตร</span>
                </button>

                <button
                  id="nav-admin-feedbacks"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('evaluations');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'evaluations'
                      ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>จัดการฟีดแบค</span>
                </button>

                <button
                  id="nav-admin-hospitals-settings"
                  onClick={() => {
                    setActiveTab('admin');
                    if (onNavigateAdminSubTab) onNavigateAdminSubTab('settings');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin' && adminSubTab === 'settings'
                      ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="ตั้งค่าและฐานข้อมูลเครือข่ายโรงพยาบาลชลบุรี 11 อำเภอ"
                >
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>ตั้งค่าโรงพยาบาล</span>
                </button>

                <button
                  id="nav-admin-evaluations-portal"
                  onClick={() => {
                    if (onOpenEvaluationAction) onOpenEvaluationAction();
                    else setActiveTab('service-evaluations');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'service-evaluations'
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                  title="ดูผลประเมินและรีวิวทั้งหมด"
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>ประเมินผลการบริการ</span>
                </button>

                <button
                  id="nav-admin-switch-role"
                  onClick={onOpenRoleSelector}
                  className="px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-all flex items-center gap-1 cursor-pointer"
                  title="สลับไปบทบาทอื่น"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>สลับบทบาท</span>
                </button>
              </>
            )}
              </>
            )}
          </nav>

          {/* Right Action Icons: Notification Center & Logout Button & Mobile Switcher */}
          <div className="flex items-center gap-2">
            {/* Explicit Logout Button (for Patient, Volunteer, Admin) */}
            {currentRole !== null && onLogout && (
              <button
                id="nav-btn-logout-main"
                onClick={onLogout}
                className="h-9 flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/90 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                title="ออกจากระบบ (Logout) และล้างข้อมูลการเข้าสู่ระบบ"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">ออก</span>
              </button>
            )}

            {/* Notification Center Bell Button (Shown only for authenticated roles: patient, volunteer, admin) */}
            {currentRole !== null && onOpenNotificationCenter && (
              <button
                id="nav-btn-notifications"
                onClick={onOpenNotificationCenter}
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-all cursor-pointer border border-transparent hover:border-sky-100"
                title="ศูนย์การแจ้งเตือน (Notifications)"
              >
                <Bell className="w-4.5 h-4.5 text-slate-600" />
                {notificationCount > 0 && (
                  <span className="absolute 1 top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-2xs">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Switch Role Button */}
            <button
              onClick={onOpenRoleSelector}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="สลับบทบาท"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search bar visible on small screens */}
        <div className="pb-2 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเรื่องเล่า, นิทาน, ธรรมะ..."
              className="w-full bg-slate-50 text-xs sm:text-sm text-slate-700 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400"
            />
          </div>
        </div>

        {/* MOBILE HORIZONTAL SCROLL CHIPS (STRICTLY ROLE-BASED DYNAMIC MENU) */}
        <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 pt-0.5 text-xs">
          {/* REGISTRATION GUEST VIEW: Minimal mobile navigation */}
          {isReg ? (
            <>
              <button
                id="mobile-nav-reg-role-select"
                onClick={() => {
                  if (onResetToLanding) onResetToLanding();
                  else onOpenRoleSelector();
                }}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>← หน้าหลักเลือกบทบาท</span>
              </button>

              <button
                id="mobile-nav-reg-home"
                onClick={() => {
                  if (onResetToLanding) onResetToLanding();
                  else setActiveTab('home');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-slate-200 text-slate-800 font-semibold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                หน้าแรก
              </button>

              <button
                id="mobile-nav-reg-about"
                onClick={onOpenInfoModal}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>เกี่ยวกับ ReadHeal</span>
              </button>
            </>
          ) : (
            <>
              {/* VIEW 1 (MOBILE): Unauthenticated / Guest View */}
              {currentRole === null && (
            <>
              <button
                onClick={onOpenRoleSelector}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold bg-sky-50 text-sky-800 border border-sky-300 flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>เลือกบทบาท</span>
              </button>

              <button
                onClick={() => {
                  if (onResetToLanding) onResetToLanding();
                  else setActiveTab('home');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-slate-200 text-slate-800 font-semibold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                หน้าแรก
              </button>

              <button
                onClick={onOpenInfoModal}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>เกี่ยวกับ ReadHeal</span>
              </button>
            </>
          )}

          {/* VIEW 2 (MOBILE): Patient Role View */}
          {currentRole === 'patient' && (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                หน้าแรก
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-emerald-700 border border-slate-200/80 flex items-center gap-1 shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>คลังเสียงบำบัด</span>
              </button>

              <button
                onClick={() => setActiveTab('booking')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'booking'
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                }`}
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>จองคิวอ่านข้างเตียง</span>
              </button>

              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'my-bookings'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>การนัดหมายของฉัน {bookingCount > 0 ? `(${bookingCount})` : ''}</span>
              </button>

              <button
                onClick={onOpenRoleSelector}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-500 border border-slate-200/80 flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>สลับบทบาท</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </>
          )}

          {/* VIEW 3 (MOBILE): Volunteer Reader Role View (Cleaned & Simplified) */}
          {currentRole === 'volunteer' && (
            <>
              <button
                id="nav-vol-mob-home"
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                หน้าแรก
              </button>

              <button
                id="nav-vol-mob-dashboard"
                onClick={() => setActiveTab('volunteer-audio')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'volunteer-audio'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span>ศูนย์จิตอาสา (Dashboard)</span>
              </button>

              <button
                id="nav-vol-mob-switch-role"
                onClick={onOpenRoleSelector}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-600 border border-slate-200/80 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>สลับบทบาท</span>
              </button>
            </>
          )}

          {/* VIEW 4 (MOBILE): Admin Role View */}
          {currentRole === 'admin' && (
            <>
              <button
                onClick={handleRoleHomeClick}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'matching'
                    ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                หน้าแรก
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('matching');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'matching'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>แดชบอร์ดแอดมิน</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('audio-reviews');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'audio-reviews'
                    ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <FileAudio className="w-3.5 h-3.5 text-purple-600" />
                <span>ตรวจอนุมัติไฟล์เสียง {pendingAudioCount > 0 ? `(${pendingAudioCount})` : ''}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('matching');
                }}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center gap-1 shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>จัดคู่นัดหมาย (Matchmaking)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('cancellations');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'cancellations'
                    ? 'bg-rose-50 text-rose-800 font-semibold border border-rose-300'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Cancellations / จัดคู่ด่วน</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('certificates');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'certificates'
                    ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>อนุมัติเกียรติบัตร</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('evaluations');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'evaluations'
                    ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>จัดการฟีดแบค</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  if (onNavigateAdminSubTab) onNavigateAdminSubTab('settings');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'admin' && adminSubTab === 'settings'
                    ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>ตั้งค่าโรงพยาบาล</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenEvaluationAction) onOpenEvaluationAction();
                  else setActiveTab('service-evaluations');
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium flex items-center gap-1 shrink-0 ${
                  activeTab === 'service-evaluations'
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>ประเมินผลการบริการ</span>
              </button>

              <button
                onClick={onOpenRoleSelector}
                className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-slate-50 text-slate-500 border border-slate-200/80 flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>สลับบทบาท</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl whitespace-nowrap font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </>
          )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
