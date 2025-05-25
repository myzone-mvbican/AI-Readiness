import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LogEntry = {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleRecalculateStats = async () => {
    if (isRecalculating) return;

    setIsRecalculating(true);
    clearLogs();
    addLog("Starting benchmark statistics recalculation...", 'info');

    try {
      addLog("Sending recalculation request to server...", 'info');
      
      const response = await apiRequest("POST", "/api/admin/benchmark/recalculate");
      const result = await response.json();

      if (result.success) {
        addLog("✓ Benchmark statistics recalculated successfully!", 'success');
        addLog(`Processed surveys and assessments`, 'info');
        
        toast({
          title: "Success",
          description: "Benchmark statistics have been recalculated successfully.",
        });
      } else {
        addLog(`✗ Recalculation failed: ${result.message}`, 'error');
        
        if (result.error) {
          addLog("Technical details:", 'error');
          addLog(`Error Code: ${result.error.code || 'Unknown'}`, 'error');
          addLog(`Error Message: ${result.error.message || result.error}`, 'error');
          
          if (result.error.detail) {
            addLog(`Error Detail: ${result.error.detail}`, 'error');
          }
          if (result.error.hint) {
            addLog(`Hint: ${result.error.hint}`, 'error');
          }
        }
        
        toast({
          title: "Recalculation Failed",
          description: result.message || "An error occurred during recalculation.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      addLog("✗ Network or server error occurred", 'error');
      addLog(`Error: ${error.message}`, 'error');
      
      toast({
        title: "Network Error",
        description: "Failed to communicate with the server.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
      addLog("Recalculation process completed.", 'info');
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <RefreshCw className="h-3 w-3 text-yellow-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-blue-500" />;
    }
  };

  const getLogTextColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-400';
      case 'error':
        return 'text-red-700 dark:text-red-400';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-foreground" />
              <h2 className="text-xl text-foreground font-semibold">
                Admin Settings
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Administrative tools and system maintenance functions
            </p>
          </div>
        </div>

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
                  Recalculate benchmark statistics for all surveys and assessments.
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
                    <Badge variant={isRecalculating ? "secondary" : "outline"}>
                      {isRecalculating ? "Running" : "Completed"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearLogs}
                      disabled={isRecalculating}
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
                          <div key={index} className="flex items-start space-x-2">
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

        {/* Placeholder for future admin tools */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Additional admin tools will be added here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}