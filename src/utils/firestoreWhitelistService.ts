// ============================================================
// SHIKSHA SAHAYAK — FIRESTORE WHITELIST SERVICE
// Dynamic Firestore synchronization for Beta Whitelist and Teacher Whitelist
// ============================================================

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

// ─── TYPES ──────────────────────────────────────────────────

export interface FirestoreBetaWhitelistItem {
  id?: string;
  email: string;
  status: 'approved' | 'pending' | 'revoked' | 'active';
  approved: boolean;
  notes?: string;
  added_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FirestoreTeacherWhitelistItem {
  id?: string;
  email: string;
  name: string;
  department?: string;
  college?: string;
  status: 'approved' | 'pending' | 'revoked';
  approved: boolean;
  added_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── DEFAULT SEED DATA ──────────────────────────────────────

export const DEFAULT_TEACHERS = [
  {
    email: 'tech@shikshasahayak.org',
    name: 'Academic Administrator',
    department: 'Computer Engineering',
    college: 'GTU Main Campus',
    status: 'approved' as const,
  },
  {
    email: 'contact@shikshasahayak.org',
    name: 'Platform Administrator',
    department: 'Computer Science & Engineering',
    college: 'GTU Main Campus',
    status: 'approved' as const,
  },
  {
    email: 'team@shikshasahayak.org',
    name: 'ShikshaSahayak Official Faculty',
    department: 'Academic Administration',
    college: 'ShikshaSahayak University Network',
    status: 'approved' as const,
  },
  {
    email: 'developer@shikshasahayak.org',
    name: 'Lead Technical Faculty',
    department: 'Information Technology',
    college: 'GTU Main Campus',
    status: 'approved' as const,
  }
];

export const DEFAULT_BETA_USERS = [
  {
    email: 'tech@shikshasahayak.org',
    notes: 'Platform Super Admin & AI Beta Lead',
    status: 'approved' as const,
  },
  {
    email: 'contact@shikshasahayak.org',
    notes: 'Platform Admin & Beta Reviewer',
    status: 'approved' as const,
  },
  {
    email: 'team@shikshasahayak.org',
    notes: 'Official Portal Account',
    status: 'approved' as const,
  },
  {
    email: 'developer@shikshasahayak.org',
    notes: 'Lead Developer Account',
    status: 'approved' as const,
  }
];

// ─── 1. BETA WHITELIST FIRESTORE SYNC ───────────────────────

/**
 * Fetch all entries in `beta_whitelist` collection from Firestore
 */
export async function fetchFirestoreBetaWhitelist(): Promise<FirestoreBetaWhitelistItem[]> {
  try {
    const colRef = collection(db, 'beta_whitelist');
    const snapshot = await getDocs(colRef);
    const items: FirestoreBetaWhitelistItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawEmail = data.email || docSnap.id;
      const lowerEmail = rawEmail.toLowerCase();
      const isApproved =
        data.status === 'approved' ||
        data.approved === true ||
        data.status === 'active' ||
        (data.status === undefined && data.approved === undefined);

      items.push({
        id: docSnap.id,
        email: lowerEmail,
        status: isApproved ? 'approved' : 'revoked',
        approved: isApproved,
        notes: data.notes || '',
        added_by: data.added_by || data.granted_by || 'Admin',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    return items;
  } catch (error) {
    console.error('Error fetching Firestore beta_whitelist:', error);
    return [];
  }
}

/**
 * Ensures initial default entries exist in Firestore `beta_whitelist`
 */
export async function ensureInitialBetaWhitelist(): Promise<FirestoreBetaWhitelistItem[]> {
  try {
    const existing = await fetchFirestoreBetaWhitelist();
    if (existing.length === 0) {
      console.log('[Firestore Sync] Seeding initial default beta users into Firestore beta_whitelist collection...');
      for (const b of DEFAULT_BETA_USERS) {
        await addBetaUserToFirestore({
          email: b.email,
          notes: b.notes,
          status: b.status,
          added_by: 'System Seed',
        });
      }
      return await fetchFirestoreBetaWhitelist();
    }
    return existing;
  } catch (err) {
    console.error('Error ensuring initial beta whitelist:', err);
    return [];
  }
}

/**
 * Add or Upsert a user to `beta_whitelist` collection in Firestore
 */
export async function addBetaUserToFirestore(item: {
  email: string;
  notes?: string;
  status?: string;
  added_by?: string;
}): Promise<boolean> {
  try {
    if (!item.email || !item.email.includes('@')) {
      console.warn('[Firestore Sync] Skipping non-email beta entry:', item.email);
      return false;
    }
    const lowerEmail = item.email.trim().toLowerCase();
    const docRef = doc(db, 'beta_whitelist', lowerEmail);

    const payload = {
      email: lowerEmail,
      status: item.status || 'approved',
      approved: (item.status || 'approved') === 'approved',
      notes: item.notes || '',
      added_by: item.added_by || 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore Sync] Successfully added/updated ${lowerEmail} in beta_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to add ${item.email} to beta_whitelist:`, error);
    return false;
  }
}

/**
 * Update a user in `beta_whitelist` collection in Firestore
 */
export async function updateBetaUserInFirestore(
  email: string,
  updates: Partial<FirestoreBetaWhitelistItem>
): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'beta_whitelist', lowerEmail);

    const isApproved = updates.approved !== undefined
      ? updates.approved
      : updates.status === 'approved';

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.approved !== undefined || updates.status !== undefined) payload.approved = isApproved;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.added_by !== undefined) payload.added_by = updates.added_by;

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore Sync] Successfully updated ${lowerEmail} in beta_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to update ${email} in beta_whitelist:`, error);
    return false;
  }
}

/**
 * Delete a user from `beta_whitelist` collection in Firestore
 */
export async function deleteBetaUserFromFirestore(email: string): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'beta_whitelist', lowerEmail);
    await deleteDoc(docRef);
    console.log(`[Firestore Sync] Successfully deleted ${lowerEmail} from beta_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to delete ${email} from beta_whitelist:`, error);
    return false;
  }
}

