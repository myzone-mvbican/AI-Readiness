import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Copy the styles from the client-side PDF component
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  coverPage: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    justifyContent: "space-between",
    minHeight: "100vh",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    border: "2px solid #e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  contentBox: {
    backgroundColor: "#f8fafc",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 40,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 16,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 14,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: 8,
  },
  section: {
    marginBottom: 32,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    width: "45%",
    border: "1px solid #e5e7eb",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  categoryScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },
  recommendationsBox: {
    backgroundColor: "#fef3c7",
    padding: 20,
    borderRadius: 8,
    border: "1px solid #f59e0b",
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 12,
  },
  recommendationsText: {
    fontSize: 11,
    color: "#451a03",
    lineHeight: 1.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    fontSize: 10,
    color: "#6b7280",
  },
  pageNumber: {
    fontSize: 10,
    color: "#6b7280",
  },
});

interface ServerAssessmentPDFProps {
  assessment: {
    id: number;
    title: string;
    score: number;
    completedOn: string;
    recommendations?: string;
    answers?: Array<{
      questionId: number;
      answer: string;
      category?: string;
    }>;
    survey?: {
      title: string;
      questions?: Array<{
        id: number;
        text: string;
        category: string;
      }>;
    };
  };
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getReadinessLevel(score: number): string {
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Intermediate";  
  if (score >= 40) return "Developing";
  return "Beginning";
}

function getCategoryScores(answers: any[], questions: any[]): Record<string, { total: number, count: number }> {
  const categoryScores: Record<string, { total: number, count: number }> = {};
  
  if (!answers || !questions) return categoryScores;
  
  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (question) {
      const category = question.category || 'General';
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      
      // Convert answer to numeric score (assuming 1-5 scale)
      const score = parseInt(answer.answer) || 0;
      categoryScores[category].total += score;
      categoryScores[category].count += 1;
    }
  });
  
  return categoryScores;
}

export const ServerAssessmentPDF: React.FC<ServerAssessmentPDFProps> = ({ assessment }) => {
  const score = assessment.score || 0;
  const readinessLevel = getReadinessLevel(score);
  const today = new Date();
  const year = today.getFullYear();
  const completed = new Date(assessment.completedOn || today);

  // Calculate category scores
  const categoryScores = getCategoryScores(
    assessment.answers || [],
    assessment.survey?.questions || []
  );
  
  const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
    category,
    average: data.count > 0 ? (data.total / data.count) : 0
  }));

  const totalPages = 2 + (assessment.recommendations ? 1 : 0);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#374151" }}>
              AI
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.title}>AI Readiness Assessment Results</Text>
          {assessment.survey?.title && (
            <Text style={styles.subtitle}>Based on: {assessment.survey.title}</Text>
          )}

          <View style={styles.contentBox}>
            <Text style={styles.scoreText}>{(score / 10).toFixed(1)} / 10</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>
              Report generated on: {formatDate(today)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 1 of {totalPages}</Text>
        </View>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Assessment Results</Text>
        
        <View style={styles.section}>
          <Text style={{ fontSize: 14, marginBottom: 16, color: "#374151" }}>
            Based on your responses, your organization is at the <Text style={{ fontWeight: "bold" }}>{readinessLevel}</Text> stage of AI readiness.
          </Text>
          
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#059669", marginBottom: 20 }}>
            Overall Score: {(score / 10).toFixed(1)} out of 10
          </Text>
        </View>

        {categoryAverages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <View style={styles.categoryGrid}>
              {categoryAverages.map((item, index) => (
                <View key={index} style={styles.categoryCard}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryScore}>{item.average.toFixed(1)}/5</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 2 of {totalPages}</Text>
        </View>
      </Page>

      {/* Recommendations Page */}
      {assessment.recommendations && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>AI-Powered Recommendations</Text>
          
          <View style={styles.recommendationsBox}>
            <Text style={styles.recommendationsTitle}>Personalized Insights for Your Organization</Text>
            <Text style={styles.recommendationsText}>
              {assessment.recommendations}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
            <Text style={styles.pageNumber}>Page {totalPages} of {totalPages}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};