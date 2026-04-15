import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { HubService } from "../services/hub.service";

export class HubController {
  /**
   * GET /api/hub/status — Aggregated 3-layer status
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await HubService.getStatus(req.user!.id);
      return ApiResponse.success(res, status);
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/hub/history — Assessment history across all layers
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const history = await HubService.getHistory(req.user!.id);
      return ApiResponse.success(res, { history });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }
}
