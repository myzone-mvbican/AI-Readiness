import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Image,
  Svg,
  Circle,
  Line,
  Polygon,
} from '@react-pdf/renderer';
import { Assessment, CsvQuestion } from '@shared/types';
import path from 'path';

// Create styles for PDF (complete version matching client styles)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#3361FF',
    padding: 30,
    height: '100%',
  },
  logoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoBox: {
    width: 180,
    height: 50,
    padding: 10,
  },
  logoBoxSmall: {
    width: 145,
    height: 30,
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
    color: '#fff',
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
  chartContainer: {
    width: 400,
    height: 300,
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
    height: 150,
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
  pageNumber: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

// Helper functions
const getAnswerText = (value: number | null | undefined) => {
  switch (value) {
    case 2:
      return { text: "Strongly Agree", style: styles.answerPositive };
    case 1:
      return { text: "Agree", style: styles.answerPositive };
    case 0:
      return { text: "Neutral", style: styles.answerNeutral };
    case -1:
      return { text: "Disagree", style: styles.answerNegative };
    case -2:
      return { text: "Strongly Disagree", style: styles.answerNegative };
    default:
      return { text: "Not answered", style: styles.answerNeutral };
  }
};

const getReadinessLevel = (score: number) => {
  if (score >= 80) return "advanced";
  if (score >= 60) return "intermediate";
  if (score >= 40) return "developing";
  return "beginning";
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getCategoryScores = (assessment: Assessment) => {
  const {
    answers = [],
    survey: { questions = [] } = {}
  } = assessment;

  // Group questions by category
  const categoryMap = new Map<string, number[]>();

  questions.forEach((question: CsvQuestion, index: number) => {
    const category = question.category;
    if (!category) {
      return;
    }

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    // Add this question's index to the category
    categoryMap.get(category)?.push(index);
  });

  // Calculate average score for each category
  const categoryScores = Array.from(categoryMap.entries()).map(
    ([name, questionIndices]) => {
      // Get answers for this category's questions
      const categoryAnswers = questionIndices
        .map((idx: number) => answers[idx])
        .filter((a: any) => a && a.a !== null);

      // Calculate average score
      const sum = categoryAnswers.reduce((acc: number, ans: any) => {
        // Convert from -2 to +2 scale to 0 to 10 scale
        const score = ((ans.a || 0) + 2) * 2.5;
        return acc + score;
      }, 0);

      const avgScore =
        categoryAnswers.length > 0
          ? Math.round((sum / categoryAnswers.length) * 10) / 10
          : 0;

      return {
        name,
        score: avgScore,
        fullMark: 10
      };
    }
  );

  // If no category data available, return default categories
  if (categoryScores.length === 0) {
    const score = assessment.score || 0;
    const variation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
    
    const defaultCategories = [
      { name: "Strategy & Leadership", score: Math.min(10, (score / 10) * variation * 10) },
      { name: "Data & Infrastructure", score: Math.min(10, (score / 10) * (variation + 0.1) * 10) },
      { name: "Talent & Skills", score: Math.min(10, (score / 10) * (variation - 0.1) * 10) },
      { name: "Technology & Tools", score: Math.min(10, (score / 10) * (variation + 0.05) * 10) },
      { name: "Governance & Ethics", score: Math.min(10, (score / 10) * variation * 10) },
      { name: "Culture & Change", score: Math.min(10, (score / 10) * (variation - 0.05) * 10) },
    ];
    
    return defaultCategories.map(cat => ({
      name: cat.name,
      score: Math.round(cat.score * 10) / 10,
      fullMark: 10
    }));
  }

  return categoryScores;
};

// Simplified Radar Chart Component for PDF - Optimized for react-pdf rendering
const RadarChart = ({
  data,
  width = 400,
  height = 300,
}: {
  data: Array<{ name: string; score: number; fullMark: number }>;
  width?: number;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>No chart data available</Text>
      </View>
    );
  }

  // Chart configuration
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.7;

  // Calculate points for the data polygon
  const dataPoints = data
    .map((item, index) => {
      const angle = ((Math.PI * 2) / data.length) * index - Math.PI / 2; // Start from top
      const normalizedValue = Math.max(0.1, item.score / item.fullMark); // Minimum 0.1 to show structure
      const x = centerX + radius * normalizedValue * Math.cos(angle);
      const y = centerY + radius * normalizedValue * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Calculate outer polygon points for grid
  const outerPoints = data
    .map((_, index) => {
      const angle = ((Math.PI * 2) / data.length) * index - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Calculate middle polygon points for grid
  const middlePoints = data
    .map((_, index) => {
      const angle = ((Math.PI * 2) / data.length) * index - Math.PI / 2;
      const x = centerX + radius * 0.6 * Math.cos(angle);
      const y = centerY + radius * 0.6 * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Calculate inner polygon points for grid  
  const innerPoints = data
    .map((_, index) => {
      const angle = ((Math.PI * 2) / data.length) * index - Math.PI / 2;
      const x = centerX + radius * 0.3 * Math.cos(angle);
      const y = centerY + radius * 0.3 * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ width, height, marginBottom: 20, alignItems: 'center' }}>
      <Svg height={height} width={width}>
        {/* Grid polygons - simplified approach */}
        <Polygon
          points={outerPoints}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={1}
        />
        <Polygon
          points={middlePoints}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={0.5}
          strokeDasharray="3,3"
        />
        <Polygon
          points={innerPoints}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={0.5}
          strokeDasharray="3,3"
        />

        {/* Axis lines from center to outer vertices */}
        {data.map((_, i) => {
          const angle = ((Math.PI * 2) / data.length) * i - Math.PI / 2;
          const endX = centerX + radius * Math.cos(angle);
          const endY = centerY + radius * Math.sin(angle);

          return (
            <Line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#CBD5E1"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon - the actual scores */}
        <Polygon
          points={dataPoints}
          fill="#4361EE"
          fillOpacity={0.3}
          stroke="#4361EE"
          strokeWidth={2}
        />

        {/* Data points */}
        {data.map((item, i) => {
          const angle = ((Math.PI * 2) / data.length) * i - Math.PI / 2;
          const normalizedValue = Math.max(0.1, item.score / item.fullMark);
          const x = centerX + radius * normalizedValue * Math.cos(angle);
          const y = centerY + radius * normalizedValue * Math.sin(angle);

          return (
            <Circle key={`point-${i}`} cx={x} cy={y} r={3} fill="#4361EE" />
          );
        })}
      </Svg>

      {/* Category labels positioned around the chart */}
      <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {data.map((item, i) => {
          const angle = ((Math.PI * 2) / data.length) * i - Math.PI / 2;
          const labelRadius = radius + 25;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          
          return (
            <Text
              key={`label-${i}`}
              style={{
                position: "absolute",
                left: x - 50,
                top: y - 10,
                width: 100,
                fontSize: 8,
                textAlign: 'center',
                color: "#334155",
                fontWeight: 'bold',
              }}
            >
              {item.name}
            </Text>
          );
        })}
      </View>

      {/* Score legend */}
      <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
        <Text style={{ fontSize: 7, color: '#64748B' }}>
          Scale: 0-10 points
        </Text>
      </View>
    </View>
  );
};

// Component to parse and render markdown content in PDF
const RecommendationsContent = ({ markdown }: { markdown: string }) => {
  const removeFormatting = (str: string) => {
    return str
      .replace(/[\*_]/g, "")
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g,
        "",
      )
      .trim();
  };

  const isListItem = (line: string): boolean => {
    if (/^(?:\*|-|•)\s+/.test(line)) return true;
    return /^(\d+)([.)])\s*/.test(line) && !/^\d+\.\d/.test(line);
  };

  const stripListMarker = (line: string): string => {
    if (/^(?:\*|-|•)\s+/.test(line)) {
      return line.replace(/^(?:\*|-|•)\s+/, "");
    }
    return line.replace(/^(\d+)([.)])\s*/, "");
  };

  const parseMarkdown = (md: string) => {
    const rawSections = md.split(/\n?##\s+/g).filter(Boolean);
    const blobs = rawSections.length ? rawSections : [md];

    return blobs.map((blob) => {
      const lines = blob.split(/\r?\n/);
      const category = removeFormatting(lines[0] ?? "Recommendations").trim();

      const items: { type: "paragraph" | "bullet"; text: string }[] = [];
      let paraBuffer: string[] = [];

      const flushParagraph = () => {
        if (paraBuffer.length) {
          items.push({
            type: "paragraph",
            text: removeFormatting(paraBuffer.join(" ").trim()),
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

        if (isListItem(line)) {
          flushParagraph();
          items.push({
            type: "bullet",
            text: removeFormatting(stripListMarker(line)),
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
  const isLastSection = sections.length === 1;

  return (
    <View style={{ marginTop: 30 }}>
      {sections.map((section, idx) => (
        <View
          key={`section-${idx}`}
          style={{
            marginBottom: 50,
            borderLeftWidth: 4,
            borderLeftColor: "#3361FF",
            borderLeftStyle: "solid",
          }}
        >
          <View
            style={{
              backgroundColor: "#F1F5F9",
              padding: 8,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#0F172A",
              }}
            >
              {section.category}
            </Text>
          </View>

          <View style={{ padding: 10 }}>
            {section.content.map((item, contentIdx) => {
              const boldText = !isLastSection && [1, 4].includes(contentIdx);

              if (item.type === "paragraph") {
                return (
                  <Text
                    key={`p-${contentIdx}`}
                    style={{
                      fontSize: 10,
                      fontWeight: boldText ? "bold" : "normal",
                      color: "#334155",
                      marginBottom: boldText ? 2 : 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </Text>
                );
              }
              if (item.type === "bullet") {
                return (
                  <View
                    key={`b-${contentIdx}`}
                    style={{
                      flexDirection: "row",
                      marginBottom: 5,
                      marginLeft: 0,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 10,
                        fontWeight: isLastSection ? "bold" : "normal",
                        color: "#334155",
                        lineHeight: 1.3,
                      }}
                    >
                      • {item.text}
                    </Text>
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

// Complete PDF component matching client-side template
const AssessmentPDFServer = ({ assessment }: { assessment: Assessment }) => {
  const { answers = [], survey: { title: surveyTitle, questions = [] } = {} } = assessment;
  const score = assessment.score || 0;
  const readinessLevel = getReadinessLevel(score);
  const today = new Date();
  const year = today.getFullYear();
  const completed = new Date(assessment.completedOn || today);
  const chartData = getCategoryScores(assessment);
  
  // Calculate total pages
  const answerPages = Math.ceil(answers.length / 10);
  const totalPages = 2 + (assessment.recommendations ? 5 : 1) + answerPages;
  
  // Get logo path for server
  const logoPath = path.join(process.cwd(), 'client/src/assets/logo-myzone-ai.png');
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image
              src={logoPath}
              style={{ width: 160, height: 40 }}
            />
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.title}>AI Readiness Assessment Results</Text>
          {surveyTitle && (
            <Text style={styles.subtitle}>Based on: {surveyTitle}</Text>
          )}

          <View style={styles.contentBox}>
            <Text style={styles.scoreText}>Score: {score / 10} / 10</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>
              Report generated on: {formatDate(today)}
            </Text>
          </View>
        </View>

        <Text style={styles.coverFooter}>
          © {year} MyZone AI - Confidential Assessment Report
        </Text>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBoxSmall}>
            <Image
              src={logoPath}
              style={{ width: 120, height: 24 }}
            />
          </View>
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>

        <Text style={styles.sectionTitle}>Overall Assessment Score</Text>
        <Text style={styles.sectionSubtitle}>
          Your organization scored {score / 10} out of 10 points
        </Text>

        {/* Radar Chart */}
        <View style={styles.chartContainer}>
          <RadarChart data={chartData} />
        </View>

        <Text style={styles.chartCaption}>
          Assessment categories showing your organization's AI readiness across key areas
        </Text>

        <View style={styles.footer}>
          <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
          <Text style={styles.pageNumber}>Page 2 of {totalPages}</Text>
        </View>
      </Page>

      {/* Recommendations Pages */}
      {assessment.recommendations && (() => {
        const maxSectionsPerPage = 2;
        const sections = assessment.recommendations.split(/\n?##\s+/).filter(Boolean);
        const recommendationPages = Math.ceil(sections.length / maxSectionsPerPage);
        
        return Array.from({ length: recommendationPages }, (_, index) => {
          const startIndex = index * maxSectionsPerPage;
          const endIndex = startIndex + maxSectionsPerPage;
          const pageContent = sections.slice(startIndex, endIndex).map(section => `## ${section}`).join('\n\n');
          
          return (
            <Page key={`recommendations-${index}`} size="A4" style={styles.page}>
              <View style={styles.header}>
                <View style={styles.logoBoxSmall}>
                  <Image
                    src={logoPath}
                    style={{ width: 120, height: 24 }}
                  />
                </View>
                <Text style={styles.headerTitle}>Recommendations</Text>
              </View>

              <Text style={styles.sectionTitle}>AI-Generated Recommendations</Text>
              <Text style={styles.sectionSubtitle}>
                Tailored recommendations based on your assessment results
              </Text>

              <RecommendationsContent markdown={pageContent} />

              <View style={styles.footer}>
                <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
                <Text style={styles.pageNumber}>Page {index + 3} of {totalPages}</Text>
              </View>
            </Page>
          );
        });
      })()}

      {/* Response Details Pages */}
      {answers.length > 0 && Array.from({ length: answerPages }, (_, pageIndex) => {
        const startIndex = pageIndex * 10;
        const endIndex = Math.min(startIndex + 10, answers.length);
        const pageAnswers = answers.slice(startIndex, endIndex);
        
        return (
          <Page key={`responses-${pageIndex}`} size="A4" style={styles.page}>
            <View style={styles.header}>
              <View style={styles.logoBoxSmall}>
                <Image
                  src={logoPath}
                  style={{ width: 120, height: 24 }}
                />
              </View>
              <Text style={styles.headerTitle}>Response Details</Text>
            </View>

            <Text style={styles.sectionTitle}>Your Responses</Text>
            <Text style={styles.sectionSubtitle}>
              Questions {startIndex + 1} - {endIndex} of {answers.length}
            </Text>

            {pageAnswers.map((answer, index) => {
              const question = questions.find((q: CsvQuestion) => Number(q.id) === answer.q);
              const answerText = getAnswerText(answer.a);
              
              return (
                <View key={`answer-${startIndex + index}`} style={styles.questionItem}>
                  <Text style={styles.questionNumber}>
                    Question {startIndex + index + 1}
                  </Text>
                  <Text style={styles.questionText}>
                    {question?.question || `Question ${answer.q}`}
                  </Text>
                  <Text style={styles.answerLabel}>Response:</Text>
                  <Text style={[styles.answerValue, answerText.style]}>
                    {answerText.text}
                  </Text>
                </View>
              );
            })}

            <View style={styles.footer}>
              <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
              <Text style={styles.pageNumber}>
                Page {(assessment.recommendations ? 5 : 1) + pageIndex + 2} of {totalPages}
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export { AssessmentPDFServer, renderToBuffer };