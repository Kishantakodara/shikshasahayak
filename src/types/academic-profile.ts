// ============================================================
// SHIKSHA SAHAYAK OS - ACADEMIC PROFILE & DEVICE SESSION TYPES
// ============================================================

export interface StudentAcademicProfileSpec {
  userId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  universityId: string;
  universityName: string;
  college?: string;
  degreeId: string;
  degreeName: string;
  branchId: string;
  branchName: string;
  semester: number;
  enrollmentNumber?: string;
  enrollmentNo?: string;
  academicYear: string;
  enrollmentYear?: number | null;
  expectedGraduationYear?: number | null;
  preferredLanguage: string;
  currentSubjects?: string[];
  goals?: string[] | null;
  careerGoal?: string;
  interests?: string[];
  learningStyle?: 'Visual' | 'Hands-on' | 'Reading';
  bandwidthPreference?: 'High-Speed' | 'Low-Bandwidth Offline';
  theme?: 'light' | 'dark';
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSessionSpec {
  id: string;
  userId: string;
  deviceName: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastActiveAt: string;
  isActive: boolean;
  createdAt: string;
}

