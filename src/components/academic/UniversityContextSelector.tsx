import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronDown, FileText, ScrollText, ArrowRight } from "lucide-react";
import { useStudentAcademic } from "../../context/StudentAcademicContext";
import { useAuth } from "../../context/AuthContext";
import { getCanonicalBranchSlug } from "../../utils/branchUtils";

interface Props {
  className?: string;
  selectedUniversityId?: string;
  onSelectUniversity?: (univ: any) => void;
}

export const UniversityContextSelector: React.FC<Props> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { academicProfile, isExploreMode } = useStudentAcademic();
  const { currentUser } = useAuth();

  const isPersonalized = !isExploreMode && Boolean(currentUser) && Boolean(academicProfile?.branchId);
  const branchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName);
  const semester = academicProfile.semester || 1;

  const targetUrl = isPersonalized 
    ? `/resources/study-material/${branchSlug}/semester/${semester}` 
    : "/resources";

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    navigate(targetUrl);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-flex items-center rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-xs font-bold text-[#f97316] transition-all shadow-xs group ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 cursor-pointer focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Quick Access Resources Menu"
      >
        <BookOpen className="h-3.5 w-3.5 text-[#f97316] group-hover:scale-110 transition-transform" />
        <span>Resources</span>
        <ChevronDown className={`h-3 w-3 text-[#f97316]/70 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0b1626] border border-gray-200 dark:border-navy-700/80 shadow-2xl z-50 p-2 space-y-1 animate-fade-in backdrop-blur-md">
          <div className="px-3 py-1.5 text-[10px] font-black tracking-wider text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-navy-800 flex items-center justify-between">
            <span>{isPersonalized ? `${academicProfile.branchName || "My"} Resources` : "GTU Academic Resources"}</span>
            <span className="text-[9px] bg-orange-500/15 text-[#f97316] font-extrabold px-1.5 py-0.5 rounded">
              {isPersonalized ? `Sem ${semester}` : "All Semesters"}
            </span>
          </div>

          <Link
            to={isPersonalized ? `/resources/study-material/${branchSlug}/semester/${semester}` : "/resources/study-material"}
            onClick={() => setIsOpen(false)}
            className="w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:bg-orange-500/10 hover:text-[#f97316] transition-colors group/item"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-[#f97316] group-hover/item:bg-orange-500 group-hover/item:text-white transition-colors shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-navy-950 dark:text-white group-hover/item:text-[#f97316] text-xs">Study Material</div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal truncate">
                {isPersonalized ? `Semester ${semester} subject notes & guides` : "Unit notes, formula sheets & guides"}
              </p>
            </div>
          </Link>

          <Link
            to={isPersonalized ? `/resources/pyq/${branchSlug}/semester/${semester}` : "/resources/pyq"}
            onClick={() => setIsOpen(false)}
            className="w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:bg-orange-500/10 hover:text-[#f97316] transition-colors group/item"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-navy-950 dark:text-white group-hover/item:text-[#f97316] text-xs">GTU PYQ Papers</div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal truncate">
                {isPersonalized ? `Semester ${semester} exam question papers` : "Winter & Summer exam papers"}
              </p>
            </div>
          </Link>

          <Link
            to={isPersonalized ? `/resources/syllabus/${branchSlug}/semester/${semester}` : "/resources/syllabus"}
            onClick={() => setIsOpen(false)}
            className="w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:bg-orange-500/10 hover:text-[#f97316] transition-colors group/item"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors shrink-0">
              <ScrollText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-navy-950 dark:text-white group-hover/item:text-[#f97316] text-xs">Official Syllabus</div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal truncate">
                {isPersonalized ? `Semester ${semester} teaching scheme` : "Latest NEP teaching schemes"}
              </p>
            </div>
          </Link>

          <div className="pt-1 border-t border-gray-100 dark:border-navy-800">
            <Link
              to="/resources"
              onClick={() => setIsOpen(false)}
              className="w-full p-2 rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#f97316] hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors"
            >
              <span>Explore All Departments Hub</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export const ResourcesQuickMenu = UniversityContextSelector;
