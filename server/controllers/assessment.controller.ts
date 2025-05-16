import { Request, Response } from "express";
import { AssessmentModel } from "../models/assessment.model";
import { SurveyModel } from "../models/survey.model";

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
      const { surveyTemplateId, title } = req.body;

      if (!surveyTemplateId || !title) {
        return res.status(400).json({
          success: false,
          message: "Survey template ID and title are required",
        });
      }

      const survey = await SurveyModel.getById(parseInt(surveyTemplateId));

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey template not found",
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
        title,
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

      // Verify ownership
      if (existingAssessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this assessment",
        });
      }

      // Check if already completed
      if (existingAssessment.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot update a completed assessment",
        });
      }

      // Calculate score if completing
      let score = null;
      if (
        req.body.status === "completed" &&
        existingAssessment.status !== "completed"
      ) {
        const answers = req.body.answers || existingAssessment.answers;
        const answerValues = answers
          .map((a) => (typeof a.a === "number" ? a.a : null))
          .filter((value) => value !== null);

        if (answerValues.length > 0) {
          const maxPossible = answers.length * 2;
          const rawScore = answerValues.reduce((sum, val) => sum + val, 0);
          const adjustedScore =
            ((rawScore + answers.length * 2) / (answers.length * 4)) * 100;
          score = Math.round(adjustedScore);
        }
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
      const deleted = await AssessmentModel.getById(assessmentId);

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
      const { title, surveyId, email, answers, status, score } = req.body;

      if (!surveyId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assessment data. Required fields: surveyId, answers.",
        });
      }

      // Validate required fields
      if (!title || !email) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: title & email.",
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

      // Create a guest assessment
      const assessmentData = {
        title,
        surveyTemplateId,
        userId: null, // null userId for guest assessments
        email,
        answers,
        status: status || "completed",
        score: score || 0,
      };

      const assessment = await AssessmentModel.create(assessmentData);

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
}
