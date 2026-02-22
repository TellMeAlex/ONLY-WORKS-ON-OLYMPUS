/**
 * TypeScript types matching Olimpus config schema
 * These types correspond to the schemas defined in src/config/schema.ts
 */
/**
 * Builtin agent names that can be delegation targets
 */
export type BuiltinAgentName = "sisyphus" | "hephaestus" | "oracle" | "librarian" | "explore" | "multimodal-looker" | "metis" | "momus" | "atlas" | "prometheus";
/**
 * Matcher Types - Discriminated Union
 */
export type KeywordMatcher = {
    type: "keyword";
    keywords: string[];
    mode: "any" | "all";
};
export type ComplexityMatcher = {
    type: "complexity";
    threshold: "low" | "medium" | "high";
};
export type RegexMatcher = {
    type: "regex";
    pattern: string;
    flags?: string;
};
export type ProjectContextMatcher = {
    type: "project_context";
    has_files?: string[];
    has_deps?: string[];
};
export type AlwaysMatcher = {
    type: "always";
};
export type Matcher = KeywordMatcher | ComplexityMatcher | RegexMatcher | ProjectContextMatcher | AlwaysMatcher;
/**
 * Routing Rule
 */
export type ConfigOverrides = {
    model?: string;
    temperature?: number;
    prompt?: string;
    variant?: string;
};
export type RoutingRule = {
    matcher: Matcher;
    target_agent: string;
    config_overrides?: ConfigOverrides;
};
/**
 * Meta-Agent Definition
 */
export type MetaAgentDef = {
    base_model: string;
    delegates_to: string[];
    routing_rules: RoutingRule[];
    prompt_template?: string;
    temperature?: number;
};
/**
 * Agent Overrides (passthrough for oh-my-opencode compatibility)
 * Simplified version supporting core fields only
 */
export type AgentOverride = {
    model?: string;
    variant?: string;
    temperature?: number;
    prompt?: string;
    skills?: string[];
    disable?: boolean;
    description?: string;
};
/**
 * Category Config (passthrough for oh-my-opencode compatibility)
 * Simplified version supporting core fields only
 */
export type CategoryConfig = {
    description?: string;
    model?: string;
    variant?: string;
    temperature?: number;
    maxTokens?: number;
};
/**
 * Provider Configuration
 */
export type ProviderConfig = {
    priority_chain?: string[];
    research_providers?: string[];
    strategy_providers?: string[];
    config?: Record<string, Record<string, string | boolean | number>>;
};
/**
 * Routing Logger Configuration
 */
export type RoutingLoggerConfig = {
    enabled?: boolean;
    output?: "console" | "file" | "disabled";
    log_file?: string;
    debug_mode?: boolean;
};
/**
 * Background Parallelization Settings
 */
export type BackgroundParallelization = {
    enabled?: boolean;
    max_parallel_tasks?: number;
    timeout_ms?: number;
};
/**
 * Adaptive Model Selection Settings
 */
export type AdaptiveModelSelection = {
    enabled?: boolean;
    research_model?: string;
    strategy_model?: string;
    default_model?: string;
};
/**
 * Olimpus Settings (Extended with oh-my-opencode integration)
 */
export type Settings = {
    namespace_prefix?: string;
    max_delegation_depth?: number;
    background_parallelization?: BackgroundParallelization;
    adaptive_model_selection?: AdaptiveModelSelection;
    ultrawork_enabled?: boolean;
    todo_continuation?: boolean;
    verify_before_completion?: boolean;
    lsp_refactoring_preferred?: boolean;
    aggressive_comment_pruning?: boolean;
    routing_logger?: RoutingLoggerConfig;
};
/**
 * Olimpus Config - Top Level
 */
export type OlimpusConfig = {
    meta_agents?: Record<string, MetaAgentDef>;
    providers?: ProviderConfig;
    settings?: Settings;
    skills?: string[];
    agents?: Record<string, AgentOverride>;
    categories?: Record<string, CategoryConfig>;
    disabled_hooks?: string[];
};
//# sourceMappingURL=types.d.ts.map