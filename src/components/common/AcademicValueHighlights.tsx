import { getCurrentAcademicYear } from '../../utils/gtuSyllabus';
import { BookOpen, Target, FileSpreadsheet, Layers, HelpCircle, CheckCircle2, Award, Lightbulb } from 'lucide-react';

interface AcademicValueHighlightsProps {
  subjectName?: string;
  subjectCode?: string;
  branchName?: string;
  semester?: number;
}

export const AcademicValueHighlights: React.FC<AcademicValueHighlightsProps> = ({
  subjectName = "Engineering Course",
  subjectCode,
  branchName = "Engineering",
  semester,
}) => {
  const nameLower = subjectName.toLowerCase();
  const isNonTechnical = 
    nameLower.includes('english') || 
    nameLower.includes('communication') || 
    nameLower.includes('management') || 
    nameLower.includes('constitution') || 
    nameLower.includes('humanities') || 
    nameLower.includes('economics') || 
    nameLower.includes('ethics') || 
    nameLower.includes('law') ||
    nameLower.includes('creative') ||
    nameLower.includes('behavior');

  return (
    <section className="my-10 space-y-8 animate-fade-in">
      {/* High-Value Curriculum Analysis Banner */}
      <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-navy-900 dark:text-white">
              Detailed Curriculum Analysis & Exam Weightage ({subjectName})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              GTU Teaching Scheme • 100 Marks Evaluation Model • NEP Academic Year {getCurrentAcademicYear()} Syllabus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Exam Mark Distribution */}
          <div className="bg-gray-50 dark:bg-navy-950 p-5 rounded-2xl border border-gray-100 dark:border-navy-800 space-y-3">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-sm">
              <Target className="h-4 w-4" /> GTU Mark Distribution
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isNonTechnical 
                ? `The GTU evaluation for ${subjectName} follows a 70-30 pattern. The 70-mark End Semester Examination (ESE) covers the core syllabus modules, while 30 marks are allocated to internal college evaluations, mid-semester tests, and continuous feedback.`
                : `The GTU evaluation for ${subjectName} follows a 70-30 pattern. The 70-mark End Semester Examination (ESE) covers 5 core modules, while 30 marks are allocated to faculty mid-semester exams and internal practical continuous assessments.`}
            </p>
            <div className="pt-2 text-[11px] text-navy-900 dark:text-white font-mono space-y-1 font-semibold">
              <div>• ESE Theory: 70 Marks (3 Hours)</div>
              <div>• Mid-Sem Internal: 30 Marks</div>
              <div>• Practical / Viva: 20–50 Marks</div>
            </div>
          </div>

          {/* Column 2: Question Paper Pattern */}
          <div className="bg-gray-50 dark:bg-navy-950 p-5 rounded-2xl border border-gray-100 dark:border-navy-800 space-y-3">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
              <FileSpreadsheet className="h-4 w-4" /> Paper Question Types
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isNonTechnical
                ? `GTU question papers consist of 5 main questions (14 marks each). Questions include essay-type analytical writing, business communication scenarios, vocabulary usage, and grammar correction questions.`
                : `GTU question papers consist of 5 main questions (14 marks each). Questions include 7-mark descriptive derivations/block diagrams, 4-mark short numericals, and 3-mark conceptual definitions.`}
            </p>
            <div className="pt-2 text-[11px] text-navy-900 dark:text-white font-mono space-y-1 font-semibold">
              {isNonTechnical ? (
                <>
                  <div>• Q1: Grammar & Vocabulary (14M)</div>
                  <div>• Q2–Q4: Comprehension & Writing (14M ea)</div>
                  <div>• Q5: Technical Reports / Letters (14M)</div>
                </>
              ) : (
                <>
                  <div>• Q1: Definitions / Short Qs (14M)</div>
                  <div>• Q2–Q4: Module Derivations (14M ea)</div>
                  <div>• Q5: Case Studies / Numericals (14M)</div>
                </>
              )}
            </div>
          </div>

          {/* Column 3: High-Yield Preparation Strategy */}
          <div className="bg-gray-50 dark:bg-navy-950 p-5 rounded-2xl border border-gray-100 dark:border-navy-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <Award className="h-4 w-4" /> High-Score Preparation
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isNonTechnical
                ? `Achieving an AA grade requires focusing on precise technical writing formats (letters, reports, emails), practicing grammar usage, and maintaining a clear structure/clarity in long answers.`
                : `Achieving an AA grade requires prioritizing recurring PYQ patterns, drawing clean labeled diagrams, and step-by-step mathematical proofs with proper SI units.`}
            </p>
            <div className="pt-2 text-[11px] text-navy-900 dark:text-white font-mono space-y-1 font-semibold">
              {isNonTechnical ? (
                <>
                  <div>• Master Official Report & Letter Formats</div>
                  <div>• Practice Active/Passive & Direct/Indirect</div>
                  <div>• Improve Vocabulary & Business Tone</div>
                </>
              ) : (
                <>
                  <div>• Target 5+ Years PYQ Patterns</div>
                  <div>• Draw Labeled Block Diagrams</div>
                  <div>• Practice Formula Calculations</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Module Breakdown Section */}
        <div className="pt-4 border-t border-gray-100 dark:border-navy-800 space-y-4">
          <h4 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-orange" /> Recommended Engineering Textbooks & Reference Materials
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            While handwritten lecture notes and cheat sheets provide rapid revision for GTU examinations, students are strongly advised to ground their theoretical fundamentals in standard academic textbooks prescribed by GTU departmental committees:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-100 dark:border-navy-800">
              <strong className="text-navy-900 dark:text-white block font-bold mb-1">
                {isNonTechnical ? "Standard Reference Manuals & Texts:" : "Standard Textbooks (Theory & Derivations):"}
              </strong>
              <span className="text-gray-600 dark:text-gray-400">
                {isNonTechnical
                  ? "Consult standard reference manuals, grammar books, and professional communication guides listed in the official GTU syllabus PDF."
                  : "Consult national and international author textbooks listed in the official GTU syllabus PDF for in-depth mathematical derivations and solved examples."}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-100 dark:border-navy-800">
              <strong className="text-navy-900 dark:text-white block font-bold mb-1">
                {isNonTechnical ? "Language Labs & Interactive Work:" : "Laboratory & Practical Journals:"}
              </strong>
              <span className="text-gray-600 dark:text-gray-400">
                {isNonTechnical
                  ? "Participate in interactive language lab sessions, mock group discussions, presentation drills, and viva-voce exercises to build real-world confidence."
                  : "Perform all experiment simulations, circuit setups, and programming labs as mandated in the GTU practical teaching scheme to excel in external viva examinations."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademicValueHighlights;
