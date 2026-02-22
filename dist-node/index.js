// src/config/loader.ts
import * as fs3 from "fs";
import * as path3 from "path";
import { parse } from "jsonc-parser";

// src/config/schema.ts
import { z } from "zod";
var KeywordMatcherSchema = z.object({
  type: z.literal("keyword"),
  keywords: z.array(z.string()).min(1),
  mode: z.enum(["any", "all"])
});
var ComplexityMatcherSchema = z.object({
  type: z.literal("complexity"),
  threshold: z.enum(["low", "medium", "high"])
});
var RegexMatcherSchema = z.object({
  type: z.literal("regex"),
  pattern: z.string().min(1),
  flags: z.string().optional()
});
var ProjectContextMatcherSchema = z.object({
  type: z.literal("project_context"),
  has_files: z.array(z.string()).optional(),
  has_deps: z.array(z.string()).optional()
});
var AlwaysMatcherSchema = z.object({
  type: z.literal("always")
});
var MatcherSchema = z.discriminatedUnion("type", [
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  RegexMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema
]);
var RoutingRuleSchema = z.object({
  matcher: MatcherSchema,
  target_agent: z.string(),
  config_overrides: z.object({
    model: z.string().optional(),
    temperature: z.number().optional(),
    prompt: z.string().optional(),
    variant: z.string().optional()
  }).optional()
});
var MetaAgentSchema = z.object({
  base_model: z.string(),
  delegates_to: z.array(z.string()).min(1),
  routing_rules: z.array(RoutingRuleSchema).min(1),
  prompt_template: z.string().optional(),
  temperature: z.number().optional()
});
var AgentOverrideSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  prompt: z.string().optional(),
  skills: z.array(z.string()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional()
});
var AgentOverridesSchema = z.record(z.string(), AgentOverrideSchema).optional();
var CategoryConfigSchema = z.object({
  description: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional()
});
var CategoriesSchema = z.record(z.string(), CategoryConfigSchema).optional();
var ProviderConfigSchema = z.object({
  priority_chain: z.array(z.string()).optional(),
  research_providers: z.array(z.string()).optional(),
  strategy_providers: z.array(z.string()).optional(),
  config: z.record(
    z.string(),
    z.record(z.string(), z.string().or(z.boolean()).or(z.number())).optional()
  ).optional()
});
var RoutingAnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storage_file: z.string().default("analytics.json"),
  max_events: z.number().int().positive().default(1e4),
  retention_days: z.number().int().positive().default(90),
  auto_prune: z.boolean().default(true)
});
var RoutingLoggerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  output: z.enum(["console", "file", "disabled"]).optional(),
  log_file: z.string().optional(),
  debug_mode: z.boolean().optional(),
  analytics_config: RoutingAnalyticsConfigSchema.optional()
});
var AnalyticsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  storage: z.object({
    type: z.enum(["memory", "file", "database"]).optional(),
    path: z.string().optional(),
    retention_days: z.number().int().positive().optional()
  }).optional(),
  metrics: z.object({
    track_routing_decisions: z.boolean().optional(),
    track_execution_time: z.boolean().optional(),
    track_agent_usage: z.boolean().optional(),
    track_model_costs: z.boolean().optional(),
    track_success_rates: z.boolean().optional()
  }).optional(),
  aggregation: z.object({
    enabled: z.boolean().optional(),
    window_minutes: z.number().int().positive().optional(),
    include_percentiles: z.boolean().optional()
  }).optional()
});
var SettingsSchema = z.object({
  namespace_prefix: z.string().default("olimpus"),
  max_delegation_depth: z.number().int().positive().default(3),
  // Background parallelization
  background_parallelization: z.object({
    enabled: z.boolean().optional(),
    max_parallel_tasks: z.number().int().positive().optional(),
    timeout_ms: z.number().int().positive().optional()
  }).optional(),
  // Adaptive model selection
  adaptive_model_selection: z.object({
    enabled: z.boolean().optional(),
    research_model: z.string().optional(),
    strategy_model: z.string().optional(),
    default_model: z.string().optional()
  }).optional(),
  // Ultrawork and relentless execution
  ultrawork_enabled: z.boolean().optional(),
  todo_continuation: z.boolean().optional(),
  verify_before_completion: z.boolean().optional(),
  // Code quality
  lsp_refactoring_preferred: z.boolean().optional(),
  aggressive_comment_pruning: z.boolean().optional(),
  // Routing logger
  routing_logger: RoutingLoggerConfigSchema.optional(),
  // Analytics
  analytics: AnalyticsConfigSchema.optional()
});
var OlimpusConfigSchema = z.object({
  // Olimpus-specific sections
  meta_agents: z.record(z.string(), MetaAgentSchema).optional(),
  providers: ProviderConfigSchema.optional(),
  settings: SettingsSchema.optional(),
  skills: z.array(z.string()).optional(),
  // oh-my-opencode passthrough sections
  agents: AgentOverridesSchema,
  categories: CategoriesSchema,
  disabled_hooks: z.array(z.string()).optional()
});
var ProjectOverrideSchema = z.object({
  // Meta-agent overrides
  meta_agents: z.record(z.string(), MetaAgentSchema.partial()).optional(),
  providers: ProviderConfigSchema.partial().optional(),
  settings: SettingsSchema.partial().optional(),
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesSchema.optional(),
  skills: z.array(z.string()).optional()
});
var ProjectConfigSchema = z.object({
  // Unique project identifier
  project_id: z.string().min(1),
  name: z.string().optional(),
  path: z.string().optional(),
  overrides: ProjectOverrideSchema.optional(),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  }).optional(),
  // Analytics configuration for this project
  analytics_enabled: z.boolean().default(true)
});
var SharedConfigSchema = z.object({
  // Base configuration that all projects inherit
  base_config: OlimpusConfigSchema.optional(),
  default_project: ProjectConfigSchema.partial().optional(),
  global_routing_rules: z.array(RoutingRuleSchema).optional(),
  shared_meta_agents: z.record(z.string(), MetaAgentSchema).optional()
});
var PortfolioConfigSchema = z.object({
  // Enable cross-project analytics aggregation
  enable_aggregation: z.boolean().default(true),
  enable_cross_project_delegation: z.boolean().default(true),
  agent_namespace_format: z.string().default("{project_id}:{agent_name}"),
  default_project_id: z.string().optional(),
  max_cross_project_depth: z.number().int().positive().default(5),
  aggregation_settings: z.object({
    // Minimum confidence threshold for portfolio-wide metrics
    min_confidence_threshold: z.number().min(0).max(1).default(0.8),
    aggregation_window_days: z.number().int().positive().default(30),
    include_project_anonymization: z.boolean().default(true)
  }).optional()
});
var ProjectRegistryConfigSchema = z.object({
  // Portfolio-wide settings
  portfolio: PortfolioConfigSchema.optional(),
  shared_config: SharedConfigSchema.optional(),
  projects: z.record(z.string(), ProjectConfigSchema).default({}),
  registry: z.object({
    // Registry version
    version: z.string().default("1.0.0"),
    registry_id: z.string().optional(),
    created_at: z.string().optional(),
    // Timestamp when registry was last updated
    updated_at: z.string().optional()
  }).optional()
});

// src/config/scaffolder.ts
import * as fs2 from "fs";
import * as path2 from "path";

// src/config/wizard.ts
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import process2 from "node:process";

