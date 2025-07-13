import { db } from "../db";
import { assessments, surveyStats, users, surveys } from "@shared/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

interface BenchmarkData {
  quarter: string;
  industry: string;
  categories: {
    name: string;
    userScore: number;
    industryAverage: number | null;
    globalAverage: number | null;
  }[];
}

export class BenchmarkService {
  /**
   * Get current quarter string in format "YYYY-QX"
   */
  static getCurrentQuarter(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  }

  /**
   * Get quarter date range for SQL queries
   */
  static getQuarterDateRange(quarter: string): { start: Date; end: Date } {
    const [year, q] = quarter.split("-Q");
    const yearNum = parseInt(year);
    const quarterNum = parseInt(q);

    const startMonth = (quarterNum - 1) * 3;
    const endMonth = quarterNum * 3;

    const start = new Date(yearNum, startMonth, 1);
    const end = new Date(yearNum, endMonth, 0, 23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Check if assessment should be excluded from benchmarking
   */
  static shouldExcludeAssessment(assessment: any): boolean {
    if (!assessment.answers || !assessment.completedOn) return true;

    try {
      const answers = JSON.parse(assessment.answers);

      // Exclude if all answers are the same (indicates dummy/test data)
      const uniqueValues = new Set(answers.map((a: any) => a.a));
      if (uniqueValues.size === 1) return true;

      return false;
    } catch (error) {
      console.error("Error parsing assessment answers:", error);
      return true;
    }
  }

  /**
   * Get industry statistics with hierarchical NAICS fallback
   * Tries exact match first, then progressively broader NAICS categories
   */
  static async getIndustryStatsWithFallback(
    allStats: any[],
    industry: string
  ): Promise<any[]> {
    if (!industry) {
      return [];
    }

    // Helper function to get NAICS hierarchy levels
    const getNAICSHierarchy = (code: string): string[] => {
      const hierarchy: string[] = [];
      
      // Start with the exact code
      hierarchy.push(code);
      
      // For numeric NAICS codes, create hierarchy by removing digits from right
      if (/^\d+$/.test(code)) {
        let currentCode = code;
        while (currentCode.length > 1) {
          currentCode = currentCode.slice(0, -1);
          hierarchy.push(currentCode);
        }
      }
      
      // For special cases like "31-33" (Manufacturing), try some common patterns
      if (code.includes("-")) {
        const basePart = code.split("-")[0];
        if (/^\d+$/.test(basePart)) {
          let currentCode = basePart;
          while (currentCode.length > 1) {
            currentCode = currentCode.slice(0, -1);
            hierarchy.push(currentCode);
          }
        }
      }
      
      return hierarchy;
    };

    const hierarchyLevels = getNAICSHierarchy(industry);
    
    // Try each level in the hierarchy until we find statistics
    for (const level of hierarchyLevels) {
      const statsForLevel = allStats.filter((s) => s.industry === level);
      if (statsForLevel.length > 0) {
        console.log(`Found industry stats for ${industry} using hierarchy level: ${level}`);
        return statsForLevel;
      }
    }
    
    console.log(`No industry stats found for ${industry} in any hierarchy level`);
    return [];
  }

  /**
   * Get user industry from assessment (guest or authenticated user)
   */
  static getUserIndustry(assessment: any, user: any): string | null {
    // For guest assessments, parse guest data
    if (assessment.guest && !assessment.userId) {
      try {
        const guestData = JSON.parse(assessment.guest);
        return guestData.industry || null;
      } catch (error) {
        console.error("Error parsing guest data:", error);
        return null;
      }
    }

    // For authenticated users
    return user?.industry || null;
  }

  /**
   * Get user company size from assessment (guest or authenticated user)
   */
  static getUserCompanySize(assessment: any, user: any): string | null {
    // For guest assessments, parse guest data
    if (assessment.guest && !assessment.userId) {
      try {
        const guestData = JSON.parse(assessment.guest);
        return guestData.employeeCount || null;
      } catch (error) {
        console.error("Error parsing guest data:", error);
        return null;
      }
    }

    // For authenticated users
    return user?.employeeCount || null;
  }

  /**
   * Create segment key for more granular benchmarking
   */
  static createSegmentKey(
    industry: string,
    companySize: string | null,
  ): string {
    if (!companySize) return industry;
    return `${industry}|${companySize}`;
  }

  /**
   * Calculate category scores from assessment answers using the same logic as generateRecommendations.ts
   */
  static async calculateCategoryScores(
    answers: any[],
    surveyId: number,
  ): Promise<Record<string, number>> {
    try {
      // Get the survey questions to determine category mapping
      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, surveyId))
        .limit(1);
      if (!survey.length) {
        console.error("Survey not found:", surveyId);
        return {};
      }

      // For now, use the categories visible in your actual assessment results
      const realCategories = [
        "Strategy & Vision",
        "Financial & Resources",
        "Culture & Change-Readiness",
        "Governance, Ethics & Risk",
        "Skills & Literacy",
        "Process & Operations",
        "Data & Information",
        "Technology & Integration",
      ];

      const categoryScores: Record<string, number> = {};
      const answersPerCategory = Math.ceil(
        answers.length / realCategories.length,
      );

      realCategories.forEach((category, index) => {
        const startIndex = index * answersPerCategory;
        const endIndex = Math.min(
          (index + 1) * answersPerCategory,
          answers.length,
        );
        const categoryAnswers = answers.slice(startIndex, endIndex);

        if (categoryAnswers.length > 0) {
          // Use the same scoring logic as utils.ts getScore function
          const rawScore = categoryAnswers.reduce((sum, answer) => {
            const answerValue = answer.a || answer.value || 0;
            return sum + answerValue;
          }, 0);

          // Apply the same formula as utils.ts: ((rawScore + length * 2) / (length * 4)) * 100
          const adjustedScore =
            ((rawScore + categoryAnswers.length * 2) /
              (categoryAnswers.length * 4)) *
            100;
          categoryScores[category] = Math.round(adjustedScore); // Keep as 0-100 scale rounded
        }
      });

      return categoryScores;
    } catch (error) {
      console.error("Error calculating category scores:", error);
      return {};
    }
  }

