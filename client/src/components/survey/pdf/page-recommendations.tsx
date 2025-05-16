import React from 'react';
import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoPath from '@/assets/logo-myzone-ai-black.svg';

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
  introduction: {
    fontSize: 10,
    marginBottom: 15,
    color: '#334155',
    lineHeight: 1.5,
  },
  recommendationsContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  recommendationsHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0f172a',
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
    flex: 1,
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  note: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 10,
    lineHeight: 1.5,
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

interface PageRecommendationsProps {
  readinessLevel: string;
  score: number;
  pageNumber: number;
  totalPages: number;
  year: number;
}

const PageRecommendations: React.FC<PageRecommendationsProps> = ({ 
  readinessLevel, 
  score,
  pageNumber, 
  totalPages,
  year 
}) => {
  // Determine recommendations based on readiness level
  const getRecommendations = () => {
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
  
  const recommendations = getRecommendations();
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image src={logoPath} style={styles.logo} />
        </View>
        <Text style={styles.headerTitle}>Recommendations</Text>
      </View>
      
      <Text style={styles.heading}>AI Readiness Recommendations</Text>
      
      <Text style={styles.introduction}>
        Based on your AI readiness assessment results (score: {score}/100), here are some 
        tailored recommendations to help improve your organization's AI maturity. Your organization
        is currently at the {readinessLevel} stage of AI readiness.
      </Text>
      
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsHeading}>Key Recommendations:</Text>
        
        {recommendations.map((recommendation, index) => (
          <View key={`rec-${index}`} style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>• </Text>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.note}>
        This assessment provides a starting point for your AI journey. For detailed, customized recommendations, 
        please contact the MyZone AI team for a comprehensive assessment and strategy session. These 
        recommendations are based on industry best practices and tailored to your current AI readiness level.
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {year} MyZone AI</Text>
        <Text style={styles.pageNumber}>Page {pageNumber} of {totalPages}</Text>
      </View>
    </Page>
  );
};

export default PageRecommendations;