import { z } from "zod";

/**
 * Builtin agent names that can be delegation targets
 */
const BUILTIN_AGENT_NAMES = [
  "sisyphus",
  "hephaestus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "prometheus",
] as const;

/**
 * Matcher Schemas - Discriminated Union
 */

export const KeywordMatcherSchema = z.object({
  type: z.literal("keyword"),
  keywords: z.array(z.string()).min(1),
  mode: z.enum(["any", "all"]),
});

export const ComplexityMatcherSchema = z.object({
  type: z.literal("complexity"),
  threshold: z.enum(["low", "medium", "high"]),
});

export const RegexMatcherSchema = z.object({
  type: z.literal("regex"),
  pattern: z.string().min(1),
  flags: z.string().optional(),
});

export const ProjectContextMatcherSchema = z.object({
  type: z.literal("project_context"),
  has_files: z.array(z.string()).optional(),
  has_deps: z.array(z.string()).optional(),
});

export const AlwaysMatcherSchema = z.object({
  type: z.literal("always"),
});

export const MatcherSchema = z.discriminatedUnion("type", [
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  RegexMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema,
]);

/**
 * Routing Rule Schema
 */

export const RoutingRuleSchema = z.object({
  matcher: MatcherSchema,
  target_agent: z.string(),
  config_overrides: z
    .object({
      model: z.string().optional(),
      temperature: z.number().optional(),
      prompt: z.string().optional(),
      variant: z.string().optional(),
    })
    .optional(),
});

/**
 * Meta-Agent Definition Schema
 */

export const MetaAgentSchema = z.object({
  base_model: z.string(),
  delegates_to: z.array(z.string()).min(1),
  routing_rules: z.array(RoutingRuleSchema).min(1),
  prompt_template: z.string().optional(),
  temperature: z.number().optional(),
});

/**
 * Agent Overrides Schema (passthrough for oh-my-opencode compatibility)
 * Simplified version supporting core fields only
 */

export const AgentOverrideSchema = z.object({
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  prompt: z.string().optional(),
  skills: z.array(z.string()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
});

export const AgentOverridesSchema = z
  .record(z.string(), AgentOverrideSchema)
  .optional();

/**
 * Category Config Schema (passthrough for oh-my-opencode compatibility)
 * Simplified version supporting core fields only
 */

export const CategoryConfigSchema = z.object({
  description: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export const CategoriesSchema = z
  .record(z.string(), CategoryConfigSchema)
  .optional();

/**
 * Provider Configuration Schema
 */

export const ProviderConfigSchema = z.object({
  priority_chain: z.array(z.string()).optional(),
  research_providers: z.array(z.string()).optional(),
  strategy_providers: z.array(z.string()).optional(),
  config: z
    .record(
      z.string(),
      z.record(z.string(), z.string().or(z.boolean()).or(z.number())).optional()
    )
    .optional(),
});

/**
 * Analytics Configuration Schema
 * Note: This is a simplified version for RoutingLogger integration
 */

export const RoutingAnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storage_file: z.string().default("analytics.json"),
  max_events: z.number().int().positive().default(10000),
  retention_days: z.number().int().positive().default(90),
  auto_prune: z.boolean().default(true),
});

/**
 * Routing Logger Configuration Schema
 */

export const RoutingLoggerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  output: z.enum(["console", "file", "disabled"]).optional(),
  log_file: z.string().optional(),
  debug_mode: z.boolean().optional(),
  analytics_config: RoutingAnalyticsConfigSchema.optional(),
});

/**
 * Analytics Configuration Schema
 */

export const AnalyticsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  storage: z
    .object({
      type: z.enum(["memory", "file", "database"]).optional(),
      path: z.string().optional(),
      retention_days: z.number().int().positive().optional(),
    })
    .optional(),
  metrics: z
    .object({
      track_routing_decisions: z.boolean().optional(),
      track_execution_time: z.boolean().optional(),
      track_agent_usage: z.boolean().optional(),
      track_model_costs: z.boolean().optional(),
      track_success_rates: z.boolean().optional(),
    })
    .optional(),
  aggregation: z
    .object({
      enabled: z.boolean().optional(),
      window_minutes: z.number().int().positive().optional(),
      include_percentiles: z.boolean().optional(),
    })
    .optional(),
});



/**
 * Olimpus Settings Schema (Extended with oh-my-opencode integration)
 */

export const SettingsSchema = z.object({
  namespace_prefix: z.string().default("olimpus"),
  max_delegation_depth: z.number().int().positive().default(3),

  // Background parallelization
  background_parallelization: z
    .object({
      enabled: z.boolean().optional(),
      max_parallel_tasks: z.number().int().positive().optional(),
      timeout_ms: z.number().int().positive().optional(),
    })
    .optional(),

  // Adaptive model selection
  adaptive_model_selection: z
    .object({
      enabled: z.boolean().optional(),
      research_model: z.string().optional(),
      strategy_model: z.string().optional(),
      default_model: z.string().optional(),
    })
    .optional(),

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
  analytics: AnalyticsConfigSchema.optional(),
});

