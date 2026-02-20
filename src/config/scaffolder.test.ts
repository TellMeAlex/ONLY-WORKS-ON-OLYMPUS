import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  chmodSync,
  statSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import { parse as parseJsonc } from "jsonc-parser";
import { OlimpusConfigSchema } from "./schema.js";
import {
  scaffoldOlimpusConfig,
  type ScaffoldOptions,
  type ScaffoldResult,
} from "./scaffolder.js";

describe("scaffoldOlimpusConfig", () => {
  let tempDir: string;
  let originalHome: string | undefined;
  let originalConsoleLog: typeof console.log;
  let logOutput: string[] = [];

  beforeEach(() => {
    // Save original environment
    originalHome = process.env.HOME;
    originalConsoleLog = console.log;

    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), "olimpus-test-"));

    // Override HOME to point to temp directory
    process.env.HOME = tempDir;

    // Capture console.log output
    logOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map((arg) => String(arg)).join(" "));
    };
  });

  afterEach(() => {
    // Restore original environment
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }
    console.log = originalConsoleLog;

    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }

    // Reset log output
    logOutput = [];
  });

  test("generates config when no config exists", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.created).toBe(true);
    expect(result?.path).toContain(".config/opencode/olimpus.jsonc");

    // Verify file was created
    const configPath = join(tempDir, ".config/opencode/olimpus.jsonc");
    expect(existsSync(configPath)).toBe(true);
  });

  test("creates parent directories recursively", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);

    // Assert
    expect(result?.created).toBe(true);

    // Verify directory structure was created
    const configDir = join(tempDir, ".config/opencode");
    expect(existsSync(configDir)).toBe(true);

    // Verify it's a directory, not a file
    const stat = statSync(configDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test("generated config has $schema URL", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content);

    // Assert
    expect(parsed.$schema).toBe(
      "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
    );
  });

  test("generated config passes Zod validation", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content);

    // Assert: validate against schema
    const validation = OlimpusConfigSchema.safeParse(parsed);
    expect(validation.success).toBe(true);

    // If validation failed, show error details
    if (!validation.success) {
      console.error("Validation errors:", validation.error);
    }
  });

  test("does NOT overwrite existing config", async () => {
    // Arrange: Create existing config with custom content
    const configDir = join(tempDir, ".config/opencode");
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, "olimpus.jsonc");
    const customContent = JSON.stringify({
      meta_agents: { custom_agent: { test: true } },
    });
    writeFileSync(configPath, customContent);

    // Act
    const options: ScaffoldOptions = {
      projectConfigExists: false,
      userConfigExists: true,
    };
    const result = await scaffoldOlimpusConfig(options);

    // Assert: Should NOT have created (or should return false)
    expect(result?.created).toBe(false);

    // Verify original content is unchanged
    const actualContent = await Bun.file(configPath).text();
    expect(actualContent).toBe(customContent);
  });

  test("skips generation when project config exists", async () => {
    // Arrange: Create a project config (signals to scaffolder)
    const options: ScaffoldOptions = {
      projectConfigExists: true,
      userConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);

    // Assert: Should skip generation and return null or created=false
    if (result !== null) {
      expect(result.created).toBe(false);
    }
  });

  test("handles permission errors gracefully", async () => {
    // Arrange: Create read-only directory structure
    const configDir = join(tempDir, ".config");
    mkdirSync(configDir, { recursive: true });
    // Make it read-only
    chmodSync(configDir, 0o444);

    // Act & Assert: Should NOT throw, should return null
    let error: unknown = null;
    try {
      const options: ScaffoldOptions = {
        projectConfigExists: false,
      };
      const result = await scaffoldOlimpusConfig(options);

      // Should either return null or created=false
      if (result !== null) {
        expect(result.created).toBe(false);
      }
    } catch (e) {
      error = e;
    }

    // Clean up: restore permissions before cleanup
    chmodSync(configDir, 0o755);

    // Assert: no error was thrown
    expect(error).toBeNull();
  });

  test("handles missing HOME env var", async () => {
    // Arrange: Unset HOME
    const savedHome = process.env.HOME;
    delete process.env.HOME;

    // Act & Assert: Should NOT throw
    let error: unknown = null;
    let result: ScaffoldResult | null = null;
    try {
      const options: ScaffoldOptions = {
        projectConfigExists: false,
      };
      result = await scaffoldOlimpusConfig(options);
    } catch (e) {
      error = e;
    }

    // Restore HOME
    process.env.HOME = savedHome;

    // Assert: should handle gracefully
    expect(error).toBeNull();
    // Should either return null or created=false
    if (result !== null) {
      expect(result.created).toBe(false);
    }
  });

  test("logs message on successful generation", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Reset log output
    logOutput = [];

    // Act
    const result = await scaffoldOlimpusConfig(options);

    // Assert
    if (result?.created) {
      // Should have logged something about path
      expect(logOutput.length).toBeGreaterThan(0);
      const hasPathLog = logOutput.some((log) => log.includes(result.path));
      expect(hasPathLog).toBe(true);
    }
  });

  test("generated config is valid JSONC", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();

    // Assert: Parse with jsonc-parser should not error
    let parseError: unknown = null;
    let parsed: unknown = null;
    try {
      parsed = parseJsonc(content);
    } catch (e) {
      parseError = e;
    }

    expect(parseError).toBeNull();
    expect(parsed).not.toBeNull();
    expect(typeof parsed).toBe("object");
  });

  test("generated config has required settings defaults", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content) as Record<string, unknown>;

    // Assert: settings should have defaults
    expect(parsed.settings).toBeDefined();
    const settings = parsed.settings as Record<string, unknown>;
    expect(settings.namespace_prefix).toBe("olimpus");
    expect(settings.max_delegation_depth).toBe(3);
  });

  test("generated config has empty meta_agents by default", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content) as Record<string, unknown>;

    // Assert: meta_agents should be defined (object or empty)
    expect(parsed.meta_agents).toBeDefined();
    expect(typeof parsed.meta_agents).toBe("object");
  });

  test("returns correct path format in result", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result).not.toBeNull();

    // Assert: path should be absolute and end with .jsonc
    expect(result!.path).toMatch(/\.jsonc$/);
    expect(result!.path).toMatch(/^[\\/]/); // Absolute path on Unix starts with /

    // Verify path actually exists
    expect(existsSync(result!.path)).toBe(true);
  });

  test("can be called multiple times without error", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act: Call twice
    const result1 = await scaffoldOlimpusConfig(options);
    const result2 = await scaffoldOlimpusConfig(options);

    // Assert: First call should create, second should not
    expect(result1?.created).toBe(true);
    expect(result2?.created).toBe(false); // Or null
  });

  test("generated config structure matches expected template", async () => {
    // Arrange
    const options: ScaffoldOptions = {
      projectConfigExists: false,
    };

    // Act
    const result = await scaffoldOlimpusConfig(options);
    expect(result?.created).toBe(true);

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content) as Record<string, unknown>;

    // Assert: top-level keys should exist
    expect(parsed.$schema).toBeDefined();
    expect(parsed.meta_agents).toBeDefined();
    expect(parsed.settings).toBeDefined();

    // Settings should have required properties
    const settings = parsed.settings as Record<string, unknown>;
    expect(settings.namespace_prefix).toBeDefined();
    expect(settings.max_delegation_depth).toBeDefined();
  });
});
