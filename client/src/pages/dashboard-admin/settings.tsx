import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
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

type LogEntry = {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // PDF Download state
  const [assessmentId, setAssessmentId] = useState("");
  const [isCheckingAssessment, setIsCheckingAssessment] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentExists, setAssessmentExists] = useState(false);

  // User search state
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userAssessments, setUserAssessments] = useState<Assessment[]>([]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

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

      if (result.success && result.assessment) {
        setAssessmentExists(true);
        setAssessment(result.assessment);
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
      const response = await apiRequest("GET", `/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`);
      const result = await response.json();
      if (result.success) {
        setUsers(result.users || []);
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
      const response = await apiRequest("GET", `/api/admin/users/${userId}/assessments`);
      const result = await response.json();
      if (result.success) {
        setUserAssessments(result.assessments || []);
      }
    } catch (error) {
      console.error("Error fetching user assessments:", error);
      setUserAssessments([]);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setUserSearchValue(`${user.firstName} ${user.lastName} (${user.email})`);
    setUserSearchOpen(false);
    fetchUserAssessments(user.id);
  };

  // Handle assessment ID click from user assessments
  const handleAssessmentIdClick = (id: number) => {
    setAssessmentId(id.toString());
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
    if (userSearchOpen) {
      const timeoutId = setTimeout(() => {
        searchUsers(userSearchValue);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [userSearchValue, userSearchOpen]);

  const handleRecalculateStats = async () => {
    if (isRecalculating) return;

    setIsRecalculating(true);
    clearLogs();
    addLog("Starting benchmark statistics recalculation...", "info");

    try {
      addLog("Sending recalculation request to server...", "info");

      const response = await apiRequest(
        "POST",
        "/api/admin/benchmark/recalculate",
      );
      const result = await response.json();

      if (result.success) {
        addLog("✓ Benchmark statistics recalculated successfully!", "success");
        addLog(`Processed surveys and assessments`, "info");

        toast({
          title: "Success",
          description:
            "Benchmark statistics have been recalculated successfully.",
        });
      } else {
        addLog(`✗ Recalculation failed: ${result.message}`, "error");

        if (result.error) {
          addLog("Technical details:", "error");
          addLog(`Error Code: ${result.error.code || "Unknown"}`, "error");
          addLog(
            `Error Message: ${result.error.message || result.error}`,
            "error",
          );

          if (result.error.detail) {
            addLog(`Error Detail: ${result.error.detail}`, "error");
          }
          if (result.error.hint) {
            addLog(`Hint: ${result.error.hint}`, "error");
          }
        }

        toast({
          title: "Recalculation Failed",
          description:
            result.message || "An error occurred during recalculation.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      addLog("✗ Network or server error occurred", "error");
      addLog(`Error: ${error.message}`, "error");

      toast({
        title: "Network Error",
        description: "Failed to communicate with the server.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
      addLog("Recalculation process completed.", "info");
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "warning":
        return <RefreshCw className="h-3 w-3 text-yellow-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-blue-500" />;
    }
  };

  const getLogTextColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-700 dark:text-green-400";
      case "error":
        return "text-red-700 dark:text-red-400";
      case "warning":
        return "text-yellow-700 dark:text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl text-foreground font-semibold">
                Admin Settings
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Administrative tools and system maintenance functions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Benchmark Statistics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Benchmark Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recalculate Statistics</p>
                  <p className="text-sm text-muted-foreground">
                    Recalculate benchmark statistics for all surveys and
                    assessments.
                    <br />
                    This process may take several minutes.
                  </p>
                </div>
                <Button
                  onClick={handleRecalculateStats}
                  disabled={isRecalculating}
                  variant={isRecalculating ? "secondary" : "default"}
                >
                  {isRecalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recalculating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculate
                    </>
                  )}
                </Button>
              </div>

              {/* Real-time Logs */}
              {logs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Process Logs</h4>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={isRecalculating ? "secondary" : "outline"}
                      >
                        {isRecalculating ? "Running" : "Completed"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearLogs}
                        disabled={isRecalculating}
                        className="h-5 py-0.5 text-xs"
                      >
                        Clear Logs
                      </Button>
                    </div>
                  </div>

                  <Card className="bg-slate-950 border-slate-800">
                    <CardContent className="p-4">
                      <ScrollArea className="h-64 w-full">
                        <div className="space-y-1 font-mono text-xs">
                          {logs.map((log, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              {getLogIcon(log.type)}
                              <span className="text-slate-400 shrink-0 w-20">
                                {log.timestamp}
                              </span>
                              <span className={getLogTextColor(log.type)}>
                                {log.message}
                              </span>
                            </div>
                          ))}
                          <div ref={logsEndRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Download Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Assessment PDF Download</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* User Search */}
                <div className="space-y-2">
                  <Label>Search User (Optional)</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedUser ? userSearchValue : "Search by name or email..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
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
                          ) : (
                            <CommandGroup>
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.firstName} ${user.lastName} ${user.email}`}
                                  onSelect={() => handleUserSelect(user)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span>{user.firstName} {user.lastName}</span>
                                    <span className="text-sm text-muted-foreground">{user.email}</span>
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
                      Assessments for {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {userAssessments.map((assessment) => (
                        <Button
                          key={assessment.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssessmentIdClick(assessment.id)}
                          className="h-8 px-3 text-xs border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                          ID: {assessment.id}
                          {assessment.completedAt && (
                            <Badge variant="secondary" className="ml-1 h-4 text-xs">
                              Completed
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Button
                        disabled
                        className="w-full"
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isCheckingAssessment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {isCheckingAssessment ? "Checking..." : "Download PDF"}
                        </span>
                      </Button>
                    )}
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
                  Enter an assessment ID to generate and download a PDF report on-demand.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
