import React from 'react';
import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoPath from '@/assets/logo-myzone-ai-black.svg';
import { AssessmentAnswer, CsvQuestion } from '@shared/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },
  logoContainer: {
    width: 80,
  },
  logo: {
    width: 60,
    height: 'auto',
  },
  headerTitle: {
    fontSize: 14,
    color: '#333',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#0f172a',
  },
  responseContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '1px solid #eee',
  },
  questionBox: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    marginBottom: 5,
    borderRadius: 4,
  },
  questionNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 3,
  },
  questionText: {
    fontSize: 10,
    color: '#1e293b',
  },
  answerLabel: {
    fontSize: 9,
    marginTop: 5,
    color: '#64748b',
  },
  answerValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  answerStronglyAgree: {
    color: '#15803d', // dark green
  },
  answerAgree: {
    color: '#22c55e', // green
  },
  answerNeutral: {
    color: '#737373', // gray
  },
  answerDisagree: {
    color: '#ef4444', // red
  },
  answerStronglyDisagree: {
    color: '#b91c1c', // dark red
  },
  answerNotAnswered: {
    color: '#cbd5e1', // light gray
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #eee',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

interface PageResponsesProps {
  answers: AssessmentAnswer[];
  questions: CsvQuestion[];
  pageNumber: number;
  totalPages: number;
  year: number;
  isContinued?: boolean;
}

const PageResponses: React.FC<PageResponsesProps> = ({ 
  answers, 
  questions, 
  pageNumber, 
  totalPages,
  year,
  isContinued = false,
}) => {
  // Helper function to find question text by ID
  const getQuestionTextById = (questionId: number | null | undefined): string => {
    if (questionId === null || questionId === undefined) {
      return `Unknown Question`;
    }
    // Find the matching question by number
    const question = questions.find((q: CsvQuestion) => q.id === questionId);
    return question?.question || `Question ${questionId}`;
  };
  
  // Helper function to get answer text and style
  const getAnswerTextAndStyle = (answer: number | null | undefined) => {
    let text = "Not answered";
    let style = styles.answerNotAnswered;
    
    switch (answer) {
      case 2:
        text = "Strongly Agree";
        style = styles.answerStronglyAgree;
        break;
      case 1:
        text = "Agree";
        style = styles.answerAgree;
        break;
      case 0:
        text = "Neutral";
        style = styles.answerNeutral;
        break;
      case -1:
        text = "Disagree";
        style = styles.answerDisagree;
        break;
      case -2:
        text = "Strongly Disagree";
        style = styles.answerStronglyDisagree;
        break;
    }
    
    return { text, style };
  };
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image src={logoPath} style={styles.logo} />
        </View>
        <Text style={styles.headerTitle}>
          {isContinued ? 'Your Responses (continued)' : 'Your Responses'}
        </Text>
      </View>
      
      <Text style={styles.heading}>
        {isContinued ? 'Your Assessment Responses (continued)' : 'Your Assessment Responses'}
      </Text>
      
      {answers.map((answer, index) => {
        const { text: answerText, style: answerStyle } = getAnswerTextAndStyle(answer.a);
        
        return (
          <View key={`answer-${index}`} style={styles.responseContainer}>
            <View style={styles.questionBox}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Text style={styles.questionText}>{getQuestionTextById(answer.q)}</Text>
            </View>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <Text style={[styles.answerValue, answerStyle]}>{answerText}</Text>
          </View>
        );
      })}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {year} MyZone AI</Text>
        <Text style={styles.pageNumber}>Page {pageNumber} of {totalPages}</Text>
      </View>
    </Page>
  );
};

export default PageResponses;