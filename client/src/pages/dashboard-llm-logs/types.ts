// Types based on the LLM logging schema from the implementation plan

export interface LLMLog {
  id: number;
  userId?: number;
  timestamp: string;
  environment: string;
  route?: string;
  featureName?: string;
  provider: string;
  model: string;
  endpoint?: string;
  request: {
    provider: string;
    model: string;
    endpoint: string;
    messages?: Array<{
      role: "system" | "user" | "assistant" | "tool" | "function";
      content: string;
      redactionStatus?: "raw" | "redacted" | "masked";
    }>;
    tools?: any[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    metadata?: Record<string, any>;
  };
  response?: {
    status: "success" | "error";
    httpStatus?: number;
    completion?: {
      messages?: Array<{
        role: "assistant" | "tool" | "function";
        content: string;
      }>;
      finishReason?: string;
    };
    error?: {
      type: string;
      message: string;
      code?: string;
      retryable?: boolean;
    };
  };
  metrics?: {
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  retries?: number;
  security?: {
    redactionRules: Array<{
      type: string;
      applied: boolean;
      method: string;
    }>;
  };
  redactionStatus?: "pending" | "completed" | "failed";
  debug?: {
    requestId: string;
    internalId?: string;
    traceId?: string;
    [key: string]: any;
  };
  stableTrace?: {
    functionCalls?: Array<{
      name: string;
      arguments: any;
      result?: any;
    }>;
    ragHits?: Array<{
      source: string;
      score: number;
      content: string;
    }>;
  };
}

