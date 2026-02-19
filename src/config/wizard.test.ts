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
  runWizardNonInteractive,
  type WizardOptions,
  type WizardResult,
  type WizardAnswers,
} from "./wizard.js";

describe("runWizardNonInteractive", () => {
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

  test("generates config with default answers", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.config).toBeDefined();
    expect(result?.path).toContain(".config/opencode/olimpus.jsonc");

    // Verify file was created
    const configPath = join(tempDir, ".config/opencode/olimpus.jsonc");
    expect(existsSync(configPath)).toBe(true);
  });

  test("creates parent directories recursively", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.path).toContain(".config/opencode/olimpus.jsonc");

    // Verify directory structure was created
    const configDir = join(tempDir, ".config/opencode");
    expect(existsSync(configDir)).toBe(true);

    // Verify it's a directory, not a file
    const stat = statSync(configDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test("generated config has $schema URL", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);
    expect(result).not.toBeNull();

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
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);
    expect(result).not.toBeNull();

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

  test("uses custom configPath when provided", async () => {
    // Arrange
    const customPath = join(tempDir, "custom", "config.jsonc");
    const options: WizardOptions = {
      configPath: customPath,
    };

    // Act
    const result = await runWizardNonInteractive({}, options);

    // Assert
    expect(result?.path).toBe(customPath);
    expect(existsSync(customPath)).toBe(true);
  });

  test("respects custom project_type answer", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "cli",
      settings: [], // Explicitly disable defaults
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.answers.project_type).toBe("cli");
    // CLI project type doesn't enable background_parallelization by default
    expect(result?.config.settings?.background_parallelization?.enabled).toBeUndefined();
  });

  test("respects custom meta_agents answer", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      meta_agents: ["atenea", "hefesto"],
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.answers.meta_agents).toEqual(["atenea", "hefesto"]);
    expect(result?.config.meta_agents).toBeDefined();
    expect(result?.config.meta_agents?.atenea).toBeDefined();
    expect(result?.config.meta_agents?.hefesto).toBeDefined();
    // hermes should not be in the config
    expect(result?.config.meta_agents?.hermes).toBeUndefined();
  });

  test("respects custom models answer", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      primary_model: "gpt-5.2",
      research_model: "claude-haiku-4-5",
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.answers.primary_model).toBe("gpt-5.2");
    expect(result?.answers.research_model).toBe("claude-haiku-4-5");
    expect(result?.config.providers?.priority_chain).toContain("openai/gpt-5.2");
    expect(result?.config.providers?.research_providers).toContain(
      "anthropic/claude-haiku-4-5",
    );
  });

  test("respects custom settings answer", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "cli", // Use a type with different defaults
      settings: ["ultrawork_enabled", "todo_continuation"],
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.config.settings?.ultrawork_enabled).toBe(true);
    expect(result?.config.settings?.todo_continuation).toBe(true);
    // adaptive_model_selection is enabled by default in project template
    expect(result?.config.settings?.adaptive_model_selection?.enabled).toBe(true);
  });

  test("respects custom skills_path answer", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      skills_path: "/custom/path/to/skills",
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.answers.skills_path).toBe("/custom/path/to/skills");
    expect(result?.config.skills).toEqual(["/custom/path/to/skills"]);
  });

  test("handles missing HOME env var", async () => {
    // Arrange: Unset HOME but provide custom path
    const savedHome = process.env.HOME;
    delete process.env.HOME;

    const customPath = join(tempDir, "fallback", "config.jsonc");
    const options: WizardOptions = {
      configPath: customPath,
    };

    // Act & Assert: Should NOT throw when custom path is provided
    let error: unknown = null;
    let result: WizardResult | null = null;
    try {
      result = await runWizardNonInteractive({}, options);
    } catch (e) {
      error = e;
    }

    // Restore HOME
    process.env.HOME = savedHome;

    // Assert: should handle gracefully
    expect(error).toBeNull();
    expect(result).not.toBeNull();
  });

  test("throws error when HOME is missing and no custom path", async () => {
    // Arrange: Unset HOME without custom path
    const savedHome = process.env.HOME;
    delete process.env.HOME;

    // Act & Assert: Should throw
    let error: unknown = null;
    try {
      await runWizardNonInteractive({});
    } catch (e) {
      error = e;
    }

    // Restore HOME
    process.env.HOME = savedHome;

    // Assert: should throw error
    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("HOME environment variable not set");
  });

  test("handles permission errors gracefully", async () => {
    // Arrange: Create read-only directory structure
    const readOnlyDir = join(tempDir, "readonly");
    mkdirSync(readOnlyDir, { recursive: true });
    // Make it read-only
    chmodSync(readOnlyDir, 0o444);

    const customPath = join(readOnlyDir, "config.jsonc");
    const options: WizardOptions = {
      configPath: customPath,
    };

    // Act & Assert: Should throw error
    let error: unknown = null;
    try {
      await runWizardNonInteractive({}, options);
    } catch (e) {
      error = e;
    }

    // Clean up: restore permissions before cleanup
    chmodSync(readOnlyDir, 0o755);

    // Assert: error was thrown (expected behavior for permission errors)
    expect(error).not.toBeNull();
  });

  test("generated config is valid JSONC", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);
    expect(result).not.toBeNull();

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

  test("generated config has required top-level properties", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);
    expect(result).not.toBeNull();

    // Read and parse generated config
    const configPath = result!.path;
    const content = await Bun.file(configPath).text();
    const parsed = parseJsonc(content) as Record<string, unknown>;

    // Assert: top-level keys should exist
    expect(parsed.$schema).toBeDefined();
    expect(parsed.providers).toBeDefined();
    expect(parsed.settings).toBeDefined();
    expect(parsed.agents).toBeDefined();
    expect(parsed.categories).toBeDefined();
  });

  test("generated config has correct settings structure", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      settings: ["background_parallelization", "adaptive_model_selection"],
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: settings should be enabled
    expect(config.settings?.background_parallelization?.enabled).toBe(true);
    expect(config.settings?.adaptive_model_selection?.enabled).toBe(true);

    // Verify adaptive model selection has models configured
    expect(config.settings?.adaptive_model_selection?.strategy_model).toBeDefined();
    expect(config.settings?.adaptive_model_selection?.research_model).toBeDefined();
  });

  test("web project type has expected defaults", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "web",
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: web project should have specific categories
    expect(config.categories?.frontend).toBeDefined();
    expect(config.categories?.ui_components).toBeDefined();
    expect(config.categories?.styling).toBeDefined();
    expect(config.categories?.testing).toBeDefined();

    // Assert: web project should have these settings enabled
    expect(config.settings?.background_parallelization?.enabled).toBe(true);
    expect(config.settings?.adaptive_model_selection?.enabled).toBe(true);
    expect(config.settings?.lsp_refactoring_preferred).toBe(true);
  });

  test("backend project type has expected defaults", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "backend",
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: backend project should have specific categories
    expect(config.categories?.backend).toBeDefined();
    expect(config.categories?.database).toBeDefined();
    expect(config.categories?.api).toBeDefined();
    expect(config.categories?.testing).toBeDefined();

    // Should NOT have frontend categories
    expect(config.categories?.ui_components).toBeUndefined();
  });

  test("cli project type has expected defaults", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "cli",
      settings: [], // Disable default settings to test template defaults
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: cli project should have specific categories
    expect(config.categories?.core).toBeDefined();
    expect(config.categories?.ui).toBeDefined();
    expect(config.categories?.testing).toBeDefined();
    expect(config.categories?.documentation).toBeDefined();

    // Assert: background_parallelization is not enabled for CLI (template default)
    expect(config.settings?.background_parallelization?.enabled).toBeUndefined();
  });

  test("fullstack project type has both frontend and backend categories", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "fullstack",
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: should have both frontend and backend categories
    expect(config.categories?.frontend).toBeDefined();
    expect(config.categories?.backend).toBeDefined();
    expect(config.categories?.database).toBeDefined();
    expect(config.categories?.api).toBeDefined();
    expect(config.categories?.testing).toBeDefined();
    expect(config.categories?.deployment).toBeDefined();
  });

  test("generated config has agents with correct models", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      primary_model: "claude-3-5-sonnet-20241022",
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: agents should use the primary model
    if (config.agents?.sisyphus) {
      expect(config.agents.sisyphus.model).toBe("claude-3-5-sonnet-20241022");
    }
    if (config.agents?.oracle) {
      expect(config.agents.oracle.model).toBe("claude-3-5-sonnet-20241022");
    }
  });

  test("generated config has providers with correct priority chain", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      primary_model: "claude-3-5-sonnet-20241022",
      research_model: "claude-haiku-4-5",
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: providers should have correct priority chain
    expect(config.providers?.priority_chain).toContain(
      "anthropic/claude-3-5-sonnet-20241022",
    );
    expect(config.providers?.priority_chain).toContain("anthropic/claude-haiku-4-5");

    // Research providers should include research model
    expect(config.providers?.research_providers).toContain(
      "anthropic/claude-haiku-4-5",
    );
  });

  test("returns correct answers in result", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "cli",
      language: "python",
      primary_model: "claude-3-5-sonnet-20241022",
      research_model: "claude-haiku-4-5",
      meta_agents: ["atenea", "hefesto"],
      settings: ["ultrawork_enabled"],
      skills_path: "/path/to/skills",
    };

    // Act
    const result = await runWizardNonInteractive(answers);

    // Assert
    expect(result?.answers.project_type).toBe("cli");
    expect(result?.answers.language).toBe("python");
    expect(result?.answers.primary_model).toBe("claude-3-5-sonnet-20241022");
    expect(result?.answers.research_model).toBe("claude-haiku-4-5");
    expect(result?.answers.meta_agents).toEqual(["atenea", "hefesto"]);
    expect(result?.answers.settings).toEqual(["ultrawork_enabled"]);
    expect(result?.answers.skills_path).toBe("/path/to/skills");
  });

  test("can be called multiple times", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act: Call twice
    const result1 = await runWizardNonInteractive({}, options);
    const result2 = await runWizardNonInteractive({}, options);

    // Assert: Both calls should succeed
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();

    // Both should have valid configs
    const content1 = await Bun.file(result1!.path).text();
    const content2 = await Bun.file(result2!.path).text();
    expect(content1.length).toBeGreaterThan(0);
    expect(content2.length).toBeGreaterThan(0);
  });

  test("disabled_hooks is empty array by default", async () => {
    // Arrange
    const options: WizardOptions = {};

    // Act
    const result = await runWizardNonInteractive({}, options);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: disabled_hooks should be an empty array
    expect(config.disabled_hooks).toEqual([]);
  });

  test("project type 'other' uses sensible defaults", async () => {
    // Arrange
    const answers: Partial<WizardAnswers> = {
      project_type: "other",
      meta_agents: ["atenea", "hermes", "hefesto"],
    };

    // Act
    const result = await runWizardNonInteractive(answers);
    expect(result).not.toBeNull();

    const config = result!.config;

    // Assert: should have general categories
    expect(config.categories?.general).toBeDefined();
    expect(config.categories?.documentation).toBeDefined();

    // Should have default meta-agents in the config
    expect(result?.answers.meta_agents).toBeInstanceOf(Array);
    expect(result?.config.meta_agents?.atenea).toBeDefined();
    expect(result?.config.meta_agents?.hermes).toBeDefined();
    expect(result?.config.meta_agents?.hefesto).toBeDefined();
  });
});