// src/config/prompts.ts
var PROJECT_TYPES = [
  {
    id: "web",
    name: "Web Application",
    description: "Frontend web app (React, Vue, Svelte, etc.)",
    icon: "\u{1F310}"
  },
  {
    id: "backend",
    name: "Backend API",
    description: "REST/GraphQL API server",
    icon: "\u2699\uFE0F"
  },
  {
    id: "fullstack",
    name: "Full Stack",
    description: "Both frontend and backend",
    icon: "\u{1F517}"
  },
  {
    id: "cli",
    name: "CLI Tool",
    description: "Command-line application",
    icon: "\u{1F4BB}"
  },
  {
    id: "library",
    name: "Library/Package",
    description: "Reusable code library",
    icon: "\u{1F4E6}"
  },
  {
    id: "other",
    name: "Other",
    description: "Something else or mixed",
    icon: "\u{1F527}"
  }
];
var LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C#",
  "Other"
];
var META_AGENT_PRESETS = [
  {
    id: "atenea",
    name: "Atenea",
    description: "Strategic planning & architecture analysis",
    enabled_by_default: true
  },
  {
    id: "hermes",
    name: "Hermes",
    description: "Communication & research",
    enabled_by_default: true
  },
  {
    id: "hefesto",
    name: "Hefesto",
    description: "Implementation & building",
    enabled_by_default: true
  },
  {
    id: "frontend_specialist",
    name: "Frontend Specialist",
    description: "UI components & frontend tasks",
    enabled_by_default: false
  }
];
var PROVIDER_MODELS = [
  {
    id: "claude-opus-4-20250205",
    provider: "anthropic",
    name: "Claude Opus 4.6",
    description: "Most capable model, excellent for complex reasoning and coding (Feb 2026)"
  },
  {
    id: "claude-sonnet-4-20250217",
    provider: "anthropic",
    name: "Claude Sonnet 4.6",
    description: "Best balance of speed and intelligence, 1M tokens, default for Pro (Feb 2026)"
  },
  {
    id: "claude-haiku-4-20251022",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    description: "Fast and cost-effective for research and simple tasks"
  },
  {
    id: "claude-opus-4-20241105",
    provider: "anthropic",
    name: "Claude Opus 4.5",
    description: "Previous generation Opus, excellent for coding and agents"
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    name: "Claude 3.5 Sonnet (Legacy)",
    description: "Legacy model, still stable for backward compatibility"
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    name: "GPT 5.2",
    description: "OpenAI's flagship model"
  },
  {
    id: "gemini-3-pro",
    provider: "google",
    name: "Gemini 3 Pro",
    description: "Google's advanced model"
  }
];
var SETTING_PRESETS = [
  {
    key: "background_parallelization",
    name: "Background Parallelization",
    description: "Run research tasks in background while main agent executes",
    enabled_by_default: true
  },
  {
    key: "adaptive_model_selection",
    name: "Adaptive Model Selection",
    description: "Use cheap models for research, expensive for decisions",
    enabled_by_default: true
  },
  {
    key: "ultrawork_enabled",
    name: "Ultrawork Mode",
    description: "Relentless execution - tasks don't stop halfway",
    enabled_by_default: true
  },
  {
    key: "todo_continuation",
    name: "Todo Continuation",
    description: "Continue if agent stops mid-task",
    enabled_by_default: true
  },
  {
    key: "verify_before_completion",
    name: "Verify Before Completion",
    description: "Double-check work before declaring done",
    enabled_by_default: true
  },
  {
    key: "lsp_refactoring_preferred",
    name: "LSP Refactoring",
    description: "Use AST-based refactoring (no string replacement)",
    enabled_by_default: true
  },
  {
    key: "aggressive_comment_pruning",
    name: "Comment Pruning",
    description: "Remove verbose AI-generated comments",
    enabled_by_default: true
  }
];
var WIZARD_PROMPTS = {
  /**
   * Welcome message and introduction
   */
  welcome: {
    id: "welcome",
    message: `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551              Welcome to Olimpus Setup Wizard                     \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

This wizard will help you create your first Olimpus configuration.

Olimpus is an intelligent meta-orchestrator that routes your tasks
to specialized agents based on context and complexity.

You can run this wizard anytime by running: opencode olimpus init

Press Enter to continue...
`
  },
  /**
   * Project type selection
   */
  project_type: {
    id: "project_type",
    question: "What type of project is this?",
    help: "This helps Olimpus select appropriate meta-agents and defaults",
    options: PROJECT_TYPES.map((t) => ({
      value: t.id,
      label: `${t.icon} ${t.name}`,
      description: t.description
    }))
  },
  /**
   * Primary language selection
   */
  language: {
    id: "language",
    question: "What is the primary programming language?",
    help: "Used for code generation and project context",
    options: LANGUAGES.map((l) => ({
      value: l.toLowerCase(),
      label: l
    }))
  },
  /**
   * Meta-agent selection
   */
  meta_agents: {
    id: "meta_agents",
    question: "Which meta-agents would you like to enable?",
    help: "Meta-agents intelligently route tasks to specialized workers",
    options: META_AGENT_PRESETS.map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description,
      default: m.enabled_by_default
    }))
  },
  /**
   * Primary model selection
   */
  primary_model: {
    id: "primary_model",
    question: "Select your primary AI model",
    help: "This model will be used for most tasks",
    options: PROVIDER_MODELS.map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description
    }))
  },
  /**
   * Research model selection
   */
  research_model: {
    id: "research_model",
    question: "Select your research model (background tasks)",
    help: "Faster/cheaper model for search and documentation lookups",
    options: PROVIDER_MODELS.filter(
      (m) => m.id.includes("haiku") || m.id.includes("turbo") || m.id.includes("flash")
    ).map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description
    }))
  },
  /**
   * Settings selection
   */
  settings: {
    id: "settings",
    question: "Which Olimpus features would you like to enable?",
    help: "Enable advanced features for enhanced productivity",
    options: SETTING_PRESETS.map((s) => ({
      value: s.key,
      label: s.name,
      description: s.description,
      default: s.enabled_by_default
    }))
  },
  /**
   * Skills path (optional)
   */
  skills_path: {
    id: "skills_path",
    message: "Path to custom skills directory (optional, leave empty to skip)",
    default: ""
  },
  /**
   * Configuration summary
   */
  summary: {
    id: "summary",
    message: (answers) => `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                    Configuration Summary                         \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Project Type:   ${PROJECT_TYPES.find((t) => t.id === answers.project_type)?.name || "Unknown"}
Language:       ${answers.language}
Meta-Agents:    ${answers.meta_agents?.join(", ") || "None"}
Primary Model:  ${answers.primary_model}
Research Model: ${answers.research_model}
Features:       ${answers.settings?.join(", ") || "None"}
Skills Path:    ${answers.skills_path || "None"}

Configuration will be saved to:
  ~/.config/opencode/olimpus.jsonc

Press Enter to generate configuration or Ctrl+C to cancel...
`
  },
  /**
   * Success message
   */
  success: {
    id: "success",
    message: (path4) => `
\u2705 Configuration created successfully at:
   ${path4}

You can now use Olimpus! Try:
  \u2022 "ulw implement a new feature" - Ultrawork mode
  \u2022 "research API patterns" - Research mode
  \u2022 "@atenea plan architecture" - Strategic planning

Edit your config at anytime: ~/.config/opencode/olimpus.jsonc
`
  }
};
function isOptionsPrompt(prompt) {
  return "options" in prompt;
}
function isSimplePrompt(prompt) {
  return "message" in prompt;
}
function getProviderModel(id) {
  return PROVIDER_MODELS.find((m) => m.id === id);
}

