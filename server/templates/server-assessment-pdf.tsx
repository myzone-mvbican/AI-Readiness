import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Line,
  Polygon,
} from '@react-pdf/renderer';

// Create styles for PDF (adapted from client styles)
const styles = StyleSheet.create({
  // Cover Page Styles
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#3361FF',
    padding: 30,
    height: '100%',
    fontFamily: 'Helvetica',
  },
  logoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    width: 180,
    height: 50,
    alignSelf: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3361FF',
    textAlign: 'center',
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 30,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#fff',
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
  coverFooter: {
    textAlign: 'center',
    fontSize: 10,
    color: '#fff',
    marginTop: 'auto',
    marginBottom: 30,
  },
  
  // Results Page Styles
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
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
  
  // Chart placeholder
  chartPlaceholder: {
    width: 400,
    height: 300,
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
  
  // Recommendations Section
  recommendationSection: {
    marginTop: 30,
  },
  recommendationCard: {
    marginBottom: 50,
    borderLeftWidth: 4,
    borderLeftColor: '#3361FF',
    borderLeftStyle: 'solid',
  },
  recommendationHeader: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  recommendationBody: {
    padding: 10,
  },
  recommendationText: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 5,
    marginLeft: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.3,
  },
  
  // Footer
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

// Helper functions
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getReadinessLevel = (score: number) => {
  if (score >= 80) return 'advanced';
  if (score >= 60) return 'intermediate';
  if (score >= 40) return 'developing';
  return 'beginning';
};

// Component to parse and render recommendations
const RecommendationsContent = ({ markdown }: { markdown: string }) => {
  const removeFormatting = (str: string) => {
    return str
      .replace(/[\*_]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g, '')
      .trim();
  };

  const parseMarkdown = (md: string) => {
    const rawSections = md.split(/\n?##\s+/g).filter(Boolean);
    const blobs = rawSections.length ? rawSections : [md];

    return blobs.map((blob) => {
      const lines = blob.split(/\r?\n/);
      const category = removeFormatting(lines[0] ?? 'Recommendations').trim();

      const items: { type: 'paragraph' | 'bullet'; text: string }[] = [];
      let paraBuffer: string[] = [];

      const flushParagraph = () => {
        if (paraBuffer.length) {
          items.push({
            type: 'paragraph',
            text: removeFormatting(paraBuffer.join(' ').trim()),
          });
          paraBuffer = [];
        }
      };

      lines.slice(1).forEach((raw) => {
        const line = raw.trim();
        if (!line) {
          flushParagraph();
          return;
        }

        if (/^(?:\*|-|•|\d+\.)\s+/.test(line)) {
          flushParagraph();
          const text = line.replace(/^(?:\*|-|•|\d+\.)\s+/, '');
          items.push({
            type: 'bullet',
            text: removeFormatting(text),
          });
        } else {
          paraBuffer.push(line);
        }
      });

      flushParagraph();
      return { category, content: items };
    });
  };

  const sections = parseMarkdown(markdown);

  return (
    <View style={styles.recommendationSection}>
      {sections.map((section, idx) => (
        <View key={`section-${idx}`} style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>
              {section.category}
            </Text>
          </View>
          <View style={styles.recommendationBody}>
            {section.content.map((item, contentIdx) => {
              if (item.type === 'paragraph') {
                return (
                  <Text key={`p-${contentIdx}`} style={styles.recommendationText}>
                    {item.text}
                  </Text>
                );
              }
              if (item.type === 'bullet') {
                return (
                  <View key={`b-${contentIdx}`} style={styles.bulletPoint}>
                    <Text style={styles.bulletText}>• {item.text}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

// Main PDF Component
export const ServerAssessmentPDF = ({ assessment }: { assessment: any }) => {
  const { answers = [], survey = {} } = assessment;
  const score = assessment.score || 0;
  const surveyTitle = survey.title || assessment.title;
  
  // Determine readiness level
  const readinessLevel = getReadinessLevel(score);
  
  // Calculate date and quarter
  const today = new Date();
  const year = today.getFullYear();
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MyZone AI</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.title}>AI Readiness Assessment Results</Text>
          {surveyTitle && (
            <Text style={styles.subtitle}>Based on: {surveyTitle}</Text>
          )}

          <View style={styles.contentBox}>
            <Text style={styles.scoreText}>Score: {(score / 10).toFixed(1)} / 10</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>
              Report generated on: {formatDate(today)}
            </Text>
          </View>
        </View>

        <Text style={styles.coverFooter}>
          Generated by MyZone AI · AI Readiness Framework
        </Text>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MyZone AI</Text>
          </View>
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>

        <Text style={styles.sectionTitle}>AI Readiness Score</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your responses, your organization is at the {readinessLevel} stage of AI readiness.
        </Text>

        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>AI Readiness Radar Chart</Text>
          <Text style={[styles.chartText, { marginTop: 10 }]}>
            Score: {(score / 10).toFixed(1)}/10 ({readinessLevel} level)
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* Recommendations Pages */}
      {assessment.recommendations && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>MyZone AI</Text>
            </View>
            <Text style={styles.headerTitle}>Recommendations</Text>
          </View>

          <Text style={styles.sectionTitle}>Personalized AI Recommendations</Text>
          <Text style={styles.sectionSubtitle}>
            Based on your assessment score of {(score / 10).toFixed(1)}/10 and insights from "MyZone AI Blueprint"
          </Text>

          <RecommendationsContent markdown={assessment.recommendations} />

          <View style={styles.footer}>
            <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
            <Text style={styles.pageNumber}>Page 3</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};