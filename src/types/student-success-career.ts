// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Student Success & Career Ecosystem (Sprint 18)
// ============================================================

export interface SkillItem {
  id: string;
  name: string;
  category: "technical" | "programming" | "soft_skill" | "domain";
  icon?: string;
  proficiencyLevel?: "beginner" | "intermediate" | "advanced";
  isVerified?: boolean;
}

export interface StudentProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  technologies: string[];
  projectUrl?: string;
  githubUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface StudentCertification {
  id: string;
  userId: string;
  name: string;
  provider: string;
  credentialId?: string;
  verificationUrl?: string;
  issuedDate: string;
}

export interface RoadmapMilestone {
  id: string;
  roadmapId: string;
  stepNumber: number;
  title: string;
  description: string;
  resourceUrl?: string;
  isCompleted?: boolean;
}

export interface CareerRoadmap {
  id: string;
  title: string;
  category: "Placement Prep" | "GATE Prep" | "CAT Prep" | "Semester Success" | "Government Exams";
  description: string;
  totalMilestones: number;
  milestones?: RoadmapMilestone[];
  completedCount?: number;
}

export interface StudentCareerProfile {
  userId: string;
  careerInterests: string[];
  targetCompanies: string[];
  placementReadinessScore: number;
  resumeStatus: "draft" | "reviewed" | "export_ready";
  skills: SkillItem[];
  projects: StudentProject[];
  certifications: StudentCertification[];
}
