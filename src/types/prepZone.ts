// ============================================================
// ShikshaSahayak Prep Zone & Career Ecosystem — TypeScript DTOs
// ============================================================

export interface CourseSummaryDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  durationHours: number;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  thumbnailUrl?: string;
  tags: string[];
}

export interface CourseLessonDTO {
  id: string;
  moduleId?: string;
  orderIndex: number;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  contentMarkdown?: string;
  isFreePreview?: boolean;
  isCompleted?: boolean;
}

export interface CourseModuleDTO {
  id: string;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons: CourseLessonDTO[];
}

export interface CourseDetailDTO extends CourseSummaryDTO {
  prerequisites?: string[];
  learningOutcomes?: string[];
  modules: CourseModuleDTO[];
  lessons?: CourseLessonDTO[];
}

export interface ScholarshipDTO {
  id: string;
  title: string;
  provider: string;
  category: string;
  amountFormatted: string;
  maxFamilyIncomeLpa?: number;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  officialApplicationUrl: string;
  applicationDeadline: string;
  description: string;
}

export interface WorkshopDTO {
  id: string;
  title: string;
  slug?: string;
  description: string;
  category: string;
  speakerName: string;
  speakerBio?: string;
  speakerCompanyOrInstitution: string;
  startTime: string;
  endTime?: string;
  venueOrUrl: string;
  isOnline: boolean;
  maxParticipants: number;
  currentParticipants: number;
  prerequisites?: string;
  status?: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';
  instructor?: string;
  instructorRole?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  level?: string;
  meetUrl?: string;
  maxSeats?: number;
  registeredCount?: number;
  keyTopics?: string[];
  bannerUrl?: string;
}

export interface FestEventDTO {
  id: string;
  festivalId?: string;
  title: string;
  category: string;
  prizePoolFormatted?: string;
  prizePool: number;
  entryFee: number;
  teamSize?: string;
  rulesSummary?: string;
  description: string;
  rules?: string[];
  minTeamSize: number;
  maxTeamSize: number;
}

export interface CollegeFestivalDTO {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  collegeName: string;
  location: string;
  state?: string;
  festType?: string;
  type?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  description: string;
  bannerUrl?: string;
  websiteUrl?: string;
  officialBrochureUrl?: string;
  registrationPortalUrl?: string;
  isVerified?: boolean;
  events?: FestEventDTO[];
}

export interface TestCaseDTO {
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface DayProblemDTO {
  id?: string;
  dayNumber: number;
  title: string;
  slug?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  problemStatement?: string;
  promptMarkdown?: string;
  inputFormat?: string;
  outputFormat?: string;
  starterCode?: Record<string, string>;
  initialCodeSnippet?: Record<string, string>;
  testCases?: TestCaseDTO[];
  xpReward?: number;
}

export interface ConquestProblemDTO {
  id: string;
  orderNumber?: number;
  title: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  description?: string;
  promptMarkdown?: string;
  sampleInput?: string;
  sampleOutput?: string;
  starterCode?: Record<string, string>;
}

export interface LeaderboardEntryDTO {
  rank: number;
  userName: string;
  studentName?: string;
  college?: string;
  collegeName?: string;
  score: number;
  solvedCount?: number;
  finishTimeFormatted?: string;
  totalTimeMinutes?: number;
}

export interface ConquestDTO {
  id: string;
  title: string;
  slug?: string;
  roundNumber?: number;
  description?: string;
  category?: string;
  difficulty?: string;
  durationMinutes?: number;
  participantCount?: number;
  startTime: string;
  endTime: string;
  problems: ConquestProblemDTO[];
  leaderboard?: LeaderboardEntryDTO[];
}

export interface CareerListingDTO {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  listingType: 'INTERNSHIP' | 'JOB';
  workplaceType?: string;
  stipendOrSalaryFormatted?: string;
  stipendOrSalary?: string;
  experienceLevel?: string;
  applicationDeadline?: string;
  officialApplyUrl?: string;
  officialApplicationUrl?: string;
  requiredSkills: string[];
  eligibleBranches?: string[];
  eligibilityBatch?: string;
  description: string;
  isVerified: boolean;
  postedDate?: string;
  duration?: string;
  badgeType?: 'featured' | 'high-demand' | 'popular' | 'urgent';
  companyVerified?: boolean;
  sourceVerified?: boolean;
  vacancyCheckedAt?: string;
  isClosed?: boolean;
  aboutCompany?: string;
  whatYoullDo?: string[];
  requirements?: string[];
  companyWebsiteUrl?: string;
}