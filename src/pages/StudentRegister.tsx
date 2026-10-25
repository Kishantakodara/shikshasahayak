// ============================================================
// SHIKSHA SAHAYAK — STUDENT REGISTRATION PAGE (`/register/student`)
// Separate registration experience for GTU & Engineering Students
// Brand-aligned Orange (#F97316) & Navy (#0F172A) Design System
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentAcademic } from '../context/StudentAcademicContext';
import { saveD1StudentProfile, fetchD1StudentProfile } from '../api/studentIdentityClient';
import { auth } from '../utils/firebase';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../utils/branchUtils';
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Library,
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  Building2,
  GitBranch,
  Target,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { usePageMeta } from '../utils/seo';
import { GTU_COLLEGES, GTU_BE_BRANCHES, GTU_DEGREES, parseGTUEnrollment } from '../config/gtuData';

const SORTED_GTU_COLLEGES = [...GTU_COLLEGES].sort((a, b) => {
  if (a.code === 'other') return 1;
  if (b.code === 'other') return -1;
  return a.code.localeCompare(b.code, undefined, { numeric: true });
});

const SORTED_GTU_BE_BRANCHES = [...GTU_BE_BRANCHES].sort((a, b) => {
  if (a.code === 'other') return 1;
  if (b.code === 'other') return -1;
  return a.code.localeCompare(b.code, undefined, { numeric: true });
});

const SEMESTERS = [
  { value: 1, label: 'Semester 1 (1st Year)' },
  { value: 2, label: 'Semester 2 (1st Year)' },
  { value: 3, label: 'Semester 3 (2nd Year)' },
  { value: 4, label: 'Semester 4 (2nd Year)' },
  { value: 5, label: 'Semester 5 (3rd Year)' },
  { value: 6, label: 'Semester 6 (3rd Year)' },
  { value: 7, label: 'Semester 7 (4th Year)' },
  { value: 8, label: 'Semester 8 (4th Year)' },
];

