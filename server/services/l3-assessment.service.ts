import { L3AssessmentRepository } from "../repositories/l3-assessment.repository";
import { OrgRepository } from "../repositories/org.repository";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors";

// L3 results expire after 90 days
const L3_EXPIRY_DAYS = 90;

export class L3AssessmentService {
  private static repo = new L3AssessmentRepository();
  private static orgRepo = new OrgRepository();

  /**
   * Save a completed L3 personal assessment
   */
  static async save(userId: number, data: {
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
  }) {
    if (!data.dimensionScores && !data.overallScore) {
      throw new ValidationError("Either dimensionScores or overallScore is required");
    }

    // Get user's org (if any)
    const orgResult = await this.orgRepo.getByUserId(userId);
    const orgId = orgResult?.org.id;

    // Set expiry date (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + L3_EXPIRY_DAYS);

    const assessment = await this.repo.create({
      userId,
      orgId: orgId || undefined,
      name: data.name,
      department: data.department,
      roleLevel: data.roleLevel,
      industry: data.industry,
      conversationHistory: data.conversationHistory,
      dimensionScores: data.dimensionScores,
      overallScore: data.overallScore,
      maturityStage: data.maturityStage,
      topStrengths: data.topStrengths,
      topAreasForDevelopment: data.topAreasForDevelopment,
      expiresAt,
      completedAt: new Date(),
    });

    return assessment;
  }

  /**
   * Get all L3 assessments for a user
   */
  static async getByUserId(userId: number) {
    return this.repo.getByUserId(userId);
  }

  /**
   * Get all L3 assessments for an org
   */
  static async getByOrgId(orgId: number) {
    return this.repo.getByOrgId(orgId);
  }

  /**
   * Get a specific L3 assessment by ID (with access control)
   */
  static async getById(id: number, userId: number) {
    const assessment = await this.repo.getById(id);
    if (!assessment) throw new NotFoundError("L3 Assessment");

    // Check access: user owns it, or is in same org (owner/admin)
    if (assessment.userId === userId) return assessment;

    if (assessment.orgId) {
      const membership = await this.orgRepo.getByUserId(userId);
      if (
        membership?.org.id === assessment.orgId &&
        ["owner", "admin"].includes(membership.membership.role)
      ) {
        return assessment;
      }
    }

    throw new ForbiddenError("Access denied to this assessment");
  }

  /**
   * Get team summary: latest score per user for an org
   */
  static async getTeamSummary(orgId: number) {
    return this.repo.getTeamSummary(orgId);
  }
}
