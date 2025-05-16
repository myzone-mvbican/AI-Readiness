import { useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileCompletionCard() {
  const { user } = useAuth();

  // Calculate profile completeness
  const { completionPercentage, completedFields, incompleteFields } =
    useMemo(() => {
      if (!user) {
        return {
          completionPercentage: 0,
          completedFields: [],
          incompleteFields: [],
        };
      }

      const fieldsToCheck = [
        { name: "name", value: user.name, label: "Name" },
        { name: "email", value: user.name, label: "Email" },
        { name: "company", value: user.company, label: "Company" },
        { name: "industry", value: user.industry, label: "Industry" },
        {
          name: "employeeCount",
          value: user.employeeCount,
          label: "Team Size",
        },
        { name: "googleId", value: user.googleId, label: "Google Account" },
      ];

      const completed = fieldsToCheck.filter((field) => !!field.value);
      const incomplete = fieldsToCheck.filter((field) => !field.value);
      const percentage = Math.round(
        (completed.length / fieldsToCheck.length) * 100,
      );

      return {
        completionPercentage: percentage,
        completedFields: completed,
        incompleteFields: incomplete,
      };
    }, [user]);

  // If user is not logged in or data is not loaded yet
  if (!user) {
    return null;
  }

  // When profile is 100% complete
  if (completionPercentage === 100) {
    return (
      <Card className="col-span-1 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-center">
            Profile Complete
          </CardTitle>
          <CardDescription className="text-center">
            Your profile information is fully up to date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-4 relative z-10">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary mb-1">
              🎉 Your profile is 100% complete!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              You're all set to get the most from your AI Readiness Dashboard.
            </p>
            <Link href="/dashboard/account/settings" asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-1"
              >
                Edit Profile
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // When profile is incomplete
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Profile Completion
        </CardTitle>
        <CardDescription>
          Complete your profile to improve your experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Progress value={completionPercentage} className="h-2" />
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>

          <div className="space-y-2">
            {incompleteFields.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Missing information:
              </div>
            )}
            <ul className="space-y-1">
              {incompleteFields.map((field) => (
                <li key={field.name} className="text-sm flex items-center">
                  <div className="h-4 w-4 flex items-center justify-center mr-2">
                    ⬜
                  </div>
                  {field.label}
                </li>
              ))}
            </ul>
          </div>

          <Link href="/dashboard/account/settings" asChild>
            <Button className="w-full">Complete Your Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
