import React from "react";
import { Button } from "@/components/ui/button";
import { RatingOption, SurveySection, SurveySummary } from "@/schemas/survey-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2 } from "lucide-react";

interface SurveySummaryProps {
  sections: SurveySection[];
  surveyData: SurveySummary;
  onSubmit: () => void;
  onEdit: (sectionIndex: number) => void;
}

export default function SurveySummaryComponent({ 
  sections, 
  surveyData, 
  onSubmit,
  onEdit
}: SurveySummaryProps) {
  
  // Helper function to get question text by number
  const getQuestionText = (section: SurveySection, questionNumber: number) => {
    const question = section.questions.find(q => q.number === questionNumber);
    return question ? question.question : "";
  };
  
  // Helper function to extract the question number from the field name
  const getQuestionNumber = (fieldName: string): number => {
    const match = fieldName.match(/question_(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Survey Summary</h2>
      <p className="text-gray-600">
        Please review your responses before submitting. You can edit any section by clicking the "Edit" button.
      </p>
      
      {sections.map((section, sectionIndex) => {
        const sectionData = surveyData[sectionIndex] || {};
        
        return (
          <Card key={section.category} className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
              <CardTitle className="text-xl">{section.category}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(sectionIndex)}
                className="flex items-center text-blue-600"
              >
                <Edit2 size={16} className="mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(sectionData).map(([fieldName, value]) => {
                  const questionNumber = getQuestionNumber(fieldName);
                  const questionText = getQuestionText(section, questionNumber);
                  
                  return (
                    <div key={fieldName} className="pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <p className="text-gray-800 font-medium mb-1 sm:mb-0">
                          <span className="text-primary-600 mr-1">Q{questionNumber}.</span> 
                          {questionText}
                        </p>
                        <div className="mt-1 sm:mt-0">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
                            ${getSeverityColor(value as RatingOption)}`}>
                            {value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onEdit(sections.length - 1)}
        >
          Back to Survey
        </Button>
        
        <Button 
          type="button" 
          onClick={onSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit Survey
        </Button>
      </div>
    </div>
  );
}

// Helper function to get color based on rating
function getSeverityColor(rating: RatingOption): string {
  switch (rating) {
    case "Strongly Disagree":
      return "bg-red-100 text-red-800";
    case "Disagree":
      return "bg-orange-100 text-orange-800";
    case "Neutral":
      return "bg-yellow-100 text-yellow-800";
    case "Agree":
      return "bg-green-100 text-green-800";
    case "Strongly Agree":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}