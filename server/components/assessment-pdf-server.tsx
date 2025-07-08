import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { Assessment } from '@shared/types';

// Create styles for PDF (simplified version of client styles)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#475569',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0F172A',
  },
  text: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 1.4,
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
  pageNumber: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

// Component to parse and render markdown content in PDF
const RecommendationsContent = ({ markdown }: { markdown: string }) => {
  const removeFormatting = (str: string) => {
    return str
      .replace(/[\*_]/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F]/g, '')
      .trim();
  };

  const parseMarkdown = (md: string) => {
    const sections = md.split(/\n?##\s+/).filter(Boolean);
    
    return sections.map((section, index) => {
      const lines = section.split(/\r?\n/);
      const title = removeFormatting(lines[0] || `Section ${index + 1}`);
      const content = lines.slice(1).join('\n');
      
      return { title, content: removeFormatting(content) };
    });
  };

  const sections = parseMarkdown(markdown);

  return (
    <View>
      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.text}>{section.content}</Text>
        </View>
      ))}
    </View>
  );
};

// Simplified PDF component for server-side rendering
const AssessmentPDFServer = ({ assessment }: { assessment: Assessment }) => {
  const today = new Date();
  const year = today.getFullYear();
  const completed = new Date(assessment.completedOn || today);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>AI Readiness Assessment Report</Text>
        <Text style={styles.subtitle}>
          Assessment completed on {completed.toLocaleDateString()}
        </Text>
        
        {assessment.recommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Generated Recommendations</Text>
            <RecommendationsContent markdown={assessment.recommendations} />
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export { AssessmentPDFServer, renderToBuffer };