import { z } from "zod";
import type { Template } from "./types.js";
import { TEMPLATE_CATEGORIES } from "./types.js";
import { BUILTIN_AGENT_NAMES } from "../config/validator.js";

/**
 * Validation Error Types - Discriminated Union
 */

export const InvalidTemplateCategoryErrorSchema = z.object({
  type: z.literal("invalid_category"),
  message: z.string(),
  path: z.array(z.string()),
  category: z.string(),
});

export const InvalidTemplateNameErrorSchema = z.object({
  type: z.literal("invalid_name"),
  message: z.string(),
  path: z.array(z.string()),
  name: z.string(),
});

export const TemplateSchemaValidationErrorSchema = z.object({
  type: z.literal("schema_validation"),
  message: z.string(),
  path: z.array(z.string()),
  zodIssue: z.any().optional(),
});

export const MissingRequiredFieldErrorSchema = z.object({
  type: z.literal("missing_required_field"),
  message: z.string(),
  path: z.array(z.string()),
  field: z.string(),
});

export const InvalidAgentReferenceErrorSchema = z.object({
  type: z.literal("invalid_agent_reference"),
  message: z.string(),
  path: z.array(z.string()),
  reference: z.string(),
});

/**
 * Validation Warning Schema
 */

export const EmptyRoutingRulesWarningSchema = z.object({
  type: z.literal("empty_routing_rules"),
  message: z.string(),
  path: z.array(z.string()),
});

export const MissingTagsWarningSchema = z.object({
  type: z.literal("missing_tags"),
  message: z.string(),
  path: z.array(z.string()),
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

export const TemplateValidationErrorSchema = z.discriminatedUnion("type", [
  InvalidTemplateCategoryErrorSchema,
  InvalidTemplateNameErrorSchema,
  TemplateSchemaValidationErrorSchema,
  MissingRequiredFieldErrorSchema,
  InvalidAgentReferenceErrorSchema,
]);

/**
 * Validation Warning Schema - Union of all warning types
 */

export const TemplateValidationWarningSchema = z.discriminatedUnion("type", [
  EmptyRoutingRulesWarningSchema,
  MissingTagsWarningSchema,
  RegexPerformanceWarningSchema,
]);

/**
 * Validation Result Schema - Aggregate result of validation
 */

export const TemplateValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(TemplateValidationErrorSchema).default([]),
  warnings: z.array(TemplateValidationWarningSchema).default([]),
  template: z.any().optional(),
});

/**
 * Severity Levels for filtering issues
 */

export const SeveritySchema = z.enum(["error", "warning"]);
export const Severity = ["error", "warning"] as const;

/**
 * Check Type for categorizing validation checks
 */

export const TemplateCheckTypeSchema = z.enum([
  "schema",
  "category",
  "name",
  "required_fields",
  "agent_reference",
  "regex_performance",
]);

/**
 * Check Result Schema - Result of a single validation check
 */

export const TemplateCheckResultSchema = z.object({
  checkType: TemplateCheckTypeSchema,
  passed: z.boolean(),
  errors: z.array(TemplateValidationErrorSchema).default([]),
  warnings: z.array(TemplateValidationWarningSchema).default([]),
});

/**
 * Validation Context Schema - Context for validation
 */

export const TemplateValidationContextSchema = z.object({
  checkCategories: z.boolean().default(true),
  checkNames: z.boolean().default(true),
  checkRequiredFields: z.boolean().default(true),
  checkAgentReferences: z.boolean().default(true),
  checkRegexPerformance: z.boolean().default(true),
  requireTags: z.boolean().default(false),
});

/**
 * Inferred TypeScript types from schemas
 */

export type InvalidTemplateCategoryError = z.infer<
  typeof InvalidTemplateCategoryErrorSchema
>;
export type InvalidTemplateNameError = z.infer<
  typeof InvalidTemplateNameErrorSchema
>;
export type TemplateSchemaValidationError = z.infer<
  typeof TemplateSchemaValidationErrorSchema
