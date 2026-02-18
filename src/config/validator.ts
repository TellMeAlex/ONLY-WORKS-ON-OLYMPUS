import { z } from "zod";
import type { OlimpusConfig } from "./schema.js";

/**
 * Validation Error Types - Discriminated Union
 */

export const CircularDependencyErrorSchema = z.object({
  type: z.literal("circular_dependency"),
  message: z.string(),
  path: z.array(z.string()),
  meta_agents: z.array(z.string()),
});

export const InvalidAgentReferenceErrorSchema = z.object({
  type: z.literal("invalid_agent_reference"),
  message: z.string(),
  path: z.array(z.string()),
  reference: z.string(),
});

export const SchemaValidationErrorSchema = z.object({
  type: z.literal("schema_validation"),
  message: z.string(),
  path: z.array(z.string()),
  zodIssue: z.any().optional(),
});

export const RegexPerformanceWarningSchema = z.object({
  type: z.literal("regex_performance"),
  message: z.string(),
  path: z.array(z.string()),
  pattern: z.string(),
  reason: z.string(),
});

/**
 * Validation Error Schema - Union of all error types
 */

export const ValidationErrorSchema = z.discriminatedUnion("type", [
  CircularDependencyErrorSchema,
  InvalidAgentReferenceErrorSchema,
  SchemaValidationErrorSchema,
]);

/**
 * Validation Warning Schema
 */

export const ValidationWarningSchema = z.discriminatedUnion("type", [
  RegexPerformanceWarningSchema,
]);

/**
 * Validation Result Schema - Aggregate result of validation
 */

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema).default([]),
  warnings: z.array(ValidationWarningSchema).default([]),
  config: z.any().optional(),
});

/**
 * Severity Levels for filtering issues
 */

export const SeveritySchema = z.enum(["error", "warning"]);
export const Severity = ["error", "warning"] as const;

/**
 * Check Type for categorizing validation checks
 */

export const CheckTypeSchema = z.enum([
  "schema",
  "circular_dependency",
  "agent_reference",
  "regex_performance",
]);

/**
 * Check Result Schema - Result of a single validation check
 */

export const CheckResultSchema = z.object({
  checkType: CheckTypeSchema,
  passed: z.boolean(),
  errors: z.array(ValidationErrorSchema).default([]),
  warnings: z.array(ValidationWarningSchema).default([]),
});

/**
 * Validation Context Schema - Context for validation
 */

export const ValidationContextSchema = z.object({
  configPath: z.string().optional(),
  configName: z.string().optional(),
  checkCircularDependencies: z.boolean().default(true),
  checkAgentReferences: z.boolean().default(true),
  checkRegexPerformance: z.boolean().default(true),
});

/**
 * Inferred TypeScript types from schemas
 */

export type CircularDependencyError = z.infer<
  typeof CircularDependencyErrorSchema
>;
export type InvalidAgentReferenceError = z.infer<
  typeof InvalidAgentReferenceErrorSchema
>;
export type SchemaValidationError = z.infer<typeof SchemaValidationErrorSchema>;

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export type RegexPerformanceWarning = z.infer<
  typeof RegexPerformanceWarningSchema
>;

export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export type SeverityLevel = (typeof Severity)[number];

export type CheckType = z.infer<typeof CheckTypeSchema>;

export type CheckResult = z.infer<typeof CheckResultSchema>;

export type ValidationContext = z.infer<typeof ValidationContextSchema>;

/**
 * Create a circular dependency error
 */

export function createCircularDependencyError(
  message: string,
  path: string[],
  metaAgents: string[],
): CircularDependencyError {
  return {
    type: "circular_dependency",
    message,
    path,
    meta_agents: metaAgents,
  };
}

/**
 * Create an invalid agent reference error
 */

export function createInvalidAgentReferenceError(
  message: string,
  path: string[],
  reference: string,
): InvalidAgentReferenceError {
  return {
    type: "invalid_agent_reference",
    message,
    path,
    reference,
  };
}

/**
 * Create a schema validation error
 */

export function createSchemaValidationError(
  message: string,
  path: string[],
  zodIssue?: unknown,
): SchemaValidationError {
  return {
    type: "schema_validation",
    message,
    path,
    zodIssue,
  };
}

/**
 * Create a regex performance warning
 */

export function createRegexPerformanceWarning(
  message: string,
  path: string[],
  pattern: string,
  reason: string,
): RegexPerformanceWarning {
  return {
    type: "regex_performance",
    message,
    path,
    pattern,
    reason,
  };
}

/**
 * Create a new validation result
 */

export function createValidationResult(
  config?: OlimpusConfig,
): ValidationResult {
  return {
    valid: false,
    errors: [],
    warnings: [],
    config,
  };
}

/**
 * Create a validation check result
 */

export function createCheckResult(
  checkType: CheckType,
  passed: boolean = false,
): CheckResult {
  return {
    checkType,
    passed,
    errors: [],
    warnings: [],
  };
}

/**
 * Check if a validation result is valid (no errors)
 */

export function isValid(result: ValidationResult): boolean {
  return result.errors.length === 0;
}

/**
 * Check if a validation result has warnings
 */

export function hasWarnings(result: ValidationResult): boolean {
  return result.warnings.length > 0;
}

/**
 * Get a summary of validation result as a human-readable string
 */

export function getValidationSummary(result: ValidationResult): string {
  const { errors, warnings } = result;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return "Configuration is valid. No errors or warnings found.";
  }

  let summary = "";
  if (errorCount > 0) {
    summary += `${errorCount} error${errorCount === 1 ? "" : "s"}`;
  }
  if (warningCount > 0) {
    if (summary) summary += ", ";
    summary += `${warningCount} warning${warningCount === 1 ? "" : "s"}`;
  }
  summary += " found.";

  return summary;
}

/**
 * Format validation errors as a string list
 */

export function formatErrors(result: ValidationResult): string[] {
  return result.errors.map((error) => {
    const pathStr = error.path.length > 0 ? error.path.join(".") : "root";
    return `[ERROR] ${pathStr}: ${error.message}`;
  });
}

/**
 * Format validation warnings as a string list
 */

export function formatWarnings(result: ValidationResult): string[] {
  return result.warnings.map((warning) => {
    const pathStr = warning.path.length > 0 ? warning.path.join(".") : "root";
    return `[WARNING] ${pathStr}: ${warning.message}`;
  });
}

/**
 * Main validation function placeholder - will be implemented in later subtasks
 * This function validates an Olimpus configuration against schema and semantic rules
 */

export function validateOlimpusConfig(
  config: OlimpusConfig,
  context?: Partial<ValidationContext>,
): ValidationResult {
  const result = createValidationResult(config);
  // Validation logic will be added in subsequent subtasks
  result.valid = true;
  return result;
}

/**
 * Builtin agent names that can be delegation targets
 * Imported from schema for use in validation
 */

export const BUILTIN_AGENT_NAMES = [
  "sisyphus",
  "hephaestus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "prometheus",
] as const;
