import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Award, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Plus, 
  Trash2, 
  Palette, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  FolderGit2, 
  RotateCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  score: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectEntry {
  title: string;
  technologies: string;
  link?: string;
  description: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
}

export const DEFAULT_RESUME: ResumeData = {
  fullName: 'Raj Patel',
  email: 'raj.patel@gtu.ac.in',
  phone: '+91 98765 43210',
  location: 'Ahmedabad, Gujarat',
  linkedin: 'linkedin.com/in/rajpatel-gtu',
  github: 'github.com/rajpatel-dev',
  summary: 'Dedicated Final Year Computer Engineering student at Gujarat Technological University with proven hands-on experience in full-stack web applications, TypeScript, Cloudflare Workers, and distributed database design. Eager to deliver high-reliability software solutions in fast-paced engineering teams.',
  skills: [
    'JavaScript', 'TypeScript', 'React 19', 'Node.js', 'Python', 'C++', 
    'Cloudflare Workers', 'SQL / D1', 'Tailwind CSS', 'Git & GitHub', 'REST APIs', 'Data Structures'
  ],
  education: [
    {
      degree: 'B.E. in Computer Engineering',
      institution: 'L.D. College of Engineering (GTU), Ahmedabad',
      year: '2023 - 2027',
      score: 'CPI: 8.85 / 10'
    },
    {
      degree: 'Higher Secondary Certificate (HSC) - Science',
      institution: 'Gujarat Secondary and Higher Secondary Board',
      year: '2021 - 2023',
      score: '91.4%'
    }
  ],
  experience: [
    {
      role: 'Full Stack Engineering Intern',
      company: 'Zeus Learning EdTech',
      duration: 'May 2026 - July 2026',
      description: '• Architected interactive quiz & test engine components serving over 15,000 active students.\n• Reduced asset loading times by 35% through image format optimization and Cloudflare edge caching.'
    }
  ],
  projects: [
    {
      title: 'ShikshaSahayak Prep & Question Bank Engine',
      technologies: 'React 19, TypeScript, Cloudflare D1, Tailwind CSS',
      link: 'github.com/rajpatel-dev/prep-engine',
      description: '• Engineered topic-wise practice engine featuring MCQ, MSQ, and NAT calculation questions.\n• Integrated client-side PDF export and real-time score assessment with local streak tracking.'
    },
    {
      title: 'Campus Lost & Found Platform',
      technologies: 'Node.js, Express, PostgreSQL, AWS S3',
      link: 'github.com/rajpatel-dev/campus-lost-found',
      description: '• Developed secure photo-upload matching system used by 3,000+ campus students with email notifications.'
    }
  ],
  certifications: [
    {
      name: 'NPTEL Elite Certificate in Data Structures & Algorithms',
      issuer: 'IIT Kharagpur / SWAYAM',
      year: '2025'
    },
    {
      name: 'Cloudflare Certified Associate Developer',
      issuer: 'Cloudflare',
      year: '2026'
    }
  ]
};

export type TemplateType = 
  | 'HARVARD_IVY'
  | 'MODERN_ENGINEERING'
  | 'TWO_COLUMN_PRO'
  | 'FAANG_CLEAN'
  | 'CREATIVE_STARTUP'
  | 'RESEARCH_ACADEMIC'
  | 'MINIMAL_CLASSIC' 
  | 'COMPACT_TECH';