>;
export type MissingRequiredFieldError = z.infer<
  typeof MissingRequiredFieldErrorSchema
>;
export type TemplateInvalidAgentReferenceError = z.infer<
  typeof InvalidAgentReferenceErrorSchema
>;

export type TemplateValidationError = z.infer<
  typeof TemplateValidationErrorSchema
>;

export type EmptyRoutingRulesWarning = z.infer<
  typeof EmptyRoutingRulesWarningSchema
>;
export type MissingTagsWarning = z.infer<typeof MissingTagsWarningSchema>;
export type TemplateRegexPerformanceWarning = z.infer<
  typeof RegexPerformanceWarningSchema
>;

export type TemplateValidationWarning = z.infer<
  typeof TemplateValidationWarningSchema
>;

export type TemplateValidationResult = z.infer<
  typeof TemplateValidationResultSchema
>;

export type SeverityLevel = (typeof Severity)[number];

export type TemplateCheckType = z.infer<typeof TemplateCheckTypeSchema>;

export type TemplateCheckResult = z.infer<typeof TemplateCheckResultSchema>;

export type TemplateValidationContext = z.infer<
  typeof TemplateValidationContextSchema
>;

/**
 * Create an invalid template category error
 */
export function createInvalidTemplateCategoryError(
  message: string,
  path: string[],
  category: string,
): InvalidTemplateCategoryError {
  return {
    type: "invalid_category",
    message,
    path,
    category,
  };
}

/**
 * Create an invalid template name error
 */
export function createInvalidTemplateNameError(
  message: string,
  path: string[],
  name: string,
): InvalidTemplateNameError {
  return {
    type: "invalid_name",
    message,
    path,
    name,
  };
}

/**
 * Create a template schema validation error
 */
export function createTemplateSchemaValidationError(
  message: string,
  path: string[],
  zodIssue?: unknown,
): TemplateSchemaValidationError {
  return {
    type: "schema_validation",
    message,
    path,
    zodIssue,
  };
}

/**
 * Create a missing required field error
 */
export function createMissingRequiredFieldError(
  message: string,
  path: string[],
  field: string,
): MissingRequiredFieldError {
  return {
    type: "missing_required_field",
    message,
    path,
    field,
  };
}

/**
 * Create an invalid agent reference error for templates
 */
export function createTemplateInvalidAgentReferenceError(
  message: string,
  path: string[],
  reference: string,
): TemplateInvalidAgentReferenceError {
  return {
    type: "invalid_agent_reference",
    message,
    path,
    reference,
  };
}

/**
 * Create an empty routing rules warning
 */
export function createEmptyRoutingRulesWarning(
  message: string,
  path: string[],
): EmptyRoutingRulesWarning {
  return {
    type: "empty_routing_rules",
    message,
    path,
  };
}

/**
 * Create a missing tags warning
 */
