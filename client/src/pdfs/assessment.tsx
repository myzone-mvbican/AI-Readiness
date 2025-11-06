import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { formatDate, getRadarChartData } from "@/lib/utils";
import { Assessment, CsvQuestion } from "@shared/types";
import styles from "./styles";
import RadarChart from "./radar";
import { getAnswerText, getReadinessLevel, getRecommendations } from "./utils";

// Component to parse and render markdown content in PDF
const RecommendationsContent = ({ markdown }: { markdown: string }) => {
  /**
   * Lightweight scrub of inline markdown so the PDF shows clean text.
   */
  const removeFormatting = (str: string) => {
    return str
      .replace(/[\*_]/g, "")
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g,
        "",
      )
      .trim();
  };

  /**
   * Return true if a trimmed line is an ordered/unordered list item.
   *
   *  - Unordered: "- text", "* text", "• text"
   *  - Ordered  : "1. text" OR "1) text" (but NOT "1.2" / decimal numbers)
   */
  const isListItem = (line: string): boolean => {
    if (/^(?:\*|-|•)\s+/.test(line)) return true; // unordered
    // ordered list – number followed by . or ) and NOT another digit (avoids 9.1)
    return /^(\d+)([.)])\s*/.test(line) && !/^\d+\.\d/.test(line);
  };

  /**
   * Strip the list marker from a line and return its text.
   */
  const stripListMarker = (line: string): string => {
    // unordered
    if (/^(?:\*|-|•)\s+/.test(line)) {
      return line.replace(/^(?:\*|-|•)\s+/, "");
    }
    // ordered numeric ("1." or "1)")
    return line.replace(/^(\d+)([.)])\s*/, "");
  };

  /**
   * Parse a markdown snippet into array of sections, each with category & content.
   */
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
          return; // blank line
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

      flushParagraph(); // leftover paragraph

      return { category, content: items };
    });
  };

  // Parse markdown into structured sections once per render.
  const sections = parseMarkdown(markdown);

  const isLastSection = sections.length === 1;

  /**
   * Render: each section in a vertical stack. Parent component controls paging
   * (e.g. max two sections per page).
   */
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
          {/* Section header */}
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

          {/* Section body */}
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
export const AssessmentPDF = ({
  assessment,
  logoUrl,
}: {
  assessment: any; // Using any to handle the extended assessment with survey data
  logoUrl: string;
}) => {
  const { answers = [], survey = {} } = assessment;
  const { title: surveyTitle, questions = [] } = survey;
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

  const logoPath = logoUrl || "@/assets/logo-keeran-ai.png";

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.logoContainer}>
          <Image src={logoPath} style={styles.logoBox} />
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
          Generated by Keeran AI · AI Readiness Framework
        </Text>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoPath} style={styles.logoBoxSmall} />
          <Text style={styles.headerTitle}>Assessment Results</Text>
        </View>

        <Text style={styles.sectionTitle}>AI Readiness Score</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your responses, your organization is at the {readinessLevel}{" "}
          stage of AI readiness.
        </Text>

        {chartData && chartData.length > 0 ? (
          <View>
            <RadarChart data={chartData} />
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
          <Text style={styles.pageNumber}>© {year} Keeran AI</Text>
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
                <Image src={logoPath} style={styles.logoBoxSmall} />
                <Text style={styles.headerTitle}>Recommendations</Text>
              </View>

              <Text style={styles.sectionTitle}>
                Personalized AI Recommendations
              </Text>
              <Text style={styles.sectionSubtitle}>
                Based on your assessment score of {score / 10}/10 and insights
                from "MyZone AI Blueprint"
              </Text>

              {/* Using the RecommendationsContent component for each page */}
              <RecommendationsContent markdown={pageContent} />

              <View style={styles.footer}>
                <Text style={styles.pageNumber}>© {year} Keeran AI</Text>
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
                <Image src={logoPath} style={styles.logoBoxSmall} />
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
                organization's specific needs, please contact the Keeran AI team
                for a comprehensive consultation.
              </Text>

              <View style={styles.footer}>
                <Text style={styles.pageNumber}>© {year} Keeran AI</Text>
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
              <Image src={logoPath} style={styles.logoBoxSmall} />
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

            {pageAnswers.map((answer: any, index: number) => {
              const actualIndex = pageIndex * 10 + index;
              const question = questions.find(
                (q: CsvQuestion) => String(q.id) === String(answer.q),
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
              <Text style={styles.pageNumber}>© {year} Keeran AI</Text>
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

export default AssessmentPDF;
