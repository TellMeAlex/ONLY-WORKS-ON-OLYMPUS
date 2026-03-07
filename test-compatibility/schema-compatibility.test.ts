/**
 * Schema Backward Compatibility Test Suite for Olimpus
 *
 * This test suite verifies that the Zod schema definitions maintain
 * backward compatibility with previous versions. These tests ensure that
 * schema changes do not break existing configurations.
 *
 * @since 0.4.0
 * @stable
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for compatibility guarantees
 */

import { test, expect, describe } from "bun:test";
import {
  OlimpusConfigSchema,
  MetaAgentSchema,
  RoutingRuleSchema,
  MatcherSchema,
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  RegexMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema,
  AgentOverrideSchema,
  CategoryConfigSchema,
  ProviderConfigSchema,
  RoutingLoggerConfigSchema,
  RoutingAnalyticsConfigSchema,
  AnalyticsConfigSchema,
  SettingsSchema,
} from "../src/config/schema.js";
import type {
  OlimpusConfig,
  MetaAgentDef,
  RoutingRule,
  Matcher,
  KeywordMatcher,
  ComplexityMatcher,
  RegexMatcher,
  ProjectContextMatcher,
  AlwaysMatcher,
  AgentOverride,
  CategoryConfig,
  ProviderConfig,
  RoutingLoggerConfig,
  RoutingAnalyticsConfig,
  AnalyticsConfig,
  Settings,
} from "../src/config/schema.js";

