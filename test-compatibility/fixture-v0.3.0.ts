/**
 * Compatibility fixture for Olimpus v0.3.0 configuration.
 *
 * This fixture represents a valid configuration from version 0.3.0 and serves as
 * the baseline for backward compatibility testing. All future versions should maintain
 * compatibility with this configuration format.
 *
 * @since 0.3.0
 * @stable
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for compatibility guarantees
 */

import type { OlimpusConfig } from "../src/config/schema.js";

/**
 * Baseline configuration fixture for v0.3.0.
 *
 * This configuration includes representative examples of all major features
 * available in v0.3.0:
 * - Meta-agents with various matcher types
 * - Agent overrides
 * - Categories
 * - Provider configuration
 * - Settings including analytics and routing logger
 *
 * @since 0.3.0
 * @stable
 */
export const fixture_v0_3_0: OlimpusConfig = {
  // Meta-agents with various matcher types (keyword, complexity, regex, project_context, always)
  meta_agents: {
    // Simple meta-agent with always matcher
    simple_router: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["sisyphus", "oracle"],
      routing_rules: [
        {
          matcher: { type: "always" },
          target_agent: "oracle",
        },
      ],
    },

    // Meta-agent with keyword matcher (any mode)
    keyword_router: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["librarian", "explore", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "keyword",
            keywords: ["docs", "documentation", "guide"],
            mode: "any",
          },
          target_agent: "librarian",
          config_overrides: {
            prompt: "You are a research specialist.",
          },
        },
        {
          matcher: {
            type: "keyword",
            keywords: ["code", "find"],
            mode: "all",
          },
          target_agent: "explore",
        },
        {
          matcher: { type: "always" },
          target_agent: "librarian",
        },
      ],
    },

    // Meta-agent with complexity matcher
    complexity_router: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["oracle", "prometheus", "metis"],
      routing_rules: [
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "oracle",
          config_overrides: {
            prompt: "Analyze this complex problem from first principles.",
          },
        },
        {
          matcher: {
            type: "complexity",
            threshold: "medium",
          },
          target_agent: "prometheus",
        },
        {
          matcher: { type: "always" },
          target_agent: "metis",
        },
      ],
    },

    // Meta-agent with regex matcher
    regex_router: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["hephaestus", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "regex",
            pattern: "^(design|ui|component)",
            flags: "i",
          },
          target_agent: "hephaestus",
        },
        {
          matcher: {
            type: "regex",
            pattern: "(performance|optimization)",
            flags: "i",
          },
          target_agent: "oracle",
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
        },
      ],
    },

    // Meta-agent with project context matcher
    context_router: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["sisyphus", "hephaestus"],
      temperature: 0.3,
      routing_rules: [
        {
          matcher: {
            type: "project_context",
            has_files: ["package.json"],
            has_deps: ["vitest", "jest", "bun:test"],
          },
          target_agent: "sisyphus",
          config_overrides: {
            prompt: "You are a TDD expert.",
            variant: "tdd",
          },
        },
        {
          matcher: {
            type: "project_context",
            has_files: ["package.json"],
          },
          target_agent: "sisyphus",
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
        },
      ],
    },
  },

  // Agent overrides for builtin agents
  agents: {
    sisyphus: {
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.3,
      description: "TDD-focused implementation agent",
      skills: ["typescript", "testing", "tdd"],
    },
    oracle: {
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.5,
      description: "Strategic analysis and architecture advisor",
    },
    librarian: {
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.2,
      description: "Documentation and research specialist",
    },
  },

  // Category configurations
  categories: {
    frontend: {
      description: "Frontend development tasks",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.3,
    },
    backend: {
      description: "Backend development and API tasks",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.4,
    },
    documentation: {
      description: "Technical writing and documentation",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.2,
    },
  },

  // Provider configuration
  providers: {
    priority_chain: [
      "anthropic/claude-opus-4-6",
      "openai/gpt-5.2",
      "google/gemini-3-pro",
    ],
    research_providers: [
      "anthropic/claude-haiku-4-5",
      "openai/gpt-4-turbo",
      "google/gemini-1.5-flash",
    ],
    strategy_providers: [
      "anthropic/claude-opus-4-6",
      "openai/gpt-5.2",
      "google/gemini-3-pro",
    ],
    config: {
      anthropic: { retry_on_rate_limit: true },
      openai: { retry_on_rate_limit: true },
    },
  },

  // Olimpus settings
  settings: {
    namespace_prefix: "olimpus",
    max_delegation_depth: 3,

    // Background parallelization
    background_parallelization: {
      enabled: true,
      max_parallel_tasks: 3,
      timeout_ms: 30000,
    },

    // Adaptive model selection
    adaptive_model_selection: {
      enabled: true,
      research_model: "claude-haiku-4-5",
      strategy_model: "claude-opus-4-6",
      default_model: "claude-3-5-sonnet-20241022",
    },

    // Ultrawork settings
    ultrawork_enabled: true,
    todo_continuation: true,
    verify_before_completion: true,

    // Code quality settings
    lsp_refactoring_preferred: true,
    aggressive_comment_pruning: true,

    // Analytics configuration (experimental in 0.3.0)
    analytics: {
      enabled: true,
      storage: {
        type: "file",
        path: ".olimpus/analytics.json",
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
    },

    // Routing logger configuration
    routing_logger: {
      enabled: false,
      output: "console",
      log_file: ".olimpus/routing.log",
      debug_mode: false,
      analytics_config: {
        enabled: true,
        storage_file: "analytics.json",
        max_events: 10000,
        retention_days: 90,
        auto_prune: true,
      },
    },
  },

  // Skills configuration
  skills: [
    "docs/skills/custom-skill.md",
    "/path/to/shared-skills/advanced-refactoring.md",
  ],

  // Disabled hooks
  disabled_hooks: [],
};