  /**
   * Recalculate survey statistics for all industries and quarters
   */
  static async recalculateSurveyStats(): Promise<void> {
    console.log("Starting survey statistics recalculation...");

    try {
      const currentQuarter = this.getCurrentQuarter();
      const { start, end } = this.getQuarterDateRange(currentQuarter);

      // Get all completed assessments in current quarter with user data
      const completedAssessments = await db
        .select({
          assessment: assessments,
          user: users,
        })
        .from(assessments)
        .leftJoin(users, eq(assessments.userId, users.id))
        .where(
          and(
            eq(assessments.status, "completed"),
            isNotNull(assessments.completedOn),
            gte(assessments.completedOn, start),
            lte(assessments.completedOn, end),
          ),
        );

      console.log(
        `Found ${completedAssessments.length} completed assessments in ${currentQuarter}`,
      );

      // Filter out excluded assessments
      const validAssessments = completedAssessments.filter(
        ({ assessment }) => !this.shouldExcludeAssessment(assessment),
      );

      console.log(
        `${validAssessments.length} assessments passed quality filters`,
      );

      // Group assessments by industry and survey template
      const groupedData: Record<string, Record<number, any[]>> = {};

      validAssessments.forEach(({ assessment, user }) => {
        const industry = this.getUserIndustry(assessment, user) || "Unknown";
        const companySize = this.getUserCompanySize(assessment, user);
        const segmentKey = this.createSegmentKey(industry, companySize);
        const surveyId = assessment.surveyTemplateId;

        // Group by both industry and segment for more detailed benchmarking
        if (!groupedData[industry]) {
          groupedData[industry] = {};
        }
        if (!groupedData[industry][surveyId]) {
          groupedData[industry][surveyId] = [];
        }

        groupedData[industry][surveyId].push({ assessment, user, segmentKey });
      });

      // Process each industry and calculate stats
      for (const [industry, surveyGroups] of Object.entries(groupedData)) {
        for (const [surveyIdStr, assessmentData] of Object.entries(
          surveyGroups,
        )) {
          const surveyId = parseInt(surveyIdStr);

          // Skip industries with less than 5 assessments (minimum for reliability)
          if (assessmentData.length < 5) {
            console.log(
              `Skipping ${industry} (${assessmentData.length} assessments, minimum 5 required)`,
            );
            continue;
          }

          await this.calculateAndStoreCategoryStats(
            assessmentData,
            industry,
            surveyId,
            currentQuarter,
          );
        }
      }

      // Calculate global fallback stats for industries that didn't meet threshold
      await this.calculateGlobalStats(validAssessments, currentQuarter);

      console.log("Survey statistics recalculation completed successfully");
    } catch (error) {
      console.error("Error recalculating survey statistics:", error);
      throw error;
    }
  }

