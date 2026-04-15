import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { InvitationService } from "../services/invitation.service";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors";

export class InvitationController {
  /**
   * POST /api/org/invitations — Send batch invitations
   */
  static async send(req: Request, res: Response) {
    try {
      const { invitations: inputs } = req.body;
      if (!Array.isArray(inputs) || inputs.length === 0) {
        return ApiResponse.validationError(res, { invitations: "At least one invitation required" });
      }

      const results = await InvitationService.sendInvitations(req.user!.id, inputs);
      return ApiResponse.success(res, { invitations: results }, 201);
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      if (error instanceof ValidationError) return ApiResponse.validationError(res, {}, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/org/invitations — List all invitations for user's org
   */
  static async list(req: Request, res: Response) {
    try {
      const invitations = await InvitationService.listForOrg(req.user!.id);
      return ApiResponse.success(res, { invitations });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Organisation");
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/invite/:token — Validate invitation token (public)
   */
  static async validate(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) return ApiResponse.validationError(res, { token: "Required" });

      const result = await InvitationService.validateToken(token);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Invitation");
      if (error instanceof ValidationError) return ApiResponse.validationError(res, {}, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * POST /api/invite/:token/accept — Accept invitation
   */
  static async accept(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) return ApiResponse.validationError(res, { token: "Required" });

      const result = await InvitationService.acceptInvitation(token, req.user!.id);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Invitation");
      if (error instanceof ValidationError) return ApiResponse.validationError(res, {}, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * POST /api/org/invitations/:id/resend — Resend invitation
   */
  static async resend(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return ApiResponse.validationError(res, { id: "Invalid ID" });

      const invitation = await InvitationService.resendInvitation(req.user!.id, id);
      return ApiResponse.success(res, { invitation });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Invitation");
      if (error instanceof ValidationError) return ApiResponse.validationError(res, {}, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * DELETE /api/org/invitations/:id — Cancel invitation
   */
  static async cancel(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return ApiResponse.validationError(res, { id: "Invalid ID" });

      await InvitationService.cancelInvitation(req.user!.id, id);
      return ApiResponse.success(res, { deleted: true });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "Invitation");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }
}
