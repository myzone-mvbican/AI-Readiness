import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LLMLog } from "./types";
import Details from "./modals/Details";

interface LLMLogsTableProps {
  logs: LLMLog[];
}

export default function LLMLogsTable({ logs }: LLMLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<LLMLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewLog = (log: LLMLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (latencyMs?: number) => {
    if (latencyMs === undefined) return "N/A";
    if (latencyMs < 1000) return `${latencyMs}ms`;
    return `${(latencyMs / 1000).toFixed(2)}s`;
  };

  const formatTokens = (tokens?: number) => {
    if (tokens === undefined) return "N/A";
    return tokens.toLocaleString();
  };

  const formatUserId = (userId?: number | string | null) => {
    if (!userId) return "Guest";
    // Ensure it's a number - handle edge cases where it might be a string
    const numId = typeof userId === "string" ? parseInt(userId, 10) : userId;
    return isNaN(numId) ? "Guest" : numId.toString();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-foreground">
                  {formatDistanceToNow(new Date(log.timestamp), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatUserId(log.userId)}
                </TableCell>
                <TableCell className="text-foreground">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.route}</span>
                    {log.featureName && (
                      <span className="text-xs text-muted-foreground">
                        {log.featureName}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.provider}</Badge>
                </TableCell>
                <TableCell className="text-foreground">{log.model}</TableCell>
                <TableCell className="text-foreground">
                  {formatTokens(log.metrics?.totalTokens)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatCost(log.metrics?.estimatedCostUsd)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatLatency(log.metrics?.latencyMs)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.response?.status === "success"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {log.response?.status || "unknown"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewLog(log)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLog && (
        <Details
          log={selectedLog}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </>
  );
}