export interface TemplateInfo {
  id: TemplateType;
  name: string;
  badge: string;
  description: string;
  badgeColor: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'HARVARD_IVY',
    name: 'Harvard Ivy ATS',
    badge: 'ATS 99%',
    description: 'Gold-standard ATS format with small-caps headers & right-aligned dates',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    id: 'MODERN_ENGINEERING',
    name: 'Modern Tech',
    badge: 'Popular',
    description: 'Clean single-column engineering layout with bold divider headers',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  {
    id: 'TWO_COLUMN_PRO',
    name: 'Executive Two-Column',
    badge: '2-Column',
    description: 'Structured sidebar with skills & credentials alongside impact projects',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  {
    id: 'FAANG_CLEAN',
    name: 'FAANG High-Impact',
    badge: 'Top Tech',
    description: 'Cracking-the-Coding-Interview style optimized for quantifiable impact',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
  },
  {
    id: 'CREATIVE_STARTUP',
    name: 'Startup & Product',
    badge: 'Vibrant',
    description: 'Modern styling with tech badges, project tags, and branded accents',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
  },
  {
    id: 'RESEARCH_ACADEMIC',
    name: 'Academic & GATE',
    badge: 'Scholar',
    description: 'Tailored for M.Tech/MS applications, CPI, lab research & coursework',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  {
    id: 'MINIMAL_CLASSIC',
    name: 'Minimal Classic',
    badge: 'Corporate',
    description: 'Traditional serif typography for campus placements & PSU drives',
    badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  },
  {
    id: 'COMPACT_TECH',
    name: 'Compact Terminal',
    badge: 'High-Density',
    description: 'Monospace developer resume packing maximum details onto 1 page',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
  }
];

const ACCENT_COLORS = [
  { name: 'Slate Navy', hex: '#0F172A' },
  { name: 'ShikshaSahayak Orange', hex: '#EA580C' },
  { name: 'Royal Blue', hex: '#1E40AF' },
  { name: 'Emerald', hex: '#047857' },
  { name: 'Classic Black', hex: '#000000' }
];

export const ResumeBuilderPage: React.FC = () => {
  const [data, setData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('shiksha_resume_data');
      return saved ? JSON.parse(saved) : DEFAULT_RESUME;
    } catch {
      return DEFAULT_RESUME;
    }
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('HARVARD_IVY');
  const [accentColor, setAccentColor] = useState<string>('#0F172A');
  const [activeTab, setActiveTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [newSkill, setNewSkill] = useState('');
  const [exporting, setExporting] = useState(false);
  const [atsScore, setAtsScore] = useState<number>(92);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    try {
      localStorage.setItem('shiksha_resume_data', JSON.stringify(data));
      setSaveStatus('Draft saved automatically');
      timer = setTimeout(() => setSaveStatus(''), 2500);
    } catch {}
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [data]);

  // Client-side ATS score evaluator
  useEffect(() => {
    let score = 50;
    if (data.fullName.trim().length > 3) score += 5;
    if (data.email.includes('@')) score += 5;
    if (data.phone.length > 8) score += 5;
    if (data.summary.length > 50) score += 10;
    if (data.skills.length >= 6) score += 10;
    if (data.education.length > 0) score += 5;
    if (data.projects.length >= 2) score += 5;
    if (data.experience.length > 0) score += 5;
    if (data.certifications.length > 0) score += 5;
    setAtsScore(Math.min(score, 99));
  }, [data]);

  const addSkill = () => {
    if (newSkill.trim() && !data.skills.includes(newSkill.trim())) {
      setData({ ...data, skills: [...data.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (sToRemove: string) => {
    setData({ ...data, skills: data.skills.filter(s => s !== sToRemove) });
  };

  // Education handlers
  const addEducation = () => {
    setData({
      ...data,
      education: [
        ...data.education,
        { degree: 'Degree Name', institution: 'Institution Name', year: 'Year', score: 'Score / CPI' }
      ]
    });
  };

  const updateEducation = (index: number, field: keyof EducationEntry, val: string) => {
    const updated = [...data.education];
    updated[index][field] = val;
    setData({ ...data, education: updated });
  };

  const removeEducation = (index: number) => {
    setData({ ...data, education: data.education.filter((_, i) => i !== index) });
  };

  // Experience handlers
  const addExperience = () => {
    setData({
      ...data,
      experience: [
        ...data.experience,
        { role: 'Engineering Intern', company: 'Company Name', duration: 'Duration', description: '• Key responsibilities and contributions' }
      ]
    });
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, val: string) => {
    const updated = [...data.experience];
    updated[index][field] = val;
    setData({ ...data, experience: updated });
  };

  const removeExperience = (index: number) => {
    setData({ ...data, experience: data.experience.filter((_, i) => i !== index) });
  };

  // Projects handlers
  const addProject = () => {
    setData({
      ...data,
      projects: [
        ...data.projects,
        { title: 'Project Title', technologies: 'Tech Stack', link: '', description: '• Project impact and architecture details' }
      ]
    });
  };

  const updateProject = (index: number, field: keyof ProjectEntry, val: string) => {
    const updated = [...data.projects];
    updated[index][field] = val;
    setData({ ...data, projects: updated });
  };

  const removeProject = (index: number) => {
    setData({ ...data, projects: data.projects.filter((_, i) => i !== index) });
  };

  // Certifications handlers
  const addCertification = () => {
    setData({
      ...data,
      certifications: [
        ...data.certifications,
        { name: 'Certification / Honor', issuer: 'Issuer / Organization', year: '2026' }
      ]
    });
  };

  const updateCertification = (index: number, field: keyof CertificationEntry, val: string) => {
    const updated = [...data.certifications];
    updated[index][field] = val;
    setData({ ...data, certifications: updated });
  };

  const removeCertification = (index: number) => {
    setData({ ...data, certifications: data.certifications.filter((_, i) => i !== index) });
  };

  const resetToSample = () => {
    if (window.confirm('Reset all fields to sample GTU Engineering resume?')) {
      setData(DEFAULT_RESUME);
    }
  };

  // Export PDF Handler
  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${data.fullName.replace(/\s+/g, '_')}_Engineering_Resume.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. You can also print the page directly using Ctrl+P.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Student Portal', path: '/student' },
          { label: 'Pro Resume Builder' }
        ]}
        fallbackPath="/student"
      />

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-navy-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> GTU & Tech Placement Standard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Professional Engineering Resume Builder</h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            8 ATS-compliant engineering templates, live instant preview, accent color styling, and high-fidelity PDF export.
          </p>
          {saveStatus && <p className="text-emerald-400 text-xs font-semibold">{saveStatus}</p>}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-navy-900/80 border border-navy-700 rounded-2xl px-4 py-2">
            <div className="text-right mr-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ATS Score</span>
              <span className="text-lg font-black text-emerald-400">{atsScore}/100</span>
            </div>
            <Award className="w-6 h-6 text-brand-orange" />
          </div>

          <button
            onClick={resetToSample}
            title="Load sample engineering data"
            className="px-3 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-navy-700 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sample
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Comprehensive Template Chooser Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-brand-orange" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-navy-950 dark:text-white uppercase tracking-wider">
                  Select Resume Template ({TEMPLATES.length})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ATS Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose from Ivy League ATS, two-column executive, FAANG, startup, academic, or terminal formats.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Color Accent Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Accent:</span>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setAccentColor(c.hex)}
                  title={c.name}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    accentColor === c.hex ? 'scale-125 ring-2 ring-offset-1 ring-brand-orange' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setActiveTab('EDIT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'EDIT' ? 'bg-navy-900 dark:bg-navy-700 text-white' : 'bg-slate-100 dark:bg-navy-950 text-slate-600'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'PREVIEW' ? 'bg-navy-900 dark:bg-navy-700 text-white' : 'bg-slate-100 dark:bg-navy-950 text-slate-600'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Template Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {TEMPLATES.map((tmpl) => {
            const isSelected = activeTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-orange bg-orange-50/70 dark:bg-brand-orange/15 shadow-sm ring-1 ring-brand-orange'
                    : 'border-slate-200 dark:border-navy-750 bg-slate-50/60 dark:bg-navy-950/40 hover:border-slate-300 dark:hover:border-navy-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />}
                  </div>
                  <div className="font-bold text-xs text-navy-950 dark:text-white line-clamp-1">
                    {tmpl.name}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Editor (Left) & Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Column */}
        <div className={`lg:col-span-6 space-y-6 ${activeTab === 'PREVIEW' ? 'hidden lg:block' : ''}`}>
          {/* Section: Personal Info */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-orange" /> Personal & Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={e => setData({ ...data, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData({ ...data, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={data.phone}
                  onChange={e => setData({ ...data, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Location / City</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={e => setData({ ...data, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">LinkedIn URL</label>
                <input
                  type="text"
                  value={data.linkedin}
                  onChange={e => setData({ ...data, linkedin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">GitHub / Portfolio URL</label>
                <input
                  type="text"
                  value={data.github}
                  onChange={e => setData({ ...data, github: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-semibold text-xs">Career Objective / Professional Summary</label>
              <textarea
                rows={3}
                value={data.summary}
                onChange={e => setData({ ...data, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Technical Skills */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-orange" /> Technical Skills & Tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500">
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker, PyTorch, C++)..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 dark:text-white text-xs"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-navy-900 dark:bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-black"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Section: Education */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-orange" /> Education
              </h2>
              <button
                onClick={addEducation}
                className="px-3 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>

            <div className="space-y-4">
              {data.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-3 relative">
                  <button
                    onClick={() => removeEducation(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pr-6">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Degree / Examination</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={e => updateEducation(idx, 'degree', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Institution / University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={e => updateEducation(idx, 'institution', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Passing Year / Duration</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={e => updateEducation(idx, 'year', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">CGPA / Percentage</label>
                      <input
                        type="text"
                        value={edu.score}
                        onChange={e => updateEducation(idx, 'score', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Experience & Internships */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-orange" /> Experience & Internships
              </h2>
              <button
                onClick={addExperience}
                className="px-3 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-3 relative">
                  <button
                    onClick={() => removeExperience(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pr-6">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Job Title / Role</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={e => updateExperience(idx, 'role', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Company Name</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={e => updateExperience(idx, 'company', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 font-medium">Duration</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={e => updateExperience(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 font-medium">Key Achievements (Bullet points)</label>
                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={e => updateExperience(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Projects */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-brand-orange" /> Academic & Personal Projects
              </h2>
              <button
                onClick={addProject}
                className="px-3 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-3 relative">
                  <button
                    onClick={() => removeProject(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pr-6">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Project Name</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={e => updateProject(idx, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Technologies Used</label>
                      <input
                        type="text"
                        value={proj.technologies}
                        onChange={e => updateProject(idx, 'technologies', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 font-medium">Description & Bullet Points</label>
                      <textarea
                        rows={3}
                        value={proj.description}
                        onChange={e => updateProject(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Certifications & Honors */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-orange" /> Honors & Certifications
              </h2>
              <button
                onClick={addCertification}
                className="px-3 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certificate
              </button>
            </div>

            <div className="space-y-4">
              {data.certifications.map((cert, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-3 relative">
                  <button
                    onClick={() => removeCertification(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pr-6">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 font-medium">Certificate / Honor Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={e => updateCertification(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Issuer / Year</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Issuer"
                          value={cert.issuer}
                          onChange={e => updateCertification(idx, 'issuer', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Year"
                          value={cert.year}
                          onChange={e => updateCertification(idx, 'year', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Column (A4 Printable Canvas) */}
        <div className={`lg:col-span-6 sticky top-20 ${activeTab === 'EDIT' ? 'hidden lg:block' : ''}`}>
          <div className="bg-slate-200 dark:bg-navy-950 p-4 sm:p-6 rounded-3xl border border-slate-300 dark:border-navy-800 overflow-x-auto shadow-inner flex justify-center">
            {/* Sheet representing A4 document */}
            <div
              id="resume-preview-sheet"
              ref={previewRef}
              className={`w-full max-w-[650px] bg-white text-slate-900 p-8 shadow-2xl rounded-sm ${
                activeTemplate === 'MINIMAL_CLASSIC' || activeTemplate === 'HARVARD_IVY' || activeTemplate === 'RESEARCH_ACADEMIC'
                  ? 'font-serif' 
                  : activeTemplate === 'COMPACT_TECH'
                  ? 'font-mono text-[11px]'
                  : 'font-sans'
              }`}
              style={{ minHeight: '840px' }}
            >
              {/* Template Style 1: Harvard Ivy ATS */}
              {activeTemplate === 'HARVARD_IVY' && (
                <div className="space-y-3.5 text-xs text-black">
                  {/* Centered Ivy Header */}
                  <div className="text-center pb-2 border-b-2 border-black">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-black">
                      {data.fullName}
                    </h1>
                    <div className="text-[11px] text-gray-800 mt-1 flex flex-wrap justify-center items-center gap-x-2">
                      <span>{data.location}</span>
                      <span>•</span>
                      <span>{data.phone}</span>
                      <span>•</span>
                      <span className="font-semibold">{data.email}</span>
                      {data.linkedin && (
                        <>
                          <span>•</span>
                          <span>{data.linkedin}</span>
                        </>
                      )}
                      {data.github && (
                        <>
                          <span>•</span>
                          <span>{data.github}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {data.summary && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Professional Summary
                      </h2>
                      <p className="text-[11px] text-gray-900 leading-relaxed text-justify">
                        {data.summary}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {data.education.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Education
                      </h2>
                      {data.education.map((edu, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-xs">
                            <span>{edu.institution}</span>
                            <span className="font-semibold text-[11px]">{edu.year}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-800">
                            <span className="italic">{edu.degree}</span>
                            <span className="font-bold text-black">{edu.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Technical Skills */}
                  {data.skills.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Technical Skills
                      </h2>
                      <p className="text-[11px] text-gray-900 leading-snug">
                        <strong className="font-bold">Proficiencies: </strong>
                        {data.skills.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {data.experience.length > 0 && (
                    <div className="space-y-2.5">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Work Experience
                      </h2>
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between font-bold text-xs">
                            <span>{exp.company}</span>
                            <span className="font-semibold text-[11px]">{exp.duration}</span>
                          </div>
                          <div className="text-[11px] italic text-gray-800">{exp.role}</div>
                          <div className="text-[11px] text-gray-900 whitespace-pre-line leading-relaxed pl-2 border-l border-gray-300">
                            {exp.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {data.projects.length > 0 && (
                    <div className="space-y-2.5">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Technical Projects
                      </h2>
                      {data.projects.map((proj, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between font-bold text-xs">
                            <span>{proj.title} <span className="font-normal italic text-[11px]">| {proj.technologies}</span></span>
                            {proj.link && <span className="text-[10px] text-gray-600">{proj.link}</span>}
                          </div>
                          <div className="text-[11px] text-gray-900 whitespace-pre-line leading-relaxed pl-2 border-l border-gray-300">
                            {proj.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5">
                        Honors & Certifications
                      </h2>
                      {data.certifications.map((cert, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>• <strong>{cert.name}</strong> — {cert.issuer}</span>
                          <span className="font-semibold">{cert.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 2: Modern Engineering */}
              {activeTemplate === 'MODERN_ENGINEERING' && (
                <div className="space-y-4 text-xs">
                  {/* Header */}
                  <div className="border-b-2 pb-3" style={{ borderColor: accentColor }}>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                      {data.fullName}
                    </h1>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 font-medium mt-1">
                      <span>{data.email}</span>
                      <span>•</span>
                      <span>{data.phone}</span>
                      <span>•</span>
                      <span>{data.location}</span>
                      {data.linkedin && (
                        <>
                          <span>•</span>
                          <span>{data.linkedin}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {data.summary && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Professional Summary
                      </h2>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {data.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="space-y-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                      Technical Skills & Competencies
                    </h2>
                    <p className="text-[11px] text-slate-800 leading-relaxed">
                      <strong>Proficiencies:</strong> {data.skills.join(', ')}
                    </p>
                  </div>

                  {/* Education */}
                  {data.education.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Education
                      </h2>
                      {data.education.map((edu, i) => (
                        <div key={i} className="flex justify-between items-baseline">
                          <div>
                            <p className="font-bold text-slate-900">{edu.degree}</p>
                            <p className="text-[11px] text-slate-600">{edu.institution}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">{edu.score}</span>
                            <p className="text-[10px] text-slate-500">{edu.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Experience */}
                  {data.experience.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Professional Experience
                      </h2>
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-slate-900">{exp.role} — <span className="font-normal text-slate-700">{exp.company}</span></span>
                            <span className="text-[10px] text-slate-500 font-medium">{exp.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {data.projects.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Technical Projects
                      </h2>
                      {data.projects.map((proj, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-slate-900">{proj.title}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{proj.technologies}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Honors & Certifications
                      </h2>
                      {data.certifications.map((cert, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>• <strong>{cert.name}</strong> — {cert.issuer}</span>
                          <span className="text-slate-500 text-[10px]">{cert.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 3: Executive Two-Column */}
              {activeTemplate === 'TWO_COLUMN_PRO' && (
                <div className="flex gap-6 -m-8 min-h-[840px] text-xs font-sans">
                  {/* Left Column Sidebar */}
                  <div className="w-[36%] bg-slate-50 border-r border-slate-200 p-6 space-y-5 shrink-0">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                        Contact Info
                      </h3>
                      <div className="space-y-1.5 text-[10px] text-slate-700">
                        <p className="break-all font-medium">✉ {data.email}</p>
                        <p className="font-medium">📞 {data.phone}</p>
                        <p className="font-medium">📍 {data.location}</p>
                        {data.linkedin && <p className="break-all">🔗 {data.linkedin}</p>}
                        {data.github && <p className="break-all">💻 {data.github}</p>}
                      </div>
                    </div>

                    {/* Education */}
                    {data.education.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                          Education
                        </h3>
                        {data.education.map((edu, i) => (
                          <div key={i} className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-[11px] leading-tight">{edu.degree}</p>
                            <p className="text-[10px] text-slate-600 leading-tight">{edu.institution}</p>
                            <div className="flex justify-between text-[10px] pt-0.5">
                              <span className="font-bold text-slate-900">{edu.score}</span>
                              <span className="text-slate-500">{edu.year}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {data.skills.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                          Skills & Tools
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {data.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[10px] font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {data.certifications.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                          Certifications
                        </h3>
                        <div className="space-y-1.5 text-[10px]">
                          {data.certifications.map((c, i) => (
                            <div key={i} className="leading-tight">
                              <p className="font-bold text-slate-900">{c.name}</p>
                              <p className="text-slate-500">{c.issuer} ({c.year})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Main Column */}
                  <div className="flex-1 py-6 pr-6 space-y-4">
                    {/* Header */}
                    <div className="border-b-2 pb-3" style={{ borderColor: accentColor }}>
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                        {data.fullName}
                      </h1>
                      <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                        Engineering Graduate & Technical Specialist
                      </p>
                      {data.summary && (
                        <p className="text-[11px] text-slate-700 leading-relaxed mt-2 text-justify">
                          {data.summary}
                        </p>
                      )}
                    </div>

                    {/* Experience */}
                    {data.experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-wider pb-1 border-b border-slate-200" style={{ color: accentColor }}>
                          Work Experience
                        </h2>
                        {data.experience.map((exp, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-xs text-slate-950">
                              <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></span>
                              <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                            </div>
                            <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                              {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {data.projects.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-black uppercase tracking-wider pb-1 border-b border-slate-200" style={{ color: accentColor }}>
                          Engineering Projects
                        </h2>
                        {data.projects.map((proj, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-xs text-slate-950">{proj.title}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{proj.technologies}</span>
                            </div>
                            <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                              {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Template Style 4: FAANG High-Impact */}
              {activeTemplate === 'FAANG_CLEAN' && (
                <div className="space-y-3.5 text-xs font-sans text-slate-900">
                  {/* FAANG Header */}
                  <div className="flex justify-between items-start pb-2 border-b-2" style={{ borderColor: accentColor }}>
                    <div>
                      <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                        {data.fullName}
                      </h1>
                      <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                        Computer Engineering • Full Stack & Cloud Architecture
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                      <p>{data.email} | {data.phone}</p>
                      <p>{data.location}</p>
                      <p className="font-medium text-slate-900">
                        {data.linkedin && <span>{data.linkedin}</span>}
                        {data.github && <span> | {data.github}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Technical Skills Summary at Top for Rapid 6-Second Screen */}
                  {data.skills.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                      <h2 className="text-[10px] font-black uppercase tracking-wider" style={{ color: accentColor }}>
                        Technical Arsenal
                      </h2>
                      <p className="text-[11px] text-slate-800 leading-snug">
                        <strong>Languages & Technologies:</strong> {data.skills.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {data.experience.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-0.5 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Professional Experience
                      </h2>
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between items-baseline font-bold text-xs">
                            <span className="text-slate-950">{exp.role} <span className="font-normal text-slate-600">at {exp.company}</span></span>
                            <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                          </div>
                          <div className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-slate-300">
                            {exp.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {data.projects.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-0.5 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Technical Projects & Architecture
                      </h2>
                      {data.projects.map((proj, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between items-baseline font-bold text-xs">
                            <span className="text-slate-950">{proj.title} <span className="text-[10px] font-normal text-slate-500">[{proj.technologies}]</span></span>
                            {proj.link && <span className="text-[10px] text-blue-600 font-medium">{proj.link}</span>}
                          </div>
                          <div className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-slate-300">
                            {proj.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {data.education.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-0.5 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Education
                      </h2>
                      {data.education.map((edu, i) => (
                        <div key={i} className="flex justify-between items-baseline text-xs">
                          <div>
                            <span className="font-bold text-slate-950">{edu.degree}</span>
                            <span className="text-slate-600 text-[11px]">, {edu.institution}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-950 text-[11px]">{edu.score}</span>
                            <span className="text-slate-500 text-[10px] ml-2">({edu.year})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-0.5 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Certifications & Credentials
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-800">
                        {data.certifications.map((c, i) => (
                          <span key={i}>• <strong>{c.name}</strong> ({c.issuer}, {c.year})</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 5: Creative Startup */}
              {activeTemplate === 'CREATIVE_STARTUP' && (
                <div className="space-y-4 text-xs font-sans text-slate-900">
                  {/* Startup Header with Left Accent Bar */}
                  <div className="border-l-4 pl-4 py-1" style={{ borderColor: accentColor }}>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                      {data.fullName}
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                      Product-Focused Software Engineer
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">✉ {data.email}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">📞 {data.phone}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">📍 {data.location}</span>
                      {data.github && <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-900">💻 {data.github}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {data.summary && (
                    <p className="text-[11px] text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {data.summary}
                    </p>
                  )}

                  {/* Skill Badges */}
                  {data.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-[11px] font-black uppercase tracking-wider" style={{ color: accentColor }}>
                        Core Competencies & Stack
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200/80">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {data.experience.length > 0 && (
                    <div className="space-y-2.5">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Work Experience
                      </h2>
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between font-bold text-xs">
                            <span className="text-slate-950">{exp.role} <span className="font-normal text-slate-600">@ {exp.company}</span></span>
                            <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {data.projects.length > 0 && (
                    <div className="space-y-2.5">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Featured Projects & Open Source
                      </h2>
                      {data.projects.map((proj, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                          <div className="flex justify-between font-bold text-xs">
                            <span className="text-slate-950">{proj.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-medium">{proj.technologies}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {data.education.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-[11px] font-black uppercase tracking-wider pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        Education
                      </h2>
                      {data.education.map((edu, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span><strong>{edu.degree}</strong> — {edu.institution}</span>
                          <span><strong>{edu.score}</strong> ({edu.year})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 6: Academic & GATE */}
              {activeTemplate === 'RESEARCH_ACADEMIC' && (
                <div className="space-y-3.5 text-xs text-slate-900">
                  {/* Academic Header */}
                  <div className="text-center pb-2 border-b border-slate-900 space-y-1">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-950">
                      {data.fullName}
                    </h1>
                    <p className="text-xs italic text-slate-700 font-sans">
                      Gujarat Technological University (GTU) • Gujarat, India
                    </p>
                    <div className="text-[11px] text-slate-700 flex justify-center gap-3 font-sans">
                      <span>Email: {data.email}</span>
                      <span>•</span>
                      <span>Phone: {data.phone}</span>
                      <span>•</span>
                      <span>{data.linkedin}</span>
                    </div>
                  </div>

                  {/* Academic Credentials (Table Format) */}
                  {data.education.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5">
                        1. Academic Qualifications
                      </h2>
                      <table className="w-full text-left text-[11px] border border-slate-300">
                        <thead className="bg-slate-100 font-sans font-bold">
                          <tr>
                            <th className="p-1.5 border-b border-r border-slate-300">Degree / Examination</th>
                            <th className="p-1.5 border-b border-r border-slate-300">Institution / University</th>
                            <th className="p-1.5 border-b border-r border-slate-300 text-center">Year</th>
                            <th className="p-1.5 border-b border-slate-300 text-right">CPI / %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.education.map((edu, i) => (
                            <tr key={i} className="border-b border-slate-200">
                              <td className="p-1.5 border-r border-slate-200 font-semibold">{edu.degree}</td>
                              <td className="p-1.5 border-r border-slate-200 text-slate-700">{edu.institution}</td>
                              <td className="p-1.5 border-r border-slate-200 text-center">{edu.year}</td>
                              <td className="p-1.5 text-right font-bold">{edu.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Technical Competencies */}
                  {data.skills.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5">
                        2. Technical & Research Proficiencies
                      </h2>
                      <p className="text-[11px] leading-relaxed text-slate-800">
                        <strong>Core Tools & Languages:</strong> {data.skills.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Research & Capstone Projects */}
                  {data.projects.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5">
                        3. Research & Technical Projects
                      </h2>
                      {data.projects.map((proj, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-xs">
                            <span>{proj.title}</span>
                            <span className="italic font-normal text-[11px] text-slate-600">[{proj.technologies}]</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed pl-2 border-l border-slate-300">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Internship & Experience */}
                  {data.experience.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5">
                        4. Industry Internships & Apprenticeships
                      </h2>
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-xs">
                            <span>{exp.role} — <span className="font-normal italic">{exp.company}</span></span>
                            <span className="text-[11px] font-medium text-slate-600">{exp.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed pl-2 border-l border-slate-300">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Honors & Certifications */}
                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5">
                        5. Honors, NPTEL & Academic Certifications
                      </h2>
                      {data.certifications.map((c, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>• <strong>{c.name}</strong>, issued by {c.issuer}</span>
                          <span className="font-bold">{c.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 7: Minimal Classic */}
              {activeTemplate === 'MINIMAL_CLASSIC' && (
                <div className="space-y-4 text-xs">
                  <div className="text-center border-b border-black pb-3">
                    <h1 className="text-2xl font-bold tracking-normal uppercase text-black">
                      {data.fullName}
                    </h1>
                    <p className="text-[11px] text-gray-700 mt-1">
                      {data.location} | {data.phone} | {data.email} | {data.linkedin}
                    </p>
                  </div>

                  {data.summary && (
                    <div className="space-y-1">
                      <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Objective</h3>
                      <p className="text-[11px] text-gray-800 leading-relaxed">{data.summary}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Education</h3>
                    {data.education.map((e, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <div>
                          <strong>{e.institution}</strong>, {e.degree}
                        </div>
                        <div>{e.year} | {e.score}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Skills</h3>
                    <p className="text-[11px]">{data.skills.join(' • ')}</p>
                  </div>

                  {data.experience.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Experience</h3>
                      {data.experience.map((e, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between font-bold text-[11px]">
                            <span>{e.company} — {e.role}</span>
                            <span>{e.duration}</span>
                          </div>
                          <p className="text-[11px] whitespace-pre-line text-gray-800">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.projects.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Key Projects</h3>
                      {data.projects.map((p, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between font-bold text-[11px]">
                            <span>{p.title} ({p.technologies})</span>
                          </div>
                          <p className="text-[11px] whitespace-pre-line text-gray-800">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="font-bold uppercase text-[11px] border-b border-gray-300">Honors & Certifications</h3>
                      {data.certifications.map((c, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>• <strong>{c.name}</strong> — {c.issuer}</span>
                          <span>{c.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Style 8: Compact Terminal */}
              {activeTemplate === 'COMPACT_TECH' && (
                <div className="space-y-3">
                  <div className="border-l-4 pl-3" style={{ borderColor: accentColor }}>
                    <h1 className="text-xl font-bold text-slate-950 uppercase">{data.fullName}</h1>
                    <p className="text-[10px] text-slate-600">{data.email} | {data.phone} | {data.github}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5">// 01. TECHNICAL SKILLS</h4>
                    <p className="text-[10px] leading-tight text-slate-700">{data.skills.join(', ')}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5">// 02. EDUCATION</h4>
                    {data.education.map((e, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span>{e.degree} ({e.institution})</span>
                        <span className="font-semibold">{e.score}</span>
                      </div>
                    ))}
                  </div>

                  {data.experience.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5">// 03. EXPERIENCE</h4>
                      {data.experience.map((e, i) => (
                        <div key={i} className="text-[10px]">
                          <p className="font-bold">{e.role} @ {e.company} [{e.duration}]</p>
                          <p className="text-slate-700 whitespace-pre-line">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5">// 04. PROJECTS</h4>
                    {data.projects.map((p, i) => (
                      <div key={i} className="text-[10px]">
                        <p className="font-bold">{p.title} <span className="font-normal text-slate-500">[{p.technologies}]</span></p>
                        <p className="text-slate-700 whitespace-pre-line">{p.description}</p>
                      </div>
                    ))}
                  </div>

                  {data.certifications.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5">// 05. CERTIFICATIONS</h4>
                      {data.certifications.map((c, i) => (
                        <p key={i} className="text-[10px] text-slate-700">• {c.name} ({c.issuer})</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
