// ============================================================
// SHIKSHA SAHAYAK OS API: /api/scholarships
// Section: Curated Engineering Scholarships & Financial Grants
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";

export interface ScholarshipDTO {
  id: string;
  title: string;
  slug: string;
  provider: string;
  category: 'Engineering Merit' | 'Need-Based' | 'State Govt' | 'National' | 'Corporate / Foundation';
  amountInr: number;
  amountFormatted: string;
  description: string;
  eligibilityCriteria: string[];
  eligibleBranches: string[];
  minGpa: number;
  maxFamilyIncomeLpa?: number;
  requiredDocuments: string[];
  applicationDeadline: string;
  officialApplicationUrl: string;
  isVerified: boolean;
}

export const CURATED_SCHOLARSHIPS: ScholarshipDTO[] = [
  {
    id: 'sch-mysy-01',
    title: 'Mukhyamantri Yuva Swavalamban Yojana (MYSY)',
    slug: 'mysy-gujarat-engineering',
    provider: 'Government of Gujarat (Education Dept)',
    category: 'State Govt',
    amountInr: 50000,
    amountFormatted: 'Up to ₹50,000 / year (50% Tuition Fee)',
    description: 'Premier higher education financial assistance initiative by Gujarat Government for meritorious diploma to degree and first-year engineering students.',
    eligibilityCriteria: [
      'Minimum 80 percentile or above in 12th Science / Diploma to Degree',
      'Annual family income less than ₹6,00,000 per annum',
      'Admitted through ACPC Gujarat quota in government or self-financed engineering college'
    ],
    eligibleBranches: ['All Engineering Disciplines', 'Computer', 'IT', 'Mechanical', 'Civil', 'Electrical'],
    minGpa: 8.0,
    maxFamilyIncomeLpa: 6.0,
    requiredDocuments: [
      'Admission Slip & ACPC Allotment Letter',
      '10th & 12th / Diploma Marksheet',
      'Authorized Income Certificate (Tehsildar / Taluka Magistrate)',
      'College Bonafide Certificate & First Term Fee Receipt',
      'Aadhaar Linked Bank Account Passbook'
    ],
    applicationDeadline: '2026-12-31',
    officialApplicationUrl: 'https://mysy.guj.nic.in',
    isVerified: true
  },
  {
    id: 'sch-aicte-pragati-02',
    title: 'AICTE Pragati Scholarship for Girl Engineering Students',
    slug: 'aicte-pragati-scholarship',
    provider: 'All India Council for Technical Education (AICTE)',
    category: 'National',
    amountInr: 50000,
    amountFormatted: '₹50,000 / year for all 4 Years',
    description: 'Empowering young women pursuing technical engineering degrees at AICTE-approved institutions with tuition and contingency grants.',
    eligibilityCriteria: [
      'Female candidate admitted to 1st year of Degree level engineering program',
      'Family income not exceeding ₹8,00,000 per annum',
      'Maximum two girl children per family eligible'
    ],
    eligibleBranches: ['All Engineering Disciplines'],
    minGpa: 0.0,
    maxFamilyIncomeLpa: 8.0,
    requiredDocuments: [
      'Mark sheet of qualifying examination (10+2 / HSC)',
      'Annual family income certificate issued by competent authority',
      'Admission letter issued by Centralized Admission Authority (ACPC)',
      'Tuition fee receipt paid to institute',
      'Bank passbook photocopy showing IFSC & account number'
    ],
    applicationDeadline: '2026-11-30',
    officialApplicationUrl: 'https://scholarships.gov.in',
    isVerified: true
  },
  {
    id: 'sch-digital-gujarat-03',
    title: 'Digital Gujarat Post-Matric Freeship Scheme',
    slug: 'digital-gujarat-post-matric',
    provider: 'Social Justice & Empowerment Dept, Gujarat',
    category: 'State Govt',
    amountInr: 100000,
    amountFormatted: '100% Tuition Fee Waiver & Hostel Allowance',
    description: 'Direct benefit transfer supporting SC, ST, SEBC, and NTDNT engineering scholars studying across state and private universities.',
    eligibilityCriteria: [
      'Permanent resident of Gujarat State',
      'Valid caste certificate from competent Gujarat authority',
      'Income limit as per category guidelines (₹2.5L to ₹6.0L)'
    ],
    eligibleBranches: ['All Engineering Disciplines'],
    minGpa: 0.0,
    maxFamilyIncomeLpa: 6.0,
    requiredDocuments: [
      'Caste Certificate & Non-Creamy Layer Certificate (where applicable)',
      'Income Certificate',
      'Previous year college marksheets',
      'Hostel certificate (if claiming hostel allowance)',
      'College fee receipt and bonafide'
    ],
    applicationDeadline: '2026-12-15',
    officialApplicationUrl: 'https://www.digitalgujarat.gov.in',
    isVerified: true
  },
  {
    id: 'sch-reliance-found-04',
    title: 'Reliance Foundation Undergraduate Scholarship',
    slug: 'reliance-foundation-undergraduate',
    provider: 'Reliance Foundation',
    category: 'Corporate / Foundation',
    amountInr: 200000,
    amountFormatted: 'Up to ₹2,00,000 across degree duration',
    description: 'National competitive merit-cum-means scholarship selecting 5,000 promising undergraduate scholars through online aptitude test and interview.',
    eligibilityCriteria: [
      'First-year undergraduate student in any engineering or science stream',
      'Minimum 60% in Class 12 board examination',
      'Household income under ₹15 Lakhs (preference to under ₹2.5 Lakhs)'
    ],
    eligibleBranches: ['Computer Science', 'AI & Data Science', 'Electrical', 'Mechanical', 'Chemical'],
    minGpa: 6.0,
    maxFamilyIncomeLpa: 15.0,
    requiredDocuments: [
      'Class 10 & 12 Board Marksheet',
      'Current college enrollment confirmation',
      'Family income tax return (ITR) or salary slips',
      'Passport size photo and identification proof'
    ],
    applicationDeadline: '2026-11-15',
    officialApplicationUrl: 'https://www.scholarships.reliancefoundation.org',
    isVerified: true
  }
];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const maxIncome = url.searchParams.get("maxIncome");
  const branch = url.searchParams.get("branch");

  const user = await getAuthenticatedUser(request, env as any);
  const db = env.PADHAKU_CORE_DB || env.DB;

  try {
    let list = [...CURATED_SCHOLARSHIPS];
    let savedIds: string[] = [];

    if (db) {
      try {
        const { results } = await db.prepare(
          `SELECT id, title, slug, provider, category, amount_inr, description,
                  eligibility_criteria_json, eligible_branches_json, min_gpa,
                  max_family_income_lpa, required_documents_json, application_deadline,
                  official_application_url, is_verified
           FROM scholarships
           WHERE is_active = 1
           ORDER BY amount_inr DESC`
        ).all<Record<string, unknown>>();

        if (results && results.length > 0) {
          const dbList: ScholarshipDTO[] = results.map(r => ({
            id: String(r.id),
            title: String(r.title),
            slug: String(r.slug),
            provider: String(r.provider),
            category: String(r.category) as any,
            amountInr: Number(r.amount_inr || 0),
            amountFormatted: `₹${Number(r.amount_inr).toLocaleString('en-IN')}`,
            description: String(r.description || ''),
            eligibilityCriteria: JSON.parse(String(r.eligibility_criteria_json || '[]')),
            eligibleBranches: JSON.parse(String(r.eligible_branches_json || '["All Engineering"]')),
            minGpa: Number(r.min_gpa || 0),
            maxFamilyIncomeLpa: r.max_family_income_lpa ? Number(r.max_family_income_lpa) : undefined,
            requiredDocuments: JSON.parse(String(r.required_documents_json || '[]')),
            applicationDeadline: String(r.application_deadline || ''),
            officialApplicationUrl: String(r.official_application_url),
            isVerified: Boolean(r.is_verified)
          }));
          const existingIds = new Set(dbList.map(s => s.id));
          list = [...dbList, ...CURATED_SCHOLARSHIPS.filter(s => !existingIds.has(s.id))];
        }

        // If student is authenticated, fetch their saved scholarship IDs
        if (user) {
          const { results: bookmarkRows } = await db.prepare(
            `SELECT scholarship_id FROM student_scholarship_bookmarks WHERE user_id = ?`
          ).bind(user.uid).all<{ scholarship_id: string }>();

          if (bookmarkRows) {
            savedIds = bookmarkRows.map(b => b.scholarship_id);
          }
        }
      } catch (dbErr: any) {
        console.warn('DB scholarships query warning:', dbErr?.message);
      }
    }

    if (category && category !== 'all') {
      list = list.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (maxIncome) {
      const inc = parseFloat(maxIncome);
      if (!isNaN(inc)) {
        list = list.filter(s => !s.maxFamilyIncomeLpa || s.maxFamilyIncomeLpa >= inc);
      }
    }

    return jsonResponse({
      success: true,
      scholarships: list,
      savedIds,
      totalCount: list.length
    }, {
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch scholarships', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const user = await getAuthenticatedUser(request, env as any);
    const body = await request.json().catch(() => ({})) as {
      scholarshipId?: string;
      action?: 'toggle' | 'bookmark' | 'remove';
    };

    const scholarshipId = body?.scholarshipId?.trim();
    if (!scholarshipId) {
      return errorResponse('Missing scholarshipId', 400);
    }

    const userId = user ? user.uid : 'guest_student';
    const db = env.PADHAKU_CORE_DB || env.DB;
    let isBookmarked = false;

    if (db) {
      try {
        const existing = await db.prepare(
          `SELECT id FROM student_scholarship_bookmarks WHERE user_id = ? AND scholarship_id = ?`
        ).bind(userId, scholarshipId).first();

        if (existing) {
          if (body?.action === 'bookmark') {
            isBookmarked = true;
          } else {
            // Remove
            await db.prepare(
              `DELETE FROM student_scholarship_bookmarks WHERE user_id = ? AND scholarship_id = ?`
            ).bind(userId, scholarshipId).run();
            isBookmarked = false;
          }
        } else {
          if (body?.action !== 'remove') {
            const bId = `sbm_${userId}_${scholarshipId}`;
            await db.prepare(
              `INSERT INTO student_scholarship_bookmarks (id, user_id, scholarship_id, status, created_at)
               VALUES (?, ?, ?, 'SAVED', CURRENT_TIMESTAMP)`
            ).bind(bId, userId, scholarshipId).run();
            isBookmarked = true;
          }
        }
      } catch (dbErr: any) {
        console.warn('DB scholarship bookmark warning:', dbErr?.message);
      }
    }

    return jsonResponse({
      success: true,
      scholarshipId,
      isBookmarked
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update scholarship bookmark', 500);
  }
}
