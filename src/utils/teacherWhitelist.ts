// ============================================================
// SHIKSHA SAHAYAK — FIRESTORE TEACHER WHITELIST SERVICE
// ============================================================

import { isEmailInTeacherWhitelist as checkFirestoreTeacherWhitelist } from "./firestoreWhitelistService";

const ALLOWED_ADMIN_TEACHER_EMAILS = [
  'contact@shikshasahayak.org',
  'tech@shikshasahayak.org',
  'team@shikshasahayak.org',
  'developer@shikshasahayak.org'
];

/**
 * Checks if the teacher's email is whitelisted in the Firestore `teacher_whitelist` collection.
 */
export async function isEmailInTeacherWhitelist(email?: string | null): Promise<boolean> {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const rawEmail = email.trim();
  const lowerEmail = rawEmail.toLowerCase();

  // 1. Super Admin override
  if (ALLOWED_ADMIN_TEACHER_EMAILS.includes(lowerEmail)) {
    return true;
  }

  try {
    // 2. Check Firestore teacher_whitelist collection
    const inFirestore = await checkFirestoreTeacherWhitelist(lowerEmail);
    if (inFirestore) return true;

    // 3. Fallback check to Cloudflare Worker API
    const res = await fetch(`/api/admin/teacher-whitelist?email=${encodeURIComponent(lowerEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.isWhitelisted || data.status === 'approved') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking teacher whitelist:", error);
    return false;
  }
}
