// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: Student Success & Career (Sprint 18)
// ============================================================

import { Env } from "./contentEngine";
import { StudentCareerProfile, SkillItem, StudentProject, StudentCertification, CareerRoadmap, RoadmapMilestone } from "../../src/types/student-success-career";

export async function fetchStudentCareerProfile(env: Env, userId: string): Promise<StudentCareerProfile> {
  try {
    const profileRow = await env.DB.prepare(
      `SELECT goals, special_skills
       FROM student_profiles WHERE user_id = ?`
    ).bind(userId).first() as any;

    const careerInterests = profileRow?.goals ? (typeof profileRow.goals === 'string' ? JSON.parse(profileRow.goals) : profileRow.goals) : ["Software Engineering"];
    const targetCompanies = JSON.parse(profileRow?.target_companies_json || '["TCS", "Infosys"]');
    const placementReadinessScore = profileRow?.placement_readiness_score || 65;
    const resumeStatus = profileRow?.resume_status || "draft";

    // Skills
    const { results: skillRows } = await env.DB.prepare(
      `SELECT s.id, s.name, s.category, s.icon, ss.proficiency_level, ss.is_verified
       FROM student_skills ss
       JOIN skills_catalogue s ON ss.skill_id = s.id
       WHERE ss.user_id = ?`
    ).bind(userId).all();

    const skills: SkillItem[] = (skillRows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      icon: r.icon,
      proficiencyLevel: r.proficiency_level,
      isVerified: Boolean(r.is_verified),
    }));

    // Projects
    const { results: projectRows } = await env.DB.prepare(
      `SELECT id, title, description, technologies_json, project_url, github_url, is_public, created_at
       FROM student_projects WHERE user_id = ? ORDER BY created_at DESC`
    ).bind(userId).all();

    const projects: StudentProject[] = (projectRows || []).map((r: any) => ({
      id: r.id,
      userId,
      title: r.title,
      description: r.description,
      technologies: JSON.parse(r.technologies_json || "[]"),
      projectUrl: r.project_url,
      githubUrl: r.github_url,
      isPublic: Boolean(r.is_public),
      createdAt: r.created_at,
    }));

    // Certifications
    const { results: certRows } = await env.DB.prepare(
      `SELECT id, name, provider, credential_id, verification_url, issued_date
       FROM student_certifications WHERE user_id = ? ORDER BY issued_date DESC`
    ).bind(userId).all();

    const certifications: StudentCertification[] = (certRows || []).map((r: any) => ({
      id: r.id,
      userId,
      name: r.name,
      provider: r.provider,
      credentialId: r.credential_id,
      verificationUrl: r.verification_url,
      issuedDate: r.issued_date,
    }));

    return {
      userId,
      careerInterests,
      targetCompanies,
      placementReadinessScore,
      resumeStatus,
      skills,
      projects,
      certifications,
    };
  } catch (error) {
    console.error("Failed to fetch career profile:", error);
    return {
      userId,
      careerInterests: ["Software Engineering"],
      targetCompanies: ["TCS", "Infosys"],
      placementReadinessScore: 65,
      resumeStatus: "draft",
      skills: [],
      projects: [],
      certifications: [],
    };
  }
}

export async function addStudentProject(env: Env, userId: string, project: Omit<StudentProject, "id" | "userId" | "createdAt">): Promise<boolean> {
  try {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO student_projects (id, user_id, title, description, technologies_json, project_url, github_url, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      userId,
      project.title,
      project.description,
      JSON.stringify(project.technologies || []),
      project.projectUrl || null,
      project.githubUrl || null,
      project.isPublic ? 1 : 0
    ).run();

    return true;
  } catch (error) {
    console.error("Failed to add student project:", error);
    return false;
  }
}

export async function fetchCareerRoadmaps(env: Env, userId: string): Promise<CareerRoadmap[]> {
  try {
    const { results: roadmapRows } = await env.DB.prepare(
      `SELECT id, title, category, description, total_milestones FROM career_roadmaps`
    ).all();

    const roadmaps: CareerRoadmap[] = [];

    for (const r of roadmapRows || []) {
      const { results: msRows } = await env.DB.prepare(
        `SELECT m.id, m.roadmap_id, m.step_number, m.title, m.description, m.resource_url,
                p.is_completed
         FROM roadmap_milestones m
         LEFT JOIN student_roadmap_progress p ON m.id = p.milestone_id AND p.user_id = ?
         WHERE m.roadmap_id = ?
         ORDER BY m.step_number ASC`
      ).bind(userId, r.id).all();

      const milestones: RoadmapMilestone[] = (msRows || []).map((m: any) => ({
        id: m.id,
        roadmapId: m.roadmap_id,
        stepNumber: m.step_number,
        title: m.title,
        description: m.description,
        resourceUrl: m.resource_url,
        isCompleted: Boolean(m.is_completed),
      }));

      const completedCount = milestones.filter((m) => m.isCompleted).length;

      const category = String(r.category || "Semester Success");
      const allowedCategories: CareerRoadmap["category"][] = ["Placement Prep", "GATE Prep", "CAT Prep", "Semester Success", "Government Exams"];
      roadmaps.push({
        id: String(r.id || ""),
        title: String(r.title || "Career roadmap"),
        category: allowedCategories.includes(category as CareerRoadmap["category"]) ? category as CareerRoadmap["category"] : "Semester Success",
        description: String(r.description || ""),
        totalMilestones: Number(r.total_milestones || milestones.length),
        milestones,
        completedCount,
      });
    }

    return roadmaps;
  } catch (error) {
    console.error("Failed to fetch career roadmaps:", error);
    return [];
  }
}

export async function toggleMilestoneProgress(env: Env, userId: string, milestoneId: string, isCompleted: boolean): Promise<boolean> {
  try {
    const id = `prog_${userId}_${milestoneId}`;
    await env.DB.prepare(
      `INSERT INTO student_roadmap_progress (id, user_id, milestone_id, is_completed, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, milestone_id) DO UPDATE SET
         is_completed = excluded.is_completed,
         completed_at = excluded.completed_at`
    ).bind(id, userId, milestoneId, isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null).run();

    return true;
  } catch (error) {
    console.error("Failed to update milestone progress:", error);
    return false;
  }
}
