/**
 * LLM Usage Utility
 * Uses TokenLens for accurate token counting and cost estimation across multiple providers
 */

import { getUsage } from "tokenlens";

/**
 * Get token counts from OpenAI API response
 * OpenAI responses include usage information
 */
export function getTokenUsageFromResponse(completion: any): {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
} {
  return {
    promptTokens: completion.usage?.prompt_tokens,
    completionTokens: completion.usage?.completion_tokens,
    totalTokens: completion.usage?.total_tokens,
  };
}

/**
 * Get LLM usage cost in USD for a given provider, model, and token usage
 * Uses TokenLens getUsage method (non-deprecated) which includes cost information
 */
export function getLlmUsageCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  try {
    // TokenLens uses format: "provider:model" (e.g., "openai:gpt-4.1")
    const modelId = `${provider}:${model}`;
    
    // Prepare usage in TokenLens format
    const usage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
    
    // Use TokenLens getUsage which returns usage data including cost information
    const usageData = getUsage({
      modelId,
      usage,
    });
    
    // Extract cost from usageData.costUSD
    // costUSD contains totalUSD, or we can calculate from inputUSD + outputUSD
    const costUSD = usageData.costUSD;
    if (costUSD?.totalUSD !== undefined) {
      return costUSD.totalUSD;
    }
    
    // Fallback: calculate from input and output costs
    const totalCost = (costUSD?.inputUSD || 0) + (costUSD?.outputUSD || 0);
    return totalCost;
  } catch (error) {
    console.error("Error getting LLM usage cost:", error);
    // Fallback: return 0 if estimation fails
    return 0;
  }
}

