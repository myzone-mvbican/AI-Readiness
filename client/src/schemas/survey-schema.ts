import { z } from "zod";

// Basic types for survey data
export type SurveyQuestion = {
  number: number;
  category: string;
  question: string;
  details: string;
};

export type SurveySection = {
  category: string;
  questions: SurveyQuestion[];
};

// Type for radio options
export const ratingOptions = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

export type RatingOption = typeof ratingOptions[number];

// Type for a single question response
export type QuestionResponse = {
  questionNumber: number;
  category: string;
  question: string;
  answer: RatingOption;
};

// Create dynamic Zod schema based on questions
export const createSurveyStepSchema = (questions: SurveyQuestion[]) => {
  const schemaFields: Record<string, z.ZodType<any>> = {};
  
  questions.forEach((question) => {
    schemaFields[`question_${question.number}`] = z.enum(ratingOptions, {
      required_error: `Please answer question ${question.number}`,
    });
  });
  
  return z.object(schemaFields);
};

// Type for survey step form values
export type SurveyStepFormValues = Record<string, RatingOption>;

// Type for overall survey form values
export type SurveySummary = Record<string, SurveyStepFormValues>;