describe("Schema Backward Compatibility", () => {
  describe("Matcher Schema Compatibility", () => {
    test("keyword matcher requires all v0.1.0 fields", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["bug", "fix", "debug"],
        mode: "any",
      };

      // Act
      const result = KeywordMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("keyword");
        expect(result.data.keywords).toEqual(["bug", "fix", "debug"]);
        expect(result.data.mode).toBe("any");
      }
    });

    test("keyword matcher accepts 'all' mode from v0.1.0", () => {
      // Arrange
      const matcher: KeywordMatcher = {
        type: "keyword",
        keywords: ["code", "find"],
        mode: "all",
      };

      // Act
      const result = KeywordMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe("all");
      }
    });

    test("complexity matcher accepts all v0.2.0 thresholds", () => {
      // Arrange
      const thresholds: ComplexityMatcher["threshold"][] = ["low", "medium", "high"];

      // Act & Assert
      thresholds.forEach((threshold) => {
        const matcher: ComplexityMatcher = { type: "complexity", threshold };
        const result = ComplexityMatcherSchema.safeParse(matcher);
        expect(result.success).toBe(true);
      });
    });

    test("regex matcher accepts optional flags from v0.3.0", () => {
      // Arrange
      const matcherWithFlags: RegexMatcher = {
        type: "regex",
        pattern: "\\b(bug|fix)\\b",
        flags: "i",
      };
      const matcherWithoutFlags: RegexMatcher = {
        type: "regex",
        pattern: "^(test|spec)",
      };

      // Act
      const resultWith = RegexMatcherSchema.safeParse(matcherWithFlags);
      const resultWithout = RegexMatcherSchema.safeParse(matcherWithoutFlags);

      // Assert
      expect(resultWith.success).toBe(true);
      expect(resultWithout.success).toBe(true);
      if (resultWith.success) {
        expect(resultWith.data.flags).toBe("i");
      }
      if (resultWithout.success) {
        expect(resultWithout.data.flags).toBeUndefined();
      }
    });

    test("project context matcher accepts optional has_files from v0.3.0", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
      };

      // Act
      const result = ProjectContextMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.has_files).toEqual(["package.json"]);
        expect(result.data.has_deps).toBeUndefined();
      }
    });

    test("project context matcher accepts optional has_deps from v0.3.0", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_deps: ["vitest", "jest"],
      };

      // Act
      const result = ProjectContextMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.has_deps).toEqual(["vitest", "jest"]);
        expect(result.data.has_files).toBeUndefined();
      }
    });

    test("project context matcher accepts both fields from v0.3.0", () => {
      // Arrange
      const matcher: ProjectContextMatcher = {
        type: "project_context",
        has_files: ["package.json"],
        has_deps: ["bun:test"],
      };

      // Act
      const result = ProjectContextMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.has_files).toEqual(["package.json"]);
        expect(result.data.has_deps).toEqual(["bun:test"]);
      }
    });

    test("always matcher from v0.1.0 is still valid", () => {
      // Arrange
      const matcher: AlwaysMatcher = { type: "always" };

      // Act
      const result = AlwaysMatcherSchema.safeParse(matcher);

      // Assert
      expect(result.success).toBe(true);
    });

    test("matcher discriminated union includes all v0.3.0 types", () => {
      // Arrange
      const matchers: Matcher[] = [
        { type: "keyword", keywords: ["test"], mode: "any" },
        { type: "complexity", threshold: "medium" },
        { type: "regex", pattern: "^test" },
        { type: "project_context", has_files: ["package.json"] },
        { type: "always" },
      ];

      // Act & Assert
      matchers.forEach((matcher) => {
        const result = MatcherSchema.safeParse(matcher);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Routing Rule Schema Compatibility", () => {
    test("routing rule accepts all v0.1.0 required fields", () => {
      // Arrange
      const rule: RoutingRule = {
        matcher: { type: "always" },
        target_agent: "oracle",
      };

      // Act
      const result = RoutingRuleSchema.safeParse(rule);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target_agent).toBe("oracle");
        expect(result.data.config_overrides).toBeUndefined();
      }
    });

    test("routing rule accepts all config overrides from v0.1.0", () => {
      // Arrange
      const overrides = {
        model: "claude-opus-4-6",
        temperature: 0.5,
        prompt: "Custom prompt",
        variant: "strategy",
      };
      const rule: RoutingRule = {
        matcher: { type: "always" },
        target_agent: "oracle",
        config_overrides: overrides,
      };

      // Act
      const result = RoutingRuleSchema.safeParse(rule);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config_overrides).toEqual(overrides);
      }
    });

    test("routing rule accepts partial config overrides", () => {
      // Arrange
      const rule: RoutingRule = {
        matcher: { type: "always" },
        target_agent: "oracle",
        config_overrides: {
          temperature: 0.3,
        },
      };

      // Act
      const result = RoutingRuleSchema.safeParse(rule);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config_overrides?.temperature).toBe(0.3);
        expect(result.data.config_overrides?.model).toBeUndefined();
      }
    });
  });

  describe("Meta Agent Schema Compatibility", () => {
    test("meta agent accepts all v0.1.0 required fields", () => {
      // Arrange
      const agent: MetaAgentDef = {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: ["sisyphus", "oracle"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "oracle" },
        ],
      };

      // Act
      const result = MetaAgentSchema.safeParse(agent);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.base_model).toBe("claude-3-5-sonnet-20241022");
        expect(result.data.delegates_to).toEqual(["sisyphus", "oracle"]);
        expect(result.data.routing_rules).toHaveLength(1);
        expect(result.data.prompt_template).toBeUndefined();
        expect(result.data.temperature).toBeUndefined();
      }
    });

    test("meta agent accepts optional prompt_template from v0.1.0", () => {
      // Arrange
      const agent: MetaAgentDef = {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: ["sisyphus"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
        prompt_template: "Custom template",
      };

      // Act
      const result = MetaAgentSchema.safeParse(agent);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt_template).toBe("Custom template");
      }
    });

    test("meta agent accepts optional temperature from v0.1.0", () => {
      // Arrange
      const agent: MetaAgentDef = {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: ["sisyphus"],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
        temperature: 0.3,
      };

      // Act
      const result = MetaAgentSchema.safeParse(agent);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.3);
      }
    });

    test("meta agent requires at least one routing rule", () => {
      // Arrange
      const agent = {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: ["sisyphus"],
        routing_rules: [],
      };

      // Act
      const result = MetaAgentSchema.safeParse(agent);

      // Assert
      expect(result.success).toBe(false);
    });

    test("meta agent requires at least one delegate", () => {
      // Arrange
      const agent = {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: [],
        routing_rules: [
          { matcher: { type: "always" }, target_agent: "sisyphus" },
        ],
      };

      // Act
      const result = MetaAgentSchema.safeParse(agent);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("Agent Override Schema Compatibility", () => {
    test("agent override accepts all v0.3.0 fields", () => {
      // Arrange
      const override: AgentOverride = {
        model: "claude-3-5-sonnet-20241022",
        variant: "tdd",
        temperature: 0.3,
        prompt: "You are a TDD expert",
        skills: ["typescript", "testing", "tdd"],
        disable: false,
        description: "TDD-focused implementation agent",
      };

      // Act
      const result = AgentOverrideSchema.safeParse(override);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(override);
      }
    });

    test("agent override accepts partial overrides", () => {
      // Arrange
      const override: AgentOverride = {
        temperature: 0.5,
      };

      // Act
      const result = AgentOverrideSchema.safeParse(override);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Category Config Schema Compatibility", () => {
    test("category config accepts all v0.3.0 fields", () => {
      // Arrange
      const config: CategoryConfig = {
        description: "Frontend development tasks",
        model: "claude-3-5-sonnet-20241022",
        variant: "refactoring",
        temperature: 0.3,
        maxTokens: 4000,
      };

      // Act
      const result = CategoryConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    test("category config accepts partial configuration", () => {
      // Arrange
      const config: CategoryConfig = {
        temperature: 0.4,
      };

      // Act
      const result = CategoryConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Provider Config Schema Compatibility", () => {
    test("provider config accepts all v0.3.0 fields", () => {
      // Arrange
      const config: ProviderConfig = {
        priority_chain: [
          "anthropic/claude-opus-4-6",
          "openai/gpt-5.2",
          "google/gemini-3-pro",
        ],
        research_providers: [
          "anthropic/claude-haiku-4-5",
          "openai/gpt-4-turbo",
        ],
        strategy_providers: [
          "anthropic/claude-opus-4-6",
          "openai/gpt-5.2",
        ],
        config: {
          anthropic: { retry_on_rate_limit: true },
          openai: { retry_on_rate_limit: true },
        },
      };

      // Act
      const result = ProviderConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    test("provider config accepts partial configuration", () => {
      // Arrange
      const config: ProviderConfig = {
        priority_chain: ["anthropic/claude-opus-4-6"],
      };

      // Act
      const result = ProviderConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Routing Analytics Config Schema Compatibility", () => {
    test("routing analytics config uses defaults from v0.3.0", () => {
      // Arrange
      const config = {
        enabled: true,
      };

      // Act
      const result = RoutingAnalyticsConfigSchema.parse(config);

      // Assert
      expect(result.storage_file).toBe("analytics.json");
      expect(result.max_events).toBe(10000);
      expect(result.retention_days).toBe(90);
      expect(result.auto_prune).toBe(true);
    });

    test("routing analytics config accepts all v0.3.0 fields", () => {
      // Arrange
      const config: RoutingAnalyticsConfig = {
        enabled: false,
        storage_file: "custom-analytics.json",
        max_events: 5000,
        retention_days: 60,
        auto_prune: false,
      };

      // Act
      const result = RoutingAnalyticsConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });
  });

  describe("Routing Logger Config Schema Compatibility", () => {
    test("routing logger config accepts all v0.3.0 fields", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: true,
        output: "file",
        log_file: "routing.log",
        debug_mode: false,
        analytics_config: {
          enabled: true,
          storage_file: "analytics.json",
          max_events: 10000,
          retention_days: 90,
          auto_prune: true,
        },
      };

      // Act
      const result = RoutingLoggerConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    test("routing logger config accepts partial configuration", () => {
      // Arrange
      const config: RoutingLoggerConfig = {
        enabled: true,
      };

      // Act
      const result = RoutingLoggerConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Analytics Config Schema Compatibility", () => {
    test("analytics config accepts all v0.4.0 fields", () => {
      // Arrange
      const config: AnalyticsConfig = {
        enabled: true,
        storage: {
          type: "file",
          path: "analytics.json",
          retention_days: 90,
        },
        metrics: {
          track_routing_decisions: true,
          track_execution_time: true,
          track_agent_usage: true,
          track_model_costs: true,
          track_success_rates: true,
        },
        aggregation: {
          enabled: true,
          window_minutes: 60,
          include_percentiles: true,
        },
      };

      // Act
      const result = AnalyticsConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    test("analytics config accepts partial configuration", () => {
      // Arrange
      const config: AnalyticsConfig = {
        enabled: true,
      };

      // Act
      const result = AnalyticsConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Settings Schema Compatibility", () => {
    test("settings schema uses defaults from v0.1.0", () => {
      // Arrange
      const settings = {};

      // Act
      const result = SettingsSchema.parse(settings);

      // Assert
      expect(result.namespace_prefix).toBe("olimpus");
      expect(result.max_delegation_depth).toBe(3);
    });

    test("settings accepts all background_parallelization fields from v0.3.0", () => {
      // Arrange
      const settings = {
        background_parallelization: {
          enabled: true,
          max_parallel_tasks: 4,
          timeout_ms: 30000,
        },
      };

      // Act
      const result = SettingsSchema.safeParse(settings);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.background_parallelization).toEqual(
          settings.background_parallelization
        );
      }
    });

    test("settings accepts all adaptive_model_selection fields from v0.3.0", () => {
      // Arrange
      const settings = {
        adaptive_model_selection: {
          enabled: true,
          research_model: "claude-haiku-4-5",
          strategy_model: "claude-opus-4-6",
          default_model: "claude-3-5-sonnet-20241022",
        },
      };

      // Act
      const result = SettingsSchema.safeParse(settings);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.adaptive_model_selection).toEqual(
          settings.adaptive_model_selection
        );
      }
    });

    test("settings accepts ultrawork and todo flags from v0.3.0", () => {
      // Arrange
      const settings = {
        ultrawork_enabled: true,
        todo_continuation: true,
        verify_before_completion: true,
      };

      // Act
      const result = SettingsSchema.safeParse(settings);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ultrawork_enabled).toBe(true);
        expect(result.data.todo_continuation).toBe(true);
        expect(result.data.verify_before_completion).toBe(true);
      }
    });

    test("settings accepts code quality flags from v0.3.0", () => {
      // Arrange
      const settings = {
        lsp_refactoring_preferred: true,
        aggressive_comment_pruning: true,
      };

      // Act
      const result = SettingsSchema.safeParse(settings);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lsp_refactoring_preferred).toBe(true);
        expect(result.data.aggressive_comment_pruning).toBe(true);
      }
    });
  });

  describe("Olimpus Config Schema Compatibility", () => {
    test("olimpus config accepts all v0.3.0 top-level sections", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {
          default: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
          },
        },
        providers: {
          priority_chain: ["anthropic/claude-opus-4-6"],
        },
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
        },
        agents: {
          sisyphus: {
            model: "claude-3-5-sonnet-20241022",
            temperature: 0.3,
          },
        },
        categories: {
          frontend: {
            description: "Frontend tasks",
            temperature: 0.3,
          },
        },
        skills: ["docs/skills/custom.md"],
        disabled_hooks: [],
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(config);
      }
    });

    test("olimpus config accepts minimal configuration", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: undefined,
        providers: undefined,
        settings: undefined,
        agents: undefined,
        categories: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("olimpus config accepts only meta_agents", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {
          default: {
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
        settings: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Schema Field Type Compatibility", () => {
    test("number fields accept integer values", () => {
      // Arrange
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

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("number fields accept decimal values", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: {
          test: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["sisyphus"],
            routing_rules: [
              { matcher: { type: "always" }, target_agent: "sisyphus" },
            ],
            temperature: 0.7,
          },
        },
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: undefined,
        disabled_hooks: undefined,
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("string fields accept empty strings", () => {
      // Arrange
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

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("array fields accept empty arrays", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: undefined,
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: undefined,
        skills: [],
        disabled_hooks: [],
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("boolean fields accept true", () => {
      // Arrange
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

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });

    test("boolean fields accept false", () => {
      // Arrange
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

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Schema Structure Compatibility", () => {
    test("deeply nested configurations are preserved", () => {
      // Arrange
      const config: OlimpusConfig = {
        meta_agents: undefined,
        agents: undefined,
        categories: undefined,
        providers: undefined,
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
          routing_logger: {
            analytics_config: {
              enabled: true,
              storage_file: "analytics.json",
              max_events: 10000,
              retention_days: 90,
              auto_prune: true,
            },
          },
        },
        skills: undefined,
        disabled_hooks: undefined,
      };

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const analyticsConfig =
          result.data.settings?.routing_logger?.analytics_config;
        expect(analyticsConfig).toBeDefined();
        expect(analyticsConfig?.enabled).toBe(true);
        expect(analyticsConfig?.max_events).toBe(10000);
      }
    });

    test("multiple meta-agents with same structure are valid", () => {
      // Arrange
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

      // Act
      const result = OlimpusConfigSchema.safeParse(config);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.meta_agents || {})).toHaveLength(3);
      }
    });
  });

  describe("Schema Validation Edge Cases", () => {
    test("rejects invalid matcher type", () => {
      // Arrange
      const invalidMatcher = {
        type: "invalid_type" as const,
      };

      // Act
      const result = MatcherSchema.safeParse(invalidMatcher);

      // Assert
      expect(result.success).toBe(false);
    });

    test("rejects keyword matcher with empty keywords array", () => {
      // Arrange
      const invalidMatcher: KeywordMatcher = {
        type: "keyword",
        keywords: [],
        mode: "any",
      };

      // Act
      const result = KeywordMatcherSchema.safeParse(invalidMatcher);

      // Assert
      expect(result.success).toBe(false);
    });

    test("rejects invalid complexity threshold", () => {
      // Arrange
      const invalidMatcher = {
        type: "complexity" as const,
        threshold: "invalid" as const,
      };

      // Act
      const result = ComplexityMatcherSchema.safeParse(invalidMatcher);

      // Assert
      expect(result.success).toBe(false);
    });

    test("rejects invalid routing logger output", () => {
      // Arrange
      const invalidConfig = {
        enabled: true,
        output: "invalid" as const,
      };

      // Act
      const result = RoutingLoggerConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
    });

    test("rejects invalid analytics storage type", () => {
      // Arrange
      const invalidConfig = {
        enabled: true,
        storage: {
          type: "invalid" as const,
        },
      };

      // Act
      const result = AnalyticsConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
