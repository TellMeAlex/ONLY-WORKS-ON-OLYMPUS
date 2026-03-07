import { z } from "zod";
import type { OlimpusConfig } from "../config/schema.js";

/**
 * Config compatibility checking utilities for migration support.
 *
 * @since 0.4.0
 * @stable
 *
 * This module provides utilities for checking configuration compatibility across
 * versions, identifying deprecated fields, and providing migration guidance.
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for full stability policy
 */

/**
 * Migration Suggestion Schema - Suggested migration for deprecated config.
 *
 * @since 0.4.0
 * @stable
 *
 * Provides guidance on how to migrate deprecated configuration to the new format.
 */
export const MigrationSuggestionSchema = z.object({
  /** The deprecated field or configuration path */
  deprecatedPath: z.string(),
  /** The new field or configuration path to use instead */
  newPath: z.string(),
  /** Description of the migration change */
  description: z.string(),
  /** The version when this migration became necessary */
  sinceVersion: z.string(),
  /** Optional code example showing the migration */
  example: z.string().optional(),
  /** Whether automatic migration is possible */
  autoMigratable: z.boolean().optional(),
});

/**
 * Compatibility Issue Types - Discriminated Union
 */

/**
 * Zod schema for deprecated field compatibility issues.
 *
 * @since 0.4.0
 * @stable
 *
 * @example
 * ```ts
 * const issue: DeprecatedFieldIssue = {
 *   type: "deprecated_field",
 *   path: ["meta_agents", "agent_a", "temperature"],
 *   message: "Field 'temperature' is deprecated",
 *   migration: {
 *     deprecatedPath: "meta_agents.agent_a.temperature",
 *     newPath: "config_overrides.temperature",
 *     description: "Move temperature to config_overrides",
 *     sinceVersion: "0.4.0"
 *   }
 * };
 * ```
 */
export const DeprecatedFieldIssueSchema = z.object({
  type: z.literal("deprecated_field"),
  path: z.array(z.string()),
  message: z.string(),
  migration: MigrationSuggestionSchema,
});

/**
 * Zod schema for removed field compatibility issues.
 *
 * @since 0.4.0
 * @stable
 *
 * @example
 * ```ts
 * const issue: RemovedFieldIssue = {
 *   type: "removed_field",
 *   path: ["settings", "old_option"],
 *   message: "Field 'old_option' was removed",
 *   removedVersion: "0.4.0",
 *   replacement: "new_option"
 * };
 * ```
 */
export const RemovedFieldIssueSchema = z.object({
  type: z.literal("removed_field"),
  path: z.array(z.string()),
  message: z.string(),
  removedVersion: z.string(),
  replacement: z.string().optional(),
});

/**
 * Zod schema for invalid type compatibility issues.
 *
 * @since 0.4.0
 * @stable
 *
 * @example
 * ```ts
 * const issue: InvalidTypeIssue = {
 *   type: "invalid_type",
 *   path: ["meta_agents", "agent_a", "routing_rules", 0],
 *   message: "Invalid type for routing_rules[0]",
 *   expectedType: "object",
 *   actualType: "string"
 * };
 * ```
 */
export const InvalidTypeIssueSchema = z.object({
  type: z.literal("invalid_type"),
  path: z.array(z.string()),
  message: z.string(),
  expectedType: z.string(),
  actualType: z.string(),
});

/**
 * Zod schema for unknown field compatibility issues.
 *
 * @since 0.4.0
 * @stable
 *
 * @example
 * ```ts
 * const issue: UnknownFieldIssue = {
 *   type: "unknown_field",
 *   path: ["meta_agents", "agent_a", "unknown_option"],
 *   message: "Unknown field 'unknown_option'",
 *   suggestion: "Check if the field name is correct"
 * };
 * ```
 */
export const UnknownFieldIssueSchema = z.object({
  type: z.literal("unknown_field"),
  path: z.array(z.string()),
  message: z.string(),
  suggestion: z.string().optional(),
});

