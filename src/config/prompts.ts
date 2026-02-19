/**
 * Project types supported by the wizard
 * Each type maps to different default configurations
 */
export const PROJECT_TYPES = [
  {
    id: "web",
    name: "Web Application",
    description: "Frontend web app (React, Vue, Svelte, etc.)",
    icon: "🌐",
  },
  {
    id: "backend",
    name: "Backend API",
    description: "REST/GraphQL API server",
    icon: "⚙️",
  },
  {
    id: "fullstack",
    name: "Full Stack",
    description: "Both frontend and backend",
    icon: "🔗",
  },
  {
    id: "cli",
    name: "CLI Tool",
    description: "Command-line application",
    icon: "💻",
  },
  {
    id: "library",
    name: "Library/Package",
    description: "Reusable code library",
    icon: "📦",
  },
  {
    id: "other",
    name: "Other",
    description: "Something else or mixed",
    icon: "🔧",
  },
] as const;

/**
 * Programming language options
 */
export const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C#",
  "Other",
] as const;

/**
 * Meta-agent presets with descriptions
 * Users can select which meta-agents to enable
 */
export const META_AGENT_PRESETS = [
  {
    id: "atenea",
    name: "Atenea",
    description: "Strategic planning & architecture analysis",
    enabled_by_default: true,
  },
  {
    id: "hermes",
    name: "Hermes",
    description: "Communication & research",
    enabled_by_default: true,
  },
  {
    id: "hefesto",
    name: "Hefesto",
    description: "Implementation & building",
    enabled_by_default: true,
  },
  {
    id: "frontend_specialist",
    name: "Frontend Specialist",
    description: "UI components & frontend tasks",
    enabled_by_default: false,
  },
] as const;

/**
 * Provider model options
 * Common model names for user selection
 */
export const PROVIDER_MODELS = [
  {
    id: "claude-opus-4-20250205",
    provider: "anthropic",
    name: "Claude Opus 4.6",
    description: "Most capable model, excellent for complex reasoning and coding (Feb 2026)",
  },
  {
    id: "claude-sonnet-4-20250217",
    provider: "anthropic",
    name: "Claude Sonnet 4.6",
    description: "Best balance of speed and intelligence, 1M tokens, default for Pro (Feb 2026)",
  },
  {
    id: "claude-haiku-4-20251022",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    description: "Fast and cost-effective for research and simple tasks",
  },
  {
    id: "claude-opus-4-20241105",
    provider: "anthropic",
    name: "Claude Opus 4.5",
    description: "Previous generation Opus, excellent for coding and agents",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    name: "Claude 3.5 Sonnet (Legacy)",
    description: "Legacy model, still stable for backward compatibility",
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    name: "GPT 5.2",
    description: "OpenAI's flagship model",
  },
  {
    id: "gemini-3-pro",
    provider: "google",
    name: "Gemini 3 Pro",
    description: "Google's advanced model",
  },
] as const;

/**
 * Setting presets with descriptions
 * Users can enable/disable key Olimpus features
 */
export const SETTING_PRESETS = [
  {
    key: "background_parallelization",
    name: "Background Parallelization",
    description:
      "Run research tasks in background while main agent executes",
    enabled_by_default: true,
  },
  {
    key: "adaptive_model_selection",
    name: "Adaptive Model Selection",
    description: "Use cheap models for research, expensive for decisions",
    enabled_by_default: true,
  },
  {
    key: "ultrawork_enabled",
    name: "Ultrawork Mode",
    description:
      "Relentless execution - tasks don't stop halfway",
    enabled_by_default: true,
  },
  {
    key: "todo_continuation",
    name: "Todo Continuation",
    description: "Continue if agent stops mid-task",
    enabled_by_default: true,
  },
  {
    key: "verify_before_completion",
    name: "Verify Before Completion",
    description: "Double-check work before declaring done",
    enabled_by_default: true,
  },
  {
    key: "lsp_refactoring_preferred",
    name: "LSP Refactoring",
    description: "Use AST-based refactoring (no string replacement)",
    enabled_by_default: true,
  },
  {
    key: "aggressive_comment_pruning",
    name: "Comment Pruning",
    description: "Remove verbose AI-generated comments",
    enabled_by_default: true,
  },
] as const;

