import { db } from "../db";
import { invitations } from "@shared/schema";
import { eq, and, lt, desc } from "drizzle-orm";
import crypto from "crypto";

export class InvitationRepository {
  constructor(private drizzleDb = db) {}

  async create(data: {
    orgId: number;
    invitedByUserId: number;
    email: string;
    name?: string;
    role: string;
    department?: string;
    expiresAt?: Date;
  }) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await this.drizzleDb
      .insert(invitations)
      .values({ ...data, token, expiresAt })
      .returning();
    return invitation;
  }

  async getByToken(token: string) {
    const [invitation] = await this.drizzleDb
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));
    return invitation || null;
  }

  async getById(id: number) {
    const [invitation] = await this.drizzleDb
      .select()
      .from(invitations)
      .where(eq(invitations.id, id));
    return invitation || null;
  }

  async getByOrgId(orgId: number) {
    return this.drizzleDb
      .select()
      .from(invitations)
      .where(eq(invitations.orgId, orgId))
      .orderBy(desc(invitations.createdAt));
  }

  async markAccepted(id: number) {
    const [updated] = await this.drizzleDb
      .update(invitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(invitations.id, id))
      .returning();
    return updated;
  }

  async refreshToken(id: number) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [updated] = await this.drizzleDb
      .update(invitations)
      .set({ token, expiresAt, status: "pending" })
      .where(eq(invitations.id, id))
      .returning();
    return updated;
  }

  async delete(id: number) {
    await this.drizzleDb.delete(invitations).where(eq(invitations.id, id));
    return true;
  }

  async expireOld() {
    // Mark expired invitations
    await this.drizzleDb
      .update(invitations)
      .set({ status: "expired" })
      .where(
        and(
          eq(invitations.status, "pending"),
          lt(invitations.expiresAt, new Date())
        )
      );
  }
}
