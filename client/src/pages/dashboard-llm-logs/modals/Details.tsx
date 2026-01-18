import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LLMLog } from "../types";
import { formatDistanceToNow } from "date-fns";

interface DetailsProps {
  log: LLMLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Details({
  log,
  open,
  onOpenChange,
}: DetailsProps) {
  const formatCost = (cost?: number) => {
    if (cost === undefined) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (latencyMs?: number) => {
    if (latencyMs === undefined) return "N/A";
    if (latencyMs < 1000) return `${latencyMs}ms`;
    return `${(latencyMs / 1000).toFixed(2)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Log Details</DialogTitle>
          <DialogDescription>
            Log ID: {log.id} •{" "}
            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">User ID:</span>{" "}
                    {(() => {
                      if (!log.userId) return "Guest";
                      const numId = typeof log.userId === "string" ? parseInt(log.userId, 10) : log.userId;
                      return isNaN(numId) ? "Guest" : numId.toString();
                    })()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Environment:</span>{" "}
                    <Badge variant="outline">{log.environment}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Route:</span>{" "}
                    {log.route || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Feature:</span>{" "}
                    {log.featureName || "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Provider & Model</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Provider:</span>{" "}
                    <Badge variant="outline">{log.provider}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>{" "}
                    {log.model}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Endpoint:</span>{" "}
                    {log.endpoint || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge
                      variant={
                        log.response?.status === "success"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {log.response?.status || "unknown"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Security</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Redaction Status:
                  </span>{" "}
                  <Badge variant="outline">{log.redactionStatus || "N/A"}</Badge>
                </div>
                {log.security?.redactionRules && (
                  <div>
                    <span className="text-muted-foreground">
                      Redaction Rules:
                    </span>
                    <div className="mt-1 space-x-1">
                      {log.security.redactionRules.map((rule, idx) => (
                        <Badge
                          key={idx}
                          variant={rule.applied ? "default" : "outline"}
                        >
                          {rule.type} ({rule.method})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Request Parameters</h4>
              <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Temperature:</span>{" "}
                  {log.request.temperature ?? "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Max Tokens:</span>{" "}
                  {log.request.maxTokens?.toLocaleString() ?? "N/A"}
                </div>
                {log.request.topP !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Top P:</span>{" "}
                    {log.request.topP}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Messages</h4>
              <Tabs defaultValue="system" className="w-full">
                <TabsList>
                  <TabsTrigger value="system">System Prompt</TabsTrigger>
                  <TabsTrigger value="user">User Prompt</TabsTrigger>
                </TabsList>
                <TabsContent value="system" className="space-y-2 mt-4">
                  {log.request.messages && log.request.messages.filter((msg) => msg.role === "system").length > 0 ? (
                    log.request.messages!
                      .filter((msg) => msg.role === "system")
                      .map((message, idx) => (
                        <div
                          key={idx}
                          className="bg-muted p-3 rounded-md border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{message.role}</Badge>
                            {message.redactionStatus && (
                              <Badge
                                variant={
                                  message.redactionStatus === "redacted"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {message.redactionStatus}
                              </Badge>
                            )}
                          </div>
                          <ScrollArea className="h-[300px] w-full rounded-md">
                            <pre className="text-xs whitespace-pre-wrap break-words pr-4">
                              {message.content}
                            </pre>
                          </ScrollArea>
                        </div>
                      ))
                  ) : (
                    <div className="text-muted-foreground text-sm py-4">
                      No system prompts found
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="user" className="space-y-2 mt-4">
                  {log.request.messages && log.request.messages.filter((msg) => msg.role === "user").length > 0 ? (
                    log.request.messages!
                      .filter((msg) => msg.role === "user")
                      .map((message, idx) => (
                        <div
                          key={idx}
                          className="bg-muted p-3 rounded-md border-l-4 border-green-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{message.role}</Badge>
                            {message.redactionStatus && (
                              <Badge
                                variant={
                                  message.redactionStatus === "redacted"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {message.redactionStatus}
                              </Badge>
                            )}
                          </div>
                          <ScrollArea className="h-[300px] w-full rounded-md">
                            <pre className="text-xs whitespace-pre-wrap break-words pr-4">
                              {message.content}
                            </pre>
                          </ScrollArea>
                        </div>
                      ))
                  ) : (
                    <div className="text-muted-foreground text-sm py-4">
                      No user prompts found
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            {log.response?.status === "success" && log.response.completion ? (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Completion Messages
                  </h4>
                  <div className="space-y-2">
                    {log.response.completion.messages?.map((message, idx) => (
                      <div
                        key={idx}
                        className="bg-muted p-3 rounded-md border-l-4 border-green-500"
                      >
                        <Badge variant="outline" className="mb-2">
                          {message.role}
                        </Badge>
                        <pre className="text-xs whitespace-pre-wrap break-words">
                          {message.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
                {log.response.completion.finishReason && (
                  <div>
                    <span className="text-muted-foreground">
                      Finish Reason:
                    </span>{" "}
                    <Badge variant="outline">
                      {log.response.completion.finishReason}
                    </Badge>
                  </div>
                )}
              </>
            ) : log.response?.error ? (
              <div>
                <h4 className="text-sm font-semibold mb-2">Error Details</h4>
                <div className="bg-destructive/10 p-4 rounded-md space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {log.response.error.type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Message:</span>{" "}
                    {log.response.error.message}
                  </div>
                  {log.response.error.code && (
                    <div>
                      <span className="text-muted-foreground">Code:</span>{" "}
                      {log.response.error.code}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Retryable:</span>{" "}
                    {log.response.error.retryable ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No response data</div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Performance</h4>
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latency:</span>{" "}
                    {formatLatency(log.metrics?.latencyMs)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retries:</span>{" "}
                    {log.retries ?? 0}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Token Usage</h4>
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Prompt Tokens:
                    </span>{" "}
                    {log.metrics?.promptTokens?.toLocaleString() ?? "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Completion Tokens:
                    </span>{" "}
                    {log.metrics?.completionTokens?.toLocaleString() ?? "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Tokens:</span>{" "}
                    {log.metrics?.totalTokens?.toLocaleString() ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Cost</h4>
              <div className="bg-muted p-4 rounded-md text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Estimated Cost:
                  </span>{" "}
                  <span className="font-semibold">
                    {formatCost(log.metrics?.estimatedCostUsd)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Debug Info</h4>
              <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                {log.debug?.requestId && (
                  <div>
                    <span className="text-muted-foreground">Request ID:</span>{" "}
                    <code className="bg-background px-2 py-1 rounded">
                      {log.debug.requestId}
                    </code>
                  </div>
                )}
                {log.debug?.traceId && (
                  <div>
                    <span className="text-muted-foreground">Trace ID:</span>{" "}
                    <code className="bg-background px-2 py-1 rounded">
                      {log.debug.traceId}
                    </code>
                  </div>
                )}
                {log.debug?.internalId && (
                  <div>
                    <span className="text-muted-foreground">Internal ID:</span>{" "}
                    <code className="bg-background px-2 py-1 rounded">
                      {log.debug.internalId}
                    </code>
                  </div>
                )}
              </div>
            </div>
            {log.stableTrace && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Stable Trace</h4>
                <div className="bg-muted p-4 rounded-md">
                  <ScrollArea className="h-[300px] w-full rounded-md">
                    <pre className="text-xs whitespace-pre-wrap break-words pr-4">
                      {JSON.stringify(log.stableTrace, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold mb-2">Full Request JSON</h4>
              <div className="bg-muted p-4 rounded-md">
                <ScrollArea className="h-[300px] w-full rounded-md">
                  <pre className="text-xs whitespace-pre-wrap break-words pr-4">
                    {JSON.stringify(log.request, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