/**
 * Compatibility Issue Schema - Union of all issue types.
 *
 * @since 0.4.0
 * @stable
 *
 * Discriminated union of all compatibility issue types.
 */
export const CompatibilityIssueSchema = z.discriminatedUnion("type", [
  DeprecatedFieldIssueSchema,
  RemovedFieldIssueSchema,
  InvalidTypeIssueSchema,
  UnknownFieldIssueSchema,
]);

/**
 * Compatibility Check Result Schema.
 *
 * @since 0.4.0
 * @stable
 *
 * Contains the result of a compatibility check against a target version.
 */
export const CompatibilityCheckResultSchema = z.object({
  /** Whether the configuration is compatible with the target version */
  compatible: z.boolean(),
  /** The target version that was checked against */
  targetVersion: z.string(),
  /** All compatibility issues found (deprecated fields, removed fields, etc.) */
  issues: z.array(CompatibilityIssueSchema).default([]),
  /** Migration suggestions for any deprecated fields */
  migrations: z.array(MigrationSuggestionSchema).default([]),
  /** Whether automatic migration is possible for all issues */
  autoMigratable: z.boolean(),
});

/**
 * Compatibility Check Options Schema.
 *
 * @since 0.4.0
 * @stable
 *
 * Options for configuring compatibility checking behavior.
 */
export const CompatibilityCheckOptionsSchema = z.object({
  /** Include deprecated fields in the check (generates warnings, not errors) */
  includeDeprecated: z.boolean().default(true),
  /** Include strict type checking (may fail on minor type differences) */
  strictTypeCheck: z.boolean().default(false),
  /** Include unknown fields (fields not in schema) */
  includeUnknownFields: z.boolean().default(true),
});

/**
 * Inferred TypeScript types from schemas.
 *
 * @since 0.4.0
 * @stable
 */
export type MigrationSuggestion = z.infer<typeof MigrationSuggestionSchema>;

export type DeprecatedFieldIssue = z.infer<typeof DeprecatedFieldIssueSchema>;

export type RemovedFieldIssue = z.infer<typeof RemovedFieldIssueSchema>;

export type InvalidTypeIssue = z.infer<typeof InvalidTypeIssueSchema>;

export type UnknownFieldIssue = z.infer<typeof UnknownFieldIssueSchema>;

export type CompatibilityIssue = z.infer<typeof CompatibilityIssueSchema>;

export type CompatibilityCheckResult = z.infer<
  typeof CompatibilityCheckResultSchema
>;

export type CompatibilityCheckOptions = z.infer<
  typeof CompatibilityCheckOptionsSchema
>;

/**
 * Registry of deprecated configuration fields and their migrations.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * Maps deprecated paths to their migration suggestions.
 */
const DEPRECATED_FIELDS: Record<string, MigrationSuggestion> = {};

/**
 * Registry of removed configuration fields.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * Maps removed paths to their removal version and replacement.
 */
const REMOVED_FIELDS: Record<
  string,
  { removedVersion: string; replacement?: string }
> = {};

/**
 * Register a deprecated field with migration information.
 *
 * @since 0.4.0
 * @stable
 *
 * Use this to register configuration fields that have been deprecated
 * and provide migration guidance for users.
 *
 * @param deprecatedPath - The deprecated field path (e.g., "meta_agents.agent.temperature")
 * @param migration - Migration suggestion for the deprecated field
 *
 * @example
 * ```ts
 * registerDeprecatedField("meta_agents.agent.temperature", {
 *   deprecatedPath: "meta_agents.agent.temperature",
 *   newPath: "config_overrides.temperature",
 *   description: "Move temperature to config_overrides",
 *   sinceVersion: "0.4.0",
 *   autoMigratable: true
 * });
 * ```
 */
