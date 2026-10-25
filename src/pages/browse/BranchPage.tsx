import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import FolderCard from '../../components/browse/FolderCard';
import { apiClient } from '../../api/client';
import { BranchDetail } from '../../types';
import { isMaterialType, normalizeMaterialType, MATERIAL_TYPES, MaterialTypeKey } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';
import AdBlock from '../../components/ads/AdBlock';
import SeoContentBlock from '../../components/ads/SeoContentBlock';
import { useStudentAcademic } from '../../context/StudentAcademicContext';

import { useAuth } from '../../context/AuthContext';
import { ExploreModeToggle } from '../../components/personalization/ExploreModeToggle';
import { Compass } from 'lucide-react';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';

const BranchPage: React.FC = () => {
  const { type, branchSlug } = useParams<{ type: string; branchSlug: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { academicProfile, isExploreMode, setExploreMode } = useStudentAcademic();
  const canonicalBranchSlug = branchSlug ? getCanonicalBranchSlug(branchSlug) : '';
  const [data, setData] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const materialTypeKey: MaterialTypeKey = normalizeMaterialType(type);
  const config = MATERIAL_TYPES[materialTypeKey];
  const validType = Boolean(config);

  const isExploreFromUrl = searchParams.get('explore') === 'all' || searchParams.get('explore') === 'true';

  // Auto-redirect alias URLs like /resources/syllabus/gtu-be-16 to canonical slug
  if (branchSlug && canonicalBranchSlug && branchSlug !== canonicalBranchSlug && validType) {
    return <Navigate to={browsePaths.branch(materialTypeKey, canonicalBranchSlug)} replace />;
  }

  const effectiveBranchSlug = canonicalBranchSlug || branchSlug || '';

  useEffect(() => {
    if (!validType || !effectiveBranchSlug) return;
    apiClient
      .getBranch(effectiveBranchSlug)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [effectiveBranchSlug, validType]);

  if (!validType || !config || !branchSlug) {
    return <Navigate to="/resources" replace />;
  }

  // Personalization Guard: If user visits their own branch page when Explore Mode is OFF and not explicitly exploring all semesters, automatically open active semester
  const profileBranchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName);
  if (currentUser && !isExploreMode && !isExploreFromUrl && profileBranchSlug === effectiveBranchSlug) {
    return <Navigate to={browsePaths.semester(materialTypeKey, effectiveBranchSlug, academicProfile?.semester || 5)} replace />;
  }

  const branch = data?.branch;
  const branchName = branch?.name || getCanonicalBranchName(effectiveBranchSlug);

  return (
    <BrowseShell
      crumbs={[
        { label: config.folderLabel, to: `${browsePaths.typeAbout(materialTypeKey)}?explore=all` },
        { label: branchName },
      ]}
      eyebrow={config.folderLabel}
      title={branchName}
      description={`Choose a semester to see ${config.folderLabel.toLowerCase()} subjects offered in this branch.`}
    >
      <div className="mb-6">
        <ExploreModeToggle isExploreMode={isExploreMode} onToggleExploreMode={setExploreMode} />
      </div>

      {currentUser && (branchSlug !== academicProfile?.branchId || isExploreMode) && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Compass className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Viewing {branch?.name || branchSlug}. (Your profile: {academicProfile?.branchName || 'GTU'} Sem {academicProfile?.semester || 1})</span>
          </div>
          <button
            onClick={() => setExploreMode(false)}
            className="px-3 py-1 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shrink-0"
          >
            Go to My Active Subjects
          </button>
        </div>
      )}
      <SeoContentBlock title={`Curriculum Semesters for ${branch?.name || 'Department'}`}>
        <p className="mb-4">
          Welcome to the core curriculum page for {branch?.name || 'your department'}. The academic journey of an engineering undergraduate is structured across eight distinct semesters, designed to build your knowledge from foundational science and mathematics to advanced, specialized engineering methodologies.
        </p>
        <p className="mb-4">
          To help you stay on track, we have organized all materials precisely by semester level. Selecting your current semester below will give you access to target-specific syllabus guidelines, unit notes, reference materials, and exam question paper archives relevant to your specific department courses.
        </p>
        <p>
          Note: The first year of engineering (Semesters 1 & 2) features a unified, multidisciplinary curriculum shared by all branches. To find those foundational courses, check the <strong>1st Year</strong> group below. Upper-level core courses and electives are organized under the <strong>2nd to 4th Year</strong> folders.
        </p>
      </SeoContentBlock>

      <AdBlock />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-12">{error}</p>
      ) : (
        <div className="my-8 space-y-8">
          
          {/* 1st Year Group */}
          <div>
            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-4 border-b border-gray-200 dark:border-navy-800 pb-2">1st Year</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FolderCard
                to={browsePaths.semester(materialTypeKey, effectiveBranchSlug, 1)}
                title="Semester 1"
                description="Subjects for Sem 1"
                meta="1st Year"
              />
              <FolderCard
                to={browsePaths.semester(materialTypeKey, effectiveBranchSlug, 2)}
                title="Semester 2"
                description="Subjects for Sem 2"
                meta="1st Year"
              />
              <FolderCard
                to={browsePaths.semester(materialTypeKey, effectiveBranchSlug, 0)}
                title="Sem 1 OR 2"
                description="Common subjects"
                meta="1st Year"
              />
            </div>
          </div>

          {/* Sem 3 to 8 Group */}
          <div>
            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-4 border-b border-gray-200 dark:border-navy-800 pb-2">2nd to 4th Year</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[3, 4, 5, 6, 7, 8].map((semester) => {
                const isActiveSem = !isExploreMode && academicProfile?.semester === semester;
                return (
                  <FolderCard
                    key={semester}
                    to={browsePaths.semester(materialTypeKey, effectiveBranchSlug, semester)}
                    title={`Semester ${semester}`}
                    description={`Subjects for Sem ${semester}`}
                    meta={isActiveSem ? "🎯 Your Active Semester" : "Semester"}
                  />
                );
              })}
            </div>
          </div>

        </div>
      )}

      <AdBlock />

      <SeoContentBlock title="Strategic Exam Preparation and Study Habits">
        <p className="mb-4">
          Succeeding in semester-end exams is not just about hard work; it is about studying smart. Having structured access to department-approved materials helps you focus on what truly matters. We recommend combining the syllabus guide with past papers to identify the highest-yielding topics and focus areas for your upcoming exams.
        </p>
        <p className="mb-4">
          By utilizing our organized folders, you avoid the hassle of sorting through unsorted group chat uploads or incomplete file drives. All files are categorized, moderated for quality, and verified for syllabus alignment.
        </p>
        <p>
          Make sure to bookmark this page for easy access during exam weeks, and share it with your peers to foster a collaborative study environment. If you notice any missing resources, feel free to submit them through our Contribution form!
        </p>
      </SeoContentBlock>

    </BrowseShell>
  );
};

export default BranchPage;
