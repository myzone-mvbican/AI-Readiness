import { OrgRepository } from "../repositories/org.repository";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../utils/errors";

// Standard department list
export const STANDARD_DEPARTMENTS = [
  { name: "Marketing", slug: "marketing" },
  { name: "Sales", slug: "sales" },
  { name: "Engineering", slug: "engineering" },
  { name: "HR", slug: "hr" },
  { name: "Finance", slug: "finance" },
  { name: "Operations", slug: "operations" },
  { name: "IT", slug: "it" },
  { name: "Customer Support", slug: "customer-support" },
  { name: "Legal", slug: "legal" },
  { name: "Procurement", slug: "procurement" },
  { name: "Design", slug: "design" },
  { name: "Product", slug: "product" },
] as const;

export class OrgService {
  private static orgRepo = new OrgRepository();

  /**
   * Create a new organisation and set the creating user as owner
   */
  static async createOrg(userId: number, data: {
    name: string;
    naicsCode?: string;
    naicsLabel?: string;
    employeeCount?: string;
    country?: string;
  }) {
    // Check if user already has an org
    const existing = await this.orgRepo.getByUserId(userId);
    if (existing) {
      throw new ConflictError("User already belongs to an organisation");
    }

    // Create org
    const org = await this.orgRepo.create(data);

    // Add user as owner
    await this.orgRepo.addMember(org.id, userId, "owner");

    // Update user's orgId
    await db.update(users).set({ orgId: org.id }).where(eq(users.id, userId));

    return org;
  }

  /**
   * Get organisation for current user
   */
  static async getOrgForUser(userId: number) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) return null;
    return {
      ...result.org,
      membership: result.membership,
    };
  }

  /**
   * Update organisation (owner/admin only)
   */
  static async updateOrg(userId: number, data: Partial<{
    name: string;
    naicsCode: string | null;
    naicsLabel: string | null;
    employeeCount: string | null;
    country: string;
    onboardingComplete: boolean;
  }>) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) throw new NotFoundError("Organisation");

    const { org, membership } = result;
    if (!["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only org owners and admins can update organisation settings");
    }

    return this.orgRepo.update(org.id, data);
  }

  /**
   * Set departments for an org (the checkbox selection from onboarding)
   */
  static async setDepartments(userId: number, departmentSlugs: string[]) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) throw new NotFoundError("Organisation");

    const { org, membership } = result;
    if (!["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only org owners and admins can configure departments");
    }

    // Validate slugs against standard list + allow custom
    const departments = departmentSlugs.map(slug => {
      const standard = STANDARD_DEPARTMENTS.find(d => d.slug === slug);
      if (standard) return { name: standard.name, slug: standard.slug };
      // Custom department — capitalize slug for display name
      return {
        name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        slug,
      };
    });

    // Get current departments to find which to remove
    const currentDepts = await this.orgRepo.getDepartments(org.id);
    const currentSlugs = currentDepts.map((d: any) => d.slug);
    const newSlugs = departments.map((d: { slug: string }) => d.slug);
    const toRemove = currentSlugs.filter((s: string) => !newSlugs.includes(s));

    // Set new departments
    const saved = await this.orgRepo.setDepartments(org.id, departments);

    // Remove departments that were unchecked (only if they have no completed assessments)
    if (toRemove.length > 0) {
      // For now, remove them. In future, check if they have L2 assessments first.
      await this.orgRepo.removeDepartments(org.id, toRemove);
    }

    return saved;
  }

  /**
   * Get departments for an org
   */
  static async getDepartments(userId: number) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) throw new NotFoundError("Organisation");
    return this.orgRepo.getDepartments(result.org.id);
  }

  /**
   * Assign a department head
   */
  static async assignDepartmentHead(userId: number, departmentId: number, head: {
    name: string;
    email: string;
  }) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) throw new NotFoundError("Organisation");

    const { org, membership } = result;
    if (!["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only org owners and admins can assign department heads");
    }

    const dept = await this.orgRepo.getDepartmentById(departmentId);
    if (!dept || dept.orgId !== org.id) {
      throw new NotFoundError("Department");
    }

    return this.orgRepo.updateDepartment(departmentId, {
      headName: head.name,
      headEmail: head.email,
    });
  }

  /**
   * Get org members
   */
  static async getMembers(userId: number) {
    const result = await this.orgRepo.getByUserId(userId);
    if (!result) throw new NotFoundError("Organisation");
    return this.orgRepo.getMembers(result.org.id);
  }

  /**
   * Get list of standard departments (for onboarding UI)
   */
  static getStandardDepartments() {
    return STANDARD_DEPARTMENTS;
  }
}
