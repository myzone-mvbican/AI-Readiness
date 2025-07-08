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

// Exact styles copied from client/src/components/survey/assessment-pdf.tsx
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  coverPage: {
    flexDirection: "column",
    backgroundColor: "#3361FF",
    padding: 30,
    height: "100%",
  },
  logoContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  logoBox: {
    width: 180,
    height: 50,
    padding: 10,
    backgroundColor: "#3361FF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBoxSmall: {
    width: 145,
    height: 30,
    backgroundColor: "#3361FF",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoTextSmall: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 30,
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
    color: "#fff",
  },
  contentBox: {
    border: "1px solid #CBD5E1",
    borderRadius: 5,
    padding: 15,
    margin: "20px auto",
    width: "70%",
    backgroundColor: "white",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#0F172A",
  },
  divider: {
    borderBottom: "1px solid #E2E8F0",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    textAlign: "center",
    color: "#64748B",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1px solid #E2E8F0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverFooter: {
    textAlign: "center",
    fontSize: 10,
    color: "#fff",
    marginTop: "auto",
    marginBottom: 30,
  },
  headerLogo: {
    width: 80,
    height: 24,
    backgroundColor: "#4361EE",
    color: "white",
    borderRadius: 4,
    padding: 5,
    fontSize: 10,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 12,
    color: "#475569",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 15,
    color: "#475569",
  },
  chartPlaceholder: {
    width: 400,
    height: 300,
    backgroundColor: "#F1F5F9",
    marginVertical: 20,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  chartText: {
    color: "#64748B",
    fontSize: 12,
  },
  chartImage: {
    height: 150,
    marginVertical: 20,
    alignSelf: "center",
  },
  chartCaption: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },
  questionItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #F1F5F9",
  },
  questionNumber: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 2,
  },
  questionText: {
    fontSize: 11,
    color: "#334155",
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  answerValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  answerPositive: {
    color: "#16A34A",
  },
  answerNeutral: {
    color: "#6B7280",
  },
  answerNegative: {
    color: "#DC2626",
  },
  recommendationBox: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 5,
    marginVertical: 15,
  },
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 15,
    fontSize: 10,
    color: "#334155",
  },
  recommendationText: {
    fontSize: 10,
    flex: 1,
    color: "#334155",
  },
  recommendationCard: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 4,
    border: "1pt solid #E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  recommendationCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 6,
  },
  recommendationCardText: {
    fontSize: 10,
    color: "#334155",
    marginVertical: 4,
    lineHeight: 1.4,
  },
  pageNumber: {
    fontSize: 10,
    color: "#94A3B8",
  },
});

// Helper functions - exact copies from client
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