export function createMissingTagsWarning(
  message: string,
  path: string[],
): MissingTagsWarning {
  return {
    type: "missing_tags",
    message,
    path,
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
): TemplateRegexPerformanceWarning {
  return {
    type: "regex_performance",
    message,
    path,
    pattern,
    reason,
  };
}

/**
 * Create a new template validation result
 */
export function createTemplateValidationResult(
  template?: Template,
): TemplateValidationResult {
  return {
    valid: false,
    errors: [],
    warnings: [],
    template,
  };
}

/**
 * Create a template validation check result
 */
export function createTemplateCheckResult(
  checkType: TemplateCheckType,
  passed: boolean = false,
): TemplateCheckResult {
  return {
    checkType,
    passed,
    errors: [],
    warnings: [],
  };
}

/**
 * Check if a template validation result is valid (no errors)
 */
export function isTemplateValid(result: TemplateValidationResult): boolean {
  return result.errors.length === 0;
}

/**
 * Check if a template validation result has warnings
 */
export function hasTemplateWarnings(
  result: TemplateValidationResult,
): boolean {
  return result.warnings.length > 0;
}

/**
 * Get a summary of template validation result as a human-readable string
 */
export function getTemplateValidationSummary(
  result: TemplateValidationResult,
): string {
  const { errors, warnings } = result;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return "Template is valid. No errors or warnings found.";
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
 * Format template validation errors as a string list
 */
export function formatTemplateErrors(result: TemplateValidationResult): string[] {
  return result.errors.map((error) => {
    const pathStr = error.path.length > 0 ? error.path.join(".") : "root";
    return `[ERROR] ${pathStr}: ${error.message}`;
  });
}

/**
 * Format template validation warnings as a string list
 */
export function formatTemplateWarnings(
  result: TemplateValidationResult,
): string[] {
  return result.warnings.map((warning) => {
    const pathStr = warning.path.length > 0 ? warning.path.join(".") : "root";
    return `[WARNING] ${pathStr}: ${warning.message}`;
  });
}

/**
 * Main validation function for templates.
 * Validates a template against schema and semantic rules.
 * Orchestrates all validation checks and returns aggregated results.
 *
 * Checks performed (when enabled in context):
 * - Category validation (must be one of the valid categories)
 * - Name validation (must be non-empty and follow naming conventions)
 * - Required fields validation
 * - Agent reference validation (all references must be to builtin agents)
 * - Regex performance analysis for routing rule patterns (generates warnings only)
 *
 * @param template - The template to validate
 * @param context - Optional validation context with configuration options
 * @returns TemplateValidationResult with aggregated errors, warnings, and validity status
 */
export function validateTemplate(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateValidationResult {
  const ctx: TemplateValidationContext = {
    checkCategories: true,
    checkNames: true,
    checkRequiredFields: true,
    checkAgentReferences: true,
    checkRegexPerformance: true,
    requireTags: false,
    ...context,
  };

  const result = createTemplateValidationResult(template);

  // Run category check
  if (ctx.checkCategories) {
    const categoryCheck = checkTemplateCategory(template, ctx);
    result.errors.push(...categoryCheck.errors);
  }

  // Run name check
  if (ctx.checkNames) {
    const nameCheck = checkTemplateName(template, ctx);
    result.errors.push(...nameCheck.errors);
  }

  // Run required fields check
  if (ctx.checkRequiredFields) {
    const fieldsCheck = checkRequiredFields(template, ctx);
    result.errors.push(...fieldsCheck.errors);
    result.warnings.push(...fieldsCheck.warnings);
  }

  // Run agent reference check
  if (ctx.checkAgentReferences) {
    const agentRefCheck = checkAgentReferencesInTemplate(template, ctx);
    result.errors.push(...agentRefCheck.errors);
  }

  // Run regex performance check (generates warnings, not errors)
  if (ctx.checkRegexPerformance) {
    const regexCheck = checkRegexPerformanceInTemplate(template, ctx);
    result.warnings.push(...regexCheck.warnings);
  }

  // Determine validity based on errors (warnings don't affect validity)
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Check that template category is valid
 * @param template - The template to validate
 * @param context - Optional validation context
 * @returns CheckResult with category check status
 */
export function checkTemplateCategory(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateCheckResult {
  const result = createTemplateCheckResult("category");

  if (!TEMPLATE_CATEGORIES.includes(template.category as any)) {
    result.passed = false;
    result.errors.push(
      createInvalidTemplateCategoryError(
        `Invalid category: "${template.category}". Valid categories are: ${TEMPLATE_CATEGORIES.join(", ")}`,
        ["category"],
        template.category,
      ),
    );
  } else {
    result.passed = true;
  }

  return result;
}

/**
 * Check that template name is valid
 * @param template - The template to validate
 * @param context - Optional validation context
 * @returns CheckResult with name check status
 */
export function checkTemplateName(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateCheckResult {
  const result = createTemplateCheckResult("name");

  if (!template.name || template.name.trim() === "") {
    result.passed = false;
    result.errors.push(
      createInvalidTemplateNameError(
        "Template name is required and cannot be empty",
        ["name"],
        template.name ?? "",
      ),
    );
    return result;
  }

  // Check for invalid characters (allow alphanumeric, hyphens, underscores)
  const validNamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!validNamePattern.test(template.name)) {
    result.passed = false;
    result.errors.push(
      createInvalidTemplateNameError(
        `Template name "${template.name}" contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.`,
        ["name"],
        template.name,
      ),
    );
    return result;
  }

  result.passed = true;
  return result;
}

/**
 * Check that all required fields are present and valid
 * @param template - The template to validate
 * @param context - Optional validation context
 * @returns CheckResult with required fields check status
 */
export function checkRequiredFields(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateCheckResult {
  const result = createTemplateCheckResult("required_fields");

  if (!template.description || template.description.trim() === "") {
    result.passed = false;
    result.errors.push(
      createMissingRequiredFieldError(
        "Template description is required",
        ["description"],
        "description",
      ),
    );
  }

  if (!template.meta_agent) {
    result.passed = false;
    result.errors.push(
      createMissingRequiredFieldError(
        "Template meta_agent is required",
        ["meta_agent"],
        "meta_agent",
      ),
    );
    return result;
  }

  if (
    !template.meta_agent.delegates_to ||
    template.meta_agent.delegates_to.length === 0
  ) {
    result.passed = false;
    result.errors.push(
      createMissingRequiredFieldError(
        "meta_agent.delegates_to must contain at least one agent",
        ["meta_agent", "delegates_to"],
        "delegates_to",
      ),
    );
  }

  if (
    !template.meta_agent.routing_rules ||
    template.meta_agent.routing_rules.length === 0
  ) {
    result.passed = false;
    result.warnings.push(
      createEmptyRoutingRulesWarning(
        "meta_agent.routing_rules is empty. This template may not function correctly without routing rules.",
        ["meta_agent", "routing_rules"],
      ),
    );
  }

  // Check for tags if requireTags is enabled
  const ctx: TemplateValidationContext = {
    checkCategories: true,
    checkNames: true,
    checkRequiredFields: true,
    checkAgentReferences: true,
    checkRegexPerformance: true,
    requireTags: false,
    ...context,
  };
  if (ctx.requireTags && (!template.tags || template.tags.length === 0)) {
    result.warnings.push(
      createMissingTagsWarning(
        "Template has no tags. Adding tags can help with discoverability.",
        ["tags"],
      ),
    );
  }

  if (result.errors.length === 0) {
    result.passed = true;
  }

  return result;
}

/**
 * Check for invalid agent references in template meta-agent definition
 * Validates that all referenced agents exist in BUILTIN_AGENT_NAMES
 * Note: Templates typically reference builtin agents only, not other templates
 * @param template - The template to validate
 * @param context - Optional validation context
 * @returns CheckResult with agent reference check status
 */
export function checkAgentReferencesInTemplate(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateCheckResult {
  const result = createTemplateCheckResult("agent_reference");

  if (!template.meta_agent) {
    result.passed = true;
    return result;
  }

  const errors: TemplateValidationError[] = [];
  const validAgents = new Set<string>(BUILTIN_AGENT_NAMES);

  // Check delegates_to for invalid references
  for (const delegate of template.meta_agent.delegates_to) {
    if (!validAgents.has(delegate)) {
      errors.push(
        createTemplateInvalidAgentReferenceError(
          `Invalid agent reference: "${delegate}" is not a recognized builtin agent. Valid agents are: ${BUILTIN_AGENT_NAMES.join(", ")}`,
          ["meta_agent", "delegates_to"],
          delegate,
        ),
      );
    }
  }

  // Check routing_rules target_agent for invalid references
  for (const [ruleIndex, rule] of template.meta_agent.routing_rules.entries()) {
    if (!validAgents.has(rule.target_agent)) {
      errors.push(
        createTemplateInvalidAgentReferenceError(
          `Invalid agent reference: "${rule.target_agent}" is not a recognized builtin agent. Valid agents are: ${BUILTIN_AGENT_NAMES.join(", ")}`,
          ["meta_agent", "routing_rules", String(ruleIndex), "target_agent"],
          rule.target_agent,
        ),
      );
    }
  }

  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }

  return result;
}

/**
 * Result of analyzing a regex pattern for performance issues
 */
interface RegexAnalysisResult {
  hasIssue: boolean;
  reason: string;
}

/**
 * Analyze a regex pattern for common performance anti-patterns
 * @param pattern - The regex pattern to analyze
 * @returns RegexAnalysisResult indicating if there are performance issues
 */
function analyzeRegexPattern(pattern: string): RegexAnalysisResult {
  const complexLookaround = /\(\?[=!][^)]*[+*?]\)|\(\?<[=!][^)]*[+*?]\)/.test(
    pattern,
  );
  if (complexLookaround) {
    return {
      hasIssue: true,
      reason: "Complex lookaheads/lookbehinds with quantifiers can be slow",
    };
  }

  const nestedQuantifiers = /(\([^)]*[+*?][^)]*\)[+*?]|([+*?][+*?]))/.test(
    pattern,
  );
  if (nestedQuantifiers) {
    return {
      hasIssue: true,
      reason: "Nested quantifiers can cause catastrophic backtracking",
    };
  }

  const overlappingAlternation = /(\w+)\|\1/.test(pattern);
  if (overlappingAlternation) {
    return {
      hasIssue: true,
      reason: "Overlapping alternation can cause inefficient backtracking",
    };
  }

  const unboundedDot = /\^\.\*|\.\*\$|\.\*$|\.\*\.\*/.test(pattern);
  if (unboundedDot) {
    return {
      hasIssue: true,
      reason: "Unbounded .* patterns can match excessively and cause performance issues",
    };
  }

  const largeRepetition = /\[[^\]]+\][+*?]*\{\d{2,}/.test(pattern);
  if (largeRepetition) {
    return {
      hasIssue: true,
      reason: "Large repetition quantifiers can cause excessive backtracking",
    };
  }

  const backreferences = /\\\d/.test(pattern);
  if (backreferences) {
    return {
      hasIssue: true,
      reason: "Backreferences prevent efficient regex compilation and can be slow",
    };
  }

  const excessiveAlternations = (pattern.match(/\|/g) || []).length > 8;
  if (excessiveAlternations) {
    return {
      hasIssue: true,
      reason: "Many alternations can cause the regex engine to try many paths",
    };
  }

  return {
    hasIssue: false,
    reason: "",
  };
}

/**
 * Check for regex performance issues in template routing rules
 * Analyzes regex patterns in matchers for potential performance anti-patterns
 * @param template - The template to validate
 * @param context - Optional validation context
 * @returns CheckResult with regex performance check status (always passes, warnings only)
 */
export function checkRegexPerformanceInTemplate(
  template: Template,
  context?: Partial<TemplateValidationContext>,
): TemplateCheckResult {
  const result = createTemplateCheckResult("regex_performance");

  if (!template.meta_agent) {
    result.passed = true;
    return result;
  }

  const warnings: TemplateValidationWarning[] = [];

  // Check routing_rules for regex patterns
  for (const [ruleIndex, rule] of template.meta_agent.routing_rules.entries()) {
    if (rule.matcher.type === "regex") {
      const pattern = rule.matcher.pattern;
      const analysis = analyzeRegexPattern(pattern);

      if (analysis.hasIssue) {
        warnings.push(
          createRegexPerformanceWarning(
            `Regex pattern may cause performance issues: ${analysis.reason}`,
            ["meta_agent", "routing_rules", String(ruleIndex), "matcher", "pattern"],
            pattern,
            analysis.reason,
          ),
        );
      }
    }
  }

  if (warnings.length > 0) {
    // Regex performance issues generate warnings, not errors
    result.passed = true;
    result.warnings.push(...warnings);
  } else {
    result.passed = true;
  }

  return result;
}