/**
 * Minimal configuration fixture for v0.3.0.
 *
 * This fixture contains only the essential fields required for a valid
 * v0.3.0 configuration. Useful for testing that minimal configs
 * remain compatible across versions.
 *
 * @since 0.3.0
 * @stable
 */
export const fixture_v0_3_0_minimal: OlimpusConfig = {
  meta_agents: {
    simple: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["sisyphus"],
      routing_rules: [
        {
          matcher: { type: "always" },
          target_agent: "sisyphus",
        },
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

/**
 * Configuration fixture with all matcher types from v0.3.0.
 *
 * This fixture specifically tests all available matcher types
 * to ensure they remain compatible across versions.
 *
 * @since 0.3.0
 * @stable
 */
export const fixture_v0_3_0_all_matchers: OlimpusConfig = {
  meta_agents: {
    matcher_test: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["sisyphus", "oracle", "librarian"],
      routing_rules: [
        // Keyword matcher - any mode
        {
          matcher: {
            type: "keyword",
            keywords: ["bug", "fix", "error"],
            mode: "any",
          },
          target_agent: "sisyphus",
        },
        // Keyword matcher - all mode
        {
          matcher: {
            type: "keyword",
            keywords: ["code", "find"],
            mode: "all",
          },
          target_agent: "librarian",
        },
        // Complexity matcher - low
        {
          matcher: {
            type: "complexity",
            threshold: "low",
          },
          target_agent: "sisyphus",
        },
        // Complexity matcher - medium
        {
          matcher: {
            type: "complexity",
            threshold: "medium",
          },
          target_agent: "oracle",
        },
        // Complexity matcher - high
        {
          matcher: {
            type: "complexity",
            threshold: "high",
          },
          target_agent: "oracle",
        },
        // Regex matcher with flags
        {
          matcher: {
            type: "regex",
            pattern: "\\b(bug|fix|error)\\b",
            flags: "i",
          },
          target_agent: "sisyphus",
        },
        // Regex matcher without flags
        {
          matcher: {
            type: "regex",
            pattern: "^(test|spec)",
          },
          target_agent: "sisyphus",
        },
        // Project context matcher - files only
        {
          matcher: {
            type: "project_context",
            has_files: ["package.json", "tsconfig.json"],
          },
          target_agent: "sisyphus",
        },
        // Project context matcher - deps only
        {
          matcher: {
            type: "project_context",
            has_deps: ["vitest", "jest"],
          },
          target_agent: "librarian",
        },
        // Project context matcher - both
        {
          matcher: {
            type: "project_context",
            has_files: ["package.json"],
            has_deps: ["bun:test"],
          },
          target_agent: "sisyphus",
        },
        // Always matcher (catch-all)
        {
          matcher: {
            type: "always",
          },
          target_agent: "sisyphus",
        },
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

/**
 * Configuration fixture with all routing rule config overrides from v0.3.0.
 *
 * This fixture tests all available config override options
 * in routing rules to ensure they remain compatible.
 *
 * @since 0.3.0
 * @stable
 */
export const fixture_v0_3_0_config_overrides: OlimpusConfig = {
  meta_agents: {
    config_override_test: {
      base_model: "claude-3-5-sonnet-20241022",
      delegates_to: ["sisyphus", "oracle"],
      routing_rules: [
        // Model override only
        {
          matcher: { type: "keyword", keywords: ["model"], mode: "any" },
          target_agent: "oracle",
          config_overrides: {
            model: "claude-opus-4-6",
          },
        },
        // Temperature override only
        {
          matcher: { type: "keyword", keywords: ["precise"], mode: "any" },
          target_agent: "sisyphus",
          config_overrides: {
            temperature: 0.1,
          },
        },
        // Prompt override only
        {
          matcher: { type: "keyword", keywords: ["custom"], mode: "any" },
          target_agent: "oracle",
          config_overrides: {
            prompt: "You are a custom specialist agent.",
          },
        },
        // Variant override only
        {
          matcher: { type: "keyword", keywords: ["variant"], mode: "any" },
          target_agent: "sisyphus",
          config_overrides: {
            variant: "tdd",
          },
        },
        // All overrides combined
        {
          matcher: { type: "always" },
          target_agent: "oracle",
          config_overrides: {
            model: "claude-opus-4-6",
            temperature: 0.5,
            prompt: "You are an expert agent with custom configuration.",
            variant: "strategy",
          },
        },
        // No overrides
        {
          matcher: { type: "always" },
          target_agent: "sisyphus",
        },
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