// src/config/wizard.ts
var PROJECT_CONFIG_TEMPLATES = {
  /**
   * Web Application - Frontend-focused development
   */
  web: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto", "frontend_specialist"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation for web apps"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis for frontend architecture"
      }
    },
    defaultCategories: {
      frontend: {
        description: "Frontend development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      ui_components: {
        description: "UI component development",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      styling: {
        description: "CSS, Tailwind, and styling tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      testing: {
        description: "Frontend testing with vitest/cypress",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      }
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  },
  /**
   * Backend API - Server-side development
   */
  backend: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation for APIs"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.4,
        description: "Strategic analysis for API architecture"
      }
    },
    defaultCategories: {
      backend: {
        description: "Backend development and API tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      database: {
        description: "Database schema and migrations",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      api: {
        description: "REST/GraphQL API endpoints",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      testing: {
        description: "API testing and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      }
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  },
  /**
   * Full Stack - Both frontend and backend
   */
  fullstack: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto", "frontend_specialist"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation for full-stack apps"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis for full-stack architecture"
      }
    },
    defaultCategories: {
      frontend: {
        description: "Frontend development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      backend: {
        description: "Backend development and API tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.4
      },
      database: {
        description: "Database schema and migrations",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      api: {
        description: "REST/GraphQL API endpoints",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      testing: {
        description: "End-to-end and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      deployment: {
        description: "CI/CD and deployment configuration",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      }
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  },
  /**
   * CLI Tool - Command-line applications
   */
  cli: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation for CLI tools"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.4,
        description: "Strategic analysis for CLI design"
      }
    },
    defaultCategories: {
      core: {
        description: "Core CLI logic and commands",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      ui: {
        description: "CLI interface and user experience",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      testing: {
        description: "CLI testing and integration tests",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      documentation: {
        description: "CLI help and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      }
    },
    defaultSettings: {
      background_parallelization: false,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  },
  /**
   * Library/Package - Reusable code libraries
   */
  library: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.2,
        description: "TDD-focused implementation for libraries"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "Strategic analysis for API design"
      }
    },
    defaultCategories: {
      core: {
        description: "Core library functionality",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      api: {
        description: "Public API design and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      testing: {
        description: "Unit tests and test coverage",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      },
      examples: {
        description: "Example usage and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      }
    },
    defaultSettings: {
      background_parallelization: false,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  },
  /**
   * Other - Generic or mixed project types
   */
  other: {
    defaultMetaAgents: ["atenea", "hermes", "hefesto"],
    defaultAgents: {
      sisyphus: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.3,
        description: "TDD-focused implementation agent"
      },
      oracle: {
        model: "claude-sonnet-4-20250217",
        temperature: 0.5,
        description: "Strategic analysis and architecture advisor"
      }
    },
    defaultCategories: {
      general: {
        description: "General development tasks",
        model: "claude-sonnet-4-20250217",
        temperature: 0.3
      },
      documentation: {
        description: "Technical writing and documentation",
        model: "claude-sonnet-4-20250217",
        temperature: 0.2
      }
    },
    defaultSettings: {
      background_parallelization: true,
      adaptive_model_selection: true,
      lsp_refactoring_preferred: true
    }
  }
};
function getProjectTemplate(projectType) {
  return PROJECT_CONFIG_TEMPLATES[projectType] || PROJECT_CONFIG_TEMPLATES.other;
}
var ReadlineInterface = class {
  rl;
  constructor(input, output) {
    this.rl = readline.createInterface({
      input,
      output,
      terminal: true
    });
  }
  /**
   * Ask a single-line question
   */
  async question(prompt) {
    return new Promise((resolve2) => {
      this.rl.question(prompt, (answer) => {
        resolve2(answer.trim());
      });
    });
  }
  /**
   * Ask a password/hidden question (for sensitive input)
   * Note: Node.js readline doesn't support true hidden input without external deps
   * This is a placeholder for future enhancement
   */
  async questionHidden(prompt) {
    return this.question(prompt);
  }
  /**
   * Ask a yes/no question
   */
  async confirm(prompt, defaultValue = true) {
    const hint = defaultValue ? " [Y/n]" : " [y/N]";
    const answer = await this.question(prompt + hint + ": ");
    if (!answer) {
      return defaultValue;
    }
    const lower = answer.toLowerCase();
    return lower === "y" || lower === "yes";
  }
  /**
   * Display a message without waiting for input
   */
  print(message) {
    this.rl.write(message);
  }
  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
};
function displayOptions(options, selectedIndex) {
  options.forEach((opt, index) => {
    const prefix = index === selectedIndex ? "> " : "  ";
    const description = opt.description ? ` - ${opt.description}` : "";
    console.log(`${prefix}${index + 1}. ${opt.label}${description}`);
  });
}
function displayMultiSelectOptions(options, selectedIndices) {
  options.forEach((opt, index) => {
    const selected = selectedIndices.has(index);
    const checkbox = selected ? "[x]" : "[ ]";
    const description = opt.description ? ` - ${opt.description}` : "";
    console.log(`  ${checkbox} ${index + 1}. ${opt.label}${description}`);
  });
}
async function selectOption(rli, prompt, help) {
  const optionsPrompt = WIZARD_PROMPTS[prompt];
  if (!isOptionsPrompt(optionsPrompt)) {
    throw new Error(`Prompt "${prompt}" is not an options prompt`);
  }
  const options = optionsPrompt.options;
  if (help) {
    console.log(`\u{1F4A1} ${help}
`);
  }
  displayOptions(options);
  console.log("");
  while (true) {
    const answer = await rli.question("Select option (1-" + options.length + "): ");
    const num = parseInt(answer, 10);
    if (isNaN(num) || num < 1 || num > options.length) {
      console.log(`Invalid selection. Please enter a number between 1 and ${options.length}.`);
      continue;
    }
    return options[num - 1];
  }
}
async function selectMultipleOptions(rli, prompt, help, defaults) {
  const optionsPrompt = WIZARD_PROMPTS[prompt];
  if (!isOptionsPrompt(optionsPrompt)) {
    throw new Error(`Prompt "${prompt}" is not an options prompt`);
  }
  const options = optionsPrompt.options;
  const selected = /* @__PURE__ */ new Set();
  if (defaults) {
    defaults.forEach((enabled, index) => {
      if (enabled) selected.add(index);
    });
  }
  if (help) {
    console.log(`\u{1F4A1} ${help}`);
    console.log("Select multiple options, then press 'd' when done.\n");
  }
  while (true) {
    console.clear();
    displayMultiSelectOptions(options, selected);
    console.log("");
    console.log("Toggle: <number>  |  Done: d  |  Clear all: c");
    const answer = await rli.question("> ");
    const lower = answer.toLowerCase();
    if (lower === "d") {
      if (selected.size === 0) {
        console.log("Please select at least one option.");
        continue;
      }
      break;
    }
    if (lower === "c") {
      selected.clear();
      continue;
    }
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= options.length) {
      const index = num - 1;
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }
    }
  }
  return Array.from(selected).map((i) => options[i]);
}
async function askText(rli, promptId, defaultValue) {
  const promptObj = WIZARD_PROMPTS[promptId];
  if (!isSimplePrompt(promptObj) || typeof promptObj.message === "function") {
    throw new Error(`Prompt "${promptId}" is not a simple text prompt`);
  }
  const promptText = defaultValue ? `${promptObj.message} [${defaultValue}]: ` : `${promptObj.message}: `;
  const answer = await rli.question(promptText);
  return answer || defaultValue || "";
}
async function showMessage(rli, promptId, ...args) {
  const promptObj = WIZARD_PROMPTS[promptId];
  if (!isSimplePrompt(promptObj)) {
    throw new Error(`Prompt "${promptId}" is not a simple prompt`);
  }
  const message = typeof promptObj.message === "function" ? promptObj.message(...args) : promptObj.message;
  console.log(message);
  await rli.question("");
}
function createMetaAgents(selectedIds, baseModel) {
  const templates = {
    atenea: {
      base_model: baseModel,
      delegates_to: ["oracle", "prometheus", "atlas", "metis"],
      routing_rules: [
        {
          matcher: { type: "complexity", threshold: "high" },
          target_agent: "oracle",
          config_overrides: {
            prompt: "You are a strategic architecture advisor. Analyze this complex problem from first principles, considering system design patterns, scalability, maintainability, and long-term implications."
          }
        },
        {
          matcher: { type: "always" },
          target_agent: "metis",
          config_overrides: {
            prompt: "You are a general technical analyst. Synthesize information and provide comprehensive analysis."
          }
        }
      ]
    },
    hermes: {
      base_model: baseModel,
      delegates_to: ["librarian", "explore", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "keyword",
            keywords: ["docs", "documentation", "guide", "search", "lookup"],
            mode: "any"
          },
          target_agent: "librarian",
          config_overrides: {
            prompt: "You are a research specialist. Search comprehensively for documentation and guides."
          }
        },
        {
          matcher: { type: "always" },
          target_agent: "librarian"
        }
      ]
    },
    hefesto: {
      base_model: baseModel,
      delegates_to: ["sisyphus", "hephaestus"],
      temperature: 0.3,
      routing_rules: [
        {
          matcher: {
            type: "project_context",
            has_files: ["package.json"],
            has_deps: ["vitest", "jest", "bun:test"]
          },
          target_agent: "sisyphus",
          config_overrides: {
            prompt: "You are a TDD expert. Write tests first, then implementation.",
            variant: "tdd"
          }
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus",
          config_overrides: {
            prompt: "You are a builder. Implement with attention to quality and best practices."
          }
        }
      ]
    },
    frontend_specialist: {
      base_model: baseModel,
      delegates_to: ["hephaestus", "oracle"],
      routing_rules: [
        {
          matcher: {
            type: "regex",
            pattern: "^(design|ui|component|button|form|style)",
            flags: "i"
          },
          target_agent: "hephaestus",
          config_overrides: {
            prompt: "You are a frontend specialist. Build responsive, accessible UI components."
          }
        },
        {
          matcher: { type: "always" },
          target_agent: "hephaestus"
        }
      ]
    }
  };
  const result = {};
  for (const id of selectedIds) {
    if (templates[id]) {
      result[id] = templates[id];
    }
  }
  return result;
}
function createProviderConfig(primaryModel, researchModel) {
  const primaryModelData = getProviderModel(primaryModel);
  const researchModelData = getProviderModel(researchModel);
  const primaryProvider = primaryModelData?.provider || "anthropic";
  const researchProvider = researchModelData?.provider || "anthropic";
  return {
    priority_chain: [
      `${primaryProvider}/${primaryModel}`,
      `${researchProvider}/${researchModel}`
    ],
    research_providers: [`${researchProvider}/${researchModel}`],
    strategy_providers: [`${primaryProvider}/${primaryModel}`],
    config: {
      anthropic: { retry_on_rate_limit: true },
      openai: { retry_on_rate_limit: true },
      google: { retry_on_rate_limit: true }
    }
  };
}
function createSettings(selectedKeys, primaryModel, researchModel, projectDefaults) {
  const backgroundParallelization = selectedKeys.includes("background_parallelization") || projectDefaults?.background_parallelization === true;
  const adaptiveModelSelection = selectedKeys.includes("adaptive_model_selection") || projectDefaults?.adaptive_model_selection === true;
  const ultraworkEnabled = selectedKeys.includes("ultrawork_enabled");
  const todoContinuation = selectedKeys.includes("todo_continuation");
  const verifyBeforeCompletion = selectedKeys.includes("verify_before_completion");
  const lspRefactoringPreferred = selectedKeys.includes("lsp_refactoring_preferred") || projectDefaults?.lsp_refactoring_preferred === true;
  const aggressiveCommentPruning = selectedKeys.includes("aggressive_comment_pruning");
  return {
    namespace_prefix: "olimpus",
    max_delegation_depth: 3,
    background_parallelization: backgroundParallelization ? {
      enabled: true,
      max_parallel_tasks: 3,
      timeout_ms: 3e4
    } : void 0,
    adaptive_model_selection: adaptiveModelSelection ? {
      enabled: true,
      research_model: researchModel,
      strategy_model: primaryModel,
      default_model: "claude-sonnet-4-20250217"
    } : void 0,
    ultrawork_enabled: ultraworkEnabled,
    todo_continuation: todoContinuation,
    verify_before_completion: verifyBeforeCompletion,
    lsp_refactoring_preferred: lspRefactoringPreferred,
    aggressive_comment_pruning: aggressiveCommentPruning
  };
}
var SCHEMA_URL = "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json";
function buildConfig(answers) {
  const primaryModel = answers.primary_model;
  const researchModel = answers.research_model;
  const projectTemplate = getProjectTemplate(answers.project_type);
  const metaAgentIds = answers.meta_agents && answers.meta_agents.length > 0 ? answers.meta_agents : projectTemplate.defaultMetaAgents;
  const settings = answers.settings ?? [];
  const agents = {
    ...projectTemplate.defaultAgents
  };
  for (const agentId in agents) {
    if (agents[agentId]) {
      agents[agentId].model = primaryModel;
    }
  }
  const categories = {};
  if (projectTemplate.defaultCategories) {
    for (const [categoryId, categoryDef] of Object.entries(
      projectTemplate.defaultCategories
    )) {
      categories[categoryId] = {
        description: categoryDef.description,
        model: categoryDef.model ?? primaryModel,
        temperature: categoryDef.temperature ?? 0.3
      };
    }
  }
  return {
    meta_agents: metaAgentIds.length > 0 ? createMetaAgents(metaAgentIds, primaryModel) : void 0,
    providers: createProviderConfig(primaryModel, researchModel),
    settings: createSettings(settings, primaryModel, researchModel, projectTemplate.defaultSettings),
    skills: answers.skills_path ? [answers.skills_path] : void 0,
    agents,
    categories,
    disabled_hooks: []
  };
}
function formatConfigAsJsonc(config) {
  const jsonString = JSON.stringify(config, null, 2);
  return `{
  "$schema": "${SCHEMA_URL}",
` + jsonString.slice(1);
}
async function runWizard(options = {}) {
  const input = options.input ?? process2.stdin;
  const output = options.output ?? process2.stdout;
  const rli = new ReadlineInterface(input, output);
  try {
    await showMessage(rli, "welcome");
    const answers = {
      project_type: "",
      language: "",
      primary_model: "",
      research_model: ""
    };
    const projectType = await selectOption(rli, "project_type", WIZARD_PROMPTS.project_type.help);
    answers.project_type = projectType.value;
    const language = await selectOption(rli, "language", WIZARD_PROMPTS.language.help);
    answers.language = language.value;
    const metaAgents = await selectMultipleOptions(
      rli,
      "meta_agents",
      WIZARD_PROMPTS.meta_agents.help,
      META_AGENT_PRESETS.map((m) => m.enabled_by_default)
    );
    answers.meta_agents = metaAgents.map((a) => a.value);
    const primaryModel = await selectOption(
      rli,
      "primary_model",
      WIZARD_PROMPTS.primary_model.help
    );
    answers.primary_model = primaryModel.value;
    const researchModel = await selectOption(
      rli,
      "research_model",
      WIZARD_PROMPTS.research_model.help
    );
    answers.research_model = researchModel.value;
    const settings = await selectMultipleOptions(
      rli,
      "settings",
      WIZARD_PROMPTS.settings.help,
      SETTING_PRESETS.map((s) => s.enabled_by_default)
    );
    answers.settings = settings.map((s) => s.value);
    const skillsPath = await askText(
      rli,
      "skills_path",
      WIZARD_PROMPTS.skills_path.default
    );
    if (skillsPath) {
      answers.skills_path = skillsPath;
    }
    console.log("");
    await showMessage(rli, "summary", answers);
    const config = buildConfig(answers);
    let configPath = options.configPath;
    if (!configPath) {
      const homeDir = process2.env.HOME;
      if (homeDir) {
        configPath = path.join(homeDir, ".config", "opencode", "olimpus.jsonc");
      } else {
        throw new Error("HOME environment variable not set");
      }
    }
    const parentDir = path.dirname(configPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const content = formatConfigAsJsonc(config);
    fs.writeFileSync(configPath, content, "utf-8");
    console.log("");
    await showMessage(rli, "success", configPath);
    return {
      config,
      answers,
      path: configPath
    };
  } finally {
    rli.close();
  }
}

// src/config/scaffolder.ts
var DEFAULT_CONFIG = {
  $schema: "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
  meta_agents: {},
  settings: {
    namespace_prefix: "olimpus",
    max_delegation_depth: 3
  }
};
function formatJsonc(obj) {
  return JSON.stringify(obj, null, 2);
}
async function scaffoldOlimpusConfig(options) {
  try {
    if (options.projectConfigExists) {
      return null;
    }
    if (options.useWizard) {
      try {
        const wizardResult = await runWizard(
          options.wizardOptions ?? {}
        );
        return {
          path: wizardResult.path,
          created: true
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Olimpus] Wizard failed: ${err.message}`);
        return null;
      }
    }
    const homeDir = process.env.HOME;
    if (!homeDir) {
      console.warn(
        "[Olimpus] HOME environment variable not set, skipping config generation"
      );
      return null;
    }
    const targetPath = path2.join(
      homeDir,
      ".config",
      "opencode",
      "olimpus.jsonc"
    );
    if (fs2.existsSync(targetPath) || options.userConfigExists) {
      return {
        path: targetPath,
        created: false
      };
    }
    const parentDir = path2.dirname(targetPath);
    try {
      fs2.mkdirSync(parentDir, { recursive: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.includes("EACCES") || err.message.includes("EROFS")) {
        console.warn(
          `[Olimpus] Permission denied creating directory: ${parentDir}`
        );
        return null;
      }
      throw error;
    }
    const content = formatJsonc(DEFAULT_CONFIG);
    const parsed = JSON.parse(content);
    const validation = OlimpusConfigSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn("[Olimpus] Generated config failed validation");
      return null;
    }
    const tempPath = `${targetPath}.tmp`;
    try {
      fs2.writeFileSync(tempPath, content, "utf-8");
      fs2.renameSync(tempPath, targetPath);
    } catch (error) {
      try {
        if (fs2.existsSync(tempPath)) {
          fs2.unlinkSync(tempPath);
        }
      } catch {
      }
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.includes("EACCES") || err.message.includes("EROFS") || err.message.includes("ENOSPC")) {
        console.warn(`[Olimpus] Failed to write config: ${err.message}`);
        return null;
      }
      throw error;
    }
    console.log(`[Olimpus] Generated default config at ${targetPath}`);
    return {
      path: targetPath,
      created: true
    };
  } catch (error) {
    console.warn(
      `[Olimpus] Scaffolding failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

// src/config/validator.ts
import { z as z2 } from "zod";
var CircularDependencyErrorSchema = z2.object({
  type: z2.literal("circular_dependency"),
  message: z2.string(),
  path: z2.array(z2.string()),
  meta_agents: z2.array(z2.string())
});
var InvalidAgentReferenceErrorSchema = z2.object({
  type: z2.literal("invalid_agent_reference"),
  message: z2.string(),
  path: z2.array(z2.string()),
  reference: z2.string()
});
var SchemaValidationErrorSchema = z2.object({
  type: z2.literal("schema_validation"),
  message: z2.string(),
  path: z2.array(z2.string()),
  zodIssue: z2.any().optional()
});
var RegexPerformanceWarningSchema = z2.object({
  type: z2.literal("regex_performance"),
  message: z2.string(),
  path: z2.array(z2.string()),
  pattern: z2.string(),
  reason: z2.string()
});
var ValidationErrorSchema = z2.discriminatedUnion("type", [
  CircularDependencyErrorSchema,
  InvalidAgentReferenceErrorSchema,
  SchemaValidationErrorSchema
]);
var ValidationWarningSchema = z2.discriminatedUnion("type", [
  RegexPerformanceWarningSchema
]);
var ValidationResultSchema = z2.object({
  valid: z2.boolean(),
  errors: z2.array(ValidationErrorSchema).default([]),
  warnings: z2.array(ValidationWarningSchema).default([]),
  config: z2.any().optional()
});
var SeveritySchema = z2.enum(["error", "warning"]);
var CheckTypeSchema = z2.enum([
  "schema",
  "circular_dependency",
  "agent_reference",
  "regex_performance"
]);
var CheckResultSchema = z2.object({
  checkType: CheckTypeSchema,
  passed: z2.boolean(),
  errors: z2.array(ValidationErrorSchema).default([]),
  warnings: z2.array(ValidationWarningSchema).default([])
});
var ValidationContextSchema = z2.object({
  configPath: z2.string().optional(),
  configName: z2.string().optional(),
  checkCircularDependencies: z2.boolean().default(true),
  checkAgentReferences: z2.boolean().default(true),
  checkRegexPerformance: z2.boolean().default(true)
});
function createCircularDependencyError(message, path4, metaAgents) {
  return {
    type: "circular_dependency",
    message,
    path: path4,
    meta_agents: metaAgents
  };
}
function createInvalidAgentReferenceError(message, path4, reference) {
  return {
    type: "invalid_agent_reference",
    message,
    path: path4,
    reference
  };
}
function createRegexPerformanceWarning(message, path4, pattern, reason) {
  return {
    type: "regex_performance",
    message,
    path: path4,
    pattern,
    reason
  };
}
function createValidationResult(config) {
  return {
    valid: false,
    errors: [],
    warnings: [],
    config
  };
}
function createCheckResult(checkType, passed = false) {
  return {
    checkType,
    passed,
    errors: [],
    warnings: []
  };
}
function formatErrors(result) {
  return result.errors.map((error) => {
    const pathStr = error.path.length > 0 ? error.path.join(".") : "root";
    return `[ERROR] ${pathStr}: ${error.message}`;
  });
}
function formatWarnings(result) {
  return result.warnings.map((warning) => {
    const pathStr = warning.path.length > 0 ? warning.path.join(".") : "root";
    return `[WARNING] ${pathStr}: ${warning.message}`;
  });
}
function validateOlimpusConfig(config, context) {
  const ctx = {
    checkCircularDependencies: true,
    checkAgentReferences: true,
    checkRegexPerformance: true,
    ...context
  };
  const result = createValidationResult(config);
  if (ctx.checkCircularDependencies) {
    const circularCheck = checkCircularDependenciesInConfig(config, ctx);
    result.errors.push(...circularCheck.errors);
  }
  if (ctx.checkAgentReferences) {
    const agentRefCheck = checkAgentReferencesInConfig(config, ctx);
    result.errors.push(...agentRefCheck.errors);
  }
  if (ctx.checkRegexPerformance) {
    const regexCheck = checkRegexPerformanceInConfig(config, ctx);
    result.warnings.push(...regexCheck.warnings);
  }
  result.valid = result.errors.length === 0;
  return result;
}
var BUILTIN_AGENT_NAMES = [
  "sisyphus",
  "hephaestus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "prometheus"
];
var DelegationGraph = class {
  delegations = {};
  maxDepth;
  constructor(maxDepth = 3) {
    this.maxDepth = maxDepth;
  }
  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   */
  trackDelegation(from, to) {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }
  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
   */
  checkCircular(from, to, maxDepth = this.maxDepth) {
    return this.hasCircle(from, to, maxDepth, /* @__PURE__ */ new Set());
  }
  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain
   * @param target - Target agent we're trying to reach
   * @param depth - Remaining depth to search
   * @param visited - Set of visited nodes to detect cycles
   * @returns true if a circular path exists, false otherwise
   */
  hasCircle(current, target, depth, visited) {
    if (depth <= 0) {
      return false;
    }
    if (visited.has(current)) {
      return true;
    }
    if (current === target) {
      return true;
    }
    visited.add(current);
    for (const delegation of Object.keys(this.delegations)) {
      const [from, next] = delegation.split(":");
      if (from === current && next) {
        if (this.hasCircle(next, target, depth - 1, new Set(visited))) {
          return true;
        }
      }
    }
    return false;
  }
};
function checkCircularDependencies(metaAgents, maxDepth = 3) {
  const errors = [];
  if (Object.keys(metaAgents).length === 0) {
    return errors;
  }
  const graph = new DelegationGraph(maxDepth);
  for (const [name, def] of Object.entries(metaAgents)) {
    for (const delegate of def.delegates_to) {
      graph.trackDelegation(name, delegate);
    }
    for (const rule of def.routing_rules) {
      graph.trackDelegation(name, rule.target_agent);
    }
  }
  for (const [name, def] of Object.entries(metaAgents)) {
    const path4 = [];
    for (const delegate of def.delegates_to) {
      if (graph.checkCircular(delegate, name, maxDepth)) {
        path4.push(name, delegate);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" delegates to "${delegate}" which can route back to "${name}"`,
            path4,
            [name, delegate]
          )
        );
      }
    }
    for (const rule of def.routing_rules) {
      if (graph.checkCircular(rule.target_agent, name, maxDepth)) {
        path4.push(name, rule.target_agent);
        errors.push(
          createCircularDependencyError(
            `Circular dependency detected: "${name}" can route to "${rule.target_agent}" which can route back to "${name}"`,
            path4,
            [name, rule.target_agent]
          )
        );
      }
    }
    for (const delegate of def.delegates_to) {
      if (delegate in metaAgents && delegate !== name) {
        if (graph.checkCircular(delegate, name, maxDepth)) {
          path4.push(name, delegate);
          errors.push(
            createCircularDependencyError(
              `Circular dependency detected between meta-agents: "${name}" -> "${delegate}"`,
              path4,
              [name, delegate]
            )
          );
        }
      }
    }
  }
  return errors;
}
function checkCircularDependenciesInConfig(config, context) {
  const result = createCheckResult("circular_dependency");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const maxDepth = config.settings?.max_delegation_depth ?? 3;
  const errors = checkCircularDependencies(config.meta_agents, maxDepth);
  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }
  return result;
}
function checkAgentReferences(metaAgents) {
  const errors = [];
  if (Object.keys(metaAgents).length === 0) {
    return errors;
  }
  const validAgents = /* @__PURE__ */ new Set([...BUILTIN_AGENT_NAMES, ...Object.keys(metaAgents)]);
  for (const [agentName, def] of Object.entries(metaAgents)) {
    for (const delegate of def.delegates_to) {
      if (!validAgents.has(delegate)) {
        errors.push(
          createInvalidAgentReferenceError(
            `Invalid agent reference: "${delegate}" is not a recognized agent. Valid agents are: ${[...BUILTIN_AGENT_NAMES].join(", ")}`,
            ["meta_agents", agentName, "delegates_to"],
            delegate
          )
        );
      }
    }
    for (const [ruleIndex, rule] of def.routing_rules.entries()) {
      if (!validAgents.has(rule.target_agent)) {
        errors.push(
          createInvalidAgentReferenceError(
            `Invalid agent reference: "${rule.target_agent}" is not a recognized agent. Valid agents are: ${[...BUILTIN_AGENT_NAMES].join(", ")}`,
            ["meta_agents", agentName, "routing_rules", String(ruleIndex), "target_agent"],
            rule.target_agent
          )
        );
      }
    }
  }
  return errors;
}
function checkAgentReferencesInConfig(config, context) {
  const result = createCheckResult("agent_reference");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const errors = checkAgentReferences(config.meta_agents);
  if (errors.length > 0) {
    result.passed = false;
    result.errors.push(...errors);
  } else {
    result.passed = true;
  }
  return result;
}
function analyzeRegexPattern(pattern) {
  const complexLookaround = /\(\?[=!][^)]*[+*?]\)|\(\?<[=!][^)]*[+*?]\)/.test(pattern);
  if (complexLookaround) {
    return {
      hasIssue: true,
      reason: "Complex lookaheads/lookbehinds with quantifiers can be slow"
    };
  }
  const nestedQuantifiers = /(\([^)]*[+*?][^)]*\)[+*?]|([+*?][+*?]))/.test(pattern);
  if (nestedQuantifiers) {
    return {
      hasIssue: true,
      reason: "Nested quantifiers can cause catastrophic backtracking"
    };
  }
  const overlappingAlternation = /(\w+)\|\1/.test(pattern);
  if (overlappingAlternation) {
    return {
      hasIssue: true,
      reason: "Overlapping alternation can cause inefficient backtracking"
    };
  }
  const unboundedDot = /\^\.\*|\.\*\$|\.\*$|\.\*\.\*/.test(pattern);
  if (unboundedDot) {
    return {
      hasIssue: true,
      reason: "Unbounded .* patterns can match excessively and cause performance issues"
    };
  }
  const largeRepetition = /\[[^\]]+\][+*?]*\{\d{2,}/.test(pattern);
  if (largeRepetition) {
    return {
      hasIssue: true,
      reason: "Large repetition quantifiers can cause excessive backtracking"
    };
  }
  const backreferences = /\\\d/.test(pattern);
  if (backreferences) {
    return {
      hasIssue: true,
      reason: "Backreferences prevent efficient regex compilation and can be slow"
    };
  }
  const excessiveAlternations = (pattern.match(/\|/g) || []).length > 8;
  if (excessiveAlternations) {
    return {
      hasIssue: true,
      reason: "Many alternations can cause the regex engine to try many paths"
    };
  }
  return {
    hasIssue: false,
    reason: ""
  };
}
function checkRegexPerformance(metaAgents) {
  const warnings = [];
  if (Object.keys(metaAgents).length === 0) {
    return warnings;
  }
  for (const [agentName, def] of Object.entries(metaAgents)) {
    for (const [ruleIndex, rule] of def.routing_rules.entries()) {
      if (rule.matcher.type === "regex") {
        const pattern = rule.matcher.pattern;
        const analysis = analyzeRegexPattern(pattern);
        if (analysis.hasIssue) {
          warnings.push(
            createRegexPerformanceWarning(
              `Regex pattern may cause performance issues: ${analysis.reason}`,
              ["meta_agents", agentName, "routing_rules", String(ruleIndex), "matcher", "pattern"],
              pattern,
              analysis.reason
            )
          );
        }
      }
    }
  }
  return warnings;
}
function checkRegexPerformanceInConfig(config, context) {
  const result = createCheckResult("regex_performance");
  if (!config.meta_agents || Object.keys(config.meta_agents).length === 0) {
    result.passed = true;
    return result;
  }
  const warnings = checkRegexPerformance(config.meta_agents);
  if (warnings.length > 0) {
    result.passed = true;
    result.warnings.push(...warnings);
  } else {
    result.passed = true;
  }
  return result;
}

