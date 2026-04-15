import { db } from "../db";
import { organisations, orgMembers, orgDepartments, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class OrgRepository {
  constructor(private drizzleDb = db) {}

  async create(data: {
    name: string;
    naicsCode?: string;
    naicsLabel?: string;
    employeeCount?: string;
    country?: string;
  }) {
    const [org] = await this.drizzleDb.insert(organisations).values(data).returning();
    return org;
  }

  async getById(id: number) {
    const [org] = await this.drizzleDb.select().from(organisations).where(eq(organisations.id, id));
    return org || null;
  }

  async getByUserId(userId: number) {
    // Get org through membership
    const result = await this.drizzleDb
      .select({ org: organisations, membership: orgMembers })
      .from(orgMembers)
      .innerJoin(organisations, eq(organisations.id, orgMembers.orgId))
      .where(eq(orgMembers.userId, userId))
      .limit(1);
    return result[0] || null;
  }

  async update(id: number, data: Partial<{
    name: string;
    naicsCode: string | null;
    naicsLabel: string | null;
    employeeCount: string | null;
    country: string;
    onboardingComplete: boolean;
  }>) {
    const [org] = await this.drizzleDb
      .update(organisations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    return org;
  }

  // ── Members ─────────────────────────────────────────

  async addMember(orgId: number, userId: number, role: string, department?: string) {
    const [member] = await this.drizzleDb
      .insert(orgMembers)
      .values({ orgId, userId, role, department })
      .onConflictDoUpdate({
        target: [orgMembers.orgId, orgMembers.userId],
        set: { role, department },
      })
      .returning();
    return member;
  }

  async getMembers(orgId: number) {
    return this.drizzleDb
      .select({ member: orgMembers, user: users })
      .from(orgMembers)
      .innerJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, orgId));
  }

  async getMembership(orgId: number, userId: number) {
    const [membership] = await this.drizzleDb
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
    return membership || null;
  }

  // ── Departments ──────────────────────────────────────

  async setDepartments(orgId: number, departments: Array<{ name: string; slug: string }>) {
    // Upsert departments — insert new ones, keep existing ones
    const results = [];
    for (const dept of departments) {
      const [result] = await this.drizzleDb
        .insert(orgDepartments)
        .values({ orgId, name: dept.name, slug: dept.slug })
        .onConflictDoUpdate({
          target: [orgDepartments.orgId, orgDepartments.slug],
          set: { name: dept.name, updatedAt: new Date() },
        })
        .returning();
      results.push(result);
    }
    return results;
  }

  async removeDepartments(orgId: number, slugs: string[]) {
    for (const slug of slugs) {
      await this.drizzleDb
        .delete(orgDepartments)
        .where(and(eq(orgDepartments.orgId, orgId), eq(orgDepartments.slug, slug)));
    }
  }

  async getDepartments(orgId: number) {
    return this.drizzleDb
      .select()
      .from(orgDepartments)
      .where(eq(orgDepartments.orgId, orgId))
      .orderBy(orgDepartments.name);
  }

  async getDepartmentById(id: number) {
    const [dept] = await this.drizzleDb.select().from(orgDepartments).where(eq(orgDepartments.id, id));
    return dept || null;
  }

  async updateDepartment(id: number, data: Partial<{
    headUserId: number | null;
    headName: string | null;
    headEmail: string | null;
    l2Status: string;
  }>) {
    const [dept] = await this.drizzleDb
      .update(orgDepartments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orgDepartments.id, id))
      .returning();
    return dept;
  }
}
