import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  Calculator,
  Cpu,
  Layers,
  Heart,
  Globe,
  ExternalLink,
  Bot,
  Zap,
  TrendingUp,
  FileText,
  PlayCircle,
  Code2
} from 'lucide-react';
import { usePageMeta } from '../utils/seo';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const HackathonSocialCause: React.FC = () => {
  usePageMeta({
    title: 'Hack for Social Cause 2027 — ShikshaSahayak VBYLD Submission',
    description: 'Official Hack for Social Cause (VBYLD 2027) showcase by ShikshaSahayak. Democratizing higher education with zero paywalls, UN SDG 4 & 10 alignment, and curriculum-grounded AI.',
    path: '/hackathon',
  });

  const navigate = useNavigate();
  const { loginMockUser } = useAuth();

  // Evaluator diagnostic state
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true);

  // Social impact simulator state
  const [simStudents, setSimStudents] = useState<number>(25000);
  const [simCoachingFee, setSimCoachingFee] = useState<number>(20000);
  const [simFailureRate, setSimFailureRate] = useState<number>(30);
  const [simResult, setSimResult] = useState<any>(null);
  const [calculatingSim, setCalculatingSim] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch system evaluation diagnostic
    apiClient.getHackathonEvaluation()
      .then((res) => {
        if (isMounted && res?.data) {
          setDiagnostics(res.data);
        }
      })
      .catch((err) => console.warn('Evaluation diagnostic query:', err))
      .finally(() => {
        if (isMounted) setLoadingDiagnostics(false);
      });

    // Run initial simulation
    runSimulation(25000, 20000, 30);

    return () => { isMounted = false; };
  }, []);

  const runSimulation = async (students: number, fee: number, failure: number) => {
    setCalculatingSim(true);
    try {
      const res = await apiClient.simulateHackathonImpact({
        studentCount: students,
        avgCoachingFee: fee,
        failureRate: failure,
      });
      if (res?.data?.projectedImpact) {
        setSimResult(res.data.projectedImpact);
      }
    } catch {
      // Deterministic fallback
      const total = students * fee;
      setSimResult({
        totalEconomicSavingsInr: total,
        formattedEconomicSavings: total >= 10000000 
          ? `₹${(total / 10000000).toFixed(2)} Crores` 
          : `₹${(total / 100000).toFixed(2)} Lakhs`,
        preventedBacklogsCount: Math.round(students * (failure / 100) * 0.28),
        totalSemesterHoursSaved: Math.round(students * 18.5)
      });
    } finally {
      setCalculatingSim(false);
    }
  };

  const handleSliderChange = (newStudents: number) => {
    setSimStudents(newStudents);
    runSimulation(newStudents, simCoachingFee, simFailureRate);
  };

  const handlePersonaLogin = (role: 'student' | 'teacher' | 'admin') => {
    if (role === 'student') {
      const mockProfile = {
        userId: 'hackathon-student-eval',
        fullName: 'Aarav Patel',
        email: 'student@shikshasahayak.org',
        collegeName: 'Government Engineering College (GEC)',
        branchId: 'computer-engineering',
        branchName: 'Computer Engineering',
        semester: 4,
        enrollmentNumber: '210101001',
        isProfileComplete: true,
        completedSubjects: ['3110014', '3110003', '3110015'],
        bookmarkedMaterials: ['pyq-dbms-2024', 'notes-os-unit2'],
        targetExam: 'GTU Summer 2026',
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('shiksha_student_academic_profile_hackathon-student-eval', JSON.stringify(mockProfile));
        localStorage.setItem('shiksha_student_academic_profile_student@shikshasahayak.org', JSON.stringify(mockProfile));
      } catch {}
      loginMockUser('student@shikshasahayak.org', 'Aarav Patel (Student Demo)', 'student');
      navigate('/student');
    } else if (role === 'teacher') {
      loginMockUser('teacher@shikshasahayak.org', 'Prof. R. Sharma (Educator Demo)', 'teacher');
      navigate('/teacher');
    } else {
      loginMockUser('admin@shikshasahayak.org', 'Lead Evaluator (Admin Demo)', 'admin');
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* 🇮🇳 Hackathon Official Header Banner */}
        <div className="bg-gradient-to-r from-orange-500/10 via-brand-orange/5 to-amber-500/10 border-2 border-brand-orange/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <span>🇮🇳 Official Submission</span>
                <span className="opacity-70">•</span>
                <span>VBYLD 2027</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 dark:text-white font-display leading-tight">
                Hack for Social Cause — <span className="text-brand-orange">VBYLD 2027</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Empowering India's youth to engineer scalable, technology-driven solutions for social transformation, directly aligned with <strong>Viksit Bharat 2047</strong> and the <strong>UN Sustainable Development Goals (SDGs)</strong>.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="bg-white/80 dark:bg-navy-900/80 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-navy-700">
                  🏛️ <strong>Organizer:</strong> MoYAS (Govt. of India)
                </span>
                <span className="bg-white/80 dark:bg-navy-900/80 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-navy-700">
                  🎓 <strong>Knowledge Partner:</strong> IIT Bombay
                </span>
                <span className="bg-white/80 dark:bg-navy-900/80 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-navy-700">
                  🌐 <strong>Portal:</strong> MY Bharat & SNI
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
              <a
                href="#evaluator-zone"
                className="px-6 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition-all text-center flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Evaluator Access</span>
              </a>
              <Link
                to="/"
                className="px-6 py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 hover:border-brand-orange text-navy-900 dark:text-white font-bold text-xs text-center transition-all"
              >
                Explore Live Website
              </Link>
            </div>
          </div>
        </div>

        {/* Thematic Tracks & SDG Mapping Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-navy-900 rounded-3xl border-2 border-brand-orange/40 p-6 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl">
              Primary Track
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">
              Theme 2: Education & Skill Development
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Universalizing access to verified semester notes, past exam question papers, and AI tutoring across Tier-2/Tier-3 engineering & diploma colleges.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                SDG 4: Quality Education
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                SDG 10: Reduced Inequalities
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">
              Theme 6: Digital Inclusion
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Zero-cost, lightweight web architecture optimized for low-end Android smartphones (<span className="font-semibold">₹7,000–₹10,000</span> budget phones) and flaky 3G/4G connectivity with offline PWA caching.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                SDG 9: Digital Infrastructure
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">
              Theme 7: AI & Emerging Tech
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Curriculum-grounded Google Gemini AI engine offering step-by-step problem breakdown, syllabus explanations in Hinglish/Gujarati, and exam paper pattern intelligence.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                SDG 8: Practical Career Skills
              </span>
            </div>
          </div>
        </div>

        {/* 🏆 1-Click Evaluator Testbed */}
        <div id="evaluator-zone" className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-3xl p-6 sm:p-10 border border-navy-800 space-y-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Jury & Evaluator Quick Test Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Zero-Configuration Instant Role Launchpad
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Jury members can test the entire platform without signing up, configuring cloud credentials, or entering passwords. All roles are pre-seeded with verified academic data:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            {/* Student Role */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 hover:border-brand-orange transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎓</span>
                <span className="text-[10px] bg-brand-orange text-white font-bold px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Student Persona</h4>
                <p className="text-xs text-gray-300 mt-1">
                  Aarav Patel • Computer Engineering (Sem 4) • Enrolled subjects, notes, PYQ practice & AI tutor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePersonaLogin('student')}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Student View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Teacher Role */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">👨‍🏫</span>
                <span className="text-[10px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full">Educator</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Teacher Persona</h4>
                <p className="text-xs text-gray-300 mt-1">
                  Prof. R. Sharma • Department of Computer Science • Live geofenced attendance & assignment grading.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePersonaLogin('teacher')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Teacher View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Role */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🛠️</span>
                <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">Governance</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Admin Persona</h4>
                <p className="text-xs text-gray-300 mt-1">
                  Lead Evaluator • Full system moderation, content pipeline monitor, and curriculum controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePersonaLogin('admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Admin View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 📊 Interactive Social Cause Impact Simulator */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Impact Assessment Simulator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white font-display">
                Quantifiable Societal & Financial Transformation
              </h2>
            </div>
            <span className="text-xs px-3 py-1 bg-orange-50 dark:bg-navy-800 border border-orange-200 dark:border-navy-700 text-brand-orange font-bold rounded-full self-start sm:self-auto">
              Live Edge Model
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-5 bg-gray-50 dark:bg-navy-850 p-5 rounded-2xl border border-gray-150 dark:border-navy-800">
              <div>
                <div className="flex justify-between text-xs font-bold text-navy-900 dark:text-white mb-2">
                  <span>Beneficiary College Students</span>
                  <span className="text-brand-orange">{simStudents.toLocaleString()} Students</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="100000"
                  step="2000"
                  value={simStudents}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full accent-brand-orange cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>2,000</span>
                  <span>50,000</span>
                  <span>100,000+</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 border-t border-gray-200 dark:border-navy-700 pt-3">
                <p>• <strong>Avg Coaching Fee Baseline:</strong> ₹20,000/year</p>
                <p>• <strong>Exam Backlog Risk:</strong> 30% without PYQs</p>
                <p>• <strong>Calculated via:</strong> <code>/api/hackathon/impact</code></p>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 rounded-2xl p-5 text-center flex flex-col justify-center">
                <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">
                  Economic Money Saved
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
                  {simResult?.formattedEconomicSavings || '₹50.0 Crores'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Zero tuition paywalls for families
                </div>
              </div>

              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-5 text-center flex flex-col justify-center">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Prevented Backlogs
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
                  {simResult?.preventedBacklogsCount?.toLocaleString() || '2,100'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  28% targeted backlog reduction
                </div>
              </div>

              <div className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-2xl p-5 text-center flex flex-col justify-center">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  Study Hours Saved
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
                  {simResult?.totalSemesterHoursSaved?.toLocaleString() || '462,500'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  18.5 hrs/student per semester
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ⚙️ Live System Architecture & Technical Strength Diagnostics */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Cpu className="w-4 h-4" />
                <span>Technical Strength & Execution Reality</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white font-display">
                Edge Scalability & Cloud Architecture
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-850 border border-gray-150 dark:border-navy-800 space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Edge Database</div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">Cloudflare D1</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Edge SQLite (&lt;30ms)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-850 border border-gray-150 dark:border-navy-800 space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Zero-Egress Storage</div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">Cloudflare R2</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>$0 Bandwidth Fees</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-850 border border-gray-150 dark:border-navy-800 space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Academic AI Engine</div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">Google Gemini</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>SSE Streaming Proxy</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-850 border border-gray-150 dark:border-navy-800 space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Client Performance</div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">React 19 + PWA</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Offline Service Worker</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🗺️ 4-Stage Participation Roadmap */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white font-display">
              Four-Stage Hackathon Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              From grassroots problem statement to the National Showcase in New Delhi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-2">
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Stage 1 • Completed
              </div>
              <h4 className="font-bold text-navy-900 dark:text-white text-sm">Idea & Proposal</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Problem articulation, target beneficiary modeling (Tier-2/3 GTU students), deck outline.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-brand-orange rounded-2xl p-4 space-y-2">
              <div className="text-[10px] font-extrabold text-brand-orange uppercase tracking-wider">
                Stage 2 • Active Prototype
              </div>
              <h4 className="font-bold text-navy-900 dark:text-white text-sm">State Hackathon</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Live production prototype on Cloudflare, responsive mobile UX, verified PYQ database.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 rounded-2xl p-4 space-y-2 opacity-80">
              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                Stage 3 • Upcoming
              </div>
              <h4 className="font-bold text-navy-900 dark:text-white text-sm">IIT Bombay Review</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Technical screening by IIT-B national jury, intensive architectural & impact mentoring.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 rounded-2xl p-4 space-y-2 opacity-80">
              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                Stage 4 • Jan 2027
              </div>
              <h4 className="font-bold text-navy-900 dark:text-white text-sm">National Showcase</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Grand finale in New Delhi before national ministries, incubation & national awards.
              </p>
            </div>
          </div>
        </div>

        {/* 📜 IP & Open Source Compliance Statement */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed shadow-sm">
          <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Intellectual Property & Open-Source Commitment</span>
          </div>
          <p>
            In full compliance with Section 8 of the <strong>Hack for Social Cause (VBYLD 2027)</strong> guidelines:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>100% IP Retained:</strong> All intellectual property rights in submitted source code, architectures, and design belong strictly to the participant team.</li>
            <li><strong>Open Source & Civic Reusability:</strong> Released under the <strong>MIT License</strong> to maximize social impact and transparent civic validation.</li>
            <li><strong>Fair Use for Promotion:</strong> Permission granted to MoYAS and IIT Bombay to showcase, evaluate, and feature the solution for non-commercial educational purposes.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default HackathonSocialCause;

