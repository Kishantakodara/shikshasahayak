// ============================================================
// SHIKSHA SAHAYAK — FIRESTORE BETA WHITELIST SERVICE
// ============================================================

import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

const ALLOWED_ADMIN_EMAILS = [
  'contact@shikshasahayak.org',
  'tech@shikshasahayak.org',
  'team@shikshasahayak.org',
  'mentor@shikshasahayak.org',
  'ayush.team@shikshasahayak.org',
  'support@shikshasahayak.org',
  'lead@shikshasahayak.org',
  'admin@shikshasahayak.org',
  'developer@shikshasahayak.org',
];

/**
 * Checks if the user's email is whitelisted in the Firestore `beta_whitelist` collection.
 * Performs document ID checks and email field queries with case insensitivity.
 */
export async function isEmailInBetaWhitelist(email?: string | null): Promise<boolean> {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const rawEmail = email.trim();
  const lowerEmail = rawEmail.toLowerCase();

  // 1. Always approve super admins & internal developer emails
  if (ALLOWED_ADMIN_EMAILS.includes(lowerEmail) || lowerEmail.endsWith('@shikshasahayak.org')) {
    return true;
  }

  try {
    const firestoreCheck = async (): Promise<boolean> => {
      // 2. Check direct Document ID in `beta_whitelist` (lowercase)
      const docRefLower = doc(db, 'beta_whitelist', lowerEmail);
      const snapLower = await getDoc(docRefLower);
      if (snapLower.exists()) {
        const data = snapLower.data();
        const isApproved = data.status === 'approved' || data.approved === true || data.status === 'active' || (data.status === undefined && data.approved === undefined);
        if (isApproved) return true;
      }

      // 3. Check direct Document ID in `beta_whitelist` (raw email)
      if (rawEmail !== lowerEmail) {
        const docRefRaw = doc(db, 'beta_whitelist', rawEmail);
        const snapRaw = await getDoc(docRefRaw);
        if (snapRaw.exists()) {
          const data = snapRaw.data();
          const isApproved = data.status === 'approved' || data.approved === true || data.status === 'active' || (data.status === undefined && data.approved === undefined);
          if (isApproved) return true;
        }
      }

      // 4. Query `beta_whitelist` collection where email field equals lowerEmail
      const qLower = query(collection(db, 'beta_whitelist'), where('email', '==', lowerEmail));
      const querySnapLower = await getDocs(qLower);
      if (!querySnapLower.empty) return true;

      // 5. Query `beta_whitelist` collection where email field equals rawEmail
      if (rawEmail !== lowerEmail) {
        const qRaw = query(collection(db, 'beta_whitelist'), where('email', '==', rawEmail));
        const querySnapRaw = await getDocs(qRaw);
        if (!querySnapRaw.empty) return true;
      }

      return false;
    };

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 3000); // 3-second safety timeout
    });

    return await Promise.race([firestoreCheck(), timeoutPromise]);
  } catch (error) {
    console.error("Error querying Firestore beta_whitelist collection:", error);
    return false;
  }
}