const getRecommendations = (readinessLevel: string) => {
  if (readinessLevel === "beginning") {
    return [
      "Focus on AI awareness and education for key stakeholders",
      "Start building basic data infrastructure and governance",
      "Identify small pilot projects with clear business value",
      "Develop an initial AI strategy aligned with business goals",
      "Consider partnerships with AI solution providers to accelerate adoption",
    ];
  } else if (readinessLevel === "developing") {
    return [
      "Expand data infrastructure and integration capabilities",
      "Develop more robust AI governance frameworks and policies",
      "Invest in building internal AI/ML skills and capabilities",
      "Scale successful pilot projects to production environments",
      "Establish clear metrics to measure AI initiative success",
    ];
  } else if (readinessLevel === "intermediate") {
    return [
      "Formalize AI center of excellence or specialized teams",
      "Implement advanced data architecture and MLOps practices",
      "Develop comprehensive AI risk management and ethics frameworks",
      "Foster deeper integration of AI across multiple business units",
      "Create systems for continuous AI model monitoring and improvement",
    ];
  } else {
    return [
      "Lead industry innovation through novel AI applications",
      "Establish mature AI governance and ethical frameworks",
      "Develop advanced AI talent acquisition and retention strategies",
      "Create scalable MLOps infrastructure for enterprise-wide deployment",
      "Integrate AI into core business strategy and decision processes",
    ];
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Mock radar chart data generator
const getRadarChartData = (assessment: any) => {
  // Mock data for radar chart - you might want to implement real calculation
  return [
    { name: "Strategy & Vision", score: 6, fullMark: 10 },
    { name: "Data & Analytics", score: 7, fullMark: 10 },
    { name: "Technology Infrastructure", score: 5, fullMark: 10 },
    { name: "Skills & Talent", score: 4, fullMark: 10 },
    { name: "Culture & Change", score: 6, fullMark: 10 },
    { name: "Governance & Risk", score: 5, fullMark: 10 },
  ];
};

// Component to parse and render markdown content in PDF - exact copy from client
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

// PDF Radar Chart Component - simplified version
const RadarChartPDF = ({
  data,
  width = 550,
  height = 300,
}: {
  data: Array<{ name: string; score: number; fullMark: number }>;
  width?: number;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>No chart data available</Text>
      </View>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.8;

  const dataPoints = data
    .map((item, index) => {
      const angle = ((Math.PI * 2) / data.length) * index;
      const normalizedValue = item.score / item.fullMark;
      const x = centerX + radius * normalizedValue * Math.sin(angle);
      const y = centerY - radius * normalizedValue * Math.cos(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const labelPoints = data.map((item, index) => {
    const angle = ((Math.PI * 2) / data.length) * index;
    const x = centerX + (radius + 15) * Math.sin(angle);
    const y = centerY - (radius + 15) * Math.cos(angle);
    return {
      x,
      y,
      label: item.name,
      align: x > centerX ? "left" : x < centerX ? "right" : "center",
      vAlign: y > centerY ? "top" : "bottom",
    };
  });

  const circles = [0.33, 0.66, 1].map((scale) => {
    return {
      r: radius * scale,
      stroke: "#E2E8F0",
      strokeWidth: 0.5,
      strokeDasharray: "2,2",
    };
  });

  return (
    <View style={{ width, height, marginBottom: 25 }}>
      <Svg height={height} width={width}>
        {circles.map((circle, i) => (
          <Circle
            key={`circle-${i}`}
            cx={centerX}
            cy={centerY}
            r={circle.r}
            stroke={circle.stroke}
            strokeWidth={circle.strokeWidth}
            strokeDasharray={circle.strokeDasharray}
            fill="none"
          />
        ))}

        {data.map((_, i) => {
          const angle = ((Math.PI * 2) / data.length) * i;
          const endX = centerX + radius * Math.sin(angle);
          const endY = centerY - radius * Math.cos(angle);

          return (
            <Line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#E2E8F0"
              strokeWidth={0.5}
            />
          );
        })}

        <Polygon
          points={dataPoints}
          fill="#4361EE"
          fillOpacity={0.3}
          stroke="#4361EE"
          strokeWidth={1.5}
        />

        {data.map((item, i) => {
          const angle = ((Math.PI * 2) / data.length) * i;
          const normalizedValue = item.score / item.fullMark;
          const x = centerX + radius * normalizedValue * Math.sin(angle);
          const y = centerY - radius * normalizedValue * Math.cos(angle);

          return (
            <Circle key={`point-${i}`} cx={x} cy={y} r={3} fill="#4361EE" />
          );
        })}

        <Line
          x1={centerX}
          y1={centerY}
          x2={centerX + radius}
          y2={centerY}
          stroke="#94A3B8"
          strokeWidth={0.5}
        />
        {[0, 3, 6, 10].map((value) => {
          const x = centerX + (radius * value) / 10;
          return (
            <Text
              key={`scale-${value}`}
              x={x}
              y={centerY + 10}
              textAnchor="middle"
              fill="#64748B"
              style={{ fontSize: 8 }}
            >
              {value}
            </Text>
          );
        })}
      </Svg>

      {labelPoints.map((point, i) => (
        <Text
          key={`label-${i}`}
          style={{
            position: "absolute",
            left:
              point.x -
              (point.align === "right" ? 110 : point.align === "left" ? 0 : 55),
            top: point.y - (point.vAlign === "bottom" ? 5 : 5),
            width: 110,
            fontSize: 8,
            textAlign: (point.align === "left"
              ? "left"
              : point.align === "right"
                ? "right"
                : "center") as any,
            color: "#121212",
          }}
        >
          {point.label}
        </Text>
      ))}
    </View>
  );
};

// Main PDF Component - EXACT copy from client
export const ExactAssessmentPDF = ({ assessment }: { assessment: any }) => {
  const { answers = [], survey: { title: surveyTitle, questions = [] } = {} } = assessment;
  const score = assessment.score || 0;

  // Determine readiness level
  const readinessLevel = getReadinessLevel(score);

  // Calculate date and quarter
  const today = new Date();
  const year = today.getFullYear();

  // Calculate total pages: Cover + Results + Recommendations + Responses
  const answerPages = Math.ceil(answers.length / 10);
  const totalPages = 2 + (assessment.recommendations ? 5 : 1) + answerPages;

  const chartData = getRadarChartData(assessment);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>MyZone AI</Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: "center" }}>
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
          Generated by MyZone AI · AI Readiness Framework
        </Text>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBoxSmall}>
            <Text style={styles.logoTextSmall}>MyZone AI</Text>
          </View>
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>

        <Text style={styles.sectionTitle}>AI Readiness Score</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your responses, your organization is at the {readinessLevel}{" "}
          stage of AI readiness.
        </Text>

        {chartData && chartData.length > 0 ? (
          <View>
            <RadarChartPDF data={chartData} />
            <Text style={styles.chartCaption}>
              This radar chart shows your organization's score across different
              dimensions of AI readiness.
            </Text>
            <Text style={styles.chartCaption}>
              Higher scores (closer to the edges) indicate greater maturity in
              that category.
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

      {/* Recommendation Pages */}
      {(() => {
        if (assessment.recommendations) {
          // Parse markdown into sections (each section starts with ## heading)
          const sections = assessment.recommendations
            .split(/##\s+/)
            .filter(Boolean);

          // Group recommendations into pages (2 per page)
          const recommendationPages = [];
          for (let i = 0; i < sections.length; i += 2) {
            const pageContent = [];
            pageContent.push("## " + sections[i]);

            if (i + 1 < sections.length) {
              pageContent.push("## " + sections[i + 1]);
            }

            recommendationPages.push(pageContent.join("\n\n"));
          }

          // Generate pages
          return recommendationPages.map((pageContent, index) => (
            <Page
              key={`recommendations-${index}`}
              size="A4"
              style={styles.page}
            >
              <View style={styles.header}>
                <View style={styles.logoBoxSmall}>
                  <Text style={styles.logoTextSmall}>MyZone AI</Text>
                </View>
                <Text style={styles.headerTitle}>Recommendations</Text>
              </View>

              <Text style={styles.sectionTitle}>
                Personalized AI Recommendations
              </Text>
              <Text style={styles.sectionSubtitle}>
                Based on your assessment score of {score / 10}/10 and insights
                from "MyZone AI Blueprint"
              </Text>

              <RecommendationsContent markdown={pageContent} />

              <View style={styles.footer}>
                <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
                <Text style={styles.pageNumber}>
                  Page {index + 3} of {totalPages}
                </Text>
              </View>
            </Page>
          ));
        } else {
          // Static recommendations page
          const staticRecommendations = getRecommendations(readinessLevel);

          return (
            <Page key="recommendations-static" size="A4" style={styles.page}>
              <View style={styles.header}>
                <View style={styles.logoBoxSmall}>
                  <Text style={styles.logoTextSmall}>MyZone AI</Text>
                </View>
                <Text style={styles.headerTitle}>Recommendations</Text>
              </View>

              <Text style={styles.sectionTitle}>Recommendations</Text>
              <Text style={styles.sectionSubtitle}>
                Based on your assessment score of {score / 10}/10
              </Text>

              <View style={styles.recommendationBox}>
                {staticRecommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recommendationItem}>
                    <Text style={styles.recommendationBullet}>•</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>

              <Text
                style={{
                  fontSize: 9,
                  fontStyle: "italic",
                  color: "#64748B",
                  marginTop: 10,
                }}
              >
                For a complete AI readiness strategy customized to your
                organization's specific needs, please contact the MyZone AI team
                for a comprehensive consultation.
              </Text>

              <View style={styles.footer}>
                <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
                <Text style={styles.pageNumber}>Page 3 of {totalPages}</Text>
              </View>
            </Page>
          );
        }
      })()}

      {/* Split responses into pages of 10 items each */}
      {Array.from({ length: answerPages }).map((_, pageIndex) => {
        const pageAnswers = answers.slice(pageIndex * 10, (pageIndex + 1) * 10);
        const currentIndex = totalPages - answerPages + pageIndex + 1;

        return (
          <Page key={`responses-${pageIndex}`} size="A4" style={styles.page}>
            <View style={styles.header}>
              <View style={styles.logoBoxSmall}>
                <Text style={styles.logoTextSmall}>MyZone AI</Text>
              </View>
              <Text style={styles.headerTitle}>
                {pageIndex === 0
                  ? "Your Responses"
                  : "Your Responses (continued)"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              {pageIndex === 0
                ? "Assessment Answers"
                : "Assessment Answers (continued)"}
            </Text>

            {pageAnswers.map((answer, index) => {
              const actualIndex = pageIndex * 10 + index;
              const question = questions.find(
                (q: any) => Number(q.id) === answer.q,
              );
              const { text: answerText, style: answerStyle } = getAnswerText(
                answer.a,
              );

              return (
                <View key={`answer-${actualIndex}`} style={styles.questionItem}>
                  <Text style={styles.questionNumber}>
                    Question {actualIndex + 1}
                  </Text>
                  <Text style={styles.questionText}>
                    {question?.question || `Unknown Question`}
                  </Text>
                  <Text style={styles.answerLabel}>
                    Your answer:{" "}
                    <Text style={[styles.answerValue, answerStyle]}>
                      {answerText}
                    </Text>
                  </Text>
                </View>
              );
            })}

            <View style={styles.footer}>
              <Text style={styles.pageNumber}>© {year} MyZone AI</Text>
              <Text style={styles.pageNumber}>
                Page {currentIndex} of {totalPages}
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};