/**
 * Wizard prompt definitions
 * Each prompt has an ID, question text, and optional help text
 */
export const WIZARD_PROMPTS = {
  /**
   * Welcome message and introduction
   */
  welcome: {
    id: "welcome",
    message: `
╔══════════════════════════════════════════════════════════════════╗
║              Welcome to Olimpus Setup Wizard                     ║
╚══════════════════════════════════════════════════════════════════╝

This wizard will help you create your first Olimpus configuration.

Olimpus is an intelligent meta-orchestrator that routes your tasks
to specialized agents based on context and complexity.

You can run this wizard anytime by running: opencode olimpus init

Press Enter to continue...
`,
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
      description: t.description,
    })),
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
      label: l,
    })),
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
      default: m.enabled_by_default,
    })),
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
      description: m.description,
    })),
  },

  /**
   * Research model selection
   */
  research_model: {
    id: "research_model",
    question: "Select your research model (background tasks)",
    help: "Faster/cheaper model for search and documentation lookups",
    options: PROVIDER_MODELS.filter((m) =>
      m.id.includes("haiku") || m.id.includes("turbo") || m.id.includes("flash"),
    ).map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description,
    })),
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
      default: s.enabled_by_default,
    })),
  },

  /**
   * Skills path (optional)
   */
  skills_path: {
    id: "skills_path",
    message: "Path to custom skills directory (optional, leave empty to skip)",
    default: "",
  },

  /**
   * Configuration summary
   */
  summary: {
    id: "summary",
    message: (answers: WizardAnswers) => `
╔══════════════════════════════════════════════════════════════════╗
║                    Configuration Summary                         ║
╚══════════════════════════════════════════════════════════════════╝

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
`,
  },

  /**
   * Success message
   */
  success: {
    id: "success",
    message: (path: string) => `
✅ Configuration created successfully at:
   ${path}

You can now use Olimpus! Try:
  • "ulw implement a new feature" - Ultrawork mode
  • "research API patterns" - Research mode
  • "@atenea plan architecture" - Strategic planning

Edit your config at anytime: ~/.config/opencode/olimpus.jsonc
`,
  },
} as const;

/**
 * Type for wizard answers collected from user
 */
export interface WizardAnswers {
  project_type: string;
  language: string;
  meta_agents?: string[];
  primary_model: string;
  research_model: string;
  settings?: string[];
  skills_path?: string;
}

/**
 * Type for a wizard prompt option
 */
export interface PromptOption {
  value: string;
  label: string;
  description?: string;
  default?: boolean;
}

/**
 * Type for a wizard prompt with options
 */
export interface OptionsPrompt {
  id: string;
  question: string;
  help?: string;
  options: PromptOption[];
}

/**
 * Type for a simple prompt without options
 */
export interface SimplePrompt {
  id: string;
  message: string | ((...args: unknown[]) => string);
}

/**
 * Union type for all prompt types
 */
export type WizardPrompt = OptionsPrompt | SimplePrompt;

/**
 * Inferred TypeScript types from constants
 */
export type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];
export type Language = (typeof LANGUAGES)[number];
export type MetaAgentPresetId = (typeof META_AGENT_PRESETS)[number]["id"];
export type ProviderModelId = (typeof PROVIDER_MODELS)[number]["id"];
export type SettingPresetKey = (typeof SETTING_PRESETS)[number]["key"];

/**
 * Type guard for options prompt
 */
export function isOptionsPrompt(
  prompt: WizardPrompt,
): prompt is OptionsPrompt {
  return "options" in prompt;
}

/**
 * Type guard for simple prompt
 */
export function isSimplePrompt(prompt: WizardPrompt): prompt is SimplePrompt {
  return "message" in prompt;
}

/**
 * Get project type by ID
 */
export function getProjectType(id: string): (typeof PROJECT_TYPES)[number] | undefined {
  return PROJECT_TYPES.find((t) => t.id === id);
}

/**
 * Get provider model by ID
 */
export function getProviderModel(id: string): (typeof PROVIDER_MODELS)[number] | undefined {
  return PROVIDER_MODELS.find((m) => m.id === id);
}
