import { Assessment, CsvQuestion } from "@shared/types";
import { apiRequest } from "./queryClient";

// Define the data structure for category scores
interface CategoryScore {
  name: string;
  score: number;
}

/**
 * Generate AI recommendations for an assessment
 * @param assessment The assessment to generate recommendations for
 * @param questions The questions from the survey
 * @returns The generated recommendations as a string, or null if generation failed
 */
export async function generateRecommendations(
  assessment: Assessment,
  questions: CsvQuestion[],
): Promise<string | null> {
  try {
    // Calculate category scores
    const categoryScores = getCategoryScores(assessment, questions);

    // Only make the API request if we have the needed data
    if (!categoryScores.length) {
      console.error("No category data available for AI recommendations");
      return null;
    }

    const payload = {
      book: "The Lean Startup",
      categories: categoryScores,
      userEmail: assessment.email || undefined,
    };

    // Call the AI suggestions API
    const response = await apiRequest("POST", "/api/ai-suggestions", payload);
    const result = await response.json();

    if (result.success && result.content) {
      return result.content;
    }

    return null;
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return null;
  }
}

/**
 * Calculate category scores based on assessment answers
 */
function getCategoryScores(
  assessment: Assessment,
  questions: CsvQuestion[],
): CategoryScore[] {
  const { answers = [] } = assessment;

  // Group questions by category
  const categoryMap = new Map<string, number[]>();

  questions.forEach((question: CsvQuestion, index: number) => {
    const category = question.category;
    if (!category) return;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    // Add this question's index to the category
    categoryMap.get(category)?.push(index);
  });

  // Calculate average score for each category
  const categoryScores = Array.from(categoryMap.entries()).map(
    ([name, questionIndices]) => {
      // Get answers for this category's questions
      const categoryAnswers = questionIndices
        .map((idx: number) => answers[idx])
        .filter((a: any) => a && a.a !== null);

      // Calculate average score
      const sum = categoryAnswers.reduce((acc: number, ans: any) => {
        // Convert from -2 to +2 scale to 0 to 10 scale
        const score = ((ans.a || 0) + 2) * 2.5;
        return acc + score;
      }, 0);

      const avgScore =
        categoryAnswers.length > 0
          ? Math.round((sum / categoryAnswers.length) * 10) / 10
          : 0;

      return {
        name,
        score: avgScore,
      };
    },
  );

  return categoryScores;
}
