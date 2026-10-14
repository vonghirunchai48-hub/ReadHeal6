export type UserRole = 'patient' | 'volunteer' | 'admin' | null;

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  iconName: string;
  colorClass: string;
  bgColorClass: string;
  storyCount: number;
}

export interface VolunteerProfile {
  id: string;
  fullName: string;
  nickname: string;
  dob: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  password?: string;
  hospitalZone: string; // Text summary
  availableHospitals: string[]; // List of Chon Buri hospitals volunteer is available for
  bio: string;
  readingStyle: string; // e.g. "เสียงนุ่มนวล สบายๆ", "มีชีวิตชีวา สนุกสนาน", "สงบผ่อนคลาย"
  voiceToneDesc: string;
  voiceSampleDuration?: string;
  voiceSampleAudioUrl?: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  totalReadHours: number;
  totalStoriesRead: number;
  badge: string;
  availableDays: string[];
  availableTimeSlots: string[];
  avatar: string;
  status: 'active' | 'pending' | 'verified' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  registeredAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  specialties: string[];
}

export interface Story {
  id: string;
  title: string;
  thaiTitle?: string;
  author: string;
  readerId: string;
  readerName: string;
  readerAvatar: string;
  readerBadge: string;
  categoryId: string;
  categoryName: string;
  duration: string; // e.g. "08:45"
  durationSeconds: number;
  listenCount: number;
  likes: number;
  excerpt: string;
  fullText: string;
  audioTone: string;
  coverImage: string;
  tags: string[];
  rating: number;
  recommendedFor: string;
  audioUrl?: string; // HTML5 playable audio URL
}

export interface PatientInfo {
  fullName: string;
  dob: string;
  age: number;
  gender: Gender;
  hospitalName: string; // Strictly Chon Buri hospital
  hospitalId?: string;
  ward: string;
  bedNumber: string;
  contactPhone: string;
  caregiverName?: string;
  disease: string; // โรคประจำตัว / ภาวะที่กำลังรักษา
  symptoms: string; // อาการสำคัญในปัจจุบัน
  hnNumber?: string; // เลขประจำตัวผู้ป่วย (HN) สำหรับการยืนยันสถานะ
  verificationStatus?: 'verified' | 'pending';
  readingInterests: string[];
  specialNeeds?: string; // e.g. "ต้องการเสียงค่อยเป็นพิเศษ", "พักฟื้นหลังผ่าตัด", "สายตาฝ้าฟาง"
  email?: string;
  password?: string;
}

export interface PatientAccount {
  id: string;
  email: string;
  password: string; // Stored in persistent local state
  fullName: string;
  dob?: string;
  age?: number;
  gender?: Gender;
  contactPhone: string;
  hospitalName: string;
  ward?: string;
  bedNumber?: string;
  hnNumber?: string;
  disease?: string;
  symptoms?: string;
  readingInterests?: string[];
  specialNeeds?: string;
  createdAt: string;
}

export interface BookingRequest {
  id: string;
  patientInfo: PatientInfo;
  volunteerId: string;
  volunteerName: string;
  volunteerAvatar: string;
  categoryId: string;
  categoryName: string;
  storyId?: string;
  storyTitle?: string;
  customTopic?: string;
  date: string;
  timeSlot: string; // Selected preset or custom time e.g. "14:20 - 15:15 น."
  customTimeSlot?: string;
  format: 'bedside_visit' | 'audio_call' | 'hospital_tablet';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'patient' | 'volunteer' | 'admin';
  slots?: BookingSlotItem[];
  isMatched?: boolean;
  matchedAt?: string;
  matchedBy?: string;
  isEvaluated?: boolean;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentStory: Story | null;
  progress: number; // 0 to 100
  currentTime: number; // seconds
  duration: number; // seconds
  volume: number; // 0 to 1
  ambientSound: 'none' | 'piano' | 'nature' | 'rain';
  playbackRate: number;
  isExpanded: boolean;
}

export interface AudioSubmission {
  id: string;
  title: string;
  thaiTitle?: string;
  author: string;
  volunteerId: string;
  volunteerName: string;
  volunteerNickname?: string;
  volunteerAvatar: string;
  categoryId: string;
  categoryName: string;
  targetHospitals: string[]; // Chon Buri hospitals
  targetConditions: string[]; // Recommended patient conditions / symptoms
  audioTone: string; // e.g. อบอุ่น นุ่มนวล, ผ่อนคลายก่อนนอน
  excerpt: string;
  fullScript: string;
  fileName: string;
  fileSize: number; // bytes
  fileSizeFormatted: string;
  audioUrl: string; // Real playable HTML5 audio URL
  durationSeconds: number;
  durationFormatted: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  adminNotes?: string;
}

export interface AudioErrorReport {
  id: string;
  storyId?: string;
  storyTitle: string;
  submissionId?: string;
  reporterName: string;
  reporterContact: string;
  issueType: 'distorted_sound' | 'too_quiet' | 'wrong_title' | 'missing_audio' | 'other';
  issueTypeLabel: string;
  description: string;
  reportedAt: string;
  status: 'pending' | 'resolved';
  resolutionNotes?: string;
  resolvedAt?: string;
  thankYouMessageSent?: boolean;
}

export interface VolunteerAvailabilitySlot {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerNickname?: string;
  volunteerAvatar: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "11:00"
  hospitalName: string;
  preferredCategories?: string[];
  isBooked: boolean;
  bookedRequestId?: string;
  createdAt: string;
}

export interface BookingSlotItem {
  id: string;
  date: string;
  timeSlot: string;
  format: 'bedside_visit' | 'audio_call' | 'hospital_tablet';
  hospitalName: string;
  ward?: string;
  bedNumber?: string;
}

export interface NotificationItem {
  id: string;
  recipientRole: 'patient' | 'volunteer' | 'admin';
  recipientId?: string;
  title: string;
  message: string;
  type: 'match' | 'cancellation' | 'warning' | 'certificate' | 'review' | 'report' | 'info' | 'system';
  read: boolean;
  createdAt: string;
  emailSent?: boolean;
  emailAddress?: string;
  actionUrlTab?: 'home' | 'volunteer-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings';
}

export interface ServiceEvaluation {
  id: string;
  bookingId: string;
  volunteerId: string;
  volunteerName: string;
  patientNameAnonymous: string;
  hospitalName: string;
  date: string;
  etiquetteRating: number; // 1-5
  voiceWarmthRating: number; // 1-5
  overallRating: number; // 1-5
  comments: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface VolunteerWarning {
  id: string;
  volunteerId: string;
  volunteerName: string;
  reason: string;
  feedbackRefId?: string;
  issuedBy: string;
  issuedAt: string;
  severity: 'advisory' | 'warning' | 'critical';
  acknowledged: boolean;
}

export interface CertificateRequest {
  id: string;
  volunteerId: string;
  volunteerName: string;
  fullNameThai: string;
  fullNameEn: string;
  email: string;
  phone: string;
  purpose: string;
  onlineAudioCount: number; // >= 5 to qualify
  onsiteSessionCount: number; // >= 3 to qualify
  eligible: boolean;
  status: 'pending' | 'approved' | 'rejected';
  certificateId?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

