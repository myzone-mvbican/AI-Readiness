import { db } from "../db";
import { healthScores } from "@shared/schema";
import { eq } from "drizzle-orm";

export class HealthScoreRepository {
  constructor(private drizzleDb = db) {}

  async upsert(orgId: number, data: {
    l1Score?: number | null;
    l2AvgScore?: number | null;
    l3AvgScore?: number | null;
    masterScore?: number | null;
    activeLayers?: number;
    industryGrade?: string | null;
    industryPercentile?: number | null;
    trend?: string | null;
  }) {
    const [result] = await this.drizzleDb
      .insert(healthScores)
      .values({ orgId, ...data, computedAt: new Date() })
      .onConflictDoUpdate({
        target: healthScores.orgId,
        set: { ...data, computedAt: new Date() },
      })
      .returning();
    return result;
  }

  async getByOrgId(orgId: number) {
    const [score] = await this.drizzleDb
      .select()
      .from(healthScores)
      .where(eq(healthScores.orgId, orgId));
    return score || null;
  }
}
