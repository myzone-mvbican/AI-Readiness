import React from 'react';
import { Document } from '@react-pdf/renderer';
import { Assessment, CsvQuestion } from '@shared/types';
import PageCover from './page-cover';
import PageChart from './page-chart';
import PageResponses from './page-responses';
import PageRecommendations from './page-recommendations';

interface AssessmentPdfProps {
  assessment: Assessment;
  questions: CsvQuestion[];
  chartImageUrl: string;
}

const AssessmentPdf: React.FC<AssessmentPdfProps> = ({ assessment, questions, chartImageUrl }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
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
  
  // Split answers for pagination (max 5 per page)
  const ANSWERS_PER_PAGE = 5;
  const answerPages = [];
  const { answers } = assessment;
  
  for (let i = 0; i < answers.length; i += ANSWERS_PER_PAGE) {
    answerPages.push(answers.slice(i, i + ANSWERS_PER_PAGE));
  }
  
  // Calculate total number of pages (1 cover + 1 chart + answer pages + 1 recommendation)
  const totalPages = 1 + 1 + answerPages.length + 1;
  
  return (
    <Document>
      {/* Cover Page */}
      <PageCover 
        score={assessment.score || 0}
        date={dateStr}
        quarter={quarter}
        year={year}
      />
      
      {/* Chart Page */}
      <PageChart
        readinessLevel={readinessLevel}
        chartImageUrl={chartImageUrl}
        pageNumber={2}
        totalPages={totalPages}
        year={year}
      />
      
      {/* Response Pages */}
      {answerPages.map((pageAnswers, pageIndex) => (
        <PageResponses
          key={`responses-page-${pageIndex}`}
          answers={pageAnswers}
          questions={questions}
          pageNumber={3 + pageIndex}
          totalPages={totalPages}
          year={year}
          isContinued={pageIndex > 0}
        />
      ))}
      
      {/* Recommendations Page */}
      <PageRecommendations
        readinessLevel={readinessLevel}
        score={assessment.score || 0}
        pageNumber={totalPages}
        totalPages={totalPages}
        year={year}
      />
    </Document>
  );
};

export default AssessmentPdf;