import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <article className="bg-white dark:bg-navy-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-navy-800">
        <h1 className="text-4xl font-display font-bold text-navy-900 dark:text-white mb-4">Disclaimer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: May 18, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p>
            ShikshaSahayak publishes educational resources for general academic support. The website is not an official
            college, university, government, exam-board, or certification authority unless a page explicitly says so.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Educational Information Only</h2>
          <p>
            Study guides, notes, previous year papers, AI responses, and community submissions are intended to support
            learning and revision. They should not be treated as guaranteed exam predictions, official solutions, legal
            advice, financial advice, career guarantees, or professional counseling.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Accuracy and Verification</h2>
          <p>
            We try to keep resources useful and clear, but academic information can contain mistakes, become outdated,
            or vary by syllabus and institution. Students should verify important details with official notices,
            faculty guidance, textbooks, and current university syllabi before relying on them.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Contributor Content</h2>
          <p>
            Some resources may be submitted by students or contributors. Admin review is intended to improve quality and
            safety, but it does not guarantee that every file is complete, current, or error-free. If you believe content
            violates rights, includes private information, or should not be public, contact us for review.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">AI Tutor Disclaimer</h2>
          <p>
            AI-generated explanations can be inaccurate, incomplete, or unsuitable for a specific syllabus. Always check
            formulas, code, derivations, and factual claims before using them in assignments, exams, or practical work.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">External Links</h2>
          <p>
            ShikshaSahayak may link to external websites, communities, tools, or files. External links are provided for
            convenience and do not imply endorsement of every statement, service, or practice on those websites.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Contact</h2>
          <p>
            For corrections, removal requests, or questions about this disclaimer, email{' '}
            <a href="mailto:team@shikshasahayak.org" className="text-brand-orange hover:underline">team@shikshasahayak.org</a>.
          </p>
        </div>
      </article>
    </div>
  );
};

export default Disclaimer;
