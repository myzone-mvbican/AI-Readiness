import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Download, BarChart, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AssessmentAnswer } from "@shared/types";

interface AssessmentCompletionProps {
  assessment: any;
  survey: any;
  guestMode?: boolean;
  onSignUp?: () => void;
  onStartNew?: () => void;
}

export function AssessmentCompletion({
  assessment,
  survey,
  guestMode = false,
  onSignUp,
  onStartNew,
}: AssessmentCompletionProps) {
  if (!assessment) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>Assessment data not available.</p>
        </CardContent>
      </Card>
    );
  }

  const score = assessment.score || 0;
  const getScoreColor = (score: number) => {
    if (score < 30) return "text-red-500";
    if (score < 60) return "text-amber-500";
    return "text-green-500";
  };

  const getScoreDescription = (score: number) => {
    if (score < 30) return "Beginning";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Leading";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Completed</CardTitle>
        <CardDescription>
          {guestMode
            ? "Thanks for completing the AI Readiness Assessment"
            : "Your AI readiness assessment has been saved"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full">
            <div className="absolute w-full h-full rounded-full border-8 border-opacity-30 border-primary"></div>
            <div className="absolute w-full h-full rounded-full border-8 border-t-primary border-r-transparent border-b-transparent border-l-transparent transform -rotate-45"></div>
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold">
              {getScoreDescription(score)}
            </h3>
            <p className="text-muted-foreground mt-1">
              Your AI Readiness Score
            </p>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="p-4 space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Overview</h4>
              <p className="text-muted-foreground">
                Your organization is at the {getScoreDescription(score).toLowerCase()} stage of AI readiness.
                {score < 60
                  ? " There are significant opportunities to enhance your AI capabilities."
                  : " You have a solid foundation but can still improve in specific areas."}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Strengths</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Your organization has recognized the importance of AI</li>
                <li>You have begun the process of AI adoption</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Improvement Areas</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Consider developing a comprehensive AI strategy</li>
                <li>Build stronger data infrastructure and governance</li>
                <li>Invest in AI skills and knowledge across the organization</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-4 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Strategy & Vision</span>
                  <span className="font-medium">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Data Readiness</span>
                  <span className="font-medium">48%</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Technical Infrastructure</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Skills & Capabilities</span>
                  <span className="font-medium">53%</span>
                </div>
                <Progress value={53} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Implementation & Integration</span>
                  <span className="font-medium">60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {guestMode && onSignUp && (
          <Button
            className="flex-1"
            onClick={onSignUp}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Account
          </Button>
        )}
        
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            // Download feature would be implemented here
            alert("Download functionality would be implemented here");
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        
        {onStartNew && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onStartNew}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Assessment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}