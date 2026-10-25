// ============================================================
// SHIKSHA SAHAYAK OS: FIRESTORE REST API EDGE SERVICE FOR CLOUDFLARE WORKERS
// Serverless sync for beta_whitelist and teacher_whitelist in Firebase Firestore
// ============================================================

const FIREBASE_PROJECT_ID = "padhakuportal";
const FIREBASE_API_KEY = "AIzaSyDemoShikshaSahayakMockKey12345";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Upserts a document in Firestore `teacher_whitelist` collection via REST API
 */
export async function syncTeacherToFirestoreREST(teacher: {
  email: string;
  name: string;
  department?: string;
  college?: string;
  status?: string;
  addedBy?: string;
}): Promise<boolean> {
  try {
    if (!teacher.email || !teacher.email.includes('@')) return false;
    const lowerEmail = teacher.email.trim().toLowerCase();
    const url = `${FIRESTORE_BASE_URL}/teacher_whitelist/${encodeURIComponent(lowerEmail)}?key=${FIREBASE_API_KEY}`;

    const statusVal = teacher.status || 'approved';
    const body = {
      fields: {
        email: { stringValue: lowerEmail },
        name: { stringValue: teacher.name || lowerEmail.split('@')[0] },
        department: { stringValue: teacher.department || '' },
        college: { stringValue: teacher.college || '' },
        status: { stringValue: statusVal },
        approved: { booleanValue: statusVal === 'approved' },
        added_by: { stringValue: teacher.addedBy || 'Admin' },
        updated_at: { stringValue: new Date().toISOString() },
      },
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`[Worker Firestore REST] Upserted teacher_whitelist/${lowerEmail}`);
      return true;
    } else {
      const errText = await res.text();
      console.warn(`[Worker Firestore REST] Teacher upsert status ${res.status}: ${errText}`);
      return false;
    }
  } catch (err) {
    console.error('[Worker Firestore REST] Teacher upsert failed:', err);
    return false;
  }
}

/**
 * Deletes a document from Firestore `teacher_whitelist` collection via REST API
 */
export async function deleteTeacherFromFirestoreREST(email: string): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const url = `${FIRESTORE_BASE_URL}/teacher_whitelist/${encodeURIComponent(lowerEmail)}?key=${FIREBASE_API_KEY}`;

    const res = await fetch(url, {
      method: 'DELETE',
    });

    if (res.ok) {
      console.log(`[Worker Firestore REST] Deleted teacher_whitelist/${lowerEmail}`);
      return true;
    } else {
      console.warn(`[Worker Firestore REST] Teacher delete status ${res.status}`);
      return false;
    }
  } catch (err) {
    console.error('[Worker Firestore REST] Teacher delete failed:', err);
    return false;
  }
}

/**
 * Upserts a document in Firestore `beta_whitelist` collection via REST API
 */
export async function syncBetaUserToFirestoreREST(betaUser: {
  email: string;
  notes?: string;
  status?: string;
  addedBy?: string;
}): Promise<boolean> {
  try {
    if (!betaUser.email || !betaUser.email.includes('@')) return false;
    const lowerEmail = betaUser.email.trim().toLowerCase();
    const url = `${FIRESTORE_BASE_URL}/beta_whitelist/${encodeURIComponent(lowerEmail)}?key=${FIREBASE_API_KEY}`;

    const statusVal = betaUser.status || 'approved';
    const body = {
      fields: {
        email: { stringValue: lowerEmail },
        status: { stringValue: statusVal },
        approved: { booleanValue: statusVal === 'approved' },
        notes: { stringValue: betaUser.notes || '' },
        added_by: { stringValue: betaUser.addedBy || 'Admin' },
        updated_at: { stringValue: new Date().toISOString() },
      },
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`[Worker Firestore REST] Upserted beta_whitelist/${lowerEmail}`);
      return true;
    } else {
      const errText = await res.text();
      console.warn(`[Worker Firestore REST] Beta upsert status ${res.status}: ${errText}`);
      return false;
    }
  } catch (err) {
    console.error('[Worker Firestore REST] Beta upsert failed:', err);
    return false;
  }
}

/**
 * Deletes a document from Firestore `beta_whitelist` collection via REST API
 */
export async function deleteBetaUserFromFirestoreREST(email: string): Promise<boolean> {
  try {
    const lowerEmail = email.trim().toLowerCase();
    const url = `${FIRESTORE_BASE_URL}/beta_whitelist/${encodeURIComponent(lowerEmail)}?key=${FIREBASE_API_KEY}`;

    const res = await fetch(url, {
      method: 'DELETE',
    });

    if (res.ok) {
      console.log(`[Worker Firestore REST] Deleted beta_whitelist/${lowerEmail}`);
      return true;
    } else {
      console.warn(`[Worker Firestore REST] Beta delete status ${res.status}`);
      return false;
    }
  } catch (err) {
    console.error('[Worker Firestore REST] Beta delete failed:', err);
    return false;
  }
}

/**
 * Fetches all documents from a Firestore collection via REST API
 */
export async function fetchFirestoreCollectionREST(collectionName: string): Promise<any[]> {
  try {
    const url = `${FIRESTORE_BASE_URL}/${collectionName}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!data.documents) return [];

    return data.documents.map((docItem: any) => {
      const pathParts = docItem.name.split('/');
      const docId = pathParts[pathParts.length - 1];
      const fields = docItem.fields || {};
      const resultObj: Record<string, any> = { id: docId };

      for (const [key, valObj] of Object.entries(fields)) {
        const v: any = valObj;
        resultObj[key] = v.stringValue || v.booleanValue || v.integerValue || v.doubleValue || null;
      }
      return resultObj;
    });
  } catch (err) {
    console.error(`[Worker Firestore REST] Fetch ${collectionName} failed:`, err);
    return [];
  }
}
