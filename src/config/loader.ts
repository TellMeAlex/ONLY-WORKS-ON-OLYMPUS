import * as fs from "fs";
import * as path from "path";
import { parse } from "jsonc-parser";
import { OlimpusConfigSchema, type OlimpusConfig } from "./schema.js";
import { scaffoldOlimpusConfig } from "./scaffolder.js";
import { validateOlimpusConfig, formatErrors, formatWarnings } from "./validator.js";

/**
 * Options for loading Olimpus configuration
 */
export interface LoadOlimpusConfigOptions {
  /**
   * Whether to perform semantic validation (circular dependencies, agent references, regex performance)
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
 * Load olimpus.jsonc from project directory and optional user config directory.
 * Search order: project dir first (overrides user config dir if both exist).
 * Returns parsed and validated config with merged defaults.
 *
 * Wizard mode behavior:
 * - By default, uses interactive wizard when no config exists
 * - Set OLIMPUS_SKIP_WIZARD=1 environment variable to skip wizard and use silent scaffolding
 *
 * @param projectDir - Path to the project directory containing olimpus.jsonc
  * @param options - Optional configuration for loading and validation
  * @returns Parsed and validated Olimpus configuration
  * @throws Error if config is invalid according to schema or semantic validation
  */
export async function loadOlimpusConfig(
  projectDir: string,
  options?: LoadOlimpusConfigOptions,
): Promise<OlimpusConfig> {
  const homeDir = process.env.HOME ?? ".";
  const userConfigPath = path.join(
    homeDir,
    ".config",
    "opencode",
    "olimpus.jsonc",
  );
  const projectConfigPath = path.join(projectDir, "olimpus.jsonc");

  let configData: Record<string, unknown> = {};

  if (fs.existsSync(userConfigPath)) {
    const content = fs.readFileSync(userConfigPath, "utf-8");
    const userConfig = parseJsonc(content, userConfigPath);
    if (userConfig) {
      configData = deepMerge(configData, userConfig as Record<string, unknown>);
    }
  }

  if (fs.existsSync(projectConfigPath)) {
    const content = fs.readFileSync(projectConfigPath, "utf-8");
    const projectConfig = parseJsonc(content, projectConfigPath);
    if (projectConfig) {
      configData = deepMerge(
        configData,
        projectConfig as Record<string, unknown>,
      );
    }
  }

  // If no config exists at either location, try to scaffold
  const userConfigExists = fs.existsSync(userConfigPath);
  const projectConfigExists = fs.existsSync(projectConfigPath);

  if (!userConfigExists && !projectConfigExists) {
    // Detect wizard mode: use wizard unless OLIMPUS_SKIP_WIZARD is set
    const skipWizard =
      process.env.OLIMPUS_SKIP_WIZARD === "1" ||
      process.env.OLIMPUS_SKIP_WIZARD === "true";

    const scaffoldResult = await scaffoldOlimpusConfig({
      projectConfigExists: false,
      userConfigExists: false,
      useWizard: !skipWizard,
    });

    if (scaffoldResult && scaffoldResult.created) {
      // Re-read the scaffolded config
      const content = fs.readFileSync(scaffoldResult.path, "utf-8");
      const scaffoldedConfig = parseJsonc(content, scaffoldResult.path);
      if (scaffoldedConfig) {
        configData = deepMerge(
          configData,
          scaffoldedConfig as Record<string, unknown>,
        );
      }
    }
    // If scaffolding failed or was skipped, configData remains {} (default empty config)
  }

  const result = OlimpusConfigSchema.safeParse(configData);
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

    // Log warnings if any (warnings don't affect validity)
    if (validationResult.warnings.length > 0) {
      const warningMessages = formatWarnings(validationResult).join("\n");
      // Note: In production code, consider using a proper logger
      // For now, warnings are silently ignored to avoid breaking changes
      // but available for callers to check via the returned config if needed
    }
  }

  return result.data;
}

/**
 * Parse JSONC string and return parsed object or throw error.
 */
function parseJsonc(content: string, filePath: string): unknown {
  const errors: Array<{ error: number; offset: number; length: number }> = [];
  const parsed = parse(content, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => {
        const line = content.substring(0, err.offset).split("\n").length;
        return `  Offset ${err.offset} (line ${line}): error code ${err.error}`;
      })
      .join("\n");
    throw new Error(`JSONC parse error in ${filePath}:\n${errorMessages}`);
  }

  return parsed;
}

/**
 * Deep merge two objects. Properties from source override target.
 * Arrays are replaced entirely (not merged).
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = result[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Check if value is a plain object (not array, null, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
