import { z } from "zod";

/**
 * Stability levels for API surfaces.
 *
 * @since 0.4.0
 * @stable
 *
 * These levels communicate the maturity and stability guarantees for each API:
 *
 * - **stable**: Production-ready with long-term backward compatibility guarantees
 * - **experimental**: Under active development, may change without notice
 * - **deprecated**: Scheduled for removal in a future version
 * - **internal**: Not intended for external use
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for full policy details
 */
export type StabilityLevel = "stable" | "experimental" | "deprecated" | "internal";

/**
 * Builtin agent names that can be delegation targets.
 *
 * @since 0.1.0
 * @internal
 * Not intended for external use.
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

/**
 * Zod schema for keyword-based matcher configuration.
 *
 * Matches when any or all specified keywords are found in the task description.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const matcher: KeywordMatcher = {
 *   type: "keyword",
 *   keywords: ["bug", "fix", "debug"],
 *   mode: "any"
 * };
 * ```
 */
export const KeywordMatcherSchema = z.object({
  type: z.literal("keyword"),
  keywords: z.array(z.string()).min(1),
  mode: z.enum(["any", "all"]),
});

/**
 * Zod schema for complexity-based matcher configuration.
 *
 * Matches tasks based on estimated complexity level.
 *
 * @since 0.2.0
 * @stable
 *
 * @example
 * ```ts
 * const matcher: ComplexityMatcher = {
 *   type: "complexity",
 *   threshold: "high"
 * };
 * ```
 */
export const ComplexityMatcherSchema = z.object({
  type: z.literal("complexity"),
  threshold: z.enum(["low", "medium", "high"]),
});

/**
 * Zod schema for regex-based matcher configuration.
 *
 * Matches tasks using a regular expression pattern.
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const matcher: RegexMatcher = {
 *   type: "regex",
 *   pattern: "\\b(bug|fix|error)\\b",
 *   flags: "i"
 * };
 * ```
 */
export const RegexMatcherSchema = z.object({
  type: z.literal("regex"),
  pattern: z.string().min(1),
  flags: z.string().optional(),
});

/**
 * Zod schema for project context-based matcher configuration.
 *
 * Matches tasks based on project structure (files and dependencies).
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const matcher: ProjectContextMatcher = {
 *   type: "project_context",
 *   has_files: ["package.json", "tsconfig.json"]
 * };
 * ```
 */
export const ProjectContextMatcherSchema = z.object({
  type: z.literal("project_context"),
  has_files: z.array(z.string()).optional(),
  has_deps: z.array(z.string()).optional(),
});

/**
 * Zod schema for always-match matcher configuration.
 *
 * Always matches regardless of task content.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const matcher: AlwaysMatcher = {
 *   type: "always"
 * };
 * ```
 */
export const AlwaysMatcherSchema = z.object({
  type: z.literal("always"),
});

/**
 * Zod schema for matcher discriminated union.
 *
 * @since 0.1.0
 * @stable
 *
 * Combines all matcher types into a single discriminated union based on the `type` field.
 */
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

/**
 * Zod schema for routing rule configuration.
 *
 * Defines when and how tasks should be routed to specific agents.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const rule: RoutingRule = {
 *   matcher: { type: "always" },
 *   target_agent: "oracle",
 *   config_overrides: {
 *     model: "claude-3-5-sonnet-20241022",
 *     temperature: 0.7
 *   }
 * };
 * ```
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

/**
 * Zod schema for meta-agent definition.
 *
 * Defines a meta-agent that delegates to specialized sub-agents based on routing rules.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const metaAgent: MetaAgentDef = {
 *   base_model: "claude-3-5-sonnet-20241022",
 *   delegates_to: ["oracle", "hephaestus", "metis"],
 *   routing_rules: [
 *     {
 *       matcher: { type: "always" },
 *       target_agent: "oracle"
 *     }
 *   ],
 *   temperature: 0.7
 * };
 * ```
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

/**
 * Zod schema for agent configuration overrides.
 *
 * Allows overriding agent-specific settings from oh-my-opencode configuration.
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const override: AgentOverride = {
 *   model: "claude-3-5-sonnet-20241022",
 *   variant: "coding",
 *   temperature: 0.7,
 *   skills: ["typescript", "testing"]
 * };
 * ```
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

/**
 * Zod schema for agent overrides mapping.
 *
 * @since 0.3.0
 * @stable
 */
export const AgentOverridesSchema = z
  .record(z.string(), AgentOverrideSchema)
  .optional();

/**
 * Category Config Schema (passthrough for oh-my-opencode compatibility)
 * Simplified version supporting core fields only
 */

/**
 * Zod schema for category configuration.
 *
 * Defines configuration for task categories in oh-my-opencode.
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const categoryConfig: CategoryConfig = {
 *   description: "Code refactoring tasks",
 *   model: "claude-3-5-sonnet-20241022",
 *   variant: "refactoring",
 *   temperature: 0.5,
 *   maxTokens: 4000
 * };
 * ```
 */
