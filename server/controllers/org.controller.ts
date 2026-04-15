import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { OrgService } from "../services/org.service";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../utils/errors";

export class OrgController {
  /**
   * POST /api/org — Create organisation
   */
  static async create(req: Request, res: Response) {
    try {
      const { name, naicsCode, naicsLabel, employeeCount, country } = req.body;
      if (!name) return ApiResponse.validationError(res, { name: "Required" });

      const org = await OrgService.createOrg(req.user!.id, {
        name, naicsCode, naicsLabel, employeeCount, country,
      });
      return ApiResponse.success(res, { org }, 201);
    } catch (error: any) {
      if (error instanceof ConflictError) return ApiResponse.conflict(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/org — Get current user's organisation
   */
  static async get(req: Request, res: Response) {
    try {
      const org = await OrgService.getOrgForUser(req.user!.id);
      if (!org) return ApiResponse.success(res, { org: null });
      return ApiResponse.success(res, { org });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * PUT /api/org — Update organisation
   */
  static async update(req: Request, res: Response) {
    try {
      const org = await OrgService.updateOrg(req.user!.id, req.body);
      return ApiResponse.success(res, { org });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * POST /api/org/departments — Set departments (checkbox list from onboarding)
   */
  static async setDepartments(req: Request, res: Response) {
    try {
      const { departments } = req.body; // Array of slug strings
      if (!Array.isArray(departments) || departments.length === 0) {
        return ApiResponse.validationError(res, { departments: "At least one department required" });
      }

      const result = await OrgService.setDepartments(req.user!.id, departments);
      return ApiResponse.success(res, { departments: result });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/org/departments — Get organisation departments
   */
  static async getDepartments(req: Request, res: Response) {
    try {
      const departments = await OrgService.getDepartments(req.user!.id);
      return ApiResponse.success(res, { departments });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * PUT /api/org/departments/:id — Update a department (assign head, etc.)
   */
  static async updateDepartment(req: Request, res: Response) {
    try {
      const departmentId = parseInt(req.params.id);
      if (isNaN(departmentId)) return ApiResponse.validationError(res, { id: "Invalid ID" });

      const { headName, headEmail } = req.body;
      const department = await OrgService.assignDepartmentHead(
        req.user!.id, departmentId, { name: headName, email: headEmail }
      );
      return ApiResponse.success(res, { department });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, error.message);
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/org/members — List org members
   */
  static async getMembers(req: Request, res: Response) {
    try {
      const members = await OrgService.getMembers(req.user!.id);
      return ApiResponse.success(res, {
        members: members.map((m: any) => ({
          id: m.member.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.member.role,
          department: m.member.department,
          joinedAt: m.member.joinedAt,
        })),
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/org/standard-departments — List of standard departments (for onboarding)
   */
  static async getStandardDepartments(_req: Request, res: Response) {
    return ApiResponse.success(res, { departments: OrgService.getStandardDepartments() });
  }
}
