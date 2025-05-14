import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SurveyPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          AI Readiness Assessment
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Complete the following questions to evaluate your organization's AI
          readiness
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary-500">
              Survey Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This assessment consists of multiple sections covering different
              aspects of AI readiness. Each section will evaluate a specific
              dimension of your organization's capabilities.
            </p>
            <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md mb-5">
              <h3 className="font-medium text-blue-800 dark:text-gray-500 mb-2">
                How to complete this assessment:
              </h3>
              <ul className="list-disc ml-5 text-blue-700 dark:text-gray-500 space-y-1">
                <li>
                  Answer all questions honestly for the most accurate results
                </li>
                <li>Take approximately 10 minutes to complete all sections</li>
                <li>You can save your progress and return later</li>
                <li>Generate a PDF report of your results when finished</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          What You'll Evaluate
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Category 1 */}
          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Strategy & Vision</h3>
              <p className="text-muted-foreground text-sm">
                Provides insight into the strategic alignment and vision
                relating to AI adoption.
              </p>
            </CardContent>
          </Card>

          {/* Category 2 */}
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">
                Culture & Change-Readiness
              </h3>
              <p className="text-muted-foreground text-sm">
                Evaluates the organizational culture and readiness for change in
                AI contexts.
              </p>
            </CardContent>
          </Card>

          {/* Category 3 */}
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Skills & Literacy</h3>
              <p className="text-muted-foreground text-sm">
                Measures the knowledge and literacy levels of AI across the
                workforce.
              </p>
            </CardContent>
          </Card>

          {/* Category 4 */}
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Data & Information</h3>
              <p className="text-muted-foreground text-sm">
                Assesses the management and utilization of data and information
                resources.
              </p>
            </CardContent>
          </Card>

          {/* Category 5 */}
          <Card className="border-l-4 border-l-lime-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">
                Technology & Integration
              </h3>
              <p className="text-muted-foreground text-sm">
                Evaluates the technological systems and their integration with
                AI processes.
              </p>
            </CardContent>
          </Card>

          {/* Category 6 */}
          <Card className="border-l-4 border-l-brown-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Process & Operations</h3>
              <p className="text-muted-foreground text-sm">
                Reviews the efficiency and adaptability of operational processes
                with AI.
              </p>
            </CardContent>
          </Card>

          {/* Category 7 */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">
                Governance, Ethics & Risk
              </h3>
              <p className="text-muted-foreground text-sm">
                Analyzes governance frameworks, ethical considerations, and risk
                management.
              </p>
            </CardContent>
          </Card>

          {/* Category 8 */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">
                Financial & Resources
              </h3>
              <p className="text-muted-foreground text-sm">
                Assesses the availability and allocation of financial and
                resource supports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
