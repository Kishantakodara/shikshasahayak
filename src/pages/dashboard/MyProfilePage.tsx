import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, GraduationCap, Target, Globe, ShieldAlert, BookOpen, CheckCircle2, Save, Sparkles,
  Phone, Calendar, ClipboardCheck, Trash2, AlertTriangle, Loader2
} from 'lucide-react';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { useAuth } from '../../context/AuthContext';
import { saveD1StudentProfile, deleteD1StudentProfile, fetchD1StudentProfile } from '../../api/studentIdentityClient';
import { GTU_DEGREES, parseGTUEnrollment } from '../../config/gtuData';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';

export const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { academicProfile, saveAcademicProfile } = useStudentAcademic();

  // Basic Profile States
  const [fullName, setFullName] = useState(currentUser?.displayName || currentUser?.fullName || '');
  const [email] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');

  // Academic Profile States
  const [universityName, setUniversityName] = useState(academicProfile?.universityName || 'Gujarat Technological University');
  const [degreeName, setDegreeName] = useState(academicProfile?.degreeName || 'Bachelor of Engineering (B.E. / B.Tech)');
  const [college, setCollege] = useState(academicProfile?.college || '');
  const [branchName, setBranchName] = useState(academicProfile?.branchName || '');
  const [semester, setSemester] = useState(academicProfile?.semester || 1);
  const [enrollmentNumber, setEnrollmentNumber] = useState(academicProfile?.enrollmentNumber || '');
  const [goals, setGoals] = useState(academicProfile?.goals?.[0] || '');
  const [careerGoal, setCareerGoal] = useState(academicProfile?.careerGoal || '');
  const [preferredLanguage, setPreferredLanguage] = useState(academicProfile?.preferredLanguage || 'English');
  const [bandwidthPreference, setBandwidthPreference] = useState(academicProfile?.bandwidthPreference || 'High-Speed');
  const [learningStyle, setLearningStyle] = useState(academicProfile?.learningStyle || 'Visual');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Deletion Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // GTU Enrollment Live Parser
  const parsedEnrollment = parseGTUEnrollment(enrollmentNumber);

  // Fetch initial profile details from Cloudflare D1
  useEffect(() => {
    if (currentUser?.uid) {
      fetchD1StudentProfile(currentUser.uid)
        .then((profile) => {
          if (profile) {
            if (profile.name) setFullName(profile.name);
            if (profile.phone_number) setPhoneNumber(profile.phone_number);
            if (profile.dob) setDob(profile.dob);
            if (profile.university) setUniversityName(profile.university);
            if (profile.degree) setDegreeName(profile.degree);
            if (profile.college) setCollege(profile.college);
            if (profile.branch) setBranchName(profile.branch);
            if (profile.semester) setSemester(profile.semester);
            if (profile.enrollment_number) setEnrollmentNumber(profile.enrollment_number);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

    try {
      const canonicalSlug = getCanonicalBranchSlug(branchName);
      const canonicalName = getCanonicalBranchName(branchName);
      const uid = currentUser?.uid || '';

      // 1. Update Cloudflare D1 Database (student_profiles & unified_users)
      if (uid) {
        await saveD1StudentProfile({
          userId: uid,
          name: fullName.trim() || currentUser?.displayName || 'Student',
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          college: college.trim(),
          university: universityName.trim(),
          degree: degreeName.trim(),
          branch: canonicalName,
          semester: Number(semester),
          enrollmentNumber: enrollmentNumber.trim(),
          goals: [goals],
          dob: dob || undefined
        });
      }

      // 2. Update Student Academic Profile Context & LocalStorage
      await saveAcademicProfile({
        universityName,
        college,
        degreeName,
        branchName: canonicalName,
        branchId: canonicalSlug,
        semester: Number(semester),
        enrollmentNumber: enrollmentNumber.trim(),
        goals: [goals],
        careerGoal,
        preferredLanguage,
        bandwidthPreference: bandwidthPreference as any,
        learningStyle: learningStyle as any,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error updating student profile:', err);
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    try {
      const uid = currentUser?.uid;
      if (uid) {
        // 1. Permanently delete student profile from Cloudflare D1 Database
        await deleteD1StudentProfile(uid);
      }

      // 2. Logout and clear session
      await logout();

      // 3. Navigate to login
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error deleting student profile:', err);
      alert('An error occurred while deleting your profile data. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-navy-750">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-orange/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
              <User className="w-3.5 h-3.5" />
              <span>Editable Student Profile Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              My Profile & Academic Setup
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
              View, edit, and update your personal details, academic information, GTU enrollment number, and learning preferences.
            </p>
          </div>

          {savedSuccess && (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>Profile & D1 Database Updated!</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal Details Card */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-orange" />
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details Card */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-orange" />
            Academic Setup & Enrollment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* GTU Enrollment Number Field */}
            <div className="sm:col-span-2 space-y-1.5 p-4 rounded-2xl bg-orange-50/40 dark:bg-slate-900/60 border border-orange-200/50 dark:border-slate-800">
              <label className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-brand-orange" />
                  <span>GTU Enrollment Number</span>
                </span>
                <span className="text-[10px] text-brand-orange font-mono">12 Digits</span>
              </label>
              <input
                type="text"
                maxLength={12}
                value={enrollmentNumber}
                onChange={e => setEnrollmentNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 240430116128"
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange font-mono tracking-wider font-bold"
              />

              {enrollmentNumber.length > 0 && (
                <div className="mt-2 p-3 rounded-xl bg-white dark:bg-navy-900 border border-orange-200 dark:border-navy-800 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between font-extrabold text-brand-orange text-[10px] uppercase">
                    <span><Sparkles className="w-3 h-3 inline mr-1" /> GTU Live Decoder</span>
                    <span>{parsedEnrollment.isValid ? '✓ Valid 12 Digits' : `${enrollmentNumber.length}/12 Digits`}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <div>Entry Year: <strong>{parsedEnrollment.yearFull || '--'}</strong></div>
                    <div>Roll No: <strong>#{parsedEnrollment.studentRoll || '---'}</strong></div>
                    <div className="col-span-2">College: <strong>{parsedEnrollment.collegeName || 'Detecting...'}</strong></div>
                    <div className="col-span-2">Branch: <strong>{parsedEnrollment.branchName || 'Detecting...'}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">University</label>
              <input
                type="text"
                value={universityName}
                onChange={e => setUniversityName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Degree / Course</label>
              <input
                type="text"
                value={degreeName}
                onChange={e => setDegreeName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">College / Institute</label>
              <input
                type="text"
                value={college}
                onChange={e => setCollege(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch / Department</label>
              <input
                type="text"
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Goals & Preferences */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-orange" />
            Learning Targets & System Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Academic Goal</label>
              <input
                type="text"
                value={goals}
                onChange={e => setGoals(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Career Target</label>
              <input
                type="text"
                value={careerGoal}
                onChange={e => setCareerGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Learning Style</label>
              <select
                value={learningStyle}
                onChange={e => setLearningStyle(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              >
                <option value="Visual">Visual (Diagrams & Flowcharts)</option>
                <option value="Reading">Reading (Comprehensive Text Notes)</option>
                <option value="Hands-on">Hands-on (PYQs & Practice Problems)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bandwidth Mode</label>
              <select
                value={bandwidthPreference}
                onChange={e => setBandwidthPreference(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-brand-orange font-bold"
              >
                <option value="High-Speed">High-Speed (Online Streaming & HD PDFs)</option>
                <option value="Low-Bandwidth Offline">Low-Bandwidth Offline (Compressed Notes & Auto-Download)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-xl shadow-orange-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes to Cloudflare D1...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile & Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone: Data Protection & Right to Erasure */}
      <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-3xl p-6 space-y-4 mt-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-red-600 dark:text-red-400">
              Privacy & Profile Erasure (Right to be Forgotten)
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed max-w-2xl">
              Under internet data protection regulations (GDPR Article 17 Right to Erasure & CCPA), you have the full legal entitlement to request permanent deletion of your profile data and account records from our system.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setConfirmInput('');
              setShowDeleteModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer border-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Profile & Account Data</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-extrabold">Delete Profile & Account?</h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              This action will <strong>permanently erase</strong> your student profile, GTU enrollment data, and user records from our Cloudflare D1 Database. This action is irreversible.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Type <span className="text-red-600 dark:text-red-400 font-mono">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-300 dark:border-navy-700 text-navy-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-750 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                onClick={handleDeleteProfile}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Permanent Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyProfilePage;
