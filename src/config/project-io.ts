import * as fs from "fs";
import * as path from "path";
import { OlimpusConfigSchema, type OlimpusConfig } from "./schema.js";
import { validateOlimpusConfig, formatErrors, formatWarnings } from "./validator.js";

/**
 * Options for exporting Olimpus configuration
 */
export interface ExportOlimpusConfigOptions {
  /**
   * Target location for export: "user" for ~/.config/opencode/olimpus.jsonc or "project" for <projectDir>/olimpus.jsonc
   * @default "user"
   */
  location?: "user" | "project";
  /**
   * Whether to perform semantic validation before export
   * @default true
   */
  validate?: boolean;
  /**
   * Whether to check circular dependencies in meta-agent delegation chains
   * @default true
   */
  checkCircularDependencies?: boolean;
  /**
   * Whether to validate agent references against builtin agents
   * @default true
   */
  checkAgentReferences?: boolean;
  /**
   * Whether to analyze regex patterns for performance issues (generates warnings only)
   * @default true
   */
  checkRegexPerformance?: boolean;
  /**
   * Number of spaces for JSON indentation
   * @default 2
   */
  indent?: number;
  /**
   * Whether to create parent directories if they don't exist
   * @default true
   */
  createDir?: boolean;
}

/**
 * Options for importing Olimpus configuration
 */
export interface ImportOlimpusConfigOptions {
  /**
   * Source location for import: "user" for ~/.config/opencode/olimpus.jsonc or "project" for <projectDir>/olimpus.jsonc
   * @default "project"
   */
  location?: "user" | "project";
  /**
   * Whether to perform semantic validation after import
   * @default true
   */
  validate?: boolean;
  /**
   * Whether to check circular dependencies in meta-agent delegation chains
   * @default true
   */
  checkCircularDependencies?: boolean;
  /**
   * Whether to validate agent references against builtin agents
   * @default true
   */
  checkAgentReferences?: boolean;
  /**
   * Whether to analyze regex patterns for performance issues (generates warnings only)
   * @default true
   */
  checkRegexPerformance?: boolean;
}

/**
 * Result of importing Olimpus configuration
 */
export interface ImportOlimpusConfigResult {
  /**
   * The imported and validated configuration
   */
  config: OlimpusConfig;
  /**
   * Any warnings generated during validation
   */
  warnings: string[];
}

/**
 * Export Olimpus configuration to a file.
 *
 * Supports exporting to either:
 * - User config: ~/.config/opencode/olimpus.jsonc
 * - Project config: <projectDir>/olimpus.jsonc
 *
 * Configuration is validated before export (unless disabled).
 *
 * @param config - The Olimpus configuration to export
 * @param projectDir - Path to the project directory (required for "project" location)
 * @param options - Optional configuration for export behavior
 * @returns Path to the exported file
 * @throws Error if config is invalid or file cannot be written
 */
export async function exportProjectConfig(
  config: OlimpusConfig,
  projectDir: string,
  options?: ExportOlimpusConfigOptions,
): Promise<string> {
  // Validate config schema
  const result = OlimpusConfigSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join(".")} - ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid olimpus config:\n${errors}`);
  }

  // Optional semantic validation for early error detection
  const shouldValidate = options?.validate ?? true;
  if (shouldValidate) {
    const validationResult = validateOlimpusConfig(result.data, {
      checkCircularDependencies: options?.checkCircularDependencies ?? true,
      checkAgentReferences: options?.checkAgentReferences ?? true,
      checkRegexPerformance: options?.checkRegexPerformance ?? true,
    });

    // Throw if there are validation errors
    if (!validationResult.valid) {
      const errorMessages = formatErrors(validationResult).join("\n");
      const warningMessages = formatWarnings(validationResult).join("\n");
      const message = `Configuration validation failed:\n${errorMessages}${
        warningMessages ? `\n\nWarnings:\n${warningMessages}` : ""
      }`;
      throw new Error(message);
    }

    // Warnings don't affect export, but may indicate issues
    if (validationResult.warnings.length > 0) {
      const warningMessages = formatWarnings(validationResult).join("\n");
      // Warnings are silently ignored during export to avoid breaking changes
    }
  }

  // Determine export path
  const location = options?.location ?? "user";
  let exportPath: string;

  if (location === "user") {
    const homeDir = process.env.HOME ?? ".";
    exportPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
  } else {
    exportPath = path.join(projectDir, "olimpus.jsonc");
  }

  // Create parent directories if needed
  const createDir = options?.createDir ?? true;
  if (createDir) {
    const dirPath = path.dirname(exportPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Format and write configuration
  const indent = options?.indent ?? 2;
  const formatted = JSON.stringify(config, null, indent);

  fs.writeFileSync(exportPath, formatted, "utf-8");

  return exportPath;
}

/**
 * Import Olimpus configuration from a file.
 *
 * Supports importing from either:
 * - User config: ~/.config/opencode/olimpus.jsonc
 * - Project config: <projectDir>/olimpus.jsonc
 *
 * Configuration is validated after import (unless disabled).
 *
 * @param projectDir - Path to the project directory (required for "project" location)
 * @param options - Optional configuration for import behavior
 * @returns The imported configuration and any warnings
 * @throws Error if file doesn't exist or config is invalid
 */
export async function importProjectConfig(
  projectDir: string,
  options?: ImportOlimpusConfigOptions,
): Promise<ImportOlimpusConfigResult> {
  // Determine import path
  const location = options?.location ?? "project";
  let importPath: string;

  if (location === "user") {
    const homeDir = process.env.HOME ?? ".";
    importPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
  } else {
    importPath = path.join(projectDir, "olimpus.jsonc");
  }

  // Check if file exists
  if (!fs.existsSync(importPath)) {
    throw new Error(
      `Configuration file not found: ${importPath}`,
    );
  }

  // Read and parse configuration
  const content = fs.readFileSync(importPath, "utf-8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse configuration file: ${message}`);
  }

  // Validate config schema
  const result = OlimpusConfigSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join(".")} - ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid olimpus config:\n${errors}`);
  }

  // Collect warnings from validation
  const warnings: string[] = [];

  // Optional semantic validation
  const shouldValidate = options?.validate ?? true;
  if (shouldValidate) {
    const validationResult = validateOlimpusConfig(result.data, {
      checkCircularDependencies: options?.checkCircularDependencies ?? true,
      checkAgentReferences: options?.checkAgentReferences ?? true,
      checkRegexPerformance: options?.checkRegexPerformance ?? true,
    });

    // Throw if there are validation errors
    if (!validationResult.valid) {
      const errorMessages = formatErrors(validationResult).join("\n");
      const warningMessages = formatWarnings(validationResult).join("\n");
      const message = `Configuration validation failed:\n${errorMessages}${
        warningMessages ? `\n\nWarnings:\n${warningMessages}` : ""
      }`;
      throw new Error(message);
    }

    // Collect warnings
    if (validationResult.warnings.length > 0) {
      warnings.push(...formatWarnings(validationResult));
    }
  }

  return {
    config: result.data,
    warnings,
  };
}
