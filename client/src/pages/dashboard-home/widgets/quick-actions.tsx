import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, BarChart3, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function QuickActionsCard() {
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-center">
          Quick Actions
        </CardTitle>
        <CardDescription className="text-center">
          Frequently used tools and actions
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-[3rem]">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard/assessments/" asChild>
            <Button variant="outline" className="justify-start">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>View Assessments</span>
            </Button>
          </Link>
          <Link href="/dashboard/compare/" asChild>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Compare with Industry</span>
            </Button>
          </Link>
          <Button variant="outline" className="justify-start" disabled>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Generate Report</span>
            <Badge className="ms-auto">Soon</Badge>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
