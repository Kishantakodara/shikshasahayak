import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <article className="bg-white dark:bg-navy-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-navy-800">
        <h1 className="text-4xl font-display font-bold text-navy-900 dark:text-white mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: May 18, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p>
            These Terms of Service govern your use of ShikshaSahayak. By using the website, you agree to use it for
            lawful educational purposes and to respect the rights of students, authors, institutions, and other users.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Educational Use</h2>
          <p>
            ShikshaSahayak provides study resources, previous year question papers, notes, guides, and AI-assisted
            explanations for learning support. The website is not a substitute for official university instructions,
            faculty guidance, or original study. You are responsible for checking important academic details against
            official sources.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Acceptable Use</h2>
          <p>You agree not to use ShikshaSahayak to:</p>
          <ul>
            <li>Upload or share copyrighted material unless you have permission or a lawful right to share it.</li>
            <li>Submit false, misleading, harmful, adult, violent, hateful, illegal, or deceptive content.</li>
            <li>Impersonate another person, institution, author, or organization.</li>
            <li>Attempt to disrupt the website, bypass security, scrape content at abusive scale, or misuse the AI Tutor.</li>
            <li>Upload private personal data, IDs, passwords, confidential records, or exam-cheating material.</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Contributed Material</h2>
          <p>
            If you contribute notes, papers, titles, author names, or other educational material, you confirm that you
            have the right to submit it and that it does not violate copyright, privacy, academic-integrity rules, or
            applicable law. Submissions may be reviewed, edited for formatting, rejected, unpublished, or removed.
          </p>
          <p>
            You keep ownership of content you created, but you grant ShikshaSahayak permission to host, display, organize,
            and make the submitted material available for educational use on the website. If you need content removed,
            contact <a href="mailto:team@shikshasahayak.org" className="text-brand-orange hover:underline">team@shikshasahayak.org</a>.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">AI Tutor and Accuracy</h2>
          <p>
            AI-generated responses can contain mistakes or incomplete explanations. Use AI Tutor outputs as study
            assistance only, and verify important facts, formulas, legal requirements, academic deadlines, and exam
            instructions with reliable sources.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Intellectual Property</h2>
          <p>
            Site branding, interface elements, original guide content, and site organization belong to ShikshaSahayak or
            their respective owners. Third-party names, college names, exam names, and logos remain the property of their
            owners. ShikshaSahayak does not claim official affiliation unless expressly stated.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">External Links and Services</h2>
          <p>
            The website may link to external communities, tools, forms, files, or service providers. We are not
            responsible for external websites, their content, or their privacy practices. Review external terms before
            submitting information outside ShikshaSahayak.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Changes and Availability</h2>
          <p>
            We may update resources, remove content, change features, or revise these terms as the website evolves. We
            also may suspend or restrict access if content or behavior appears abusive, unlawful, misleading, or harmful
            to students.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Contact</h2>
          <p>
            For questions about these terms, corrections, or content concerns, contact{' '}
            <a href="mailto:team@shikshasahayak.org" className="text-brand-orange hover:underline">team@shikshasahayak.org</a>.
          </p>
        </div>
      </article>
    </div>
  );
};

export default TermsOfService;