// src/config/loader.ts
async function loadOlimpusConfig(projectDir, options) {
  const homeDir = process.env.HOME ?? ".";
  const userConfigPath = path3.join(
    homeDir,
    ".config",
    "opencode",
    "olimpus.jsonc"
  );
  const projectConfigPath = path3.join(projectDir, "olimpus.jsonc");
  let configData = {};
  if (fs3.existsSync(userConfigPath)) {
    const content = fs3.readFileSync(userConfigPath, "utf-8");
    const userConfig = parseJsonc(content, userConfigPath);
    if (userConfig) {
      configData = deepMerge(configData, userConfig);
    }
  }
  if (fs3.existsSync(projectConfigPath)) {
    const content = fs3.readFileSync(projectConfigPath, "utf-8");
    const projectConfig = parseJsonc(content, projectConfigPath);
    if (projectConfig) {
      configData = deepMerge(
        configData,
        projectConfig
      );
    }
  }
  const userConfigExists = fs3.existsSync(userConfigPath);
  const projectConfigExists = fs3.existsSync(projectConfigPath);
  if (!userConfigExists && !projectConfigExists) {
    const skipWizard = process.env.OLIMPUS_SKIP_WIZARD === "1" || process.env.OLIMPUS_SKIP_WIZARD === "true";
    const scaffoldResult = await scaffoldOlimpusConfig({
      projectConfigExists: false,
      userConfigExists: false,
      useWizard: !skipWizard
    });
    if (scaffoldResult && scaffoldResult.created) {
      const content = fs3.readFileSync(scaffoldResult.path, "utf-8");
      const scaffoldedConfig = parseJsonc(content, scaffoldResult.path);
      if (scaffoldedConfig) {
        configData = deepMerge(
          configData,
          scaffoldedConfig
        );
      }
    }
  }
  const result = OlimpusConfigSchema.safeParse(configData);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  ${issue.path.join(".")} - ${issue.message}`).join("\n");
    throw new Error(`Invalid olimpus config:
${errors}`);
  }
  const shouldValidate = options?.validate ?? true;
  if (shouldValidate) {
    const validationResult = validateOlimpusConfig(result.data, {
      checkCircularDependencies: options?.checkCircularDependencies ?? true,
      checkAgentReferences: options?.checkAgentReferences ?? true,
      checkRegexPerformance: options?.checkRegexPerformance ?? true
    });
    if (!validationResult.valid) {
      const errorMessages = formatErrors(validationResult).join("\n");
      const warningMessages = formatWarnings(validationResult).join("\n");
      const message = `Configuration validation failed:
${errorMessages}${warningMessages ? `

Warnings:
${warningMessages}` : ""}`;
      throw new Error(message);
    }
    if (validationResult.warnings.length > 0) {
      const warningMessages = formatWarnings(validationResult).join("\n");
    }
  }
  return result.data;
}
function parseJsonc(content, filePath) {
  const errors = [];
  const parsed = parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const errorMessages = errors.map((err) => {
      const line = content.substring(0, err.offset).split("\n").length;
      return `  Offset ${err.offset} (line ${line}): error code ${err.error}`;
    }).join("\n");
    throw new Error(`JSONC parse error in ${filePath}:
${errorMessages}`);
  }
  return parsed;
}
function deepMerge(target, source) {
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
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/config/translator.ts
function translateToOMOConfig(config) {
  return {
    agents: config.agents ?? {},
    categories: config.categories ?? {},
    disabled_hooks: config.disabled_hooks ?? []
  };
}
function extractMetaAgentDefs(config) {
  return config.meta_agents ?? {};
}

// src/plugin/wrapper.ts
import OhMyOpenCodePlugin from "oh-my-opencode";
async function createOlimpusWrapper(input, config) {
  const omoConfig = translateToOMOConfig(config);
  const omoPluginInterface = await OhMyOpenCodePlugin(input);
  const metaAgents = extractMetaAgentDefs(config);
  const olimpusExtension = createOlimpusExtension(metaAgents, omoConfig);
  const mergedInterface = mergePluginInterfaces(
    omoPluginInterface,
    olimpusExtension
  );
  return mergedInterface;
}
function createOlimpusExtension(metaAgents, omoConfig) {
  return {
    config: async (input) => {
    }
  };
}
function mergePluginInterfaces(base, extension) {
  const merged = {};
  if (base.tool || extension.tool) {
    merged.tool = {
      ...base.tool,
      ...extension.tool
    };
  }
  if (base.config || extension.config) {
    merged.config = async (input) => {
      if (base.config) {
        await base.config(input);
      }
      if (extension.config) {
        await extension.config(input);
      }
    };
  }
  if (base.event || extension.event) {
    merged.event = async (input) => {
      if (base.event) {
        await base.event(input);
      }
      if (extension.event) {
        await extension.event(input);
      }
    };
  }
  const hookNames = [
    "chat.message",
    "chat.params",
    "chat.headers",
    "permission.ask",
    "command.execute.before",
    "tool.execute.before",
    "shell.env",
    "tool.execute.after",
    "experimental.chat.messages.transform",
    "experimental.chat.system.transform",
    "experimental.session.compacting",
    "experimental.text.complete"
  ];
  for (const hookName of hookNames) {
    const baseHook = base[hookName];
    const extensionHook = extension[hookName];
    if (baseHook || extensionHook) {
      merged[hookName] = async (...args) => {
        if (baseHook) {
          await baseHook(...args);
        }
        if (extensionHook) {
          await extensionHook(...args);
        }
      };
    }
  }
  if (base.auth || extension.auth) {
    merged.auth = extension.auth ?? base.auth;
  }
  return merged;
}

// src/agents/routing.ts
import { existsSync as existsSync4 } from "fs";
function evaluateRoutingRules(rules, context, logger, captureEvaluations) {
  const isDebugMode = logger?.isDebugMode() ?? false;
  const shouldCapture = captureEvaluations || isDebugMode;
  const evaluations = [];
  let firstMatch = null;
  for (const rule of rules) {
    const matched = evaluateMatcher(rule.matcher, context);
    if (shouldCapture) {
      evaluations.push({
        matcher_type: rule.matcher.type,
        matcher: rule.matcher,
        matched
      });
    }
    if (matched && !firstMatch) {
      const matchedContent = getMatchedContent(rule.matcher, context);
      firstMatch = {
        target_agent: rule.target_agent,
        matcher_type: rule.matcher.type,
        matched_content: matchedContent,
        config_overrides: rule.config_overrides
      };
      if (!isDebugMode) {
        if (logger && logger.isEnabled()) {
          logger.logRoutingDecision(
            firstMatch.target_agent,
            rule.matcher.type,
            matchedContent,
            firstMatch.config_overrides,
            void 0
          );
        }
        if (shouldCapture) {
          return { route: firstMatch, evaluations };
        }
        return firstMatch;
      }
    }
  }
  if (firstMatch && logger && logger.isEnabled()) {
    logger.logRoutingDecision(
      firstMatch.target_agent,
      firstMatch.matcher_type,
      firstMatch.matched_content,
      firstMatch.config_overrides,
      isDebugMode ? evaluations : void 0
    );
  }
  if (shouldCapture) {
    return { route: firstMatch, evaluations };
  }
  return firstMatch;
}
function getMatchedContent(matcher, context) {
  switch (matcher.type) {
    case "keyword": {
      const promptLower = context.prompt.toLowerCase();
      const matchedKeywords = matcher.keywords.filter(
        (kw) => promptLower.includes(kw.toLowerCase())
      );
      return `matched keywords: ${matchedKeywords.join(", ")}`;
    }
    case "regex":
      return `matched pattern: /${matcher.pattern}/${matcher.flags || ""}`;
    case "complexity":
      return `complexity score >= ${matcher.threshold}`;
    case "project_context":
      const fileMatches = matcher.has_files && matcher.has_files.length > 0 ? `files: ${matcher.has_files.join(", ")}` : "";
      const depMatches = matcher.has_deps && matcher.has_deps.length > 0 ? `deps: ${matcher.has_deps.join(", ")}` : "";
      const parts = [fileMatches, depMatches].filter(Boolean);
      return parts.length > 0 ? parts.join("; ") : "project context match";
    case "always":
      return "always match";
    default:
      const exhaustive = matcher;
      throw new Error(`Unknown matcher type: ${exhaustive}`);
  }
}
function evaluateMatcher(matcher, context) {
  switch (matcher.type) {
    case "keyword":
      return evaluateKeywordMatcher(matcher, context);
    case "complexity":
      return evaluateComplexityMatcher(matcher, context);
    case "regex":
      return evaluateRegexMatcher(matcher, context);
    case "project_context":
      return evaluateProjectContextMatcher(matcher, context);
    case "always":
      return evaluateAlwaysMatcher(matcher, context);
    default:
      const exhaustive = matcher;
      throw new Error(`Unknown matcher type: ${exhaustive}`);
  }
}
function evaluateKeywordMatcher(matcher, context) {
  const prompt = context.prompt.toLowerCase();
  const keywords = matcher.keywords.map((kw) => kw.toLowerCase());
  if (matcher.mode === "any") {
    return keywords.some((kw) => prompt.includes(kw));
  } else {
    return keywords.every((kw) => prompt.includes(kw));
  }
}
function evaluateComplexityMatcher(matcher, context) {
  const complexity = calculateComplexity(context.prompt);
  const thresholdMap = {
    low: 2,
    medium: 5,
    high: 10
  };
  const threshold = thresholdMap[matcher.threshold] ?? 0;
  return complexity >= threshold;
}
function calculateComplexity(prompt) {
  const lines = prompt.split("\n").length;
  let score = Math.ceil(lines / 10);
  const technicalKeywords = [
    "architecture",
    "performance",
    "optimization",
    "database",
    "async",
    "concurrent",
    "algorithm",
    "data structure",
    "api",
    "integration",
    "security",
    "encryption",
    "authentication",
    "deployment",
    "infrastructure",
    "testing",
    "refactor",
    "debug",
    "trace",
    "profile"
  ];
  const promptLower = prompt.toLowerCase();
  const keywordCount = technicalKeywords.filter(
    (kw) => promptLower.includes(kw)
  ).length;
  score += keywordCount;
  return score;
}
function evaluateRegexMatcher(matcher, context) {
  try {
    const regex = new RegExp(matcher.pattern, matcher.flags || "i");
    return regex.test(context.prompt);
  } catch (error) {
    console.error(
      `Invalid regex pattern: ${matcher.pattern}`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
function evaluateProjectContextMatcher(matcher, context) {
  if (matcher.has_files && matcher.has_files.length > 0) {
    const filesMatch = matcher.has_files.every((filePath) => {
      const fullPath = `${context.projectDir}/${filePath}`;
      return existsSync4(fullPath);
    });
    if (!filesMatch) {
      return false;
    }
  }
  if (matcher.has_deps && matcher.has_deps.length > 0) {
    const depsMatch = matcher.has_deps.every((dep) => {
      return context.projectDeps?.includes(dep) ?? false;
    });
    if (!depsMatch) {
      return false;
    }
  }
  return true;
}
function evaluateAlwaysMatcher(matcher, context) {
  return true;
}

// src/agents/meta-agent.ts
function createMetaAgentConfig(def, context, metaAgentName, logger) {
  const route = evaluateRoutingRules(def.routing_rules, context, logger);
  if (!route) {
    return null;
  }
  const delegationPrompt = buildDelegationPrompt(
    metaAgentName,
    route.target_agent,
    context.prompt
  );
  const model = route.config_overrides?.model || def.base_model;
  const temperature = route.config_overrides?.temperature || def.temperature;
  const agentConfig = {
    model,
    prompt: delegationPrompt,
    ...temperature !== void 0 && { temperature },
    ...route.config_overrides?.variant && {
      variant: route.config_overrides.variant
    }
  };
  return agentConfig;
}
function buildDelegationPrompt(metaAgentName, targetAgent, originalPrompt) {
  return `You are ${metaAgentName}, a meta-agent coordinator for the Olimpus plugin system.

Your role is to analyze the user's request and delegate it to the appropriate specialized agent.

Based on the user's request, you have determined that this task should be handled by the "${targetAgent}" agent.

**User Request:**
${originalPrompt}

**Your Task:**
1. Understand the user's request above
2. Use the \`task\` tool to delegate this work to the "${targetAgent}" agent
3. Include the full user request in the task delegation
4. Return the result from the ${targetAgent} agent to the user

The task tool accepts:
- agent: "${targetAgent}"
- prompt: The user's request (pass it through as-is)

Delegate this task now using the available task tool.`;
}

