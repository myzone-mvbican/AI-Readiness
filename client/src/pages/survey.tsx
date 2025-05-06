import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SurveyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">AI Readiness Assessment</h1>
        <p className="mt-3 text-lg text-gray-600">
          Complete the following questions to evaluate your organization's AI readiness
        </p>
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary-500">Survey Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              This assessment consists of multiple sections covering different aspects of AI readiness. 
              Each section will evaluate a specific dimension of your organization's capabilities.
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">How to complete this assessment:</h3>
              <ul className="list-disc ml-5 text-blue-700 space-y-1">
                <li>Answer all questions honestly for the most accurate results</li>
                <li>Take approximately 10 minutes to complete all sections</li>
                <li>You can save your progress and return later</li>
                <li>Generate a PDF report of your results when finished</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <a href="/login">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md px-8 py-4 text-lg font-medium rounded-md animate-pulse"
            >
              Begin Assessment
            </Button>
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Your data will be saved and used anonymously for benchmarking purposes.
          </p>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Evaluate</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Category 1 */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Strategy & Planning</h3>
              <p className="text-gray-700 text-sm">
                Assesses your organization's AI vision, roadmap, and strategic integration
              </p>
            </CardContent>
          </Card>
          
          {/* Category 2 */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Data Infrastructure</h3>
              <p className="text-gray-700 text-sm">
                Evaluates data quality, accessibility, and governance practices
              </p>
            </CardContent>
          </Card>
          
          {/* Category 3 */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Skills & Expertise</h3>
              <p className="text-gray-700 text-sm">
                Measures your team's AI capabilities and training programs
              </p>
            </CardContent>
          </Card>
          
          {/* Category 4 */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Technology Stack</h3>
              <p className="text-gray-700 text-sm">
                Reviews your technical infrastructure and AI tools readiness
              </p>
            </CardContent>
          </Card>
          
          {/* Category 5 */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Ethics & Governance</h3>
              <p className="text-gray-700 text-sm">
                Examines your AI ethics policies and responsible AI practices
              </p>
            </CardContent>
          </Card>
          
          {/* Category 6 */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Implementation Readiness</h3>
              <p className="text-gray-700 text-sm">
                Evaluates your ability to deploy and scale AI solutions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}