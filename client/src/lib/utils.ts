import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { Assessment, Survey, CsvQuestion } from "@shared/types";
import { AssessmentAnswer } from "@shared/types/models";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | null) {
    if (!dateString) return "-";
    try {
        const date =
            typeof dateString === "string" ? new Date(dateString) : dateString;
        return format(date, "PPP");
    } catch (e) {
        return "-";
    }
}

export function getScore(answers: AssessmentAnswer[]) {
    let score = null;

    const answerValues = answers
        .map((a: any) => (typeof a.a === "number" ? a.a : null))
        .filter((value: any) => value !== null);

    if (answerValues.length > 0) {
        const rawScore = answerValues.reduce(
            (sum: number, val: number) => sum + val,
            0,
        );

        const adjustedScore =
            ((rawScore + answers.length * 2) / (answers.length * 4)) * 100;
        score = Math.round(adjustedScore);
    }

    return score;
}

/**
 * Calculate category scores based on assessment answers
 */
interface CategoryScore {
    name: string;
    score: number;
    previousScore: number | null;
    benchmark: number | null;
}

export function getCategoryScores(
    assessment: Assessment & { survey: Survey },
): CategoryScore[] {
    const {
        answers = [],
        survey: { questions = [] },
    } = assessment;

    // Group questions by category
    const categoryMap = new Map<string, number[]>();

    (questions || []).forEach((question: CsvQuestion, index: number) => {
        const category = question.category;
        if (!category) {
            return;
        }

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
                previousScore: null,
                benchmark: null,
            };
        },
    );

    return categoryScores;
}

// Define radar chart data type
interface RadarChartData {
    name: string;
    score: number;
    fullMark: number;
}

/**
 * Extract V1 recommendations content from string or { content: string } format
 */
export function extractV1Content(recommendations: string | { content: string } | null | undefined): string | null {
    if (!recommendations) return null;
    
    // If it's already a string, return it
    if (typeof recommendations === "string") {
        return recommendations;
    }
    
    // If it's an object with content property, extract it
    if (typeof recommendations === "object" && "content" in recommendations) {
        return recommendations.content;
    }
    
    return null;
}

// Function to prepare data for radar chart
export const getRadarChartData = (
    assessment: Assessment & { survey: Survey },
): RadarChartData[] => {
    return getCategoryScores(assessment).map((category) => ({
        ...category,
        subject: category.name,
        fullMark: 10,
    }));
};

export function getInitials(name: string) {
    if (!name || typeof name !== "string") return "";

    // Normalize spacing and split name into words
    const words = name.trim().split(/\s+/);

    let initials = "";

    if (words.length >= 2) {
        // First letter of first two words
        initials = words[0].charAt(0) + words[1].charAt(0);
    } else if (words.length === 1) {
        // Handle hyphenated or long single names
        const subWords = words[0].split("-");
        if (subWords.length >= 2) {
            initials = subWords[0].charAt(0) + subWords[1].charAt(0);
        } else {
            initials = words[0].substring(0, 2); // first two letters
        }
    }

    return initials.toUpperCase();
}
