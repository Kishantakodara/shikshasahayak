import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { apiClient } from '../../api/client';
import { BrowseSessionDetail } from '../../types';
import { isMaterialType, MATERIAL_TYPES, sessionLabel } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';
import AdBlock from '../../components/ads/AdBlock';
import SeoContentBlock from '../../components/ads/SeoContentBlock';

const SessionPage: React.FC = () => {
  const { type, branchSlug, sem, subjectSlug, session } = useParams<{
    type: string;
    branchSlug: string;
    sem: string;
    subjectSlug: string;
    session: string;
  }>();
  const semester = sem === '1-or-2-common' ? 0 : Number(sem);
  const canonicalBranchSlug = branchSlug ? getCanonicalBranchSlug(branchSlug) : '';
  const effectiveBranchSlug = canonicalBranchSlug || branchSlug || '';
  const normalizedSubjectSlug = subjectSlug ? subjectSlug.toLowerCase() : '';
  const [data, setData] = useState<BrowseSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validType = isMaterialType(type);
  const validParams = validType && Boolean(branchSlug) && Boolean(subjectSlug) && Boolean(session) && Number.isFinite(semester) && semester >= 0;
  const semesterLabel = semester === 0 ? '1st Year Common' : `Semester ${semester}`;
  const config = validType ? MATERIAL_TYPES[type] : null;

  // Auto-redirect alias branch slugs or uppercase subject codes to canonical URL
  if (
    branchSlug &&
    canonicalBranchSlug &&
    validType &&
    subjectSlug &&
    session &&
    Number.isFinite(semester) &&
    (branchSlug !== canonicalBranchSlug || subjectSlug !== normalizedSubjectSlug)
  ) {
    return <Navigate to={browsePaths.session(type!, canonicalBranchSlug, semester, normalizedSubjectSlug, session)} replace />;
  }

  useEffect(() => {
    if (!validParams || !effectiveBranchSlug || !normalizedSubjectSlug || !session) return;
    apiClient
      .getSessionMaterials(effectiveBranchSlug, semester, normalizedSubjectSlug, session, type!)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [effectiveBranchSlug, semester, normalizedSubjectSlug, session, type, validParams]);

  if (!validParams || !config || !branchSlug || !subjectSlug || !session) {
    return <Navigate to="/resources" replace />;
  }

  const branchName = data?.branch?.name || getCanonicalBranchName(effectiveBranchSlug);
  const subjectName = data?.offering?.subject_name || subjectSlug;
  const seasonTitle = session ? sessionLabel(session) : session;

  return (
    <BrowseShell
      crumbs={[
        { label: config.folderLabel, to: browsePaths.typeAbout(type!) },
        { label: branchName, to: browsePaths.branch(type!, effectiveBranchSlug) },
        { label: semesterLabel, to: browsePaths.semester(type!, effectiveBranchSlug, semester) },
        {
          label: subjectName,
          to: browsePaths.subject(type!, effectiveBranchSlug, semester, normalizedSubjectSlug),
        },
        { label: seasonTitle },
      ]}
      eyebrow={data?.session?.code || session}
      title={seasonTitle}
      description={`${config.folderLabel} for ${subjectName} · ${semesterLabel}`}
    >
      <SeoContentBlock title={`University Exam Papers for ${subjectName} — ${seasonTitle}`}>
        <p className="mb-4">
          You are currently accessing the official collection of previous year question papers (PYQs) for <strong>{subjectName}</strong> from the <strong>{seasonTitle}</strong> academic term. Practicing papers from this specific term is invaluable because different exam terms (Summer vs. Winter) often reflect unique trends in question selection and focus units.
        </p>
        <p className="mb-4">
          Reviewing these actual papers helps you understand how question sheets are structured, identify the core theories that the university board emphasizes, and learn to manage your time effectively during the 3-hour examination window.
        </p>
        <p>
          Click 'View Paper' next to the appropriate document below to preview the PDF full-screen inside our optimized viewer or download it directly to study offline.
        </p>
      </SeoContentBlock>

      <AdBlock />

      <div className="my-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">{error}</p>
        ) : (data?.materials?.length ?? 0) === 0 ? (
          <p className="text-center text-gray-500 py-12 bg-gray-50 dark:bg-navy-900 rounded-xl border border-gray-100 dark:border-navy-800">No papers uploaded for this exam season yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data!.materials.map((paper) => (
              <div
                key={paper.id}
                className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                    {data?.session?.code} Session
                  </span>
                  <h3 className="font-bold text-navy-900 dark:text-white text-sm sm:text-base">{paper.title}</h3>
                </div>
                <Link
                  to={paper.blog_id ? `/blogs/${paper.blog_id}` : browsePaths.material(paper.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 dark:bg-brand-orange text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                  <Eye className="h-3.5 w-3.5" /> View Paper
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdBlock />

      <SeoContentBlock title="Simulating Exam Conditions and Time Management Tips">
        <p className="mb-4">
          To get the maximum benefit from these exam sheets, we highly recommend attempting to solve them under simulated exam-hall conditions. Set a timer for three hours, sit in a quiet room, and write down your answers without referring to textbook guides or notes.
        </p>
        <p className="mb-4">
          Once finished, compare your solutions with the recommended answers or discuss them with your peers. Pay close attention to how marks are allocated for steps in derivations and design drawings, as engineering examiners heavily reward structured step-by-step methodologies.
        </p>
        <p>
          Before starting this mock test, verify that you have covered all the units using our comprehensive Study Material folders. Studying notes and practicing formulas first will ensure you get a realistic measure of your exam readiness.
        </p>
      </SeoContentBlock>
    </BrowseShell>
  );
};

export default SessionPage;
