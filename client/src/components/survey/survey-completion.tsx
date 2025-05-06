import React from "react";
import { SurveySummary, SurveySection, RatingOption } from "@/schemas/survey-schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Download, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

interface SurveyCompletionProps {
  surveyData: SurveySummary;
  sections: SurveySection[];
}

interface CategoryScore {
  category: string;
  score: number;
  level: "Low" | "Medium" | "High";
  recommendation: string;
}

export default function SurveyCompletion({ surveyData, sections }: SurveyCompletionProps) {
  // Calculate the scores for each category
  const categoryScores: CategoryScore[] = calculateCategoryScores(surveyData, sections);
  
  // Calculate overall score (average of all category scores)
  const overallScore = Math.round(
    (categoryScores.reduce((sum, cat) => sum + cat.score, 0) / categoryScores.length) * 20
  );
  
  // Format data for the radar chart
  const radarData = categoryScores.map(cat => ({
    subject: cat.category,
    A: cat.score,
    fullMark: 5,
  }));

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto">
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl font-bold">Survey Complete!</CardTitle>
          <CardDescription className="mt-2">Your AI readiness assessment has been processed</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-8">
          {/* Overall Score */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-600">Your AI Readiness Score:</h3>
            <p className="text-5xl font-bold text-blue-600 mt-2">{overallScore}%</p>
          </div>
          
          {/* Radar Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-600 text-center mb-4">Readiness Breakdown:</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar
                    name="Your Score"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Error Alert for Report */}
          <Alert variant="destructive" className="mt-8 border-red-200 bg-red-50">
            <AlertDescription>
              There was an error generating your report. Please try again later.
            </AlertDescription>
          </Alert>
          
          {/* Detailed Analysis & Recommendations */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Detailed Analysis & Recommendations:</h3>
            <Accordion type="single" collapsible className="space-y-4">
              {categoryScores.map((category, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 [&>svg]:text-blue-500">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="font-medium">{category.category}</span>
                      <Badge className="ml-2" variant={getBadgeVariant(category.level)}>
                        {category.level}: {category.score.toFixed(1)} / 5
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 border-t">
                    <p className="text-gray-700">{category.recommendation}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-4 border-t pt-6 pb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Home size={16} />
              Back to Home
            </Button>
          </Link>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Download size={16} />
            Download PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to calculate scores for each category
function calculateCategoryScores(surveyData: SurveySummary, sections: SurveySection[]): CategoryScore[] {
  const scoreMap: Record<RatingOption, number> = {
    "Strongly Disagree": 1,
    "Disagree": 2,
    "Neutral": 3,
    "Agree": 4,
    "Strongly Agree": 5
  };
  
  const categoryRecommendations: Record<string, string> = {
    "Strategy & Vision": "Good AI strategy but limited alignment across departments. Create cross-functional teams to ensure consistent implementation.",
    "Culture & Change-Readiness": "Some acceptance of AI initiatives but siloed enthusiasm. Increase cross-functional collaboration and share AI success stories.",
    "Skills & Literacy": "Some departments show good AI literacy but gaps exist. Implement skills assessment and a more comprehensive learning program.",
    "Data & Information": "Moderate data infrastructure with some ML preparation. Focus on expanding labeled datasets and creating data pipelines.",
    "Technology & Integration": "Moderate technology stack with partial system integration. Focus on reducing silos and improving interoperability.",
    "Governance & Risk": "Structured governance with reasonable risk assessment. Develop more robust monitoring and accountability mechanisms.",
    "Implementation": "Multiple AI initiatives underway with basic monitoring. Focus on measuring ROI and expanding successful approaches."
  };
  
  // Group questions by category
  const categorySections: Record<string, Record<string, RatingOption>> = {};
  
  // Iterate through survey data
  Object.entries(surveyData).forEach(([sectionIndex, sectionData]) => {
    const sectionNumber = parseInt(sectionIndex, 10);
    const section = sections[sectionNumber];
    
    if (section) {
      // Get or create category data
      if (!categorySections[section.category]) {
        categorySections[section.category] = {};
      }
      
      // Add all question responses for this category
      Object.entries(sectionData).forEach(([questionField, response]) => {
        categorySections[section.category][questionField] = response as RatingOption;
      });
    }
  });
  
  // Calculate average score for each category
  return Object.entries(categorySections).map(([category, responses]) => {
    // Get numerical scores
    const scores = Object.values(responses).map(response => scoreMap[response] || 0);
    
    // Calculate average
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    // Determine level based on score
    let level: "Low" | "Medium" | "High";
    if (averageScore < 2.5) level = "Low";
    else if (averageScore < 4) level = "Medium";
    else level = "High";
    
    return {
      category,
      score: averageScore,
      level,
      recommendation: categoryRecommendations[category] || "No specific recommendations available."
    };
  });
}

// Helper function to get badge variant based on performance level
function getBadgeVariant(level: string): "default" | "destructive" | "outline" | "secondary" | null | undefined {
  switch (level) {
    case "Low":
      return "destructive";
    case "Medium":
      return "secondary";
    case "High":
      return "default";
    default:
      return "outline";
  }
}