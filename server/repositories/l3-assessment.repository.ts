import { db } from "../db";
import { l3Assessments } from "@shared/schema";
import { eq, and, desc, isNull, gt } from "drizzle-orm";

export class L3AssessmentRepository {
  constructor(private drizzleDb = db) {}

  async create(data: {
    userId: number;
    orgId?: number;
    name?: string;
    department?: string;
    roleLevel?: string;
    industry?: string;
    conversationHistory?: any;
    dimensionScores?: any;
    overallScore?: number;
    maturityStage?: string;
    topStrengths?: any;
    topAreasForDevelopment?: any;
    expiresAt?: Date;
    completedAt?: Date;
  }) {
    const [assessment] = await this.drizzleDb.insert(l3Assessments).values(data).returning();
    return assessment;
  }

  async getById(id: number) {
    const [assessment] = await this.drizzleDb
      .select()
      .from(l3Assessments)
      .where(eq(l3Assessments.id, id));
    return assessment || null;
  }

  async getByUserId(userId: number) {
    return this.drizzleDb
      .select()
      .from(l3Assessments)
      .where(eq(l3Assessments.userId, userId))
      .orderBy(desc(l3Assessments.createdAt));
  }

  async getByOrgId(orgId: number) {
    return this.drizzleDb
      .select()
      .from(l3Assessments)
      .where(eq(l3Assessments.orgId, orgId))
      .orderBy(desc(l3Assessments.createdAt));
  }

  async getLatestValidByUserId(userId: number) {
    // Get latest non-expired assessment
    const now = new Date();
    const [assessment] = await this.drizzleDb
      .select()
      .from(l3Assessments)
      .where(
        and(
          eq(l3Assessments.userId, userId),
          eq(l3Assessments.status, "completed"),
          // Either no expiry or not yet expired
        )
      )
      .orderBy(desc(l3Assessments.createdAt))
      .limit(1);

    if (!assessment) return null;
    // Check expiry
    if (assessment.expiresAt && new Date(assessment.expiresAt) < now) return null;
    return assessment;
  }

  async getTeamSummary(orgId: number) {
    // Get latest assessment per user in org
    const allAssessments = await this.drizzleDb
      .select()
      .from(l3Assessments)
      .where(
        and(
          eq(l3Assessments.orgId, orgId),
          eq(l3Assessments.status, "completed")
        )
      )
      .orderBy(desc(l3Assessments.createdAt));

    // Deduplicate: keep only latest per user
    const byUser = new Map<number, typeof allAssessments[0]>();
    for (const a of allAssessments) {
      if (!byUser.has(a.userId)) {
        byUser.set(a.userId, a);
      }
    }
    return Array.from(byUser.values());
  }
}
