import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
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
