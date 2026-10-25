// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND STUDENT IDENTITY API CLIENT
// ============================================================

import {
  StudentAcademicProfileSpec,
  DeviceSessionSpec,
} from "../types/academic-profile";
import { auth } from "../utils/firebase";
import { getStoredTokens } from "./client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      const { access } = getStoredTokens();
      if (access) {
        headers["Authorization"] = `Bearer ${access}`;
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve auth token for student profile request:", err);
  }
  return headers;
}

/**
 * Fetches student academic profile from backend D1 database or localStorage fallback.
 */
export async function fetchStudentAcademicProfile(
  userId?: string,
  email?: string
): Promise<StudentAcademicProfileSpec | null> {
  const targetId = userId || auth.currentUser?.uid;
  const targetEmail = email || auth.currentUser?.email;
  if (!targetId && !targetEmail) return null;

  const localKey = `padhaku_student_academic_profile_${targetId || targetEmail}`;
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (targetId) params.set("userId", targetId);
    if (targetEmail) params.set("email", targetEmail);

    const res = await fetch(`/api/student/profile?${params.toString()}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.userId || data.email)) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    }
  } catch (error) {
    console.warn("StudentIdentityClient: Network/API error:", error);
  }

  // Fallback to localStorage cache for the specific user
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading profile from localStorage:", e);
  }

  return null;
}

/**
 * Updates or completes student academic profile in backend D1 database and localStorage.
 */
export async function updateStudentAcademicProfile(
  userId: string,
  profile: Partial<StudentAcademicProfileSpec>
): Promise<boolean> {
  const localKey = `padhaku_student_academic_profile_${userId}`;
  
  // Save to LocalStorage immediately
  try {
    const existing = localStorage.getItem(localKey);
    const existingObj = existing ? JSON.parse(existing) : {};
    const updatedObj = {
      ...existingObj,
      ...profile,
      userId,
      isProfileComplete: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(localKey, JSON.stringify(updatedObj));
  } catch (e) {
    console.error("Error writing profile to localStorage:", e);
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/student/profile", {
      method: "POST",
      headers,
      body: JSON.stringify({ userId, profile }),
    });
    return res.ok;
  } catch (error) {
    console.warn("API write failed, profile saved locally:", error);
    return true;
  }
}

/**
 * Fetches student profile directly from shiksha-core-db / padhaku-assessment-db D1 database (table: student_profiles).
 */
export async function fetchD1StudentProfile(userId?: string, email?: string): Promise<any | null> {
  const targetId = userId || auth.currentUser?.uid;
  const targetEmail = email || auth.currentUser?.email;
  if (!targetId && !targetEmail) return null;

  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (targetId) params.set("userId", targetId);
    if (targetEmail) params.set("email", targetEmail);

    const res = await fetch(`/api/student-profile?${params.toString()}`, { headers });
    if (res.ok) {
      const data = await res.json();
      return data; // returns object or null
    }
  } catch (error) {
    console.warn("fetchD1StudentProfile API error:", error);
  }
  return null;
}

/**
 * Saves student profile directly into padhaku-assessment-db D1 database (table: student_profiles).
 */
export async function saveD1StudentProfile(
  profileData: {
    userId: string;
    firebase_uid?: string;
    name: string;
    email: string;
    phoneNumber?: string;
    branch?: string;
    semester?: number | string;
    college?: string;
    university?: string;
    dob?: string;
    marks_10th?: string;
    marks_12th?: string;
    special_skills?: string;
    languages_known?: string;
    experience?: string;
    certifications?: string;
    avatarUrl?: string;
    goals?: string | string[];
    enrollmentNumber?: string;
    enrollmentYear?: number | string;
    graduationYear?: number | string;
    degree?: string;
  },
  authToken?: string
): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const payload = {
      ...profileData,
      firebase_uid: profileData.firebase_uid || profileData.userId,
    };
    const res = await fetch("/api/student-profile", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error("saveD1StudentProfile API error:", error);
    return false;
  }
}

/**
 * Permanently deletes student profile and user account data from Cloudflare D1 database.
 */
export async function deleteD1StudentProfile(userId?: string): Promise<boolean> {
  const targetId = userId || auth.currentUser?.uid;
  if (!targetId) return false;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/student-profile?userId=${encodeURIComponent(targetId)}`, {
      method: "DELETE",
      headers,
    });

    // Clear local storage profile caches
    try {
      localStorage.removeItem(`padhaku_student_academic_profile_${targetId}`);
    } catch {}

    return res.ok;
  } catch (error) {
    console.error("deleteD1StudentProfile API error:", error);
    return false;
  }
}

/**
 * Fetches active device sessions for a student.
 */
export async function fetchStudentDeviceSessions(
  userId = "guest_student"
): Promise<DeviceSessionSpec[]> {
  try {
    const res = await fetch(`/api/student/sessions?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudentIdentityClient.fetchStudentDeviceSessions:", error);
    return [];
  }
}

