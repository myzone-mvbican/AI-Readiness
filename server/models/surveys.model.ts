
import { storage } from "../storage";
import { Survey, SurveyWithAuthor } from "@shared/types";
import { InsertSurvey, UpdateSurvey } from "@shared/types/requests";

export class SurveysModel {
  static async getAll(teamId: number): Promise<SurveyWithAuthor[]> {
    return storage.getSurveysWithAuthors(teamId);
  }

  static async getById(id: number): Promise<Survey | undefined> {
    return storage.getSurveyById(id);
  }

  static async getWithAuthor(id: number): Promise<SurveyWithAuthor | undefined> {
    return storage.getSurveyWithAuthor(id);
  }

  static async create(surveyData: InsertSurvey): Promise<Survey> {
    return storage.createSurvey(surveyData);
  }

  static async update(id: number, surveyData: UpdateSurvey): Promise<Survey | undefined> {
    return storage.updateSurvey(id, surveyData);
  }

  static async delete(id: number): Promise<boolean> {
    return storage.deleteSurvey(id);
  }

  static async getSurveyTeams(surveyId: number): Promise<number[]> {
    return storage.getSurveyTeams(surveyId);
  }

  static async updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void> {
    return storage.updateSurveyTeams(surveyId, teamIds);
  }
}