// ─── 2. TEACHER WHITELIST FIRESTORE SYNC ────────────────────

/**
 * Fetch all entries in `teacher_whitelist` collection from Firestore
 */
export async function fetchFirestoreTeacherWhitelist(): Promise<FirestoreTeacherWhitelistItem[]> {
  try {
    const colRef = collection(db, 'teacher_whitelist');
    const snapshot = await getDocs(colRef);
    const items: FirestoreTeacherWhitelistItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawEmail = data.email || docSnap.id;
      const lowerEmail = rawEmail.toLowerCase();

      items.push({
        id: docSnap.id,
        email: lowerEmail,
        name: data.name || data.displayName || lowerEmail.split('@')[0],
        department: data.department || '',
        college: data.college || data.institution || '',
        status: data.status || (data.approved ? 'approved' : 'pending'),
        approved: data.approved !== false && data.status !== 'revoked',
        added_by: data.added_by || 'Admin',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    return items;
  } catch (error) {
    console.error('Error fetching Firestore teacher_whitelist:', error);
    return [];
  }
}

/**
 * Ensures initial default entries exist in Firestore `teacher_whitelist`
 */
export async function ensureInitialTeacherWhitelist(): Promise<FirestoreTeacherWhitelistItem[]> {
  try {
    const existing = await fetchFirestoreTeacherWhitelist();
    if (existing.length === 0) {
      console.log('[Firestore Sync] Seeding initial default teachers into Firestore teacher_whitelist collection...');
      for (const t of DEFAULT_TEACHERS) {
        await addTeacherToFirestore({
          email: t.email,
          name: t.name,
          department: t.department,
          college: t.college,
          status: t.status,
          added_by: 'System Seed',
        });
      }
      return await fetchFirestoreTeacherWhitelist();
    }
    return existing;
  } catch (err) {
    console.error('Error ensuring initial teacher whitelist:', err);
    return [];
  }
}

/**
 * Add or Upsert a teacher to `teacher_whitelist` collection in Firestore
 */
export async function addTeacherToFirestore(teacher: {
  email: string;
  name: string;
  department?: string;
  college?: string;
  status?: 'approved' | 'pending' | 'revoked';
  added_by?: string;
}): Promise<boolean> {
  try {
    if (!teacher.email || !teacher.email.includes('@')) {
      console.warn('[Firestore Sync] Skipping non-email teacher entry:', teacher.email);
      return false;
    }
    const lowerEmail = teacher.email.trim().toLowerCase();
    const docRef = doc(db, 'teacher_whitelist', lowerEmail);

    const payload = {
      email: lowerEmail,
      name: teacher.name,
      department: teacher.department || '',
      college: teacher.college || '',
      status: teacher.status || 'approved',
      approved: (teacher.status || 'approved') === 'approved',
      added_by: teacher.added_by || 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore Sync] Successfully added ${lowerEmail} to teacher_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to add teacher ${teacher.email} to teacher_whitelist:`, error);
    return false;
  }
}

/**
 * Update a teacher in `teacher_whitelist` collection in Firestore
 */
export async function updateTeacherInFirestore(
  email: string,
  updates: Partial<FirestoreTeacherWhitelistItem>
): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'teacher_whitelist', lowerEmail);

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.department !== undefined) payload.department = updates.department;
    if (updates.college !== undefined) payload.college = updates.college;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      payload.approved = updates.status === 'approved';
    }

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore Sync] Successfully updated ${lowerEmail} in teacher_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to update teacher ${email} in teacher_whitelist:`, error);
    return false;
  }
}

/**
 * Delete a teacher from `teacher_whitelist` collection in Firestore
 */
export async function deleteTeacherFromFirestore(email: string): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'teacher_whitelist', lowerEmail);
    await deleteDoc(docRef);
    console.log(`[Firestore Sync] Successfully deleted ${lowerEmail} from teacher_whitelist`);
    return true;
  } catch (error) {
    console.error(`[Firestore Sync] Failed to delete teacher ${email} from teacher_whitelist:`, error);
    return false;
  }
}

/**
 * Verify if email exists in Firestore `teacher_whitelist`
 */
export async function isEmailInTeacherWhitelist(email?: string | null): Promise<boolean> {
  if (!email || typeof email !== 'string') return false;
  const lowerEmail = email.trim().toLowerCase();

  try {
    const docRef = doc(db, 'teacher_whitelist', lowerEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.status === 'approved' || data.approved === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking Firestore teacher_whitelist:', error);
    return false;
  }
}
