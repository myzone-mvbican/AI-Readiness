import { db } from "../db";
import { l2Assessments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class L2AssessmentRepository {
  constructor(private drizzleDb = db) {}

  async create(data: {
    userId: number;
    orgId?: number;
    departmentId?: number;
    department: string;
    responses: any;
    overallScore?: number;
    maturityStage?: string;
    categoryScores?: any;
    topGaps?: any;
    topStrengths?: any;
    status?: string;
    completedAt?: Date;
  }) {
    const [assessment] = await this.drizzleDb.insert(l2Assessments).values(data).returning();
    return assessment;
  }

  async getById(id: number) {
    const [assessment] = await this.drizzleDb
      .select()
      .from(l2Assessments)
      .where(eq(l2Assessments.id, id));
    return assessment || null;
  }

  async getByOrgId(orgId: number) {
    return this.drizzleDb
      .select()
      .from(l2Assessments)
      .where(eq(l2Assessments.orgId, orgId))
      .orderBy(desc(l2Assessments.createdAt));
  }

  async getByUserId(userId: number) {
    return this.drizzleDb
      .select()
      .from(l2Assessments)
      .where(eq(l2Assessments.userId, userId))
      .orderBy(desc(l2Assessments.createdAt));
  }

  async getLatestByDepartment(orgId: number, department: string) {
    const [assessment] = await this.drizzleDb
      .select()
      .from(l2Assessments)
      .where(
        and(
          eq(l2Assessments.orgId, orgId),
          eq(l2Assessments.department, department),
          eq(l2Assessments.status, "completed")
        )
      )
      .orderBy(desc(l2Assessments.createdAt))
      .limit(1);
    return assessment || null;
  }

  async getSummaryByOrg(orgId: number) {
    // Get latest completed assessment per department
    const allAssessments = await this.drizzleDb
      .select()
      .from(l2Assessments)
      .where(
        and(
          eq(l2Assessments.orgId, orgId),
          eq(l2Assessments.status, "completed")
        )
      )
      .orderBy(desc(l2Assessments.createdAt));

    // Deduplicate: keep only latest per department
    const byDept = new Map<string, typeof allAssessments[0]>();
    for (const a of allAssessments) {
      if (!byDept.has(a.department)) {
        byDept.set(a.department, a);
      }
    }
    return Array.from(byDept.values());
  }
}
