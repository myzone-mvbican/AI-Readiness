import { SurveySection, SurveyFormData, answerOptions } from "@/models/survey-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SurveySummaryProps {
  sections: SurveySection[];
  formData: SurveyFormData;
  onBack: () => void;
  onEdit: (sectionIndex: number) => void;
  onSubmit: () => void;
}

export default function SurveySummary({
  sections,
  formData,
  onBack,
  onEdit,
  onSubmit,
}: SurveySummaryProps) {
  // Function to get the label for a given answer value
  const getAnswerLabel = (value: string) => {
    const option = answerOptions.find(opt => opt.value === value);
    return option ? option.label : "No answer";
  };

  // Calculate total questions and total answered
  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  
  const answeredQuestions = Object.keys(formData).length;
  
  const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

  return (
    <div className="space-y-8">
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-xl font-semibold text-gray-800">Review Your Assessment</h2>
          <p className="text-gray-500 mt-1">
            You have completed {completionPercentage}% of the assessment ({answeredQuestions} of {totalQuestions} questions)
          </p>
        </div>
        
        <div className="p-6">
          <Accordion type="multiple" className="w-full" defaultValue={sections.map((_, i) => `item-${i}`)}>
            {sections.map((section, sectionIndex) => (
              <AccordionItem key={section.category} value={`item-${sectionIndex}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="text-base font-medium">{section.category}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion from toggling
                        onEdit(sectionIndex);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-4">
                    {section.questions.map((question) => {
                      const answer = formData[question.id.toString()];
                      
                      return (
                        <div key={question.id} className="border-b pb-4 last:border-0">
                          <p className="font-medium text-gray-800 mb-1">
                            {question.id}. {question.summary}
                          </p>
                          <p className="font-medium text-blue-600">
                            {answer ? getAnswerLabel(answer) : "Not answered"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onSubmit}
          disabled={answeredQuestions !== totalQuestions}
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}