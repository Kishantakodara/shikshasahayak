// ============================================================
// SHIKSHA SAHAYAK — TEACHER REGISTRATION PAGE (`/register/teacher`)
// Separate registration experience for Educators & Faculty
// Brand-aligned Orange (#F97316) & Navy (#0F172A) Design System
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStoredTokens } from '../api/client';
import {
  GraduationCap,
  BookOpen,
  UserCheck,
  FileUp,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building2,
  Briefcase,
  Award,
  BookMarked,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { GTU_COLLEGES, GTU_BE_BRANCHES } from '../config/gtuData';

const QUALIFICATIONS = [
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "M.Phil",
  "Ph.D.",
  "Other"
];

const EXPERIENCES = [
  "Fresher",
  "1–2 Years",
  "3–5 Years",
  "6–10 Years",
  "10+ Years"
];

const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Lecturer",
  "Teacher",
  "Visiting Faculty",
  "Industry Expert",
  "Other"
];

const TeacherRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerWithEmail, loginWithGoogle, currentUser, loading: authLoading } = useAuth();

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [qualification, setQualification] = useState(QUALIFICATIONS[1]); // Default: Bachelor's
  const [subjectExpertise, setSubjectExpertise] = useState('Computer Engineering');
  const [experience, setExperience] = useState(EXPERIENCES[1]); // Default: 1-2 Years
  const [institution, setInstitution] = useState(GTU_COLLEGES[0].name);
  const [customInstitution, setCustomInstitution] = useState('');
  const [designation, setDesignation] = useState(DESIGNATIONS[0]); // Default: Assistant Professor
  const [bio, setBio] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect authenticated teachers automatically
  useEffect(() => {
    let isMounted = true;
    if (currentUser && !authLoading) {
      const rawRole = (currentUser.role || '').toLowerCase().trim();
      const isTeacher = rawRole === 'teacher' || 
                        rawRole === 'educator' || 
                        rawRole === 'admin' ||
                        rawRole === 'super_admin';
      if (isTeacher) {
        const { access } = getStoredTokens();
        fetch('/api/teacher/profile', {
          headers: { Authorization: `Bearer ${access}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (!isMounted) return;
            if (data.isOnboarded) {
              navigate('/teacher', { replace: true });
            } else {
              navigate('/teacher/onboarding', { replace: true });
            }
          })
          .catch(() => {
            if (isMounted) navigate('/teacher', { replace: true });
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation Checks
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
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
    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    const targetInstitution = institution === 'other' ? customInstitution : institution;
    if (!targetInstitution.trim()) {
      setErrorMsg('Please select or enter your institution name.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Firebase User with teacher role
      await registerWithEmail(email.trim(), password, fullName.trim(), 'teacher');

      // 2. Persist Teacher Identity & Profile to Cloudflare D1
      const { access } = getStoredTokens();
      const response = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: mobileNumber.trim(),
          qualification,
          experience,
          institution: targetInstitution.trim(),
          department: subjectExpertise,
          designation,
          bio: bio.trim(),
          subjects: [subjectExpertise],
          branches: [subjectExpertise.toLowerCase().replace(/\s+/g, '-')],
          semesters: [1, 2, 3, 4, 5, 6, 7, 8]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save teacher profile in database.');
      }

      // 3. Redirect to Onboarding / Dashboard
      navigate('/teacher/onboarding');
    } catch (err: any) {
      console.error('Teacher registration error:', err);
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
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const userCred = await loginWithGoogle();
      if (!userCred || !userCred.user) return;

      const { access } = getStoredTokens();
      const targetInstitution = institution === 'other' ? customInstitution : institution;

      const response = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`
        },
        body: JSON.stringify({
          fullName: userCred.user.displayName || 'Educator',
          phone: mobileNumber.trim() || undefined,
          institution: targetInstitution?.trim() || 'Gujarat Technological University',
          department: subjectExpertise || 'Computer Engineering',
          designation: designation || 'Assistant Professor',
          qualification: qualification || "Bachelor's Degree",
          experience: experience || '1–2 Years',
          bio: bio.trim() || '',
          subjects: [subjectExpertise || 'General Academic'],
          branches: [(subjectExpertise || 'engineering').toLowerCase().replace(/\s+/g, '-')],
          semesters: [1, 2, 3, 4, 5, 6, 7, 8]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save teacher profile.');
      }

      navigate('/teacher/onboarding');
    } catch (err: any) {
      console.error('Google teacher registration error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setErrorMsg(err?.message || 'Google registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ============================================================ */}
          {/* LEFT SIDE — TEACHER VALUE PANEL                              */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200/40 dark:border-orange-500/20 text-brand-orange text-xs font-bold tracking-wide uppercase">
                <GraduationCap className="w-4 h-4 text-brand-orange" />
                <span>ShikshaSahayak Educator Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-tight font-display">
                Join ShikshaSahayak as a <span className="text-brand-orange">Teacher</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Create your account and empower students through knowledge.
              </p>
            </div>

            {/* Feature Blocks */}
            <div className="space-y-5">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm transition-all hover:border-orange-200 dark:hover:border-navy-700">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Teach & Inspire</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Create engaging classes and share your knowledge.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm transition-all hover:border-orange-200 dark:hover:border-navy-700">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <UserCheck className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Manage Students</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Track attendance, performance and provide guidance.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm transition-all hover:border-orange-200 dark:hover:border-navy-700">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <FileUp className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Upload & Share</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Upload notes, assignments and learning resources with ease.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm transition-all hover:border-orange-200 dark:hover:border-navy-700">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center shrink-0">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Grow Together</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Be a part of a community of passionate educators.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Education Graphic */}
            <div className="pt-2 hidden sm:block">
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 text-white overflow-hidden shadow-xl border border-navy-800">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <GraduationCap className="w-48 h-48 text-brand-orange" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-orange uppercase tracking-wider">Verified Educator Access</p>
                    <p className="text-xs text-gray-300 mt-0.5">Secure, authenticated Cloudflare D1 identity management.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE — TEACHER REGISTRATION CARD                       */}
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
                    Teacher Registration
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Fill in your details to get started
                  </p>
                </div>
              </div>

              {/* Error Alert Banner */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="shrink-0 text-base">⚠️</span>
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Section 1: Account Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
                    1. Account Information
                  </h3>

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

                  </div>

                  {/* Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Highest Qualification</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer"
                        >
                          {QUALIFICATIONS.map((q) => (
                            <option key={q} value={q} className="dark:bg-navy-900">{q}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Section 2: Professional Information */}
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-navy-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
                    2. Professional Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Subject Expertise */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Subject Expertise</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <BookMarked className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={subjectExpertise}
                          onChange={(e) => setSubjectExpertise(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer"
                        >
                          {GTU_BE_BRANCHES.map((b) => (
                            <option key={b.code} value={b.name} className="dark:bg-navy-900">{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Experience (Years)</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer"
                        >
                          {EXPERIENCES.map((exp) => (
                            <option key={exp} value={exp} className="dark:bg-navy-900">{exp}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Institution */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>College / Institution Name</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer truncate"
                        >
                          {GTU_COLLEGES.map((c) => (
                            <option key={c.code} value={c.name} className="dark:bg-navy-900">{c.name}</option>
                          ))}
                        </select>
                      </div>
                      {institution === 'other' && (
                        <input
                          type="text"
                          required
                          value={customInstitution}
                          onChange={(e) => setCustomInstitution(e.target.value)}
                          placeholder="Enter your college / institution name"
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                      )}
                    </div>

                    {/* Designation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Designation</span> <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all cursor-pointer"
                        >
                          {DESIGNATIONS.map((d) => (
                            <option key={d} value={d} className="dark:bg-navy-900">{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Short Bio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Short Bio
                      </label>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {bio.length} / 250
                      </span>
                    </div>
                    <textarea
                      maxLength={250}
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell students about yourself..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all resize-none"
                    />
                  </div>

                </div>

                {/* Section 3: Terms Agreement */}
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
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Educator Account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create Teacher Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

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
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-950/60 hover:bg-gray-50 dark:hover:bg-navy-800 text-navy-900 dark:text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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

                {/* Switch to Student Registration & Teacher Login */}
                <div className="pt-3 border-t border-gray-100 dark:border-navy-800 text-center space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Are you a Student?{' '}
                    <Link
                      to="/register"
                      className="text-brand-orange font-bold hover:underline"
                    >
                      Register as Student
                    </Link>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link
                      to="/teacher/login"
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

export default TeacherRegister;