// src/agents/logger.ts
import { dirname as dirname3 } from "path";
import { mkdirSync as mkdirSync3, appendFileSync } from "fs";
var RoutingLogger = class {
  config;
  enabled;
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      output: config.output ?? "console",
      log_file: config.log_file ?? "routing.log",
      debug_mode: config.debug_mode ?? false
    };
    this.enabled = this.config.enabled && this.config.output !== "disabled";
  }
  /**
   * Logs a routing decision with structured JSON format
   * Includes timestamp, matcher type, matched content, and selected agent
   */
  logRoutingDecision(targetAgent, matcherType, matchedContent, configOverrides, allEvaluations) {
    if (!this.enabled) {
      return;
    }
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      target_agent: targetAgent,
      matcher_type: matcherType,
      matched_content: matchedContent,
      config_overrides: configOverrides
    };
    if (this.config.debug_mode && allEvaluations) {
      entry.debug_info = {
        all_evaluated: allEvaluations,
        total_evaluated: allEvaluations.length
      };
    }
    const logLine = JSON.stringify(entry);
    try {
      switch (this.config.output) {
        case "console":
          console.log(logLine);
          break;
        case "file":
          this.writeToFile(logLine);
          break;
        case "disabled":
          break;
        default:
          break;
      }
    } catch (error) {
    }
  }
  /**
   * Writes a log line to the configured log file
   * Appends to existing file with newline separator
   */
  writeToFile(logLine) {
    try {
      const dir = dirname3(this.config.log_file);
      try {
        mkdirSync3(dir, { recursive: true });
      } catch {
      }
      appendFileSync(this.config.log_file, logLine + "\n");
    } catch (error) {
    }
  }
  /**
   * Checks if logging is currently enabled
   */
  isEnabled() {
    return this.enabled;
  }
  /**
   * Checks if debug mode is enabled
   */
  isDebugMode() {
    return this.config.debug_mode;
  }
};

