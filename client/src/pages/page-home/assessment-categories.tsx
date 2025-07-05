
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, DollarSign, Users, Shield, GraduationCap, Settings, Database, Zap } from "lucide-react";

interface AssessmentCategoriesProps {
  onStartAssessment: () => void;
}

export const AssessmentCategories: React.FC<AssessmentCategoriesProps> = ({ onStartAssessment }) => {
  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-foreground mb-4">
            What You'll Evaluate
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Evaluate your organization across 8 critical dimensions that form the foundation of successful AI implementation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Strategy & Vision */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Strategy & Vision
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Compare your AI readiness with industry standards and competitors
            </p>
          </div>

          {/* Change-Readiness & Culture */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-purple-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Change-Readiness & Culture
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Evaluates the organizational culture and readiness for change in AI contexts.
            </p>
          </div>

          {/* Skills & Literacy */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-orange-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Skills & Literacy
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Measures the knowledge and literacy levels of AI across the workforce.
            </p>
          </div>

          {/* Data & Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-indigo-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Data & Information
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Assesses the management and utilization of data and information resources.
            </p>
          </div>

          {/* Technology & Integration */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-yellow-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Technology & Integration
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Evaluates the technological systems and their integration with AI processes.
            </p>
          </div>

          {/* Process & Operations */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-teal-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Settings className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Process & Operations
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Reviews the efficiency and adaptability of operational processes with AI.
            </p>
          </div>

          {/* Governance, Ethics & Risk */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-red-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Governance, Ethics & Risk
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzes governance frameworks, ethical considerations, and risk management.
            </p>
          </div>

          {/* Financial & Resources */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-green-500">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground ml-3">
                Financial & Resources
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Assesses the availability and allocation of financial and resource supports.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Each category provides detailed insights and personalized recommendations, helping you understand exactly where your organization stands and what steps to take next on your AI journey.
          </p>
          <Button
            size="lg"
            onClick={onStartAssessment}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
          >
            Start Your Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCategories;
