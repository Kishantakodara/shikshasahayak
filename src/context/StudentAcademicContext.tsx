// ============================================================
// SHIKSHA SAHAYAK OS - STUDENT ACADEMIC PROFILE CONTEXT & EXPLORE MODE
// ============================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StudentAcademicProfileSpec } from "../types/academic-profile";
import { fetchStudentAcademicProfile, updateStudentAcademicProfile } from "../api/studentIdentityClient";
import { DEFAULT_ACADEMIC_DEFAULTS } from "../config/constants";
import { useAuth } from "./AuthContext";
import { getCanonicalBranchSlug, getCanonicalBranchName } from "../utils/branchUtils";

interface StudentAcademicContextType {
  academicProfile: StudentAcademicProfileSpec;
  isProfileComplete: boolean;
  isLoading: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  saveAcademicProfile: (profile: Partial<StudentAcademicProfileSpec>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  isExploreMode: boolean;
  toggleExploreMode: () => void;
  setExploreMode: (explore: boolean) => void;
}

const EMPTY_PROFILE: StudentAcademicProfileSpec = {
  userId: "",
  fullName: "",
  email: "",
  universityId: "",
  universityName: "",
  degreeId: "",
  degreeName: "",
  branchId: "",
  branchName: "",
  semester: 0,
  academicYear: "",
  preferredLanguage: "en",
  goals: [],
  isProfileComplete: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const StudentAcademicContext = createContext<StudentAcademicContextType>({
  academicProfile: EMPTY_PROFILE,
  isProfileComplete: false,
  isLoading: false,
  showProfileModal: false,
  setShowProfileModal: () => {},
  saveAcademicProfile: async () => false,
  refreshProfile: async () => {},
  isExploreMode: false,
  toggleExploreMode: () => {},
  setExploreMode: () => {},
});

export const StudentAcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.uid : "";

  const [academicProfile, setAcademicProfile] = useState<StudentAcademicProfileSpec>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExploreMode, setIsExploreModeState] = useState<boolean>(() => {
    return localStorage.getItem("padhaku_explore_mode") === "true";
  });

  const setShowProfileModal = (show: boolean) => {
    if (show) {
      navigate('/register');
    }
  };

  const setExploreMode = (explore: boolean) => {
    setIsExploreModeState(explore);
    localStorage.setItem("padhaku_explore_mode", explore ? "true" : "false");
  };

  const toggleExploreMode = () => {
    setExploreMode(!isExploreMode);
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    if (!currentUser) {
      let guestData: Partial<StudentAcademicProfileSpec> = {};
      try {
        const saved = localStorage.getItem("padhaku_guest_academic_profile");
        if (saved) guestData = JSON.parse(saved);
      } catch {}

      setAcademicProfile({
        ...EMPTY_PROFILE,
        ...DEFAULT_ACADEMIC_DEFAULTS,
        ...guestData,
        branchId: guestData.branchId || DEFAULT_ACADEMIC_DEFAULTS.branchId || 'computer-engineering',
        branchName: guestData.branchName || DEFAULT_ACADEMIC_DEFAULTS.branchName || 'Computer Engineering',
        semester: guestData.semester && guestData.semester > 0 ? guestData.semester : (DEFAULT_ACADEMIC_DEFAULTS.semester || 3),
        universityName: guestData.universityName || DEFAULT_ACADEMIC_DEFAULTS.universityName || 'Gujarat Technological University',
      });
      setIsLoading(false);
      return;
    }

    const data = await fetchStudentAcademicProfile(currentUser.uid, currentUser.email || undefined);
    if (data && (data.branchId || data.branchName)) {
      data.branchId = getCanonicalBranchSlug(data.branchId || data.branchName);
      data.branchName = getCanonicalBranchName(data.branchName || data.branchId);
    }

    if (data && (data.isProfileComplete || (data.branchId && Number(data.semester) > 0))) {
      setAcademicProfile({
        ...data,
        fullName: data.fullName || currentUser.fullName || currentUser.displayName || "",
        email: data.email || currentUser.email || "",
        isProfileComplete: true,
      });
    } else {
      const newProfile: StudentAcademicProfileSpec = {
        ...EMPTY_PROFILE,
        ...DEFAULT_ACADEMIC_DEFAULTS,
        ...(data || {}),
        userId: currentUser.uid,
        branchId: getCanonicalBranchSlug(data?.branchId || DEFAULT_ACADEMIC_DEFAULTS.branchId || 'computer-engineering'),
        branchName: getCanonicalBranchName(data?.branchName || DEFAULT_ACADEMIC_DEFAULTS.branchName || 'Computer Engineering'),
        fullName: data?.fullName || currentUser.fullName || currentUser.displayName || "",
        email: data?.email || currentUser.email || "",
        semester: data?.semester && data.semester > 0 ? data.semester : (DEFAULT_ACADEMIC_DEFAULTS.semester || 3),
        universityName: data?.universityName || DEFAULT_ACADEMIC_DEFAULTS.universityName || 'Gujarat Technological University',
        isProfileComplete: false,
      };
      setAcademicProfile(newProfile);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, [currentUser?.uid]);

  const saveAcademicProfile = async (profileData: Partial<StudentAcademicProfileSpec>): Promise<boolean> => {
    const rawBranch = profileData.branchId || profileData.branchName || academicProfile.branchId || academicProfile.branchName;
    const resolvedBranchId = rawBranch ? getCanonicalBranchSlug(rawBranch) : academicProfile.branchId;
    const resolvedBranchName = rawBranch ? getCanonicalBranchName(rawBranch) : academicProfile.branchName;

    const updated: StudentAcademicProfileSpec = {
      ...academicProfile,
      ...profileData,
      branchId: resolvedBranchId,
      branchName: resolvedBranchName,
      fullName: profileData.fullName || academicProfile.fullName || currentUser?.fullName || currentUser?.displayName || "",
      email: profileData.email || academicProfile.email || currentUser?.email || "",
      userId,
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem("padhaku_guest_academic_profile", JSON.stringify(updated));
    } catch {}
    if (currentUser?.uid) {
      try {
        sessionStorage.removeItem(`academic_setup_dismissed_${currentUser.uid}`);
      } catch {}
    }
    const success = await updateStudentAcademicProfile(userId, updated);
    if (success || !currentUser?.uid) {
      setAcademicProfile(updated);
      return true;
    }
    return success;
  };

  return (
    <StudentAcademicContext.Provider
      value={{
        academicProfile,
        isProfileComplete: academicProfile.isProfileComplete,
        isLoading,
        showProfileModal: false,
        setShowProfileModal,
        saveAcademicProfile,
        refreshProfile,
        isExploreMode,
        toggleExploreMode,
        setExploreMode,
      }}
    >
      {children}
    </StudentAcademicContext.Provider>
  );
};

export const useStudentAcademic = () => useContext(StudentAcademicContext);
