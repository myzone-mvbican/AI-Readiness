import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  Font,
  PDFDownloadLink 
} from '@react-pdf/renderer';
import { Assessment, CsvQuestion } from '@shared/types';

// Import logo
import logoPath from '@/assets/logo-myzone-ai-black.svg';

// Base64-encoded placeholder logo (in case SVG doesn't work with react-pdf)
const logoBase64 = "data:image/png;base64,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";

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  coverPage: {
    padding: 30,
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 10,
  },
  headerLogo: {
    width: 60,
    height: 20,
  },
  coverLogo: {
    width: 120,
    height: 40,
    alignSelf: 'center',
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1E293B',
  },
  coverSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#475569',
  },
  coverBox: {
    border: '1px solid #CBD5E1',
    borderRadius: 5,
    padding: 20,
    margin: '20px auto',
    width: '80%',
    backgroundColor: '#FFFFFF',
  },
  coverScore: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  coverDate: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748B',
  },
  divider: {
    borderBottom: '1px solid #E2E8F0',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0F172A',
  },
  chartContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  chartCaption: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
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
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  recommendationBullet: {
    width: 10,
    fontSize: 10,
  },
  recommendationText: {
    fontSize: 10,
    flex: 1,
    color: '#334155',
  },
  footer: {
    marginTop: 20,
    borderTop: '1px solid #E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  coverFooter: {
    textAlign: 'center', 
    fontSize: 10,
    color: '#64748B',
  },
  pageNumber: {
    fontSize: 10,
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 'auto',
  },
});

// Helper functions
const getAnswerText = (value: number | null | undefined) => {
  switch (value) {
    case 2: return { text: 'Strongly Agree', color: '#15803D' };
    case 1: return { text: 'Agree', color: '#22C55E' };
    case 0: return { text: 'Neutral', color: '#737373' };
    case -1: return { text: 'Disagree', color: '#EF4444' };
    case -2: return { text: 'Strongly Disagree', color: '#B91C1C' };
    default: return { text: 'Not answered', color: '#CBD5E1' };
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

interface AssessmentPDFProps {
  assessment: Assessment;
  questions: CsvQuestion[];
  chartImageUrl: string;
}

// PDF Document Component
const AssessmentPDF: React.FC<AssessmentPDFProps> = ({ 
  assessment, 
  questions,
  chartImageUrl
}) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const quarter = Math.floor((today.getMonth() / 3) + 1);
  const year = today.getFullYear();
  const score = assessment.score || 0;
  const readinessLevel = getReadinessLevel(score);
  const recommendations = getRecommendations(readinessLevel);
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ marginTop: 50 }}>
          <Image src={logoBase64} style={styles.coverLogo} />
          
          <Text style={styles.coverTitle}>AI Readiness Assessment</Text>
          <Text style={styles.coverSubtitle}>Q{quarter} {year}</Text>
          
          <View style={styles.coverBox}>
            <Text style={styles.coverScore}>Score: {score} / 100</Text>
            <View style={styles.divider} />
            <Text style={styles.coverDate}>Completed on: {dateStr}</Text>
          </View>
        </View>
        
        <Text style={styles.coverFooter}>
          Generated by MyZone AI · AI Maturity & Readiness Framework
        </Text>
      </Page>
      
      {/* Results Page with Chart */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoBase64} style={styles.headerLogo} />
          <Text style={{ fontSize: 12, color: '#475569' }}>Assessment Results</Text>
        </View>
        
        <Text style={styles.sectionTitle}>AI Readiness Overview</Text>
        <Text style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
          Based on your responses, your organization is at the {readinessLevel} stage of AI readiness.
        </Text>
        
        <View style={styles.chartContainer}>
          <Image src={chartImageUrl} style={{ width: 300, height: 200 }} />
          <Text style={styles.chartCaption}>
            This radar chart shows your performance across different dimensions of AI readiness.
            Higher scores (closer to the outer edge) indicate greater maturity.
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {year} MyZone AI</Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>
      
      {/* Recommendations Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoBase64} style={styles.headerLogo} />
          <Text style={{ fontSize: 12, color: '#475569' }}>Recommendations</Text>
        </View>
        
        <Text style={styles.recommendationsTitle}>AI Readiness Recommendations</Text>
        <Text style={{ fontSize: 10, color: '#475569', marginBottom: 15 }}>
          Based on your assessment score of {score}/100, we recommend the following actions to
          improve your organization's AI readiness:
        </Text>
        
        <View style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 5, marginBottom: 20 }}>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
        
        <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#64748B' }}>
          For a complete AI readiness strategy customized to your organization's specific needs,
          please contact the MyZone AI team for a comprehensive consultation.
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {year} MyZone AI</Text>
          <Text style={styles.footerText}>Page 3</Text>
        </View>
      </Page>
      
      {/* Responses Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoBase64} style={styles.headerLogo} />
          <Text style={{ fontSize: 12, color: '#475569' }}>Your Responses</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Assessment Answers</Text>
        
        {assessment.answers.slice(0, 10).map((answer, index) => {
          const question = questions.find(q => q.id === answer.q);
          const { text: answerText, color } = getAnswerText(answer.a);
          
          return (
            <View key={index} style={styles.questionItem}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Text style={styles.questionText}>{question?.question || `Unknown Question`}</Text>
              <Text style={styles.answerLabel}>Your answer: <Text style={[styles.answerValue, { color }]}>{answerText}</Text></Text>
            </View>
          );
        })}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {year} MyZone AI</Text>
          <Text style={styles.footerText}>Page 4</Text>
        </View>
      </Page>
      
      {/* Additional Responses Pages if needed */}
      {assessment.answers.length > 10 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Image src={logoBase64} style={styles.headerLogo} />
            <Text style={{ fontSize: 12, color: '#475569' }}>Your Responses (continued)</Text>
          </View>
          
          {assessment.answers.slice(10).map((answer, index) => {
            const question = questions.find(q => q.id === answer.q);
            const { text: answerText, color } = getAnswerText(answer.a);
            const actualIndex = index + 10;
            
            return (
              <View key={actualIndex} style={styles.questionItem}>
                <Text style={styles.questionNumber}>Question {actualIndex + 1}</Text>
                <Text style={styles.questionText}>{question?.question || `Unknown Question`}</Text>
                <Text style={styles.answerLabel}>Your answer: <Text style={[styles.answerValue, { color }]}>{answerText}</Text></Text>
              </View>
            );
          })}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>© {year} MyZone AI</Text>
            <Text style={styles.footerText}>Page 5</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

// Export the PDF component
export default AssessmentPDF;

// Render PDF button component 
export const PDFDownloadButton: React.FC<{
  assessment: Assessment;
  questions: CsvQuestion[];
  chartImageUrl: string;
  fileName?: string;
}> = ({ assessment, questions, chartImageUrl, fileName }) => {
  const today = new Date();
  const quarter = Math.floor((today.getMonth() / 3) + 1);
  const year = today.getFullYear();
  const defaultFileName = `ai-readiness-report-Q${quarter}-${year}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={<AssessmentPDF 
        assessment={assessment} 
        questions={questions} 
        chartImageUrl={chartImageUrl} 
      />} 
      fileName={fileName || defaultFileName}
      style={{
        textDecoration: 'none',
        padding: '10px 16px',
        backgroundColor: 'hsl(var(--primary))',
        color: 'white',
        borderRadius: '0.375rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {({ loading }) => (loading ? 'Preparing document...' : 'Download PDF')}
    </PDFDownloadLink>
  );
};