  /**
   * Calculate and store category statistics for a specific industry using real data
   */
  static async calculateAndStoreCategoryStats(
    assessmentData: any[],
    industry: string,
    surveyId: number,
    quarter: string,
  ): Promise<void> {
    const categoryStats: Record<string, { total: number; count: number }> = {};

    for (const { assessment } of assessmentData) {
      try {
        const answers = JSON.parse(assessment.answers);
        const categoryScores = await this.calculateCategoryScores(
          answers,
          surveyId,
        );

        Object.entries(categoryScores).forEach(([category, score]) => {
          if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, count: 0 };
          }

          categoryStats[category].total += score;
          categoryStats[category].count += 1;
        });
      } catch (error) {
        console.error("Error processing assessment answers:", error);
      }
    }

    // Store statistics for each category
    for (const [category, stats] of Object.entries(categoryStats)) {
      const averageScore = stats.total / stats.count;

      await this.upsertSurveyStats({
        industry,
        category,
        quarter,
        averageScore: Math.round(averageScore), // Store as 0-100 range integer
        completedCount: stats.count,
      });
    }

    console.log(
      `Stored stats for ${industry}: ${Object.keys(categoryStats).length} categories, ${assessmentData.length} assessments`,
    );
  }

  /**
   * Calculate global statistics for fallback
   */
  static async calculateGlobalStats(
    assessmentData: any[],
    quarter: string,
  ): Promise<void> {
    const surveyGroups: Record<number, any[]> = {};

    assessmentData.forEach(({ assessment, user }) => {
      const surveyId = assessment.surveyTemplateId;
      if (!surveyGroups[surveyId]) {
        surveyGroups[surveyId] = [];
      }
      surveyGroups[surveyId].push({ assessment, user });
    });

    for (const [surveyIdStr, surveyAssessments] of Object.entries(
      surveyGroups,
    )) {
      const surveyId = parseInt(surveyIdStr);

      if (surveyAssessments.length >= 5) {
        await this.calculateAndStoreCategoryStats(
          surveyAssessments,
          "global",
          surveyId,
          quarter,
        );
      }
    }
  }

  /**
   * Upsert survey statistics
   */
  static async upsertSurveyStats(data: {
    industry: string;
    category: string;
    quarter: string;
    averageScore: number;
    completedCount: number;
  }): Promise<void> {
    await db
      .insert(surveyStats)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          surveyStats.industry,
          surveyStats.category,
          surveyStats.quarter,
        ],
        set: {
          averageScore: data.averageScore,
          completedCount: data.completedCount,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get benchmark data for a specific assessment
   */
  static async getBenchmarkData(
    assessmentId: number,
  ): Promise<BenchmarkData | null> {
    try {
      // Get assessment with user data
      const result = await db
        .select({
          assessment: assessments,
          user: users,
        })
        .from(assessments)
        .leftJoin(users, eq(assessments.userId, users.id))
        .where(eq(assessments.id, assessmentId))
        .limit(1);

      if (!result.length) {
        return null;
      }

      const { assessment, user } = result[0];

      if (!assessment.completedOn) {
        return null;
      }

      const quarter = this.getCurrentQuarter();
      const industry = this.getUserIndustry(assessment, user);

      if (!industry) {
        return null;
      }

      // Get industry and global stats for this quarter
      const stats = await db
        .select()
        .from(surveyStats)
        .where(eq(surveyStats.quarter, quarter));

      // Try hierarchical fallback for industry stats
      const industryStats = await this.getIndustryStatsWithFallback(stats, industry);
      const globalStats = stats.filter((s) => s.industry === "global");

      // Calculate user's category scores using real data
      let answers: any[] = [];
      try {
        // Handle both string and already parsed answers
        if (typeof assessment.answers === "string") {
          answers = JSON.parse(assessment.answers);
        } else {
          answers = assessment.answers || [];
        }
      } catch (parseError) {
        console.error("Error parsing assessment answers:", parseError);
        answers = [];
      }

      const userCategoryScores = await this.calculateCategoryScores(
        answers,
        assessment.surveyTemplateId,
      );

      const categories = Object.entries(userCategoryScores).map(
        ([category, userScore]) => {
          const industryStat = industryStats.find(
            (s) => s.category === category,
          );
          const globalStat = globalStats.find((s) => s.category === category);

          return {
            name: category,
            userScore: Math.round(userScore * 100) / 100,
            industryAverage: industryStat ? industryStat.averageScore : null,
            globalAverage: globalStat ? globalStat.averageScore : null,
          };
        },
      );

      // Log which industry level was used for debugging
      if (industryStats.length > 0) {
        const usedIndustryCode = industryStats[0].industry;
        if (usedIndustryCode !== industry) {
          console.log(`Benchmark: Used hierarchy fallback from ${industry} to ${usedIndustryCode}`);
        }
      }

      return {
        quarter,
        industry,
        categories,
      };
    } catch (error) {
      console.error("Error getting benchmark data:", error);
      return null;
    }
  }
}