/**
 * Olimpus Config Schema - Top Level
 */

export const OlimpusConfigSchema = z.object({
  // Olimpus-specific sections
  meta_agents: z.record(z.string(), MetaAgentSchema).optional(),
  providers: ProviderConfigSchema.optional(),
  settings: SettingsSchema.optional(),
  skills: z.array(z.string()).optional(),
  // oh-my-opencode passthrough sections
  agents: AgentOverridesSchema,
  categories: CategoriesSchema,
  disabled_hooks: z.array(z.string()).optional(),
});

/**
 * Project Override Schema
 * Allows project-specific overrides to shared configurations
 */
export const ProjectOverrideSchema = z.object({
  // Meta-agent overrides
  meta_agents: z.record(z.string(), MetaAgentSchema.partial()).optional(),
  providers: ProviderConfigSchema.partial().optional(),
  settings: SettingsSchema.partial().optional(),
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesSchema.optional(),
  skills: z.array(z.string()).optional(),
});

/**
 * Project Configuration Schema
 * Defines the configuration for an individual project
 */
export const ProjectConfigSchema = z.object({
  // Unique project identifier
  project_id: z.string().min(1),
  name: z.string().optional(),
  path: z.string().optional(),
  overrides: ProjectOverrideSchema.optional(),
  metadata: z
    .object({
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
    })
    .optional(),
  // Analytics configuration for this project
  analytics_enabled: z.boolean().default(true),
});

/**
 * Shared Configuration Schema
 * Defines shared configurations that can be inherited by projects
 */
export const SharedConfigSchema = z.object({
  // Base configuration that all projects inherit
  base_config: OlimpusConfigSchema.optional(),
  default_project: ProjectConfigSchema.partial().optional(),
  global_routing_rules: z.array(RoutingRuleSchema).optional(),
  shared_meta_agents: z.record(z.string(), MetaAgentSchema).optional(),
});

/**
 * Portfolio Configuration Schema
 * Portfolio-level settings for cross-project orchestration
 */
export const PortfolioConfigSchema = z.object({
  // Enable cross-project analytics aggregation
  enable_aggregation: z.boolean().default(true),
  enable_cross_project_delegation: z.boolean().default(true),
  agent_namespace_format: z.string().default("{project_id}:{agent_name}"),
  default_project_id: z.string().optional(),
  max_cross_project_depth: z.number().int().positive().default(5),
  aggregation_settings: z
    .object({
      // Minimum confidence threshold for portfolio-wide metrics
      min_confidence_threshold: z.number().min(0).max(1).default(0.8),
      aggregation_window_days: z.number().int().positive().default(30),
      include_project_anonymization: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Project Registry Configuration Schema
 * Top-level schema for managing multiple project configurations
 */
export const ProjectRegistryConfigSchema = z.object({
  // Portfolio-wide settings
  portfolio: PortfolioConfigSchema.optional(),
  shared_config: SharedConfigSchema.optional(),
  projects: z.record(z.string(), ProjectConfigSchema).default({}),
  registry: z
    .object({
      // Registry version
      version: z.string().default("1.0.0"),
      registry_id: z.string().optional(),
      created_at: z.string().optional(),
      // Timestamp when registry was last updated
      updated_at: z.string().optional(),
    })
    .optional(),
});

/**
 * Inferred TypeScript types from schemas
 */

export type KeywordMatcher = z.infer<typeof KeywordMatcherSchema>;
export type ComplexityMatcher = z.infer<typeof ComplexityMatcherSchema>;
export type RegexMatcher = z.infer<typeof RegexMatcherSchema>;
export type ProjectContextMatcher = z.infer<typeof ProjectContextMatcherSchema>;
export type AlwaysMatcher = z.infer<typeof AlwaysMatcherSchema>;
export type Matcher = z.infer<typeof MatcherSchema>;

export type RoutingRule = z.infer<typeof RoutingRuleSchema>;
export type MetaAgentDef = z.infer<typeof MetaAgentSchema>;
export type AgentOverride = z.infer<typeof AgentOverrideSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type RoutingAnalyticsConfig = z.infer<typeof RoutingAnalyticsConfigSchema>;
export type RoutingLoggerConfig = z.infer<typeof RoutingLoggerConfigSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

export type ProjectOverride = z.infer<typeof ProjectOverrideSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type SharedConfig = z.infer<typeof SharedConfigSchema>;
export type PortfolioConfig = z.infer<typeof PortfolioConfigSchema>;
export type ProjectRegistryConfig = z.infer<typeof ProjectRegistryConfigSchema>;

export type OlimpusConfig = z.infer<typeof OlimpusConfigSchema>;
