import { InvitationRepository } from "../repositories/invitation.repository";
import { OrgRepository } from "../repositories/org.repository";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../utils/errors";

export interface InvitationInput {
  email: string;
  name?: string;
  role: "dept_head" | "member";
  department?: string;
}

export class InvitationService {
  private static repo = new InvitationRepository();
  private static orgRepo = new OrgRepository();

  /**
   * Send batch invitations (from org owner/admin)
   */
  static async sendInvitations(userId: number, invitationInputs: InvitationInput[]) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    if (!orgResult) throw new NotFoundError("Organisation");

    const { org, membership } = orgResult;
    if (!["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only org owners and admins can send invitations");
    }

    const results = [];
    for (const input of invitationInputs) {
      if (!input.email) throw new ValidationError("Email is required for each invitation");
      if (!["dept_head", "member"].includes(input.role)) {
        throw new ValidationError(`Invalid role: ${input.role}`);
      }
      if (input.role === "dept_head" && !input.department) {
        throw new ValidationError("Department is required for dept_head invitations");
      }

      const invitation = await this.repo.create({
        orgId: org.id,
        invitedByUserId: userId,
        email: input.email,
        name: input.name,
        role: input.role,
        department: input.department,
      });

      // TODO: Send email via EmailService
      // For now, just create the invitation record

      results.push(invitation);
    }

    return results;
  }

  /**
   * List all invitations for user's org
   */
  static async listForOrg(userId: number) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    if (!orgResult) throw new NotFoundError("Organisation");

    // Expire old invitations first
    await this.repo.expireOld();

    return this.repo.getByOrgId(orgResult.org.id);
  }

  /**
   * Validate an invitation token (public endpoint)
   */
  static async validateToken(token: string) {
    const invitation = await this.repo.getByToken(token);
    if (!invitation) throw new NotFoundError("Invitation");

    if (invitation.status === "accepted") {
      throw new ValidationError("This invitation has already been accepted");
    }
    if (invitation.status === "expired" || new Date(invitation.expiresAt) < new Date()) {
      throw new ValidationError("This invitation has expired");
    }

    // Get org name for display
    const org = await this.orgRepo.getById(invitation.orgId);

    return {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        department: invitation.department,
        orgName: org?.name || "Unknown",
      },
    };
  }

  /**
   * Accept an invitation (creates org membership)
   */
  static async acceptInvitation(token: string, userId: number) {
    const invitation = await this.repo.getByToken(token);
    if (!invitation) throw new NotFoundError("Invitation");

    if (invitation.status !== "pending") {
      throw new ValidationError("This invitation is no longer valid");
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new ValidationError("This invitation has expired");
    }

    // Add user to org
    await this.orgRepo.addMember(
      invitation.orgId,
      userId,
      invitation.role,
      invitation.department
    );

    // If dept_head, update the department record
    if (invitation.role === "dept_head" && invitation.department) {
      const departments = await this.orgRepo.getDepartments(invitation.orgId);
      const dept = departments.find((d: any) => d.slug === invitation.department);
      if (dept) {
        await this.orgRepo.updateDepartment(dept.id, { headUserId: userId });
      }
    }

    // Mark invitation as accepted
    await this.repo.markAccepted(invitation.id);

    return { orgId: invitation.orgId, role: invitation.role, department: invitation.department };
  }

  /**
   * Resend an invitation (refresh token + re-send email)
   */
  static async resendInvitation(userId: number, invitationId: number) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    if (!orgResult) throw new NotFoundError("Organisation");

    const invitation = await this.repo.getById(invitationId);
    if (!invitation || invitation.orgId !== orgResult.org.id) {
      throw new NotFoundError("Invitation");
    }

    if (invitation.status === "accepted") {
      throw new ValidationError("Cannot resend an accepted invitation");
    }

    const updated = await this.repo.refreshToken(invitationId);

    // TODO: Send email via EmailService

    return updated;
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(userId: number, invitationId: number) {
    const orgResult = await this.orgRepo.getByUserId(userId);
    if (!orgResult) throw new NotFoundError("Organisation");

    const { org, membership } = orgResult;
    if (!["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only org owners and admins can cancel invitations");
    }

    const invitation = await this.repo.getById(invitationId);
    if (!invitation || invitation.orgId !== org.id) {
      throw new NotFoundError("Invitation");
    }

    return this.repo.delete(invitationId);
  }
}
