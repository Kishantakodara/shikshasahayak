import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <article className="bg-white dark:bg-navy-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-navy-800">
        <h1 className="text-4xl font-display font-bold text-navy-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: May 18, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p>
            ShikshaSahayak is an educational website for engineering students. This Privacy Policy explains what
            information may be collected when you use the website, submit a contact form, contribute study material,
            use the AI Tutor, or interact with analytics and advertising technologies.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Information We Collect</h2>
          <p>We may collect the following information depending on how you use the site:</p>
          <ul>
            <li>Contact details you submit, such as name, email address, and message content.</li>
            <li>Contribution details, such as uploaded PDF files, note titles, author names, branch, semester, and related metadata.</li>
            <li>AI Tutor inputs, including typed questions and files or images you choose to upload for academic help.</li>
            <li>Technical data such as browser type, device type, referring pages, approximate region, pages visited, and performance events.</li>
            <li>Cookies or similar identifiers used for preferences, analytics, site security, and advertising where applicable.</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">How We Use Information</h2>
          <p>We use information to operate the site, respond to messages, review contributed resources, improve navigation, prevent abuse, maintain security, and understand which educational resources are useful to students.</p>
          <p>
            We do not ask users to provide sensitive personal information for normal browsing. Please do not upload
            private documents, IDs, passwords, confidential college records, or personal information that is not needed
            for an educational resource.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Cookies, Analytics, and Measurement</h2>
          <p>
            ShikshaSahayak may use cookies, local storage, and similar technologies to remember preferences, measure site
            performance, and understand aggregate usage. Google Analytics (gtag.js) may process technical information such
            as page URL, device, browser, region, and timing data.
          </p>
          <p>
            The site also loads Google Fonts from Google-hosted domains. Your browser may contact Google servers to
            retrieve those font files, which can include technical request data such as IP address and user agent.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Google Advertising and Third-Party Vendors</h2>
          <p>
            If Google AdSense or other Google advertising products are enabled, third-party vendors, including Google,
            may use cookies to serve ads based on a user's prior visits to ShikshaSahayak or other websites. Google's use
            of advertising cookies enables Google and its partners to serve ads based on visits to this site and other
            sites on the internet.
          </p>
          <p>
            Users may opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
              Google Ads Settings
            </a>
            . Users may also learn more about how Google uses data on partner sites at{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
              How Google uses information from sites or apps that use our services
            </a>
            , or opt out of some third-party personalized advertising cookies through{' '}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
              aboutads.info
            </a>
            .
          </p>
          <p>
            If additional ad vendors or ad networks are used in the future, their privacy practices and opt-out options
            should be reviewed and disclosed here before those services are enabled.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Service Providers</h2>
          <p>ShikshaSahayak may use service providers to run important site features:</p>
          <ul>
            <li>Cloudflare for hosting, file storage (R2), and database (D1) used by notes, PYQs, and submissions.</li>
            <li>Firebase for admin authentication and legacy resource metadata where applicable.</li>
            <li>Web3Forms for processing contact form messages.</li>
            <li>Google Gemini and NVIDIA-hosted AI APIs where configured for AI Tutor responses.</li>
          </ul>
          <p>These providers process information only as needed for the features they support and according to their own policies.</p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">User Contributions and Public Content</h2>
          <p>
            Materials submitted for publication may become visible to other users after admin review. Public resource
            pages may display information such as title, branch, semester, author name, upload metadata, and the study
            material itself. Contributors should only submit content they have the right to share.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Data Retention and Removal Requests</h2>
          <p>
            We keep contact messages, submissions, and technical records only as long as reasonably needed for site
            operation, security, review, and support. To request correction or removal of content you submitted, contact
            us at <a href="mailto:team@shikshasahayak.org" className="text-brand-orange hover:underline">team@shikshasahayak.org</a>.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Children's Privacy</h2>
          <p>
            ShikshaSahayak is intended for college and engineering students. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided personal information, contact us so
            we can review and remove it where appropriate.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect information. No website or internet
            transmission is completely secure, so users should avoid submitting sensitive or unnecessary personal data.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mt-8 mb-4">Contact</h2>
          <p>
            For privacy questions, content removal requests, or data-related concerns, contact the ShikshaSahayak team at{' '}
            <a href="mailto:team@shikshasahayak.org" className="text-brand-orange hover:underline">team@shikshasahayak.org</a>.
          </p>
        </div>
      </article>
    </div>
  );
};

export default PrivacyPolicy;
