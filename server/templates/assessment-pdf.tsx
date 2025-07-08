import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Circle,
  Line,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  scoreSection: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 10,
  },
  readinessLevel: {
    fontSize: 18,
    color: '#374151',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.6,
    marginBottom: 10,
  },
  categoryScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    width: 40,
    textAlign: 'right',
  },
  recommendations: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 11,
    color: '#451a03',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#6b7280',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

interface AssessmentPDFProps {
  assessment: {
    id: number;
    title: string;
    score: number;
    completedOn: string;
    recommendations?: string;
    answers?: Array<{
      questionId: number;
      answer: string;
      category: string;
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

function getReadinessLevel(score: number): string {
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Intermediate";  
  if (score >= 40) return "Developing";
  return "Beginning";
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getCategoryScores(answers: any[], questions: any[]): Record<string, { total: number, count: number }> {
  const categoryScores: Record<string, { total: number, count: number }> = {};
  
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

export const ServerAssessmentPDF: React.FC<AssessmentPDFProps> = ({ assessment }) => {
  const score = assessment.score || 0;
  const readinessLevel = getReadinessLevel(score);
  const completedDate = formatDate(assessment.completedOn || new Date());
  
  // Calculate category scores
  const categoryScores = getCategoryScores(
    assessment.answers || [],
    assessment.survey?.questions || []
  );
  
  const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
    category,
    average: data.count > 0 ? (data.total / data.count).toFixed(1) : '0.0'
  }));

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Readiness Assessment Report</Text>
          <Text style={styles.subtitle}>
            {assessment.survey?.title || assessment.title}
          </Text>
          <Text style={styles.subtitle}>
            Generated on {completedDate}
          </Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreText}>{(score / 10).toFixed(1)}/10</Text>
          <Text style={styles.readinessLevel}>{readinessLevel} Readiness</Text>
        </View>

        {categoryAverages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {categoryAverages.map((item, index) => (
              <View key={index} style={styles.categoryScore}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryValue}>{item.average}/5</Text>
              </View>
            ))}
          </View>
        )}

        {assessment.recommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Powered Recommendations</Text>
            <View style={styles.recommendations}>
              <Text style={styles.recommendationTitle}>Personalized Insights</Text>
              <Text style={styles.recommendationText}>
                {assessment.recommendations?.substring(0, 2000) || 'No recommendations available'}
                {assessment.recommendations && assessment.recommendations.length > 2000 && '...'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>© {new Date().getFullYear()} MyZone AI</Text>
          <Text>Assessment ID: {assessment.id}</Text>
        </View>
      </Page>

      {/* Detailed Responses Page */}
      {assessment.answers && assessment.answers.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Detailed Responses</Text>
          
          {assessment.answers.map((answer, index) => {
            const question = assessment.survey?.questions?.find(q => q.id === answer.questionId);
            return (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
                  Q{index + 1}: {question?.text || `Question ${answer.questionId}`}
                </Text>
                <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                  Category: {question?.category || 'General'}
                </Text>
                <Text style={{ fontSize: 10, color: '#374151' }}>
                  Response: {answer.answer}
                </Text>
              </View>
            );
          })}

          <View style={styles.footer}>
            <Text>© {new Date().getFullYear()} MyZone AI</Text>
            <Text>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};