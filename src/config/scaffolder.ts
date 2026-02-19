import * as fs from "fs";
import * as path from "path";
import { OlimpusConfigSchema } from "./schema.js";
import { runWizard, type WizardResult } from "./wizard.js";

/**
 * Options for scaffolding the Olimpus config
 */
export interface ScaffoldOptions {
  projectConfigExists: boolean;
  userConfigExists?: boolean;
  /**
   * Whether to use interactive wizard instead of silent creation
   */
  useWizard?: boolean;
  /**
   * Wizard options (only used when useWizard is true)
   */
  wizardOptions?: {
    configPath?: string;
    autoConfirm?: boolean;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
  };
}

/**
 * Result of scaffolding operation
 */
export interface ScaffoldResult {
  path: string;
  created: boolean;
}

/**
 * Minimal default config template
 */
const DEFAULT_CONFIG = {
  $schema:
    "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
  meta_agents: {},
  settings: {
    namespace_prefix: "olimpus",
    max_delegation_depth: 3,
  },
};

/**
 * Format config as JSONC (JSON with 2-space indent)
 */
function formatJsonc(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Scaffold Olimpus config at ~/.config/opencode/olimpus.jsonc
 *
 * When useWizard is true: runs interactive wizard to collect user preferences
 * When useWizard is false (default): silently creates minimal default config
 *
 * Logic:
 * 1. If projectConfigExists, skip (return null)
 * 2. If useWizard is true, run interactive wizard and return result
 * 3. Get HOME env var; if undefined, skip (return null)
 * 4. Construct target path: {HOME}/.config/opencode/olimpus.jsonc
 * 5. If file already exists OR userConfigExists, skip (return { path, created: false })
 * 6. Create parent directories recursively; if permission error, skip (return null)
 * 7. Generate minimal JSONC content
 * 8. Validate config before writing
 * 9. Write atomically: {target}.tmp → rename to {target}
 * 10. Log success message with path
 * 11. Return { path, created: true }
 *
 * On any error (except already-exists): log warning, return null
 */
export async function scaffoldOlimpusConfig(
  options: ScaffoldOptions,
): Promise<ScaffoldResult | null> {
  try {
    // Step 1: Skip if project config exists
    if (options.projectConfigExists) {
      return null;
    }

    // Step 2: If wizard mode is enabled, run interactive wizard
    if (options.useWizard) {
      try {
        const wizardResult: WizardResult = await runWizard(
          options.wizardOptions ?? {},
        );
        return {
          path: wizardResult.path,
          created: true,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Olimpus] Wizard failed: ${err.message}`);
        return null;
      }
    }

    // Step 3: Get HOME env var
    const homeDir = process.env.HOME;
    if (!homeDir) {
      console.warn(
        "[Olimpus] HOME environment variable not set, skipping config generation",
      );
      return null;
    }

    // Step 4: Construct target path
    const targetPath = path.join(
      homeDir,
      ".config",
      "opencode",
      "olimpus.jsonc",
    );

    // Step 5: Check if file already exists or user config exists
    if (fs.existsSync(targetPath) || options.userConfigExists) {
      return {
        path: targetPath,
        created: false,
      };
    }

    // Step 6: Create parent directories recursively
    const parentDir = path.dirname(targetPath);
    try {
      fs.mkdirSync(parentDir, { recursive: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.includes("EACCES") || err.message.includes("EROFS")) {
        console.warn(
          `[Olimpus] Permission denied creating directory: ${parentDir}`,
        );
        return null;
      }
      throw error;
    }

    // Step 7: Generate minimal JSONC content
    const content = formatJsonc(DEFAULT_CONFIG);

    // Step 8: Validate config before writing
    const parsed = JSON.parse(content);
    const validation = OlimpusConfigSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn("[Olimpus] Generated config failed validation");
      return null;
    }

    // Step 9: Write atomically (tmp file + rename)
    const tempPath = `${targetPath}.tmp`;
    try {
      fs.writeFileSync(tempPath, content, "utf-8");
      fs.renameSync(tempPath, targetPath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }

      const err = error instanceof Error ? error : new Error(String(error));
      if (
        err.message.includes("EACCES") ||
        err.message.includes("EROFS") ||
        err.message.includes("ENOSPC")
      ) {
        console.warn(`[Olimpus] Failed to write config: ${err.message}`);
        return null;
      }
      throw error;
    }

    // Step 10: Log success message
    console.log(`[Olimpus] Generated default config at ${targetPath}`);

    return {
      path: targetPath,
      created: true,
    };
  } catch (error) {
    console.warn(
      `[Olimpus] Scaffolding failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}
