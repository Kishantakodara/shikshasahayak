import { useEffect } from 'react';
import { CONTENT_UPDATED_AT, SITE_NAME, SITE_URL, getStudyGuideBySlug } from '../content/studyGuides';
import { isMaterialType, MATERIAL_TYPES, sessionLabel } from '../content/browse';
import { getCurrentAcademicYear } from './gtuSyllabus';

export interface PageMeta {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string;
  robots?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_DESCRIPTION =
  'ShikshaSahayak helps GTU engineering students find Gujarat Technological University previous year question papers (PYQs), study notes, syllabus guidelines, and practical exam preparation strategies.';

const STATIC_ROUTE_META: Record<string, PageMeta> = {
  '/': {
    title: 'ShikshaSahayak - Engineering Study Material, PYQs and Study Guides',
    description: DEFAULT_DESCRIPTION,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        email: 'team@shikshasahayak.org',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/ai-tutor?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  },
  '/resources': {
    title: 'GTU Engineering Study Resources - ShikshaSahayak',
    description: 'Browse GTU previous year question papers (PYQs), study material notes, and official syllabus by department and semester on ShikshaSahayak.',
  },
  '/resources/pyq': {
    title: 'GTU Previous Year Question Papers (PYQ) - ShikshaSahayak',
    description: 'Browse and download engineering GTU previous year question papers by department, semester, subject, and Summer/Winter exam season.',
  },
  '/resources/study-material': {
    title: 'GTU Study Material & Engineering Lecture Notes - ShikshaSahayak',
    description: 'Browse student-contributed engineering GTU study materials and handwritten notes organized by branch, semester, and subject.',
  },
  '/resources/syllabus': {
    title: 'GTU Syllabus & Course Schemes - ShikshaSahayak',
    description: 'Download official and curated GTU syllabus documents and teaching schemes organized by department and semester.',
  },
  '/pyqs': {
    title: 'GTU Previous Year Question Papers (PYQ) - ShikshaSahayak',
    description: 'Browse and download engineering GTU previous year question papers by department, semester, year, subject, and exam type.',
  },
  '/study-material': {
    title: 'GTU Study Material Library - ShikshaSahayak',
    description: 'Find student-contributed engineering GTU study materials and lecture notes organized by branch, semester, and subject.',
  },
  '/guides': {
    title: 'GTU Engineering Study Guides & Exam Tips - ShikshaSahayak',
    description: 'Read practical GTU engineering study guides for PYQs, mathematics, core subjects, labs, viva, and exam planning.',
  },
  '/exam-tips': {
    title: 'Exam Tips for Engineering Students - ShikshaSahayak',
    description: 'Evidence-aware exam preparation tips covering active recall, spaced repetition, PYQ practice, and answer writing.',
  },
  '/ai-tutor': {
    title: 'AI Tutor for Engineering Study Help - ShikshaSahayak',
    description: 'Ask academic questions, revise concepts, and get study support with ShikshaSahayak AI Tutor.',
  },
  '/contribute': {
    title: 'Contribute Study Material - ShikshaSahayak',
    description: 'Submit notes or previous year question papers for review so other students can benefit from verified study resources.',
  },
  '/about': {
    title: 'About ShikshaSahayak',
    description: 'Learn about ShikshaSahayak, a student-focused education resource for engineering notes, PYQs, and exam preparation.',
  },
  '/contact': {
    title: 'Contact ShikshaSahayak',
    description: 'Contact ShikshaSahayak for corrections, privacy questions, content removal requests, and study material support.',
  },
  '/privacypolicy': {
    title: 'Privacy Policy - ShikshaSahayak',
    description: 'Read how ShikshaSahayak collects, uses, protects, and discloses data, including cookies, analytics, and Google advertising disclosures.',
  },
  '/terms-of-service': {
    title: 'Terms of Service - ShikshaSahayak',
    description: 'Review the terms for using ShikshaSahayak, contributing content, and accessing study resources.',
  },
  '/terms': {
    title: 'Terms of Service - ShikshaSahayak',
    description: 'Review the terms for using ShikshaSahayak, contributing content, and accessing study resources.',
  },
  '/disclaimer': {
    title: 'Educational Disclaimer - ShikshaSahayak',
    description: 'Read the educational, accuracy, external-link, and contributor-content disclaimer for ShikshaSahayak.',
  },
  '/sitemap': {
    title: 'GTU Student Portal & HTML Sitemap - ShikshaSahayak',
    description: 'Access the complete ShikshaSahayak map, including GTU student portal guidelines, syllabus modules, exam papers, grade history, and legal documents.',
  },
  '/announcements': {
    title: 'GTU Exam Time Table, Circulars & Announcements - ShikshaSahayak',
    description: 'Get the latest GTU exam time table 2026, academic circulars, GTU exam date schedules, and notice board updates on ShikshaSahayak.',
  },
  '/blogs': {
    title: 'Blogs - ShikshaSahayak',
    description: 'Read the latest educational blogs, exam preparation guides, and academic updates on ShikshaSahayak.',
  },
  '/blogs/': {
    title: 'Blog - ShikshaSahayak',
    description: 'Read our latest blog post on ShikshaSahayak.',
  },
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

const upsertJsonLd = (jsonLd: PageMeta['jsonLd']) => {
  const existing = document.getElementById('route-json-ld');
  existing?.remove();

  if (!jsonLd) return;

  const script = document.createElement('script');
  script.id = 'route-json-ld';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(jsonLd);
  document.head.appendChild(script);
};

const getBranchShortName = (slug: string): string => {
  const shortMapping: Record<string, string> = {
    'computer': 'CSE',
    'computer-science-and-engineering': 'CSE',
    'computer-science-engineering': 'CSE',
    'it': 'IT',
    'information-technology': 'IT',
    'ece': 'ECE',
    'electronics-and-communication-engineering': 'ECE',
    'electronics-and-communication': 'ECE',
    'mechanical': 'ME',
    'mechanical-engineering': 'ME',
    'electrical': 'EE',
    'electrical-engineering': 'EE',
    'civil': 'CE',
    'civil-engineering': 'CE',
    'chemical-engineering': 'Chem',
    'first-year': '1st Year',
    '1st-year': '1st Year',
  };
  return shortMapping[slug.toLowerCase()] ?? formatSlug(slug);
};

const formatSemesterLabel = (sem: string): string => {
  if (sem === '1-or-2-common' || sem === '0') {
    return '1st & 2nd Sem Common';
  }
  const s = parseInt(sem, 10);
  if (s === 1) return '1st Semester';
  if (s === 2) return '2nd Semester';
  if (s === 3) return '3rd Semester';
  if (s >= 4 && s <= 8) return `${s}th Semester`;
  return `Semester ${sem}`;
};

const formatSlug = (slug: string): string => {
  if (!slug) return '';
  const branchMapping: Record<string, string> = {
    'computer': 'Computer Engineering',
    'computer-science-and-engineering': 'Computer Science & Engineering',
    'computer-science-engineering': 'Computer Science & Engineering',
    'it': 'Information Technology',
    'information-technology': 'Information Technology',
    'ece': 'Electronics & Communication Engineering',
    'electronics-and-communication-engineering': 'Electronics & Communication Engineering',
    'electronics-and-communication': 'Electronics & Communication Engineering',
    'mechanical': 'Mechanical Engineering',
    'mechanical-engineering': 'Mechanical Engineering',
    'electrical': 'Electrical Engineering',
    'electrical-engineering': 'Electrical Engineering',
    'civil': 'Civil Engineering',
    'civil-engineering': 'Civil Engineering',
    'chemical-engineering': 'Chemical Engineering',
    'first-year': '1st Year Common',
    '1st-year': '1st Year Common',
  };

  const lowered = slug.toLowerCase();
  if (branchMapping[lowered]) {
    return branchMapping[lowered];
  }

  const lowercaseWords = new Set(['and', 'or', 'of', 'for', 'in', 'to', 'with', 'a', 'the', 'by', 'on', 'at']);
  const uppercaseWords = new Set(['cse', 'it', 'ece', 'ee', 'me', 'ce', 'pyq', 'pyqs', 'ai', 'dbms', 'dsa', 'coa', 'os', 'toc', 'r2', 'lms']);

  return slug
    .split('-')
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (uppercaseWords.has(lower)) {
        return lower.toUpperCase();
      }
      if (lowercaseWords.has(lower) && index > 0) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const getRouteMeta = (pathname: string): PageMeta => {
  if (pathname.startsWith('/materials/')) {
    return {
      title: 'Study Material - ShikshaSahayak',
      description: 'Read an engineering study material on ShikshaSahayak with author information, update details, and related revision tools.',
      path: pathname,
      type: 'article',
    };
  }

  if (pathname.startsWith('/blogs/')) {
    return {
      title: 'Blog - ShikshaSahayak',
      description: 'Read our latest blog post on ShikshaSahayak.',
      path: pathname,
      type: 'article',
    };
  }

  if (pathname.startsWith('/guides/')) {
    const slug = pathname.replace('/guides/', '').split('/')[0];
    const guide = getStudyGuideBySlug(slug);

    if (guide) {
      return {
        title: `${guide.title} - ShikshaSahayak`,
        description: guide.description,
        path: pathname,
        type: 'article',
        jsonLd: [
          buildArticleJsonLd({
            title: guide.title,
            description: guide.description,
            path: pathname,
            author: guide.author,
            dateModified: guide.updatedAt,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Study Guides', path: '/guides' },
            { name: guide.title, path: pathname },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: guide.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ],
      };
    }

    return {
      title: 'Study Guide Not Found - ShikshaSahayak',
      description: 'The requested ShikshaSahayak study guide could not be found.',
      path: pathname,
      robots: 'noindex,follow',
    };
  }

  // Parse resources dynamic routes
  if (pathname.startsWith('/resources/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'resources') {
      const type = parts[1];
      if (isMaterialType(type)) {
        const config = MATERIAL_TYPES[type];

        // 1. /resources/:type
        if (parts.length === 2) {
          return {
            title: `GTU ${config.title} - ShikshaSahayak`,
            description: `Browse GTU ${config.title.toLowerCase()} organized by department, semester, subject, and exam season.`,
            path: pathname,
            jsonLd: buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: config.title, path: `/resources/${type}` },
            ]),
          };
        }

        // 2. /resources/:type/:branchSlug
        const branchSlug = parts[2];
        if (parts.length === 3) {
          const branchName = formatSlug(branchSlug);
          return {
            title: `GTU ${branchName} ${config.title} (AY ${getCurrentAcademicYear()}) - ShikshaSahayak`,
            description: `Browse GTU ${branchName} ${config.title.toLowerCase()} for Academic Year ${getCurrentAcademicYear()} (NEP scheme), organized by semester and subject on ShikshaSahayak.`,
            path: pathname,
            jsonLd: buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: config.title, path: `/resources/${type}` },
              { name: branchName, path: `/resources/${type}/${branchSlug}` },
            ]),
          };
        }

        // 3. /resources/:type/:branchSlug/semester/:sem
        if (parts.length === 5 && parts[3] === 'semester') {
          const branchName = formatSlug(branchSlug);
          const sem = parts[4];
          const semLabel = formatSemesterLabel(sem);
          const branchShort = getBranchShortName(branchSlug);
          return {
            title: `GTU ${branchShort} ${semLabel} ${config.folderLabel} (AY ${getCurrentAcademicYear()}) - ShikshaSahayak`,
            description: `Access official GTU engineering ${config.title.toLowerCase()} for ${branchName} ${semLabel} (Academic Year ${getCurrentAcademicYear()} teaching scheme), including university question papers and notes on ShikshaSahayak.`,
            path: pathname,
            jsonLd: buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: config.title, path: `/resources/${type}` },
              { name: branchName, path: `/resources/${type}/${branchSlug}` },
              { name: semLabel, path: `/resources/${type}/${branchSlug}/semester/${sem}` },
            ]),
          };
        }

        // 4. /resources/:type/:branchSlug/semester/:sem/:subjectSlug
        if (parts.length === 6 && parts[3] === 'semester') {
          const branchName = formatSlug(branchSlug);
          const sem = parts[4];
          const semLabel = formatSemesterLabel(sem);
          const subjectSlug = parts[5];
          const subjectName = formatSlug(subjectSlug);
          const branchShort = getBranchShortName(branchSlug);
          const semShort = (sem === '1-or-2-common' || sem === '0') ? 'Common' : `Sem ${sem}`;

          return {
            title: `GTU ${subjectName} (${branchShort} ${semShort}) ${config.folderLabel} - AY ${getCurrentAcademicYear()} - ShikshaSahayak`,
            description: `Download official GTU ${config.title.toLowerCase()} for ${subjectName} in ${branchName} ${semLabel} (Academic Year ${getCurrentAcademicYear()} NEP Scheme). Access syllabus modules and exam papers on ShikshaSahayak.`,
            path: pathname,
            jsonLd: buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: config.title, path: `/resources/${type}` },
              { name: branchName, path: `/resources/${type}/${branchSlug}` },
              { name: semLabel, path: `/resources/${type}/${branchSlug}/semester/${sem}` },
              { name: subjectName, path: `/resources/${type}/${branchSlug}/semester/${sem}/${subjectSlug}` },
            ]),
          };
        }

        // 5. /resources/:type/:branchSlug/semester/:sem/:subjectSlug/:session
        if (parts.length === 7 && parts[3] === 'semester') {
          const branchName = formatSlug(branchSlug);
          const sem = parts[4];
          const semLabel = formatSemesterLabel(sem);
          const subjectSlug = parts[5];
          const subjectName = formatSlug(subjectSlug);
          const session = parts[6];
          const sessionLbl = sessionLabel(session);

          return {
            title: `GTU ${subjectName} ${sessionLbl} ${config.folderLabel} - ShikshaSahayak`,
            description: `View and download official GTU ${sessionLbl} ${config.title.toLowerCase()} for ${subjectName} in ${branchName} ${semLabel} on ShikshaSahayak.`,
            path: pathname,
            jsonLd: buildBreadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: config.title, path: `/resources/${type}` },
              { name: branchName, path: `/resources/${type}/${branchSlug}` },
              { name: semLabel, path: `/resources/${type}/${branchSlug}/semester/${sem}` },
              { name: subjectName, path: `/resources/${type}/${branchSlug}/semester/${sem}/${subjectSlug}` },
              { name: sessionLbl, path: `/resources/${type}/${branchSlug}/semester/${sem}/${subjectSlug}/${session}` },
            ]),
          };
        }
      }
    }
  }

  // Parse portals and dashboards (prevent robots indexing on secure zones)
  if (pathname.startsWith('/student')) {
    if (pathname.startsWith('/student/practice')) {
      return {
        title: 'Practice Zone - ShikshaSahayak',
        description: 'Practice concepts, take quizzes, and track your engineering preparation progress.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname.includes('/quiz/') && pathname.endsWith('/attempt')) {
      return {
        title: 'Attempt Quiz - ShikshaSahayak',
        description: 'Solve practice quizzes and test your subject knowledge.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname.includes('/quiz/') && pathname.endsWith('/result')) {
      return {
        title: 'Quiz Results - ShikshaSahayak',
        description: 'Review quiz results, performance details, and correct answers.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    return {
      title: 'Student Dashboard - ShikshaSahayak',
      description: 'Access study roadmaps, flashcards, dynamic daily challenges, and personalized learning widgets.',
      path: pathname,
      robots: 'noindex,follow',
    };
  }

  if (pathname.startsWith('/teacher')) {
    if (pathname === '/teacher/classes' || pathname.startsWith('/teacher/classes/')) {
      return {
        title: 'My Classes | Teacher Portal - ShikshaSahayak',
        description: 'Manage classroom rosters, student enrollment, join codes, and course streams.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname === '/teacher/assignments' || pathname.startsWith('/teacher/assignments/')) {
      return {
        title: 'Assignments & Submissions | Teacher Portal - ShikshaSahayak',
        description: 'Create assignments, evaluate student submissions, and manage grading rubrics.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname === '/teacher/quizzes' || pathname.startsWith('/teacher/quizzes/')) {
      return {
        title: 'Quizzes & Assessment Bank | Teacher Portal - ShikshaSahayak',
        description: 'Design MCQ/NAT tests, organize question pools, and assign class quizzes.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname === '/teacher/gradebook') {
      return {
        title: 'Grading & Results Ledger | Teacher Portal - ShikshaSahayak',
        description: 'View class performance matrix, average scores, and export CSV gradebooks.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname === '/teacher/materials') {
      return {
        title: 'Study Materials Library | Teacher Portal - ShikshaSahayak',
        description: 'Upload lecture slides, syllabus documents, lab handouts, and study notes.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    if (pathname === '/teacher/settings') {
      return {
        title: 'Educator Settings | Teacher Portal - ShikshaSahayak',
        description: 'Manage educator profile details, department preferences, and theme modes.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    return {
      title: 'Teacher Overview | Teacher Portal - ShikshaSahayak',
      description: 'Overview of active classes, pending evaluations, and student performance alerts.',
      path: pathname,
      robots: 'noindex,follow',
    };
  }

  if (pathname.startsWith('/admin/dashboard')) {
    return {
      title: 'LMS Admin Dashboard - ShikshaSahayak',
      description: 'Manage branches, subjects, study materials, and moderation queues.',
      path: pathname,
      robots: 'noindex,follow',
    };
  }

  if (pathname.startsWith('/AyushAn0607')) {
    if (pathname.endsWith('/dashboard')) {
      return {
        title: 'Admin Control Panel - ShikshaSahayak',
        description: 'Moderation, approval queue, and content updates console.',
        path: pathname,
        robots: 'noindex,follow',
      };
    }
    return {
      title: 'Admin Access - ShikshaSahayak',
      description: 'Secure administrator sign-in portal.',
      path: pathname,
      robots: 'noindex,follow',
    };
  }

  return STATIC_ROUTE_META[pathname] ?? {
    title: 'Page Not Found - ShikshaSahayak',
    description: 'The requested ShikshaSahayak page could not be found. Use the navigation or sitemap to find study resources.',
    path: pathname,
    robots: 'noindex,follow',
  };
};

export const usePageMeta = (meta: PageMeta) => {
  useEffect(() => {
    const path = meta.path ?? window.location.pathname;
    const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
    const title = meta.title.includes(SITE_NAME) ? meta.title : `${meta.title} - ${SITE_NAME}`;
    const description = meta.description || DEFAULT_DESCRIPTION;
    const image = meta.image ?? `${SITE_URL}/logo.png`;

    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: meta.robots ?? 'index,follow' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: meta.type ?? 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    upsertLink('canonical', canonical);
    upsertJsonLd(meta.jsonLd);
  }, [meta.description, meta.image, meta.jsonLd, meta.path, meta.robots, meta.title, meta.type]);
};

export const buildBreadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
  })),
});

export const buildArticleJsonLd = (input: {
  title: string;
  description: string;
  path: string;
  author: string;
  dateModified?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: input.title,
  description: input.description,
  author: {
    '@type': 'Organization',
    name: input.author,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
    },
  },
  datePublished: input.dateModified ?? CONTENT_UPDATED_AT,
  dateModified: input.dateModified ?? CONTENT_UPDATED_AT,
  mainEntityOfPage: `${SITE_URL}${input.path}`,
});