export function registerDeprecatedField(
  deprecatedPath: string,
  migration: MigrationSuggestion
): void {
  DEPRECATED_FIELDS[deprecatedPath] = migration;
}

/**
 * Register a removed field.
 *
 * @since 0.4.0
 * @stable
 *
 * Use this to register configuration fields that have been removed.
 *
 * @param path - The removed field path (e.g., "settings.old_option")
 * @param removedVersion - The version when the field was removed
 * @param replacement - Optional replacement field path
 *
 * @example
 * ```ts
 * registerRemovedField("settings.old_option", "0.4.0", "settings.new_option");
 * ```
 */
export function registerRemovedField(
  path: string,
  removedVersion: string,
  replacement?: string
): void {
  REMOVED_FIELDS[path] = { removedVersion, replacement };
}

/**
 * Get all registered deprecated fields.
 *
 * @since 0.4.0
 * @stable
 *
 * Returns a map of all registered deprecated fields and their migrations.
 *
 * @returns Record mapping deprecated paths to migration suggestions
 */
export function getDeprecatedFields(): Record<string, MigrationSuggestion> {
  return { ...DEPRECATED_FIELDS };
}

/**
 * Get all registered removed fields.
 *
 * @since 0.4.0
 * @stable
 *
 * Returns a map of all registered removed fields.
 *
 * @returns Record mapping removed paths to removal info
 */
export function getRemovedFields(): Record<
  string,
  { removedVersion: string; replacement?: string }
> {
  return { ...REMOVED_FIELDS };
}

/**
 * Clear all registered deprecated and removed fields.
 *
 * @since 0.4.0
 * @stable
 *
 * Primarily used in testing to reset state between test cases.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   clearCompatibilityRegistry();
 * });
 * ```
 */
export function clearCompatibilityRegistry(): void {
  Object.keys(DEPRECATED_FIELDS).forEach((key) => {
    delete DEPRECATED_FIELDS[key];
  });
  Object.keys(REMOVED_FIELDS).forEach((key) => {
    delete REMOVED_FIELDS[key];
  });
}

/**
 * Check configuration compatibility against a target version.
 *
 * @since 0.4.0
 * @stable
 *
 * Analyzes a configuration object for compatibility issues with a target version.
 * Checks for deprecated fields, removed fields, type mismatches, and unknown fields.
 *
 * @param config - The Olimpus configuration to check
 * @param targetVersion - The target version to check compatibility against
 * @param options - Optional configuration for compatibility checking
 * @returns CompatibilityCheckResult with all issues and migration suggestions
 *
 * @example
 * ```ts
 * const result = checkConfigCompatibility(config, "0.5.0", {
 *   includeDeprecated: true,
 *   includeUnknownFields: true
 * });
 *
 * if (!result.compatible) {
 *   console.log("Issues found:", result.issues);
 *   console.log("Migrations needed:", result.migrations);
 * }
 * ```
 */
export function checkConfigCompatibility(
  config: OlimpusConfig,
  targetVersion: string,
  options?: Partial<CompatibilityCheckOptions>
): CompatibilityCheckResult {
  const opts: CompatibilityCheckOptions = {
    includeDeprecated: true,
    strictTypeCheck: false,
    includeUnknownFields: true,
    ...options,
  };

  const issues: CompatibilityIssue[] = [];
  const migrations: MigrationSuggestion[] = [];
  let autoMigratable = true;

  // Check for removed fields (always an error)
  const removedFieldIssues = checkRemovedFields(config);
  issues.push(...removedFieldIssues);

  // Check for deprecated fields (warning, not an error)
  if (opts.includeDeprecated) {
    const deprecatedFieldIssues = checkDeprecatedFields(config);
    issues.push(...deprecatedFieldIssues.issues);
    migrations.push(...deprecatedFieldIssues.migrations);

    // Check if all deprecated fields are auto-migratable
    autoMigratable = deprecatedFieldIssues.issues.every(
      (issue) => issue.type === "deprecated_field" && issue.migration.autoMigratable
    );
  }

  // Determine compatibility based on issue types
  // - Removed fields always make config incompatible
  // - Invalid types always make config incompatible
  // - Deprecated fields do not affect compatibility (warnings only)
  // - Unknown fields do not affect compatibility (warnings only)
  const incompatibleIssues = issues.filter(
    (issue) =>
      issue.type === "removed_field" || issue.type === "invalid_type"
  );

  const result: CompatibilityCheckResult = {
    compatible: incompatibleIssues.length === 0,
    targetVersion,
    issues,
    migrations,
    autoMigratable,
  };

  return result;
}

