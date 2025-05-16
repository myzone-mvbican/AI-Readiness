import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Assessment, CsvQuestion } from '@shared/types';
import { Download } from 'lucide-react';

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
    padding: 30,
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logoBox: {
    width: 140,
    height: 40,
    backgroundColor: '#4361EE',
    color: 'white',
    borderRadius: 4,
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 30,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#475569',
  },
  contentBox: {
    border: '1px solid #CBD5E1',
    borderRadius: 5,
    padding: 15,
    margin: '20px auto',
    width: '70%',
    backgroundColor: 'white',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#0F172A',
  },
  divider: {
    borderBottom: '1px solid #E2E8F0',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748B',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1px solid #E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverFooter: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 'auto',
    marginBottom: 30,
  },
  headerLogo: {
    width: 80,
    height: 24,
    backgroundColor: '#4361EE',
    color: 'white',
    borderRadius: 4,
    padding: 5,
    fontSize: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 12,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 15,
    color: '#475569',
  },
  chartPlaceholder: {
    width: 350,
    height: 200,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    color: '#64748B',
    fontSize: 12,
  },
  chartImage: {
    width: 350,
    height: 200,
    marginVertical: 20,
    alignSelf: 'center',
  },
  chartCaption: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'center',
  },
  questionItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: '1px solid #F1F5F9',
  },
  questionNumber: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  questionText: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  answerValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  answerPositive: {
    color: '#16A34A',
  },
  answerNeutral: {
    color: '#6B7280',
  },
  answerNegative: {
    color: '#DC2626',
  },
  recommendationBox: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 5,
    marginVertical: 15,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 15,
    fontSize: 10,
    color: '#334155',
  },
  recommendationText: {
    fontSize: 10,
    flex: 1,
    color: '#334155',
  },
  pageNumber: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

// Helper functions
const getAnswerText = (value: number | null | undefined) => {
  switch (value) {
    case 2: return { text: 'Strongly Agree', style: styles.answerPositive };
    case 1: return { text: 'Agree', style: styles.answerPositive };
    case 0: return { text: 'Neutral', style: styles.answerNeutral };
    case -1: return { text: 'Disagree', style: styles.answerNegative };
    case -2: return { text: 'Strongly Disagree', style: styles.answerNegative };
    default: return { text: 'Not answered', style: styles.answerNeutral };
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
      "Consider partnerships with AI solution providers to accelerate adoption"
    ];
  } else if (readinessLevel === "developing") {
    return [
      "Expand data infrastructure and integration capabilities",
      "Develop more robust AI governance frameworks and policies",
      "Invest in building internal AI/ML skills and capabilities",
      "Scale successful pilot projects to production environments",
      "Establish clear metrics to measure AI initiative success"
    ];
  } else if (readinessLevel === "intermediate") {
    return [
      "Formalize AI center of excellence or specialized teams",
      "Implement advanced data architecture and MLOps practices",
      "Develop comprehensive AI risk management and ethics frameworks",
      "Foster deeper integration of AI across multiple business units",
      "Create systems for continuous AI model monitoring and improvement"
    ];
  } else {
    return [
      "Lead industry innovation through novel AI applications",
      "Establish mature AI governance and ethical frameworks",
      "Develop advanced AI talent acquisition and retention strategies",
      "Create scalable MLOps infrastructure for enterprise-wide deployment",
      "Integrate AI into core business strategy and decision processes"
    ];
  }
};

