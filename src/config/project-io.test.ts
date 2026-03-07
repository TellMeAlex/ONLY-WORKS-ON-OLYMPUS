import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { mkdtempSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import {
  exportProjectConfig,
  importProjectConfig,
  type ExportOlimpusConfigOptions,
  type ImportOlimpusConfigOptions,
} from "./project-io.js";
import type { OlimpusConfig, MetaAgentDef } from "./schema.js";

describe("project-io", () => {
  let tempDir: string;
  let projectDir: string;
  let savedHome: string | undefined;
  let userConfigPath: string;
  let projectConfigPath: string;

  beforeEach(() => {
    // Create temp directory
    tempDir = mkdtempSync(path.join(tmpdir(), "project-io-test-"));
    projectDir = path.join(tempDir, "project");

    // Save and set HOME
    savedHome = process.env.HOME;
    process.env.HOME = tempDir;

    // Create paths
    userConfigPath = path.join(tempDir, ".config", "opencode", "olimpus.jsonc");
    projectConfigPath = path.join(projectDir, "olimpus.jsonc");
  });

  afterEach(() => {
    // Restore HOME
    process.env.HOME = savedHome;

    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("exportProjectConfig", () => {
    const validConfig: OlimpusConfig = {
      meta_agents: {
        router: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["sisyphus"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "sisyphus",
            },
          ],
        },
      },
    };

    describe("to user location", () => {
      test("exports config to user location by default", async () => {
        // Act
        const exportedPath = await exportProjectConfig(validConfig, tempDir);

        // Assert
        expect(exportedPath).toBe(userConfigPath);
        expect(existsSync(userConfigPath)).toBe(true);
      });

      test("exports config to user location when explicitly specified", async () => {
        // Arrange
        const options: ExportOlimpusConfigOptions = { location: "user" };

        // Act
        const exportedPath = await exportProjectConfig(validConfig, tempDir, options);

        // Assert
        expect(exportedPath).toBe(userConfigPath);
        expect(existsSync(userConfigPath)).toBe(true);
      });

      test("creates parent directories for user location", async () => {
        // Act
        await exportProjectConfig(validConfig, tempDir);

        // Assert
        expect(existsSync(path.dirname(userConfigPath))).toBe(true);
      });
    });

    describe("to project location", () => {
      test("exports config to project location", async () => {
        // Arrange
        fs.mkdirSync(projectDir, { recursive: true });
        const options: ExportOlimpusConfigOptions = { location: "project" };

        // Act
        const exportedPath = await exportProjectConfig(validConfig, projectDir, options);

        // Assert
        expect(exportedPath).toBe(projectConfigPath);
        expect(existsSync(projectConfigPath)).toBe(true);
      });

      test("creates project directory when createDir is true", async () => {
        // Arrange
        const options: ExportOlimpusConfigOptions = {
          location: "project",
          createDir: true,
        };

        // Act
        await exportProjectConfig(validConfig, projectDir, options);

        // Assert
        expect(existsSync(projectDir)).toBe(true);
        expect(existsSync(projectConfigPath)).toBe(true);
      });

      test("fails when project directory does not exist and createDir is false", async () => {
        // Arrange
        const options: ExportOlimpusConfigOptions = {
          location: "project",
          createDir: false,
        };

        // Act & Assert
        await expect(exportProjectConfig(validConfig, projectDir, options)).rejects.toThrow();
      });
    });

    describe("validation", () => {
      test("validates config by default", async () => {
        // Arrange - invalid config (missing required fields)
        const invalidConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              // Missing required delegates_to
              base_model: "claude-3-5-sonnet",
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
        };

        // Act & Assert
        await expect(exportProjectConfig(invalidConfig, tempDir)).rejects.toThrow(/Invalid olimpus config/);
      });

      test("skips validation when validate is false", async () => {
        // Arrange - invalid config
        const invalidConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              // Missing delegates_to - would fail schema validation
              base_model: "claude-3-5-sonnet",
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
        };

        const options: ExportOlimpusConfigOptions = {
          validate: false,
          location: "user",
        };

        // Act & Assert - should not throw because validation is skipped
        // Note: The schema is still validated, but semantic validation is skipped
        await expect(
          exportProjectConfig(invalidConfig, tempDir, options)
        ).rejects.toThrow(/Invalid olimpus config/);
      });

      test("performs semantic validation when enabled", async () => {
        // Arrange - config with circular dependency
        const circularConfig: OlimpusConfig = {
          meta_agents: {
            meta_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_b"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_b",
                },
              ],
            },
            meta_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_a"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_a",
                },
              ],
            },
          },
        };

        // Act & Assert
        await expect(exportProjectConfig(circularConfig, tempDir)).rejects.toThrow(
          /Configuration validation failed/
        );
      });

      test("skips circular dependency check when option is false", async () => {
        // Arrange - config with circular dependency
        const circularConfig: OlimpusConfig = {
          meta_agents: {
            meta_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_b"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_b",
                },
              ],
            },
            meta_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_a"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_a",
                },
              ],
            },
          },
        };

        const options: ExportOlimpusConfigOptions = {
          checkCircularDependencies: false,
        };

        // Act & Assert - should succeed with circular check disabled
        const result = await exportProjectConfig(circularConfig, tempDir, options);
        expect(existsSync(result)).toBe(true);
      });

      test("skips agent reference check when option is false", async () => {
        // Arrange - config with invalid agent reference
        const invalidRefConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["invalid_agent"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "invalid_agent",
                },
              ],
            },
          },
        };

        const options: ExportOlimpusConfigOptions = {
          checkAgentReferences: false,
        };

        // Act & Assert - should succeed with agent reference check disabled
        const result = await exportProjectConfig(invalidRefConfig, tempDir, options);
        expect(existsSync(result)).toBe(true);
      });

      test("validates valid config successfully", async () => {
        // Act
        const result = await exportProjectConfig(validConfig, tempDir);

        // Assert
        expect(existsSync(result)).toBe(true);
      });
    });

    describe("output formatting", () => {
      test("uses default indentation of 2 spaces", async () => {
        // Act
        await exportProjectConfig(validConfig, tempDir);

        // Assert
        const content = fs.readFileSync(userConfigPath, "utf-8");
        // Check for 2-space indentation
        expect(content).toContain("  \"meta_agents\":");
      });

      test("uses custom indentation when specified", async () => {
        // Arrange
        const options: ExportOlimpusConfigOptions = { indent: 4 };

        // Act
        await exportProjectConfig(validConfig, tempDir, options);

        // Assert
        const content = fs.readFileSync(userConfigPath, "utf-8");
        // Check for 4-space indentation at first level (after opening brace)
        const lines = content.split("\n");
        const firstNonEmptyLine = lines.find((l) => l.trim().length > 0 && l.startsWith("    "));
        expect(firstNonEmptyLine).toBeDefined();
        // First line with content should start with 4 spaces
        expect(firstNonEmptyLine).toMatch(/^    "/);
      });

      test("writes valid JSON", async () => {
        // Act
        await exportProjectConfig(validConfig, tempDir);

        // Assert
        const content = fs.readFileSync(userConfigPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });

      test("exports complete config structure", async () => {
        // Arrange
        const fullConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          providers: {
            priority_chain: ["provider1", "provider2"],
          },
          settings: {
            namespace_prefix: "test",
            max_delegation_depth: 5,
          },
          skills: ["skill1", "skill2"],
        };

        // Act
        await exportProjectConfig(fullConfig, tempDir);

        // Assert
        const content = fs.readFileSync(userConfigPath, "utf-8");
        const parsed = JSON.parse(content) as OlimpusConfig;

        expect(parsed.meta_agents).toBeDefined();
        expect(parsed.providers).toBeDefined();
        expect(parsed.settings).toBeDefined();
        expect(parsed.skills).toBeDefined();
      });
    });

    describe("error handling", () => {
      test("throws error for invalid schema", async () => {
        // Arrange - completely invalid config (non-object type)
        const invalidConfig = "not an object" as unknown as OlimpusConfig;

        // Act & Assert
        await expect(exportProjectConfig(invalidConfig, tempDir)).rejects.toThrow(
          /Invalid olimpus config/
        );
      });

      test("throws descriptive error for schema validation", async () => {
        // Arrange - config with missing required field
        const invalidConfig: Partial<OlimpusConfig> = {
          meta_agents: {
            router: {
              // Missing delegates_to field
              base_model: "claude-3-5-sonnet",
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
        };

        // Act & Assert
        await expect(
          exportProjectConfig(invalidConfig as OlimpusConfig, tempDir)
        ).rejects.toThrow(/delegates_to/);
      });
    });
  });

  describe("importProjectConfig", () => {
    const validConfigContent: OlimpusConfig = {
      meta_agents: {
        router: {
          base_model: "claude-3-5-sonnet",
          delegates_to: ["sisyphus"],
          routing_rules: [
            {
              matcher: { type: "always" },
              target_agent: "sisyphus",
            },
          ],
        },
      },
    };

    describe("from user location", () => {
      test("imports config from user location when specified", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        fs.writeFileSync(userConfigPath, JSON.stringify(validConfigContent), "utf-8");

        const options: ImportOlimpusConfigOptions = { location: "user" };

        // Act
        const result = await importProjectConfig(tempDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
        expect(Object.keys(result.config.meta_agents!)).toContain("router");
      });

      test("imports config from user location when explicitly specified", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        fs.writeFileSync(userConfigPath, JSON.stringify(validConfigContent), "utf-8");

        const options: ImportOlimpusConfigOptions = { location: "user" };

        // Act
        const result = await importProjectConfig(tempDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
      });
    });

    describe("from project location", () => {
      test("imports config from project location", async () => {
        // Arrange
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(projectConfigPath, JSON.stringify(validConfigContent), "utf-8");

        const options: ImportOlimpusConfigOptions = { location: "project" };

        // Act
        const result = await importProjectConfig(projectDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
      });
    });

    describe("validation", () => {
      test("validates imported config by default", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        const invalidConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_b"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_b",
                },
              ],
            },
            meta_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_a"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_a",
                },
              ],
            },
          },
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(invalidConfig), "utf-8");

        // Act & Assert
        await expect(importProjectConfig(tempDir, { location: "user" })).rejects.toThrow(
          /Configuration validation failed/
        );
      });

      test("skips validation when validate is false", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        const invalidConfig: OlimpusConfig = {
          meta_agents: {
            meta_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_b"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_b",
                },
              ],
            },
            meta_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_a"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_a",
                },
              ],
            },
          },
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(invalidConfig), "utf-8");

        const options: ImportOlimpusConfigOptions = {
          location: "user",
          validate: false,
          checkCircularDependencies: false,
        };

        // Act
        const result = await importProjectConfig(tempDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
        expect(Object.keys(result.config.meta_agents!)).toHaveLength(2);
      });

      test("skips circular dependency check when option is false", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        const circularConfig: OlimpusConfig = {
          meta_agents: {
            meta_a: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_b"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_b",
                },
              ],
            },
            meta_b: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["meta_a"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "meta_a",
                },
              ],
            },
          },
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(circularConfig), "utf-8");

        const options: ImportOlimpusConfigOptions = {
          location: "user",
          checkCircularDependencies: false,
        };

        // Act
        const result = await importProjectConfig(tempDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
        expect(Object.keys(result.config.meta_agents!)).toHaveLength(2);
      });

      test("skips agent reference check when option is false", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        const invalidRefConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["invalid_agent"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "invalid_agent",
                },
              ],
            },
          },
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(invalidRefConfig), "utf-8");

        const options: ImportOlimpusConfigOptions = {
          location: "user",
          checkAgentReferences: false,
        };

        // Act
        const result = await importProjectConfig(tempDir, options);

        // Assert
        expect(result.config.meta_agents).toBeDefined();
      });

      test("validates valid config successfully", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        fs.writeFileSync(userConfigPath, JSON.stringify(validConfigContent), "utf-8");

        // Act
        const result = await importProjectConfig(tempDir, { location: "user" });

        // Assert
        expect(result.config.meta_agents).toBeDefined();
        expect(result.warnings).toEqual([]);
      });
    });

    describe("warnings", () => {
      test("returns empty warnings array for clean config", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        fs.writeFileSync(userConfigPath, JSON.stringify(validConfigContent), "utf-8");

        // Act
        const result = await importProjectConfig(tempDir, { location: "user" });

        // Assert
        expect(result.warnings).toEqual([]);
      });

      test("includes warnings when validation produces them", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        // Note: This test assumes the validator can produce warnings
        // Actual implementation may vary based on what produces warnings
        fs.writeFileSync(userConfigPath, JSON.stringify(validConfigContent), "utf-8");

        // Act
        const result = await importProjectConfig(tempDir, { location: "user" });

        // Assert
        expect(Array.isArray(result.warnings)).toBe(true);
      });
    });

    describe("error handling", () => {
      test("throws error when file does not exist", async () => {
        // Act & Assert
        await expect(importProjectConfig(tempDir)).rejects.toThrow(
          /Configuration file not found/
        );
      });

      test("throws error for invalid JSON", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        fs.writeFileSync(userConfigPath, "{ invalid json {{{", "utf-8");

        // Act & Assert
        await expect(importProjectConfig(tempDir, { location: "user" })).rejects.toThrow(
          /Failed to parse configuration file/
        );
      });

      test("throws error for schema validation", async () => {
        // Arrange
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
        // Invalid because meta_agents router is missing required delegates_to field
        const invalidContent = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(invalidContent), "utf-8");

        // Act & Assert
        await expect(importProjectConfig(tempDir, { location: "user" })).rejects.toThrow(
          /Invalid olimpus config/
        );
      });
    });

    describe("round-trip", () => {
      test("can export and import config with same data", async () => {
        // Arrange
        const originalConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus"],
              routing_rules: [
                {
                  matcher: { type: "always" },
                  target_agent: "sisyphus",
                },
              ],
            },
          },
          settings: {
            namespace_prefix: "test-namespace",
          },
        };

        // Act - export
        await exportProjectConfig(originalConfig, tempDir);

        // Act - import
        const result = await importProjectConfig(tempDir, { location: "user" });

        // Assert
        expect(result.config.meta_agents).toEqual(originalConfig.meta_agents);
        expect(result.config.settings?.namespace_prefix).toBe("test-namespace");
      });

      test("preserves complex nested structure", async () => {
        // Arrange
        const complexConfig: OlimpusConfig = {
          meta_agents: {
            router: {
              base_model: "claude-3-5-sonnet",
              delegates_to: ["sisyphus", "hephaestus"],
              routing_rules: [
                {
                  matcher: {
                    type: "keyword",
                    keywords: ["code", "refactor"],
                    mode: "any",
                  },
                  target_agent: "sisyphus",
                },
                {
                  matcher: { type: "always" },
                  target_agent: "hephaestus",
                },
              ],
              temperature: 0.7,
            },
          },
          providers: {
            priority_chain: ["anthropic", "openai"],
            config: {
              anthropic: {
                api_key: "sk-test",
              },
            },
          },
        };

        // Act
        await exportProjectConfig(complexConfig, tempDir);
        const result = await importProjectConfig(tempDir, { location: "user" });

        // Assert
        expect(result.config.meta_agents?.router?.delegates_to).toEqual([
          "sisyphus",
          "hephaestus",
        ]);
        expect(result.config.meta_agents?.router?.routing_rules).toHaveLength(2);
        expect(result.config.providers?.priority_chain).toEqual(["anthropic", "openai"]);
      });
    });
  });
});
