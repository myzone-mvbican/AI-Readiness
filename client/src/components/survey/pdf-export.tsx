import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  PDFDownloadLink,
  Font 
} from '@react-pdf/renderer';
import { Assessment, AssessmentAnswer, CsvQuestion } from '@shared/types';
import { Download } from 'lucide-react';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    padding: 30,
    height: '100%',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  logoPlaceholder: {
    width: 150,
    height: 40,
    backgroundColor: '#4361ee',
    borderRadius: 4,
    padding: 10,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    color: '#64748b',
  },
  contentBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    padding: 15,
    marginVertical: 20,
    backgroundColor: 'white',
    alignSelf: 'center',
    width: '70%',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#0f172a',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b',
  },
  coverFooter: {
    fontSize: 10,
    textAlign: 'center',
    color: '#94a3b8',
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  headerLogo: {
    width: 60,
    height: 20,
    backgroundColor: '#4361ee',
    borderRadius: 4,
    padding: 4,
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 12,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0f172a',
  },
  chartCaption: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
  },
  questionItem: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  questionNumber: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  questionText: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  answerValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  answerAgree: {
    color: '#16a34a',
  },
  answerDisagree: {
    color: '#dc2626',
  },
  answerNeutral: {
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  button: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '0.375rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
});

// Helper functions
const getQuestionById = (questionId: number, questions: CsvQuestion[]): string => {
  const question = questions.find(q => q.id === questionId);
  return question?.question || `Question ${questionId}`;
};

const getAnswerText = (value: number | undefined | null) => {
  switch (value) {
    case 2: return { text: 'Strongly Agree', style: styles.answerAgree };
    case 1: return { text: 'Agree', style: styles.answerAgree };
    case 0: return { text: 'Neutral', style: styles.answerNeutral };
    case -1: return { text: 'Disagree', style: styles.answerDisagree };
    case -2: return { text: 'Strongly Disagree', style: styles.answerDisagree };
    default: return { text: 'Not answered', style: styles.answerNeutral };
  }
};

const getReadinessLevel = (score: number) => {
  if (score >= 80) return "advanced";
  if (score >= 60) return "intermediate";
  if (score >= 40) return "developing";
  return "beginning";
};

// PDF Document Component
const AssessmentDocument = ({ 
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
  
  // Readiness level
  const readinessLevel = getReadinessLevel(score);
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <View style={styles.logoContainer}>
            <Text style={styles.logoPlaceholder}>MyZone AI</Text>
          </View>
          
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
        <Text style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
          Based on your responses, your organization is at the {readinessLevel} stage of AI readiness.
        </Text>
        
        {chartImageUrl ? (
          <Image src={chartImageUrl} style={{ width: 350, height: 200, alignSelf: 'center' }} />
        ) : (
          <View style={{ width: 350, height: 200, backgroundColor: '#f1f5f9', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Chart visualization</Text>
          </View>
        )}
        
        <Text style={styles.chartCaption}>
          This radar chart shows your organization's score across different dimensions of AI readiness.
          Higher scores indicate greater maturity in that category.
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {year} MyZone AI</Text>
          <Text style={styles.footerText}>Page 2 of {2 + Math.ceil(answers.length / 8)}</Text>
        </View>
      </Page>
      
      {/* Responses Pages */}
      {[...Array(Math.ceil(answers.length / 8))].map((_, pageIndex) => {
        const pageAnswers = answers.slice(pageIndex * 8, (pageIndex + 1) * 8);
        
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
              const actualIndex = pageIndex * 8 + index;
              const questionText = getQuestionById(answer.q || 0, questions);
              const { text: answerText, style: answerStyle } = getAnswerText(answer.a);
              
              return (
                <View key={`answer-${actualIndex}`} style={styles.questionItem}>
                  <Text style={styles.questionNumber}>Question {actualIndex + 1}</Text>
                  <Text style={styles.questionText}>{questionText}</Text>
                  <Text style={styles.answerLabel}>
                    Your answer: <Text style={[styles.answerValue, answerStyle]}>{answerText}</Text>
                  </Text>
                </View>
              );
            })}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>© {year} MyZone AI</Text>
              <Text style={styles.footerText}>
                Page {3 + pageIndex} of {2 + Math.ceil(answers.length / 8)}
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

interface PdfButtonProps {
  assessment: Assessment;
  questions: CsvQuestion[];
  chartImageUrl: string;
}

export const PdfButton = ({ assessment, questions, chartImageUrl }: PdfButtonProps) => {
  // Generate filename
  const today = new Date();
  const quarter = Math.floor((today.getMonth() / 3) + 1);
  const year = today.getFullYear();
  const filename = `ai-readiness-report-Q${quarter}-${year}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={<AssessmentDocument assessment={assessment} questions={questions} chartImageUrl={chartImageUrl} />} 
      fileName={filename}
      style={styles.button}
    >
      {({ loading }) => (
        <>
          <Download size={16} />
          {loading ? 'Preparing PDF...' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
};