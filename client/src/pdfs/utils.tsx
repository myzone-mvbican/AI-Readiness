import React from "react";
import styles from "./styles";

const getAnswerText = (value: number | null | undefined) => {
  switch (value) {
    case 2:
      return { text: "Strongly Agree", style: styles.answerPositive };
    case 1:
      return { text: "Agree", style: styles.answerPositive };
    case 0:
      return { text: "Neutral", style: styles.answerNeutral };
    case -1:
      return { text: "Disagree", style: styles.answerNegative };
    case -2:
      return { text: "Strongly Disagree", style: styles.answerNegative };
    default:
      return { text: "Not answered", style: styles.answerNeutral };
  }
};

const getReadinessLevel = (score: number) => {
  if (score >= 80) return "advanced";
  if (score >= 60) return "intermediate";
  if (score >= 40) return "developing";
  return "beginning";
};

const getRecommendations = (readinessLevel: string) => {
  if (readinessLevel === "beginning") {
    return [
      "Focus on AI awareness and education for key stakeholders",
      "Start building basic data infrastructure and governance",
      "Identify small pilot projects with clear business value",
      "Develop an initial AI strategy aligned with business goals",
      "Consider partnerships with AI solution providers to accelerate adoption",
    ];
  } else if (readinessLevel === "developing") {
    return [
      "Expand data infrastructure and integration capabilities",
      "Develop more robust AI governance frameworks and policies",
      "Invest in building internal AI/ML skills and capabilities",
      "Scale successful pilot projects to production environments",
      "Establish clear metrics to measure AI initiative success",
    ];
  } else if (readinessLevel === "intermediate") {
    return [
      "Formalize AI center of excellence or specialized teams",
      "Implement advanced data architecture and MLOps practices",
      "Develop comprehensive AI risk management and ethics frameworks",
      "Foster deeper integration of AI across multiple business units",
      "Create systems for continuous AI model monitoring and improvement",
    ];
  } else {
    return [
      "Lead industry innovation through novel AI applications",
      "Establish mature AI governance and ethical frameworks",
      "Develop advanced AI talent acquisition and retention strategies",
      "Create scalable MLOps infrastructure for enterprise-wide deployment",
      "Integrate AI into core business strategy and decision processes",
    ];
  }
};

export { getAnswerText, getReadinessLevel, getRecommendations };
