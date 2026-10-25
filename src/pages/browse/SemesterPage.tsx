import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import FolderCard from '../../components/browse/FolderCard';
import { apiClient } from '../../api/client';
import { Branch, BrowseSubject } from '../../types';
import { isMaterialType, normalizeMaterialType, MATERIAL_TYPES, MaterialTypeKey } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';
import { getCurrentAcademicYear } from '../../utils/gtuSyllabus';
import SeoContentBlock from '../../components/ads/SeoContentBlock';
import AdBlock from '../../components/ads/AdBlock';
import AuthorByline from '../../components/common/AuthorByline';
import AcademicValueHighlights from '../../components/common/AcademicValueHighlights';
import AcademicFaqSection from '../../components/common/AcademicFaqSection';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { ExploreModeToggle } from '../../components/personalization/ExploreModeToggle';

import { useAuth } from '../../context/AuthContext';
import { Compass } from 'lucide-react';

import { gtuPyqClient } from '../../api/gtuPyqClient';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';

const SemesterPage: React.FC = () => {
  const { type, branchSlug, sem } = useParams<{ type: string; branchSlug: string; sem: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { academicProfile, isExploreMode, setExploreMode } = useStudentAcademic();
  const semester = sem === '1-or-2-common' ? 0 : Number(sem);
  const canonicalBranchSlug = branchSlug ? getCanonicalBranchSlug(branchSlug) : '';
  const [branch, setBranch] = useState<Branch | null>(null);
  const [subjects, setSubjects] = useState<BrowseSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const materialTypeKey: MaterialTypeKey = normalizeMaterialType(type);
  const config = MATERIAL_TYPES[materialTypeKey];
  const validType = Boolean(config);
  const validParams = validType && Boolean(branchSlug) && Number.isFinite(semester) && semester >= 0;

  // Auto-redirect alias URLs like /resources/syllabus/gtu-be-16/semester/5 to canonical slug
  if (branchSlug && canonicalBranchSlug && branchSlug !== canonicalBranchSlug && validType && Number.isFinite(semester)) {
    return <Navigate to={browsePaths.semester(materialTypeKey, canonicalBranchSlug, semester)} replace />;
  }

  const effectiveBranchSlug = canonicalBranchSlug || branchSlug || '';
  const semesterLabel = semester === 0 ? '1st Year Common' : `Semester ${semester}`;
  const branchName = branch?.name || getCanonicalBranchName(effectiveBranchSlug);

  useEffect(() => {
    if (!validParams || !effectiveBranchSlug) return;
    setLoading(true);
    apiClient
      .getSemesterSubjects(effectiveBranchSlug, semester, materialTypeKey)
      .then(async (res) => {
        setBranch(res.branch);
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
        } else if (type === 'pyq') {
          // Fallback to Canonical PYQ tree for this branch and semester
          const canonicalRes = await gtuPyqClient.getCanonicalTree({
            branch: branchSlug,
            semester,
          }).catch(() => ({ canonicalSubjects: [] }));

          if (canonicalRes && Array.isArray(canonicalRes.canonicalSubjects) && canonicalRes.canonicalSubjects.length > 0) {
            setSubjects(
              canonicalRes.canonicalSubjects.map((cs: any) => ({
                offering_id: cs.id,
                semester: cs.semester,
                curriculum_id: 'gtu-scheme',
                curriculum_name: 'GTU Curriculum',
                subject_id: cs.id,
                subject_code: cs.subjectCodes?.[0]?.subjectCode || '',
                subject_name: cs.canonicalName,
                subject_slug: cs.canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                session_count: 1,
                material_count: cs.totalPapers || 0,
              }))
            );
          } else {
            setSubjects([]);
          }
        } else {
          setSubjects(res.subjects);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [branchSlug, semester, type, validParams]);

  if (!validParams || !config || !branchSlug) {
    return <Navigate to="/resources" replace />;
  }

  const profileBranchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName);
  const isDifferentFromProfile = currentUser && (effectiveBranchSlug !== profileBranchSlug || semester !== academicProfile?.semester);

  return (
    <BrowseShell
      crumbs={[
        { label: config.folderLabel, to: `${browsePaths.typeAbout(materialTypeKey)}?explore=all` },
        { label: branchName, to: `${browsePaths.branch(materialTypeKey, effectiveBranchSlug)}?explore=all` },
        { label: semesterLabel },
      ]}
      eyebrow={semesterLabel}
      title="Subjects"
      description={`Open a subject folder to browse ${config.folderLabel.toLowerCase()} for ${semester === 0 ? '1st year' : `this semester`}.`}
    >
      <div className="mb-6">
        <ExploreModeToggle isExploreMode={isExploreMode} onToggleExploreMode={setExploreMode} />
      </div>

      {currentUser && (isDifferentFromProfile || isExploreMode) && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Compass className="w-4 h-4 text-purple-500 shrink-0" />
            <span>
              {isDifferentFromProfile 
                ? `Explore Mode: Viewing ${branchName} ${semesterLabel}. (Your active profile: ${academicProfile?.branchName || 'GTU'} Sem ${academicProfile?.semester || 1})`
                : `Active Profile View: ${academicProfile?.branchName || 'GTU'} Sem ${academicProfile?.semester || 1}`}
            </span>
          </div>
          {isDifferentFromProfile && (
            <button
              onClick={() => {
                setExploreMode(false);
                navigate(browsePaths.semester(materialTypeKey, profileBranchSlug, academicProfile?.semester || 1));
              }}
              className="px-3.5 py-1.5 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
            >
              Switch to My Active Subjects
            </button>
          )}
        </div>
      )}
      <SeoContentBlock title={`Syllabus & Course Curriculum for ${semesterLabel}`}>
        <p className="mb-4">
          This section contains all the standard and elective courses offered during {semesterLabel} for your department. Each card below represents a specific subject offering mapped to the current curriculum version.
        </p>
        <p className="mb-4">
          Selecting a subject folder will lead you directly to its verified library of study materials, reference notes, syllabus files, or question paper indices. 
        </p>
        <p>
          To make your search efficient, we have cataloged courses using both their official subject code (e.g., ESC401, CSE402) and normalized course titles. Use these folders to map out your unit tests and end-semester study plans.
        </p>
      </SeoContentBlock>

      <AdBlock />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-12">{error}</p>
      ) : subjects.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No subjects listed for this semester yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 my-8">
          {subjects.map((subject) => (
            <FolderCard
              key={subject.offering_id}
              to={browsePaths.subject(materialTypeKey, effectiveBranchSlug, semester, (subject.subject_code || subject.subject_slug || '').toLowerCase())}
              title={subject.subject_name}
              description={subject.subject_code ? `Code: ${subject.subject_code}` : 'GTU Subject'}
              meta={
                materialTypeKey === 'pyq'
                  ? `${subject.session_count || 0} seasons`
                  : `${subject.material_count || 0} files`
              }
            />
          ))}
        </div>
      )}

      <AcademicValueHighlights
        branchName={branchName}
        semester={semester}
      />

      <AuthorByline 
        authorName="ShikshaSahayak Academic Faculty & Senior Peer Reviewers"
        reviewerName="GTU Departmental Coordinators"
        updatedDate={`Academic Year ${getCurrentAcademicYear()} NEP Scheme`}
        readTime="5 min read"
      />

      <AcademicFaqSection
        branchName={branchName}
        semester={semester}
      />

      <AdBlock />

      <SeoContentBlock title={`Engineering Curriculum & Examination Guide for ${branchName} Semester ${semester}`}>
        <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <h4 className="text-base font-bold text-navy-900 dark:text-white">1. Semester Curriculum Scope & Core Subjects</h4>
          <p>
            Welcome to the comprehensive academic study hub for <strong>{branchName} Engineering - Semester {semester}</strong> under Gujarat Technological University (GTU). Semester {semester} marks an essential stage in your technical education, introducing advanced engineering theory, core domain laboratories, and computational problem-solving frameworks.
          </p>
          <p>
            Each subject offered in this semester is aligned with the GTU NEP 2020 teaching scheme and credit system. Navigating through the subject cards above gives you direct access to GTU official syllabus circulars, previous year question papers (PYQs), handwritten notes, unit formula guides, and laboratory viva preparation materials.
          </p>

          <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">2. Examination Evaluation & Credit Allocation</h4>
          <p>
            In GTU Semester {semester}, academic evaluation is conducted through a structured 100-mark assessment model per theory subject:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium">
            <li><strong>70 Marks (University End-Semester Exam - ESE):</strong> 3-hour written examination covering all 5 syllabus modules with GTU standard question papers.</li>
            <li><strong>30 Marks (Progressive Assessment - PA/Mid-Sem):</strong> Conducted internally by college faculty through mid-term exams, unit tests, and continuous evaluation.</li>
            <li><strong>Practical & Termwork (V/PA):</strong> Hands-on laboratory performance, practical journals, viva-voce exams, and mini-project demonstrations.</li>
          </ul>

          <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">3. Strategic Exam Preparation & High-Yield Revision</h4>
          <p>
            To achieve high grade point averages (SPI / CPI) in GTU Semester {semester}, we recommend following these proven study strategies:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Solve 5+ Years of PYQs:</strong> Past GTU papers reveal recurring question patterns, 7-mark long answer questions, and standard numerical problems.
            </li>
            <li>
              <strong>Master Formulas & Block Diagrams:</strong> Examiners award substantial marks for neat, labeled diagrams, clear derivations, and proper SI units.
            </li>
            <li>
              <strong>Follow Official Syllabus Boundaries:</strong> Use our embedded GTU Syllabus viewer to ensure your revision strictly aligns with university exam boundaries.
            </li>
          </ol>

          <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">4. Academic Integrity & Support</h4>
          <p>
            All study documents shared on ShikshaSahayak are crowdsourced from top-performing engineering seniors and verified by our academic moderator panel. For questions, suggestions, or error reporting, contact our team at <a href="mailto:team@shikshasahayak.org" className="text-brand-orange underline font-semibold">team@shikshasahayak.org</a>.
          </p>
        </div>
      </SeoContentBlock>
    </BrowseShell>
  );
};

export default SemesterPage;
