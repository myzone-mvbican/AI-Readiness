import { L2AssessmentRepository } from "../repositories/l2-assessment.repository";
import { OrgRepository } from "../repositories/org.repository";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors";

export class L2AssessmentService {
  private static repo = new L2AssessmentRepository();
  private static orgRepo = new OrgRepository();

  /**
   * Save a completed L2 department assessment
   */
  static async save(userId: number, data: {
    department: string;
    responses: any;
    overallScore?: number;
    maturityStage?: string;
    categoryScores?: any;
    topGaps?: any;
    topStrengths?: any;
  }) {
    if (!data.department) throw new ValidationError("Department is required");
    if (!data.responses) throw new ValidationError("Responses are required");

    // Get user's org (if any)
    const orgResult = await this.orgRepo.getByUserId(userId);
    const orgId = orgResult?.org.id;

    // Find matching department record (if org exists)
    let departmentId: number | undefined;
    if (orgId) {
      const departments = await this.orgRepo.getDepartments(orgId);
      const match = departments.find((d: any) => d.slug === data.department);
      departmentId = match?.id;
    }

    const assessment = await this.repo.create({
      userId,
      orgId: orgId || undefined,
      departmentId,
      department: data.department,
      responses: data.responses,
      overallScore: data.overallScore,
      maturityStage: data.maturityStage,
      categoryScores: data.categoryScores,
      topGaps: data.topGaps,
      topStrengths: data.topStrengths,
      status: "completed",
      completedAt: new Date(),
    });

    // Update department status if linked to an org
    if (departmentId) {
      await this.orgRepo.updateDepartment(departmentId, { l2Status: "completed" });
    }

    return assessment;
  }

  /**
   * Get all L2 assessments for a user
   */
  static async getByUserId(userId: number) {
    return this.repo.getByUserId(userId);
  }

  /**
   * Get all L2 assessments for an org
   */
  static async getByOrgId(orgId: number) {
    return this.repo.getByOrgId(orgId);
  }

  /**
   * Get a specific L2 assessment by ID (with access control)
   */
  static async getById(id: number, userId: number) {
    const assessment = await this.repo.getById(id);
    if (!assessment) throw new NotFoundError("L2 Assessment");

    // Check access: user owns it, or is in same org
    if (assessment.userId === userId) return assessment;

    if (assessment.orgId) {
      const membership = await this.orgRepo.getByUserId(userId);
      if (membership?.org.id === assessment.orgId) return assessment;
    }

    throw new ForbiddenError("Access denied to this assessment");
  }

  /**
   * Get summary: latest score per department for an org
   */
  static async getSummary(orgId: number) {
    return this.repo.getSummaryByOrg(orgId);
  }
}