/**
 * Check for removed fields in configuration.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * @param config - The configuration to check
 * @returns Array of removed field issues
 */
function checkRemovedFields(
  config: OlimpusConfig
): RemovedFieldIssue[] {
  const issues: RemovedFieldIssue[] = [];

  // Check each registered removed field
  for (const [path, info] of Object.entries(REMOVED_FIELDS)) {
    if (hasConfigValue(config, path)) {
      const pathParts = path.split(".");
      issues.push({
        type: "removed_field",
        path: pathParts,
        message: `Field '${path}' was removed in v${info.removedVersion}`,
        removedVersion: info.removedVersion,
        replacement: info.replacement,
      });
    }
  }

  return issues;
}

/**
 * Check for deprecated fields in configuration.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * @param config - The configuration to check
 * @returns Object with deprecated field issues and migrations
 */
function checkDeprecatedFields(
  config: OlimpusConfig
): { issues: DeprecatedFieldIssue[]; migrations: MigrationSuggestion[] } {
  const issues: DeprecatedFieldIssue[] = [];
  const migrations: MigrationSuggestion[] = [];

  // Check each registered deprecated field
  for (const [path, migration] of Object.entries(DEPRECATED_FIELDS)) {
    if (hasConfigValue(config, path)) {
      const pathParts = path.split(".");
      issues.push({
        type: "deprecated_field",
        path: pathParts,
        message: `Field '${path}' is deprecated since v${migration.sinceVersion}`,
        migration,
      });
      migrations.push(migration);
    }
  }

  return { issues, migrations };
}

/**
 * Check if a configuration has a value at a specific path.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * @param config - The configuration object
 * @param path - Dot-separated path to check (e.g., "meta_agents.agent.temperature")
 * @returns true if the path exists and has a defined value
 */
