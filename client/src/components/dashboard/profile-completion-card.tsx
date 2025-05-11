import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User } from "@shared/schema";
import { ClipboardList } from "lucide-react";

interface ProfileCompletionCardProps {
  user: User;
}

export function ProfileCompletionCard({ user }: ProfileCompletionCardProps) {
  // Calculate profile completion percentage based on filled fields
  const calculateCompletion = () => {
    let filledFields = 0;
    let totalFields = 4; // company, industry, employeeCount, googleAccountLinked

    if (user.company) filledFields++;
    if (user.industry) filledFields++;
    if (user.employeeCount) filledFields++;
    if (user.googleId) filledFields++; // googleAccountLinked

    return Math.round((filledFields / totalFields) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Get the missing fields as readable text
  const getMissingFieldsText = () => {
    const missingFields = [];
    if (!user.company) missingFields.push("company name");
    if (!user.industry) missingFields.push("industry");
    if (!user.employeeCount) missingFields.push("company size");
    if (!user.googleId) missingFields.push("Google account connection");

    if (missingFields.length === 0) {
      return "Your profile is complete!";
    }

    if (missingFields.length === 1) {
      return `Add your ${missingFields[0]} to complete your profile.`;
    }

    const lastField = missingFields.pop();
    return `Add your ${missingFields.join(", ")} and ${lastField} to complete your profile.`;
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg font-medium">
          Profile Completion
        </CardTitle>
        <CardDescription className="text-center">
          Complete your profile for a better experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="rounded-full bg-primary/10 p-3 mb-3">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <div className="w-full space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Profile completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {getMissingFieldsText()}
          </p>
          <Link href="/dashboard/account/settings" asChild>
            <Button
              variant={completionPercentage === 100 ? "outline" : "default"}
              className="w-full"
            >
              {completionPercentage === 100
                ? "View Profile"
                : "Complete Profile"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}