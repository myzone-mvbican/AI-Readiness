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
    marginBottom: 10,
    textAlign: 'center',
    color: '#0f172a',
  },
  subheading: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: '#64748b',
  },
  chartContainer: {
    margin: '20px auto',
    height: 300,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  chartImage: {
    width: '80%',
    height: 'auto',
    objectFit: 'contain',
  },
  explanationContainer: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f8fafc',
    marginBottom: 20,
  },
  explanation: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
    textAlign: 'center',
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

interface PageChartProps {
  readinessLevel: string;
  chartImageUrl: string;
  pageNumber: number;
  totalPages: number;
  year: number;
}

const PageChart: React.FC<PageChartProps> = ({ 
  readinessLevel, 
  chartImageUrl,
  pageNumber,
  totalPages,
  year
}) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image src={logoPath} style={styles.logo} />
      </View>
      <Text style={styles.headerTitle}>Assessment Results</Text>
    </View>
    
    <Text style={styles.heading}>AI Readiness Score Overview</Text>
    <Text style={styles.subheading}>Based on your responses, your organization is at the {readinessLevel} stage of AI readiness.</Text>
    
    <View style={styles.chartContainer}>
      <Image src={chartImageUrl} style={styles.chartImage} />
    </View>
    
    <View style={styles.explanationContainer}>
      <Text style={styles.explanation}>The radar chart above shows your organization's score across different dimensions of AI readiness.</Text>
      <Text style={styles.explanation}>Higher scores (closer to the outer edge) indicate greater maturity in that category.</Text>
      <Text style={styles.explanation}>Use this visualization to identify areas of strength and opportunities for improvement.</Text>
    </View>
    
    <View style={styles.footer}>
      <Text style={styles.footerText}>© {year} MyZone AI</Text>
      <Text style={styles.pageNumber}>Page {pageNumber} of {totalPages}</Text>
    </View>
  </Page>
);

export default PageChart;