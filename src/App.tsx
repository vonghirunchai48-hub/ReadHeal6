import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserRole, 
  Category, 
  VolunteerProfile, 
  Story, 
  BookingRequest, 
  AudioPlayerState,
  AudioSubmission,
  AudioErrorReport,
  VolunteerAvailabilitySlot,
  NotificationItem,
  ServiceEvaluation,
  VolunteerWarning,
  CertificateRequest,
  PatientAccount
} from './types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_VOLUNTEERS, 
  INITIAL_STORIES, 
  INITIAL_BOOKINGS,
  INITIAL_PATIENT_ACCOUNTS
} from './data/mockData';
import { INITIAL_AUDIO_SUBMISSIONS } from './data/mockAudioSubmissions';
import { 
  INITIAL_AUDIO_ERROR_REPORTS, 
  INITIAL_VOLUNTEER_AVAILABILITY, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_EVALUATIONS, 
  INITIAL_VOLUNTEER_WARNINGS, 
  INITIAL_CERTIFICATE_REQUESTS 
} from './data/mockOperationalData';
import { Navbar } from './components/Navbar';
import { RoleSelectionPage } from './components/RoleSelectionPage';
import { VolunteerRegistration } from './components/VolunteerRegistration';
import { PatientRegistration } from './components/PatientRegistration';
import { VolunteerAudioPortal } from './components/VolunteerAudioPortal';
import { MainDashboard } from './components/MainDashboard';
import { PatientBookingFlow } from './components/PatientBookingFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { MyBookingsView } from './components/MyBookingsView';
import { StoryModal } from './components/StoryModal';
import { VolunteerProfileModal } from './components/VolunteerProfileModal';
import { BedsideAudioPlayer } from './components/BedsideAudioPlayer';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { AboutProjectModal } from './components/AboutProjectModal';
import { VolunteerLoginModal } from './components/VolunteerLoginModal';
import { VolunteerStatusCheckModal } from './components/VolunteerStatusCheckModal';
import { PatientLoginModal } from './components/PatientLoginModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { DigitalCertificateModal } from './components/DigitalCertificateModal';
import { AudioErrorReportModal } from './components/AudioErrorReportModal';
import { AdminLoginModal, CENTRAL_ADMIN_ACCOUNT } from './components/AdminLoginModal';
import { ServiceEvaluationsView } from './components/ServiceEvaluationsView';
import { healingSound } from './utils/audioSynthesizer';
import { 
  safeSaveToLocalStorage, 
  safeLoadFromLocalStorage, 
  saveAudioToIndexedDB, 
  deleteAudioFromIndexedDB, 
  hydrateAudioSubmissions, 
  hydrateStories,
  hydrateVolunteers, 
  clearAllLocalStorage 
} from './utils/persistentStorage';

