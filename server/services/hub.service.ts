import { OrgRepository } from "../repositories/org.repository";
import { L2AssessmentRepository } from "../repositories/l2-assessment.repository";
import { L3AssessmentRepository } from "../repositories/l3-assessment.repository";
import { HealthScoreRepository } from "../repositories/health-score.repository";
import { db } from "../db";
import { assessments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class HubService {
  private static orgRepo = new OrgRepository();
  private static l2Repo = new L2AssessmentRepository();
  private static l3Repo = new L3AssessmentRepository();
  private static healthRepo = new HealthScoreRepository();

  /**
   * Get aggregated status across all three layers for a user's org
   */
  static async getStatus(userId: number) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    const orgId = orgResult?.org.id;

    // ── L1 Status ─────────────────────────────────
    const l1Status = await this.getL1Status(userId, orgId);

    // ── L2 Status ─────────────────────────────────
    const l2Status = await this.getL2Status(userId, orgId);

    // ── L3 Status ─────────────────────────────────
    const l3Status = await this.getL3Status(userId, orgId);

    // ── Master Score ──────────────────────────────
    const scores = [l1Status.score, l2Status.avgScore, l3Status.avgScore].filter(
      (s): s is number => s !== null && s !== undefined
    );
    const activeLayers = scores.length;
    const masterScore = activeLayers > 0
      ? scores.reduce((sum, s) => sum + s, 0) / activeLayers
      : null;

    // Determine next recommendation
    let nextRecommendation = "Start your L1 organisational assessment";
    if (l1Status.status === "completed" && l2Status.completedCount === 0) {
      nextRecommendation = "Define your departments and start L2 assessments";
    } else if (l2Status.completedCount > 0 && l3Status.completedCount === 0) {
      nextRecommendation = "Invite your team to complete L3 personal assessments";
    } else if (l2Status.totalCount > 0 && l2Status.completedCount < l2Status.totalCount) {
      nextRecommendation = `Complete L2 for remaining ${l2Status.totalCount - l2Status.completedCount} departments`;
    } else if (activeLayers === 3) {
      nextRecommendation = "All layers complete! Review your dashboard for insights.";
    }

    // Update cached health score if org exists
    if (orgId && masterScore !== null) {
      await this.healthRepo.upsert(orgId, {
        l1Score: l1Status.score,
        l2AvgScore: l2Status.avgScore,
        l3AvgScore: l3Status.avgScore,
        masterScore,
        activeLayers,
      });
    }

    return {
      l1: l1Status,
      l2: l2Status,
      l3: l3Status,
      masterScore,
      activeLayers,
      nextRecommendation,
      org: orgResult ? { id: orgResult.org.id, name: orgResult.org.name } : null,
    };
  }

  /**
   * Get assessment history across all layers
   */
  static async getHistory(userId: number) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    const orgId = orgResult?.org.id;

    const history: Array<{
      id: number;
      layer: string;
      label: string;
      score: number | null;
      maturityStage: string | null;
      completedAt: Date | null;
    }> = [];

    // L1 history
    const l1Assessments = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.status, "completed")
        )
      )
      .orderBy(desc(assessments.completedOn));

    for (const a of l1Assessments) {
      history.push({
        id: a.id,
        layer: "L1",
        label: "Organisation",
        score: a.score ? a.score / 10 : null, // Convert from 0-100 to 0-10
        maturityStage: getMaturityStage(a.score ? a.score / 10 : 0),
        completedAt: a.completedOn,
      });
    }

    // L2 history
    const l2Assessments = orgId
      ? await this.l2Repo.getByOrgId(orgId)
      : await this.l2Repo.getByUserId(userId);

    for (const a of l2Assessments) {
      history.push({
        id: a.id,
        layer: "L2",
        label: `Dept: ${a.department}`,
        score: a.overallScore,
        maturityStage: a.maturityStage,
        completedAt: a.completedAt,
      });
    }

    // L3 history
    const l3Assessments = orgId
      ? await this.l3Repo.getByOrgId(orgId)
      : await this.l3Repo.getByUserId(userId);

    for (const a of l3Assessments) {
      history.push({
        id: a.id,
        layer: "L3",
        label: a.name ? `Personal: ${a.name}` : "Personal",
        score: a.overallScore,
        maturityStage: a.maturityStage,
        completedAt: a.completedAt,
      });
    }

    // Sort by date descending
    history.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

    return history;
  }

  // ── Private helpers ──────────────────────────────

  private static async getL1Status(userId: number, orgId?: number) {
    // Get latest completed L1 assessment
    const l1Assessments = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.status, "completed")
        )
      )
      .orderBy(desc(assessments.completedOn))
      .limit(1);

    const latest = l1Assessments[0];
    if (!latest) {
      return { status: "not_started" as const, score: null, date: null, count: 0 };
    }

    return {
      status: "completed" as const,
      score: latest.score ? latest.score / 10 : null, // 0-100 → 0-10
      date: latest.completedOn,
      count: l1Assessments.length,
    };
  }

  private static async getL2Status(userId: number, orgId?: number) {
    if (!orgId) {
      // No org — check if user has any L2 assessments
      const userL2 = await this.l2Repo.getByUserId(userId);
      const completed = userL2.filter((a: any) => a.status === "completed");
      const avgScore = completed.length > 0
        ? completed.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) / completed.length
        : null;

      return {
        departments: completed.map((a: any) => ({
          department: a.department,
          score: a.overallScore,
          maturityStage: a.maturityStage,
          completedAt: a.completedAt,
        })),
        completedCount: completed.length,
        totalCount: 0, // No org = no defined departments
        avgScore,
        status: completed.length > 0 ? "in_progress" as const : "not_started" as const,
      };
    }

    // Get defined departments
    const departments = await this.orgRepo.getDepartments(orgId);
    const totalCount = departments.length;

    // Get latest L2 per department
    const l2Summary = await this.l2Repo.getSummaryByOrg(orgId);
    const completedCount = l2Summary.length;

    const avgScore = completedCount > 0
      ? l2Summary.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) / completedCount
      : null;

    // Map departments with their L2 status
    const deptStatus = departments.map((dept: any) => {
      const assessment = l2Summary.find((a: any) => a.department === dept.slug);
      return {
        id: dept.id,
        name: dept.name,
        slug: dept.slug,
        headName: dept.headName,
        headEmail: dept.headEmail,
        l2Status: dept.l2Status,
        score: assessment?.overallScore || null,
        maturityStage: assessment?.maturityStage || null,
        completedAt: assessment?.completedAt || null,
      };
    });

    let status: "not_started" | "in_progress" | "completed" = "not_started";
    if (completedCount > 0 && completedCount >= totalCount) status = "completed";
    else if (completedCount > 0) status = "in_progress";

    return {
      departments: deptStatus,
      completedCount,
      totalCount,
      avgScore,
      status,
    };
  }

  private static async getL3Status(userId: number, orgId?: number) {
    if (!orgId) {
      const userL3 = await this.l3Repo.getByUserId(userId);
      const latest = userL3[0];
      return {
        teamMembers: [],
        completedCount: userL3.filter((a: any) => a.status === "completed").length,
        totalCount: 0,
        avgScore: latest?.overallScore || null,
        status: latest ? "completed" as const : "not_started" as const,
        latestScore: latest?.overallScore || null,
        latestDate: latest?.completedAt || null,
      };
    }

    const teamSummary = await this.l3Repo.getTeamSummary(orgId);
    const completedCount = teamSummary.length;
    const avgScore = completedCount > 0
      ? teamSummary.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) / completedCount
      : null;

    return {
      teamMembers: teamSummary.map((a: any) => ({
        userId: a.userId,
        name: a.name,
        department: a.department,
        score: a.overallScore,
        maturityStage: a.maturityStage,
        completedAt: a.completedAt,
      })),
      completedCount,
      totalCount: 0, // Will be set when we know total invited members
      avgScore,
      status: completedCount > 0 ? "completed" as const : "not_started" as const,
      latestScore: teamSummary[0]?.overallScore || null,
      latestDate: teamSummary[0]?.completedAt || null,
    };
  }
}

// Maturity stage helper (matches existing scoring)
function getMaturityStage(score: number): string {
  if (score <= 3.0) return "Crawl";
  if (score <= 5.5) return "Walk";
  if (score <= 8.0) return "Run";
  return "Fly";
}