const STUDENT_GOALS = [
  "Semester Exams",
  "GATE 2027/28",
  "Campus Placement",
  "Competitive Exams",
  "Higher Studies (M.Tech/MS)",
  "Skill Development",
  "Other"
];

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon: React.ReactNode;
  placeholder?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder = "Search...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery(selectedOption ? selectedOption.label : '');
    }
  }, [value, selectedOption, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative z-20" ref={containerRef}>
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
        <span>{label}</span> {required && <span className="text-brand-orange">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-3.5 pointer-events-none z-10">
          {icon}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-text truncate"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
        >
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-850 rounded-xl shadow-xl max-h-60 overflow-y-auto focus:outline-none">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setSearchQuery(opt.label);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-navy-800/80 transition-colors ${value === opt.value
                  ? 'text-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10 font-bold'
                  : 'text-navy-900 dark:text-slate-200'
                  }`}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              No matching options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerWithEmail, loginWithGoogle, currentUser, loading: authLoading } = useAuth();
  const { saveAcademicProfile } = useStudentAcademic();

  usePageMeta({
    title: 'Student Registration & Academic Setup — ShikshaSahayak',
    description: 'Create your student account or complete your GTU academic registration to access tailored syllabus, PYQs, notes, and AI tutor.',
    path: '/register',
    robots: 'noindex,follow',
  });

  const urlJoinCode = searchParams.get('joinCode') || searchParams.get('code') || searchParams.get('joincode') || '';
  const [joinCode, setJoinCode] = useState(urlJoinCode ? urlJoinCode.trim().toUpperCase() : '');

  // Persist join code in sessionStorage
  useEffect(() => {
    if (urlJoinCode) {
      const cleanCode = urlJoinCode.trim().toUpperCase();
      setJoinCode(cleanCode);
      try {
        sessionStorage.setItem('pending_join_code', cleanCode);
      } catch {}
    } else {
      const stored = sessionStorage.getItem('pending_join_code');
      if (stored) {
        setJoinCode(stored.trim().toUpperCase());
      }
    }
  }, [urlJoinCode]);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dob, setDob] = useState('');

  const [university, setUniversity] = useState('gtu');
  const [customUniversity, setCustomUniversity] = useState('');
  const [degreeCode, setDegreeCode] = useState('01');
  const [customDegree, setCustomDegree] = useState('');
  const [college, setCollege] = useState('');
  const [customCollege, setCustomCollege] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [semester, setSemester] = useState<number | ''>('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [skipEnrollment, setSkipEnrollment] = useState(false);
  const [goal, setGoal] = useState(STUDENT_GOALS[0]);

  // Optional Academic & Background Fields (parity with Onboarding)
  const [marks10th, setMarks10th] = useState('');
  const [marks12th, setMarks12th] = useState('');
  const [specialSkills, setSpecialSkills] = useState('');
  const [languagesKnown, setLanguagesKnown] = useState('');
  const [experience, setExperience] = useState('');
  const [certifications, setCertifications] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const selectedCollegeObj = SORTED_GTU_COLLEGES.find((c) => c.name === college);
  const parsedEnrollment = parseGTUEnrollment(enrollmentNumber);

  // Auto-sync college, degree & branch when a valid 12-digit GTU enrollment number is typed
  useEffect(() => {
    if (parsedEnrollment.isValid) {
      if (parsedEnrollment.collegeName) {
        setCollege(parsedEnrollment.collegeName);
      }
      if (parsedEnrollment.degreeCode && GTU_DEGREES.some((d) => d.code === parsedEnrollment.degreeCode)) {
        setDegreeCode(parsedEnrollment.degreeCode);
      }
      if (parsedEnrollment.branchCode && GTU_BE_BRANCHES.some((b) => b.code === parsedEnrollment.branchCode)) {
        setBranchCode(parsedEnrollment.branchCode);
      }
    }
  }, [enrollmentNumber]);

  // Reset skip Enrollment if semester changes away from 1st sem
  useEffect(() => {
    if (semester !== 1 && skipEnrollment) {
      setSkipEnrollment(false);
    }
  }, [semester, skipEnrollment]);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEnrollmentValid =
    (semester === 1 && skipEnrollment) ||
    (enrollmentNumber.trim().length === 12 && /^\d{12}$/.test(enrollmentNumber.trim()));

  const isGoogleFormValid =
    mobileNumber.trim().length === 10 &&
    agreedToTerms &&
    (university !== 'other' || customUniversity.trim().length > 0) &&
    (degreeCode !== 'other' || customDegree.trim().length > 0) &&
    college.trim().length > 0 &&
    (college !== 'other' || customCollege.trim().length > 0) &&
    branchCode.trim().length > 0 &&
    semester !== '' &&
    isEnrollmentValid &&
    goal.trim().length > 0;

  const isExistingAuthValid =
    Boolean(currentUser) &&
    isGoogleFormValid &&
    (fullName.trim().length > 0 || Boolean(currentUser?.displayName));

  const isNormalFormValid =
    isGoogleFormValid &&
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword;

  const isFormReady = currentUser ? isExistingAuthValid : isNormalFormValid;

  // Pre-fill fields for authenticated user & fetch existing profile details
  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      if (currentUser.displayName && !fullName) {
        setFullName(currentUser.displayName);
      }
      if (currentUser.email && !email) {
        setEmail(currentUser.email);
      }

      fetchD1StudentProfile(currentUser.uid, currentUser.email || undefined)
        .then((profile) => {
          if (!isMounted || !profile) return;
          const resolvedName = profile.name || profile.full_name || profile.fullName || currentUser.displayName || '';
          if (resolvedName && !fullName) setFullName(resolvedName);
          if (profile.email && !email) setEmail(profile.email);
          if (profile.phone_number || profile.phoneNumber) setMobileNumber(profile.phone_number || profile.phoneNumber);
          if (profile.dob) setDob(profile.dob);
          if (profile.enrollment_number || profile.enrollmentNumber) setEnrollmentNumber(profile.enrollment_number || profile.enrollmentNumber);
          if (profile.semester) setSemester(Number(profile.semester));
          if (profile.college || profile.college_name || profile.collegeName) {
            const rawCol = profile.college_name || profile.collegeName || profile.college;
            const matchedCol = GTU_COLLEGES.find(c => c.name.toLowerCase() === String(rawCol).toLowerCase() || c.code === profile.college_id);
            setCollege(matchedCol ? matchedCol.name : rawCol);
          }
          if (profile.university || profile.university_name || profile.universityName) setUniversity(profile.university || profile.university_name || profile.universityName);
          const branchTarget = profile.branch_code || profile.branch_id || profile.branch || profile.branchName;
          if (branchTarget) {
            const cleanTarget = String(branchTarget).toLowerCase().trim();
            const foundBranch = GTU_BE_BRANCHES.find(b => 
              b.code.toLowerCase() === cleanTarget ||
              b.code === cleanTarget.padStart(2, '0') ||
              b.shortName.toLowerCase() === cleanTarget ||
              (b as any).slug?.toLowerCase() === cleanTarget ||
              b.name.toLowerCase() === cleanTarget
            );
            if (foundBranch) {
              setBranchCode(foundBranch.code);
            }
          }
          if (profile.goals) {
            try {
              const goalsArr = typeof profile.goals === 'string' ? JSON.parse(profile.goals) : profile.goals;
              if (Array.isArray(goalsArr) && goalsArr[0] && STUDENT_GOALS.includes(goalsArr[0])) {
                setGoal(goalsArr[0]);
              }
            } catch {}
          }
          if (profile.marks_10th || profile.marks10th) setMarks10th(profile.marks_10th || profile.marks10th);
          if (profile.marks_12th || profile.marks12th) setMarks12th(profile.marks_12th || profile.marks12th);
          if (profile.special_skills || profile.specialSkills) setSpecialSkills(profile.special_skills || profile.specialSkills);
          if (profile.languages_known || profile.languagesKnown) setLanguagesKnown(profile.languages_known || profile.languagesKnown);
          if (profile.experience) setExperience(profile.experience);
          if (profile.certifications) setCertifications(profile.certifications);
        })
        .catch((err) => {
          console.warn('Failed to pre-populate student profile:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Redirect authenticated students automatically if profile is already complete
  useEffect(() => {
    let isMounted = true;
    if (currentUser && !authLoading && !isSubmitting) {
      fetchD1StudentProfile(currentUser.uid, currentUser.email || undefined)
        .then((profile) => {
          if (!isMounted) return;
          const hasBranch = Boolean(profile?.branch || profile?.branch_id || profile?.branchName || profile?.branch_name);
          const hasSem = Boolean(profile?.semester && Number(profile?.semester) > 0);
          if (profile && (hasBranch || hasSem)) {
            const activeJoinCode = joinCode || sessionStorage.getItem('pending_join_code') || '';
            const destination = activeJoinCode ? `/student?joinCode=${encodeURIComponent(activeJoinCode)}` : '/student';
            navigate(destination, { replace: true });
          }
        })
        .catch(() => { });
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading, isSubmitting, navigate, joinCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation Checks
    const activeName = (fullName.trim() || currentUser?.displayName || '').trim();
    if (!activeName) {
      setErrorMsg('Full Name is required.');
      return;
    }

    const finalEmail = (currentUser?.email || email).trim();
    if (!finalEmail || !finalEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!currentUser) {
      if (!password) {
        setErrorMsg('Password is required.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your password.');
        return;
      }
    }

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    const selectedUnivName = university === 'other' ? customUniversity.trim() : 'Gujarat Technological University';
    if (!selectedUnivName) {
      setErrorMsg('Please select or enter your university name.');
      return;
    }

    const selectedDegreeObj = GTU_DEGREES.find((d) => d.code === degreeCode);
    const selectedDegreeName = degreeCode === 'other' ? customDegree.trim() : (selectedDegreeObj ? selectedDegreeObj.name : 'Bachelor of Engineering (B.E. / B.Tech)');
    if (!selectedDegreeName) {
      setErrorMsg('Please select or enter your degree / course name.');
      return;
    }

    const selectedCollegeName = college === 'other' ? customCollege : college;
    if (!selectedCollegeName.trim()) {
      setErrorMsg('Please select or enter your college / university name.');
      return;
    }
    if (!branchCode.trim()) {
      setErrorMsg('Please select your branch.');
      return;
    }
    if (semester === '') {
      setErrorMsg('Please select your semester.');
      return;
    }

    const isSem1Skip = semester === 1 && skipEnrollment;
    const cleanEnrollment = enrollmentNumber.trim();
    if (!isSem1Skip) {
      if (!cleanEnrollment) {
        setErrorMsg('GTU Enrollment Number is required. 1st Semester students without an enrollment number can select the skip option.');
        return;
      }
      if (cleanEnrollment.length !== 12 || !/^\d{12}$/.test(cleanEnrollment)) {
        setErrorMsg('GTU Enrollment Number must be a valid 12-digit number (e.g. 240430116128).');
        return;
      }
    }

    const selectedBranchObj = GTU_BE_BRANCHES.find((b) => b.code === branchCode);
    const branchName = selectedBranchObj ? selectedBranchObj.name : getCanonicalBranchName(branchCode);
    const branchSlug = getCanonicalBranchSlug(branchCode || branchName);

    setIsSubmitting(true);

    try {
      let uid = currentUser?.uid || auth.currentUser?.uid;
      let token: string | undefined = undefined;

      if (!uid) {
        // 1. Create Firebase User with Email & Password
        const userCred = await registerWithEmail(email.trim(), password, activeName);
        uid = userCred?.user?.uid || userCred?.uid || auth.currentUser?.uid;
      }

      // Safely acquire auth token from Firebase user instance
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve Firebase auth ID token:', tokenErr);
      }

      if (!uid) {
        throw new Error('Could not establish user session. Please try again.');
      }

      if (uid) {
        // 2. Save D1 Student Profile
        await saveD1StudentProfile(
          {
            userId: uid,
            name: activeName,
            email: finalEmail,
            phoneNumber: mobileNumber.trim(),
            college: selectedCollegeName.trim(),
            university: selectedUnivName,
            degree: selectedDegreeName,
            branch: branchName,
            semester: Number(semester),
            enrollmentNumber: isSem1Skip ? undefined : cleanEnrollment,
            enrollmentYear: parsedEnrollment.yearFull ? Number(parsedEnrollment.yearFull) : undefined,
            goals: [goal],
            dob: dob || undefined,
            marks_10th: marks10th.trim() || undefined,
            marks_12th: marks12th.trim() || undefined,
            special_skills: specialSkills.trim() || undefined,
            languages_known: languagesKnown.trim() || undefined,
            experience: experience.trim() || undefined,
            certifications: certifications.trim() || undefined,
            avatarUrl: currentUser?.photoURL || undefined
          },
          token
        );

        // 3. Save Academic Profile Context
        await saveAcademicProfile({
          userId: uid,
          universityId: university === 'other' ? 'other' : 'gtu',
          universityName: selectedUnivName,
          college: selectedCollegeName.trim(),
          degreeId: degreeCode,
          degreeName: selectedDegreeName,
          branchId: branchSlug,
          branchName: branchName,
          semester: Number(semester),
          enrollmentNumber: isSem1Skip ? undefined : cleanEnrollment,
          goals: [goal]
        });
      }

      // 4. Redirect to Student Portal Dashboard (preserving join code)
      const activeJoinCode = joinCode || sessionStorage.getItem('pending_join_code') || '';
      const destination = activeJoinCode ? `/student?joinCode=${encodeURIComponent(activeJoinCode)}` : '/student';
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('Student registration error:', err);
      const code = err?.code || '';
      let msg = err?.message || '';

      if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
        msg = 'An account with this email address already exists. Please login instead.';
      } else if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        msg = 'Please enter a valid email address.';
      } else if (code === 'auth/weak-password' || msg.includes('weak-password')) {
        msg = 'Password must be at least 6 characters long.';
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        msg = `Domain "${host}" is not authorized in Firebase Console. Please add it under Authorized Domains.`;
      }

      setErrorMsg(msg || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');

    // Validation Checks
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    const selectedUnivName = university === 'other' ? customUniversity.trim() : 'Gujarat Technological University';
    if (!selectedUnivName) {
      setErrorMsg('Please select or enter your university name.');
      return;
    }

    const selectedDegreeObj = GTU_DEGREES.find((d) => d.code === degreeCode);
    const selectedDegreeName = degreeCode === 'other' ? customDegree.trim() : (selectedDegreeObj ? selectedDegreeObj.name : 'Bachelor of Engineering (B.E. / B.Tech)');
    if (!selectedDegreeName) {
      setErrorMsg('Please select or enter your degree / course name.');
      return;
    }

    const selectedCollegeName = college === 'other' ? customCollege : college;
    if (!selectedCollegeName.trim()) {
      setErrorMsg('Please select or enter your college / university name.');
      return;
    }
    if (!branchCode.trim()) {
      setErrorMsg('Please select your branch.');
      return;
    }
    if (semester === '') {
      setErrorMsg('Please select your semester.');
      return;
    }

    const isSem1Skip = semester === 1 && skipEnrollment;
    const cleanEnrollment = enrollmentNumber.trim();
    if (!isSem1Skip) {
      if (!cleanEnrollment) {
        setErrorMsg('GTU Enrollment Number is required. 1st Semester students without an enrollment number can select the skip option.');
        return;
      }
      if (cleanEnrollment.length !== 12 || !/^\d{12}$/.test(cleanEnrollment)) {
        setErrorMsg('GTU Enrollment Number must be a valid 12-digit number (e.g. 240430116128).');
        return;
      }
    }

    const selectedBranchObj = GTU_BE_BRANCHES.find((b) => b.code === branchCode);
    const branchName = selectedBranchObj ? selectedBranchObj.name : 'Computer Engineering';
    const branchSlug = selectedBranchObj
      ? selectedBranchObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'computer-engineering';

    setIsSubmitting(true);
    try {
      // 1. Reuse existing authenticated Google session or trigger Google Sign-In
      let uid = currentUser?.uid || auth.currentUser?.uid;
      let token: string | undefined = undefined;

      if (!uid) {
        const userCred = await loginWithGoogle();
        if (!userCred) {
          setIsSubmitting(false);
          return;
        }
        uid = userCred?.user?.uid || userCred?.uid || auth.currentUser?.uid;
      }

      // Safely acquire auth token from Firebase user instance
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve Firebase auth ID token:', tokenErr);
      }

      if (!uid) {
        setIsSubmitting(false);
        return;
      }

      const finalEmail = (currentUser?.email || email).trim();
      const finalName = fullName.trim() || currentUser?.displayName || 'Student';

      if (uid) {
        // 2. Submit details to Cloudflare D1 Database (student_profiles & unified_users)
        await saveD1StudentProfile(
          {
            userId: uid,
            name: finalName,
            email: finalEmail,
            phoneNumber: mobileNumber.trim(),
            college: selectedCollegeName.trim(),
            university: selectedUnivName,
            degree: selectedDegreeName,
            branch: branchName,
            semester: Number(semester),
            enrollmentNumber: isSem1Skip ? undefined : cleanEnrollment,
            enrollmentYear: parsedEnrollment.yearFull ? Number(parsedEnrollment.yearFull) : undefined,
            goals: [goal],
            dob: dob || undefined,
            marks_10th: marks10th.trim() || undefined,
            marks_12th: marks12th.trim() || undefined,
            special_skills: specialSkills.trim() || undefined,
            languages_known: languagesKnown.trim() || undefined,
            experience: experience.trim() || undefined,
            certifications: certifications.trim() || undefined,
            avatarUrl: currentUser?.photoURL || undefined
          },
          token
        );

        // 3. Submit Academic Profile Context
        await saveAcademicProfile({
          userId: uid,
          universityId: university === 'other' ? 'other' : 'gtu',
          universityName: selectedUnivName,
          college: selectedCollegeName.trim(),
          degreeId: degreeCode,
          degreeName: selectedDegreeName,
          branchId: branchSlug,
          branchName: branchName,
          semester: Number(semester),
          enrollmentNumber: isSem1Skip ? undefined : cleanEnrollment,
          goals: [goal]
        });
      }

      // 4. Redirect to Student Portal Dashboard (preserving join code)
      const activeJoinCode = joinCode || sessionStorage.getItem('pending_join_code') || '';
      const destination = activeJoinCode ? `/student?joinCode=${encodeURIComponent(activeJoinCode)}` : '/student';
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('Google student registration error:', err);
      setErrorMsg(err?.message || 'Google registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
      {/* Premium Decorative Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-navy-800/40 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ============================================================ */}
          {/* LEFT SIDE — STUDENT VALUE PANEL                              */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200/40 dark:border-orange-500/20 text-brand-orange text-xs font-bold tracking-wide uppercase">
                <GraduationCap className="w-4 h-4 text-brand-orange" />
                <span>ShikshaSahayak Student Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-tight font-display">
                Join ShikshaSahayak as a <span className="text-brand-orange">Student</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Create your account and unlock a world of knowledge, resources, and opportunities.
              </p>
            </div>

            {/* Benefit Cards */}
            <div className="space-y-5">

              {/* Card 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 hover:border-brand-orange/30 dark:hover:border-brand-orange/20 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Personalized Learning</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Get study materials tailored to your branch, semester & goals.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 hover:border-brand-orange/30 dark:hover:border-brand-orange/20 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Practice & Improve</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Access quizzes, assignments, PYQs and more to excel in exams.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 hover:border-brand-orange/30 dark:hover:border-brand-orange/20 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <Library className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">My Digital Library</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Save, organize and access your study materials anytime.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 hover:border-brand-orange/30 dark:hover:border-brand-orange/20 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Track Your Progress</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Monitor your performance and achieve your goals.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Graduation Illustration Container */}
            <div className="pt-4 hidden sm:block">
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 text-white overflow-hidden shadow-xl border border-navy-800 flex items-center justify-between">
                <div className="space-y-1 relative z-10 max-w-[240px]">
                  <p className="text-xs font-bold text-brand-orange uppercase tracking-wider">GTU & Engineering Hub</p>
                  <h4 className="text-sm font-extrabold text-white">All GTU PYQs & Notes</h4>
                  <p className="text-[11px] text-gray-300">Instant access to semester-wise study materials.</p>
                </div>
                <div className="relative z-10 shrink-0 w-20 h-20 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
                  <GraduationCap className="w-10 h-10" />
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE — STUDENT REGISTRATION CARD                       */}
          {/* ============================================================ */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-200 dark:border-navy-800 p-6 sm:p-8 space-y-6">

              {/* Card Header */}
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-navy-800 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-500/20 text-brand-orange flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white font-display">
                    Student Registration
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Fill in your details to get started
                  </p>
                </div>
              </div>

              {/* Class Join Invitation Banner */}
              {joinCode && (
                <div className="bg-orange-50 dark:bg-orange-950/40 border border-brand-orange/30 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="text-left space-y-0.5">
                    <div className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                      <span>Class Invitation Pending</span>
                      <span className="px-2 py-0.5 rounded bg-brand-orange text-white font-mono text-[11px] font-extrabold">{joinCode}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                      Complete registration to automatically connect with your teacher's class!
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert Banner */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="shrink-0 text-base">⚠️</span>
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>Full Name</span> <span className="text-brand-orange">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>Email Address</span> <span className="text-brand-orange">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>Mobile Number</span> <span className="text-brand-orange">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
                        +91
                      </span>
                      <div className="relative flex-grow">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter mobile number"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                  </div>

                </div>

                {/* Password Fields OR Connected Account Badge */}
                {currentUser ? (
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-navy-950/60 border border-brand-orange/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                          <span>{currentUser.displayName || 'Account Connected'}</span>
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400">
                            Authenticated
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {currentUser.email} • Password not required for social login
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Password</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Confirm Password</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${confirmPassword.length > 0
                            ? confirmPassword === password
                              ? 'border-green-500 dark:border-green-500 focus:ring-green-500'
                              : 'border-red-500 dark:border-red-500 focus:ring-red-500'
                            : 'border-gray-200 dark:border-navy-800 focus:ring-brand-orange'
                            } bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 transition-all`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        confirmPassword !== password ? (
                          <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                            <span>❌ Passwords do not match</span>
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>Passwords match</span>
                          </p>
                        )
                      )}
                    </div>

                  </div>
                )}

                {/* Academic Profile Details */}
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-navy-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange flex items-center justify-between">
                    <span>Academic Setup</span>
                  </h3>

                  {/* 1. GTU Enrollment Number (FIRST FIELD IN ACADEMIC SETUP) */}
                  <div className="space-y-1.5 p-4 rounded-2xl bg-orange-50/40 dark:bg-navy-950/40 border border-orange-200/50 dark:border-navy-800">
                    <label className="text-xs font-bold text-navy-900 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-brand-orange" />
                        <span>GTU Enrollment Number</span>
                        {semester === 1 && skipEnrollment ? (
                          <span className="text-[10px] text-gray-400 font-normal">(Optional for 1st Sem)</span>
                        ) : (
                          <span className="text-brand-orange">*</span>
                        )}
                      </span>
                      {semester === 1 && (
                        <span className="text-[10px] text-brand-orange font-bold bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-md">
                          1st Sem Option
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={12}
                        disabled={semester === 1 && skipEnrollment}
                        value={enrollmentNumber}
                        onChange={(e) => setEnrollmentNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={semester === 1 && skipEnrollment ? "Enrollment skipped for 1st Sem" : "12-digit number (e.g. 240430116128)"}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-navy-950 font-mono tracking-wider"
                      />
                    </div>

                    {/* 1st Sem Skip Checkbox (ONLY for Semester 1 students or unselected semester) */}
                    {(semester === 1 || semester === '') && (
                      <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={skipEnrollment}
                          onChange={(e) => {
                            setSkipEnrollment(e.target.checked);
                            if (e.target.checked && semester === '') {
                              setSemester(1);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-brand-orange focus:ring-brand-orange border-gray-300 dark:border-navy-700 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          I haven't received my GTU enrollment number yet (1st Sem Only)
                        </span>
                      </label>
                    )}
                    {semester !== 1 && semester !== '' && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                        12-digit GTU enrollment number is required for Semester {semester} students.
                      </p>
                    )}

                    {/* Live GTU Enrollment Breakdown Card */}
                    {enrollmentNumber.length > 0 && !skipEnrollment && (
                      <div className="mt-2 p-3 rounded-xl bg-white dark:bg-navy-900 border border-orange-200 dark:border-navy-800 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-orange flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> GTU Auto-Parsed Details
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${parsedEnrollment.isValid
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                            }`}>
                            {parsedEnrollment.isValid ? '✓ Valid 12 Digits' : `${enrollmentNumber.length}/12 Digits`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-gray-400 text-[10px]">Entry Year: </span>
                            <span className="font-bold text-navy-900 dark:text-white">{parsedEnrollment.yearFull || '--'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px]">Student Roll: </span>
                            <span className="font-bold text-navy-900 dark:text-white">#{parsedEnrollment.studentRoll || '---'}</span>
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="text-gray-400 text-[10px]">College [{parsedEnrollment.collegeCode || '---'}]: </span>
                            <span className="font-bold text-navy-900 dark:text-white">{parsedEnrollment.collegeName || 'Detecting college...'}</span>
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="text-gray-400 text-[10px]">Course [{parsedEnrollment.degreeCode || '--'}]: </span>
                            <span className="font-bold text-navy-900 dark:text-white">{parsedEnrollment.degreeName || 'BE / B.Tech'}</span>
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="text-gray-400 text-[10px]">Branch [{parsedEnrollment.branchCode || '--'}]: </span>
                            <span className="font-bold text-navy-900 dark:text-white">{parsedEnrollment.branchName || 'Detecting branch...'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. University & Degree Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Select University */}
                    <div className="space-y-1.5 relative z-40">
                      <SearchableSelect
                        label="Select University"
                        value={university}
                        onChange={(val) => {
                          setUniversity(val);
                          if (val !== 'other') setCustomUniversity('');
                        }}
                        options={[
                          { value: 'gtu', label: 'Gujarat Technological University (GTU)' },
                          { value: 'other', label: 'Other University' }
                        ]}
                        icon={<Building2 className="w-4 h-4 text-gray-400" />}
                        placeholder="Search university..."
                        required
                      />
                      {university === 'other' && (
                        <input
                          type="text"
                          required
                          value={customUniversity}
                          onChange={(e) => setCustomUniversity(e.target.value)}
                          placeholder="Enter your university name"
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                      )}
                    </div>

                    {/* Select Degree / Course */}
                    <div className="space-y-1.5 relative z-40">
                      <SearchableSelect
                        label="Select Degree / Course"
                        value={degreeCode}
                        onChange={(val) => {
                          setDegreeCode(val);
                          if (val !== 'other') setCustomDegree('');
                        }}
                        options={GTU_DEGREES.map((d) => ({
                          value: d.code,
                          label: d.code !== 'other' ? `[${d.code}] ${d.name}` : d.name
                        }))}
                        icon={<GraduationCap className="w-4 h-4 text-gray-400" />}
                        placeholder="Search degree or course..."
                        required
                      />
                      {degreeCode === 'other' && (
                        <input
                          type="text"
                          required
                          value={customDegree}
                          onChange={(e) => setCustomDegree(e.target.value)}
                          placeholder="Enter your degree name (e.g. B.Tech CS)"
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                      )}
                    </div>
                  </div>

                  {/* 3. College & Branch Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Select College */}
                    <div className="space-y-1.5 relative z-30">
                      <SearchableSelect
                        label="Select College"
                        value={college}
                        onChange={setCollege}
                        options={SORTED_GTU_COLLEGES.map((c) => ({
                          value: c.name,
                          label: c.code !== 'other' ? `[${c.code}] ${c.name}` : c.name
                        }))}
                        icon={<Building2 className="w-4 h-4 text-gray-400" />}
                        placeholder="Search college by code or name..."
                        required
                      />
                      {selectedCollegeObj && selectedCollegeObj.code !== 'other' && (
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700">
                            Zone: {selectedCollegeObj.zone}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700">
                            Type: {selectedCollegeObj.itype}
                          </span>
                        </div>
                      )}
                      {college === 'other' && (
                        <input
                          type="text"
                          required
                          value={customCollege}
                          onChange={(e) => setCustomCollege(e.target.value)}
                          placeholder="Enter your college / institution name"
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                      )}
                    </div>

                    {/* Select Branch */}
                    <div className="space-y-1.5 relative z-30">
                      <SearchableSelect
                        label="Select Branch"
                        value={branchCode}
                        onChange={setBranchCode}
                        options={SORTED_GTU_BE_BRANCHES.map((b) => ({
                          value: b.code,
                          label: b.code !== 'other' ? `[${b.code}] ${b.name}` : b.name
                        }))}
                        icon={<GitBranch className="w-4 h-4 text-gray-400" />}
                        placeholder="Search branch by code or name..."
                        required
                      />
                    </div>

                  </div>

                  {/* 4. Semester & Primary Goal Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

                    {/* Select Semester / Year */}
                    <div className="space-y-1.5 sm:col-span-5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Select Semester / Year</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer"
                        >
                          <option value="" disabled className="dark:bg-navy-900">Select Semester...</option>
                          {SEMESTERS.map((s) => (
                            <option key={s.value} value={s.value} className="dark:bg-navy-900">{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Primary Goal / Purpose */}
                    <div className="space-y-2 sm:col-span-7">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Target className="w-4 h-4 text-brand-orange" />
                        <span>Choose Primary Goal / Purpose</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STUDENT_GOALS.map((g) => {
                          const isSelected = goal === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGoal(g)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all duration-200 cursor-pointer ${isSelected
                                ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-orange-500/10'
                                : 'bg-white dark:bg-navy-900/60 text-navy-850 dark:text-slate-300 border-gray-200 dark:border-navy-800/80 hover:border-brand-orange/40 dark:hover:border-brand-orange/30 hover:bg-orange-50/10'
                                }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Additional Academic & Background Details (Optional Collapsible) */}
                <div className="pt-2">
                  <div className="rounded-2xl border border-gray-200 dark:border-navy-800 overflow-hidden bg-gray-50/50 dark:bg-navy-950/40">
                    <button
                      type="button"
                      onClick={() => setShowOptionalFields(!showOptionalFields)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100/60 dark:hover:bg-navy-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-orange" />
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          Additional Academic & Skill Details
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          showOptionalFields ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showOptionalFields && (
                      <div className="p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-navy-800/80 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                              10th Percentage / CGPA
                            </label>
                            <input
                              type="text"
                              value={marks10th}
                              onChange={(e) => setMarks10th(e.target.value)}
                              placeholder="e.g. 85% or 8.5 CGPA"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                              12th / Diploma Percentage / CGPA
                            </label>
                            <input
                              type="text"
                              value={marks12th}
                              onChange={(e) => setMarks12th(e.target.value)}
                              placeholder="e.g. 82% or 8.2 CGPA"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                            Technical / Special Skills
                          </label>
                          <input
                            type="text"
                            value={specialSkills}
                            onChange={(e) => setSpecialSkills(e.target.value)}
                            placeholder="e.g. C++, Python, Web Development, CAD, IoT"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                              Languages Known
                            </label>
                            <input
                              type="text"
                              value={languagesKnown}
                              onChange={(e) => setLanguagesKnown(e.target.value)}
                              placeholder="e.g. English, Gujarati, Hindi"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                              Certifications (if any)
                            </label>
                            <input
                              type="text"
                              value={certifications}
                              onChange={(e) => setCertifications(e.target.value)}
                              placeholder="e.g. NPTEL, Coursera, AWS"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                            Prior Projects / Experience
                          </label>
                          <textarea
                            rows={2}
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="Briefly describe any academic projects, internships, or hackathons..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-orange focus:ring-brand-orange border-gray-300 dark:border-navy-700 cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      I agree to the{' '}
                      <Link to="/terms-of-service" className="text-brand-orange hover:underline font-bold" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="text-brand-orange hover:underline font-bold" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormReady}
                  className="w-full py-3.5 px-6 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{currentUser ? 'Saving Student Details...' : 'Creating Student Account...'}</span>
                    </div>
                  ) : (
                    <>
                      <span>{currentUser ? 'Complete Student Registration' : 'Create Student Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!currentUser && (
                  <>
                    {/* Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-navy-800" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-extrabold tracking-widest text-gray-400">
                        <span className="bg-white dark:bg-navy-900 px-3">OR</span>
                      </div>
                    </div>

                    {/* Social Login Button */}
                    <div className="space-y-2">
                      <p className="text-[9px] text-center text-slate-500 dark:text-slate-400 font-extrabold tracking-wide uppercase flex items-center justify-center gap-1">
                        <span>⚡ Recommended: Single-click secure signup (No password needed)</span>
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleRegister}
                        disabled={isSubmitting || !isGoogleFormValid}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-950/60 hover:bg-gray-50 dark:hover:bg-navy-800 text-navy-900 dark:text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Legal Subtext */}
                <div className="text-center pt-1">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms-of-service" className="text-brand-orange hover:underline font-bold">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-brand-orange hover:underline font-bold">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>

                {/* Switch to Educator Registration & Login */}
                <div className="pt-3 border-t border-gray-100 dark:border-navy-800 text-center space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Are you an Educator or Teacher?{' '}
                    <Link
                      to="/register/teacher"
                      className="text-brand-orange font-bold hover:underline"
                    >
                      Register as Teacher
                    </Link>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-brand-orange font-bold hover:underline"
                    >
                      Login here
                    </Link>
                  </p>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
