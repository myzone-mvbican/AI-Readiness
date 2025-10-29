
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Search,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AssessmentPDFDownloadButton } from "@/components/survey/assessment-pdf";
import { Assessment } from "@shared/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PDFDownloadTool() {
  const { toast } = useToast();

  // PDF Download state
  const [assessmentId, setAssessmentId] = useState("");
  const [isCheckingAssessment, setIsCheckingAssessment] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentExists, setAssessmentExists] = useState(false);
  const [isRegeneratingReport, setIsRegeneratingReport] = useState(false);

  // User search state
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userAssessments, setUserAssessments] = useState<Assessment[]>([]);

  // Function to check if assessment exists
  const checkAssessment = async (id: string) => {
    if (!id.trim()) {
      setAssessmentExists(false);
      setAssessment(null);
      return;
    }

    setIsCheckingAssessment(true);
    try {
      const response = await apiRequest("GET", `/api/assessments/${id}`);
      const result = await response.json();

      if (result.success && result.data?.assessment) {
        setAssessmentExists(true);
        setAssessment(result.data.assessment);
      } else {
        setAssessmentExists(false);
        setAssessment(null);
      }
    } catch (error) {
      setAssessmentExists(false);
      setAssessment(null);
    } finally {
      setIsCheckingAssessment(false);
    }
  };

  // Function to search users
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await apiRequest(
        "GET",
        `/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`,
      );
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Function to fetch user assessments
  const fetchUserAssessments = async (userId: number) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/admin/users/${userId}/assessments`,
      );
      const result = await response.json();
      if (result.success) {
        setUserAssessments(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching user assessments:", error);
      setUserAssessments([]);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setUserSearchValue(`${user.name} (${user.email})`);
    setUserSearchOpen(false);
    fetchUserAssessments(user.id);
  };

  // Handle assessment ID click from user assessments
  const handleAssessmentIdClick = (id: number) => {
    setAssessmentId(id.toString());
  };

  // Function to regenerate AI recommendations
  const regenerateReport = async () => {
    if (!assessment) {
      toast({
        title: "Error",
        description: "No assessment selected",
        variant: "destructive",
      });
      return;
    }

    setIsRegeneratingReport(true);
    try {
      // Use the same AI suggestions endpoint as survey completion
      const response = await apiRequest("POST", "/api/ai-suggestions", {
        assessment: assessment,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "AI recommendations regenerated successfully",
        });
        // Refresh the assessment data
        await checkAssessment(assessmentId);
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to regenerate recommendations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error regenerating report:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate recommendations",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingReport(false);
    }
  };

  // Handle assessment ID input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (assessmentId) {
        checkAssessment(assessmentId);
      } else {
        setAssessmentExists(false);
        setAssessment(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [assessmentId]);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(userSearchValue);
      
      // Clear selected user and assessments when search is cleared
      if (!userSearchValue.trim()) {
        setSelectedUser(null);
        setUserAssessments([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-base lg:text-xl">
          <FileText className="size-5" />
          <span>Assessment PDF Download</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Search User (Optional)</Label>
            <Popover
              open={userSearchOpen}
              onOpenChange={setUserSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedUser
                    ? userSearchValue
                    : "Search by name or email..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput
                    placeholder="Type to search users..."
                    value={userSearchValue}
                    onValueChange={setUserSearchValue}
                  />
                  <CommandList>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Searching...</span>
                      </div>
                    ) : users.length === 0 && userSearchValue ? (
                      <CommandEmpty>No users found.</CommandEmpty>
                    ) : userSearchValue === "" ? (
                      <CommandEmpty>
                        Search by name or email.
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.name} ${user.email}`}
                            onSelect={() => handleUserSelect(user)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* User Assessments Display */}
          {selectedUser && userAssessments.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Completed Assessments for {selectedUser.name}
              </h4>
              {userAssessments.filter((assessment) => (assessment as any).completedAt || assessment.completedOn).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userAssessments
                    .filter((assessment) => (assessment as any).completedAt || assessment.completedOn)
                    .map((assessment) => (
                      <Button
                        key={assessment.id}
                        variant={assessmentId === assessment.id.toString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAssessmentIdClick(assessment.id)}
                        className={`h-8 px-3 text-xs ${assessmentId === assessment.id.toString()
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                            : "border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                          }`}
                      >
                        ID: {assessment.id}
                        <Badge
                          variant="secondary"
                          className="ml-1 h-4 text-xs"
                        >
                          Completed
                        </Badge>
                      </Button>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                  No completed assessments found for this user.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-id">Assessment ID</Label>
              <Input
                id="assessment-id"
                type="number"
                placeholder="Enter assessment ID"
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              {assessmentExists && assessment ? (
                <div className="w-full">
                  <AssessmentPDFDownloadButton assessment={assessment} />
                </div>
              ) : (
                <Button disabled className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    {isCheckingAssessment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isCheckingAssessment
                      ? "Checking..."
                      : "Download PDF"}
                  </span>
                </Button>
              )}
            </div>
            <div className="flex items-end">
              <Button
                onClick={regenerateReport}
                disabled={
                  !assessmentExists || !assessment || isRegeneratingReport
                }
                variant="outline"
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  {isRegeneratingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRegeneratingReport
                    ? "Regenerating..."
                    : "Regenerate Report"}
                </span>
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          {assessmentId && !isCheckingAssessment && (
            <div className="flex items-center space-x-2 text-sm">
              {assessmentExists ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">
                    Assessment found - PDF will be generated on download
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">
                    Assessment not found
                  </span>
                </>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Enter an assessment ID to generate and download a PDF report
            on-demand.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
