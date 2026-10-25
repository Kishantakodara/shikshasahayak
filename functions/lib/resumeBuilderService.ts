/**
 * SHIKSHA SAHAYAK OS — PRODUCTION RESUME BUILDER & ATS ANALYSIS SERVICE
 */

export interface StudentResumeSpec {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  summary: string;
  education: Array<{ degree: string; institution: string; gpa: number; endYear: string }>;
  skills: string[];
  projects: Array<{ title: string; techStack: string[]; description: string; githubUrl?: string }>;
  experience?: Array<{ role: string; company: string; duration: string; bulletPoints: string[] }>;
}

export interface ATSAnalysisResult {
  score: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement';
  keywordDensityPercent: number;
  missingKeywords: string[];
  formattingWarnings: string[];
  htmlFormattedResume: string;
  markdownFormattedResume: string;
}

/**
 * Evaluates Resume for ATS Compliance and generates exportable HTML/Markdown.
 */
export function analyzeAndBuildResume(spec: StudentResumeSpec): ATSAnalysisResult {
  const essentialKeywords = ['javascript', 'typescript', 'react', 'sql', 'git', 'data structures', 'algorithms', 'problem solving'];
  const userSkillsLower = spec.skills.map(s => s.toLowerCase());

  const missingKeywords = essentialKeywords.filter(kw => !userSkillsLower.includes(kw));
  const keywordDensityPercent = Math.round(((essentialKeywords.length - missingKeywords.length) / essentialKeywords.length) * 100);

  let score = keywordDensityPercent * 0.5 + (spec.projects.length >= 2 ? 30 : 15) + (spec.education.length >= 1 ? 20 : 10);
  score = Math.min(100, Math.round(score));

  let grade: 'Excellent' | 'Good' | 'Needs Improvement' = 'Good';
  if (score >= 85) grade = 'Excellent';
  else if (score < 70) grade = 'Needs Improvement';

  const formattingWarnings: string[] = [];
  if (spec.summary.length < 50) formattingWarnings.push('Expand professional summary to 2-3 sentences.');
  if (spec.skills.length < 5) formattingWarnings.push('Add at least 5 core technical skills.');

  const markdownFormattedResume = `# ${spec.fullName}
${spec.email} | ${spec.phone} | ${spec.location || 'Gujarat, India'}

## Professional Summary
${spec.summary}

## Education
${spec.education.map(e => `- **${e.degree}**, ${e.institution} (GPA: ${e.gpa}/10.0, ${e.endYear})`).join('\n')}

## Technical Skills
${spec.skills.join(' • ')}

## Key Projects
${spec.projects.map(p => `### ${p.title}\n- **Tech Stack:** ${p.techStack.join(', ')}\n- ${p.description}\n- Repository: [${p.githubUrl || 'GitHub'}](${p.githubUrl || '#'})`).join('\n\n')}
`;

  const htmlFormattedResume = `<div class="resume-container" style="font-family: Inter, sans-serif; padding: 24px; color: #1e293b;">
  <h1 style="margin: 0; color: #0f172a;">${spec.fullName}</h1>
  <p style="color: #64748b;">${spec.email} | ${spec.phone} | ${spec.location || 'Gujarat, India'}</p>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
  <h3>Professional Summary</h3>
  <p>${spec.summary}</p>
  <h3>Technical Skills</h3>
  <p><strong>${spec.skills.join(' • ')}</strong></p>
  <h3>Key Projects</h3>
  ${spec.projects.map(p => `<div style="margin-bottom: 12px;"><strong>${p.title}</strong> (${p.techStack.join(', ')})<br/><span>${p.description}</span></div>`).join('')}
</div>`;

  return {
    score,
    grade,
    keywordDensityPercent,
    missingKeywords,
    formattingWarnings,
    htmlFormattedResume,
    markdownFormattedResume
  };
}