// src/agents/registry.ts
var MetaAgentRegistry = class {
  definitions = /* @__PURE__ */ new Map();
  delegations = {};
  maxDepth;
  logger;
  analyticsStorage;
  constructor(maxDepth = 3, loggerConfig, analyticsStorage) {
    this.maxDepth = maxDepth;
    this.analyticsStorage = analyticsStorage;
    if (loggerConfig) {
      this.logger = new RoutingLogger(loggerConfig);
    }
  }
  /**
   * Register a meta-agent definition
   */
  register(name, def) {
    this.definitions.set(name, def);
  }
  /**
   * Get all registered meta-agent definitions
   */
  getAll() {
    const result = {};
    for (const [name, def] of this.definitions.entries()) {
      result[name] = def;
    }
    return result;
  }
  /**
   * Resolve a meta-agent to its AgentConfig by evaluating routing rules
   * Returns null if no route matches
   */
  resolve(name, context) {
    const def = this.definitions.get(name);
    if (!def) {
      throw new Error(`Meta-agent "${name}" not registered`);
    }
    return createMetaAgentConfig(def, context, name, this.logger);
  }
  /**
   * Track a delegation from one agent to another
   * Used for circular dependency detection
   */
  trackDelegation(from, to) {
    const key = `${from}:${to}`;
    this.delegations[key] = (this.delegations[key] ?? 0) + 1;
  }
  /**
   * Check if a delegation would create a circular dependency
   * Returns true if circular, false if safe
   */
  checkCircular(from, to, maxDepth = this.maxDepth) {
    return this.hasCircle(from, to, maxDepth, /* @__PURE__ */ new Set());
  }
  /**
   * Recursively check for circular paths in delegation chain
   * @param current - Current agent in the chain
   * @param target - Target agent we're trying to reach
   * @param depth - Remaining depth to search
   * @param visited - Set of visited nodes to detect cycles
   * @returns true if a circular path exists, false otherwise
   */
  hasCircle(current, target, depth, visited) {
    if (depth <= 0) {
      return false;
    }
    if (visited.has(current)) {
      return true;
    }
    if (current === target) {
      return true;
    }
    visited.add(current);
    for (const [delegation, _count] of Object.entries(this.delegations)) {
      const [from, next] = delegation.split(":");
      if (from === current && next) {
        if (this.hasCircle(next, target, depth - 1, new Set(visited))) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Get current delegation depth (longest chain tracked)
   */
  getMaxTrackedDepth() {
    let maxDepth = 0;
    for (const delegation of Object.keys(this.delegations)) {
      const parts = delegation.split(":");
      if (parts.length === 2) {
        let depth = 1;
        let current = parts[1];
        while (true) {
          let found = false;
          for (const next of Object.keys(this.delegations)) {
            const [from, to] = next.split(":");
            if (from === current) {
              depth++;
              current = to;
              found = true;
              break;
            }
          }
          if (!found) break;
        }
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }
};

// src/agents/definitions/atenea.ts
var ateneo = {
  base_model: "",
  // Uses default from config
  delegates_to: [
    "librarian",
    "explore",
    "oracle",
    "sisyphus",
    "hephaestus",
    "prometheus",
    "atlas",
    "metis"
  ],
  routing_rules: [
    // Jira-related routing (coordinated with Hermes patterns)
    {
      matcher: {
        type: "keyword",
        keywords: ["jira", "ticket", "task", "subtask", "story", "issue", "sprint", "backlog"],
        mode: "any"
      },
      target_agent: "librarian",
      config_overrides: {
        prompt: "You are a Jira lifecycle research specialist. Search for relevant documentation, existing tickets, related issues, and project context to support this Jira-related request. Consider ticket states, workflow transitions, and integration requirements."
      }
    },
    // Framework modification routing (coordinated with Hades patterns)
    {
      matcher: {
        type: "project_context",
        has_files: ["src/config/", "src/agents/", "src/plugin/"]
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a framework validation strategist. Analyze this framework modification considering: impact on existing features, workflow disruptions, agent delegation chains, and configuration consistency. Recommend safe implementation approaches."
      }
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "framework",
          "validation",
          "config",
          "schema",
          "agent definition",
          "routing rule",
          "registry"
        ],
        mode: "any"
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a framework coherence analyst. Evaluate this framework-related request for: backward compatibility, impact on existing agents, routing integrity, and configuration stability."
      }
    },
    // Complexity-based strategic routing
    {
      matcher: {
        type: "complexity",
        threshold: "high"
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a strategic architecture advisor. Analyze this complex problem from first principles, considering system design patterns, scalability, maintainability, and long-term implications."
      }
    },
    {
      matcher: {
        type: "complexity",
        threshold: "medium"
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt: "You are a technical strategist. Analyze this problem considering trade-offs, patterns, and best practices. Focus on pragmatic solutions aligned with industry standards."
      }
    },
    {
      matcher: {
        type: "complexity",
        threshold: "low"
      },
      target_agent: "atlas",
      config_overrides: {
        prompt: "You are a technical advisor. Provide clear analysis and guidance on this straightforward technical question."
      }
    },
    // Always fallback for general analysis
    {
      matcher: {
        type: "always"
      },
      target_agent: "metis",
      config_overrides: {
        prompt: "You are a general technical analyst. Synthesize information and provide comprehensive strategic analysis."
      }
    }
  ],
  prompt_template: "Analyze this strategic and architectural question: {input}\n\nProvide analysis considering:\n- System design principles\n- Scalability and performance\n- Maintainability and technical debt\n- Trade-offs and alternatives"
};

// src/agents/definitions/hermes.ts
var hermes = {
  base_model: "",
  delegates_to: ["librarian", "explore", "oracle"],
  routing_rules: [
    {
      matcher: {
        type: "keyword",
        keywords: [
          "jira",
          "ticket",
          "task",
          "subtask",
          "story",
          "issue",
          "sprint",
          "backlog",
          "epic"
        ],
        mode: "any"
      },
      target_agent: "librarian",
      config_overrides: {
        prompt: "You are a Jira lifecycle management specialist. Research and gather information about Jira tickets, tasks, subtasks, user stories, epics, and sprints. Use available Jira API tools to fetch, search, or analyze Jira issues and projects."
      }
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["docs", "documentation", "guide", "search", "lookup"],
        mode: "any"
      },
      target_agent: "librarian",
      config_overrides: {
        prompt: "You are a research specialist focused on finding and synthesizing documentation. Search comprehensively for relevant documentation, guides, and examples."
      }
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["code", "find", "search", "locate", "where is"],
        mode: "any"
      },
      target_agent: "explore",
      config_overrides: {
        prompt: "You are a code explorer. Search the codebase comprehensively to find relevant code, patterns, and implementations."
      }
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["analyze", "review", "compare", "evaluate", "assess"],
        mode: "any"
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a comprehensive analyst. Review and analyze the gathered information, providing deep insights and comparisons."
      }
    },
    {
      matcher: {
        type: "always"
      },
      target_agent: "librarian",
      config_overrides: {
        prompt: "You are a research specialist. Gather relevant information from available sources and synthesize it into a coherent answer."
      }
    }
  ],
  prompt_template: "Research and gather information on: {input}\n\nProvide:\n- Relevant documentation and resources\n- Current best practices\n- Practical examples\n- Synthesis of findings"
};