// PDF Document
const AssessmentPDF = ({ 
  assessment, 
  questions, 
  chartImageUrl 
}: { 
  assessment: Assessment; 
  questions: CsvQuestion[];
  chartImageUrl: string;
}) => {
  const { answers = [] } = assessment;
  const score = assessment.score || 0;
  
  // Calculate date and quarter
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const quarter = Math.floor((today.getMonth() / 3) + 1);
  const year = today.getFullYear();
  const totalPages = 3 + Math.ceil(answers.length / 10);
  
  // Readiness level
  const readinessLevel = getReadinessLevel(score);
  const recommendations = getRecommendations(readinessLevel);
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoBox}>MyZone AI</Text>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.title}>AI Readiness Assessment</Text>
          <Text style={styles.subtitle}>Q{quarter} {year}</Text>
          
          <View style={styles.contentBox}>
            <Text style={styles.scoreText}>Score: {score} / 100</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>Completed on: {dateStr}</Text>
          </View>
        </View>
        
        <Text style={styles.coverFooter}>
          Generated by MyZone AI · AI Maturity & Readiness Framework
        </Text>
      </Page>
      
      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerLogo}>MyZone AI</Text>
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>
        
        <Text style={styles.sectionTitle}>AI Readiness Score</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your responses, your organization is at the {readinessLevel} stage of AI readiness.
        </Text>
        
        {chartImageUrl ? (
          <View>
            <View style={styles.chartImage} />
            <Text style={styles.chartCaption}>
              This radar chart shows your organization's score across different dimensions of AI readiness.
              Higher scores indicate greater maturity in that category.
            </Text>
          </View>
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>Chart visualization</Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 2 of {totalPages}</Text>
        </View>
      </Page>
      
      {/* Recommendations Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerLogo}>MyZone AI</Text>
          <Text style={styles.headerTitle}>Recommendations</Text>
        </View>
        
        <Text style={styles.sectionTitle}>AI Readiness Recommendations</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your assessment score of {score}/100, we recommend the following actions to
          improve your organization's AI readiness:
        </Text>
        
        <View style={styles.recommendationBox}>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
        
        <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#64748B', marginTop: 10 }}>
          For a complete AI readiness strategy customized to your organization's specific needs,
          please contact the MyZone AI team for a comprehensive consultation.
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 3 of {totalPages}</Text>
        </View>
      </Page>
      
      {/* Split responses into pages of 10 items each */}
      {Array.from({ length: Math.ceil(answers.length / 10) }).map((_, pageIndex) => {
        const pageAnswers = answers.slice(pageIndex * 10, (pageIndex + 1) * 10);
        const pageNumber = pageIndex + 4; // Cover + Results + Recommendations + Response pages
        
        return (
          <Page key={`responses-${pageIndex}`} size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.headerLogo}>MyZone AI</Text>
              <Text style={styles.headerTitle}>
                {pageIndex === 0 ? 'Your Responses' : 'Your Responses (continued)'}
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>
              {pageIndex === 0 ? 'Assessment Answers' : 'Assessment Answers (continued)'}
            </Text>
            
            {pageAnswers.map((answer, index) => {
              const actualIndex = pageIndex * 10 + index;
              const question = questions.find(q => q.id === answer.q);
              const { text: answerText, style: answerStyle } = getAnswerText(answer.a);
              
              return (
                <View key={`answer-${actualIndex}`} style={styles.questionItem}>
                  <Text style={styles.questionNumber}>Question {actualIndex + 1}</Text>
                  <Text style={styles.questionText}>{question?.question || `Unknown Question`}</Text>
                  <Text style={styles.answerLabel}>
                    Your answer: <Text style={[styles.answerValue, answerStyle]}>{answerText}</Text>
                  </Text>
                </View>
              );
            })}
            
            <View style={styles.footer}>
              <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
              <Text style={styles.pageNumber}>Page {pageNumber} of {totalPages}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

// Download Button Component
export const AssessmentPDFDownloadButton = ({ 
  assessment, 
  questions,
  chartImageUrl
}: { 
  assessment: Assessment; 
  questions: CsvQuestion[];
  chartImageUrl: string;
}) => {
  const today = new Date();
  const quarter = Math.floor((today.getMonth() / 3) + 1);
  const year = today.getFullYear();
  const filename = `ai-readiness-report-Q${quarter}-${year}.pdf`;
  
  return (
    <PDFDownloadLink
      document={<AssessmentPDF assessment={assessment} questions={questions} chartImageUrl={chartImageUrl} />}
      fileName={filename}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
      style={{ textDecoration: 'none' }}
    >
      {({ loading, error }) => (
        <>
          <Download className="h-4 w-4" />
          {loading ? 'Preparing PDF...' : error ? 'Error loading PDF' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
};