export const CategoryConfigSchema = z.object({
  description: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

/**
 * Zod schema for category configuration mapping.
 *
 * @since 0.3.0
 * @stable
 */
export const CategoriesSchema = z
  .record(z.string(), CategoryConfigSchema)
  .optional();

/**
 * Provider Configuration Schema
 */

/**
 * Zod schema for provider configuration.
 *
 * Defines provider priorities and settings for different operation types.
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const providerConfig: ProviderConfig = {
 *   priority_chain: ["anthropic", "openai", "google"],
 *   research_providers: ["anthropic"],
 *   strategy_providers: ["anthropic", "openai"],
 *   config: {
 *     anthropic: {
 *       apiKey: "sk-...",
 *       baseURL: "https://api.anthropic.com"
 *     }
 *   }
 * };
 * ```
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

/**
 * Zod schema for routing analytics configuration.
 *
 * @since 0.3.0
 * @experimental
 *
 * Storage and retention settings for routing decision analytics.
 * Subject to change as the analytics system evolves.
 *
 * @see {@link RoutingLoggerConfigSchema} for the parent schema
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

/**
 * Zod schema for routing logger configuration.
 *
 * Controls how routing decisions are logged and stored.
 *
 * @since 0.3.0
 * @stable
 *
 * @example
 * ```ts
 * const loggerConfig: RoutingLoggerConfig = {
 *   enabled: true,
 *   output: "file",
 *   log_file: "routing.log",
 *   debug_mode: false,
 *   analytics_config: {
 *     enabled: true,
 *     storage_file: "analytics.json"
 *   }
 * };
 * ```
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

/**
 * Zod schema for general analytics configuration.
 *
 * Comprehensive analytics settings for tracking routing, execution, and usage metrics.
 *
 * @since 0.4.0
 * @experimental
 *
 * Subject to change as the analytics system evolves. Features may be added, removed, or changed.
 *
 * @example
 * ```ts
 * const analyticsConfig: AnalyticsConfig = {
 *   enabled: true,
 *   storage: {
 *     type: "file",
 *     path: "analytics.json",
 *     retention_days: 90
 *   },
 *   metrics: {
 *     track_routing_decisions: true,
 *     track_execution_time: true,
 *     track_agent_usage: true,
 *     track_model_costs: true,
 *   },
 *   aggregation: {
 *     enabled: true,
 *     window_minutes: 60
 *   }
 * };
 * ```
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

/**
 * Zod schema for Olimpus general settings.
 *
 * Global configuration settings that control Olimpus behavior.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const settings: Settings = {
 *   namespace_prefix: "olimpus",
 *   max_delegation_depth: 3,
 *   background_parallelization: {
 *     enabled: true,
 *     max_parallel_tasks: 4
 *   },
 *   routing_logger: {
 *     enabled: true,
 *     output: "file"
 *   }
 * };
 * ```
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

/**
 * Zod schema for complete Olimpus configuration.
 *
 * Top-level configuration schema combining all Olimpus-specific and oh-my-opencode settings.
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const config: OlimpusConfig = {
 *   meta_agents: {
 *     default: {
 *       base_model: "claude-3-5-sonnet-20241022",
 *       delegates_to: ["oracle"],
 *       routing_rules: [{
 *         matcher: { type: "always" },
 *         target_agent: "oracle"
 *       }]
 *     }
 *   },
 *   providers: {
 *     priority_chain: ["anthropic"]
 *   },
 *   settings: {
 *     namespace_prefix: "olimpus",
 *     max_delegation_depth: 3
 *   },
 *   agents: {},
 *   categories: {}
 * };
 * ```
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
 * Inferred TypeScript types from schemas
 */

/**
 * Type for keyword-based matcher configuration.
 *
 * @since 0.1.0
 * @stable
 */
export type KeywordMatcher = z.infer<typeof KeywordMatcherSchema>;

/**
 * Type for complexity-based matcher configuration.
 *
 * @since 0.2.0
 * @stable
 */
export type ComplexityMatcher = z.infer<typeof ComplexityMatcherSchema>;

/**
 * Type for regex-based matcher configuration.
 *
 * @since 0.3.0
 * @stable
 */
export type RegexMatcher = z.infer<typeof RegexMatcherSchema>;

/**
 * Type for project context-based matcher configuration.
 *
 * @since 0.3.0
 * @stable
 */
export type ProjectContextMatcher = z.infer<typeof ProjectContextMatcherSchema>;

/**
 * Type for always-match matcher configuration.
 *
 * @since 0.1.0
 * @stable
 */
export type AlwaysMatcher = z.infer<typeof AlwaysMatcherSchema>;

/**
 * Union type for all matcher configurations.
 *
 * @since 0.1.0
 * @stable
 */
export type Matcher = z.infer<typeof MatcherSchema>;

/**
 * Type for routing rule configuration.
 *
 * @since 0.1.0
 * @stable
 */
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;

/**
 * Type for meta-agent definition.
 *
 * @since 0.1.0
 * @stable
 */
export type MetaAgentDef = z.infer<typeof MetaAgentSchema>;

/**
 * Type for agent configuration overrides.
 *
 * @since 0.3.0
 * @stable
 */
export type AgentOverride = z.infer<typeof AgentOverrideSchema>;

/**
 * Type for category configuration.
 *
 * @since 0.3.0
 * @stable
 */
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;

/**
 * Type for provider configuration.
 *
 * @since 0.3.0
 * @stable
 */
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Type for routing analytics configuration.
 *
 * @since 0.3.0
 * @experimental
 */
export type RoutingAnalyticsConfig = z.infer<typeof RoutingAnalyticsConfigSchema>;

/**
 * Type for routing logger configuration.
 *
 * @since 0.3.0
 * @stable
 */
export type RoutingLoggerConfig = z.infer<typeof RoutingLoggerConfigSchema>;

/**
 * Type for general analytics configuration.
 *
 * @since 0.4.0
 * @experimental
 */
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;

/**
 * Type for Olimpus settings.
 *
 * @since 0.1.0
 * @stable
 */
export type Settings = z.infer<typeof SettingsSchema>;

/**
 * Type for complete Olimpus configuration.
 *
 * @since 0.1.0
 * @stable
 */
export type OlimpusConfig = z.infer<typeof OlimpusConfigSchema>;
