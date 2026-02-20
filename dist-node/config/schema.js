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
var ProjectOverrideSchema = z.object({
  // Meta-agent overrides
  meta_agents: z.record(z.string(), MetaAgentSchema.partial()).optional(),
  // Provider configuration overrides
  providers: ProviderConfigSchema.partial().optional(),
  // Settings overrides
  settings: SettingsSchema.partial().optional(),
  // Agent overrides (passthrough for oh-my-opencode compatibility)
  agents: AgentOverridesSchema.optional(),
  // Category overrides
  categories: CategoriesSchema.optional(),
  // Skills overrides
  skills: z.array(z.string()).optional()
});
var ProjectConfigSchema = z.object({
  // Unique project identifier
  project_id: z.string().min(1),
  // Optional project display name
  name: z.string().optional(),
  // Path to the project directory
  path: z.string().optional(),
  // Project-specific overrides
  overrides: ProjectOverrideSchema.optional(),
  // Project metadata
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
  // Default project configuration template
  default_project: ProjectConfigSchema.partial().optional(),
  // Global routing rules that apply to all projects
  global_routing_rules: z.array(RoutingRuleSchema).optional(),
  // Shared meta-agents available to all projects
  shared_meta_agents: z.record(z.string(), MetaAgentSchema).optional()
});
var PortfolioConfigSchema = z.object({
  // Enable cross-project analytics aggregation
  enable_aggregation: z.boolean().default(true),
  // Enable cross-project agent delegation
  enable_cross_project_delegation: z.boolean().default(true),
  // Agent namespace format for cross-project delegation
  agent_namespace_format: z.string().default("{project_id}:{agent_name}"),
  // Default project to use when no project is specified
  default_project_id: z.string().optional(),
  // Maximum delegation depth across projects
  max_cross_project_depth: z.number().int().positive().default(5),
  // Analytics aggregation settings
  aggregation_settings: z.object({
    // Minimum confidence threshold for portfolio-wide metrics
    min_confidence_threshold: z.number().min(0).max(1).default(0.8),
    // Window for rolling aggregation (in days)
    aggregation_window_days: z.number().int().positive().default(30),
    // Include anonymized project-level data in portfolio stats
    include_project_anonymization: z.boolean().default(true)
  }).optional()
});
var ProjectRegistryConfigSchema = z.object({
  // Portfolio-wide settings
  portfolio: PortfolioConfigSchema.optional(),
  // Shared configurations available to all projects
  shared_config: SharedConfigSchema.optional(),
  // Individual project configurations
  projects: z.record(z.string(), ProjectConfigSchema).default({}),
  // Registry metadata
  registry: z.object({
    // Registry version
    version: z.string().default("1.0.0"),
    // Registry identifier
    registry_id: z.string().optional(),
    // Timestamp when registry was created
    created_at: z.string().optional(),
    // Timestamp when registry was last updated
    updated_at: z.string().optional()
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
export {
  AgentOverrideSchema,
  AgentOverridesSchema,
  AlwaysMatcherSchema,
  AnalyticsConfigSchema,
  CategoriesSchema,
  CategoryConfigSchema,
  ComplexityMatcherSchema,
  KeywordMatcherSchema,
  MatcherSchema,
  MetaAgentSchema,
  OlimpusConfigSchema,
  PortfolioConfigSchema,
  ProjectConfigSchema,
  ProjectContextMatcherSchema,
  ProjectOverrideSchema,
  ProjectRegistryConfigSchema,
  ProviderConfigSchema,
  RegexMatcherSchema,
  RoutingAnalyticsConfigSchema,
  RoutingLoggerConfigSchema,
  RoutingRuleSchema,
  SettingsSchema,
  SharedConfigSchema
};
//# sourceMappingURL=schema.js.map
