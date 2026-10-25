// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Student Success & Career (Sprint 18)
// ============================================================

import { StudentCareerProfile, CareerRoadmap, StudentProject } from "../types/student-success-career";

export async function getStudentCareerProfile(): Promise<StudentCareerProfile> {
  try {
    const res = await fetch(`/api/student/career`);
    if (!res.ok) throw new Error("Failed to fetch career profile");
    const data = await res.json();
    return data.profile;
  } catch (error) {
    console.error(error);
    return {
      userId: "",
      careerInterests: [],
      targetCompanies: [],
      placementReadinessScore: 0,
      resumeStatus: "draft",
      skills: [],
      projects: [],
      certifications: [],
    };
  }
}

export async function addProjectToProfile(project: Omit<StudentProject, "id" | "userId" | "createdAt">): Promise<boolean> {
  try {
    const res = await fetch(`/api/student/career`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project", ...project }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getCareerRoadmaps(): Promise<CareerRoadmap[]> {
  try {
    const res = await fetch(`/api/career/roadmaps`);
    if (!res.ok) throw new Error("Failed to fetch career roadmaps");
    const data = await res.json();
    return data.roadmaps || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateMilestoneProgress(milestoneId: string, isCompleted: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/career/roadmaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId, isCompleted }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
