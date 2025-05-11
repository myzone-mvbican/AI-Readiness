import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadialChart } from './radial-chart';
import { DownloadIcon, HomeIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Assessment } from '@shared/schema';

interface SurveyCompletionProps {
  assessment: Assessment;
  score: number;
  maxScore: number;
  onDownloadResults: () => void;
}

export function SurveyCompletion({ assessment, score, maxScore, onDownloadResults }: SurveyCompletionProps) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Assessment Complete!</CardTitle>
        <CardDescription>
          Thank you for completing the AI Readiness Assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md">
          <RadialChart score={percentage} />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-medium">Your AI Readiness Score: {percentage}%</h3>
          <p className="text-muted-foreground">
            Based on your responses, we've calculated your organization's AI readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
          <Card className="p-4">
            <h4 className="font-medium">Strategy</h4>
            <p className="text-muted-foreground">
              How aligned your organization is on AI goals and initiatives.
            </p>
          </Card>
          <Card className="p-4">
            <h4 className="font-medium">Technology</h4>
            <p className="text-muted-foreground">
              Your technical readiness to implement AI solutions.
            </p>
          </Card>
          <Card className="p-4">
            <h4 className="font-medium">People</h4>
            <p className="text-muted-foreground">
              How prepared your teams are to work with AI.
            </p>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <HomeIcon className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Link>
        </Button>
        <Button onClick={onDownloadResults}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Download Results
        </Button>
      </CardFooter>
    </Card>
  );
}