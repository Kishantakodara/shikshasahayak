import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowRight, 
  FileText, 
  BookOpen, 
  ScrollText, 
  Award, 
  Layers, 
  Sparkles,
  Download,
  Folder
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import AdBlock from '../../components/ads/AdBlock';
import SeoContentBlock from '../../components/ads/SeoContentBlock';
import { useStudentAcademic } from '../../context/StudentAcademicContext';

type ResourceTab = 'pyqs' | 'question-bank' | 'syllabus' | 'gate' | 'links';

interface AcademicResourceItem {
  id: string;
  name: string;
  code: string;
  session: string;
  university: string;
  branch: string;
  semester: number;
  type: ResourceTab;
  link: string;
}

// Sample representative GTU dataset for Section 17 table
const ACADEMIC_LIBRARY_DATA: AcademicResourceItem[] = [
  // GTU Papers
  { id: '1', name: 'Mathematics-3', code: '3110016', session: 'W2024', university: 'GTU', branch: 'common', semester: 3, type: 'pyqs', link: '/resources/pyq' },
  { id: '2', name: 'Electrical Machines', code: '3130007', session: 'W2024', university: 'GTU', branch: 'electrical', semester: 3, type: 'pyqs', link: '/resources/pyq' },
  { id: '3', name: 'Network Analysis', code: '3130005', session: 'S2024', university: 'GTU', branch: 'electrical', semester: 3, type: 'pyqs', link: '/resources/pyq' },
  { id: '4', name: 'Data Structures & Algorithms', code: '3130702', session: 'W2024', university: 'GTU', branch: 'computer', semester: 3, type: 'pyqs', link: '/resources/pyq' },
  { id: '5', name: 'Database Management Systems', code: '3150703', session: 'S2024', university: 'GTU', branch: 'computer', semester: 5, type: 'pyqs', link: '/resources/pyq' },
  { id: '6', name: 'Control System Engineering', code: '3140913', session: 'W2024', university: 'GTU', branch: 'electrical', semester: 4, type: 'pyqs', link: '/resources/pyq' },
  { id: '7', name: 'Operating Systems', code: '3140702', session: 'W2024', university: 'GTU', branch: 'computer', semester: 4, type: 'pyqs', link: '/resources/pyq' },
  { id: '8', name: 'Fluid Mechanics & Hydraulics', code: '3131906', session: 'S2024', university: 'GTU', branch: 'mechanical', semester: 3, type: 'pyqs', link: '/resources/pyq' },
  
  // Question Bank
  { id: '9', name: 'Transformers & Induction Machines Question Bank', code: '3130007', session: 'Unit 1-4', university: 'GTU', branch: 'electrical', semester: 3, type: 'question-bank', link: '/practice/exam' },
  { id: '10', name: 'Fourier Series & Laplace Transform MCQ Bank', code: '3110016', session: 'Unit 1-3', university: 'GTU', branch: 'common', semester: 3, type: 'question-bank', link: '/practice/exam' },
  { id: '11', name: 'Trees & Graph Traversal Question Bank', code: '3130702', session: 'Unit 2-5', university: 'GTU', branch: 'computer', semester: 3, type: 'question-bank', link: '/practice/exam' },
  
  // Syllabus
  { id: '12', name: 'Official Electrical Machines Syllabus (NEP)', code: '3130007', session: '2024-25', university: 'GTU', branch: 'electrical', semester: 3, type: 'syllabus', link: '/resources/syllabus' },
  { id: '13', name: 'Official Mathematics-3 Teaching Scheme', code: '3110016', session: '2024-25', university: 'GTU', branch: 'common', semester: 3, type: 'syllabus', link: '/resources/syllabus' },
  { id: '14', name: 'Data Structures Official Syllabus', code: '3130702', session: '2024-25', university: 'GTU', branch: 'computer', semester: 3, type: 'syllabus', link: '/resources/syllabus' },
  
  // GATE
  { id: '15', name: 'GATE Electrical Engineering Syllabus Roadmap', code: 'GATE-EE', session: '2027', university: 'IIT', branch: 'electrical', semester: 0, type: 'gate', link: '/gate-2027' },
  { id: '16', name: 'GATE Computer Science & IT Complete Subject Map', code: 'GATE-CS', session: '2027', university: 'IIT', branch: 'computer', semester: 0, type: 'gate', link: '/gate-2027' },

  // Useful Links
  { id: '17', name: 'GTU Student Grade History Portal', code: 'PORTAL-01', session: 'Current', university: 'GTU', branch: 'all', semester: 0, type: 'links', link: 'https://www.gtu.ac.in/' },
  { id: '18', name: 'GTU Rechecking & Reassessment Form System', code: 'PORTAL-02', session: 'Current', university: 'GTU', branch: 'all', semester: 0, type: 'links', link: 'https://www.gturesults.in/' }
];

