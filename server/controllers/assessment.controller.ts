import { Request, Response } from "express";
import { AssessmentModel } from "../models/assessment.model";
import { SurveyModel } from "../models/survey.model";
import { CompletionService } from "../services/completion.service";
import { getScore, formatDate } from "@/lib/utils";

export class AssessmentController {
  static async getAll(req: Request, res: Response) {
    try {
      const assessments = await AssessmentModel.getByUserId(req.user!.id);

      return res.status(200).json({
        success: true,
        assessments,
      });
    } catch (error) {
      console.error("Error fetching assessments:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assessments",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID",
        });
      }

      const assessment = await AssessmentModel.getWithSurveyInfo(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found",
        });
      }

      // Verify ownership
      if (assessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this assessment",
        });
      }

      return res.status(200).json({
        success: true,
        assessment,
      });
    } catch (error) {
      console.error("Error fetching assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assessment",
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { surveyTemplateId } = req.body;

      if (!surveyTemplateId) {
        return res.status(400).json({
          success: false,
          message: "Survey template ID is required",
        });
      }

      const survey = await SurveyModel.getById(parseInt(surveyTemplateId));

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey template not found",
        });
      }

      // Check completion limits before creating assessment
      const completionCheck = await CompletionService.canUserTakeSurvey(
        parseInt(surveyTemplateId),
        req.user!.id,
        undefined,
      );

      if (!completionCheck.canTake) {
        return res.status(400).json({
          success: false,
          message:
            completionCheck.message ||
            "You have reached the completion limit for this survey",
        });
      }

      // Create blank answers array
      const blankAnswers = Array.from(
        { length: survey.questionsCount },
        (_, i) => ({
          q: i + 1,
        }),
      );

      const newAssessment = await AssessmentModel.create({
        title: `${survey.title} - ${formatDate(new Date())}`,
        surveyTemplateId: parseInt(surveyTemplateId),
        userId: req.user!.id,
        status: "draft",
        answers: blankAnswers,
      });

      return res.status(201).json({
        success: true,
        assessment: newAssessment,
      });
    } catch (error) {
      console.error("Error creating assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create assessment",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID",
        });
      }

      const existingAssessment = await AssessmentModel.getById(assessmentId);

      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found",
        });
      }

      // Verify ownership - but allow certain fields to be updated
      // without strict ownership checks (like recommendations for AI-generated content)
      const isUpdatingOnlyRecommendations =
        Object.keys(req.body).length === 1 &&
        typeof req.body.recommendations === "string";

      // If only updating recommendations, preserve the existing score
      if (isUpdatingOnlyRecommendations && existingAssessment.score) {
        req.body.score = existingAssessment.score;
      }

      // Skip ownership check if only updating recommendations field
      // This allows our AI service to update recommendations
      if (
        !isUpdatingOnlyRecommendations &&
        existingAssessment.userId !== req.user?.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this assessment",
        });
      }

      // Check if already completed
      if (
        !isUpdatingOnlyRecommendations &&
        existingAssessment.status === "completed"
      ) {
        return res.status(400).json({
          success: false,
          message: "Cannot update a completed assessment",
        });
      }

      // Check completion limits when trying to complete an assessment
      if (
        !isUpdatingOnlyRecommendations &&
        req.body.status === "completed" &&
        existingAssessment.status !== "completed"
      ) {
        // Get survey to check if it has completion limits
        const survey = await SurveyModel.getById(
          existingAssessment.surveyTemplateId,
        );

        if (survey && survey.completionLimit) {
          const completionCheck = await CompletionService.canUserTakeSurvey(
            existingAssessment.surveyTemplateId,
            req.user?.id,
            undefined,
            assessmentId, // Exclude current assessment from count since it's changing status
          );

          // Check if completing this assessment would exceed the limit
          // Add 1 to account for this assessment becoming completed
          if (completionCheck.completionCount + 1 > survey.completionLimit) {
            return res.status(400).json({
              success: false,
              message: `You have reached the completion limit for this survey (${completionCheck.completionCount + 1}/${survey.completionLimit})`,
            });
          }
        }
      }

      // Calculate score if completing only
      let score = null;
      if (
        req.body.status === "completed" ||
        existingAssessment.status === "completed"
      ) {
        score = getScore(req.body.answers || existingAssessment.answers);
      }

      const updatedAssessment = await AssessmentModel.update(assessmentId, {
        ...req.body,
        score,
      });

      return res.status(200).json({
        success: true,
        assessment: updatedAssessment,
      });
    } catch (error) {
      console.error("Error updating assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update assessment",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID",
        });
      }

      // Get the assessment to verify ownership
      const assessment = await AssessmentModel.getById(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found",
        });
      }

      // Verify ownership
      if (assessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this assessment",
        });
      }

      // Delete the assessment
      const deleted = await AssessmentModel.delete(assessmentId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete assessment",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Assessment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete assessment",
      });
    }
  }

  static async createGuest(req: Request, res: Response) {
    try {
      const { surveyId, guestData, answers, status } = req.body;

      if (!surveyId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assessment data. Required fields: surveyId, answers.",
        });
      }

      // Validate required fields
      if (!answers || !guestData) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: answers & guestData.",
        });
      }

      // Parse surveyId to number if it's a string
      const surveyTemplateId = parseInt(surveyId);

      if (isNaN(surveyTemplateId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid surveyId: must be a number.",
        });
      }

      const survey = await SurveyModel.getById(surveyTemplateId);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey template not found",
        });
      }

      // Check completion limits for guest users
      const guestEmail = guestData?.email;
      if (guestEmail) {
        const completionCheck = await CompletionService.canUserTakeSurvey(
          surveyTemplateId,
          undefined,
          guestEmail,
        );

        if (!completionCheck.canTake) {
          return res.status(400).json({
            success: false,
            message:
              completionCheck.message ||
              "You have reached the completion limit for this survey",
          });
        }
      }

      // Create a guest assessment
      const assessmentData = {
        title: `${survey.title} - ${formatDate(new Date())}`,
        surveyTemplateId,
        userId: null, // null userId for guest assessments
        guest: JSON.stringify(guestData), // Store guest data as JSON string
        answers,
        completedOn: new Date(),
        status: status || "completed",
        score: getScore(answers),
      };

      const assessment = await AssessmentModel.create(assessmentData);

      if (assessment) {
        (assessment as any).survey = survey;
      }

      return res.status(201).json({
        success: true,
        message: "Guest assessment created successfully",
        assessment,
      });
    } catch (error) {
      console.error("Error creating guest assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create guest assessment",
      });
    }
  }

  static async updateGuest(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      const { recommendations } = req.body;

      // 1. Validate required fields
      if (!recommendations) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: recommendations",
        });
      }

      // 2. Field-level validation - Ensure only recommendations field is being updated
      const allowedFields = ["recommendations"];
      const requestFields = Object.keys(req.body);

      const unauthorizedFields = requestFields.filter(
        (field) => !allowedFields.includes(field),
      );
      if (unauthorizedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized fields in request: ${unauthorizedFields.join(", ")}. Only 'recommendations' field can be updated.`,
        });
      }

      // 3. Get existing assessment
      const existingAssessment =
        await AssessmentModel.getWithSurveyInfo(assessmentId);
      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found",
        });
      }

      // 4. Guest-only validation - Verify this is a guest assessment (userId must be null)
      if (existingAssessment.userId !== null) {
        return res.status(403).json({
          success: false,
          message: "This endpoint can only be used for guest assessments",
        });
      }

      // 5. Validate this is a guest assessment with guest data
      if (!existingAssessment.guest) {
        return res.status(403).json({
          success: false,
          message: "Invalid guest assessment - no guest data found",
        });
      }

      // Update the assessment with recommendations
      const updatedAssessment = await AssessmentModel.update(assessmentId, {
        recommendations,
      });

      if (!updatedAssessment) {
        return res.status(500).json({
          success: false,
          message: "Failed to update assessment",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Assessment updated successfully",
        assessment: updatedAssessment,
      });
    } catch (error) {
      console.error("Error updating guest assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update guest assessment",
      });
    }
  }
}
