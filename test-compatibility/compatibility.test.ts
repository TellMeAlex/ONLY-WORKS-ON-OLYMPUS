/**
 * Backward Compatibility Test Suite for Olimpus v0.3.0
 *
 * This test suite verifies that configurations from version 0.3.0 remain
 * compatible with subsequent versions. These tests serve as a safety net
 * to prevent accidental breaking changes.
 *
 * @since 0.3.0
 * @stable
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for compatibility guarantees
 */

import { test, expect, describe, beforeEach } from "bun:test";
import {
  fixture_v0_3_0,
  fixture_v0_3_0_minimal,
  fixture_v0_3_0_all_matchers,
  fixture_v0_3_0_config_overrides,
} from "./fixture-v0.3.0.js";
import { OlimpusConfigSchema } from "../src/config/schema.js";
import {
  checkConfigCompatibility,
  clearCompatibilityRegistry,
  type CompatibilityCheckResult,
} from "../src/utils/compatibility.js";
import type { OlimpusConfig } from "../src/config/schema.js";

describe("v0.3.0 Backward Compatibility", () => {
  beforeEach(() => {
    // Clear any registered deprecated/removed fields before each test
    clearCompatibilityRegistry();
  });

  describe("Schema Validation", () => {
    test("v0.3.0 main fixture validates against current schema", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) {
        console.error("Validation errors:", result.error.issues);
      }
    });

    test("v0.3.0 minimal fixture validates against current schema", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_minimal);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) {
        console.error("Validation errors:", result.error.issues);
      }
    });

    test("v0.3.0 all matchers fixture validates against current schema", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) {
        console.error("Validation errors:", result.error.issues);
      }
    });

    test("v0.3.0 config overrides fixture validates against current schema", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(
        fixture_v0_3_0_config_overrides
      );

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) {
        console.error("Validation errors:", result.error.issues);
      }
    });

    test("all meta-agent fields from v0.3.0 are still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify all meta-agents are present
        expect(result.data.meta_agents).toBeDefined();
        expect(Object.keys(result.data.meta_agents || {})).toHaveLength(5);

        // Verify each meta-agent has all expected fields
        const simpleRouter = result.data.meta_agents?.simple_router;
        expect(simpleRouter).toBeDefined();
        expect(simpleRouter?.base_model).toBe("claude-3-5-sonnet-20241022");
        expect(simpleRouter?.delegates_to).toEqual(["sisyphus", "oracle"]);
        expect(simpleRouter?.routing_rules).toHaveLength(1);
      }
    });

    test("all matcher types from v0.3.0 are still supported", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        expect(rules).toBeDefined();
        expect(rules).toHaveLength(11);

        // Verify all matcher types are present
        const matcherTypes = rules?.map((r) => r.matcher.type);
        expect(matcherTypes).toContain("keyword");
        expect(matcherTypes).toContain("complexity");
        expect(matcherTypes).toContain("regex");
        expect(matcherTypes).toContain("project_context");
        expect(matcherTypes).toContain("always");
      }
    });

    test("all config overrides from v0.3.0 are still supported", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(
        fixture_v0_3_0_config_overrides
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.config_override_test?.routing_rules;
        expect(rules).toBeDefined();
        expect(rules).toHaveLength(6);

        // Verify all config override fields are present in at least one rule
        const hasModelOverride = rules?.some((r) => r.config_overrides?.model);
        const hasTempOverride = rules?.some(
          (r) => r.config_overrides?.temperature !== undefined
        );
        const hasPromptOverride = rules?.some((r) => r.config_overrides?.prompt);
        const hasVariantOverride = rules?.some((r) => r.config_overrides?.variant);

        expect(hasModelOverride).toBe(true);
        expect(hasTempOverride).toBe(true);
        expect(hasPromptOverride).toBe(true);
        expect(hasVariantOverride).toBe(true);
      }
    });

    test("agent overrides from v0.3.0 are still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agents).toBeDefined();

        // Verify agent override fields
        const sisyphus = result.data.agents?.sisyphus;
        expect(sisyphus).toBeDefined();
        expect(sisyphus?.model).toBe("claude-3-5-sonnet-20241022");
        expect(sisyphus?.temperature).toBe(0.3);
        expect(sisyphus?.description).toBe("TDD-focused implementation agent");
        expect(sisyphus?.skills).toEqual(["typescript", "testing", "tdd"]);
      }
    });

    test("categories from v0.3.0 are still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toBeDefined();
        expect(Object.keys(result.data.categories || {})).toHaveLength(3);

        // Verify category fields
        const frontend = result.data.categories?.frontend;
        expect(frontend).toBeDefined();
        expect(frontend?.description).toBe("Frontend development tasks");
        expect(frontend?.model).toBe("claude-3-5-sonnet-20241022");
        expect(frontend?.temperature).toBe(0.3);
      }
    });

    test("provider configuration from v0.3.0 is still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providers).toBeDefined();
        expect(result.data.providers?.priority_chain).toBeDefined();
        expect(result.data.providers?.research_providers).toBeDefined();
        expect(result.data.providers?.strategy_providers).toBeDefined();
        expect(result.data.providers?.config).toBeDefined();
      }
    });

    test("settings from v0.3.0 are still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const settings = result.data.settings;
        expect(settings).toBeDefined();
        expect(settings?.namespace_prefix).toBe("olimpus");
        expect(settings?.max_delegation_depth).toBe(3);
        expect(settings?.background_parallelization).toBeDefined();
        expect(settings?.adaptive_model_selection).toBeDefined();
        expect(settings?.analytics).toBeDefined();
        expect(settings?.routing_logger).toBeDefined();
      }
    });

    test("skills array from v0.3.0 is still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skills).toBeDefined();
        expect(result.data.skills).toBeInstanceOf(Array);
        expect(result.data.skills).toHaveLength(2);
        expect(result.data.skills).toContain("docs/skills/custom-skill.md");
      }
    });

    test("disabled_hooks from v0.3.0 is still accepted", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.disabled_hooks).toBeDefined();
        expect(result.data.disabled_hooks).toBeInstanceOf(Array);
        expect(result.data.disabled_hooks).toHaveLength(0);
      }
    });
  });

  describe("Compatibility Checking", () => {
    test("v0.3.0 fixture passes compatibility check", () => {
      // Act
      const result = checkConfigCompatibility(fixture_v0_3_0, "0.3.0");

      // Assert
      expect(result.compatible).toBe(true);
      expect(result.targetVersion).toBe("0.3.0");
      expect(result.issues).toHaveLength(0);
      expect(result.migrations).toHaveLength(0);
      expect(result.autoMigratable).toBe(true);
    });

    test("v0.3.0 minimal fixture passes compatibility check", () => {
      // Act
      const result = checkConfigCompatibility(
        fixture_v0_3_0_minimal,
        "0.3.0"
      );

      // Assert
      expect(result.compatible).toBe(true);
      expect(result.targetVersion).toBe("0.3.0");
      expect(result.issues).toHaveLength(0);
      expect(result.migrations).toHaveLength(0);
      expect(result.autoMigratable).toBe(true);
    });

    test("v0.3.0 all matchers fixture passes compatibility check", () => {
      // Act
      const result = checkConfigCompatibility(
        fixture_v0_3_0_all_matchers,
        "0.3.0"
      );

      // Assert
      expect(result.compatible).toBe(true);
      expect(result.targetVersion).toBe("0.3.0");
      expect(result.issues).toHaveLength(0);
      expect(result.migrations).toHaveLength(0);
      expect(result.autoMigratable).toBe(true);
    });

    test("v0.3.0 config overrides fixture passes compatibility check", () => {
      // Act
      const result = checkConfigCompatibility(
        fixture_v0_3_0_config_overrides,
        "0.3.0"
      );

      // Assert
      expect(result.compatible).toBe(true);
      expect(result.targetVersion).toBe("0.3.0");
      expect(result.issues).toHaveLength(0);
      expect(result.migrations).toHaveLength(0);
      expect(result.autoMigratable).toBe(true);
    });

    test("compatibility check handles optional fields correctly", () => {
      // Act
      const result = checkConfigCompatibility(
        fixture_v0_3_0_minimal,
        "0.3.0"
      );

      // Assert
      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);

      // Verify undefined fields don't cause issues
      const config = fixture_v0_3_0_minimal;
      expect(config.meta_agents).toBeDefined();
      expect(config.agents).toBeUndefined();
      expect(config.categories).toBeUndefined();
      expect(config.providers).toBeUndefined();
      expect(config.settings).toBeUndefined();
      expect(config.skills).toBeUndefined();
      expect(config.disabled_hooks).toBeUndefined();
    });
  });

  describe("Matcher Compatibility", () => {
    test("keyword matcher with 'any' mode is compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const anyModeRule = rules?.find(
          (r) =>
            r.matcher.type === "keyword" && r.matcher.mode === "any"
        );
        expect(anyModeRule).toBeDefined();
      }
    });

    test("keyword matcher with 'all' mode is compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const allModeRule = rules?.find(
          (r) =>
            r.matcher.type === "keyword" && r.matcher.mode === "all"
        );
        expect(allModeRule).toBeDefined();
      }
    });

    test("all complexity thresholds are compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const complexityRules = rules?.filter(
          (r) => r.matcher.type === "complexity"
        );
        const thresholds = complexityRules?.map((r) =>
          r.matcher.type === "complexity" ? r.matcher.threshold : undefined
        );

        expect(thresholds).toContain("low");
        expect(thresholds).toContain("medium");
        expect(thresholds).toContain("high");
      }
    });

    test("regex matcher with and without flags is compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const regexRules = rules?.filter((r) => r.matcher.type === "regex");
        expect(regexRules).toHaveLength(2);

        const withFlags = regexRules?.find((r) =>
          r.matcher.type === "regex" ? r.matcher.flags !== undefined : false
        );
        const withoutFlags = regexRules?.find((r) =>
          r.matcher.type === "regex" ? r.matcher.flags === undefined : false
        );

        expect(withFlags).toBeDefined();
        expect(withoutFlags).toBeDefined();
      }
    });

    test("project context matcher variations are compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const contextRules = rules?.filter(
          (r) => r.matcher.type === "project_context"
        );
        expect(contextRules).toHaveLength(3);

        const withFilesOnly = contextRules?.find(
          (r) =>
            r.matcher.type === "project_context"
              ? r.matcher.has_files !== undefined &&
                r.matcher.has_deps === undefined
              : false
        );
        const withDepsOnly = contextRules?.find(
          (r) =>
            r.matcher.type === "project_context"
              ? r.matcher.has_files === undefined &&
                r.matcher.has_deps !== undefined
              : false
        );
        const withBoth = contextRules?.find(
          (r) =>
            r.matcher.type === "project_context"
              ? r.matcher.has_files !== undefined &&
                r.matcher.has_deps !== undefined
              : false
        );

        expect(withFilesOnly).toBeDefined();
        expect(withDepsOnly).toBeDefined();
        expect(withBoth).toBeDefined();
      }
    });

    test("always matcher is compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0_all_matchers);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const rules = result.data.meta_agents?.matcher_test?.routing_rules;
        const alwaysRule = rules?.find((r) => r.matcher.type === "always");
        expect(alwaysRule).toBeDefined();
      }
    });
  });

  describe("Field Type Compatibility", () => {
    test("number fields accept integer values", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
        },
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("number fields accept decimal values", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
            temperature: 0.5,
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("boolean fields accept true", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
          ultrawork_enabled: true,
        },
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("boolean fields accept false", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
          ultrawork_enabled: false,
        },
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("array fields accept empty arrays", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: undefined,
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: [],
        disabled_hooks: [],
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("string fields accept empty strings", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
            prompt_template: "",
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Structure Compatibility", () => {
    test("deeply nested configurations are compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify deep nesting is preserved
        const analytics = result.data.settings?.analytics;
        expect(analytics).toBeDefined();
        expect(analytics?.storage).toBeDefined();
        expect(analytics?.storage?.type).toBe("file");
        expect(analytics?.metrics).toBeDefined();
        expect(analytics?.aggregation).toBeDefined();
      }
    });

    test("multiple meta-agents with same base_model are compatible", () => {
      // Act
      const config: OlimpusConfig = {
        meta_agents: {
          agent1: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
          agent2: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["oracle"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "oracle" },
            ],
          },
          agent3: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["librarian"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "librarian" },
            ],
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("routing rules with multiple matchers are compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const keywordRouter = result.data.meta_agents?.keyword_router;
        expect(keywordRouter?.routing_rules).toHaveLength(3);
      }
    });

    test("delegates_to arrays with multiple agents are compatible", () => {
      // Act
      const result = OlimpusConfigSchema.safeParse(fixture_v0_3_0);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const keywordRouter = result.data.meta_agents?.keyword_router;
        expect(keywordRouter?.delegates_to).toEqual([
          "librarian",
          "explore",
          "oracle",
        ]);
      }
    });
  });
});