function hasConfigValue(config: OlimpusConfig, path: string): boolean {
  const parts = path.split(".");
  let current: unknown = config;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return false;
    }

    if (typeof current !== "object" || Array.isArray(current)) {
      return false;
    }

    // Handle numeric array indices
    const index = Number.parseInt(part, 10);
    if (!Number.isNaN(index)) {
      if (Array.isArray(current) && index >= 0 && index < current.length) {
        current = current[index];
      } else {
        return false;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current !== undefined;
}

/**
 * Create a new compatibility check result.
 *
 * @since 0.4.0
 * @stable
 *
 * Factory function for creating compatibility check result objects.
 *
 * @param targetVersion - The target version for the check
 * @param compatible - Whether the configuration is compatible
 * @returns New compatibility check result with empty issues
 *
 * @example
 * ```ts
 * const result = createCompatibilityCheckResult("0.5.0", true);
 * // Returns: { compatible: true, targetVersion: "0.5.0", issues: [], migrations: [], autoMigratable: true }
 * ```
 */
export function createCompatibilityCheckResult(
  targetVersion: string,
  compatible: boolean = true
): CompatibilityCheckResult {
  return {
    compatible,
    targetVersion,
    issues: [],
    migrations: [],
    autoMigratable: true,
  };
}

/**
 * Format compatibility issues as human-readable strings.
 *
 * @since 0.4.0
 * @stable
 *
 * Converts compatibility issues into formatted strings for display.
 *
 * @param result - The compatibility check result
 * @returns Array of formatted issue messages
 *
 * @example
 * ```ts
 * const result = checkConfigCompatibility(config, "0.5.0");
 * const messages = formatCompatibilityIssues(result);
 * // Returns: ["[DEPRECATED] meta_agents.agent.temperature: Field is deprecated..."]
 * ```
 */
export function formatCompatibilityIssues(
  result: CompatibilityCheckResult
): string[] {
  return result.issues.map((issue) => {
    const pathStr = issue.path.length > 0 ? issue.path.join(".") : "root";

    switch (issue.type) {
      case "deprecated_field":
        return `[DEPRECATED] ${pathStr}: ${issue.message}\n  → ${issue.migration.newPath}`;

      case "removed_field":
        const replacement = issue.replacement
          ? `\n  → ${issue.replacement}`
          : "";
        return `[REMOVED] ${pathStr}: ${issue.message} (v${issue.removedVersion})${replacement}`;

      case "invalid_type":
        return `[TYPE ERROR] ${pathStr}: ${issue.message}\n  Expected: ${issue.expectedType}, Actual: ${issue.actualType}`;

      case "unknown_field":
        const suggestion = issue.suggestion
          ? `\n  ${issue.suggestion}`
          : "";
        return `[UNKNOWN] ${pathStr}: ${issue.message}${suggestion}`;
    }
  });
}

/**
 * Get a summary of compatibility check results.
 *
 * @since 0.4.0
 * @stable
 *
 * Returns a human-readable summary of the compatibility check.
 *
 * @param result - The compatibility check result
 * @returns Summary string
 *
 * @example
 * ```ts
 * const result = checkConfigCompatibility(config, "0.5.0");
 * const summary = getCompatibilitySummary(result);
 * // Returns: "Configuration is compatible with v0.5.0. No issues found."
 * ```
 */
export function getCompatibilitySummary(
  result: CompatibilityCheckResult
): string {
  const { compatible, targetVersion, issues } = result;

  if (compatible && issues.length === 0) {
    return `Configuration is compatible with v${targetVersion}. No issues found.`;
  }

  if (compatible) {
    return `Configuration is compatible with v${targetVersion}. Found ${issues.length} issue(s) that should be addressed.`;
  }

  return `Configuration is NOT compatible with v${targetVersion}. Found ${issues.length} issue(s) that must be resolved.`;
}

/**
 * Check if a compatibility check result has issues of a specific type.
 *
 * @since 0.4.0
 * @stable
 *
 * @param result - The compatibility check result
 * @param type - The type of issue to check for
 * @returns true if issues of the specified type exist
 *
 * @example
 * ```ts
 * const result = checkConfigCompatibility(config, "0.5.0");
 * const hasDeprecated = hasIssuesOfType(result, "deprecated_field");
 * ```
 */
export function hasIssuesOfType(
  result: CompatibilityCheckResult,
  type: CompatibilityIssue["type"]
): boolean {
  return result.issues.some((issue) => issue.type === type);
}

/**
 * Filter issues by severity level.
 *
 * @since 0.4.0
 * @stable
 *
 * Separates issues into errors (blocking compatibility) and warnings (non-blocking).
 *
 * @param result - The compatibility check result
 * @returns Object with error and warning arrays
 *
 * @example
 * ```ts
 * const result = checkConfigCompatibility(config, "0.5.0");
 * const { errors, warnings } = filterIssuesBySeverity(result);
 * ```
 */
export function filterIssuesBySeverity(result: CompatibilityCheckResult): {
  errors: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
} {
  const errors: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];

  for (const issue of result.issues) {
    switch (issue.type) {
      case "removed_field":
      case "invalid_type":
        errors.push(issue);
        break;

      case "deprecated_field":
      case "unknown_field":
        warnings.push(issue);
        break;
    }
  }

  return { errors, warnings };
}
