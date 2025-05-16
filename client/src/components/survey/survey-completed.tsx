import { CheckCircle2, InfoIcon, Download } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CsvQuestion, Assessment } from "@shared/types";
import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { PdfButton } from './pdf-export';

interface SurveyCompletedProps {
  assessment: Assessment;
  questions?: CsvQuestion[];
}

export default function SurveyCompleted({
  assessment,
  questions = [],
}: SurveyCompletedProps) {
  const { answers = [] } = assessment;
  const chartRef = useRef<HTMLDivElement>(null);
  const responsesRef = useRef<HTMLDivElement>(null);

  // Define radar chart data type
  interface RadarChartData {
    subject: string;
    score: number;
    fullMark: number;
  }

  // Function to prepare data for radar chart
  const getRadarChartData = (): RadarChartData[] => {
    // Group questions by category
    const categoryMap = new Map<string, number[]>();

    questions.forEach((question: CsvQuestion, index: number) => {
      const category = question.category;
      if (!category) return;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      // Add this question's index to the category
      categoryMap.get(category)?.push(index);
    });

    // Calculate average score for each category
    const categoryScores = Array.from(categoryMap.entries()).map(
      ([category, questionIndices]) => {
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

        const avg =
          categoryAnswers.length > 0
            ? Math.round((sum / categoryAnswers.length) * 10) / 10
            : 0;

        return {
          subject: category,
          score: avg,
          fullMark: 10,
        };
      },
    );

    return categoryScores;
  };

  // Helper function to find question text by ID
  const getQuestionTextById = (
    questionId: number | null | undefined,
  ): string => {
    if (questionId === null || questionId === undefined) {
      return `Unknown Question`;
    }
    // Find the matching question by number
    const question = questions.find((q: CsvQuestion) => q.id === questionId);
    return question?.question || `Question ${questionId}`;
  };

  // Function to generate and download PDF report
  const generatePdf = useCallback(async () => {
    if (!chartRef.current) return;
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Get current date and quarter for title
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      const quarter = Math.floor((today.getMonth() / 3) + 1);
      const year = today.getFullYear();
      
      // Calculate readiness level based on score
      const readinessLevel = (assessment.score ?? 0) >= 80
        ? "advanced"
        : (assessment.score ?? 0) >= 60
          ? "intermediate"
          : (assessment.score ?? 0) >= 40
            ? "developing"
            : "beginning";
      
      // ----- Page 1: Cover Page -----
      
      // Create gradient background (light blue-gray)
      pdf.setFillColor(245, 247, 250);
      pdf.rect(0, 0, 210, 297, 'F');
      
      // Add logo placeholder (would be replaced with actual logo)
      pdf.setFillColor(65, 105, 225);
      pdf.roundedRect(70, 40, 70, 20, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("MyZone AI", 105, 53, { align: "center" });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Add title box with border
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(30, 100, 150, 80, 3, 3, 'S');
      
      // Add title
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Q${quarter} ${year}`, 105, 120, { align: "center" });
      pdf.text("AI Readiness Assessment", 105, 135, { align: "center" });
      
      // Add divider
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.line(50, 145, 160, 145);
      
      // Add score
      pdf.setFontSize(18);
      pdf.text(`Score: ${assessment.score || 0} / 100`, 105, 160, { align: "center" });
      
      // Add completion date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Completed on: ${dateStr}`, 105, 170, { align: "center" });
      
      // Add subtitle at bottom
      pdf.setFontSize(10);
      pdf.text("Generated by MyZone AI · AI Maturity & Readiness Framework", 105, 260, { align: "center" });
      
      // ----- Page 2: Results with Chart -----
      pdf.addPage();
      
      // Add small logo in header
      pdf.setFillColor(65, 105, 225);
      pdf.roundedRect(10, 10, 30, 10, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("MyZone AI", 25, 16, { align: "center" });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Assessment Results", 105, 25, { align: "center" });
      
      // Add description
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Based on your responses, your organization is at the ${readinessLevel}`, 105, 40, { align: "center" });
      pdf.text("stage of AI readiness.", 105, 46, { align: "center" });
      
      // Add radar chart section title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Category Breakdown", 20, 60);
      
      // Capture the chart as an image
      const chartCanvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      
      const chartImageData = chartCanvas.toDataURL("image/png");
      
      // Calculate chart dimensions to fit the PDF
      const imgWidth = 150;
      const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
      
      // Add chart to PDF
      pdf.addImage(chartImageData, "PNG", 30, 65, imgWidth, imgHeight);
      
      // Add score explanation text
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("This radar chart shows your organization's score across different", 105, 190, { align: "center" });
      pdf.text("dimensions of AI readiness. Higher scores (closer to the outer edge)", 105, 196, { align: "center" });
      pdf.text("indicate greater maturity in that category.", 105, 202, { align: "center" });
      
      // ----- Page 3+: Responses -----
      pdf.addPage();
      
      // Add small logo in header
      pdf.setFillColor(65, 105, 225);
      pdf.roundedRect(10, 10, 30, 10, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("MyZone AI", 25, 16, { align: "center" });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Your Responses", 105, 25, { align: "center" });
      
      let yPosition = 40;
      
      // Add each question and answer
      answers.forEach((answer: any, index: number) => {
        // If we're running out of space, add a new page
        if (yPosition > 250) {
          pdf.addPage();
          
          // Add small logo in header on new page
          pdf.setFillColor(65, 105, 225);
          pdf.roundedRect(10, 10, 30, 10, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          pdf.text("MyZone AI", 25, 16, { align: "center" });
          
          // Reset text color
          pdf.setTextColor(0, 0, 0);
          
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          pdf.text("Your Responses (continued)", 105, 25, { align: "center" });
          
          yPosition = 40;
        }
        
        const questionText = getQuestionTextById(answer.q);
        
        // Add question number with a colored box
        pdf.setFillColor(230, 235, 245);
        pdf.rect(15, yPosition - 5, 170, 8, 'F');
        
        // Split long question text to fit on page
        const questionLines = pdf.splitTextToSize(
          `Question ${index + 1}: ${questionText}`, 
          160
        );
        
        pdf.setTextColor(40, 40, 40);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 6 + 4;
        
        // Add answer with some styling
        pdf.setFont("helvetica", "normal");
        let answerText = "";
        let answerColor = [0, 0, 0]; // default black
        
        switch (answer.a) {
          case 2:
            answerText = "Strongly Agree";
            answerColor = [0, 120, 0]; // green
            break;
          case 1:
            answerText = "Agree";
            answerColor = [0, 100, 0]; // dark green
            break;
          case 0:
            answerText = "Neutral";
            answerColor = [100, 100, 100]; // gray
            break;
          case -1:
            answerText = "Disagree";
            answerColor = [150, 0, 0]; // dark red
            break;
          case -2:
            answerText = "Strongly Disagree";
            answerColor = [200, 0, 0]; // red
            break;
          default:
            answerText = "Not answered";
            answerColor = [100, 100, 100]; // gray
        }
        
        pdf.setTextColor(answerColor[0], answerColor[1], answerColor[2]);
        pdf.text(`Your answer: ${answerText}`, 20, yPosition);
        pdf.setTextColor(0, 0, 0); // reset to black
        yPosition += 16;
      });
      
      // ----- Page: Recommendations -----
      pdf.addPage();
      
      // Add small logo in header
      pdf.setFillColor(65, 105, 225);
      pdf.roundedRect(10, 10, 30, 10, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("MyZone AI", 25, 16, { align: "center" });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Recommendations", 105, 25, { align: "center" });
      
      // Add descriptive text
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      // Add recommendation intro
      let recommendationText = "Based on your AI readiness assessment results, here are some recommendations to help improve your organization's AI maturity:";
      
      const recommendationIntro = pdf.splitTextToSize(recommendationText, 170);
      pdf.text(recommendationIntro, 20, 40);
      
      // Add recommendations based on readiness level
      yPosition = 60;
      
      pdf.setFillColor(245, 245, 250);
      pdf.roundedRect(20, yPosition - 8, 170, 120, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Key Recommendations:", 30, yPosition);
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      yPosition += 10;
      
      // Different recommendations based on readiness level
      let recommendations = [];
      
      if (readinessLevel === "beginning") {
        recommendations = [
          "Focus on AI awareness and education for key stakeholders",
          "Start building basic data infrastructure and governance",
          "Identify small pilot projects with clear business value",
          "Develop an initial AI strategy aligned with business goals",
          "Consider partnerships with AI solution providers to accelerate adoption"
        ];
      } else if (readinessLevel === "developing") {
        recommendations = [
          "Expand data infrastructure and integration capabilities",
          "Develop more robust AI governance frameworks and policies",
          "Invest in building internal AI/ML skills and capabilities",
          "Scale successful pilot projects to production environments",
          "Establish clear metrics to measure AI initiative success"
        ];
      } else if (readinessLevel === "intermediate") {
        recommendations = [
          "Formalize AI center of excellence or specialized teams",
          "Implement advanced data architecture and MLOps practices",
          "Develop comprehensive AI risk management and ethics frameworks",
          "Foster deeper integration of AI across multiple business units",
          "Create systems for continuous AI model monitoring and improvement"
        ];
      } else {
        recommendations = [
          "Lead industry innovation through novel AI applications",
          "Establish mature AI governance and ethical frameworks",
          "Develop advanced AI talent acquisition and retention strategies",
          "Create scalable MLOps infrastructure for enterprise-wide deployment",
          "Integrate AI into core business strategy and decision processes"
        ];
      }
      
      // Add recommendations with bullet points
      recommendations.forEach((rec, idx) => {
        pdf.text(`• ${rec}`, 30, yPosition);
        yPosition += 10;
      });
      
      // Add note about detailed recommendations
      yPosition += 10;
      const note = "This assessment provides a starting point for your AI journey. For detailed, customized recommendations, please contact the MyZone AI team for a comprehensive assessment and strategy session.";
      
      const noteLines = pdf.splitTextToSize(note, 160);
      pdf.text(noteLines, 30, yPosition);
      
      // Add footer with page numbers and copyright to all pages
      const totalPages = pdf.getNumberOfPages();
      for(let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`MyZone AI Readiness Assessment - Page ${i} of ${totalPages}`, 20, 285);
        pdf.text(`© ${year} MyZone AI`, 170, 285, { align: "right" });
      }
      
      // Generate filename based on quarter and year
      const filename = `ai-readiness-report-Q${quarter}-${year}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  }, [assessment, answers, questions, chartRef]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start py-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-start">
            <h2 className="text-2xl text-foreground font-bold">
              Assessment Completed
            </h2>
            <p className="text-muted-foreground mt-2">
              You scored {assessment.score} out of 100 on this AI readiness
              assessment.
            </p>
          </div>
        </div>
        <Button className="flex items-center gap-2" onClick={generatePdf}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Tabs defaultValue="results" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="responses">Your Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-x-3">
                <span>AI Readiness Score: {assessment.score ?? 0}/100</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2">
                    This score represents your organization's current AI
                    readiness level
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Based on your responses, your organization is at the
                {(assessment.score ?? 0) >= 80
                  ? " advanced "
                  : (assessment.score ?? 0) >= 60
                    ? " intermediate "
                    : (assessment.score ?? 0) >= 40
                      ? " developing "
                      : " beginning "}
                stage of AI readiness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-4" ref={chartRef}>
                <ChartContainer
                  config={{
                    // Config for the score data point
                    score: {
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[350px] w-full"
                >
                  <RadarChart outerRadius="80%" data={getRadarChartData()}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "hsl(var(--foreground))",
                        fontSize: 12,
                      }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 10]}
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <Radar
                      name="Organization Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                      dot={{
                        r: 4,
                        fillOpacity: 1,
                      }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Category
                                  </span>
                                  <span className="font-bold">
                                    {data.payload.subject}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Score
                                  </span>
                                  <span className="font-bold">
                                    {data.value}/10
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="responses">
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div ref={responsesRef}>
              {answers.map((answer: any, index: number) => (
                <div key={`answer-${index}`}>
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm text-foreground md:text-base font-medium flex-1">
                      Question {index + 1}: {getQuestionTextById(answer.q)}
                    </h3>
                    {questions.find((q) => q.id === answer.q)?.details && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 dark:text-white flex-shrink-0 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent className="p-2 max-w-[400px]">
                          {questions.find((q) => q.id === answer.q)?.details}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your answer:{" "}
                    <span className="font-medium">
                      {answer.a === 2
                        ? "Strongly Agree"
                        : answer.a === 1
                          ? "Agree"
                          : answer.a === 0
                            ? "Neutral"
                            : answer.a === -1
                              ? "Disagree"
                              : answer.a === -2
                                ? "Strongly Disagree"
                                : "Not answered"}
                    </span>
                  </p>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