// src/agents/definitions/hades.ts
var hades = {
  base_model: "",
  delegates_to: ["oracle", "sisyphus", "hephaestus"],
  routing_rules: [
    {
      matcher: {
        type: "regex",
        pattern: "src/config/.*\\.ts"
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a framework validation specialist. Analyze this configuration change carefully, considering impacts on: existing schemas, agent definitions, routing rules, and plugin behavior. Ensure backward compatibility and validate that changes don't break existing workflows.",
        variant: "validation"
      }
    },
    {
      matcher: {
        type: "regex",
        pattern: "src/agents/.*\\.ts"
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt: "You are a framework agent specialist. Modify agent definitions with care, ensuring routing rules remain valid, delegation targets exist, and matcher logic is correct. Test changes thoroughly and verify no circular delegation is introduced.",
        variant: "validation"
      }
    },
    {
      matcher: {
        type: "regex",
        pattern: "src/plugin/.*\\.ts"
      },
      target_agent: "hephaestus",
      config_overrides: {
        prompt: "You are a plugin infrastructure specialist. Implement plugin changes with attention to: lifecycle hooks, error handling, registration patterns, and integration points. Ensure changes maintain plugin compatibility.",
        variant: "validation"
      }
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "config",
          "schema",
          "agent",
          "routing",
          "definition",
          "plugin",
          "framework",
          "validation",
          "registry"
        ],
        mode: "any"
      },
      target_agent: "oracle",
      config_overrides: {
        prompt: "You are a framework coherence analyst. Analyze this framework-related change considering: impacts on existing features, workflow disruptions, agent delegation chains, and configuration consistency. Provide recommendations for safe implementation."
      }
    },
    {
      matcher: {
        type: "always"
      },
      target_agent: "hephaestus",
      config_overrides: {
        prompt: "You are a framework builder. Implement this change with careful attention to maintaining framework stability, backward compatibility, and proper integration with existing systems."
      }
    }
  ],
  prompt_template: "Validate and implement this framework modification: {input}\n\nConsider:\n- Impact on existing features and workflows\n- Backward compatibility\n- Agent delegation chains\n- Configuration consistency\n- Error handling and edge cases"
};

