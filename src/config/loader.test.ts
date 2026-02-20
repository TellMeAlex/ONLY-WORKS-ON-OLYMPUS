import { test, expect, describe, beforeEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { loadOlimpusConfig, type LoadOlimpusConfigOptions } from "./loader.js";
import type { MetaAgentDef, OlimpusConfig } from "./schema.js";

// Mock file system
const tempDir = path.join(process.cwd(), ".test-temp");

describe("loadOlimpusConfig", () => {
  beforeEach(() => {
    // Clean up temp directory before each test
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });

  test("loads config without validation when validate option is false", async () => {
    // Arrange: Create a config with circular dependency
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act: Load config with validation disabled
    const options: LoadOlimpusConfigOptions = { validate: false };
    const config = await loadOlimpusConfig(tempDir, options);

    // Assert: Config loads successfully (circular dependency not checked)
    expect(config.meta_agents).toBeDefined();
    expect(Object.keys(config.meta_agents!)).toHaveLength(2);
  });

  test("throws error when circular dependency detected with validation enabled", async () => {
    // Arrange: Create a config with circular dependency
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act & Assert: Should throw when validation is enabled (default)
    expect(() => loadOlimpusConfig(tempDir)).toThrow(
      /Configuration validation failed/
    );
  });

  test("skips circular dependency check when checkCircularDependencies is false", async () => {
    // Arrange: Create a config with circular dependency
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act: Load config with circular dependency check disabled
    const options: LoadOlimpusConfigOptions = {
      validate: true,
      checkCircularDependencies: false,
    };
    const config = await loadOlimpusConfig(tempDir, options);

    // Assert: Config loads successfully
    expect(config.meta_agents).toBeDefined();
    expect(Object.keys(config.meta_agents!)).toHaveLength(2);
  });

  test("throws error when invalid agent reference detected", async () => {
    // Arrange: Create a config with invalid agent reference
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act & Assert: Should throw error for invalid agent reference
    expect(() => loadOlimpusConfig(tempDir)).toThrow(
      /Invalid agent reference/
    );
  });

  test("skips agent reference check when checkAgentReferences is false", async () => {
    // Arrange: Create a config with invalid agent reference
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act: Load config with agent reference check disabled
    const options: LoadOlimpusConfigOptions = {
      validate: true,
      checkAgentReferences: false,
    };
    const config = await loadOlimpusConfig(tempDir, options);

    // Assert: Config loads successfully
    expect(config.meta_agents).toBeDefined();
  });

  test("loads valid config with validation enabled", async () => {
    // Arrange: Create a valid config
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act: Load config with validation enabled (default)
    const config = await loadOlimpusConfig(tempDir);

    // Assert: Config loads successfully
    expect(config.meta_agents).toBeDefined();
    expect(Object.keys(config.meta_agents!)).toHaveLength(1);
  });

  test("enables all validation checks by default", async () => {
    // Arrange: Create a valid config
    const configPath = path.join(tempDir, "olimpus.jsonc");
    const metaAgents: Record<string, MetaAgentDef> = {
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
    };
    const configContent = JSON.stringify({ meta_agents: metaAgents });
    fs.writeFileSync(configPath, configContent, "utf-8");

    // Act: Load config without any options (use defaults)
    const config = await loadOlimpusConfig(tempDir);

    // Assert: Config loads successfully (all checks pass)
    expect(config.meta_agents).toBeDefined();
  });
});
