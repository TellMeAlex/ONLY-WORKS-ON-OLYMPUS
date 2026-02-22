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
// ============================================================================
// SECTION 1: META_AGENTS
// ============================================================================
// Define custom meta-agents that route user requests to specialized oh-my-opencode agents.
// Each meta-agent has routing rules that determine which builtin agent to delegate to.
const metaAgents = {
    // ==========================================================================
    // Atenea - Strategic Planning & Architecture Analysis
    // ==========================================================================
    atenea: {
        base_model: 'claude-3-5-sonnet-20241022',
        delegates_to: ['oracle', 'prometheus', 'atlas', 'metis'],
        routing_rules: [
            {
                // ===== MATCHER 1: COMPLEXITY MATCHER =====
                // Routes based on prompt complexity heuristic (line count + keywords)
                matcher: {
                    type: 'complexity',
                    threshold: 'high',
                },
                target_agent: 'oracle',
                config_overrides: {
                    prompt: 'You are a strategic architecture advisor. Analyze this complex problem from first principles, considering system design patterns, scalability, maintainability, and long-term implications.',
                },
            },
            {
                matcher: {
                    type: 'complexity',
                    threshold: 'medium',
                },
                target_agent: 'prometheus',
                config_overrides: {
                    prompt: 'You are a technical strategist. Analyze this problem considering trade-offs, patterns, and best practices.',
                },
            },
            {
                // ===== MATCHER 2: ALWAYS MATCHER =====
                // Catch-all fallback (no conditions)
                matcher: {
                    type: 'always',
                },
                target_agent: 'metis',
                config_overrides: {
                    prompt: 'You are a general technical analyst. Synthesize information and provide comprehensive analysis.',
                },
            },
        ],
    },
    // ==========================================================================
    // Hermes - Communication & Research
    // ==========================================================================
    hermes: {
        base_model: 'claude-3-5-sonnet-20241022',
        delegates_to: ['librarian', 'explore', 'oracle'],
        routing_rules: [
            {
                // ===== MATCHER 3: KEYWORD MATCHER (ANY MODE) =====
                // Routes if ANY of the keywords appears in the prompt (case-insensitive)
                matcher: {
                    type: 'keyword',
                    keywords: ['docs', 'documentation', 'guide', 'search', 'lookup'],
                    mode: 'any',
                },
                target_agent: 'librarian',
                config_overrides: {
                    prompt: 'You are a research specialist. Search comprehensively for documentation and guides.',
                },
            },
            {
                // ===== MATCHER 3b: KEYWORD MATCHER (ALL MODE) =====
                // Routes if ALL keywords appear in the prompt
                matcher: {
                    type: 'keyword',
                    keywords: ['code', 'find'],
                    mode: 'all',
                },
                target_agent: 'explore',
                config_overrides: {
                    prompt: 'You are a code explorer. Find and analyze relevant code patterns.',
                },
            },
            {
                matcher: {
                    type: 'always',
                },
                target_agent: 'librarian',
            },
        ],
    },
    // ==========================================================================
    // Hefesto - Implementation & Building
    // ==========================================================================
    hefesto: {
        base_model: 'claude-3-5-sonnet-20241022',
        delegates_to: ['sisyphus', 'hephaestus'],
        temperature: 0.3,
        routing_rules: [
            {
                // ===== MATCHER 4: PROJECT_CONTEXT MATCHER =====
                // Routes based on project structure (files and dependencies present)
                matcher: {
                    type: 'project_context',
                    has_files: ['package.json'],
                    has_deps: ['vitest', 'jest', 'bun:test'],
                },
                target_agent: 'sisyphus',
                config_overrides: {
                    prompt: 'You are a TDD expert. Write tests first, then implementation.',
                    variant: 'tdd',
                },
            },
            {
                matcher: {
                    type: 'project_context',
                    has_files: ['package.json'],
                },
                target_agent: 'sisyphus',
                config_overrides: {
                    prompt: 'You are a quality-focused builder. Ensure comprehensive testing.',
                },
            },
            {
                matcher: {
                    type: 'always',
                },
                target_agent: 'hephaestus',
                config_overrides: {
                    prompt: 'You are a builder. Implement with attention to quality and best practices.',
                },
            },
        ],
    },
    // ==========================================================================
    // Custom Meta-Agent Example: Frontend Specialist
    // ==========================================================================
    frontend_specialist: {
        base_model: 'claude-3-5-sonnet-20241022',
        delegates_to: ['hephaestus', 'oracle'],
        routing_rules: [
            {
                // ===== MATCHER 5: REGEX MATCHER =====
                // Routes based on regex pattern matching against the prompt
                matcher: {
                    type: 'regex',
                    pattern: '^(design|ui|component|button|form|style)',
                    flags: 'i',
                },
                target_agent: 'hephaestus',
                config_overrides: {
                    prompt: 'You are a frontend specialist. Build responsive, accessible UI components.',
                },
            },
            {
                matcher: {
                    type: 'regex',
                    pattern: '(performance|optimization|rendering|bundle)',
                    flags: 'i',
                },
                target_agent: 'oracle',
                config_overrides: {
                    prompt: 'You are a performance expert. Analyze and optimize frontend performance.',
                },
            },
            {
                matcher: {
                    type: 'always',
                },
                target_agent: 'hephaestus',
            },
        ],
    },
};
// ============================================================================
// SECTION 2: AGENTS
// ============================================================================
// oh-my-opencode agent configuration passthrough
// Customize behavior of builtin agents like sisyphus, oracle, etc.
const agents = {
    sisyphus: {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        description: 'TDD-focused implementation agent',
    },
    oracle: {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.5,
        description: 'Strategic analysis and architecture advisor',
    },
};
// ============================================================================
// SECTION 3: CATEGORIES
// ============================================================================
// oh-my-opencode category configuration passthrough
// Group related tasks and share configuration
const categories = {
    frontend: {
        description: 'Frontend development tasks',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
    },
    backend: {
        description: 'Backend development and API tasks',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.4,
    },
    documentation: {
        description: 'Technical writing and documentation',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.2,
    },
};
// ============================================================================
// SECTION 4: PROVIDERS (NEW)
// ============================================================================
// Configure provider chains and model selection strategy
// Format: "provider/model-name" (e.g., "anthropic/claude-opus-4-6", "openai/gpt-5.2")
// Follows oh-my-opencode conventions: run "opencode models" to see available models
const providers = {
    // Global provider priority chain (fallback strategy)
    // System tries providers in order until one is available
    priority_chain: [
        'anthropic/claude-opus-4-6',
        'openai/gpt-5.2',
        'google/gemini-3-pro',
    ],
    // Research/background tasks: Use cheap models for cost efficiency
    research_providers: [
        'anthropic/claude-haiku-4-5',
        'openai/gpt-4-turbo',
        'google/gemini-1.5-flash',
    ],
    // Strategy/decisions: Use expensive models for quality
    strategy_providers: [
        'anthropic/claude-opus-4-6',
        'openai/gpt-5.2',
        'google/gemini-3-pro',
    ],
    // Optional: Per-provider configuration
    config: {
        anthropic: { retry_on_rate_limit: true },
        openai: { retry_on_rate_limit: true },
        google: { retry_on_rate_limit: true },
    },
};
// ============================================================================
// SECTION 5: SETTINGS (Extended)
// ============================================================================
// Olimpus-specific configuration
const settings = {
    // Namespace prefix for bundled skills (default: "olimpus")
    // Skills loaded via loadOlimpusSkills() are prefixed with this name
    namespace_prefix: 'olimpus',
    // Maximum delegation depth to prevent infinite chains
    // If A → B → C → A, and depth=3, the cycle is detected
    max_delegation_depth: 3,
    // ========================================================================
    // EXTENSION: Oh-My-OpenCode Integration
    // ========================================================================
    // These settings enable background parallelization and multi-model orchestration
    // following oh-my-opencode philosophy. They're optional but recommended.
    // Enable background task parallelization
    // While main agent executes, fire background researchers in parallel
    background_parallelization: {
        enabled: true,
        max_parallel_tasks: 3,
        timeout_ms: 30000,
    },
    // Multi-model optimization: Use different models for different tasks
    // Routes cheaper models (Haiku) to research/search, expensive (Opus) to decisions
    adaptive_model_selection: {
        enabled: true,
        research_model: 'claude-haiku-4-5',
        strategy_model: 'claude-opus-4-6',
        default_model: 'claude-3-5-sonnet-20241022',
    },
    // Enable relentless execution mode
    // When "ultrawork" or "ulw" is in prompt, tasks don't stop halfway
    ultrawork_enabled: true,
    todo_continuation: true,
    verify_before_completion: true,
    // LSP/AST surgical refactoring (no string replacement)
    lsp_refactoring_preferred: true,
    aggressive_comment_pruning: true,
};
// ============================================================================
// SECTION 6: SKILLS
// ============================================================================
// Array of paths to skill definition files
// Skills are loaded from your project and bundled with the plugin
// Path is relative to project directory or absolute
const skills = [
    // Example 1: Load from project docs
    'docs/skills/custom-skill.md',
    // Example 2: Absolute path
    '/Users/yourname/shared-skills/advanced-refactoring.md',
    // Skills will be prefixed with "olimpus:" (e.g., "olimpus:custom-skill")
    // This prevents naming conflicts with oh-my-opencode builtin skills
];
// ============================================================================
// SECTION 7: DISABLED_HOOKS (Optional)
// ============================================================================
// oh-my-opencode hook names to disable
// These are passed through to oh-my-opencode plugin system
const disabledHooks = [];
// ============================================================================
// Default Configuration Export
// ============================================================================
const defaultConfig = {
    $schema: 'https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json',
    meta_agents: metaAgents,
    agents,
    categories,
    providers,
    settings,
    skills,
    disabled_hooks,
};
export default defaultConfig;
//# sourceMappingURL=default-config.js.map