// src/skills/loader.ts
import { existsSync as existsSync5, readFileSync as readFileSync2 } from "fs";
import { resolve, extname } from "path";
var FRONTMATTER_DELIMITER = "---";
var OLIMPUS_PREFIX = "olimpus:";
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
    return {
      metadata: {},
      template: content
    };
  }
  let endDelimiterIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === FRONTMATTER_DELIMITER) {
      endDelimiterIdx = i;
      break;
    }
  }
  if (endDelimiterIdx === -1) {
    return {
      metadata: {},
      template: content
    };
  }
  const frontmatterLines = lines.slice(1, endDelimiterIdx);
  const metadata = parseFrontmatterLines(frontmatterLines);
  const template = lines.slice(endDelimiterIdx + 1).join("\n").trim();
  return { metadata, template };
}
function parseFrontmatterLines(lines) {
  const metadata = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) {
      continue;
    }
    const key = trimmed.substring(0, colonIdx).trim();
    const value = trimmed.substring(colonIdx + 1).trim();
    metadata[key] = parseYamlValue(value);
  }
  return metadata;
}
function parseYamlValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    const items = value.slice(1, -1).split(",").map((item) => {
      const trimmed = item.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1);
      }
      return trimmed;
    });
    return items.filter((item) => item.length > 0);
  }
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}
function extractSkillName(filePath) {
  const fileName = filePath.split("/").pop() || "";
  return fileName.replace(/\.[^.]+$/, "");
}
function loadOlimpusSkills(skillPaths, projectDir) {
  const skills = [];
  for (const skillPath of skillPaths) {
    const resolvedPath = skillPath.startsWith("/") ? skillPath : resolve(projectDir, skillPath);
    if (!existsSync5(resolvedPath)) {
      console.warn(`Skill file not found: ${resolvedPath}`);
      continue;
    }
    if (extname(resolvedPath) !== ".md") {
      console.warn(`Skipping non-markdown file: ${resolvedPath}`);
      continue;
    }
    try {
      const content = readFileSync2(resolvedPath, "utf-8");
      const { metadata, template } = parseFrontmatter(content);
      const baseName = extractSkillName(resolvedPath);
      const skillName = `${OLIMPUS_PREFIX}${baseName}`;
      const definition = {
        name: skillName,
        description: metadata.description,
        template,
        agent: metadata.agent,
        model: metadata.model,
        subtask: metadata.subtask,
        argumentHint: metadata["argument-hint"] ? String(metadata["argument-hint"]) : void 0
      };
      let allowedTools;
      if (metadata["allowed-tools"]) {
        allowedTools = Array.isArray(metadata["allowed-tools"]) ? metadata["allowed-tools"] : String(metadata["allowed-tools"]).split(",").map((t) => t.trim());
      }
      const skill = {
        name: skillName,
        path: skillPath,
        resolvedPath,
        definition,
        scope: "olimpus",
        license: metadata.license ? String(metadata.license) : void 0,
        compatibility: metadata.compatibility ? String(metadata.compatibility) : void 0,
        metadata: metadata.metadata,
        allowedTools
      };
      skills.push(skill);
    } catch (error) {
      console.error(
        `Error loading skill from ${resolvedPath}:`,
        error instanceof Error ? error.message : String(error)
      );
      continue;
    }
  }
  return skills;
}

// src/analytics/storage.ts
import { dirname as dirname4 } from "path";
import { mkdirSync as mkdirSync4, existsSync as existsSync6, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "fs";
var CURRENT_VERSION = "1.0.0";
var AnalyticsStorage = class {
  config;
  enabled;
  storageFilePath;
  inMemoryEvents = [];
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storage_file: config.storage_file ?? "analytics.json",
      max_events: config.max_events ?? 1e4,
      retention_days: config.retention_days ?? 90,
      auto_prune: config.auto_prune ?? true
    };
    this.enabled = this.config.enabled;
    this.storageFilePath = this.config.storage_file;
    this.loadFromFile();
  }
  /**
   * Records an analytics event to storage
   * Triggers automatic pruning if enabled
   */
  recordEvent(event) {
    if (!this.enabled) {
      return;
    }
    try {
      this.inMemoryEvents.push(event);
      if (this.config.auto_prune) {
        this.pruneEvents();
      }
      this.saveToFile();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Analytics] Failed to record event: ${message}`);
    }
  }
  /**
   * Retrieves all stored events
   */
  getAllEvents() {
    if (!this.enabled) {
      return [];
    }
    return [...this.inMemoryEvents];
  }
  /**
   * Retrieves events within a date range
   */
  getEventsByDateRange(startDate, endDate) {
    if (!this.enabled) {
      return [];
    }
    const start = startDate.getTime();
    const end = endDate.getTime();
    return this.inMemoryEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }
  /**
   * Retrieves events for a specific agent
   */
  getEventsByAgent(agentName) {
    if (!this.enabled) {
      return [];
    }
    return this.inMemoryEvents.filter((event) => {
      return event.type === "routing_decision" && event.target_agent === agentName;
    });
  }
  /**
   * Retrieves events for a specific matcher type
   */
  getEventsByMatcherType(matcherType) {
    if (!this.enabled) {
      return [];
    }
    return this.inMemoryEvents.filter((event) => {
      return event.type === "routing_decision" && event.matcher_type === matcherType;
    });
  }
  /**
   * Retrieves unmatched request events
   */
  getUnmatchedRequests() {
    if (!this.enabled) {
      return [];
    }
    return this.inMemoryEvents.filter((event) => {
      return event.type === "unmatched_request";
    });
  }
  /**
   * Returns the total count of stored events
   */
  getEventCount() {
    if (!this.enabled) {
      return 0;
    }
    return this.inMemoryEvents.length;
  }
  /**
   * Prunes events based on retention days and max_events limit
   * Removes events older than retention_days
   * Removes excess events if count exceeds max_events
   */
  pruneEvents() {
    if (!this.enabled || this.inMemoryEvents.length === 0) {
      return;
    }
    const now = Date.now();
    const retentionMs = this.config.retention_days * 24 * 60 * 60 * 1e3;
    const retentionThreshold = now - retentionMs;
    const afterRetention = this.inMemoryEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= retentionThreshold;
    });
    if (afterRetention.length > this.config.max_events) {
      const excessCount = afterRetention.length - this.config.max_events;
      afterRetention.splice(0, excessCount);
    }
    this.inMemoryEvents = afterRetention;
  }
  /**
   * Clears all stored events
   */
  clear() {
    if (!this.enabled) {
      return;
    }
    try {
      this.inMemoryEvents = [];
      this.saveToFile();
    } catch {
    }
  }
  /**
   * Exports all data in AnalyticsData format
   */
  exportData() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const sortedEvents = [...this.inMemoryEvents].sort(
      (a, b) => a.timestamp.localeCompare(b.timestamp)
    );
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const firstTimestamp = firstEvent?.timestamp;
    const lastTimestamp = lastEvent?.timestamp;
    return {
      events: sortedEvents,
      agent_metrics: {},
      matcher_metrics: {},
      total_events: sortedEvents.length,
      first_event_timestamp: firstTimestamp,
      last_event_timestamp: lastTimestamp,
      version: CURRENT_VERSION
    };
  }
  /**
   * Checks if storage is enabled
   */
  isEnabled() {
    return this.enabled;
  }
  /**
   * Loads events from the storage file
   * Populates in-memory cache with existing data
   */
  loadFromFile() {
    if (!this.enabled) {
      return;
    }
    try {
      const fileExists = existsSync6(this.storageFilePath);
      if (!fileExists) {
        this.inMemoryEvents = [];
        return;
      }
      const content = readFileSync3(this.storageFilePath, "utf-8");
      const data = JSON.parse(content);
      if (Array.isArray(data.events)) {
        this.inMemoryEvents = data.events;
      } else {
        this.inMemoryEvents = [];
      }
      if (this.config.auto_prune) {
        this.pruneEvents();
      }
    } catch {
      this.inMemoryEvents = [];
    }
  }
  /**
   * Saves current events to the storage file
   * Writes in AnalyticsData format with metadata
   */
  saveToFile() {
    if (!this.enabled) {
      return;
    }
    try {
      const dir = dirname4(this.storageFilePath);
      try {
        mkdirSync4(dir, { recursive: true });
      } catch {
      }
      const data = this.exportData();
      const json = JSON.stringify(data, null, 2);
      writeFileSync3(this.storageFilePath, json, "utf-8");
    } catch {
    }
  }
};

// src/index.ts
import { join as join4 } from "path";
var OlimpusPlugin = async (input) => {
  let config;
  try {
    config = await loadOlimpusConfig(input.directory);
  } catch (error) {
    throw new Error(
      `[Olimpus] Failed to load olimpus.jsonc: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const maxDepth = config.settings?.max_delegation_depth ?? 3;
  const loggerConfig = config.settings?.routing_logger;
  let analyticsStorage;
  const analyticsConfig = config.settings?.routing_logger?.analytics_config;
  if (analyticsConfig?.enabled) {
    const storageFile = analyticsConfig.storage_file ? join4(input.directory, analyticsConfig.storage_file) : join4(input.directory, "analytics.json");
    analyticsStorage = new AnalyticsStorage({
      enabled: true,
      storage_file: storageFile,
      max_events: analyticsConfig.max_events ?? 1e4,
      retention_days: analyticsConfig.retention_days ?? 90,
      auto_prune: analyticsConfig.auto_prune ?? true
    });
  }
  const registry = new MetaAgentRegistry(maxDepth, loggerConfig, analyticsStorage);
  const configMetaAgents = extractMetaAgentDefs(config);
  for (const [name, def] of Object.entries(configMetaAgents)) {
    registry.register(name, def);
  }
  const builtInMetaAgents = [
    { name: "olimpus:atenea", def: ateneo },
    { name: "olimpus:hermes", def: hermes },
    { name: "olimpus:hades", def: hades }
  ];
  for (const { name, def } of builtInMetaAgents) {
    if (!configMetaAgents[name]) {
      registry.register(name, def);
    }
  }
  let pluginInterface;
  try {
    pluginInterface = await createOlimpusWrapper(input, config);
  } catch (error) {
    throw new Error(
      `[Olimpus] Failed to initialize oh-my-opencode wrapper: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const baseConfigHandler = pluginInterface.config;
  const namespace = config.settings?.namespace_prefix ?? "olimpus";
  pluginInterface.config = async (configInput) => {
    if (baseConfigHandler) {
      await baseConfigHandler(configInput);
    }
    const routingContext = {
      prompt: "",
      projectDir: input.directory,
      projectFiles: [],
      projectDeps: []
    };
    const allMetaAgents = registry.getAll();
    for (const [agentName] of Object.entries(allMetaAgents)) {
      const agentConfig = registry.resolve(agentName, routingContext);
      if (agentConfig && configInput.agent) {
        configInput.agent[agentName] = agentConfig;
      }
    }
  };
  if (config.skills && config.skills.length > 0) {
    try {
      const olimpusSkills = loadOlimpusSkills(config.skills, input.directory);
      if (olimpusSkills.length > 0) {
        console.log(
          `[Olimpus] Loaded ${olimpusSkills.length} Olimpus skills with ${namespace}: prefix`
        );
      }
    } catch (error) {
      console.warn(
        `[Olimpus] Failed to load skills: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return pluginInterface;
};
var src_default = OlimpusPlugin;
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
