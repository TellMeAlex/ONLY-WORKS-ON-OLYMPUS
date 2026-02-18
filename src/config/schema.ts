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
  target_agent: z.enum(BUILTIN_AGENT_NAMES),
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
  delegates_to: z.array(z.enum(BUILTIN_AGENT_NAMES)).min(1),
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
  routing_logger: z
    .object({
      enabled: z.boolean().optional(),
      output: z.enum(["console", "file", "disabled"]).optional(),
      log_file: z.string().optional(),
      debug_mode: z.boolean().optional(),
    })
    .optional(),
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
export type Settings = z.infer<typeof SettingsSchema>;

export type OlimpusConfig = z.infer<typeof OlimpusConfigSchema>;