export default function App() {
  // Current user role: null represents landing/role selection gateway screen
  const [currentRole, setCurrentRole] = useState<UserRole>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'home' | 'volunteer-register' | 'patient-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings' | 'service-evaluations'
  >('home');

  // Sub-tab state for Volunteer & Admin portals
  const [volunteerSubTab, setVolunteerSubTab] = useState<'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability'>('schedule');
  const [adminSubTab, setAdminSubTab] = useState<'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings'>('matching');

  // Master application datasets with localStorage & IndexedDB persistence
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>(() => {
    return safeLoadFromLocalStorage('readheal_volunteers', INITIAL_VOLUNTEERS);
  });

  const [stories, setStories] = useState<Story[]>(() => {
    return safeLoadFromLocalStorage('readheal_stories', INITIAL_STORIES);
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    return safeLoadFromLocalStorage('readheal_bookings', INITIAL_BOOKINGS);
  });

  // Registered Patient Accounts dataset with localStorage persistence
  const [patientAccounts, setPatientAccounts] = useState<PatientAccount[]>(() => {
    return safeLoadFromLocalStorage('readheal_patient_accounts', INITIAL_PATIENT_ACCOUNTS);
  });

  // Current authenticated / active patient user
  const [currentPatientUser, setCurrentPatientUser] = useState<PatientAccount | null>(() => {
    return safeLoadFromLocalStorage('readheal_current_patient', null);
  });

  // Strict Patient Data Isolation (Requirement 2):
  // Filter and display ONLY the appointments that belong strictly to the currently logged-in patient
  const patientBookings = useMemo(() => {
    if (!currentPatientUser) return [];
    const cleanEmail = currentPatientUser.email?.trim().toLowerCase();
    const cleanHn = currentPatientUser.hnNumber?.trim().toLowerCase();
    const cleanName = currentPatientUser.fullName?.trim().toLowerCase();
    const cleanPhone = currentPatientUser.contactPhone?.replace(/\D/g, '');

    return bookings.filter((b) => {
      // 1. Match Email
      if (cleanEmail && b.patientInfo.email && b.patientInfo.email.trim().toLowerCase() === cleanEmail) {
        return true;
      }
      // 2. Match HN Number
      if (cleanHn && b.patientInfo.hnNumber && b.patientInfo.hnNumber.trim().toLowerCase() === cleanHn) {
        return true;
      }
      // 3. Match Full Name exact or core name
      if (cleanName && b.patientInfo.fullName) {
        const bName = b.patientInfo.fullName.trim().toLowerCase();
        if (bName === cleanName) return true;
        const cCore = cleanName.replace(/^(คุณ|นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|คุณลุง|คุณป้า|คุณตา|คุณยาย|น้อง)/g, '').trim();
        const bCore = bName.replace(/^(คุณ|นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|คุณลุง|คุณป้า|คุณตา|คุณยาย|น้อง)/g, '').trim();
        if (cCore.length >= 3 && (bName.includes(cCore) || cleanName.includes(bCore))) {
          return true;
        }
      }
      // 4. Match Contact Phone
      if (cleanPhone && b.patientInfo.contactPhone) {
        const bPhone = b.patientInfo.contactPhone.replace(/\D/g, '');
        if (bPhone.length >= 9 && bPhone === cleanPhone) {
          return true;
        }
      }
      return false;
    });
  }, [bookings, currentPatientUser]);

  // Current authenticated / active volunteer user
  const [currentVolunteerUser, setCurrentVolunteerUser] = useState<VolunteerProfile | null>(() => {
    return safeLoadFromLocalStorage('readheal_current_volunteer', null);
  });

  // Volunteer login / verification modal state
  const [isVolunteerLoginModalOpen, setIsVolunteerLoginModalOpen] = useState(false);
  const [isVolunteerStatusCheckModalOpen, setIsVolunteerStatusCheckModalOpen] = useState(false);
  const [volunteerStatusCheckEmail, setVolunteerStatusCheckEmail] = useState('');

  // Volunteer Audio Submissions dataset
  const [audioSubmissions, setAudioSubmissions] = useState<AudioSubmission[]>(() => {
    return safeLoadFromLocalStorage('readheal_audio_submissions', INITIAL_AUDIO_SUBMISSIONS);
  });

  // Audio Error Reports
  const [audioErrorReports, setAudioErrorReports] = useState<AudioErrorReport[]>(() => {
    return safeLoadFromLocalStorage('readheal_audio_reports', INITIAL_AUDIO_ERROR_REPORTS);
  });

  // Volunteer Availability Slots
  const [availabilitySlots, setAvailabilitySlots] = useState<VolunteerAvailabilitySlot[]>(() => {
    return safeLoadFromLocalStorage('readheal_availability_slots', INITIAL_VOLUNTEER_AVAILABILITY);
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return safeLoadFromLocalStorage('readheal_notifications', INITIAL_NOTIFICATIONS);
  });

  // Service Evaluations
  const [evaluations, setEvaluations] = useState<ServiceEvaluation[]>(() => {
    return safeLoadFromLocalStorage('readheal_evaluations', INITIAL_EVALUATIONS);
  });

  // Volunteer Warnings
  const [warnings, setWarnings] = useState<VolunteerWarning[]>(() => {
    return safeLoadFromLocalStorage('readheal_warnings', INITIAL_VOLUNTEER_WARNINGS);
  });

  // Certificate Requests
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>(() => {
    return safeLoadFromLocalStorage('readheal_certificate_requests', INITIAL_CERTIFICATE_REQUESTS);
  });

  // On-mount: Hydrate audio files from IndexedDB to restore any Base64 Data URLs and ensure sample audio is ready
  useEffect(() => {
    let isMounted = true;
    async function restoreAudioPersistence() {
      try {
        const hydratedSubs = await hydrateAudioSubmissions(audioSubmissions);
        if (isMounted) setAudioSubmissions(hydratedSubs);

        const hydratedSt = await hydrateStories(stories);
        if (isMounted) setStories(hydratedSt);

        const hydratedVols = await hydrateVolunteers(volunteers);
        if (isMounted) setVolunteers(hydratedVols);
      } catch (err) {
        console.warn('Audio hydration warning:', err);
      }
    }
    restoreAudioPersistence();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe reactive synchronization to localStorage
  useEffect(() => {
    safeSaveToLocalStorage('readheal_volunteers', volunteers);
  }, [volunteers]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_stories', stories);
  }, [stories]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_bookings', bookings);
  }, [bookings]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_audio_submissions', audioSubmissions);
  }, [audioSubmissions]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_audio_reports', audioErrorReports);
  }, [audioErrorReports]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_availability_slots', availabilitySlots);
  }, [availabilitySlots]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_evaluations', evaluations);
  }, [evaluations]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_warnings', warnings);
  }, [warnings]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_certificate_requests', certificateRequests);
  }, [certificateRequests]);

  useEffect(() => {
    safeSaveToLocalStorage('readheal_patient_accounts', patientAccounts);
  }, [patientAccounts]);

  useEffect(() => {
    if (currentPatientUser) {
      safeSaveToLocalStorage('readheal_current_patient', currentPatientUser);
    } else {
      try { localStorage.removeItem('readheal_current_patient'); } catch {}
    }
  }, [currentPatientUser]);

  useEffect(() => {
    if (currentVolunteerUser) {
      safeSaveToLocalStorage('readheal_current_volunteer', currentVolunteerUser);
    } else {
      try { localStorage.removeItem('readheal_current_volunteer'); } catch {}
    }
  }, [currentVolunteerUser]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals state
  const [activeStoryModal, setActiveStoryModal] = useState<Story | null>(null);
  const [activeVolunteerModal, setActiveVolunteerModal] = useState<VolunteerProfile | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isPatientLoginModalOpen, setIsPatientLoginModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeCertificateModal, setActiveCertificateModal] = useState<CertificateRequest | null>(null);
  const [activeAudioReportModal, setActiveAudioReportModal] = useState<Story | AudioSubmission | null>(null);

  // Authenticated Hospital Admin State with localStorage persistence
  const [currentAdminUser, setCurrentAdminUser] = useState<{
    name: string;
    email: string;
    hospital: string;
    roleTitle: string;
  } | null>(() => {
    const saved = localStorage.getItem('readheal_current_admin');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentAdminUser) {
        localStorage.setItem('readheal_current_admin', JSON.stringify(currentAdminUser));
      } else {
        localStorage.removeItem('readheal_current_admin');
      }
    } catch (e) {
      console.warn('Failed to save current admin user to localStorage:', e);
    }
  }, [currentAdminUser]);

  // Key to force resetting credentials and inputs in login forms upon logout
  const [authResetKey, setAuthResetKey] = useState(0);

  // Pre-selected objects for booking wizard
  const [bookingPreselectedVolunteer, setBookingPreselectedVolunteer] = useState<VolunteerProfile | null>(null);
  const [bookingPreselectedStory, setBookingPreselectedStory] = useState<Story | null>(null);

  // Bedside Audio Player state
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentStory: null,
    progress: 0,
    currentTime: 0,
    duration: 300,
    volume: 0.8,
    ambientSound: 'piano',
    playbackRate: 1.0,
    isExpanded: false,
  });

  // Role selection from Gateway
  const handleSelectRoleFromGateway = (role: UserRole) => {
    healingSound.playClickBeep();
    if (role === 'volunteer') {
      // Open polite verification dialog instead of direct dashboard entry
      setIsVolunteerLoginModalOpen(true);
      return;
    }
    if (role === 'admin') {
      // Open secure admin login modal with demo fast track
      setIsAdminLoginModalOpen(true);
      return;
    }
    setCurrentRole(role);
    setActiveTab('home');
  };

  // Play a story
  const handlePlayStory = (story: Story) => {
    healingSound.playClickBeep();
    if (playerState.currentStory?.id === story.id && playerState.isPlaying) {
      // Pause
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      healingSound.stopAmbient();
    } else {
      // Start playback with gentle ambient chime
      setPlayerState({
        ...playerState,
        currentStory: story,
        isPlaying: true,
        duration: story.durationSeconds,
        currentTime: 0,
        progress: 0,
      });
      healingSound.startAmbient(playerState.ambientSound);
    }
  };

  // Navigate to booking with preselected volunteer & story
  const handleStartBookingWithVolunteer = (
    volunteer: VolunteerProfile,
    preferredStory?: Story
  ) => {
    healingSound.playClickBeep();
    setBookingPreselectedVolunteer(volunteer);
    if (preferredStory) {
      setBookingPreselectedStory(preferredStory);
    }
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Volunteer login / verification success handler
  const handleVolunteerLoginSuccess = (volunteer: VolunteerProfile) => {
    setCurrentVolunteerUser(volunteer);
    setCurrentRole('volunteer');
    setActiveTab('volunteer-audio');
    setIsVolunteerLoginModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch to Volunteer Registration from login modal
  const handleGoToVolunteerRegistration = () => {
    setCurrentRole('volunteer');
    setActiveTab('volunteer-register');
    setIsVolunteerLoginModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Register new volunteer handler (sets pending status and notifies admin)
  const handleRegisterVolunteer = (newVolunteer: VolunteerProfile) => {
    setVolunteers((prev) => [newVolunteer, ...prev.filter((v) => v.id !== newVolunteer.id)]);
    
    // Create admin notification
    const newNotif: NotificationItem = {
      id: `NOTIF-VOL-REG-${Date.now().toString().slice(-6)}`,
      recipientRole: 'admin',
      title: '🟡 มีใบสมัครจิตอาสาใหม่รอการตรวจสอบและอนุมัติ',
      message: `คุณ ${newVolunteer.fullName} (${newVolunteer.nickname || 'จิตอาสา'}) ได้ส่งใบสมัครพร้อมคลิปเสียงอ่านตัวอย่าง`,
      type: 'info',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: 'admin.readheal@chonburi.moph.go.th',
      actionUrlTab: 'admin',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    // Note: Does NOT log into dashboard immediately; status is pending until admin approves
  };

  // Open Volunteer Status Check modal with optional email prefill
  const handleOpenVolunteerStatusCheck = (email?: string) => {
    healingSound.playClickBeep();
    setVolunteerStatusCheckEmail(email || '');
    setIsVolunteerStatusCheckModalOpen(true);
  };

  // Admin: Approve volunteer handler
  const handleApproveVolunteer = (volunteerId: string, adminNotes?: string) => {
    const target = volunteers.find((v) => v.id === volunteerId);
    setVolunteers((prev) =>
      prev.map((v) =>
        v.id === volunteerId
          ? {
              ...v,
              status: 'verified',
              approvalStatus: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentAdminUser?.name || 'ผู้ดูแลระบบส่วนกลาง (ชลบุรี)',
              adminNotes: adminNotes || 'ผ่านการอนุมัติและคลิปเสียงอ่านได้มาตรฐาน',
            }
          : v
      )
    );

    // Notify Volunteer of approval
    const notif: NotificationItem = {
      id: `NOTIF-APPR-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: volunteerId,
      title: '🎉 บัญชีจิตอาสาของคุณได้รับการอนุมัติแล้ว!',
      message: `ยินดีต้อนรับคุณ ${target?.fullName || 'จิตอาสา'} สู่เครือข่ายจิตอาสา ReadHeal ชลบุรี บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว สามารถเข้าสู่ระบบเพื่อเริ่มปฏิบัติหน้าที่ได้ทันที`,
      type: 'system',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: target?.email || 'volunteer@readheal.org',
      actionUrlTab: 'volunteer-audio',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Admin: Reject volunteer handler
  const handleRejectVolunteer = (volunteerId: string, reason: string, adminNotes?: string) => {
    const target = volunteers.find((v) => v.id === volunteerId);
    setVolunteers((prev) =>
      prev.map((v) =>
        v.id === volunteerId
          ? {
              ...v,
              status: 'rejected',
              approvalStatus: 'rejected',
              rejectionReason: reason,
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentAdminUser?.name || 'ผู้ดูแลระบบส่วนกลาง (ชลบุรี)',
              adminNotes,
            }
          : v
      )
    );

    // Notify Volunteer of rejection
    const notif: NotificationItem = {
      id: `NOTIF-REJ-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: volunteerId,
      title: 'แจ้งผลการพิจารณาใบสมัครจิตอาสา ⚠️',
      message: `ใบสมัครของคุณ (${target?.fullName || 'จิตอาสา'}) ยังไม่ผ่านเกณฑ์การอนุมัติ: ${reason}`,
      type: 'warning',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: target?.email || 'volunteer@readheal.org',
      actionUrlTab: 'volunteer-register',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Admin: Revert volunteer to pending
  const handleRevertVolunteerToPending = (volunteerId: string) => {
    setVolunteers((prev) =>
      prev.map((v) =>
        v.id === volunteerId
          ? {
              ...v,
              status: 'pending',
              approvalStatus: 'pending',
              rejectionReason: undefined,
              reviewedAt: undefined,
              adminNotes: undefined,
            }
          : v
      )
    );
  };

  // Admin login success handler (Central System Admin)
  const handleAdminLoginSuccess = (adminData?: {
    name: string;
    email: string;
    hospital: string;
    roleTitle: string;
  }) => {
    healingSound.playChime(750, 0.8);
    const admin = adminData || {
      name: CENTRAL_ADMIN_ACCOUNT.name,
      email: CENTRAL_ADMIN_ACCOUNT.email,
      hospital: CENTRAL_ADMIN_ACCOUNT.hospital,
      roleTitle: CENTRAL_ADMIN_ACCOUNT.roleTitle,
    };
    setCurrentAdminUser(admin);
    setCurrentRole('admin');
    setActiveTab('admin');
    setIsAdminLoginModalOpen(false);
    setIsRoleModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comprehensive logout handler for all active roles (Patient, Volunteer, Admin)
  const handleLogout = () => {
    healingSound.playClickBeep();
    setCurrentRole(null);
    setActiveTab('home');

    // Clear role-specific users
    setCurrentPatientUser(null);
    setCurrentVolunteerUser(null);
    setCurrentAdminUser(null);

    // Clear localStorage session storage
    try {
      localStorage.removeItem('readheal_current_patient');
      localStorage.removeItem('readheal_current_volunteer');
      localStorage.removeItem('readheal_current_admin');
    } catch (e) {
      console.warn('Failed clearing auth session from localStorage:', e);
    }

    // Force resetting all login modal input fields (email, password, identifiers)
    setAuthResetKey((prev) => prev + 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    handleLogout();
  };

  // Patient Login success handler (via modal or direct)
  const handlePatientLoginSuccess = (booking?: BookingRequest, patientAccount?: PatientAccount) => {
    healingSound.playChime(700, 0.7);
    if (patientAccount) {
      setCurrentPatientUser(patientAccount);
    } else if (booking) {
      const matched = patientAccounts.find(
        (a) => (booking.patientInfo.hnNumber && a.hnNumber === booking.patientInfo.hnNumber) ||
               a.fullName === booking.patientInfo.fullName
      );
      if (matched) {
        setCurrentPatientUser(matched);
      } else {
        const fallbackAcc: PatientAccount = {
          id: `pac-${Date.now().toString().slice(-6)}`,
          email: booking.patientInfo.email || `${booking.patientInfo.fullName.replace(/\s+/g, '').toLowerCase()}@readheal.org`,
          password: 'password123',
          fullName: booking.patientInfo.fullName,
          hospitalName: booking.patientInfo.hospitalName,
          ward: booking.patientInfo.ward,
          bedNumber: booking.patientInfo.bedNumber,
          contactPhone: booking.patientInfo.contactPhone,
          hnNumber: booking.patientInfo.hnNumber,
          createdAt: new Date().toISOString(),
        };
        setCurrentPatientUser(fallbackAcc);
      }
    }
    setCurrentRole('patient');
    setActiveTab('my-bookings');
    setIsPatientLoginModalOpen(false);
    setIsRoleModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Register new patient handler
  const handleRegisterPatient = (newAccount: PatientAccount) => {
    healingSound.playChime(700, 0.7);
    setPatientAccounts((prev) => [newAccount, ...prev]);
    setCurrentPatientUser(newAccount);
    setCurrentRole('patient');
    setActiveTab('my-bookings');
    setIsPatientLoginModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Patient Register handler from Gateway
  const handlePatientRegisterFromGateway = () => {
    healingSound.playClickBeep();
    setActiveTab('patient-register');
    setIsPatientLoginModalOpen(false);
    setIsRoleModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Volunteer Register handler from Gateway
  const handleVolunteerRegisterFromGateway = () => {
    healingSound.playClickBeep();
    setActiveTab('volunteer-register');
    setIsVolunteerLoginModalOpen(false);
    setIsRoleModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Fast-Track Demo Mode handler (instant 1-click access as Central System Admin)
  const handleAdminDemoModeFastTrack = () => {
    healingSound.playChime(750, 0.8);
    const demoAdmin = {
      name: CENTRAL_ADMIN_ACCOUNT.name,
      email: CENTRAL_ADMIN_ACCOUNT.email,
      hospital: CENTRAL_ADMIN_ACCOUNT.hospital,
      roleTitle: CENTRAL_ADMIN_ACCOUNT.roleTitle,
    };
    setCurrentAdminUser(demoAdmin);
    setCurrentRole('admin');
    setActiveTab('admin');
    setIsAdminLoginModalOpen(false);
    setIsRoleModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Volunteer portal sub-tab navigation
  const handleNavigateVolunteerSubTab = (
    subTab: 'schedule' | 'status' | 'upload' | 'certificate' | 'feedback' | 'availability'
  ) => {
    healingSound.playClickBeep();
    setCurrentRole('volunteer');
    setActiveTab('volunteer-audio');
    setVolunteerSubTab(subTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin dashboard sub-tab navigation
  const handleNavigateAdminSubTab = (
    subTab: 'matching' | 'cancellations' | 'volunteer-approvals' | 'audio-reviews' | 'audio-reports' | 'evaluations' | 'certificates' | 'bookings' | 'volunteers' | 'stories' | 'settings'
  ) => {
    healingSound.playClickBeep();
    if (!currentAdminUser && currentRole !== 'admin') {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setCurrentRole('admin');
    setActiveTab('admin');
    setAdminSubTab(subTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Service evaluation quick navigation
  const handleOpenPatientEvaluation = () => {
    healingSound.playClickBeep();
    setActiveTab('service-evaluations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create new booking handler with multi-booking and notification triggers
  const handleBookingSuccess = (newBooking: BookingRequest, newAccount?: PatientAccount) => {
    healingSound.playChime(700, 0.7);
    setBookings((prev) => [newBooking, ...prev]);

    if (newAccount) {
      setPatientAccounts((prev) => [newAccount, ...prev]);
      setCurrentPatientUser(newAccount);
      setCurrentRole('patient');
    } else if (!currentPatientUser) {
      const autoAcc: PatientAccount = {
        id: `pac-${Date.now().toString().slice(-6)}`,
        email: newBooking.patientInfo.email || `${newBooking.patientInfo.fullName.replace(/\s+/g, '').toLowerCase()}@readheal.org`,
        password: newBooking.patientInfo.password || 'password123',
        fullName: newBooking.patientInfo.fullName,
        hospitalName: newBooking.patientInfo.hospitalName,
        ward: newBooking.patientInfo.ward,
        bedNumber: newBooking.patientInfo.bedNumber,
        contactPhone: newBooking.patientInfo.contactPhone,
        hnNumber: newBooking.patientInfo.hnNumber,
        createdAt: new Date().toISOString(),
      };
      setPatientAccounts((prev) => [autoAcc, ...prev]);
      setCurrentPatientUser(autoAcc);
      setCurrentRole('patient');
    }

    // Check if slot has matching volunteer
    const matchingSlot = availabilitySlots.find(
      (s) => !s.isBooked && s.date === newBooking.date && s.hospitalName === newBooking.patientInfo.hospitalName
    );

    // Notify Admin of new booking
    const adminNotif: NotificationItem = {
      id: `NOTIF-BK-${Date.now().toString().slice(-6)}`,
      recipientRole: 'admin',
      title: 'มีคำขอนัดหมายอ่านหนังสือใหม่ 📖',
      message: `ผู้ป่วย ${newBooking.patientInfo.fullName} (${newBooking.patientInfo.hospitalName}) รอนัดหมายวันที่ ${newBooking.date} ${newBooking.timeSlot}`,
      type: 'match',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: 'admin.readheal@chonburi.moph.go.th',
      actionUrlTab: 'admin',
    };

    // Always alert patient that booking is pending admin review & matching
    const patientPendingNotif: NotificationItem = {
      id: `NOTIF-PT-PENDING-${Date.now().toString().slice(-6)}`,
      recipientRole: 'patient',
      title: 'คำขอนัดหมายรอผู้ดูแลระบบตรวจสอบ 🟡',
      message: `ระบบได้รับคำขอนัดหมายอ่านหนังสือของคุณ (${newBooking.date} เวลา ${newBooking.timeSlot}) เรียบร้อยแล้ว อยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและยืนยันการจับคู่จิตอาสา`,
      type: 'match',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: newBooking.patientInfo.email || newBooking.patientInfo.contactPhone || 'patient@example.com',
      actionUrlTab: 'my-bookings',
    };

    setNotifications((prev) => [adminNotif, patientPendingNotif, ...prev]);
  };

  // Update booking status (Admin)
  const handleUpdateBookingStatus = (
    id: string,
    newStatus: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  ) => {
    if (newStatus === 'confirmed') {
      handleConfirmMatch(id);
      return;
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  // Cancel booking with mandatory reason input and 3-way notifications (Requirement 2 & 3)
  const handleCancelBooking = (
    id: string, 
    reason: string, 
    cancelledByRole?: 'patient' | 'volunteer' | 'admin'
  ) => {
    healingSound.playClickBeep();
    const effectiveRole = cancelledByRole || currentRole || 'patient';
    const target = bookings.find((b) => b.id === id);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'cancelled',
              cancellationReason: reason,
              cancelledAt: new Date().toLocaleString('th-TH'),
              cancelledBy: effectiveRole,
            }
          : b
      )
    );

    // Release volunteer slot if booked
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.bookedRequestId === id ? { ...s, isBooked: false, bookedRequestId: undefined } : s))
    );

    // 3-WAY REAL-TIME CANCELLATION ALERTS (Requirement 3):
    // a) Admin notification under "Cancellations / Urgent Re-matching" with stated reason
    // b) The opposite party (Patient/Volunteer) with polite notice and status update
    // c) The cancelling user with confirmed cancellation status
    let ptTitle = 'การยกเลิกนัดหมายสำเร็จแล้ว';
    let ptMessage = `คุณได้ยกเลิกการนัดหมายรหัส ${id} วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) เรียบร้อยแล้ว (เหตุผล: ${reason}) ทางระบบได้แจ้งจิตอาสาและเจ้าหน้าที่เรียบร้อยแล้วค่ะ`;

    let volTitle = 'การยกเลิกนัดหมายของคุณสำเร็จแล้ว';
    let volMessage = `คุณได้แจ้งยกเลิกการนัดหมายรหัส ${id} วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) เรียบร้อยแล้ว ระบบได้เปิดช่วงเวลาและแจ้งผู้ป่วยรวมถึงเจ้าหน้าที่ให้เรียบร้อยแล้ว (เหตุผล: ${reason})`;

    let admTitle = '🚨 Cancellations / Urgent Re-matching: มีการยกเลิกนัดหมาย';
    let admMessage = `นัดหมาย ${id} ที่ ${target?.patientInfo.hospitalName || ''} ถูกยกเลิก (เหตุผล: ${reason})`;

    if (effectiveRole === 'patient') {
      // Patient is cancelling:
      // b) Volunteer is opposite party
      volTitle = 'แจ้งเตือน: ผู้ป่วยขอยกเลิกนัดหมายข้างเตียง ⚠️';
      volMessage = `ผู้ป่วย "${target?.patientInfo.fullName || ''}" จำเป็นต้องขอยกเลิกนัดหมายวันที่ ${target?.date || ''} (${target?.timeSlot || ''}) ที่ ${target?.patientInfo.hospitalName || ''} (${target?.patientInfo.ward || ''} เตียง/ห้อง ${target?.patientInfo.bedNumber || ''}) เนื่องจาก: "${reason}" ทางระบบขออภัยในความไม่สะดวกค่ะ`;
      
      // a) Admin alert
      admTitle = '🚨 Cancellations / Urgent Re-matching: ผู้ป่วยยกเลิกนัดหมาย';
      admMessage = `ผู้ป่วย "${target?.patientInfo.fullName || ''}" ยกเลิกนัดหมาย ${id} ที่ ${target?.patientInfo.hospitalName || ''} (${target?.patientInfo.ward || ''} เตียง/ห้อง ${target?.patientInfo.bedNumber || ''}) วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) เหตุผล: "${reason}"`;
    } else if (effectiveRole === 'volunteer') {
      // Volunteer is cancelling:
      // b) Patient is opposite party
      ptTitle = 'แจ้งเตือน: จิตอาสาจำเป็นต้องยกเลิกนัดหมาย ⚠️';
      ptMessage = `จิตอาสา "${target?.volunteerName || 'จิตอาสา'}" ติดภารกิจจำเป็น จึงไม่สามารถเข้าอ่านในวันที่ ${target?.date || ''} (${target?.timeSlot || ''}) ได้ (เหตุผล: "${reason}") เจ้าหน้าที่โรงพยาบาลกำลังเร่งจัดหาจิตอาสาท่านใหม่ให้ท่านโดยเร็วค่ะ`;
      
      // a) Admin alert
      admTitle = '🚨 Cancellations / Urgent Re-matching: จิตอาสายกเลิกนัดหมาย (ด่วน)';
      admMessage = `จิตอาสา "${target?.volunteerName || ''}" ขอยกเลิกนัดหมาย ${id} สำหรับผู้ป่วย "${target?.patientInfo.fullName || ''}" ที่ ${target?.patientInfo.hospitalName || ''} (${target?.patientInfo.ward || ''} เตียง/ห้อง ${target?.patientInfo.bedNumber || ''}) วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) เหตุผล: "${reason}"`;
    } else {
      // Admin is cancelling:
      ptTitle = 'แจ้งเตือน: นัดหมายถูกยกเลิกโดยโรงพยาบาล ⚠️';
      ptMessage = `เจ้าหน้าที่โรงพยาบาลแจ้งยกเลิกนัดหมาย ${id} วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) เนื่องจาก: "${reason}" เจ้าหน้าที่กำลังประสานงานจัดคิวใหม่ให้ท่านค่ะ`;
      volTitle = 'แจ้งเตือน: เจ้าหน้าที่ยกเลิกนัดหมายข้างเตียง ⚠️';
      volMessage = `เจ้าหน้าที่โรงพยาบาลแจ้งยกเลิกนัดหมาย ${id} วันที่ ${target?.date || ''} (${target?.timeSlot || ''}) กับผู้ป่วย "${target?.patientInfo.fullName || ''}" เนื่องจาก: "${reason}"`;
      admTitle = 'ยกเลิกการนัดหมายสำเร็จ';
      admMessage = `คุณได้ยกเลิกนัดหมาย ${id} เรียบร้อยแล้ว (เหตุผล: ${reason})`;
    }

    const cancelNotifs: NotificationItem[] = [
      {
        id: `NOTIF-CANCEL-PT-${Date.now().toString().slice(-6)}`,
        recipientRole: 'patient',
        title: ptTitle,
        message: ptMessage,
        type: 'cancellation',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        emailSent: true,
        emailAddress: target?.patientInfo.contactPhone || 'patient@example.com',
        actionUrlTab: 'my-bookings',
      },
      {
        id: `NOTIF-CANCEL-VOL-${Date.now().toString().slice(-6)}`,
        recipientRole: 'volunteer',
        recipientId: target?.volunteerId,
        title: volTitle,
        message: volMessage,
        type: 'cancellation',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        emailSent: true,
        emailAddress: volunteers.find((v) => v.id === target?.volunteerId)?.email || 'volunteer@example.com',
        actionUrlTab: 'volunteer-audio',
      },
      {
        id: `NOTIF-CANCEL-ADM-${Date.now().toString().slice(-6)}`,
        recipientRole: 'admin',
        title: admTitle,
        message: admMessage,
        type: 'cancellation',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        actionUrlTab: 'admin',
      },
    ];

    setNotifications((prev) => [...cancelNotifs, ...prev]);
  };

  // Re-match cancelled booking (Admin Urgent Re-matching Engine)
  const handleReMatchBooking = (bookingId: string) => {
    healingSound.playChime(680, 0.7);
    const target = bookings.find((b) => b.id === bookingId);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'pending',
              isMatched: false,
              volunteerId: '',
              volunteerName: 'รอจัดสรรจิตอาสา',
              volunteerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              cancellationReason: undefined,
              cancelledAt: undefined,
              cancelledBy: undefined,
            }
          : b
      )
    );

    const reMatchNotif: NotificationItem = {
      id: `NOTIF-REMATCH-ADM-${Date.now().toString().slice(-6)}`,
      recipientRole: 'admin',
      title: 'นำคำขอกลับเข้าสู่คิวจัดคู่ด่วนแล้ว ⚡',
      message: `นำคำขอของผู้ป่วย "${target?.patientInfo.fullName || bookingId}" กลับสู่คิวรอดำเนินการ (Pending) เพื่อจับคู่กับจิตอาสาท่านใหม่เรียบร้อยแล้ว`,
      type: 'match',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      actionUrlTab: 'admin',
    };
    setNotifications((prev) => [reMatchNotif, ...prev]);
  };

  // Confirm Match between patient booking and volunteer (Admin Approval & Match Action)
  const handleConfirmMatch = (bookingId: string, slotId?: string) => {
    healingSound.playChime(750, 0.8);
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const slot = slotId ? availabilitySlots.find((s) => s.id === slotId) : null;

    // Resolve volunteer: preference to selected slot, then booking's existing volunteer, then fallback
    const effectiveVolId = slot?.volunteerId || booking.volunteerId || (volunteers[0]?.id ?? 'vol-1');
    const effectiveVolName = slot?.volunteerName || booking.volunteerName || (volunteers[0]?.fullName ?? 'ครูนิ่ม - พิมลวรรณ');
    const effectiveVolAvatar = slot?.volunteerAvatar || booking.volunteerAvatar || (volunteers[0]?.avatar ?? '');

    // Update booking status card with matched volunteer details
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'confirmed',
              isMatched: true,
              matchedAt: new Date().toLocaleString('th-TH'),
              matchedBy: currentAdminUser?.name || 'ผู้ดูแลระบบส่วนกลาง (Central System Admin)',
              volunteerId: effectiveVolId,
              volunteerName: effectiveVolName,
              volunteerAvatar: effectiveVolAvatar,
            }
          : b
      )
    );

    // Update slot if matched via slot
    if (slot) {
      setAvailabilitySlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                isBooked: true,
                bookedRequestId: bookingId,
              }
            : s
        )
      );
    }

    // Send notifications + simulated emails to Patient, Volunteer, and Admin (Requirement 3)
    const matchNotifs: NotificationItem[] = [
      {
        id: `NOTIF-MATCH-PT-${Date.now().toString().slice(-6)}`,
        recipientRole: 'patient',
        title: 'จับคู่จิตอาสาสำเร็จแล้ว! 🎉',
        message: `ผู้ดูแลระบบได้อนุมัติและยืนยันนัดหมายของคุณกับจิตอาสา "${effectiveVolName}" สำหรับวันที่ ${booking.date} เวลา ${booking.timeSlot} ที่ ${booking.patientInfo.hospitalName} ${booking.patientInfo.ward} (เตียง/ห้อง ${booking.patientInfo.bedNumber}) เรียบร้อยแล้ว ท่านสามารถพิมพ์ใบนัดหมายได้ทันที`,
        type: 'match',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        emailSent: true,
        emailAddress: booking.patientInfo.contactPhone || 'patient.chonburi@example.com',
        actionUrlTab: 'my-bookings',
      },
      {
        id: `NOTIF-MATCH-VOL-${Date.now().toString().slice(-6)}`,
        recipientRole: 'volunteer',
        recipientId: effectiveVolId,
        title: 'นัดหมายข้างเตียงได้รับการยืนยัน 📚',
        message: `ผู้ดูแลระบบยืนยันนัดหมายใหม่อ่านหนังสือกับผู้ป่วย "${booking.patientInfo.fullName}" ที่ ${booking.patientInfo.hospitalName} ${booking.patientInfo.ward} (เตียง/ห้อง ${booking.patientInfo.bedNumber}) วันที่ ${booking.date} เวลา ${booking.timeSlot}`,
        type: 'match',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        emailSent: true,
        emailAddress: volunteers.find((v) => v.id === effectiveVolId)?.email || 'volunteer@example.com',
        actionUrlTab: 'volunteer-audio',
      },
      {
        id: `NOTIF-MATCH-ADM-${Date.now().toString().slice(-6)}`,
        recipientRole: 'admin',
        title: 'ยืนยันการจับคู่นัดหมายสำเร็จ 🎉',
        message: `อนุมัติและยืนยันผู้ป่วย "${booking.patientInfo.fullName}" กับจิตอาสา "${effectiveVolName}" ที่ ${booking.patientInfo.hospitalName} วันที่ ${booking.date} (${booking.timeSlot}) เรียบร้อยแล้ว`,
        type: 'match',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        actionUrlTab: 'admin',
      },
    ];

    setNotifications((prev) => [...matchNotifs, ...prev]);
  };

  // Resolve Audio Error Report (Admin - Requirement 2)
  const handleResolveErrorReport = (reportId: string, resolutionNotes: string) => {
    healingSound.playChime(680, 0.6);
    const report = audioErrorReports.find((r) => r.id === reportId);

    setAudioErrorReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'resolved',
              resolutionNotes,
              resolvedAt: new Date().toLocaleString('th-TH'),
              thankYouMessageSent: true,
            }
          : r
      )
    );

    // Thank you notification
    const thankYouNotif: NotificationItem = {
      id: `NOTIF-RPT-RES-${Date.now().toString().slice(-6)}`,
      recipientRole: 'patient',
      title: 'ข้อความขอบคุณและการแก้ไขปัญหาไฟล์เสียง ❤️',
      message: `เรียน ${report?.reporterName || 'ผู้รับบริการ'}: ปัญหาเรื่อง "${report?.storyTitle || 'ไฟล์เสียง'}" ได้รับการแก้ไขแล้ว: "${resolutionNotes}" ขอบคุณที่ช่วยแจ้งเพื่อยกระดับคุณภาพเสียงข้างเตียงค่ะ`,
      type: 'report',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: report?.reporterContact,
    };
    setNotifications((prev) => [thankYouNotif, ...prev]);
  };

  // Submit Audio Error Report (Patient/User)
  const handleSubmitAudioErrorReport = (
    reportData: Omit<AudioErrorReport, 'id' | 'reportedAt' | 'status'>
  ) => {
    healingSound.playChime(640, 0.6);
    const newReport: AudioErrorReport = {
      ...reportData,
      id: `RPT-2026-${Date.now().toString().slice(-5)}`,
      reportedAt: new Date().toLocaleString('th-TH'),
      status: 'pending',
    };

    setAudioErrorReports((prev) => [newReport, ...prev]);

    // Notify admin
    const adminAlert: NotificationItem = {
      id: `NOTIF-RPT-NEW-${Date.now().toString().slice(-6)}`,
      recipientRole: 'admin',
      title: `รายงานปัญหาไฟล์เสียงใหม่: ${newReport.issueTypeLabel}`,
      message: `เรื่อง "${newReport.storyTitle}" โดย ${newReport.reporterName} รายละเอียด: ${newReport.description}`,
      type: 'report',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      actionUrlTab: 'admin',
    };
    setNotifications((prev) => [adminAlert, ...prev]);
  };

  // Submit Patient Evaluation (Requirement 5)
  const handleSubmitEvaluation = (
    evalData: Omit<ServiceEvaluation, 'id' | 'createdAt'>
  ) => {
    healingSound.playChime(720, 0.8);
    const newEval: ServiceEvaluation = {
      ...evalData,
      id: `EVAL-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toLocaleString('th-TH'),
    };

    setEvaluations((prev) => [newEval, ...prev]);

    // Mark booking as evaluated
    setBookings((prev) =>
      prev.map((b) => (b.id === evalData.bookingId ? { ...b, isEvaluated: true } : b))
    );

    // Notify volunteer
    const volNotif: NotificationItem = {
      id: `NOTIF-EVAL-VOL-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: evalData.volunteerId,
      title: 'ได้รับคะแนนประเมินความพึงพอใจใหม่ ⭐',
      message: `ผู้รับบริการได้ประเมินบริการของคุณ (${evalData.overallRating} ดาว): "${evalData.comments}"`,
      type: 'review',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      actionUrlTab: 'volunteer-audio',
    };

    // If low rating, trigger warning alert to Admin for review
    if (evalData.overallRating <= 2 || evalData.etiquetteRating <= 2) {
      const adminAlert: NotificationItem = {
        id: `NOTIF-EVAL-WARN-${Date.now().toString().slice(-6)}`,
        recipientRole: 'admin',
        title: 'ข้อเสนอแนะที่ต้องติดตาม (คะแนนต่ำกว่าเกณฑ์) ⚠️',
        message: `จิตอาสา ${evalData.volunteerName} ได้รับคะแนนประเมิน ${evalData.overallRating} ดาว: "${evalData.comments}"`,
        type: 'warning',
        read: false,
        createdAt: new Date().toLocaleString('th-TH'),
        actionUrlTab: 'admin',
      };
      setNotifications((prev) => [volNotif, adminAlert, ...prev]);
    } else {
      setNotifications((prev) => [volNotif, ...prev]);
    }
  };

  // Issue Warning to volunteer (Admin - Requirement 5)
  const handleIssueWarning = (
    volunteerId: string,
    volunteerName: string,
    reason: string,
    severity: 'advisory' | 'warning' | 'critical'
  ) => {
    healingSound.playClickBeep();
    const newWarning: VolunteerWarning = {
      id: `WARN-${Date.now().toString().slice(-6)}`,
      volunteerId,
      volunteerName,
      reason,
      severity,
      issuedBy: 'Admin ศูนย์จิตอาสารพ.ชลบุรี',
      issuedAt: new Date().toLocaleString('th-TH'),
      acknowledged: false,
    };

    setWarnings((prev) => [newWarning, ...prev]);

    // Notify volunteer with simulated email
    const volAlert: NotificationItem = {
      id: `NOTIF-WARN-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: volunteerId,
      title: `ข้อความแจ้งเตือน / ให้คำแนะนำการปฏิบัติงาน (${severity.toUpperCase()}) ⚠️`,
      message: `เหตุผล: ${reason} โปรดอ่านและกดรับทราบในพอร์ทัลจิตอาสา`,
      type: 'warning',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: volunteers.find((v) => v.id === volunteerId)?.email || 'volunteer@example.com',
      actionUrlTab: 'volunteer-audio',
    };

    setNotifications((prev) => [volAlert, ...prev]);
  };

  // Acknowledge warning (Volunteer)
  const handleAcknowledgeWarning = (id: string) => {
    healingSound.playClickBeep();
    setWarnings((prev) =>
      prev.map((w) => (w.id === id ? { ...w, acknowledged: true } : w))
    );
  };

  // Add Availability Slot (Volunteer - Requirement 3)
  const handleAddAvailabilitySlot = (
    slot: Omit<VolunteerAvailabilitySlot, 'id' | 'createdAt' | 'isBooked'>
  ) => {
    healingSound.playChime(640, 0.6);
    const newSlot: VolunteerAvailabilitySlot = {
      ...slot,
      id: `SLOT-VOL-${Date.now().toString().slice(-5)}`,
      isBooked: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAvailabilitySlots((prev) => [newSlot, ...prev]);
  };

  // Delete Availability Slot (Volunteer)
  const handleDeleteAvailabilitySlot = (id: string) => {
    healingSound.playClickBeep();
    setAvailabilitySlots((prev) => prev.filter((s) => s.id !== id));
  };

  // Request Certificate (Volunteer - Requirement 6)
  const handleRequestCertificate = (
    certData: Omit<CertificateRequest, 'id' | 'status' | 'createdAt'>
  ) => {
    healingSound.playChime(720, 0.8);
    const newReq: CertificateRequest = {
      ...certData,
      id: `CERT-REQ-${Date.now().toString().slice(-5)}`,
      status: 'pending',
      createdAt: new Date().toLocaleString('th-TH'),
    };

    setCertificateRequests((prev) => [newReq, ...prev]);

    // Notify Admin
    const adminNotif: NotificationItem = {
      id: `NOTIF-CERT-REQ-${Date.now().toString().slice(-6)}`,
      recipientRole: 'admin',
      title: 'มีคำขอเกียรติบัตรจิตอาสาใหม่ 🏆',
      message: `จิตอาสา ${newReq.volunteerName} ยื่นขอเกียรติบัตร (ไฟล์เสียง ${newReq.onlineAudioCount} ไฟล์, ข้างเตียง ${newReq.onsiteSessionCount} ครั้ง)`,
      type: 'certificate',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      actionUrlTab: 'admin',
    };
    setNotifications((prev) => [adminNotif, ...prev]);
  };

  // Approve Certificate (Admin - Requirement 6)
  const handleApproveCertificate = (requestId: string) => {
    healingSound.playChime(800, 0.8);
    const certNum = requestId.replace(/\D/g, '').slice(-4).padStart(4, '0') || '0128';
    const certId = `RH-CERT-2026-${certNum}`;
    const target = certificateRequests.find((c) => c.id === requestId);

    setCertificateRequests((prev) =>
      prev.map((c) =>
        c.id === requestId
          ? {
              ...c,
              status: 'approved',
              certificateId: certId,
              reviewedBy: 'พยาบาลวิชาชีพ กนกวรรณ (รพ.ชลบุรี)',
              reviewedAt: new Date().toLocaleString('th-TH'),
            }
          : c
      )
    );

    // Notify volunteer with simulated email & certificate link
    const volNotif: NotificationItem = {
      id: `NOTIF-CERT-OK-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: target?.volunteerId,
      title: 'คำขอเกียรติบัตรได้รับการอนุมัติแล้ว! 🏆',
      message: `ยินดีด้วยค่ะ เกียรติบัตรรับรองจิตอาสา ReadHeal ของคุณได้รับการอนุมัติเรียบร้อยแล้ว (รหัส: ${certId}) สามารถดาวน์โหลดหรือพิมพ์ได้ทันที และส่งสำเนาเข้าอีเมลเรียบร้อยแล้ว`,
      type: 'certificate',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: target?.email || 'volunteer@example.com',
      actionUrlTab: 'volunteer-audio',
    };
    setNotifications((prev) => [volNotif, ...prev]);
  };

  // Reject Certificate (Admin - Requirement 6)
  const handleRejectCertificate = (requestId: string, reason: string) => {
    healingSound.playClickBeep();
    const target = certificateRequests.find((c) => c.id === requestId);

    setCertificateRequests((prev) =>
      prev.map((c) =>
        c.id === requestId
          ? {
              ...c,
              status: 'rejected',
              rejectionReason: reason,
              reviewedBy: 'พยาบาลวิชาชีพ กนกวรรณ (รพ.ชลบุรี)',
              reviewedAt: new Date().toLocaleString('th-TH'),
            }
          : c
      )
    );

    // Notify volunteer with reason
    const volNotif: NotificationItem = {
      id: `NOTIF-CERT-REJ-${Date.now().toString().slice(-6)}`,
      recipientRole: 'volunteer',
      recipientId: target?.volunteerId,
      title: 'ผลการพิจารณาคำขอเกียรติบัตรจิตอาสา',
      message: `คำขอเกียรติบัตรยังไม่ผ่านการอนุมัติ (เหตุผล: ${reason}) คุณสามารถส่งผลงานเพิ่มเติมและยื่นขอใหม่ได้เสมอค่ะ`,
      type: 'warning',
      read: false,
      createdAt: new Date().toLocaleString('th-TH'),
      emailSent: true,
      emailAddress: target?.email || 'volunteer@example.com',
      actionUrlTab: 'volunteer-audio',
    };
    setNotifications((prev) => [volNotif, ...prev]);
  };

  // View Certificate
  const handleViewCertificate = (certificate: CertificateRequest) => {
    healingSound.playClickBeep();
    setActiveCertificateModal(certificate);
  };

  // Notification center read handlers
  const handleMarkAllNotificationsRead = () => {
    healingSound.playClickBeep();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Submit new audio from Volunteer (Persists audio Data URL to IndexedDB & state)
  const handleSubmitAudio = async (newSubmission: AudioSubmission) => {
    healingSound.playChime(640, 0.6);
    if (newSubmission.audioUrl) {
      await saveAudioToIndexedDB(newSubmission.id, newSubmission.audioUrl);
    }
    setAudioSubmissions((prev) => [newSubmission, ...prev]);
  };

  // Delete audio submission (Removes from submissions, public stories, and IndexedDB)
  const handleDeleteSubmission = (id: string) => {
    healingSound.playClickBeep();
    setAudioSubmissions((prev) => prev.filter((s) => s.id !== id));
    setStories((prev) => prev.filter((s) => s.id !== `story-${id}`));
    deleteAudioFromIndexedDB(id).catch(() => {});
    deleteAudioFromIndexedDB(`story-${id}`).catch(() => {});
  };

  // Revert audio submission back to pending
  const handleRevertSubmissionToPending = (id: string) => {
    healingSound.playClickBeep();
    setAudioSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              status: 'pending',
              rejectionReason: undefined,
              adminNotes: undefined,
              approvedAt: undefined,
              rejectedAt: undefined,
            }
          : sub
      )
    );
    setStories((prev) => prev.filter((s) => s.id !== `story-${id}`));
  };

  // Delete public story from catalog
  const handleDeleteStory = (id: string) => {
    healingSound.playClickBeep();
    setStories((prev) => prev.filter((s) => s.id !== id));
    deleteAudioFromIndexedDB(id).catch(() => {});
  };

  // Delete booking request
  const handleDeleteBooking = (id: string) => {
    healingSound.playClickBeep();
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  // Reset entire database to default seed state
  const handleResetDatabase = () => {
    if (confirm('คุณต้องการรีเซ็ตฐานข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น (Default Seed Data) ใช่หรือไม่? รายการที่อัปโหลดหรือแก้ไขใหม่จะถูกคืนค่า')) {
      healingSound.playChime(600, 0.7);
      clearAllLocalStorage();
      setVolunteers(INITIAL_VOLUNTEERS);
      setStories(INITIAL_STORIES);
      setBookings(INITIAL_BOOKINGS);
      setAudioSubmissions(INITIAL_AUDIO_SUBMISSIONS);
      setAudioErrorReports(INITIAL_AUDIO_ERROR_REPORTS);
      setAvailabilitySlots(INITIAL_VOLUNTEER_AVAILABILITY);
      setNotifications(INITIAL_NOTIFICATIONS);
      setEvaluations(INITIAL_EVALUATIONS);
      setWarnings(INITIAL_VOLUNTEER_WARNINGS);
      setCertificateRequests(INITIAL_CERTIFICATE_REQUESTS);
      hydrateAudioSubmissions(INITIAL_AUDIO_SUBMISSIONS);
      hydrateStories(INITIAL_STORIES);
    }
  };

  // Approve audio submission (Admin: updates status and publishes to public stories catalog)
  const handleApproveSubmission = (id: string, adminNotes?: string) => {
    healingSound.playChime(720, 0.8);
    const target = audioSubmissions.find((s) => s.id === id);

    setAudioSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              status: 'approved',
              adminNotes:
                adminNotes ||
                'ผ่านการตรวจสอบคุณภาพเสียงและการอ่านเรียบร้อยแล้ว ได้มาตรฐานโรงพยาบาลชลบุรี',
              reviewedAt: new Date().toISOString(),
              approvedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
              reviewerName: 'พยาบาลวิชาชีพ กนกวรรณ (Admin รพ.ชลบุรี)',
            }
          : sub
      )
    );

    // If approved, automatically promote to active public stories so patients can immediately listen!
    if (target) {
      const newStory: Story = {
        id: `story-${target.id}`,
        title: target.title,
        thaiTitle: target.thaiTitle || target.title,
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        duration: target.durationFormatted || '03:00',
        durationSeconds: target.durationSeconds || 180,
        author: target.author || target.volunteerName,
        readerName: target.volunteerName,
        readerId: target.volunteerId,
        readerAvatar:
          volunteers.find((v) => v.id === target.volunteerId)?.avatar ||
          target.volunteerAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        readerBadge: 'จิตอาสาที่ผ่านการรับรอง',
        listenCount: 1,
        rating: 5.0,
        recommendedFor: target.targetConditions.join(', ') || 'พักฟื้นทั่วไป',
        audioTone: target.audioTone || 'อบอุ่น นุ่มนวล',
        coverImage:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
        excerpt:
          target.excerpt ||
          'เรื่องเล่าบำบัดใจที่บันทึกโดยจิตอาสาเพื่อมอบพลังใจแก่ผู้ป่วยข้างเตียงในชลบุรี',
        fullText:
          target.fullScript ||
          target.excerpt ||
          'เรื่องเล่าที่ส่งมอบกำลังใจและบรรยากาศอันสงบข้างเตียง...',
        likes: 12,
        tags: ['จิตอาสา', 'เรื่องเล่าใหม่', 'ผ่านการอนุมัติ', 'ชลบุรี'],
        audioUrl: target.audioUrl,
      };

      if (target.audioUrl) {
        saveAudioToIndexedDB(newStory.id, target.audioUrl).catch(() => {});
      }

      setStories((prev) => {
        const filtered = prev.filter((s) => s.id !== newStory.id);
        return [newStory, ...filtered];
      });
    }
  };

  // Reject audio submission (Admin)
  const handleRejectSubmission = (id: string, reason: string, adminNotes?: string) => {
    healingSound.playClickBeep();
    setAudioSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              status: 'rejected',
              rejectionReason: reason,
              adminNotes: adminNotes || '',
              reviewedAt: new Date().toISOString(),
              rejectedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
              reviewerName: 'พยาบาลวิชาชีพ กนกวรรณ (Admin รพ.ชลบุรี)',
            }
          : sub
      )
    );
    // Remove from public stories catalog if it was previously approved
    setStories((prev) => prev.filter((s) => s.id !== `story-${id}`));
  };

  // Play audio submission in floating bedside player
  const handlePlaySubmissionInBedside = (submission: AudioSubmission) => {
    const pseudoStory: Story = {
      id: `sub-${submission.id}`,
      title: submission.title,
      thaiTitle: submission.title,
      categoryId: submission.categoryId,
      categoryName: submission.categoryName,
      duration: submission.durationFormatted,
      durationSeconds: submission.durationSeconds,
      author: submission.author,
      readerName: submission.volunteerName,
      readerId: submission.volunteerId,
      readerAvatar:
        volunteers.find((v) => v.id === submission.volunteerId)?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      readerBadge: 'จิตอาสา ReadHeal',
      listenCount: 0,
      rating: 5.0,
      recommendedFor: submission.targetConditions.join(', ') || 'ผู้ป่วยทั่วไป',
      audioTone: submission.audioTone,
      coverImage:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      excerpt: submission.excerpt,
      fullText: submission.fullScript || submission.excerpt,
      likes: 8,
      tags: ['ไฟล์เสียงทดสอบ', 'จิตอาสา'],
      audioUrl: submission.audioUrl,
    };
    handlePlayStory(pseudoStory);
  };

  // Smoothly reset user role and return to main 3-role selection landing page
  const handleResetToRoleLanding = () => {
    healingSound.playClickBeep();
    setCurrentRole(null);
    setActiveTab('home');
    setSearchQuery('');
    setBookingPreselectedVolunteer(null);
    setBookingPreselectedStory(null);
  };

  // Smart navigation tab switch handler that activates the correct role and tab without dead clicks
  const handleNavigateTab = (
    tab: 'home' | 'volunteer-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings'
  ) => {
    healingSound.playClickBeep();

    // Automatically resolve user role so the requested view displays immediately
    if (tab === 'volunteer-register' || tab === 'volunteer-audio') {
      setCurrentRole('volunteer');
    } else if (tab === 'admin') {
      if (!currentAdminUser && currentRole !== 'admin') {
        setIsAdminLoginModalOpen(true);
        return;
      }
      setCurrentRole('admin');
    } else if (tab === 'booking' || tab === 'my-bookings') {
      if (currentRole === null || currentRole === 'admin') {
        setCurrentRole('patient');
      }
    } else if (tab === 'home') {
      if (currentRole === null) {
        setCurrentRole('patient');
      }
    }

    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct role selection handler that cleanly switches role and sets the primary dashboard tab
  const handleSelectRole = (role: UserRole) => {
    healingSound.playClickBeep();
    if (role === 'admin' && !currentAdminUser) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setCurrentRole(role);
    if (role === 'admin') {
      setActiveTab('admin');
    } else if (role === 'volunteer') {
      setActiveTab('volunteer-audio');
    } else if (role === 'patient') {
      setActiveTab('home');
    } else {
      setActiveTab('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isRegistrationPage =
    activeTab === 'volunteer-register' ||
    activeTab === 'patient-register' ||
    (activeTab === 'booking' && !currentPatientUser);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Main Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        currentVolunteer={currentVolunteerUser}
        currentPatient={currentPatientUser}
        isRegistrationPage={isRegistrationPage}
        onSelectRole={handleSelectRole}
        onResetToLanding={handleResetToRoleLanding}
        onExploreDirectly={() => {
          setCurrentRole('patient');
          setActiveTab('home');
        }}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        volunteerSubTab={volunteerSubTab}
        onNavigateVolunteerSubTab={handleNavigateVolunteerSubTab}
        adminSubTab={adminSubTab}
        onNavigateAdminSubTab={handleNavigateAdminSubTab}
        onOpenEvaluationAction={handleOpenPatientEvaluation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        bookingCount={
          currentRole === 'patient'
            ? patientBookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length
            : bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length
        }
        pendingAudioCount={audioSubmissions.filter((s) => s.status === 'pending').length}
        notificationCount={
          currentRole === 'patient'
            ? notifications.filter((n) => !n.read && n.recipientRole === 'patient').length
            : currentRole === 'volunteer'
            ? notifications.filter(
                (n) =>
                  !n.read &&
                  (n.recipientRole === 'volunteer' ||
                    !n.recipientId ||
                    (currentVolunteerUser && n.recipientId === currentVolunteerUser.id))
              ).length
            : currentRole === 'admin'
            ? notifications.filter((n) => !n.read && n.recipientRole === 'admin').length
            : notifications.filter((n) => !n.read).length
        }
        onOpenInfoModal={() => setIsAboutModalOpen(true)}
        onOpenRoleSelector={() => setIsRoleModalOpen(true)}
        onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* If user has not selected role yet AND is on home, show RoleSelectionPage (Landing / Login Gateway) */}
        {(currentRole === null && activeTab === 'home') ? (
          <RoleSelectionPage
            onSelectRole={handleSelectRoleFromGateway}
            onOpenPatientLogin={() => setIsPatientLoginModalOpen(true)}
            onOpenPatientRegister={handlePatientRegisterFromGateway}
            onOpenVolunteerLogin={() => setIsVolunteerLoginModalOpen(true)}
            onOpenVolunteerRegister={handleVolunteerRegisterFromGateway}
            onOpenVolunteerStatusCheck={() => handleOpenVolunteerStatusCheck()}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onAdminDemoLogin={handleAdminDemoModeFastTrack}
            onExploreDirectly={() => {
              setCurrentRole('patient');
              setActiveTab('home');
            }}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* TAB: Patient Registration Form */}
            {activeTab === 'patient-register' && (
              <PatientRegistration
                onRegisterSuccess={handleRegisterPatient}
                onCancel={handleResetToRoleLanding}
                onResetToLanding={handleResetToRoleLanding}
                onGoToLogin={() => setIsPatientLoginModalOpen(true)}
                existingAccounts={patientAccounts}
              />
            )}
            {/* TAB 1: Main Dashboard (Browse Hub) */}
            {activeTab === 'home' && (
              <MainDashboard
                categories={categories}
                volunteers={volunteers}
                onApproveVolunteer={handleApproveVolunteer}
                onRejectVolunteer={handleRejectVolunteer}
                onRevertVolunteerToPending={handleRevertVolunteerToPending}
                stories={stories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onPlayStory={handlePlayStory}
                currentPlayingStoryId={playerState.currentStory?.id || null}
                isAudioPlaying={playerState.isPlaying}
                onViewStoryDetails={(story) => setActiveStoryModal(story)}
                onViewVolunteerDetails={(vol) => setActiveVolunteerModal(vol)}
                onStartBookingWithVolunteer={handleStartBookingWithVolunteer}
                onNavigateToBooking={() => {
                  setBookingPreselectedVolunteer(null);
                  setBookingPreselectedStory(null);
                  setActiveTab('booking');
                }}
                onResetToLanding={handleResetToRoleLanding}
              />
            )}

            {/* TAB 2: Volunteer Registration & Profile Form */}
            {activeTab === 'volunteer-register' && (
              <VolunteerRegistration
                onRegisterSuccess={handleRegisterVolunteer}
                onCancel={() => setActiveTab('home')}
                onResetToLanding={handleResetToRoleLanding}
                onOpenStatusCheck={handleOpenVolunteerStatusCheck}
              />
            )}

            {/* TAB 2.5: Volunteer Audio Upload, Hours Tracking, Certificate & Feedback Portal */}
            {activeTab === 'volunteer-audio' && (
              <VolunteerAudioPortal
                volunteer={currentVolunteerUser || volunteers[0]}
                submissions={audioSubmissions}
                categories={categories}
                onSubmitAudio={handleSubmitAudio}
                onDeleteSubmission={handleDeleteSubmission}
                onPlayInBedsidePlayer={handlePlaySubmissionInBedside}
                onResetToLanding={handleResetToRoleLanding}
                evaluations={evaluations}
                warnings={warnings.filter((w) => !currentVolunteerUser || w.volunteerId === currentVolunteerUser.id)}
                onAcknowledgeWarning={handleAcknowledgeWarning}
                availabilitySlots={availabilitySlots}
                onAddAvailabilitySlot={handleAddAvailabilitySlot}
                onDeleteAvailabilitySlot={handleDeleteAvailabilitySlot}
                certificateRequests={certificateRequests.filter((c) => !currentVolunteerUser || c.volunteerId === currentVolunteerUser.id)}
                onRequestCertificate={handleRequestCertificate}
                onViewCertificate={handleViewCertificate}
                onsiteCompletedCount={bookings.filter((b) => b.status === 'completed' && (!currentVolunteerUser || b.volunteerId === currentVolunteerUser.id)).length || 3}
                bookings={bookings}
                onCancelBooking={(id, reason) => handleCancelBooking(id, reason, 'volunteer')}
                activeSubTab={volunteerSubTab}
                onSubTabChange={setVolunteerSubTab}
              />
            )}

            {/* TAB 3: Patient Information & Multi-Slot Booking Flow */}
            {activeTab === 'booking' && (
              <PatientBookingFlow
                volunteers={volunteers}
                categories={categories}
                stories={stories}
                preSelectedVolunteer={bookingPreselectedVolunteer}
                preSelectedStory={bookingPreselectedStory}
                onBookingSuccess={handleBookingSuccess}
                onCancel={() => {
                  setBookingPreselectedVolunteer(null);
                  setBookingPreselectedStory(null);
                  setActiveTab('home');
                }}
                onResetToLanding={handleResetToRoleLanding}
                availabilitySlots={availabilitySlots}
                currentPatient={currentPatientUser}
                onRegisterPatientAccount={(acc) => {
                  setPatientAccounts((p) => [acc, ...p]);
                  setCurrentPatientUser(acc);
                }}
              />
            )}

            {/* TAB 4: Admin Dashboard - Audio Review, Matching, Error Reports, Evaluations & Certificates */}
            {activeTab === 'admin' && (
              <AdminDashboard
                bookings={bookings}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onDeleteBooking={handleDeleteBooking}
                volunteers={volunteers}
                stories={stories}
                onDeleteStory={handleDeleteStory}
                onViewVolunteer={(vol) => setActiveVolunteerModal(vol)}
                audioSubmissions={audioSubmissions}
                onApproveSubmission={handleApproveSubmission}
                onRejectSubmission={handleRejectSubmission}
                onRevertSubmissionToPending={handleRevertSubmissionToPending}
                onDeleteSubmission={handleDeleteSubmission}
                onResetToLanding={handleResetToRoleLanding}
                onResetDatabase={handleResetDatabase}
                audioErrorReports={audioErrorReports}
                onResolveErrorReport={handleResolveErrorReport}
                availabilitySlots={availabilitySlots}
                onConfirmMatch={handleConfirmMatch}
                evaluations={evaluations}
                onIssueWarning={handleIssueWarning}
                certificateRequests={certificateRequests}
                onApproveCertificate={handleApproveCertificate}
                onRejectCertificate={handleRejectCertificate}
                onViewCertificate={handleViewCertificate}
                currentAdmin={currentAdminUser}
                onAdminLogout={handleAdminLogout}
                onReMatchBooking={handleReMatchBooking}
                activeSubTab={adminSubTab}
                onSubTabChange={setAdminSubTab}
              />
            )}

            {/* TAB 5: My Bookings & Schedule with Strict Patient Data Isolation */}
            {activeTab === 'my-bookings' && (
              <MyBookingsView
                bookings={patientBookings}
                currentPatient={currentPatientUser}
                onOpenPatientLogin={() => setIsPatientLoginModalOpen(true)}
                onNavigateToBooking={() => {
                  setBookingPreselectedVolunteer(null);
                  setBookingPreselectedStory(null);
                  setActiveTab('booking');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancelBooking={(id, reason) => handleCancelBooking(id, reason, 'patient')}
                onResetToLanding={handleResetToRoleLanding}
                onSubmitEvaluation={handleSubmitEvaluation}
              />
            )}

            {/* TAB 6: Service Evaluations & Patient Reviews View */}
            {activeTab === 'service-evaluations' && (
              <ServiceEvaluationsView
                evaluations={evaluations}
                bookings={bookings}
                currentRole={currentRole}
                currentPatientUser={currentPatientUser}
                currentVolunteerUser={currentVolunteerUser}
                onSubmitEvaluation={handleSubmitEvaluation}
                onBackToHome={() => {
                  healingSound.playClickBeep();
                  if (currentRole === 'patient') {
                    setActiveTab('my-bookings');
                  } else if (currentRole === 'volunteer') {
                    setActiveTab('volunteer-audio');
                  } else if (currentRole === 'admin') {
                    setActiveTab('admin');
                  } else {
                    setActiveTab('home');
                  }
                }}
                onOpenBooking={() => {
                  setBookingPreselectedVolunteer(null);
                  setBookingPreselectedStory(null);
                  setActiveTab('booking');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating / Bedside Audio Player Bar */}
      <BedsideAudioPlayer
        playerState={playerState}
        setPlayerState={setPlayerState}
        onClose={() => {
          setPlayerState((prev) => ({ ...prev, isPlaying: false, currentStory: null }));
          healingSound.stopAmbient();
        }}
        onOpenTranscript={(story) => setActiveStoryModal(story)}
        onReportError={(story) => setActiveAudioReportModal(story)}
      />

      {/* Story Reader Fullscreen / Modal */}
      <StoryModal
        story={activeStoryModal}
        onClose={() => setActiveStoryModal(null)}
        onPlay={handlePlayStory}
        isPlaying={
          playerState.currentStory?.id === activeStoryModal?.id &&
          playerState.isPlaying
        }
        onBookWithReader={(volunteer, story) => {
          handleStartBookingWithVolunteer(volunteer, story);
        }}
        volunteers={volunteers}
        onReportError={(story) => setActiveAudioReportModal(story)}
      />

      {/* Volunteer Profile Detailed Modal */}
      <VolunteerProfileModal
        volunteer={activeVolunteerModal}
        onClose={() => setActiveVolunteerModal(null)}
        onBook={(vol) => handleStartBookingWithVolunteer(vol)}
        stories={stories}
        onPlayStory={handlePlayStory}
      />

      {/* Quick Role Switcher Dialog */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={(role) => {
          handleSelectRole(role);
          setIsRoleModalOpen(false);
        }}
        onOpenAdminLogin={() => {
          setIsRoleModalOpen(false);
          setIsAdminLoginModalOpen(true);
        }}
        onOpenVolunteerStatusCheck={() => {
          setIsRoleModalOpen(false);
          handleOpenVolunteerStatusCheck();
        }}
        onResetToLanding={handleResetToRoleLanding}
      />

      {/* Patient Login & Bedside Verification Modal */}
      <PatientLoginModal
        isOpen={isPatientLoginModalOpen}
        onClose={() => setIsPatientLoginModalOpen(false)}
        bookings={bookings}
        patientAccounts={patientAccounts}
        onLoginSuccess={handlePatientLoginSuccess}
        onGoToRegistration={handlePatientRegisterFromGateway}
        resetKey={authResetKey}
      />

      {/* Volunteer Reader Verification & Login Dialog */}
      <VolunteerLoginModal
        isOpen={isVolunteerLoginModalOpen}
        onClose={() => setIsVolunteerLoginModalOpen(false)}
        volunteers={volunteers}
        onLoginSuccess={handleVolunteerLoginSuccess}
        onGoToRegistration={handleGoToVolunteerRegistration}
        onOpenStatusCheck={handleOpenVolunteerStatusCheck}
        resetKey={authResetKey}
      />

      {/* Volunteer Status Check Modal (Requirement 2) */}
      <VolunteerStatusCheckModal
        isOpen={isVolunteerStatusCheckModalOpen}
        onClose={() => setIsVolunteerStatusCheckModalOpen(false)}
        volunteers={volunteers}
        initialEmail={volunteerStatusCheckEmail}
        onLoginSuccess={(vol) => {
          handleVolunteerLoginSuccess(vol);
          setIsVolunteerStatusCheckModalOpen(false);
        }}
        onGoToRegister={() => {
          setIsVolunteerStatusCheckModalOpen(false);
          handleGoToVolunteerRegistration();
        }}
      />

      {/* Hospital Admin Login & Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        resetKey={authResetKey}
      />

      {/* About Project & Hospital Network Dialog */}
      <AboutProjectModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Notification Center & Email System Dialog */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onMarkAsRead={handleMarkNotificationRead}
        onNavigateTab={(tab) => {
          setIsNotificationModalOpen(false);
          handleNavigateTab(tab);
        }}
      />

      {/* Digital Certificate Viewer & Print Modal */}
      <DigitalCertificateModal
        isOpen={activeCertificateModal !== null}
        onClose={() => setActiveCertificateModal(null)}
        certificate={activeCertificateModal}
        volunteer={
          volunteers.find((v) => v.id === activeCertificateModal?.volunteerId) ||
          currentVolunteerUser
        }
      />

      {/* Audio Error Report Modal */}
      <AudioErrorReportModal
        isOpen={activeAudioReportModal !== null}
        onClose={() => setActiveAudioReportModal(null)}
        targetItem={activeAudioReportModal}
        onSubmitReport={handleSubmitAudioErrorReport}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ReadHeal</span>
            <span>(เตียงนี้มีเรื่องเล่า)</span>
            <span className="text-slate-300">|</span>
            <span>โครงการจิตอาสาอ่านหนังสือบำบัดใจเพื่อผู้ป่วยในโรงพยาบาล</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-sky-600 transition-colors"
            >
              แนวคิดโครงการ
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setCurrentRole('volunteer');
                setActiveTab('volunteer-register');
              }}
              className="hover:text-sky-600 transition-colors"
            >
              ร่วมเป็นจิตอาสา
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (currentRole === 'admin' || currentAdminUser) {
                  setCurrentRole('admin');
                  setActiveTab('admin');
                } else {
                  setIsAdminLoginModalOpen(true);
                }
              }}
              className="hover:text-purple-600 transition-colors"
            >
              สำหรับเจ้าหน้าที่โรงพยาบาล (Admin)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
