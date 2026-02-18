import { z } from "zod";
import type { OlimpusConfig, MetaAgentDef } from "./schema.js";

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
 * Re-exported from schema for use in validation
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

/**
 * Tracks delegation chains to detect circular dependencies
 * Key: "from:to", Value: depth level
 */
interface DelegationTracker {
  [key: string]: number;
}

/**
 * Helper class for circular dependency detection
 * Based on MetaAgentRegistry pattern from src/agents/registry.ts
 */
class DelegationGraph {
  private delegations: DelegationTracker = {};
  private maxDepth: number;

  constructor(maxDepth: number = 3) {
    this.maxDepth = maxDepth;
  }

  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   */
  trackDelegation(from: string, to: string): void {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }

  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
   */
  checkCircular(
    from: string,
    to: string,
    maxDepth: number = this.maxDepth
  ): boolean {
    return this.hasCircle(from, to, maxDepth, new Set());
  }

  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain
   * @param target - Target agent we're trying to reach
   * @param depth - Remaining depth to search
   * @param visited - Set of visited nodes to detect cycles
   * @returns true if a circular path exists, false otherwise
   */
  private hasCircle(
    current: string,
    target: string,
    depth: number,
    visited: Set<string>
  ): boolean {
    if (depth <= 0) {
      return false;
    }

    if (visited.has(current)) {
      // Already visited this node in this path - potential cycle
      return true;
    }

    if (current === target) {
      // Direct connection found
      return true;
    }

    visited.add(current);

    // Check all known delegations from current agent
    for (const [delegation] of Object.keys(this.delegations)) {
      const [from, next] = delegation.split(":");
      if (from === current && next) {
        if (this.hasCircle(next, target, depth - 1, new Set(visited))) {
          return true;
        }
      }
    }

    return false;
  }
}

/**
 * Check for circular dependencies in meta-agent delegation chains
 * @param metaAgents - Map of meta-agent definitions
 * @param maxDepth - Maximum depth to search for circular dependencies
 * @returns Array of CircularDependencyError for each circular dependency found
 */
export function checkCircularDependencies(
  metaAgents: Record<string, MetaAgentDef>,
  maxDepth: number = 3
): CircularDependencyError[] {
  const errors: CircularDependencyError[] = [];

  if (Object.keys(metaAgents).length === 0) {
    return errors;
  }

  const graph = new DelegationGraph(maxDepth);

  // Track all delegations from meta-agents
  for (const [name, def] of Object.entries(metaAgents)) {
    // Track delegations from delegates_to field
    for (const delegate of def.delegates_to) {
      graph.trackDelegation(name, delegate);
    }

    // Track delegations from routing_rules target_agent
    for (const rule of def.routing_rules) {
      graph.trackDelegation(name, rule.target_agent);
    }
  }

  // Check each meta-agent for circular dependencies
  for (const [name, def] of Object.entries(metaAgents)) {
    const path: string[] = [];

    // Check delegates_to for circular dependencies
    for (const delegate of def.delegates_to) {
      if (graph.checkCircular(delegate, name, maxDepth)) {
        // Found circular dependency
        path.push(name, delegate);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" delegates to "${delegate}" which can route back to "${name}"`,
            path,
            [name, delegate]
          )
        );
      }
    }

    // Check routing_rules for circular dependencies
    for (const rule of def.routing_rules) {
      if (graph.checkCircular(rule.target_agent, name, maxDepth)) {
        // Found circular dependency
        path.push(name, rule.target_agent);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" can route to "${rule.target_agent}" which can route back to "${name}"`,
            path,
            [name, rule.target_agent]
          )
        );
      }
    }

    // Check if a meta-agent directly delegates to another meta-agent
    // This is valid in some cases but worth noting for validation
    for (const delegate of def.delegates_to) {
      if (delegate in metaAgents && delegate !== name) {
        // Meta-agent delegates to another meta-agent
        // Check for circular dependency
        if (graph.checkCircular(delegate, name, maxDepth)) {
          path.push(name, delegate);
          errors.push(
            createCircularDependencyError(
              `Circular dependency detected between meta-agents: "${name}" -> "${delegate}"`,
              path,
              [name, delegate]
            )
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Helper function to check circular dependencies from validation context
 * @param config - The Olimpus configuration to validate
 * @param context - Optional validation context
 * @returns CheckResult with circular dependency check status
 */
export function checkCircularDependenciesInConfig(
  config: OlimpusConfig,
  context?: Partial<ValidationContext>
): CheckResult {
  const result = createCheckResult("circular_dependency");

  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }

  const maxDepth = config.settings?.max_delegation_depth ?? 3;
  const errors = checkCircularDependencies(config.meta_agents, maxDepth);

  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }

  return result;
}
