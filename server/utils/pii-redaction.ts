/**
 * PII Redaction Utilities
 * Redacts personally identifiable information (PII) from text before logging
 * Uses anonymize-nlp for detection and redaction
 */

import { AnonymizeNlp, type AnonymizeType } from "anonymize-nlp";

export interface PIIRule {
  type: string;
  applied: boolean;
  method: string;
}

export interface RedactionResult {
  redacted: string | object;
  appliedRules: PIIRule[];
  redactionStatus: "pending" | "completed" | "failed";
}

// Create a singleton instance for efficiency
let anonymizer: AnonymizeNlp | null = null;

function getAnonymizer(): AnonymizeNlp {
  if (!anonymizer) {
    // Anonymize common PII types: email, phone, names, SSN, credit cards
    const typesToAnonymize: AnonymizeType[] = [
      "email",
      "phonenumber",
      "firstname",
      "lastname",
      "us_social_security",
      "creditcard",
      "organization",
    ];
    anonymizer = new AnonymizeNlp(typesToAnonymize);
  }
  return anonymizer;
}

/**
 * Redact PII from a string
 */
export function redactPII(content: string): RedactionResult {
  try {
    const anonymizerInstance = getAnonymizer();
    const originalContent = content;
    const redacted = anonymizerInstance.anonymize(content);

    // Determine which rules were applied by checking what changed
    const appliedRules: PIIRule[] = [];
    
    // Check for common PII types
    if (containsEmail(originalContent)) {
      appliedRules.push({
        type: "email",
        applied: originalContent !== redacted,
        method: "redaction",
      });
    }

    if (containsPhone(originalContent)) {
      appliedRules.push({
        type: "phone",
        applied: originalContent !== redacted,
        method: "redaction",
      });
    }

    if (containsName(originalContent)) {
      appliedRules.push({
        type: "name",
        applied: originalContent !== redacted,
        method: "redaction",
      });
    }

    return {
      redacted,
      appliedRules,
      redactionStatus: originalContent !== redacted ? "completed" : "pending",
    };
  } catch (error) {
    console.error("Error redacting PII:", error);
    return {
      redacted: content, // Return original if redaction fails
      appliedRules: [],
      redactionStatus: "failed",
    };
  }
}

/**
 * Redact PII from an array of messages
 */
export function redactMessages(
  messages: Array<{ role: string; content: string }>
): {
  redacted: Array<{ role: string; content: string; redactionStatus?: "raw" | "redacted" | "masked" }>;
  redactionStatus: string;
  appliedRules: PIIRule[];
} {
  const allAppliedRules: PIIRule[] = [];
  let anyRedacted = false;

  const redacted = messages.map((msg) => {
    const result = redactPII(msg.content);
    
    // Merge applied rules
    result.appliedRules.forEach((rule) => {
      if (!allAppliedRules.find((r) => r.type === rule.type && r.applied)) {
        allAppliedRules.push(rule);
      }
    });

    if (result.appliedRules.some((r) => r.applied)) {
      anyRedacted = true;
    }

    return {
      ...msg,
      content: typeof result.redacted === "string" ? result.redacted : msg.content,
      redactionStatus: result.appliedRules.some((r) => r.applied) 
        ? ("redacted" as const) 
        : ("raw" as const),
    };
  });

  return {
    redacted,
    redactionStatus: anyRedacted ? "completed" : "pending",
    appliedRules: allAppliedRules,
  };
}

/**
 * Check if content contains email addresses
 */
function containsEmail(content: string): boolean {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  return emailRegex.test(content);
}

/**
 * Check if content contains phone numbers
 */
function containsPhone(content: string): boolean {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  return phoneRegex.test(content);
}

/**
 * Check if content contains names (basic check)
 */
function containsName(content: string): boolean {
  // Simple heuristic: check for common name patterns
  // This is a basic check - anonymize-nlp will do the actual detection
  return /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(content);
}