export const ResourcesHub: React.FC = () => {
  const { academicProfile } = useStudentAcademic();

  const [activeTab, setActiveTab] = useState<ResourceTab>('pyqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return ACADEMIC_LIBRARY_DATA.filter((item) => {
      if (item.type !== activeTab) return false;
      if (selectedSemester !== 'all' && item.semester.toString() !== selectedSemester) return false;
      if (selectedBranch !== 'all' && item.branch !== selectedBranch && item.branch !== 'common' && item.branch !== 'all') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.session.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery, selectedSemester, selectedBranch]);

  return (
    <BrowseShell
      crumbs={[{ label: 'Resources' }]}
      eyebrow="Academic Directory"
      title="Searchable Academic Library"
      description="Access verified GTU exam papers, official NEP syllabus guidelines, question banks, and GATE prep modules in a structured tabular catalog."
    >
      {/* 17. ACADEMIC LIBRARY TABS: GTU Papers | Question Bank | Syllabus | GATE | Useful Links */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs mb-6">
        <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('pyqs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pyqs'
                ? 'bg-[#F97316] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            GTU Papers
          </button>
          <button
            onClick={() => setActiveTab('question-bank')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'question-bank'
                ? 'bg-[#F97316] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Question Bank
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'syllabus'
                ? 'bg-[#F97316] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Syllabus
          </button>
          <button
            onClick={() => setActiveTab('gate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'gate'
                ? 'bg-[#F97316] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            GATE 2027
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-[#F97316] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Useful Links
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject name, paper code (e.g. 3130007), or season..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-hidden focus:border-[#F97316]"
            />
          </div>

          {/* Semester Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-hidden focus:border-[#F97316]"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-hidden focus:border-[#F97316]"
            >
              <option value="all">All Departments</option>
              <option value="electrical">Electrical</option>
              <option value="computer">Computer Engineering</option>
              <option value="mechanical">Mechanical</option>
              <option value="civil">Civil</option>
            </select>
          </div>
        </div>
      </div>

      {/* 17. LIST / TABLE STRUCTURE (Section 17) */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Session / Year</th>
                <th className="py-3 px-4">University</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-[#0F172A] dark:text-slate-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-xs sm:text-sm">
                      <span className="text-[#0F172A] dark:text-white">{item.name}</span>
                      {item.semester > 0 && (
                        <span className="block text-[11px] text-[#64748B] font-normal">
                          Semester {item.semester} • {item.branch}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                        {item.session}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] font-semibold">
                      {item.university}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.link.startsWith('http') ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-white hover:bg-slate-200 font-bold text-xs transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Link
                          to={item.link}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-xs transition-colors shadow-2xs"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#64748B]">
                    No resources match your search criteria. Try clearing filters or searching for "Electrical" or "3130007".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SeoContentBlock title="Why Use ShikshaSahayak's Searchable Academic Library?">
        <p className="mb-2">
          Engineering examinations at Gujarat Technological University require reliable, authoritative references. ShikshaSahayak organizes university archives in a searchable tabular registry, enabling students to quickly find verified papers, official NEP subject teaching schemes, and question banks.
        </p>
      </SeoContentBlock>

      <div className="mt-6">
        <AdBlock />
      </div>
    </BrowseShell>
  );
};

export default ResourcesHub;
