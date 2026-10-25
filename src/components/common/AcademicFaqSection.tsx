import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';

import { getCurrentAcademicYear } from '../../utils/gtuSyllabus';

interface FaqItem {
  question: string;
  answer: string;
}

interface AcademicFaqSectionProps {
  subjectName?: string;
  subjectCode?: string;
  branchName?: string;
  semester?: number;
}

export const AcademicFaqSection: React.FC<AcademicFaqSectionProps> = ({
  subjectName = "this Engineering Course",
  subjectCode,
  branchName = "Engineering",
  semester,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: `How is the GTU 70-30 evaluation mark distribution calculated for ${subjectName}?`,
      answer: `Under Gujarat Technological University (GTU) NEP Academic Year ${getCurrentAcademicYear()} guidelines, ${subjectName} is evaluated out of 100 total marks. The End Semester Examination (ESE) written paper accounts for 70 marks (3 hours duration). The remaining 30 marks are awarded through internal mid-semester examinations and continuous faculty progressive assessments (PA/Mid-Sem). Practical/viva evaluations account for an additional 20-50 marks.`
    },
    {
      question: `Where can I access the official GTU NEP syllabus and teaching scheme for ${subjectName}?`,
      answer: `You can view and download the official GTU syllabus directly on ShikshaSahayak using our embedded high-speed PDF viewer. Our syllabus documents are fetched directly from GTU's official S3 bucket repository (https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/), ensuring 100% authenticity and zero outdated links.`
    },
    {
      question: `What are the most high-yielding preparation strategies to score an AA grade in ${subjectName}?`,
      answer: `To secure top grades (AA/AB index), start by analyzing 5+ years of previous year question papers (PYQs). Focus heavily on 7-mark descriptive derivations, step-by-step mathematical proofs, and labeled block/circuit diagrams. Combine handwritten senior lecture notes with standard prescribed reference textbooks for maximum concept clarity.`
    },
    {
      question: `Are the study notes and PYQ solution keys on ShikshaSahayak faculty-verified?`,
      answer: `Yes. All contributed lecture notes, unit formula cheat sheets, and previous year paper solutions hosted on ShikshaSahayak undergo multi-stage moderation by senior engineering scholars and academic departmental coordinators to verify technical accuracy.`
    },
    {
      question: `How can engineering students contribute study materials to ShikshaSahayak?`,
      answer: `Students can click the 'Contribute' button in the main navigation header to submit handwritten notes, assignment solutions, or unit summaries. Contributed resources undergo peer review before being published to support fellow GTU engineering undergraduates.`
    }
  ];

  // Generate Schema.org JSON-LD for Googlebot
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="my-10 space-y-6 animate-fade-in">
      {/* Schema.org Injection for Google Search Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData).replace(/</g, '\\u003c') }}
      />

      <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-navy-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-navy-900 dark:text-white">
              Frequently Asked Academic Questions (FAQs)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              GTU Examination Guidance & Academic Preparation FAQ
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-gray-200/80 dark:border-navy-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-navy-950/50 hover:bg-gray-50 dark:hover:bg-navy-950 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-navy-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-orange shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-orange' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AcademicFaqSection;
