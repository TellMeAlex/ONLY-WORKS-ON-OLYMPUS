/**
 * Default Olimpus Plugin Configuration Template
 *
 * This file provides the default configuration structure for the Olimpus meta-orchestrator.
 * Based on example/olimpus.jsonc
 *
 * PHILOSOPHY (Oh-My-OpenCode Integration):
 * • Intelligent routing: No manual agent selection—let matchers decide
 * • Background parallelization: Fire researchers while builders work
 * • Multi-model optimization: Use cheap models for search, expensive for decisions
 * • Relentless execution: Tasks don't end halfway (todo_continuation=true)
 * • Specialized workers: sisyphus, oracle, librarian, explore, metis, momus, atlas, prometheus
 *
 * META-AGENTS defined here (atenea, hermes, hefesto, frontend_specialist) are routers
 * that intelligently delegate to the builtin oh-my-opencode agents above.
 *
 * QUICK START: Include "ulw" or "ultrawork" in your prompt to activate
 * relentless execution mode with all features enabled.
 */
export type MatcherType = 'always' | 'complexity' | 'keyword' | 'regex' | 'project_context';
export type ComplexityThreshold = 'low' | 'medium' | 'high';
export type KeywordMode = 'any' | 'all';
export interface Matcher {
    type: MatcherType;
    threshold?: ComplexityThreshold;
    keywords?: string[];
    mode?: KeywordMode;
    pattern?: string;
    flags?: string;
    has_files?: string[];
    has_deps?: string[];
}
export interface ConfigOverrides {
    prompt?: string;
    variant?: string;
    [key: string]: unknown;
}
export interface RoutingRule {
    matcher: Matcher;
    target_agent: string;
    config_overrides?: ConfigOverrides;
}
export interface MetaAgent {
    base_model: string;
    delegates_to: string[];
    temperature?: number;
    routing_rules: RoutingRule[];
}
export interface Agent {
    model: string;
    temperature: number;
    description: string;
}
export interface Category {
    description: string;
    model: string;
    temperature: number;
}
export interface ProviderConfig {
    retry_on_rate_limit?: boolean;
    [key: string]: unknown;
}
export interface Providers {
    priority_chain: string[];
    research_providers: string[];
    strategy_providers: string[];
    config?: Record<string, ProviderConfig>;
}
export interface BackgroundParallelization {
    enabled: boolean;
    max_parallel_tasks: number;
    timeout_ms: number;
}
export interface AdaptiveModelSelection {
    enabled: boolean;
    research_model: string;
    strategy_model: string;
    default_model: string;
}
export interface Settings {
    namespace_prefix: string;
    max_delegation_depth: number;
    background_parallelization: BackgroundParallelization;
    adaptive_model_selection: AdaptiveModelSelection;
    ultrawork_enabled: boolean;
    todo_continuation: boolean;
    verify_before_completion: boolean;
    lsp_refactoring_preferred: boolean;
    aggressive_comment_pruning: boolean;
}
export interface OlimpusConfig {
    $schema: string;
    meta_agents: Record<string, MetaAgent>;
    agents: Record<string, Agent>;
    categories: Record<string, Category>;
    providers: Providers;
    settings: Settings;
    skills: string[];
    disabled_hooks: string[];
}
declare const defaultConfig: OlimpusConfig;
export default defaultConfig;
//# sourceMappingURL=default-config.d.ts.map